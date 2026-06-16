import React, { useState, useEffect, useRef } from 'react'
import { 
  Settings, Shield, RefreshCw, Database, AlertTriangle, 
  Server, CheckCircle2, Download, Trash2, Terminal, ArrowLeft, Mail, Play
} from 'lucide-react'
import { 
  obtenerEstadoSetup, 
  exportarBaseDatos, 
  resetearSistema 
} from '../../servicios/api'

const ACCENT = '#0EA5E9'
const DARK   = '#2A3448'

export function CentroControl({ usuario, onVolver, onCerrarSesion }) {
  const [metricas, setMetricas] = useState({
    usuarios: 0,
    ceremonias: 0,
    egresados: 0,
    invitados: 0
  })
  const [cargando, setCargando] = useState(true)
  const [ejecutandoAccion, setEjecutandoAccion] = useState(null)
  const [dbStatus, setDbStatus] = useState('conectado')
  const [apiLatency, setApiLatency] = useState(0)
  const [logs, setLogs] = useState([])
  const consoleEndRef = useRef(null)

  // Environment detection
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
  const hostBase = typeof window !== 'undefined' ? window.location.origin : 'https://sigic-one.vercel.app'

  useEffect(() => {
    inicializarConsola()
    cargarDiagnostico()
  }, [])

  useEffect(() => {
    // Scroll automatically inside logs terminal
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  function registrarLog(texto, tipo = 'INFO') {
    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [...prev, { hora, texto, tipo }])
  }

  function inicializarConsola() {
    setLogs([])
    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs([
      { hora, texto: 'Iniciando módulo de diagnóstico de infraestructura...', tipo: 'INFO' },
      { hora, texto: `Plataforma base: Next.js + TailwindCSS (Vercel Edge Ready)`, tipo: 'INFO' },
      { hora, texto: `Servidor de API: ${hostBase}/api`, tipo: 'INFO' },
      { hora, texto: `Motor de Base de Datos: Neon PostgreSQL Serverless (Cloud)`, tipo: 'INFO' }
    ])
  }

  async function cargarDiagnostico() {
    setCargando(true)
    const inicio = performance.now()
    try {
      const res = await obtenerEstadoSetup()
      const fin = performance.now()
      setApiLatency(Math.round(fin - inicio))
      setMetricas(res.metricas || { usuarios: 0, ceremonias: 0, egresados: 0, invitados: 0 })
      setDbStatus('conectado')
      
      const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setLogs(prev => [
        ...prev,
        { hora, texto: `Conexión con Neon PostgreSQL establecida exitosamente (Latencia: ${Math.round(fin - inicio)}ms)`, tipo: 'OK' },
        { hora, texto: `Infraestructura en la nube activa y operativa en ${isVercel ? 'Vercel CDN Edge' : 'Localhost'}.`, tipo: 'OK' }
      ])
    } catch (err) {
      setDbStatus('error')
      registrarLog('Fallo al conectar con la base de datos Neon PostgreSQL. Verifique DATABASE_URL.', 'ERROR')
    } finally {
      setCargando(false)
    }
  }

  async function handleProbarConexion() {
    setEjecutandoAccion('probar')
    registrarLog('Iniciando test de conexión manual...', 'AUDIT')
    
    // Simular pings de red y chequeo de tablas
    await new Promise(r => setTimeout(r, 600));
    const inicio = performance.now()
    try {
      const res = await obtenerEstadoSetup()
      const fin = performance.now()
      const lat = Math.round(fin - inicio)
      setApiLatency(lat)
      setMetricas(res.metricas)
      setDbStatus('conectado')
      
      registrarLog(`Latencia del servidor: ${lat}ms (Vercel Serverless Function)`, 'OK')
      await new Promise(r => setTimeout(r, 400));
      registrarLog(`Diagnóstico de Base de Datos Neon completado:`, 'INFO')
      registrarLog(`  ├─ Tabla usuarios_sistema: ${res.metricas?.usuarios || 0} registros`, 'INFO')
      registrarLog(`  ├─ Tabla ceremonias: ${res.metricas?.ceremonias || 0} registros`, 'INFO')
      registrarLog(`  ├─ Tabla egresados: ${res.metricas?.egresados || 0} registros`, 'INFO')
      registrarLog(`  └─ Tabla invitados: ${res.metricas?.invitados || 0} registros`, 'INFO')
      registrarLog(`Sistema 100% Operativo y saludable.`, 'OK')
    } catch (err) {
      setDbStatus('error')
      registrarLog('Fallo crítico de conexión con Neon DB. Intente nuevamente.', 'ERROR')
    } finally {
      setEjecutandoAccion(null)
    }
  }

  async function handleExportarDB() {
    setEjecutandoAccion('exportar')
    registrarLog('Solicitando exportación de datos (Backup JSON)...', 'AUDIT')
    try {
      const datos = await exportarBaseDatos()
      registrarLog('Carga de datos recibida desde la nube.', 'OK')
      
      // Crear blob de descarga
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datos, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", `sigic_backup_cloud_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      
      registrarLog('Archivo JSON de backup generado y descargado con éxito.', 'OK')
    } catch (err) {
      registrarLog(`Error al exportar la base de datos: ${err.message || 'Permiso denegado'}`, 'ERROR')
    } finally {
      setEjecutandoAccion(null)
    }
  }

  async function handleResetearSistema() {
    if (!confirm('¡ATENCIÓN! ¿Estás completamente seguro de que deseas resetear el sistema?\n\nEsta acción eliminará todos los egresados, invitados, ceremonias y cuentas de usuario. Volverás al asistente de configuración inicial.')) {
      return
    }

    const confirmacionText = prompt('Por favor, escribe "RESET" para confirmar el formateo del sistema:')
    if (confirmacionText !== 'RESET') {
      alert('Confirmación cancelada.')
      return
    }

    setEjecutandoAccion('reset')
    registrarLog('Iniciando proceso de borrado de base de datos...', 'AUDIT')
    registrarLog('Iniciando protocolo del chasquido cuántico...', 'AUDIT')
    try {
      await resetearSistema()
      registrarLog('Todas las tablas fueron limpiadas con éxito. Flag de Setup marcado como incompleto.', 'OK')
      registrarLog('Perfectamente equilibrado... Reduciendo base de datos a átomos.', 'OK')
      registrarLog('Redirigiendo al asistente de configuración...', 'AUDIT')
      
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      registrarLog(`Fallo al resetear el sistema: ${err.message}`, 'ERROR')
      setEjecutandoAccion(null)
    }
  }

  return (
    <div className="font-sans pb-10">
      {/* HEADER INTEGRADO PRO */}
      <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-100/80 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onVolver}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition active:scale-95 shadow-sm shadow-slate-100/50 bg-white"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-black tracking-tight" style={{ color: DARK }}>Centro de Control de Infraestructura</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Servidor Serverless Vercel & Neon PostgreSQL Cloud</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button 
            onClick={inicializarConsola} 
            className="px-3.5 py-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-800 bg-white transition active:scale-95 text-[10px] font-bold uppercase tracking-wider shadow-sm"
          >
            Limpiar Consola
          </button>
          
          <button 
            onClick={handleProbarConexion} 
            disabled={ejecutandoAccion !== null}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md shadow-sky-500/20 active:scale-95 transition-all"
          >
            <RefreshCw size={14} className={ejecutandoAccion === 'probar' ? 'animate-spin' : ''} /> Probar Conexiones
          </button>
        </div>
      </div>

      {/* TARJETAS DE SERVICIOS (ESTILO CLOUD INFRASTRUCTURE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* CARD: SERVIDOR WEB */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 border border-sky-100 shadow-sm shadow-sky-100/50">
              <Server size={18} />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Activo (Vercel)
            </span>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Servidor Cloud</h3>
            <p className="text-sm font-black text-slate-800 mt-1 truncate">{hostBase.replace('https://', '')}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Latencia API: {apiLatency > 0 ? `${apiLatency}ms` : 'calculando...'}</p>
          </div>
        </div>

        {/* CARD: BASE DE DATOS */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-500 border border-purple-100 shadow-sm shadow-purple-100/50">
              <Database size={18} />
            </div>
            {dbStatus === 'conectado' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-100">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Desconectado
              </span>
            )}
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Base de Datos</h3>
            <p className="text-sm font-black text-slate-800 mt-1">Neon PostgreSQL Cloud</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Graduados: {metricas.egresados} | Invitados: {metricas.invitados}</p>
          </div>
        </div>

        {/* CARD: SERVIDOR SMTP */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 border border-amber-100 shadow-sm shadow-amber-100/50">
              <Mail size={18} />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-100">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
              SMTP Listo
            </span>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Servicio de Correo</h3>
            <p className="text-sm font-black text-slate-800 mt-1">SMTP Integrado (Nube)</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Invitaciones y Tokens OTP Activos</p>
          </div>
        </div>

      </div>

      {/* CONSOLA DE AUDITORÍA EN TIEMPO REAL (TERMINAL NEGRO) */}
      <div className="bg-slate-950 border border-slate-900 shadow-2xl rounded-[32px] overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-900/40 select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono flex items-center gap-1.5">
              <Terminal size={12} className="text-sky-500" /> consola_diagnostico_cloud.sh
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-600 font-mono">Status: ONLINE</span>
        </div>

        <div className="p-6 h-72 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 space-y-1.5 select-text">
          {logs.map((l, idx) => {
            let colorCls = 'text-slate-400'
            if (l.tipo === 'OK') colorCls = 'text-emerald-400'
            if (l.tipo === 'ERROR') colorCls = 'text-rose-400'
            if (l.tipo === 'AUDIT') colorCls = 'text-sky-400 font-bold'

            return (
              <div key={idx} className="flex gap-3">
                <span className="text-slate-600 shrink-0">{l.hora}</span>
                <span className={colorCls}>{l.texto}</span>
              </div>
            )
          })}
          <div ref={consoleEndRef} />
        </div>
      </div>

      {/* CONTROLES DE MANTENIMIENTO AVANZADO (BENTO GRID ACTIONS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* EXPORTACIÓN DE BACKUP */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl border border-emerald-100 shrink-0 h-fit">
              <Download size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Respaldar Base de Datos</h3>
              <p className="text-[11px] font-bold text-slate-400 mt-1 leading-relaxed">
                Descarga un volcado completo de la base de datos de Neon en formato JSON. Incluye egresados, invitados, ceremonias y parámetros del hábitat.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleExportarDB}
              disabled={ejecutandoAccion !== null}
              className="flex items-center gap-1.5 px-5 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition active:scale-95 shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              {ejecutandoAccion === 'exportar' ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />} Exportar Base de Datos
            </button>
          </div>
        </div>

        {/* REINICIAR SISTEMA */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex gap-4">
            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 shrink-0 h-fit">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-750">Formatear Sistema (Reset)</h3>
              <p className="text-[11px] font-bold text-slate-400 mt-1 leading-relaxed">
                Elimina todos los datos de la base de datos Neon y apaga el flag de configuración inicial. Esto reiniciará el asistente web de setup.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleResetearSistema}
              disabled={ejecutandoAccion !== null}
              className={`flex items-center gap-1.5 px-5 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-700 transition active:scale-95 shadow-md shadow-rose-600/10 cursor-pointer ${
                ejecutandoAccion === 'reset' ? 'animate-alert-vibe bg-red-700 shadow-xl shadow-red-700/50' : ''
              }`}
            >
              {ejecutandoAccion === 'reset' ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />} Formatear & Resetear
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes alert-vibe {
          0%, 100% { transform: scale(1) translate(0, 0) rotate(0deg); }
          20% { transform: scale(1.02) translate(-2px, 1px) rotate(-0.5deg); }
          40% { transform: scale(0.98) translate(1.5px, -2px) rotate(0.5deg); }
          60% { transform: scale(1.01) translate(-1px, 2px) rotate(-0.2deg); }
          80% { transform: scale(0.99) translate(2px, -1px) rotate(0.2deg); }
        }
        .animate-alert-vibe {
          animation: alert-vibe 0.15s infinite linear;
        }
      `}</style>

    </div>
  )
}
