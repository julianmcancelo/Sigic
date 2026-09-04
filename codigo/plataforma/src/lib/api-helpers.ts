import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { obtenerUsuarioAutenticado, ROLES_GESTION, ROLES_LECTURA } from '@/lib/auth-middleware';
import { decodificarCodigoGoogleWallet } from '@jcancelo/google-wallet';

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

export interface ParametrosBusquedaAcreditacion {
  codigoLimpio: string;
  token?: string;
  id?: string;
  dni?: string;
  legajo?: string;
  esIndividual: boolean;
  esGrupo: boolean;
  formatoOriginal: string;
}

/**
 * Decodificador universal de códigos QR, tokens de Wallet, URLs, JSON de credenciales y DNI.
 */
export function parsearCodigoAcreditacion(codigoRaw: string): ParametrosBusquedaAcreditacion {
  let codigo = String(codigoRaw || '').trim();
  const formatoOriginal = codigo;

  // 1. Decodificar mediante @jcancelo/google-wallet (JWT de Google Wallet, Object ID o prefijo SIGIC)
  try {
    const decodificado = decodificarCodigoGoogleWallet(codigo);
    if (decodificado.tokenOriginal && decodificado.formato !== 'directo') {
      codigo = decodificado.tokenOriginal;
    } else if (decodificado.codigoLimpio && decodificado.formato !== 'directo') {
      codigo = decodificado.codigoLimpio;
    }
  } catch (e) {
    console.warn('Aviso en decodificación de Google Wallet:', e);
  }

  // 2. Extraer token si es un Google Wallet Object ID remanente: issuer.sigic-ceremonia-token
  const matchObjId = codigo.match(/\.sigic[_-][^_-]+[_-](.+)$/i);
  if (matchObjId) {
    codigo = matchObjId[1].trim();
  }

  // 3. Quitar prefijo de Google Wallet o escáneres con prefijo institucional
  if (/^SIGIC:/i.test(codigo)) {
    codigo = codigo.replace(/^SIGIC:/i, '').trim();
  }

  // 4. Si es una URL (ej: https://.../?token=XYZ o /egresado/token/XYZ)
  if (/^https?:\/\//i.test(codigo) || codigo.includes('token=')) {
    try {
      const url = new URL(codigo.startsWith('http') ? codigo : `https://sigic.local/${codigo.replace(/^\//, '')}`);
      const tokenParam = url.searchParams.get('token') || url.searchParams.get('t') || url.searchParams.get('codigo');
      if (tokenParam) {
        codigo = tokenParam.trim();
      } else {
        const matchTokenPath = url.pathname.match(/\/token\/([a-zA-Z0-9_-]+)/i);
        if (matchTokenPath) {
          codigo = matchTokenPath[1].trim();
        }
      }
    } catch {
      const matchToken = codigo.match(/[?&]token=([a-zA-Z0-9_-]+)/i);
      if (matchToken) codigo = matchToken[1].trim();
    }
  }

  // 5. Si es JSON serializado (Credencial digital Web)
  if (codigo.startsWith('{') && codigo.endsWith('}')) {
    try {
      const parsed = JSON.parse(codigo);
      const token = parsed.token ? String(parsed.token).trim() : undefined;
      const id = parsed.id ? String(parsed.id).trim() : undefined;
      const dni = parsed.dni ? String(parsed.dni).replace(/\D/g, '') : undefined;
      return {
        codigoLimpio: token || id || dni || codigo,
        token,
        id,
        dni,
        esIndividual: false,
        esGrupo: true,
        formatoOriginal,
      };
    } catch (e) {
      console.warn('Error parseando JSON de credencial:', e);
    }
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const esUUID = uuidRegex.test(codigo);
  const esDNI = /^\d{7,10}$/.test(codigo);
  const esLegajo = /^[A-Za-z0-9_-]{3,20}$/.test(codigo) && !esUUID;

  return {
    codigoLimpio: codigo,
    token: codigo,
    id: esUUID ? codigo : undefined,
    dni: esDNI ? codigo : undefined,
    legajo: esLegajo ? codigo : undefined,
    esIndividual: esUUID,
    esGrupo: !esUUID,
    formatoOriginal,
  };
}
