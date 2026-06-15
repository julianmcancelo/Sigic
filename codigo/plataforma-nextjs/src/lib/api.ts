// Capa de servicios de comunicación unificada en TypeScript para la migración
// Apunta de forma híbrida al backend local de Next.js para lo ya migrado
// y al backend clásico (puerto 3001) para lo que está en transición.

export const BASE_CLASSIC = 'http://localhost:3001/api';
export const BASE_LOCAL = '/api';
export const BASE = BASE_CLASSIC;

const CLAVE_TOKEN = 'sigic_token';

export function guardarTokenSesion(token: string) {
  if (token && typeof window !== 'undefined') localStorage.setItem(CLAVE_TOKEN, token);
}

export function limpiarTokenSesion() {
  if (typeof window !== 'undefined') localStorage.removeItem(CLAVE_TOKEN);
}

export function cabeceras() {
  const token = typeof window !== 'undefined' ? localStorage.getItem(CLAVE_TOKEN) : '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

// ============================================================
// SERVICIOS MIGRADOS AL BACKEND LOCAL (NEXT.JS)
// ============================================================

export async function iniciarSesionAdmin(email: string, password: string) {
  const res = await fetch(`${BASE_LOCAL}/auth/login`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ email, password })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Credenciales inválidas');
  guardarTokenSesion(json.token);
  return json;
}

export async function validarSesionLocal() {
  const res = await fetch(`${BASE_LOCAL}/auth/sesion`, { headers: cabeceras() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Sesión inválida o expirada');
  return json;
}

// ============================================================
// SERVICIOS EN TRANSICIÓN (APUNTAN AL BACKEND CLÁSICO)
// ============================================================

export async function obtenerGraduados() {
  const res = await fetch(`${BASE_CLASSIC}/egresados`, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudo establecer conexión con el servidor de graduados');
  return res.json();
}

export async function crearGraduado(datos: any) {
  const res = await fetch(`${BASE_CLASSIC}/egresados`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ocurrió un error al intentar crear el graduado');
  return json;
}

export async function validarToken(token: string) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/token/${token}`, { headers: cabeceras() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'El código de acceso no es válido o ha expirado');
  guardarTokenSesion(json.token_sesion);
  return json;
}

export async function importarGraduadosMasivo(graduados: any[]) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/bulk`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ egresados: graduados })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudieron importar los graduados');
  return json;
}

export async function eliminarGraduado(id: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${id}`, {
    method: 'DELETE',
    headers: cabeceras()
  });
  if (!res.ok) throw new Error('No se pudo eliminar el graduado debido a un error en el servidor');
  return true;
}

export async function vaciarGraduados() {
  const res = await fetch(`${BASE_CLASSIC}/egresados`, {
    method: 'DELETE',
    headers: cabeceras()
  });
  if (!res.ok) throw new Error('No se pudo vaciar la lista debido a un error en el servidor');
  return true;
}

export async function enviarInvitacion(id: string | number, correoPersonalizado: string | null = null) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${id}/enviar-invitacion`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ correoPersonalizado })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo enviar el correo electrónico');
  return json;
}

export async function asignarAsientos(graduadoId: string | number, data: any) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${graduadoId}/asientos`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo guardar la asignación de asientos');
  return json;
}

export async function actualizarEntregadorLegacy(id: string | number, nombre: string) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${id}/entregador`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ nombre })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar el nombre del entregador');
  return json;
}

export async function solicitarOTP(email: string) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/solicitar-otp`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ email })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo generar el código de verificación');
  return json;
}

export async function verificarOTP(email: string, otp: string) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/verificar-otp`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ email, otp })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'El código ingresado es incorrecto o ya expiró');
  guardarTokenSesion(json.token_sesion);
  return json;
}

export async function obtenerInvitados() {
  const res = await fetch(`${BASE_CLASSIC}/invitados`, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudo cargar la base de datos de invitados');
  return res.json();
}

export async function cargarInvitados(token: string | null, invitados: any[], graduadoId: string | number | null = null) {
  const res = await fetch(`${BASE_CLASSIC}/invitados`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ token, egresadoId: graduadoId, invitados })
  });
  const json = await res.json();
  if (!res.ok) {
    const mensajeError = json.detalle ? `${json.error}: ${json.detalle}` : (json.error || 'Ocurrió un problema al guardar los invitados');
    throw new Error(mensajeError);
  }
  return json;
}

