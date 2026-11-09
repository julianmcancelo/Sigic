import React, { useState, useEffect, useRef } from 'react'
import { 
  RefreshCw, CheckCircle2, AlertCircle, HardDrive, 
  Cloud, Sparkles, X, ArrowRight, ShieldCheck, DownloadCloud,
  Layers, Check, Upload, FileArchive, Globe, Settings, ArrowUpCircle
} from 'lucide-react'
import { consultarActualizacionSistema, ejecutarActualizacionSistema } from '../lib/api'

export function ModalActualizarSigic({ abierto, onCerrar }) {
  const esEntornoNube = typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('sigic.com.ar'));
  const [cargando, setCargando] = useState(false)
  const [info, setInfo] = useState(null)
  const [actualizando, setActualizando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [etapaTexto, setEtapaTexto] = useState('')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)
  const [pestana, setPestana] = useState('ota') // 'ota' | 'archivo' | 'servidor'
  
  // Archivo local
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [arrastrando, setArrastrando] = useState(false)
  const inputArchivoRef = useRef(null)

  // Servidor personalizado
  const [urlServidorCustom, setUrlServidorCustom] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_custom_update_server') || '' : ''))

  useEffect(() => {
    if (abierto) {
      verificar()
    } else {
      setResultado(null)
      setError(null)
      setActualizando(false)
      setProgreso(0)
      setEtapaTexto('')
      setArchivoSeleccionado(null)
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

  async function iniciarActualizacionOTA() {
    setActualizando(true)
    setError(null)
    setProgreso(20)
    setEtapaTexto('Conectando con repositorio oficial...')

    try {
      const timer1 = setTimeout(() => {
        setProgreso(55)
        setEtapaTexto('Descargando paquete de actualización...')
      }, 1200)

      const timer2 = setTimeout(() => {
        setProgreso(85)
        setEtapaTexto('Extrayendo archivos y aplicando en caliente...')
      }, 2500)

      const res = await ejecutarActualizacionSistema({ urlDescarga: info?.urlDescarga })
      
      clearTimeout(timer1)
      clearTimeout(timer2)
      setProgreso(100)
      setEtapaTexto('¡Listo! Paquete aplicado con éxito.')
      setResultado(res)
    } catch (err) {
      setError(err?.message || 'Error al ejecutar la actualización.')
      setActualizando(false)
      setProgreso(0)
    }
  }

  function manejarArchivoSeleccionado(e) {
    const file = e.target.files?.[0]
    if (file) procesarArchivo(file)
  }

  function procesarArchivo(file) {
    const nombre = file.name.toLowerCase()
    if (!nombre.endsWith('.zip') && !nombre.endsWith('.tar.gz') && !nombre.endsWith('.tgz') && !nombre.endsWith('.rar')) {
      setError('Formato no soportado. Por favor selecciona un paquete .zip o .tar.gz')
      return
    }
    setError(null)
    setArchivoSeleccionado(file)
  }

  async function instalarArchivoLocal() {
    if (esEntornoNube) {
      setError('En producción (Vercel) el sistema se actualiza automáticamente vía GitHub con git push. No es posible subir archivos .zip porque el servidor de Vercel es inmutable y tiene límite de 4.5 MB.')
      return
    }
    if (!archivoSeleccionado) return
    setActualizando(true)
    setError(null)
    setProgreso(15)
    setEtapaTexto(`Leyendo paquete local (${archivoSeleccionado.name})...`)

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          setProgreso(45)
          setEtapaTexto('Subiendo paquete al contenedor de SiGIC...')
          const base64 = reader.result

          setProgreso(75)
          setEtapaTexto('Descomprimiendo e instalando archivos de producción...')

          const res = await ejecutarActualizacionSistema({
            archivoBase64: base64,
            nombreArchivo: archivoSeleccionado.name
          })

          setProgreso(100)
          setEtapaTexto('¡Completado! Paquete local extraído.')
          setResultado(res)
        } catch (subidaErr) {
          setError(subidaErr?.message || 'Error al procesar e instalar el archivo.')
          setActualizando(false)
          setProgreso(0)
        }
      }

      reader.onerror = () => {
        setError('Error al leer el archivo desde tu equipo.')
        setActualizando(false)
        setProgreso(0)
      }

      reader.readAsDataURL(archivoSeleccionado)
    } catch (err) {
      setError(err?.message || 'Error al iniciar la instalación del archivo.')
      setActualizando(false)
      setProgreso(0)
    }
  }

  function guardarServidorCustom() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sigic_custom_update_server', urlServidorCustom.trim())
    }
    verificar()
    setPestana('ota')
  }

  if (!abierto) return null

  return (
    <div 
      className="sg-chill-backdrop"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="sg-chill-container !max-w-xl !max-h-[88vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera Chill */}
        <div className="sg-chill-header">
          <div className="sg-chill-brand">
            <div className="sg-chill-logo">
              <RefreshCw size={17} className={actualizando ? "animate-spin text-sky-400" : "text-sky-400"} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3>Actualizaciones del Sistema</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400">
                  Universal OTA
                </span>
              </div>
              <p>Sincronización remota o instalación manual de paquetes</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="sg-chill-close"
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Pestañas de Modo Chill */}
        {!resultado && !actualizando && (
          <div className="sg-chill-tabs pt-3 border-b border-white/5 pb-3">
            <button
              onClick={() => { setPestana('ota'); setError(null) }}
              className={`sg-chill-tab ${pestana === 'ota' ? 'activo' : ''}`}
            >
              OTA en 1-Click
            </button>
            <button
              onClick={() => { setPestana('archivo'); setError(null) }}
              className={`sg-chill-tab ${pestana === 'archivo' ? 'activo' : ''}`}
            >
              Subir Archivo (.zip / .tar.gz)
            </button>
            <button
              onClick={() => { setPestana('servidor'); setError(null) }}
              className={`sg-chill-tab ${pestana === 'servidor' ? 'activo' : ''}`}
            >
              Servidor & Rutas
            </button>
          </div>
        )}

        {/* Cuerpo Dinámico */}
        <div className="sg-chill-scroll space-y-4 py-4">
          {cargando ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="h-7 w-7 animate-spin text-sky-400" />
              <p className="text-xs text-slate-400">Consultando estado de versiones remotas y locales...</p>
            </div>
          ) : resultado ? (
            <div className="py-6 text-center space-y-4 animate-in fade-in duration-200">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">¡Actualización aplicada con éxito!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Los nuevos archivos se extrajeron correctamente en el contenedor. Presiona el botón para reiniciar el servicio y recargar la plataforma.
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
          ) : pestana === 'ota' ? (
            <div className="space-y-4 animate-in fade-in duration-150">
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
                  <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Versión actual</span>
                    <span className="text-xs font-semibold text-white">v{info?.versionActual || '0.3.1'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Última versión</span>
                    <span className="text-xs font-semibold text-sky-400">
                      {info?.nuevaVersion ? `v${info.nuevaVersion}` : `v${info?.versionActual || '0.3.1'}`}
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

              {/* Novedades */}
              {info?.notas && info.notas.length > 0 && (
                <div className="rounded-xl border border-white/5 bg-white/[0.015] p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <Layers size={14} className="text-sky-400" />
                    <span>Novedades de esta versión</span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1.5 pl-5 list-disc marker:text-sky-500">
                    {info.notas.map((nota, i) => (
                      <li key={i}>{nota}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Botones de acción OTA */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={verificar}
                  disabled={actualizando}
                  className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium text-xs transition cursor-pointer"
                >
                  Reverificar
                </button>
                <button
                  type="button"
                  onClick={iniciarActualizacionOTA}
                  disabled={actualizando || !info?.actualizacionDisponible}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                    info?.actualizacionDisponible 
                      ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-950/40' 
                      : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  <DownloadCloud size={14} />
                  <span>{info?.actualizacionDisponible ? 'Actualizar ahora (1-Click)' : 'Tu sistema está al día'}</span>
                </button>
              </div>
            </div>
          ) : pestana === 'archivo' ? (
            /* Subida de Archivo ZIP / TAR.GZ */
            <div className="space-y-4 animate-in fade-in duration-150">
              <input
                ref={inputArchivoRef}
                type="file"
                accept=".zip,.tar.gz,.tgz,.rar"
                onChange={manejarArchivoSeleccionado}
                className="hidden"
              />

              <div 
                onClick={() => inputArchivoRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setArrastrando(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) procesarArchivo(f)
                }}
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
                  arrastrando 
                    ? 'border-sky-400 bg-sky-500/10' 
                    : archivoSeleccionado 
                      ? 'border-emerald-500/40 bg-emerald-500/5' 
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className={`p-3 rounded-2xl ${archivoSeleccionado ? 'bg-emerald-500/10 text-emerald-400' : 'bg-sky-500/10 text-sky-400'}`}>
                  {archivoSeleccionado ? <FileArchive size={26} /> : <Upload size={26} />}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {archivoSeleccionado ? archivoSeleccionado.name : 'Arrastra un paquete .zip o .tar.gz aquí'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {archivoSeleccionado 
                      ? `${(archivoSeleccionado.size / (1024 * 1024)).toFixed(2)} MB · Listo para instalar` 
                      : 'O haz clic para examinar desde tu explorador de archivos'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-xs text-slate-400">
                <span className="font-semibold text-slate-300 block text-[11px]">Formatos y detección automática:</span>
                <p className="text-[11px] leading-relaxed">
                  El sistema detecta automáticamente paquetes creados en Linux/Windows (`.tar.gz`, `.zip` o `.tgz`), los descomprime sobre la raíz y reinicia el servicio sin interrumpir las sesiones.
                </p>
              </div>

              <button
                type="button"
                onClick={instalarArchivoLocal}
                disabled={!archivoSeleccionado || actualizando}
                className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-white/5 disabled:text-slate-500 disabled:cursor-not-allowed font-medium text-xs text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-950/30"
              >
                <Upload size={14} />
                <span>Instalar archivo seleccionado</span>
              </button>
            </div>
          ) : (
            /* Configuración de Servidor & Rutas */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                  <Globe size={15} className="text-sky-400" />
                  <span>Servidor de Distribución OTA</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Define la URL del servidor oficial o de un mirror institucional local para comprobar versiones:
                </p>
                <input
                  type="text"
                  placeholder="http://host.docker.internal:3005"
                  value={urlServidorCustom}
                  onChange={(e) => setUrlServidorCustom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 block">Rutas de detección local:</span>
                <ul className="text-[11px] font-mono text-slate-400 space-y-1">
                  <li>/tmp/sigic-web-bundle.tar.gz</li>
                  <li>/tmp/sigic-update.zip</li>
                  <li>/media/sigic/SIGIC_UPDATE/sigic-web-bundle.tar.gz (USB)</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUrlServidorCustom('')
                    localStorage.removeItem('sigic_custom_update_server')
                    verificar()
                    setPestana('ota')
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-xs transition cursor-pointer"
                >
                  Restablecer por defecto
                </button>
                <button
                  type="button"
                  onClick={guardarServidorCustom}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition cursor-pointer"
                >
                  Guardar y Comprobar
                </button>
              </div>
            </div>
          )}

          {/* Barra de progreso si está actualizando */}
          {actualizando && !resultado && (
            <div className="space-y-2 p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/20 animate-in fade-in">
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
        </div>

        {/* Footer Chill */}
        <div className="sg-chill-footer">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Sistema Seguro & Transaccional</span>
          </div>
          <button
            onClick={onCerrar}
            disabled={actualizando}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs transition border border-white/10 cursor-pointer disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
