import type { NextRequest } from 'next/server';

export function origenPermitido(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  // Clientes nativos no envían Origin. No autentica: cada ruta valida su sesión.
  if (!origin) return req.headers.get('sec-fetch-site') !== 'cross-site';
  const permitidos = (process.env.SIGIC_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return origin === req.nextUrl.origin || permitidos.includes(origin);
}
