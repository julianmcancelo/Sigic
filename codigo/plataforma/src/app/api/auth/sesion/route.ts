import { NextRequest, NextResponse } from 'next/server';
import { obtenerUsuarioAutenticado, ROLES_LECTURA } from '@/lib/auth-middleware';
import { query } from '@/lib/db';

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

  try {
    // Verificar si el usuario sigue activo en la base de datos
    const userCheck = await query('SELECT nombre, email, activo, rol FROM usuarios_sistema WHERE id = $1', [usuario.id]);
    const usuarioActual = userCheck.rows[0];
    const activo = usuarioActual && [true, 1, '1', 't', 'true'].includes(usuarioActual.activo);
    if (!usuarioActual || !activo) {
      return NextResponse.json({ error: 'Usuario inactivo o no encontrado.' }, { status: 403 });
    }

    // La sesión puede mantenerse mientras el usuario conserve al menos una
    // ceremonia asignada. Cada acreditación comprueba además la ceremonia activa.
    if (usuarioActual.rol === 'PORTERIA') {
      const authCheck = await query(
        'SELECT 1 FROM ceremonias_usuarios_autorizados WHERE usuario_id = $1 LIMIT 1',
        [usuario.id]
      );
      if (authCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Tu cuenta no tiene ceremonias asignadas.' }, { status: 403 });
      }
    }

    return NextResponse.json({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuarioActual.nombre || usuario.nombre,
        email: usuarioActual.email,
        rol: usuarioActual.rol,
        expira: usuario.exp
      }
    });
  } catch (error) {
    console.error('Error al validar sesión en DB:', error);
    return NextResponse.json({ error: 'Error interno de validación de sesión.' }, { status: 500 });
  }
}
