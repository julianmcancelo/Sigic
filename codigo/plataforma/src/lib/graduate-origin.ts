export const ORIGEN_GRADUADOS = 'https://graduados.sigic.com.ar';

/** Mantiene los enlaces de prueba dentro de su entorno. */
export function origenPortalGraduados(origen = typeof window !== 'undefined' ? window.location.origin : '') {
  try {
    const url = new URL(origen);
    if (url.hostname === 'demo.sigic.com.ar' || url.hostname.includes('sigic-demo')) return 'https://demo.sigic.com.ar';
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.endsWith('.vercel.app')) return url.origin;
  } catch {}
  return ORIGEN_GRADUADOS;
}
