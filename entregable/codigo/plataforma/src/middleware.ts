import { NextRequest, NextResponse } from 'next/server';
import { origenPermitido } from './lib/request-origin';

export function middleware(request: NextRequest) {
  // Manejo inmediato de preflight OPTIONS para peticiones de API
  if (request.method === 'OPTIONS' && request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin === 'null' ? '*' : (origin || '*'),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Bypass-Tunnel-Reminder',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  if (request.nextUrl.pathname.startsWith('/api/') && !origenPermitido(request)) {
    return NextResponse.json({ error: 'Origen no autorizado.' }, { status: 403 });
  }
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  // Si acceden a la plataforma desde www.sigic.com.ar o sigic.com.ar, redirigir a app.sigic.com.ar
  if (host === 'www.sigic.com.ar' || host === 'sigic.com.ar') {
    const destino = request.nextUrl.clone();
    destino.hostname = 'app.sigic.com.ar';
    destino.protocol = 'https:';
    destino.port = '';
    return NextResponse.redirect(destino, { status: 301 });
  }

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

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|ttf|woff|woff2)).*)'] };
