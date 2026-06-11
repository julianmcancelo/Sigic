/**
 * Rutas de Gestión de Graduados (SiGIC) - Versión PostgreSQL
 * Con historial de OTP, logs de auditoría y flujo de trabajo completo.
 */

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const GestorOTP = require('@jcancelo/gestor-otp-passwordless');
const db = require('../db');
const {
  enviarCorreo,
  generarPlantillaInvitacion,
  generarPlantillaOTP
} = require('../servicios/email');
const tokens = require('../servicios/tokens');
const { crearLimitador } = require('../middleware/limitador');
const {
  requiereRol,
  requierePersonalOEgresado,
  ROLES_GESTION,
  ROLES_LECTURA,
} = require('../middleware/autenticacion');

const router = Router();

// Límites anti-abuso del flujo OTP (por IP)
const limitadorSolicitudOTP = crearLimitador({
  ventanaMs: 10 * 60 * 1000,
  maximo: 5,
  mensaje: 'Demasiadas solicitudes de código. Esperá unos minutos antes de pedir otro.',
});
const limitadorVerificacionOTP = crearLimitador({
  ventanaMs: 10 * 60 * 1000,
  maximo: 15,
  mensaje: 'Demasiados intentos de verificación. Esperá unos minutos.',
});

// Duración del token de sesión del egresado (4 horas)
const VIDA_SESION_EGRESADO = 4 * 60 * 60;

function emitirSesionEgresado(graduado) {
  return tokens.firmar(
    { tipo: 'egresado', id: graduado.id, nombre: graduado.nombre },
    VIDA_SESION_EGRESADO
  );
}

/**
 * GET /api/egresados (Filtrado por Hábitat Activo)
 * Devuelve graduados con información de flujo de trabajo:
 * - cantidad_invitados: total de invitados registrados
 * - cantidad_entregadores: total de entregadores asignados
 * - invitacion_enviada: true si tiene correo y token
 * - estado_flujo: estado calculado del flujo de trabajo
 */
router.get('/', requiereRol(...ROLES_LECTURA), async (req, res) => {
  try {
    const query = `
      SELECT
        e.*,
        COALESCE(inv.cantidad_invitados, 0) AS cantidad_invitados,
        COALESCE(ent.cantidad_entregadores, 0) AS cantidad_entregadores
      FROM egresados e
      JOIN ceremonias c ON e.ceremonia_id = c.id
      LEFT JOIN (
        SELECT egresado_id, COUNT(*) AS cantidad_invitados
        FROM invitados
        GROUP BY egresado_id
      ) inv ON inv.egresado_id = e.id
      LEFT JOIN (
        SELECT egresado_id, COUNT(*) AS cantidad_entregadores
        FROM entregadores
        GROUP BY egresado_id
      ) ent ON ent.egresado_id = e.id
      WHERE c.activa = 1
      ORDER BY e.creado_en DESC
    `;
    const resultado = await db.query(query);

    // Calculo el estado de flujo para cada graduado
    const graduados = resultado.rows.map(graduado => {
      const cantidadInvitados = parseInt(graduado.cantidad_invitados, 10) || 0;
      const cantidadEntregadores = parseInt(graduado.cantidad_entregadores, 10) || 0;
      const tieneCorreo = graduado.correo && graduado.correo.trim() !== '';
      const tieneToken = graduado.token && graduado.token.trim() !== '';
      const invitacionEnviada = tieneCorreo && tieneToken;

      let estadoFlujo = 'SIN_INVITAR';

      if (graduado.estado === 'RECHAZADO') {
        estadoFlujo = 'RECHAZADO';
      } else if (!tieneCorreo || !tieneToken) {
        estadoFlujo = 'SIN_INVITAR';
      } else if (graduado.estado === 'PENDIENTE') {
        estadoFlujo = 'PENDIENTE';
      } else if (graduado.estado === 'ACEPTADO' && (cantidadInvitados === 0 || cantidadEntregadores === 0)) {
        estadoFlujo = 'CARGA_INCOMPLETA';
      } else if (graduado.estado === 'ACEPTADO' && cantidadInvitados > 0 && cantidadEntregadores > 0) {
        estadoFlujo = 'COMPLETO';
      }

      return {
        ...graduado,
        cantidad_invitados: cantidadInvitados,
        cantidad_entregadores: cantidadEntregadores,
        invitacion_enviada: invitacionEnviada,
        estado_flujo: estadoFlujo
      };
    });

    res.json(graduados);
  } catch (error) {
    console.error('Error al recuperar graduados del hábitat activo:', error);
    res.status(500).json({ error: 'Error al recuperar graduados del hábitat activo' });
  }
});