export async function obtenerInvitadosDeEgresado(id: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/invitados/egresado/${id}`, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudo recuperar la lista de tus invitados');
  return res.json();
}

export async function buscarPorUUID(uuid: string) {
  const res = await fetch(`${BASE_CLASSIC}/invitados/buscar/${uuid}`, { headers: cabeceras() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Escaneo fallido: código QR no reconocido');
  return json;
}

export async function marcarPresente(id: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/invitados/${id}/presente`, {
    method: 'PUT',
    headers: cabeceras()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo realizar el ingreso del invitado');
  return json;
}

export async function marcarPresenteMasivo(ids: (string | number)[]) {
  const res = await fetch(`${BASE_CLASSIC}/invitados/presente-masivo`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ ids })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error durante el registro de ingreso grupal');
  return json;
}

export async function eliminarInvitado(id: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/invitados/${id}`, {
    method: 'DELETE',
    headers: cabeceras()
  });
  if (!res.ok) throw new Error('No se pudo eliminar al invitado');
  return true;
}

export async function actualizarInvitado(id: string | number, datos: any) {
  const res = await fetch(`${BASE_CLASSIC}/invitados/${id}`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify(datos)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar los datos del invitado');
  return json;
}

export async function obtenerAjustes() {
  const res = await fetch(`${BASE_CLASSIC}/configuracion`, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudo cargar la configuración del sistema');
  return res.json();
}

export async function actualizarAjuste(clave: string, valor: string | number | boolean) {
  const res = await fetch(`${BASE_CLASSIC}/configuracion/${clave}`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ valor: String(valor) })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `No se pudo actualizar el ajuste "${clave}"`);
  return json;
}

export async function obtenerCeremonias() {
  const res = await fetch(`${BASE_CLASSIC}/ceremonias`, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudieron cargar las ceremonias');
  return res.json();
}

export async function obtenerCeremoniaActiva() {
  const res = await fetch(`${BASE_CLASSIC}/ceremonias/activa`, { headers: cabeceras() });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Error al obtener la ceremonia activa');
  }
  return res.json();
}

export async function crearCeremonia(datos: any) {
  const res = await fetch(`${BASE_CLASSIC}/ceremonias`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo crear la ceremonia');
  return json;
}

export async function activarCeremonia(id: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/ceremonias/${id}/activar`, {
    method: 'PUT',
    headers: cabeceras()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo activar la ceremonia');
  return json;
}

export async function eliminarCeremonia(id: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/ceremonias/${id}`, {
    method: 'DELETE',
    headers: cabeceras()
  });
  if (!res.ok) throw new Error('No se pudo eliminar la ceremonia');
  return true;
}

export async function obtenerEstadoSetup() {
  const res = await fetch(`${BASE_CLASSIC}/setup/status`, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudo verificar el estado del sistema');
  return res.json();
}

export async function inicializarSistema(datos: any) {
  const res = await fetch(`${BASE_CLASSIC}/setup/initialize`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al intentar inicializar el sistema');
  return json;
}

export async function obtenerProfesores() {
  const res = await fetch(`${BASE_CLASSIC}/profesores`, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudo cargar la lista de profesores');
  return res.json();
}

export async function crearProfesor(datos: any) {
  const res = await fetch(`${BASE_CLASSIC}/profesores`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo crear el profesor');
  return json;
}

export async function editarProfesor(id: string | number, datos: any) {
  const res = await fetch(`${BASE_CLASSIC}/profesores/${id}`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify(datos)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar el profesor');
  return json;
}

export async function eliminarProfesor(id: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/profesores/${id}`, {
    method: 'DELETE',
    headers: cabeceras()
  });
  if (!res.ok) throw new Error('No se pudo eliminar el profesor');
  return true;
}

export async function obtenerEntregadoresDeGraduado(graduadoId: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/entregadores/graduado/${graduadoId}`, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudieron cargar los entregadores del graduado');
  return res.json();
}

export async function asignarEntregador(datos: any) {
  const res = await fetch(`${BASE_CLASSIC}/entregadores`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo asignar el entregador');
  return json;
}

export async function eliminarEntregador(id: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/entregadores/${id}`, {
    method: 'DELETE',
    headers: cabeceras()
  });
  if (!res.ok) throw new Error('No se pudo eliminar el entregador');
  return true;
}

export async function responderInvitacion(graduadoId: string | number, respuesta: string, datosExtra = {}) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${graduadoId}/responder-invitacion`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ respuesta, ...datosExtra })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo registrar la respuesta a la invitación');
  return json;
}
