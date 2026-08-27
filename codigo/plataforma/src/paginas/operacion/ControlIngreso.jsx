'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Camera, CameraOff, QrCode, Search, CheckCircle2, AlertTriangle, XCircle, 
  Users, GraduationCap, Armchair, Clock, UserCheck, RefreshCw, Volume2, 
  VolumeX, ShieldCheck, ArrowRight, Sparkles, Check, Accessibility, CalendarDays,
  Smartphone, Download, Radio, Shield, Copy, CheckCheck, Globe, Wifi, KeyRound,
  ExternalLink, Layers
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
  desvincularDispositivoAdmin
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

  // Modalidad de Acreditación: 'flutter' (por defecto) o 'respaldo_web'
  const [modalidad, setModalidad] = useState('flutter')
  const [dispositivosMoviles, setDispositivosMoviles] = useState([])
  const [cargandoDispositivos, setCargandoDispositivos] = useState(false)
  const [copiadoApk, setCopiadoApk] = useState(false)
  const [copiadoServidor, setCopiadoServidor] = useState(false)
  const [urlApk, setUrlApk] = useState(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/descargas/SIGIC-Porteria-1.0.4.apk`
    }
    return 'https://sigic.com.ar/descargas/SIGIC-Porteria-1.0.4.apk'
  })
  const [urlServidor, setUrlServidor] = useState(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api`
    }
    return 'https://sigic.com.ar/api'
  })

  const html5QrCodeRef = useRef(null)
  const inputBusquedaRef = useRef(null)
  const bufferTecladoRef = useRef('')
  const ultimoKeyTimeRef = useRef(0)

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

  function copiarTexto(texto, tipo) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(texto)
      if (tipo === 'apk') {
        setCopiadoApk(true)
        setTimeout(() => setCopiadoApk(false), 2000)
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
    <div className="min-h-screen bg-slate-900 text-slate-100 p-3 sm:p-6 font-sans">
      {/* HEADER PRINCIPAL */}
      <header className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shadow-lg shadow-sky-500/10">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Control de Acreditación</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider">
                En Vivo
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <CalendarDays size={13} className="text-sky-400" />
                {ceremonia?.nombre || 'Ceremonia en curso'} · {ceremonia?.lugar || 'Sede Central'}
              </span>
              {ceremoniasDisponibles.length > 1 && (
                <div className="flex items-center gap-1.5 ml-1">
                  <span className="text-[10px] uppercase font-extrabold text-slate-500">Puesto:</span>
                  <select
                    value={ceremonia?.id || ''}
                    onChange={(e) => handleCambiarCeremonia(e.target.value)}
                    disabled={cambiandoCeremonia}
                    className="text-[11px] font-bold bg-slate-800 text-sky-300 border border-slate-700 rounded-lg px-2 py-0.5 outline-none cursor-pointer hover:bg-slate-700 transition"
                    title="Cambiar ceremonia activa para esta terminal"
                  >
                    {ceremoniasDisponibles.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.nombre} {c.activa === 1 || c.activa === true ? '★' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controles de Sonido y Salida */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setSonidoHabilitado(!sonidoHabilitado)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border cursor-pointer ${
              sonidoHabilitado 
                ? 'bg-slate-800/90 text-sky-400 border-slate-700 hover:bg-slate-700' 
                : 'bg-slate-800/40 text-slate-500 border-slate-800 hover:bg-slate-800'
            }`}
            title={sonidoHabilitado ? 'Sonido activado' : 'Sonido desactivado'}
          >
            {sonidoHabilitado ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="hidden sm:inline">{sonidoHabilitado ? 'Sonido' : 'Silencio'}</span>
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
      <div className="max-w-7xl mx-auto mt-4 px-4 py-2.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${estaOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400 animate-pulse'}`} />
          <span className="font-bold text-slate-200">
            {estaOnline ? 'Terminal conectada · Validación en tiempo real' : 'Modo sin conexión · Validando con padrón local'}
          </span>
          {manifiestoDescargado && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 text-[10px] font-medium">
              Padrón local listo
            </span>
          )}
        </div>

        {pendientesOffline > 0 ? (
          <button
            onClick={sincronizarPendientes}
            disabled={sincronizandoLote || !estaOnline}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold hover:bg-amber-500/30 disabled:opacity-50 transition active:scale-95 cursor-pointer"
          >
            <RefreshCw size={13} className={sincronizandoLote ? 'animate-spin' : ''} />
            <span>{sincronizandoLote ? 'Sincronizando...' : `Sincronizar ${pendientesOffline} ingreso(s)`}</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-400 font-medium">
            Todos los ingresos sincronizados con la base de datos
          </span>
        )}
      </div>

      {/* METRICAS RAPIDAS DE PUERTA */}
      <section className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
        <div className="bg-slate-800/60 border border-slate-750 p-4 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Acreditados Totales</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
            {stats?.presentes || 0} <span className="text-xs text-slate-400 font-semibold">/ {stats?.totalInvitados ? (stats.totalInvitados + (stats.totalEgresados || 0)) : '—'}</span>
          </p>
        </div>
        <div className="bg-slate-800/60 border border-slate-750 p-4 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Graduados en Sala</span>
          <p className="text-2xl sm:text-3xl font-black text-sky-400 mt-1">
            {stats?.egresadosPresentes || 0} <span className="text-xs text-slate-400 font-semibold">/ {stats?.totalEgresados || 0}</span>
          </p>
        </div>
        <div className="bg-slate-800/60 border border-slate-750 p-4 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Acompañantes en Sala</span>
          <p className="text-2xl sm:text-3xl font-black text-violet-400 mt-1">
            {stats?.invitadosPresentes || 0} <span className="text-xs text-slate-400 font-semibold">/ {stats?.totalInvitados || 0}</span>
          </p>
        </div>
        <div className="bg-slate-800/60 border border-slate-750 p-4 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Porcentaje de Asistencia</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
            {stats?.porcentajeAsistencia || 0}%
          </p>
        </div>
      </section>

      {/* SELECTOR DE MODALIDAD FLUTTER / RESPALDO */}
      <div className="max-w-7xl mx-auto my-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 shadow-md">
          <button
            onClick={() => setModalidad('flutter')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              modalidad === 'flutter' 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone size={15} /> Terminal Móvil Flutter (Recomendado)
          </button>
          <button
            onClick={() => setModalidad('respaldo_web')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              modalidad === 'respaldo_web' 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera size={15} /> Respaldo Web / Escáner de Emergencia
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] text-slate-300 font-bold">
            {dispositivosMoviles.length} terminal(es) Flutter vinculada(s)
          </span>
        </div>
      </div>

      {/* VISTA 1: TERMINAL MÓVIL FLUTTER (PRINCIPAL) */}
      {modalidad === 'flutter' && (
        <main className="max-w-7xl mx-auto space-y-6">
          
          {/* TARJETAS QR PARA FLUTTER: DESCARGA DE APK Y EMPAREJAMIENTO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* TARJETA 1: DESCARGAR APK FLUTTER */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                      <Download size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">1. Descargar App Flutter (APK)</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instalación en dispositivos Android</p>
                    </div>
                  </div>
                  <span className="text-[9px] px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-black border border-sky-500/30 uppercase tracking-widest">
                    v1.0.4+5
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="p-4 bg-white rounded-2xl shadow-md shrink-0">
                    <QRCodeSVG value={urlApk} size={140} level="M" />
                  </div>

                  <div className="space-y-3 text-xs text-slate-300">
                    <p className="font-medium leading-relaxed">
                      Escaneá este código QR desde el teléfono de portería para descargar directamente el instalador oficial de la aplicación móvil Flutter.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href="/descargas/SIGIC-Porteria-1.0.4.apk"
                        download="SIGIC-Porteria-1.0.4.apk"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black transition active:scale-95 shadow-md shadow-sky-500/20 cursor-pointer"
                      >
                        <Download size={14} /> Descargar APK
                      </a>
                      <button
                        onClick={() => copiarTexto(urlApk, 'apk')}
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer"
                      >
                        {copiadoApk ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copiadoApk ? 'Enlace copiado' : 'Copiar enlace'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>Archivo: SIGIC-Porteria-1.0.4.apk</span>
                <span className="text-emerald-400 font-bold">Producción Oficial</span>
              </div>
            </div>

            {/* TARJETA 2: VINCULAR TELÉFONO FLUTTER (LOGIN INSTANTÁNEO) */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">2. Vincular Terminal Móvil</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emparejamiento y login por cámara</p>
                    </div>
                  </div>
                  <span className="text-[9px] px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/30 uppercase tracking-widest">
                    Sin Contraseña
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="p-4 bg-white rounded-2xl shadow-md shrink-0">
                    <QRCodeSVG value={`sigic-config:${urlServidor}`} size={140} level="H" />
                  </div>

                  <div className="space-y-3 text-xs text-slate-300">
                    <p className="font-medium leading-relaxed">
                      Abrí la app Flutter en el dispositivo de seguridad y seleccioná <strong>Escanear QR de Conexión</strong> para autenticarte y enlazar la ceremonia activa automáticamente.
                    </p>
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Servidor API:</span>
                      <code className="text-[11px] font-mono text-cyan-300 font-bold block truncate">{urlServidor}</code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>Protocolo: TLS / WebSocket Sync</span>
                <span className="text-sky-400 font-bold">Ceremonia: {ceremonia?.nombre || 'Activa'}</span>
              </div>
            </div>

          </div>

          {/* DISPOSITIVOS FLUTTER CONECTADOS Y FEED DE INGRESOS EN VIVO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* COLUMNA IZQUIERDA: TERMINALES ACTIVAS (5 COLS) */}
            <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Terminales Móviles en Puerta</h3>
                </div>
                <button
                  onClick={cargarDispositivos}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Refrescar dispositivos"
                >
                  <RefreshCw size={13} className={cargandoDispositivos ? 'animate-spin' : ''} />
                </button>
              </div>

              {dispositivosMoviles.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-700/40 space-y-2">
                  <Smartphone size={32} className="mx-auto text-slate-600" />
                  <h4 className="text-xs font-bold text-slate-300">Esperando conexión de terminales</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Escaneá el código QR superior desde la app Flutter para iniciar el puesto de portería.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dispositivosMoviles.map((disp) => (
                    <div key={disp.dispositivoId} className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-700/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                          <Smartphone size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{disp.nombreDispositivo || disp.modelo || 'Terminal Android'}</h4>
                          <p className="text-[10px] text-slate-400">{disp.marca || 'Flutter App'} · IP: {disp.ipUltimoAcceso || '127.0.0.1'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase">
                        En Línea
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: FEED DE ACREDITACIONES EN VIVO (7 COLS) */}
            <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <Radio size={14} className="text-red-400 animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Ingresos Registrados en Tiempo Real</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  {historialIngresos.length} accesos recientes
                </span>
              </div>

              {historialIngresos.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-700/40 space-y-2">
                  <Clock size={32} className="mx-auto text-slate-600" />
                  <h4 className="text-xs font-bold text-slate-300">Sin ingresos en este turno todavía</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">A medida que los guardias escaneen los pases QR con la app Flutter, los ingresos aparecerán aquí en vivo.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {historialIngresos.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/60 flex items-center justify-between gap-3 text-xs animate-in fade-in">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <div>
                          <strong className="text-white font-bold block">{item.nombre}</strong>
                          <span className="text-[10px] text-slate-400">{item.rol} · Butaca: {item.asiento}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-emerald-400">{item.hora}</span>
                    </div>
                  ))}
                </div>
              )}
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
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-xl">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Búsqueda Rápida / Pistola USB</span>
                <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-700 text-sky-300 font-bold">Autodetect</span>
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
                    ref={inputBusquedaRef}
                    type="text"
                    value={busquedaManual}
                    onChange={(e) => setBusquedaManual(e.target.value)}
                    placeholder="DNI, Token o código escaneado..."
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-medium transition"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={cargandoBusqueda || !busquedaManual.trim()}
                  className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-black text-xs transition active:scale-95 cursor-pointer shadow-md shadow-sky-500/20"
                >
                  {cargandoBusqueda ? <RefreshCw size={14} className="animate-spin" /> : 'Buscar'}
                </button>
              </form>
            </div>

            {/* VISOR DE CÁMARA QR */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Camera size={15} className="text-sky-400" />
                  <span>Escáner de Cámara Web</span>
                </h2>
                <button
                  onClick={toggleCamara}
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
                <div id="lector-qr-sigic" className={`w-full ${camaraActiva ? 'block' : 'hidden'}`} />

                {!camaraActiva && (
                  <div className="text-center p-6 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto border border-slate-800">
                      <CameraOff size={22} />
                    </div>
                    <p className="text-xs font-bold text-slate-400">Cámara en espera</p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Presioná encender para usar la cámara integrada de la notebook o una webcam USB.
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
                    onChange={(e) => {
                      setCamaraSeleccionadaId(e.target.value)
                      if (camaraActiva) {
                        detenerCamara().then(() => iniciarCamara(e.target.value))
                      }
                    }}
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
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
                
                {/* CABECERA DEL GRUPO */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-700">
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
                        onClick={manejarAcreditarGrupo}
                        disabled={procesandoAcreditacion}
                        className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs transition active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                      >
                        <UserCheck size={16} />
                        <span>Acreditar Todo el Grupo</span>
                      </button>
                    )}
                    <button
                      onClick={limpiarResultado}
                      className="p-2.5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition cursor-pointer"
                      title="Limpiar y escanear siguiente"
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>
                </div>

                {/* TARJETA DEL GRADUADO */}
                <div className="bg-slate-900/60 border border-slate-750 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
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
                        onClick={manejarAcreditarEgresado}
                        disabled={procesandoAcreditacion}
                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition cursor-pointer"
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
                        <div key={inv.id} className="bg-slate-900/60 border border-slate-750 p-3.5 rounded-2xl flex items-center justify-between gap-3">
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
                                className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-sky-500 hover:text-slate-950 text-slate-200 font-bold text-xs transition cursor-pointer"
                              >
                                Acreditar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
                      <p className="text-xs text-slate-500 font-medium">Este graduado no registró acompañantes.</p>
                    </div>
                  )}
                </div>

              </div>
            ) : !errorBusqueda && (
              <div className="bg-slate-800/40 border-2 border-dashed border-slate-750 rounded-3xl p-10 text-center space-y-3">
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
    </div>
  )
}

