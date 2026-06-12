import { useState, useEffect } from 'react'
import { 
  GraduationCap, Calendar, Users, FileSpreadsheet, Settings, 
  LogOut, Search, Bell, Eye, Edit3, CheckCircle2, AlertTriangle, 
  XCircle, Sun, LayoutGrid, HelpCircle, Map
} from 'lucide-react'
import { BASE, cabeceras } from '../servicios/api'

export function PantallaBienvenidaOscura({ usuario, ceremoniaActiva, onCerrarSesion, onNavegar, onCambiarVersion }) {
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
      console.error('Error cargando datos oscuros:', err)
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
      className="relative min-h-screen text-white/90 flex overflow-hidden font-sans"
      style={{
        background: 'linear-gradient(135deg, #0d1424 0%, #0f192b 45%, #152238 100%)',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* Orbes de fondo */}
      <div className="orbe orbe-1"></div>
      <div className="orbe orbe-2"></div>
      <div className="orbe orbe-3"></div>

      {/* Línea superior decorativa */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0EA5E9] to-transparent opacity-50 z-20" />

      {/* Rejilla decorativa */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02] z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* ================= SIDEBAR ================= */}
      <aside className="w-60 bg-slate-950/40 border-r border-white/5 backdrop-blur-md flex flex-col z-10 shrink-0 select-none">
        {/* Logo */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="h-9 w-9 bg-gradient-to-br from-[#29ABE2] to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <GraduationCap size={20} />
          </div>
          <div>
            <span className="font-black tracking-tight text-lg text-white">SiGIC</span>
            <span className="block text-[8px] text-sky-400 font-bold tracking-widest uppercase">PRO EDITION</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1">
          <button 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all bg-[#29ABE2]/10 border border-[#29ABE2]/30 text-white shadow-[0_4px_20px_rgba(41,171,226,0.15)] text-xs font-bold"
          >
            <LayoutGrid size={16} className="text-[#29ABE2]" /> Dashboard
          </button>
          
          <button 
            onClick={() => onNavegar('gestion-ceremonias')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-white/50 hover:text-white hover:bg-white/5 border border-transparent text-xs font-bold"
          >
            <Calendar size={16} /> Ceremonias
          </button>

          <button 
            onClick={() => onNavegar('gestion-graduados')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-white/50 hover:text-white hover:bg-white/5 border border-transparent text-xs font-bold"
          >
            <GraduationCap size={16} /> Estudiantes
          </button>

          <button 
            onClick={() => onNavegar('control-ingreso')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-white/50 hover:text-white hover:bg-white/5 border border-transparent text-xs font-bold"
          >
            <Users size={16} /> Acreditación
          </button>

          <button 
            onClick={() => onNavegar('seleccion-asientos')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-white/50 hover:text-white hover:bg-white/5 border border-transparent text-xs font-bold"
          >
            <Map size={16} /> Butacas
          </button>

          <button 
            onClick={() => onNavegar('ajustes')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-white/50 hover:text-white hover:bg-white/5 border border-transparent text-xs font-bold"
          >
            <Settings size={16} /> Configuración
          </button>

          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('ir-a-manual'))}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-white/50 hover:text-white hover:bg-white/5 border border-transparent text-xs font-bold"
          >
            <HelpCircle size={16} /> Manual de Ayuda
          </button>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={onCerrarSesion}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold cursor-pointer"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col min-w-0 z-10 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 border-b border-white/5 bg-slate-950/20 backdrop-blur-md px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">SiGIC</span>
            <span className="text-white/40">|</span>
            <span className="text-xs text-white/60 font-medium">Panel de Control</span>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Buscar graduado..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-[10px] outline-none text-white focus:border-[#29ABE2]/50 focus:ring-1 focus:ring-[#29ABE2]/30 transition-all placeholder-white/30"
            />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Version Toggle */}
            <button
              onClick={onCambiarVersion}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-wider text-amber-400 transition hover:bg-white/10 active:scale-95 cursor-pointer"
              title="Cambiar al diseño clásico (Tema Claro)"
            >
              <Sun size={12} /> Versión 1 (Clásica)
            </button>

            {/* Notification */}
            <button className="relative p-1.5 rounded-full hover:bg-white/5 text-white/60 hover:text-white transition">
              <Bell size={16} />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <div className="text-right">
                <span className="block text-[10px] font-bold text-white leading-tight">{usuario?.nombre || 'Admin User'}</span>
                <span className="block text-[8px] text-white/40 font-medium">Administrador</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#29ABE2] to-purple-600 flex items-center justify-center font-bold text-white text-xs border border-white/10 shadow-md">
                {usuario?.nombre?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-8 space-y-6">
          {/* Active Ceremony Card */}
          <div 
            className="rounded-2xl border border-[#29ABE2]/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(41,171,226,0.08) 0%, rgba(99,102,241,0.03) 100%)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Background elements */}
            <div className="absolute right-[-40px] top-[-40px] w-40 h-40 bg-[#29ABE2]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-2 relative z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                Ceremonia Activa
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                {ceremoniaActiva?.nombre || 'Cargando Ceremonia Activa...'}
              </h2>
              <p className="text-xs text-white/60 font-medium">
                {ceremoniaActiva ? `${ceremoniaActiva.lugar} · ${ceremoniaActiva.fecha}` : 'Instituto Tecnológico Beltrán'}
              </p>
            </div>

            {/* Vector Decotarivo */}
            <div className="relative z-10 h-16 w-32 shrink-0 opacity-40 md:opacity-85 flex items-center justify-center">
              <GraduationCap size={48} className="text-[#29ABE2] animate-bounce" style={{ animationDuration: '3.5s' }} />
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Graduados */}
            <div className="bg-slate-950/30 border border-white/5 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm group hover:border-[#29ABE2]/30 transition-all duration-300">
              <div className="absolute top-0 right-0 h-16 w-16 bg-[#29ABE2]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="block text-[8.5px] font-bold text-white/40 uppercase tracking-wider">Graduados</span>
                  <span className="block text-3xl font-black text-white mt-1 tabular-nums">
                    {stats?.totalEgresados ?? 0}
                  </span>
                </div>
                <div className="h-9 w-9 bg-[#29ABE2]/10 border border-[#29ABE2]/20 text-[#29ABE2] rounded-xl flex items-center justify-center">
                  <GraduationCap size={18} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[8.5px] text-white/40 border-t border-white/5 pt-2.5 mt-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Padrón Importado</span>
              </div>
            </div>

            {/* Card 2: Invitados */}
            <div className="bg-slate-950/30 border border-white/5 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm group hover:border-emerald-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="block text-[8.5px] font-bold text-white/40 uppercase tracking-wider">Invitados</span>
                  <span className="block text-3xl font-black text-white mt-1 tabular-nums">
                    {stats?.totalInvitados ?? 0}
                  </span>
                </div>
                <div className="h-9 w-9 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                  <Users size={18} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[8.5px] text-white/40 border-t border-white/5 pt-2.5 mt-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                <span>Carga de Acompañantes</span>
              </div>
            </div>

            {/* Card 3: Asistencias */}
            <div className="bg-slate-950/30 border border-white/5 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm group hover:border-amber-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="block text-[8.5px] font-bold text-white/40 uppercase tracking-wider">Asistencias</span>
                  <span className="block text-3xl font-black text-white mt-1 tabular-nums">
                    {stats?.porcentajeOcupacion ?? 0}%
                  </span>
                </div>
                <div className="h-9 w-9 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[8.5px] text-white/40 border-t border-white/5 pt-2.5 mt-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Presentes Acreditados</span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-950/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="p-5 border-b border-white/5 bg-slate-950/10 flex items-center justify-between">
              <h3 className="font-black text-white tracking-tight text-xs uppercase tracking-wider">
                Listado de Graduados - Ceremonia Activa
              </h3>
              <span className="text-[9px] bg-slate-900 border border-white/10 px-2 py-0.5 rounded-lg text-white/60">
                Padrón
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-950/30 text-white/40 font-bold border-b border-white/5 uppercase text-[8.5px] tracking-wider">
                    <th className="p-4 pl-6">ID</th>
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Carrera</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-center">Invitados</th>
                    <th className="p-4 pr-6 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {cargando && graduados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-white/40 font-bold uppercase tracking-widest text-[9px]">
                        Cargando Padrón de Egresados...
                      </td>
                    </tr>
                  ) : graduadosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-white/40 font-bold uppercase tracking-widest text-[9px]">
                        No se encontraron registros en la búsqueda
                      </td>
                    </tr>
                  ) : (
                    graduadosFiltrados.map((g, idx) => {
                      // Status mapping
                      let badgeColor = 'bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-[0_0_8px_rgba(14,165,233,0.05)]'
                      let label = 'Enviado'
                      if (g.estado === 'ACEPTADO') {
                        badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]'
                        label = 'Confirmado'
                      } else if (g.estado === 'PENDIENTE') {
                        badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]'
                        label = 'Pendiente'
                      } else if (g.estado === 'RECHAZADO') {
                        badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.05)]'
                        label = 'Inasistente'
                      }

                      return (
                        <tr key={g.id} className="hover:bg-white/[0.01] transition-all">
                          <td className="p-4 pl-6 font-mono text-white/40">{idx + 1}.</td>
                          <td className="p-4 font-bold text-white">{g.nombre}</td>
                          <td className="p-4 text-white/60">{g.carrera}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${badgeColor}`}>
                              {label}
                            </span>
                          </td>
                          <td className="p-4 text-center font-bold text-white/80">{g.acompanantesCount ?? 2}</td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => onNavegar('gestion-graduados')}
                                className="p-1.5 text-white/40 hover:text-[#29ABE2] hover:bg-white/5 rounded-lg transition"
                                title="Ver Detalles"
                              >
                                <Eye size={13} />
                              </button>
                              <button 
                                onClick={() => onNavegar('gestion-graduados')}
                                className="p-1.5 text-white/40 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition"
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
          background: rgba(14, 165, 233, 0.08);
          top: -150px; left: -100px;
          animation: orbitar1 20s ease-in-out infinite;
        }
        .orbe-2 {
          width: 350px; height: 350px;
          background: rgba(99, 102, 241, 0.06);
          bottom: -80px; right: -50px;
          animation: orbitar2 22s ease-in-out infinite;
        }
        .orbe-3 {
          width: 250px; height: 250px;
          background: rgba(236, 72, 153, 0.03);
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
