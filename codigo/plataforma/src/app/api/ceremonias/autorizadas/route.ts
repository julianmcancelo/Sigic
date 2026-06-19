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
  const result = esGestion
    ? await query(`
        SELECT c.*, TRUE AS habilitado
        FROM ceremonias c
        ORDER BY c.activa DESC, c.fecha DESC
      `)
    : await query(`
        SELECT c.*, TRUE AS habilitado
        FROM ceremonias c
        INNER JOIN ceremonias_usuarios_autorizados cua ON cua.ceremonia_id = c.id
        WHERE cua.usuario_id = $1
        ORDER BY c.activa DESC, c.fecha DESC
      `, [usuario.id]);

  return NextResponse.json(result.rows);
}
