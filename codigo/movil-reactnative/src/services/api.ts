import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_BASE_URL = 'http://localhost:3001/api';

export async function getApiUrl(): Promise<string> {
  const url = await AsyncStorage.getItem('sigic_api_url');
  return url || DEFAULT_BASE_URL;
}

export async function setApiUrl(url: string): Promise<void> {
  await AsyncStorage.setItem('sigic_api_url', url);
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
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });
  
  const json = await response.json();
  
  if (!response.ok) {
    throw new Error(json.error || 'Error en la petición al servidor');
  }
  
  return json;
}

export async function testConnection(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/configuracion`, {
      method: 'GET',
    });
    return response.ok;
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
  // Verificar sesión para obtener detalles del usuario
  const userDetails = await request('/auth/sesion');
  await setLoggedUser(userDetails.usuario || { email, rol: 'PORTERIA', nombre: 'Personal de Seguridad' });
  return json;
}

export async function loginWithToken(token: string): Promise<any> {
  await setToken(token);
  try {
    const userDetails = await request('/auth/sesion');
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
