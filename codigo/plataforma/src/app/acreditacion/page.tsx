'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { 
  Camera, CheckCircle2, AlertTriangle, ShieldCheck, 
  RotateCcw, Volume2, VolumeX, Users, User, ArrowLeft,
  Sparkles, RefreshCw, Smartphone
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

  const [iniciandoCamara, setIniciandoCamara] = useState(false)
  const [camaraActiva, setCamaraActiva] = useState(false)
  const [errorCamara, setErrorCamara] = useState<string | null>(null)
  
  const [procesandoCodigo, setProcesandoCodigo] = useState(false)
  const [ultimoCodigo, setUltimoCodigo] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoAcreditacion | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [errorAcreditacion, setErrorAcreditacion] = useState<string | null>(null)
  
  const [contadorSesion, setContadorSesion] = useState(0)
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true)

  const scannerRef = useRef<any>(null)
  const html5QrCodeRef = useRef<any>(null)
  const escanerMontadoRef = useRef(false)

  // Reproducir sonido de confirmación o error
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
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.2)
      } else {
        osc.frequency.setValueAtTime(250, audioCtx.currentTime)
        osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.25)
      }
    } catch {
      // AudioContext no disponible o bloqueado por el navegador
    }
  }

  // Inicializar escáner con html5-qrcode
  const iniciarEscaner = async () => {
    setErrorCamara(null)
    setIniciandoCamara(true)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop()
        } catch {
          // Ya estaba detenido
        }
      }

      const html5QrCode = new Html5Qrcode('lector-qr-movil-contenedor')
      html5QrCodeRef.current = html5QrCode

      const qrConfig = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }

      await html5QrCode.start(
        { facingMode: 'environment' },
        qrConfig,
        (decodedText: string) => {
          manejarCodigoDetectado(decodedText)
        },
        () => {
          // Escaneo frame continuo sin QR, ignorar
        }
      )

      setCamaraActiva(true)
      setIniciandoCamara(false)
    } catch (err: any) {
      console.error('Error al encender cámara móvil:', err)
      setErrorCamara('No se pudo acceder a la cámara trasera. Verificá los permisos del navegador.')
      setIniciandoCamara(false)
      setCamaraActiva(false)
    }
  }

  const detenerCamara = async () => {
    if (html5QrCodeRef.current && camaraActiva) {
      try {
        await html5QrCodeRef.current.stop()
      } catch {
        // Ignorar si falla el stop
      }
    }
    setCamaraActiva(false)
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

  // Buscar código en la API
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
    } catch (err: any) {
      reproducirBeep('error')
      setErrorAcreditacion(err.message || 'Código no reconocido')
      setTimeout(() => {
        setUltimoCodigo(null)
      }, 2500)
    } finally {
      setProcesandoCodigo(false)
    }
  }

  // Acreditar al grupo completo
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
      const totalIngresos = 1 + (invitadoIds.length || 0)
      setContadorSesion(prev => prev + totalIngresos)
      setMensajeExito(`¡Ingreso Acreditado! (${resultado.egresado.nombre} y ${invitadoIds.length} acompañantes)`)

      // Actualizar estado local
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
      }, 2800)

    } catch (err: any) {
      reproducirBeep('error')
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
      setErrorAcreditacion(err.message || 'Error al acreditar acompañante')
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      
      {/* HEADER MÓVIL SUPERIOR */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-xs shadow-md shadow-sky-500/30">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-black tracking-wide text-white">SiGIC LECTOR</h1>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                v0.3.6
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Acreditación Web Móvil Inmediata</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Contador de acreditados en esta sesión móvil */}
          <div className="px-2.5 py-1 bg-slate-800/90 rounded-lg border border-slate-700/80 flex items-center gap-1.5 text-xs font-mono">
            <Users size={12} className="text-emerald-400" />
            <span className="font-bold text-emerald-400">{contadorSesion}</span>
          </div>

          <button
            onClick={() => setSonidoHabilitado(!sonidoHabilitado)}
            className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
            title="Sonido"
          >
            {sonidoHabilitado ? <Volume2 size={15} /> : <VolumeX size={15} className="text-rose-400" />}
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL: CÁMARA O RESULTADO */}
      <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full space-y-4">

        {/* CONTENEDOR DEL ESCÁNER CÁMARA */}
        <div className={`relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex flex-col items-center justify-center transition-all ${
          resultado ? 'h-40 shrink-0 opacity-60' : 'h-80 sm:h-96'
        }`}>
          <div id="lector-qr-movil-contenedor" className="w-full h-full object-cover" />

          {/* Guía visual de enfoque / retícula de escaneo */}
          {!resultado && camaraActiva && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-56 h-56 border-2 border-dashed border-sky-400/70 rounded-2xl relative animate-pulse">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-sky-400 rounded-tl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-sky-400 rounded-tr" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-sky-400 rounded-bl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-sky-400 rounded-br" />
              </div>
              <p className="text-[11px] font-bold text-sky-200 mt-3 bg-slate-950/80 px-3 py-1 rounded-full border border-sky-500/30 backdrop-blur-sm">
                Apuntá al QR del egresado o invitado
              </p>
            </div>
          )}

          {/* Loader si está arrancando */}
          {iniciandoCamara && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={28} className="animate-spin text-sky-400" />
              <p className="text-xs text-slate-300 font-semibold">Iniciando cámara trasera...</p>
            </div>
          )}

          {/* Mensaje de error de cámara */}
          {errorCamara && (
            <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center gap-3">
              <AlertTriangle size={32} className="text-amber-400" />
              <p className="text-xs text-slate-300">{errorCamara}</p>
              <button
                onClick={iniciarEscaner}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
              >
                Reintentar encender
              </button>
            </div>
          )}
        </div>

        {/* FEEDBACK DE ERROR O PROCESANDO */}
        {procesandoCodigo && (
          <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-sky-300 animate-pulse">
            <RefreshCw size={14} className="animate-spin" />
            <span>Consultando credencial en tiempo real...</span>
          </div>
        )}

        {errorAcreditacion && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/40 rounded-2xl flex items-center justify-between gap-2 text-xs font-bold text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400 shrink-0" />
              <span>{errorAcreditacion}</span>
            </div>
            <button
              onClick={reiniciarEscaneo}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-[10px]"
            >
              Cerrar
            </button>
          </div>
        )}

        {mensajeExito && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-black text-emerald-300 shadow-lg shadow-emerald-500/10 animate-in zoom-in-95">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* TARJETA DE RESULTADO / ACCIÓN DE ACREDITACIÓN */}
        {resultado && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            
            {/* ENCABEZADO DEL ASISTENTE DETECTADO */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 inline-block mb-1">
                  {resultado.tipo === 'grupo' ? 'Credencial Egresado (Pase Grupal)' : 'Pase Invitado Individual'}
                </span>
                <h2 className="text-base font-black text-white">
                  {resultado.egresado?.nombre || resultado.invitado?.nombre}
                </h2>
                <p className="text-xs text-slate-400">
                  DNI: <strong className="text-slate-200">{resultado.egresado?.dni || resultado.invitado?.dni}</strong>
                  {resultado.egresado?.legajo && <span> · Leg: {resultado.egresado.legajo}</span>}
                </p>
              </div>

              {/* Estado de butaca */}
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-semibold">Butaca</span>
                <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  {resultado.egresado?.asiento_id || resultado.invitado?.asiento_id || 'Sin asignar'}
                </span>
              </div>
            </div>

            {/* LISTA DE ACOMPAÑANTES DEL GRUPO */}
            {resultado.tipo === 'grupo' && resultado.invitados && resultado.invitados.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Acompañantes ({resultado.invitados.length})</span>
                  <span>Butacas</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {resultado.invitados.map(inv => (
                    <div 
                      key={inv.id}
                      className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <strong className="text-slate-200 block truncate">{inv.nombre}</strong>
                        <span className="text-[10px] text-slate-400">{inv.relacion || 'Acompañante'} · DNI {inv.dni}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono font-bold text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                          {inv.asiento_id || 'Sin butaca'}
                        </span>
                        {inv.presente ? (
                          <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            Adentro
                          </span>
                        ) : (
                          <button
                            onClick={() => acreditarInvitado(inv.id)}
                            className="text-[10px] font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30 cursor-pointer"
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

            {/* BOTONES DE ACCIÓN */}
            <div className="pt-2 space-y-2">
              {resultado.tipo === 'grupo' ? (
                <button
                  onClick={acreditarGrupoCompleto}
                  disabled={procesandoCodigo || (resultado.egresado?.presente && (resultado.invitados || []).every(i => i.presente))}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
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
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>{resultado.invitado?.presente ? 'Ya se encuentra presente' : 'Acreditar Asistencia'}</span>
                </button>
              )}

              <button
                onClick={reiniciarEscaneo}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Escanear siguiente credencial</span>
              </button>
            </div>

          </div>
        )}

        {/* INSTRUCCIÓN AL PIE */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3.5 text-center text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Puesto de Portería Oficial Móvil</span>
          </p>
          <p className="text-[10px] text-slate-500">
            Validación criptográfica directa sin requerir descarga de apps ni instalación previa.
          </p>
        </div>

      </main>

    </div>
  )
}

export default function PaginaAcreditacionMovil() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
          <RefreshCw size={16} className="animate-spin" />
          <span>Cargando lector móvil...</span>
        </div>
      </div>
    }>
      <ContenidoLectorMovil />
    </Suspense>
  )
}
