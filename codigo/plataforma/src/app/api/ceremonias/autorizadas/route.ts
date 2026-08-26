import { NextRequest, NextResponse } from 'next/server';
import { obtenerUsuarioAutenticado, ROLES_GESTION, ROLES_OPERACION } from '@/lib/auth-middleware';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = obtenerUsuarioAutenticado(req, ROLES_OPERACION);
  if (!auth.valido) {
    return NextResponse.json(
      { error: auth.error || 'Sesión requerida' },
      { status: auth.statusCode || 401 }
    );
  }

  const usuario = auth.datos!;
  const esGestion = Boolean(usuario.rol && ROLES_GESTION.includes(usuario.rol));
  
  if (esGestion) {
    const result = await query(`
      SELECT c.*, TRUE AS habilitado, TRUE AS autorizado
      FROM ceremonias c
      ORDER BY c.activa DESC, c.fecha DESC
    `);
    return NextResponse.json(result.rows);
  }

  // Comprobar si el administrativo asignó ceremonias específicas a este personal
  const restricciones = await query(
    'SELECT 1 FROM ceremonias_usuarios_autorizados WHERE usuario_id = $1',
    [usuario.id]
  );

  const result = restricciones.rowCount && restricciones.rowCount > 0
    ? await query(`
        SELECT c.*, TRUE AS habilitado, TRUE AS autorizado
        FROM ceremonias c
        INNER JOIN ceremonias_usuarios_autorizados cua ON cua.ceremonia_id = c.id
        WHERE cua.usuario_id = $1
        ORDER BY c.activa DESC, c.fecha DESC
      `, [usuario.id])
    : await query(`
        SELECT c.*, TRUE AS habilitado, TRUE AS autorizado
        FROM ceremonias c
        ORDER BY c.activa DESC, c.fecha DESC
      `);

  return NextResponse.json(result.rows);
}

