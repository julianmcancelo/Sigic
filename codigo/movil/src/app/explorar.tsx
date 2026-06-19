import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getApiUrl,
  setApiUrl,
  getToken,
  clearSession,
  cerrarSesionDispositivo,
  loginWithCredentials,
  validarSesionActual,
  testConnection,
  esDireccionLocal,
  normalizarApiUrl
} from '@/servicios/api';
import { Colors, Spacing } from '@/constantes/tema';
import { ModoTema, useTemaApp } from '@/contextos/tema-app';
import { useIsFocused } from '@react-navigation/native';

export default function ExploreScreen() {
  const { modo, esquema, cambiarModo } = useTemaApp();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const colors = Colors[esquema];

  const [apiUrl, setApiUrlState] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    async function loadConfig() {
      const url = await getApiUrl();
      setApiUrlState(url);
      
      const token = await getToken();
      if (token) {
        try {
          const session = await validarSesionActual();
          setUser(session.usuario);
        } catch {
          setUser(null);
        }
      }
      
      // Test the connection
      const isOk = await testConnection(url);
      setConnected(isOk);
    }
    loadConfig();
  }, [isFocused]);

  const handleTestConnection = async () => {
    if (!apiUrl) return;
    if (esDireccionLocal(apiUrl)) {
      setConnected(false);
      Alert.alert(
        'Dirección no válida para el celular',
        'localhost apunta a este teléfono. Ingresá la IP de la computadora, por ejemplo: http://192.168.1.25:3000/api'
      );
      return;
    }
    setTestingConnection(true);
    setConnected(null);
    try {
      const isOk = await testConnection(apiUrl);
      setConnected(isOk);
      if (isOk) {
        const normalizada = normalizarApiUrl(apiUrl);
        await setApiUrl(normalizada);
        setApiUrlState(normalizada);
        Alert.alert('Servidor conectado', 'La dirección fue verificada y guardada correctamente.');
      } else {
        Alert.alert('Error', 'No se pudo conectar con la API en la dirección ingresada.');
      }
    } catch (e) {
      setConnected(false);
      Alert.alert('Error', 'Ocurrió un error al intentar conectarse.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Por favor, completá tu email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      if (esDireccionLocal(apiUrl)) {
        throw new Error('En el teléfono no podés usar localhost. Configurá la IP de la computadora antes de iniciar sesión.');
      }
      const servidorDisponible = await testConnection(apiUrl);
      if (!servidorDisponible) {
        throw new Error('No se pudo verificar el servidor. Revisá la dirección y que ambos dispositivos estén en la misma red.');
      }
      await setApiUrl(apiUrl);
      await loginWithCredentials(email, password);
      const session = await validarSesionActual();
      setUser(session.usuario);
      setPassword('');
      Alert.alert('Acceso confirmado', 'La sesión fue verificada y el dispositivo quedó habilitado.');
    } catch (e: any) {
      Alert.alert('Error de Login', e.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar tu sesión de seguridad?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Salir',
          onPress: async () => {
            await cerrarSesionDispositivo();
            setUser(null);
            setEmail('');
            setPassword('');
          }
        }
      ]
    );
  };

  const handleUnlockServer = () => {
    Alert.alert(
      'Desvincular servidor',
      'Para cambiar la dirección se cerrará la sesión actual. ¿Querés continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            await cerrarSesionDispositivo();
            setUser(null);
            setConnected(null);
          },
        },
      ]
    );
  };

  const opcionesTema: { valor: ModoTema; etiqueta: string; icono: keyof typeof Ionicons.glyphMap }[] = [
    { valor: 'light', etiqueta: 'Claro', icono: 'sunny-outline' },
    { valor: 'dark', etiqueta: 'Oscuro', icono: 'moon-outline' },
    { valor: 'system', etiqueta: 'Automático', icono: 'phone-portrait-outline' },
  ];

  return (
    <ScrollView 
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.three }]}
    >
      <View style={styles.header}>
        <View style={styles.headerDecorationOne} />
        <View style={styles.headerDecorationTwo} />
        <View style={styles.headerBrandRow}>
          <View style={styles.headerLogoCard}>
            <Image source={require('../../assets/images/logo-oficial.png')} style={styles.headerLogo} contentFit="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>SiGIC ACCESOS</Text>
            <Text style={styles.title}>Configuración segura</Text>
            <Text style={styles.subtitle}>Servidor, sesión y permisos del dispositivo</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="color-palette-outline" size={20} color="#0056b3" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Apariencia</Text>
            <Text style={styles.cardDescription}>Elegí cómo querés visualizar SiGIC Accesos.</Text>
          </View>
        </View>
        <View style={styles.themeOptions}>
          {opcionesTema.map((opcion) => {
            const seleccionada = modo === opcion.valor;
            return (
              <TouchableOpacity
                key={opcion.valor}
                style={[styles.themeOption, seleccionada && styles.themeOptionActive]}
                onPress={() => cambiarModo(opcion.valor)}
              >
                <Ionicons name={opcion.icono} size={19} color={seleccionada ? '#ffffff' : colors.textSecondary} />
                <Text style={[styles.themeOptionText, { color: seleccionada ? '#ffffff' : colors.textSecondary }]}>{opcion.etiqueta}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SECCIÓN 1: API CONNECTION */}
      <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="link" size={20} color="#0ea5e9" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Servidor institucional</Text>
            <Text style={styles.cardDescription}>Ingresá la dirección entregada por la institución.</Text>
          </View>
        </View>

        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.backgroundSelected }]}
          placeholder="https://servidor.institucion.edu/api"
          placeholderTextColor={colors.textSecondary}
          value={apiUrl}
          onChangeText={setApiUrlState}
          editable={connected !== true}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {esDireccionLocal(apiUrl) && (
          <View style={styles.localWarning}>
            <Ionicons name="warning-outline" size={17} color="#b45309" />
            <Text style={styles.localWarningText}>En un celular, reemplazá localhost por la IP de la computadora donde funciona SiGIC.</Text>
          </View>
        )}

        <View style={styles.connectionStatusContainer}>
          {testingConnection ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#0ea5e9" />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>Probando enlace...</Text>
            </View>
          ) : connected === true ? (
            <View style={styles.statusRow}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={[styles.statusText, { color: '#10b981' }]}>Servidor verificado y disponible</Text>
            </View>
          ) : connected === false ? (
            <View style={styles.statusRow}>
              <Ionicons name="close-circle" size={16} color="#ef4444" />
              <Text style={[styles.statusText, { color: '#ef4444' }]}>No se pudo acceder al servidor</Text>
            </View>
          ) : (
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>Enlace sin verificar</Text>
          )}
        </View>

        {connected === true ? (
          <View style={styles.serverLockedActions}>
            <View style={styles.serverLockedBadge}>
              <Ionicons name="lock-closed" size={15} color="#047857" />
              <Text style={styles.serverLockedText}>Dirección protegida</Text>
            </View>
            <TouchableOpacity onPress={handleUnlockServer} style={styles.serverUnlockButton}>
              <Text style={styles.serverUnlockText}>Desvincular</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={handleTestConnection}
            disabled={testingConnection}
          >
            <Text style={styles.buttonTextSecondary}>Probar y guardar servidor</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SECCIÓN 2: AUTHENTICATION */}
      {user ? (
        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#10b981" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Dispositivo autorizado</Text>
              <Text style={styles.cardDescription}>La identidad fue corroborada con el servidor.</Text>
            </View>
          </View>
          
          <View style={styles.userInfoContainer}>
            <View style={styles.userRow}>
              <Text style={[styles.userLabel, { color: colors.textSecondary }]}>Nombre:</Text>
              <Text style={[styles.userValue, { color: colors.text }]}>{user.nombre}</Text>
            </View>
            <View style={styles.userRow}>
              <Text style={[styles.userLabel, { color: colors.textSecondary }]}>Usuario:</Text>
              <Text style={[styles.userValue, { color: colors.text }]}>{user.email}</Text>
            </View>
            <View style={styles.userRow}>
              <Text style={[styles.userLabel, { color: colors.textSecondary }]}>Rol asignado:</Text>
              <Text style={[styles.userValue, { color: '#10b981', fontWeight: 'bold' }]}>{user.rol}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.buttonDanger} onPress={handleLogout}>
            <Text style={styles.buttonDangerText}>Desvincular dispositivo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed" size={20} color="#0ea5e9" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Iniciar sesión</Text>
              <Text style={styles.cardDescription}>Sólo personal autorizado para acreditación.</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Correo Electrónico</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.backgroundSelected }]}
              placeholder="seguridad@sigic.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Contraseña</Text>
            <View style={[styles.passwordField, { borderColor: colors.backgroundSelected }]}>
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword((value) => !value)} style={styles.passwordToggle}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.buttonPrimary} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verificar e iniciar sesión</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* SECCIÓN 3: QR SHORTCUTS INFO */}
      <View style={[styles.cardInfo, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}>
        <View style={styles.infoTitleRow}>
          <Ionicons name="qr-code" size={18} color="#0284c7" />
          <Text style={styles.infoTitle}>Atajos QR de Portería</Text>
        </View>
        <Text style={styles.infoBody}>
          También podés usar la cámara principal para configurar el dispositivo sin escribir datos:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            • Escanear un QR que comience con <Text style={{ fontWeight: 'bold' }}>sigic-config:[URL]</Text> enlazará el servidor automáticamente.
          </Text>
          <Text style={styles.bulletItem}>
            • Escanear un QR que comience con <Text style={{ fontWeight: 'bold' }}>sigic-login:[TOKEN]</Text> iniciará tu sesión de personal.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: Spacing.two,
    padding: Spacing.three,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  headerDecorationOne: {
    position: 'absolute',
    width: 130,
    height: 130,
    right: -55,
    top: -65,
    borderRadius: 28,
    backgroundColor: '#0069ff',
    transform: [{ rotate: '18deg' }],
  },
  headerDecorationTwo: {
    position: 'absolute',
    width: 100,
    height: 100,
    right: -55,
    top: 18,
    borderRadius: 24,
    backgroundColor: '#b9dcff',
    transform: [{ rotate: '32deg' }],
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  headerLogoCard: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    shadowColor: '#0056b3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.11,
    shadowRadius: 12,
    elevation: 3,
  },
  headerLogo: {
    width: 43,
    height: 43,
  },
  headerEyebrow: {
    color: '#087fbd',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  title: {
    color: '#06194d',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#dbeafe',
    shadowColor: '#0056b3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  cardDescription: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#f8fafc',
  },
  themeOptionActive: {
    borderColor: '#0056b3',
    backgroundColor: '#0056b3',
    shadowColor: '#0056b3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  themeOptionText: {
    fontSize: 9,
    fontWeight: '800',
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    backgroundColor: '#f8fafc',
  },
  passwordField: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  passwordToggle: {
    width: 46,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionStatusContainer: {
    marginVertical: Spacing.half,
  },
  localWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 11,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  localWarningText: {
    flex: 1,
    color: '#92400e',
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '600',
  },
  serverLockedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  serverLockedBadge: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    backgroundColor: '#ecfdf5',
  },
  serverLockedText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '900',
  },
  serverUnlockButton: {
    height: 42,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff7f7',
  },
  serverUnlockText: {
    color: '#be123c',
    fontSize: 10,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonPrimary: {
    backgroundColor: '#0056b3',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  buttonSecondary: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.half,
  },
  buttonDanger: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonDangerText: {
    color: '#be123c',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userInfoContainer: {
    padding: Spacing.two,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    backgroundColor: '#ecfdf5',
    gap: Spacing.one,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  userValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardInfo: {
    padding: Spacing.three,
    borderRadius: 22,
    borderWidth: 1,
    gap: Spacing.two,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  infoBody: {
    fontSize: 12,
    color: '#0c4a6e',
    lineHeight: 18,
  },
  bulletList: {
    gap: 6,
    paddingLeft: Spacing.half,
  },
  bulletItem: {
    fontSize: 11.5,
    color: '#075985',
    lineHeight: 16,
  },
});
