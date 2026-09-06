// Capa de servicios de comunicación unificada en TypeScript para la migración
// Apunta de forma híbrida al backend local de Next.js para lo ya migrado
// y al backend clásico (puerto 3001) para lo que está en transición.

export const BASE_CLASSIC = '/api';
export const BASE_LOCAL = '/api';
export const BASE = BASE_CLASSIC;

const CLAVE_TOKEN = 'sigic_token';

export function guardarTokenSesion(token: string) {
  if (token && typeof window !== 'undefined') {
    sessionStorage.setItem(CLAVE_TOKEN, token);
    localStorage.removeItem(CLAVE_TOKEN);
  }
}

export function limpiarTokenSesion() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_TOKEN);
  }
}

export function obtenerTokenSesion() {
  if (typeof window === 'undefined') return '';
  const tokenSesion = sessionStorage.getItem(CLAVE_TOKEN) || '';
  if (tokenSesion) return tokenSesion;

  // Migra una sesión anterior al almacenamiento aislado por pestaña.
  const tokenAnterior = localStorage.getItem(CLAVE_TOKEN) || '';
  if (tokenAnterior) {
    sessionStorage.setItem(CLAVE_TOKEN, tokenAnterior);
    localStorage.removeItem(CLAVE_TOKEN);
  }
  return tokenAnterior;
}

const peticionesEnVuelo = new Map<string, Promise<Response>>();

/**
 * Realiza peticiones HTTP deduplicando llamadas GET concurrentes
 * hacia la misma URL y con el mismo token.
 */
export async function fetchDeduplicado(url: string, opciones?: RequestInit): Promise<Response> {
  const metodo = opciones?.method ? opciones.method.toUpperCase() : 'GET';
  if (metodo !== 'GET') {
    return fetch(url, opciones);
  }

  const clave = `${url}_${obtenerTokenSesion()}`;
  if (peticionesEnVuelo.has(clave)) {
    return peticionesEnVuelo.get(clave)!.then(res => res.clone());
  }

  const promesa = fetch(url, opciones).finally(() => {
    peticionesEnVuelo.delete(clave);
  });

  peticionesEnVuelo.set(clave, promesa);
  return promesa.then(res => res.clone());
}

export function cabeceras() {
  const token = obtenerTokenSesion();
  const esDemo = (typeof window !== 'undefined') && (
    token.startsWith('bypass-') ||
    sessionStorage.getItem('sigic_demo_activa') === 'true' ||
    sessionStorage.getItem('sigic_demo_sandbox_activo') === 'true' ||
    localStorage.getItem('sigic_modo_demo') === 'true'
  );
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(esDemo ? { 'X-Sigic-Demo': '1' } : {})
  };
}

export async function enviarCorreoPrueba(destinatario: string) {
  const res = await fetch(`${BASE_LOCAL}/correo/prueba`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ destinatario })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo enviar el correo de prueba');
  return json;
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
  if (!res.ok) {
    if (res.status === 429) {
      const segundos = json.segundosRestantes || 60;
      const mins = Math.floor(segundos / 60);
      const secs = segundos % 60;
      const tiempoStr = mins > 0 ? `${mins} min y ${secs} seg` : `${secs} segundos`;
      throw new Error(`Demasiados intentos. Por favor, esperá ${tiempoStr} para volver a intentar.`);
    }
    throw new Error(json.error || 'Credenciales inválidas');
  }
  if (json.token) {
    guardarTokenSesion(json.token);
  } else {
    limpiarTokenSesion();
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('sigic_modo_demo', 'false');
    sessionStorage.removeItem('sigic_demo_activa');
    sessionStorage.removeItem('sigic_demo_sandbox_activo');
  }
  return json;
}

export async function cerrarSesionServidor() {
  await fetch(`${BASE_LOCAL}/auth/logout`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: cabeceras()
  }).catch(() => null);
}

