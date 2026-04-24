/**
 * Rutas de Gestión de Egresados (SiGIC) - Versión PostgreSQL
 * Con historial de OTP y logs de auditoría.
 */

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto'); // Para hash SHA-256 del OTP
const db = require('../db');
const { 
  enviarCorreo, 
  generarPlantillaInvitacion, 
  generarPlantillaOTP 
} = require('../servicios/email');

const router = Router();

/**
 * GET /api/egresados (Filtrado por Hábitat Activo)
 */
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT e.* 
      FROM egresados e
      JOIN ceremonias c ON e.ceremonia_id = c.id
      WHERE c.activa = 1
      ORDER BY e.creado_en DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar egresados del hábitat activo' });
  }
});

/**
 * POST /api/egresados (Asignación automática de Hábitat)
 */
router.post('/', async (req, res) => {
  const { nombre, legajo, dni, correo } = req.body;

  if (!nombre || !legajo || !dni) {
    return res.status(400).json({ error: 'Nombre, Legajo y DNI son obligatorios' });
  }

  try {
    // 1. Obtener el ID de la ceremonia activa
    const ceremoniaRes = await db.query('SELECT id, nombre FROM ceremonias WHERE activa = 1 LIMIT 1');
    if (ceremoniaRes.rowCount === 0) {
      return res.status(400).json({ error: 'No hay una ceremonia activa configurada para recibir registros' });
    }
    const { id: ceremoniaId, nombre: nombreCeremoniaActiva } = ceremoniaRes.rows[0];

    // 2. Verificar si el DNI ya existe en cualquier hábitat para dar un mensaje claro
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
          error: `El egresado ya está registrado en este hábitat (${nombreCeremoniaActiva})` 
        });
      } else {
        return res.status(409).json({ 
          error: `El egresado ya se encuentra registrado en otro hábitat: "${registroPrevio.nombre_ceremonia}"` 
        });
      }
    }

    // 3. Proceder con el registro si no hay duplicados
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = await db.query(
      `INSERT INTO egresados (nombre, legajo, dni, correo, token, ceremonia_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [nombre.trim(), legajo.trim(), dni.trim(), correo ? correo.trim() : null, token, ceremoniaId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al registrar egresado:", error);
    res.status(500).json({ error: 'Error al procesar el registro en el hábitat' });
  }
});

/**
 * POST /api/egresados/bulk
 * Carga masiva con verificación de antecedentes en otros hábitats
 */
router.post('/bulk', async (req, res) => {
  const { egresados } = req.body;
  if (!Array.isArray(egresados)) return res.status(400).json({ error: 'Lista de egresados requerida' });

  const resultados = { exitosos: [], conflictos: [], errores: 0 };

  try {
    const ceremoniaRes = await db.query('SELECT id, nombre FROM ceremonias WHERE activa = 1 LIMIT 1');
    if (ceremoniaRes.rowCount === 0) return res.status(400).json({ error: 'No hay ceremonia activa' });
    const { id: ceremoniaId, nombre: nomCer } = ceremoniaRes.rows[0];

    for (const egr of egresados) {
      try {
        const { nombre, legajo, dni, correo } = egr;
        if (!nombre || !dni) {
          resultados.errores++;
          continue;
        }

        // Verificar antecedentes
        const existe = await db.query(`
          SELECT e.*, c.nombre as nombre_ceremonia 
          FROM egresados e JOIN ceremonias c ON e.ceremonia_id = c.id 
          WHERE e.dni = $1
        `, [dni.toString().trim()]);

        if (existe.rowCount > 0) {
          resultados.conflictos.push({
            egresado: nombre,
            dni,
            motivo: `Ya registrado en: ${existe.rows[0].nombre_ceremonia}`
          });
          continue;
        }

        // Insertar
        const token = Math.random().toString(36).substring(2, 8).toUpperCase();
        await db.query(
          `INSERT INTO egresados (nombre, legajo, dni, correo, token, ceremonia_id) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [nombre.toString().trim(), legajo ? legajo.toString().trim() : 'S/L', dni.toString().trim(), correo ? correo.trim() : null, token, ceremoniaId]
        );
        resultados.exitosos.push(nombre);
      } catch (err) {
        resultados.errores++;
      }
    }
    res.json(resultados);
  } catch (error) {
    res.status(500).json({ error: 'Error procesando carga masiva' });
  }
});

/**
 * POST /api/egresados/:id/enviar-invitacion
 */
router.post('/:id/enviar-invitacion', async (req, res) => {
  const { correoPersonalizado } = req.body;
  try {
    const result = await db.query('SELECT * FROM egresados WHERE id = $1', [req.params.id]);
    const egresado = result.rows[0];

    if (!egresado) return res.status(404).json({ error: 'El egresado no existe' });
    
    const destinatario = correoPersonalizado || egresado.correo;
    if (!destinatario) return res.status(400).json({ error: 'El egresado no tiene correo configurado' });

    const hostBase = req.headers.origin || 'http://localhost:5173';
    const linkAcceso = `${hostBase}/?token=${egresado.token}`;
    const contenidoHtml = generarPlantillaInvitacion(egresado.nombre, linkAcceso);
    
    await enviarCorreo(destinatario, 'Invitación a SiGIC - Acceso al Portal', contenidoHtml);
    res.json({ ok: true, mensaje: `Enviado a ${destinatario}` });
  } catch (error) {
    res.status(500).json({ error: 'Fallo al procesar el envío: ' + error.message });
  }
});

/**
 * POST /api/egresados/solicitar-otp
 */