/**
 * POST /api/egresados (Asignación automática de Hábitat)
 * Verifica inhabilitados antes de registrar.
 */
router.post('/', requiereRol(...ROLES_GESTION), async (req, res) => {
  const { nombre, legajo, dni, correo, carrera, anio_inscripcion, promedio } = req.body;

  if (!nombre || !legajo || !dni) {
    return res.status(400).json({ error: 'Nombre, Legajo y DNI son obligatorios' });
  }

  // Validación de formato de DNI (7 u 8 dígitos numéricos)
  const dniStr = dni.toString().trim();
  if (!/^\d{7,8}$/.test(dniStr)) {
    return res.status(400).json({ error: 'El DNI debe contener 7 u 8 dígitos numéricos' });
  }

  // Validación de formato de correo (opcional, pero si está debe ser válido)
  const correoStr = correo ? correo.trim() : null;
  if (correoStr && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoStr)) {
    return res.status(400).json({ error: 'El correo electrónico no tiene un formato válido' });
  }

  try {
    // 1. Verifico si el graduado está inhabilitado por rechazo previo
    const inhabilitadoRes = await db.query(
      `SELECT id FROM egresados WHERE dni = $1 AND estado = 'RECHAZADO'`,
      [dni.trim()]
    );
    if (inhabilitadoRes.rowCount > 0) {
      return res.status(409).json({
        error: 'Este graduado ya registró su inasistencia a la ceremonia.'
      });
    }

    // 2. Obtener el ID de la ceremonia activa
    const ceremoniaRes = await db.query('SELECT id, nombre FROM ceremonias WHERE activa = 1 LIMIT 1');
    if (ceremoniaRes.rowCount === 0) {
      return res.status(400).json({ error: 'No hay una ceremonia activa configurada para recibir registros' });
    }
    const { id: ceremoniaId, nombre: nombreCeremoniaActiva } = ceremoniaRes.rows[0];

    // 3. Verificar si el DNI ya existe en cualquier hábitat para dar un mensaje claro
    const existeRes = await db.query(`
      SELECT e.*, c.nombre as nombre_ceremonia 
      FROM egresados e 
      JOIN ceremonias c ON e.ceremonia_id = c.id 
      WHERE e.dni = $1
    `, [dni.trim()]);

    if (existeRes.rowCount > 0) {
      const registroPrevio = existeRes.rows[0];
      if (registroPrevio.ceremonia_id === ceremoniaId) {
        return res.status(409).json({ 
          error: `El graduado ya está registrado en este hábitat (${nombreCeremoniaActiva})` 
        });
      } else {
        return res.status(409).json({ 
          error: `El graduado ya se encuentra registrado en otro hábitat: "${registroPrevio.nombre_ceremonia}"` 
        });
      }
    }

    // 4. Proceder con el registro si no hay duplicados ni inhabilitaciones
    const token = tokens.codigoSeguro(8);
    const result = await db.query(
      `INSERT INTO egresados (nombre, legajo, dni, correo, token, ceremonia_id, carrera, anio_inscripcion, promedio) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        nombre.trim(), 
        legajo.trim(), 
        dni.trim(), 
        correo ? correo.trim() : null, 
        token, 
        ceremoniaId,
        carrera ? carrera.trim() : null,
        anio_inscripcion ? parseInt(anio_inscripcion, 10) : null,
        promedio ? parseFloat(promedio) : null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al registrar graduado:", error);
    res.status(500).json({ error: 'Error al procesar el registro en el hábitat' });
  }
});

/**
 * POST /api/egresados/bulk
 * Carga masiva con verificación de inhabilitados y antecedentes en otros hábitats.
 */
router.post('/bulk', requiereRol(...ROLES_GESTION), async (req, res) => {
  const { egresados } = req.body;
  if (!Array.isArray(egresados)) return res.status(400).json({ error: 'Lista de graduados requerida' });

  const resultados = { exitosos: [], conflictos: [], errores: 0 };

  try {
    const ceremoniaRes = await db.query('SELECT id, nombre FROM ceremonias WHERE activa = 1 LIMIT 1');
    if (ceremoniaRes.rowCount === 0) return res.status(400).json({ error: 'No hay ceremonia activa' });
    const { id: ceremoniaId, nombre: nomCer } = ceremoniaRes.rows[0];

    for (const egr of egresados) {
      try {
        const { nombre, legajo, dni, correo, carrera, anio_inscripcion, promedio } = egr;
        
        if (!nombre || !dni) {
          resultados.errores++;
          continue;
        }

        const dniLimpio = dni.toString().trim();
        const correoStr = correo ? correo.toString().trim() : null;

        // Validar DNI numérico de 7 u 8 dígitos
        if (!/^\d{7,8}$/.test(dniLimpio)) {
          resultados.conflictos.push({ graduado: nombre, dni, motivo: 'Formato de DNI inválido' });
          continue;
        }

        // Validar correo si se provee
        if (correoStr && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoStr)) {
          resultados.conflictos.push({ graduado: nombre, dni, motivo: 'Formato de correo inválido' });
          continue;
        }

        // Verifico si está inhabilitado por rechazo previo
        const inhabilitadoRes = await db.query(
          `SELECT id FROM egresados WHERE dni = $1 AND estado = 'RECHAZADO'`,
          [dniLimpio]
        );
        if (inhabilitadoRes.rowCount > 0) {
          resultados.conflictos.push({
            graduado: nombre,
            dni,
            motivo: 'Inasistencia confirmada (Rechazó invitación)'
          });
          continue;
        }

        // Verificar antecedentes en otros hábitats
        const existe = await db.query(`
          SELECT e.*, c.nombre as nombre_ceremonia 
          FROM egresados e JOIN ceremonias c ON e.ceremonia_id = c.id 
          WHERE e.dni = $1
        `, [dniLimpio]);

        if (existe.rowCount > 0) {
          resultados.conflictos.push({
            graduado: nombre,
            dni,
            motivo: `Ya registrado en: ${existe.rows[0].nombre_ceremonia}`
          });
          continue;
        }

        // Insertar el nuevo graduado
        const token = tokens.codigoSeguro(8);
        await db.query(
          `INSERT INTO egresados (nombre, legajo, dni, correo, token, ceremonia_id, carrera, anio_inscripcion, promedio) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            nombre.toString().trim(), 
            legajo ? legajo.toString().trim() : 'S/L', 
            dniLimpio, 
            correo ? correo.trim() : null, 
            token, 
            ceremoniaId,
            carrera ? carrera.toString().trim() : null,
            anio_inscripcion ? parseInt(anio_inscripcion, 10) : null,
            promedio ? parseFloat(promedio) : null
          ]
        );
        resultados.exitosos.push(nombre);
      } catch (err) {
        resultados.errores++;
      }
    }
    res.json(resultados);
  } catch (error) {
    console.error('Error en carga masiva de graduados:', error);
    res.status(500).json({ error: 'Error procesando carga masiva' });
  }
});

