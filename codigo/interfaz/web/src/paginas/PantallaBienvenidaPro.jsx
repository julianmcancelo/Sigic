import { useState, useEffect } from 'react'
import { 
  GraduationCap, Calendar, Users, FileSpreadsheet, Settings, 
  LogOut, Search, Bell, Eye, Edit3, CheckCircle2, AlertTriangle, 
  XCircle, LayoutGrid, HelpCircle, Map
} from 'lucide-react'
import { BASE, cabeceras } from '../servicios/api'

// ─── Colores del sistema (Identical to Version 1) ─────────────────
const DARK   = '#2A3448'
const ACCENT = '#0EA5E9'
const BG     = '#F8FAFC'

export function PantallaBienvenidaPro({ usuario, ceremoniaActiva, onCerrarSesion, onNavegar, onCambiarVersion }) {
  const [stats, setStats] = useState(null)
  const [graduados, setGraduados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarDatos()
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
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setCargando(false)
    }
  }

  // Filtrar graduados por la barra de búsqueda
  const graduadosFiltrados = graduados.filter(g => 
    g.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    g.dni.includes(busqueda) ||
    g.carrera.toLowerCase().includes(busqueda.toLowerCase())
  ).slice(0, 6) // Mostrar los primeros 6 para coincidir con la maqueta

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
          <div 
            className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20"
            style={{
              background: `linear-gradient(135deg, ${ACCENT} 0%, #4f46e5 100%)`
            }}
          >
            <GraduationCap size={20} />
          </div>
          <div>
            <span className="font-black tracking-tight text-lg" style={{ color: DARK }}>SiGIC</span>
            <span className="block text-[8px] font-bold tracking-widest uppercase" style={{ color: ACCENT }}>PRO EDITION</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1">
          <button 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold border"
            style={{
              background: `${ACCENT}14`,
              borderColor: `${ACCENT}33`,
              color: ACCENT,
              boxShadow: `0 4px 12px ${ACCENT}08`
            }}
          >
            <LayoutGrid size={16} style={{ color: ACCENT }} /> Dashboard
          </button>
          
          <button 
            onClick={() => onNavegar('gestion-ceremonias')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-50 text-xs font-bold"
            style={{ color: '#78909c' }}
            onMouseEnter={e => e.currentTarget.style.color = DARK}
            onMouseLeave={e => e.currentTarget.style.color = '#78909c'}
          >
            <Calendar size={16} /> Ceremonias
          </button>

          <button 
            onClick={() => onNavegar('gestion-graduados')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-50 text-xs font-bold"
            style={{ color: '#78909c' }}
            onMouseEnter={e => e.currentTarget.style.color = DARK}
            onMouseLeave={e => e.currentTarget.style.color = '#78909c'}
          >
            <GraduationCap size={16} /> Estudiantes
          </button>

          <button 
            onClick={() => onNavegar('control-ingreso')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-50 text-xs font-bold"
            style={{ color: '#78909c' }}
            onMouseEnter={e => e.currentTarget.style.color = DARK}
            onMouseLeave={e => e.currentTarget.style.color = '#78909c'}
          >
            <Users size={16} /> Acreditación
          </button>

          <button 
            onClick={() => onNavegar('seleccion-asientos')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-50 text-xs font-bold"
            style={{ color: '#78909c' }}
            onMouseEnter={e => e.currentTarget.style.color = DARK}
            onMouseLeave={e => e.currentTarget.style.color = '#78909c'}
          >
            <Map size={16} /> Butacas
          </button>

          <button 
            onClick={() => onNavegar('ajustes')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-50 text-xs font-bold"
            style={{ color: '#78909c' }}
            onMouseEnter={e => e.currentTarget.style.color = DARK}
            onMouseLeave={e => e.currentTarget.style.color = '#78909c'}
          >
            <Settings size={16} /> Configuración
          </button>

          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('ir-a-manual'))}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-50 text-xs font-bold"
            style={{ color: '#78909c' }}
            onMouseEnter={e => e.currentTarget.style.color = DARK}
            onMouseLeave={e => e.currentTarget.style.color = '#78909c'}
          >
            <HelpCircle size={16} /> Manual de Ayuda
          </button>
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
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="text-right">
                <span className="block text-[10px] font-bold leading-tight" style={{ color: DARK }}>{usuario?.nombre || 'Admin User'}</span>
                <span className="block text-[8px] font-medium" style={{ color: '#78909c' }}>Administrador</span>
              </div>
              <div 
                className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-white text-xs border shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT} 0%, #4f46e5 100%)`,
                  borderColor: 'rgba(255,255,255,0.2)'
                }}
              >
                {usuario?.nombre?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-8 space-y-6">
          {/* Active Ceremony Card */}
          <div 
            className="rounded-2xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-sm"
            style={{
              borderColor: `${ACCENT}22`,
              background: `linear-gradient(135deg, ${ACCENT}08 0%, rgba(99,102,241,0.01) 100%)`,
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Background elements */}
            <div className="absolute right-[-40px] top-[-40px] w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: `${ACCENT}0d` }} />
            
            <div className="space-y-2 relative z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase tracking-widest shadow-sm">
                Ceremonia Activa
              </span>
              <h2 className="text-xl font-black tracking-tight" style={{ color: DARK }}>
                {ceremoniaActiva?.nombre || 'Cargando Ceremonia Activa...'}
              </h2>
              <p className="text-xs font-medium" style={{ color: '#78909c' }}>
                {ceremoniaActiva ? `${ceremoniaActiva.lugar} · ${ceremoniaActiva.fecha}` : 'Instituto Tecnológico Beltrán'}
              </p>
            </div>

            {/* Vector Decorativo */}
            <div className="relative z-10 h-16 w-32 shrink-0 opacity-30 md:opacity-80 flex items-center justify-center">
              <GraduationCap size={48} className="animate-bounce" style={{ color: ACCENT, animationDuration: '3.5s' }} />
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Graduados */}
            <div 
              className="bg-white border rounded-2xl p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
              style={{ borderColor: 'rgba(16,185,129,0.1)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${ACCENT}55`}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.1)'}
            >
              <div className="absolute top-0 right-0 h-16 w-16 rounded-full blur-2xl pointer-events-none" style={{ background: `${ACCENT}0d` }} />
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="block text-[8.5px] font-bold uppercase tracking-wider" style={{ color: '#78909c' }}>Graduados</span>
                  <span className="block text-3xl font-black mt-1 tabular-nums" style={{ color: ACCENT }}>
                    {stats?.totalEgresados ?? 0}
                  </span>
                </div>
                <div 
                  className="h-9 w-9 border rounded-xl flex items-center justify-center"
                  style={{
                    background: `${ACCENT}14`,
                    borderColor: `${ACCENT}22`,
                    color: ACCENT
                  }}
                >
                  <GraduationCap size={18} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[8.5px] border-t pt-2.5 mt-2.5" style={{ color: '#78909c', borderTopColor: '#f1f5f9' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Padrón Importado</span>
              </div>
            </div>

            {/* Card 2: Invitados */}
            <div 
              className="bg-white border rounded-2xl p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
              style={{ borderColor: 'rgba(16,185,129,0.1)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.1)'}
            >
              <div className="absolute top-0 right-0 h-16 w-16 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(16,185,129,0.05)' }} />
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="block text-[8.5px] font-bold uppercase tracking-wider" style={{ color: '#78909c' }}>Invitados</span>
                  <span className="block text-3xl font-black mt-1 tabular-nums" style={{ color: '#10b981' }}>
                    {stats?.totalInvitados ?? 0}
                  </span>
                </div>
                <div 
                  className="h-9 w-9 border rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(16,185,129,0.08)',
                    borderColor: 'rgba(16,185,129,0.15)',
                    color: '#10b981'
                  }}
                >
                  <Users size={18} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[8.5px] border-t pt-2.5 mt-2.5" style={{ color: '#78909c', borderTopColor: '#f1f5f9' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                <span>Carga de Acompañantes</span>
              </div>
            </div>

            {/* Card 3: Asistencias */}
            <div 
              className="bg-white border rounded-2xl p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
              style={{ borderColor: 'rgba(16,185,129,0.1)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.1)'}
            >
              <div className="absolute top-0 right-0 h-16 w-16 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(245,158,11,0.05)' }} />
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="block text-[8.5px] font-bold uppercase tracking-wider" style={{ color: '#78909c' }}>Asistencias</span>
                  <span className="block text-3xl font-black mt-1 tabular-nums" style={{ color: '#f59e0b' }}>
                    {stats?.porcentajeOcupacion ?? 0}%
                  </span>
                </div>
                <div 
                  className="h-9 w-9 border rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(245,158,11,0.08)',
                    borderColor: 'rgba(245,158,11,0.15)',
                    color: '#f59e0b'
                  }}
                >
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[8.5px] border-t pt-2.5 mt-2.5" style={{ color: '#78909c', borderTopColor: '#f1f5f9' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Presentes Acreditados</span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
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
                      <td colSpan="6" className="p-8 text-center font-bold uppercase tracking-widest text-[9px]" style={{ color: '#78909c' }}>
                        Cargando Padrón de Egresados...
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
                      // Status mapping
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
                                onClick={() => onNavegar('gestion-graduados')}
                                className="p-1.5 rounded-lg transition"
                                style={{ color: '#78909c' }}
                                onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                                onMouseLeave={e => e.currentTarget.style.color = '#78909c'}
                                title="Ver Detalles"
                              >
                                <Eye size={13} />
                              </button>
                              <button 
                                onClick={() => onNavegar('gestion-graduados')}
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
        </main>
      </div>

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
