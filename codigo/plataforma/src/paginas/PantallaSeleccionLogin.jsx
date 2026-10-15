import { useState } from 'react'
import {
  Users,
  GraduationCap,
  BookOpen,
  Info,
  LogIn,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Settings,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ScanLine
} from 'lucide-react'
import { VERSION_LABEL } from '../lib/version'
import { iniciarSesionAdmin } from '../servicios/api'

export function PantallaSeleccionLogin({
  onSeleccionarAdmin,
  onSeleccionarEgresado,
  onSeleccionarManual,
  onLoginAdminExitoso,
  onLoginGraduadoExitoso,
  enMantenimiento,
  modoDemo = false
}) {
  const [tabActiva, setTabActiva] = useState('admin') // 'admin' | 'graduado' | 'equipo'
  
  // Estado para el formulario de login administrativo
  const [correo, setCorreo] = useState('admin@sigic.com')
  const [clave, setClave] = useState('')
  const [cargando, setCargando] = useState(false)
  const [errorLogin, setErrorLogin] = useState('')
  const [exitoLogin, setExitoLogin] = useState(false)

  // Estado para el acceso de graduados
  const [identificadorGraduado, setIdentificadorGraduado] = useState('')

  const equipo = [
    { nombre: 'Julián Cancelo', rol: 'Coordinación & Full-Stack', hex: '#0284c7' },
    { nombre: 'Alan Alexis Alfonso', rol: 'Arquitectura & Backend', hex: '#6366f1' },
    { nombre: 'Sol Contreras V.', rol: 'Diseño UX & Frontend', hex: '#ec4899' },
    { nombre: 'Matías Frassia', rol: 'Base de Datos & Seguridad', hex: '#f59e0b' },
    { nombre: 'Luis Gabriel Santillán', rol: 'App Móvil & Testing', hex: '#10b981' },
  ]

  async function ejecutarLoginAdmin(e) {
    if (e) e.preventDefault()
    if (!correo.trim() || !clave) {
      setErrorLogin('Por favor completá tu correo y contraseña.')
      return
    }

    setCargando(true)
    setErrorLogin('')
    try {
      const res = await iniciarSesionAdmin(correo.trim().toLowerCase(), clave)
      setExitoLogin(true)
      setTimeout(() => {
        if (onLoginAdminExitoso && res?.usuario) {
          onLoginAdminExitoso({
            id: res.usuario.id,
            nombre: res.usuario.nombre,
            correo: res.usuario.email,
            rol: res.usuario.rol
          })
        } else if (onSeleccionarAdmin) {
          onSeleccionarAdmin()
        }
      }, 400)
    } catch (err) {
      setErrorLogin(err?.message || 'Credenciales incorrectas. Verificá tu correo y contraseña.')
    } finally {
      setCargando(false)
    }
  }

  function autocompletar(tipo) {
    setErrorLogin('')
    if (tipo === 'admin') {
      setCorreo('admin@sigic.com')
      setClave('35230531')
    } else if (tipo === 'soporte') {
      setCorreo('soporte@sigic.com.ar')
      setClave('35230531')
    } else if (tipo === 'porteria') {
      setCorreo('porteria@sigic.com')
      setClave('35230531')
    }
  }

  // Si está en mantenimiento
  if (enMantenimiento) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-[#071626] to-[#030911] text-white">
        <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8 py-10 text-center bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-xl shadow-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mb-6 border border-amber-500/30">
            <Settings size={32} className="animate-[spin_6s_linear_infinite]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2">Sistema en Mantenimiento</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Se están realizando tareas programadas de mantenimiento y actualización en el servidor. El acceso se restablecerá a la brevedad.
          </p>
          <div className="mt-8 text-[10px] uppercase font-bold tracking-widest text-slate-500">
            Instituto Tecnológico Beltrán · SiGIC
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-br from-slate-950 via-[#071a2e] to-[#02070f] text-slate-100 font-sans select-none">
      {/* Resplandores de fondo institucional Azul Beltrán */}
      <div className="absolute top-1/4 left-1/3 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 h-[450px] w-[450px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />

      {/* Contenedor Principal (Tarjeta Enterprise) */}
      <div className="relative z-10 w-full max-w-xl rounded-[32px] border border-white/12 bg-slate-900/80 shadow-[0_30px_90px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl overflow-hidden transition-all duration-300">
        
        {/* Encabezado Institucional */}
        <header className="px-8 pt-8 pb-6 border-b border-white/8 text-center relative">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/logo-oficial.png" alt="SiGIC" className="h-14 w-auto object-contain drop-shadow-md" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 mb-2">
            Instituto Tecnológico Beltrán
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            SiGIC <span className="text-cyan-400">Colaciones</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Sistema de Gestión Integral de Ceremonias de Graduación
          </p>

          {/* Navegación por Pestañas */}
          <div className="mt-6 flex items-center justify-center gap-1.5 p-1 rounded-2xl bg-slate-950/60 border border-white/8">
            <button
              type="button"
              onClick={() => { setTabActiva('admin'); setErrorLogin('') }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tabActiva === 'admin'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users size={14} />
              <span>Administración</span>
            </button>
            <button
              type="button"
              onClick={() => { setTabActiva('graduado'); setErrorLogin('') }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tabActiva === 'graduado'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <GraduationCap size={14} />
              <span>Graduados</span>
            </button>
            <button
              type="button"
              onClick={() => { setTabActiva('equipo'); setErrorLogin('') }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tabActiva === 'equipo'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Info size={14} />
              <span>Equipo</span>
            </button>
          </div>
        </header>

        {/* Cuerpo de la Tarjeta */}
        <div className="p-8">
          
          {/* PESTAÑA 1: ACCESO ADMINISTRATIVO DIRECTO */}
          {tabActiva === 'admin' && (
            <form onSubmit={ejecutarLoginAdmin} className="space-y-4">
              {errorLogin && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-fade-in">
                  <AlertCircle size={16} className="shrink-0 text-rose-400" />
                  <span>{errorLogin}</span>
                </div>
              )}

              {exitoLogin && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-fade-in">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                  <span>Credenciales validadas. Ingresando a la plataforma...</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Correo Electrónico Institucional
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={e => setCorreo(e.target.value)}
                    placeholder="admin@sigic.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Contraseña de Acceso
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={clave}
                    onChange={e => setClave(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  />
                </div>
              </div>

              {/* Botón Principal de Inicio de Sesión */}
              <button
                type="submit"
                disabled={cargando || exitoLogin}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {cargando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>Validando acceso...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Iniciar Sesión en SiGIC</span>
                  </>
                )}
              </button>

              {/* Botones de Relleno Rápido (Ideales para Evaluación & Demostración) */}
              <div className="pt-4 border-t border-white/8 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Accesos Rápidos de Evaluación (1 clic)
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => autocompletar('admin')}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-all cursor-pointer active:scale-95"
                  >
                    👑 Administrador
                  </button>
                  <button
                    type="button"
                    onClick={() => autocompletar('soporte')}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-all cursor-pointer active:scale-95"
                  >
                    🛠️ Soporte Técnico
                  </button>
                  <button
                    type="button"
                    onClick={() => autocompletar('porteria')}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-all cursor-pointer active:scale-95"
                  >
                    🚪 Portería & Acceso
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* PESTAÑA 2: PORTAL DEL GRADUADO */}
          {tabActiva === 'graduado' && (
            <div className="space-y-5 animate-fade-in text-center">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-left">
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-300 mb-1">
                  Autogestión de Colación
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Si sos graduado, confirmá tu asistencia, seleccioná tus butacas en el anfiteatro, cargá acompañantes y generá tu credencial digital con código QR.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5 text-left">
                  DNI o Código de Invitación
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={identificadorGraduado}
                    onChange={e => setIdentificadorGraduado(e.target.value)}
                    placeholder="Ej: 42123456 o token OTP"
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={onSeleccionarEgresado}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <GraduationCap size={18} />
                  <span>Ingresar al Portal</span>
                </button>
              </div>

              <div className="pt-4 border-t border-white/8">
                <p className="text-xs text-slate-400">
                  ¿Recibiste la invitación por correo? Hacé clic directamente en el enlace que te enviamos para ingresar sin contraseña.
                </p>
              </div>
            </div>
          )}

          {/* PESTAÑA 3: ACERCA DEL EQUIPO Y PROYECTO */}
          {tabActiva === 'equipo' && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                  Práctica Profesionalizante 2026
                </span>
                <h3 className="text-base font-black text-white">Equipo de Desarrollo SiGIC</h3>
                <p className="text-xs text-slate-400">Instituto Tecnológico Beltrán</p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {equipo.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/8 transition-colors"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-xs text-white shadow-md"
                      style={{ backgroundColor: m.hex }}
                    >
                      {m.nombre.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{m.nombre}</p>
                      <p className="text-[10px] text-slate-400 truncate">{m.rol}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/8 text-center mt-3">
                <span className="text-[10px] font-mono text-cyan-300">
                  Debian 13 · Next.js 16 · PostgreSQL · React Native · Expo
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Footer Institucional con Acceso al Manual */}
        <footer className="px-8 py-4 bg-slate-950/80 border-t border-white/8 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={onSeleccionarManual}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
          >
            <BookOpen size={14} />
            <span>Manual de Usuario</span>
          </button>

          <span className="font-mono text-[10px] text-slate-500">
            {VERSION_LABEL}
          </span>
        </footer>

      </div>
    </main>
  )
}
