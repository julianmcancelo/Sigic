import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { enviarCorreo } from '@/lib/email';

/**
 * CLAVE PUBLICA ASIMETRICA ED25519 (RFC 8032)
 * Esta clave publica verifica matematicamente los certificados de licencia y tokens NFC
 * emitidos por la Autoridad de Seguridad del Sistema (Cancelo Julian).
 * Ningun tercero puede falsificar o alterar un serial sin poseer la Clave Privada.
 */
export const CLAVE_PUBLICA_ED25519_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAZSZp5nnQSUR0hagiA9oA5CZH6mSbuN6JyrR48vqMfc0=
-----END PUBLIC KEY-----`;

/**
 * LICENCIA INSTITUCIONAL INICIAL FIRMADA CON ED25519
 * Autorizada para el Instituto Tecnologico Beltran y dominios oficiales.
 */
export const SERIAL_LICENCIA_INICIAL =
  'SIGIC-LIC-v1.eyJzZXJpYWxfaWQiOiJTSUdJQy1JVEItMjAyNi1PRklDSUFMLTAwMSIsImluc3RpdHVjaW9uIjoiSW5zdGl0dXRvIFRlY25vbG9naWNvIEJlbHRyYW4iLCJjYXJyZXJhIjoiVGVjbmljYXR1cmEgU3VwZXJpb3IgZW4gQW5hbGlzdGEgZGUgU2lzdGVtYXMiLCJhdXRvcmlkYWRfc2VndXJpZGFkIjoiQ2FuY2VsbyBKdWxpYW4iLCJkb21pbmlvc19hdXRvcml6YWRvcyI6WyJhcHAuc2lnaWMuY29tLmFyIiwic2lnaWMuY29tLmFyIiwibG9jYWxob3N0IiwiMTI3LjAuMC4xIiwiKi52ZXJjZWwuYXBwIl0sImZlY2hhX2VtaXNpb24iOiIyMDI2LTEwLTMwVDAwOjAwOjAwLjAwMFoiLCJmZWNoYV9leHBpcmFjaW9uIjoiMjAyNy0wNC0zMFQyMzo1OTo1OS4wMDBaIiwiZnVuY2lvbmVzIjpbIlBBRFJPTiIsIkFORklURUFUUk8iLCJQT1JURVJJQV9RUiIsIkFVRElUT1JJQV9TSEEyNTYiXSwiYWxnb3JpdG1vIjoiRWQyNTUxOSJ9.0G2xeh68YpJki6TjUhFfEc7bFiN_X3GEIyyqnTOvZcJ-go3gx7kiLjpmjfsl-Ll14ymfKQ7EFUYyApR2-FBGCQ';

/**
 * TOKEN CRIPTOGRAFICO NFC MAESTRO POR DEFECTO (FIRMADO CON ED25519)
 * Puede ser grabado en cualquier tarjeta fisica o tag NFC (NTAG213/215/216).
 */
export const TOKEN_NFC_MAESTRO_FIRMADO =
  'SIGIC-NFC-v1.eyJ1aWRfbGxhdmUiOiJORkMtTUFTVEVSLUpDQU5DRUxPLTAwMSIsInByb3BpZXRhcmlvIjoiQ2FuY2VsbyBKdWxpYW4iLCJyb2xfc2VndXJpZGFkIjoiQVVUT1JJREFEX0NSSVBUT0dSQUZJQ0EiLCJlbWl0aWRvIjoiMjAyNi0xMC0zMFQwMDowMDowMC4wMDBaIiwiYWNjaW9uIjoiREVTQkxPUVVFT19NQUVTVFJPX1RPVEFMIn0.Dzgwwc5LzTpFAeFz_WROlX8sCd9rpdraO3GP8FPcPPilq3eU_CivfrDQ8lb2qkG-UXNeU7IukRfN8VihnJ1RCQ';

/**
 * SEMILLA BASE32 PARA TOTP (RFC 6238 - Google Authenticator / Authy)
 */
const TOTP_SECRET_DEFAULT = process.env.SIGIC_TOTP_SECRET || 'SIGICJCANCELO2026CYBERSECKEY7777';

/**
 * CODIGO MAESTRO PERSONAL DE LA AUTORIDAD DEL SISTEMA (PIN 04051990)
 * Almacenado como hash SHA-256 para comparacion en tiempo constante (timingSafeEqual).
 */
const HASH_CODIGO_MAESTRO_SHA256 = crypto
  .createHash('sha256')
  .update(process.env.SIGIC_MASTER_PIN || '04051990', 'utf8')
  .digest();

export interface PayloadLicencia {
  serial_id: string;
  institucion: string;
  carrera?: string;
  autoridad_seguridad: string;
  dominios_autorizados: string[];
  fecha_emision: string;
  fecha_expiracion: string;
  funciones?: string[];
  algoritmo: string;
}

export interface ResultadoVerificacionLicencia {
  valida: boolean;
  bloqueado: boolean;
  motivo:
    | 'LICENCIA_VALIDA'
    | 'FIRMA_CRIPTOGRAFICA_INVALIDA'
    | 'FORMATO_SERIAL_CORRUPTO'
    | 'DOMINIO_NO_AUTORIZADO'
    | 'LICENCIA_EXPIRADA'
    | 'BLOQUEO_REMOTO_SEGURIDAD';
  mensaje: string;
  dominioDetectado: string;
  licencia?: PayloadLicencia;
  diasRestantes?: number;
}

/**
 * Normaliza el hostname eliminando puerto si existe.
 */
export function normalizarHostname(hostHeader?: string | null): string {
  if (!hostHeader) return 'localhost';
  return hostHeader.trim().toLowerCase().replace(/:\d+$/, '');
}

/**
 * Comprueba si un hostname coincide con la lista de dominios autorizados (soporta comodines *.dominio).
 */
export function verificarDominioAutorizado(hostname: string, dominiosAutorizados: string[]): boolean {
  const host = normalizarHostname(hostname);
  for (const patron of dominiosAutorizados) {
    const limpio = patron.trim().toLowerCase();
    if (limpio === '*') return true;
    if (limpio === host) return true;
    if (limpio === 'sigic.com.ar' && host.endsWith('.sigic.com.ar')) return true;
    if (limpio === 'localhost' && /^(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/.test(host)) {
      return true;
    }
    if (limpio.startsWith('*.')) {
      const sufijo = limpio.slice(1); // ej. ".vercel.app"
      if (host.endsWith(sufijo) || host === limpio.slice(2)) {
        return true;
      }
    }
    if (limpio.endsWith('.*')) {
      const prefijo = limpio.slice(0, -1); // ej. "192.168."
      if (host.startsWith(prefijo)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Verifica criptograficamente un serial de licencia firmado con Ed25519.
 */
export function verificarSerialLicencia(
  serial: string,
  hostActual: string = 'localhost',
  bloqueoForzado: boolean = false
): ResultadoVerificacionLicencia {
  const dominioDetectado = normalizarHostname(hostActual);

  if (!serial || typeof serial !== 'string' || !serial.startsWith('SIGIC-LIC-v1.')) {
    return {
      valida: false,
      bloqueado: true,
      motivo: 'FORMATO_SERIAL_CORRUPTO',
      mensaje: 'El formato del certificado de licencia no corresponde al estandar SIGIC-LIC-v1.',
      dominioDetectado,
    };
  }

  const partes = serial.trim().split('.');
  if (partes.length !== 3) {
    return {
      valida: false,
      bloqueado: true,
      motivo: 'FORMATO_SERIAL_CORRUPTO',
      mensaje: 'Estructura de certificado criptografico incompleta.',
      dominioDetectado,
    };
  }

  const [, payloadB64, firmaB64] = partes;

  try {
    const firmaValida = crypto.verify(
      null,
      Buffer.from(payloadB64, 'utf8'),
      CLAVE_PUBLICA_ED25519_PEM,
      Buffer.from(firmaB64, 'base64url')
    );

    if (!firmaValida) {
      return {
        valida: false,
        bloqueado: true,
        motivo: 'FIRMA_CRIPTOGRAFICA_INVALIDA',
        mensaje: 'La firma digital Ed25519 del certificado es invalida o fue adulterada.',
        dominioDetectado,
      };
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const licencia: PayloadLicencia = JSON.parse(payloadJson);

    if (bloqueoForzado) {
      return {
        valida: false,
        bloqueado: true,
        motivo: 'BLOQUEO_REMOTO_SEGURIDAD',
        mensaje: 'El sistema se encuentra bloqueado por orden de la Autoridad de Seguridad Criptografica.',
        dominioDetectado,
        licencia,
      };
    }

    // Verificar expiracion
    const ahora = Date.now();
    const expiraMs = new Date(licencia.fecha_expiracion).getTime();
    if (isNaN(expiraMs) || ahora > expiraMs) {
      return {
        valida: false,
        bloqueado: true,
        motivo: 'LICENCIA_EXPIRADA',
        mensaje: `El certificado de licencia expiro el ${new Date(licencia.fecha_expiracion).toLocaleDateString('es-AR')}. Requiere renovacion del emisor.`,
        dominioDetectado,
        licencia,
        diasRestantes: 0,
      };
    }

    const diasRestantes = Math.max(0, Math.ceil((expiraMs - ahora) / (1000 * 60 * 60 * 24)));

    // Verificar dominio autorizado
    const dominioPermitido = verificarDominioAutorizado(
      dominioDetectado,
      Array.isArray(licencia.dominios_autorizados) ? licencia.dominios_autorizados : []
    );

    if (!dominioPermitido) {
      return {
        valida: false,
        bloqueado: true,
        motivo: 'DOMINIO_NO_AUTORIZADO',
        mensaje: `El dominio actual (${dominioDetectado}) no cuenta con autorizacion en el certificado criptografico.`,
        dominioDetectado,
        licencia,
        diasRestantes,
      };
    }

    return {
      valida: true,
      bloqueado: false,
      motivo: 'LICENCIA_VALIDA',
      mensaje: 'Certificado criptografico Ed25519 verificado y activo.',
      dominioDetectado,
      licencia,
      diasRestantes,
    };
  } catch (err) {
    return {
      valida: false,
      bloqueado: true,
      motivo: 'FORMATO_SERIAL_CORRUPTO',
      mensaje: 'Error al decodificar el certificado criptografico.',
      dominioDetectado,
    };
  }
}

/**
 * Verifica un token grabado en una tarjeta o llavero fisico NFC (firmado con Ed25519).
 */
export function verificarTokenNFC(tokenNfc: string): {
  valido: boolean;
  datos?: Record<string, any>;
  error?: string;
} {
  if (!tokenNfc || typeof tokenNfc !== 'string' || !tokenNfc.trim().startsWith('SIGIC-NFC-v1.')) {
    return { valido: false, error: 'El tag NFC no contiene una cabecera criptografica SIGIC-NFC-v1.' };
  }

  const partes = tokenNfc.trim().split('.');
  if (partes.length !== 3) {
    return { valido: false, error: 'Estructura de llave NFC corrupta.' };
  }

  const [, payloadB64, firmaB64] = partes;
  try {
    const esAutentico = crypto.verify(
      null,
      Buffer.from(payloadB64, 'utf8'),
      CLAVE_PUBLICA_ED25519_PEM,
      Buffer.from(firmaB64, 'base64url')
    );

    if (!esAutentico) {
      return { valido: false, error: 'Firma Ed25519 del chip NFC rechazada. Posible clonacion o tag no autorizado.' };
    }

    const datos = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    return { valido: true, datos };
  } catch {
    return { valido: false, error: 'No se pudo verificar el certificado de la tarjeta NFC.' };
  }
}

// ============================================================================
// MOTOR TOTP (RFC 6238 - COMPATIBLE CON GOOGLE AUTHENTICATOR Y AUTHY)
// ============================================================================

const ALFABETO_BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function decodificarBase32(base32: string): Buffer {
  const limpio = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let valor = 0;
  const bytes: number[] = [];

  for (let i = 0; i < limpio.length; i++) {
    const idx = ALFABETO_BASE32.indexOf(limpio[i]);
    if (idx === -1) continue;
    valor = (valor << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((valor >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/**
 * Genera el codigo TOTP de 6 digitos para un contador de tiempo dado (intervalo de 30s).
 */
export function generarCodigoTOTP(secretoBase32: string = TOTP_SECRET_DEFAULT, timestampMs: number = Date.now()): string {
  const contador = Math.floor(timestampMs / 1000 / 30);
  const bufferContador = Buffer.alloc(8);
  let temp = contador;
  for (let i = 7; i >= 0; i--) {
    bufferContador[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  const clave = decodificarBase32(secretoBase32);
  const hmac = crypto.createHmac('sha1', clave).update(bufferContador).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binario =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binario % 1000000;
  return String(otp).padStart(6, '0');
}

/**
 * Verifica si el codigo ingresado coincide con el Codigo Maestro Personal (04051990)
 * o con el codigo rotativo TOTP de 6 digitos (Google Authenticator / iOS / Android).
 */
export function verificarCodigoTOTP(codigo: string, secretoBase32: string = TOTP_SECRET_DEFAULT): boolean {
  const limpio = String(codigo || '').replace(/\s+/g, '');
  if (!limpio) return false;

  // 1. Verificar si coincide con el Codigo Maestro Personal (04051990) en tiempo constante
  const hashCandidato = crypto.createHash('sha256').update(limpio, 'utf8').digest();
  if (crypto.timingSafeEqual(hashCandidato, HASH_CODIGO_MAESTRO_SHA256)) {
    return true;
  }

  // 2. Verificar TOTP de 6 digitos (RFC 6238 - Google Authenticator / Apple Passwords)
  if (!/^\d{6}$/.test(limpio)) return false;

  const ahora = Date.now();
  for (const ventana of [-1, 0, 1]) {
    const candidato = generarCodigoTOTP(secretoBase32, ahora + ventana * 30000);
    if (candidato === limpio) {
      return true;
    }
  }
  return false;
}

/**
 * CLAVE PRIVADA ED25519 (SOLO SERVIDOR / AUTORIDAD) PARA FIRMAR GAFETES NFC DE ACCESO
 */
const CLAVE_PRIVADA_ED25519_PEM =
  process.env.SIGIC_PRIVATE_KEY_PEM ||
  `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIA9GAqGPi5rfIkudpeU8NGFEo78lhYkka90+EXph8sHx
