import { NextRequest, NextResponse } from 'next/server';
import { obtenerOrigenPublico } from '@/lib/public-origin';
import { query, pool } from '@/lib/db';
import { firmar } from '@/lib/tokens';
import { obtenerUsuarioAutenticado, ROLES_GESTION, ROLES_OPERACION, ROLES_LECTURA } from '@/lib/auth-middleware';
import * as GestorOTP from '@/lib/otp';
import { enviarCorreo, generarPdfCredencial, generarPlantillaCierreInscripcion, generarPlantillaCredencialCeremonia, generarPlantillaInvitacion, generarPlantillaInvitacionEquipo, generarPlantillaOTP } from '@/lib/email';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { inicializarBaseDatos } from '@/lib/schema';
import { generarPaseGoogleWallet } from '@/lib/google-wallet';
import { obtenerCache, guardarCache, invalidarCache } from '@/lib/cache';
import { registrarAuditoria } from '@/lib/auditoria';

import {
  RONDAS_BCRYPT,
  LARGO_MINIMO_PASSWORD,
  ROLES_VALIDOS,
  prepararIdentificadorGraduado,
  ocultarCorreo,
  corsHeaders,
  verificarRateLimit,
  esAutorizadoPersonalOEgresado,
  esPersonalValido,
  registrarAuditoriaOTP,
  esUltimoSuperAdmin,
  parsearCodigoAcreditacion
} from '@/lib/api-helpers';

let inicializacionPromise: Promise<void> | null = null;

async function inicializarTablasAdicionales() {
  try {
    await query(`
      INSERT INTO configuracion_sistema (clave, valor, descripcion, actualizado_en)
      VALUES (
        'mostrar_presentacion_inicial',
        'true',
        'Muestra la presentación institucional durante la carga inicial',
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (clave) DO NOTHING
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS ceremonias_usuarios_autorizados (
        ceremonia_id VARCHAR(50) NOT NULL,
        usuario_id VARCHAR(50) NOT NULL,
        PRIMARY KEY (ceremonia_id, usuario_id)
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS auditoria_sistema (
        id VARCHAR(50) PRIMARY KEY,
        usuario_id VARCHAR(100),
        usuario_correo VARCHAR(200),
        rol VARCHAR(50),
        accion VARCHAR(100) NOT NULL,
        entidad VARCHAR(100) NOT NULL,
        entidad_id VARCHAR(100),
        detalles JSONB,
        ip VARCHAR(120),
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await query('CREATE INDEX IF NOT EXISTS idx_auditoria_entidad_creado ON auditoria_sistema (entidad, creado_en DESC)');
    await query('CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_sistema (usuario_id, creado_en DESC)');
    await query(`
      CREATE TABLE IF NOT EXISTS dispositivos_moviles (
        dispositivo_id VARCHAR(100) PRIMARY KEY,
        usuario_id VARCHAR(100) NOT NULL,
        marca VARCHAR(100),
        fabricante VARCHAR(120),
        modelo VARCHAR(160),
        nombre_dispositivo VARCHAR(160),
        sistema VARCHAR(80),
        version_sistema VARCHAR(80),
        tipo_dispositivo VARCHAR(40),
        version_app VARCHAR(40),
        es_dispositivo_real SMALLINT DEFAULT 1,
        ip_ultimo_acceso VARCHAR(120),
        agente_usuario VARCHAR(300),
        primera_conexion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sesion_activa SMALLINT DEFAULT 1
      )
    `);
    await query('CREATE INDEX IF NOT EXISTS dispositivos_moviles_usuario_idx ON dispositivos_moviles (usuario_id)');
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS egresados_inscripcion_ceremonia_key
      ON egresados (
        ceremonia_id,
        UPPER(COALESCE(legajo, '')),
        UPPER(COALESCE(carrera, '')),
        COALESCE(anio_inscripcion, 0)
      )
    `);
    await query('ALTER TABLE otp_historial ALTER COLUMN otp_hash TYPE VARCHAR(64)');
    await query('ALTER TABLE otp_historial ALTER COLUMN resultado TYPE VARCHAR(32)');
    await query('ALTER TABLE egresados ADD COLUMN IF NOT EXISTS entregador_asiento_id VARCHAR(100)');
    await query('ALTER TABLE entregadores ADD COLUMN IF NOT EXISTS asiento_id VARCHAR(100)');
    await query("ALTER TABLE egresados ADD COLUMN IF NOT EXISTS formula_juramento VARCHAR(50) DEFAULT 'PATRIA'");
    await query('ALTER TABLE egresados ADD COLUMN IF NOT EXISTS comentarios VARCHAR(500)');
    await query('ALTER TABLE egresados ADD COLUMN IF NOT EXISTS diploma_entregado BOOLEAN DEFAULT FALSE');
    await query('ALTER TABLE egresados ADD COLUMN IF NOT EXISTS menciones VARCHAR(200)');
    await query('ALTER TABLE invitados ADD COLUMN IF NOT EXISTS menor_en_brazos BOOLEAN DEFAULT FALSE');
    await query('ALTER TABLE ceremonias ADD COLUMN IF NOT EXISTS fecha_limite_confirmacion TIMESTAMP');
    await query('ALTER TABLE ceremonias ADD COLUMN IF NOT EXISTS fecha_limite_respuesta TIMESTAMP');
    await query('ALTER TABLE ceremonias ADD COLUMN IF NOT EXISTS fecha_limite_grupo TIMESTAMP');
    await query('ALTER TABLE ceremonias ADD COLUMN IF NOT EXISTS fecha_cierre_butacas TIMESTAMP');

    // Índices compuestos de alto rendimiento para consultas concurrentes
    await query('CREATE INDEX IF NOT EXISTS idx_egresados_ceremonia_estado ON egresados (ceremonia_id, estado)');
    await query('CREATE INDEX IF NOT EXISTS idx_invitados_egresado_id ON invitados (egresado_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_codigos_otp_egresado ON codigos_otp (egresado_id, codigo)');
    await query('CREATE INDEX IF NOT EXISTS idx_butacas_ceremonia_sector ON butacas (ceremonia_id, sector, estado)');
    await query('CREATE INDEX IF NOT EXISTS idx_entregadores_egresado ON entregadores (egresado_id)');
  } catch (e) {
    console.error('Error al inicializar tablas e índices adicionales:', e);
  }
}

async function asegurarInicializacion() {
  if (!inicializacionPromise) {
    inicializacionPromise = (async () => {
      await inicializarBaseDatos();
      await inicializarTablasAdicionales();
    })().catch((err) => {
      inicializacionPromise = null;
      throw err;
    });
  }
  return inicializacionPromise;
}

// Tauri y los navegadores externos requieren responder el preflight antes de
// realizar solicitudes autenticadas a la API.
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