/**
 * POST /api/egresados/:id/enviar-invitacion
 * Envía la invitación por correo electrónico al graduado.
 */
router.post('/:id/enviar-invitacion', requiereRol(...ROLES_GESTION), async (req, res) => {
  const { correoPersonalizado } = req.body;
  try {
    const result = await db.query('SELECT * FROM egresados WHERE id = $1', [req.params.id]);
    const graduado = result.rows[0];

    if (!graduado) return res.status(404).json({ error: 'El graduado no existe' });
    
    const destinatario = correoPersonalizado || graduado.correo;
    if (!destinatario) return res.status(400).json({ error: 'El graduado no tiene correo configurado' });

    // La URL pública del portal se define por entorno; el header Origin solo
    // se usa como respaldo en desarrollo (no es confiable para producción).
    const hostBase = process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';
    const linkAcceso = `${hostBase}/?token=${graduado.token}`;
    const contenidoHtml = generarPlantillaInvitacion(graduado.nombre, linkAcceso);
    
    await enviarCorreo(destinatario, 'Invitación a SiGIC - Acceso al Portal', contenidoHtml);
    res.json({ ok: true, mensaje: `Invitación enviada a ${destinatario}` });
  } catch (error) {
    console.error('Error al enviar invitación:', error);
    res.status(500).json({ error: 'Fallo al procesar el envío: ' + error.message });
  }
});

/**
 * POST /api/egresados/solicitar-otp
 * Genera y envía un código OTP al correo del graduado.
 */
