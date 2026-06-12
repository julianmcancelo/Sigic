import { useState, useEffect, useRef } from 'react'
import { 
  GraduationCap, Calendar, Users, FileSpreadsheet, Settings, 
  LogOut, Search, Bell, Eye, Edit3, CheckCircle2, AlertTriangle, 
  XCircle, LayoutGrid, HelpCircle, Map, BarChart3, Award, UserCheck, TrendingUp
} from 'lucide-react'
import { BASE, cabeceras } from '../../servicios/api'
import { obtenerDetalleClima } from '../../utilidades/clima'
import { CloudSun } from 'lucide-react'

// Importación de sub-vistas del sistema (locales v2)
import { GestionCeremonias } from './GestionCeremonias'
import { GestionGraduados } from './GestionGraduados'
import { GestionProfesores } from './GestionProfesores'
import { ControlIngreso } from './ControlIngreso'
import { EditorAnfiteatro } from './EditorAnfiteatro'
import { PanelAjustes } from './PanelAjustes'
import { PanelReportes } from './PanelReportes'
import { ManualUsuarioWeb } from './ManualUsuarioWeb'

// ─── Colores del sistema (Identical to Version 1) ─────────────────
const DARK   = '#2A3448'
const ACCENT = '#0EA5E9'
const BG     = '#F8FAFC'

// ─── Animación de número contando hacia arriba ─────────────────
function useContador(destino, duracion = 800) {
  const [valor, setValor] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (destino === 0) { setValor(0); return }
    const inicio = performance.now()
    function animar(ahora) {
      const progreso = Math.min((ahora - inicio) / duracion, 1)
      const ease = 1 - Math.pow(1 - progreso, 3)
      setValor(Math.round(ease * destino))
      if (progreso < 1) rafRef.current = requestAnimationFrame(animar)
    }
    rafRef.current = requestAnimationFrame(animar)
    return () => cancelAnimationFrame(rafRef.current)
  }, [destino, duracion])

  return valor
}

