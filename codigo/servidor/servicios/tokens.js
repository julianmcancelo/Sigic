/**
 * Servicio de Tokens de Sesión (SiGIC)
 * Genera y verifica tokens firmados (formato JWT, HMAC-SHA256) usando
 * únicamente el módulo nativo `crypto`, sin dependencias externas.
 *
 * El secreto se toma de la variable de entorno JWT_SECRET. Si no está
 * definida, se genera uno aleatorio por arranque (las sesiones se
 * invalidan al reiniciar el servidor) y se avisa por consola.
 */
const crypto = require('crypto')

let SECRETO = process.env.JWT_SECRET
if (!SECRETO || SECRETO.length < 32) {
  SECRETO = crypto.randomBytes(48).toString('hex')
  console.warn('⚠ JWT_SECRET no está definido (o es muy corto) en .env.')
  console.warn('  Se generó un secreto temporal: las sesiones caducarán al reiniciar el servidor.')
}

function base64url(buffer) {
  return Buffer.from(buffer).toString('base64url')
}

function firmarContenido(contenido) {
  return crypto.createHmac('sha256', SECRETO).update(contenido).digest('base64url')
}

/**
 * Crea un token firmado.
 * @param {object} datos - Payload del token (ej: { tipo, id, rol })
 * @param {number} segundosVida - Tiempo de vida en segundos (default: 8 horas)
 */
function firmar(datos, segundosVida = 8 * 60 * 60) {
  const ahora = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({ ...datos, iat: ahora, exp: ahora + segundosVida }))
  const firma = firmarContenido(`${header}.${payload}`)
  return `${header}.${payload}.${firma}`
}

/**
 * Verifica un token firmado.
 * @returns {{ valido: boolean, datos?: object, motivo?: string }}
 */
function verificar(token) {
  if (typeof token !== 'string') return { valido: false, motivo: 'TOKEN_AUSENTE' }

  const partes = token.split('.')
  if (partes.length !== 3) return { valido: false, motivo: 'FORMATO_INVALIDO' }

  const [header, payload, firmaRecibida] = partes
  const firmaEsperada = firmarContenido(`${header}.${payload}`)

  const bufRecibida = Buffer.from(firmaRecibida)
  const bufEsperada = Buffer.from(firmaEsperada)
  if (bufRecibida.length !== bufEsperada.length || !crypto.timingSafeEqual(bufRecibida, bufEsperada)) {
    return { valido: false, motivo: 'FIRMA_INVALIDA' }
  }

  let datos
  try {
    datos = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return { valido: false, motivo: 'PAYLOAD_INVALIDO' }
  }

  if (!datos.exp || Math.floor(Date.now() / 1000) > datos.exp) {
    return { valido: false, motivo: 'EXPIRADO' }
  }

  return { valido: true, datos }
}

/**
 * Genera un código aleatorio criptográficamente seguro (A-Z, 2-9, sin
 * caracteres ambiguos). Reemplaza a Math.random() para tokens de invitación.
 */
function codigoSeguro(longitud = 8) {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(longitud)
  let codigo = ''
  for (let i = 0; i < longitud; i++) {
    codigo += alfabeto[bytes[i] % alfabeto.length]
  }
  return codigo
}

module.exports = { firmar, verificar, codigoSeguro }