router.post('/solicitar-otp', async (req, res) => {
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
    const egresado = result.rows[0];

    if (!egresado) return res.status(404).json({ error: 'Correo no registrado en esta ceremonia' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 10);

    // Guardar OTP temporal en egresados (se borrará al verificar)
    await db.query(
      'UPDATE egresados SET otp = $1, otp_expira = $2 WHERE id = $3',
      [otp, expiration, egresado.id]
    );

    // Registrar en historial con hash SHA-256 (nunca texto plano)
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    await db.query(
      `INSERT INTO otp_historial (egresado_id, otp_hash, ip_origen, resultado)
       VALUES ($1, $2, $3, 'ENVIADO')`,
      [egresado.id, otpHash, ipOrigen]
    );

    const htmlOTP = generarPlantillaOTP(otp);
    await enviarCorreo(egresado.correo, 'Tu código de acceso - SiGIC', htmlOTP);
    res.json({ ok: true, mensaje: 'Código enviado' });
  } catch (error) {
    res.status(500).json({ error: 'Error en servicio OTP: ' + error.message });
  }
});

/**
 * POST /api/egresados/verificar-otp
 */
router.post('/verificar-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Datos incompletos' });

  try {
    const result = await db.query('SELECT * FROM egresados WHERE LOWER(correo) = LOWER($1)', [email]);
    const egresado = result.rows[0];

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

    if (!egresado || !egresado.otp) {
      return res.status(401).json({ error: 'No hay solicitud activa' });
    }

    // Verificar expiración
    if (new Date() > new Date(egresado.otp_expira)) {
      await db.query(
        `UPDATE otp_historial SET resultado = 'EXPIRADO'
         WHERE egresado_id = $1 AND resultado = 'ENVIADO'
         ORDER BY solicitado_en DESC LIMIT 1`,
        [egresado.id]
      );
      return res.status(401).json({ error: 'Código caducado' });
    }

    // Verificar código
    if (egresado.otp !== otp) {
      await db.query(
        `INSERT INTO otp_historial (egresado_id, otp_hash, ip_origen, resultado)
         VALUES ($1, $2, $3, 'FALLIDO')`,
        [egresado.id, otpHash, ipOrigen]
      );
      return res.status(401).json({ error: 'Código incorrecto' });
    }

    // Verificación exitosa: limpiar OTP y registrar historial
    await db.query('UPDATE egresados SET otp = NULL, otp_expira = NULL WHERE id = $1', [egresado.id]);
    await db.query(
      `UPDATE otp_historial SET resultado = 'VERIFICADO', verificado_en = CURRENT_TIMESTAMP
       WHERE egresado_id = $1 AND resultado = 'ENVIADO'
       ORDER BY solicitado_en DESC LIMIT 1`,
      [egresado.id]
    );

    res.json({
      ok: true,
      usuario: { 
        id: egresado.id, 
        nombre: egresado.nombre, 
        legajo: egresado.legajo, 
        dni: egresado.dni,
        token: egresado.token,
        entregador_nombre: egresado.entregador_nombre,
        entregador_asiento_id: egresado.entregador_asiento_id,
        asiento_id: egresado.asiento_id,
        tipo: 'egresado' 
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar OTP' });
  }
});

/**
 * GET /api/egresados/token/:token
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
    const egresado = result.rows[0];

    if (!egresado) return res.status(404).json({ error: 'Enlace no válido para esta ceremonia' });
    res.json({ id: egresado.id, nombre: egresado.nombre, legajo: egresado.legajo, correo: egresado.correo });
  } catch (error) {
    res.status(500).json({ error: 'Error al validar token' });
  }
});

/**
 * DELETE /api/egresados
 * Limpia toda la base de datos de egresados
 */
router.delete('/', async (req, res) => {
  try {
    await db.query('DELETE FROM egresados');
    res.json({ ok: true, mensaje: 'Base de datos de egresados vaciada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al vaciar la base de datos' });
  }
});

/**
 * DELETE /api/egresados/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM egresados WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true, mensaje: 'Egresado removido' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar egresado' });
  }
});

/**
 * PUT /api/egresados/:id/asientos
 * Asignación masiva de asientos (Egresado + Invitados)
 */
router.put('/:id/asientos', async (req, res) => {
  const { egresadoAsiento, entregadorAsiento, invitadosAsientos } = req.body;
  // invitadosAsientos: { [invitadoId]: asientoId }

  try {
    // Asegurar columnas por si falló el init
    try {
      await db.query("ALTER TABLE egresados ADD COLUMN entregador_asiento_id TEXT;");
      await db.query("ALTER TABLE egresados ADD COLUMN asiento_id TEXT;");
    } catch(e) {}

    // 1. Actualizar asiento del egresado y entregador
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
 * Actualiza el nombre de quien entrega el diploma
 */
router.put('/:id/entregador', async (req, res) => {
  const { nombre } = req.body;
  try {
    // Verificación de emergencia: asegurar que la columna existe antes de actualizar
    try {
      await db.query("ALTER TABLE egresados ADD COLUMN entregador_nombre TEXT;");
    } catch(e) { /* Ya existe */ }

    const result = await db.query('UPDATE egresados SET entregador_nombre = $1 WHERE id = $2', [nombre, req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No se encontró el egresado con el ID proporcionado' });
    }

    res.json({ ok: true, mensaje: 'Entregador actualizado correctamente' });
  } catch (error) {
    console.error("Error detallado al actualizar entregador:", error);
    res.status(500).json({ 
      error: 'Error al actualizar entregador',
      detalle: error.message 
    });
  }
});

module.exports = router;
