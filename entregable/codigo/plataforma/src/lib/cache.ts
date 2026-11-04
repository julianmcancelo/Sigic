/**
 * Capa de caché en memoria de alto rendimiento para SiGIC.
 * Reduce llamadas a la base de datos para lecturas frecuentes y de baja volatilidad.
 */

type CacheEntry<T> = {
  valor: T;
  expiraEn: number;
};

const cache = new Map<string, CacheEntry<any>>();

/**
 * Obtiene un valor de la caché si existe y no ha expirado.
 */
export function obtenerCache<T = any>(clave: string): T | null {
  const entrada = cache.get(clave);
  if (!entrada) return null;

  if (Date.now() > entrada.expiraEn) {
    cache.delete(clave);
    return null;
  }

  return entrada.valor as T;
}

/**
 * Guarda un valor en la caché con un tiempo de vida (TTL) en segundos.
 */
export function guardarCache<T = any>(clave: string, valor: T, ttlSegundos: number = 30): void {
  cache.set(clave, {
    valor,
    expiraEn: Date.now() + ttlSegundos * 1000,
  });
}

/**
 * Invalida una clave exacta o todas las claves que comiencen con un prefijo.
 */
export function invalidarCache(patronOClave?: string): void {
  if (!patronOClave) {
    cache.clear();
    return;
  }

  for (const clave of cache.keys()) {
    if (clave === patronOClave || clave.startsWith(patronOClave)) {
      cache.delete(clave);
    }
  }
}
