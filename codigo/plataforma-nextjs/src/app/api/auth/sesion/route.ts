import { NextRequest, NextResponse } from 'next/server';
import { obtenerUsuarioAutenticado, ROLES_LECTURA } from '@/lib/auth-middleware';

/**
 * GET /api/auth/sesion
 * Valida si el token de sesión sigue vigente y devuelve los datos del usuario.
 */
export async function GET(req: NextRequest) {
  const auth = obtenerUsuarioAutenticado(req, ROLES_LECTURA);
  
  if (!auth.valido) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
  }

  const usuario = auth.datos!;

  return NextResponse.json({
    ok: true,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      expira: usuario.exp
    }
  });
}