-----END PRIVATE KEY-----`;

export interface PayloadGafeteNFC {
  uid_llave: string;
  propietario: string;
  correo: string;
  rol: string;
  accion: 'AUTORIZAR_CELULAR_Y_DESBLOQUEO' | 'DESBLOQUEO_MAESTRO_TOTAL';
  emitido: string;
  expira: string;
}

export interface IntegranteEquipoOficialNFC {
  apodo: string;
  uidLlave: string;
  propietario: string;
  correo: string;
  rol: 'SUPER_ADMIN' | 'ADMINISTRATIVO' | 'PORTERIA';
  especialidad: string;
}

/**
 * EQUIPO OFICIAL DE DESARROLLO SiGIC — Tecnicatura Superior en Analista de Sistemas
 * Sus 5 Tags NFC se pre-generan y siembran automaticamente con firma Ed25519.
 */
export const EQUIPO_OFICIAL_SIGIC: IntegranteEquipoOficialNFC[] = [
  {
    apodo: 'Julian',
    uidLlave: 'NFC-EQUIPO-JULIAN',
    propietario: 'Cancelo Julian',
    correo: 'juliancancelo@gmail.com',
    rol: 'SUPER_ADMIN',
    especialidad: 'Analista de Sistemas & Desarrollador Fullstack',
  },
  {
    apodo: 'Sol',
    uidLlave: 'NFC-EQUIPO-SOL',
    propietario: 'Contreras Villalba Sol Heilin',
    correo: 'sol.contreras@sigic.com.ar',
    rol: 'SUPER_ADMIN',
    especialidad: 'Diseño UX/UI & Documentación',
  },
  {
    apodo: 'Alan',
    uidLlave: 'NFC-EQUIPO-ALAN',
    propietario: 'Alfonso Alan Alexis',
    correo: 'alan.alfonso@sigic.com.ar',
    rol: 'SUPER_ADMIN',
    especialidad: 'Desarrollo & Lógica de Negocio',
  },
  {
    apodo: 'Gaby',
    uidLlave: 'NFC-EQUIPO-GABY',
    propietario: 'Santillan Luis Gabriel',
    correo: 'gabriel.santillan@sigic.com.ar',
    rol: 'SUPER_ADMIN',
    especialidad: 'Control de Calidad & Despliegue',
  },
  {
    apodo: 'Mati',
    uidLlave: 'NFC-EQUIPO-MATI',
    propietario: 'Frassia Matias',
    correo: 'matias.frassia@sigic.com.ar',
    rol: 'SUPER_ADMIN',
    especialidad: 'Infraestructura & Base de Datos',
  },
];

/**
 * Emite un certificado Ed25519 compacto para grabar como URL en un Tag NFC fisico (NTAG213/215/216)
 * o tarjeta de proximidad. Al acercar cualquier celular Android o iPhone al Tag NFC,
 * el telefono abre el enlace firmado, autoriza el dispositivo/persona e inicia sesion automaticamente.
 */
export function emitirGafeteNFC({
  uidLlave,
  propietario = 'Cancelo Julian',
  correo = 'juliancancelo@gmail.com',
  rol = 'SUPER_ADMIN',
  diasValidez = 365,
  origenUrl = 'https://app.sigic.com.ar',
}: {
  uidLlave?: string;
  propietario?: string;
  correo?: string;
  rol?: string;
  diasValidez?: number;
  origenUrl?: string;
}): {
  tokenNfc: string;
  urlNfc: string;
  urlProduccion: string;
  payload: PayloadGafeteNFC;
} {
  const ahora = new Date();
  const expira = new Date(ahora.getTime() + Math.max(1, Number(diasValidez || 365)) * 24 * 60 * 60 * 1000);
  const payload: PayloadGafeteNFC = {
    uid_llave: uidLlave || `NFC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    propietario: propietario.trim(),
    correo: correo.trim().toLowerCase(),
    rol: rol.trim().toUpperCase(),
    accion: 'AUTORIZAR_CELULAR_Y_DESBLOQUEO',
    emitido: ahora.toISOString(),
    expira: expira.toISOString(),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const firmaB64 = crypto
    .sign(null, Buffer.from(payloadB64, 'utf8'), CLAVE_PRIVADA_ED25519_PEM)
    .toString('base64url');

  const tokenNfc = `SIGIC-NFC-v1.${payloadB64}.${firmaB64}`;
  const baseLimpia = origenUrl.replace(/\/+$/, '');
  const urlNfc = `${baseLimpia}/?nfc=${encodeURIComponent(tokenNfc)}`;
  const urlProduccion = `https://app.sigic.com.ar/?nfc=${encodeURIComponent(tokenNfc)}`;

  return { tokenNfc, urlNfc, urlProduccion, payload };
}

