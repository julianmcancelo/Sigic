import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  TextInput, Alert, ActivityIndicator, SafeAreaView,
  StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

// IP de desarrollo - CAMBIAR por la IP local de tu PC para probar en el celu
const API_BASE = 'http://192.168.1.100:3001/api'; 

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');
  const [cargando, setCargando] = useState(false);
  const [modo, setModo] = useState('qr'); // 'qr' o 'manual'

  if (!permission) return <View className="flex-1 bg-black" />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.texto}>Necesitamos acceso a la cámara</Text>
        <TouchableOpacity style={styles.btnPrincipal} onClick={requestPermission}>
          <Text style={styles.btnTexto}>Otorgar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const validarAcceso = async (codigo) => {
    if (cargando) return;
    setCargando(true);
    try {
      const res = await fetch(`${API_BASE}/invitados/buscar/${codigo}`);
      const data = await res.json();

      if (res.ok) {
        if (data.tipo === 'individual') {
          confirmarIngreso(data.datos.id, data.datos.nombre);
        } else {
          Alert.alert('Grupo Detectado', `Egresado: ${data.egresado.nombre}\n¿Validar a todos sus invitados?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Validar Todo', onPress: () => marcarPresenteMasivo(data.invitados.map(i => i.id)) }
          ]);
        }
      } else {
        Alert.alert('Error', data.error || 'Código no válido');
      }
    } catch (err) {
      Alert.alert('Error de Conexión', 'No se pudo conectar con el servidor SiGIC');
    } finally {
      setCargando(false);
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const confirmarIngreso = async (id, nombre) => {
    try {
      const res = await fetch(`${API_BASE}/invitados/${id}/presente`, { method: 'PUT' });
      if (res.ok) {
        Alert.alert('¡Acceso Permitido!', `Bienvenido/a ${nombre}`);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo registrar el ingreso');
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    validarAcceso(data);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER TÉCNICO */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>PORTERÍA SiGIC</Text>
          <Text style={styles.headerTitle}>Control de Acceso</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>ONLINE</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {modo === 'qr' ? (
          <View style={styles.scannerContainer}>
            <CameraView
              style={styles.scanner}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            >
              <View style={styles.overlay}>
                <View style={styles.unfocusedContainer}></View>
                <View style={styles.focusedContainer}>
                  <View style={styles.cornerTopLeft} />
                  <View style={styles.cornerTopRight} />
                  <View style={styles.cornerBottomLeft} />
                  <View style={styles.cornerBottomRight} />
                </View>
                <View style={styles.unfocusedContainer}></View>
              </View>
            </CameraView>
            <Text style={styles.instruccion}>Apunte al código QR del invitado</Text>
          </View>
        ) : (
          <View style={styles.manualContainer}>
            <Ionicons name="keypad" size={60} color="#0EA5E9" style={{ marginBottom: 20 }} />
            <Text style={styles.manualTitle}>Ingreso Alfanumérico</Text>
            <Text style={styles.manualSub}>Escriba el código o DNI del invitado</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Ej: ABC-123 o DNI"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              value={codigoManual}
              onChangeText={setCodigoManual}
            />

            <TouchableOpacity 
              style={styles.btnPrincipal}
              onPress={() => validarAcceso(codigoManual)}
            >
              <Text style={styles.btnTexto}>VERIFICAR CÓDIGO</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* BOTONERA INFERIOR */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.tab, modo === 'qr' && styles.tabActive]} 
          onPress={() => setModo('qr')}
        >
          <Ionicons name="qr-code" size={24} color={modo === 'qr' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, modo === 'qr' && styles.tabTextActive]}>QR</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, modo === 'manual' && styles.tabActive]} 
          onPress={() => setModo('manual')}
        >
          <Ionicons name="create" size={24} color={modo === 'manual' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, modo === 'manual' && styles.tabTextActive]}>MANUAL</Text>
        </TouchableOpacity>
      </View>

      {cargando && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { 
    padding: 25, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  headerSub: { color: '#0EA5E9', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1e293b', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 8 },
  statusText: { color: '#10b981', fontSize: 10, fontWeight: '900' },
  
  scannerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanner: { width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)' },
  unfocusedContainer: { flex: 1 },
  focusedContainer: { width: 250, height: 250, alignSelf: 'center', position: 'relative' },
  
  // Esquinas del scanner
  cornerTopLeft: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderLeftWidth: 4, borderTopWidth: 4, borderColor: '#0EA5E9' },
  cornerTopRight: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderRightWidth: 4, borderTopWidth: 4, borderColor: '#0EA5E9' },
  cornerBottomLeft: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderLeftWidth: 4, borderBottomWidth: 4, borderColor: '#0EA5E9' },
  cornerBottomRight: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderRightWidth: 4, borderBottomWidth: 4, borderColor: '#0EA5E9' },

  instruccion: { position: 'absolute', bottom: 40, color: '#fff', fontSize: 12, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 10 },

  manualContainer: { flex: 1, padding: 40, justifyContent: 'center', alignItems: 'center' },
  manualTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 5 },
  manualSub: { color: '#64748b', fontSize: 14, fontWeight: '600', marginBottom: 30 },
  input: { 
    width: '100%', 
    backgroundColor: '#1e293b', 
    borderRadius: 20, 
    padding: 20, 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#334155'
  },

  btnPrincipal: { 
    backgroundColor: '#0EA5E9', 
    width: '100%', 
    padding: 20, 
    borderRadius: 20, 
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20
  },
  btnTexto: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  footer: { 
    flexDirection: 'row', 
    height: 90, 
    backgroundColor: '#1e293b', 
    borderTopWidth: 1, 
    borderTopColor: '#334155',
    paddingBottom: 20
  },
  tab: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabActive: { backgroundColor: '#0f172a' },
  tabText: { color: '#64748b', fontSize: 10, fontWeight: '900', marginTop: 5 },
  tabTextActive: { color: '#fff' },

  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }
});
