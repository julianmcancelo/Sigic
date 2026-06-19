import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  ScrollView,
  Alert
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';
import {
  getApiUrl,
  getToken,
  getLoggedUser,
  clearSession,
  cerrarSesionDispositivo,
  loginWithToken,
  validarSesionActual,
  setApiUrl,
  esDireccionLocal,
  normalizarApiUrl,
  buscarInvitadoOGrupo,
  acreditarInvitado,
  acreditarInvitadosMasivo,
  obtenerStatsReal,
  obtenerCeremoniaActiva,
  obtenerCeremoniasAutorizadas,
  registrarActividadDispositivo
} from '@/servicios/api';
import { Colors, Spacing } from '@/constantes/tema';
import { useTemaApp } from '@/contextos/tema-app';

type ViewState = 'home' | 'scan' | 'result';
type SessionState = 'checking' | 'authenticated' | 'guest' | 'offline' | 'expired';

export default function IndexScreen() {
  const { esquema } = useTemaApp();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const colors = Colors[esquema];

  const [permission, requestPermission] = useCameraPermissions();
  const [viewState, setViewState] = useState<ViewState>('home');
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [apiUrl, setApiUrlState] = useState('');
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const [sessionMessage, setSessionMessage] = useState('Comprobando credenciales…');
  
  // Ceremony state
  const [ceremonia, setCeremonia] = useState<any | null>(null);
  const [ceremoniasAutorizadas, setCeremoniasAutorizadas] = useState<any[]>([]);
  const [loadingCeremonia, setLoadingCeremonia] = useState(false);

  // Stats
  const [stats, setStats] = useState<{ presentes: number; totalInvitados: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Scanning state
  const [scanned, setScanned] = useState(false);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Laser line animation
  const laserAnim = useRef(new Animated.Value(0)).current;

  // Load session & stats on mount or when tab focuses
  useEffect(() => {
    if (isFocused) {
      loadSession();
    }
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused || !token) return;
    const pulso = setInterval(() => {
      registrarActividadDispositivo().catch(() => {
        // El estado visual de conexión se gestiona en la siguiente validación completa.
      });
    }, 2 * 60 * 1000);
    return () => clearInterval(pulso);
  }, [isFocused, token]);

  // Start laser animation when scan opens
  useEffect(() => {
    if (viewState === 'scan') {
      laserAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      laserAnim.stopAnimation();
    }
  }, [viewState]);

  const loadSession = async () => {
    setSessionState('checking');
    setSessionMessage('Comprobando credenciales…');
    try {
      const currentUrl = await getApiUrl();
      setApiUrlState(currentUrl);

      const currentToken = await getToken();
      const loggedUser = await getLoggedUser();
      let sessionValidated = false;

      if (currentToken) {
        try {
          const session = await validarSesionActual();
          setTokenState(currentToken);
          setUser(session.usuario || loggedUser);
          setSessionState('authenticated');
          setSessionMessage('Sesión verificada y protegida');
          sessionValidated = true;
        } catch (error: any) {
          if (error?.codigo === 'SIN_CONEXION') {
            setTokenState(currentToken);
            setUser(loggedUser);
            setSessionState('offline');
            setSessionMessage('Sin conexión · sesión pendiente de validar');
          } else {
            await clearSession();
            setTokenState(null);
            setUser(null);
            setSessionState('expired');
            setSessionMessage('La sesión venció · iniciá sesión nuevamente');
          }
        }
      } else {
        setTokenState(null);
        setUser(null);
        setSessionState('guest');
        setSessionMessage('Sin sesión de portería');
      }

      // Los datos institucionales sólo se cargan después de validar la sesión.
      if (currentUrl && sessionValidated) {
        setLoadingCeremonia(true);
        try {
          const [cerData, autorizadas] = await Promise.all([
            obtenerCeremoniaActiva().catch(() => null),
            obtenerCeremoniasAutorizadas()
          ]);
          setCeremonia(cerData);
          setCeremoniasAutorizadas(autorizadas || []);
        } catch (err) {
          console.warn('Error fetching authorized ceremonies:', err);
          setCeremonia(null);
          setCeremoniasAutorizadas([]);
        } finally {
          setLoadingCeremonia(false);
        }
      } else {
        setCeremonia(null);
        setCeremoniasAutorizadas([]);
      }

      if (sessionValidated) {
        await fetchStats();
      }
    } catch (e) {
      console.error('Error loading session:', e);
      setSessionState('offline');
      setSessionMessage('No fue posible verificar la aplicación');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Querés desvincular este dispositivo de la cuenta de portería?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await cerrarSesionDispositivo();
            setTokenState(null);
            setUser(null);
            setStats(null);
            setCeremonia(null);
            setCeremoniasAutorizadas([]);
            setSessionState('guest');
            setSessionMessage('Sesión cerrada correctamente');
            setViewState('home');
          },
        },
      ]
    );
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await obtenerStatsReal();
      setStats({
        presentes: data.presentes || 0,
        totalInvitados: data.totalInvitados || 0
      });
    } catch (e) {
      console.warn('Error fetching stats:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loadingScan) return;
    setScanned(true);

    // 1. Check if it's a configuration QR
    if (data.startsWith('sigic-config:')) {
      const targetUrl = normalizarApiUrl(data.slice('sigic-config:'.length).trim());
      setLoadingScan(true);
      try {
        if (esDireccionLocal(targetUrl)) {
          throw new Error('El QR contiene localhost. Generá otro QR usando la IP de la computadora.');
        }
        await setApiUrl(targetUrl);
        setApiUrlState(targetUrl);
        Alert.alert('Configuración exitosa', `API configurada a:\n${targetUrl}`);
        setViewState('home');
        loadSession();
      } catch (e: any) {
        Alert.alert('No se pudo configurar', e.message || 'Revisá la dirección del servidor.');
      } finally {
        setLoadingScan(false);
        setScanned(false);
      }
      return;
    }

    // 2. Check if it's a login QR
    if (data.startsWith('sigic-login:')) {
      const tokenString = data.slice('sigic-login:'.length).trim();
      setLoadingScan(true);
      try {
        // Parse token if it's JSON
        let tokenToUse = tokenString;
        if (tokenString.startsWith('{')) {
          try {
            const parsed = JSON.parse(tokenString);
            tokenToUse = parsed.token || parsed.jwt || tokenString;
          } catch (_) {}
        }
        await loginWithToken(tokenToUse);
        Alert.alert('Acceso Exitoso', 'Sesión de seguridad iniciada.');
        setViewState('home');
        await loadSession();
      } catch (e: any) {
        Alert.alert('Error de Inicio', e.message || 'El código QR de acceso no es válido.');
      } finally {
        setLoadingScan(false);
        setScanned(false);
      }
      return;
    }

    // 3. Perform presentismo check-in
    setLoadingScan(true);
    setScanError(null);
    setScanResult(null);
    setViewState('result');

    try {
      const result = await buscarInvitadoOGrupo(data);
      setScanResult(result);
    } catch (e: any) {
      setScanError(e.message || 'Código QR no reconocido para esta ceremonia');
    } finally {
      setLoadingScan(false);
    }
  };

  const handleRegisterSingleIngress = async (id: string) => {
    setLoadingScan(true);
    try {
      await acreditarInvitado(id);
      
      // Update result details locally to show check-in success
      if (scanResult && scanResult.tipo === 'individual') {
        setScanResult({
          ...scanResult,
          datos: { ...scanResult.datos, presente: 1, fecha_presente: new Date().toISOString() }
        });
      } else if (scanResult && scanResult.tipo === 'grupo') {
        const updatedInvs = scanResult.invitados.map((inv: any) => 
          inv.id === id ? { ...inv, presente: 1, fecha_presente: new Date().toISOString() } : inv
        );
        setScanResult({ ...scanResult, invitados: updatedInvs });
      }
      
      fetchStats();
      Alert.alert('Ingreso Registrado', 'Acreditación realizada con éxito.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo registrar la acreditación.');
    } finally {
      setLoadingScan(false);
    }
  };

  const handleRegisterGroupIngress = async () => {
    if (!scanResult || scanResult.tipo !== 'grupo') return;
    
    const pendingIds = scanResult.invitados
      .filter((inv: any) => !inv.presente)
      .map((inv: any) => inv.id);

    if (pendingIds.length === 0) {
      Alert.alert('Info', 'Todos los invitados ya ingresaron.');
      return;
    }

    setLoadingScan(true);
    try {
      await acreditarInvitadosMasivo(pendingIds);
      
      // Update result details locally
      const updatedInvs = scanResult.invitados.map((inv: any) => 
        pendingIds.includes(inv.id) ? { ...inv, presente: 1, fecha_presente: new Date().toISOString() } : inv
      );
      setScanResult({ ...scanResult, invitados: updatedInvs });
      
      fetchStats();
      Alert.alert('Ingreso Masivo Exitoso', `Se acreditaron ${pendingIds.length} invitados.`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo realizar el ingreso grupal.');
    } finally {
      setLoadingScan(false);
    }
  };

  const triggerScanMode = async () => {
    if (!permission) return;
    if (!permission.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Permiso Requerido', 'Necesitamos acceso a la cámara para poder escanear credenciales QR.');
        return;
      }
    }
    setScanned(false);
    setViewState('scan');
  };

  // Rendering Helper
  const translateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220], // sliding range within the viewfinder box
  });

  const sesionActiva = sessionState === 'authenticated' && Boolean(token);
  const sessionColor = sessionState === 'authenticated'
    ? '#10b981'
    : sessionState === 'checking'
      ? '#0ea5e9'
      : sessionState === 'offline'
        ? '#f59e0b'
        : '#ef4444';

  if (sessionState === 'checking') {
    return (
      <View style={[styles.sessionCheckScreen, { paddingTop: insets.top + Spacing.four }]}>
        <View style={styles.sessionCheckDecorationOne} />
        <View style={styles.sessionCheckDecorationTwo} />
        <View style={styles.sessionCheckLogoCard}>
          <Image source={require('../../assets/images/logo-oficial.png')} style={styles.sessionCheckLogo} contentFit="contain" />
        </View>
        <Text style={styles.sessionCheckBrand}>SiGIC Accesos</Text>
        <Text style={styles.sessionCheckEyebrow}>Acceso institucional</Text>
        <ActivityIndicator size="small" color="#0ea5e9" style={{ marginTop: 28 }} />
        <Text style={styles.sessionCheckText}>Verificando sesión y servidor…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ---------------- STATE: HOME ---------------- */}
      {viewState === 'home' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.inner, { paddingTop: insets.top + Spacing.three }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>{sesionActiva ? `Hola, ${user?.nombre?.split(' ')[0] || 'Staff'}` : 'Acceso de portería'}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.dot, { backgroundColor: sessionColor }]} />
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                  {sessionMessage}
                </Text>
              </View>
            </View>
            <Image 
              source={require('../../assets/images/logo-oficial.png')} 
              style={styles.headerLogo} 
              contentFit="contain" 
            />
          </View>

          {sesionActiva ? (
            <>
              <View style={styles.identityCard}>
                <View style={styles.identityIcon}>
                  <Ionicons name="shield-checkmark" size={20} color="#047857" />
                </View>
                <View style={styles.identityText}>
                  <Text style={styles.identityLabel}>SESIÓN ACTIVA</Text>
                  <Text style={styles.identityName} numberOfLines={1}>{user?.nombre || user?.email || 'Personal de portería'}</Text>
                  <Text style={styles.identityMeta}>{user?.rol || 'PORTERÍA'} · {apiUrl.replace(/^https?:\/\//, '')}</Text>
                </View>
                <TouchableOpacity style={styles.identityAction} onPress={loadSession} accessibilityLabel="Volver a comprobar sesión">
                  <Ionicons name="refresh" size={17} color="#0056b3" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.identityAction, styles.identityLogout]} onPress={handleLogout} accessibilityLabel="Cerrar sesión">
                  <Ionicons name="log-out-outline" size={17} color="#dc2626" />
                </TouchableOpacity>
              </View>
              <View style={styles.authorizedSection}>
                <View style={styles.authorizedHeader}>
                  <View>
                    <Text style={styles.authorizedEyebrow}>ESPACIOS HABILITADOS</Text>
                    <Text style={[styles.authorizedTitle, { color: colors.text }]}>Tus ceremonias</Text>
                  </View>
                  <View style={styles.authorizedCount}>
                    <Text style={styles.authorizedCountText}>{ceremoniasAutorizadas.length}</Text>
                  </View>
                </View>
                {loadingCeremonia ? (
                  <ActivityIndicator size="small" color="#0056b3" style={{ marginVertical: 18 }} />
                ) : ceremoniasAutorizadas.length > 0 ? (
                  ceremoniasAutorizadas.map((item) => {
                    const activa = [true, 1, '1', 't', 'true'].includes(item.activa);
                    return (
                    <View key={item.id} style={[styles.authorizedCard, activa ? styles.authorizedCardActive : null]}>
                      <View style={[styles.authorizedIcon, activa ? styles.authorizedIconActive : null]}>
                        <Ionicons name="school-outline" size={18} color={activa ? '#ffffff' : '#0056b3'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.authorizedNameRow}>
                          <Text style={styles.authorizedName} numberOfLines={1}>{item.nombre}</Text>
                          <Text style={styles.enabledBadge}>HABILITADA</Text>
                          {activa ? <Text style={styles.activeBadge}>ACTIVA</Text> : null}
                        </View>
                        <Text style={styles.authorizedMeta} numberOfLines={1}>
                          {item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Fecha a confirmar'} · {item.lugar || 'Sede a confirmar'}
                        </Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                    </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyAuthorized}>
                    <Ionicons name="calendar-outline" size={22} color="#94a3b8" />
                    <Text style={styles.emptyAuthorizedText}>Tu cuenta todavía no tiene ceremonias asignadas.</Text>
                  </View>
                )}
              </View>
              {/* Active Ceremony Card (Compact) */}
              {ceremonia && (
                <View style={[styles.ceremoniaCardCompact, { backgroundColor: colors.backgroundElement }]}>
                  <View style={styles.ceremoniaCardCompactHeader}>
                    <Ionicons name="school" size={16} color="#0ea5e9" />
                    <Text style={[styles.ceremoniaCardCompactTitle, { color: colors.text }]} numberOfLines={1}>
                      {ceremonia.nombre}
                    </Text>
                  </View>
                  <Text style={[styles.ceremoniaCardCompactSub, { color: colors.textSecondary }]}>
                    {new Date(ceremonia.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} • {new Date(ceremonia.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs • {ceremonia.lugar || 'Sede Beltrán'}
                  </Text>
                </View>
              )}

              {/* Stats Card */}
              <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="people" size={20} color="#0ea5e9" />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Acreditados en Sala</Text>
                </View>

                {loadingStats ? (
                  <ActivityIndicator size="large" color="#0ea5e9" style={{ marginVertical: Spacing.two }} />
                ) : stats ? (
                  <View style={styles.statsContainer}>
                    <Text style={[styles.statsNumber, { color: colors.text }]}>
                      {stats.presentes} <Text style={[styles.statsTotal, { color: colors.textSecondary }]}>/ {stats.totalInvitados}</Text>
                    </Text>
                    <Text style={[styles.statsDetail, { color: colors.textSecondary }]}>
                      Invitados acreditados en la ceremonia activa.
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.buttonSecondary} onPress={fetchStats}>
                    <Text style={styles.buttonTextSecondary}>Cargar Estadísticas</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Large Camera Action Button */}
              <TouchableOpacity style={styles.scanButton} onPress={triggerScanMode}>
                <View style={styles.scanIconWrapper}>
                  <Ionicons name="camera" size={32} color="#ffffff" />
                </View>
                <Text style={styles.scanButtonText}>Abrir Escáner QR</Text>
                <Text style={styles.scanButtonSubText}>Apuntar al código QR de la credencial</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeLogoContainer}>
                <Image 
                  source={require('../../assets/images/logo-glow.png')} 
                  style={styles.welcomeLogoGlow} 
                />
                <View style={styles.welcomeLogoBg}>
                  <Image 
                    source={require('../../assets/images/logo-oficial.png')} 
                    style={styles.welcomeLogo} 
                    contentFit="contain" 
                  />
                </View>
              </View>
              
              <View style={styles.welcomeInfo}>
                <Text style={[styles.welcomeTitle, { color: colors.text }]}>SiGIC Accesos</Text>
                <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                  Control de Acceso & Acreditación
                </Text>
                <View style={[styles.sessionNotice, sessionState === 'offline' ? styles.sessionNoticeWarning : styles.sessionNoticeDanger]}>
                  <Ionicons name={sessionState === 'offline' ? 'cloud-offline-outline' : 'lock-closed-outline'} size={18} color={sessionState === 'offline' ? '#b45309' : '#b91c1c'} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sessionNoticeTitle, { color: sessionState === 'offline' ? '#92400e' : '#991b1b' }]}>
                      {sessionState === 'offline' ? 'Servidor sin conexión' : sessionState === 'expired' ? 'Sesión vencida' : 'Acceso no iniciado'}
                    </Text>
                    <Text style={[styles.sessionNoticeBody, { color: sessionState === 'offline' ? '#b45309' : '#b91c1c' }]}>{sessionMessage}</Text>
                  </View>
                  {sessionState === 'offline' && (
                    <TouchableOpacity onPress={loadSession} style={styles.noticeRetry}>
                      <Ionicons name="refresh" size={16} color="#92400e" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={[styles.welcomeCard, { backgroundColor: colors.backgroundElement, borderColor: '#dbeafe' }]}>
                  <Ionicons name="shield-checkmark" size={22} color="#0056b3" />
                  <Text style={[styles.welcomeCardBody, { color: colors.text }]}>
                    Iniciá sesión para consultar tus ceremonias autorizadas y comenzar a acreditar accesos.
                  </Text>
                </View>
              </View>

              <View style={styles.welcomeActions}>
                <TouchableOpacity style={styles.welcomeButtonPrimary} onPress={triggerScanMode}>
                  <Ionicons name="qr-code" size={20} color="#ffffff" />
                  <Text style={styles.welcomeButtonPrimaryText}>Escanear QR de Acceso</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.welcomeButtonSecondary, { borderColor: colors.backgroundSelected }]} 
                  onPress={() => router.push('/explorar')}
                >
                  <Ionicons name="settings" size={16} color={colors.textSecondary} />
                  <Text style={[styles.welcomeButtonSecondaryText, { color: colors.textSecondary }]}>
                    Configurar servidor e iniciar sesión
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ---------------- STATE: SCANNING ---------------- */}
      {viewState === 'scan' && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
            {/* La interfaz se dibuja como hermana absoluta: CameraView no admite hijos. */}
            <View style={[styles.overlayContainer, StyleSheet.absoluteFillObject]} pointerEvents="box-none">
              <View style={styles.topOverlay}>
                <TouchableOpacity 
                  style={[styles.closeButton, { top: insets.top + Spacing.two }]} 
                  onPress={() => setViewState('home')}
                >
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
                <View style={styles.scannerBrand}>
                  <View style={styles.scannerLogoCard}>
                    <Image source={require('../../assets/images/logo-oficial.png')} style={styles.scannerLogo} contentFit="contain" />
                  </View>
                  <View>
                    <Text style={styles.scannerEyebrow}>SiGIC ACCESOS</Text>
                    <Text style={styles.overlayTitle}>
                      {!sesionActiva ? 'Vincular dispositivo' : 'Acreditar credencial'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.middleRow}>
                <View style={styles.sideOverlay} />
                <View style={styles.viewfinder}>
                  {/* Laser line */}
                  <Animated.View style={[styles.laserLine, { transform: [{ translateY }] }]} />
                  
                  {/* Viewfinder corners */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <View style={styles.sideOverlay} />
              </View>

              <View style={styles.bottomOverlay}>
                <Text style={styles.overlayInstruction}>
                  Apunte la cámara al código QR
                </Text>
              </View>
            </View>
        </View>
      )}

      {/* ---------------- STATE: RESULT ---------------- */}
      {viewState === 'result' && (
        <View style={[styles.inner, { paddingTop: insets.top + Spacing.three }]}>
          <View style={styles.resultBrandHeader}>
            <View style={styles.resultBrandLogoCard}>
              <Image source={require('../../assets/images/logo-oficial.png')} style={styles.resultBrandLogo} contentFit="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultBrandEyebrow}>SiGIC ACCESOS</Text>
              <Text style={styles.resultBrandTitle}>Validación de credencial</Text>
            </View>
            <TouchableOpacity style={styles.resultHomeButton} onPress={() => setViewState('home')}>
              <Ionicons name="home-outline" size={19} color="#0056b3" />
            </TouchableOpacity>
          </View>
          {loadingScan ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Buscando en la base central...</Text>
            </View>
          ) : scanError ? (
            // Error Card
            <View style={styles.resultCard}>
              <View style={[styles.resultIconWrapper, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="alert-circle" size={40} color="#ef4444" />
              </View>
              <Text style={[styles.resultTitle, { color: '#ef4444' }]}>Escaneo Fallido</Text>
              <Text style={[styles.resultBody, { color: colors.text }]}>{scanError}</Text>
              
              <TouchableOpacity style={styles.buttonDanger} onPress={triggerScanMode}>
                <Text style={styles.buttonText}>Reintentar Escaneo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonSecondary} onPress={() => setViewState('home')}>
                <Text style={styles.buttonTextSecondary}>Volver a Inicio</Text>
              </TouchableOpacity>
            </View>
          ) : scanResult ? (
            <View style={styles.resultContainer}>
              {/* GUEST: INDIVIDUAL */}
              {scanResult.tipo === 'individual' && (
                <View style={styles.resultCard}>
                  {scanResult.datos.presente === 1 ? (
                    // DUPLICATED ENTRY
                    <>
                      <View style={[styles.resultIconWrapper, { backgroundColor: '#fee2e2' }]}>
                        <Ionicons name="warning" size={40} color="#ef4444" />
                      </View>
                      <Text style={[styles.resultTitle, { color: '#ef4444' }]}>Acceso Denegado</Text>
                      <Text style={[styles.resultBadge, { backgroundColor: '#fee2e2', color: '#ef4444' }]}>
                        CÓDIGO DUPLICADO
                      </Text>
                      
                      <View style={[styles.detailsContainer, { backgroundColor: colors.backgroundElement }]}>
                        <Text style={[styles.detailName, { color: colors.text }]}>{scanResult.datos.nombre}</Text>
                        <Text style={[styles.detailRow, { color: colors.textSecondary }]}>DNI: {scanResult.datos.dni}</Text>
                        <Text style={[styles.detailRow, { color: colors.textSecondary }]}>Egresado: {scanResult.datos.egresadoNombre}</Text>
                        <View style={styles.separator} />
                        <Text style={[styles.detailAlert, { color: '#ef4444', fontWeight: 'bold' }]}>
                          Ingresó previamente:
                        </Text>
                        <Text style={[styles.detailRow, { color: colors.text }]}>
                          {scanResult.datos.fecha_presente ? new Date(scanResult.datos.fecha_presente).toLocaleTimeString('es-AR') : 'Recientemente'}
                        </Text>
                      </View>
                    </>
                  ) : scanResult.datos.discapacidad === 1 ? (
                    // ACCESSIBILITY WARNING
                    <>
                      <View style={[styles.resultIconWrapper, { backgroundColor: '#dbeafe' }]}>
                        <Ionicons name="accessibility" size={40} color="#2563eb" />
                      </View>
                      <Text style={[styles.resultTitle, { color: '#2563eb' }]}>Atención Especial</Text>
                      <Text style={[styles.resultBadge, { backgroundColor: '#fef3c7', color: '#d97706' }]}>
                        ACCESIBILIDAD REQUERIDA
                      </Text>

                      <View style={[styles.detailsContainer, { backgroundColor: colors.backgroundElement }]}>
                        <Text style={[styles.detailName, { color: colors.text }]}>{scanResult.datos.nombre}</Text>
                        <Text style={[styles.detailRow, { color: colors.textSecondary }]}>Relación: {scanResult.datos.relacion}</Text>
                        <Text style={[styles.detailRow, { color: colors.textSecondary }]}>Egresado: {scanResult.datos.egresadoNombre}</Text>
                        <View style={styles.separator} />
                        <Text style={[styles.detailAlert, { color: '#2563eb', fontWeight: 'bold' }]}>
                          Indicación de Asistencia:
                        </Text>
                        <Text style={[styles.detailRow, { color: colors.text, fontSize: 11 }]}>
                          Persona con movilidad reducida. Acompañar a la rampa y ubicar en Asiento Especial.
                        </Text>
                      </View>

                      <TouchableOpacity 
                        style={styles.buttonPrimary} 
                        onPress={() => handleRegisterSingleIngress(scanResult.datos.id)}
                      >
                        <Text style={styles.buttonText}>Acreditar e Ingresar</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    // REGULAR GUEST CHECK-IN
                    <>
                      <View style={[styles.resultIconWrapper, { backgroundColor: '#d1fae5' }]}>
                        <Ionicons name="checkmark-circle" size={40} color="#10b981" />
                      </View>
                      <Text style={[styles.resultTitle, { color: '#10b981' }]}>Invitado Encontrado</Text>
                      
                      <View style={[styles.detailsContainer, { backgroundColor: colors.backgroundElement }]}>
                        <Text style={[styles.detailName, { color: colors.text }]}>{scanResult.datos.nombre}</Text>
                        <Text style={[styles.detailRow, { color: colors.textSecondary }]}>DNI: {scanResult.datos.dni}</Text>
                        <Text style={[styles.detailRow, { color: colors.textSecondary }]}>Relación: {scanResult.datos.relacion}</Text>
                        <Text style={[styles.detailRow, { color: colors.textSecondary }]}>Egresado: {scanResult.datos.egresadoNombre}</Text>
                      </View>

                      <TouchableOpacity 
                        style={styles.buttonPrimary} 
                        onPress={() => handleRegisterSingleIngress(scanResult.datos.id)}
                      >
                        <Text style={styles.buttonText}>Registrar Ingreso</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity style={styles.buttonSecondary} onPress={triggerScanMode}>
                    <Text style={styles.buttonTextSecondary}>Escanear Siguiente</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* EGRESADO & INVITADOS GROUP */}
              {scanResult.tipo === 'grupo' && (
                <View style={styles.groupContainer}>
                  {scanResult.egresado.estado === 'RECHAZADO' ? (
                    <View style={styles.resultCard}>
                      <View style={[styles.resultIconWrapper, { backgroundColor: '#fee2e2' }]}>
                        <Ionicons name="close-circle" size={40} color="#ef4444" />
                      </View>
                      <Text style={[styles.resultTitle, { color: '#ef4444' }]}>Acceso Denegado</Text>
                      <Text style={[styles.resultBadge, { backgroundColor: '#fee2e2', color: '#ef4444' }]}>
                        INASISTENCIA CONFIRMADA
                      </Text>
                      
                      <View style={[styles.detailsContainer, { backgroundColor: colors.backgroundElement }]}>
                        <Text style={[styles.detailName, { color: colors.text }]}>{scanResult.egresado.nombre}</Text>
                        <Text style={[styles.detailRow, { color: colors.textSecondary }]}>Legajo: {scanResult.egresado.legajo}</Text>
                        <View style={styles.separator} />
                        <Text style={[styles.detailRow, { color: colors.text, fontSize: 11 }]}>
                          El graduado informó que no asistirá a la colación. La invitación de todo su grupo está anulada.
                        </Text>
                      </View>

                      <TouchableOpacity style={styles.buttonSecondary} onPress={triggerScanMode}>
                        <Text style={styles.buttonTextSecondary}>Escanear Siguiente</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    // GROUP MANAGEMENT
                    <View style={styles.groupContent}>
                      {/* Egresado Header Details */}
                      <View style={[styles.groupHeaderCard, { backgroundColor: colors.backgroundElement }]}>
                        <Text style={[styles.groupEgresadoLabel, { color: colors.textSecondary }]}>GRADUADO</Text>
                        <Text style={[styles.groupEgresadoName, { color: colors.text }]}>{scanResult.egresado.nombre}</Text>
                        <View style={styles.egresadoGrid}>
                          <View>
                            <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Legajo</Text>
                            <Text style={[styles.gridValue, { color: colors.text }]}>{scanResult.egresado.legajo}</Text>
                          </View>
                          <View>
                            <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Carrera</Text>
                            <Text style={[styles.gridValue, { color: colors.text }]}>{scanResult.egresado.carrera || 'N/C'}</Text>
                          </View>
                          <View>
                            <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Asiento</Text>
                            <Text style={[styles.gridValue, { color: '#0ea5e9', fontWeight: 'bold' }]}>
                              {scanResult.egresado.asiento_id || 'Sin asiento'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Guest list */}
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Invitados en Grupo</Text>
                      <FlatList
                        data={scanResult.invitados}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <View style={[styles.guestRow, { borderBottomColor: colors.backgroundSelected }]}>
                            <View style={styles.guestInfo}>
                              <Text style={[styles.guestName, { color: colors.text }]}>{item.nombre}</Text>
                              <Text style={[styles.guestSub, { color: colors.textSecondary }]}>
                                DNI: {item.dni} • Relación: {item.relacion}
                              </Text>
                              {item.discapacidad === 1 && (
                                <View style={styles.accessibilityBadge}>
                                  <Ionicons name="accessibility" size={10} color="#b45309" />
                                  <Text style={styles.accessibilityBadgeText}>Accesibilidad</Text>
                                </View>
                              )}
                            </View>
                            
                            {item.presente === 1 ? (
                              <View style={styles.presentBadge}>
                                <Ionicons name="checkmark" size={12} color="#10b981" />
                                <Text style={styles.presentBadgeText}>Ingresó</Text>
                              </View>
                            ) : (
                              <TouchableOpacity 
                                style={styles.acreditarRowButton} 
                                onPress={() => handleRegisterSingleIngress(item.id)}
                              >
                                <Text style={styles.acreditarRowButtonText}>Ingresar</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                        style={styles.guestList}
                      />

                      {/* Bottom actions */}
                      <View style={styles.groupActionsContainer}>
                        <TouchableOpacity style={styles.buttonPrimary} onPress={handleRegisterGroupIngress}>
                          <Ionicons name="people" size={20} color="#fff" />
                          <Text style={styles.buttonText}>Acreditar Todos los Pendientes</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.buttonSecondary} onPress={triggerScanMode}>
                          <Text style={styles.buttonTextSecondary}>Terminar y Escanear Otro</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sessionCheckScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#f4f9ff',
  },
  sessionCheckDecorationOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 50,
    right: -130,
    top: -100,
    backgroundColor: '#0069ff',
    transform: [{ rotate: '18deg' }],
  },
  sessionCheckDecorationTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 46,
    left: -140,
    bottom: -100,
    backgroundColor: '#b9dcff',
    transform: [{ rotate: '32deg' }],
  },
  sessionCheckLogoCard: {
    width: 112,
    height: 112,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    shadowColor: '#0056b3',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 7,
  },
  sessionCheckLogo: {
    width: 78,
    height: 78,
  },
  sessionCheckBrand: {
    marginTop: 24,
    color: '#06194d',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  sessionCheckEyebrow: {
    marginTop: 4,
    color: '#087fbd',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  sessionCheckText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  headerText: {
    flex: 1,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 2,
  },
  infoLogo: {
    width: 140,
    height: 60,
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginBottom: Spacing.three,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    backgroundColor: '#ecfdf5',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  identityIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  identityLabel: {
    color: '#059669',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  identityName: {
    marginTop: 2,
    color: '#064e3b',
    fontSize: 13,
    fontWeight: '900',
  },
  identityMeta: {
    marginTop: 2,
    color: '#047857',
    fontSize: 9,
    fontWeight: '600',
  },
  identityAction: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#ffffff',
  },
  identityLogout: {
    borderColor: '#fecaca',
    backgroundColor: '#fff7f7',
  },
  authorizedSection: {
    marginBottom: Spacing.three,
    padding: Spacing.three,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
    shadowColor: '#0056b3',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  authorizedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorizedEyebrow: {
    color: '#087fbd',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  authorizedTitle: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: '900',
  },
  authorizedCount: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  authorizedCountText: {
    color: '#0056b3',
    fontSize: 12,
    fontWeight: '900',
  },
  authorizedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    padding: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  authorizedCardActive: {
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
  },
  authorizedIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },
  authorizedIconActive: {
    backgroundColor: '#0056b3',
  },
  authorizedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  authorizedName: {
    flexShrink: 1,
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '900',
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    color: '#047857',
    backgroundColor: '#d1fae5',
    fontSize: 7,
    fontWeight: '900',
  },
  enabledBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    color: '#0056b3',
    backgroundColor: '#dbeafe',
    fontSize: 7,
    fontWeight: '900',
  },
  authorizedMeta: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 9.5,
    fontWeight: '600',
  },
  emptyAuthorized: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
  },
  emptyAuthorizedText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  sessionNotice: {
    width: '100%',
    marginTop: Spacing.two,
    padding: 13,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sessionNoticeWarning: {
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  sessionNoticeDanger: {
    borderColor: '#fecaca',
    backgroundColor: '#fff7f7',
  },
  sessionNoticeTitle: {
    fontSize: 11,
    fontWeight: '900',
  },
  sessionNoticeBody: {
    marginTop: 2,
    fontSize: 9.5,
    fontWeight: '600',
  },
  noticeRetry: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
  },
  card: {
    padding: Spacing.three,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#dbeafe',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: Spacing.two,
    marginBottom: Spacing.four,
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
  statsContainer: {
    gap: 4,
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: '900',
  },
  statsTotal: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  statsDetail: {
    fontSize: 12,
  },
  scanButton: {
    backgroundColor: '#0056b3',
    borderRadius: 24,
    paddingVertical: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#60a5fa',
    shadowColor: '#0056b3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  scanIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanButtonSubText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.four,
    width: '100%',
  },
  welcomeLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    position: 'relative',
  },
  welcomeLogoGlow: {
    width: 220,
    height: 220,
    position: 'absolute',
    opacity: 0.12,
  },
  welcomeLogoBg: {
    width: 130,
    height: 130,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  welcomeLogo: {
    width: 90,
    height: 90,
  },
  welcomeInfo: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
  },
  welcomeSubtitle: {
    fontSize: 11.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  welcomeCard: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  welcomeCardBody: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  welcomeActions: {
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  welcomeButtonPrimary: {
    backgroundColor: '#0056b3',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    shadowColor: '#0056b3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  welcomeButtonPrimaryText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: 'bold',
  },
  welcomeButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  welcomeButtonSecondaryText: {
    fontSize: 13.5,
    fontWeight: 'bold',
  },
  buttonPrimary: {
    backgroundColor: '#0ea5e9',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    gap: 8,
    width: '100%',
    marginTop: Spacing.one,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#0ea5e9',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonTextSecondary: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topOverlay: {
    height: 132,
    backgroundColor: 'rgba(6,25,77,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: Spacing.four,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  scannerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scannerLogoCard: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  scannerLogo: {
    width: 32,
    height: 32,
  },
  scannerEyebrow: {
    marginBottom: 2,
    color: '#7DD3FC',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  middleRow: {
    flexDirection: 'row',
    height: 240,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,25,77,0.66)',
  },
  viewfinder: {
    width: 240,
    height: 240,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  laserLine: {
    position: 'absolute',
    left: '5%',
    right: '5%',
    height: 2,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#60A5FA',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomOverlay: {
    height: 120,
    backgroundColor: 'rgba(6,25,77,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayInstruction: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  resultBrandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: Spacing.three,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  resultBrandLogoCard: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
  },
  resultBrandLogo: {
    width: 34,
    height: 34,
  },
  resultBrandEyebrow: {
    color: '#087FBD',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  resultBrandTitle: {
    marginTop: 2,
    color: '#06194D',
    fontSize: 14,
    fontWeight: '900',
  },
  resultHomeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
  },
  resultCard: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0056B3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  resultIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: Spacing.one,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  resultBody: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  resultBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 8,
    letterSpacing: 0.5,
  },
  detailsContainer: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    marginVertical: Spacing.one,
  },
  detailName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailRow: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailAlert: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: Spacing.half,
  },
  groupContainer: {
    flex: 1,
  },
  groupContent: {
    flex: 1,
    gap: Spacing.two,
  },
  groupHeaderCard: {
    padding: Spacing.three,
    borderRadius: 20,
    gap: Spacing.half,
  },
  groupEgresadoLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  groupEgresadoName: {
    fontSize: 18,
    fontWeight: '900',
  },
  egresadoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
    paddingTop: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  gridLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  gridValue: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: Spacing.one,
  },
  guestList: {
    flex: 1,
  },
  guestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  guestInfo: {
    flex: 1,
    gap: 2,
  },
  guestName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  guestSub: {
    fontSize: 11,
  },
  acreditarRowButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acreditarRowButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  presentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  presentBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  accessibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  accessibilityBadgeText: {
    color: '#b45309',
    fontSize: 9,
    fontWeight: 'bold',
  },
  groupActionsContainer: {
    gap: Spacing.half,
    marginTop: Spacing.one,
  },
  ceremoniaCard: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: 20,
    marginTop: Spacing.two,
    borderWidth: 1,
    gap: Spacing.two,
  },
  ceremoniaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: Spacing.one,
  },
  ceremoniaTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  ceremoniaDetails: {
    gap: Spacing.one,
  },
  ceremoniaDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ceremoniaDetailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ceremoniaCardCompact: {
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginBottom: Spacing.three,
    gap: 4,
  },
  ceremoniaCardCompactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ceremoniaCardCompactTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  ceremoniaCardCompactSub: {
    fontSize: 11,
    marginLeft: 22,
  },
});
