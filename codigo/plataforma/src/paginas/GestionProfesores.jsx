/**
 * GestionProfesores - Pantalla administrativa para gestionar el plantel docente.
 * Permite crear, editar, buscar y eliminar profesores del sistema.
 * Todo en español.
 */
import { useState, useEffect } from 'react'
import { obtenerProfesores, crearProfesor, editarProfesor, eliminarProfesor } from '../servicios/api'
import { HeaderGlobal } from '../componentes/HeaderGlobal'

export function GestionProfesores({ usuario, onVolver, onCerrarSesion }) {
  const [profesores, setProfesores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [formulario, setFormulario] = useState({ nombre: '', dni: '', materia: '' })
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  // Cargar profesores al montar el componente
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

  function abrirFormularioNuevo() {
    setEditandoId(null)
    setFormulario({ nombre: '', dni: '', materia: '' })
    setMostrarFormulario(true)
    setMensaje(null)
  }

  function abrirFormularioEditar(profesor) {
    setEditandoId(profesor.id)
    setFormulario({ nombre: profesor.nombre, dni: profesor.dni || '', materia: profesor.materia || '' })
    setMostrarFormulario(true)
    setMensaje(null)
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setEditandoId(null)
    setFormulario({ nombre: '', dni: '', materia: '' })
  }

  async function manejarGuardar(e) {
    e.preventDefault()
    if (!formulario.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre del profesor es obligatorio' })
      return
    }

    setProcesando(true)
    setMensaje(null)

    try {
      if (editandoId) {
        await editarProfesor(editandoId, formulario)
        setMensaje({ tipo: 'exito', texto: 'Profesor actualizado correctamente' })
      } else {
        await crearProfesor(formulario)
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
      setMensaje({ tipo: 'exito', texto: `Profesor "${profesor.nombre}" eliminado del plantel` })
      await cargarProfesores()
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message })
    }
  }

  // Filtrar profesores por búsqueda
  const profesoresFiltrados = profesores.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.materia?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.dni?.includes(busqueda)
  )

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <HeaderGlobal
        titulo="Gestión de Profesores"
        subtitulo="Administrá el plantel docente de la institución"
        usuario={usuario}
        onVolver={onVolver}
        onCerrarSesion={onCerrarSesion}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Mensaje de estado */}
        {mensaje && (
          <div className={`mb-6 px-5 py-3.5 rounded-2xl text-sm font-semibold border ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-600 border-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        {/* Barra de acciones */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Buscador */}
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre, materia o DNI..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
            />
          </div>

          {/* Botón agregar */}
          <button
            onClick={abrirFormularioNuevo}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
          >
            <span className="text-lg">+</span>
            Agregar Profesor
          </button>
        </div>

        {/* Formulario (inline, aparece arriba de la lista) */}
        {mostrarFormulario && (
          <div className="mb-8 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-400">
                {editandoId ? '✏️ Editar Profesor' : '➕ Nuevo Profesor'}
              </p>
            </div>
            <form onSubmit={manejarGuardar} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Prof. María García"
                    value={formulario.nombre}
                    onChange={e => setFormulario({ ...formulario, nombre: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    DNI (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 30.123.456"
                    value={formulario.dni}
                    onChange={e => setFormulario({ ...formulario, dni: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Materia / Asignatura (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Matemáticas"
                    value={formulario.materia}
                    onChange={e => setFormulario({ ...formulario, materia: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {procesando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {procesando ? 'Guardando...' : (editandoId ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Estado de carga */}
        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Cargando profesores...</p>
            </div>
          </div>
        ) : profesoresFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎓</p>
            <p className="text-lg font-bold text-slate-400">
              {busqueda ? 'No se encontraron resultados' : 'Aún no hay profesores cargados'}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              {busqueda ? 'Probá con otro término de búsqueda' : 'Tocá el botón "Agregar Profesor" para comenzar'}
            </p>
          </div>
        ) : (
          /* Lista de profesores */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profesoresFiltrados.map(profesor => (
              <div
                key={profesor.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20 flex-shrink-0">
                      {profesor.nombre?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{profesor.nombre}</p>
                      {profesor.materia && (
                        <p className="text-xs text-indigo-500 font-semibold mt-0.5">📚 {profesor.materia}</p>
                      )}
                      {profesor.dni && (
                        <p className="text-[11px] text-slate-400 mt-0.5">DNI: {profesor.dni}</p>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => abrirFormularioEditar(profesor)}
                      className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-indigo-100 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all"
                      title="Editar profesor"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => manejarEliminar(profesor)}
                      className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-red-100 flex items-center justify-center text-slate-500 hover:text-red-600 transition-all"
                      title="Eliminar profesor"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contador */}
        {!cargando && profesores.length > 0 && (
          <p className="text-center text-xs text-slate-400 mt-8 font-semibold">
            {profesoresFiltrados.length} de {profesores.length} profesores
          </p>
        )}
      </div>
    </div>
  )
}
