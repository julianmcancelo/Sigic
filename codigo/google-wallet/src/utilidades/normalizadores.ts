/**
 * @file normalizadores.ts
 * @description Utilidades para formatear y limpiar identificadores, fechas y claves PEM.
 */

import { OpcionesCodigoBarras } from '../tipos.js';

/**
 * Limpia y normaliza una clave privada PEM de Google Service Account.
 * Resuelve problemas comunes de variables de entorno con `\n` escapadas.
 */
export function normalizarClavePrivada(clave: string): string {
  if (!clave) return '';
  let limpia = clave.trim();
  // Reemplazar saltos de línea literales escapados "\n" por saltos reales
  if (limpia.includes('\\n')) {
    limpia = limpia.replace(/\\n/g, '\n');
  }
  return limpia;
}

/**
 * Genera el identificador compuesto oficial de Google Wallet: `emisorId.id`
 */
export function formatearIdCompleto(emisorId: string, id: string): string {
  const idLimpio = id.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  return `${emisorId}.${idLimpio}`;
}

/**
 * Normaliza un código de barras a la estructura oficial de Google Wallet API
 */
export function normalizarCodigoBarras(codigo: string | OpcionesCodigoBarras) {
  if (typeof codigo === 'string') {
    return {
      type: 'QR_CODE',
      value: codigo.trim(),
      alternateText: codigo.trim()
    };
  }

  return {
    type: codigo.tipo || 'QR_CODE',
    value: codigo.valor.trim(),
    alternateText: codigo.textoAlternativo ?? codigo.valor.trim()
  };
}

/**
 * Normaliza una fecha a formato ISO 8601 exigido por Google Wallet
 */
export function normalizarFechaIso(fecha?: string): string | undefined {
  if (!fecha) return undefined;
  try {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    return d.toISOString();
  } catch {
    return fecha;
  }
}
