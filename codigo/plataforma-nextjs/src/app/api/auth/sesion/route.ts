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
    const userCheck = await query('SELECT activo, rol FROM usuarios_sistema WHERE id = $1', [usuario.id]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].activo !== 1) {
      return NextResponse.json({ error: 'Usuario inactivo o no encontrado.' }, { status: 403 });
    }

    // Verificar si el rol es PORTERIA y está autorizado para la ceremonia activa
    if (userCheck.rows[0].rol === 'PORTERIA') {
      const activeCer = await query('SELECT id FROM ceremonias WHERE activa = 1 LIMIT 1');
      if (activeCer.rows.length === 0) {
        return NextResponse.json({ error: 'No hay ninguna ceremonia activa.' }, { status: 403 });
      }
      const authCheck = await query(
        'SELECT 1 FROM ceremonias_usuarios_autorizados WHERE ceremonia_id = $1 AND usuario_id = $2',
        [activeCer.rows[0].id, usuario.id]
      );
      if (authCheck.rows.length === 0) {
        return NextResponse.json({ error: 'No estás autorizado para la ceremonia activa.' }, { status: 403 });
      }
    }

    return NextResponse.json({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        expira: usuario.exp
      }
    });
  } catch (error) {
    console.error('Error al validar sesión en DB:', error);
    return NextResponse.json({ error: 'Error interno de validación de sesión.' }, { status: 500 });
  }
}