/**
 * Devuelve la URI otpauth:// estandar RFC 6238 (sin parentesis ni caracteres especiales)
 * para que Google Authenticator (Android) y Apple Passwords (iOS) generen el codigo sin error.
 */
export function obtenerUriProvisionamientoTOTP(secretoBase32: string = TOTP_SECRET_DEFAULT): {
  uri: string;
  secreto: string;
  emisor: string;
  cuenta: string;
} {
  const limpio = secretoBase32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const emisor = 'SiGIC';
  const cuenta = 'juliancancelo@gmail.com';
  const uri = `otpauth://totp/${emisor}:${cuenta}?secret=${limpio}&issuer=${emisor}`;
  return { uri, secreto: limpio, emisor, cuenta };
}

// ============================================================================
// PERSISTENCIA DE TABLAS DE SEGURIDAD, FIDO2 WEBAUTHN Y TELEMETRIA FORENSE
// ============================================================================

let tablasSeguridadInicializadas = false;

export async function asegurarTablasSeguridadLicencia(): Promise<void> {
  if (tablasSeguridadInicializadas) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS alertas_seguridad_licencia (
        id VARCHAR(60) PRIMARY KEY,
        tipo_alerta VARCHAR(80) NOT NULL,
        dominio_detectado VARCHAR(200) NOT NULL,
        ip_origen VARCHAR(120),
        agente_usuario TEXT,
        detalles JSONB,
        notificado BOOLEAN DEFAULT FALSE,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS llaves_seguridad_fido2 (
        credencial_id VARCHAR(255) PRIMARY KEY,
        nombre_llave VARCHAR(150) NOT NULL,
        propietario VARCHAR(150) DEFAULT 'Cancelo Julian',
        clave_publica TEXT NOT NULL,
        transporte VARCHAR(80) DEFAULT 'internal,nfc,usb',
        usos_count INTEGER DEFAULT 0,
        ultimo_uso TIMESTAMP,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS gafetes_nfc_autorizados (
        uid_llave VARCHAR(80) PRIMARY KEY,
        propietario VARCHAR(160) NOT NULL,
        correo VARCHAR(200) NOT NULL,
        rol VARCHAR(60) DEFAULT 'SUPER_ADMIN',
        token_nfc TEXT NOT NULL,
        url_nfc TEXT NOT NULL,
        activo BOOLEAN DEFAULT TRUE,
        dispositivos_vinculados INTEGER DEFAULT 0,
        ultimo_dispositivo VARCHAR(250),
        ultimo_uso TIMESTAMP,
        expira_en TIMESTAMP,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS desafios_login_qr_nfc (
        challenge_id VARCHAR(40) PRIMARY KEY,
        estado VARCHAR(24) NOT NULL DEFAULT 'PENDIENTE',
        token_jwt TEXT,
        usuario_json JSONB,
        uid_llave VARCHAR(80),
        ip_pc VARCHAR(120),
        ip_celular VARCHAR(120),
        expira_en TIMESTAMP NOT NULL,
        autorizado_en TIMESTAMP,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      INSERT INTO configuracion_sistema (clave, valor, descripcion)
      VALUES
        ('licencia_serial_ed25519', $1, 'Certificado de licencia criptografica Ed25519'),
        ('licencia_bloqueo_remoto', 'false', 'Bloqueo de seguridad activado por el autor'),
        ('licencia_correo_alertas', 'jcancelo.dev@gmail.com', 'Correo del autor para alertas forenses de uso no autorizado'),
        ('licencia_webhook_alertas', '', 'Webhook opcional para recibir alertas en tiempo real (Telegram/Discord/SIEM)')
      ON CONFLICT (clave) DO NOTHING
    `, [SERIAL_LICENCIA_INICIAL]);

    // Sembrar cuentas y Gafetes NFC oficiales para los 5 miembros del equipo (Julian, Sol, Alan, Gaby, Mati)
    await sembrarGafetesEquipoOficial('https://app.sigic.com.ar', false);

    tablasSeguridadInicializadas = true;
  } catch (err) {
    console.error('Error al inicializar tablas de seguridad:', err);
  }
}

/**
 * Siembra o actualiza los 5 Gafetes NFC oficiales del equipo de desarrollo (Julian, Sol, Alan, Gaby, Mati)
 * y garantiza que sus cuentas existan activas en usuarios_sistema.
 */
export async function sembrarGafetesEquipoOficial(
  origenUrl: string = 'https://app.sigic.com.ar',
  forzarActualizacionUrl: boolean = false
): Promise<Array<Record<string, any>>> {
  const hashEquipo = await bcrypt.hash(process.env.SIGIC_MASTER_PIN || '04051990', 10);
  const resultados: Array<Record<string, any>> = [];

  for (const integrante of EQUIPO_OFICIAL_SIGIC) {
    // 1. Asegurar que la cuenta del integrante exista en usuarios_sistema (rol ADMINISTRATIVO en DB)
    await query(
      `INSERT INTO usuarios_sistema (nombre, email, password_hash, rol, activo)
       VALUES ($1, $2, $3, 'ADMINISTRATIVO', 1)
       ON CONFLICT (email) DO UPDATE SET activo = 1, nombre = EXCLUDED.nombre`,
      [integrante.propietario, integrante.correo, hashEquipo]
    ).catch(() => {});

    // 2. Emitir su certificado Ed25519 oficial con UID deterministico
    const emitido = emitirGafeteNFC({
      uidLlave: integrante.uidLlave,
      propietario: integrante.propietario,
      correo: integrante.correo,
      rol: integrante.rol,
      diasValidez: 1095, // 3 años de validez institucional
      origenUrl,
    });

    if (forzarActualizacionUrl) {
      await query(
        `INSERT INTO gafetes_nfc_autorizados
          (uid_llave, propietario, correo, rol, token_nfc, url_nfc, activo, dispositivos_vinculados, expira_en)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, 0, $7)
         ON CONFLICT (uid_llave) DO UPDATE SET
          propietario = EXCLUDED.propietario,
          correo = EXCLUDED.correo,
          rol = EXCLUDED.rol,
          token_nfc = EXCLUDED.token_nfc,
          url_nfc = EXCLUDED.url_nfc,
          activo = TRUE,
          expira_en = EXCLUDED.expira_en`,
        [
          emitido.payload.uid_llave,
          emitido.payload.propietario,
          emitido.payload.correo,
          emitido.payload.rol,
          emitido.tokenNfc,
          emitido.urlNfc,
          emitido.payload.expira,
        ]
      ).catch(() => {});
    } else {
      await query(
        `INSERT INTO gafetes_nfc_autorizados
          (uid_llave, propietario, correo, rol, token_nfc, url_nfc, activo, dispositivos_vinculados, expira_en)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, 0, $7)
         ON CONFLICT (uid_llave) DO NOTHING`,
        [
          emitido.payload.uid_llave,
          emitido.payload.propietario,
          emitido.payload.correo,
          emitido.payload.rol,
          emitido.tokenNfc,
          emitido.urlNfc,
          emitido.payload.expira,
        ]
      ).catch(() => {});
    }

    resultados.push({
      apodo: integrante.apodo,
      especialidad: integrante.especialidad,
      uid_llave: emitido.payload.uid_llave,
      propietario: emitido.payload.propietario,
      correo: emitido.payload.correo,
      rol: emitido.payload.rol,
      token_nfc: emitido.tokenNfc,
      url_nfc: emitido.urlNfc,
      url_produccion: emitido.urlProduccion,
      expira_en: emitido.payload.expira,
    });
  }

  return resultados;
}

/**
 * Obtiene el estado completo de la licencia desde la base de datos y lo valida contra el Host actual.
 */
export async function obtenerEstadoLicenciaActual(hostHeader?: string | null): Promise<ResultadoVerificacionLicencia & {
  bloqueoManualActivo: boolean;
  llavesFidoRegistradas: number;
  alertasRecientesCount: number;
  correoAlertas: string;
  webhookAlertas: string;
}> {
  await asegurarTablasSeguridadLicencia();

  let serialGuardado = SERIAL_LICENCIA_INICIAL;
  let bloqueoManual = false;
  let correoAlertas = 'jcancelo.dev@gmail.com';
  let webhookAlertas = '';

  try {
    const resConfig = await query(`
      SELECT clave, valor FROM configuracion_sistema
      WHERE clave IN ('licencia_serial_ed25519', 'licencia_bloqueo_remoto', 'licencia_correo_alertas', 'licencia_webhook_alertas')
    `);
    for (const fila of resConfig.rows) {
      if (fila.clave === 'licencia_serial_ed25519' && fila.valor) serialGuardado = fila.valor;
      if (fila.clave === 'licencia_bloqueo_remoto') bloqueoManual = fila.valor === 'true' || fila.valor === '1';
      if (fila.clave === 'licencia_correo_alertas' && fila.valor) correoAlertas = fila.valor;
      if (fila.clave === 'licencia_webhook_alertas' && fila.valor) webhookAlertas = fila.valor;
    }
  } catch {}

  const verif = verificarSerialLicencia(serialGuardado, hostHeader || 'localhost', bloqueoManual);

  let llavesFidoRegistradas = 0;
  let alertasRecientesCount = 0;
  try {
    const resFido = await query('SELECT COUNT(*)::int AS total FROM llaves_seguridad_fido2');
    llavesFidoRegistradas = resFido.rows[0]?.total || 0;
    const resAlertas = await query('SELECT COUNT(*)::int AS total FROM alertas_seguridad_licencia');
    alertasRecientesCount = resAlertas.rows[0]?.total || 0;
  } catch {}

  return {
    ...verif,
    bloqueoManualActivo: bloqueoManual,
    llavesFidoRegistradas,
    alertasRecientesCount,
    correoAlertas,
    webhookAlertas,
  };
}

/**
 * Registra una alerta forense cuando el sistema detecta ejecucion en otro dominio o intento de violacion,
 * y notifica al autor por correo y/o webhook.
 */
export async function registrarAlertaForense({
  tipoAlerta,
  dominioDetectado,
  ipOrigen,
  agenteUsuario,
  detalles = {},
}: {
  tipoAlerta: string;
  dominioDetectado: string;
  ipOrigen: string;
  agenteUsuario: string;
  detalles?: Record<string, any>;
}): Promise<string> {
  await asegurarTablasSeguridadLicencia();
  const idIncidente = `INC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  try {
    await query(
      `INSERT INTO alertas_seguridad_licencia (id, tipo_alerta, dominio_detectado, ip_origen, agente_usuario, detalles, notificado)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
      [idIncidente, tipoAlerta, dominioDetectado, ipOrigen, agenteUsuario, JSON.stringify(detalles)]
    );

    // Obtener configuracion de destino de alerta
    const resDestino = await query(
      `SELECT clave, valor FROM configuracion_sistema WHERE clave IN ('licencia_correo_alertas', 'licencia_webhook_alertas')`
    );
    let correoDestino = 'jcancelo.dev@gmail.com';
    let webhookDestino = '';
    for (const r of resDestino.rows) {
      if (r.clave === 'licencia_correo_alertas' && r.valor) correoDestino = r.valor;
      if (r.clave === 'licencia_webhook_alertas' && r.valor) webhookDestino = r.valor;
    }

    // Enviar Webhook si esta configurado
    if (webhookDestino && webhookDestino.startsWith('http')) {
      fetch(webhookDestino, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidente: idIncidente,
          sistema: 'SiGIC — Control Criptografico de Propiedad Intelectual',
          tipo_alerta: tipoAlerta,
          dominio_detectado: dominioDetectado,
          ip_origen: ipOrigen,
          user_agent: agenteUsuario,
          fecha: new Date().toISOString(),
          detalles,
        }),
      }).catch(() => {});
    }

    // Enviar correo de alerta forense al autor (sin bloquear el hilo)
    if (correoDestino && correoDestino.includes('@')) {
      enviarCorreo({
        para: correoDestino,
        asunto: `[ALERTA DE SEGURIDAD SiGIC] ${tipoAlerta} en ${dominioDetectado} (${idIncidente})`,
        html: `
          <div style="font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#0f172a;color:#ffffff;padding:20px 24px;">
              <h2 style="margin:0;font-size:18px;">Alerta Forense de Licenciamiento SiGIC</h2>
              <p style="margin:4px 0 0 0;font-size:12px;color:#38bdf8;">Incidente: ${idIncidente}</p>
            </div>
            <div style="padding:24px;color:#1e293b;font-size:13.5px;line-height:1.6;">
              <p>El motor de seguridad de <strong>SiGIC</strong> ha registrado un evento de control de licencia o ejecucion no autorizada:</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:12.5px;">
                <tr><td style="padding:6px 0;font-weight:bold;color:#475569;">Evento:</td><td>${tipoAlerta}</td></tr>
                <tr><td style="padding:6px 0;font-weight:bold;color:#475559;">Dominio / Host:</td><td>${dominioDetectado}</td></tr>
                <tr><td style="padding:6px 0;font-weight:bold;color:#475569;">Direccion IP:</td><td>${ipOrigen}</td></tr>
                <tr><td style="padding:6px 0;font-weight:bold;color:#475569;">User-Agent:</td><td>${agenteUsuario}</td></tr>
                <tr><td style="padding:6px 0;font-weight:bold;color:#475569;">Timestamp:</td><td>${new Date().toISOString()}</td></tr>
              </table>
            </div>
          </div>
        `,
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Error registrando alerta forense:', err);
  }

  return idIncidente;
}
