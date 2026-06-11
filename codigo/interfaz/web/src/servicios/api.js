/**
 * Capa de servicios de comunicación con el Servidor Backend (SiGIC).
 * Todas las llamadas a la API centralizadas aquí para facilitar el mantenimiento.
 */

export const BASE = 'http://localhost:3001/api'

// ─── MANEJO DEL TOKEN DE SESIÓN ───────────────────────────────
// El backend emite un token firmado al iniciar sesión (personal del sistema)
// o al validar la identidad del graduado (OTP / link de invitación). Ese
// token viaja en el header Authorization y es lo que autoriza cada acción.

const CLAVE_TOKEN = 'sigic_token'

export function guardarTokenSesion(token) {
  if (token) localStorage.setItem(CLAVE_TOKEN, token)
}

export function limpiarTokenSesion() {
  localStorage.removeItem(CLAVE_TOKEN)
}

// Cabeceras para todas las peticiones (incluye el token si hay sesión)
export function cabeceras() {
  const token = localStorage.getItem(CLAVE_TOKEN)
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ─── SERVICIOS DE GRADUADOS ───────────────────────────────────

/**
 * Obtiene la lista completa de graduados registrados en el sistema.
 */
export async function obtenerGraduados() {
  const res = await fetch(`${BASE}/egresados`, { headers: cabeceras() })
  if (!res.ok) throw new Error('No se pudo establecer conexión con el servidor de graduados')
  return res.json()
}

/**
 * Crea un nuevo graduado en el sistema.
 * @param {object} datos - Datos del graduado (nombre, dni, legajo, correo, etc.)
 */
export async function crearGraduado(datos) {
  const res = await fetch(`${BASE}/egresados`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Ocurrió un error al intentar crear el graduado')
  return json
}

/**
 * Valida un token de acceso directo (link de invitación).
 * @param {string} token - Token recibido por correo electrónico
 */
export async function validarToken(token) {
  const res = await fetch(`${BASE}/egresados/token/${token}`, { headers: cabeceras() })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'El código de acceso no es válido o ha expirado')
  guardarTokenSesion(json.token_sesion)
  return json
}

/**
 * Importa una lista masiva de graduados desde un archivo CSV/XLSX.
 * @param {Array} graduados - Arreglo de objetos con datos de cada graduado
 */
export async function importarGraduadosMasivo(graduados) {
  const res = await fetch(`${BASE}/egresados/bulk`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ egresados: graduados }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudieron importar los graduados')
  return json
}

/**
 * Elimina un graduado específico y todos sus datos asociados.
 * @param {number} id - Identificador del graduado
 */
export async function eliminarGraduado(id) {
  const res = await fetch(`${BASE}/egresados/${id}`, { 
    method: 'DELETE',
    headers: cabeceras()
  })
  if (!res.ok) throw new Error('No se pudo eliminar el graduado debido a un error en el servidor')
  return true
}

/**
 * Elimina TODOS los graduados del sistema (acción destructiva).
 */
export async function vaciarGraduados() {
  const res = await fetch(`${BASE}/egresados`, { 
    method: 'DELETE',
    headers: cabeceras()
  })
  if (!res.ok) throw new Error('No se pudo vaciar la lista debido a un error en el servidor')
  return true
}

/**
 * Envía el correo de invitación a un graduado.
 * @param {number} id - Identificador del graduado
 * @param {string|null} correoPersonalizado - Correo alternativo (opcional)
 */
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

/**
 * Asigna ubicaciones (asientos) a un graduado y sus invitados.
 * @param {number} graduadoId - Identificador del graduado
 * @param {object} data - Datos de asignación de asientos
 */
export async function asignarAsientos(graduadoId, data) {
  const res = await fetch(`${BASE}/egresados/${graduadoId}/asientos`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo guardar la asignación de asientos')
  return json
}

/**
 * Actualiza el nombre del entregador (versión legacy, mantenida por compatibilidad).
 * @param {number} id - Identificador del graduado
 * @param {string} nombre - Nombre completo del entregador
 */
export async function actualizarEntregadorLegacy(id, nombre) {
  const res = await fetch(`${BASE}/egresados/${id}/entregador`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ nombre }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar el nombre del entregador')
  return json
}

// ─── SERVICIOS DE AUTENTICACIÓN ADMIN / PORTERÍA ───────────────

/**
 * Inicia sesión como administrador o portero con credenciales.
 * @param {string} email - Correo electrónico del administrador
 * @param {string} password - Contraseña de acceso
 */
export async function iniciarSesionAdmin(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ email, password })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Credenciales inválidas')
  guardarTokenSesion(json.token)
  return json
}

