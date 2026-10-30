#!/usr/bin/env node
/**
 * ============================================================================
 * AUTORIDAD DE LICENCIAMIENTO CRIPTOGRAFICO SiGIC (Ed25519 + NFC + TOTP)
 * ============================================================================
 * HERRAMIENTA EXCLUSIVA DEL AUTOR (Cancelo Julian)
 * NO INCLUIR ESTE ARCHIVO EN LA ENTREGA AL INSTITUTO SI SE DESEA MANTENER
 * LA CLAVE PRIVADA FUERA DEL SERVIDOR DE DESTINO.
 *
 * Uso:
 *   node herramientas/autoridad-licencias-sigic.cjs emitir --institucion="Instituto Tecnologico Beltran" --dominios="app.sigic.com.ar,localhost,*.vercel.app" --dias=180
 *   node herramientas/autoridad-licencias-sigic.cjs nfc --uid="NFC-MASTER-JCANCELO-001"
 *   node herramientas/autoridad-licencias-sigic.cjs totp
 *   node herramientas/autoridad-licencias-sigic.cjs verificar --serial="SIGIC-LIC-v1..."
 */

const crypto = require('crypto');

const CLAVE_PRIVADA_ED25519_PEM = process.env.SIGIC_PRIVATE_KEY_PEM || `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIA9GAqGPi5rfIkudpeU8NGFEo78lhYkka90+EXph8sHx
-----END PRIVATE KEY-----`;

const CLAVE_PUBLICA_ED25519_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAZSZp5nnQSUR0hagiA9oA5CZH6mSbuN6JyrR48vqMfc0=
-----END PUBLIC KEY-----`;

const TOTP_SECRET_BASE32 = process.env.SIGIC_TOTP_SECRET || 'SIGICJCANCELO2026CYBERSECKEY7777';

function parseArgs(argv) {
  const args = { _: [] };
  for (const item of argv.slice(2)) {
    if (item.startsWith('--')) {
      const [k, ...v] = item.slice(2).split('=');
      args[k] = v.length > 0 ? v.join('=') : true;
    } else {
      args._.push(item);
    }
  }
  return args;
}

function emitirSerialLicencia({ institucion, dominios, dias, serialId }) {
  const ahora = new Date();
  const expira = new Date(ahora.getTime() + Number(dias || 180) * 24 * 60 * 60 * 1000);

  const payload = {
    serial_id: serialId || `SIGIC-ITB-${ahora.getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    institucion: institucion || 'Instituto Tecnologico Beltran',
    carrera: 'Tecnicatura Superior en Analista de Sistemas',
    autoridad_seguridad: 'Cancelo Julian',
    dominios_autorizados: (dominios || 'app.sigic.com.ar,sigic.com.ar,localhost,127.0.0.1,*.vercel.app')
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean),
    fecha_emision: ahora.toISOString(),
    fecha_expiracion: expira.toISOString(),
    funciones: ['PADRON', 'ANFITEATRO', 'PORTERIA_QR', 'AUDITORIA_SHA256'],
    algoritmo: 'Ed25519',
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const firmaB64 = crypto
    .sign(null, Buffer.from(payloadB64, 'utf8'), CLAVE_PRIVADA_ED25519_PEM)
    .toString('base64url');

  return {
    serial: `SIGIC-LIC-v1.${payloadB64}.${firmaB64}`,
    payload,
  };
}

