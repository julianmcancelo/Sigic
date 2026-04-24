/**
 * Capa de servicios de comunicación con el Servidor Backend (SiGIC).
 * Todas las llamadas a la API centralizadas aquí para facilitar el mantenimiento.
 */

export const BASE = 'http://localhost:3001/api'

// Headers básicos
const HEADERS = {
  'Content-Type': 'application/json'
}

// ─── SERVICIOS DE EGRESADOS ───────────────────────────────────

export async function obtenerEgresados() {
  const res = await fetch(`${BASE}/egresados`, { headers: HEADERS })
  if (!res.ok) throw new Error('No se pudo establecer conexión con el servidor de egresados')
  return res.json()
}

export async function crearEgresado(datos) {
  const res = await fetch(`${BASE}/egresados`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(datos),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Ocurrió un error al intentar crear el egresado')
  return json
}

export async function validarToken(token) {
  const res = await fetch(`${BASE}/egresados/token/${token}`, { headers: HEADERS })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'El código de acceso no es válido o ha expirado')
  return json
}

export async function importarEgresadosBulk(egresados) {
  const res = await fetch(`${BASE}/egresados/bulk`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ egresados }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudieron importar los egresados')
  return json
}

export async function eliminarEgresado(id) {
  const res = await fetch(`${BASE}/egresados/${id}`, { 
    method: 'DELETE',
    headers: HEADERS
  })
  if (!res.ok) throw new Error('No se pudo eliminar el egresado debido a un error en el servidor')
  return true
}

export async function vaciarEgresados() {
  const res = await fetch(`${BASE}/egresados`, { 
    method: 'DELETE',
    headers: HEADERS
  })
  if (!res.ok) throw new Error('No se pudo vaciar la lista debido a un error en el servidor')
  return true
}

export async function enviarInvitacion(id, correoPersonalizado = null) {
  const res = await fetch(`${BASE}/egresados/${id}/enviar-invitacion`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ correoPersonalizado })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo enviar el correo electrónico')
  return json
}

export async function asignarAsientos(egresadoId, data) {
  const res = await fetch(`${BASE}/egresados/${egresadoId}/asientos`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo guardar la asignación de asientos')
  return json
}

export async function actualizarEntregador(id, nombre) {
  const res = await fetch(`${BASE}/egresados/${id}/entregador`, {
    method: 'PUT',
    headers: HEADERS,
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
    headers: HEADERS,
    body: JSON.stringify({ email })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo generar el código de verificación')
  return json
}

export async function verificarOTP(email, otp) {
  const res = await fetch(`${BASE}/egresados/verificar-otp`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ email, otp })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'El código ingresado es incorrecto o ya expiró')
  return json
}

// ─── SERVICIOS DE INVITADOS ───────────────────────────────────

export async function obtenerInvitados() {
  const res = await fetch(`${BASE}/invitados`, { headers: HEADERS })
  if (!res.ok) throw new Error('No se pudo cargar la base de datos de invitados')
  return res.json()
}

export async function cargarInvitados(token, invitados, egresadoId = null) {
  const res = await fetch(`${BASE}/invitados`, {
    method: 'POST',
    headers: HEADERS,
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
  const res = await fetch(`${BASE}/invitados/egresado/${id}`, { headers: HEADERS })
  if (!res.ok) throw new Error('No se pudo recuperar la lista de tus invitados')
  return res.json()
}

export async function buscarPorUUID(uuid) {
  const res = await fetch(`${BASE}/invitados/buscar/${uuid}`, { headers: HEADERS })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Escaneo fallido: código QR no reconocido')
  return json
}

export async function marcarPresente(id) {
  const res = await fetch(`${BASE}/invitados/${id}/presente`, { 
    method: 'PUT',
    headers: HEADERS
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo realizar el ingreso del invitado')
  return json
}

export async function marcarPresenteMasivo(ids) {
  const res = await fetch(`${BASE}/invitados/presente-masivo`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({ ids }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Error durante el registro de ingreso grupal')
  return json
}

export async function eliminarInvitado(id) {
  const res = await fetch(`${BASE}/invitados/${id}`, { 
    method: 'DELETE',
    headers: HEADERS
  })
  if (!res.ok) throw new Error('No se pudo eliminar al invitado')
  return true
}

export async function actualizarInvitado(id, datos) {
  const res = await fetch(`${BASE}/invitados/${id}`, {
    method: 'PUT',
    headers: HEADERS,
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
  const res = await fetch(`${BASE}/configuracion`, { headers: HEADERS })
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
    headers: HEADERS,
    body: JSON.stringify({ valor: String(valor) }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `No se pudo actualizar el ajuste "${clave}"`)
  return json
}

// ─── SERVICIOS DE CEREMONIAS ─────────────────────────────────

export async function obtenerCeremonias() {
  const res = await fetch(`${BASE}/ceremonias`, { headers: HEADERS })
  if (!res.ok) throw new Error('No se pudieron cargar las ceremonias')
  return res.json()
}

export async function obtenerCeremoniaActiva() {
  const res = await fetch(`${BASE}/ceremonias/activa`, { headers: HEADERS })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('Error al obtener la ceremonia activa')
  }
  return res.json()
}

export async function crearCeremonia(datos) {
  const res = await fetch(`${BASE}/ceremonias`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(datos),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo crear la ceremonia')
  return json
}

export async function activarCeremonia(id) {
  const res = await fetch(`${BASE}/ceremonias/${id}/activar`, {
    method: 'PUT',
    headers: HEADERS
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo activar la ceremonia')
  return json
}

export async function eliminarCeremonia(id) {
  const res = await fetch(`${BASE}/ceremonias/${id}`, {
    method: 'DELETE',
    headers: HEADERS
  })
  if (!res.ok) throw new Error('No se pudo eliminar la ceremonia')
  return true
}
