'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Camera, CameraOff, QrCode, Search, CheckCircle2, AlertTriangle, XCircle, 
  Users, GraduationCap, Armchair, Clock, UserCheck, RefreshCw, Volume2, 
  VolumeX, ShieldCheck, ArrowRight, Sparkles, Check, Accessibility, CalendarDays
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
  sincronizarLoteAcreditacion
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

  const html5QrCodeRef = useRef(null)
  const inputBusquedaRef = useRef(null)
  const bufferTecladoRef = useRef('')
  const ultimoKeyTimeRef = useRef(0)

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

      {/* ÁREA DE TRABAJO PRINCIPAL */}
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
                <input
                  ref={inputBusquedaRef}
                  type="text"
                  value={busquedaManual}
                  onChange={(e) => setBusquedaManual(e.target.value)}
                  placeholder="Escanear QR, DNI o Token..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 font-bold outline-none focus:border-sky-500 transition"
                  autoFocus
                />
                {busquedaManual && (
                  <button
                    type="button"
                    onClick={() => setBusquedaManual('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={cargandoBusqueda || !busquedaManual.trim()}
                className="px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-black text-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                {cargandoBusqueda ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
            </form>

            <p className="text-[10px] text-slate-400 font-medium mt-2 leading-relaxed">
              Podés escanear con <strong>lector USB</strong>, pegar un código de <strong>Google Wallet</strong> o ingresar el <strong>DNI</strong>.
            </p>
          </div>

          {/* VISOR DE CÁMARA QR */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Camera size={14} className="text-sky-400" />
                <span>Cámara del Dispositivo</span>
              </h2>
              <button
                onClick={() => setCamaraActiva(!camaraActiva)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  camaraActiva 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30'
                }`}
              >
                {camaraActiva ? <CameraOff size={14} /> : <Camera size={14} />}
                {camaraActiva ? 'Apagar Cámara' : 'Encender Cámara'}
              </button>
            </div>

            {camaraActiva ? (
              <div className="space-y-3">
                <div 
                  id="sigic-reader-container" 
                  className="overflow-hidden rounded-2xl border-2 border-dashed border-sky-500/40 bg-slate-950 aspect-square max-h-[300px] w-full flex items-center justify-center"
                />
                {camarasDisponibles.length > 1 && (
                  <select
                    value={camaraSeleccionadaId}
                    onChange={(e) => setCamaraSeleccionadaId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-bold outline-none"
                  >
                    {camarasDisponibles.map((c) => (
                      <option key={c.id} value={c.id}>{c.label || `Cámara ${c.id}`}</option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div 
                onClick={() => setCamaraActiva(true)}
                className="rounded-2xl border border-slate-700 bg-slate-900/60 p-8 text-center cursor-pointer hover:border-sky-500/50 transition group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-sky-500/20 text-slate-400 group-hover:text-sky-400 mx-auto flex items-center justify-center transition">
                  <QrCode size={24} />
                </div>
                <p className="text-xs font-bold text-slate-300 mt-3">Hacé clic para activar el lector QR con cámara</p>
                <p className="text-[10px] text-slate-500 mt-1">Compatible con celulares, tablets y laptops</p>
              </div>
            )}
          </div>

          {/* HISTORIAL RECIENTE DE ACCESOS */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-xl">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Clock size={14} className="text-violet-400" />
              <span>Últimos Ingresos Acreditados</span>
            </h2>
            {historialIngresos.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {historialIngresos.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-900/70 border border-slate-750 p-2.5 rounded-xl text-xs">
                    <div>
                      <strong className="block text-slate-200">{item.nombre}</strong>
                      <span className="text-[10px] text-slate-400 font-medium">{item.rol} · Butaca: <strong className="text-sky-400">{item.asiento}</strong></span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                      {item.hora}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium py-3 text-center">Todavía no hay ingresos registrados en esta sesión.</p>
            )}
          </div>

        </div>

        {/* COLUMNA DERECHA: FICHA DE ACREDITACIÓN DEL GRUPO (7 COLUMNAS) */}
        <div className="lg:col-span-7">
          
          {errorBusqueda && (
            <div className="bg-rose-500/15 border border-rose-500/30 rounded-3xl p-6 text-center space-y-3 animate-in fade-in">
              <XCircle size={40} className="text-rose-400 mx-auto" />
              <h3 className="text-base font-black text-rose-200">Credencial no encontrada</h3>
              <p className="text-xs text-rose-300/90 font-medium max-w-md mx-auto">{errorBusqueda}</p>
              <button
                onClick={limpiarResultado}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs transition cursor-pointer"
              >
                Volver a intentar
              </button>
            </div>
          )}

          {mensajeAccion && (
            <div className={`p-4 rounded-2xl mb-4 border flex items-center gap-3 animate-in fade-in ${
              mensajeAccion.tipo === 'exito' 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              {mensajeAccion.tipo === 'exito' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              <span className="text-xs font-bold">{mensajeAccion.texto}</span>
            </div>
          )}

          {resultado ? (
            <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
              
              {/* CABECERA DEL RESULTADO CON BADGE GIGANTE */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {resultado.tipo === 'individual' ? 'Acreditación Individual' : 'Pase Grupal'}
                    </span>
                    {todosAcreditados ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Check size={14} /> Ya Ingresado
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Sparkles size={14} /> Acceso Habilitado
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                    {egresadoActual?.nombre || 'Graduado'}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    DNI: <strong className="text-slate-200">{egresadoActual?.dni}</strong> · Carrera: <strong className="text-sky-300">{egresadoActual?.carrera || 'Carrera Beltrán'}</strong>
                  </p>
                </div>

                <button
                  onClick={limpiarResultado}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 transition cursor-pointer"
                >
                  Siguiente Escaneo
                </button>
              </div>

              {/* BOTÓN GIGANTE: ACREDITAR TODO EL GRUPO */}
              {!todosAcreditados && (
                <button
                  onClick={manejarAcreditarGrupo}
                  disabled={procesandoAcreditacion}
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] cursor-pointer"
                >
                  {procesandoAcreditacion ? (
                    <RefreshCw size={22} className="animate-spin" />
                  ) : (
                    <>
                      <UserCheck size={22} />
                      Acreditar Todo el Grupo ({1 + listaInvitados.length} Personas)
                    </>
                  )}
                </button>
              )}

              {/* TARJETA DEL EGRESADO */}
              <div className="bg-slate-900/80 border border-slate-750 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <GraduationCap size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-black text-white truncate">{egresadoActual?.nombre}</strong>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">Graduado</span>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                      <Armchair size={13} className="text-amber-400" />
                      Butaca: <strong className="text-amber-300">{egresadoActual?.asiento_id || egresadoActual?.asiento_solicitado_id || 'Sin asignar'}</strong>
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
    </div>
  )
}

