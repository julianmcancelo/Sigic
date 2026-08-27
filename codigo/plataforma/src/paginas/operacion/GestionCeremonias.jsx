import { useState, useEffect } from 'react'
import { 
  Plus, Calendar, MapPin, Users, Trash2, 
  CheckCircle2, X, PlusCircle, ArrowRight, LayoutTemplate, Send, Radio, Flag, ListChecks,
  ClipboardList, UserPlus, Armchair, ScanLine, BarChart3, PlayCircle, LoaderCircle, Clock, Mic
} from 'lucide-react'
import { obtenerCeremonias, crearCeremonia, activarCeremonia, eliminarCeremonia, actualizarEstadoCeremonia } from '../../lib/api'
import { useConfirmacion } from '../../componentes/ModalConfirmacion'

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
  const { confirmar, dialogoConfirmacion } = useConfirmacion()
  const [ceremonias, setCeremonias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevoEvento, setNuevoEvento] = useState({
    nombre: '', fecha: '', lugar: 'Sede Beltrán', max_invitados: 4, fecha_limite_confirmacion: ''
  })
  const [mensaje, setMensaje] = useState(null)
  const [cambiando, setCambiando] = useState(false)
  const [actualizandoId, setActualizandoId] = useState(null)
  const [asistenteId, setAsistenteId] = useState(null)

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
      const res = await crearCeremonia(nuevoEvento)
      setMostrarForm(false)
      setNuevoEvento({ nombre: '', fecha: '', lugar: 'Sede Beltrán', max_invitados: 4, fecha_limite_confirmacion: '' })
      
      if (res?.id) {
        await activarCeremonia(res.id)
        if (onCambioCeremonia) onCambioCeremonia()
      }

      setMensaje({ tipo: 'exito', texto: 'Ceremonia creada y activada. ¡Comencemos cargando los graduados!' })
      await cargar()
      if (onNavegar) onNavegar('gestion-graduados')
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
    const ceremonia = ceremonias.find(item => item.id === id)
    const confirmado = await confirmar({
      titulo: 'Eliminar ceremonia',
      descripcion: `Se eliminará ${ceremonia?.nombre || 'esta ceremonia'} junto con todo el padrón asociado.`,
      textoConfirmar: 'Eliminar ceremonia',
      tipo: 'peligro',
    })
    if (!confirmado) return
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
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-sky-600 transition-all active:scale-95 shadow-sm cursor-pointer"
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
          <button onClick={() => setMensaje(null)} className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"><X size={14}/></button>
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
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
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

                    {c.fecha_limite_confirmacion && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={13} className="text-amber-500" />
                        <span className="text-[11px] font-semibold text-amber-700">
                          Cierre online: {new Date(c.fecha_limite_confirmacion).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} hs
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Visualización de fases y progreso */}
                {(() => {
                  const estado = estadoCeremonia(c)
                  const indice = ETAPAS.findIndex(([id]) => id === estado)
                  const graduados = Number(c.total_egresados || 0)
                  const plano = Boolean(c.plano_configurado)
                  const invitaciones = Number(c.invitaciones_enviadas || 0)

                  const tareas = [
                    { ok: graduados > 0, texto: graduados ? `${graduados} graduados cargados` : 'Cargar padrón de graduados', destino: 'gestion-graduados', paso: 'Paso 2' },
                    { ok: invitaciones >= graduados && graduados > 0, texto: graduados > 0 && invitaciones >= graduados ? `${invitaciones}/${graduados} invitaciones enviadas` : 'Enviar invitaciones por correo', destino: 'convocatoria', paso: 'Paso 3' },
                    { ok: plano, texto: plano ? 'Plano y butacas listos' : 'Configurar butacas y sala', destino: 'preparacion-ceremonia', paso: 'Paso 4' },
                  ]

                  return (
                    <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-600">
                          <ListChecks size={13} className="text-sky-500" /> Etapa: {ETAPAS[indice]?.[1] || 'Borrador'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">{indice + 1} de 6</span>
                      </div>

                      <div className="flex gap-1">
                        {ETAPAS.map(([id], paso) => (
                          <span key={id} className={`h-1.5 flex-1 rounded-full ${paso <= indice ? 'bg-sky-500' : 'bg-slate-200'}`} />
                        ))}
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {tareas.map(t => (
                          <button
                            key={t.paso}
                            onClick={() => onNavegar?.(t.destino)}
                            className="w-full flex items-center justify-between p-2 rounded-xl bg-white hover:bg-sky-50 border border-slate-100 hover:border-sky-200 transition text-left text-[10px] font-semibold text-slate-600 cursor-pointer group"
                          >
                            <span className="flex items-center gap-2">
                              <CheckCircle2 size={13} className={t.ok ? 'text-emerald-500' : 'text-slate-300'} />
                              <span>{t.texto}</span>
                            </span>
                            <span className="text-[8.5px] font-black uppercase text-slate-400 group-hover:text-sky-600 flex items-center gap-0.5">
                              Ir <ArrowRight size={10} />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {c.activa ? (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  {(() => {
                    const graduados = Number(c.total_egresados || 0)
                    const plano = Boolean(c.plano_configurado)
                    const invitaciones = Number(c.invitaciones_enviadas || 0)

                    if (estadoCeremonia(c) === 'FINALIZADA') {
                      return (
                        <div className="w-full text-center py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[9.5px] font-black uppercase tracking-widest">
                          Ceremonia finalizada y archivada
                        </div>
                      )
                    }

                    if (graduados === 0) {
                      return (
                        <button
                          onClick={() => onNavegar?.('gestion-graduados')}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md shadow-emerald-600/20 transition active:scale-98 cursor-pointer"
                        >
                          <UserPlus size={15} /> Paso 2: Cargar Graduados (Excel) <ArrowRight size={13} />
                        </button>
                      )
                    }

                    if (invitaciones < graduados) {
                      return (
                        <button
                          onClick={() => onNavegar?.('convocatoria')}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md shadow-blue-600/20 transition active:scale-98 cursor-pointer"
                        >
                          <Send size={15} /> Paso 3: Enviar Convocatoria Masiva <ArrowRight size={13} />
                        </button>
                      )
                    }

                    if (!plano) {
                      return (
                        <button
                          onClick={() => onNavegar?.('preparacion-ceremonia')}
                          className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md shadow-cyan-600/20 transition active:scale-98 cursor-pointer"
                        >
                          <Armchair size={15} /> Paso 4: Preparación & Auto-Seating <ArrowRight size={13} />
                        </button>
                      )
                    }

                    return (
                      <button
                        onClick={() => onNavegar?.('locucion')}
                        className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md shadow-rose-600/20 transition active:scale-98 cursor-pointer"
                      >
                        <Mic size={15} /> Paso 5: Abrir Modo Locución <ArrowRight size={13} />
                      </button>
                    )
                  })()}

                  <button 
                    onClick={() => setAsistenteId(c.id)} 
                    className="flex w-full items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 py-2.5 text-[9.5px] font-black uppercase tracking-widest text-slate-700 transition-all rounded-xl cursor-pointer"
                  >
                    <ClipboardList size={13} className="text-sky-600" /> Ver Asistente de Todas las Fases
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleActivar(c.id)}
                  className="w-full bg-slate-900 hover:bg-sky-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-98 cursor-pointer"
                >
                  Activar Entorno
                </button>
              )}
            </div>
          ))}
          
          {/* CARD AGREGAR RÁPIDO */}
          <button 
            onClick={() => setMostrarForm(true)}
            className="flex flex-col items-center justify-center gap-3 bg-slate-50/40 rounded-2xl border-2 border-dashed border-slate-200 p-6 hover:bg-white hover:border-sky-300 hover:shadow-md transition-all group min-h-[200px] cursor-pointer"
          >
            <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-sky-500 group-hover:rotate-90 transition-all duration-300 shadow-sm">
              <Plus size={20} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-sky-500">Nuevo Entorno</p>
          </button>
        </div>
      )}

      {/* MODAL NUEVA CEREMONIA */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="bg-gradient-to-r from-sky-400 to-[#0EA5E9] p-6 text-white relative">
              <h2 className="text-lg font-black tracking-tight">Crear Ceremonia</h2>
              <p className="text-sky-100 text-[8.5px] font-bold uppercase tracking-[0.25em]">Inicialización de nuevo hábitat</p>
              
              <button 
                onClick={() => setMostrarForm(false)} 
                className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
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
                  placeholder="Ej: Colación de Grado - Promoción 2026"
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
                    min="1"
                    max="10"
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

              {/* CAMPO OPCIONAL DE FECHA LÍMITE */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Clock size={11} className="text-amber-500" /> Fecha Límite de Confirmación
                  </label>
                  <span className="text-[8.5px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Opcional</span>
                </div>
                <input 
                  type="datetime-local"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-sky-500 focus:bg-white transition-all outline-none" 
                  value={nuevoEvento.fecha_limite_confirmacion} 
                  onChange={e => setNuevoEvento({...nuevoEvento, fecha_limite_confirmacion: e.target.value})}
                />
                <p className="text-[9.5px] text-slate-400 leading-tight ml-1">
                  Si se especifica, los graduados verán un aviso con el plazo límite. La administración siempre podrá cargar y confirmar sin restricciones.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setMostrarForm(false)} 
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-slate-900 hover:bg-sky-500 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-98 cursor-pointer"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {asistenteId && <AsistenteAdministrativoCeremonia
        ceremonia={ceremonias.find(item => item.id === asistenteId)}
        actualizando={actualizandoId === asistenteId}
        onCerrar={() => setAsistenteId(null)}
        onNavegar={(destino) => { setAsistenteId(null); onNavegar?.(destino) }}
        onAvanzar={async (ceremonia) => { await handleAvanzar(ceremonia) }}
      />}

      {dialogoConfirmacion}
      {cambiando && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-55 animate-in fade-in duration-300">
          <div className="text-center space-y-6 max-w-sm bg-white/10 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-lg">
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

function AsistenteAdministrativoCeremonia({ ceremonia, actualizando, onCerrar, onNavegar, onAvanzar }) {
  if (!ceremonia) return null
  const estado = estadoCeremonia(ceremonia)
  const indice = Math.max(0, ETAPAS.findIndex(([id]) => id === estado))
  const graduados = Number(ceremonia.total_egresados || 0)
  const invitaciones = Number(ceremonia.invitaciones_enviadas || 0)
  const pasos = [
    { etiqueta: 'Datos', listo: true, icono: ClipboardList, detalle: 'Ceremonia creada y activa.', accion: 'Ver configuración', destino: 'gestion-ceremonias' },
    { etiqueta: 'Padrón', listo: graduados > 0, icono: UserPlus, detalle: graduados ? `${graduados} graduados cargados.` : 'Cargá el primer graduado o importá el padrón.', accion: 'Cargar graduados', destino: 'gestion-graduados' },
    { etiqueta: 'Butacas', listo: Boolean(ceremonia.plano_configurado), icono: Armchair, detalle: ceremonia.plano_configurado ? 'Plano y reglas configurados.' : 'Definí el plano antes de ubicar grupos.', accion: 'Configurar plano', destino: 'seleccion-asientos' },
    { etiqueta: 'Convocatoria', listo: graduados > 0 && invitaciones >= graduados, icono: Send, detalle: graduados ? `${invitaciones}/${graduados} invitaciones enviadas.` : 'Disponible al cargar el padrón.', accion: 'Gestionar invitaciones', destino: 'convocatoria' },
    { etiqueta: 'Operación', listo: estado === 'EN_VIVO' || estado === 'FINALIZADA', icono: ScanLine, detalle: estado === 'EN_VIVO' ? 'Acreditación abierta.' : 'Revisá el padrón y las butacas.', accion: estado === 'EN_VIVO' ? 'Abrir acreditación' : 'Ver preparación', destino: estado === 'EN_VIVO' ? 'control-ingreso' : 'preparacion-ceremonia' },
    { etiqueta: 'Cierre', listo: estado === 'FINALIZADA', icono: Flag, detalle: estado === 'FINALIZADA' ? 'Acta operativa archivada.' : 'Cerrá cuando termine la ceremonia.', accion: 'Ver seguimiento', destino: 'estado-ceremonia' }
  ]
  const siguiente = ETAPAS[Math.min(indice + 1, ETAPAS.length - 1)]?.[1]
  const bloqueo = estado === 'CONFIGURACION' && !graduados
    ? { mensaje: 'Antes de convocar, cargá al menos un graduado.', destino: 'gestion-graduados', accion: 'Cargar padrón' }
    : estado === 'CONVOCATORIA' && !ceremonia.plano_configurado
      ? { mensaje: 'Antes de preparar, definí el plano de butacas.', destino: 'seleccion-asientos', accion: 'Configurar plano' }
      : estado === 'PREPARACION' && invitaciones < graduados
        ? { mensaje: `Faltan ${graduados - invitaciones} invitaciones por enviar.`, destino: 'convocatoria', accion: 'Enviar invitaciones' }
        : null

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="asistente-ceremonia-titulo">
    <section className="w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-3xl bg-slate-50 shadow-2xl">
      <header className="flex items-start justify-between bg-gradient-to-r from-[#071b34] to-[#0e5771] px-5 py-5 text-white sm:px-7"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200">Centro de mando de ceremonia</p><h2 id="asistente-ceremonia-titulo" className="mt-1 text-xl font-black">{ceremonia.nombre}</h2><p className="mt-1 text-xs font-semibold text-white/65">{ceremonia.lugar} · {new Date(`${ceremonia.fecha}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div><button onClick={onCerrar} className="rounded-xl p-2 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer" aria-label="Cerrar asistente"><X size={20} /></button></header>
      <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-7"><div className="flex items-center justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Etapa actual</p><strong className="text-sm text-slate-800">{ETAPAS[indice]?.[1]}</strong></div><span className="rounded-full bg-sky-50 px-3 py-1.5 text-[10px] font-black text-sky-700">{indice + 1} de {ETAPAS.length}</span></div><div className="mt-3 flex gap-1.5">{ETAPAS.map(([id], paso) => <span key={id} className={`h-1.5 flex-1 rounded-full ${paso <= indice ? 'bg-sky-500' : 'bg-slate-200'}`} />)}</div></div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">{pasos.map((paso, posicion) => { const Icono = paso.icono; const disponible = posicion <= indice + 1 || paso.listo; return <article key={paso.etiqueta} className={`rounded-2xl border p-4 ${paso.listo ? 'border-emerald-100 bg-emerald-50/40' : disponible ? 'border-sky-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-100/60 opacity-70'}`}><div className="flex items-start justify-between gap-2"><span className={`grid h-8 w-8 place-items-center rounded-xl ${paso.listo ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}><Icono size={16} /></span>{paso.listo && <CheckCircle2 size={16} className="text-emerald-500" />}</div><h3 className="mt-3 text-xs font-black text-slate-800">{paso.etiqueta}</h3><p className="mt-1 min-h-8 text-[10px] font-semibold leading-relaxed text-slate-500">{paso.detalle}</p><button disabled={!disponible} onClick={() => onNavegar(paso.destino)} className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-sky-600 disabled:text-slate-400 cursor-pointer">{paso.accion}<ArrowRight size={12} /></button></article>})}</div>
      <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"><button onClick={() => onNavegar('estado-ceremonia')} className="inline-flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-600 cursor-pointer"><BarChart3 size={14} /> Ver estado en vivo</button>{estado !== 'FINALIZADA' && <div className="flex flex-col items-end gap-1"><span className={`text-[9px] font-semibold ${bloqueo ? 'text-amber-700' : 'text-slate-400'}`}>{bloqueo?.mensaje || 'Todo listo para continuar.'}</span><button disabled={actualizando} onClick={() => bloqueo ? onNavegar(bloqueo.destino) : onAvanzar(ceremonia)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-sky-600 disabled:opacity-60 cursor-pointer">{actualizando ? <LoaderCircle size={14} className="animate-spin" /> : bloqueo ? <ArrowRight size={14} /> : <PlayCircle size={14} />}{actualizando ? 'Actualizando...' : bloqueo ? bloqueo.accion : `Avanzar a ${siguiente}`}</button></div>}</footer>
    </section>
  </div>
}
