import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { inicializarSistema } from '../servicios/api'

export function AsistenteSetup({ onFinalizado }) {
  const [paso, setPaso] = useState(1) // 1: Info Evento, 2: Info Admin
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  // Datos
  const [evento, setEvento] = useState({ nombreEvento: '', fechaEvento: '', lugarEvento: '' })
  const [admin, setAdmin] = useState({ nombre: '', email: '', password: '' })

  const esPaso1Valido = evento.nombreEvento.trim() && evento.fechaEvento && evento.lugarEvento.trim()
  const esPaso2Valido = admin.nombre.trim() && admin.email.trim() && admin.password.trim()

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
      onFinalizado() // Le avisa a App.jsx que recargue el estado y vaya al login
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
      {/* Fondo decorativo (Efecto premium moderno) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-sky-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden flex flex-col md:flex-row border border-white/50">
        
        {/* Panel Izquierdo: Branding y Progreso */}
        <div className="bg-slate-900 text-white p-10 md:w-2/5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-32 -mt-32" />
          
          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tight mb-2">Bienvenido a SiGIC.</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Detectamos que el sistema está completamente virgen. Vamos a configurarlo en 2 simples pasos para dejarlo listo para operar.
            </p>

            <div className="space-y-6">
              {/* Indicador Paso 1 */}
              <div className={`flex items-center gap-4 transition-all duration-300 ${paso === 1 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${paso === 1 ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800 text-slate-400'}`}>
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Tu Institución</h3>
                  <p className="text-xs text-slate-500">Datos de la ceremonia</p>
                </div>
              </div>

              {/* Linea conectora */}
              <div className="w-0.5 h-6 bg-slate-800 ml-5" />

              {/* Indicador Paso 2 */}
              <div className={`flex items-center gap-4 transition-all duration-300 ${paso === 2 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${paso === 2 ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800 text-slate-400'}`}>
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Administrador</h3>
                  <p className="text-xs text-slate-500">Cuenta de acceso maestro</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-12">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">SiGIC Control Center Pro</div>
          </div>
        </div>

        {/* Panel Derecho: Formulario interactivo */}
        <div className="p-10 md:w-3/5 flex flex-col justify-center bg-white/50">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {paso === 1 ? (
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Datos de la primera Ceremonia</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del Evento</label>
                  <input
                    type="text"
                    placeholder="Ej: Acto de Colación 2026"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    value={evento.nombreEvento}
                    onChange={e => setEvento({ ...evento, nombreEvento: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lugar / Anfiteatro</label>
                    <input
                      type="text"
                      placeholder="Ej: Sede Beltrán"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      value={evento.lugarEvento}
                      onChange={e => setEvento({ ...evento, lugarEvento: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha Estimada</label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      value={evento.fechaEvento}
                      onChange={e => setEvento({ ...evento, fechaEvento: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setPaso(2)}
                  disabled={!esPaso1Valido}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Siguiente paso →
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Crear Super Administrador</h2>
              <form onSubmit={handleFinalizar} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    value={admin.nombre}
                    onChange={e => setAdmin({ ...admin, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="admin@sigic.com"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    value={admin.email}
                    onChange={e => setAdmin({ ...admin, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contraseña Maestra</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    value={admin.password}
                    onChange={e => setAdmin({ ...admin, password: e.target.value })}
                  />
                </div>
                <div className="mt-8 flex justify-between items-center">
                  <button 
                    type="button"
                    onClick={() => setPaso(1)}
                    className="text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors"
                  >
                    ← Volver
                  </button>
                  <button 
                    type="submit"
                    disabled={!esPaso2Valido || cargando}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                  >
                    {cargando ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Inicializando...
                      </>
                    ) : (
                      'Inicializar Sistema'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
