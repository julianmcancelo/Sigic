import { useState, useEffect, useRef } from 'react'
import { 
  GraduationCap, Calendar, CalendarPlus, Users, FileSpreadsheet, Settings, 
  LogOut, Search, Bell, Eye, Edit3, CheckCircle2, AlertTriangle, 
  XCircle, LayoutGrid, HelpCircle, Map, BarChart3, Award, UserCheck, TrendingUp, 
  Shield, Server, Send, Armchair, Activity, QrCode, ScanLine, ArrowRight, ChevronRight,
  Monitor, Palette, ArrowUpCircle
} from 'lucide-react'
import { BASE, cabeceras } from '../../servicios/api'
import { useSincronizacion, emitirCambioSync } from '../../lib/sync'
import { obtenerDetalleClima } from '../../utilidades/clima'
import { CloudSun } from 'lucide-react'
import { FONDOS_DISPONIBLES } from '../../datos/fondos-pantalla'
import { ModalPersonalizarFondo } from '../../componentes/ModalPersonalizarFondo'
import { ModalActualizarSigic } from '../../componentes/ModalActualizarSigic'
import { AnimatedThemeToggler } from '../../componentes/AnimatedThemeToggler'


// Importación de sub-vistas operativas del sistema.
import { GestionCeremonias } from './GestionCeremonias'
import { GestionGraduados } from './GestionGraduados'
import { GestionConvocatoria } from './GestionConvocatoria'
import { PreparacionCeremonia } from './PreparacionCeremonia'
import { DespachoCredenciales } from './DespachoCredenciales'
import { GestionProfesores } from './GestionProfesores'
import { ControlIngreso } from './ControlIngreso'
import { EditorAnfiteatro } from './EditorAnfiteatro'
import { EstadoCeremonia } from './EstadoCeremonia'
import { PanelAjustes } from './PanelAjustes'
import { PanelReportes } from './PanelReportes'
import { ManualUsuarioWeb } from '../ManualUsuarioWeb'
import { LandingPageNerdearlaStyle } from '../LandingPageNerdearlaStyle'
import { GestionPorteria } from './GestionPorteria'
import { CentroControl } from './CentroControl'

export const TITULOS_PANTALLAS = {
  'bienvenida': 'Panel de Control',
  'gestion-ceremonias': 'Gestión de Ceremonias',
  'gestion-graduados': 'Padrón de Graduados',
  'convocatoria': 'Convocatoria & Invitaciones',
  'preparacion-ceremonia': 'Preparación de Ceremonia',
  'despacho-credenciales': 'Despacho de Credenciales',
  'seleccion-asientos': 'Editor de Anfiteatro',
  'control-ingreso': 'Control de Ingreso & Acreditación',
  'estado-ceremonia': 'Ceremonia en Vivo',
  'panel-reportes': 'Reportes & Estadísticas',
  'gestion-profesores': 'Cuerpo Docente & Autoridades',
  'gestion-porteria': 'Seguridad & Portería',
  'centro-control': 'Centro de Control e Infraestructura',
  'ajustes': 'Configuración del Sistema',
  'manual-usuario': 'Manual de Usuario',
  'landing-page': 'Landing Page (Nerdearla)'
}

