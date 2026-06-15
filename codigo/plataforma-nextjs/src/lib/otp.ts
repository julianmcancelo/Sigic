import crypto from 'crypto';

export function hashear(otpStr: string | number): string {
  return crypto.createHash('sha256').update(String(otpStr)).digest('hex');
}

interface GenerarOptions {
  longitud?: number;
  minutosExpiracion?: number;
}

export function generar(options: GenerarOptions = {}) {
  const longitud = options.longitud ?? 6;
  const minutosExpiracion = options.minutosExpiracion ?? 10;
  
  let codigo = '';
  for (let i = 0; i < longitud; i++) {
    codigo += Math.floor(Math.random() * 10).toString();
  }
  const hash = hashear(codigo);
  const expiracion = new Date(Date.now() + minutosExpiracion * 60 * 1000);
  return { codigo, hash, expiracion };
}

export type EstadoOTP = 'EXPIRADO' | 'CODIGO_INVALIDO' | 'VALIDO';

export function verificar(
  otpStr: string | number,
  savedOtp: string | number,
  expiracion: Date | string
): EstadoOTP {
  const ahora = new Date();
  const expFecha = new Date(expiracion);
  if (ahora > expFecha) {
    return 'EXPIRADO';
  }
  if (String(otpStr).trim() !== String(savedOtp).trim()) {
    return 'CODIGO_INVALIDO';
  }
  return 'VALIDO';
}
