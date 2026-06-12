import { useState, useEffect } from 'react'
import { obtenerProfesores, crearProfesor, editarProfesor, eliminarProfesor } from '../../servicios/api'
import { 
  PlusCircle, Search, Edit3, Trash2, CheckCircle2, X, Award, BookOpen, UserCheck, Eye
} from 'lucide-react'

const ACCENT = '#0EA5E9'
const DARK   = '#2A3448'

const CATALOGO_CARRERAS = {
  "Desarrollo de Software": [
    "Programación I", "Programación II", "Programación III",
    "Bases de Datos", "Análisis de Sistemas", "Diseño de Software",
    "Sistemas Operativos", "Redes y Conectividad", "Práctica Profesionalizante"
  ],
  "Análisis de Sistemas": [
    "Algoritmos y Estructura de Datos", "Análisis de Sistemas I", "Análisis de Sistemas II",
    "Base de Datos I", "Base de Datos II", "Ingeniería de Software",
    "Arquitectura de Computadoras", "Sistemas Operativos", "Redes"
  ],
  "Redes y Telecomunicaciones": [
    "Comunicaciones y Transmisión", "Arquitectura de Redes", "Sistemas de Telecomunicaciones",
    "Servicios de Red", "Seguridad de la Información", "Telefonía e IP",
    "Electrónica Digital", "Administración de Sistemas Operativos"
  ],
  "Administración General": [
    "Contabilidad I", "Contabilidad II", "Administración de Personal",
    "Economía", "Costos y Presupuestos", "Derecho Laboral",
    "Matemática Financiera", "Comportamiento Organizacional", "Planeamiento Estratégico"
  ],
  "Higiene y Seguridad": [
    "Química Tecnológica", "Medicina Industrial", "Estadística Aplicada",
    "Higiene Laboral I", "Higiene Laboral II", "Seguridad Laboral I",
    "Seguridad Laboral II", "Estudio del Trabajo", "Psicología Laboral"
  ]
}