export async function validarSesionLocal() {
  const res = await fetch(`${BASE_LOCAL}/auth/sesion`, { headers: cabeceras() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Sesión inválida o expirada');
  return json;
}

export async function obtenerGoogleWalletPass(egresadoId: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${egresadoId}/wallet`, {
    method: 'POST',
    headers: cabeceras()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo generar el pase para Google Wallet');
  return json;
}

// ============================================================
// SERVICIOS EN TRANSICIÓN (APUNTAN AL BACKEND CLÁSICO)
// ============================================================

export async function obtenerGraduados(ceremoniaId: string | number | null = null) {
  const params = ceremoniaId ? `?ceremoniaId=${encodeURIComponent(String(ceremoniaId))}` : '';
  const res = await fetchDeduplicado(`${BASE_CLASSIC}/egresados${params}`, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudo establecer conexión con el servidor de graduados');
  const graduados = await res.json();
  // Compatibilidad con entornos que aún no aplican el parámetro en el backend.
  // Nunca debemos mezclar el padrón de dos ceremonias en la interfaz.
  return ceremoniaId
    ? graduados.filter((graduado: any) => String(graduado.ceremonia_id) === String(ceremoniaId))
    : graduados;
}

export async function obtenerGraduadoPorId(id: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${id}`, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudo obtener la información del graduado');
  return res.json();
}

export async function crearGraduado(datos: any) {
  const res = await fetch(`${BASE_CLASSIC}/egresados`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos)
  });
  const json = await res.json();
  if (!res.ok) {
    const error = Object.assign(new Error(json.error || 'Ocurrió un error al intentar crear el graduado'), {
      codigo: json.codigo,
      persona: json.persona,
    });
    throw error;
  }
  return json;
}

export async function buscarGraduadoPorDNI(dni: string) {
  const dniLimpio = String(dni || '').replace(/\D/g, '');
  if (dniLimpio.length < 7) return { coincidencias: [] };

  const res = await fetch(`${BASE_CLASSIC}/egresados/coincidencias-dni/${dniLimpio}`, {
    headers: cabeceras()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo comprobar el DNI');
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

export async function solicitarOTP(identificador: string, inscripcionId: string | number | null = null) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/solicitar-otp`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ identificador, inscripcionId })
  });
  const json = await res.json();
  if (!res.ok) {
    if (res.status === 429) {
      const segundos = json.segundosRestantes || 60;
      const mins = Math.floor(segundos / 60);
      const secs = segundos % 60;
      const tiempoStr = mins > 0 ? `${mins} min y ${secs} seg` : `${secs} segundos`;
      const errorEspera = new Error(`Demasiadas solicitudes de código. Por favor, esperá ${tiempoStr} para volver a intentar.`) as Error & { segundosRestantes?: number };
      errorEspera.segundosRestantes = segundos;
      throw errorEspera;
    }
    throw new Error(json.error || 'No se pudo generar el código de verificación');
  }
  return json;
}

export async function verificarOTP(identificador: string, otp: string, inscripcionId: string | number | null = null) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/verificar-otp`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ identificador, otp, inscripcionId })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'El código ingresado es incorrecto o ya expiró');
  guardarTokenSesion(json.token_sesion);
  return json;
}

