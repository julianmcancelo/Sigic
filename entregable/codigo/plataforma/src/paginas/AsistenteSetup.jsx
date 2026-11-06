import { useState } from 'react'
import { AlertCircle, ArrowRight, ArrowLeft, KeyRound, Calendar, MapPin, Building2, User, Mail, Lock, CheckCircle2, Phone, Globe, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react'
import { inicializarSistema, iniciarSesionAdmin } from '../servicios/api'

export function AsistenteSetup({ onFinalizado }) {
  const [paso, setPaso] = useState(1) // 1: Institución, 2: Info Evento, 3: Info Admin
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  // Datos Institucionales
  const [institucion, setInstitucion] = useState({
    nombreInstitucion: 'Instituto Tecnológico Beltrán',
    siglaInstitucion: 'ITB',
    direccionInstitucion: 'Av. Manuel Belgrano 1191, Avellaneda',
    contactoEmailInstitucion: 'colaciones@ibeltran.com.ar',
    telefonoInstitucion: '+54 11 4265-0200',
    carreraPrincipal: 'Tecnicatura Superior en Analista de Sistemas'
  })

  // Datos de Ceremonia
  const [evento, setEvento] = useState({ 
    nombreEvento: 'Colación Beltrán 2026', 
    fechaEvento: '2026-11-20', 
    lugarEvento: 'Auditorio Beltrán' 
  })

  // Datos de Administrador
  const [admin, setAdmin] = useState({ 
    nombre: '', 
    email: '', 
    password: '', 
    setupKey: '04051990J' 
  })

  const esPaso1Valido = institucion.nombreInstitucion.trim() && institucion.direccionInstitucion.trim()
  const esPaso2Valido = evento.nombreEvento.trim() && evento.fechaEvento && evento.lugarEvento.trim()
  const esPaso3Valido = admin.nombre.trim() && admin.email.trim() && admin.password.trim() && admin.setupKey.trim()

  function handleCargarCredencialesPredeterminadas() {
    setAdmin({
      nombre: 'Administrador Institucional',
      email: 'admin@sigic.com.ar',
      password: 'admin',
      setupKey: '04051990J'
    })
  }

  async function handleFinalizar(e) {
    e.preventDefault()
    if (!esPaso3Valido) return

    setCargando(true)
    setError(null)

    try {
      const respuesta = await inicializarSistema({
        ...institucion,
        ...evento,
        ...admin
      })
      onFinalizado(respuesta)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 selection:bg-sky-500 selection:text-white">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-3xl overflow-hidden flex flex-col md:flex-row border border-slate-200">
        
        {/* Panel Izquierdo: Institucional Beltrán */}
        <div className="bg-[#0A192F] text-white p-8 md:w-2/5 flex flex-col justify-between">
          <div>
            {/* Logo de SiGIC */}
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
              <img src="/logo.png" alt="SiGIC" className="h-full w-full object-contain" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              Configuración Inicial
            </h1>
            <p className="text-slate-300 text-xs leading-relaxed mb-6">
              Completá estos datos para dejar el sistema listo.
            </p>

            <div className="space-y-4">
              {/* Paso 1: Institución */}
              <div className={`flex items-center gap-3 transition-opacity ${paso === 1 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  paso === 1 ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-white">Institución</h3>
                  <p className="text-[11px] text-slate-400">Identidad y sede</p>
                </div>
              </div>

              {/* Paso 2: Ceremonia */}
              <div className={`flex items-center gap-3 transition-opacity ${paso === 2 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  paso === 2 ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-white">Ceremonia</h3>
                  <p className="text-[11px] text-slate-400">Datos del acto</p>
                </div>
              </div>

              {/* Paso 3: Administrador */}
              <div className={`flex items-center gap-3 transition-opacity ${paso === 3 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  paso === 3 ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-white">Administrador</h3>
                  <p className="text-[11px] text-slate-400">Usuario principal</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 text-slate-400 text-[11px] font-medium truncate">
            {institucion.nombreInstitucion || 'Instituto Tecnológico Beltrán'}
          </div>
        </div>

        {/* Panel Derecho: Formularios dinámicos por paso */}
        <div className="p-8 md:w-3/5 flex flex-col justify-center bg-white">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={16} />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* PASO 1: DATOS INSTITUCIONALES */}
          {paso === 1 && (
            <div>
              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    Datos del Instituto
                  </h2>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-150">
                    Paso 1 de 3
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identidad oficial para notificaciones, correos y credenciales.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Oficial de la Institución
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Instituto Tecnológico Beltrán"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-500 focus:bg-white transition-colors"
                    value={institucion.nombreInstitucion}
                    onChange={e => setInstitucion({ ...institucion, nombreInstitucion: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sigla / Acrónimo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: ITB"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-500 focus:bg-white transition-colors uppercase font-bold"
                      value={institucion.siglaInstitucion}
                      onChange={e => setInstitucion({ ...institucion, siglaInstitucion: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Teléfono / Mesa de Ayuda
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: +54 11 4265-0200"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-500 focus:bg-white transition-colors"
                      value={institucion.telefonoInstitucion}
                      onChange={e => setInstitucion({ ...institucion, telefonoInstitucion: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dirección o Sede Central
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Av. Manuel Belgrano 1191, Avellaneda"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-500 focus:bg-white transition-colors"
                    value={institucion.direccionInstitucion}
                    onChange={e => setInstitucion({ ...institucion, direccionInstitucion: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Institucional para Consultas
                  </label>
                  <input
                    type="email"
                    placeholder="colaciones@ibeltran.com.ar"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-500 focus:bg-white transition-colors"
                    value={institucion.contactoEmailInstitucion}
                    onChange={e => setInstitucion({ ...institucion, contactoEmailInstitucion: e.target.value })}
                  />
                </div>
              </div>

              {/* Botones Paso 1 */}
              <div className="mt-7 pt-4 border-t border-slate-100 flex items-center justify-end">
                <button 
                  type="button"
                  onClick={() => setPaso(2)}
                  disabled={!esPaso1Valido}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <span>Continuar</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: DATOS DE LA CEREMONIA */}
          {paso === 2 && (
            <div>
              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    Datos de la Ceremonia
                  </h2>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-150">
                    Paso 2 de 3
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Podés cambiarlos más adelante desde el panel.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre del Evento
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Colación Beltrán 2026"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-500 focus:bg-white transition-colors"
                    value={evento.nombreEvento}
                    onChange={e => setEvento({ ...evento, nombreEvento: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lugar
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Auditorio Beltrán"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-500 focus:bg-white transition-colors"
                      value={evento.lugarEvento}
                      onChange={e => setEvento({ ...evento, lugarEvento: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-500 focus:bg-white transition-colors"
                      value={evento.fechaEvento}
                      onChange={e => setEvento({ ...evento, fechaEvento: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Botones Paso 2 */}
              <div className="mt-7 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setPaso(1)}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Atrás</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setPaso(3)}
                  disabled={!esPaso2Valido}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <span>Continuar</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: CREAR ADMINISTRADOR */}
          {paso === 3 && (
            <div>
              <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      Crear Administrador
                    </h2>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-150">
                      Paso 3 de 3
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Con este usuario vas a ingresar y administrar la plataforma.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCargarCredencialesPredeterminadas}
                  title="Cargar credenciales administrativas recomendadas para el Beltrán"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Sparkles size={12} className="text-sky-600" />
                  <span>Cargar por defecto</span>
                </button>
              </div>

              <form onSubmit={handleFinalizar} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clave de Instalación
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="04051990J"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-500 focus:bg-white transition-colors font-mono"
                    value={admin.setupKey}
                    onChange={e => setAdmin({ ...admin, setupKey: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    placeholder="Tu nombre y apellido"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-500 focus:bg-white transition-colors"
                    value={admin.nombre}
                    onChange={e => setAdmin({ ...admin, nombre: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="admin@correo.com"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-500 focus:bg-white transition-colors"
                    value={admin.email}
                    onChange={e => setAdmin({ ...admin, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Contraseña segura"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-500 focus:bg-white transition-colors"
                    value={admin.password}
                    onChange={e => setAdmin({ ...admin, password: e.target.value })}
                  />
                </div>

                {/* Botones Paso 3 */}
                <div className="mt-7 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setPaso(2)}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    <span>Atrás</span>
                  </button>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={onFinalizado}
                      className="text-slate-400 hover:text-slate-700 text-xs font-medium cursor-pointer"
                    >
                      Omitir
                    </button>

                    <button 
                      type="submit"
                      disabled={!esPaso3Valido || cargando}
                      className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      {cargando ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <span>Listo, comenzar</span>
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
