import { NextRequest } from 'next/server';
import { verificar, DatosToken } from './tokens';
import { query } from './db';
import { inicializarBaseDatos } from './schema';

export interface AuthResult {
  valido: boolean;
  datos?: DatosToken;
  error?: string;
  statusCode?: number;
}

// Roles de gestión permitidos
export const ROLES_GESTION = ['ADMINISTRATIVO'];
export const ROLES_OPERACION = [...ROLES_GESTION, 'PORTERIA'];
export const ROLES_LECTURA = [...ROLES_OPERACION];

/**
 * Autentica y valida los permisos de una petición HTTP en las API Routes de Next.js.
 */
export async function obtenerUsuarioAutenticado(
  req: NextRequest,
  rolesPermitidos?: string[]
): Promise<AuthResult> {
  const cabecera = req.headers.get('authorization') || '';
  const tokenCabecera = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';
  const tokenCookie = req.cookies.get('sigic_admin_session')?.value || '';
  // Una credencial explícita inválida nunca debe heredar otra sesión por cookie.
  const token = cabecera ? tokenCabecera : tokenCookie;
  if (!token) {
    return {
      valido: false,
      error: 'Sesión requerida. Iniciá sesión para continuar.',
      statusCode: 401
    };
  }

  const resultado = verificar(token);

  if (!resultado.valido) {
    let mensajeError = 'Sesión inválida o expirada. Volvé a iniciar sesión.';
    if (resultado.motivo === 'EXPIRADO') {
      mensajeError = 'Tu sesión ha expirado. Volvé a iniciar sesión.';
    }
    return {
      valido: false,
      error: mensajeError,
      statusCode: 401
    };
  }

  const datos = resultado.datos!;

  if (datos.tipo === 'personal') {
    await inicializarBaseDatos();
    const resultadoUsuario = await query(
      'SELECT rol, activo, session_version, nombre, email FROM usuarios_sistema WHERE id = $1',
      [datos.id]
    );
    const usuario = resultadoUsuario.rows[0];
    if (!usuario || Number(usuario.activo) !== 1 ||
        !ROLES_OPERACION.includes(usuario.rol) ||
        datos.sessionVersion !== Number(usuario.session_version)) {
      return { valido: false, error: 'Sesión revocada. Volvé a iniciar sesión.', statusCode: 401 };
    }
    datos.rol = usuario.rol;
    datos.nombre = usuario.nombre;
    datos.email = usuario.email;
    datos.correo = usuario.email;
  }

  // Si se exige un rol de personal y no coincide
  if (rolesPermitidos && rolesPermitidos.length > 0) {
    if (datos.tipo !== 'personal' || !datos.rol || !rolesPermitidos.includes(datos.rol)) {
      return {
        valido: false,
        error: 'No tenés permisos para realizar esta acción.',
        statusCode: 403
      };
    }
  }

  return { valido: true, datos };
}
