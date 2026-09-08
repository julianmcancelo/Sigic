import { NextRequest, NextResponse } from 'next/server';
import { origenPermitido } from './lib/request-origin';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/') && !origenPermitido(request)) {
    return NextResponse.json({ error: 'Origen no autorizado.' }, { status: 403 });
  }
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  if (host === 'app.sigic.com.ar' && request.nextUrl.pathname === '/' && request.nextUrl.searchParams.has('token') && request.nextUrl.searchParams.get('vista') !== 'preview') {
    const destino = request.nextUrl.clone();
    destino.hostname = 'graduados.sigic.com.ar';
    destino.protocol = 'https:';
    return NextResponse.redirect(destino);
  }
  if (host === 'descargas.sigic.com.ar' && request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/descargas', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/', '/api/:path*'] };
