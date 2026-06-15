import { NextRequest } from 'next/server';
import { verificar, DatosToken } from './tokens';

export interface AuthResult {
  valido: boolean;
  datos?: DatosToken;
  error?: string;
  statusCode?: number;
}

// Roles de gestión permitidos
export const ROLES_GESTION = ['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATIVO'];
export const ROLES_OPERACION = [...ROLES_GESTION, 'PORTERIA'];
export const ROLES_LECTURA = [...ROLES_OPERACION, 'AUDITOR'];

/**
 * Autentica y valida los permisos de una petición HTTP en las API Routes de Next.js.
 */
export function obtenerUsuarioAutenticado(
  req: NextRequest,
  rolesPermitidos?: string[]
): AuthResult {
  const cabecera = req.headers.get('authorization') || '';
  if (!cabecera.startsWith('Bearer ')) {
    return {
      valido: false,
      error: 'Sesión requerida. Iniciá sesión para continuar.',
      statusCode: 401
    };
  }

  const token = cabecera.slice(7);
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
