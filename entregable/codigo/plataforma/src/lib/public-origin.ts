import type { NextRequest } from 'next/server';
import { origenPortalGraduados } from './graduate-origin';

export function obtenerOrigenGraduados(req: NextRequest) {
  return origenPortalGraduados(obtenerOrigenPublico(req));
}

const ORIGEN_DEMO = 'https://demo.sigic.com.ar';
const ORIGEN_PRODUCCION = 'https://app.sigic.com.ar';

export function obtenerOrigenPublico(req: NextRequest) {
  const hostSolicitud = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const hostProyecto = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || '';
  const host = `${hostSolicitud} ${hostProyecto}`.toLowerCase();

  if (host.includes('demo.sigic.com.ar') || host.includes('sigic-demo')) return ORIGEN_DEMO;
  if (hostSolicitud.toLowerCase().endsWith('.sigic.com.ar')) {
    const protocolo = req.headers.get('x-forwarded-proto') || 'https';
    return `${protocolo}://${hostSolicitud}`;
  }
  return ORIGEN_PRODUCCION;
}