// MAIN HANDLER FOR GET REQUESTS
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const headers = corsHeaders(req);
  try {
    await asegurarInicializacion();
  } catch (error: any) {
    console.error('Error al inicializar la base de datos:', error);
    return NextResponse.json({ error: error?.message || 'No se pudo inicializar la base de datos' }, { status: 500, headers });
  }
  const { slug } = await params;
  const path = slug.join('/');

  try {
    // -------------------------------------------------------------
    // SETUP STATUS
    // -------------------------------------------------------------
    if (path === 'setup/status') {
      const cached = obtenerCache('setup:status');
      if (cached) return NextResponse.json(cached, { headers });

      const usuarios = await query('SELECT COUNT(*)::int AS total FROM usuarios_sistema');
      const ceremonias = await query('SELECT COUNT(*)::int AS total FROM ceremonias');
      const egresados = await query('SELECT COUNT(*)::int AS total FROM egresados');
      const invitados = await query('SELECT COUNT(*)::int AS total FROM invitados');

      const totalUsuarios = usuarios.rows[0]?.total ?? 0;
      const flagSetup = await query(
        "SELECT valor FROM configuracion_sistema WHERE clave = 'setup_inicial_completado' LIMIT 1"
      );
      const setupCompleto = flagSetup.rows[0]?.valor === '1';

      const respuesta = {
        requiereConfiguracionInicial: totalUsuarios === 0 || !setupCompleto,
        metricas: {
          usuarios: totalUsuarios,
          ceremonias: ceremonias.rows[0]?.total ?? 0,
          egresados: egresados.rows[0]?.total ?? 0,
          invitados: invitados.rows[0]?.total ?? 0,
        },
        setupCompleto,
      };
      guardarCache('setup:status', respuesta, 15);
      return NextResponse.json(respuesta, { headers });
    }

    // -------------------------------------------------------------
    // SETUP EXPORT (BACKUP DATA)
    // -------------------------------------------------------------
    if (path === 'setup/export') {
      const auth = obtenerUsuarioAutenticado(req);
      if (!auth.valido || auth.datos?.email?.toLowerCase() !== 'soporte@ibeltran.com.ar') {
        return NextResponse.json({ error: 'No autorizado. Solo la cuenta de soporte puede exportar la base de datos.' }, { status: 403, headers });
      }

      const egresados = await query('SELECT * FROM egresados').catch(() => ({ rows: [] }));
      const invitados = await query('SELECT * FROM invitados').catch(() => ({ rows: [] }));
      const ceremonias = await query('SELECT * FROM ceremonias').catch(() => ({ rows: [] }));
      const profesores = await query('SELECT * FROM profesores').catch(() => ({ rows: [] }));
      const entregadores = await query('SELECT * FROM entregadores').catch(() => ({ rows: [] }));
      const configuracion = await query('SELECT * FROM configuracion_sistema').catch(() => ({ rows: [] }));

      return NextResponse.json({
        exportadoEn: new Date().toISOString(),
        egresados: egresados.rows,
        invitados: invitados.rows,
        ceremonias: ceremonias.rows,
        profesores: profesores.rows,
        entregadores: entregadores.rows,
        configuracion_sistema: configuracion.rows
      }, { headers });
    }


    // -------------------------------------------------------------
    // STATS
    // -------------------------------------------------------------
    if (path === 'stats') {
      const auth = obtenerUsuarioAutenticado(req, ROLES_LECTURA);
      if (!auth.valido) return NextResponse.json({ error: auth.error }, { status: auth.statusCode, headers });

      const ceremoniaRes = await query('SELECT id, nombre, fecha, lugar, activa FROM ceremonias WHERE activa = 1 LIMIT 1');
      if (ceremoniaRes.rowCount === 0) {
        return NextResponse.json({
          ceremonia: null, totalEgresados: 0, egresadosConfirmados: 0, egresadosPendientes: 0,
          totalInvitados: 0, presentes: 0, ausentes: 0, gruposConIngreso: 0,
          porcentajeAsistencia: 0, ultimosIngresos: [],
          mensaje: 'No hay una ceremonia activa configurada'
        }, { headers });
      }
      const ceremonia = ceremoniaRes.rows[0];
      const ceremoniaId = ceremonia.id;

      const egresadosCount = await query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE estado = 'ACEPTADO') as confirmados,
          COUNT(*) FILTER (WHERE estado IS NULL OR estado <> 'ACEPTADO') as pendientes
        FROM egresados WHERE ceremonia_id = $1
      `, [ceremoniaId]);
      const invitadosStats = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE i.presente IS TRUE) as presentes
        FROM invitados i
        JOIN egresados e ON i.egresado_id = e.id
        WHERE e.ceremonia_id = $1
      `, [ceremoniaId]);

      const totalEgresados = parseInt(egresadosCount.rows[0].total || '0');
      const egresadosConfirmados = parseInt(egresadosCount.rows[0].confirmados || '0');
      const egresadosPendientes = parseInt(egresadosCount.rows[0].pendientes || '0');
      const totalInvitados = parseInt(invitadosStats.rows[0].total || '0');
      const presentes = parseInt(invitadosStats.rows[0].presentes || '0');
      const ausentes = totalInvitados - presentes;
      const porcentajeAsistencia = totalInvitados > 0 ? Math.round((presentes / totalInvitados) * 100) : 0;
      const gruposRes = await query(`
        SELECT COUNT(DISTINCT e.id) as total
        FROM egresados e
        JOIN invitados i ON i.egresado_id = e.id
        WHERE e.ceremonia_id = $1 AND i.presente IS TRUE
      `, [ceremoniaId]);
      const gruposConIngreso = parseInt(gruposRes.rows[0].total || '0');
      const ingresosPorHoraRes = await query(`
        SELECT EXTRACT(HOUR FROM i.fecha_presente)::int AS hora, COUNT(*)::int AS total
        FROM invitados i
        JOIN egresados e ON i.egresado_id = e.id
        WHERE e.ceremonia_id = $1 AND i.presente IS TRUE AND i.fecha_presente IS NOT NULL
        GROUP BY EXTRACT(HOUR FROM i.fecha_presente)
        ORDER BY hora ASC
      `, [ceremoniaId]);
      const ingresosPorHora = Array.from({ length: 24 }, (_, hora) => ({
        hora,
        total: ingresosPorHoraRes.rows.find((fila: any) => Number(fila.hora) === hora)?.total || 0,
      }));
      const relacionesRes = await query(`
        SELECT COALESCE(NULLIF(i.relacion, ''), 'Acompañante') AS relacion, COUNT(*)::int AS total
        FROM invitados i
        JOIN egresados e ON i.egresado_id = e.id
        WHERE e.ceremonia_id = $1 AND i.presente IS TRUE
        GROUP BY COALESCE(NULLIF(i.relacion, ''), 'Acompañante')
        ORDER BY total DESC, relacion ASC
        LIMIT 4
      `, [ceremoniaId]);
      const proximaCeremoniaRes = await query(`
        SELECT id, nombre, fecha, lugar
        FROM ceremonias
        WHERE id <> $1
          AND NULLIF(fecha, '')::date >= CURRENT_DATE
        ORDER BY NULLIF(fecha, '')::date ASC
        LIMIT 1
      `, [ceremoniaId]);

      const ingresosQuery = `
        SELECT i.*, e.nombre as "egresadoNombre"
        FROM invitados i
        JOIN egresados e ON i.egresado_id = e.id
        WHERE i.presente IS TRUE AND e.ceremonia_id = $1
        ORDER BY i.fecha_presente DESC
        LIMIT 5
      `;
      const ingresosRes = await query(ingresosQuery, [ceremoniaId]);
      
      const ultimosIngresos = ingresosRes.rows.map((inv: any) => ({
        id: inv.id,
        nombre: inv.nombre,
        relacion: inv.relacion,
        egresado: inv.egresadoNombre,
        hora: new Date(inv.fecha_presente).toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        fechaPresente: inv.fecha_presente,
      }));

      return NextResponse.json({
        ceremoniaId,
        ceremonia: { id: ceremonia.id, nombre: ceremonia.nombre, fecha: ceremonia.fecha, lugar: ceremonia.lugar },
        totalEgresados,
        egresadosConfirmados,
        egresadosPendientes,
        totalInvitados,
        presentes,
        ausentes,
        gruposConIngreso,
        porcentajeAsistencia,
        ingresosPorHora,
        ingresosPorRelacion: relacionesRes.rows,
        ultimosIngresos,
        proximaCeremonia: proximaCeremoniaRes.rows[0] || null,
        timestamp: new Date().toISOString(),
      }, { headers });
    }

    // -------------------------------------------------------------
    // CONFIGURACIÓN
    // -------------------------------------------------------------
    if (path === 'configuracion') {
      const cached = obtenerCache('configuracion:global');
      if (cached) return NextResponse.json(cached, { headers });

      const resGlobal = await query(
        'SELECT clave, valor, descripcion, actualizado_en FROM configuracion_sistema ORDER BY clave'
      );

      const ajustes: Record<string, any> = {};
      resGlobal.rows.forEach((row: any) => {
        ajustes[row.clave] = {
          valor: row.valor,
          descripcion: row.descripcion,
          actualizado_en: row.actualizado_en,
        };
      });

      const resActiva = await query('SELECT * FROM ceremonias WHERE activa = 1 LIMIT 1');
      if (resActiva.rowCount && resActiva.rowCount > 0) {
        const c = resActiva.rows[0];
        ajustes['nombre_evento'] = { valor: c.nombre, descripcion: 'Nombre de la ceremonia actual' };
        ajustes['max_invitados'] = { valor: String(c.max_invitados), descripcion: 'Cupo de invitados por egresado' };
        ajustes['fecha_evento']  = { valor: c.fecha, descripcion: 'Fecha de la ceremonia actual' };
        ajustes['lugar_evento']  = { valor: c.lugar, descripcion: 'Ubicación física del evento' };
      }

      guardarCache('configuracion:global', ajustes, 60);
      return NextResponse.json(ajustes, { headers });
    }

    // CONFIG ANFITEATRO ESTRUCTURA POR CEREMONIA
    if (slug[0] === 'configuracion' && slug[1] === 'anfiteatro' && slug[2] === 'estructura' && slug[3]) {
      const ceremoniaId = slug[3];
      const cacheKey = `anfiteatro:estructura:${ceremoniaId}`;
      const cached = obtenerCache(cacheKey);
      if (cached) return NextResponse.json(cached, { headers });

      const result = await query(
        'SELECT * FROM configuracion_anfiteatro WHERE ceremonia_id = $1 ORDER BY actualizado_en DESC LIMIT 1',
        [ceremoniaId]
      );
      if (result.rows.length === 0) {
        const defaultRoles: Record<string, string> = {};
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((letra, idx) => {
          defaultRoles[`baja-${letra}-5`] = 'bloqueado';
          defaultRoles[`baja-${letra}-16`] = 'bloqueado';
          if (idx === 0 || idx === 1) {
            for (let col = 6; col <= 15; col++) defaultRoles[`baja-${letra}-${col}`] = 'egresado';
          }
          if (idx === 0) {
            defaultRoles[`baja-A-4`] = 'discapacitado';
            defaultRoles[`baja-A-17`] = 'discapacitado';
          }
        });

        const defaultRes = {
          estructura: { 
            baja: { filas: 7, asientos: 20 },
            alta: { filas: 5, asientos: 22 }
          },
          mapaRoles: defaultRoles
        };
        guardarCache(cacheKey, defaultRes, 60);
        return NextResponse.json(defaultRes, { headers });
      }
      const data = result.rows[0];
      const resData = {
        estructura: typeof data.estructura === 'string' ? JSON.parse(data.estructura) : data.estructura,
        mapaRoles: typeof data.mapa_roles === 'string' ? JSON.parse(data.mapa_roles) : data.mapa_roles
      };
      guardarCache(cacheKey, resData, 60);
      return NextResponse.json(resData, { headers });
    }

    // -------------------------------------------------------------
    // ANFITEATRO CONFIG
    // -------------------------------------------------------------
    if (path === 'anfiteatro/config') {
      const cached = obtenerCache('anfiteatro:config:activa');
      if (cached) return NextResponse.json(cached, { headers });

      const ceremoniaActiva = await query('SELECT id FROM ceremonias WHERE activa = 1 LIMIT 1');
      const ceremoniaId = ceremoniaActiva.rows[0]?.id;
      if (!ceremoniaId) return NextResponse.json({ error: 'No hay una ceremonia activa' }, { status: 404, headers });
      const result = await query(
        'SELECT estructura, mapa_roles FROM configuracion_anfiteatro WHERE ceremonia_id = $1 ORDER BY actualizado_en DESC LIMIT 1',
        [ceremoniaId]
      );
      
      if (result.rows.length === 0) {
        const defaultRoles: Record<string, string> = {};
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((letra, idx) => {
          defaultRoles[`baja-${letra}-5`] = 'bloqueado';
          defaultRoles[`baja-${letra}-16`] = 'bloqueado';
          if (idx === 0 || idx === 1) {
            for (let col = 6; col <= 15; col++) defaultRoles[`baja-${letra}-${col}`] = 'egresado';
          }
          if (idx === 0) {
            defaultRoles[`baja-A-4`] = 'discapacitado';
            defaultRoles[`baja-A-17`] = 'discapacitado';
          }
        });

        const defaultRes = {
          estructura: { baja: { filas: 7, asientos: 20 }, alta: { filas: 5, asientos: 22 } },
          mapaRoles: defaultRoles
        };
        guardarCache('anfiteatro:config:activa', defaultRes, 60);
        return NextResponse.json(defaultRes, { headers });
      }

      const { estructura, mapa_roles } = result.rows[0];
      const resData = {
        estructura: typeof estructura === 'string' ? JSON.parse(estructura) : estructura,
        mapaRoles: typeof mapa_roles === 'string' ? JSON.parse(mapa_roles) : mapa_roles
      };
      guardarCache('anfiteatro:config:activa', resData, 60);
      return NextResponse.json(resData, { headers });
    }

    // -------------------------------------------------------------
    // CEREMONIAS
    // -------------------------------------------------------------
    if (path === 'ceremonias/autorizadas') {
      const auth = obtenerUsuarioAutenticado(req, ROLES_OPERACION);
      if (!auth.valido) {
        return NextResponse.json(
          { error: auth.error || 'Sesión requerida' },
          { status: auth.statusCode || 401, headers }
        );
      }

      const usuario = auth.datos!;
      const esGestion = Boolean(usuario.rol && ROLES_GESTION.includes(usuario.rol));
      if (esGestion) {
        const result = await query(`
          SELECT c.*, TRUE AS autorizado
          FROM ceremonias c
          ORDER BY c.activa DESC, c.fecha DESC
        `);
        return NextResponse.json(result.rows, { headers });
      }

      const restricciones = await query(
        'SELECT 1 FROM ceremonias_usuarios_autorizados WHERE usuario_id = $1',
        [usuario.id]
      );

      const result = restricciones.rowCount && restricciones.rowCount > 0
        ? await query(`
            SELECT c.*, TRUE AS autorizado
            FROM ceremonias c
            INNER JOIN ceremonias_usuarios_autorizados cua ON cua.ceremonia_id = c.id
            WHERE cua.usuario_id = $1
            ORDER BY c.activa DESC, c.fecha DESC
          `, [usuario.id])
        : await query(`
            SELECT c.*, TRUE AS autorizado
            FROM ceremonias c
            ORDER BY c.activa DESC, c.fecha DESC
          `);

      return NextResponse.json(result.rows, { headers });
    }

    if (path === 'ceremonias') {
      const result = await query(`
        SELECT c.*,
          COUNT(DISTINCT e.id)::int AS total_egresados,
          COUNT(DISTINCT e.id) FILTER (WHERE e.invitacion_enviada)::int AS invitaciones_enviadas,
          COUNT(DISTINCT e.id) FILTER (WHERE e.estado = 'ACEPTADO')::int AS egresados_confirmados,
          COUNT(DISTINCT e.id) FILTER (WHERE e.invitacion_enviada AND COALESCE(e.estado, '') NOT IN ('ACEPTADO', 'RECHAZADO'))::int AS respuestas_pendientes,
          COUNT(DISTINCT e.id) FILTER (WHERE e.estado = 'RECHAZADO')::int AS egresados_rechazados,
          COUNT(DISTINCT e.id) FILTER (WHERE e.estado = 'ACEPTADO' AND e.estado_flujo = 'COMPLETO')::int AS grupos_completos,
          COUNT(DISTINCT e.id) FILTER (WHERE e.asiento_id IS NOT NULL)::int AS egresados_con_butaca,
          COUNT(i.id) FILTER (WHERE i.presente IS TRUE)::int AS asistencias,
          EXISTS(SELECT 1 FROM configuracion_anfiteatro ca WHERE ca.ceremonia_id = c.id) AS plano_configurado
        FROM ceremonias c
        LEFT JOIN egresados e ON e.ceremonia_id = c.id
        LEFT JOIN invitados i ON i.egresado_id = e.id
        GROUP BY c.id
        ORDER BY c.fecha DESC
      `);
      return NextResponse.json(result.rows, { headers });
    }

    if (path === 'ceremonias/activa') {
      const cached = obtenerCache('ceremonias:activa');
      if (cached) return NextResponse.json(cached, { headers });

      const result = await query('SELECT * FROM ceremonias WHERE activa = 1 LIMIT 1');
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'No hay ninguna ceremonia activa' }, { status: 404, headers });
      }
      guardarCache('ceremonias:activa', result.rows[0], 30);
      return NextResponse.json(result.rows[0], { headers });
    }

    if (slug[0] === 'ceremonias' && slug[2] === 'autorizados' && slug[1]) {
      const ceremoniaId = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query(
        'SELECT usuario_id FROM ceremonias_usuarios_autorizados WHERE ceremonia_id = $1',
        [ceremoniaId]
      );
      return NextResponse.json(result.rows.map((r: any) => r.usuario_id), { headers });
    }

    // -------------------------------------------------------------
    // PROFESORES
    // -------------------------------------------------------------
    if (path === 'profesores') {
      const cached = obtenerCache('profesores:activos');
      if (cached) return NextResponse.json(cached, { headers });

      const result = await query('SELECT * FROM profesores WHERE activo = 1 ORDER BY nombre');
      guardarCache('profesores:activos', result.rows, 60);
      return NextResponse.json(result.rows, { headers });
    }

    // -------------------------------------------------------------
    // ENTREGADORES
    // -------------------------------------------------------------
    if (slug[0] === 'entregadores' && slug[1] === 'graduado' && slug[2]) {
      const graduadoId = slug[2];
      const esAutorizado = await esAutorizadoPersonalOEgresado(req, graduadoId, ROLES_LECTURA);
      if (!esAutorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query(
        'SELECT * FROM entregadores WHERE egresado_id = $1 ORDER BY orden',
        [graduadoId]
      );
      return NextResponse.json(result.rows, { headers });
    }

    // -------------------------------------------------------------
    // USUARIOS
    // -------------------------------------------------------------
    if (path === 'usuarios') {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query(
        `SELECT u.id, u.nombre, u.email, u.rol, u.activo, u.ultimo_login, u.creado_en,
                COALESCE(array_agg(cua.ceremonia_id) FILTER (WHERE cua.ceremonia_id IS NOT NULL), '{}') AS "ceremoniasAutorizadas"
         FROM usuarios_sistema u
         LEFT JOIN ceremonias_usuarios_autorizados cua ON cua.usuario_id::text = u.id::text
         GROUP BY u.id, u.nombre, u.email, u.rol, u.activo, u.ultimo_login, u.creado_en
         ORDER BY u.creado_en DESC`
      );
      return NextResponse.json(result.rows, { headers });
    }

    // -------------------------------------------------------------
    // MANIFIESTO OFFLINE PARA PORTERÍA
    // -------------------------------------------------------------
    if (slug[0] === 'acreditacion' && slug[1] === 'manifiesto') {
      const isPersonal = await esPersonalValido(req, ROLES_OPERACION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const cerIdParam = slug[2];
      let ceremonia: any = null;
      if (cerIdParam) {
        const cRes = await query('SELECT id, nombre, fecha, lugar, activa FROM ceremonias WHERE id = $1', [cerIdParam]);
        ceremonia = cRes.rows[0];
      } else {
        const cRes = await query('SELECT id, nombre, fecha, lugar, activa FROM ceremonias WHERE activa = 1 LIMIT 1');
        ceremonia = cRes.rows[0];
      }

      if (!ceremonia) {
        return NextResponse.json({ error: 'No se encontró la ceremonia' }, { status: 404, headers });
      }

      const egresadosRes = await query(`
        SELECT id, nombre, dni, legajo, carrera, token, asiento_id, presente, fecha_presente, estado
        FROM egresados
        WHERE ceremonia_id = $1 AND estado = 'ACEPTADO'
        ORDER BY nombre ASC
      `, [ceremonia.id]);

      const invitadosRes = await query(`
        SELECT i.id, i.egresado_id, i.nombre, i.dni, i.asiento_id, i.presente, i.fecha_presente, i.menor_en_brazos
        FROM invitados i
        JOIN egresados e ON e.id = i.egresado_id
        WHERE e.ceremonia_id = $1 AND e.estado = 'ACEPTADO'
        ORDER BY i.nombre ASC
      `, [ceremonia.id]);

      const invitadosPorEgresado = new Map<string, any[]>();
      invitadosRes.rows.forEach(inv => {
        if (!invitadosPorEgresado.has(inv.egresado_id)) {
          invitadosPorEgresado.set(inv.egresado_id, []);
        }
        invitadosPorEgresado.get(inv.egresado_id)!.push(inv);
      });

      const egresadosConInvitados = egresadosRes.rows.map(egr => ({
        ...egr,
        invitados: invitadosPorEgresado.get(egr.id) || []
      }));

      return NextResponse.json({
        ceremoniaId: ceremonia.id,
        ceremoniaNombre: ceremonia.nombre,
        fechaDescarga: new Date().toISOString(),
        egresados: egresadosConInvitados
      }, { headers });
    }

    // -------------------------------------------------------------
    // EN ESTRADO (PROYECCIÓN EN VIVO)
    // -------------------------------------------------------------
    if (slug[0] === 'ceremonias' && slug[1] === 'en-estrado') {
      const cerId = slug[2] || 'activa';
      const enEstradoKey = `en_estrado:${cerId}`;
      const data = obtenerCache(enEstradoKey);
      return NextResponse.json(data || { enEstrado: null, timestamp: new Date().toISOString() }, { headers });
    }

    // -------------------------------------------------------------
    // REGISTRO DE AUDITORÍA (AUDIT LOG)
    // -------------------------------------------------------------
    if (path === 'auditoria') {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const url = new URL(req.url);
      const entidad = url.searchParams.get('entidad');
      const limite = Math.min(Number(url.searchParams.get('limite')) || 100, 500);

      let querySql = `
        SELECT id, usuario_id, usuario_correo, rol, accion, entidad, entidad_id, detalles, ip, creado_en
        FROM auditoria_sistema
      `;
      const paramsSql: any[] = [];

      if (entidad) {
        paramsSql.push(entidad);
        querySql += ` WHERE entidad = $${paramsSql.length}`;
      }

      querySql += ` ORDER BY creado_en DESC LIMIT ${limite}`;

      const resAudit = await query(querySql, paramsSql);
      return NextResponse.json(resAudit.rows, { headers });
    }

    if (path === 'dispositivos') {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query(`
        SELECT
          d.dispositivo_id AS "dispositivoId",
          d.usuario_id AS "usuarioId",
          u.nombre AS "usuarioNombre",
          u.email AS "usuarioEmail",
          d.marca,
          d.fabricante,
          d.modelo,
          d.nombre_dispositivo AS "nombreDispositivo",
          d.sistema,
          d.version_sistema AS "versionSistema",
          d.tipo_dispositivo AS "tipoDispositivo",
          d.version_app AS "versionApp",
          d.es_dispositivo_real AS "esDispositivoReal",
          d.ip_ultimo_acceso AS "ipUltimoAcceso",
          d.primera_conexion AS "primeraConexion",
          d.ultimo_acceso AS "ultimoAcceso",
          d.sesion_activa AS "sesionActiva",
          (d.sesion_activa = 1 AND d.ultimo_acceso >= CURRENT_TIMESTAMP - INTERVAL '5 minutes') AS "enLinea"
        FROM dispositivos_moviles d
        LEFT JOIN usuarios_sistema u ON u.id::text = d.usuario_id::text
        ORDER BY d.ultimo_acceso DESC
      `);
      return NextResponse.json(result.rows, { headers });
    }

    if (slug[0] === 'usuarios' && slug[2] === 'token' && slug[1]) {
      const userId = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query('SELECT * FROM usuarios_sistema WHERE id = $1', [userId]);
      const usuario = result.rows[0];
      if (!usuario) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404, headers });
      }
      
      const token = firmar({
        tipo: 'personal',
        id: usuario.id,
        rol: usuario.rol,
        nombre: usuario.nombre,
      }, 30 * 24 * 60 * 60);
      
      return NextResponse.json({ ok: true, token }, { headers });
    }

    // -------------------------------------------------------------
    // INVITADOS
    // -------------------------------------------------------------
    if (path === 'invitados') {
      const isPersonal = await esPersonalValido(req, ROLES_LECTURA);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const ceremoniaId = req.nextUrl.searchParams.get('ceremoniaId');
      const condicionCeremonia = ceremoniaId ? 'c.id = $1' : 'c.activa = 1';

      const queryStr = `
        SELECT i.*, e.nombre as "egresadoNombre", e.legajo as "egresadoLegajo"
        FROM invitados i
        JOIN egresados e ON i.egresado_id = e.id
        JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE ${condicionCeremonia}
        ORDER BY i.creado_en DESC
      `;
      const result = await query(queryStr, ceremoniaId ? [ceremoniaId] : []);
      return NextResponse.json(result.rows, { headers });
    }

    if (slug[0] === 'invitados' && slug[1] === 'buscar' && slug[2]) {
      const isPersonal = await esPersonalValido(req, ROLES_OPERACION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const codigoRaw = slug.slice(2).join('/');
      let codigoDecodificado = codigoRaw;
      try {
        codigoDecodificado = decodeURIComponent(codigoRaw);
      } catch {
        codigoDecodificado = codigoRaw;
      }

      const parsed = parsearCodigoAcreditacion(codigoDecodificado);
      const valor = parsed.codigoLimpio || codigoDecodificado;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // 1. Si coincide con UUID de un invitado individual
      if (uuidRegex.test(valor)) {
        const invRes = await query(`
          SELECT i.*, e.nombre as "egresadoNombre", e.dni as "egresadoDni", e.carrera as "egresadoCarrera",
                 e.asiento_id as "egresadoAsiento",
                 c.id as "ceremoniaId", c.nombre as "ceremoniaNombre", c.activa as "ceremoniaActiva"
          FROM invitados i 
          JOIN egresados e ON i.egresado_id = e.id 
          JOIN ceremonias c ON e.ceremonia_id = c.id
          WHERE i.id = $1
        `, [valor]);

        if (invRes.rows.length > 0) {
          const inv = invRes.rows[0];
          const egrRes = await query('SELECT * FROM egresados WHERE id = $1', [inv.egresado_id]);
          const invsRes = await query('SELECT * FROM invitados WHERE egresado_id = $1 ORDER BY nombre ASC', [inv.egresado_id]);
          return NextResponse.json({
            tipo: 'individual',
            datos: inv,
            invitado: inv,
            egresado: egrRes.rows[0] || null,
            egresadoNombre: inv.egresadoNombre,
            invitadosGrupo: invsRes.rows,
            ceremonia: { id: inv.ceremoniaId, nombre: inv.ceremoniaNombre, activa: inv.ceremoniaActiva }
          }, { headers });
        }
      }

      // 2. Búsqueda de egresado por Token, ID (UUID), DNI, Legajo o Google Wallet
      const egrRes = await query(`
        SELECT e.*, c.nombre as "ceremoniaNombre", c.activa as "ceremoniaActiva", c.fecha as "ceremoniaFecha", c.lugar as "ceremoniaLugar"
        FROM egresados e
        JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE UPPER(e.token) = UPPER($1)
           OR e.id::text = $1
           OR e.dni = $1
           OR UPPER(e.legajo) = UPPER($1)
           OR e.google_wallet_object_id = $1
           OR e.google_wallet_object_id LIKE '%' || $1
        ORDER BY c.activa DESC, e.creado_en DESC
        LIMIT 1
      `, [valor]);

      if (egrRes.rows.length > 0) {
        const egr = egrRes.rows[0];
        const invs = await query('SELECT * FROM invitados WHERE egresado_id = $1 ORDER BY nombre ASC', [egr.id]);
        return NextResponse.json({
          tipo: 'grupo',
          egresado: egr,
          invitados: invs.rows,
          ceremonia: {
            id: egr.ceremonia_id,
            nombre: egr.ceremoniaNombre,
            activa: egr.ceremoniaActiva,
            fecha: egr.ceremoniaFecha,
            lugar: egr.ceremoniaLugar
          }
        }, { headers });
      }

      // 3. Buscar si el código o DNI pertenece a un invitado registrado
      const invDniRes = await query(`
        SELECT i.*, e.nombre as "egresadoNombre", e.dni as "egresadoDni", e.carrera as "egresadoCarrera",
               c.id as "ceremoniaId", c.nombre as "ceremoniaNombre", c.activa as "ceremoniaActiva"
        FROM invitados i
        JOIN egresados e ON i.egresado_id = e.id
        JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE i.id::text = $1 OR i.dni = $1
        ORDER BY c.activa DESC
        LIMIT 1
      `, [valor]);

      if (invDniRes.rows.length > 0) {
        const inv = invDniRes.rows[0];
        const egr = await query('SELECT * FROM egresados WHERE id = $1', [inv.egresado_id]);
        const invs = await query('SELECT * FROM invitados WHERE egresado_id = $1 ORDER BY nombre ASC', [inv.egresado_id]);
        return NextResponse.json({
          tipo: 'individual',
          datos: inv,
          invitado: inv,
          egresado: egr.rows[0] || null,
          egresadoNombre: inv.egresadoNombre,
          invitadosGrupo: invs.rows,
          ceremonia: { id: inv.ceremoniaId, nombre: inv.ceremoniaNombre, activa: inv.ceremoniaActiva }
        }, { headers });
      }

      return NextResponse.json({ error: 'Credencial o código no encontrado para esta ceremonia' }, { status: 404, headers });
    }

    if (slug[0] === 'invitados' && slug[1] === 'egresado' && slug[2]) {
      const egresadoId = slug[2];
      const esAutorizado = await esAutorizadoPersonalOEgresado(req, egresadoId, ROLES_LECTURA);
      if (!esAutorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query('SELECT * FROM invitados WHERE egresado_id = $1', [egresadoId]);
      return NextResponse.json(result.rows, { headers });
    }

    // -------------------------------------------------------------
    // ASISTENCIA OPERATIVA (GRADUADOS + INVITADOS)
    // -------------------------------------------------------------
    if (path === 'asistencia') {
      const isPersonal = await esPersonalValido(req, ROLES_LECTURA);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query(`
        SELECT
          e.id,
          e.nombre,
          e.dni,
          e.legajo,
          e.carrera,
          e.asiento_id,
          COALESCE(e.presente, FALSE) AS presente,
          e.fecha_presente,
          COUNT(i.id)::int AS total_invitados,
          COUNT(i.id) FILTER (WHERE i.presente IS TRUE)::int AS invitados_presentes,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', i.id,
                'nombre', i.nombre,
                'dni', i.dni,
                'relacion', i.relacion,
                'presente', i.presente,
                'fecha_presente', i.fecha_presente,
                'discapacidad', i.discapacidad
              ) ORDER BY i.nombre
            ) FILTER (WHERE i.id IS NOT NULL),
            '[]'::json
          ) AS invitados
        FROM egresados e
        JOIN ceremonias c ON c.id = e.ceremonia_id
        LEFT JOIN invitados i ON i.egresado_id = e.id
        WHERE c.activa = 1
        GROUP BY e.id
        ORDER BY e.nombre ASC
      `);
      return NextResponse.json(result.rows, { headers });
    }

    // -------------------------------------------------------------
    // EGRESADOS
    // -------------------------------------------------------------
    if (path === 'egresados/historial') {
      const isPersonal = await esPersonalValido(req, ROLES_LECTURA);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const termino = String(req.nextUrl.searchParams.get('q') || '').trim();
      if (termino.length < 2) return NextResponse.json([], { headers });

      const dni = termino.replace(/\D/g, '');
      const esDni = dni.length >= 7;
      const condicion = esDni
        ? "REGEXP_REPLACE(COALESCE(e.dni, ''), '[^0-9]', '', 'g') = $1"
        : "(e.nombre ILIKE $1 OR e.legajo ILIKE $1 OR e.correo ILIKE $1)";
      const valor = esDni ? dni : `%${termino}%`;

      const result = await query(`
        SELECT e.id, e.nombre, e.dni, e.legajo, e.correo, e.carrera, e.estado,
               e.estado_flujo, e.ceremonia_id, c.nombre AS ceremonia_nombre,
               c.fecha AS ceremonia_fecha, c.lugar AS ceremonia_lugar, c.activa AS ceremonia_activa
        FROM egresados e
        LEFT JOIN ceremonias c ON c.id = e.ceremonia_id
        WHERE ${condicion}
        ORDER BY c.fecha DESC NULLS LAST, e.nombre ASC
        LIMIT 60
      `, [valor]);

      return NextResponse.json(result.rows, { headers });
    }

    if (slug[0] === 'egresados' && slug[1] === 'coincidencias-dni' && slug[2]) {
      const isPersonal = await esPersonalValido(req, ROLES_LECTURA);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const dniLimpio = String(slug[2]).replace(/\D/g, '');
      if (dniLimpio.length < 7) {
        return NextResponse.json({ error: 'Ingresá un DNI válido' }, { status: 400, headers });
      }

      const coincidencias = await query(`
        SELECT e.id, e.nombre, e.dni, e.correo, e.legajo, e.carrera,
               e.anio_inscripcion, e.promedio, e.estado,
               c.id AS ceremonia_id, c.nombre AS ceremonia_nombre,
               c.fecha AS ceremonia_fecha, c.lugar AS ceremonia_lugar,
               c.activa AS ceremonia_activa
        FROM egresados e
        LEFT JOIN ceremonias c ON c.id = e.ceremonia_id
        WHERE REGEXP_REPLACE(COALESCE(e.dni, ''), '[^0-9]', '', 'g') = $1
        ORDER BY c.fecha DESC NULLS LAST, e.id DESC
      `, [dniLimpio]);

      return NextResponse.json({
        existe: coincidencias.rows.length > 0,
        coincidencias: coincidencias.rows
      }, { headers });
    }

    if (path === 'egresados') {
      const isPersonal = await esPersonalValido(req, ROLES_LECTURA);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const ceremoniaId = req.nextUrl.searchParams.get('ceremoniaId');
      const condicionCeremonia = ceremoniaId ? 'c.id = $1' : 'c.activa = 1';

      const queryStr = `
        SELECT 
          e.*, 
          c.nombre as "ceremoniaNombre", 
          c.max_entregadores,
          COALESCE(inv.total_invitados, 0)::int AS cantidad_invitados,
          COALESCE(ent.total_entregadores, 0)::int AS cantidad_entregadores
        FROM egresados e
        LEFT JOIN ceremonias c ON e.ceremonia_id = c.id
        LEFT JOIN (
          SELECT egresado_id, COUNT(*)::int AS total_invitados 
          FROM invitados 
          GROUP BY egresado_id
        ) inv ON inv.egresado_id = e.id
        LEFT JOIN (
          SELECT egresado_id, COUNT(*)::int AS total_entregadores 
          FROM entregadores 
          GROUP BY egresado_id
        ) ent ON ent.egresado_id = e.id
        WHERE ${condicionCeremonia}
        ORDER BY e.nombre
      `;
      const result = await query(queryStr, ceremoniaId ? [ceremoniaId] : []);
      return NextResponse.json(result.rows, { headers });
    }

    if (slug[0] === 'egresados' && slug[1] === 'token' && slug[2]) {
      const token = slug[2];
      const result = await query(`
        SELECT e.*, c.nombre AS ceremonia_nombre, c.fecha AS ceremonia_fecha, c.lugar AS ceremonia_lugar, c.activa AS ceremonia_activa
        FROM egresados e
        JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE UPPER(e.token) = UPPER($1) AND c.activa = 1
      `, [token]);
      
      const graduado = result.rows[0];
      if (!graduado) {
        return NextResponse.json({ error: 'El código de acceso es incorrecto o no pertenece al hábitat activo' }, { status: 404, headers });
      }
      
      const tokenSesion = firmar({
        tipo: 'egresado',
        id: graduado.id,
        nombre: graduado.nombre
      }, 4 * 60 * 60);

      return NextResponse.json({
        ok: true,
        egresado: graduado,
        token_sesion: tokenSesion
      }, { headers });
    }

    if (slug[0] === 'egresados' && slug[1] && !slug[2]) {
      const id = slug[1];
      const esAutorizado = await esAutorizadoPersonalOEgresado(req, id, ROLES_LECTURA);
      if (!esAutorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query(`
        SELECT e.*, c.nombre AS ceremonia_nombre, c.fecha AS ceremonia_fecha, c.lugar AS ceremonia_lugar, c.activa AS ceremonia_activa
        FROM egresados e
        LEFT JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE e.id = $1
      `, [id]);
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Graduado no encontrado' }, { status: 404, headers });
      }
      return NextResponse.json(result.rows[0], { headers });
    }

    // Fallback: 404 para GET
    return NextResponse.json({ error: `Ruta GET '${path}' no encontrada` }, { status: 404, headers });

  } catch (error: any) {
    console.error(`Error en GET /api/${path}:`, error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500, headers });
  }
}

