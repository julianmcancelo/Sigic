import React, { useState, useEffect, useRef } from 'react'
import { 
  RefreshCw, CheckCircle2, AlertCircle, HardDrive, 
  Cloud, Sparkles, X, ArrowRight, ShieldCheck, DownloadCloud,
  Layers, Check, Upload, FileArchive, Globe, Settings, ArrowLeft,
  Server, Monitor, Zap, ExternalLink, ChevronRight
} from 'lucide-react'
import { consultarActualizacionSistema, ejecutarActualizacionSistema } from '../lib/api'

export function PaginaActualizadorSistema({ onVolver, usuario }) {
  const [cargando, setCargando] = useState(false)
  const [info, setInfo] = useState(null)
  const [actualizando, setActualizando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [etapaTexto, setEtapaTexto] = useState('')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)
  const [pestana, setPestana] = useState('ota') // 'ota' | 'archivo' | 'servidor'

  // Archivo local (.zip / .tar.gz)
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [arrastrando, setArrastrando] = useState(false)
  const inputArchivoRef = useRef(null)

  // Servidor personalizado
  const [urlServidorCustom, setUrlServidorCustom] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_custom_update_server') || '' : ''))

  useEffect(() => {
    verificar()
  }, [])

  async function verificar() {
    setCargando(true)
    setError(null)
    try {
      const data = await consultarActualizacionSistema()
      setInfo(data)
    } catch (err) {
      setError('No se pudo contactar con el servicio de versiones de SiGIC.')
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
      }, 1000)

      const timer2 = setTimeout(() => {
        setProgreso(85)
        setEtapaTexto('Extrayendo archivos y aplicando en caliente...')
      }, 2200)

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col selection:bg-sky-100 selection:text-sky-900">
      {/* Barra Superior Aislada (Modo Claro Profesional) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onVolver}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition active:scale-95 shadow-xs cursor-pointer group"
            title="Volver a la plataforma"
          >
            <ArrowLeft size={14} className="text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Volver a la Plataforma</span>
          </button>
          
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
              <RefreshCw size={16} className={actualizando ? "animate-spin" : ""} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-none">Centro de Actualizaciones</h1>
              <p className="text-[11px] text-slate-500 mt-0.5">Gestión de versiones y parches del sistema</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            v{info?.versionActual || '0.3.3'}
          </span>
        </div>
      </header>

      {/* Contenido Principal Bento & Chill (Modo Claro Cálido) */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Banner de Navegación / Pestañas Superiores */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex gap-1.5">
            <button
              onClick={() => { setPestana('ota'); setError(null) }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                pestana === 'ota' 
                  ? 'bg-sky-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <DownloadCloud size={14} />
              <span>OTA en 1-Click (Servidor)</span>
            </button>
            <button
              onClick={() => { setPestana('archivo'); setError(null) }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                pestana === 'archivo' 
                  ? 'bg-sky-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Upload size={14} />
              <span>Subir Paquete (.zip / .tar.gz)</span>
            </button>
            <button
              onClick={() => { setPestana('servidor'); setError(null) }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                pestana === 'servidor' 
                  ? 'bg-sky-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Globe size={14} />
              <span>Rutas & Mirror</span>
            </button>
          </div>

          <button
            type="button"
            onClick={verificar}
            disabled={cargando || actualizando}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={13} className={cargando ? "animate-spin text-sky-600" : ""} />
            <span>Reverificar</span>
          </button>
        </div>

        {/* Tarjeta de Estado & Progreso */}
        {cargando ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <RefreshCw size={28} className="animate-spin text-sky-600 mx-auto" />
            <p className="text-xs font-medium text-slate-500">Comprobando versiones en el repositorio remoto...</p>
          </div>
        ) : resultado ? (
          /* Pantalla de Éxito y Reinicio */
          <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-emerald-200 shadow-sm space-y-5 animate-in fade-in">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-lg font-bold text-slate-900">¡Actualización aplicada correctamente!</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                El nuevo código de producción fue extraído en la plataforma. Para que los cambios impacten en las sesiones, reiniciaremos el contenedor.
              </p>
            </div>

            <div className="pt-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => {
                  setActualizando(true)
                  setEtapaTexto("Reiniciando servidor de SiGIC...")
                  setTimeout(() => {
                    window.location.reload()
                  }, 3500)
                }}
                disabled={actualizando}
                className="w-full py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                <RefreshCw size={15} className={actualizando ? "animate-spin" : ""} />
                <span>{actualizando ? "Reiniciando plataforma..." : "Listo, reiniciar y recargar plataforma"}</span>
              </button>
            </div>
          </div>
        ) : pestana === 'ota' ? (
          /* Pestaña OTA */
          <div className="space-y-6 animate-in fade-in">
            {/* Bento Grid de Versiones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Versión Instalada</span>
                <span className="text-2xl font-black text-slate-900">v{info?.versionActual || '0.3.3'}</span>
                <span className="text-[11px] text-slate-500 block">En ejecución en producción</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Última Versión Oficial</span>
                <span className="text-2xl font-black text-sky-600">
                  {info?.nuevaVersion ? `v${info.nuevaVersion}` : `v${info?.versionActual || '0.3.3'}`}
                </span>
                <span className="text-[11px] text-slate-500 block">{info?.canal || 'Oficial OTA'}</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Estado de Distribución</span>
                  {info?.actualizacionDisponible ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
                      <Sparkles size={12} /> Actualización disponible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                      <Check size={12} /> Tu sistema está al día
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-2 block">
                  {info?.fuente ? `Origen: ${info.fuente}` : 'Sin descargas pendientes'}
                </span>
              </div>
            </div>

            {/* Novedades de la Versión */}
            {info?.notas && info.notas.length > 0 && (
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Layers size={15} className="text-sky-600" />
                  <span>Registro de cambios y mejoras</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-2 pl-5 list-disc marker:text-sky-500">
                  {info.notas.map((n, i) => (
                    <li key={i} className="leading-relaxed">{n}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Botón de Actualizar 1-Click */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Aplicación Inteligente</h3>
                <p className="text-[11px] text-slate-500">Descarga e instala sin detener las conexiones de los egresados.</p>
              </div>

              <button
                type="button"
                onClick={iniciarActualizacionOTA}
                disabled={actualizando || !info?.actualizacionDisponible}
                className={`py-3 px-6 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-xs cursor-pointer ${
                  info?.actualizacionDisponible 
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <DownloadCloud size={15} />
                <span>{info?.actualizacionDisponible ? 'Actualizar ahora (1-Click)' : 'Sistema al Día'}</span>
              </button>
            </div>
          </div>
        ) : pestana === 'archivo' ? (
          /* Pestaña Subida de Archivo */
          <div className="space-y-6 animate-in fade-in">
            <input
              ref={inputArchivoRef}
              type="file"
              accept=".zip,.tar.gz,.tgz,.rar"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) procesarArchivo(f)
              }}
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
              className={`p-10 border-2 border-dashed rounded-3xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                arrastrando 
                  ? 'border-sky-500 bg-sky-50/60' 
                  : archivoSeleccionado 
                    ? 'border-emerald-500 bg-emerald-50/40' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
              }`}
            >
              <div className={`p-4 rounded-2xl ${archivoSeleccionado ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-50 text-sky-600'}`}>
                {archivoSeleccionado ? <FileArchive size={32} /> : <Upload size={32} />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {archivoSeleccionado ? archivoSeleccionado.name : 'Arrastra tu paquete .zip o .tar.gz aquí'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {archivoSeleccionado 
                    ? `${(archivoSeleccionado.size / (1024 * 1024)).toFixed(2)} MB · Listo para instalar` 
                    : 'O haz clic para seleccionarlo desde tu explorador de archivos'}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Instalación Manual Desatendida</h4>
                <p className="text-[11px] text-slate-500">Descomprime en `/app`, valida archivos y reinicia el proceso Node en caliente.</p>
              </div>

              <button
                type="button"
                onClick={instalarArchivoLocal}
                disabled={!archivoSeleccionado || actualizando}
                className="py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Upload size={14} />
                <span>Instalar Paquete</span>
              </button>
            </div>
          </div>
        ) : (
          /* Pestaña Servidor & Mirror */
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900">URL del Servidor de Distribución</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Puedes apuntar SiGIC a un servidor en la nube, a un mirror local o a un contenedor interno:
                </p>
              </div>

              <input
                type="text"
                placeholder="http://host.docker.internal:3005"
                value={urlServidorCustom}
                onChange={(e) => setUrlServidorCustom(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
              />

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUrlServidorCustom('')
                    localStorage.removeItem('sigic_custom_update_server')
                    verificar()
                    setPestana('ota')
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition cursor-pointer"
                >
                  Restablecer
                </button>
                <button
                  type="button"
                  onClick={guardarServidorCustom}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Guardar y Comprobar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Progreso en Vivo */}
        {actualizando && !resultado && (
          <div className="p-5 rounded-2xl bg-white border border-sky-200 shadow-sm space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-sky-700">{etapaTexto}</span>
              <span className="font-bold text-sky-600">{progreso}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-600 transition-all duration-300 rounded-full"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl border border-red-200 bg-red-50 flex items-center gap-3 text-xs text-red-700">
            <AlertCircle size={16} className="shrink-0 text-red-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}
      </main>

      {/* Pie Institucional Fijo */}
      <footer className="mt-auto border-t border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Instituto Tecnológico Beltrán · Sistema de Gestión Institucional de Colaciones</span>
        </div>
        <button
          onClick={onVolver}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          Volver a la Plataforma
        </button>
      </footer>
    </div>
  )
}
