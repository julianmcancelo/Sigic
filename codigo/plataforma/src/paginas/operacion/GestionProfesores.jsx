import { useState, useEffect, useMemo } from 'react'
import { 
  obtenerProfesores, 
  crearProfesor, 
  editarProfesor, 
  eliminarProfesor,
  obtenerCarreras,
  obtenerMaterias
} from '../../servicios/api'
import { 
  PlusCircle, Search, Edit3, Trash2, CheckCircle2, X, Award, BookOpen, 
  UserCheck, FileSpreadsheet, Check
} from 'lucide-react'
import { useConfirmacion } from '../../componentes/ModalConfirmacion'
import { ModalImportarProfesores } from '../../componentes/ModalImportarProfesores'

export function GestionProfesores({ sinHeader }) {
  const { confirmar, dialogoConfirmacion } = useConfirmacion()
  const [profesores, setProfesores] = useState([])
  const [carreras, setCarreras] = useState([])
  const [materiasCatalogo, setMateriasCatalogo] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarModalImportar, setMostrarModalImportar] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  
  // Estado del formulario
  const [formulario, setFormulario] = useState({
    nombre: '',
    dni: '',
    carreraId: '',
    materiasSeleccionadas: [] // Array de IDs de materias
  })
  
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [carreraFiltro, setCarreraFiltro] = useState('TODAS')

  useEffect(() => {
    let activo = true
    async function inicializar() {
      try {
        const [datosProfs, datosCarreras, datosMaterias] = await Promise.all([
          obtenerProfesores(),
          obtenerCarreras().catch(() => []),
          obtenerMaterias().catch(() => [])
        ])
        if (activo) {
          setProfesores(datosProfs || [])
          setCarreras(datosCarreras || [])
          setMateriasCatalogo(datosMaterias || [])
        }
      } catch (error) {
        if (activo) {
          setMensaje({ tipo: 'error', texto: error.message || 'Error al cargar datos' })
        }
      } finally {
        if (activo) setCargando(false)
      }
    }
    inicializar()
    return () => { activo = false }
  }, [])

  async function recargarProfesoresYMaterias() {
    try {
      const [datosProfs, datosMaterias] = await Promise.all([
        obtenerProfesores(),
        obtenerMaterias().catch(() => [])
      ])
      setProfesores(datosProfs || [])
      setMateriasCatalogo(datosMaterias || [])
    } catch (err) {
      console.error('Error al refrescar:', err)
    }
  }

  function abrirFormularioNuevo() {
    setEditandoId(null)
    const primeraCarrera = carreras.length > 0 ? carreras[0].id : ''
    setFormulario({
      nombre: '',
      dni: '',
      carreraId: primeraCarrera,
      materiasSeleccionadas: []
    })
    setMostrarFormulario(true)
    setMensaje(null)
  }

  function abrirFormularioEditar(profesor) {
    setEditandoId(profesor.id)
    const materiasIds = (profesor.materias_asignadas || []).map(m => m.id)
    
    // Intentar deducir la carrera inicial para el selector de materias
    let carreraIdInicial = ''
    if (profesor.materias_asignadas && profesor.materias_asignadas.length > 0) {
      const primeraMat = materiasCatalogo.find(m => m.id === profesor.materias_asignadas[0].id)
      if (primeraMat) carreraIdInicial = primeraMat.carrera_id
    }
    if (!carreraIdInicial && carreras.length > 0) {
      carreraIdInicial = carreras[0].id
    }

    setFormulario({
      nombre: profesor.nombre || '',
      dni: profesor.dni || '',
      carreraId: carreraIdInicial,
      materiasSeleccionadas: materiasIds
    })
    setMostrarFormulario(true)
    setMensaje(null)
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setEditandoId(null)
    setFormulario({ nombre: '', dni: '', carreraId: '', materiasSeleccionadas: [] })
  }

  function toggleMateriaSeleccionada(materiaId) {
    setFormulario(prev => {
      const existe = prev.materiasSeleccionadas.includes(materiaId)
      return {
        ...prev,
        materiasSeleccionadas: existe 
          ? prev.materiasSeleccionadas.filter(id => id !== materiaId)
          : [...prev.materiasSeleccionadas, materiaId]
      }
    })
  }

  async function manejarGuardar(e) {
    e.preventDefault()
    if (!formulario.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre del profesor es obligatorio' })
      return
    }

    setProcesando(true)
    setMensaje(null)

    // Construir etiqueta de materia sintética para compatibilidad
    const matsElegidas = materiasCatalogo.filter(m => formulario.materiasSeleccionadas.includes(m.id))
    const materiaTexto = matsElegidas.map(m => m.nombre).join(', ') || 'Cátedra Beltrán'

    const datosDocente = {
      nombre: formulario.nombre.trim(),
      dni: formulario.dni ? formulario.dni.trim() : null,
      materia: materiaTexto,
      materias_ids: formulario.materiasSeleccionadas
    }

    try {
      if (editandoId) {
        await editarProfesor(editandoId, datosDocente)
        setMensaje({ tipo: 'exito', texto: 'Profesor actualizado correctamente' })
      } else {
        await crearProfesor(datosDocente)
        setMensaje({ tipo: 'exito', texto: 'Profesor incorporado con éxito' })
      }
      cerrarFormulario()
      await recargarProfesoresYMaterias()
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo guardar el docente' })
    } finally {
      setProcesando(false)
    }
  }

  async function manejarEliminar(profesor) {
    const confirmado = await confirmar({
      titulo: 'Eliminar profesor',
      descripcion: `¿Desea desvincular a ${profesor.nombre}? Dejará de figurar disponible para diplomas y cátedras.`,
      textoConfirmar: 'Eliminar Docente',
      tipo: 'peligro',
    })
    if (!confirmado) return

    try {
      await eliminarProfesor(profesor.id)
      setMensaje({ tipo: 'exito', texto: `Profesor "${profesor.nombre}" eliminado` })
      await recargarProfesoresYMaterias()
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'Error al eliminar' })
    }
  }

  // Métricas calculadas
  const totalDocentes = profesores.length
  const docentesConCatedra = profesores.filter(p => (p.total_materias_asignadas || 0) > 0 || (p.materias_asignadas && p.materias_asignadas.length > 0)).length
  const totalMateriasAsignadas = profesores.reduce((acc, p) => acc + (parseInt(p.total_materias_asignadas, 10) || 0), 0)

  // Filtro de profesores
  const profesoresFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    return profesores.filter(p => {
      const coincideTexto = 
        !q ||
        p.nombre?.toLowerCase().includes(q) ||
        p.dni?.includes(q) ||
        p.materia?.toLowerCase().includes(q) ||
        (p.materias_asignadas || []).some(m => 
          m.nombre?.toLowerCase().includes(q) || 
          m.carrera?.toLowerCase().includes(q) ||
          m.carrera_sigla?.toLowerCase().includes(q)
        )

      if (!coincideTexto) return false

      if (carreraFiltro === 'TODAS') return true
      if (carreraFiltro === 'SIN_ASIGNAR') {
        return !p.materias_asignadas || p.materias_asignadas.length === 0
      }
      return (p.materias_asignadas || []).some(m => m.carrera_sigla === carreraFiltro || m.carrera === carreraFiltro)
    })
  }, [profesores, busqueda, carreraFiltro])

  // Materias visibles en el formulario según carrera seleccionada
  const materiasDeCarreraForm = useMemo(() => {
    if (!formulario.carreraId) return materiasCatalogo
    return materiasCatalogo.filter(m => m.carrera_id === formulario.carreraId)
  }, [materiasCatalogo, formulario.carreraId])

  return (
    <div className="font-sans">
      {/* HEADER INTEGRADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <div>
          {!sinHeader && (
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Gestión de Docentes y Padrinos
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200/80 px-2 py-0.5 rounded-md">
                Planes Beltrán
              </span>
            </div>
          )}
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Plantel docente y cátedras oficiales para la entrega protocolar de diplomas.
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-importar-docentes"
            onClick={() => setMostrarModalImportar(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" /> Importar Excel
          </button>
          <button
            id="btn-agregar-profesor"
            onClick={abrirFormularioNuevo}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <PlusCircle size={15} /> Agregar Docente
          </button>
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS COMPACTAS */}
      {!cargando && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
              <Award size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Docentes</p>
              <h4 className="text-xl font-black text-slate-900 leading-tight">{totalDocentes}</h4>
              <p className="text-[10px] font-semibold text-slate-500">Registrados en sistema</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <BookOpen size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Cátedras Asignadas</p>
              <h4 className="text-xl font-black text-slate-900 leading-tight">{totalMateriasAsignadas}</h4>
              <p className="text-[10px] font-semibold text-slate-500">De planes de estudio</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <UserCheck size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Docentes con Cátedra</p>
              <h4 className="text-xl font-black text-slate-900 leading-tight">{docentesConCatedra} <span className="text-xs font-normal text-slate-400">/ {totalDocentes}</span></h4>
              <p className="text-[10px] font-semibold text-slate-500">Con materias titulares</p>
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
          <button onClick={() => setMensaje(null)} className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer">
            <X size={13} />
          </button>
        </div>
      )}

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Buscar docente, DNI, materia o tecnicatura..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:border-sky-500 transition-all shadow-2xs placeholder-slate-400"
          />
        </div>

        {/* Chips de Carreras del Beltrán */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 select-none shrink-0 [scrollbar-width:none]">
          <button
            onClick={() => setCarreraFiltro('TODAS')}
            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all shrink-0 cursor-pointer active:scale-95 ${
              carreraFiltro === 'TODAS' 
                ? 'bg-sky-600 border-sky-600 text-white shadow-2xs' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            Todas
          </button>
          
          {carreras.map(c => {
            const sigla = c.sigla || c.nombre.slice(0, 6)
            const esActivo = carreraFiltro === sigla || carreraFiltro === c.nombre
            return (
              <button
                key={c.id}
                onClick={() => setCarreraFiltro(sigla)}
                title={c.nombre}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all shrink-0 cursor-pointer active:scale-95 ${
                  esActivo 
                    ? 'bg-sky-600 border-sky-600 text-white shadow-2xs' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {sigla}
              </button>
            )
          })}

          <button
            onClick={() => setCarreraFiltro('SIN_ASIGNAR')}
            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all shrink-0 cursor-pointer active:scale-95 ${
              carreraFiltro === 'SIN_ASIGNAR' 
                ? 'bg-amber-500 border-amber-500 text-white shadow-2xs' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            Sin Cátedra
          </button>
        </div>
      </div>

      {/* FORMULARIO COMPACTO DE ALTA / EDICIÓN */}
      {mostrarFormulario && (
        <div className="mb-5 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden animate-in slide-in-from-top duration-300">
          <div className="bg-slate-900 px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <h3 className="text-xs font-black tracking-wide uppercase">
                {editandoId ? 'Editar Docente y Cátedras' : 'Nuevo Docente / Padrino de Diplomas'}
              </h3>
            </div>
            <button onClick={cerrarFormulario} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-lg transition cursor-pointer">
              <X size={14} />
            </button>
          </div>

          <form onSubmit={manejarGuardar} className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[8.5px] font-black text-slate-400 uppercase tracking-widest">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lic. Martín Gómez"
                  value={formulario.nombre}
                  onChange={e => setFormulario({ ...formulario, nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-sky-500 focus:bg-white transition-all font-semibold"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-[8.5px] font-black text-slate-400 uppercase tracking-widest">
                  DNI (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 30123456"
                  value={formulario.dni}
                  onChange={e => setFormulario({ ...formulario, dni: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-sky-500 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[8.5px] font-black text-slate-400 uppercase tracking-widest">
                  Filtrar Cátedras por Carrera
                </label>
                <select
                  value={formulario.carreraId}
                  onChange={e => setFormulario({ ...formulario, carreraId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-sky-500 focus:bg-white transition-all font-semibold cursor-pointer"
                >
                  <option value="">Todas las Carreras</option>
                  {carreras.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.sigla || 'BELTRÁN'})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SELECCIÓN DE MATERIAS ASIGNADAS */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-widest">
                    Cátedras Oficiales a Cargo ({formulario.materiasSeleccionadas.length} seleccionadas)
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Marcá las materias del plan de estudios de las cuales el docente es titular.
                  </p>
                </div>
                {formulario.materiasSeleccionadas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormulario(prev => ({ ...prev, materiasSeleccionadas: [] }))}
                    className="text-[9px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wider cursor-pointer"
                  >
                    Desmarcar todas
                  </button>
                )}
              </div>

              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 [scrollbar-width:thin]">
                {materiasDeCarreraForm.length === 0 ? (
                  <div className="col-span-full py-6 text-center text-xs text-slate-400">
                    No se encontraron materias registradas para la carrera seleccionada.
                  </div>
                ) : (
                  materiasDeCarreraForm.map(mat => {
                    const seleccionada = formulario.materiasSeleccionadas.includes(mat.id)
                    const yaAsignadaAOtro = mat.profesor_nombre && mat.profesor_titular_id !== editandoId

                    return (
                      <div
                        key={mat.id}
                        onClick={() => toggleMateriaSeleccionada(mat.id)}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2 select-none ${
                          seleccionada 
                            ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-2xs' 
                            : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          seleccionada 
                            ? 'bg-sky-600 border-sky-600 text-white' 
                            : 'border-slate-300 bg-white'
                        }`}>
                          {seleccionada && <Check size={11} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold leading-tight truncate">{mat.nombre}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              {mat.anio_cursada}° Año
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-[9px] font-semibold text-slate-500 truncate">
                              {mat.carrera_nombre || 'Beltrán'}
                            </span>
                          </div>
                          {yaAsignadaAOtro && !seleccionada && (
                            <p className="text-[8.5px] text-amber-600 font-medium truncate mt-0.5">
                              Asignado a: {mat.profesor_nombre}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
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
                className="px-4 py-2 bg-slate-900 hover:bg-sky-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition disabled:bg-slate-200 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
              >
                {procesando && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {procesando ? 'Guardando...' : (editandoId ? 'Actualizar Docente' : 'Guardar Docente')}
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
        <div className="text-center py-12 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <BookOpen size={30} className="mx-auto mb-2 text-slate-300" />
          <h3 className="text-xs font-black text-slate-700 mb-0.5">Sin profesores coincidentes</h3>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            {busqueda || carreraFiltro !== 'TODAS'
              ? 'No se encontraron docentes con el criterio o carrera seleccionada.'
              : 'Podés dar de alta profesores manualmente o importarlos mediante una planilla Excel.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {profesoresFiltrados.map(profesor => {
            const materias = profesor.materias_asignadas || []
            const cantidadMaterias = materias.length
            
            // Recolectar siglas de carreras únicas del docente
            const carrerasDocente = Array.from(new Set(materias.map(m => m.carrera_sigla).filter(Boolean)))
            const badgeCarrera = carrerasDocente.length > 0 ? carrerasDocente.join(' · ') : 'Docente'

            return (
              <div
                key={profesor.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all duration-150 flex flex-col justify-between relative group"
              >
                <div>
                  {/* Fila Superior: Inicial + Badge de Carrera / Departamento */}
                  <div className="flex justify-between items-start gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-2xs shrink-0 select-none"
                      >
                        {profesor.nombre?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-xs tracking-tight truncate group-hover:text-sky-600 transition-colors" title={profesor.nombre}>
                          {profesor.nombre}
                        </h3>
                        {profesor.dni ? (
                          <p className="text-[10px] font-medium text-slate-400 font-mono leading-none mt-0.5">
                            DNI: {profesor.dni}
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-300 italic leading-none mt-0.5">Sin DNI</p>
                        )}
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border shrink-0 bg-sky-50 text-sky-700 border-sky-200/80 max-w-[110px] truncate" title={badgeCarrera}>
                      {badgeCarrera}
                    </span>
                  </div>

                  {/* Listado de Cátedras Asignadas */}
                  <div className="space-y-1 mt-2.5 pt-2.5 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <BookOpen size={10} className="text-sky-500" />
                        Cátedras ({cantidadMaterias})
                      </span>
                    </div>

                    {cantidadMaterias === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">
                        {profesor.materia || 'Sin materias asignadas'}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {materias.slice(0, 3).map(m => (
                          <div 
                            key={m.id} 
                            className="flex items-center justify-between gap-1 text-[11px] bg-slate-50/80 hover:bg-slate-100/70 rounded-md px-1.5 py-0.5 border border-slate-100 transition-colors"
                            title={`${m.nombre} - ${m.carrera} (${m.anio_cursada}° Año)`}
                          >
                            <span className="font-medium text-slate-700 truncate min-w-0">
                              {m.nombre}
                            </span>
                            <span className="text-[8.5px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-white text-slate-500 border border-slate-200 shrink-0">
                              {m.anio_cursada}°A · {m.carrera_sigla || 'BEL'}
                            </span>
                          </div>
                        ))}
                        {cantidadMaterias > 3 && (
                          <p className="text-[9px] font-bold text-sky-600 pt-0.5 text-right">
                            +{cantidadMaterias - 3} materias adicionales
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones en la parte inferior */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Padrino Activo</span>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => abrirFormularioEditar(profesor)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition cursor-pointer active:scale-95"
                      title="Editar cátedras y datos"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => manejarEliminar(profesor)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer active:scale-95"
                      title="Eliminar docente"
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

      {/* CONTADOR COMPACTO */}
      {!cargando && profesores.length > 0 && (
        <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-wider">
          {profesoresFiltrados.length} de {profesores.length} docentes listados
        </p>
      )}

      {/* MODAL DE IMPORTACIÓN MASIVA */}
      {mostrarModalImportar && (
        <ModalImportarProfesores 
          profesoresExistentes={profesores}
          onCerrar={() => setMostrarModalImportar(false)}
          onCompletado={() => {
            setMostrarModalImportar(false)
            recargarProfesoresYMaterias()
          }}
        />
      )}

      {dialogoConfirmacion}
    </div>
  )
}