// ─── SERVICIOS DE AUTENTICACIÓN OTP (GRADUADOS) ──────────────

/**
 * Solicita el envío de un código OTP al correo del graduado.
 * @param {string} email - Correo electrónico del graduado
 */
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

/**
 * Verifica el código OTP ingresado por el graduado.
 * @param {string} email - Correo electrónico del graduado
 * @param {string} otp - Código de 6 dígitos
 */
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

/**
 * Obtiene la lista completa de todos los invitados del sistema.
 */
export async function obtenerInvitados() {
  const res = await fetch(`${BASE}/invitados`, { headers: cabeceras() })
  if (!res.ok) throw new Error('No se pudo cargar la base de datos de invitados')
  return res.json()
}

/**
 * Carga una lista de invitados vinculados a un graduado.
 * @param {string|null} token - Token de acceso (opcional si se provee graduadoId)
 * @param {Array} invitados - Lista de invitados a registrar
 * @param {number|null} graduadoId - Identificador del graduado (opcional)
 */
export async function cargarInvitados(token, invitados, graduadoId = null) {
  const res = await fetch(`${BASE}/invitados`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ token, egresadoId: graduadoId, invitados }),
  })
  const json = await res.json()
  if (!res.ok) {
    const mensajeError = json.detalle ? `${json.error}: ${json.detalle}` : (json.error || 'Ocurrió un problema al guardar los invitados')
    throw new Error(mensajeError)
  }
  return json
}

/**
 * Obtiene los invitados registrados por un graduado específico.
 * @param {number} id - Identificador del graduado
 */
export async function obtenerInvitadosDeEgresado(id) {
  const res = await fetch(`${BASE}/invitados/egresado/${id}`, { headers: cabeceras() })
  if (!res.ok) throw new Error('No se pudo recuperar la lista de tus invitados')
  return res.json()
}

/**
 * Busca un invitado por su código UUID (escaneo QR).
 * @param {string} uuid - Código UUID único del invitado
 */
export async function buscarPorUUID(uuid) {
  const res = await fetch(`${BASE}/invitados/buscar/${uuid}`, { headers: cabeceras() })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Escaneo fallido: código QR no reconocido')
  return json
}

/**
 * Marca a un invitado como presente en la ceremonia.
 * @param {number} id - Identificador del invitado
 */
