import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { obtenerUsuarioAutenticado, ROLES_GESTION, ROLES_LECTURA } from '@/lib/auth-middleware';

export const RONDAS_BCRYPT = 12;
export const LARGO_MINIMO_PASSWORD = 8;
export const ROLES_VALIDOS = ['SUPER_ADMIN', 'ADMINISTRATIVO', 'ADMIN', 'PORTERIA', 'AUDITOR'];

export function prepararIdentificadorGraduado(valor: unknown) {
  const identificador = String(valor || '').trim();
  const esCorreo = identificador.includes('@');
  const normalizado = esCorreo ? identificador.toLowerCase() : identificador.replace(/\D/g, '');
  return { identificador, esCorreo, normalizado };
}

export function ocultarCorreo(correo: string) {
  const [usuario = '', dominio = ''] = correo.split('@');
  const visible = usuario.slice(0, Math.min(2, usuario.length));
  return `${visible}${'*'.repeat(Math.max(3, usuario.length - visible.length))}@${dominio}`;
}

export function corsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Bypass-Tunnel-Reminder',
    'Access-Control-Allow-Credentials': 'true',
  };
}

const rateLimits = new Map<string, { contador: number; reinicio: number }>();
export function verificarRateLimit(key: string, limit: number, windowMs: number) {
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

export async function esAutorizadoPersonalOEgresado(
  req: NextRequest,
  egresadoId: string | number,
  rolesPermitidos = ROLES_GESTION
) {
  const authPersonal = obtenerUsuarioAutenticado(req, rolesPermitidos);
  if (authPersonal.valido && authPersonal.datos?.tipo === 'personal') return true;

  const auth = obtenerUsuarioAutenticado(req);
  if (!auth.valido) return false;
  const datos = auth.datos!;
  if (datos.tipo === 'egresado' && String(datos.id) === String(egresadoId)) {
    return true;
  }
  return false;
}

export async function esPersonalValido(req: NextRequest, rolesPermitidos = ROLES_LECTURA) {
  const auth = obtenerUsuarioAutenticado(req, rolesPermitidos);
  if (!auth.valido) return false;
  const datos = auth.datos!;
  const esRolValido = datos.tipo === 'personal' && datos.rol && rolesPermitidos.includes(datos.rol);
  if (!esRolValido) return false;

  if (datos.rol === 'SUPER_ADMIN') return true;

  if (datos.rol === 'PORTERIA') {
    const activeCer = await query('SELECT id FROM ceremonias WHERE activa = 1 LIMIT 1');
    if (activeCer.rows.length === 0) return false;
    
    const authCheck = await query(
      'SELECT 1 FROM ceremonias_usuarios_autorizados WHERE ceremonia_id = $1 AND usuario_id = $2',
      [activeCer.rows[0].id, datos.id]
    );
    return authCheck.rows.length > 0;
  }

  return true;
}

export async function registrarAuditoriaOTP(
  egresadoId: string | number,
  otpHash: string,
  ip: string,
  resultado: string
) {
  try {
    await query(
      `INSERT INTO otp_historial (egresado_id, otp_hash, ip_origen, resultado)
       VALUES ($1, $2, $3, $4)`,
      [egresadoId, otpHash, ip, resultado]
    );
  } catch (error) {
    console.error('No se pudo registrar la auditoría OTP:', error);
  }
}

export async function esUltimoSuperAdmin(id: string) {
  const result = await query(
    `SELECT COUNT(*) AS total FROM usuarios_sistema
     WHERE rol = 'SUPER_ADMIN' AND activo = 1 AND id <> $1`,
    [id]
  );
  return parseInt(result.rows[0]?.total ?? '0', 10) === 0;
}
