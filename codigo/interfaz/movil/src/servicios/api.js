/**
 * Capa de servicios de comunicación con el Servidor Backend (SiGIC).
 * Todas las llamadas a la API centralizadas aquí para facilitar el mantenimiento.
 */

export const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '')

// ─── MANEJO DEL TOKEN DE SESIÓN ───────────────────────────────
// El backend emite un token firmado al iniciar sesión. El rol del usuario
// viaja dentro del token: ya no se envía por header (era falsificable).

const CLAVE_TOKEN = 'sigic_token'

export function guardarTokenSesion(token) {
  if (token) localStorage.setItem(CLAVE_TOKEN, token)
}

export function limpiarTokenSesion() {
  localStorage.removeItem(CLAVE_TOKEN)
}

// Headers para todas las peticiones (incluye el token si hay sesión)
export function cabeceras() {
  const token = localStorage.getItem(CLAVE_TOKEN)
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function obtenerEstadoSetup() {
  const res = await fetch(`${BASE}/setup/status`, { headers: cabeceras() })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo consultar el estado inicial')
  return json
}

export async function inicializarSistema(payload) {
  const res = await fetch(`${BASE}/setup/initialize`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo inicializar el sistema')
  return json
}

export async function loginAdmin(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ email, password }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo iniciar sesion')
  guardarTokenSesion(json.token)
  return json
}

export async function listarUsuariosSistema() {
  const res = await fetch(`${BASE}/usuarios`, {
    headers: cabeceras(),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo listar usuarios')
  return json
}

export async function crearUsuarioSistema(payload) {
  const res = await fetch(`${BASE}/usuarios`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo crear el usuario')
  return json
}

export async function actualizarRolUsuario(id, rol) {
  const res = await fetch(`${BASE}/usuarios/${id}/rol`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ rol }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar el rol')
  return json
}

export async function actualizarEstadoUsuario(id, activo) {
  const res = await fetch(`${BASE}/usuarios/${id}/estado`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ activo }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar el estado')
  return json
}

// ─── SERVICIOS DE EGRESADOS ───────────────────────────────────

export async function obtenerEgresados() {
  const res = await fetch(`${BASE}/egresados`, { headers: cabeceras() })
  if (!res.ok) throw new Error('No se pudo establecer conexión con el servidor de egresados')
  return res.json()
}

export async function crearEgresado(datos) {
  const res = await fetch(`${BASE}/egresados`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Ocurrió un error al intentar crear el egresado')
  return json
}

export async function validarToken(token) {
  const res = await fetch(`${BASE}/egresados/token/${token}`, { headers: cabeceras() })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'El código de acceso no es válido o ha expirado')
  guardarTokenSesion(json.token_sesion)
  return json
}

export async function importarEgresadosBulk(egresados) {
  const res = await fetch(`${BASE}/egresados/bulk`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ egresados }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudieron importar los egresados')
  return json
}

export async function eliminarEgresado(id) {
  const res = await fetch(`${BASE}/egresados/${id}`, { 
    method: 'DELETE',
    headers: cabeceras()
  })
  if (!res.ok) throw new Error('No se pudo eliminar el egresado debido a un error en el servidor')
  return true
}

export async function vaciarEgresados() {
  const res = await fetch(`${BASE}/egresados`, { 
    method: 'DELETE',
    headers: cabeceras()
  })
  if (!res.ok) throw new Error('No se pudo vaciar la lista debido a un error en el servidor')
  return true
}

export async function enviarInvitacion(id, correoPersonalizado = null) {
  const res = await fetch(`${BASE}/egresados/${id}/enviar-invitacion`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ correoPersonalizado })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo enviar el correo electrónico')
  return json
}

export async function asignarAsientos(egresadoId, data) {
  const res = await fetch(`${BASE}/egresados/${egresadoId}/asientos`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo guardar la asignación de asientos')
  return json
}

export async function actualizarEntregador(id, nombre) {
  const res = await fetch(`${BASE}/egresados/${id}/entregador`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ nombre }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar el nombre del entregador')
  return json
}

// ─── SERVICIOS DE AUTENTICACIÓN OTP ──────────────────────────

export async function solicitarOTP(email) {
  const res = await fetch(`${BASE}/egresados/solicitar-otp`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ email })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo generar el código de verificación')
  return json
}

export async function verificarOTP(email, otp) {
  const res = await fetch(`${BASE}/egresados/verificar-otp`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ email, otp })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'El código ingresado es incorrecto o ya expiró')
  guardarTokenSesion(json.token_sesion)
  return json
}

// ─── SERVICIOS DE INVITADOS ───────────────────────────────────

export async function obtenerInvitados() {
  const res = await fetch(`${BASE}/invitados`, { headers: cabeceras() })
  if (!res.ok) throw new Error('No se pudo cargar la base de datos de invitados')
  return res.json()
}

export async function cargarInvitados(token, invitados, egresadoId = null) {
  const res = await fetch(`${BASE}/invitados`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ token, egresadoId, invitados }),
  })
  const json = await res.json()
  if (!res.ok) {
    const errorMsg = json.detalle ? `${json.error}: ${json.detalle}` : (json.error || 'Ocurrió un problema al guardar los invitados')
    throw new Error(errorMsg)
  }
  return json
}