router.post('/solicitar-otp', limitadorSolicitudOTP, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Correo requerido' });

  try {
    const query = `
      SELECT e.* 
      FROM egresados e
      JOIN ceremonias c ON e.ceremonia_id = c.id
      WHERE LOWER(e.correo) = LOWER($1) AND c.activa = 1
    `;
    const result = await db.query(query, [email]);
    const graduado = result.rows[0];

    if (!graduado) return res.status(404).json({ error: 'Correo no registrado en esta ceremonia' });

    if (graduado.estado === 'RECHAZADO') {
      return res.status(403).json({ 
        error: 'Confirmaste tu inasistencia a esta ceremonia de colación. Si se trata de un error o necesitás asistencia, por favor contactate con el soporte institucional.'
      });
    }

    const { codigo: otp, hash: otpHash, expiracion: expiration } = GestorOTP.generar({ 
      longitud: 6, 
      minutosExpiracion: 10 
    });

    // Guardar OTP temporal en la tabla de graduados (se limpia al verificar)
    await db.query(
      'UPDATE egresados SET otp = $1, otp_expira = $2 WHERE id = $3',
      [otp, expiration, graduado.id]
    );

    // Registrar en historial con hash SHA-256 (generado por la librería)
    const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    await db.query(
      `INSERT INTO otp_historial (egresado_id, otp_hash, ip_origen, resultado)
       VALUES ($1, $2, $3, 'ENVIADO')`,
      [graduado.id, otpHash, ipOrigen]
    );

    const htmlOTP = generarPlantillaOTP(otp);
    await enviarCorreo(graduado.correo, 'Tu código de acceso - SiGIC', htmlOTP);
    res.json({ ok: true, mensaje: 'Código enviado correctamente' });
  } catch (error) {
    console.error('Error en servicio OTP:', error);
    res.status(500).json({ error: 'Error en servicio OTP: ' + error.message });
  }
});

/**
 * POST /api/egresados/verificar-otp
 * Verifica el código OTP ingresado por el graduado.
 */
router.post('/verificar-otp', limitadorVerificacionOTP, async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Datos incompletos' });
  
  const otpStr = String(otp).trim();

  try {
    const result = await db.query('SELECT * FROM egresados WHERE LOWER(correo) = LOWER($1)', [email]);
    const graduado = result.rows[0];

    const otpHash = GestorOTP.hashear(otpStr);
    const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

    if (!graduado || !graduado.otp) {
      return res.status(401).json({ error: 'No hay solicitud de código activa' });
    }

    if (graduado.estado === 'RECHAZADO') {
      return res.status(403).json({ 
        error: 'Confirmaste tu inasistencia a esta ceremonia de colación. Si se trata de un error o necesitás asistencia, por favor contactate con el soporte institucional.'
      });
    }

    // Verificación contra el código guardado temporalmente en la base
    const estadoOTP = GestorOTP.verificar(otpStr, graduado.otp, graduado.otp_expira);

    if (estadoOTP === 'EXPIRADO') {
      await db.query(
        `UPDATE otp_historial SET resultado = 'EXPIRADO'
         WHERE id = (
           SELECT id FROM otp_historial 
           WHERE egresado_id = $1 AND resultado = 'ENVIADO'
           ORDER BY solicitado_en DESC LIMIT 1
         )`,
        [graduado.id]
      );
      return res.status(401).json({ error: 'El código ha caducado, solicite uno nuevo' });
    }

    if (estadoOTP === 'CODIGO_INVALIDO') {
      await db.query(
        `INSERT INTO otp_historial (egresado_id, otp_hash, ip_origen, resultado)
         VALUES ($1, $2, $3, 'FALLIDO')`,
        [graduado.id, otpHash, ipOrigen]
      );

      // Si acumuló demasiados intentos fallidos, invalidamos el código
      // actual para frenar ataques de fuerza bruta sobre el OTP.
      const fallidosRes = await db.query(
        `SELECT COUNT(*) AS total FROM otp_historial
         WHERE egresado_id = $1 AND resultado = 'FALLIDO'
           AND solicitado_en >= (
             SELECT solicitado_en FROM otp_historial
             WHERE egresado_id = $1 AND resultado = 'ENVIADO'
             ORDER BY solicitado_en DESC LIMIT 1
           )`,
        [graduado.id]
      );
      if (parseInt(fallidosRes.rows[0]?.total ?? 0, 10) >= 5) {
        await db.query('UPDATE egresados SET otp = NULL, otp_expira = NULL WHERE id = $1', [graduado.id]);
        return res.status(401).json({ error: 'Demasiados intentos fallidos. Solicitá un código nuevo.' });
      }

      return res.status(401).json({ error: 'Código incorrecto' });
    }

    // Verificación exitosa: limpiar OTP y registrar en historial
    await db.query('UPDATE egresados SET otp = NULL, otp_expira = NULL WHERE id = $1', [graduado.id]);
    await db.query(
      `UPDATE otp_historial SET resultado = 'VERIFICADO', verificado_en = CURRENT_TIMESTAMP
       WHERE id = (
         SELECT id FROM otp_historial 
         WHERE egresado_id = $1 AND resultado = 'ENVIADO'
         ORDER BY solicitado_en DESC LIMIT 1
       )`,
      [graduado.id]
    );

    res.json({
      ok: true,
      token_sesion: emitirSesionEgresado(graduado),
      usuario: {
        id: graduado.id,
        nombre: graduado.nombre,
        legajo: graduado.legajo,
        dni: graduado.dni,
        correo: graduado.correo,
        token: graduado.token,
        telefono: graduado.telefono,
        estado: graduado.estado || 'PENDIENTE',
        promedio: graduado.promedio,
        entregador_nombre: graduado.entregador_nombre,
        entregador_asiento_id: graduado.entregador_asiento_id,
        asiento_id: graduado.asiento_id,
        tipo: 'egresado' 
      }
    });
  } catch (error) {
    console.error("Error al verificar OTP:", error);
    res.status(500).json({ error: 'Error al verificar el código OTP' });
  }
});

