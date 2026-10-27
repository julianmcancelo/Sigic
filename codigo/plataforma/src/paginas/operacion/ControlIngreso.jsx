'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Camera, CameraOff, QrCode, Search, CheckCircle2, AlertTriangle, XCircle, 
  Users, GraduationCap, Armchair, Clock, UserCheck, RefreshCw, Volume2, 
  VolumeX, ShieldCheck, ArrowRight, Sparkles, Check, Accessibility, CalendarDays,
  Smartphone, Download, Radio, Shield, Copy, CheckCheck, Globe, Wifi, KeyRound,
  ExternalLink, Layers, Laptop, Activity, Zap, Play, Trash2, Server, HelpCircle,
  CheckCircle, Signal, BatteryCharging, Info, Sliders, ChevronDown, Sun, Moon
} from 'lucide-react'
import { 
  buscarAcreditacion, 
  acreditarEgresado, 
  acreditarInvitado, 
  acreditarGrupo, 
  obtenerCeremoniaActiva,
  obtenerCeremonias,
  activarCeremonia,
  obtenerAsistenciaOperativa,
  descargarManifiestoAcreditacion,
  sincronizarLoteAcreditacion,
  obtenerDispositivosMoviles,
  desvincularDispositivoAdmin,
  obtenerRedLocal
} from '../../servicios/api'
import { 
  guardarManifiestoOffline, 
  obtenerManifiestoOffline, 
  buscarEnManifiestoOffline, 
  encolarAcreditacionOffline, 
  obtenerColaAcreditacionOffline, 
  limpiarColaAcreditacionOffline 
} from '../../lib/offline-sync'
import { useSincronizacion, emitirCambioSync } from '../../lib/sync'
import { QRCodeSVG } from 'qrcode.react'
import { ModalResumenDemostracion } from '../../componentes/ModalResumenDemostracion'

// Helper para reproducir sonidos con Web Audio API sin dependencias de audio externas
function reproducirSonido(tipo = 'exito') {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    if (tipo === 'exito') {
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5

      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(880, ctx.currentTime)
      osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15) // D6

      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start()
      osc2.start()
      osc1.stop(ctx.currentTime + 0.3)
      osc2.stop(ctx.currentTime + 0.3)
    } else if (tipo === 'advertencia') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.25)

      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)

      osc1.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    } else {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'square'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3)

      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    }
  } catch (err) {
    console.warn('Audio Context no permitido o bloqueado:', err)
  }
}

