import { useState, useEffect } from 'react'
import { 
  Plus, Calendar, MapPin, Users, Trash2, 
  CheckCircle2, X, PlusCircle, ArrowRight, LayoutTemplate, Send, Radio, Flag, ListChecks
} from 'lucide-react'
import { obtenerCeremonias, crearCeremonia, activarCeremonia, eliminarCeremonia, actualizarEstadoCeremonia } from '../../lib/api'

const ACCENT = '#0EA5E9'
const DARK   = '#2A3448'

const ETAPAS = [
  ['BORRADOR', 'Borrador'], ['CONFIGURACION', 'Configuración'], ['CONVOCATORIA', 'Convocatoria'],
  ['PREPARACION', 'Preparación'], ['EN_VIVO', 'En vivo'], ['FINALIZADA', 'Finalizada'],
]

function estadoCeremonia(c) {
  return c.estado_operativo || (c.activa ? 'CONFIGURACION' : 'BORRADOR')
}

export function GestionCeremonias({ onVolver, onCambioCeremonia, onNavegar, sinHeader }) {
  const [ceremonias, setCeremonias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevoEvento, setNuevoEvento] = useState({
    nombre: '', fecha: '', lugar: 'Sede Beltrán', max_invitados: 4
  })
  const [mensaje, setMensaje] = useState(null)
  const [cambiando, setCambiando] = useState(false)
  const [actualizandoId, setActualizandoId] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    try {
      const datos = await obtenerCeremonias()
      setCeremonias(datos)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setCargando(false)
    }
  }

  async function handleCrear(e) {
    e.preventDefault()
    try {
      await crearCeremonia(nuevoEvento)
      setMostrarForm(false)
      setNuevoEvento({ nombre: '', fecha: '', lugar: 'Sede Beltrán', max_invitados: 4 })
      setMensaje({ tipo: 'exito', texto: 'Ceremonia creada con éxito' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  async function handleActivar(id) {
    setCambiando(true)
    setMensaje(null)
    const startTime = Date.now()
    try {
      await activarCeremonia(id)
      const elapsed = Date.now() - startTime
      const delay = Math.max(1500 - elapsed, 0)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      setMensaje({ tipo: 'exito', texto: 'Cambiando entorno de trabajo...' })
      cargar()
      if (onCambioCeremonia) onCambioCeremonia()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setCambiando(false)
    }
  }

  async function handleEliminar(id) {
    if (!window.confirm('¿Eliminar esta ceremonia? Se perderán todos los datos del padrón asociado.')) return
    try {
      await eliminarCeremonia(id)
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  async function handleAvanzar(c) {
    const indice = ETAPAS.findIndex(([id]) => id === estadoCeremonia(c))
    const siguiente = ETAPAS[Math.min(indice + 1, ETAPAS.length - 1)]?.[0]
    if (!siguiente || siguiente === estadoCeremonia(c)) return
    setActualizandoId(c.id)
    try {
      await actualizarEstadoCeremonia(c.id, siguiente)
      setMensaje({ tipo: 'exito', texto: siguiente === 'FINALIZADA' ? 'Ceremonia finalizada y archivada' : `Etapa actualizada: ${ETAPAS.find(([id]) => id === siguiente)?.[1]}` })
      cargar()
      if (siguiente === 'FINALIZADA' && onCambioCeremonia) onCambioCeremonia()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setActualizandoId(null)
    }
  }

  return (
    <div className="font-sans">
      {/* HEADER INTEGRADO PRO */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: DARK }}>Gestión de Ceremonias</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Multi-Hábitat & Entornos de Grado</p>
        </div>
        
        <button
          onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-sky-600 transition-all active:scale-95 shadow-sm"
        >
          <PlusCircle size={14} /> Nueva Ceremonia
        </button>
      </div>

      {/* ALERTAS ESTILIZADAS */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-2xl border flex justify-between items-center animate-in slide-in-from-top duration-300 ${
          mensaje.tipo === 'error' ? 'bg-red-50/55 border-red-100 text-red-700' : 'bg-emerald-50/55 border-emerald-100 text-emerald-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${mensaje.tipo === 'error' ? 'bg-red-100' : 'bg-emerald-100'}`}>
              {mensaje.tipo === 'error' ? <X size={14}/> : <CheckCircle2 size={14}/>}
            </div>
            <span className="font-bold text-xs uppercase tracking-wider">{mensaje.texto}</span>
          </div>
          <button onClick={() => setMensaje(null)} className="p-1 hover:bg-black/5 rounded-lg transition-colors"><X size={14}/></button>
        </div>
      )}

      {cargando ? (
        <div className="flex flex-col items-center justify-center py-24 select-none">
          <div className="relative w-14 h-14 flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-full border-3 border-t-[#0ea5e9] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
            <div className="absolute inset-1 rounded-full border-3 border-b-indigo-500 border-t-transparent border-r-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
            <img 
              src="/logo-oficial.png" 
              alt="SiGIC" 
              className="h-7 w-auto object-contain animate-pulse z-10 filter drop-shadow-[0_0_6px_rgba(14,165,233,0.5)]" 
            />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Sincronizando Entornos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ceremonias.map(c => (
            <div 
              key={c.id} 
              className={`relative bg-white rounded-2xl p-6 transition-all duration-300 border shadow-sm flex flex-col justify-between ${
                c.activa 
                  ? 'border-sky-500/50 shadow-md shadow-sky-500/5' 
                  : 'border-slate-100 hover:border-slate-300/80 hover:shadow-md'
              }`}
            >
              {/* Highlight superior para activo */}
              {!!c.activa && (
                <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-2xl bg-gradient-to-r from-sky-400 to-indigo-500" />
              )}

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider ${
                    c.activa ? 'bg-sky-50 text-[#0ea5e9] border border-sky-100' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${c.activa ? 'bg-sky-500 animate-pulse' : 'bg-slate-300'}`} />
                    {c.activa ? 'Entorno Activo' : 'Inactivo'}
                  </div>
                  
                  {!c.activa && (
                    <button 
                      onClick={() => handleEliminar(c.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      title="Eliminar Ceremonia"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="mb-5">
                  <h3 className="text-base font-black tracking-tight leading-tight mb-2.5" style={{ color: DARK }}>
                    {c.nombre}
                  </h3>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={13} style={{ color: ACCENT }} />
                      <span className="text-[11px] font-semibold text-slate-600">
                        {new Date(c.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin size={13} style={{ color: ACCENT }} />
                      <span className="text-[11px] font-semibold text-slate-600">{c.lugar}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users size={13} style={{ color: ACCENT }} />
                      <span className="text-[11px] font-semibold text-slate-600">{c.max_invitados} Invitados permitidos</span>
                    </div>
                  </div>
                </div>
                {(() => {
                  const estado = estadoCeremonia(c)
                  const indice = ETAPAS.findIndex(([id]) => id === estado)
                  const tareas = [
                    { ok: Boolean(c.total_egresados), texto: `${c.total_egresados || 0} graduados cargados`, destino: 'gestion-graduados' },
                    { ok: Boolean(c.plano_configurado), texto: 'Plano de butacas configurado', destino: 'seleccion-asientos' },
                    { ok: Number(c.invitaciones_enviadas) >= Number(c.total_egresados) && Number(c.total_egresados) > 0, texto: `${c.invitaciones_enviadas || 0}/${c.total_egresados || 0} invitaciones enviadas`, destino: 'gestion-graduados' },
                  ]
                  return <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500"><ListChecks size={13} className="text-sky-500" /> {ETAPAS[indice]?.[1] || 'Borrador'}</span><span className="text-[9px] font-bold text-slate-400">{indice + 1}/6</span></div>
                    <div className="mb-3 flex gap-1">{ETAPAS.map(([id], paso) => <span key={id} className={`h-1 flex-1 rounded-full ${paso <= indice ? 'bg-sky-500' : 'bg-slate-200'}`} />)}</div>
                    <div className="space-y-1.5">{tareas.map(tarea => <button key={tarea.texto} onClick={() => onNavegar?.(tarea.destino)} className="flex w-full items-center gap-2 text-left text-[10px] font-semibold text-slate-500 hover:text-sky-600"><CheckCircle2 size={12} className={tarea.ok ? 'text-emerald-500' : 'text-slate-300'} />{tarea.texto}</button>)}</div>
                  </div>
                })()}
              </div>

              {c.activa ? (
                estadoCeremonia(c) === 'FINALIZADA' ? <div className="w-full text-center py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Ceremonia archivada</div> :
                <button onClick={() => handleAvanzar(c)} disabled={actualizandoId === c.id} className="flex w-full items-center justify-center gap-2 bg-slate-900 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-sky-500 disabled:opacity-60 rounded-xl">
                  {actualizandoId === c.id ? 'Actualizando...' : <>{ETAPAS[Math.min(ETAPAS.findIndex(([id]) => id === estadoCeremonia(c)) + 1, ETAPAS.length - 1)]?.[1] || 'Finalizar'} <ArrowRight size={13} /></>}
                </button>
              ) : (
                <button
                  onClick={() => handleActivar(c.id)}
                  className="w-full bg-slate-900 hover:bg-sky-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-98"
                >
                  Activar Entorno
                </button>
              )}
            </div>
          ))}
          
          {/* CARD AGREGAR RÁPIDO */}
          <button 
            onClick={() => setMostrarForm(true)}
            className="flex flex-col items-center justify-center gap-3 bg-slate-50/40 rounded-2xl border-2 border-dashed border-slate-200 p-6 hover:bg-white hover:border-sky-300 hover:shadow-md transition-all group min-h-[200px]"
          >
            <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-sky-500 group-hover:rotate-90 transition-all duration-300 shadow-sm">
              <Plus size={20} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-sky-500">Nuevo Entorno</p>
          </button>
        </div>
      )}

      {/* MODAL NUEVA CEREMONIA - ESTILO PREMIUM PRO */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="bg-gradient-to-r from-sky-400 to-[#0EA5E9] p-6 text-white relative">
              <h2 className="text-lg font-black tracking-tight">Crear Ceremonia</h2>
              <p className="text-sky-100 text-[8.5px] font-bold uppercase tracking-[0.25em]">Inicialización de nuevo hábitat</p>
              
              <button 
                onClick={() => setMostrarForm(false)} 
                className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCrear} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Ceremonia</label>
                <input 
                  autoFocus
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-sky-500 focus:bg-white transition-all outline-none" 
                  placeholder="Ej: Colación de Grado - Turno Mañana"
                  value={nuevoEvento.nombre} 
                  onChange={e => setNuevoEvento({...nuevoEvento, nombre: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha del Evento</label>
                  <input 
                    required type="date" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-sky-500 focus:bg-white transition-all outline-none" 
                    value={nuevoEvento.fecha} 
                    onChange={e => setNuevoEvento({...nuevoEvento, fecha: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Máximo Invitados</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-sky-500 focus:bg-white transition-all outline-none" 
                    value={nuevoEvento.max_invitados} 
                    onChange={e => setNuevoEvento({...nuevoEvento, max_invitados: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sede / Ubicación</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-sky-500 focus:bg-white transition-all outline-none" 
                  value={nuevoEvento.lugar} 
                  onChange={e => setNuevoEvento({...nuevoEvento, lugar: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setMostrarForm(false)} 
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-slate-900 hover:bg-sky-500 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-98"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  )
}
