import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  if (host === 'descargas.sigic.com.ar' && request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/descargas', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: '/' };