export function ControlIngreso({ usuario, onVolver, onCerrarSesion, sinHeader }) {
  // Estado de la búsqueda y resultado
  const [busquedaManual, setBusquedaManual] = useState('')
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [mensajeAccion, setMensajeAccion] = useState(null)
  const [procesandoAcreditacion, setProcesandoAcreditacion] = useState(false)

  // Estado de conexión y modo offline
  const [estaOnline, setEstaOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [pendientesOffline, setPendientesOffline] = useState(() => obtenerColaAcreditacionOffline().length)
  const [sincronizandoLote, setSincronizandoLote] = useState(false)
  const [manifiestoDescargado, setManifiestoDescargado] = useState(() => Boolean(obtenerManifiestoOffline()))

  // Estado de la cámara y hardware
  const [camaraActiva, setCamaraActiva] = useState(false)
  const [camarasDisponibles, setCamarasDisponibles] = useState([])
  const [camaraSeleccionadaId, setCamaraSeleccionadaId] = useState('')
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true)
  const [ultimoEscaneoTimestamp, setUltimoEscaneoTimestamp] = useState(0)

  // Métricas y estadísticas
  const [ceremonia, setCeremonia] = useState(null)
  const [ceremoniasDisponibles, setCeremoniasDisponibles] = useState([])
  const [cambiandoCeremonia, setCambiandoCeremonia] = useState(false)
  const [stats, setStats] = useState(null)
  const [historialIngresos, setHistorialIngresos] = useState([])
  const [mostrarResumenFinal, setMostrarResumenFinal] = useState(false)

  const [modalidad, setModalidad] = useState('flutter') // 'flutter' | 'respaldo_web' | 'monitor'
  const [dispositivosMoviles, setDispositivosMoviles] = useState([])
  const [cargandoDispositivos, setCargandoDispositivos] = useState(false)
  const [desvinculandoId, setDesvinculandoId] = useState(null)
  const [copiadoApk, setCopiadoApk] = useState(false)
  const [copiadoServidor, setCopiadoServidor] = useState(false)
  const [copiadoComando, setCopiadoComando] = useState(false)
  const [editandoUrlServidor, setEditandoUrlServidor] = useState(false)
  const [redLocalInfo, setRedLocalInfo] = useState(null)
  const [simulandoEscaneo, setSimulandoEscaneo] = useState(false)
  const [pingStatus, setPingStatus] = useState('idle') // 'idle' | 'testing' | 'ok' | 'error'
  const [pingLatencia, setPingLatencia] = useState(null)

  const URL_GITHUB_RELEASES = 'https://github.com/julianmcancelo/Sigic/releases/latest'
  const URL_APK_OFICIAL = 'https://github.com/julianmcancelo/Sigic/releases/latest/download/SIGIC-Porteria-Release-v1.0.9.apk'

  const [urlApk, setUrlApk] = useState(() => URL_APK_OFICIAL)
  const [urlServidor, setUrlServidor] = useState(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api`
    }
    return 'https://app.sigic.com.ar/api'
  })

  const html5QrCodeRef = useRef(null)
  const inputBusquedaRef = useRef(null)
  const bufferTecladoRef = useRef('')
  const ultimoKeyTimeRef = useRef(0)

  // Cargar información de red local (IPs del servidor)
  async function cargarRedLocal() {
    try {
      const data = await obtenerRedLocal()
      if (data && data.ok) {
        setRedLocalInfo(data)
        // Si el cliente está en localhost y el servidor detectó una IP de red local sugerida, auto-sugerir
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          if (data.ipRecomendada && data.ipRecomendada !== '127.0.0.1') {
            const puerto = window.location.port || data.puerto || '3000'
            const sugerida = `http://${data.ipRecomendada}:${puerto}/api`
            setUrlServidor(sugerida)
          }
        }
      }
    } catch (e) {
      console.warn('No se pudo detectar red local:', e)
    }
  }

  async function cargarDispositivos() {
    setCargandoDispositivos(true)
    try {
      const data = await obtenerDispositivosMoviles()
      if (Array.isArray(data)) setDispositivosMoviles(data)
    } catch (err) {
      console.warn('Dispositivos móviles no disponibles:', err)
    } finally {
      setCargandoDispositivos(false)
    }
  }

  async function handleDesvincularTerminal(dispositivoId) {
    if (!dispositivoId) return
    const confirmar = window.confirm('¿Seguro que deseas desvincular este dispositivo móvil?')
    if (!confirmar) return

    setDesvinculandoId(dispositivoId)
    try {
      await desvincularDispositivoAdmin(dispositivoId)
      await cargarDispositivos()
      setMensajeAccion({ tipo: 'exito', texto: 'Terminal móvil desvinculada exitosamente.' })
      reproducirSonido('exito')
    } catch (err) {
      console.error('Error al desvincular:', err)
      setMensajeAccion({ tipo: 'advertencia', texto: err.message || 'No se pudo desvincular el dispositivo.' })
      reproducirSonido('advertencia')
    } finally {
      setDesvinculandoId(null)
    }
  }

  // Probar conectividad con el endpoint del servidor
  async function probarConexionServidor() {
    setPingStatus('testing')
    const inicio = Date.now()
    try {
      const endpoint = urlServidor.endsWith('/api') ? `${urlServidor}/estado` : `${urlServidor}`
      const res = await fetch(endpoint, { method: 'GET', cache: 'no-store' })
      const delta = Date.now() - inicio
      setPingLatencia(delta)
      if (res.ok) {
        setPingStatus('ok')
        reproducirSonido('exito')
      } else {
        setPingStatus('error')
        reproducirSonido('advertencia')
      }
    } catch {
      setPingStatus('error')
      setPingLatencia(null)
      reproducirSonido('advertencia')
    }
    setTimeout(() => {
      setPingStatus('idle')
    }, 4500)
  }

  // Simular un escaneo de prueba para verificar pipeline
  async function simularEscaneoDePrueba() {
    setSimulandoEscaneo(true)
    try {
      // Buscar el primer egresado de la ceremonia si existe
      const manif = obtenerManifiestoOffline()
      let codigoPrueba = 'EG-DEMO-001'
      if (manif && Array.isArray(manif.egresados) && manif.egresados.length > 0) {
        codigoPrueba = manif.egresados[0].dni || manif.egresados[0].codigo || 'EG-DEMO-001'
      }
      await ejecutarBusqueda(codigoPrueba)
      setMensajeAccion({ tipo: 'exito', texto: `Simulación completada con código: ${codigoPrueba}` })
    } catch (err) {
      setMensajeAccion({ tipo: 'advertencia', texto: 'Error al simular escaneo.' })
    } finally {
      setSimulandoEscaneo(false)
    }
  }

  function copiarTexto(texto, tipo) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(texto)
      if (tipo === 'apk') {
        setCopiadoApk(true)
        setTimeout(() => setCopiadoApk(false), 2000)
      } else if (tipo === 'comando') {
        setCopiadoComando(true)
        setTimeout(() => setCopiadoComando(false), 2000)
      } else {
        setCopiadoServidor(true)
        setTimeout(() => setCopiadoServidor(false), 2000)
      }
    }
  }

  // Sincronizar cola offline acumulada
  async function sincronizarPendientes() {
    const cola = obtenerColaAcreditacionOffline()
    if (!cola || cola.length === 0) {
      setPendientesOffline(0)
      return
    }
    setSincronizandoLote(true)
    try {
      await sincronizarLoteAcreditacion(cola)
      limpiarColaAcreditacionOffline()
      setPendientesOffline(0)
      setMensajeAccion({ tipo: 'exito', texto: `Se sincronizaron ${cola.length} ingreso(s) registrados sin conexión.` })
      if (sonidoHabilitado) reproducirSonido('exito')
      await cargarEntorno()
    } catch (err) {
      console.error('Error al sincronizar cola offline:', err)
      setMensajeAccion({ tipo: 'advertencia', texto: 'No se pudo sincronizar el lote offline. Reintentará automáticamente al recuperar conexión.' })
    } finally {
      setSincronizandoLote(false)
    }
  }

  // Precargar manifiesto offline
  async function precargarManifiesto(cerId) {
    try {
      const data = await descargarManifiestoAcreditacion(cerId)
      if (data && data.egresados) {
        guardarManifiestoOffline(data)
      }
    } catch (e) {
      console.warn('Manifiesto no disponible online, usando local:', e)
    }
  }

  // 1. Cargar ceremonia y estadísticas
  async function cargarEntorno() {
    try {
      const [cerActiva, statsData, listaCer] = await Promise.allSettled([
        obtenerCeremoniaActiva(),
        obtenerAsistenciaOperativa(),
        obtenerCeremonias()
      ])
      if (cerActiva.status === 'fulfilled' && cerActiva.value?.id) {
        setCeremonia(cerActiva.value)
        precargarManifiesto(cerActiva.value.id)
      }
      if (statsData.status === 'fulfilled') setStats(statsData.value)
      if (listaCer.status === 'fulfilled' && Array.isArray(listaCer.value)) {
        setCeremoniasDisponibles(listaCer.value)
      }
    } catch (err) {
      console.error('Error cargando entorno de acreditación:', err)
    }
  }

  async function handleCambiarCeremonia(nuevaId) {
    if (!nuevaId || String(nuevaId) === String(ceremonia?.id)) return
    setCambiandoCeremonia(true)
    try {
      await activarCeremonia(nuevaId)
      emitirCambioSync('CEREMONIAS', { id: nuevaId })
      await cargarEntorno()
      precargarManifiesto(nuevaId)
      limpiarResultado()
      reproducirSonido('exito')
    } catch (err) {
      console.error('Error al cambiar ceremonia:', err)
      alert(err.message || 'No se pudo cambiar la ceremonia.')
    } finally {
      setCambiandoCeremonia(false)
    }
  }

  useEffect(() => {
    cargarEntorno()
    cargarRedLocal()
    cargarDispositivos()

    // Intervalo de sondeo periódico de terminales móviles activas
    const intervalDispositivos = setInterval(() => {
      cargarDispositivos()
    }, 7000)

    const handleOnline = () => {
      setEstaOnline(true)
      sincronizarPendientes()
    }
    const handleOffline = () => {
      setEstaOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(intervalDispositivos)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sincronización en vivo de métricas
  useSincronizacion(['EGRESADOS', 'INVITADOS', 'BUTACAS', 'CEREMONIAS'], () => {
    cargarEntorno()
  })

  // 2. Detección automática de lector USB (Gun Scanner)
  useEffect(() => {
    const manejarKeyDown = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const ahora = Date.now()
      const tiempoDelta = ahora - ultimoKeyTimeRef.current
      ultimoKeyTimeRef.current = ahora

      if (e.key === 'Enter') {
        if (bufferTecladoRef.current.length >= 3) {
          const codigoEscaneado = bufferTecladoRef.current
          bufferTecladoRef.current = ''
          ejecutarBusqueda(codigoEscaneado)
        }
        bufferTecladoRef.current = ''
      } else if (e.key && e.key.length === 1) {
        if (tiempoDelta > 150) {
          bufferTecladoRef.current = e.key
        } else {
          bufferTecladoRef.current += e.key
        }
      }
    }

    window.addEventListener('keydown', manejarKeyDown)
    return () => window.removeEventListener('keydown', manejarKeyDown)
  }, [])

  // 3. Inicializar / Destruir Escáner de Cámara con html5-qrcode
  useEffect(() => {
    let montado = true

    async function initCameraScanner() {
      if (!camaraActiva) {
        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop()
            html5QrCodeRef.current.clear()
          } catch {}
          html5QrCodeRef.current = null
        }
        return
      }

      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (!montado) return

        const devices = await Html5Qrcode.getCameras()
        if (devices && devices.length > 0) {
          setCamarasDisponibles(devices)
          const camId = camaraSeleccionadaId || devices[0].id

          if (html5QrCodeRef.current) {
            try {
              await html5QrCodeRef.current.stop()
            } catch {}
          }

          const qrScanner = new Html5Qrcode('sigic-reader-container')
          html5QrCodeRef.current = qrScanner

          await qrScanner.start(
            camId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              const ahora = Date.now()
              if (ahora - ultimoEscaneoTimestamp > 2000) {
                setUltimoEscaneoTimestamp(ahora)
                ejecutarBusqueda(decodedText)
              }
            },
            () => {}
          )
        } else {
          setErrorBusqueda('No se detectaron cámaras en este dispositivo.')
          setCamaraActiva(false)
        }
      } catch (err) {
        console.error('Error al iniciar la cámara:', err)
        setErrorBusqueda('No se pudo acceder a la cámara. Verificá los permisos del navegador.')
        setCamaraActiva(false)
      }
    }

    initCameraScanner()

    return () => {
      montado = false
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop()
        } catch {}
      }
    }
  }, [camaraActiva, camaraSeleccionadaId])

  // 4. Ejecutar búsqueda y análisis del código con soporte offline
  async function ejecutarBusqueda(codigo) {
    if (!codigo || !codigo.trim()) return
    setCargandoBusqueda(true)
    setErrorBusqueda(null)
    setMensajeAccion(null)

    try {
      let data = null
      if (estaOnline) {
        try {
          data = await buscarAcreditacion(codigo.trim())
        } catch (fetchErr) {
          // Si falló por desconexión en vuelo, intentar búsqueda offline
          data = buscarEnManifiestoOffline(codigo.trim())
          if (!data) throw fetchErr
        }
      } else {
        data = buscarEnManifiestoOffline(codigo.trim())
        if (!data) throw new Error('Código no encontrado en el padrón local descargado.')
      }

      setResultado(data)

      const esEgresadoAcreditado = data.egresado?.presente === true
      const totalInvs = data.invitados?.length || (data.invitado ? 1 : 0)
      const invsAcreditados = data.invitados?.filter((i) => i.presente === true).length || (data.invitado?.presente ? 1 : 0)
      const todosAcreditados = esEgresadoAcreditado && (totalInvs === 0 || invsAcreditados === totalInvs)

      if (sonidoHabilitado) {
        if (todosAcreditados) {
          reproducirSonido('advertencia')
        } else {
          reproducirSonido('exito')
        }
      }

      setBusquedaManual('')
    } catch (err) {
      setErrorBusqueda(err.message || 'Código no encontrado en el sistema.')
      setResultado(null)
      if (sonidoHabilitado) reproducirSonido('error')
    } finally {
      setCargandoBusqueda(false)
    }
  }

  // 5. Acreditar todo el grupo (con soporte offline)
  async function manejarAcreditarGrupo() {
    if (!resultado?.egresado?.id) return
    setProcesandoAcreditacion(true)

    const invIds = resultado.invitados?.map((i) => i.id) || []

    if (!estaOnline) {
      encolarAcreditacionOffline(resultado.egresado.id, invIds, true, usuario?.nombre)
      setPendientesOffline(obtenerColaAcreditacionOffline().length)
      setResultado((prev) => ({
        ...prev,
        egresado: { ...prev.egresado, presente: true, fecha_presente: new Date().toISOString() },
        invitados: prev.invitados?.map((i) => ({ ...i, presente: true, fecha_presente: new Date().toISOString() }))
      }))
      setMensajeAccion({ tipo: 'exito', texto: '¡Grupo acreditado localmente! (Se sincronizará al volver la red)' })
      if (sonidoHabilitado) reproducirSonido('exito')
      agregarAlHistorial(resultado.egresado.nombre, 'Graduado y grupo (Offline)', resultado.egresado.asiento_id)
      setProcesandoAcreditacion(false)
      return
    }

    try {
      const resp = await acreditarGrupo(resultado.egresado.id)
      setResultado((prev) => ({
        ...prev,
        egresado: resp.egresado || { ...prev.egresado, presente: true, fecha_presente: new Date().toISOString() },
        invitados: resp.invitados || prev.invitados?.map((i) => ({ ...i, presente: true, fecha_presente: new Date().toISOString() }))
      }))

      setMensajeAccion({ tipo: 'exito', texto: '¡Grupo acreditado correctamente!' })
      if (sonidoHabilitado) reproducirSonido('exito')

      agregarAlHistorial(resultado.egresado.nombre, 'Graduado y grupo', resultado.egresado.asiento_id)

      emitirCambioSync('EGRESADOS', { id: resultado.egresado.id })
      emitirCambioSync('INVITADOS', { egresadoId: resultado.egresado.id })
      cargarEntorno()
    } catch (err) {
      // Fallback a offline si falló la conexión
      encolarAcreditacionOffline(resultado.egresado.id, invIds, true, usuario?.nombre)
      setPendientesOffline(obtenerColaAcreditacionOffline().length)
      setResultado((prev) => ({
        ...prev,
        egresado: { ...prev.egresado, presente: true, fecha_presente: new Date().toISOString() },
        invitados: prev.invitados?.map((i) => ({ ...i, presente: true, fecha_presente: new Date().toISOString() }))
      }))
      setMensajeAccion({ tipo: 'exito', texto: '¡Acreditado localmente por corte de red!' })
      if (sonidoHabilitado) reproducirSonido('exito')
      agregarAlHistorial(resultado.egresado.nombre, 'Graduado y grupo (Offline)', resultado.egresado.asiento_id)
    } finally {
      setProcesandoAcreditacion(false)
    }
  }

  // 6. Acreditar egresado individual (con soporte offline)
  async function manejarAcreditarEgresado() {
    if (!resultado?.egresado?.id) return
    setProcesandoAcreditacion(true)

    if (!estaOnline) {
      encolarAcreditacionOffline(resultado.egresado.id, [], true, usuario?.nombre)
      setPendientesOffline(obtenerColaAcreditacionOffline().length)
      setResultado((prev) => ({
        ...prev,
        egresado: { ...prev.egresado, presente: true, fecha_presente: new Date().toISOString() }
      }))
      setMensajeAccion({ tipo: 'exito', texto: `Ingreso local para ${resultado.egresado.nombre} (Offline)` })
      if (sonidoHabilitado) reproducirSonido('exito')
      agregarAlHistorial(resultado.egresado.nombre, 'Graduado (Offline)', resultado.egresado.asiento_id)
      setProcesandoAcreditacion(false)
      return
    }

    try {
      const resp = await acreditarEgresado(resultado.egresado.id)
      setResultado((prev) => ({
        ...prev,
        egresado: resp.graduado || { ...prev.egresado, presente: true, fecha_presente: new Date().toISOString() }
      }))
      setMensajeAccion({ tipo: 'exito', texto: `Ingreso registrado para ${resultado.egresado.nombre}` })
      if (sonidoHabilitado) reproducirSonido('exito')

      agregarAlHistorial(resultado.egresado.nombre, 'Graduado', resultado.egresado.asiento_id)
      emitirCambioSync('EGRESADOS', { id: resultado.egresado.id })
      cargarEntorno()
    } catch (err) {
      encolarAcreditacionOffline(resultado.egresado.id, [], true, usuario?.nombre)
      setPendientesOffline(obtenerColaAcreditacionOffline().length)
      setResultado((prev) => ({
        ...prev,
        egresado: { ...prev.egresado, presente: true, fecha_presente: new Date().toISOString() }
      }))
      setMensajeAccion({ tipo: 'exito', texto: `Ingreso guardado localmente (Offline)` })
      if (sonidoHabilitado) reproducirSonido('exito')
      agregarAlHistorial(resultado.egresado.nombre, 'Graduado (Offline)', resultado.egresado.asiento_id)
    } finally {
      setProcesandoAcreditacion(false)
    }
  }

  // 7. Acreditar invitado individual (con soporte offline)
  async function manejarAcreditarInvitado(invitadoId, nombre, asientoId) {
    if (!resultado?.egresado?.id) return
    setProcesandoAcreditacion(true)

    if (!estaOnline) {
      encolarAcreditacionOffline(resultado.egresado.id, [invitadoId], false, usuario?.nombre)
      setPendientesOffline(obtenerColaAcreditacionOffline().length)
      setResultado((prev) => ({
        ...prev,
        invitados: prev.invitados?.map((i) => i.id === invitadoId ? { ...i, presente: true, fecha_presente: new Date().toISOString() } : i),
        invitado: prev.invitado?.id === invitadoId ? { ...prev.invitado, presente: true, fecha_presente: new Date().toISOString() } : prev.invitado
      }))
      setMensajeAccion({ tipo: 'exito', texto: `Ingreso local para ${nombre} (Offline)` })
      if (sonidoHabilitado) reproducirSonido('exito')
      agregarAlHistorial(nombre, 'Acompañante (Offline)', asientoId)
      setProcesandoAcreditacion(false)
      return
    }

    try {
      const resp = await acreditarInvitado(invitadoId)
      setResultado((prev) => {
        if (prev.tipo === 'individual' && prev.invitado?.id === invitadoId) {
          return {
            ...prev,
            invitado: resp.invitado || { ...prev.invitado, presente: true, fecha_presente: new Date().toISOString() }
          }
        }
        return {
          ...prev,
          invitados: prev.invitados?.map((i) => i.id === invitadoId ? (resp.invitado || { ...i, presente: true, fecha_presente: new Date().toISOString() }) : i)
        }
      })
      setMensajeAccion({ tipo: 'exito', texto: `Ingreso registrado para ${nombre}` })
      if (sonidoHabilitado) reproducirSonido('exito')

      agregarAlHistorial(nombre, 'Acompañante', asientoId)
      emitirCambioSync('INVITADOS', { id: invitadoId })
      cargarEntorno()
    } catch (err) {
      encolarAcreditacionOffline(resultado.egresado.id, [invitadoId], false, usuario?.nombre)
      setPendientesOffline(obtenerColaAcreditacionOffline().length)
      setResultado((prev) => ({
        ...prev,
        invitados: prev.invitados?.map((i) => i.id === invitadoId ? { ...i, presente: true, fecha_presente: new Date().toISOString() } : i),
        invitado: prev.invitado?.id === invitadoId ? { ...prev.invitado, presente: true, fecha_presente: new Date().toISOString() } : prev.invitado
      }))
      setMensajeAccion({ tipo: 'exito', texto: `Ingreso guardado localmente (Offline)` })
      if (sonidoHabilitado) reproducirSonido('exito')
      agregarAlHistorial(nombre, 'Acompañante (Offline)', asientoId)
    } finally {
      setProcesandoAcreditacion(false)
    }
  }

  function agregarAlHistorial(nombre, rol, asiento) {
    const ahora = new Date()
    const hora = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setHistorialIngresos((prev) => [
      { id: `${Date.now()}_${Math.random()}`, nombre, rol, asiento: asiento || 'Sin butaca', hora },
      ...prev.slice(0, 14)
    ])
  }

  function limpiarResultado() {
    setResultado(null)
    setErrorBusqueda(null)
    setMensajeAccion(null)
    setBusquedaManual('')
    if (inputBusquedaRef.current) inputBusquedaRef.current.focus()
  }

  const egresadoActual = resultado?.egresado || (resultado?.tipo === 'individual' ? resultado?.egresado : null)
  const listaInvitados = resultado?.invitados || (resultado?.tipo === 'individual' && resultado?.invitado ? [resultado.invitado] : [])
  const todosAcreditados = egresadoActual?.presente && (listaInvitados.length === 0 || listaInvitados.every((i) => i.presente))

  return (
    <div className="sigic-control-acreditacion-view min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 font-sans transition-colors duration-300 relative selection:bg-sky-500/30">
      {/* Luz ambiental institucional */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[340px] bg-gradient-to-b from-sky-500/10 via-indigo-500/5 to-transparent blur-3xl opacity-60" />
      </div>

      {/* HEADER PRINCIPAL */}
      <header className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shadow-lg shadow-sky-500/10">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Control de Acreditación</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                En Vivo
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[9px] font-black uppercase tracking-wider">
                Portería v1.0.9+10
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <CalendarDays size={13} className="text-sky-400" />
                {ceremonia?.nombre || 'Ceremonia en curso'} · {ceremonia?.lugar || 'Sede Central Beltrán'}
              </span>
              {ceremoniasDisponibles.length > 1 && (
                <div className="flex items-center gap-1.5 ml-1">
                  <span className="text-[10px] uppercase font-extrabold text-slate-500">Puesto:</span>
                  <select
                    value={ceremonia?.id || ''}
                    onChange={(e) => handleCambiarCeremonia(e.target.value)}
                    disabled={cambiandoCeremonia}
                    className="text-[11px] font-bold bg-slate-900 text-sky-300 border border-slate-700 rounded-lg px-2 py-0.5 outline-none cursor-pointer hover:bg-slate-800 transition"
                    title="Cambiar ceremonia activa para esta terminal"
                  >
                    {ceremoniasDisponibles.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.nombre} {c.activa === 1 || c.activa === true ? '(Activa)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controles de Sonido, Descarga y Salida */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={URL_APK_OFICIAL}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs transition active:scale-95 shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
            title="Descargar instalador APK oficial v1.0.9 desde GitHub Releases"
          >
            <Smartphone size={14} />
            <span className="hidden sm:inline">Descargar APK v1.0.9</span>
            <span className="sm:hidden">APK</span>
          </a>

          <button
            onClick={() => setSonidoHabilitado(!sonidoHabilitado)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border cursor-pointer ${
              sonidoHabilitado 
                ? 'bg-slate-800/90 text-sky-400 border-slate-700 hover:bg-slate-750' 
                : 'bg-slate-800/40 text-slate-500 border-slate-800 hover:bg-slate-800'
            }`}
            title={sonidoHabilitado ? 'Sonido activado' : 'Sonido desactivado'}
          >
            {sonidoHabilitado ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="hidden sm:inline">{sonidoHabilitado ? 'Sonido' : 'Silencio'}</span>
          </button>

          <button
            id="btn-cierre-ceremonia-agradecimientos"
            onClick={() => setMostrarResumenFinal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition active:scale-95 cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            title="Concluir acto de colación y ver balance y agradecimiento final"
          >
            <CheckCircle2 size={14} />
            <span>Cierre de Ceremonia</span>
          </button>

          {onVolver && (
            <button
              onClick={onVolver}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition active:scale-95 cursor-pointer"
            >
              Volver
            </button>
          )}

          {onCerrarSesion && (
            <button
              onClick={onCerrarSesion}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              Cerrar Turno
            </button>
          )}
        </div>
      </header>

      {/* BANNER DE ESTADO DE CONEXIÓN Y SINCRONIZACIÓN OFFLINE */}
      <div className="max-w-7xl mx-auto mt-4 px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg relative z-10">
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${estaOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400 animate-pulse'}`} />
          <span className="font-bold text-slate-200">
            {estaOnline ? 'Terminal conectada · Validación en tiempo real' : 'Modo sin conexión · Validando con padrón local'}
          </span>
          {manifiestoDescargado && (
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md bg-slate-800 text-sky-300 text-[10px] font-bold border border-slate-700">
              Padrón local listo
            </span>
          )}
        </div>

        {pendientesOffline > 0 ? (
          <button
            onClick={sincronizarPendientes}
            disabled={sincronizandoLote || !estaOnline}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold hover:bg-amber-500/30 disabled:opacity-50 transition active:scale-95 cursor-pointer"
          >
            <RefreshCw size={13} className={sincronizandoLote ? 'animate-spin' : ''} />
            <span>{sincronizandoLote ? 'Sincronizando...' : `Sincronizar ${pendientesOffline} ingreso(s)`}</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <CheckCircle size={13} className="text-emerald-400" />
            <span>Todos los ingresos sincronizados con la base de datos</span>
          </span>
        )}
      </div>

      {/* BARRA DE PESTAÑAS Y MODALIDADES */}
      <div className="max-w-7xl mx-auto mt-4 flex items-center justify-between border-b border-slate-800 pb-3 gap-3 overflow-x-auto relative z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalidad('flutter')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              modalidad === 'flutter'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Smartphone size={15} />
            <span>Acreditación Móvil (App Portería v1.0.9)</span>
            {dispositivosMoviles.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setModalidad('respaldo_web')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              modalidad === 'respaldo_web'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Laptop size={15} />
            <span>Puesto de Mesa (USB / DNI)</span>
          </button>

          <button
            onClick={() => setModalidad('monitor')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              modalidad === 'monitor'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Activity size={15} />
            <span>Monitor de Sala & Feed</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
          <span>Aforo Presente:</span>
          <span className="font-mono font-black text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            {stats?.presentes || 0} / {stats?.totalInvitados ? (stats.totalInvitados + (stats.totalEgresados || 0)) : '—'}
          </span>
        </div>
      </div>

      {/* VISTA FLUTTER: CENTRO DE GESTIÓN Y SINCRONIZACIÓN MÓVIL PORTERÍA */}
      {modalidad === 'flutter' && (
        <main className="max-w-6xl mx-auto space-y-7 my-6 px-3 sm:px-0">
          
          {/* BANNER PRINCIPAL / HERO MODERNO */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/40 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-black tracking-wide">
                    <Smartphone size={14} className="text-sky-400" />
                    <span>SiGIC Accesos · Portería Oficial v1.0.9 (Build 10)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Cámara 60 FPS · Parches Shorebird OTA · Modo Offline
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Control de Acreditación Móvil en Puerta
                </h2>
                <p className="text-xs sm:text-sm text-slate-300/90 font-medium leading-relaxed">
                  Terminales de mano para personal operativo, seguridad y administración. Escaneo ultrarrápido de credenciales QR, validación instantánea de butacas oficiales y sincronización automática bidireccional.
                </p>
              </div>

              {/* ACCIONES RÁPIDAS DEL PANEL SUPERIOR */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                <a
                  href={URL_APK_OFICIAL}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="SIGIC-Porteria-Release-v1.0.9.apk"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-sky-500/20 transition active:scale-95 cursor-pointer"
                  title="Descargar APK oficial v1.0.9 directamente desde GitHub Releases"
                >
                  <Smartphone size={15} />
                  <span>Descargar APK v1.0.9</span>
                </a>

                <button
                  onClick={probarConexionServidor}
                  disabled={pingStatus === 'testing'}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
                    pingStatus === 'ok'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : pingStatus === 'error'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                  title="Verifica que el endpoint sea alcanzable por los teléfonos"
                >
                  <Activity size={15} className={pingStatus === 'testing' ? 'animate-spin text-sky-400' : ''} />
                  <span>
                    {pingStatus === 'testing' ? 'Probando...' : pingStatus === 'ok' ? `En línea (${pingLatencia}ms)` : pingStatus === 'error' ? 'Fallo de ping' : 'Test Ping'}
                  </span>
                </button>

                <button
                  onClick={simularEscaneoDePrueba}
                  disabled={simulandoEscaneo}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer"
                  title="Simula un escaneo exitoso sin necesidad de un celular físico"
                >
                  <Play size={14} className={simulandoEscaneo ? 'animate-spin' : ''} />
                  <span>Simular Acreditación</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2 PASOS VISUALES REDISEÑADOS CON GLASSMORPHISM Y ALTO CONTRASTE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* PASO 1: INSTALACIÓN DEL APK OFICIAL */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-slate-700 transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    <div>
                      <h3 className="text-base font-black text-white">Instalar Aplicación Portería</h3>
                      <p className="text-[11px] text-slate-400">Android APK Oficial · Tecnicatura Superior en Analista de Sistemas</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-sky-300 text-[11px] font-mono font-bold border border-slate-700">
                    v1.0.9+10 · 68.6 MB
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <QRCodeSVG value={urlApk} size={135} level="M" />
                  </div>

                  <div className="space-y-2.5 text-center sm:text-left">
                    <p className="text-xs text-slate-200 font-semibold leading-snug">
                      Apuntá la cámara nativa de cualquier Android a este código para iniciar la descarga directa.
                    </p>
                    <div className="space-y-1 text-[11px] text-slate-400">
                      <p className="flex items-center justify-center sm:justify-start gap-1.5">
                        <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                        <span>Compilado para Android 7.0 a 15 (ARM64 / ARM32 / x86_64)</span>
                      </p>
                      <p className="flex items-center justify-center sm:justify-start gap-1.5">
                        <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                        <span>Parches transparentes OTA con Shorebird CodePush</span>
                      </p>
                      <p className="flex items-center justify-center sm:justify-start gap-1.5">
                        <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                        <span>Sincronización bidireccional y validación offline</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={URL_APK_OFICIAL}
                    target="_blank"
                    rel="noopener noreferrer"
                    download="SIGIC-Porteria-Release-v1.0.9.apk"
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs transition active:scale-95 shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    title="Descargar instalador APK oficial desde GitHub Releases"
                  >
                    <Smartphone size={15} />
                    <span>Descargar APK v1.0.9</span>
                  </a>

                  <button
                    onClick={() => copiarTexto(urlApk, 'apk')}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiadoApk ? <CheckCheck size={15} className="text-emerald-400" /> : <Copy size={15} />}
                    <span>{copiadoApk ? 'Enlace Copiado' : 'Copiar Enlace'}</span>
                  </button>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <a
                    href={URL_GITHUB_RELEASES}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink size={12} /> Ver release oficial en GitHub
                  </a>
                  <a
                    href="/descargas/SIGIC-Porteria-1.0.9.apk"
                    download
                    className="text-slate-400 hover:text-slate-200 hover:underline"
                    title="Descargar desde mirror local de la plataforma"
                  >
                    Mirror institucional
                  </a>
                </div>

                <p className="text-[10px] text-slate-500 text-center">
                  ¿Descarga bloqueada? Al abrir el APK seleccioná <em>"Instalar de todas formas"</em> o permití orígenes desconocidos.
                </p>
              </div>
            </div>

            {/* PASO 2: VINCULACIÓN Y ENLACE DE RED CON AUTO-DETECCIÓN */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-slate-700 transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <h3 className="text-base font-black text-white">Vincular Celular a la Ceremonia</h3>
                      <p className="text-[11px] text-slate-400">Escaneá desde la App Móvil SiGIC</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1.5">
                    <Wifi size={12} />
                    {urlServidor.includes('localhost') ? 'Localhost' : 'Red Local Wi-Fi'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <QRCodeSVG value={`sigic-config:${urlServidor}`} size={135} level="H" />
                  </div>

                  <div className="space-y-2.5 text-center sm:text-left flex-1 min-w-0">
                    <p className="text-xs text-slate-200 font-semibold leading-snug">
                      Abrí la app en el celular y apuntá su escáner a este QR para conectarse inmediatamente.
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      El celular y esta PC deben estar en la misma red Wi-Fi o punto de acceso compartido.
                    </p>
                  </div>
                </div>
              </div>

              {/* SELECTOR / CONFIGURADOR DE IP RÁPIDO */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1.5">
                    <Server size={13} className="text-cyan-400" />
                    <span>Host API Destino:</span>
                  </span>
                  <button
                    onClick={() => setEditandoUrlServidor(!editandoUrlServidor)}
                    className="text-sky-400 hover:text-sky-300 font-bold text-xs underline cursor-pointer"
                  >
                    {editandoUrlServidor ? 'Cerrar edición' : 'Editar manualmente'}
                  </button>
                </div>

                {editandoUrlServidor ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={urlServidor}
                      onChange={(e) => setUrlServidor(e.target.value)}
                      placeholder="http://192.168.0.90:3000/api"
                      className="flex-1 bg-slate-950 border border-sky-500 text-cyan-300 font-mono text-xs px-3.5 py-2.5 rounded-xl outline-none"
                    />
                    <button
                      onClick={() => setEditandoUrlServidor(false)}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
                    >
                      Listo
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => copiarTexto(urlServidor, 'servidor')}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs font-bold truncate cursor-pointer hover:border-slate-700 transition flex items-center justify-between"
                    title="Click para copiar URL"
                  >
                    <span className="truncate">{urlServidor}</span>
                    <span className="text-[11px] text-slate-400 shrink-0 ml-2 font-sans font-semibold">
                      {copiadoServidor ? '¡Copiado!' : 'Copiar'}
                    </span>
                  </div>
                )}

                {/* SUGERENCIAS RÁPIDAS DE IPs DETECTADAS */}
                {redLocalInfo && Array.isArray(redLocalInfo.interfaces) && redLocalInfo.interfaces.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      IPs detectadas en esta computadora (1-clic para aplicar):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {redLocalInfo.interfaces.map((iface) => {
                        const puerto = typeof window !== 'undefined' ? (window.location.port || '3000') : '3000'
                        const targetUrl = `http://${iface.ip}:${puerto}/api`
                        const esActual = urlServidor === targetUrl
                        return (
                          <button
                            key={iface.ip}
                            onClick={() => setUrlServidor(targetUrl)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                              esActual
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            <Wifi size={11} className={iface.recomendada ? 'text-emerald-400' : 'text-slate-400'} />
                            <span>{iface.ip}</span>
                            {iface.recomendada && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-sans">
                                Wi-Fi
                              </span>
                            )}
                          </button>
                        )
                      })}

                      <button
                        onClick={() => {
                          const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
                          setUrlServidor(`${base}/api`)
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition cursor-pointer ${
                          urlServidor.includes('localhost')
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        localhost
                      </button>
                    </div>
                  </div>
                )}

                {urlServidor.includes('localhost') && (
                  <div className="text-[11px] text-amber-300/90 font-medium bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5">
                    <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300">Aviso sobre "localhost":</strong> El celular no podrá conectarse si el QR tiene <code>localhost</code> (porque intentará conectarse a sí mismo). Seleccioná una de las IPs locales detectadas arriba (ej: <code>{redLocalInfo?.ipRecomendada || '192.168.0.90'}</code>) para que conecte por Wi-Fi.
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* SECCIÓN 3: FLOTA DE TERMINALES MÓVILES VINCULADAS EN VIVO */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <Radio size={18} className="text-emerald-400 animate-pulse" />
                  <h3 className="text-lg font-black text-white">Terminales Móviles de Portería</h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                    {dispositivosMoviles.length} vinculada(s)
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Dispositivos autorizados que actualmente pueden acreditar invitados y graduados en los accesos.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={cargarDispositivos}
                  disabled={cargandoDispositivos}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition active:scale-95 cursor-pointer"
                >
                  <RefreshCw size={13} className={cargandoDispositivos ? 'animate-spin' : ''} />
                  <span>Refrescar</span>
                </button>
              </div>
            </div>

            {dispositivosMoviles.length === 0 ? (
              <div className="text-center py-10 space-y-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                  <Smartphone size={24} />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h4 className="text-sm font-bold text-white">Ningún celular conectado todavía</h4>
                  <p className="text-xs text-slate-400">
                    Instalá la app en el teléfono de portería y escaneá el código QR del <strong>Paso 2</strong> para que aparezca aquí en tiempo real.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dispositivosMoviles.map((dev) => {
                  const enLinea = Boolean(dev.enLinea)
                  const desvinculando = desvinculandoId === dev.dispositivoId

                  return (
                    <div
                      key={dev.dispositivoId || Math.random()}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                              <Smartphone size={18} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-white truncate">
                                {dev.nombreDispositivo || dev.modelo || 'Terminal Android'}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">
                                {dev.usuarioNombre || dev.usuarioEmail || 'Operador de Portería'}
                              </p>
                            </div>
                          </div>

                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            enLinea
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${enLinea ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                            {enLinea ? 'En línea' : 'Inactivo'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                          <div>
                            <span className="text-slate-500 block">Sistema:</span>
                            <span className="text-slate-300 font-semibold truncate block">
                              {dev.sistema || 'Android'} {dev.versionSistema ? `(${dev.versionSistema.slice(0, 10)})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Versión App:</span>
                            <span className="text-slate-300 font-mono font-semibold truncate block">
                              {dev.versionApp || '1.0.9+10'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500 block">IP Registrada:</span>
                            <span className="text-cyan-300 font-mono text-[10px] truncate block">
                              {dev.ipUltimoAcceso || '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          Último ping: {dev.ultimoAcceso ? new Date(dev.ultimoAcceso).toLocaleTimeString() : 'Reciente'}
                        </span>

                        <button
                          onClick={() => handleDesvincularTerminal(dev.dispositivoId)}
                          disabled={desvinculando}
                          className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>{desvinculando ? 'Desvinculando...' : 'Desvincular'}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* BARRA INFERIOR DE ESTADO Y ACCESOS RÁPIDOS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-slate-200">
                {dispositivosMoviles.length > 0 
                  ? `${dispositivosMoviles.length} terminal(es) móvil(es) sincronizada(s) con la ceremonia activa` 
                  : 'Sistema a la espera de conexiones móviles en puerta'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-400 font-semibold">
              <span>
                Ingresados al momento: <strong className="text-emerald-400 font-black">{stats?.presentes || 0}</strong> de {stats?.totalInvitados ? (stats.totalInvitados + (stats.totalEgresados || 0)) : '—'}
              </span>
              <span>·</span>
              <button
                onClick={() => setModalidad('respaldo_web')}
                className="text-sky-400 hover:text-sky-300 underline cursor-pointer text-xs font-bold"
              >
                Abrir puesto de mesa web
              </button>
            </div>
          </div>

        </main>
      )}

      {/* VISTA 2: RESPALDO DE EMERGENCIA WEB (CÁMARA / BÚSQUEDA MANUAL) */}
      {modalidad === 'respaldo_web' && (
        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA: CÁMARA Y ENTRADA MANUAL (5 COLUMNAS) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* BARRA DE ENTRADA MANUAL Y LECTOR */}
            <div className="bg-slate-900/85 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Búsqueda Rápida / Pistola USB</span>
                <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 font-bold border border-slate-700">Autodetect</span>
              </h2>

              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  ejecutarBusqueda(busquedaManual)
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-porteria-busqueda"
                    ref={inputBusquedaRef}
                    type="text"
                    value={busquedaManual}
                    onChange={(e) => setBusquedaManual(e.target.value)}
                    placeholder="DNI, Token o código escaneado..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-medium transition"
                    autoFocus
                  />
                </div>
                <button
                  id="btn-porteria-buscar"
                  type="submit"
                  disabled={cargandoBusqueda || !busquedaManual.trim()}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-40 text-white font-black text-xs transition active:scale-95 cursor-pointer shadow-md shadow-sky-500/20"
                >
                  {cargandoBusqueda ? <RefreshCw size={14} className="animate-spin" /> : 'Buscar'}
                </button>
              </form>
            </div>

            {/* VISOR DE CÁMARA QR */}
            <div className="bg-slate-900/85 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Camera size={15} className="text-sky-400" />
                  <span>Escáner de Cámara Web</span>
                </h2>
                <button
                  onClick={() => setCamaraActiva(!camaraActiva)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    camaraActiva 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30' 
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                  }`}
                >
                  {camaraActiva ? <CameraOff size={14} /> : <Camera size={14} />}
                  <span>{camaraActiva ? 'Apagar Cámara' : 'Encender Cámara'}</span>
                </button>
              </div>

              {/* Contenedor del video HTML5 QR Code */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-750 min-h-[260px] flex items-center justify-center">
                <div id="sigic-reader-container" className={`w-full ${camaraActiva ? 'block' : 'hidden'}`} />

                {!camaraActiva && (
                  <div 
                    onClick={() => setCamaraActiva(true)}
                    className="text-center p-6 space-y-2 cursor-pointer hover:opacity-80 transition"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto border border-slate-800">
                      <CameraOff size={22} />
                    </div>
                    <p className="text-xs font-bold text-slate-400">Cámara en espera</p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Presioná para usar la cámara web de respaldo de la notebook o una webcam USB.
                    </p>
                  </div>
                )}
              </div>

              {/* Selector de cámara si hay más de 1 */}
              {camarasDisponibles.length > 1 && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Cámara:</span>
                  <select
                    value={camaraSeleccionadaId}
                    onChange={(e) => setCamaraSeleccionadaId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-300 outline-none"
                  >
                    {camarasDisponibles.map((c) => (
                      <option key={c.id} value={c.id}>{c.label || `Cámara ${c.id.slice(0, 5)}`}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

          </div>

          {/* COLUMNA DERECHA: RESULTADO DE ACREDITACIÓN / DETALLE (7 COLUMNAS) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* MENSAJES DE ACCION */}
            {mensajeAccion && (
              <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in ${
                mensajeAccion.tipo === 'exito' 
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                  : mensajeAccion.tipo === 'error'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}>
                {mensajeAccion.tipo === 'exito' && <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />}
                {mensajeAccion.tipo === 'error' && <XCircle size={20} className="shrink-0 text-rose-400" />}
                {mensajeAccion.tipo === 'advertencia' && <AlertTriangle size={20} className="shrink-0 text-amber-400" />}
                <span className="text-xs font-bold">{mensajeAccion.texto}</span>
              </div>
            )}

            {/* ERROR DE BÚSQUEDA */}
            {errorBusqueda && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                  <XCircle size={24} />
                </div>
                <h3 className="text-sm font-black text-rose-300">{errorBusqueda}</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Verificá que el código QR corresponda a la ceremonia actual o intentá buscar por número de documento del graduado o invitado.
                </p>
                <button
                  onClick={limpiarResultado}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Nueva Búsqueda
                </button>
              </div>
            )}

            {/* FICHA DE RESULTADO */}
            {resultado && !errorBusqueda ? (
              <div className="bg-slate-900/85 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-5">
                
                {/* CABECERA DEL GRUPO */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                      {resultado.tipo === 'grupo' ? 'Acreditación Grupal' : 'Pase Individual'}
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                      {egresadoActual?.nombre || 'Graduado'}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {egresadoActual?.carrera || 'Carrera no especificada'} · DNI: <strong className="text-slate-300">{egresadoActual?.dni}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {resultado.tipo === 'grupo' && !todosAcreditados && (
                      <button
                        id="btn-porteria-acreditar-grupo"
                        onClick={manejarAcreditarGrupo}
                        disabled={procesandoAcreditacion}
                        className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-slate-950 font-black text-xs transition active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                      >
                        <UserCheck size={16} />
                        <span>Acreditar Todo el Grupo</span>
                      </button>
                    )}
                    <button
                      onClick={limpiarResultado}
                      className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
                      title="Limpiar y escanear siguiente"
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>
                </div>

                {/* TARJETA DEL GRADUADO */}
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold border border-sky-500/30">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-white">{egresadoActual?.nombre}</strong>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          Graduado
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <Armchair size={13} className="text-amber-400" />
                        <span>Butaca asignada: <strong className="text-amber-300">{egresadoActual?.asiento_id || egresadoActual?.asiento || 'Sin asignar'}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div>
                    {egresadoActual?.presente ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Presente
                      </span>
                    ) : (
                      <button
                        id="btn-porteria-acreditar-individual"
                        onClick={manejarAcreditarEgresado}
                        disabled={procesandoAcreditacion}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs transition cursor-pointer shadow-md shadow-sky-500/20"
                      >
                        Acreditar
                      </button>
                    )}
                  </div>
                </div>

                {/* LISTA DE ACOMPAÑANTES */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Users size={15} className="text-violet-400" />
                    <span>Acompañantes Registrados ({listaInvitados.length})</span>
                  </h3>

                  {listaInvitados.length > 0 ? (
                    <div className="space-y-2.5">
                      {listaInvitados.map((inv) => (
                        <div key={inv.id} className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <strong className="text-xs sm:text-sm font-bold text-slate-200 truncate">{inv.nombre}</strong>
                              <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                {inv.relacion || 'Acompañante'}
                              </span>
                              {Boolean(inv.discapacidad) && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                  <Accessibility size={12} /> Accesibilidad
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                              <span>DNI: <strong className="text-slate-300">{inv.dni}</strong></span>
                              <span>·</span>
                              <span>Butaca: <strong className="text-amber-300">{inv.asiento_id || inv.asiento_solicitado_id || 'Sin asignar'}</strong></span>
                            </p>
                          </div>

                          <div>
                            {inv.presente ? (
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-1">
                                <CheckCircle2 size={13} /> Presente
                              </span>
                            ) : (
                              <button
                                onClick={() => manejarAcreditarInvitado(inv.id, inv.nombre, inv.asiento_id)}
                                disabled={procesandoAcreditacion}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-200 font-bold text-xs transition cursor-pointer border border-slate-700"
                              >
                                Acreditar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
                      <p className="text-xs text-slate-500 font-medium">Este graduado no registró acompañantes.</p>
                    </div>
                  )}
                </div>

              </div>
            ) : !errorBusqueda && (
              <div className="bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-3 backdrop-blur-md">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 text-sky-400 mx-auto flex items-center justify-center shadow-inner">
                  <QrCode size={32} />
                </div>
                <h3 className="text-base font-black text-slate-300">Esperando escaneo o búsqueda</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Escaneá la credencial con la cámara, utilizá la pistola de código de barras o buscá manualmente por DNI para registrar el ingreso.
                </p>
              </div>
            )}

          </div>

        </main>
      )}

      {/* VISTA 3: MONITOR DE SALA & FEED DE INGRESOS EN TIEMPO REAL */}
      {modalidad === 'monitor' && (
        <main className="max-w-7xl mx-auto space-y-6 my-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md hover:border-slate-700 transition">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Aforo Presente</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400">{stats?.presentes || 0}</span>
                <span className="text-xs font-bold text-slate-400">
                  / {stats?.totalInvitados ? (stats.totalInvitados + (stats.totalEgresados || 0)) : '—'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Graduados e invitados dentro del recinto</p>
            </div>

            <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md hover:border-slate-700 transition">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Graduados Presentes</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-sky-400">{stats?.egresadosPresentes || stats?.presentes || 0}</span>
                <span className="text-xs font-bold text-slate-400">/ {stats?.totalEgresados || '—'}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Titulares acreditados para entrega</p>
            </div>

            <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md hover:border-slate-700 transition">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Terminales Móviles</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-indigo-400">{dispositivosMoviles.length}</span>
                <span className="text-xs font-bold text-slate-400">celular(es)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">Equipos de portería sincronizando</p>
            </div>

            <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md hover:border-slate-700 transition">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Estado del Padrón</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-black ${estaOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {estaOnline ? 'Online (En Línea)' : 'Offline (Local)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                {pendientesOffline > 0 ? `${pendientesOffline} en cola offline` : 'Base de datos sincronizada'}
              </p>
            </div>
          </div>

          {/* FEED EN TIEMPO REAL */}
          <div className="bg-slate-900/85 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-sky-400" />
                <h3 className="text-sm font-black text-white">Registro de Actividad en Puerta</h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                Mostrando últimos {historialIngresos.length} accesos
              </span>
            </div>

            {historialIngresos.length > 0 ? (
              <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-2">
                {historialIngresos.map((item) => (
                  <div key={item.id} className="p-3.5 bg-slate-900/70 border border-slate-750 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-white block">{item.nombre}</strong>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {item.rol} · Butaca: <strong className="text-amber-300">{item.asiento}</strong>
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 font-semibold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 shrink-0">
                      {item.hora}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Users size={32} className="mx-auto text-slate-600" />
                <p className="text-xs font-medium">Aún no se registraron ingresos en esta sesión.</p>
                <p className="text-[11px] text-slate-600">A medida que la app Flutter o el puesto de mesa acredite, aparecerán aquí al instante.</p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* MODAL DE RESUMEN EJECUTIVO, BALANCE Y AGRADECIMIENTO */}
      {mostrarResumenFinal && (
        <ModalResumenDemostracion
          ceremonia={ceremonia}
          graduados={[]}
          invitados={[]}
          butacasAsignadas={stats?.presentes || 0}
          onCerrar={() => {
            setMostrarResumenFinal(false)
            if (onVolver) onVolver()
          }}
          onReiniciar={() => {
            setMostrarResumenFinal(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

