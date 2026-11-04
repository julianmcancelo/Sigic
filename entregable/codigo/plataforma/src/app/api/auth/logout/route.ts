import { NextRequest, NextResponse } from 'next/server';
import { obtenerUsuarioAutenticado } from '@/lib/auth-middleware';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const auth = await obtenerUsuarioAutenticado(req);
  if (auth.valido && auth.datos?.tipo === 'personal') {
    await query('UPDATE usuarios_sistema SET session_version = session_version + 1 WHERE id = $1', [auth.datos.id]);
  }
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set('sigic_admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  });
  respuesta.headers.set('Cache-Control', 'no-store');
  return respuesta;
}
