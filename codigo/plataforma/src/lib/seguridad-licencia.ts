import crypto from 'crypto';
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
    if (limpio.startsWith('*.')) {
      const sufijo = limpio.slice(1); // ej. ".vercel.app"
      if (host.endsWith(sufijo) || host === limpio.slice(2)) {
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
 * Verifica si un codigo de 6 digitos coincide con el TOTP actual (con ventana de +/- 30s).
 */
export function verificarCodigoTOTP(codigo: string, secretoBase32: string = TOTP_SECRET_DEFAULT): boolean {
  const limpio = String(codigo || '').replace(/\s+/g, '');
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
 * Devuelve la URI otpauth:// estandar para vincular Google Authenticator / Authy mediante QR.
 */
export function obtenerUriProvisionamientoTOTP(secretoBase32: string = TOTP_SECRET_DEFAULT): {
  uri: string;
  secreto: string;
  emisor: string;
  cuenta: string;
} {
  const emisor = 'SiGIC Ciberseguridad';
  const cuenta = 'Cancelo Julian (Autoridad)';
  const uri = `otpauth://totp/${encodeURIComponent(emisor)}:${encodeURIComponent(cuenta)}?secret=${secretoBase32}&issuer=${encodeURIComponent(emisor)}&algorithm=SHA1&digits=6&period=30`;
  return { uri, secreto: secretoBase32, emisor, cuenta };
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

    tablasSeguridadInicializadas = true;
  } catch (err) {
    console.error('Error al inicializar tablas de seguridad:', err);
  }
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
