import { useState, useEffect } from 'react'
import { BookOpen, Search, Plus, Trash2, Edit2, CheckCircle2, X } from 'lucide-react'

import { 
  obtenerProfesores, 
  crearProfesor, 
  actualizarProfesor, 
  eliminarProfesor 
} from '../servicios/api'
import { HeaderGlobal } from '../componentes/HeaderGlobal'

export function GestionProfesores({ onVolver, onCerrarSesion }) {
  const [profesores, setProfesores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [profesorEditando, setProfesorEditando] = useState(null)
  const [formData, setFormData] = useState({ nombre: '', dni: '', materia: '' })
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    try {
      const datos = await obtenerProfesores()
      setProfesores(datos)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'No se pudo cargar el catálogo' })
    } finally {
      setCargando(false)
    }
  }

  const filtrados = profesores.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (p.dni && p.dni.includes(busqueda)) ||
    (p.materia && p.materia.toLowerCase().includes(busqueda.toLowerCase()))
  )

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (profesorEditando) {
        await actualizarProfesor(profesorEditando.id, formData)
        setMensaje({ tipo: 'exito', texto: 'Profesor actualizado con éxito' })
      } else {
        await crearProfesor(formData)
        setMensaje({ tipo: 'exito', texto: 'Profesor añadido al catálogo' })
      }
      setMostrarForm(false)
      setProfesorEditando(null)
      setFormData({ nombre: '', dni: '', materia: '' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  function handleEditar(prof) {
    setProfesorEditando(prof)
    setFormData({ nombre: prof.nombre, dni: prof.dni || '', materia: prof.materia || '' })
    setMostrarForm(true)
  }

  async function handleEliminar(id) {
    if (!window.confirm('¿Seguro que deseas eliminar este profesor del catálogo?')) return
    try {
      await eliminarProfesor(id)
      setMensaje({ tipo: 'exito', texto: 'Profesor eliminado' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans">
      <HeaderGlobal 
        titulo="Catálogo de Profesores"
        onVolver={onVolver}
        onCerrarSesion={onCerrarSesion}
      />

      <main className="max-w-7xl mx-auto p-10">
        {/* ALERTAS */}
        {mensaje && (
          <div className={`mb-8 p-6 rounded-[28px] border-2 flex justify-between items-center animate-in slide-in-from-top duration-500 ${
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

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar profesor por nombre, DNI o materia..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/5 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => { setProfesorEditando(null); setFormData({ nombre: '', dni: '', materia: '' }); setMostrarForm(true); }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-sky-600 text-white px-8 py-4 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 active:scale-95"
          >
            <Plus size={16} />
            Nuevo Profesor
          </button>
        </div>

        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Cargando catálogo...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-slate-100 p-20 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BookOpen size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Catálogo vacío</h3>
            <p className="text-sm text-slate-400 font-medium max-w-md mx-auto">
              {busqueda ? 'No hay profesores que coincidan con tu búsqueda.' : 'Todavía no hay profesores registrados. Agregá el primero para que los graduados puedan elegirlos como entregadores.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtrados.map(prof => (
              <div key={prof.id} className="bg-white border-2 border-slate-100 rounded-[32px] p-8 hover:border-sky-500/30 hover:shadow-xl hover:shadow-sky-500/5 transition-all group">
                <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 mb-6">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1 truncate">{prof.nombre}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 truncate">{prof.materia || 'Sin materia asignada'}</p>
                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{prof.dni ? `DNI: ${prof.dni}` : ''}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditar(prof)} className="p-2.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleEliminar(prof.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {mostrarForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-10 text-white relative">
              <h2 className="text-2xl font-black mb-2">{profesorEditando ? 'Editar Profesor' : 'Nuevo Profesor'}</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Catálogo de Entregadores</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input 
                  autoFocus required 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-sky-400 outline-none transition-all" 
                  placeholder="Ej: Ing. Jorge Pérez"
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Materia o Cargo (Opcional)</label>
                <input 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-sky-400 outline-none transition-all" 
                  placeholder="Ej: Análisis Matemático II"
                  value={formData.materia} 
                  onChange={e => setFormData({...formData, materia: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DNI (Opcional)</label>
                <input 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-sky-400 outline-none transition-all" 
                  placeholder="Ej: 20123456"
                  value={formData.dni} 
                  onChange={e => setFormData({...formData, dni: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setMostrarForm(false)} 
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-xl shadow-sky-500/20 transition-all"
                >
                  {profesorEditando ? 'Guardar Cambios' : 'Añadir al Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