// MAIN HANDLER FOR POST REQUESTS
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  await asegurarInicializacion();
  const { slug } = await params;
  const headers = corsHeaders(req);
  const path = slug.join('/');
  
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    // Ignorar si el cuerpo está vacío o no es JSON
  }

  try {
    if (path === 'dispositivos/registrar') {
      const auth = obtenerUsuarioAutenticado(req, ROLES_LECTURA);
      if (!auth.valido || auth.datos?.tipo !== 'personal') {
        return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: auth.statusCode || 403, headers });
      }

      const limpiar = (valor: unknown, maximo: number) => valor == null ? null : String(valor).trim().slice(0, maximo);
      const dispositivoId = limpiar(body.dispositivoId, 100);
      if (!dispositivoId) {
        return NextResponse.json({ error: 'El identificador del dispositivo es obligatorio' }, { status: 400, headers });
      }
      const ip = limpiar(req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'), 120);
      const agente = limpiar(req.headers.get('user-agent'), 300);

      await query(`
        INSERT INTO dispositivos_moviles (
          dispositivo_id, usuario_id, marca, fabricante, modelo, nombre_dispositivo,
          sistema, version_sistema, tipo_dispositivo, version_app, es_dispositivo_real,
          ip_ultimo_acceso, agente_usuario, primera_conexion, ultimo_acceso, sesion_activa
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,1)
        ON CONFLICT (dispositivo_id) DO UPDATE SET
          usuario_id = EXCLUDED.usuario_id,
          marca = EXCLUDED.marca,
          fabricante = EXCLUDED.fabricante,
          modelo = EXCLUDED.modelo,
          nombre_dispositivo = EXCLUDED.nombre_dispositivo,
          sistema = EXCLUDED.sistema,
          version_sistema = EXCLUDED.version_sistema,
          tipo_dispositivo = EXCLUDED.tipo_dispositivo,
          version_app = EXCLUDED.version_app,
          es_dispositivo_real = EXCLUDED.es_dispositivo_real,
          ip_ultimo_acceso = EXCLUDED.ip_ultimo_acceso,
          agente_usuario = EXCLUDED.agente_usuario,
          ultimo_acceso = CURRENT_TIMESTAMP,
          sesion_activa = 1
      `, [
        dispositivoId, String(auth.datos.id), limpiar(body.marca, 100), limpiar(body.fabricante, 120),
        limpiar(body.modelo, 160), limpiar(body.nombreDispositivo, 160), limpiar(body.sistema, 80),
        limpiar(body.versionSistema, 80), limpiar(body.tipoDispositivo, 40), limpiar(body.versionApp, 40),
        body.esDispositivoReal === false ? 0 : 1, ip, agente
      ]);

      return NextResponse.json({ ok: true, dispositivoId, registrado: true }, { headers });
    }

    // -------------------------------------------------------------
    // SINCRONIZACIÓN EN LOTE (OFFLINE ACREDITACIÓN)
    // -------------------------------------------------------------
    if (path === 'acreditacion/sincronizar-lote') {
      const isPersonal = await esPersonalValido(req, ROLES_OPERACION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const items = Array.isArray(body.items) ? body.items : [];
      let procesados = 0;

      for (const item of items) {
        const { egresadoId, invitadoIds, acreditarEgresado, timestamp } = item;
        const fechaValida = timestamp || new Date().toISOString();

        if (acreditarEgresado && egresadoId) {
          await query(
            'UPDATE egresados SET presente = TRUE, fecha_presente = COALESCE(fecha_presente, $1) WHERE id = $2',
            [fechaValida, egresadoId]
          );
        }

        if (Array.isArray(invitadoIds) && invitadoIds.length > 0) {
          await query(
            'UPDATE invitados SET presente = TRUE, fecha_presente = COALESCE(fecha_presente, $1) WHERE id = ANY($2::text[])',
            [fechaValida, invitadoIds]
          );
        }
        procesados++;
      }

      return NextResponse.json({ ok: true, procesados, mensaje: `${procesados} acreditaciones sincronizadas` }, { headers });
    }

    // -------------------------------------------------------------
    // ACTUALIZAR GRADUADO EN ESTRADO (PROYECCIÓN EN VIVO)
    // -------------------------------------------------------------
    if (path === 'ceremonias/en-estrado') {
      const isPersonal = await esPersonalValido(req, ROLES_OPERACION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { ceremoniaId, graduado } = body;
      const enEstradoKey = `en_estrado:${ceremoniaId || 'activa'}`;
      guardarCache(enEstradoKey, { enEstrado: graduado || null, timestamp: new Date().toISOString() }, 3600);
      return NextResponse.json({ ok: true, graduado }, { headers });
    }

    if (path === 'dispositivos/desvincular') {
      const auth = obtenerUsuarioAutenticado(req, ROLES_LECTURA);
      if (!auth.valido || auth.datos?.tipo !== 'personal') {
        return NextResponse.json({ error: auth.error || 'No autorizado' }, { status: auth.statusCode || 403, headers });
      }
      const dispositivoId = String(body.dispositivoId || '').trim().slice(0, 100);
      await query(
        `UPDATE dispositivos_moviles
         SET sesion_activa = 0, ultimo_acceso = CURRENT_TIMESTAMP
         WHERE dispositivo_id = $1 AND usuario_id = $2`,
        [dispositivoId, String(auth.datos.id)]
      );
      return NextResponse.json({ ok: true }, { headers });
    }

    if (path === 'dispositivos/desvincular-admin') {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const dispositivoId = String(body.dispositivoId || '').trim().slice(0, 100);
      if (!dispositivoId) {
        return NextResponse.json({ error: 'ID de dispositivo requerido' }, { status: 400, headers });
      }

      await query(
        `UPDATE dispositivos_moviles
         SET sesion_activa = 0, ultimo_acceso = CURRENT_TIMESTAMP
         WHERE dispositivo_id = $1`,
        [dispositivoId]
      );
      return NextResponse.json({ ok: true, mensaje: 'Dispositivo desconectado correctamente' }, { headers });
    }

    // -------------------------------------------------------------
    // SETUP INITIALIZE
    // -------------------------------------------------------------
    if (path === 'setup/initialize') {
      const {
        nombre,
        email,
        password,
        nombreEvento = 'Ceremonia de Colación',
        fechaEvento = '2026-08-27',
        lugarEvento = 'Auditorio Central Beltrán',
      } = body;

      if (!nombre || !email || !password) {
        return NextResponse.json({ error: 'Nombre, email y contraseña son obligatorios' }, { status: 400, headers });
      }
      if (String(password).length < LARGO_MINIMO_PASSWORD) {
        return NextResponse.json({ error: `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres` }, { status: 400, headers });
      }

      const usuarios = await query('SELECT COUNT(*)::int AS total FROM usuarios_sistema');
      if (parseInt(usuarios.rows[0]?.total ?? '0', 10) > 0) {
        return NextResponse.json({ error: 'El sistema ya fue inicializado' }, { status: 409, headers });
      }

      const hash = await bcrypt.hash(password, RONDAS_BCRYPT);
      const usuarioId = crypto.randomUUID();
      const ceremoniaId = crypto.randomUUID();

      await query(
        `INSERT INTO usuarios_sistema (id, nombre, email, password_hash, rol, activo)
         VALUES ($1, $2, $3, $4, 'SUPER_ADMIN', 1)`,
        [usuarioId, nombre, email.toLowerCase(), hash]
      );

      await query(
        `INSERT INTO ceremonias (id, nombre, fecha, lugar, max_invitados, max_entregadores, activa)
         VALUES ($1, $2, $3, $4, 4, 3, 1)`,
        [ceremoniaId, nombreEvento, fechaEvento, lugarEvento]
      );

      await query(
        `INSERT INTO configuracion_sistema (clave, valor, descripcion, actualizado_en)
         VALUES ('setup_inicial_completado', '1', 'Indica si el asistente inicial ya fue completado', CURRENT_TIMESTAMP)
         ON CONFLICT (clave)
         DO UPDATE SET valor = '1', descripcion = EXCLUDED.descripcion, actualizado_en = CURRENT_TIMESTAMP`
      );

      return NextResponse.json({
        ok: true,
        mensaje: 'Configuración inicial creada correctamente',
        usuario: { id: usuarioId, nombre, email: email.toLowerCase(), rol: 'SUPER_ADMIN' },
        ceremonia: { id: ceremoniaId, nombre: nombreEvento, fecha: fechaEvento, lugar: lugarEvento },
      }, { headers });
    }

    // -------------------------------------------------------------
    // SETUP RESET (RESET SYSTEM DATA)
    // -------------------------------------------------------------
    if (path === 'setup/reset') {
      const auth = obtenerUsuarioAutenticado(req);
      if (!auth.valido || auth.datos?.rol !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado. Solo una cuenta SUPER_ADMIN puede resetear el sistema.' },
          { status: 403, headers }
        );
      }

      // Conservamos el equipo administrativo: el reinicio prepara una nueva
      // ceremonia sin obligar a recrear las cuentas que gestionan SiGIC.
      const tables = [
        'ceremonias_usuarios_autorizados',
        'tokens_recuperacion_contrasena',
        'otp_historial',
        'invitados',
        'egresados',
        'profesores',
        'entregadores',
        'configuracion_anfiteatro',
        'logs_auditoria',
        'dispositivos_moviles',
        'ceremonias',
      ];
      for (const t of tables) {
        await query(`DELETE FROM ${t}`).catch((e) => {
          console.error(`Error al limpiar tabla ${t}:`, e);
        });
      }

      // Reiniciar flag de setup_inicial_completado a '0'
      await query(
        `INSERT INTO configuracion_sistema (clave, valor, descripcion, actualizado_en)
         VALUES ('setup_inicial_completado', '0', 'Indica si el asistente inicial ya fue completado', CURRENT_TIMESTAMP)
         ON CONFLICT (clave)
         DO UPDATE SET valor = '0', actualizado_en = CURRENT_TIMESTAMP`
      );

      return NextResponse.json(
        { ok: true, mensaje: 'Sistema reseteado correctamente. Redirigiendo a la configuración inicial.' },
        { headers }
      );
    }


    // -------------------------------------------------------------
    // CONFIG ANFITEATRO
    // -------------------------------------------------------------
    if (slug[0] === 'configuracion' && slug[1] === 'anfiteatro' && slug[2] === 'estructura' && slug[3]) {
      const ceremoniaId = slug[3];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { estructura, mapaRoles, usuarioId } = body;
      await query(
        'INSERT INTO configuracion_anfiteatro (ceremonia_id, estructura, mapa_roles, modificado_por) VALUES ($1, $2, $3, $4)',
        [ceremoniaId, JSON.stringify(estructura), JSON.stringify(mapaRoles), usuarioId]
      );
      return NextResponse.json({ ok: true, mensaje: 'Estructura del anfiteatro actualizada' }, { headers });
    }

    if (path === 'anfiteatro/config') {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { estructura, mapaRoles } = body;
      if (!estructura || !mapaRoles) {
        return NextResponse.json({ error: 'Formato de configuración inválido' }, { status: 400, headers });
      }

      const ceremoniaActiva = await query('SELECT id FROM ceremonias WHERE activa = 1 LIMIT 1');
      const ceremoniaId = ceremoniaActiva.rows[0]?.id;
      if (!ceremoniaId) return NextResponse.json({ error: 'No hay una ceremonia activa' }, { status: 409, headers });
      await query(
        'INSERT INTO configuracion_anfiteatro (ceremonia_id, estructura, mapa_roles, actualizado_en) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [ceremoniaId, estructura, mapaRoles]
      );
      return NextResponse.json({ mensaje: 'Configuración guardada con éxito en la base de datos' }, { headers });
    }

    // AUTO-ASIGNACIÓN INTELIGENTE DE SALA
    if (path === 'anfiteatro/auto-asignar') {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const ceremoniaRes = await query('SELECT id FROM ceremonias WHERE activa = 1 LIMIT 1');
      const ceremoniaId = body?.ceremoniaId || ceremoniaRes.rows[0]?.id;
      if (!ceremoniaId) return NextResponse.json({ error: 'No hay ceremonia activa' }, { status: 400, headers });

      const planoRes = await query(
        'SELECT estructura, mapa_roles FROM configuracion_anfiteatro WHERE ceremonia_id = $1 ORDER BY actualizado_en DESC LIMIT 1',
        [ceremoniaId]
      );
      if (!planoRes.rows[0]) return NextResponse.json({ error: 'El plano del anfiteatro no está configurado' }, { status: 400, headers });

      const estructura = typeof planoRes.rows[0].estructura === 'string' ? JSON.parse(planoRes.rows[0].estructura) : planoRes.rows[0].estructura;
      const mapaRoles = typeof planoRes.rows[0].mapa_roles === 'string' ? JSON.parse(planoRes.rows[0].mapa_roles) : planoRes.rows[0].mapa_roles;

      const egresadosRes = await query(
        `SELECT e.id, e.nombre, e.carrera, e.formula_juramento,
                (SELECT json_agg(json_build_object('id', i.id, 'nombre', i.nombre, 'discapacidad', i.discapacidad, 'menor_en_brazos', i.menor_en_brazos))
                 FROM invitados i WHERE i.egresado_id = e.id) as invitados
         FROM egresados e
         WHERE e.ceremonia_id = $1 AND e.estado = 'ACEPTADO'
         ORDER BY e.carrera ASC, e.nombre ASC`,
        [ceremoniaId]
      );

      const egresados = egresadosRes.rows;
      if (egresados.length === 0) {
        return NextResponse.json({ error: 'No hay graduados en estado ACEPTADO para ubicar.' }, { status: 400, headers });
      }

      const asientosGraduados: string[] = [];
      const asientosAccesibles: string[] = [];
      const asientosGenerales: string[] = [];

      const filas = estructura?.filas || [];
      for (const fila of filas) {
        const idFila = fila.id || fila.letra;
        const columnas = fila.columnas || [];
        for (let col = 1; col <= columnas.length; col++) {
          const asientoId = `${idFila}-${col}`;
          const rol = mapaRoles?.[asientoId];
          if (['bloqueado', 'autoridad', 'reservado', 'pasillo'].includes(rol)) continue;
          
          if (rol === 'graduado') {
            asientosGraduados.push(asientoId);
          } else if (rol === 'accesible' || rol === 'discapacidad') {
            asientosAccesibles.push(asientoId);
          } else {
            asientosGenerales.push(asientoId);
          }
        }
      }

      let poolGraduados = [...asientosGraduados];
      let poolGenerales = [...asientosGenerales];
      let poolAccesibles = [...asientosAccesibles];

      if (poolGraduados.length === 0) {
        poolGraduados = poolGenerales.splice(0, Math.min(egresados.length + 10, poolGenerales.length));
      }

      const client = await pool.connect();
      let asignadosEgresados = 0;
      let asignadosInvitados = 0;

      try {
        await client.query('BEGIN');

        for (const eg of egresados) {
          let asientoEg: string | null = null;
          if (poolGraduados.length > 0) {
            asientoEg = poolGraduados.shift()!;
          } else if (poolGenerales.length > 0) {
            asientoEg = poolGenerales.shift()!;
          }

          if (asientoEg) {
            await client.query(
              `UPDATE egresados SET asiento_id = $1, estado_asignacion_butacas = 'CONFIRMADA', asiento_solicitado_id = NULL WHERE id = $2`,
              [asientoEg, eg.id]
            );
            asignadosEgresados++;
          }

          const invs = eg.invitados || [];
          for (const inv of invs) {
            if (inv.menor_en_brazos) {
              await client.query(`UPDATE invitados SET asiento_id = NULL, asiento_solicitado_id = NULL WHERE id = $1`, [inv.id]);
              continue;
            }

            let asientoInv: string | null = null;
            if (inv.discapacidad && poolAccesibles.length > 0) {
              asientoInv = poolAccesibles.shift()!;
            } else if (poolGenerales.length > 0) {
              asientoInv = poolGenerales.shift()!;
            } else if (poolGraduados.length > 0) {
              asientoInv = poolGraduados.shift()!;
            }

            if (asientoInv) {
              await client.query(
                `UPDATE invitados SET asiento_id = $1, asiento_solicitado_id = NULL WHERE id = $2`,
                [asientoInv, inv.id]
              );
              asignadosInvitados++;
            }
          }
        }

        await client.query('COMMIT');
        return NextResponse.json({
          ok: true,
          mensaje: `Distribución inteligente completada: ${asignadosEgresados} graduados y ${asignadosInvitados} acompañantes ubicados en el auditorio.`,
          asignadosEgresados,
          asignadosInvitados
        }, { headers });
      } catch (err: any) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Error al ejecutar la distribución de butacas', detalle: err.message }, { status: 500, headers });
      } finally {
        client.release();
      }
    }

    // -------------------------------------------------------------
    // CEREMONIAS
    // -------------------------------------------------------------
    if (path === 'ceremonias') {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { nombre, fecha, lugar, max_invitados, max_entregadores, fecha_limite_confirmacion, fecha_limite_respuesta } = body;
      if (!nombre || !fecha) {
        return NextResponse.json({ error: 'El nombre y la fecha son obligatorios' }, { status: 400, headers });
      }

      const id = `cer-${Date.now()}`;
      const limite = fecha_limite_confirmacion || fecha_limite_respuesta || null;
      await query(
        'INSERT INTO ceremonias (id, nombre, fecha, lugar, max_invitados, max_entregadores, fecha_limite_confirmacion, activa) VALUES ($1, $2, $3, $4, $5, $6, $7, 0)',
        [id, nombre, fecha, lugar || 'Sede Beltrán', max_invitados || 4, max_entregadores || 3, limite]
      );

      return NextResponse.json({ ok: true, mensaje: 'Ceremonia creada con éxito', id }, { status: 201, headers });
    }

    // -------------------------------------------------------------
    // PROFESORES
    // -------------------------------------------------------------
    if (path === 'profesores') {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { nombre, dni, materia } = body;
      if (!nombre) {
        return NextResponse.json({ error: 'El nombre del profesor es obligatorio' }, { status: 400, headers });
      }

      const result = await query(
        'INSERT INTO profesores (nombre, dni, materia) VALUES ($1, $2, $3) RETURNING *',
        [nombre.trim(), dni ? dni.trim() : null, materia ? materia.trim() : null]
      );
      return NextResponse.json(result.rows[0], { status: 201, headers });
    }

    // -------------------------------------------------------------
    // ENTREGADORES
    // -------------------------------------------------------------
    if (path === 'entregadores') {
      const egresado_id = body.egresado_id;
      const esAutorizado = await esAutorizadoPersonalOEgresado(req, egresado_id);
      if (!esAutorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { tipo, profesor_id, invitado_id, nombre, orden } = body;
      if (!egresado_id || !tipo || !nombre) {
        return NextResponse.json({ error: 'egresado_id, tipo y nombre son obligatorios' }, { status: 400, headers });
      }
      if (!['PROFESOR', 'FAMILIAR'].includes(tipo)) {
        return NextResponse.json({ error: 'El tipo debe ser PROFESOR o FAMILIAR' }, { status: 400, headers });
      }

      const limiteRes = await query(
        `SELECT c.max_entregadores 
         FROM ceremonias c 
         JOIN egresados e ON e.ceremonia_id = c.id 
         WHERE e.id = $1`,
        [egresado_id]
      );

      if (limiteRes.rowCount === 0) {
        return NextResponse.json({ error: 'No se encontró la ceremonia del graduado' }, { status: 404, headers });
      }

      const maxEntregadores = limiteRes.rows[0].max_entregadores || 3;
      const entregadoresRes = await query('SELECT id, orden, profesor_id, invitado_id FROM entregadores WHERE egresado_id = $1 ORDER BY orden ASC', [egresado_id]);
      const entregadoresExistentes = entregadoresRes.rows;

      if (entregadoresExistentes.length >= maxEntregadores) {
        return NextResponse.json({ error: `El graduado ya tiene el máximo de entregadores permitidos (${maxEntregadores})` }, { status: 400, headers });
      }

      const esUUID = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      const profId = esUUID(profesor_id) ? profesor_id : null;
      const invId = esUUID(invitado_id) ? invitado_id : null;

      if (profId && entregadoresExistentes.some((e: any) => e.profesor_id === profId)) {
        return NextResponse.json({ error: 'Este profesor ya fue seleccionado como padrino' }, { status: 400, headers });
      }
      if (invId && entregadoresExistentes.some((e: any) => e.invitado_id === invId)) {
        return NextResponse.json({ error: 'Este acompañante ya fue seleccionado como padrino' }, { status: 400, headers });
      }

      const ordenesOcupados = new Set(entregadoresExistentes.map((e: any) => Number(e.orden)));
      let ordenFinal: number | null = orden ? Number(orden) : null;
      if (!ordenFinal || ordenesOcupados.has(ordenFinal)) {
        for (let i = 1; i <= maxEntregadores + 5; i++) {
          if (!ordenesOcupados.has(i)) {
            ordenFinal = i;
            break;
          }
        }
      }
      if (!ordenFinal) ordenFinal = (Math.max(0, ...Array.from(ordenesOcupados)) + 1);

      try {
        // Eliminar cualquier colisión previa en ese slot de orden si existiese
        await query('DELETE FROM entregadores WHERE egresado_id = $1 AND orden = $2', [egresado_id, ordenFinal]);

        const result = await query(
          `INSERT INTO entregadores (egresado_id, tipo, profesor_id, invitado_id, nombre, orden) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [egresado_id, tipo, profId, invId, nombre.trim(), ordenFinal]
        );
        return NextResponse.json(result.rows[0], { status: 201, headers });
      } catch (error: any) {
        console.error('Error insertando entregador:', error);
        return NextResponse.json({ error: error.message || 'Error al guardar entregador/padrino' }, { status: 500, headers });
      }
    }

    // -------------------------------------------------------------
    // USUARIOS
    // -------------------------------------------------------------
    if (path === 'usuarios') {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { nombre, email, password, rol, enviarInvitacion } = body;
      const rolNormalizado = (rol || '').toString().toUpperCase();

      if (!nombre || !email || !rolNormalizado) {
        return NextResponse.json({ error: 'Nombre, email y rol son obligatorios' }, { status: 400, headers });
      }
      if (!ROLES_VALIDOS.includes(rolNormalizado)) {
        return NextResponse.json({ error: 'Rol inválido' }, { status: 400, headers });
      }

      const claveFinal = password ? String(password) : crypto.randomBytes(24).toString('hex');
      if (password && String(password).length < LARGO_MINIMO_PASSWORD) {
        return NextResponse.json({ error: `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres` }, { status: 400, headers });
      }

      const existe = await query('SELECT id FROM usuarios_sistema WHERE email = $1', [email.toLowerCase()]);
      if (existe.rows.length > 0) {
        return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409, headers });
      }

      const hash = await bcrypt.hash(claveFinal, RONDAS_BCRYPT);
      const id = crypto.randomUUID();

      await query(
        `INSERT INTO usuarios_sistema (id, nombre, email, password_hash, rol, activo)
         VALUES ($1, $2, $3, $4, $5, 1)`,
        [id, nombre, email.toLowerCase(), hash, rolNormalizado]
      );

      if (rolNormalizado === 'PORTERIA') {
        const activeCer = await query('SELECT id FROM ceremonias WHERE activa = 1 LIMIT 1');
        if (activeCer.rows.length > 0) {
          await query(
            'INSERT INTO ceremonias_usuarios_autorizados (ceremonia_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [activeCer.rows[0].id, id]
          );
        }
      }

      let invitacionEnviada = false;
      if (enviarInvitacion || !password) {
        try {
          const token = crypto.randomBytes(32).toString('hex');
          const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
          const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'desconocida').split(',')[0].trim();
          await query(
            `INSERT INTO tokens_recuperacion_contrasena (usuario_id, token_hash, expira_en, solicitado_ip)
             VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '48 hours', $3)`,
            [id, tokenHash, ip]
          );
          const origen = obtenerOrigenPublico(req);
          const enlace = `${origen}/restablecer-contrasena?token=${token}`;
          await enviarCorreo(
            email.toLowerCase(),
            'Bienvenido/a al equipo SiGIC · Activá tu cuenta institucional',
            generarPlantillaInvitacionEquipo({
              nombre,
              email: email.toLowerCase(),
              rol: rolNormalizado,
              enlace,
              hostBase: origen
            })
          );
          invitacionEnviada = true;
        } catch (errEmail) {
          console.error('No se pudo enviar la invitación por correo:', errEmail);
        }
      }

      return NextResponse.json({ 
        ok: true, 
        invitacionEnviada,
        usuario: { id, nombre, email: email.toLowerCase(), rol: rolNormalizado, activo: 1 } 
      }, { headers });
    }

    if (slug[0] === 'usuarios' && slug[2] === 'enviar-invitacion' && slug[1]) {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const id = slug[1];
      const userRes = await query<{ id: string; nombre: string; email: string; rol: string }>(
        'SELECT id, nombre, email, rol FROM usuarios_sistema WHERE id = $1',
        [id]
      );
      const targetUser = userRes.rows[0];
      if (!targetUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404, headers });

      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'desconocida').split(',')[0].trim();
      
      await query('DELETE FROM tokens_recuperacion_contrasena WHERE usuario_id = $1 OR expira_en < CURRENT_TIMESTAMP', [targetUser.id]);
      await query(
        `INSERT INTO tokens_recuperacion_contrasena (usuario_id, token_hash, expira_en, solicitado_ip)
         VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '48 hours', $3)`,
        [targetUser.id, tokenHash, ip]
      );

      const origen = obtenerOrigenPublico(req);
      const enlace = `${origen}/restablecer-contrasena?token=${token}`;
      await enviarCorreo(
        targetUser.email,
        'Bienvenido/a al equipo SiGIC · Activá tu cuenta institucional',
        generarPlantillaInvitacionEquipo({
          nombre: targetUser.nombre,
          email: targetUser.email,
          rol: targetUser.rol,
          enlace,
          hostBase: origen
        })
      );

      return NextResponse.json({ ok: true, mensaje: `Enlace de activación enviado a ${targetUser.email}` }, { headers });
    }

    if (slug[0] === 'ceremonias' && slug[2] === 'autorizar-todos' && slug[1]) {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const ceremoniaId = slug[1];
      await query(
        `INSERT INTO ceremonias_usuarios_autorizados (ceremonia_id, usuario_id)
         SELECT $1, id FROM usuarios_sistema WHERE rol = 'PORTERIA' AND activo = 1
         ON CONFLICT (ceremonia_id, usuario_id) DO NOTHING`,
        [ceremoniaId]
      );
      return NextResponse.json({ ok: true, mensaje: 'Todo el personal activo ha sido autorizado en esta ceremonia' }, { headers });
    }

    if (slug[0] === 'ceremonias' && slug[2] === 'desautorizar-todos' && slug[1]) {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const ceremoniaId = slug[1];
      await query(
        'DELETE FROM ceremonias_usuarios_autorizados WHERE ceremonia_id = $1',
        [ceremoniaId]
      );
      return NextResponse.json({ ok: true, mensaje: 'Se revocaron los accesos de la ceremonia' }, { headers });
    }

    // -------------------------------------------------------------
    // INVITADOS
    // -------------------------------------------------------------
    if (path === 'invitados/buscar' || (slug[0] === 'invitados' && slug[1] === 'buscar')) {
      const isPersonal = await esPersonalValido(req, ROLES_OPERACION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const codigoRaw = String(body.codigo || '').trim();
      if (!codigoRaw) {
        return NextResponse.json({ error: 'Código de acreditación requerido' }, { status: 400, headers });
      }

      const parsed = parsearCodigoAcreditacion(codigoRaw);
      const valor = parsed.codigoLimpio || codigoRaw;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // 1. Si coincide con UUID de un invitado individual
      if (uuidRegex.test(valor)) {
        const invRes = await query(`
          SELECT i.*, e.nombre as "egresadoNombre", e.dni as "egresadoDni", e.carrera as "egresadoCarrera",
                 e.asiento_id as "egresadoAsiento",
                 c.id as "ceremoniaId", c.nombre as "ceremoniaNombre", c.activa as "ceremoniaActiva"
          FROM invitados i 
          JOIN egresados e ON i.egresado_id = e.id 
          JOIN ceremonias c ON e.ceremonia_id = c.id
          WHERE i.id = $1
        `, [valor]);

        if (invRes.rows.length > 0) {
          const inv = invRes.rows[0];
          const egrRes = await query('SELECT * FROM egresados WHERE id = $1', [inv.egresado_id]);
          const invsRes = await query('SELECT * FROM invitados WHERE egresado_id = $1 ORDER BY nombre ASC', [inv.egresado_id]);
          return NextResponse.json({
            tipo: 'individual',
            datos: inv,
            invitado: inv,
            egresado: egrRes.rows[0] || null,
            egresadoNombre: inv.egresadoNombre,
            invitadosGrupo: invsRes.rows,
            ceremonia: { id: inv.ceremoniaId, nombre: inv.ceremoniaNombre, activa: inv.ceremoniaActiva }
          }, { headers });
        }
      }

      // 2. Búsqueda de egresado por Token, ID (UUID), DNI, Legajo o Google Wallet
      const egrRes = await query(`
        SELECT e.*, c.nombre as "ceremoniaNombre", c.activa as "ceremoniaActiva", c.fecha as "ceremoniaFecha", c.lugar as "ceremoniaLugar"
        FROM egresados e
        JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE UPPER(e.token) = UPPER($1)
           OR e.id::text = $1
           OR e.dni = $1
           OR UPPER(e.legajo) = UPPER($1)
           OR e.google_wallet_object_id = $1
           OR e.google_wallet_object_id LIKE '%' || $1
        ORDER BY c.activa DESC, e.creado_en DESC
        LIMIT 1
      `, [valor]);

      if (egrRes.rows.length > 0) {
        const egr = egrRes.rows[0];
        const invs = await query('SELECT * FROM invitados WHERE egresado_id = $1 ORDER BY nombre ASC', [egr.id]);
        return NextResponse.json({
          tipo: 'grupo',
          egresado: egr,
          invitados: invs.rows,
          ceremonia: {
            id: egr.ceremonia_id,
            nombre: egr.ceremoniaNombre,
            activa: egr.ceremoniaActiva,
            fecha: egr.ceremoniaFecha,
            lugar: egr.ceremoniaLugar
          }
        }, { headers });
      }

      // 3. Buscar si el código o DNI pertenece a un invitado registrado
      const invDniRes = await query(`
        SELECT i.*, e.nombre as "egresadoNombre", e.dni as "egresadoDni", e.carrera as "egresadoCarrera",
               c.id as "ceremoniaId", c.nombre as "ceremoniaNombre", c.activa as "ceremoniaActiva"
        FROM invitados i
        JOIN egresados e ON i.egresado_id = e.id
        JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE i.id::text = $1 OR i.dni = $1
        ORDER BY c.activa DESC
        LIMIT 1
      `, [valor]);

      if (invDniRes.rows.length > 0) {
        const inv = invDniRes.rows[0];
        const egr = await query('SELECT * FROM egresados WHERE id = $1', [inv.egresado_id]);
        const invs = await query('SELECT * FROM invitados WHERE egresado_id = $1 ORDER BY nombre ASC', [inv.egresado_id]);
        return NextResponse.json({
          tipo: 'individual',
          datos: inv,
          invitado: inv,
          egresado: egr.rows[0] || null,
          egresadoNombre: inv.egresadoNombre,
          invitadosGrupo: invs.rows,
          ceremonia: { id: inv.ceremoniaId, nombre: inv.ceremoniaNombre, activa: inv.ceremoniaActiva }
        }, { headers });
      }

      return NextResponse.json({ error: 'Credencial o código no encontrado para esta ceremonia' }, { status: 404, headers });
    }

    if (path === 'invitados') {
      const { token, egresadoId, invitados: nuevos } = body;

      if ((!token && !egresadoId) || !Array.isArray(nuevos) || nuevos.length === 0) {
        return NextResponse.json({ error: 'Datos obligatorios faltantes' }, { status: 400, headers });
      }

      // Check permissions
      if (!token) {
        const esAutorizado = await esAutorizadoPersonalOEgresado(req, egresadoId, ROLES_GESTION);
        if (!esAutorizado) return NextResponse.json({ error: 'Sesión requerida para registrar invitados.' }, { status: 401, headers });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const egrRes = token 
          ? await client.query('SELECT * FROM egresados WHERE UPPER(token) = UPPER($1)', [token])
          : await client.query('SELECT * FROM egresados WHERE id = $1', [egresadoId]);
        
        const egresado = egrRes.rows[0];
        if (!egresado) {
          throw new Error('Autorización fallida: No se encontró egresado');
        }

        const actualesRes = await client.query('SELECT COUNT(*) as total FROM invitados WHERE egresado_id = $1', [egresado.id]);
        const totalActual = parseInt(actualesRes.rows[0].total || '0');

        const configResult = await client.query("SELECT valor FROM configuracion_sistema WHERE clave = 'max_invitados_por_egresado'");
        const maxInvitados = configResult.rows.length > 0 ? parseInt(configResult.rows[0].valor) : 4;

        if (totalActual + nuevos.length > maxInvitados) {
          throw new Error(`Cupos insuficientes. Ya tienes ${totalActual} registrados y quieres añadir ${nuevos.length}. El máximo es ${maxInvitados}.`);
        }

        for (const inv of nuevos) {
          const existRes = await client.query(
            `SELECT i.id FROM invitados i
             JOIN egresados e ON e.id = i.egresado_id
             WHERE e.ceremonia_id = $1
               AND REGEXP_REPLACE(COALESCE(i.dni, ''), '[^0-9]', '', 'g') = $2`,
            [egresado.ceremonia_id, String(inv.dni || '').replace(/\D/g, '')]
          );
          if (existRes.rows.length > 0) {
            throw new Error(`El DNI ${inv.dni} ya está registrado en el sistema.`);
          }
        }

        const registrosFinales = [];
        for (const inv of nuevos) {
          const dniLimpio = inv.dni.replace(/\s/g, '');
          const insRes = await client.query(
            `INSERT INTO invitados (egresado_id, nombre, dni, telefono, correo, relacion, discapacidad)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [egresado.id, inv.nombre.trim(), dniLimpio, String(inv.telefono || '').trim() || null, (inv.correo || '').trim() || null, inv.relacion, inv.discapacidad ? 1 : 0]
          );
          registrosFinales.push(insRes.rows[0]);
        }

        if (egresado.estado_asignacion_butacas === 'CONFIRMADA') {
          await client.query(
            "UPDATE egresados SET estado_asignacion_butacas = 'PENDIENTE_REVISION' WHERE id = $1",
            [egresado.id]
          );
        }

        await client.query('COMMIT');
        return NextResponse.json(registrosFinales, { status: 201, headers });
      } catch (error: any) {
        await client.query('ROLLBACK');
        console.error("Error en POST invitados:", error);
        return NextResponse.json({ error: error.message }, { status: error.message.includes('Autorización') ? 403 : 400, headers });
      } finally {
        client.release();
      }
    }

    // -------------------------------------------------------------
    // EGRESADOS (CREATE / IMPORT / EMAIL / OTP)
    // -------------------------------------------------------------
    if (path === 'egresados') {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { nombre, legajo, dni, correo, carrera, anio_inscripcion, promedio, ceremonia_id, identidad_confirmada } = body;
      if (!nombre || !dni) {
        return NextResponse.json({ error: 'Nombre y DNI son obligatorios' }, { status: 400, headers });
      }

      let ceremoniaIdFinal = ceremonia_id;
      if (!ceremoniaIdFinal) {
        const ceremoniaActiva = await query(
          'SELECT id FROM ceremonias WHERE activa = 1 ORDER BY fecha DESC, id DESC LIMIT 1'
        );
        ceremoniaIdFinal = ceremoniaActiva.rows[0]?.id;
      }
      if (!ceremoniaIdFinal) {
        return NextResponse.json({
          error: 'No hay una ceremonia activa. Activá una ceremonia antes de registrar graduados.'
        }, { status: 409, headers });
      }

      const dniLimpio = String(dni).replace(/\D/g, '');
      const identidadPrevia = await query(
        `SELECT id, nombre, correo, carrera FROM egresados
         WHERE REGEXP_REPLACE(COALESCE(dni, ''), '[^0-9]', '', 'g') = $1
         ORDER BY id DESC LIMIT 1`,
        [dniLimpio]
      );
      if (identidadPrevia.rows.length > 0 && identidad_confirmada !== true) {
        return NextResponse.json({
          error: 'Este DNI ya pertenece a una persona registrada. Confirmá su identidad antes de crear una nueva inscripción.',
          codigo: 'REQUIERE_CONFIRMACION_IDENTIDAD',
          persona: identidadPrevia.rows[0]
        }, { status: 409, headers });
      }

      // Una misma persona puede tener nuevas graduaciones. El duplicado sólo existe
      // dentro de la misma ceremonia, carrera y cohorte.
      const existente = await query(
        `SELECT id FROM egresados
         WHERE ceremonia_id = $1
           AND UPPER(COALESCE(legajo,'')) = UPPER(COALESCE($2,''))
           AND UPPER(COALESCE(carrera,'')) = UPPER(COALESCE($3,''))
           AND COALESCE(anio_inscripcion, 0) = COALESCE($4, 0)`,
        [ceremoniaIdFinal, legajo?.trim() || '', carrera?.trim() || null, anio_inscripcion ? parseInt(anio_inscripcion) : 0]
      );
      if (existente.rows.length > 0) {
        return NextResponse.json({ error: 'Esta inscripción ya existe para la misma ceremonia, carrera y año' }, { status: 409, headers });
      }

      const identidadEnCeremonia = await query(
        `SELECT id FROM egresados
         WHERE ceremonia_id = $1
           AND REGEXP_REPLACE(COALESCE(dni, ''), '[^0-9]', '', 'g') = $2`,
        [ceremoniaIdFinal, dniLimpio]
      );
      if (identidadEnCeremonia.rows.length > 0) {
        return NextResponse.json({ error: 'Esta persona ya tiene una inscripción en la ceremonia activa. Podés editar su registro existente.' }, { status: 409, headers });
      }

      const token = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8-char código seguro

      const result = await query(
        `INSERT INTO egresados (nombre, legajo, dni, correo, token, ceremonia_id, carrera, anio_inscripcion, promedio, identidad_corrobada_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP) RETURNING *`,
        [
          nombre.trim(), 
          legajo?.trim() || '',
          dniLimpio,
          correo ? correo.trim().toLowerCase() : null, 
          token, 
          ceremoniaIdFinal,
          carrera ? carrera.trim() : null, 
          anio_inscripcion ? parseInt(anio_inscripcion) : null, 
          promedio ? parseFloat(promedio) : null
        ]
      );
      return NextResponse.json(result.rows[0], { status: 201, headers });
    }

    if (path === 'egresados/bulk') {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { egresados } = body;
      if (!Array.isArray(egresados) || egresados.length === 0) {
        return NextResponse.json({ error: 'Se requiere una lista de egresados' }, { status: 400, headers });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const exitosos: any[] = [];
        const conflictos: any[] = [];
        
        for (const e of egresados) {
          const token = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8-char código seguro
          const result = await client.query(
            `INSERT INTO egresados (nombre, legajo, dni, correo, token, ceremonia_id, carrera, anio_inscripcion, promedio, identidad_corrobada_en)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
             ON CONFLICT DO NOTHING
             RETURNING *`,
            [
              e.nombre.trim(), 
              e.legajo?.trim() || '', 
              String(e.dni).replace(/\s/g, ''), 
              e.correo ? e.correo.trim().toLowerCase() : null, 
              token, 
              e.ceremonia_id,
              e.carrera ? e.carrera.trim() : null, 
              e.anio_inscripcion ? parseInt(e.anio_inscripcion) : null, 
              e.promedio ? parseFloat(e.promedio) : null
            ]
          );
          if (result.rows.length > 0) {
            exitosos.push(result.rows[0]);
          } else {
            conflictos.push({ egresado: e.nombre, dni: e.dni, legajo: e.legajo, motivo: 'Inscripción duplicada en la misma ceremonia y carrera' });
          }
        }
        
        await client.query('COMMIT');
        return NextResponse.json({ ok: true, importados: exitosos.length, exitosos, conflictos, errores: 0 }, { headers });
      } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error importación masiva:', error);
        return NextResponse.json({ error: 'Error durante la importación masiva', detalle: error.message }, { status: 500, headers });
      } finally {
        client.release();
      }
    }

    if (slug[0] === 'egresados' && slug[2] === 'enviar-invitacion' && slug[1]) {
      const graduadoId = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const graduadoRes = await query('SELECT * FROM egresados WHERE id = $1', [graduadoId]);
      const graduado = graduadoRes.rows[0];
      if (!graduado) return NextResponse.json({ error: 'Graduado no encontrado' }, { status: 404, headers });
      if (!graduado.correo) return NextResponse.json({ error: 'El graduado no tiene un correo configurado' }, { status: 400, headers });

      // La invitación debe volver al mismo entorno que la generó. Esto evita
      // que una variable global de producción mande la demo a otro login.
      const hostBase = obtenerOrigenPublico(req);
      const linkAcceso = `${hostBase}/?token=${graduado.token}`;
      const plantilla = generarPlantillaInvitacion(graduado.nombre, linkAcceso, hostBase);
      
      await enviarCorreo(graduado.correo, 'Invitación a Ceremonia de Colación - SiGIC', plantilla);
      const actualizado = await query(
        `UPDATE egresados
         SET invitacion_enviada = TRUE,
             invitacion_ultimo_envio_en = CURRENT_TIMESTAMP,
             invitacion_envios_count = COALESCE(invitacion_envios_count, 0) + 1,
             estado_flujo = CASE
               WHEN estado_flujo IS NULL OR estado_flujo = '' OR estado_flujo = 'SIN_INVITAR' THEN 'PENDIENTE'
               ELSE estado_flujo
             END
         WHERE id = $1
         RETURNING id, invitacion_enviada, invitacion_ultimo_envio_en, invitacion_envios_count, estado_flujo, estado`,
        [graduadoId]
      );
      return NextResponse.json({ ok: true, mensaje: 'Invitación enviada correctamente', graduado: actualizado.rows[0] }, { headers });
    }

    if (slug[0] === 'egresados' && slug[2] === 'corroborar' && slug[1]) {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const actualizado = await query(
        `UPDATE egresados SET identidad_corrobada_en = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, identidad_corrobada_en`,
        [slug[1]]
      );
      if (!actualizado.rows[0]) return NextResponse.json({ error: 'Graduado no encontrado' }, { status: 404, headers });
      return NextResponse.json({ ok: true, graduado: actualizado.rows[0] }, { headers });
    }

    if (slug[0] === 'egresados' && slug[2] === 'enviar-credencial' && slug[1]) {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const datos = await query(
        `SELECT e.*, 
                COALESCE(c.nombre, (SELECT nombre FROM ceremonias WHERE activa = 1 LIMIT 1), 'Ceremonia de Colación') AS ceremonia_nombre,
                COALESCE(c.fecha, (SELECT fecha FROM ceremonias WHERE activa = 1 LIMIT 1), '2026-08-27') AS ceremonia_fecha,
                COALESCE(c.lugar, (SELECT lugar FROM ceremonias WHERE activa = 1 LIMIT 1), 'Sede Beltrán') AS ceremonia_lugar
         FROM egresados e LEFT JOIN ceremonias c ON c.id = e.ceremonia_id WHERE e.id = $1`,
        [slug[1]]
      );
      const graduado = datos.rows[0];
      if (!graduado) return NextResponse.json({ error: 'Graduado no encontrado' }, { status: 404, headers });
      if (!graduado.correo) return NextResponse.json({ error: 'El graduado no tiene un correo configurado' }, { status: 400, headers });
      if (graduado.estado !== 'ACEPTADO') return NextResponse.json({ error: 'La credencial se envía cuando el graduado confirma su participación' }, { status: 409, headers });
      if (graduado.estado_asignacion_butacas !== 'CONFIRMADA') return NextResponse.json({ error: 'Confirmá las butacas del grupo antes de enviar la credencial' }, { status: 409, headers });

      const hostBase = obtenerOrigenPublico(req);
      const acceso = `${hostBase}/?token=${graduado.token}`;
      const invitados = await query('SELECT nombre, asiento_id FROM invitados WHERE egresado_id = $1 ORDER BY creado_en ASC', [graduado.id]);
      const acompanantes = invitados.rows.map(item => `${item.nombre}${item.asiento_id ? ` (${item.asiento_id})` : ''}`);
      let paseGoogleWallet: Awaited<ReturnType<typeof generarPaseGoogleWallet>> = null;
      try {
        paseGoogleWallet = await generarPaseGoogleWallet({
          graduadoId: graduado.id,
          token: graduado.token,
          nombre: graduado.nombre,
          ceremoniaId: graduado.ceremonia_id || 'cer-activa',
          ceremonia: graduado.ceremonia_nombre,
          fecha: graduado.ceremonia_fecha,
          lugar: graduado.ceremonia_lugar,
          asiento: graduado.asiento_id,
          acceso,
        });
      } catch (error) {
        // El PDF y el correo siguen siendo entregables aunque Wallet se encuentre en configuración.
        console.error('No se pudo generar el pase de Google Wallet:', error);
      }
      const pdf = await generarPdfCredencial({ nombre: graduado.nombre, ceremonia: graduado.ceremonia_nombre, fecha: graduado.ceremonia_fecha, lugar: graduado.ceremonia_lugar, asiento: graduado.asiento_id, acompanantes, acceso });
      await enviarCorreo(
        graduado.correo,
        `Tu credencial e información de ceremonia · ${graduado.ceremonia_nombre}`,
        generarPlantillaCredencialCeremonia({ nombre: graduado.nombre, ceremonia: graduado.ceremonia_nombre, fecha: graduado.ceremonia_fecha, lugar: graduado.ceremonia_lugar, asiento: graduado.asiento_id, acceso, googleWalletUrl: paseGoogleWallet?.url }),
        [{ filename: `Credencial-SiGIC-${graduado.token}.pdf`, content: pdf, contentType: 'application/pdf' }]
      );
      const actualizado = await query(
        `UPDATE egresados SET credencial_enviada_en = CURRENT_TIMESTAMP,
          credencial_envios_count = COALESCE(credencial_envios_count, 0) + 1,
          google_wallet_object_id = COALESCE($2, google_wallet_object_id),
          google_wallet_actualizado_en = CASE WHEN $2 IS NULL THEN google_wallet_actualizado_en ELSE CURRENT_TIMESTAMP END
         WHERE id = $1 RETURNING id, credencial_enviada_en, credencial_envios_count, google_wallet_object_id, google_wallet_actualizado_en`,
        [slug[1], paseGoogleWallet?.objectId || null]
      );
      return NextResponse.json({
        ok: true,
        mensaje: paseGoogleWallet
          ? 'Credencial, PDF y pase de Google Wallet enviados.'
          : 'Credencial e información enviadas. El pase de Google Wallet no se pudo generar.',
        googleWallet: Boolean(paseGoogleWallet),
        graduado: actualizado.rows[0]
      }, { headers });
    }

    if (slug[0] === 'egresados' && slug[2] === 'wallet' && slug[1]) {
      const id = slug[1];
      const esAutorizado = await esAutorizadoPersonalOEgresado(req, id, ROLES_GESTION);
      if (!esAutorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const datos = await query(
        `SELECT e.*, 
                COALESCE(c.nombre, (SELECT nombre FROM ceremonias WHERE activa = 1 LIMIT 1), 'Ceremonia de Colación') AS ceremonia_nombre,
                COALESCE(c.fecha, (SELECT fecha FROM ceremonias WHERE activa = 1 LIMIT 1), '2026-08-27') AS ceremonia_fecha,
                COALESCE(c.lugar, (SELECT lugar FROM ceremonias WHERE activa = 1 LIMIT 1), 'Sede Beltrán') AS ceremonia_lugar
         FROM egresados e LEFT JOIN ceremonias c ON c.id = e.ceremonia_id WHERE e.id = $1`,
        [id]
      );
      const graduado = datos.rows[0];
      if (!graduado) return NextResponse.json({ error: 'Graduado no encontrado' }, { status: 404, headers });
      if (graduado.estado !== 'ACEPTADO') return NextResponse.json({ error: 'La credencial se genera cuando el graduado confirma su participación' }, { status: 409, headers });

      const hostBase = obtenerOrigenPublico(req);
      const acceso = `${hostBase}/?token=${graduado.token}`;
      try {
        const paseGoogleWallet = await generarPaseGoogleWallet({
          graduadoId: graduado.id,
          token: graduado.token,
          nombre: graduado.nombre,
          ceremoniaId: graduado.ceremonia_id || 'cer-activa',
          ceremonia: graduado.ceremonia_nombre,
          fecha: graduado.ceremonia_fecha,
          lugar: graduado.ceremonia_lugar,
          asiento: graduado.asiento_id,
          acceso,
        });

        if (paseGoogleWallet) {
          await query(
            `UPDATE egresados SET google_wallet_object_id = COALESCE($2, google_wallet_object_id),
              google_wallet_actualizado_en = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id, paseGoogleWallet.objectId]
          );
          return NextResponse.json({ ok: true, url: paseGoogleWallet.url, objectId: paseGoogleWallet.objectId }, { headers });
        } else {
          return NextResponse.json({ ok: false, noConfigurado: true, mensaje: 'Google Wallet no está configurado en el servidor' }, { headers });
        }
      } catch (error: any) {
        console.error('Error al generar pase de Google Wallet:', error);
        return NextResponse.json({ error: 'No se pudo generar el pase de Google Wallet', detalle: error.message }, { status: 500, headers });
      }
    }

    if (path === 'egresados/solicitar-otp') {
      const { identificador, esCorreo, normalizado } = prepararIdentificadorGraduado(body.identificador || body.email);
      const inscripcionId = body.inscripcionId;
      if (!identificador || !normalizado) {
        return NextResponse.json({ error: 'Ingresá tu correo electrónico o DNI' }, { status: 400, headers });
      }

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
      const limiteAlumno = verificarRateLimit(`otp-req-id-${normalizado}`, 5, 10 * 60 * 1000);
      const limiteRed = verificarRateLimit(`otp-req-ip-${ip}`, 30, 10 * 60 * 1000);
      if (!limiteAlumno.permitido || !limiteRed.permitido) {
        const segundosRestantes = Math.max(limiteAlumno.segundosRestantes, limiteRed.segundosRestantes);
        return NextResponse.json({
          error: `Demasiadas solicitudes. Esperá ${segundosRestantes} segundos.`,
          segundosRestantes
        }, { status: 429, headers });
      }

      const condicionAcceso = esCorreo
        ? 'LOWER(e.correo) = $1'
        : "REGEXP_REPLACE(COALESCE(e.dni, ''), '[^0-9]', '', 'g') = $1";
      const result = await query(`
        SELECT e.*, c.nombre AS ceremonia_nombre, c.fecha AS ceremonia_fecha,
               c.lugar AS ceremonia_lugar, c.activa AS ceremonia_activa
        FROM egresados e
        JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE ${condicionAcceso}
        ORDER BY c.activa DESC, c.fecha DESC, e.id DESC
      `, [normalizado]);
      
      if (!inscripcionId && result.rows.length > 1) {
        return NextResponse.json({
          ok: true,
          requiereSeleccion: true,
          inscripciones: result.rows.map((registro: any) => ({
            id: registro.id,
            carrera: registro.carrera || 'Carrera sin especificar',
            estado: registro.estado,
            ceremonia: registro.ceremonia_nombre,
            fecha: registro.ceremonia_fecha,
            lugar: registro.ceremonia_lugar,
            activa: Boolean(registro.ceremonia_activa)
          }))
        }, { headers });
      }

      const graduado = inscripcionId
        ? result.rows.find((registro: any) => String(registro.id) === String(inscripcionId))
        : result.rows[0];
      if (!graduado) return NextResponse.json({ error: 'Correo o DNI no registrado en esta ceremonia' }, { status: 404, headers });
      if (!graduado.correo) return NextResponse.json({ error: 'Tu registro no tiene un correo asociado. Contactá a la institución.' }, { status: 400, headers });
      
      const { codigo: otp, hash: otpHash } = GestorOTP.generar({ longitud: 6, minutosExpiracion: 10 });

      // El vencimiento se calcula en la base de datos para evitar diferencias de zona horaria
      // entre el servidor, PostgreSQL y el navegador del graduado.
      await query(
        `UPDATE egresados
         SET otp = $1, otp_expira = CURRENT_TIMESTAMP + INTERVAL '10 minutes'
         WHERE id = $2`,
        [otp, graduado.id]
      );
      const hostBase = new URL(req.url).origin;
      const htmlOTP = generarPlantillaOTP(otp, hostBase);
      const envio = await enviarCorreo(graduado.correo, 'Tu código de acceso - SiGIC', htmlOTP);
      await registrarAuditoriaOTP(graduado.id, otpHash, ip, 'ENVIADO');
      return NextResponse.json({
        ok: true,
        mensaje: 'Código enviado correctamente',
        destino: ocultarCorreo(graduado.correo),
        inscripcionId: graduado.id,
        expiraEnSegundos: 600,
        proveedor: envio.proveedor || 'smtp'
      }, { headers });
    }

    if (path === 'egresados/verificar-otp') {
      const { identificador, esCorreo, normalizado } = prepararIdentificadorGraduado(body.identificador || body.email);
      const { otp: otpStr, inscripcionId } = body;
      if (!identificador || !normalizado || !otpStr) return NextResponse.json({ error: 'Correo o DNI y código OTP requeridos' }, { status: 400, headers });

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
      const limiteAlumno = verificarRateLimit(`otp-ver-id-${normalizado}`, 10, 10 * 60 * 1000);
      const limiteRed = verificarRateLimit(`otp-ver-ip-${ip}`, 60, 10 * 60 * 1000);
      if (!limiteAlumno.permitido || !limiteRed.permitido) {
        const segundosRestantes = Math.max(limiteAlumno.segundosRestantes, limiteRed.segundosRestantes);
        return NextResponse.json({
          error: `Demasiados intentos. Esperá ${segundosRestantes} segundos.`,
          segundosRestantes
        }, { status: 429, headers });
      }

      const condicionAcceso = esCorreo
        ? 'LOWER(e.correo) = $1'
        : "REGEXP_REPLACE(COALESCE(e.dni, ''), '[^0-9]', '', 'g') = $1";
      const result = await query(`
        SELECT e.*, c.nombre AS ceremonia_nombre, c.fecha AS ceremonia_fecha,
               c.lugar AS ceremonia_lugar, c.activa AS ceremonia_activa,
               COALESCE(EXTRACT(EPOCH FROM (e.otp_expira - CURRENT_TIMESTAMP)), -1) AS otp_segundos_restantes
        FROM egresados e
        JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE ${condicionAcceso}
        ORDER BY c.activa DESC, c.fecha DESC, e.id DESC
      `, [normalizado]);
      
      const graduado = inscripcionId
        ? result.rows.find((registro: any) => String(registro.id) === String(inscripcionId))
        : result.rows[0];
      if (!graduado) return NextResponse.json({ error: 'Graduado no registrado' }, { status: 404, headers });

      const otpHash = GestorOTP.hashear(otpStr);
      const segundosRestantesOTP = Number(graduado.otp_segundos_restantes);
      const otpVigente = Number.isFinite(segundosRestantesOTP) && segundosRestantesOTP > 0;
      const estadoOTP = GestorOTP.verificar(otpStr, graduado.otp, otpVigente);

      await registrarAuditoriaOTP(graduado.id, otpHash, ip, estadoOTP);

      if (estadoOTP === 'EXPIRADO') return NextResponse.json({ error: 'El código OTP ha expirado' }, { status: 400, headers });
      if (estadoOTP === 'CODIGO_INVALIDO') return NextResponse.json({ error: 'Código incorrecto' }, { status: 400, headers });

      // Clean OTP after verification
      await query('UPDATE egresados SET otp = NULL, otp_expira = NULL WHERE id = $1', [graduado.id]);

      const tokenSesion = firmar({ tipo: 'egresado', id: graduado.id, nombre: graduado.nombre }, 4 * 60 * 60);
      const dniHistorial = String(graduado.dni || '').replace(/\D/g, '');
      const historial = await query(`
        SELECT e.id, e.nombre, e.legajo, e.dni, e.correo, e.carrera, e.anio_inscripcion,
               e.promedio, e.estado, e.ceremonia_id, c.nombre AS ceremonia_nombre,
               c.fecha AS ceremonia_fecha, c.lugar AS ceremonia_lugar, c.activa AS ceremonia_activa
        FROM egresados e
        JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE ${dniHistorial
          ? "REGEXP_REPLACE(COALESCE(e.dni, ''), '[^0-9]', '', 'g') = $1"
          : 'LOWER(e.correo) = LOWER($1)'}
        ORDER BY c.fecha DESC, e.carrera ASC
      `, [dniHistorial || graduado.correo]);

      return NextResponse.json({
        ok: true,
        token_sesion: tokenSesion,
        egresado: graduado,
        historial: historial.rows
      }, { headers });
    }

    // Fallback: 404 para POST
    return NextResponse.json({ error: `Ruta POST '${path}' no encontrada` }, { status: 404, headers });

  } catch (error: any) {
    console.error(`Error en POST /api/${path}:`, error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500, headers });
  }
}

// MAIN HANDLER FOR PUT REQUESTS
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  await asegurarInicializacion();
  const { slug } = await params;
  const headers = corsHeaders(req);
  const path = slug.join('/');

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // Algunas operaciones PUT no llevan cuerpo.
  }

  try {
    if (slug[0] === 'egresados' && slug[1] && !slug[2]) {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      const isEgresadoPropio = await esAutorizadoPersonalOEgresado(req, slug[1], ROLES_GESTION);
      if (!isPersonal && !isEgresadoPropio) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const campos: string[] = [];
      const valores: any[] = [];
      let i = 1;

      if (body.nombre !== undefined) { campos.push(`nombre = $${i++}`); valores.push(body.nombre.trim()); }
      if (body.dni !== undefined) { campos.push(`dni = $${i++}`); valores.push(body.dni.replace(/\D/g, '')); }
      if (body.legajo !== undefined) { campos.push(`legajo = $${i++}`); valores.push(body.legajo?.trim() || null); }
      if (body.correo !== undefined) { campos.push(`correo = $${i++}`); valores.push(body.correo?.trim() || null); }
      if (body.carrera !== undefined) { campos.push(`carrera = $${i++}`); valores.push(body.carrera?.trim() || null); }
      if (body.anio_inscripcion !== undefined) { campos.push(`anio_inscripcion = $${i++}`); valores.push(body.anio_inscripcion || null); }
      if (body.promedio !== undefined) { campos.push(`promedio = $${i++}`); valores.push(body.promedio || null); }
      if (body.formula_juramento !== undefined) { campos.push(`formula_juramento = $${i++}`); valores.push(body.formula_juramento); }
      if (body.formulaJuramento !== undefined) { campos.push(`formula_juramento = $${i++}`); valores.push(body.formulaJuramento); }
      if (body.comentarios !== undefined) { campos.push(`comentarios = $${i++}`); valores.push(body.comentarios); }
      if (body.diploma_entregado !== undefined) { campos.push(`diploma_entregado = $${i++}`); valores.push(Boolean(body.diploma_entregado)); }
      if (body.menciones !== undefined) { campos.push(`menciones = $${i++}`); valores.push(body.menciones); }

      if (campos.length === 0) {
        return NextResponse.json({ error: 'No se enviaron campos para actualizar' }, { status: 400, headers });
      }

      valores.push(slug[1]);
      const actualizado = await query(
        `UPDATE egresados SET ${campos.join(', ')} WHERE id = $${i} RETURNING *`,
        valores
      );
      if (!actualizado.rows[0]) return NextResponse.json({ error: 'Graduado no encontrado' }, { status: 404, headers });
      return NextResponse.json({ ok: true, graduado: actualizado.rows[0] }, { headers });
    }
    // -------------------------------------------------------------
    // CONFIGURACIÓN CLAVE
    // -------------------------------------------------------------
    if (slug[0] === 'configuracion' && slug[1] && !slug[2]) {
      const clave = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { valor } = body;
      if (valor === undefined || valor === null) {
        return NextResponse.json({ error: 'El campo "valor" es obligatorio' }, { status: 400, headers });
      }

      const CLAVES_CEREMONIA = ['nombre_evento', 'max_invitados', 'fecha_evento', 'lugar_evento'];
      if (CLAVES_CEREMONIA.includes(clave)) {
        const mapeo: Record<string, string> = { 
          'nombre_evento': 'nombre', 
          'max_invitados': 'max_invitados', 
          'fecha_evento': 'fecha', 
          'lugar_evento': 'lugar' 
        };
        
        await query(`UPDATE ceremonias SET ${mapeo[clave]} = $1 WHERE activa = 1`, [valor]);
        invalidarCache('configuracion');
        invalidarCache('ceremonias');
        return NextResponse.json({ ok: true, mensaje: `Hábitat actualizado (${clave})` }, { headers });
      }

      const result = await query(
        `INSERT INTO configuracion_sistema (clave, valor, actualizado_en)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (clave)
         DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = CURRENT_TIMESTAMP
         RETURNING *`,
        [clave, String(valor)]
      );

      invalidarCache('configuracion');
      invalidarCache('setup:status');
      return NextResponse.json({ ok: true, ajuste: result.rows[0] }, { headers });
    }

    // -------------------------------------------------------------
    // CEREMONIAS
    // -------------------------------------------------------------
    if (slug[0] === 'ceremonias' && slug[2] === 'activar' && slug[1]) {
      const id = slug[1];
      const auth = obtenerUsuarioAutenticado(req, ROLES_OPERACION);
      if (!auth.valido || !auth.datos) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });
      }

      const usuario = auth.datos;
      const esGestion = usuario.rol && ROLES_GESTION.includes(usuario.rol);
      if (!esGestion) {
        // Si no es de gestión administrativa, verificar si el usuario tiene restricciones asignadas
        const tieneAsignaciones = await query(
          'SELECT 1 FROM ceremonias_usuarios_autorizados WHERE usuario_id = $1',
          [usuario.id]
        );
        if (tieneAsignaciones.rowCount && tieneAsignaciones.rowCount > 0) {
          const asignado = await query(
            'SELECT 1 FROM ceremonias_usuarios_autorizados WHERE ceremonia_id = $1 AND usuario_id = $2',
            [id, usuario.id]
          );
          if (!asignado.rowCount || asignado.rowCount === 0) {
            return NextResponse.json({ error: 'No tenés permisos para activar esta ceremonia' }, { status: 403, headers });
          }
        }
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Serializa el cambio para que nunca puedan coexistir dos entornos activos.
        await client.query("SELECT pg_advisory_xact_lock(hashtext('sigic-ceremonia-activa'))");
        await client.query('UPDATE ceremonias SET activa = 0 WHERE activa = 1');
        const result = await client.query(`
          UPDATE ceremonias
          SET activa = 1,
              estado_operativo = CASE WHEN estado_operativo = 'BORRADOR' THEN 'CONFIGURACION' ELSE estado_operativo END
          WHERE id = $1`, [id]);
        if (result.rowCount === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Ceremonia no encontrada' }, { status: 404, headers });
        }
        await client.query('COMMIT');
        invalidarCache('ceremonias');
        invalidarCache('configuracion');
        invalidarCache('anfiteatro');
        invalidarCache('setup:status');
        return NextResponse.json({ ok: true, mensaje: 'Ceremonia activada correctamente' }, { headers });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    if (slug[0] === 'ceremonias' && slug[2] === 'estado' && slug[1]) {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const siguiente = String(body?.estado || '').toUpperCase();
      const permitidos = ['BORRADOR', 'CONFIGURACION', 'CONVOCATORIA', 'PREPARACION', 'EN_VIVO', 'FINALIZADA'];
      if (!permitidos.includes(siguiente)) return NextResponse.json({ error: 'Estado operativo inválido' }, { status: 400, headers });

      const indicadores = await query(`
        SELECT COUNT(e.id)::int AS egresados,
          COUNT(e.id) FILTER (WHERE e.invitacion_enviada)::int AS invitaciones,
          COUNT(e.id) FILTER (
            WHERE e.estado = 'ACEPTADO'
              AND (e.asiento_id IS NULL OR COALESCE(e.estado_asignacion_butacas, '') <> 'CONFIRMADA')
          )::int AS grupos_sin_ubicacion_confirmada,
          COUNT(e.id) FILTER (WHERE e.estado = 'ACEPTADO')::int AS graduados_aceptados,
          EXISTS(SELECT 1 FROM configuracion_anfiteatro ca WHERE ca.ceremonia_id = c.id) AS plano
        FROM ceremonias c LEFT JOIN egresados e ON e.ceremonia_id = c.id
        WHERE c.id = $1 GROUP BY c.id`, [slug[1]]);
      const info = indicadores.rows[0];
      if (!info) return NextResponse.json({ error: 'Ceremonia no encontrada' }, { status: 404, headers });
      if (siguiente === 'CONVOCATORIA' && !Number(info.egresados)) return NextResponse.json({ error: 'Agregá al menos un graduado antes de convocar' }, { status: 409, headers });
      if (siguiente === 'PREPARACION' && !info.plano) return NextResponse.json({ error: 'Configurá el plano de butacas antes de preparar la ceremonia' }, { status: 409, headers });
      if (siguiente === 'EN_VIVO' && !Number(info.graduados_aceptados)) return NextResponse.json({ error: 'No hay graduados aceptados para abrir la acreditación' }, { status: 409, headers });
      if (siguiente === 'EN_VIVO' && Number(info.grupos_sin_ubicacion_confirmada)) return NextResponse.json({ error: `Faltan confirmar las butacas de ${info.grupos_sin_ubicacion_confirmada} grupo(s) antes de abrir la acreditación` }, { status: 409, headers });

      const result = await query(`
        UPDATE ceremonias SET estado_operativo = $1::varchar,
          finalizada_en = CASE WHEN $1::varchar = 'FINALIZADA' THEN CURRENT_TIMESTAMP ELSE finalizada_en END,
          activa = CASE WHEN $1::varchar = 'FINALIZADA' THEN 0 ELSE activa END
        WHERE id = $2 RETURNING *`, [siguiente, slug[1]]);
      return NextResponse.json({ ok: true, ceremonia: result.rows[0] }, { headers });
    }

    if (slug[0] === 'ceremonias' && slug[2] === 'autorizados' && slug[3] && slug[1]) {
      const ceremoniaId = slug[1];
      const userId = slug[3];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { autorizado } = body;
      if (autorizado) {
        await query(
          `INSERT INTO ceremonias_usuarios_autorizados (ceremonia_id, usuario_id)
           VALUES ($1, $2)
           ON CONFLICT (ceremonia_id, usuario_id) DO NOTHING`,
          [ceremoniaId, userId]
        );
      } else {
        await query(
          'DELETE FROM ceremonias_usuarios_autorizados WHERE ceremonia_id = $1 AND usuario_id = $2',
          [ceremoniaId, userId]
        );
      }
      return NextResponse.json({ ok: true }, { headers });
    }

    if (slug[0] === 'ceremonias' && slug[1] && !slug[2]) {
      const id = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { nombre, fecha, lugar, max_invitados, max_entregadores, fecha_limite_confirmacion, fecha_limite_respuesta, fecha_limite_grupo, fecha_cierre_butacas } = body;
      const limite = fecha_limite_confirmacion !== undefined ? fecha_limite_confirmacion : fecha_limite_respuesta;
      const result = await query(
        `UPDATE ceremonias SET nombre = COALESCE($1, nombre), fecha = COALESCE($2, fecha), lugar = COALESCE($3, lugar),
          max_invitados = COALESCE($4, max_invitados), max_entregadores = COALESCE($5, max_entregadores),
          fecha_limite_confirmacion = $6, fecha_limite_respuesta = $6, fecha_limite_grupo = $7, fecha_cierre_butacas = $8
         WHERE id = $9 RETURNING *`,
        [nombre || null, fecha || null, lugar || null, max_invitados || null, max_entregadores || null,
          limite || null, fecha_limite_grupo || null, fecha_cierre_butacas || null, id]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Ceremonia no encontrada' }, { status: 404, headers });
      }

      return NextResponse.json({ ok: true, mensaje: 'Ceremonia actualizada correctamente', ceremonia: result.rows[0] }, { headers });
    }

    // -------------------------------------------------------------
    // PROFESORES
    // -------------------------------------------------------------
    if (slug[0] === 'profesores' && slug[1] && !slug[2]) {
      const id = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { nombre, dni, materia } = body;
      if (!nombre) {
        return NextResponse.json({ error: 'El nombre del profesor es obligatorio' }, { status: 400, headers });
      }

      const result = await query(
        'UPDATE profesores SET nombre = $1, dni = $2, materia = $3 WHERE id = $4 RETURNING *',
        [nombre.trim(), dni ? dni.trim() : null, materia ? materia.trim() : null, id]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404, headers });
      }

      return NextResponse.json(result.rows[0], { headers });
    }

    // -------------------------------------------------------------
    // USUARIOS (ROL / ESTADO)
    // -------------------------------------------------------------
    if (slug[0] === 'usuarios' && slug[2] === 'rol' && slug[1]) {
      const id = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const rol = (body?.rol || '').toString().toUpperCase();
      if (!ROLES_VALIDOS.includes(rol)) {
        return NextResponse.json({ error: 'Rol inválido' }, { status: 400, headers });
      }

      if (rol !== 'SUPER_ADMIN' && await esUltimoSuperAdmin(id)) {
        return NextResponse.json({ error: 'No podés quitar el rol al último SUPER_ADMIN activo del sistema' }, { status: 409, headers });
      }

      await query('UPDATE usuarios_sistema SET rol = $1 WHERE id = $2', [rol, id]);
      return NextResponse.json({ ok: true }, { headers });
    }

    if (slug[0] === 'usuarios' && slug[2] === 'estado' && slug[1]) {
      const id = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const activo = Number(body?.activo) === 1 ? 1 : 0;
      if (activo === 0 && await esUltimoSuperAdmin(id)) {
        const usuario = await query('SELECT rol FROM usuarios_sistema WHERE id = $1', [id]);
        if (usuario.rows[0]?.rol === 'SUPER_ADMIN') {
          return NextResponse.json({ error: 'No podés desactivar al último SUPER_ADMIN activo del sistema' }, { status: 409, headers });
        }
      }

      await query('UPDATE usuarios_sistema SET activo = $1 WHERE id = $2', [activo, id]);
      return NextResponse.json({ ok: true }, { headers });
    }

    // -------------------------------------------------------------
    // ACREDITACIÓN DE GRUPO (EGRESADO + ACOMPAÑANTES)
    // -------------------------------------------------------------
    if (slug[0] === 'egresados' && slug[2] === 'presente-grupo' && slug[1]) {
      const egresadoId = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_OPERACION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { acreditarEgresado = true, invitadoIds = [] } = body || {};

      if (acreditarEgresado) {
        await query(
          'UPDATE egresados SET presente = TRUE, fecha_presente = COALESCE(fecha_presente, CURRENT_TIMESTAMP) WHERE id = $1',
          [egresadoId]
        );
      }

      let invitadosAcreditados = 0;
      if (Array.isArray(invitadoIds) && invitadoIds.length > 0) {
        const placeholders = invitadoIds.map((_, i) => `$${i + 2}`).join(',');
        const resInvs = await query(
          `UPDATE invitados SET presente = TRUE, fecha_presente = COALESCE(fecha_presente, CURRENT_TIMESTAMP) 
           WHERE egresado_id = $1 AND id IN (${placeholders})`,
          [egresadoId, ...invitadoIds]
        );
        invitadosAcreditados = resInvs.rowCount || 0;
      } else {
        const resInvs = await query(
          'UPDATE invitados SET presente = TRUE, fecha_presente = COALESCE(fecha_presente, CURRENT_TIMESTAMP) WHERE egresado_id = $1',
          [egresadoId]
        );
        invitadosAcreditados = resInvs.rowCount || 0;
      }

      const egrActual = await query('SELECT * FROM egresados WHERE id = $1', [egresadoId]);
      const invsActual = await query('SELECT * FROM invitados WHERE egresado_id = $1 ORDER BY nombre ASC', [egresadoId]);

      return NextResponse.json({
        ok: true,
        mensaje: 'Grupo acreditado exitosamente.',
        egresado: egrActual.rows[0] || null,
        invitados: invsActual.rows,
        egresadoAcreditado: Boolean(acreditarEgresado),
        invitadosAcreditados
      }, { headers });
    }

    // -------------------------------------------------------------
    // INVITADOS (PRESENTE / MASIVO / UPDATE)
    // -------------------------------------------------------------
    if (slug[0] === 'egresados' && slug[2] === 'presente' && slug[1]) {
      const id = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_OPERACION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query(
        'UPDATE egresados SET presente = TRUE, fecha_presente = CURRENT_TIMESTAMP WHERE id = $1 AND COALESCE(presente, FALSE) = FALSE RETURNING *',
        [id]
      );
      if (result.rowCount === 0) {
        const existente = await query('SELECT presente, fecha_presente FROM egresados WHERE id = $1', [id]);
        if (existente.rows[0]?.presente === true) {
          return NextResponse.json({
            ok: true,
            yaAcreditado: true,
            mensaje: 'El graduado ya estaba acreditado.',
            fecha_presente: existente.rows[0].fecha_presente,
          }, { headers });
        }
        return NextResponse.json({ error: 'Graduado no encontrado' }, { status: 404, headers });
      }
      return NextResponse.json({ ok: true, yaAcreditado: false, mensaje: 'Ingreso del graduado confirmado', graduado: result.rows[0] }, { headers });
    }

    if (slug[0] === 'invitados' && slug[2] === 'presente' && slug[1]) {
      const id = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_OPERACION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query(
        "UPDATE invitados SET presente = TRUE, fecha_presente = CURRENT_TIMESTAMP WHERE id = $1 AND presente = FALSE RETURNING *",
        [id]
      );
      if (result.rowCount === 0) {
        const existente = await query('SELECT presente, fecha_presente FROM invitados WHERE id = $1', [id]);
        if (existente.rows[0]?.presente === true) {
          return NextResponse.json({
            ok: true,
            yaAcreditado: true,
            mensaje: 'El invitado ya estaba acreditado.',
            fecha_presente: existente.rows[0].fecha_presente,
          }, { headers });
        }
        return NextResponse.json({ error: 'Invitado no encontrado' }, { status: 404, headers });
      }
      return NextResponse.json({ ok: true, yaAcreditado: false, mensaje: 'Ingreso confirmado', invitado: result.rows[0] }, { headers });
    }

    if (path === 'invitados/presente-masivo') {
      const isPersonal = await esPersonalValido(req, ROLES_OPERACION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { ids } = body;
      if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'IDs requeridos' }, { status: 400, headers });

      const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
      const result = await query(
        `UPDATE invitados SET presente = TRUE, fecha_presente = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) AND presente = FALSE`,
        ids
      );
      return NextResponse.json({
        ok: true,
        cantidad_ingresos: result.rowCount,
        cantidad_omitidos: ids.length - (result.rowCount || 0),
        mensaje: result.rowCount === 1
          ? 'Se acreditó 1 invitado.'
          : `Se acreditaron ${result.rowCount || 0} invitados.`,
      }, { headers });
    }

    if (slug[0] === 'invitados' && slug[1] && !slug[2]) {
      const id = slug[1];
      
      // lookup egresado owner for invitados
      const checkRes = await query('SELECT egresado_id FROM invitados WHERE id = $1', [id]);
      const egresadoId = checkRes.rows[0]?.egresado_id;
      if (!egresadoId) return NextResponse.json({ error: 'Invitado no encontrado' }, { status: 404, headers });

      const esAutorizado = await esAutorizadoPersonalOEgresado(req, egresadoId, ROLES_GESTION);
      if (!esAutorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { nombre, dni, telefono, correo, relacion, discapacidad } = body;
      const result = await query(
        `UPDATE invitados 
         SET nombre = $1, dni = $2, telefono = $3, correo = $4, relacion = $5, discapacidad = $6
         WHERE id = $7 RETURNING *`,
        [nombre, dni, String(telefono || '').trim() || null, String(correo || '').trim() || null, relacion, discapacidad ? 1 : 0, id]
      );
      if (nombre) {
        await query('UPDATE entregadores SET nombre = $1 WHERE invitado_id = $2', [nombre, id]);
      }
      return NextResponse.json(result.rows[0], { headers });
    }

    // -------------------------------------------------------------
    // EGRESADOS (ASIENTOS / ENTREGADOR / RESPONDER)
    // -------------------------------------------------------------
    if (slug[0] === 'egresados' && slug[2] === 'finalizar-inscripcion' && slug[1]) {
      const id = slug[1];
      const autorizado = await esAutorizadoPersonalOEgresado(req, id, ROLES_GESTION);
      if (!autorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const resultado = await query(
        `SELECT id, nombre, correo, perfil_finalizado_en, aviso_edicion_enviado_en
         FROM egresados WHERE id = $1`,
        [id]
      );
      const graduado = resultado.rows[0];
      if (!graduado) return NextResponse.json({ error: 'Graduado no encontrado' }, { status: 404, headers });

      let avisoEnviado = false;
      if (!graduado.aviso_edicion_enviado_en && graduado.correo) {
        try {
          const hostBase = new URL(req.url).origin;
          await enviarCorreo(
            graduado.correo,
            'Tu inscripción quedó guardada · SiGIC',
            generarPlantillaCierreInscripcion(graduado.nombre, hostBase)
          );
          avisoEnviado = true;
        } catch (error) {
          // El cierre es más importante que una notificación. Permitimos reintentarla luego.
          console.error('No se pudo enviar el aviso de edición:', error);
        }
      }

      const actualizado = await query(
        `UPDATE egresados
         SET estado_flujo = 'COMPLETO',
             perfil_finalizado_en = COALESCE(perfil_finalizado_en, CURRENT_TIMESTAMP),
             aviso_edicion_enviado_en = CASE
               WHEN $2 THEN COALESCE(aviso_edicion_enviado_en, CURRENT_TIMESTAMP)
               ELSE aviso_edicion_enviado_en
             END
         WHERE id = $1
         RETURNING perfil_finalizado_en, aviso_edicion_enviado_en, estado_flujo`,
        [id, avisoEnviado]
      );
      return NextResponse.json({
        ok: true,
        mensaje: avisoEnviado
          ? 'Inscripción finalizada. Enviamos un correo único para que puedas volver a editarla.'
          : 'Inscripción finalizada. Podés volver a editarla desde el portal cuando lo necesites.',
        avisoEnviado,
        graduado: actualizado.rows[0],
      }, { headers });
    }

    if (slug[0] === 'egresados' && slug[2] === 'asientos' && slug[1]) {
      const id = slug[1];
      const esPersonal = await esPersonalValido(req, ROLES_GESTION);
      const esGraduado = await esAutorizadoPersonalOEgresado(req, id, ROLES_GESTION);
      if (!esGraduado) return NextResponse.json({ error: 'No autorizado para modificar este grupo' }, { status: 403, headers });

      const normalizarAsiento = (valor: unknown) => {
        if (valor === null || valor === undefined || valor === '') return null;
        return String(valor).trim();
      };
      const egresadoAsiento = normalizarAsiento(body.egresadoAsiento ?? body.asientoId);
      const invitadosAsientos = body.invitadosAsientos && typeof body.invitadosAsientos === 'object'
        ? Object.fromEntries(Object.entries(body.invitadosAsientos).map(([invitadoId, asiento]) => [invitadoId, normalizarAsiento(asiento)]))
        : {};
      const asignaciones = [egresadoAsiento, ...Object.values(invitadosAsientos)].filter(Boolean) as string[];

      if (new Set(asignaciones).size !== asignaciones.length) {
        return NextResponse.json({ error: 'Una misma butaca no puede asignarse a dos personas del grupo' }, { status: 400, headers });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const graduadoRes = await client.query('SELECT ceremonia_id, estado_asignacion_butacas FROM egresados WHERE id = $1 FOR UPDATE', [id]);
        if (graduadoRes.rowCount === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Graduado no encontrado' }, { status: 404, headers });
        }
        const { ceremonia_id: ceremoniaId, estado_asignacion_butacas: estadoActual } = graduadoRes.rows[0];

        if (!esPersonal && estadoActual === 'CONFIRMADA') {
          await client.query('ROLLBACK');
          return NextResponse.json({
            error: 'Las butacas de tu grupo ya fueron confirmadas por la administración y no pueden modificarse. Si necesitás realizar un cambio, comunicate con la institución.'
          }, { status: 409, headers });
        }

        const idsInvitados = Object.keys(invitadosAsientos);

        const cantidadInvitados = await client.query('SELECT COUNT(*)::int AS cantidad FROM invitados WHERE egresado_id = $1', [id]);
        if (!egresadoAsiento || Object.values(invitadosAsientos).filter(Boolean).length !== cantidadInvitados.rows[0].cantidad) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Asigná una butaca a cada integrante antes de enviar la propuesta o confirmarla' }, { status: 400, headers });
        }

        if (idsInvitados.length > 0) {
          const placeholders = idsInvitados.map((_, indice) => `$${indice + 2}`).join(', ');
          const invitadosRes = await client.query(
            `SELECT id FROM invitados WHERE egresado_id = $1 AND id IN (${placeholders})`,
            [id, ...idsInvitados]
          );
          if (invitadosRes.rowCount !== idsInvitados.length) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'La asignación contiene acompañantes que no pertenecen al graduado' }, { status: 400, headers });
          }
        }

        // Serializa cada butaca solicitada: dos operadores no pueden reservarla a la vez.
        for (const asiento of asignaciones.sort()) {
          await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`butaca:${ceremoniaId}:${asiento}`]);
        }

        if (asignaciones.length > 0) {
          const ocupados = await client.query(
            `SELECT asiento_id FROM egresados WHERE ceremonia_id = $1 AND id <> $2 AND asiento_id = ANY($3)
             UNION SELECT asiento_solicitado_id AS asiento_id FROM egresados WHERE ceremonia_id = $1 AND id <> $2 AND asiento_solicitado_id = ANY($3)
             UNION
             SELECT i.asiento_id FROM invitados i JOIN egresados e ON e.id = i.egresado_id
             WHERE e.ceremonia_id = $1 AND e.id <> $2 AND i.asiento_id = ANY($3)
             UNION SELECT i.asiento_solicitado_id AS asiento_id FROM invitados i JOIN egresados e ON e.id = i.egresado_id
             WHERE e.ceremonia_id = $1 AND e.id <> $2 AND i.asiento_solicitado_id = ANY($3)`,
            [ceremoniaId, id, asignaciones]
          );
          if ((ocupados.rowCount || 0) > 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: `La butaca ${ocupados.rows[0].asiento_id} acaba de ser asignada a otro grupo. Actualizá el mapa e intentá de nuevo.` }, { status: 409, headers });
          }
        }

        const planoRes = await client.query(
          'SELECT mapa_roles FROM configuracion_anfiteatro WHERE ceremonia_id = $1 ORDER BY actualizado_en DESC LIMIT 1',
          [ceremoniaId]
        );
        const mapaRoles = planoRes.rows[0]?.mapa_roles
          ? (typeof planoRes.rows[0].mapa_roles === 'string' ? JSON.parse(planoRes.rows[0].mapa_roles) : planoRes.rows[0].mapa_roles)
          : {};
        const noAsignables = asignaciones.find(asiento => ['autoridad', 'reservado', 'bloqueado'].includes(mapaRoles[asiento]));
        if (noAsignables) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: `La butaca ${noAsignables} pertenece a un sector reservado y no se puede asignar.` }, { status: 400, headers });
        }

        const columna = esPersonal ? 'asiento_id' : 'asiento_solicitado_id';
        await client.query(
          `UPDATE egresados SET ${columna} = $1, estado_asignacion_butacas = $2 WHERE id = $3`,
          [egresadoAsiento, esPersonal ? 'CONFIRMADA' : 'PENDIENTE_REVISION', id]
        );
        await client.query(`UPDATE invitados SET ${columna} = NULL WHERE egresado_id = $1`, [id]);
        for (const [invitadoId, asiento] of Object.entries(invitadosAsientos)) {
          await client.query(`UPDATE invitados SET ${columna} = $1 WHERE id = $2 AND egresado_id = $3`, [asiento, invitadoId, id]);
        }
        if (esPersonal) {
          await client.query('UPDATE egresados SET asiento_solicitado_id = NULL WHERE id = $1', [id]);
          await client.query('UPDATE invitados SET asiento_solicitado_id = NULL WHERE egresado_id = $1', [id]);
        }

        const estadoGraduado = await client.query(
          `SELECT id, asiento_id, asiento_solicitado_id, estado_asignacion_butacas
           FROM egresados WHERE id = $1`,
          [id]
        );
        const estadoInvitados = await client.query(
          `SELECT id, asiento_id, asiento_solicitado_id
           FROM invitados WHERE egresado_id = $1 ORDER BY creado_en ASC`,
          [id]
        );

        await client.query('COMMIT');
        return NextResponse.json({
          ok: true,
          asignados: asignaciones.length,
          graduado: estadoGraduado.rows[0],
          invitados: estadoInvitados.rows,
        }, { headers });
      } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error al asignar butacas:', error);
        return NextResponse.json({ error: 'No se pudo guardar la asignación de butacas', detalle: error.message }, { status: 500, headers });
      } finally {
        client.release();
      }
    }

    if (slug[0] === 'egresados' && slug[2] === 'entregador' && slug[1]) {
      const id = slug[1];
      const esAutorizado = await esAutorizadoPersonalOEgresado(req, id, ROLES_GESTION);
      if (!esAutorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { nombre } = body;
      await query('UPDATE egresados SET entregador_nombre = $1 WHERE id = $2', [nombre, id]);
      return NextResponse.json({ ok: true, entregador_nombre: nombre }, { headers });
    }

    if (slug[0] === 'egresados' && slug[2] === 'responder-invitacion' && slug[1]) {
      const id = slug[1];
      const esAutorizado = await esAutorizadoPersonalOEgresado(req, id, ROLES_GESTION);
      if (!esAutorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { respuesta, acompañantes, asientoId } = body;
      const respuestaRecibida = String(respuesta).toUpperCase();
      const respuestaUpper = respuestaRecibida === 'CONFIRMADO' ? 'ACEPTADO' : respuestaRecibida;

      if (!['ACEPTADO', 'RECHAZADO'].includes(respuestaUpper)) {
        return NextResponse.json({ error: 'Respuesta inválida. Debe ser ACEPTADO o RECHAZADO' }, { status: 400, headers });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        if (respuestaUpper === 'RECHAZADO') {
          // Si rechaza, borramos sus invitados ya guardados y liberamos su asiento
          await client.query('DELETE FROM invitados WHERE egresado_id = $1', [id]);
          await client.query(
            "UPDATE egresados SET estado = 'RECHAZADO', asiento_id = NULL, entregador_nombre = NULL WHERE id = $1",
            [id]
          );
        } else {
          // Si confirma
          const formulaJura = body.formulaJuramento || body.formula_juramento;
          const comentariosTxt = body.comentarios;
          await client.query(
            `UPDATE egresados 
             SET estado = 'ACEPTADO', 
                 asiento_id = COALESCE($1, asiento_id),
                 formula_juramento = COALESCE($3, formula_juramento, 'PATRIA'),
                 comentarios = COALESCE($4, comentarios)
             WHERE id = $2`,
            [asientoId || null, id, formulaJura || null, comentariosTxt || null]
          );

          if (Array.isArray(acompañantes)) {
            // Eliminar los invitados anteriores
            await client.query('DELETE FROM invitados WHERE egresado_id = $1', [id]);
            
            // Insertar los nuevos
            for (const ac of acompañantes) {
              const dniLimpio = String(ac.dni).replace(/\s/g, '');
              await client.query(
                `INSERT INTO invitados (egresado_id, nombre, dni, telefono, correo, relacion, menor_en_brazos, discapacidad) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [id, ac.nombre.trim(), dniLimpio, String(ac.telefono || '').trim() || null, (ac.correo || '').trim() || null, ac.relacion, Boolean(ac.menor_en_brazos || ac.menorEnBrazos), Boolean(ac.discapacidad)]
              );
            }
          }
        }

        await client.query('COMMIT');
        return NextResponse.json({ ok: true }, { headers });
      } catch (error: any) {
        await client.query('ROLLBACK');
        console.error("Error en responder invitación:", error);
        return NextResponse.json({ error: 'Error al registrar respuesta', detalle: error.message }, { status: 500, headers });
      } finally {
        client.release();
      }
    }

    // Fallback: 404 para PUT
    return NextResponse.json({ error: `Ruta PUT '${path}' no encontrada` }, { status: 404, headers });

  } catch (error: any) {
    console.error(`Error en PUT /api/${path}:`, error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500, headers });
  }
}