/**
 * GET /api/egresados/token/:token
 * Busca un graduado por su token de acceso en la ceremonia activa.
 */
router.get('/token/:token', async (req, res) => {
  try {
    const query = `
      SELECT e.* 
      FROM egresados e
      JOIN ceremonias c ON e.ceremonia_id = c.id
      WHERE UPPER(e.token) = UPPER($1) AND c.activa = 1
    `;
    const result = await db.query(query, [req.params.token]);
    const graduado = result.rows[0];

    if (!graduado) return res.status(404).json({ error: 'Enlace no válido para esta ceremonia' });

    if (graduado.estado === 'RECHAZADO') {
      return res.status(403).json({ 
        error: 'Confirmaste tu inasistencia a esta ceremonia de colación. Si se trata de un error o necesitás asistencia, por favor contactate con el soporte institucional.'
      });
    }

    res.json({
      id: graduado.id,
      nombre: graduado.nombre,
      legajo: graduado.legajo,
      dni: graduado.dni,
      correo: graduado.correo,
      telefono: graduado.telefono,
      estado: graduado.estado || 'PENDIENTE',
      promedio: graduado.promedio,
      token_sesion: emitirSesionEgresado(graduado)
    });
  } catch (error) {
    console.error('Error al validar token:', error);
    res.status(500).json({ error: 'Error al validar el token de acceso' });
  }
});

/**
 * PUT /api/egresados/:id/responder-invitacion
 * Registro la respuesta del graduado a su invitación (acepta o rechaza).
 * Si rechaza, el estado es irreversible y queda inhabilitado.
 */
router.put('/:id/responder-invitacion', requierePersonalOEgresado((req) => req.params.id), async (req, res) => {
  const { estado, respuesta, telefono, correo } = req.body;
  const estadoFinal = estado || respuesta;
  
  if (!['ACEPTADO', 'RECHAZADO'].includes(estadoFinal)) {
    return res.status(400).json({ error: 'El estado debe ser ACEPTADO o RECHAZADO' });
  }

  try {
    // Verifico el estado actual del graduado para evitar revertir un rechazo
    const actualRes = await db.query('SELECT estado FROM egresados WHERE id = $1', [req.params.id]);
    if (actualRes.rowCount === 0) {
      return res.status(404).json({ error: 'Graduado no encontrado' });
    }

    const estadoActual = actualRes.rows[0].estado;

    // Si ya rechazó, no se permite cambiar el estado
    if (estadoActual === 'RECHAZADO') {
      return res.status(403).json({ 
        error: 'Este graduado ya rechazó la invitación. No es posible revertir esta acción.' 
      });
    }

    let result;
    if (estadoFinal === 'ACEPTADO') {
      // Si acepta, guardo teléfono y correo adicionales si vienen en el body
      result = await db.query(
        'UPDATE egresados SET estado = $1, telefono = $2, correo = $3 WHERE id = $4 RETURNING *',
        [estadoFinal, telefono || null, correo || null, req.params.id]
      );
    } else {
      // Si rechaza, solo marco el estado como RECHAZADO (irreversible)
      result = await db.query(
        'UPDATE egresados SET estado = $1 WHERE id = $2 RETURNING *',
        [estadoFinal, req.params.id]
      );
    }
    
    if (result.rowCount === 0) return res.status(404).json({ error: 'Graduado no encontrado' });

    const mensajeRespuesta = estadoFinal === 'ACEPTADO' 
      ? 'Invitación aceptada correctamente' 
      : 'Invitación rechazada. Se registró la inasistencia correctamente.';

    res.json({ ok: true, mensaje: mensajeRespuesta, graduado: result.rows[0] });
  } catch (error) {
    console.error('Error al procesar respuesta de invitación:', error);
    res.status(500).json({ error: 'Error al registrar la respuesta del graduado' });
  }
});

