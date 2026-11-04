import { useState } from 'react'
import { AlertCircle, ArrowRight, ArrowLeft, KeyRound, Calendar, MapPin, Building2, User, Mail, Lock, Sparkles, CheckCircle2 } from 'lucide-react'
import { inicializarSistema } from '../servicios/api'

export function AsistenteSetup({ onFinalizado }) {
  const [paso, setPaso] = useState(1) // 1: Info Evento, 2: Info Admin
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  // Datos
  const [evento, setEvento] = useState({ 
    nombreEvento: 'Colación Oficial Beltrán 2026', 
    fechaEvento: '2026-11-20', 
    lugarEvento: 'Auditorio Central Beltrán' 
  })
  const [admin, setAdmin] = useState({ 
    nombre: '', 
    email: '', 
    password: '', 
    setupKey: '04051990J' 
  })

  const esPaso1Valido = evento.nombreEvento.trim() && evento.fechaEvento && evento.lugarEvento.trim()
  const esPaso2Valido = admin.nombre.trim() && admin.email.trim() && admin.password.trim() && admin.setupKey.trim()

  async function handleFinalizar(e) {
    e.preventDefault()
    if (!esPaso2Valido) return

    setCargando(true)
    setError(null)

    try {
      await inicializarSistema({
        ...evento,
        ...admin
      })
      onFinalizado()
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-tr from-slate-100 via-sky-50/40 to-blue-50/30 flex items-center justify-center p-4 sm:p-6 antialiased selection:bg-sky-500 selection:text-white">
      {/* Orbes de luz decorativos de fondo */}
      <div className="absolute top-1/4 left-1/4 h-[420px] w-[420px] rounded-full bg-sky-300/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[450px] w-[450px] rounded-full bg-indigo-300/15 blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl bg-white/95 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.12)] rounded-[32px] overflow-hidden flex flex-col md:flex-row border border-slate-200/90">
        
        {/* Panel Izquierdo: Branding y Progreso */}
        <div className="bg-[#0A192F] text-white p-8 sm:p-10 md:w-2/5 flex flex-col justify-between relative overflow-hidden">
          {/* Halos decorativos de fondo en el panel oscuro */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-sky-500/20 rounded-full blur-[70px] pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-[70px] pointer-events-none" />

          <div className="relative z-10">
            {/* Logo de SiGIC en tarjeta blanca */}
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-lg shadow-black/20 border border-white/20">
              <img src="/logo.png" alt="SiGIC" className="h-full w-full object-contain" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-[10px] font-black uppercase tracking-wider mb-3 border border-white/10">
              <Sparkles size={11} /> Configuración Inicial
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2 leading-tight">
              Bienvenido a SiGIC.
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-8">
              El sistema se encuentra listo para inicializar. Configurá la primera colación en 2 simples pasos para dejar la plataforma operativa.
            </p>

            <div className="space-y-6">
              {/* Indicador Paso 1 */}
              <div className={`flex items-center gap-3.5 transition-all duration-300 ${paso === 1 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                  paso === 1 
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/40 ring-4 ring-sky-500/20' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  1
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white">Tu Institución</h3>
                  <p className="text-[11px] text-slate-400">Datos de la primera ceremonia</p>
                </div>
              </div>

              {/* Línea conectora */}
              <div className="w-0.5 h-5 bg-slate-800 ml-4" />

              {/* Indicador Paso 2 */}
              <div className={`flex items-center gap-3.5 transition-all duration-300 ${paso === 2 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                  paso === 2 
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/40 ring-4 ring-sky-500/20' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  2
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white">Administrador</h3>
                  <p className="text-[11px] text-slate-400">Cuenta de acceso maestro</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-10 pt-6 border-t border-slate-800/80">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">
              Instituto Tecnológico Beltrán
            </p>
            <p className="text-[8.5px] text-slate-500 font-mono mt-0.5">
              TSAS · Control Center Pro v0.2.0
            </p>
          </div>
        </div>

        {/* Panel Derecho: Formulario interactivo */}
        <div className="p-8 sm:p-10 md:w-3/5 flex flex-col justify-center bg-white">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200/80 rounded-2xl flex items-start gap-3 animate-fade-in">
              <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
              <p className="text-xs text-red-700 font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          {paso === 1 ? (
            <div className="animate-fade-in">
              <div className="mb-6">
                <span className="text-[11px] font-black uppercase tracking-wider text-sky-600">Paso 1 de 2</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                  Datos de la primera Ceremonia
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Ingresá los datos del acto de graduación para configurar el anfiteatro.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Building2 size={13} className="text-sky-600" /> Nombre del Evento
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Acto de Colación Beltrán 2026"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all font-medium"
                    value={evento.nombreEvento}
                    onChange={e => setEvento({ ...evento, nombreEvento: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <MapPin size={13} className="text-sky-600" /> Lugar / Anfiteatro
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Auditorio Central Beltrán"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all font-medium"
                      value={evento.lugarEvento}
                      onChange={e => setEvento({ ...evento, lugarEvento: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Calendar size={13} className="text-sky-600" /> Fecha Estimada
                    </label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all font-medium"
                      value={evento.fechaEvento}
                      onChange={e => setEvento({ ...evento, fechaEvento: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Barra de acciones Paso 1 (Separada y limpia) */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={onFinalizado}
                  className="text-slate-400 hover:text-sky-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  Iniciar sesión con cuentas predeterminadas →
                </button>

                <button 
                  type="button"
                  onClick={() => setPaso(2)}
                  disabled={!esPaso1Valido}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold px-7 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span>Siguiente paso</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="mb-6">
                <span className="text-[11px] font-black uppercase tracking-wider text-sky-600">Paso 2 de 2</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                  Crear cuenta administrativa
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Establecé el usuario maestro que administrará los graduados y ceremonias.
                </p>
              </div>

              <form onSubmit={handleFinalizar} className="space-y-4">
                {/* Clave de Instalación Remota / Default */}
                <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80">
                  <label className="block text-[11px] font-black text-sky-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <KeyRound size={13} className="text-sky-600" /> Clave de Instalación
                    </span>
                    <span className="text-[9.5px] font-mono font-bold text-sky-700 bg-white px-2 py-0.5 rounded-full border border-sky-200">
                      Default: 04051990J
                    </span>
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="04051990J"
                    className="w-full bg-white border border-sky-200 text-slate-900 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 font-mono font-bold tracking-wider"
                    value={admin.setupKey}
                    onChange={e => setAdmin({ ...admin, setupKey: e.target.value })}
                  />
                  <p className="text-[10.5px] text-sky-700 font-medium mt-1">
                    Validada de forma remota contra el servidor central o local por clave default.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User size={13} className="text-sky-600" /> Nombre Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Administrador General"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all font-medium"
                    value={admin.nombre}
                    onChange={e => setAdmin({ ...admin, nombre: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Mail size={13} className="text-sky-600" /> Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="admin@sigic.com.ar"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all font-medium"
                    value={admin.email}
                    onChange={e => setAdmin({ ...admin, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Lock size={13} className="text-sky-600" /> Contraseña Maestra
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all font-medium"
                    value={admin.password}
                    onChange={e => setAdmin({ ...admin, password: e.target.value })}
                  />
                </div>

                {/* Barra de acciones Paso 2 */}
                <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <button 
                    type="button"
                    onClick={() => setPaso(1)}
                    className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Volver</span>
                  </button>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={onFinalizado}
                      className="text-slate-400 hover:text-sky-600 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Omitir asistente →
                    </button>

                    <button 
                      type="submit"
                      disabled={!esPaso2Valido || cargando}
                      className="inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold px-7 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      {cargando ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Inicializando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Inicializar Sistema</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
