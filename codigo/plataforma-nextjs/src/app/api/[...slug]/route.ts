import { NextRequest, NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { firmar } from '@/lib/tokens';
import { obtenerUsuarioAutenticado, ROLES_GESTION, ROLES_OPERACION, ROLES_LECTURA } from '@/lib/auth-middleware';
import * as GestorOTP from '@/lib/otp';
import { enviarCorreo, generarPlantillaInvitacion, generarPlantillaOTP } from '@/lib/email';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const RONDAS_BCRYPT = 12;
const LARGO_MINIMO_PASSWORD = 8;
const ROLES_VALIDOS = ['SUPER_ADMIN', 'ADMINISTRATIVO', 'ADMIN', 'PORTERIA', 'AUDITOR'];

// CORS configuration utility
function corsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Bypass-Tunnel-Reminder',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Global dynamic rate limiter
const rateLimits = new Map<string, { contador: number; reinicio: number }>();
function verificarRateLimit(key: string, limit: number, windowMs: number) {
  const ahora = Date.now();
  let reg = rateLimits.get(key);
  if (!reg || ahora > reg.reinicio) {
    reg = { contador: 0, reinicio: ahora + windowMs };
    rateLimits.set(key, reg);
  }
  reg.contador++;
  if (reg.contador > limit) {
    const segundosRestantes = Math.ceil((reg.reinicio - ahora) / 1000);
    return { permitido: false, segundosRestantes };
  }
  return { permitido: true, segundosRestantes: 0 };
}

// Helpers for permission checks
async function esAutorizadoPersonalOEgresado(req: NextRequest, egresadoId: string | number, rolesPermitidos = ROLES_GESTION) {
  const auth = obtenerUsuarioAutenticado(req);
  if (!auth.valido) return false;
  const datos = auth.datos!;
  if (datos.tipo === 'personal' && datos.rol && rolesPermitidos.includes(datos.rol)) {
    return true;
  }
  if (datos.tipo === 'egresado' && String(datos.id) === String(egresadoId)) {
    return true;
  }
  return false;
}

async function esPersonalValido(req: NextRequest, rolesPermitidos = ROLES_LECTURA) {
  const auth = obtenerUsuarioAutenticado(req);
  if (!auth.valido) return false;
  const datos = auth.datos!;
  return datos.tipo === 'personal' && datos.rol && rolesPermitidos.includes(datos.rol);
}

async function esUltimoSuperAdmin(id: string) {
  const result = await query(
    `SELECT COUNT(*) AS total FROM usuarios_sistema
     WHERE rol = 'SUPER_ADMIN' AND activo = 1 AND id <> $1`,
    [id]
  );
  return parseInt(result.rows[0]?.total ?? '0', 10) === 0;
}

// MAIN HANDLER FOR GET REQUESTS
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const headers = corsHeaders(req);
  const path = slug.join('/');

  try {
    // -------------------------------------------------------------
    // SETUP STATUS
    // -------------------------------------------------------------
    if (path === 'setup/status') {
      const usuarios = await query('SELECT COUNT(*)::int AS total FROM usuarios_sistema');
      const ceremonias = await query('SELECT COUNT(*)::int AS total FROM ceremonias');
      const egresados = await query('SELECT COUNT(*)::int AS total FROM egresados');
      const invitados = await query('SELECT COUNT(*)::int AS total FROM invitados');

      const totalUsuarios = usuarios.rows[0]?.total ?? 0;
      const flagSetup = await query(
        "SELECT valor FROM configuracion_sistema WHERE clave = 'setup_inicial_completado' LIMIT 1"
      );
      const setupCompleto = flagSetup.rows[0]?.valor === '1';

      return NextResponse.json({
        requiereConfiguracionInicial: totalUsuarios === 0 || !setupCompleto,
        metricas: {
          usuarios: totalUsuarios,
          ceremonias: ceremonias.rows[0]?.total ?? 0,
          egresados: egresados.rows[0]?.total ?? 0,
          invitados: invitados.rows[0]?.total ?? 0,
        },
        setupCompleto,
      }, { headers });
    }

    // -------------------------------------------------------------
    // STATS
    // -------------------------------------------------------------
    if (path === 'stats') {
      const auth = obtenerUsuarioAutenticado(req, ROLES_LECTURA);
      if (!auth.valido) return NextResponse.json({ error: auth.error }, { status: auth.statusCode, headers });

      const ceremoniaRes = await query('SELECT id FROM ceremonias WHERE activa = 1 LIMIT 1');
      if (ceremoniaRes.rowCount === 0) {
        return NextResponse.json({
          totalEgresados: 0, totalInvitados: 0, presentes: 0, ausentes: 0,
          porcentajeAsistencia: 0, ultimosIngresos: [],
          mensaje: 'No hay una ceremonia activa configurada'
        }, { headers });
      }
      const ceremoniaId = ceremoniaRes.rows[0].id;

      const egresadosCount = await query('SELECT COUNT(*) as total FROM egresados WHERE ceremonia_id = $1', [ceremoniaId]);
      const invitadosStats = await query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN i.presente = 1 THEN 1 ELSE 0 END) as presentes
        FROM invitados i
        JOIN egresados e ON i.egresado_id = e.id
        WHERE e.ceremonia_id = $1
      `, [ceremoniaId]);

      const totalEgresados = parseInt(egresadosCount.rows[0].total || '0');
      const totalInvitados = parseInt(invitadosStats.rows[0].total || '0');
      const presentes = parseInt(invitadosStats.rows[0].presentes || '0');
      const ausentes = totalInvitados - presentes;
      const porcentajeAsistencia = totalInvitados > 0 ? Math.round((presentes / totalInvitados) * 100) : 0;

      const ingresosQuery = `
        SELECT i.*, e.nombre as "egresadoNombre"
        FROM invitados i
        JOIN egresados e ON i.egresado_id = e.id
        WHERE i.presente = 1 AND e.ceremonia_id = $1
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
        totalEgresados,
        totalInvitados,
        presentes,
        ausentes,
        porcentajeAsistencia,
        ultimosIngresos,
        timestamp: new Date().toISOString(),
      }, { headers });
    }

    // -------------------------------------------------------------
    // CONFIGURACIÓN
    // -------------------------------------------------------------
    if (path === 'configuracion') {
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

      return NextResponse.json(ajustes, { headers });
    }

    // CONFIG ANFITEATRO ESTRUCTURA POR CEREMONIA
    if (slug[0] === 'configuracion' && slug[1] === 'anfiteatro' && slug[2] === 'estructura' && slug[3]) {
      const ceremoniaId = slug[3];
      const result = await query(
        'SELECT * FROM configuracion_anfiteatro WHERE ceremonia_id = $1 ORDER BY actualizado_en DESC LIMIT 1',
        [ceremoniaId]
      );
      if (result.rows.length === 0) {
        return NextResponse.json({
          estructura: { 
            baja: { filas: 8, asientos: 16 },
            alta: { filas: 6, asientos: 20 }
          },
          mapaRoles: {}
        }, { headers });
      }
      const data = result.rows[0];
      return NextResponse.json({
        estructura: typeof data.estructura === 'string' ? JSON.parse(data.estructura) : data.estructura,
        mapaRoles: typeof data.mapa_roles === 'string' ? JSON.parse(data.mapa_roles) : data.mapa_roles
      }, { headers });
    }

    // -------------------------------------------------------------
    // ANFITEATRO CONFIG
    // -------------------------------------------------------------
    if (path === 'anfiteatro/config') {
      const result = await query(
        'SELECT estructura, mapa_roles FROM configuracion_anfiteatro ORDER BY actualizado_en DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json({
          estructura: { baja: { filas: 8, asientos: 16 }, alta: { filas: 6, asientos: 20 } },
          mapaRoles: {}
        }, { headers });
      }

      const { estructura, mapa_roles } = result.rows[0];
      return NextResponse.json({
        estructura: typeof estructura === 'string' ? JSON.parse(estructura) : estructura,
        mapaRoles: typeof mapa_roles === 'string' ? JSON.parse(mapa_roles) : mapa_roles
      }, { headers });
    }

    // -------------------------------------------------------------
    // CEREMONIAS
    // -------------------------------------------------------------
    if (path === 'ceremonias') {
      const result = await query('SELECT * FROM ceremonias ORDER BY fecha DESC');
      return NextResponse.json(result.rows, { headers });
    }

    if (path === 'ceremonias/activa') {
      const result = await query('SELECT * FROM ceremonias WHERE activa = 1 LIMIT 1');
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'No hay ninguna ceremonia activa' }, { status: 404, headers });
      }
      return NextResponse.json(result.rows[0], { headers });
    }

    // -------------------------------------------------------------
    // PROFESORES
    // -------------------------------------------------------------
    if (path === 'profesores') {
      const result = await query('SELECT * FROM profesores WHERE activo = 1 ORDER BY nombre');
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
        `SELECT id, nombre, email, rol, activo, ultimo_login, creado_en
         FROM usuarios_sistema
         ORDER BY creado_en DESC`
      );
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

      const queryStr = `
        SELECT i.*, e.nombre as "egresadoNombre", e.legajo as "egresadoLegajo"
        FROM invitados i
        JOIN egresados e ON i.egresado_id = e.id
        JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE c.activa = 1
        ORDER BY i.creado_en DESC
      `;
      const result = await query(queryStr);
      return NextResponse.json(result.rows, { headers });
    }

    if (slug[0] === 'invitados' && slug[1] === 'buscar' && slug[2]) {
      const codigo = slug[2];
      const isPersonal = await esPersonalValido(req, ROLES_OPERACION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      // 1. Intentar como ID de invitado individual
      const invRes = await query(`
        SELECT i.*, e.nombre as "egresadoNombre" 
        FROM invitados i 
        JOIN egresados e ON i.egresado_id = e.id 
        JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE i.id = $1 AND c.activa = 1
      `, [codigo]);

      if (invRes.rows.length > 0) {
        return NextResponse.json({ tipo: 'individual', datos: invRes.rows[0] }, { headers });
      }

      // 2. Intentar como Token de egresado
      const egrRes = await query(`
        SELECT e.* 
        FROM egresados e 
        JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE UPPER(e.token) = UPPER($1) AND c.activa = 1
      `, [codigo]);

      if (egrRes.rows.length > 0) {
        const egr = egrRes.rows[0];
        const invs = await query('SELECT * FROM invitados WHERE egresado_id = $1', [egr.id]);
        return NextResponse.json({ tipo: 'grupo', egresado: egr, invitados: invs.rows }, { headers });
      }

      return NextResponse.json({ error: 'Código no válido para esta ceremonia' }, { status: 404, headers });
    }

    if (slug[0] === 'invitados' && slug[1] === 'egresado' && slug[2]) {
      const egresadoId = slug[2];
      const esAutorizado = await esAutorizadoPersonalOEgresado(req, egresadoId, ROLES_LECTURA);
      if (!esAutorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query('SELECT * FROM invitados WHERE egresado_id = $1', [egresadoId]);
      return NextResponse.json(result.rows, { headers });
    }

    // -------------------------------------------------------------
    // EGRESADOS
    // -------------------------------------------------------------
    if (path === 'egresados') {
      const isPersonal = await esPersonalValido(req, ROLES_LECTURA);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const queryStr = `
        SELECT e.*, c.nombre as "ceremoniaNombre"
        FROM egresados e
        LEFT JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE c.activa = 1
        ORDER BY e.nombre
      `;
      const result = await query(queryStr);
      return NextResponse.json(result.rows, { headers });
    }

    if (slug[0] === 'egresados' && slug[1] === 'token' && slug[2]) {
      const token = slug[2];
      const result = await query(`
        SELECT e.* 
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
    // -------------------------------------------------------------
    // SETUP INITIALIZE
    // -------------------------------------------------------------
    if (path === 'setup/initialize') {
      const {
        nombre,
        email,
        password,
        nombreEvento = 'Ceremonia de Colación',
        fechaEvento = '2026-12-01',
        lugarEvento = 'Sede Beltrán',
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

      await query(
        'INSERT INTO configuracion_anfiteatro (estructura, mapa_roles, actualizado_en) VALUES ($1, $2, CURRENT_TIMESTAMP)',
        [estructura, mapaRoles]
      );
      return NextResponse.json({ mensaje: 'Configuración guardada con éxito en la base de datos' }, { headers });
    }

    // -------------------------------------------------------------
    // CEREMONIAS
    // -------------------------------------------------------------
    if (path === 'ceremonias') {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { nombre, fecha, lugar, max_invitados, max_entregadores } = body;
      if (!nombre || !fecha) {
        return NextResponse.json({ error: 'El nombre y la fecha son obligatorios' }, { status: 400, headers });
      }

      const id = `cer-${Date.now()}`;
      await query(
        'INSERT INTO ceremonias (id, nombre, fecha, lugar, max_invitados, max_entregadores, activa) VALUES ($1, $2, $3, $4, $5, $6, 0)',
        [id, nombre, fecha, lugar || 'Sede Beltrán', max_invitados || 4, max_entregadores || 3]
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
      const conteoRes = await query('SELECT COUNT(*) as total FROM entregadores WHERE egresado_id = $1', [egresado_id]);
      const totalActual = parseInt(conteoRes.rows[0].total || '0', 10);

      if (totalActual >= maxEntregadores) {
        return NextResponse.json({ error: `El graduado ya tiene el máximo de entregadores permitidos (${maxEntregadores})` }, { status: 400, headers });
      }

      try {
        const result = await query(
          `INSERT INTO entregadores (egresado_id, tipo, profesor_id, invitado_id, nombre, orden) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [egresado_id, tipo, profesor_id || null, invitado_id || null, nombre.trim(), orden || (totalActual + 1)]
        );
        return NextResponse.json(result.rows[0], { status: 201, headers });
      } catch (error: any) {
        if (error.message && error.message.includes('UNIQUE')) {
          return NextResponse.json({ error: 'Ya existe un entregador con ese orden para este graduado' }, { status: 409, headers });
        }
        throw error;
      }
    }

    // -------------------------------------------------------------
    // USUARIOS
    // -------------------------------------------------------------
    if (path === 'usuarios') {
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { nombre, email, password, rol } = body;
      const rolNormalizado = (rol || '').toString().toUpperCase();

      if (!nombre || !email || !password || !rolNormalizado) {
        return NextResponse.json({ error: 'Nombre, email, password y rol son obligatorios' }, { status: 400, headers });
      }
      if (!ROLES_VALIDOS.includes(rolNormalizado)) {
        return NextResponse.json({ error: 'Rol inválido' }, { status: 400, headers });
      }
      if (String(password).length < LARGO_MINIMO_PASSWORD) {
        return NextResponse.json({ error: `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres` }, { status: 400, headers });
      }

      const existe = await query('SELECT id FROM usuarios_sistema WHERE email = $1', [email.toLowerCase()]);
      if (existe.rows.length > 0) {
        return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409, headers });
      }

      const hash = await bcrypt.hash(password, RONDAS_BCRYPT);
      const id = crypto.randomUUID();

      await query(
        `INSERT INTO usuarios_sistema (id, nombre, email, password_hash, rol, activo)
         VALUES ($1, $2, $3, $4, $5, 1)`,
        [id, nombre, email.toLowerCase(), hash, rolNormalizado]
      );

      return NextResponse.json({ ok: true, usuario: { id, nombre, email: email.toLowerCase(), rol: rolNormalizado, activo: 1 } }, { headers });
    }

    // -------------------------------------------------------------
    // INVITADOS
    // -------------------------------------------------------------
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
          const existRes = await client.query('SELECT id FROM invitados WHERE dni = $1', [inv.dni]);
          if (existRes.rows.length > 0) {
            throw new Error(`El DNI ${inv.dni} ya está registrado en el sistema.`);
          }
        }

        const registrosFinales = [];
        for (const inv of nuevos) {
          const dniLimpio = inv.dni.replace(/\s/g, '');
          const insRes = await client.query(
            `INSERT INTO invitados (egresado_id, nombre, dni, telefono, correo, relacion)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [egresado.id, inv.nombre.trim(), dniLimpio, inv.telefono.trim(), (inv.correo || '').trim(), inv.relacion]
          );
          registrosFinales.push(insRes.rows[0]);
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

      const { nombre, legajo, dni, correo, carrera, anio_inscripcion, promedio, ceremonia_id } = body;
      if (!nombre || !legajo || !dni) {
        return NextResponse.json({ error: 'Nombre, legajo y DNI son obligatorios' }, { status: 400, headers });
      }

      const token = firmar({ tipo: 'egresado', id: legajo }, 10 * 365 * 24 * 60 * 60).substring(0, 8).toUpperCase(); // simpler legacy fallback token

      const result = await query(
        `INSERT INTO egresados (nombre, legajo, dni, correo, token, ceremonia_id, carrera, anio_inscripcion, promedio) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          nombre.trim(), 
          legajo.trim(), 
          dni.replace(/\s/g, ''), 
          correo ? correo.trim().toLowerCase() : null, 
          token, 
          ceremonia_id,
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
        const resultados = [];
        
        for (const e of egresados) {
          const token = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8-char secure code
          const result = await client.query(
            `INSERT INTO egresados (nombre, legajo, dni, correo, token, ceremonia_id, carrera, anio_inscripcion, promedio) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
              e.nombre.trim(), 
              e.legajo.trim(), 
              String(e.dni).replace(/\s/g, ''), 
              e.correo ? e.correo.trim().toLowerCase() : null, 
              token, 
              e.ceremonia_id,
              e.carrera ? e.carrera.trim() : null, 
              e.anio_inscripcion ? parseInt(e.anio_inscripcion) : null, 
              e.promedio ? parseFloat(e.promedio) : null
            ]
          );
          resultados.push(result.rows[0]);
        }
        
        await client.query('COMMIT');
        return NextResponse.json({ ok: true, importados: resultados.length }, { headers });
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

      const hostBase = process.env.FRONTEND_URL || req.headers.get('origin') || 'http://localhost:3000';
      const linkAcceso = `${hostBase}/?token=${graduado.token}`;
      const plantilla = generarPlantillaInvitacion(graduado.nombre, linkAcceso, hostBase);
      
      await enviarCorreo(graduado.correo, 'Invitación a Ceremonia de Colación - SiGIC', plantilla);
      return NextResponse.json({ ok: true, mensaje: 'Invitación enviada correctamente' }, { headers });
    }

    if (path === 'egresados/solicitar-otp') {
      const { email } = body;
      if (!email) return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400, headers });

      const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
      const limitControl = verificarRateLimit(`otp-req-${ip}`, 5, 10 * 60 * 1000);
      if (!limitControl.permitido) {
        return NextResponse.json({ error: `Demasiadas solicitudes. Esperá ${limitControl.segundosRestantes} segundos.` }, { status: 429, headers });
      }

      const result = await query(`
        SELECT e.* 
        FROM egresados e
        JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE LOWER(e.correo) = LOWER($1) AND c.activa = 1
      `, [email]);
      
      const graduado = result.rows[0];
      if (!graduado) return NextResponse.json({ error: 'Correo no registrado en esta ceremonia' }, { status: 404, headers });
      
      if (graduado.estado === 'RECHAZADO') {
        return NextResponse.json({ error: 'Confirmaste tu inasistencia a esta ceremonia.' }, { status: 403, headers });
      }

      const { codigo: otp, hash: otpHash, expiracion: expiration } = GestorOTP.generar({ longitud: 6, minutosExpiracion: 10 });

      await query('UPDATE egresados SET otp = $1, otp_expira = $2 WHERE id = $3', [otp, expiration, graduado.id]);
      await query(
        `INSERT INTO otp_historial (egresado_id, otp_hash, ip_origen, resultado)
         VALUES ($1, $2, $3, 'ENVIADO')`,
        [graduado.id, otpHash, ip]
      );

      const hostBase = process.env.FRONTEND_URL || req.headers.get('origin') || 'http://localhost:3000';
      const htmlOTP = generarPlantillaOTP(otp, hostBase);
      await enviarCorreo(graduado.correo, 'Tu código de acceso - SiGIC', htmlOTP);
      return NextResponse.json({ ok: true, mensaje: 'Código enviado correctamente' }, { headers });
    }

    if (path === 'egresados/verificar-otp') {
      const { email, otp: otpStr } = body;
      if (!email || !otpStr) return NextResponse.json({ error: 'Email y código OTP requeridos' }, { status: 400, headers });

      const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
      const limitControl = verificarRateLimit(`otp-ver-${ip}`, 10, 10 * 60 * 1000);
      if (!limitControl.permitido) {
        return NextResponse.json({ error: `Demasiados intentos. Esperá ${limitControl.segundosRestantes} segundos.` }, { status: 429, headers });
      }

      const result = await query(`
        SELECT e.* 
        FROM egresados e
        JOIN ceremonias c ON e.ceremonia_id = c.id
        WHERE LOWER(e.correo) = LOWER($1) AND c.activa = 1
      `, [email]);
      
      const graduado = result.rows[0];
      if (!graduado) return NextResponse.json({ error: 'Graduado no registrado' }, { status: 404, headers });

      const otpHash = GestorOTP.hashear(otpStr);
      const estadoOTP = GestorOTP.verificar(otpStr, graduado.otp, graduado.otp_expira);

      await query(
        `INSERT INTO otp_historial (egresado_id, otp_hash, ip_origen, resultado)
         VALUES ($1, $2, $3, $4)`,
        [graduado.id, otpHash, ip, estadoOTP]
      );

      if (estadoOTP === 'EXPIRADO') return NextResponse.json({ error: 'El código OTP ha expirado' }, { status: 400, headers });
      if (estadoOTP === 'CODIGO_INVALIDO') return NextResponse.json({ error: 'Código incorrecto' }, { status: 400, headers });

      // Clean OTP after verification
      await query('UPDATE egresados SET otp = NULL, otp_expira = NULL WHERE id = $1', [graduado.id]);

      const tokenSesion = firmar({ tipo: 'egresado', id: graduado.id, nombre: graduado.nombre }, 4 * 60 * 60);
      return NextResponse.json({ ok: true, token_sesion: tokenSesion, egresado: graduado }, { headers });
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
        return NextResponse.json({ ok: true, mensaje: `Hábitat actualizado (${clave})` }, { headers });
      }

      const result = await query(
        `UPDATE configuracion_sistema
         SET valor = $1, actualizado_en = CURRENT_TIMESTAMP
         WHERE clave = $2
         RETURNING *`,
        [String(valor), clave]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ error: `La clave "${clave}" no existe` }, { status: 404, headers });
      }

      return NextResponse.json({ ok: true, ajuste: result.rows[0] }, { headers });
    }

    // -------------------------------------------------------------
    // CEREMONIAS
    // -------------------------------------------------------------
    if (slug[0] === 'ceremonias' && slug[2] === 'activar' && slug[1]) {
      const id = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      await query('UPDATE ceremonias SET activa = 0');
      const result = await query('UPDATE ceremonias SET activa = 1 WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Ceremonia no encontrada' }, { status: 404, headers });
      }

      return NextResponse.json({ ok: true, mensaje: 'Ceremonia activada correctamente' }, { headers });
    }

    if (slug[0] === 'ceremonias' && slug[1] && !slug[2]) {
      const id = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_GESTION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { nombre, fecha, lugar, max_invitados, max_entregadores } = body;
      const result = await query(
        'UPDATE ceremonias SET nombre = $1, fecha = $2, lugar = $3, max_invitados = $4, max_entregadores = $5 WHERE id = $6 RETURNING *',
        [nombre, fecha, lugar, max_invitados || 4, max_entregadores || 3, id]
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
    // INVITADOS (PRESENTE / MASIVO / UPDATE)
    // -------------------------------------------------------------
    if (slug[0] === 'invitados' && slug[2] === 'presente' && slug[1]) {
      const id = slug[1];
      const isPersonal = await esPersonalValido(req, ROLES_OPERACION);
      if (!isPersonal) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query(
        "UPDATE invitados SET presente = TRUE, fecha_presente = CURRENT_TIMESTAMP WHERE id = $1 AND presente = FALSE RETURNING *",
        [id]
      );
      if (result.rowCount === 0) return NextResponse.json({ error: 'Invitado no encontrado o ya ingresó' }, { status: 400, headers });
      return NextResponse.json({ ok: true, mensaje: 'Ingreso confirmado' }, { headers });
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
      return NextResponse.json({ ok: true, cantidad_ingresos: result.rowCount }, { headers });
    }

    if (slug[0] === 'invitados' && slug[1] && !slug[2]) {
      const id = slug[1];
      
      // lookup egresado owner for invitados
      const checkRes = await query('SELECT egresado_id FROM invitados WHERE id = $1', [id]);
      const egresadoId = checkRes.rows[0]?.egresado_id;
      if (!egresadoId) return NextResponse.json({ error: 'Invitado no encontrado' }, { status: 404, headers });

      const esAutorizado = await esAutorizadoPersonalOEgresado(req, egresadoId, ROLES_GESTION);
      if (!esAutorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { nombre, dni, telefono, correo, relacion } = body;
      const result = await query(
        `UPDATE invitados 
         SET nombre = $1, dni = $2, telefono = $3, correo = $4, relacion = $5 
         WHERE id = $6 RETURNING *`,
        [nombre, dni, telefono, correo, relacion, id]
      );
      return NextResponse.json(result.rows[0], { headers });
    }

    // -------------------------------------------------------------
    // EGRESADOS (ASIENTOS / ENTREGADOR / RESPONDER)
    // -------------------------------------------------------------
    if (slug[0] === 'egresados' && slug[2] === 'asientos' && slug[1]) {
      const id = slug[1];
      const esAutorizado = await esAutorizadoPersonalOEgresado(req, id, ROLES_GESTION);
      if (!esAutorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const { asientoId } = body;
      await query('UPDATE egresados SET asiento_id = $1 WHERE id = $2', [asientoId, id]);
      return NextResponse.json({ ok: true, asientoId }, { headers });
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
      const respuestaUpper = String(respuesta).toUpperCase();

      if (!['CONFIRMADO', 'RECHAZADO'].includes(respuestaUpper)) {
        return NextResponse.json({ error: 'Respuesta inválida. Debe ser CONFIRMADO o RECHAZADO' }, { status: 400, headers });
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
          await client.query(
            "UPDATE egresados SET estado = 'CONFIRMADO', asiento_id = $1 WHERE id = $2",
            [asientoId || null, id]
          );

          if (Array.isArray(acompañantes)) {
            // Eliminar los invitados anteriores
            await client.query('DELETE FROM invitados WHERE egresado_id = $1', [id]);
            
            // Insertar los nuevos
            for (const ac of acompañantes) {
              const dniLimpio = String(ac.dni).replace(/\s/g, '');
              await client.query(
                `INSERT INTO invitados (egresado_id, nombre, dni, telefono, correo, relacion) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [id, ac.nombre.trim(), dniLimpio, ac.telefono.trim(), (ac.correo || '').trim(), ac.relacion]
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
      
      const checkRes = await query('SELECT egresado_id FROM invitados WHERE id = $1', [id]);
      const egresadoId = checkRes.rows[0]?.egresado_id;
      if (!egresadoId) return NextResponse.json({ error: 'Invitado no encontrado' }, { status: 404, headers });

      const esAutorizado = await esAutorizadoPersonalOEgresado(req, egresadoId, ROLES_GESTION);
      if (!esAutorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403, headers });

      const result = await query('DELETE FROM invitados WHERE id = $1 RETURNING *', [id]);
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
