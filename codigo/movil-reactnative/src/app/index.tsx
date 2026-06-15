import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Animated,
  Easing,
  FlatList,
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
  loginWithToken,
  setApiUrl,
  buscarInvitadoOGrupo,
  acreditarInvitado,
  acreditarInvitadosMasivo,
  obtenerStatsReal,
  obtenerCeremoniaActiva
} from '@/services/api';
import { Colors, Spacing } from '@/constants/theme';

type ViewState = 'home' | 'scan' | 'result';

export default function IndexScreen() {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [permission, requestPermission] = useCameraPermissions();
  const [viewState, setViewState] = useState<ViewState>('home');
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [apiUrl, setApiUrlState] = useState('');
  
  // Ceremony state
  const [ceremonia, setCeremonia] = useState<any | null>(null);
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
    try {
      const currentUrl = await getApiUrl();
      setApiUrlState(currentUrl);

      const currentToken = await getToken();
      setTokenState(currentToken);

      const loggedUser = await getLoggedUser();
      setUser(loggedUser);

      // Cargar la ceremonia activa si hay URL configurada
      if (currentUrl) {
        setLoadingCeremonia(true);
        try {
          const cerData = await obtenerCeremoniaActiva();
          setCeremonia(cerData);
        } catch (err) {
          console.warn('Error fetching active ceremony:', err);
          setCeremonia(null);
        } finally {
          setLoadingCeremonia(false);
        }
      } else {
        setCeremonia(null);
      }

      if (currentToken && loggedUser) {
        fetchStats();
      }
    } catch (e) {
      console.error('Error loading session:', e);
    }
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
      const targetUrl = data.slice('sigic-config:'.length).trim();
      setLoadingScan(true);
      try {
        await setApiUrl(targetUrl);
        setApiUrlState(targetUrl);
        Alert.alert('Configuración exitosa', `API configurada a:\n${targetUrl}`);
        setViewState('home');
        loadSession();
      } catch (e) {
        Alert.alert('Error', 'No se pudo configurar la API.');
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
        loadSession();
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ---------------- STATE: HOME ---------------- */}
      {viewState === 'home' && (
        <View style={[styles.inner, { paddingTop: insets.top + Spacing.three }]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>Hola, Staff</Text>
              <View style={styles.statusRow}>
                <View style={[styles.dot, { backgroundColor: token ? '#10b981' : '#ef4444' }]} />
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                  {token ? `Servidor: ${apiUrl}` : 'Sin iniciar sesión de seguridad'}
                </Text>
              </View>
            </View>
            <Image 
              source={require('../../assets/images/logo-oficial.png')} 
              style={styles.headerLogo} 
              contentFit="contain" 
            />
          </View>

          {token ? (
            <>
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
                <Text style={[styles.welcomeTitle, { color: colors.text }]}>SiGIC Entry</Text>
                <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                  Control de Acceso & Acreditación
                </Text>
                
                {ceremonia ? (
                  <View style={[styles.ceremoniaCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                    <View style={styles.ceremoniaHeader}>
                      <Ionicons name="school" size={20} color="#0ea5e9" />
                      <Text style={[styles.ceremoniaTitle, { color: colors.text }]} numberOfLines={1}>
                        {ceremonia.nombre}
                      </Text>
                    </View>
                    <View style={styles.ceremoniaDetails}>
                      <View style={styles.ceremoniaDetailRow}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.ceremoniaDetailText, { color: colors.textSecondary }]}>
                          {new Date(ceremonia.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                      </View>
                      <View style={styles.ceremoniaDetailRow}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.ceremoniaDetailText, { color: colors.textSecondary }]}>
                          {new Date(ceremonia.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                        </Text>
                      </View>
                      <View style={styles.ceremoniaDetailRow}>
                        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.ceremoniaDetailText, { color: colors.textSecondary }]}>
                          {ceremonia.lugar || 'Sede Beltrán'}
                        </Text>
                      </View>
                      <View style={styles.ceremoniaDetailRow}>
                        <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.ceremoniaDetailText, { color: colors.textSecondary }]}>
                          Invitados: máx. {ceremonia.max_invitados} por egresado
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.welcomeCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
                    <Ionicons name="shield-checkmark" size={22} color="#0ea5e9" />
                    <Text style={[styles.welcomeCardBody, { color: colors.text }]}>
                      Iniciá sesión escaneando el QR de acceso o vinculando el servidor de la ceremonia.
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.welcomeActions}>
                <TouchableOpacity style={styles.welcomeButtonPrimary} onPress={triggerScanMode}>
                  <Ionicons name="qr-code" size={20} color="#ffffff" />
                  <Text style={styles.welcomeButtonPrimaryText}>Escanear QR de Acceso</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.welcomeButtonSecondary, { borderColor: colors.backgroundSelected }]} 
                  onPress={() => router.push('/explore')}
                >
                  <Ionicons name="settings" size={16} color={colors.textSecondary} />
                  <Text style={[styles.welcomeButtonSecondaryText, { color: colors.textSecondary }]}>
                    Configurar Manualmente
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
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
          >
            {/* Viewfinder overlay */}
            <View style={styles.overlayContainer}>
              <View style={styles.topOverlay}>
                <TouchableOpacity 
                  style={[styles.closeButton, { top: insets.top + Spacing.two }]} 
                  onPress={() => setViewState('home')}
                >
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.overlayTitle}>
                  {!token ? 'Escanear QR de Configuración / Acceso' : 'Acreditar Invitados & Egresados'}
                </Text>
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
          </CameraView>
        </View>
      )}

      {/* ---------------- STATE: RESULT ---------------- */}
      {viewState === 'result' && (
        <View style={[styles.inner, { paddingTop: insets.top + Spacing.three }]}>
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
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
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
  card: {
    padding: Spacing.three,
    borderRadius: 20,
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
    backgroundColor: '#0ea5e9',
    borderRadius: 24,
    paddingVertical: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0ea5e9',
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
    borderRadius: 65,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
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
    backgroundColor: '#0ea5e9',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    shadowColor: '#0ea5e9',
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
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: Spacing.four,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  middleRow: {
    flexDirection: 'row',
    height: 240,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#0ea5e9',
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
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  resultCard: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.02)',
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
    borderRadius: 16,
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
    borderColor: 'rgba(0,0,0,0.05)',
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

