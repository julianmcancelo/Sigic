import { useState, useEffect } from 'react'
import { 
  Plus, Calendar, MapPin, Users, Trash2, 
  CheckCircle2, X, PlusCircle, ArrowRight, LayoutTemplate, Send, Radio, Flag, ListChecks,
  ClipboardList, UserPlus, Armchair, ScanLine, BarChart3, PlayCircle, LoaderCircle, Clock,
  Edit3, Search, Sparkles, Check, AlertCircle, Archive, ShieldCheck
} from 'lucide-react'
import { obtenerCeremonias, crearCeremonia, activarCeremonia, actualizarCeremonia, eliminarCeremonia, actualizarEstadoCeremonia } from '../../lib/api'
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
  const [ceremoniaEditando, setCeremoniaEditando] = useState(null)
  const [filtroPestana, setFiltroPestana] = useState('todas') // 'todas' | 'activas' | 'proximas' | 'finalizadas'
  const [busqueda, setBusqueda] = useState('')
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

  function abrirEditar(ceremonia) {
    setCeremoniaEditando({
      id: ceremonia.id,
      nombre: ceremonia.nombre || '',
      fecha: ceremonia.fecha ? String(ceremonia.fecha).slice(0, 10) : '',
      lugar: ceremonia.lugar || 'Sede Beltrán',
      max_invitados: ceremonia.max_invitados || 4,
      fecha_limite_confirmacion: ceremonia.fecha_limite_confirmacion ? String(ceremonia.fecha_limite_confirmacion).slice(0, 16) : ''
    })
  }

  async function handleGuardarEdicion(e) {
    e.preventDefault()
    if (!ceremoniaEditando?.id) return
    try {
      await actualizarCeremonia(ceremoniaEditando.id, {
        nombre: ceremoniaEditando.nombre,
        fecha: ceremoniaEditando.fecha,
        lugar: ceremoniaEditando.lugar,
        max_invitados: Number(ceremoniaEditando.max_invitados),
        fecha_limite_confirmacion: ceremoniaEditando.fecha_limite_confirmacion || null
      })
      setMensaje({ tipo: 'exito', texto: 'Ceremonia actualizada correctamente' })
      setCeremoniaEditando(null)
      await cargar()
      if (onCambioCeremonia) onCambioCeremonia()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al actualizar ceremonia' })
    }
  }

  async function handleFinalizarCeremonia(ceremonia) {
    const confirmado = await confirmar({
      titulo: 'Finalizar y Concluir Ceremonia',
      descripcion: `¿Estás seguro de que deseas cerrar "${ceremonia.nombre}"? La ceremonia pasará al archivo histórico institucional y se liberará el entorno operativo. Todos los datos y estadísticas se preservarán.`,
      textoConfirmar: 'Sí, finalizar ceremonia',
      tipo: 'peligro'
    })
    if (!confirmado) return

    setActualizandoId(ceremonia.id)
    try {
      await actualizarEstadoCeremonia(ceremonia.id, 'FINALIZADA')
      setMensaje({ tipo: 'exito', texto: `Ceremonia "${ceremonia.nombre}" finalizada y archivada correctamente.` })
      await cargar()
      if (onCambioCeremonia) onCambioCeremonia()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al finalizar ceremonia' })
    } finally {
      setActualizandoId(null)
    }
  }

  return (
    <div className="font-sans">
      {/* HEADER INTEGRADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div>
          {!sinHeader && (
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Gestión de Ceremonias</h2>
          )}
          <p className="text-xs font-semibold text-slate-500">
            Administración de actos de colación, sedes y entornos de grado activos.
          </p>
        </div>
        
        <button
          id="btn-nueva-ceremonia"
          onClick={() => setMostrarForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
        >
          <PlusCircle size={15} /> Nueva Ceremonia
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

      {/* BARRA DE HERRAMIENTAS: PESTAÑAS Y BUSCADOR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Pestañas de ciclo de vida */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 overflow-x-auto">
          {[
            { id: 'todas', label: 'Todas', count: ceremonias.length },
            { id: 'activas', label: 'En Curso / Activa', count: ceremonias.filter(c => c.activa === 1 || c.activa === true).length },
            { id: 'proximas', label: 'Próximas / Borrador', count: ceremonias.filter(c => !c.activa && estadoCeremonia(c) !== 'FINALIZADA').length },
            { id: 'finalizadas', label: 'Finalizadas / Archivo', count: ceremonias.filter(c => estadoCeremonia(c) === 'FINALIZADA').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFiltroPestana(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                filtroPestana === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                filtroPestana === tab.id ? 'bg-sky-100 text-sky-700' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Buscador interactivo */}
        <div className="relative sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o sede..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

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
      ) : (() => {
        const ceremoniasFiltradas = ceremonias.filter(c => {
          if (filtroPestana === 'activas' && !(c.activa === 1 || c.activa === true)) return false
          if (filtroPestana === 'proximas' && (c.activa === 1 || c.activa === true || estadoCeremonia(c) === 'FINALIZADA')) return false
          if (filtroPestana === 'finalizadas' && estadoCeremonia(c) !== 'FINALIZADA') return false
          if (busqueda.trim()) {
            const query = busqueda.toLowerCase()
            const matchNombre = (c.nombre || '').toLowerCase().includes(query)
            const matchLugar = (c.lugar || '').toLowerCase().includes(query)
            if (!matchNombre && !matchLugar) return false
          }
          return true
        })

        if (ceremoniasFiltradas.length === 0) {
          return (
            <div className="bg-slate-50/60 border border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search size={22} />
              </div>
              <h3 className="text-sm font-black text-slate-700">No se encontraron ceremonias</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {busqueda ? 'No hay eventos que coincidan con la búsqueda actual.' : 'No hay ceremonias en esta categoría.'}
              </p>
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          )
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ceremoniasFiltradas.map(c => {
              const esFinalizada = estadoCeremonia(c) === 'FINALIZADA'
              const graduados = Number(c.total_egresados || 0)
              const plano = Boolean(c.plano_configurado)
              const invitaciones = Number(c.invitaciones_enviadas || 0)

              return (
                <div 
                  key={c.id} 
                  className={`relative bg-white rounded-2xl p-5 transition-all duration-200 border flex flex-col justify-between ${
                    c.activa 
                      ? 'border-sky-500 shadow-md ring-1 ring-sky-500/20' 
                      : esFinalizada
                      ? 'border-slate-200 bg-slate-50/40 opacity-90'
                      : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Highlight superior para activo */}
                  {!!c.activa && (
                    <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-2xl bg-gradient-to-r from-sky-400 to-indigo-500" />
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${
                        c.activa 
                          ? 'bg-sky-50 text-sky-700 border border-sky-200/80' 
                          : esFinalizada
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${c.activa ? 'bg-sky-500 animate-pulse' : esFinalizada ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                        {c.activa ? 'Entorno Activo' : esFinalizada ? 'Finalizada / Archivo' : 'En Preparación'}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Botón Editar Ceremonia */}
                        <button
                          onClick={() => abrirEditar(c)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar información de la ceremonia"
                        >
                          <Edit3 size={14} />
                        </button>

                        {!c.activa && (
                          <button 
                            onClick={() => handleEliminar(c.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Ceremonia"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <h3 className="text-base font-extrabold tracking-tight leading-snug mb-2 truncate" title={c.nombre} style={{ color: DARK }}>
                        {c.nombre}
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2 truncate">
                          <Calendar size={13} className="text-sky-500 shrink-0" />
                          <span className="truncate">
                            {new Date(c.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 truncate">
                          <MapPin size={13} className="text-sky-500 shrink-0" />
                          <span className="truncate">{c.lugar}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 truncate">
                          <Users size={13} className="text-sky-500 shrink-0" />
                          <span>{c.max_invitados} invitados permitidos</span>
                        </div>

                        {c.fecha_limite_confirmacion && (
                          <div className="flex items-center gap-2 truncate">
                            <Clock size={13} className="text-amber-500 shrink-0" />
                            <span className="text-amber-700 font-medium truncate">
                              Cierre: {new Date(c.fecha_limite_confirmacion).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} hs
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Métrica de Padrón Aislado Exclusivo */}
                    <div className="mb-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Padrón de este acto:</span>
                      <strong className="font-extrabold text-slate-800">
                        {graduados} {graduados === 1 ? 'graduado' : 'graduados'}
                      </strong>
                    </div>

                    {/* Visualización de fases y progreso */}
                    {(() => {
                      const estado = estadoCeremonia(c)
                      const indice = ETAPAS.findIndex(([id]) => id === estado)

                      const tareas = [
                        { ok: graduados > 0, texto: graduados ? `${graduados} graduados cargados` : 'Cargar graduados', destino: 'gestion-graduados', paso: 'Paso 2' },
                        { ok: invitaciones >= graduados && graduados > 0, texto: graduados > 0 && invitaciones >= graduados ? `${invitaciones}/${graduados} convocatorias` : 'Enviar invitaciones', destino: 'convocatoria', paso: 'Paso 3' },
                        { ok: plano, texto: plano ? 'Plano y butacas listas' : 'Configurar butacas', destino: 'preparacion-ceremonia', paso: 'Paso 4' },
                      ]

                      return (
                        <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider text-slate-600">
                              <ListChecks size={12} className="text-sky-500" /> {ETAPAS[indice]?.[1] || 'Borrador'}
                            </span>
                            <span className="text-[8.5px] font-bold text-slate-400">{indice + 1}/6</span>
                          </div>

                          <div className="flex gap-1">
                            {ETAPAS.map(([id], paso) => (
                              <span key={id} className={`h-1 flex-1 rounded-full ${paso <= indice ? (esFinalizada ? 'bg-slate-400' : 'bg-sky-500') : 'bg-slate-200'}`} />
                            ))}
                          </div>

                          <div className="space-y-1 pt-0.5">
                            {tareas.map(t => (
                              <button
                                key={t.paso}
                                onClick={() => onNavegar?.(t.destino)}
                                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg bg-white hover:bg-sky-50/80 border border-slate-100 hover:border-sky-200 transition text-left text-[10px] font-medium text-slate-600 cursor-pointer group"
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <CheckCircle2 size={12} className={t.ok ? 'text-emerald-500 shrink-0' : 'text-slate-300 shrink-0'} />
                                  <span className="truncate">{t.texto}</span>
                                </span>
                                <span className="text-[8px] font-bold uppercase text-slate-400 group-hover:text-sky-600 flex items-center shrink-0">
                                  Ir <ArrowRight size={9} className="ml-0.5" />
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {c.activa ? (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      {(() => {
                        if (esFinalizada) {
                          return (
                            <div className="w-full text-center py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                              <Archive size={13} /> Ceremonia Archivada
                            </div>
                          )
                        }

                        if (graduados === 0) {
                          return (
                            <button
                              id="btn-paso2-cargar-graduados"
                              onClick={() => onNavegar?.('gestion-graduados')}
                              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs transition active:scale-98 cursor-pointer"
                            >
                              <UserPlus size={14} /> Cargar Graduados (Excel) <ArrowRight size={12} />
                            </button>
                          )
                        }

                        if (invitaciones < graduados) {
                          return (
                            <button
                              id="btn-paso3-convocatoria"
                              onClick={() => onNavegar?.('convocatoria')}
                              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs transition active:scale-98 cursor-pointer"
                            >
                              <Send size={14} /> Enviar Convocatoria <ArrowRight size={12} />
                            </button>
                          )
                        }

                        if (!plano) {
                          return (
                            <button
                              id="btn-paso4-preparacion"
                              onClick={() => onNavegar?.('preparacion-ceremonia')}
                              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs transition active:scale-98 cursor-pointer"
                            >
                              <Armchair size={14} /> Configurar Butacas <ArrowRight size={12} />
                            </button>
                          )
                        }

                        return (
                          <button
                            id="btn-paso-control-ingreso"
                            onClick={() => onNavegar?.('control-ingreso')}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs transition active:scale-98 cursor-pointer"
                          >
                            <ScanLine size={14} /> Control de Ingreso <ArrowRight size={12} />
                          </button>
                        )
                      })()}

                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <button 
                          onClick={() => setAsistenteId(c.id)} 
                          className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 py-2 text-[11px] font-bold text-slate-700 transition-all rounded-xl border border-slate-200/80 cursor-pointer"
                        >
                          <ClipboardList size={13} className="text-sky-600" /> Fases
                        </button>

                        {!esFinalizada && (
                          <button
                            onClick={() => handleFinalizarCeremonia(c)}
                            disabled={actualizandoId === c.id}
                            className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2 text-[11px] font-bold transition-all rounded-xl border border-rose-200 cursor-pointer disabled:opacity-50"
                            title="Concluir ceremonia y pasar a archivo histórico"
                          >
                            <Archive size={13} /> Finalizar
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <button
                        onClick={() => handleActivar(c.id)}
                        disabled={cambiando}
                        className="w-full bg-slate-900 hover:bg-sky-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer shadow-xs"
                      >
                        Activar Entorno
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            
            {/* CARD AGREGAR RÁPIDO */}
            <button 
              onClick={() => setMostrarForm(true)}
              className="flex flex-col items-center justify-center gap-2 bg-slate-50/40 rounded-2xl border-2 border-dashed border-slate-200 p-6 hover:bg-white hover:border-sky-300 hover:shadow-sm transition-all group min-h-[220px] cursor-pointer"
            >
              <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-sky-500 group-hover:rotate-90 transition-all duration-300 shadow-xs">
                <Plus size={18} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-sky-500">Nuevo Entorno</p>
            </button>
          </div>
        )
      })()}

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
                  id="input-nombre-ceremonia"
                  name="nombre"
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
                    id="input-fecha-ceremonia"
                    name="fecha"
                    required type="date" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-sky-500 focus:bg-white transition-all outline-none" 
                    value={nuevoEvento.fecha} 
                    onChange={e => setNuevoEvento({...nuevoEvento, fecha: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Máximo Invitados</label>
                  <input 
                    id="input-max-invitados-ceremonia"
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
                  id="input-lugar-ceremonia"
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
                  id="input-limite-ceremonia"
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
                  id="btn-cancelar-crear-ceremonia"
                  type="button" 
                  onClick={() => setMostrarForm(false)} 
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  id="btn-crear-submit-ceremonia"
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

      {/* MODAL EDITAR CEREMONIA */}
      {ceremoniaEditando && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="bg-gradient-to-r from-slate-900 to-sky-900 p-6 text-white relative">
              <h2 className="text-lg font-black tracking-tight">Editar Ceremonia</h2>
              <p className="text-sky-300 text-[8.5px] font-bold uppercase tracking-[0.25em]">Modificar parámetros del acto</p>
              
              <button 
                onClick={() => setCeremoniaEditando(null)} 
                className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleGuardarEdicion} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Ceremonia</label>
                <input 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-sky-500 focus:bg-white transition-all outline-none" 
                  value={ceremoniaEditando.nombre} 
                  onChange={e => setCeremoniaEditando({...ceremoniaEditando, nombre: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha del Evento</label>
                  <input 
                    required type="date" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-sky-500 focus:bg-white transition-all outline-none" 
                    value={ceremoniaEditando.fecha} 
                    onChange={e => setCeremoniaEditando({...ceremoniaEditando, fecha: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Máximo Invitados</label>
                  <input 
                    type="number" 
                    min="1"
                    max="10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-sky-500 focus:bg-white transition-all outline-none" 
                    value={ceremoniaEditando.max_invitados} 
                    onChange={e => setCeremoniaEditando({...ceremoniaEditando, max_invitados: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sede / Ubicación</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-sky-500 focus:bg-white transition-all outline-none" 
                  value={ceremoniaEditando.lugar} 
                  onChange={e => setCeremoniaEditando({...ceremoniaEditando, lugar: e.target.value})}
                />
              </div>

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
                  value={ceremoniaEditando.fecha_limite_confirmacion} 
                  onChange={e => setCeremoniaEditando({...ceremoniaEditando, fecha_limite_confirmacion: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setCeremoniaEditando(null)} 
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-98 cursor-pointer shadow-md shadow-sky-600/20"
                >
                  Guardar Cambios
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
