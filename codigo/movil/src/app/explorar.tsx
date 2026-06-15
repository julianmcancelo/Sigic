import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getApiUrl,
  setApiUrl,
  getToken,
  clearSession,
  getLoggedUser,
  loginWithCredentials,
  testConnection
} from '@/services/api';
import { Colors, Spacing } from '@/constants/theme';

export default function ExploreScreen() {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [apiUrl, setApiUrlState] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    async function loadConfig() {
      const url = await getApiUrl();
      setApiUrlState(url);
      
      const loggedUser = await getLoggedUser();
      if (loggedUser) {
        setUser(loggedUser);
      }
      
      // Test the connection
      const isOk = await testConnection(url);
      setConnected(isOk);
    }
    loadConfig();
  }, []);

  const handleTestConnection = async () => {
    if (!apiUrl) return;
    setTestingConnection(true);
    setConnected(null);
    try {
      const isOk = await testConnection(apiUrl);
      setConnected(isOk);
      if (isOk) {
        await setApiUrl(apiUrl);
        Alert.alert('Éxito', 'Conexión con la API establecida correctamente.');
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
      await loginWithCredentials(email, password);
      const loggedUser = await getLoggedUser();
      setUser(loggedUser);
      Alert.alert('Bienvenido', `Sesión iniciada correctamente.`);
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
            await clearSession();
            setUser(null);
            setEmail('');
            setPassword('');
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.three }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Configuración</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enlace de App con Plataforma SiGIC
        </Text>
      </View>

      {/* SECCIÓN 1: API CONNECTION */}
      <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="link" size={20} color="#0ea5e9" />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Dirección de la API</Text>
        </View>

        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.backgroundSelected }]}
          placeholder="http://192.168.1.100:3001/api"
          placeholderTextColor={colors.textSecondary}
          value={apiUrl}
          onChangeText={setApiUrlState}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.connectionStatusContainer}>
          {testingConnection ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#0ea5e9" />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>Probando enlace...</Text>
            </View>
          ) : connected === true ? (
            <View style={styles.statusRow}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={[styles.statusText, { color: '#10b981' }]}>Enlace Activo (Online)</Text>
            </View>
          ) : connected === false ? (
            <View style={styles.statusRow}>
              <Ionicons name="close-circle" size={16} color="#ef4444" />
              <Text style={[styles.statusText, { color: '#ef4444' }]}>Sin Conexión (Offline)</Text>
            </View>
          ) : (
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>Enlace sin verificar</Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.buttonSecondary} 
          onPress={handleTestConnection}
          disabled={testingConnection}
        >
          <Text style={styles.buttonTextSecondary}>Verificar Conexión</Text>
        </TouchableOpacity>
      </View>

      {/* SECCIÓN 2: AUTHENTICATION */}
      {user ? (
        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#10b981" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Sesión de Seguridad</Text>
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
            <Text style={styles.buttonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed" size={20} color="#0ea5e9" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Ingreso Personal de Seguridad</Text>
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
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.backgroundSelected }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity style={styles.buttonPrimary} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
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
          Podés usar la cámara principal de la pestaña **Escanear** para configurar y loguearte al instante:
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
    gap: Spacing.four,
  },
  header: {
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
    fontWeight: 'bold',
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
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  connectionStatusContainer: {
    marginVertical: Spacing.half,
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
    backgroundColor: '#0ea5e9',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#0ea5e9',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.half,
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
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
  userInfoContainer: {
    padding: Spacing.two,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
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
    borderRadius: 20,
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
