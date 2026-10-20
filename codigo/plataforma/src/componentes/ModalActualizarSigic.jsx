import React, { useState, useEffect } from 'react'
import { 
  RefreshCw, CheckCircle2, AlertCircle, HardDrive, 
  Wifi, Sparkles, X, ArrowRight, ShieldCheck, DownloadCloud
} from 'lucide-react'
import { consultarActualizacionSistema, ejecutarActualizacionSistema } from '../lib/api'

export function ModalActualizarSigic({ abierto, onCerrar }) {
  const [cargando, setCargando] = useState(false)
  const [info, setInfo] = useState(null)
  const [actualizando, setActualizando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (abierto) {
      verificar()
    } else {
      setResultado(null)
      setError(null)
      setActualizando(false)
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
    try {
      const res = await ejecutarActualizacionSistema()
      setResultado(res)
    } catch (err) {
      setError(err?.message || 'Error al ejecutar la actualización.')
      setActualizando(false)
    }
  }

  if (!abierto) return null

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-sky-500/30 bg-[#03080e] shadow-2xl text-slate-100 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="relative bg-gradient-to-r from-sky-950/70 via-slate-900 to-indigo-950/70 p-6 border-b border-sky-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shadow-inner">
                <RefreshCw size={24} className={actualizando ? "animate-spin" : ""} />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Actualizar SiGIC
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300">
                    En Caliente
                  </span>
                </h3>
                <p className="text-xs text-sky-200/70">
                  Sistema de Gestión Institucional de Colaciones
                </p>
              </div>
            </div>
            <button
              onClick={onCerrar}
              className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-5">
          {cargando ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin text-sky-400" />
              <p className="text-sm text-slate-300">Buscando paquetes de actualización disponibles...</p>
            </div>
          ) : resultado ? (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">¡Actualización Iniciada con Éxito!</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  {resultado.mensaje || 'Los servicios se están actualizando en caliente en segundo plano. La plataforma se reiniciará automáticamente.'}
                </p>
                {resultado.paquete && (
                  <p className="text-[11px] text-sky-400/90 font-mono mt-2 bg-sky-950/40 py-1 px-3 rounded-lg border border-sky-500/20 inline-block">
                    Fuente: {resultado.paquete}
                  </p>
                )}
              </div>
              <div className="pt-4">
                <button
                  onClick={() => {
                    onCerrar()
                    setTimeout(() => window.location.reload(), 2000)
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-sm transition shadow-lg shadow-emerald-900/30"
                >
                  Entendido, recargar plataforma
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Estado de detección */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado de Actualización</span>
                  {info?.actualizacionDisponible ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <Sparkles size={12} /> Paquete detectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-white/10">
                      Sistema al día
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300 space-y-2">
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Versión instalada:</span>
                    <span className="font-semibold text-white">v0.2.0 Oficial Beltrán</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Origen de actualización:</span>
                    <span className="font-semibold text-sky-400">
                      {info?.fuente || 'Búsqueda remota (Internet / USB / Red)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Modo de ejecución:</span>
                    <span className="font-semibold text-slate-200">
                      {info?.modoEnVivo ? 'Entorno En Vivo Oficial' : 'Host / Standalone'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explicación de soporte para USB o Red */}
              <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-4 flex gap-3 text-xs text-sky-200/80">
                <HardDrive size={18} className="text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Actualización sin reinstalar el sistema</strong>
                  Podés colocar un pendrive USB con la etiqueta <span className="font-mono text-sky-300">SIGIC_UPDATE</span> o conectar el equipo a la red. El sistema aplicará los cambios manteniendo intacta la base de datos y la configuración.
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 flex items-center gap-2.5 text-xs text-red-300">
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={verificar}
                  disabled={actualizando}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition"
                >
                  Volver a escanear
                </button>
                <button
                  type="button"
                  onClick={iniciarActualizacion}
                  disabled={actualizando}
                  className="flex-[2] py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 font-semibold text-white text-xs transition shadow-lg shadow-sky-950/50 flex items-center justify-center gap-2"
                >
                  {actualizando ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Aplicando cambios...</span>
                    </>
                  ) : (
                    <>
                      <DownloadCloud size={14} />
                      <span>{info?.actualizacionDisponible ? 'Aplicar Actualización Ahora' : 'Buscar y Aplicar de Red'}</span>
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
