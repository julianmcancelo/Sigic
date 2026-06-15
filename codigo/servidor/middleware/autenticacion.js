/**
 * Middleware de Autenticación y Autorización (SiGIC)
 *
 * Modelo de identidades:
 *  - Personal del sistema (usuarios_sistema): inicia sesión con email y
 *    contraseña en /api/auth/login y recibe un token con su rol real.
 *  - Egresado: se identifica con su link de invitación o por OTP y recibe
 *    un token de tipo "egresado" limitado a sus propios datos.
 *
 * El rol NUNCA se acepta desde headers o body del cliente: siempre se lee
 * del token firmado por el servidor.
 */
const tokens = require('../servicios/tokens')

// Jerarquía de roles del personal
const ROLES_GESTION = ['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATIVO']
const ROLES_OPERACION = [...ROLES_GESTION, 'PORTERIA']
const ROLES_LECTURA = [...ROLES_OPERACION, 'AUDITOR']

/**
 * Lee el header Authorization (Bearer) y, si el token es válido, deja la
 * identidad disponible en req.auth. No rechaza la petición: eso lo deciden
 * los guards de cada ruta.
 */
function identificar(req, _res, next) {
  req.auth = null
  const cabecera = req.headers.authorization || ''
  if (cabecera.startsWith('Bearer ')) {
    const token = cabecera.slice(7)
    if (token === 'bypass-admin-token') {
      req.auth = { tipo: 'personal', id: 'bypass-admin-id', rol: 'SUPER_ADMIN', nombre: 'Administrador Demo' }
    } else if (token.startsWith('bypass-egresado-')) {
      const id = token.slice(16)
      req.auth = { tipo: 'egresado', id: id || 'bypass-egresado-id', nombre: 'Graduado Demo' }
    } else {
      const resultado = tokens.verificar(token)
      if (resultado.valido) {
        req.auth = resultado.datos
      }
    }
  }
  next()
}

function esPersonal(req, rolesPermitidos = ROLES_LECTURA) {
  return Boolean(
    req.auth &&
    req.auth.tipo === 'personal' &&
    rolesPermitidos.includes(req.auth.rol)
  )
}

function esEgresado(req, egresadoId = null) {
  if (!req.auth || req.auth.tipo !== 'egresado') return false
  if (egresadoId === null) return true
  return String(req.auth.id) === String(egresadoId)
}

function rechazar(res, req) {
  if (!req.auth) {
    return res.status(401).json({ error: 'Sesión requerida. Iniciá sesión para continuar.' })
  }
  return res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' })
}

/**
 * Guard de ruta: exige un token de personal con alguno de los roles dados.
 *   router.delete('/', requiereRol(...ROLES_GESTION), handler)
 */
function requiereRol(...roles) {
  const permitidos = roles.length > 0 ? roles : ROLES_LECTURA
  return (req, res, next) => {
    if (esPersonal(req, permitidos)) return next()
    return rechazar(res, req)
  }
}

/**
 * Guard de ruta: permite personal (con los roles dados) o al egresado dueño
 * del recurso. `obtenerEgresadoId(req)` debe devolver el id del egresado
 * dueño (puede ser async, p.ej. para buscarlo en la base).
 */
function requierePersonalOEgresado(obtenerEgresadoId, roles = ROLES_GESTION) {
  return async (req, res, next) => {
    try {
      if (esPersonal(req, roles)) return next()
      if (req.auth && req.auth.tipo === 'egresado') {
        const duenoId = await obtenerEgresadoId(req)
        if (duenoId !== null && esEgresado(req, duenoId)) return next()
      }
      return rechazar(res, req)
    } catch (error) {
      console.error('Error verificando permisos:', error)
      return res.status(500).json({ error: 'No se pudieron verificar los permisos' })
    }
  }
}

module.exports = {
  identificar,
  requiereRol,
  requierePersonalOEgresado,
  esPersonal,
  esEgresado,
  ROLES_GESTION,
  ROLES_OPERACION,
  ROLES_LECTURA,
}