export async function obtenerInvitadosDeEgresado(id) {
  const res = await fetch(`${BASE}/invitados/egresado/${id}`, { headers: cabeceras() })
  if (!res.ok) throw new Error('No se pudo recuperar la lista de tus invitados')
  return res.json()
}

export async function buscarPorUUID(uuid) {
  const res = await fetch(`${BASE}/invitados/buscar/${uuid}`, { headers: cabeceras() })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Escaneo fallido: código QR no reconocido')
  return json
}

export async function marcarPresente(id) {
  const res = await fetch(`${BASE}/invitados/${id}/presente`, { 
    method: 'PUT',
    headers: cabeceras()
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo realizar el ingreso del invitado')
  return json
}

export async function marcarPresenteMasivo(ids) {
  const res = await fetch(`${BASE}/invitados/presente-masivo`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ ids }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Error durante el registro de ingreso grupal')
  return json
}

export async function eliminarInvitado(id) {
  const res = await fetch(`${BASE}/invitados/${id}`, { 
    method: 'DELETE',
    headers: cabeceras()
  })
  if (!res.ok) throw new Error('No se pudo eliminar al invitado')
  return true
}

export async function actualizarInvitado(id, datos) {
  const res = await fetch(`${BASE}/invitados/${id}`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify(datos),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar los datos del invitado')
  return json
}

// ─── SERVICIOS DE CONFIGURACIÓN DEL SISTEMA ──────────────────

/**
 * Obtiene todos los ajustes del sistema como un objeto { clave: { valor, descripcion } }
 */
export async function obtenerAjustes() {
  const res = await fetch(`${BASE}/configuracion`, { headers: cabeceras() })
  if (!res.ok) throw new Error('No se pudo cargar la configuración del sistema')
  return res.json()
}

/**
 * Actualiza un ajuste específico por su clave.
 * @param {string} clave - La clave del ajuste (ej: 'max_invitados_por_egresado')
 * @param {string|number|boolean} valor - El nuevo valor
 */
export async function actualizarAjuste(clave, valor) {
  const res = await fetch(`${BASE}/configuracion/${clave}`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ valor: String(valor) }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `No se pudo actualizar el ajuste "${clave}"`)
  return json
}

// ─── SERVICIOS DE RESPUESTA A INVITACIÓN ─────────────────────

export async function responderInvitacion(id, datos) {
  const res = await fetch(`${BASE}/egresados/${id}/responder-invitacion`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify(datos)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo registrar la respuesta a la invitación')
  return json
}

// ─── SERVICIOS DE PROFESORES ─────────────────────────────────

export async function obtenerProfesores() {
  const res = await fetch(`${BASE}/profesores`, { headers: cabeceras() })
  if (!res.ok) throw new Error('No se pudo cargar el catálogo de profesores')
  return res.json()
}

export async function crearProfesor(datos) {
  const res = await fetch(`${BASE}/profesores`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo crear el profesor')
  return json
}

export async function actualizarProfesor(id, datos) {
  const res = await fetch(`${BASE}/profesores/${id}`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify(datos)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar el profesor')
  return json
}

export async function eliminarProfesor(id) {
  const res = await fetch(`${BASE}/profesores/${id}`, {
    method: 'DELETE',
    headers: cabeceras()
  })
  if (!res.ok) throw new Error('No se pudo eliminar el profesor')
  return true
}

// ─── SERVICIOS DE ENTREGADORES ───────────────────────────────

export async function obtenerEntregadores(graduadoId) {
  const res = await fetch(`${BASE}/entregadores/graduado/${graduadoId}`, { headers: cabeceras() })
  if (!res.ok) throw new Error('No se pudo cargar los entregadores')
  return res.json()
}

export async function asignarEntregador(datos) {
  const res = await fetch(`${BASE}/entregadores`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo asignar el entregador')
  return json
}

export async function quitarEntregador(id) {
  const res = await fetch(`${BASE}/entregadores/${id}`, {
    method: 'DELETE',
    headers: cabeceras()
  })
  if (!res.ok) throw new Error('No se pudo quitar el entregador')
  return true
}

// ─── SERVICIOS DE CEREMONIAS ─────────────────────────────────

export async function obtenerCeremonias() {
  const res = await fetch(`${BASE}/ceremonias`, { headers: cabeceras() })
  if (!res.ok) throw new Error('No se pudieron cargar las ceremonias')
  return res.json()
}

export async function obtenerCeremoniaActiva() {
  const res = await fetch(`${BASE}/ceremonias/activa`, { headers: cabeceras() })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('Error al obtener la ceremonia activa')
  }
  return res.json()
}

export async function crearCeremonia(datos) {
  const res = await fetch(`${BASE}/ceremonias`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo crear la ceremonia')
  return json
}

export async function activarCeremonia(id) {
  const res = await fetch(`${BASE}/ceremonias/${id}/activar`, {
    method: 'PUT',
    headers: cabeceras()
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo activar la ceremonia')
  return json
}

export async function eliminarCeremonia(id) {
  const res = await fetch(`${BASE}/ceremonias/${id}`, {
    method: 'DELETE',
    headers: cabeceras()
  })
  if (!res.ok) throw new Error('No se pudo eliminar la ceremonia')
  return true
}
