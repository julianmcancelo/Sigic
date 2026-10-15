import type { NextRequest } from 'next/server';

export function origenPermitido(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  // Clientes nativos o curl que no envían Origin
  if (!origin) return req.headers.get('sec-fetch-site') !== 'cross-site';

  // Permitir explícitamente localhost y 127.0.0.1 (en cualquier puerto)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }

  const permitidos = (process.env.SIGIC_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return origin === req.nextUrl.origin || permitidos.includes(origin);
}