// ─── Stat card individual ──────────────────────────────────────
function StatCard({ icono: Icono, etiqueta, valor, color = ACCENT, sufijo = '', descripcion, barra }) {
  const contado = useContador(typeof valor === 'number' ? valor : 0)

  return (
    <div
      className="relative overflow-hidden rounded-[24px] px-6 py-6 flex flex-col gap-1 transition-all hover:scale-[1.02] duration-300 bg-white border"
      style={{
        borderColor: 'rgba(16,185,129,0.1)',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
      }}
    >
      {/* Ícono decorativo fondo */}
      <div className="pointer-events-none absolute top-4 right-4 opacity-[0.1]" style={{ color }}>
        <Icono size={42} />
      </div>
      {/* Glow */}
      <div
        className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full blur-[30px]"
        style={{ background: color, opacity: 0.12 }}
      />

      {/* Número */}
      <p
        className="text-[2.6rem] font-black leading-none tabular-nums"
        style={{ color, letterSpacing: '-0.02em' }}
      >
        {contado}{sufijo}
      </p>

      {/* Etiqueta */}
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        {etiqueta}
      </p>

      {/* Descripción opcional */}
      {descripcion && (
        <p className="text-[10px] mt-0.5 font-medium text-slate-400">{descripcion}</p>
      )}

      {/* Barra de progreso opcional */}
      {barra !== undefined && (
        <div className="mt-3 h-2 w-full rounded-full overflow-hidden bg-slate-50">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${barra}%`, background: `linear-gradient(90deg, ${color}, #34d399)` }}
          />
        </div>
      )}
    </div>
  )
}

export function PantallaBienvenidaPro({ usuario, ceremoniaActiva, onCerrarSesion, onNavegar, onCambiarVersion, onCambioCeremonia }) {
  const fechaActual = new Date()
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const diaSemana = diasSemana[fechaActual.getDay()]
  const dia = fechaActual.getDate()
  const mes = meses[fechaActual.getMonth()]
  const textoFecha = `${diaSemana}, ${dia} ${mes}`.toUpperCase()

  const [stats, setStats] = useState(null)
  const [graduados, setGraduados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [vistaActiva, setVistaActiva] = useState('dashboard') // Control de vistas del panel
  const [ceremonias, setCeremonias] = useState([])
  const [cambiando, setCambiando] = useState(false)
  const [pronosticoClima, setPronosticoClima] = useState(null)

  useEffect(() => {
    cargarDatos()
    cargarPronostico()
    const int = setInterval(cargarDatos, 30000)
    return () => clearInterval(int)
  }, [])

  async function cargarDatos() {
    try {
      setCargando(true)
      // 1. Stats
      const resStats = await fetch(`${BASE}/stats`, { headers: cabeceras() })
      if (resStats.ok) setStats(await resStats.json())

      // 2. Graduados
      const resGrad = await fetch(`${BASE}/egresados`, { headers: cabeceras() })
      if (resGrad.ok) setGraduados(await resGrad.json())

      // 3. Ceremonias
      const resCer = await fetch(`${BASE}/ceremonias`, { headers: cabeceras() })
      if (resCer.ok) setCeremonias(await resCer.json())
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setCargando(false)
    }
  }

  async function cambiarCeremonia(id) {
    setCambiando(true)
    const startTime = Date.now()
    try {
      const res = await fetch(`${BASE}/ceremonias/${id}/activar`, {
        method: 'PUT',
        headers: cabeceras()
      })
      if (!res.ok) throw new Error('No se pudo activar la ceremonia')

      const elapsed = Date.now() - startTime
      const delay = Math.max(1500 - elapsed, 0)
      await new Promise(resolve => setTimeout(resolve, delay))

      await cargarDatos()
      if (onCambioCeremonia) onCambioCeremonia()
    } catch (err) {
      console.error('Error al cambiar de ceremonia:', err)
    } finally {
      setCambiando(false)
    }
  }

  async function cargarPronostico() {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=-34.661&longitude=-58.366&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`)
      if (res.ok) {
        setPronosticoClima(await res.json())
      }
    } catch (err) {
      console.error('Error cargando pronóstico de clima:', err)
    }
  }

  function obtenerClimaParaFecha(fechaIso) {
    if (!pronosticoClima || !pronosticoClima.daily) return null
    let fechaString = fechaIso
    if (fechaIso.includes('T')) {
      fechaString = fechaIso.split('T')[0]
    }
    const index = pronosticoClima.daily.time.indexOf(fechaString)
    if (index === -1) return null

    const weatherCode = pronosticoClima.daily.weather_code[index]
    const tempMax = pronosticoClima.daily.temperature_2m_max[index]
    const tempMin = pronosticoClima.daily.temperature_2m_min[index]

    const infoClima = obtenerDetalleClima(weatherCode)
    return {
      ...infoClima,
      tempMax,
      tempMin
    }
  }

  // Filtrar graduados por la barra de búsqueda
  const graduadosFiltrados = graduados.filter(g => 
    g.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    g.dni.includes(busqueda) ||
    g.carrera.toLowerCase().includes(busqueda.toLowerCase())
  ).slice(0, 6) // Mostrar los primeros 6 para coincidir con la maqueta

  // Helper para renderizar los items de navegación con el estado activo correcto
  function renderMenuItem(Icon, label, vistaTarget) {
    const esActivo = vistaActiva === vistaTarget
    return (
      <button 
        onClick={() => setVistaActiva(vistaTarget)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold border text-left"
        style={esActivo ? {
          background: `${ACCENT}14`,
          borderColor: `${ACCENT}33`,
          color: ACCENT,
          boxShadow: `0 4px 12px ${ACCENT}08`
        } : {
          background: 'transparent',
          borderColor: 'transparent',
          color: '#78909c'
        }}
        onMouseEnter={e => {
          if (!esActivo) {
            e.currentTarget.style.color = DARK
            e.currentTarget.style.background = '#f8fafc'
          }
        }}
        onMouseLeave={e => {
          if (!esActivo) {
            e.currentTarget.style.color = '#78909c'
            e.currentTarget.style.background = 'transparent'
          }
        }}
      >
        <Icon size={16} style={{ color: esActivo ? ACCENT : 'inherit' }} /> {label}
      </button>
    )
  }

  return (
    <div 
      className="relative min-h-screen flex overflow-hidden font-sans"
      style={{
        background: BG,
        color: DARK,
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* Orbes de fondo */}
      <div className="orbe orbe-1"></div>
      <div className="orbe orbe-2"></div>
      <div className="orbe orbe-3"></div>

      {/* Línea superior decorativa */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0EA5E9] to-transparent opacity-30 z-20" />

      {/* Rejilla decorativa */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #090d16 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* ================= SIDEBAR ================= */}
      <aside 
        className="w-60 bg-white flex flex-col z-10 shrink-0 select-none shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
        style={{ borderRight: `1px solid rgba(41,171,226,0.12)` }}
      >
        {/* Logo */}
        <div className="p-6 border-b flex items-center gap-3" style={{ borderBottomColor: '#f1f5f9' }}>
          <div className="h-9 w-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 shadow-sm bg-slate-50">
            <img src="/logo-oficial.png" alt="Logo" className="h-8 w-auto object-contain" />
          </div>
          <div>
            <span className="font-black tracking-tight text-lg" style={{ color: DARK }}>SiGIC</span>
            <span className="block text-[8px] font-bold tracking-widest uppercase" style={{ color: ACCENT }}>V2</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1">
          {renderMenuItem(LayoutGrid, 'Centro de Control', 'dashboard')}
          {renderMenuItem(Calendar, 'Ceremonias', 'ceremonias')}
          {renderMenuItem(GraduationCap, 'Estudiantes', 'estudiantes')}
          {renderMenuItem(Award, 'Profesores', 'profesores')}
          {renderMenuItem(Users, 'Acreditación', 'acreditacion')}
          {renderMenuItem(Map, 'Butacas', 'butacas')}
          {renderMenuItem(BarChart3, 'Reportes', 'reportes')}
          {renderMenuItem(Settings, 'Configuración', 'configuracion')}
          {renderMenuItem(HelpCircle, 'Manual de Ayuda', 'manual')}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t" style={{ borderTopColor: '#f1f5f9' }}>
          <button 
            onClick={onCerrarSesion}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all text-xs font-bold cursor-pointer"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col min-w-0 z-10 overflow-y-auto">
        {/* Top Navbar */}
        <header 
          className="h-16 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between gap-4 border-b"
          style={{ borderBottomColor: '#f1f5f9' }}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm" style={{ color: DARK }}>SiGIC</span>
            <span className="opacity-20" style={{ color: DARK }}>|</span>
            <span className="text-xs font-medium" style={{ color: '#78909c' }}>Panel de Control</span>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 transform -translate-y-1/2" style={{ color: '#78909c' }} />
            <input 
              type="text" 
              placeholder="Buscar graduado..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 border rounded-full py-1.5 pl-9 pr-4 text-[10px] outline-none transition-all placeholder-slate-400"
              style={{
                borderColor: '#e2e8f0',
                color: DARK
              }}
              onFocus={e => e.currentTarget.style.borderColor = ACCENT}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Version Toggle */}
            <button
              onClick={onCambiarVersion}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-slate-50 text-[9px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm"
              style={{
                borderColor: '#e2e8f0',
                color: DARK
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
              title="Cambiar al diseño clásico (Centrado)"
            >
              <LayoutGrid size={12} style={{ color: ACCENT }} /> Versión 1 (Clásica)
            </button>

            {/* Notification */}
            <button className="relative p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition">
              <Bell size={16} />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
            </button>

            {/* Profile */}
            <div className="flex items-center gap-3.5 pl-3 border-l border-slate-200">
              <div className="text-right select-none">
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Operador</span>
                <span className="block text-xs font-black leading-tight text-[#2A3448]">{usuario?.nombre || 'Julian Cancelo'}</span>
              </div>
              <div 
                className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-white text-sm border shadow-sm select-none"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT} 0%, #4f46e5 100%)`,
                  borderColor: 'rgba(255,255,255,0.1)'
                }}
              >
                {usuario?.nombre?.charAt(0)?.toUpperCase() || 'J'}
              </div>

              {/* SALIR Button */}
              <button 
                onClick={onCerrarSesion}
                className="flex items-center gap-1 px-4 py-2 bg-[#0d1b2e] hover:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm cursor-pointer ml-1"
              >
                + Salir
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8 space-y-6">
          
          {/* VISTA 1: DASHBOARD */}
          {vistaActiva === 'dashboard' && (
            <>
              {/* Active Ceremony Card */}
              <div 
                className="rounded-[32px] border border-white p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-lg shadow-slate-200/50 bg-white"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                
                <div className="space-y-1 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0EA5E9] block mb-1">
                    Hábitat Activo
                  </span>
                  <div className="flex items-center gap-4 flex-wrap">
                    <h1 className="text-4xl font-black tracking-tight" style={{ color: DARK }}>
                      <span className="bg-gradient-to-r from-sky-500 to-indigo-700 bg-clip-text text-transparent">
                        {ceremoniaActiva?.nombre || 'PRUEBA'}
                      </span>
                    </h1>
                    
                    {/* Acceso Rápido Dropdown */}
                    <div className="relative inline-flex items-center group/select">
                      <select 
                        value={ceremoniaActiva?.id || ''}
                        onChange={e => {
                          if (e.target.value !== ceremoniaActiva?.id) {
                            cambiarCeremonia(e.target.value)
                          }
                        }}
                        className="appearance-none bg-slate-50 hover:bg-slate-100 text-[#2A3448] text-[9.5px] font-black uppercase tracking-wider pl-3.5 pr-8 py-1.5 rounded-full border border-slate-200 outline-none transition-all active:scale-95 cursor-pointer shadow-sm"
                        style={{ color: DARK }}
                      >
                        {ceremonias.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.activa ? '★ ' : ''}{c.nombre}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 text-slate-400 group-hover/select:text-slate-600 transition-colors">
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                          <path d="M7 10l5 5 5-5z"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5 text-[11px] font-bold text-slate-400 flex items-center gap-3.5 flex-wrap">
                    <span className="flex items-center gap-1.5"><Calendar size={13} style={{ color: ACCENT }} /> {ceremoniaActiva ? new Date(ceremoniaActiva.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }) : '—'}</span>
                    <span className="opacity-25">|</span>
                    <span className="flex items-center gap-1.5"><Map size={13} style={{ color: ACCENT }} /> {ceremoniaActiva?.lugar || 'Sede Beltrán'}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2.5 shrink-0 relative z-10">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 px-4 py-2 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700">
                      Sesión activa
                    </span>
                  </div>

                  <button
                    onClick={onCambiarVersion}
                    className="flex items-center gap-1.5 bg-[#0d1b2e] hover:bg-slate-800 text-white text-[9px] font-black uppercase tracking-wider px-4 py-2 rounded-full border border-slate-700 active:scale-95 transition-all shadow-md cursor-pointer"
                    title="Cambiar al diseño clásico (Centrado)"
                  >
                    <LayoutGrid size={12} style={{ color: ACCENT }} /> Versión 1 (Clásica)
                  </button>

                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {textoFecha}
                  </span>
                </div>
              </div>

              {/* Stats Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icono={GraduationCap}
                  etiqueta="Graduados"
                  valor={stats?.totalEgresados ?? 0}
                  descripcion="Registrados en el sistema"
                  color={ACCENT}
                />
                <StatCard
                  icono={Users}
                  etiqueta="Invitados totales"
                  valor={stats?.totalInvitados ?? 0}
                  descripcion="Entre todos los graduados"
                  color={ACCENT}
                />
                <StatCard
                  icono={UserCheck}
                  etiqueta="Ingresados"
                  valor={stats?.presentes ?? 0}
                  descripcion="Invitados presentes hoy"
                  color="#10b981"
                />
                <StatCard
                  icono={TrendingUp}
                  etiqueta="Ocupación"
                  valor={stats?.porcentajeOcupacion ?? 0}
                  sufijo="%"
                  descripcion="Del aforo total esperado"
                  color={ACCENT}
                  barra={stats?.porcentajeOcupacion ?? 0}
                />
              </div>

              {/* Bottom Layout Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Padrón Table (8 cols) */}
                <div className="lg:col-span-8 bg-white border rounded-2xl overflow-hidden shadow-sm" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
                  <div className="p-5 border-b bg-slate-50/50 flex items-center justify-between" style={{ borderBottomColor: '#f1f5f9' }}>
                    <h3 className="font-black tracking-tight text-xs uppercase tracking-wider" style={{ color: DARK }}>
                      Listado de Graduados - Ceremonia Activa
                    </h3>
                    <span className="text-[9px] bg-slate-100 border px-2 py-0.5 rounded-lg font-bold" style={{ borderColor: '#e2e8f0', color: '#78909c' }}>
                      Padrón
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-50 font-bold border-b uppercase text-[8.5px] tracking-wider" style={{ borderBottomColor: '#f1f5f9', color: '#78909c' }}>
                          <th className="p-4 pl-6">ID</th>
                          <th className="p-4">Nombre</th>
                          <th className="p-4">Carrera</th>
                          <th className="p-4">Estado</th>
                          <th className="p-4 text-center">Invitados</th>
                          <th className="p-4 pr-6 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cargando && graduados.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-10 text-center select-none">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <div className="relative w-10 h-10 flex items-center justify-center">
                                  <div className="absolute inset-0 rounded-full border-2 border-t-[#0ea5e9] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
                                  <div className="absolute inset-0.5 rounded-full border-2 border-b-indigo-500 border-t-transparent border-r-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
                                  <img 
                                    src="/logo-oficial.png" 
                                    alt="SiGIC" 
                                    className="h-5 w-auto object-contain animate-pulse z-10" 
                                  />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Cargando Padrón de Egresados...</span>
                              </div>
                            </td>
                          </tr>
                        ) : graduadosFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-8 text-center font-bold uppercase tracking-widest text-[9px]" style={{ color: '#78909c' }}>
                              No se encontraron registros en la búsqueda
                            </td>
                          </tr>
                        ) : (
                          graduadosFiltrados.map((g, idx) => {
                            let badgeColor = 'bg-sky-50 text-sky-700 border-sky-200'
                            let label = 'Enviado'
                            if (g.estado === 'ACEPTADO') {
                              badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                              label = 'Confirmado'
                            } else if (g.estado === 'PENDIENTE') {
                              badgeColor = 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                              label = 'Pendiente'
                            } else if (g.estado === 'RECHAZADO') {
                              badgeColor = 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm'
                              label = 'Inasistente'
                            }

                            return (
                              <tr key={g.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="p-4 pl-6 font-mono text-slate-400">{idx + 1}.</td>
                                <td className="p-4 font-bold" style={{ color: DARK }}>{g.nombre}</td>
                                <td className="p-4" style={{ color: '#78909c' }}>{g.carrera}</td>
                                <td className="p-4">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${badgeColor}`}>
                                    {label}
                                  </span>
                                </td>
                                <td className="p-4 text-center font-bold" style={{ color: '#78909c' }}>{g.acompanantesCount ?? 2}</td>
                                <td className="p-4 pr-6 text-right">
                                  <div className="flex gap-2 justify-end">
                                    <button 
                                      onClick={() => setVistaActiva('estudiantes')}
                                      className="p-1.5 rounded-lg transition"
                                      style={{ color: '#78909c' }}
                                      onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                                      onMouseLeave={e => e.currentTarget.style.color = '#78909c'}
                                      title="Ver Detalles"
                                    >
                                      <Eye size={13} />
                                    </button>
                                    <button 
                                      onClick={() => setVistaActiva('estudiantes')}
                                      className="p-1.5 rounded-lg transition"
                                      style={{ color: '#78909c' }}
                                      onMouseEnter={e => e.currentTarget.style.color = 'indigo'}
                                      onMouseLeave={e => e.currentTarget.style.color = '#78909c'}
                                      title="Editar Egresado"
                                    >
                                      <Edit3 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column: Upcoming Ceremonies & Weather (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Weather & Upcoming Events Panel */}
                  <div className="bg-white border rounded-2xl p-6 shadow-sm" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
                    <div className="flex items-center justify-between pb-4 border-b mb-4" style={{ borderColor: '#f1f5f9' }}>
                      <div>
                        <h3 className="font-black tracking-tight text-xs uppercase" style={{ color: DARK }}>Planificación & Clima</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sede Beltrán</p>
                      </div>
                      <span className="text-[9px] bg-sky-50 border border-sky-100 text-sky-600 px-2.5 py-0.5 rounded-lg font-black uppercase tracking-wider">
                        Pronóstico
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Filas de ceremonias planificadas (inactivas) */}
                      {ceremonias.filter(c => !c.activa).length === 0 ? (
                        <p className="text-center py-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          No hay otras ceremonias planificadas
                        </p>
                      ) : (
                        ceremonias.filter(c => !c.activa).map(c => {
                          const clima = obtenerClimaParaFecha(c.fecha)
                          const ClimaIcon = clima?.icono || CloudSun
                          
                          return (
                            <div 
                              key={c.id} 
                              className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-all flex items-center justify-between gap-4"
                            >
                              <div className="space-y-1">
                                <h4 className="text-xs font-black leading-tight text-slate-700">{c.nombre}</h4>
                                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                                  {new Date(c.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })} - {c.lugar}
                                </p>
                              </div>

                              {/* Info del Clima */}
                              <div className="flex items-center gap-2 bg-white border border-slate-100 px-2.5 py-1.5 rounded-xl shrink-0 shadow-sm">
                                <ClimaIcon size={16} className="text-sky-500 animate-pulse" />
                                <div className="text-right">
                                  {clima ? (
                                    <>
                                      <span className="block text-[10px] font-black leading-none text-slate-700">{Math.round(clima.tempMax)}°C</span>
                                      <span className="block text-[7.5px] font-bold text-slate-400 uppercase">{clima.descripcion}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="block text-[10px] font-black leading-none text-slate-400">—</span>
                                      <span className="block text-[7.5px] font-bold text-slate-400 uppercase">Sin pronóstico</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* VISTA 2: CEREMONIAS */}
          {vistaActiva === 'ceremonias' && (
            <GestionCeremonias 
              sinHeader={true} 
              onVolver={() => setVistaActiva('dashboard')} 
              onCambioCeremonia={cargarDatos}
            />
          )}

          {/* VISTA 3: ESTUDIANTES */}
          {vistaActiva === 'estudiantes' && (
            <GestionGraduados 
              usuario={usuario}
              sinHeader={true} 
              onVolver={() => setVistaActiva('dashboard')}
              onCerrarSesion={onCerrarSesion}
            />
          )}

          {/* VISTA 4: PROFESORES */}
          {vistaActiva === 'profesores' && (
            <GestionProfesores
              usuario={usuario}
              sinHeader={true}
              onVolver={() => setVistaActiva('dashboard')}
              onCerrarSesion={onCerrarSesion}
            />
          )}

          {/* VISTA 5: ACREDITACION */}
          {vistaActiva === 'acreditacion' && (
            <ControlIngreso 
              sinHeader={true}
              onVolver={() => setVistaActiva('dashboard')}
              onCerrarSesion={onCerrarSesion}
            />
          )}

          {/* VISTA 6: BUTACAS */}
          {vistaActiva === 'butacas' && (
            <EditorAnfiteatro 
              sinHeader={true}
              onVolver={() => setVistaActiva('dashboard')}
              ceremoniaId={ceremoniaActiva?.id}
            />
          )}

          {/* VISTA 7: REPORTES */}
          {vistaActiva === 'reportes' && (
            <PanelReportes 
              usuario={usuario}
              sinHeader={true}
              onVolver={() => setVistaActiva('dashboard')}
              onCerrarSesion={onCerrarSesion}
            />
          )}

          {/* VISTA 8: CONFIGURACION */}
          {vistaActiva === 'configuracion' && (
            <PanelAjustes 
              usuario={usuario}
              sinHeader={true}
              onVolver={() => setVistaActiva('dashboard')}
              onCerrarSesion={onCerrarSesion}
              onNavegar={setVistaActiva}
              ceremoniaActiva={ceremoniaActiva}
            />
          )}

          {/* VISTA 9: MANUAL */}
          {vistaActiva === 'manual' && (
            <ManualUsuarioWeb 
              sinHeader={true}
              onVolver={() => setVistaActiva('dashboard')}
            />
          )}

        </main>
      </div>

      {/* OVERLAY DE CAMBIO DE HABITAT PREMIUM */}
      {cambiando && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-55 animate-in fade-in duration-300">
          <div className="text-center space-y-6 max-w-sm bg-white/10 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-lg">
            {/* Double ring orbit spinner */}
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-t-[#0ea5e9] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
              <div className="absolute inset-1.5 rounded-full border-4 border-b-indigo-500 border-t-transparent border-r-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
              <img 
                src="/logo-oficial.png" 
                alt="SiGIC" 
                className="h-8 w-auto object-contain animate-pulse z-10 filter drop-shadow-[0_0_8px_rgba(14,165,233,0.6)]" 
              />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-black uppercase tracking-[0.25em] text-white">Cambiando Hábitat</h3>
              <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest animate-pulse">Sincronizando Entorno...</p>
              <p className="text-[9px] text-slate-300 leading-relaxed pt-1 border-t border-white/5">
                Reconfigurando bases de datos, padrones y aforos de asientos del sistema.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .orbe {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
        }
        .orbe-1 {
          width: 500px; height: 500px;
          background: ${ACCENT}0a;
          top: -150px; left: -100px;
          animation: orbitar1 20s ease-in-out infinite;
        }
        .orbe-2 {
          width: 350px; height: 350px;
          background: rgba(99, 102, 241, 0.03);
          bottom: -80px; right: -50px;
          animation: orbitar2 22s ease-in-out infinite;
        }
        .orbe-3 {
          width: 250px; height: 250px;
          background: rgba(236, 72, 153, 0.02);
          top: 40%; left: 50%;
          animation: orbitar3 18s ease-in-out infinite;
        }
        @keyframes orbitar1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 60px) scale(1.05); }
        }
        @keyframes orbitar2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -40px) scale(0.95); }
        }
        @keyframes orbitar3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 20px); }
        }
      `}</style>
    </div>
  )
}