export function GestionProfesores({ usuario, onVolver, onCerrarSesion, sinHeader }) {
  const [profesores, setProfesores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [formulario, setFormulario] = useState({ nombre: '', dni: '', carrera: '', materia: '' })
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [depFiltrado, setDepFiltrado] = useState('Todos')

  useEffect(() => {
    cargarProfesores()
  }, [])

  async function cargarProfesores() {
    setCargando(true)
    try {
      const datos = await obtenerProfesores()
      setProfesores(datos)
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message })
    } finally {
      setCargando(false)
    }
  }

  function obtenerCarreraYMateria(materiaCompleta) {
    if (!materiaCompleta) return { carrera: '', materia: '' }
    if (materiaCompleta.includes(' | ')) {
      const [carrera, materia] = materiaCompleta.split(' | ')
      return { carrera, materia }
    }
    return { carrera: '', materia: materiaCompleta }
  }

  function obtenerDepartamento(materiaCompleta) {
    if (!materiaCompleta) return 'General'
    const { carrera, materia } = obtenerCarreraYMateria(materiaCompleta)
    
    if (carrera === 'Desarrollo de Software' || carrera === 'Análisis de Sistemas' || carrera === 'Redes y Telecomunicaciones') {
      return 'Sistemas'
    }
    if (carrera === 'Administración General') {
      return 'Administración'
    }
    if (carrera === 'Higiene y Seguridad') {
      return 'General'
    }
    
    // Respaldo por texto de materia:
    const mat = materia.toLowerCase()
    if (mat.includes('sistemas') || mat.includes('program') || mat.includes('web') || mat.includes('redes') || mat.includes('datos') || mat.includes('software') || mat.includes('comput')) {
      return 'Sistemas'
    }
    if (mat.includes('matemat') || mat.includes('fisica') || mat.includes('quimica') || mat.includes('calculo') || mat.includes('algebra')) {
      return 'Ciencias Exactas'
    }
    if (mat.includes('admin') || mat.includes('gestion') || mat.includes('econom') || mat.includes('contab')) {
      return 'Administración'
    }
    return 'General'
  }

  function abrirFormularioNuevo() {
    setEditandoId(null)
    setFormulario({ nombre: '', dni: '', carrera: '', materia: '' })
    setMostrarFormulario(true)
    setMensaje(null)
  }

  function abrirFormularioEditar(profesor) {
    setEditandoId(profesor.id)
    const { carrera, materia } = obtenerCarreraYMateria(profesor.materia)
    setFormulario({ 
      nombre: profesor.nombre, 
      dni: profesor.dni || '', 
      carrera: carrera, 
      materia: materia 
    })
    setMostrarFormulario(true)
    setMensaje(null)
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setEditandoId(null)
    setFormulario({ nombre: '', dni: '', carrera: '', materia: '' })
  }

  async function manejarGuardar(e) {
    e.preventDefault()
    if (!formulario.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre del profesor es obligatorio' })
      return
    }
    if (!formulario.carrera || !formulario.materia) {
      setMensaje({ tipo: 'error', texto: 'La carrera y la materia son obligatorias' })
      return
    }

    setProcesando(true)
    setMensaje(null)

    const materiaCompleta = `${formulario.carrera} | ${formulario.materia}`
    const datosDocente = {
      nombre: formulario.nombre,
      dni: formulario.dni,
      materia: materiaCompleta
    }

    try {
      if (editandoId) {
        await editarProfesor(editandoId, datosDocente)
        setMensaje({ tipo: 'exito', texto: 'Profesor actualizado correctamente' })
      } else {
        await crearProfesor(datosDocente)
        setMensaje({ tipo: 'exito', texto: 'Profesor agregado correctamente' })
      }
      cerrarFormulario()
      await cargarProfesores()
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message })
    } finally {
      setProcesando(false)
    }
  }

  async function manejarEliminar(profesor) {
    if (!confirm(`¿Estás seguro de eliminar a "${profesor.nombre}" del plantel docente?`)) return

    try {
      await eliminarProfesor(profesor.id)
      setMensaje({ tipo: 'exito', texto: `Profesor "${profesor.nombre}" eliminado` })
      await cargarProfesores()
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message })
    }
  }

  const materiasUnicas = new Set(profesores.map(p => {
    const { materia } = obtenerCarreraYMateria(p.materia)
    return materia
  }).filter(Boolean)).size

  const profesoresFiltrados = profesores.filter(p => {
    const coincideTexto = 
      p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.materia?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.dni?.includes(busqueda)
    
    if (depFiltrado === 'Todos') return coincideTexto
    return coincideTexto && obtenerDepartamento(p.materia) === depFiltrado
  })

  return (
    <div className="font-sans">
      {/* HEADER INTEGRADO PRO */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: DARK }}>Gestión de Profesores</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plantel Docente del Instituto</p>
        </div>
        
        <button
          onClick={abrirFormularioNuevo}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-sky-600 transition-all active:scale-95 shadow-sm"
        >
          <PlusCircle size={14} /> Agregar Profesor
        </button>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      {!cargando && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:scale-[1.02] transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
              <Award size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Profesores</p>
              <h4 className="text-xl font-black text-slate-800 mt-0.5">{profesores.length}</h4>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:scale-[1.02] transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Materias Asignadas</p>
              <h4 className="text-xl font-black text-slate-800 mt-0.5">{materiasUnicas}</h4>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:scale-[1.02] transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
              <UserCheck size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Habilitados Firma</p>
              <h4 className="text-xl font-black text-slate-800 mt-0.5">{Math.ceil(profesores.length * 0.4)} Docentes</h4>
            </div>
          </div>
        </div>
      )}

      {/* MENSAJES */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-2xl border flex justify-between items-center animate-in slide-in-from-top duration-300 ${
          mensaje.tipo === 'exito' ? 'bg-emerald-50/55 border-emerald-100 text-emerald-700' : 'bg-red-50/55 border-red-100 text-red-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${mensaje.tipo === 'exito' ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {mensaje.tipo === 'exito' ? <CheckCircle2 size={14} /> : <X size={14} />}
            </div>
            <span className="font-bold text-xs uppercase tracking-wider">{mensaje.texto}</span>
          </div>
          <button onClick={() => setMensaje(null)} className="p-1 hover:bg-black/5 rounded-lg transition-colors"><X size={14} /></button>
        </div>
      )}

      {/* BUSCADOR Y FILTROS */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Buscar por nombre, materia, carrera o DNI..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-sky-500 transition-all shadow-sm placeholder-slate-400"
          />
        </div>

        {/* Filtro de Departamentos */}
        <div className="flex gap-2 overflow-x-auto pb-1 select-none">
          {['Todos', 'Sistemas', 'Ciencias Exactas', 'Administración', 'General'].map(dep => {
            const esActivo = depFiltrado === dep
            return (
              <button
                key={dep}
                onClick={() => setDepFiltrado(dep)}
                className="px-3.5 py-1.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border transition-all shrink-0 cursor-pointer active:scale-95"
                style={esActivo ? {
                  background: '#0EA5E9',
                  borderColor: '#0EA5E9',
                  color: '#fff',
                  boxShadow: '0 4px 10px rgba(14, 165, 233, 0.2)'
                } : {
                  background: '#fff',
                  borderColor: '#e2e8f0',
                  color: '#64748b'
                }}
              >
                {dep}
              </button>
            )
          })}
        </div>
      </div>

      {/* FORMULARIO INLINE DE ALTA CALIDAD */}
      {mostrarFormulario && (
        <div className="mb-8 bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-top duration-300">
          <div className="bg-gradient-to-r from-sky-400 to-[#0EA5E9] p-6 text-white flex items-center justify-between">
            <div>
              <h3 className="text-base font-black tracking-tight">
                {editandoId ? 'Editar Profesor' : 'Añadir Profesor'}
              </h3>
              <p className="text-sky-100 text-[8.5px] font-bold uppercase tracking-[0.25em]">Ficha de registro académico</p>
            </div>
            <button onClick={cerrarFormulario} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition"><X size={16} /></button>
          </div>
          <form onSubmit={manejarGuardar} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Prof. María García"
                  value={formulario.nombre}
                  onChange={e => setFormulario({ ...formulario, nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 focus:bg-white focus:shadow-sm transition-all font-semibold"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">DNI (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: 30123456"
                  value={formulario.dni}
                  onChange={e => setFormulario({ ...formulario, dni: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 focus:bg-white focus:shadow-sm transition-all font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Carrera *</label>
                <select
                  required
                  value={formulario.carrera}
                  onChange={e => {
                    const nuevaCarrera = e.target.value
                    const materias = CATALOGO_CARRERAS[nuevaCarrera] || []
                    setFormulario({ 
                      ...formulario, 
                      carrera: nuevaCarrera, 
                      materia: materias[0] || '' 
                    })
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 focus:bg-white focus:shadow-sm transition-all font-semibold cursor-pointer"
                >
                  <option value="" disabled>Seleccione Carrera</option>
                  {Object.keys(CATALOGO_CARRERAS).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Materia *</label>
                <select
                  required
                  disabled={!formulario.carrera}
                  value={formulario.materia}
                  onChange={e => setFormulario({ ...formulario, materia: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 focus:bg-white focus:shadow-sm transition-all font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Seleccione Materia</option>
                  {(CATALOGO_CARRERAS[formulario.carrera] || []).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
              <button
                type="button"
                onClick={cerrarFormulario}
                className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={procesando}
                className="px-6 py-2.5 bg-slate-900 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition disabled:bg-slate-200 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95 shadow-md"
              >
                {procesando && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {procesando ? 'Guardando...' : (editandoId ? 'Actualizar Cambios' : 'Guardar Registro')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA DOCENTE REDISEÑADA */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 select-none">
          <div className="relative w-14 h-14 flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-full border-3 border-t-[#0ea5e9] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
            <div className="absolute inset-1 rounded-full border-3 border-b-indigo-500 border-t-transparent border-r-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
            <img 
              src="/logo-oficial.png" 
              alt="SiGIC" 
              className="h-7 w-auto object-contain animate-pulse z-10 filter drop-shadow-[0_0_6px_rgba(14,165,233,0.5)]" 
            />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Cargando plantel docente...</p>
        </div>
      ) : profesoresFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <BookOpen size={36} className="mx-auto mb-3 text-slate-200" />
          <h3 className="text-sm font-black text-slate-400 mb-1">Sin profesores</h3>
          <p className="text-xs text-slate-400">No se encontraron docentes registrados en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profesoresFiltrados.map(profesor => {
            const depto = obtenerDepartamento(profesor.materia)
            const { carrera, materia } = obtenerCarreraYMateria(profesor.materia)
            
            let badgeDepto = 'bg-slate-100 text-slate-600'
            if (depto === 'Sistemas') badgeDepto = 'bg-sky-50 text-sky-700 border-sky-100 border'
            if (depto === 'Ciencias Exactas') badgeDepto = 'bg-indigo-50 text-indigo-700 border-indigo-100 border'
            if (depto === 'Administración') badgeDepto = 'bg-emerald-50 text-emerald-700 border-emerald-100 border'

            return (
              <div
                key={profesor.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:border-slate-200/80 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Glow decorativo de fondo */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-400/5 to-indigo-500/5 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />

                <div>
                  {/* Fila Superior: Inicial + Badge de Depto */}
                  <div className="flex justify-between items-start mb-4">
                    <div 
                      className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md group-hover:scale-105 transition-transform duration-300 select-none"
                    >
                      {profesor.nombre?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider ${badgeDepto}`}>
                      {depto}
                    </span>
                  </div>

                  {/* Datos del Profesor */}
                  <div className="space-y-1.5">
                    <h3 className="font-black text-slate-800 text-sm tracking-tight group-hover:text-sky-500 transition-colors duration-200">
                      {profesor.nombre}
                    </h3>
                    
                    {materia && (
                      <p className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1.5">
                        <BookOpen size={12} className="text-sky-500 shrink-0" />
                        {materia}
                      </p>
                    )}

                    {carrera && (
                      <p className="text-[9.5px] font-bold text-slate-400">
                        Carrera: <span className="text-slate-500 font-semibold">{carrera}</span>
                      </p>
                    )}

                    {profesor.dni && (
                      <p className="text-[9.5px] font-bold text-slate-400">
                        DNI: <span className="font-mono text-slate-500">{profesor.dni}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones en la parte inferior */}
                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Activo</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirFormularioEditar(profesor)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition active:scale-95 cursor-pointer"
                      title="Editar profesor"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => manejarEliminar(profesor)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition active:scale-95 cursor-pointer"
                      title="Eliminar profesor"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CONTADOR */}
      {!cargando && profesores.length > 0 && (
        <p className="text-center text-[9px] text-slate-400 mt-8 font-bold uppercase tracking-wider">
          {profesoresFiltrados.length} de {profesores.length} profesores registrados
        </p>
      )}
    </div>
  )
}
