import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const DEFAULT_BASE_URL = 'http://localhost:3000/api';
const DEVICE_ID_KEY = 'sigic_device_id';

async function getDeviceId(): Promise<string> {
  const existente = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existente) return existente;
  const aleatorio = Math.random().toString(36).slice(2, 12);
  const nuevo = `sigic-${Date.now().toString(36)}-${aleatorio}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, nuevo);
  return nuevo;
}

export async function obtenerInfoDispositivo() {
  return {
    dispositivoId: await getDeviceId(),
    marca: Device.brand || 'Desconocida',
    fabricante: Device.manufacturer || 'Desconocido',
    modelo: Device.modelName || Device.modelId || 'Dispositivo móvil',
    nombreDispositivo: Device.deviceName || null,
    sistema: Device.osName || 'Desconocido',
    versionSistema: Device.osVersion || null,
    tipoDispositivo: Device.deviceType == null ? 'Desconocido' : String(Device.deviceType),
    esDispositivoReal: Device.isDevice,
    versionApp: Constants.expoConfig?.version || '1.0.0',
  };
}

export async function registrarActividadDispositivo(): Promise<void> {
  await request('/dispositivos/registrar', {
    method: 'POST',
    body: JSON.stringify(await obtenerInfoDispositivo()),
  });
}

export function normalizarApiUrl(url: string): string {
  let normalizada = String(url || '').trim().replace(/\/+$/, '');
  if (!normalizada) return DEFAULT_BASE_URL;
  if (!/^https?:\/\//i.test(normalizada)) normalizada = `http://${normalizada}`;
  if (!/\/api$/i.test(normalizada)) normalizada = `${normalizada}/api`;
  return normalizada;
}

export function esDireccionLocal(url: string): boolean {
  return /:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(normalizarApiUrl(url));
}

export async function getApiUrl(): Promise<string> {
  const url = await AsyncStorage.getItem('sigic_api_url');
  return normalizarApiUrl(url || DEFAULT_BASE_URL);
}

export async function setApiUrl(url: string): Promise<void> {
  await AsyncStorage.setItem('sigic_api_url', normalizarApiUrl(url));
}

export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem('sigic_token');
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem('sigic_token', token);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem('sigic_token');
  await AsyncStorage.removeItem('sigic_user');
}

export async function cerrarSesionDispositivo(): Promise<void> {
  const token = await getToken();
  if (token) {
    try {
      const baseUrl = await getApiUrl();
      const dispositivo = await obtenerInfoDispositivo();
      await fetch(`${baseUrl}/dispositivos/desvincular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dispositivoId: dispositivo.dispositivoId }),
      });
    } catch {
      // El cierre local debe continuar aunque el servidor no esté disponible.
    }
  }
  await clearSession();
}

export async function getLoggedUser(): Promise<any | null> {
  const userStr = await AsyncStorage.getItem('sigic_user');
  return userStr ? JSON.parse(userStr) : null;
}

export async function setLoggedUser(user: any): Promise<void> {
  await AsyncStorage.setItem('sigic_user', JSON.stringify(user));
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const baseUrl = await getApiUrl();
  const token = await getToken();
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });

    const texto = await response.text();
    let json: any = {};
    try {
      json = texto ? JSON.parse(texto) : {};
    } catch {
      json = { error: texto || 'Respuesta inválida del servidor' };
    }

    if (!response.ok) {
      if (response.status === 401) await clearSession();
      const error: any = new Error(json.error || 'Error en la petición al servidor');
      error.status = response.status;
      error.codigo = response.status === 401 ? 'SESION_INVALIDA' : 'ERROR_API';
      throw error;
    }

    return json;
  } catch (error: any) {
    if (error?.status) throw error;
    const errorConexion: any = new Error('No se pudo conectar con el servidor de SiGIC');
    errorConexion.codigo = 'SIN_CONEXION';
    throw errorConexion;
  }
}

export async function validarSesionActual(): Promise<any> {
  const token = await getToken();
  if (!token) {
    const error: any = new Error('No hay una sesión iniciada');
    error.codigo = 'SIN_SESION';
    throw error;
  }

  const respuesta = await request('/auth/sesion');
  const usuario = respuesta.usuario || respuesta.user || respuesta;
  const rolesPermitidos = ['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATIVO', 'PORTERIA'];
  if (!usuario?.rol || !rolesPermitidos.includes(String(usuario.rol).toUpperCase())) {
    await clearSession();
    const error: any = new Error('Esta cuenta no tiene permisos para utilizar SiGIC Accesos');
    error.codigo = 'ROL_NO_AUTORIZADO';
    throw error;
  }
  await setLoggedUser(usuario);
  try {
    await registrarActividadDispositivo();
  } catch {
    // El inventario del dispositivo no debe impedir el acceso operativo.
  }
  return { ...respuesta, usuario };
}

export async function testConnection(url: string): Promise<boolean> {
  try {
    const baseUrl = normalizarApiUrl(url);
    const response = await fetch(`${baseUrl}/estado`, {
      method: 'GET',
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data?.ok === true && data?.servicio === 'sigic';
  } catch (e) {
    return false;
  }
}

export async function loginWithCredentials(email: string, password: string): Promise<any> {
  const baseUrl = await getApiUrl();
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Credenciales inválidas');
  
  await setToken(json.token);
  try {
    const userDetails = await validarSesionActual();
    await setLoggedUser(userDetails.usuario);
    return { ...json, usuario: userDetails.usuario };
  } catch (error) {
    await clearSession();
    throw error;
  }
}

export async function loginWithToken(token: string): Promise<any> {
  await setToken(token);
  try {
    const userDetails = await validarSesionActual();
    await setLoggedUser(userDetails.usuario || { rol: 'PORTERIA', nombre: 'Personal de Seguridad' });
    return userDetails;
  } catch (e) {
    await clearSession();
    throw e;
  }
}

export async function buscarInvitadoOGrupo(codigo: string): Promise<any> {
  return await request(`/invitados/buscar/${codigo}`);
}

export async function acreditarInvitado(id: string): Promise<any> {
  return await request(`/invitados/${id}/presente`, {
    method: 'PUT',
  });
}

export async function acreditarInvitadosMasivo(ids: string[]): Promise<any> {
  return await request('/invitados/presente-masivo', {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  });
}

export async function obtenerStatsReal(): Promise<any> {
  return await request('/stats');
}

export async function obtenerCeremoniaActiva(): Promise<any> {
  return await request('/ceremonias/activa');
}

export async function obtenerCeremoniasAutorizadas(): Promise<any[]> {
  return await request('/ceremonias/autorizadas');
}