export const CANONICAL_MAP = {
  'dashboard': 'bienvenida',
  'bienvenida': 'bienvenida',
  'ceremonias': 'gestion-ceremonias',
  'gestion-ceremonias': 'gestion-ceremonias',
  'estudiantes': 'gestion-graduados',
  'gestion-graduados': 'gestion-graduados',
  'convocatoria': 'convocatoria',
  'preparacion-ceremonia': 'preparacion-ceremonia',
  'preparacion': 'preparacion-ceremonia',
  'despacho-credenciales': 'despacho-credenciales',
  'credenciales': 'despacho-credenciales',
  'asistente-operativo': 'asistente-operativo',
  'butacas': 'seleccion-asientos',
  'seleccion-asientos': 'seleccion-asientos',
  'acreditacion': 'control-ingreso',
  'control-ingreso': 'control-ingreso',
  'envivo': 'estado-ceremonia',
  'estado-ceremonia': 'estado-ceremonia',
  'profesores': 'gestion-profesores',
  'gestion-profesores': 'gestion-profesores',
  'reportes': 'panel-reportes',
  'panel-reportes': 'panel-reportes',
  'seguridad': 'gestion-porteria',
  'gestion-porteria': 'gestion-porteria',
  'infraestructura': 'centro-control',
  'centro-control': 'centro-control',
  'configuracion': 'ajustes',
  'ajustes': 'ajustes',
  'manual': 'manual-usuario',
  'manual-usuario': 'manual-usuario',
  'landing': 'landing-page',
  'landing-page': 'landing-page',
}


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
function StatCard({ icono: Icono, etiqueta, valor, color = ACCENT, bgIcono = 'bg-sky-50 text-sky-600 border-sky-100', sufijo = '', descripcion, barra }) {
  const contado = useContador(typeof valor === 'number' ? valor : 0)

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 bg-white border border-slate-200/80 shadow-xs group"
    >
      {/* Top row: Etiqueta + Icono en badge redondeado */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          {etiqueta}
        </span>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 shadow-xs shrink-0 ${bgIcono}`}>
          <Icono size={17} />
        </div>
      </div>

      {/* Main stat number */}
      <div>
        <p className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 tabular-nums leading-none">
          {contado}{sufijo}
        </p>

        {descripcion && (
          <p className="text-[11px] font-medium text-slate-500 mt-1.5">{descripcion}</p>
        )}
      </div>

      {/* Barra de progreso opcional */}
      {barra !== undefined && (
        <div className="mt-3.5 pt-2.5 border-t border-slate-100">
          <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-400 mb-1">
            <span>Aforo previsto</span>
            <span className="text-slate-700">{barra}%</span>
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(barra, 100)}%`, background: `linear-gradient(90deg, ${color}, #10b981)` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function PantallaBienvenidaPro({ 
  usuario, 
  ceremoniaActiva, 
  onCerrarSesion, 
  onNavegar, 
  onCambiarVersion, 
  onCambioCeremonia, 
  onCambiarEstiloInterfaz,
  pantallaActual = 'bienvenida'
}) {
  const fechaActual = new Date()
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const diaSemana = diasSemana[fechaActual.getDay()]
  const dia = fechaActual.getDate()
  const mes = meses[fechaActual.getMonth()]
  const textoFecha = `${diaSemana}, ${dia} ${mes}`.toUpperCase()
  const esSoporte = usuario?.correo && usuario.correo.toLowerCase() === 'soporte@ibeltran.com.ar'

  const [stats, setStats] = useState(null)
  const [graduados, setGraduados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [vistaInterna, setVistaInterna] = useState('bienvenida')
  const vistaActiva = CANONICAL_MAP[pantallaActual] || CANONICAL_MAP[vistaInterna] || 'bienvenida'

  const manejarNavegar = (destino) => {
    const destinoCanonico = CANONICAL_MAP[destino] || destino
    setVistaInterna(destinoCanonico)
    setSidebarOpen(false)
    if (typeof onNavegar === 'function') {
      onNavegar(destinoCanonico)
    }
  }

  const [ceremonias, setCeremonias] = useState([])
  const [cambiando, setCambiando] = useState(false)
  const [pronosticoClima, setPronosticoClima] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fondoId, setFondoId] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_fondo') || 'beltran' : 'beltran'))
  const [cuadriculaActiva, setCuadriculaActiva] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_cuadricula') !== 'false' : true))
  const [marcaAguaActiva, setMarcaAguaActiva] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_marca_agua') !== 'false' : true))
  const [mostrarModalFondo, setMostrarModalFondo] = useState(false)
  const [mostrarModalActualizar, setMostrarModalActualizar] = useState(false)

  const fondoConfig = FONDOS_DISPONIBLES.find(f => f.id === fondoId) || FONDOS_DISPONIBLES[0]

  useEffect(() => {
    const handleFondo = (e) => {
      if (e.detail) setFondoId(e.detail)
    }
    const handleCuadricula = (e) => {
      if (typeof e.detail === 'boolean') setCuadriculaActiva(e.detail)
    }
    const handleMarcaAgua = (e) => {
      if (typeof e.detail === 'boolean') setMarcaAguaActiva(e.detail)
    }
    window.addEventListener('sigic-fondo-cambiado', handleFondo)
    window.addEventListener('sigic-cuadricula-cambiada', handleCuadricula)
    window.addEventListener('sigic-marca-agua-cambiada', handleMarcaAgua)
    return () => {
      window.removeEventListener('sigic-fondo-cambiado', handleFondo)
      window.removeEventListener('sigic-cuadricula-cambiada', handleCuadricula)
      window.removeEventListener('sigic-marca-agua-cambiada', handleMarcaAgua)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
    cargarPronostico()
  }, [])

  // Sincronización en vivo del Dashboard
  useSincronizacion(['EGRESADOS', 'INVITADOS', 'BUTACAS', 'CEREMONIAS'], () => {
    cargarDatos(false)
  })

  async function cargarDatos(mostrarSpinner = true) {
    try {
      if (mostrarSpinner) setCargando(true)
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
      if (mostrarSpinner) setCargando(false)
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
      emitirCambioSync('CEREMONIAS', { id })
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
  function renderMenuItem(Icon, label, vistaTarget, badge = null) {
    const targetCanonico = CANONICAL_MAP[vistaTarget] || vistaTarget
    const esActivo = vistaActiva === targetCanonico
    return (
      <button 
        key={vistaTarget}
        type="button"
        onClick={() => manejarNavegar(targetCanonico)}
        className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs font-semibold text-left cursor-pointer ${
          esActivo
            ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon 
            size={16} 
            className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
              esActivo ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
            }`} 
          />
          <span className="truncate">{label}</span>
        </div>
        {badge && (
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
            esActivo ? 'bg-sky-200/70 text-sky-800' : 'bg-slate-100 text-slate-500'
          }`}>
            {badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <div 
      className="relative min-h-screen flex font-sans text-slate-800 transition-colors duration-500 overflow-x-hidden"
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        backgroundColor: fondoConfig.tipo === 'claro' ? '#F8FAFC' : '#0B1320'
      }}
    >
      {/* Gradiente dinámico reactivo al tema elegido */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-700" 
        style={{
          background: fondoConfig.tipo === 'claro'
            ? `radial-gradient(ellipse at top, ${fondoConfig.colores[0]}40, #F8FAFC 70%)`
            : `radial-gradient(ellipse at top, ${fondoConfig.colores[1]}55, ${fondoConfig.colores[0]} 70%)`,
          opacity: 0.95
        }}
      />

      {/* Cuadrícula Tecnológica configurable */}
      {cuadriculaActiva && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
          style={{
            backgroundImage: `linear-gradient(${fondoConfig.colorPrincipal}18 1px, transparent 1px), linear-gradient(90deg, ${fondoConfig.colorPrincipal}18 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
            maskImage: 'linear-gradient(to bottom, black, transparent 90%)'
          }}
        />
      )}

      {/* Marca de Agua Beltrán configurable */}
      {marcaAguaActiva && (
        <div className="sigic-watermark" aria-hidden="true" style={{ opacity: 0.06 }}>
          <img src="/logo-oficial.png" alt="" />
          <span>SIGIC</span>
          <small>Sistema Integral de Gestión Institucional</small>
        </div>
      )}

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-white flex flex-col z-40 shrink-0 select-none border-r border-slate-200/80 shadow-[2px_0_16px_rgba(0,0,0,0.02)] transition-transform duration-300 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Institucional */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 shadow-xs bg-slate-50/80">
              <img src="/logo-oficial.png" alt="Logo" className="h-8 w-auto object-contain" />
            </div>
            <div>
              <span className="font-black tracking-tight text-lg text-slate-900 block leading-tight">SiGIC</span>
              <span className="block text-[9px] font-bold tracking-wider text-sky-600 uppercase">Gestión de Actos</span>
            </div>
          </div>
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-widest">
            PRO
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {renderMenuItem(LayoutGrid, 'Panel Principal', 'bienvenida')}

          {!esSoporte && (
            <>
              <div className="pt-4 pb-1.5 px-3">
                <span className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-400">Circuito de Colación</span>
              </div>
              {renderMenuItem(CalendarPlus, '1. Inicializar', 'gestion-ceremonias')}
              {renderMenuItem(GraduationCap, '2. Graduados', 'gestion-graduados', `${graduados.length || 0}`)}
              {renderMenuItem(Send, '3. Convocatoria', 'convocatoria')}
              {renderMenuItem(Armchair, '4. Butacas', 'seleccion-asientos')}
              {renderMenuItem(ScanLine, '5. Acreditación', 'control-ingreso')}
              {renderMenuItem(Activity, '6. En Vivo', 'estado-ceremonia')}
            </>
          )}

          <div className="pt-4 pb-1.5 px-3">
            <span className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-400">Gestión & Control</span>
          </div>
          {!esSoporte && renderMenuItem(Award, 'Docentes', 'gestion-profesores')}
          {!esSoporte && renderMenuItem(BarChart3, 'Reportes', 'panel-reportes')}
          {renderMenuItem(Shield, 'Seguridad', 'gestion-porteria')}
          {esSoporte && renderMenuItem(Server, 'Centro de Control', 'centro-control')}
          {!esSoporte && renderMenuItem(Settings, 'Configuración', 'ajustes')}
          {renderMenuItem(HelpCircle, 'Manual de Ayuda', 'manual-usuario')}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100">
          <button 
            type="button"
            onClick={onCerrarSesion}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all text-xs font-bold cursor-pointer"
          >
            <LogOut size={15} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col min-w-0 z-10 overflow-y-auto">
        {/* Top Navbar */}
        <header 
          className="h-16 bg-white/90 backdrop-blur-md px-4 sm:px-6 md:px-8 flex items-center justify-between gap-4 border-b border-slate-200/80 sticky top-0 z-30 shadow-xs"
        >
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Button */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition active:scale-95 cursor-pointer"
              title="Abrir menú"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => manejarNavegar('bienvenida')}
                className="font-black text-slate-800 hover:text-sky-600 transition cursor-pointer"
              >
                SiGIC
              </button>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-600">
                {TITULOS_PANTALLAS[vistaActiva] || 'Panel de Control'}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden sm:block relative max-w-xs w-full">
            <Search size={14} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar graduado, DNI o carrera..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-sky-500 rounded-full py-1.5 pl-9 pr-4 text-xs text-slate-800 outline-none transition-all placeholder-slate-400 shadow-xs"
            />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Switch de Tema Animado Día/Noche */}
            <div className="flex items-center">
              <AnimatedThemeToggler size="sm" />
            </div>

            {/* Personalizar Fondo & Estilo */}
            <button
              onClick={() => setMostrarModalFondo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 hover:bg-white text-slate-700 hover:text-amber-600 hover:border-amber-400/50 text-[10px] font-bold tracking-tight transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
              title="Personalizar tema de color, fondo y efectos visuales"
            >
              <Palette size={13} className="text-amber-500 shrink-0" />
              <span className="hidden sm:inline">Tema & Fondo</span>
            </button>

            {/* Notification */}
            <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-200">
              <div className="hidden md:block text-right select-none">
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Operador</span>
                <span className="block text-xs font-black leading-tight text-slate-800">{usuario?.nombre || 'Julian Cancelo'}</span>
              </div>
              <div 
                className="h-8 w-8 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-xs select-none shrink-0 bg-gradient-to-tr from-sky-500 to-indigo-600"
              >
                {usuario?.nombre?.charAt(0)?.toUpperCase() || 'J'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 sm:p-6 md:p-8 space-y-6 pb-24">
          
          {/* VISTA 1: DASHBOARD */}
          {vistaActiva === 'bienvenida' && (
            <>
              {/* Active Ceremony Card */}
              <div 
                className="rounded-[32px] border border-white p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-lg shadow-slate-200/50 bg-white"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                
                <div className="space-y-1 relative z-10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0EA5E9]">
                      Ceremonia Activa
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      En Línea
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                    <span className="bg-gradient-to-r from-sky-600 to-indigo-700 bg-clip-text text-transparent">
                      {ceremoniaActiva?.nombre || 'Ceremonia de Graduación'}
                    </span>
                  </h1>

                  <div className="mt-2 text-xs font-semibold text-slate-500 flex items-center gap-3.5 flex-wrap">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Calendar size={14} className="text-sky-500" />
                      {ceremoniaActiva ? new Date(ceremoniaActiva.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha a definir'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Map size={14} className="text-sky-500" />
                      {ceremoniaActiva?.lugar || 'Sede Beltrán'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0 relative z-10">
                  {/* Selector de Ceremonia */}
                  <div className="relative inline-flex items-center group/select">
                    <select 
                      value={ceremoniaActiva?.id || ''}
                      onChange={e => {
                        if (e.target.value !== ceremoniaActiva?.id) {
                          cambiarCeremonia(e.target.value)
                        }
                      }}
                      className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 outline-none transition-all cursor-pointer shadow-xs"
                    >
                      {ceremonias.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.activa ? '★ (Activa) ' : ''}{c.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 text-slate-400 group-hover/select:text-slate-600 transition-colors">
                      <ChevronRight size={13} className="rotate-90" />
                    </span>
                  </div>

                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {textoFecha}
                  </span>
                </div>
              </div>

              {/* CIRCUITO OPERATIVO GUIADO (PASO A PASO) */}
              <div className="bg-white border rounded-[28px] p-6 shadow-sm border-slate-200/80">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span>Circuito Operativo de Colación</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-200">
                        Flujo de 5 Pasos
                      </span>
                    </h2>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                      Seguí el orden cronológico para organizar el acto sin omitir ninguna etapa institucional.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* PASO 1 */}
                  <button
                    onClick={() => manejarNavegar('gestion-ceremonias')}
                    className="text-left p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer bg-slate-50/70 hover:bg-white border-slate-200/70 hover:border-indigo-300 hover:shadow-md group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-indigo-600 font-mono">01. INICIAR</span>
                      <CalendarPlus size={16} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Ceremonia</h4>
                    <p className="text-[9.5px] text-slate-400 mt-1 leading-snug">Fecha, sede, horario y cupo de invitados.</p>
                  </button>

                  {/* PASO 2 */}
                  <button
                    onClick={() => manejarNavegar('gestion-graduados')}
                    className="text-left p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer bg-slate-50/70 hover:bg-white border-slate-200/70 hover:border-emerald-300 hover:shadow-md group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-emerald-600 font-mono">02. PADRÓN</span>
                      <GraduationCap size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Graduados</h4>
                    <p className="text-[9.5px] text-slate-400 mt-1 leading-snug">Importar Excel de alumnos y títulos.</p>
                  </button>

                  {/* PASO 3 */}
                  <button
                    onClick={() => manejarNavegar('convocatoria')}
                    className="text-left p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer bg-slate-50/70 hover:bg-white border-slate-200/70 hover:border-blue-300 hover:shadow-md group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-blue-600 font-mono">03. CONVOCAR</span>
                      <Send size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Invitaciones</h4>
                    <p className="text-[9.5px] text-slate-400 mt-1 leading-snug">Despachar correos con token OTP.</p>
                  </button>

                  {/* PASO 4 */}
                  <button
                    onClick={() => manejarNavegar('seleccion-asientos')}
                    className="text-left p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer bg-slate-50/70 hover:bg-white border-slate-200/70 hover:border-cyan-300 hover:shadow-md group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-cyan-600 font-mono">04. BUTACAS</span>
                      <Armchair size={16} className="text-cyan-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Auto-Seating</h4>
                    <p className="text-[9.5px] text-slate-400 mt-1 leading-snug">Distribución de 3 bloques en 1 clic.</p>
                  </button>

                  {/* PASO 5 */}
                  <button
                    onClick={() => manejarNavegar('control-ingreso')}
                    className="text-left p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer bg-slate-50/70 hover:bg-white border-slate-200/70 hover:border-amber-300 hover:shadow-md group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-amber-600 font-mono">05. EN VIVO</span>
                      <ScanLine size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Portería & Acto</h4>
                    <p className="text-[9.5px] text-slate-400 mt-1 leading-snug">Escaneo QR offline y locución.</p>
                  </button>
                </div>
              </div>

              {/* Stats Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icono={GraduationCap}
                  etiqueta="Graduados"
                  valor={stats?.totalEgresados ?? 0}
                  descripcion="Registrados en el sistema"
                  color="#0284c7"
                  bgIcono="bg-sky-50 text-sky-600 border-sky-100"
                />
                <StatCard
                  icono={Users}
                  etiqueta="Invitados totales"
                  valor={stats?.totalInvitados ?? 0}
                  descripcion="Entre todos los graduados"
                  color="#7c3aed"
                  bgIcono="bg-violet-50 text-violet-600 border-violet-100"
                />
                <StatCard
                  icono={UserCheck}
                  etiqueta="Ingresados"
                  valor={stats?.presentes ?? 0}
                  descripcion="Invitados presentes hoy"
                  color="#059669"
                  bgIcono="bg-emerald-50 text-emerald-600 border-emerald-100"
                />
                <StatCard
                  icono={TrendingUp}
                  etiqueta="Ocupación"
                  valor={stats?.porcentajeOcupacion ?? 0}
                  sufijo="%"
                  descripcion="Del aforo total esperado"
                  color="#d97706"
                  bgIcono="bg-amber-50 text-amber-600 border-amber-100"
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
                                      onClick={() => manejarNavegar('gestion-graduados')}
                                      className="p-1.5 rounded-lg transition"
                                      style={{ color: '#78909c' }}
                                      onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                                      onMouseLeave={e => e.currentTarget.style.color = '#78909c'}
                                      title="Ver Detalles"
                                    >
                                      <Eye size={13} />
                                    </button>
                                    <button 
                                      onClick={() => manejarNavegar('gestion-graduados')}
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

          {/* VISTA: CEREMONIAS */}
          {vistaActiva === 'gestion-ceremonias' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
              <GestionCeremonias 
                sinHeader={true} 
                onVolver={() => manejarNavegar('bienvenida')} 
                onCambioCeremonia={cargarDatos}
                onNavegar={manejarNavegar}
              />
            </div>
          )}

          {/* VISTA: GRADUADOS */}
          {vistaActiva === 'gestion-graduados' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
              <GestionGraduados 
                usuario={usuario}
                ceremoniaActiva={ceremoniaActiva}
                sinHeader={true} 
                onVolver={() => manejarNavegar('bienvenida')}
                onCerrarSesion={onCerrarSesion}
                onNavegar={manejarNavegar}
                formato="dashboard"
              />
            </div>
          )}

          {/* VISTA: CONVOCATORIA */}
          {vistaActiva === 'convocatoria' && (
            <GestionConvocatoria
              ceremoniaActiva={ceremoniaActiva}
              usuario={usuario}
              onVolver={() => manejarNavegar('bienvenida')}
              onNavegar={manejarNavegar}
            />
          )}

          {/* VISTA: PREPARACION */}
          {vistaActiva === 'preparacion-ceremonia' && (
            <PreparacionCeremonia
              ceremoniaActiva={ceremoniaActiva}
              onVolver={() => manejarNavegar('bienvenida')}
              onNavegar={manejarNavegar}
            />
          )}

          {/* VISTA: DESPACHO CREDENCIALES */}
          {vistaActiva === 'despacho-credenciales' && (
            <DespachoCredenciales
              ceremoniaActiva={ceremoniaActiva}
              usuario={usuario}
              onVolver={() => manejarNavegar('bienvenida')}
              onNavegar={manejarNavegar}
            />
          )}

          {/* VISTA: PROFESORES */}
          {vistaActiva === 'gestion-profesores' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
              <GestionProfesores
                usuario={usuario}
                sinHeader={true}
                onVolver={() => manejarNavegar('bienvenida')}
                onCerrarSesion={onCerrarSesion}
              />
            </div>
          )}

          {/* VISTA: ACREDITACION */}
          {vistaActiva === 'control-ingreso' && (
            <ControlIngreso 
              sinHeader={true}
              usuario={usuario}
              onVolver={() => manejarNavegar('bienvenida')}
              onCerrarSesion={onCerrarSesion}
            />
          )}

          {/* VISTA: EN VIVO */}
          {vistaActiva === 'estado-ceremonia' && (
            <EstadoCeremonia
              onVolver={() => manejarNavegar('bienvenida')}
              onNavegar={manejarNavegar}
            />
          )}

          {/* VISTA: BUTACAS */}
          {vistaActiva === 'seleccion-asientos' && (
            <EditorAnfiteatro 
              sinHeader={true}
              onVolver={() => manejarNavegar('bienvenida')}
              ceremoniaId={ceremoniaActiva?.id}
            />
          )}

          {/* VISTA: REPORTES */}
          {vistaActiva === 'panel-reportes' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
              <PanelReportes 
                usuario={usuario}
                sinHeader={true}
                onVolver={() => manejarNavegar('bienvenida')}
                onCerrarSesion={onCerrarSesion}
              />
            </div>
          )}

          {/* VISTA: CONFIGURACION */}
          {vistaActiva === 'ajustes' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
              <PanelAjustes 
                usuario={usuario}
                sinHeader={true}
                onVolver={() => manejarNavegar('bienvenida')}
                onCerrarSesion={onCerrarSesion}
                onNavegar={manejarNavegar}
                ceremoniaActiva={ceremoniaActiva}
              />
            </div>
          )}

          {/* VISTA: SEGURIDAD */}
          {vistaActiva === 'gestion-porteria' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
              <GestionPorteria 
                usuario={usuario}
                onVolver={() => manejarNavegar('bienvenida')}
                onCerrarSesion={onCerrarSesion}
              />
            </div>
          )}

          {/* VISTA: INFRAESTRUCTURA / CENTRO CONTROL */}
          {vistaActiva === 'centro-control' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
              <CentroControl 
                usuario={usuario}
                onVolver={() => manejarNavegar('bienvenida')}
                onCerrarSesion={onCerrarSesion}
              />
            </div>
          )}

          {/* VISTA: MANUAL */}
          {vistaActiva === 'manual-usuario' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
              <ManualUsuarioWeb 
                sinHeader={true}
                onVolver={() => manejarNavegar('bienvenida')}
              />
            </div>
          )}

          {/* VISTA: LANDING PAGE ESTILO NERDEARLA */}
          {vistaActiva === 'landing-page' && (
            <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
              <LandingPageNerdearlaStyle
                onIrAEgresado={() => window.open('/?vista=graduado', '_blank')}
                onIrAAdmin={() => manejarNavegar('bienvenida')}
                onIrAManual={() => manejarNavegar('manual-usuario')}
                onVolver={() => manejarNavegar('bienvenida')}
              />
            </div>
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
      {mostrarModalFondo && (
        <ModalPersonalizarFondo
          fondoActual={fondoId}
          alCambiarFondo={(id) => {
            setFondoId(id)
            localStorage.setItem('sigic_fondo', id)
            window.dispatchEvent(new CustomEvent('sigic-fondo-cambiado', { detail: id }))
          }}
          cuadriculaActiva={cuadriculaActiva}
          alCambiarCuadricula={(activo) => {
            setCuadriculaActiva(activo)
            localStorage.setItem('sigic_cuadricula', String(activo))
            window.dispatchEvent(new CustomEvent('sigic-cuadricula-cambiada', { detail: activo }))
          }}
          marcaAguaActiva={marcaAguaActiva}
          alCambiarMarcaAgua={(activo) => {
            setMarcaAguaActiva(activo)
            localStorage.setItem('sigic_marca_agua', String(activo))
            window.dispatchEvent(new CustomEvent('sigic-marca-agua-cambiada', { detail: activo }))
          }}
          onCerrar={() => setMostrarModalFondo(false)}
        />
      )}
      {mostrarModalActualizar && (
        <ModalActualizarSigic
          abierto={mostrarModalActualizar}
          onCerrar={() => setMostrarModalActualizar(false)}
        />
      )}
    </div>
  )
}
