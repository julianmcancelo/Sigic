import crypto from 'crypto';

let SECRETO = process.env.JWT_SECRET;
if (!SECRETO || SECRETO.length < 32) {
  SECRETO = crypto.randomBytes(48).toString('hex');
  console.warn('⚠ JWT_SECRET no está definido (o es muy corto) en .env.local.');
  console.warn('  Se generó un secreto temporal para el inicio de sesión.');
}

function base64url(buffer: Buffer | string): string {
  return Buffer.from(buffer).toString('base64url');
}

function firmarContenido(contenido: string): string {
  return crypto.createHmac('sha256', SECRETO!).update(contenido).digest('base64url');
}

export interface DatosToken {
  tipo: 'personal' | 'egresado';
  id: string | number;
  rol?: string;
  nombre?: string;
  iat?: number;
  exp?: number;
}

/**
 * Crea un token firmado (formato JWT).
 */
export function firmar(datos: DatosToken, segundosVida: number = 8 * 60 * 60): string {
  const ahora = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ ...datos, iat: ahora, exp: ahora + segundosVida }));
  const firma = firmarContenido(`${header}.${payload}`);
  return `${header}.${payload}.${firma}`;
}

export interface ResultadoVerificacion {
  valido: boolean;
  datos?: DatosToken;
  motivo?: 'TOKEN_AUSENTE' | 'FORMATO_INVALIDO' | 'FIRMA_INVALIDA' | 'PAYLOAD_INVALIDO' | 'EXPIRADO';
}

/**
 * Verifica un token firmado (formato JWT).
 */
export function verificar(token: string | null): ResultadoVerificacion {
  if (!token) return { valido: false, motivo: 'TOKEN_AUSENTE' };

  const partes = token.split('.');
  if (partes.length !== 3) return { valido: false, motivo: 'FORMATO_INVALIDO' };

  const [header, payload, firmaRecibida] = partes;
  const firmaEsperada = firmarContenido(`${header}.${payload}`);

  const bufRecibida = Buffer.from(firmaRecibida);
  const bufEsperada = Buffer.from(firmaEsperada);
  
  if (bufRecibida.length !== bufEsperada.length || !crypto.timingSafeEqual(bufRecibida, bufEsperada)) {
    return { valido: false, motivo: 'FIRMA_INVALIDA' };
  }

  let datos: DatosToken;
  try {
    datos = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return { valido: false, motivo: 'PAYLOAD_INVALIDO' };
  }

  if (!datos.exp || Math.floor(Date.now() / 1000) > datos.exp) {
    return { valido: false, motivo: 'EXPIRADO' };
  }

  return { valido: true, datos };
}

/**
 * Genera un código aleatorio criptográficamente seguro (A-Z, 2-9, sin caracteres ambiguos)
 */
export function codigoSeguro(longitud: number = 8): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(longitud);
  let codigo = '';
  for (let i = 0; i < longitud; i++) {
    codigo += alfabeto[bytes[i] % alfabeto.length];
  }
  return codigo;
}