function emitirTokenNFC({ uid, propietario }) {
  const payload = {
    uid_llave: uid || `NFC-MASTER-JCANCELO-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    propietario: propietario || 'Cancelo Julian',
    rol_seguridad: 'AUTORIDAD_CRIPTOGRAFICA',
    emitido: new Date().toISOString(),
    accion: 'DESBLOQUEO_MAESTRO_TOTAL',
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const firmaB64 = crypto
    .sign(null, Buffer.from(payloadB64, 'utf8'), CLAVE_PRIVADA_ED25519_PEM)
    .toString('base64url');

  return {
    tokenNfc: `SIGIC-NFC-v1.${payloadB64}.${firmaB64}`,
    payload,
  };
}

function decodificarBase32(base32) {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const limpio = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let valor = 0;
  const bytes = [];
  for (let i = 0; i < limpio.length; i++) {
    const idx = alfabeto.indexOf(limpio[i]);
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

function generarCodigoTOTP(secretoBase32 = TOTP_SECRET_BASE32, timestampMs = Date.now()) {
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
  return String(binario % 1000000).padStart(6, '0');
}

const args = parseArgs(process.argv);
const comando = args._[0] || 'ayuda';

console.log('========================================================================');
console.log('  SiGIC — AUTORIDAD DE CERTIFICACION CRIPTOGRAFICA (Ed25519 / RFC 8032)');
console.log('  Autoridad de Seguridad: Cancelo Julian');
console.log('========================================================================\n');

if (comando === 'emitir') {
  const { serial, payload } = emitirSerialLicencia({
    institucion: args.institucion,
    dominios: args.dominios,
    dias: args.dias || 180,
    serialId: args.id,
  });
  console.log('METADATOS DEL CERTIFICADO:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\nSERIAL CRIPTOGRAFICO FIRMADO (COPIAR Y ENTREGAR):');
  console.log('------------------------------------------------------------------------');
  console.log(serial);
  console.log('------------------------------------------------------------------------\n');
} else if (comando === 'nfc') {
  const { tokenNfc, payload } = emitirTokenNFC({
    uid: args.uid,
    propietario: args.propietario,
  });
  console.log('DATOS DE LA LLAVE FISICA NFC:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\nPAYLOAD NDEF FIRMADO PARA GRABAR EN TARJETA NFC:');
  console.log('------------------------------------------------------------------------');
  console.log(tokenNfc);
  console.log('------------------------------------------------------------------------\n');
} else if (comando === 'totp') {
  const codigoActual = generarCodigoTOTP();
  const segRestantes = 30 - (Math.floor(Date.now() / 1000) % 30);
  const emisor = 'SiGIC Ciberseguridad';
  const cuenta = 'Cancelo Julian (Autoridad)';
  const uri = `otpauth://totp/${encodeURIComponent(emisor)}:${encodeURIComponent(cuenta)}?secret=${TOTP_SECRET_BASE32}&issuer=${encodeURIComponent(emisor)}&algorithm=SHA1&digits=6&period=30`;

  console.log(`Semilla Base32 (Google Authenticator): ${TOTP_SECRET_BASE32}`);
  console.log(`Codigo TOTP actual (valido por ${segRestantes}s):  ${codigoActual}`);
  console.log(`URI otpauth:// para QR:\n${uri}\n`);
} else if (comando === 'verificar') {
  const serial = String(args.serial || '');
  const partes = serial.split('.');
  if (partes.length !== 3) {
    console.error('Formato de serial invalido.');
    process.exit(1);
  }
  const [, payloadB64, firmaB64] = partes;
  const ok = crypto.verify(
    null,
    Buffer.from(payloadB64, 'utf8'),
    CLAVE_PUBLICA_ED25519_PEM,
    Buffer.from(firmaB64, 'base64url')
  );
  console.log('Resultado de verificacion Ed25519:', ok ? 'AUTENTICO (FIRMA VALIDA)' : 'RECHAZADO (FIRMA ADULTERADA)');
  if (ok) {
    console.log(JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')));
  }
} else {
  console.log('Comandos disponibles:');
  console.log('  node herramientas/autoridad-licencias-sigic.cjs emitir --dominios="localhost,app.sigic.com.ar" --dias=180');
  console.log('  node herramientas/autoridad-licencias-sigic.cjs nfc --uid="NFC-MASTER-01"');
  console.log('  node herramientas/autoridad-licencias-sigic.cjs totp');
  console.log('  node herramientas/autoridad-licencias-sigic.cjs verificar --serial="SIGIC-LIC-v1..."\n');
}
