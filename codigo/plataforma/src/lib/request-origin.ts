import type { NextRequest } from 'next/server';

export function origenPermitido(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host') || '';

  // Rutas de administración y sistema local del appliance OS
  if (req.nextUrl.pathname.startsWith('/api/sistema/')) {
    return true;
  }

  // Clientes locales de Chromium o archivos locales (origin 'null' ejecutado contra localhost)
  if (origin === 'null') {
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) {
      return true;
    }
  }

  // Clientes nativos o curl que no envían Origin
  if (!origin) return req.headers.get('sec-fetch-site') !== 'cross-site';

  // Permitir explícitamente localhost, 127.0.0.1 y redes locales (LAN 192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/i.test(origin)) {
    return true;
  }

  // Permitir cuando el host del Origin coincide con el header Host de la petición (same-host)
  try {
    const originHost = new URL(origin).host.toLowerCase();
    if (originHost && originHost === host.toLowerCase()) {
      return true;
    }
  } catch {
    // Ignorar URL inválida
  }

  // Permitir subdominios oficiales de sigic.com.ar y despliegues en vercel.app
  if (/^https?:\/\/([a-z0-9-]+\.)*(sigic\.com\.ar|vercel\.app)(:\d+)?$/i.test(origin)) {
    return true;
  }

  const permitidos = (process.env.SIGIC_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return origin === req.nextUrl.origin || permitidos.includes(origin);
}
