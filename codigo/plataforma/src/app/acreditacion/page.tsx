'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { 
  Camera, CheckCircle2, AlertTriangle, ShieldCheck, 
  RotateCcw, Volume2, VolumeX, Users, User, ArrowLeft,
  Sparkles, RefreshCw, Smartphone, Flashlight, FlashlightOff,
  Search, X, Loader2, Wifi, WifiOff, Check, UserCheck, Armchair
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface EgresadoDatos {
  id: string
  nombre: string
  dni: string
  legajo?: string
  carrera?: string
  asiento_id?: string
  presente?: boolean
}

interface InvitadoDatos {
  id: string
  nombre: string
  dni: string
  relacion?: string
  asiento_id?: string
  asiento_solicitado_id?: string
  presente?: boolean
  discapacidad?: boolean
}

interface ResultadoAcreditacion {
  tipo: 'grupo' | 'individual'
  egresado?: EgresadoDatos
  invitados?: InvitadoDatos[]
  invitado?: InvitadoDatos
  ceremonia?: {
    id: string
    nombre: string
    lugar?: string
  }
}

function ContenidoLectorMovil() {
  const searchParams = useSearchParams()
  const tokenParam = searchParams.get('token') || 'porteria-movil-sesion-directa'

  // Estados de cámara y hardware
  const [iniciandoCamara, setIniciandoCamara] = useState(false)
  const [camaraActiva, setCamaraActiva] = useState(false)
  const [errorCamara, setErrorCamara] = useState<string | null>(null)
  const [torchDisponible, setTorchDisponible] = useState(false)
  const [torchEncendida, setTorchEncendida] = useState(false)

  // Estados de operación
  const [procesandoCodigo, setProcesandoCodigo] = useState(false)
  const [ultimoCodigo, setUltimoCodigo] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoAcreditacion | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [errorAcreditacion, setErrorAcreditacion] = useState<string | null>(null)
  
  // Preferencias y conectividad
  const [contadorSesion, setContadorSesion] = useState(0)
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true)
  const [estaOnline, setEstaOnline] = useState(true)

  // Modal / Drawer de búsqueda manual por DNI
  const [drawerDniAbierto, setDrawerDniAbierto] = useState(false)
  const [dniManual, setDniManual] = useState('')
  const [buscandoDni, setBuscandoDni] = useState(false)
  const [errorDniManual, setErrorDniManual] = useState<string | null>(null)

  const html5QrCodeRef = useRef<any>(null)
  const escanerMontadoRef = useRef(false)
  const inputDniRef = useRef<HTMLInputElement>(null)

  // Monitor de conectividad de red
  useEffect(() => {
    if (typeof window === 'undefined') return
    setEstaOnline(navigator.onLine)
    const handleOnline = () => setEstaOnline(true)
    const handleOffline = () => setEstaOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Feedback háptico (vibración física para portería)
  const emitirFeedbackHaptico = (tipo: 'ok' | 'error' | 'aviso') => {
    if (typeof window === 'undefined' || !('vibrate' in navigator)) return
    try {
      if (tipo === 'ok') {
        navigator.vibrate(80) // Pulso nítido de éxito
      } else if (tipo === 'aviso') {
        navigator.vibrate([60, 40, 60]) // Doble pulso
      } else {
        navigator.vibrate([120, 80, 120, 80, 180]) // Triple pulso de advertencia
      }
    } catch {
      // Ignorar si el navegador restringe permisos de vibración
    }
  }

  // Reproducir sonido de confirmación o error vía Web Audio API
  const reproducirBeep = (tipo: 'ok' | 'error') => {
    if (!sonidoHabilitado || typeof window === 'undefined') return
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)

      if (tipo === 'ok') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15)
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.2)
      } else {
        osc.frequency.setValueAtTime(260, audioCtx.currentTime)
        osc.frequency.setValueAtTime(170, audioCtx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.22, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.25)
      }
    } catch {
      // AudioContext restringido
    }
  }

  // Inspeccionar soporte de linterna en el stream de la cámara activa
  const verificarSoporteTorch = () => {
    try {
      const videoElem = document.querySelector('#lector-qr-movil-contenedor video') as HTMLVideoElement | null
      const track = (videoElem?.srcObject as MediaStream)?.getVideoTracks()?.[0]
      if (track && typeof track.getCapabilities === 'function') {
        const capabilities: any = track.getCapabilities()
        setTorchDisponible(Boolean(capabilities && 'torch' in capabilities))
      } else {
        setTorchDisponible(false)
      }
    } catch {
      setTorchDisponible(false)
    }
  }

  // Conmutar linterna / antorcha
  const alternarLinterna = async () => {
    if (!torchDisponible) return
    try {
      const videoElem = document.querySelector('#lector-qr-movil-contenedor video') as HTMLVideoElement | null
      const track = (videoElem?.srcObject as MediaStream)?.getVideoTracks()?.[0]
      if (track) {
        const nuevoEstado = !torchEncendida
        await (track as any).applyConstraints({
          advanced: [{ torch: nuevoEstado }]
        })
        setTorchEncendida(nuevoEstado)
        emitirFeedbackHaptico('aviso')
      }
    } catch (err) {
      console.warn('Error al activar linterna en el dispositivo:', err)
    }
  }

  // Inicializar escáner con html5-qrcode optimizado para móviles
  const iniciarEscaner = async () => {
    setErrorCamara(null)
    setIniciandoCamara(true)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop()
        } catch {}
      }

      const html5QrCode = new Html5Qrcode('lector-qr-movil-contenedor')
      html5QrCodeRef.current = html5QrCode

      const qrConfig = {
        fps: 20,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0
      }

      await html5QrCode.start(
        { facingMode: 'environment' },
        qrConfig,
        (decodedText: string) => {
          manejarCodigoDetectado(decodedText)
        },
        () => {
          // Frame continuo sin código detectado
        }
      )

      setCamaraActiva(true)
      setIniciandoCamara(false)

      // Verificar linterna unos milisegundos tras encendido
      setTimeout(verificarSoporteTorch, 600)
    } catch (err: any) {
      console.error('Error al encender cámara móvil:', err)
      setErrorCamara('No se pudo acceder a la cámara trasera. Asegurate de habilitar los permisos del navegador.')
      setIniciandoCamara(false)
      setCamaraActiva(false)
    }
  }

  useEffect(() => {
    escanerMontadoRef.current = true
    iniciarEscaner()

    return () => {
      escanerMontadoRef.current = false
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop()
        } catch {}
      }
    }
  }, [])

  // Buscar código escaneado o ingresado
  const manejarCodigoDetectado = async (codigo: string) => {
    if (procesandoCodigo || codigo === ultimoCodigo) return
    setProcesandoCodigo(true)
    setUltimoCodigo(codigo)
    setErrorAcreditacion(null)
    setMensajeExito(null)

    try {
      const tokenAuth = tokenParam.startsWith('bearer ') ? tokenParam : `Bearer ${tokenParam}`
      const res = await fetch('/api/invitados/buscar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tokenAuth,
          'x-sigic-demo': '1'
        },
        body: JSON.stringify({ codigo })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Credencial no encontrada en el sistema')
      }

      setResultado(data)
      reproducirBeep('ok')
      emitirFeedbackHaptico('ok')
    } catch (err: any) {
      reproducirBeep('error')
      emitirFeedbackHaptico('error')
      setErrorAcreditacion(err.message || 'Código no reconocido')
      setTimeout(() => {
        setUltimoCodigo(null)
      }, 2500)
    } finally {
      setProcesandoCodigo(false)
    }
  }

  // Búsqueda manual por DNI desde el drawer
  const ejecutarBusquedaDniManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dniManual.trim()) return
    setBuscandoDni(true)
    setErrorDniManual(null)

    try {
      await manejarCodigoDetectado(dniManual.trim())
      setDrawerDniAbierto(false)
      setDniManual('')
    } catch (err: any) {
      setErrorDniManual(err.message || 'DNI no encontrado')
    } finally {
      setBuscandoDni(false)
    }
  }

  // Acreditar grupo completo (Egresado + acompañantes)
  const acreditarGrupoCompleto = async () => {
    if (!resultado || !resultado.egresado) return
    setProcesandoCodigo(true)
    try {
      const tokenAuth = tokenParam.startsWith('bearer ') ? tokenParam : `Bearer ${tokenParam}`
      const invitadoIds = (resultado.invitados || []).map(i => i.id)

      const res = await fetch(`/api/egresados/${resultado.egresado.id}/presente-grupo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tokenAuth,
          'x-sigic-demo': '1'
        },
        body: JSON.stringify({
          acreditarEgresado: true,
          invitadoIds
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al registrar ingreso grupal')

      reproducirBeep('ok')
      emitirFeedbackHaptico('ok')
      const totalIngresos = 1 + (invitadoIds.length || 0)
      setContadorSesion(prev => prev + totalIngresos)
      setMensajeExito(`¡Ingreso Acreditado! (${resultado.egresado.nombre} y ${invitadoIds.length} acompañantes)`)

      setResultado(prev => {
        if (!prev || !prev.egresado) return null
        return {
          ...prev,
          egresado: { ...prev.egresado, presente: true },
          invitados: (prev.invitados || []).map(inv => ({ ...inv, presente: true }))
        }
      })

      setTimeout(() => {
        setResultado(null)
        setMensajeExito(null)
        setUltimoCodigo(null)
      }, 2600)

    } catch (err: any) {
      reproducirBeep('error')
      emitirFeedbackHaptico('error')
      setErrorAcreditacion(err.message || 'Error al acreditar grupo')
    } finally {
      setProcesandoCodigo(false)
    }
  }

  // Acreditar un acompañante individual
  const acreditarInvitado = async (invitadoId: string) => {
    setProcesandoCodigo(true)
    try {
      const tokenAuth = tokenParam.startsWith('bearer ') ? tokenParam : `Bearer ${tokenParam}`
      const res = await fetch(`/api/invitados/${invitadoId}/presente`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tokenAuth,
          'x-sigic-demo': '1'
        }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al registrar ingreso de acompañante')

      reproducirBeep('ok')
      emitirFeedbackHaptico('ok')
      setContadorSesion(prev => prev + 1)
      setResultado(prev => {
        if (!prev) return null
        return {
          ...prev,
          invitados: (prev.invitados || []).map(inv => inv.id === invitadoId ? { ...inv, presente: true } : inv),
          invitado: prev.invitado?.id === invitadoId ? { ...prev.invitado, presente: true } : prev.invitado
        }
      })
    } catch (err: any) {
      reproducirBeep('error')
      emitirFeedbackHaptico('error')
      setErrorAcreditacion(err.message || 'Error al registrar acompañante')
    } finally {
      setProcesandoCodigo(false)
    }
  }

  const reiniciarEscaneo = () => {
    setResultado(null)
    setErrorAcreditacion(null)
    setMensajeExito(null)
    setUltimoCodigo(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* HEADER MÓVIL SUPERIOR (ACCESIBLE Y CONFIABLE) */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/90 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-sm text-white shadow-md shadow-sky-500/25">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wide text-white">SiGIC LECTOR</h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                v0.3.6
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${estaOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <p className="text-[11px] font-semibold text-slate-300">
                {estaOnline ? 'En línea · Acreditación Oficial' : 'Modo local sin conexión'}
              </p>
            </div>
          </div>
        </div>

        {/* ACCIONES DEL HEADER (TARGETS > 44px) */}
        <div className="flex items-center gap-2">
          {/* Contador de acreditados en esta terminal */}
          <div 
            className="h-11 px-3 bg-slate-800/90 rounded-xl border border-slate-700/80 flex items-center gap-2 text-xs font-mono font-bold"
            title="Total acreditados en esta sesión"
          >
            <Users size={14} className="text-emerald-400" aria-hidden="true" />
            <span className="text-emerald-300 text-sm">{contadorSesion}</span>
          </div>

          {/* Toggle de sonido accesible */}
          <button
            onClick={() => {
              setSonidoHabilitado(!sonidoHabilitado)
              emitirFeedbackHaptico('aviso')
            }}
            className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700/80 active:scale-95 flex items-center justify-center text-slate-200 focus-visible:ring-2 focus-visible:ring-sky-400 transition cursor-pointer"
            aria-label={sonidoHabilitado ? 'Silenciar sonidos de escaneo' : 'Activar sonidos de confirmación'}
            aria-pressed={sonidoHabilitado}
          >
            {sonidoHabilitado ? <Volume2 size={18} /> : <VolumeX size={18} className="text-rose-400" />}
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL MÓVIL */}
      <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full space-y-4">

        {/* VISOR DE CÁMARA CON HUD TÁCTIL Y LÁSER */}
        <div className={`relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex flex-col items-center justify-center transition-all duration-300 ${
          resultado ? 'h-44 shrink-0 opacity-75' : 'h-[360px] sm:h-[400px]'
        }`}>
          <div id="lector-qr-movil-contenedor" className="w-full h-full object-cover" />

          {/* RETÍCULA PROFESIONAL HUD CON LÁSER DE ESCANEO */}
          {!resultado && camaraActiva && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-60 h-60 border-2 border-dashed border-sky-400/80 rounded-3xl relative shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                {/* Esquinas resaltadas */}
                <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-sky-400 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-sky-400 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-sky-400 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-sky-400 rounded-br-xl" />

                {/* Línea láser animada */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse top-1/2 -translate-y-1/2" />
              </div>

              <p className="text-xs font-bold text-sky-200 mt-4 bg-slate-950/85 px-4 py-1.5 rounded-full border border-sky-500/30 backdrop-blur-md shadow-lg">
                Apuntá al código QR del graduado o acompañante
              </p>
            </div>
          )}

          {/* LOADER INICIANDO CÁMARA */}
          {iniciandoCamara && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={32} className="animate-spin text-sky-400" aria-hidden="true" />
              <p className="text-xs text-slate-200 font-semibold tracking-wide">Iniciando cámara trasera...</p>
            </div>
          )}

          {/* FALLO DE CÁMARA CON ACCIÓN DE REINTENTO */}
          {errorCamara && (
            <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center gap-3">
              <AlertTriangle size={36} className="text-amber-400" aria-hidden="true" />
              <p className="text-xs text-slate-200 max-w-xs">{errorCamara}</p>
              <button
                onClick={iniciarEscaner}
                className="min-h-[44px] px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer active:scale-95 transition"
              >
                Reintentar encender cámara
              </button>
            </div>
          )}
        </div>

        {/* BARRA DE HERRAMIENTAS DE PORTERÍA (LINTERNA + BÚSQUEDA MANUAL) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Botón Linterna (Torch) */}
          <button
            onClick={alternarLinterna}
            disabled={!camaraActiva || !torchDisponible}
            className={`min-h-[48px] rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition cursor-pointer active:scale-95 border ${
              torchEncendida
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 disabled:opacity-40'
            }`}
            aria-label={torchEncendida ? 'Apagar linterna' : 'Encender linterna'}
            aria-pressed={torchEncendida}
          >
            {torchEncendida ? <FlashlightOff size={18} /> : <Flashlight size={18} />}
            <span>{torchEncendida ? 'Linterna activa' : 'Luz / Linterna'}</span>
          </button>

          {/* Botón Búsqueda Manual por DNI */}
          <button
            onClick={() => {
              setDrawerDniAbierto(true)
              emitirFeedbackHaptico('aviso')
            }}
            className="min-h-[48px] rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 hover:text-sky-300 flex items-center justify-center gap-2 text-xs font-black active:scale-95 transition cursor-pointer"
            aria-label="Abrir buscador manual por DNI"
          >
            <Search size={18} />
            <span>Buscar por DNI</span>
          </button>
        </div>

        {/* FEEDBACK DE ESTADO Y LIVE REGIONS PARA LECTORES DE PANTALLA */}
        <div aria-live="polite" className="sr-only">
          {procesandoCodigo && 'Consultando credencial en base de datos...'}
          {mensajeExito && mensajeExito}
        </div>

        {procesandoCodigo && (
          <div className="p-3 bg-sky-500/15 border border-sky-500/35 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-sky-200 animate-pulse">
            <RefreshCw size={15} className="animate-spin text-sky-400" />
            <span>Consultando credencial en tiempo real...</span>
          </div>
        )}

        {errorAcreditacion && (
          <div role="alert" className="p-3.5 bg-rose-500/20 border border-rose-500/50 rounded-2xl flex items-center justify-between gap-2 text-xs font-bold text-rose-200 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} className="text-rose-400 shrink-0" aria-hidden="true" />
              <span>{errorAcreditacion}</span>
            </div>
            <button
              onClick={reiniciarEscaneo}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-rose-200 hover:text-white rounded-xl active:scale-95"
              aria-label="Descartar error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {mensajeExito && (
          <div className="p-4 bg-emerald-500/25 border border-emerald-500/50 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-black text-emerald-200 shadow-xl shadow-emerald-500/15 animate-in zoom-in-95">
            <CheckCircle2 size={20} className="text-emerald-400" aria-hidden="true" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* TARJETA DE RESULTADO DE ACREDITACIÓN / ACCIÓN OPERATIVA */}
        {resultado && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4">
            
            {/* CABECERA CON DATOS DEL ASISTENTE */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/35 inline-block mb-1.5">
                  {resultado.tipo === 'grupo' ? 'Pase Grupal (Egresado)' : 'Pase Individual (Invitado)'}
                </span>
                <h2 className="text-base font-black text-white truncate">
                  {resultado.egresado?.nombre || resultado.invitado?.nombre}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  DNI: <strong className="text-white font-mono">{resultado.egresado?.dni || resultado.invitado?.dni}</strong>
                  {resultado.egresado?.legajo && <span> · Leg: {resultado.egresado.legajo}</span>}
                </p>
                <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                  {resultado.egresado?.carrera || 'Tecnicatura Superior en Analista de Sistemas'}
                </p>
              </div>

              {/* Butaca destacada */}
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Butaca</span>
                <span className="text-sm font-mono font-black text-amber-300 bg-amber-500/15 border border-amber-500/35 px-3 py-1 rounded-xl block mt-1">
                  {resultado.egresado?.asiento_id || resultado.invitado?.asiento_id || 'Sin asignar'}
                </span>
              </div>
            </div>

            {/* ACOMPAÑANTES REGISTRADOS */}
            {resultado.tipo === 'grupo' && resultado.invitados && resultado.invitados.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-bold px-1">
                  <span>Acompañantes ({resultado.invitados.length})</span>
                  <span>Ubicación</span>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {resultado.invitados.map(inv => (
                    <div 
                      key={inv.id}
                      className="bg-slate-950/70 border border-slate-800/90 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <strong className="text-slate-100 block truncate">{inv.nombre}</strong>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          DNI {inv.dni} · {inv.relacion || 'Acompañante'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-bold text-amber-300 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                          {inv.asiento_id || 'Sin butaca'}
                        </span>

                        {inv.presente ? (
                          <span className="h-10 px-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1">
                            <Check size={14} /> Adentro
                          </span>
                        ) : (
                          <button
                            onClick={() => acreditarInvitado(inv.id)}
                            className="min-h-[44px] px-3.5 py-1.5 text-xs font-bold text-sky-200 bg-sky-500/20 hover:bg-sky-500/30 rounded-xl border border-sky-500/40 cursor-pointer active:scale-95 transition"
                          >
                            Dar paso
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BOTONES DE ACCIÓN DE GRAN IMPACTO (MÍNIMO 48px TÁCTILES) */}
            <div className="pt-2 space-y-2.5">
              {resultado.tipo === 'grupo' ? (
                <button
                  onClick={acreditarGrupoCompleto}
                  disabled={procesandoCodigo || (resultado.egresado?.presente && (resultado.invitados || []).every(i => i.presente))}
                  className="w-full min-h-[50px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  <span>
                    {resultado.egresado?.presente 
                      ? 'Reacreditar Grupo Completo' 
                      : `Acreditar Ingreso Completo (${1 + (resultado.invitados?.length || 0)} personas)`}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => resultado.invitado && acreditarInvitado(resultado.invitado.id)}
                  disabled={procesandoCodigo || Boolean(resultado.invitado?.presente)}
                  className="w-full min-h-[50px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  <span>{resultado.invitado?.presente ? 'Ya se encuentra presente' : 'Acreditar Asistencia'}</span>
                </button>
              )}

              <button
                onClick={reiniciarEscaneo}
                className="w-full min-h-[44px] bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-bold text-xs rounded-xl active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                <span>Escanear siguiente credencial</span>
              </button>
            </div>

          </div>
        )}

        {/* PIE INSTITUCIONAL INFORMATIVO */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3.5 text-center text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-slate-200 flex items-center justify-center gap-1.5">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>Puesto de Portería Oficial Móvil</span>
          </p>
          <p className="text-[11px] text-slate-400">
            Validación criptográfica directa sin necesidad de instalar aplicaciones.
          </p>
        </div>

      </main>

      {/* DRAWER / MODAL TÁCTIL DE BÚSQUEDA MANUAL POR DNI */}
      {drawerDniAbierto && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-drawer-dni"
        >
          <div 
            className="absolute inset-0" 
            onClick={() => setDrawerDniAbierto(false)} 
            aria-hidden="true" 
          />

          <div className="relative w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-10 animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 id="titulo-drawer-dni" className="text-base font-black text-white flex items-center gap-2">
                <Search size={18} className="text-sky-400" />
                <span>Búsqueda Manual por DNI</span>
              </h2>
              <button
                onClick={() => setDrawerDniAbierto(false)}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white bg-slate-800/60 active:scale-95"
                aria-label="Cerrar búsqueda manual"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={ejecutarBusquedaDniManual} className="mt-4 space-y-4">
              <div>
                <label htmlFor="dni-manual-input" className="block text-xs font-bold text-slate-300 mb-1.5">
                  Número de Documento del Graduado o Invitado
                </label>
                <input
                  id="dni-manual-input"
                  ref={inputDniRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={dniManual}
                  onChange={(e) => setDniManual(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej: 35230531"
                  className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-sky-500 tracking-wider"
                  autoFocus
                  required
                />
              </div>

              {errorDniManual && (
                <div role="alert" className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs font-bold text-rose-300 flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>{errorDniManual}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={buscandoDni || dniManual.length < 6}
                className="w-full min-h-[48px] bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition shadow-lg shadow-sky-500/20"
              >
                {buscandoDni ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                <span>Buscar en Padrón Oficial</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default function PaginaAcreditacionMovil() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
          <RefreshCw size={18} className="animate-spin" />
          <span>Cargando lector móvil de portería...</span>
        </div>
      </div>
    }>
      <ContenidoLectorMovil />
    </Suspense>
  )
}
