import { NextResponse } from 'next/server';

export async function POST() {
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
