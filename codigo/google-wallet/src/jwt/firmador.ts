/**
 * @file firmador.ts
 * @description Motor criptográfico de firma JWT RS256 para Google Wallet API.
 */

import jwt from 'jsonwebtoken';
import { normalizarClavePrivada } from '../utilidades/normalizadores.js';

export interface OpcionesFirmaJwt {
  correoCliente: string;
  clavePrivada: string;
  payload: Record<string, any>;
  origenesPermitidos?: string[];
}

/**
 * Firma un payload de Google Wallet usando la clave privada de la cuenta de servicio (RSA SHA256)
 */
export function firmarTokenGoogleWallet(opciones: OpcionesFirmaJwt): string {
  const { correoCliente, clavePrivada, payload, origenesPermitidos } = opciones;

  const clavePem = normalizarClavePrivada(clavePrivada);
  if (!clavePem) {
    throw new Error('La clave privada de Google Service Account es obligatoria para firmar pases.');
  }

  const claims: Record<string, any> = {
    iss: correoCliente,
    aud: 'google',
    typ: 'savetowallet',
    payload
  };

  if (origenesPermitidos && origenesPermitidos.length > 0) {
    claims.origins = origenesPermitidos;
  }

  return jwt.sign(claims, clavePem, { algorithm: 'RS256' });
}

/**
 * Genera la URL universal de Google Wallet para guardar el pase
 */
export function generarUrlGuardarWallet(tokenJwt: string): string {
  return `https://pay.google.com/gp/v/save/${tokenJwt}`;
}
