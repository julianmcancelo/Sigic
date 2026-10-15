import { useState } from 'react'
import { AlertCircle, CheckCircle2, Sparkles, Building2, UserCheck, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react'
import { inicializarSistema, guardarTokenSesion } from '../servicios/api'

export function AsistenteSetup({ onFinalizado }) {
  const [paso, setPaso] = useState(1) // 1: Info Evento, 2: Info Admin
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(false)

  // Datos precargados con identidad oficial Beltrán 2026
  const [evento, setEvento] = useState({
    nombreEvento: 'Colación Oficial Beltrán 2026',
    fechaEvento: '2026-11-20',
    lugarEvento: 'Auditorio Central Beltrán'
  })

  const [admin, setAdmin] = useState({
    nombre: 'Administrador Beltrán',
    email: 'admin@sigic.com',
    password: '',
    setupKey: '35230531'
  })

  const esPaso1Valido = evento.nombreEvento.trim() && evento.fechaEvento && evento.lugarEvento.trim()
  const esPaso2Valido = admin.nombre.trim() && admin.email.trim() && admin.password.trim()

  function cargarValoresRecomendados() {
    setEvento({
      nombreEvento: 'Colación Oficial Beltrán 2026',
      fechaEvento: '2026-11-20',
      lugarEvento: 'Auditorio Central Beltrán'
    })
    setAdmin({
      nombre: 'Administrador Beltrán',
      email: 'admin@sigic.com',
      password: 'ColacionBeltran2026!',
      setupKey: '35230531'
    })
    setError(null)
  }

  async function handleFinalizar(e) {
    if (e) e.preventDefault()
    if (!esPaso2Valido) return

    setCargando(true)
    setError(null)

    try {
      const res = await inicializarSistema({
        ...evento,
        ...admin
      })

      // Guardar sesión y token JWT de inmediato
      if (res?.token) {
        guardarTokenSesion(res.token)
      }
      if (res?.usuario) {
        localStorage.setItem('sesion_admin', 'true')
        localStorage.setItem('admin_user', JSON.stringify({
          id: res.usuario.id,
          nombre: res.usuario.nombre,
          correo: res.usuario.email,
          rol: res.usuario.rol
        }))
      }

      setExito(true)

      // Transición fluida al panel principal
      setTimeout(() => {
        if (onFinalizado) {
          onFinalizado(res)
        } else {
          window.location.href = '/'
        }
      }, 700)
    } catch (err) {
      setError(err?.message || 'Error al inicializar el sistema.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#071a2e] to-[#02070f] text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans select-none">
      {/* Resplandores de fondo */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl bg-slate-900/85 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)] rounded-[32px] overflow-hidden flex flex-col md:flex-row border border-white/12">
        
        {/* Panel Izquierdo: Branding y Progreso */}
        <div className="bg-slate-950/90 text-white p-8 md:p-10 md:w-2/5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/8 relative">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo-oficial.png" alt="SiGIC" className="h-12 w-auto object-contain drop-shadow" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">
                  Instituto Beltrán
                </span>
                <span className="text-lg font-black tracking-tight text-white block">
                  SiGIC OS
                </span>
              </div>
            </div>

            <h1 className="text-2xl font-black tracking-tight mb-2">Primer Inicio Asistido</h1>
            <p className="text-slate-400 text-xs leading-relaxed mb-8">
              Configurá en 2 pasos tu primera ceremonia y tu cuenta administrativa para dejar la plataforma 100% lista para operar.
            </p>

            <div className="space-y-4">
              {/* Indicador Paso 1 */}
              <div className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all ${
                paso === 1 
                  ? 'bg-cyan-500/15 border-cyan-400/40 text-white' 
                  : 'bg-white/5 border-white/5 text-slate-400 opacity-60'
              }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                  paso === 1 ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' : 'bg-white/10 text-slate-300'
                }`}>
                  1
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Tu Ceremonia</h3>
                  <p className="text-[10px] text-slate-400">Nombre, anfiteatro y fecha</p>
                </div>
              </div>

              {/* Indicador Paso 2 */}
              <div className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all ${
                paso === 2 
                  ? 'bg-cyan-500/15 border-cyan-400/40 text-white' 
                  : 'bg-white/5 border-white/5 text-slate-400 opacity-60'
              }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                  paso === 2 ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' : 'bg-white/10 text-slate-300'
                }`}>
                  2
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Administrador</h3>
                  <p className="text-[10px] text-slate-400">Cuenta de acceso maestro</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/8 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Práctica Profesionalizante 2026</span>
            <span className="text-cyan-400 font-bold">Paso {paso} de 2</span>
          </div>
        </div>

        {/* Panel Derecho: Formulario Interactivo */}
        <div className="p-8 md:p-10 md:w-3/5 flex flex-col justify-center bg-slate-900/60">
          
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 text-xs font-semibold animate-fade-in">
              <AlertCircle className="text-rose-400 mt-0.5 shrink-0" size={16} />
              <p>{error}</p>
            </div>
          )}

          {exito && (
            <div className="mb-5 p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
              <p>¡Sistema configurado e inicializado! Ingresando a la plataforma...</p>
            </div>
          )}

          {paso === 1 ? (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Datos de la Ceremonia</h2>
                  <p className="text-xs text-slate-400">Información del primer evento de graduación</p>
                </div>
                <button
                  type="button"
                  onClick={cargarValoresRecomendados}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  title="Cargar datos de ejemplo oficiales"
                >
                  <Sparkles size={13} />
                  <span>Cargar recomendados</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Nombre de la Ceremonia
                </label>
                <input
                  type="text"
                  placeholder="Ej: Colación Beltrán 2026"
                  className="w-full px-4 py-3 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  value={evento.nombreEvento}
                  onChange={e => setEvento({ ...evento, nombreEvento: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Lugar / Sede
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Auditorio Central Beltrán"
                    className="w-full px-4 py-3 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    value={evento.lugarEvento}
                    onChange={e => setEvento({ ...evento, lugarEvento: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Fecha del Evento
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    value={evento.fechaEvento}
                    onChange={e => setEvento({ ...evento, fechaEvento: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="button"
                  onClick={() => setPaso(2)}
                  disabled={!esPaso1Valido}
                  className="py-3 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  <span>Continuar al Administrador</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFinalizar} className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-white">Cuenta Administrativa Maestra</h2>
                <p className="text-xs text-slate-400">Usuario principal con permisos totales sobre el sistema</p>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Clave de Instalación
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={admin.setupKey}
                    onChange={e => setAdmin({ ...admin, setupKey: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-cyan-300 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  />
                </div>
                <span className="block text-[10px] text-slate-500 mt-1">
                  Clave por defecto de la cátedra: <strong>35230531</strong>
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Administrador Beltrán"
                  className="w-full px-4 py-3 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  value={admin.nombre}
                  onChange={e => setAdmin({ ...admin, nombre: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@sigic.com"
                    className="w-full px-4 py-3 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    value={admin.email}
                    onChange={e => setAdmin({ ...admin, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Contraseña Maestra
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-950/70 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    value={admin.password}
                    onChange={e => setAdmin({ ...admin, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button 
                  type="button"
                  onClick={() => setPaso(1)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={15} />
                  <span>Volver al paso 1</span>
                </button>

                <button 
                  type="submit"
                  disabled={!esPaso2Valido || cargando || exito}
                  className="py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {cargando ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Configurando sistema...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Inicializar y Entrar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  )
}