export async function marcarPresente(id) {
  const res = await fetch(`${BASE}/invitados/${id}/presente`, { 
    method: 'PUT',
    headers: cabeceras()
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo realizar el ingreso del invitado')
  return json
}

/**
 * Marca múltiples invitados como presentes simultáneamente.
 * @param {Array} ids - Lista de identificadores de invitados
 */
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

/**
 * Elimina un invitado específico del sistema.
 * @param {number} id - Identificador del invitado
 */
export async function eliminarInvitado(id) {
  const res = await fetch(`${BASE}/invitados/${id}`, { 
    method: 'DELETE',
    headers: cabeceras()
  })
  if (!res.ok) throw new Error('No se pudo eliminar al invitado')
  return true
}

/**
 * Actualiza los datos de un invitado existente.
 * @param {number} id - Identificador del invitado
 * @param {object} datos - Datos actualizados del invitado
 */
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
 * Obtiene todos los ajustes del sistema como un objeto { clave: { valor, descripcion } }.
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

// ─── SERVICIOS DE CEREMONIAS ─────────────────────────────────

/**
 * Obtiene la lista de todas las ceremonias registradas.
 */
export async function obtenerCeremonias() {
  const res = await fetch(`${BASE}/ceremonias`, { headers: cabeceras() })
  if (!res.ok) throw new Error('No se pudieron cargar las ceremonias')
  return res.json()
}

/**
 * Obtiene la ceremonia actualmente activa (puede devolver null si no hay ninguna).
 */
export async function obtenerCeremoniaActiva() {
  const res = await fetch(`${BASE}/ceremonias/activa`, { headers: cabeceras() })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('Error al obtener la ceremonia activa')
  }
  return res.json()
}

/**
 * Crea una nueva ceremonia en el sistema.
 * @param {object} datos - Datos de la ceremonia (nombre, fecha, lugar, etc.)
 */
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

/**
 * Activa una ceremonia específica (desactiva las demás).
 * @param {number} id - Identificador de la ceremonia
 */
export async function activarCeremonia(id) {
  const res = await fetch(`${BASE}/ceremonias/${id}/activar`, {
    method: 'PUT',
    headers: cabeceras()
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo activar la ceremonia')
  return json
}

/**
 * Elimina una ceremonia del sistema.
 * @param {number} id - Identificador de la ceremonia
 */
export async function eliminarCeremonia(id) {
  const res = await fetch(`${BASE}/ceremonias/${id}`, {
    method: 'DELETE',
    headers: cabeceras()
  })
  if (!res.ok) throw new Error('No se pudo eliminar la ceremonia')
  return true
}

// ─── SERVICIOS DE CONFIGURACIÓN INICIAL (SETUP) ──────────────

/**
 * Verifica si el sistema requiere la configuración inicial.
 */
export async function obtenerEstadoSetup() {
  const res = await fetch(`${BASE}/setup/status`, { headers: cabeceras() })
  if (!res.ok) throw new Error('No se pudo verificar el estado del sistema')
  return res.json()
}

/**
 * Ejecuta la inicialización del sistema con los datos provistos.
 * @param {object} datos - Datos para la configuración inicial
 */
export async function inicializarSistema(datos) {
  const res = await fetch(`${BASE}/setup/initialize`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Error al intentar inicializar el sistema')
  return json
}

// ─── SERVICIOS DE PROFESORES ─────────────────────────────────

/**
 * Obtiene la lista completa de profesores registrados.
 */
export async function obtenerProfesores() {
  const res = await fetch(`${BASE}/profesores`, { headers: cabeceras() })
  if (!res.ok) throw new Error('No se pudo cargar la lista de profesores')
  return res.json()
}

/**
 * Crea un nuevo profesor en el sistema.
 * @param {object} datos - Datos del profesor (nombre, dni, materia)
 */
export async function crearProfesor(datos) {
  const res = await fetch(`${BASE}/profesores`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo crear el profesor')
  return json
}

/**
 * Edita los datos de un profesor existente.
 * @param {number} id - Identificador del profesor
 * @param {object} datos - Datos actualizados del profesor
 */
export async function editarProfesor(id, datos) {
  const res = await fetch(`${BASE}/profesores/${id}`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify(datos),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar el profesor')
  return json
}

/**
 * Elimina un profesor del sistema.
 * @param {number} id - Identificador del profesor
 */
export async function eliminarProfesor(id) {
  const res = await fetch(`${BASE}/profesores/${id}`, {
    method: 'DELETE',
    headers: cabeceras()
  })
  if (!res.ok) throw new Error('No se pudo eliminar el profesor')
  return true
}

// ─── SERVICIOS DE ENTREGADORES ───────────────────────────────

/**
 * Obtiene los entregadores asignados a un graduado específico.
 * @param {number} graduadoId - Identificador del graduado
 */
export async function obtenerEntregadoresDeGraduado(graduadoId) {
  const res = await fetch(`${BASE}/entregadores/graduado/${graduadoId}`, { headers: cabeceras() })
  if (!res.ok) throw new Error('No se pudieron cargar los entregadores del graduado')
  return res.json()
}

/**
 * Asigna un nuevo entregador a un graduado.
 * @param {object} datos - Datos del entregador (graduadoId, tipo, referenciaId, nombre, etc.)
 */
export async function asignarEntregador(datos) {
  const res = await fetch(`${BASE}/entregadores`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo asignar el entregador')
  return json
}

/**
 * Elimina un entregador asignado.
 * @param {number} id - Identificador del entregador
 */
export async function eliminarEntregador(id) {
  const res = await fetch(`${BASE}/entregadores/${id}`, {
    method: 'DELETE',
    headers: cabeceras()
  })
  if (!res.ok) throw new Error('No se pudo eliminar el entregador')
  return true
}

// ─── SERVICIOS DE RESPUESTA A INVITACIÓN ─────────────────────

/**
 * Registra la respuesta del graduado a la invitación de la ceremonia.
 * @param {number} graduadoId - Identificador del graduado
 * @param {string} respuesta - Respuesta ('ACEPTADO' o 'RECHAZADO')
 * @param {object} datosExtra - Datos adicionales opcionales
 */
export async function responderInvitacion(graduadoId, respuesta, datosExtra = {}) {
  const res = await fetch(`${BASE}/egresados/${graduadoId}/responder-invitacion`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ respuesta, ...datosExtra }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'No se pudo registrar la respuesta a la invitación')
  return json
}
