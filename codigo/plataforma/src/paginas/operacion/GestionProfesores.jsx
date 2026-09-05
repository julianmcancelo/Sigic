import { useState, useEffect } from 'react'
import { obtenerProfesores, crearProfesor, editarProfesor, eliminarProfesor } from '../../servicios/api'
import { 
  PlusCircle, Search, Edit3, Trash2, CheckCircle2, X, Award, BookOpen, UserCheck, FileSpreadsheet, Sparkles
} from 'lucide-react'
import { useConfirmacion } from '../../componentes/ModalConfirmacion'
import { ModalImportarProfesores } from '../../componentes/ModalImportarProfesores'

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
  const { confirmar, dialogoConfirmacion } = useConfirmacion()
  const [profesores, setProfesores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarModalImportar, setMostrarModalImportar] = useState(false)
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
    
    const mat = (materia || '').toLowerCase()
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
    const confirmado = await confirmar({
      titulo: 'Eliminar profesor',
      descripcion: `${profesor.nombre} dejará de estar disponible como padrino de diplomas.`,
      textoConfirmar: 'Eliminar profesor',
      tipo: 'peligro',
    })
    if (!confirmado) return

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
      {/* HEADER INTEGRADO COMPACTO */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-black tracking-tight" style={{ color: DARK }}>Gestión de Docentes y Padrinos</h2>
          <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">Plantel Docente Disponible para Diplomas</p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-importar-docentes"
            onClick={() => setMostrarModalImportar(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet size={13} className="text-emerald-600" /> Importar Excel
          </button>
          <button
            id="btn-agregar-profesor"
            onClick={abrirFormularioNuevo}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            <PlusCircle size={13} /> Agregar Docente
          </button>
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS COMPACTAS */}
      {!cargando && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
              <Award size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Total Docentes</p>
              <h4 className="text-base font-black text-slate-800 leading-tight">{profesores.length}</h4>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Materias</p>
              <h4 className="text-base font-black text-slate-800 leading-tight">{materiasUnicas}</h4>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
              <UserCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Activos</p>
              <h4 className="text-base font-black text-slate-800 leading-tight">{profesores.length} Disponibles</h4>
            </div>
          </div>
        </div>
      )}

      {/* MENSAJES */}
      {mensaje && (
        <div className={`mb-3 p-3 rounded-xl border flex justify-between items-center animate-in slide-in-from-top duration-300 ${
          mensaje.tipo === 'exito' ? 'bg-emerald-50/70 border-emerald-100 text-emerald-700' : 'bg-red-50/70 border-red-100 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-md ${mensaje.tipo === 'exito' ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {mensaje.tipo === 'exito' ? <CheckCircle2 size={13} /> : <X size={13} />}
            </div>
            <span className="font-bold text-[11px] uppercase tracking-wider">{mensaje.texto}</span>
          </div>
          <button onClick={() => setMensaje(null)} className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"><X size={13} /></button>
        </div>
      )}

      {/* BUSCADOR Y FILTROS COMPACTOS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Buscar por nombre, materia, carrera o DNI..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:border-sky-500 transition-all shadow-2xs placeholder-slate-400"
          />
        </div>

        {/* Filtro de Departamentos en chips compactos */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 select-none shrink-0">
          {['Todos', 'Sistemas', 'Ciencias Exactas', 'Administración', 'General'].map(dep => {
            const esActivo = depFiltrado === dep
            return (
              <button
                key={dep}
                onClick={() => setDepFiltrado(dep)}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all shrink-0 cursor-pointer active:scale-95 ${
                  esActivo 
                    ? 'bg-sky-500 border-sky-500 text-white shadow-2xs' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {dep}
              </button>
            )
          })}
        </div>
      </div>

      {/* FORMULARIO COMPACTO */}
      {mostrarFormulario && (
        <div className="mb-4 bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden animate-in slide-in-from-top duration-300">
          <div className="bg-slate-900 px-4 py-2.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <h3 className="text-xs font-black tracking-wide uppercase">
                {editandoId ? 'Editar Docente' : 'Nuevo Docente / Padrino'}
              </h3>
            </div>
            <button onClick={cerrarFormulario} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-lg transition cursor-pointer"><X size={14} /></button>
          </div>
          <form onSubmit={manejarGuardar} className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="block text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lic. Martín Gómez"
                  value={formulario.nombre}
                  onChange={e => setFormulario({ ...formulario, nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-sky-500 focus:bg-white transition-all font-semibold"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-[8.5px] font-black text-slate-400 uppercase tracking-widest">DNI (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: 30123456"
                  value={formulario.dni}
                  onChange={e => setFormulario({ ...formulario, dni: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-sky-500 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Carrera *</label>
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
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500 focus:bg-white transition-all font-semibold cursor-pointer"
                >
                  <option value="" disabled>Seleccione Carrera</option>
                  {Object.keys(CATALOGO_CARRERAS).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Materia *</label>
                <select
                  required
                  disabled={!formulario.carrera}
                  value={formulario.materia}
                  onChange={e => setFormulario({ ...formulario, materia: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500 focus:bg-white transition-all font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Seleccione Materia</option>
                  {(CATALOGO_CARRERAS[formulario.carrera] || []).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={cerrarFormulario}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={procesando}
                className="px-4 py-1.5 bg-slate-900 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition disabled:bg-slate-200 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
              >
                {procesando && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {procesando ? 'Guardando...' : (editandoId ? 'Actualizar' : 'Guardar Docente')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA COMPACTA DE DOCENTES */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-16 select-none">
          <div className="relative w-12 h-12 flex items-center justify-center mb-3">
            <div className="absolute inset-0 rounded-full border-3 border-t-[#0ea5e9] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
            <div className="absolute inset-1 rounded-full border-3 border-b-indigo-500 border-t-transparent border-r-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
            <img 
              src="/logo-oficial.png" 
              alt="SiGIC" 
              className="h-6 w-auto object-contain animate-pulse z-10 filter drop-shadow-[0_0_6px_rgba(14,165,233,0.5)]" 
            />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Cargando plantel docente...</p>
        </div>
      ) : profesoresFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-100 rounded-xl shadow-2xs">
          <BookOpen size={30} className="mx-auto mb-2 text-slate-300" />
          <h3 className="text-xs font-black text-slate-600 mb-0.5">Sin profesores registrados</h3>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Podés dar de alta profesores manualmente o importarlos mediante una planilla Excel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {profesoresFiltrados.map(profesor => {
            const depto = obtenerDepartamento(profesor.materia)
            const { carrera, materia } = obtenerCarreraYMateria(profesor.materia)
            
            let badgeDepto = 'bg-slate-50 text-slate-600 border-slate-200'
            if (depto === 'Sistemas') badgeDepto = 'bg-sky-50 text-sky-700 border-sky-200'
            if (depto === 'Ciencias Exactas') badgeDepto = 'bg-indigo-50 text-indigo-700 border-indigo-200'
            if (depto === 'Administración') badgeDepto = 'bg-emerald-50 text-emerald-700 border-emerald-200'

            return (
              <div
                key={profesor.id}
                className="bg-white rounded-xl p-3.5 border border-slate-200/80 hover:border-sky-300 hover:shadow-xs transition-all duration-150 flex flex-col justify-between relative group"
              >
                <div>
                  {/* Fila Superior: Inicial + Badge de Depto */}
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#0EA5E9] to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-2xs shrink-0 select-none"
                      >
                        {profesor.nombre?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-800 text-xs tracking-tight truncate group-hover:text-sky-600 transition-colors">
                          {profesor.nombre}
                        </h3>
                        {profesor.dni && (
                          <p className="text-[9px] font-bold text-slate-400 font-mono leading-none mt-0.5">
                            DNI: {profesor.dni}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shrink-0 ${badgeDepto}`}>
                      {depto}
                    </span>
                  </div>

                  {/* Materia y Carrera */}
                  <div className="space-y-1 mt-2.5 pt-2 border-t border-slate-100">
                    {materia && (
                      <p className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1.5 truncate" title={materia}>
                        <BookOpen size={11} className="text-sky-500 shrink-0" />
                        <span className="truncate">{materia}</span>
                      </p>
                    )}

                    {carrera && (
                      <p className="text-[9px] font-bold text-slate-400 truncate" title={carrera}>
                        Carrera: <span className="text-slate-600 font-medium">{carrera}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones en la parte inferior */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Padrino Activo</span>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => abrirFormularioEditar(profesor)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition cursor-pointer active:scale-95"
                      title="Editar profesor"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => manejarEliminar(profesor)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer active:scale-95"
                      title="Eliminar profesor"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CONTADOR COMPACTO */}
      {!cargando && profesores.length > 0 && (
        <p className="text-center text-[9px] text-slate-400 mt-4 font-bold uppercase tracking-wider">
          {profesoresFiltrados.length} de {profesores.length} docentes registrados
        </p>
      )}

      {/* MODAL DE IMPORTACIÓN MASIVA */}
      {mostrarModalImportar && (
        <ModalImportarProfesores 
          profesoresExistentes={profesores}
          onCerrar={() => setMostrarModalImportar(false)}
          onCompletado={() => {
            setMostrarModalImportar(false)
            cargarProfesores()
          }}
        />
      )}

      {dialogoConfirmacion}
    </div>
  )
}