// MAIN HANDLER FOR DELETE REQUESTS
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  await asegurarInicializacion();
  const { slug } = await params;
  const headers = corsHeaders(req);
  const path = slug.join('/');

  try {
    // -------------------------------------------------------------
    // CEREMONIAS
    // -------------------------------------------------------------
    if (slug[0] === 'ceremonias' && slug[1] && !slug[2]) {
      const id = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query('DELETE FROM ceremonias WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Ceremonia no encontrada' }, { status: 404, headers });
      }
      return NextResponse.json({ ok: true, mensaje: 'Ceremonia eliminada con éxito' }, { headers });
    }

    // -------------------------------------------------------------
    // USUARIOS
    // -------------------------------------------------------------
    if (slug[0] === 'usuarios' && slug[1] && !slug[2]) {
      const id = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      if (await esUltimoSuperAdmin(id)) {
        return NextResponse.json({ error: 'No podés eliminar al último SUPER_ADMIN activo del sistema' }, { status: 409, headers });
      }

      await query('DELETE FROM ceremonias_usuarios_autorizados WHERE usuario_id = $1', [id]);
      await query('DELETE FROM tokens_recuperacion_contrasena WHERE usuario_id = $1', [id]);
      await query('DELETE FROM sesiones_porteria WHERE usuario_id = $1', [id]);
      const result = await query('DELETE FROM usuarios_sistema WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404, headers });
      }
      return NextResponse.json({ ok: true, mensaje: 'Usuario eliminado con éxito' }, { headers });
    }

    // -------------------------------------------------------------
    // PROFESORES
    // -------------------------------------------------------------
    if (slug[0] === 'profesores' && slug[1] && !slug[2]) {
      const id = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query(
        'UPDATE profesores SET activo = 0 WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404, headers });
      }

      return NextResponse.json({ ok: true, mensaje: 'Profesor desactivado correctamente' }, { headers });
    }

    // -------------------------------------------------------------
    // ENTREGADORES
    // -------------------------------------------------------------
    if (slug[0] === 'entregadores' && slug[1] && !slug[2]) {
      const id = slug[1];
      
      const checkRes = await query('SELECT egresado_id FROM entregadores WHERE id = $1', [id]);
      const egresadoId = checkRes.rows[0]?.egresado_id;
      if (!egresadoId) return NextResponse.json({ error: 'Entregador no encontrado' }, { status: 404, headers });

      const esAutorizado = await esAutorizadoPersonalOEgresado(req, egresadoId, ROLES_GESTION);
      if (!esAutorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query('DELETE FROM entregadores WHERE id = $1 RETURNING *', [id]);
      return NextResponse.json({ ok: true, mensaje: 'Entregador removido correctamente' }, { headers });
    }

    // -------------------------------------------------------------
    // INVITADOS
    // -------------------------------------------------------------
    if (slug[0] === 'invitados' && slug[1] && !slug[2]) {
      const id = slug[1];
      
      const checkRes = await query('SELECT egresado_id, asiento_id, asiento_solicitado_id FROM invitados WHERE id = $1', [id]);
      const invitado = checkRes.rows[0];
      if (!invitado) return NextResponse.json({ error: 'Invitado no encontrado' }, { status: 404, headers });
      const egresadoId = invitado.egresado_id;

      const esAutorizado = await esAutorizadoPersonalOEgresado(req, egresadoId, ROLES_GESTION);
      if (!esAutorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      await query('DELETE FROM entregadores WHERE invitado_id = $1', [id]);
      await query('DELETE FROM invitados WHERE id = $1', [id]);

      // Si el grupo estaba CONFIRMADA o si el invitado eliminado tenía asiento asignado, pasar a PENDIENTE_REVISION
      const egresadoRes = await query('SELECT estado_asignacion_butacas FROM egresados WHERE id = $1', [egresadoId]);
      if (egresadoRes.rows[0]?.estado_asignacion_butacas === 'CONFIRMADA' || invitado.asiento_id || invitado.asiento_solicitado_id) {
        await query("UPDATE egresados SET estado_asignacion_butacas = 'PENDIENTE_REVISION' WHERE id = $1", [egresadoId]);
      }

      return NextResponse.json({ ok: true, mensaje: 'Invitado eliminado' }, { headers });
    }

    // -------------------------------------------------------------
    // EGRESADOS (VACIAS O INDIVIDUAL)
    // -------------------------------------------------------------
    if (path === 'egresados') {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      // Vacia los egresados de la ceremonia activa
      await query('DELETE FROM egresados WHERE ceremonia_id IN (SELECT id FROM ceremonias WHERE activa = 1)');
      return NextResponse.json({ ok: true, mensaje: 'Se vació la lista de egresados de la ceremonia activa' }, { headers });
    }

    if (slug[0] === 'egresados' && slug[1] && !slug[2]) {
      const id = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query('DELETE FROM egresados WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Graduado no encontrado' }, { status: 404, headers });
      }
      return NextResponse.json({ ok: true, mensaje: 'Graduado eliminado con éxito' }, { headers });
    }

    // Fallback: 404 para DELETE
    return NextResponse.json({ error: `Ruta DELETE '${path}' no encontrada` }, { status: 404, headers });

  } catch (error: any) {
    console.error(`Error en DELETE /api/${path}:`, error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500, headers });
  }
}