export async function obtenerInvitados(ceremoniaId: string | number | null = null) {
  const params = ceremoniaId ? `?ceremoniaId=${encodeURIComponent(String(ceremoniaId))}` : '';
  const res = await fetch(`${BASE_CLASSIC}/invitados${params}`, { headers: cabeceras() });
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
  const res = await fetchDeduplicado(`${BASE_CLASSIC}/configuracion`, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudo cargar la configuración del sistema');
  return res.json();
}

export async function obtenerDispositivosMoviles() {
  const res = await fetchDeduplicado(`${BASE_CLASSIC}/dispositivos`, { headers: cabeceras() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudieron cargar los dispositivos móviles');
  return json;
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
  const res = await fetchDeduplicado(`${BASE_CLASSIC}/ceremonias`, { headers: cabeceras() });
  // El escritorio puede abrirse aunque la base esté temporalmente fuera de línea.
  // El módulo mostrará estado vacío y permitirá reintentar sin romper la sesión.
  if (!res.ok) {
    if (res.status === 404 || res.status === 500 || res.status === 503) return [];
    throw new Error('No se pudieron cargar las ceremonias');
  }
  return res.json();
}

export async function obtenerCeremoniaActiva() {
  const res = await fetchDeduplicado(`${BASE_CLASSIC}/ceremonias/activa`, { headers: cabeceras() });
  if (!res.ok) {
    if (res.status === 404 || res.status === 500 || res.status === 503) return null;
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

export async function solicitarRestablecimientoContrasena(email: string) {
  const res = await fetch(`${BASE_LOCAL}/auth/recuperar-contrasena`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ email })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No pudimos enviar el enlace de recuperación.');
  return json;
}

export async function buscarHistorialGraduados(termino: string) {
  const query = String(termino || '').trim();
  if (query.length < 2) return [];

  const res = await fetch(`${BASE_CLASSIC}/egresados/historial?q=${encodeURIComponent(query)}`, {
    headers: cabeceras()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo consultar el historial institucional');
  return json;
}

export async function restablecerContrasena(token: string, password: string) {
  const res = await fetch(`${BASE_LOCAL}/auth/restablecer-contrasena`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ token, password })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No pudimos actualizar la contraseña.');
  return json;
}

export async function actualizarGraduado(id: string | number, datos: any) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${id}`, { method: 'PUT', headers: cabeceras(), body: JSON.stringify(datos) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar el graduado');
  return json.graduado;
}

export async function actualizarEstadoCeremonia(id: string | number, estado: string) {
  const res = await fetch(`${BASE_CLASSIC}/ceremonias/${id}/estado`, {
    method: 'PUT', headers: cabeceras(), body: JSON.stringify({ estado })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar el estado operativo');
  return json;
}

export async function actualizarPlazosCeremonia(id: string | number, plazos: any) {
  const res = await fetch(`${BASE_CLASSIC}/ceremonias/${id}`, {
    method: 'PUT', headers: cabeceras(), body: JSON.stringify(plazos)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudieron actualizar los plazos de la ceremonia');
  return json.ceremonia;
}

export async function corroborarGraduado(id: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${id}/corroborar`, {
    method: 'POST',
    headers: cabeceras()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudieron corroborar los datos');
  return json;
}

export async function enviarCredencialCeremonia(id: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${id}/enviar-credencial`, {
    method: 'POST', headers: cabeceras()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo enviar la credencial');
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
  const res = await fetchDeduplicado(`${BASE_CLASSIC}/setup/status`, { headers: cabeceras() });
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
  const res = await fetchDeduplicado(`${BASE_CLASSIC}/profesores`, { headers: cabeceras() });
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

export async function importarProfesoresMasivo(profesores: any[]) {
  const res = await fetch(`${BASE_CLASSIC}/profesores/importar`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ profesores })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudieron importar los profesores');
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

export async function actualizarJuramentoGraduado(graduadoId: string | number, formulaJuramento: string, comentarios?: string) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${graduadoId}`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ formulaJuramento, comentarios })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo guardar la fórmula de juramento');
  return json;
}

export async function autoAsignarButacas(ceremoniaId?: string | number, opciones: any = {}) {
  const res = await fetch(`${BASE_CLASSIC}/anfiteatro/auto-asignar`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ ceremoniaId, ...opciones })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo realizar la distribución automática de butacas');
  return json;
}

export async function marcarDiplomaEntregado(graduadoId: string | number, diploma_entregado: boolean) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${graduadoId}`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ diploma_entregado })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar el estado del diploma');
  return json;
}

export async function finalizarInscripcionGraduado(graduadoId: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${graduadoId}/finalizar-inscripcion`, {
    method: 'PUT',
    headers: cabeceras(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo finalizar la inscripción');
  return json;
}

export async function obtenerUsuarios() {
  const res = await fetch(`${BASE_CLASSIC}/usuarios`, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudieron cargar los usuarios del sistema');
  return res.json();
}

export async function crearUsuario(datos: any) {
  const res = await fetch(`${BASE_CLASSIC}/usuarios`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(datos)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo crear el usuario');
  return json;
}

export async function actualizarUsuarioEstado(id: string, activo: number) {
  const res = await fetch(`${BASE_CLASSIC}/usuarios/${id}/estado`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ activo })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar el estado del usuario');
  return json;
}

export async function actualizarUsuarioRol(id: string, rol: string) {
  const res = await fetch(`${BASE_CLASSIC}/usuarios/${id}/rol`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ rol })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar el rol del usuario');
  return json;
}

export async function obtenerUsuarioToken(id: string) {
  const res = await fetch(`${BASE_CLASSIC}/usuarios/${id}/token`, { headers: cabeceras() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo generar el token del usuario');
  return json;
}

export async function enviarInvitacionUsuario(id: string) {
  const res = await fetch(`${BASE_CLASSIC}/usuarios/${id}/enviar-invitacion`, {
    method: 'POST',
    headers: cabeceras()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo enviar la invitación por correo');
  return json;
}

export async function eliminarUsuario(id: string) {
  const res = await fetch(`${BASE_CLASSIC}/usuarios/${id}`, {
    method: 'DELETE',
    headers: cabeceras()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo eliminar el usuario');
  return json;
}

export async function obtenerAutorizacionesCeremonia(ceremoniaId: string) {
  const res = await fetch(`${BASE_CLASSIC}/ceremonias/${ceremoniaId}/autorizados`, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudieron obtener las autorizaciones para esta ceremonia');
  return res.json();
}

export async function actualizarAutorizacionCeremonia(ceremoniaId: string, usuarioId: string, autorizado: boolean) {
  const res = await fetch(`${BASE_CLASSIC}/ceremonias/${ceremoniaId}/autorizados/${usuarioId}`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ autorizado })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo actualizar la autorización');
  return json;
}

export async function autorizarTodosEnCeremonia(ceremoniaId: string) {
  const res = await fetch(`${BASE_CLASSIC}/ceremonias/${ceremoniaId}/autorizar-todos`, {
    method: 'POST',
    headers: cabeceras(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo autorizar al personal');
  return json;
}

export async function desautorizarTodosEnCeremonia(ceremoniaId: string) {
  const res = await fetch(`${BASE_CLASSIC}/ceremonias/${ceremoniaId}/desautorizar-todos`, {
    method: 'POST',
    headers: cabeceras(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudieron revocar las autorizaciones');
  return json;
}

export async function desvincularDispositivoAdmin(dispositivoId: string) {
  const res = await fetch(`${BASE_CLASSIC}/dispositivos/desvincular-admin`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ dispositivoId })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo desvincular el dispositivo');
  return json;
}

export async function exportarBaseDatos() {
  const res = await fetch(`${BASE_CLASSIC}/setup/export`, { headers: cabeceras() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo exportar la base de datos');
  return json;
}

export async function resetearSistema() {
  const res = await fetch(`${BASE_CLASSIC}/setup/reset`, {
    method: 'POST',
    headers: cabeceras()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo resetear el sistema');
  return json;
}

// ============================================================
// SERVICIOS DE ACREDITACIÓN Y CONTROL DE ACCESO (PORTERÍA)
// ============================================================

export async function buscarAcreditacion(codigo: string) {
  const res = await fetch(`${BASE_CLASSIC}/invitados/buscar/${encodeURIComponent(codigo.trim())}`, {
    headers: cabeceras()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se encontró la credencial o el código ingresado.');
  return json;
}

export async function acreditarEgresado(id: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${id}/presente`, {
    method: 'PUT',
    headers: cabeceras()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo registrar el ingreso del egresado.');
  return json;
}

export async function acreditarInvitado(id: string | number) {
  const res = await fetch(`${BASE_CLASSIC}/invitados/${id}/presente`, {
    method: 'PUT',
    headers: cabeceras()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo registrar el ingreso del acompañante.');
  return json;
}

export async function acreditarGrupo(egresadoId: string | number, invitadoIds: string[] = [], acreditarEgresado = true) {
  const res = await fetch(`${BASE_CLASSIC}/egresados/${egresadoId}/presente-grupo`, {
    method: 'PUT',
    headers: cabeceras(),
    body: JSON.stringify({ acreditarEgresado, invitadoIds })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo acreditar el grupo.');
  return json;
}

export async function obtenerAsistenciaOperativa() {
  const res = await fetch(`${BASE_CLASSIC}/asistencia`, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudo obtener el estado de asistencia en sala.');
  return res.json();
}

export const obtenerEstadisticasAcreditacion = obtenerAsistenciaOperativa;

export async function descargarManifiestoAcreditacion(ceremoniaId?: string) {
  const url = ceremoniaId 
    ? `${BASE_CLASSIC}/acreditacion/manifiesto/${ceremoniaId}` 
    : `${BASE_CLASSIC}/acreditacion/manifiesto`;
  const res = await fetch(url, { headers: cabeceras() });
  if (!res.ok) throw new Error('No se pudo descargar el manifiesto de acreditación.');
  return res.json();
}

export async function sincronizarLoteAcreditacion(items: any[]) {
  const res = await fetch(`${BASE_CLASSIC}/acreditacion/sincronizar-lote`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ items })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo sincronizar el lote de acreditaciones.');
  return json;
}

export async function obtenerGraduadoEnEstrado(ceremoniaId?: string) {
  const url = ceremoniaId 
    ? `${BASE_CLASSIC}/ceremonias/en-estrado/${ceremoniaId}` 
    : `${BASE_CLASSIC}/ceremonias/en-estrado`;
  const res = await fetch(url, { headers: cabeceras() });
  if (!res.ok) return { enEstrado: null };
  return res.json();
}

export async function actualizarGraduadoEnEstrado(ceremoniaId: string, graduado: any) {
  const res = await fetch(`${BASE_CLASSIC}/ceremonias/en-estrado`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({ ceremoniaId, graduado })
  });
  return res.json();
}

export async function obtenerRegistrosAuditoria(entidad?: string, limite = 100) {
  const params = new URLSearchParams()
  if (entidad) params.append('entidad', entidad)
  if (limite) params.append('limite', String(limite))

  const res = await fetch(`${BASE_CLASSIC}/auditoria?${params.toString()}`, {
    headers: cabeceras()
  });
  if (!res.ok) throw new Error('No se pudo obtener el historial de auditoría.');
  return res.json();
}


