import { useState, useEffect } from 'react'
import { 
  Plus, Calendar, MapPin, Users, Trash2, 
  ArrowLeft, CheckCircle2, X, Clock
} from 'lucide-react'
import { obtenerCeremonias, crearCeremonia, activarCeremonia, eliminarCeremonia } from '../servicios/api'
import { HeaderGlobal } from '../componentes/HeaderGlobal'

export function GestionCeremonias({ onVolver, onCambioCeremonia }) {
  const [ceremonias, setCeremonias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevoEvento, setNuevoEvento] = useState({
    nombre: '', fecha: '', lugar: 'Sede Beltrán', max_invitados: 4
  })
  const [mensaje, setMensaje] = useState(null)

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
      setMensaje({ tipo: 'exito', texto: 'Nuevo habitat creado con exito' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  async function handleActivar(id) {
    try {
      await activarCeremonia(id)
      setMensaje({ tipo: 'exito', texto: 'Cambiando entorno de trabajo...' })
      cargar()
      if (onCambioCeremonia) onCambioCeremonia()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
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

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans selection:bg-sky-100">
      <HeaderGlobal 
        titulo="Gestión de Ceremonias"
        subtitulo="SiGIC Multi-Hábitat"
        onVolver={onVolver}
      />

      <main className="max-w-7xl mx-auto p-10">
        {/* ALERTAS ESTILIZADAS */}
        {mensaje && (
          <div className={`mb-10 p-6 rounded-[28px] border-2 flex justify-between items-center animate-in slide-in-from-top duration-500 ${
            mensaje.tipo === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl ${mensaje.tipo === 'error' ? 'bg-red-100' : 'bg-emerald-100'}`}>
                {mensaje.tipo === 'error' ? <X size={20}/> : <CheckCircle2 size={20}/>}
              </div>
              <span className="font-black text-sm uppercase tracking-wide">{mensaje.texto}</span>
            </div>
            <button onClick={() => setMensaje(null)} className="p-2 hover:bg-black/5 rounded-lg transition-colors"><X size={18}/></button>
          </div>
        )}

        {cargando ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-30">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-xs font-black uppercase tracking-[0.4em]">Sincronizando Entornos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {ceremonias.map(c => (
              <div 
                key={c.id} 
                className={`relative group bg-white rounded-[40px] p-8 transition-all duration-500 border-2 ${
                  c.activa 
                    ? 'border-sky-500 shadow-2xl shadow-sky-500/10 scale-[1.02]' 
                    : 'border-transparent hover:border-slate-200 hover:shadow-xl shadow-slate-200/50'
                }`}
              >
                {/* Badge de Estado */}
                <div className="flex justify-between items-start mb-8">
                  <div className={`px-4 py-1.5 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${
                    c.activa ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {c.activa ? 'Hábitat Seleccionado' : 'Entorno Inactivo'}
                  </div>
                  
                  {!c.activa && (
                    <button 
                      onClick={() => handleEliminar(c.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight mb-3 group-hover:text-sky-600 transition-colors">
                    {c.nombre}
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-3 text-slate-400">
                      <div className="p-1.5 bg-slate-50 rounded-lg"><Calendar size={16} /></div>
                      <span className="text-[13px] font-bold">{new Date(c.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <div className="p-1.5 bg-slate-50 rounded-lg"><MapPin size={16} /></div>
                      <span className="text-[13px] font-bold">{c.lugar}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <div className="p-1.5 bg-slate-50 rounded-lg"><Users size={16} /></div>
                      <span className="text-[13px] font-bold">{c.max_invitados} Invitados por egresado</span>
                    </div>
                  </div>
                </div>

                {c.activa ? (
                  <div className="flex items-center justify-center gap-3 w-full bg-emerald-50 text-emerald-600 py-5 rounded-[24px] text-xs font-black uppercase tracking-widest border border-emerald-100">
                    <CheckCircle2 size={18} />
                    Entorno Activo
                  </div>
                ) : (
                  <button
                    onClick={() => handleActivar(c.id)}
                    className="group/btn relative w-full bg-slate-900 hover:bg-sky-600 text-white py-5 rounded-[24px] text-xs font-black uppercase tracking-widest overflow-hidden transition-all active:scale-95"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Activar este Hábitat
                    </span>
                  </button>
                )}
              </div>
            ))}
            
            {/* CARD AGREGAR RÁPIDO */}
            <button 
              onClick={() => setMostrarForm(true)}
              className="flex flex-col items-center justify-center gap-4 bg-slate-100/50 rounded-[40px] border-4 border-dashed border-slate-200 p-8 hover:bg-white hover:border-sky-300 hover:shadow-2xl transition-all group"
            >
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-400 group-hover:text-sky-500 group-hover:rotate-90 transition-all duration-500 shadow-sm">
                <Plus size={32} />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-sky-500">Nuevo Hábitat</p>
            </button>
          </div>
        )}
      </main>

      {/* MODAL NUEVO HÁBITAT - ULTRA PREMIUM */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-gradient-to-br from-sky-400 to-sky-700 p-12 text-white relative">
              <h2 className="text-3xl font-black mb-2">Crear Ceremonia</h2>
              <p className="text-sky-100 text-[11px] font-bold uppercase tracking-[0.3em]">Inicialización de nuevo hábitat</p>
            </div>
            
            <form onSubmit={handleCrear} className="p-12 space-y-8">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de la Ceremonia</label>
                <input 
                  autoFocus
                  required 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-base font-bold focus:border-sky-400 focus:bg-white transition-all outline-none" 
                  placeholder="Ej: Colación de Grado - Turno Mañana"
                  value={nuevoEvento.nombre} 
                  onChange={e => setNuevoEvento({...nuevoEvento, nombre: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha del Evento</label>
                  <input 
                    required type="date" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-base font-bold focus:border-sky-400 outline-none" 
                    value={nuevoEvento.fecha} 
                    onChange={e => setNuevoEvento({...nuevoEvento, fecha: e.target.value})}
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Máximo Invitados</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-base font-bold focus:border-sky-400 outline-none" 
                    value={nuevoEvento.max_invitados} 
                    onChange={e => setNuevoEvento({...nuevoEvento, max_invitados: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sede / Ubicación</label>
                <div className="relative">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-base font-bold focus:border-sky-400 outline-none" 
                    value={nuevoEvento.lugar} 
                    onChange={e => setNuevoEvento({...nuevoEvento, lugar: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-6 pt-4">
                <button 
                  type="button" 
                  onClick={() => setMostrarForm(false)} 
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-2 bg-slate-900 hover:bg-sky-600 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95"
                >
                  Construir Hábitat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