/**
 * DELETE /api/egresados
 * Limpia toda la base de datos de graduados de la ceremonia activa.
 */
router.delete('/', requiereRol(...ROLES_GESTION), async (req, res) => {
  try {
    await db.query('DELETE FROM egresados');
    res.json({ ok: true, mensaje: 'Base de datos de graduados vaciada correctamente' });
  } catch (error) {
    console.error('Error al vaciar la base de datos de graduados:', error);
    res.status(500).json({ error: 'Error al vaciar la base de datos de graduados' });
  }
});

/**
 * DELETE /api/egresados/:id
 * Elimina un graduado específico por su ID.
 */
router.delete('/:id', requiereRol(...ROLES_GESTION), async (req, res) => {
  try {
    const result = await db.query('DELETE FROM egresados WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Graduado no encontrado' });
    res.json({ ok: true, mensaje: 'Graduado removido correctamente' });
  } catch (error) {
    console.error('Error al eliminar graduado:', error);
    res.status(500).json({ error: 'Error al eliminar el graduado' });
  }
});

/**
 * PUT /api/egresados/:id/asientos
 * Asignación masiva de asientos (Graduado + Invitados)
 */
router.put('/:id/asientos', requierePersonalOEgresado((req) => req.params.id), async (req, res) => {
  const { egresadoAsiento, entregadorAsiento, invitadosAsientos } = req.body;
  // invitadosAsientos: { [invitadoId]: asientoId }

  try {
    // Asegurar columnas por si falló la inicialización
    try {
      await db.query("ALTER TABLE egresados ADD COLUMN entregador_asiento_id TEXT;");
      await db.query("ALTER TABLE egresados ADD COLUMN asiento_id TEXT;");
    } catch(e) {}

    // 1. Actualizar asiento del graduado y del entregador
    await db.query(
      'UPDATE egresados SET asiento_id = $1, entregador_asiento_id = $2 WHERE id = $3', 
      [egresadoAsiento, entregadorAsiento, req.params.id]
    );

    // 2. Actualizar asientos de invitados
    if (invitadosAsientos && typeof invitadosAsientos === 'object') {
      for (const [invId, seatId] of Object.entries(invitadosAsientos)) {
        await db.query('UPDATE invitados SET asiento_id = $1 WHERE id = $2 AND egresado_id = $3', [seatId, invId, req.params.id]);
      }
    }

    res.json({ ok: true, mensaje: 'Asientos asignados correctamente' });
  } catch (error) {
    console.error("Error al asignar asientos:", error);
    res.status(500).json({ error: 'Error al procesar la asignación de asientos' });
  }
});

/**
 * PUT /api/egresados/:id/entregador
 * Actualiza el nombre de quien entrega el diploma al graduado.
 */
router.put('/:id/entregador', requierePersonalOEgresado((req) => req.params.id), async (req, res) => {
  const { nombre } = req.body;
  try {
    // Verificación de emergencia: asegurar que la columna existe antes de actualizar
    try {
      await db.query("ALTER TABLE egresados ADD COLUMN entregador_nombre TEXT;");
    } catch(e) { /* Ya existe */ }

    const result = await db.query('UPDATE egresados SET entregador_nombre = $1 WHERE id = $2', [nombre, req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No se encontró el graduado con el ID proporcionado' });
    }

    res.json({ ok: true, mensaje: 'Entregador actualizado correctamente' });
  } catch (error) {
    console.error("Error al actualizar entregador:", error);
    res.status(500).json({ 
      error: 'Error al actualizar el entregador',
      detalle: error.message 
    });
  }
});

module.exports = router;
