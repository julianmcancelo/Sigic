import React, { useState, useEffect } from 'react'
import { 
  RefreshCw, CheckCircle2, AlertCircle, HardDrive, 
  Cloud, Sparkles, X, ArrowRight, ShieldCheck, DownloadCloud,
  Layers, Check
} from 'lucide-react'
import { consultarActualizacionSistema, ejecutarActualizacionSistema } from '../lib/api'

export function ModalActualizarSigic({ abierto, onCerrar }) {
  const [cargando, setCargando] = useState(false)
  const [info, setInfo] = useState(null)
  const [actualizando, setActualizando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [etapaTexto, setEtapaTexto] = useState('')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (abierto) {
      verificar()
    } else {
      setResultado(null)
      setError(null)
      setActualizando(false)
      setProgreso(0)
      setEtapaTexto('')
    }
  }, [abierto])

  async function verificar() {
    setCargando(true)
    setError(null)
    try {
      const data = await consultarActualizacionSistema()
      setInfo(data)
    } catch (err) {
      setError('No se pudo verificar el estado de actualizaciones.')
    } finally {
      setCargando(false)
    }
  }

  async function iniciarActualizacion() {
    setActualizando(true)
    setError(null)
    setProgreso(15)
    setEtapaTexto('Conectando con el repositorio oficial...')

    try {
      const timer1 = setTimeout(() => {
        setProgreso(45)
        setEtapaTexto('Descargando paquete de actualización...')
      }, 1200)

      const timer2 = setTimeout(() => {
        setProgreso(80)
        setEtapaTexto('Verificando integridad y preparando migración...')
      }, 2500)

      const res = await ejecutarActualizacionSistema({ urlDescarga: info?.urlDescarga })
      
      clearTimeout(timer1)
      clearTimeout(timer2)
      setProgreso(100)
      setEtapaTexto('¡Listo! Paquete aplicado.')
      setResultado(res)
    } catch (err) {
      setError(err?.message || 'Error al ejecutar la actualización.')
      setActualizando(false)
      setProgreso(0)
    }
  }

  if (!abierto) return null

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0b1324] shadow-2xl text-slate-100 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <RefreshCw size={20} className={actualizando ? "animate-spin text-sky-400" : "text-sky-400"} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                Actualizaciones del Sistema
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300">
                  OTA 1-Click
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Mantén SiGIC sincronizado con las últimas versiones oficiales
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-5">
          {cargando ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="h-7 w-7 animate-spin text-sky-400" />
              <p className="text-xs text-slate-400">Consultando estado de versiones remotas y locales...</p>
            </div>
          ) : resultado ? (
            <div className="py-4 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={30} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-white">¡Actualización aplicada con éxito!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {resultado.mensaje || 'Se han instalado los paquetes más recientes. La aplicación continuará funcionando con las últimas mejoras.'}
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setActualizando(true)
                    setEtapaTexto("Reiniciando servidor de SiGIC...")
                    setTimeout(() => {
                      window.location.reload()
                    }, 3500)
                  }}
                  disabled={actualizando}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-medium text-white text-xs transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  <RefreshCw size={14} className={actualizando ? "animate-spin" : ""} />
                  <span>{actualizando ? "Reiniciando plataforma..." : "Listo, aplicar y recargar plataforma"}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tarjeta de Comparación de Versiones */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estado de versión</span>
                  {info?.actualizacionDisponible ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <Sparkles size={11} /> Nueva versión disponible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-white/5">
                      <Check size={11} className="text-emerald-400" /> Sistema al día
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Versión actual</span>
                    <span className="text-xs font-semibold text-white">v{info?.versionActual || '0.2.0'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Última versión</span>
                    <span className="text-xs font-semibold text-sky-400">
                      {info?.nuevaVersion ? `v${info.nuevaVersion}` : `v${info?.versionActual || '0.2.0'}`}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Canal de distribución:</span>
                    <span className="text-slate-300 font-medium">{info?.canal || 'Oficial OTA'}</span>
                  </div>
                  {info?.fuente && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Origen detectado:</span>
                      <span className="text-sky-300 font-medium">{info.fuente}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Registro de Cambios / Notas */}
              {info?.notas && info.notas.length > 0 && (
                <div className="rounded-xl border border-white/5 bg-white/[0.015] p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <Layers size={14} className="text-sky-400" />
                    <span>Novedades de esta actualización</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1.5 pl-5 list-disc marker:text-sky-500">
                    {info.notas.map((nota, i) => (
                      <li key={i}>{nota}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Barra de progreso si está actualizando */}
              {actualizando && (
                <div className="space-y-2 p-3 rounded-xl bg-sky-500/5 border border-sky-500/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-sky-300 font-medium">{etapaTexto}</span>
                    <span className="text-sky-400 font-semibold">{progreso}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-3 flex items-center gap-2.5 text-xs text-red-300">
                  <AlertCircle size={15} className="shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={verificar}
                  disabled={actualizando}
                  className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium text-xs transition"
                >
                  Reverificar
                </button>
                <button
                  type="button"
                  onClick={iniciarActualizacion}
                  disabled={actualizando || !info?.actualizacionDisponible}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-xs transition flex items-center justify-center gap-2 ${
                    info?.actualizacionDisponible 
                      ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-950/40' 
                      : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {actualizando ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Actualizando instancia...</span>
                    </>
                  ) : (
                    <>
                      <DownloadCloud size={14} />
                      <span>{info?.actualizacionDisponible ? 'Actualizar ahora (1-Click)' : 'Tu sistema está al día'}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
