import React, { useState, useEffect } from 'react'
import { 
  Settings, Save, RefreshCw, Building2, Users, MapPin, 
  Globe, Shield, ChevronRight, LogOut, LayoutGrid, Monitor, SlidersHorizontal,
  Fingerprint, CheckCircle2, Mail, Send, CircleCheck, CircleAlert,
  Palette, Check, Grid, Layers, Sparkles, GraduationCap, BookOpen, Plus, Trash2, Edit3, Award, X
} from 'lucide-react'
import { 
  obtenerAjustes, actualizarAjuste, enviarCorreoPrueba,
  obtenerCarreras, crearCarrera, obtenerMaterias, crearMateria, obtenerProfesores
} from '../../servicios/api'
import { FONDOS_DISPONIBLES } from '../../datos/fondos-pantalla'

const INTERRUPTORES_ACTIVOS_POR_DEFECTO = { modo_mantenimiento: false }

function interruptorActivo(ajustes, clave) {
  const valor = ajustes[clave]
  if (valor === undefined) return INTERRUPTORES_ACTIVOS_POR_DEFECTO[clave] ?? true
  return valor !== 'false'
}

export function PanelAjustes({ usuario, onVolver, onCerrarSesion, onNavegar, ceremoniaActiva, sinHeader }) {
  const [ajustes, setAjustes] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [seccionActiva, setSeccionActiva] = useState('plataforma')
  const [correoPrueba, setCorreoPrueba] = useState(usuario?.email || '')
  const [enviandoPrueba, setEnviandoPrueba] = useState(false)
  const [resultadoCorreo, setResultadoCorreo] = useState(null)
  const [fondoId, setFondoId] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_fondo') || 'beltran' : 'beltran'))
  const [cuadriculaActiva, setCuadriculaActiva] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_cuadricula') !== 'false' : true))
  const [marcaAguaActiva, setMarcaAguaActiva] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_marca_agua') !== 'false' : true))

  // Estado del Módulo Académico (Carreras y Materias)
  const [carreras, setCarreras] = useState([])
  const [carreraSeleccionada, setCarreraSeleccionada] = useState(null)
  const [materias, setMaterias] = useState([])
  const [profesores, setProfesores] = useState([])
  const [cargandoAcademico, setCargandoAcademico] = useState(false)
  const [mostrarModalNuevaCarrera, setMostrarModalNuevaCarrera] = useState(false)
  const [mostrarModalNuevaMateria, setMostrarModalNuevaMateria] = useState(false)
  const [formCarrera, setFormCarrera] = useState({ nombre: '', sigla: '', duracion_anios: 3 })
  const [formMateria, setFormMateria] = useState({ nombre: '', anio_cursada: 1, profesor_titular_id: '' })

  const handleCambiarFondo = (id) => {
    setFondoId(id)
    localStorage.setItem('sigic_fondo', id)
    window.dispatchEvent(new CustomEvent('sigic-fondo-cambiado', { detail: id }))
    if (id === 'alabaster') {
      localStorage.setItem('sigic_tema', 'claro')
    } else {
      localStorage.setItem('sigic_tema', 'oscuro')
    }
    actualizarAjuste('fondo_pantalla', id).catch(() => {})
    setMensaje({ tipo: 'exito', texto: `Fondo de pantalla actualizado` })
    setTimeout(() => setMensaje(null), 3000)
  }

  const handleToggleCuadricula = () => {
    const nuevo = !cuadriculaActiva
    setCuadriculaActiva(nuevo)
    localStorage.setItem('sigic_cuadricula', String(nuevo))
    window.dispatchEvent(new CustomEvent('sigic-cuadricula-cambiada', { detail: nuevo }))
    setMensaje({ tipo: 'exito', texto: `Cuadrícula ${nuevo ? 'activada' : 'oculta'}` })
    setTimeout(() => setMensaje(null), 3000)
  }

  const handleToggleMarcaAgua = () => {
    const nuevo = !marcaAguaActiva
    setMarcaAguaActiva(nuevo)
    localStorage.setItem('sigic_marca_agua', String(nuevo))
    window.dispatchEvent(new CustomEvent('sigic-marca-agua-cambiada', { detail: nuevo }))
    setMensaje({ tipo: 'exito', texto: `Marca de agua ${nuevo ? 'activada' : 'oculta'}` })
    setTimeout(() => setMensaje(null), 3000)
  }

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    try {
      const datos = await obtenerAjustes()
      const aplanado = {}
      Object.entries(datos).forEach(([k, v]) => { aplanado[k] = v.valor })
      setAjustes(aplanado)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al conectar con el servidor' })
    } finally {
      setCargando(false)
    }
  }

  // Cargar datos académicos al ingresar a la pestaña correspondiente
  useEffect(() => {
    if (seccionActiva === 'academico') {
      cargarDatosAcademicos()
    }
  }, [seccionActiva])

  async function cargarDatosAcademicos() {
    setCargandoAcademico(true)
    try {
      const [listaCarreras, listaProfesores] = await Promise.all([
        obtenerCarreras().catch(() => []),
        obtenerProfesores().catch(() => [])
      ])
      setCarreras(listaCarreras)
      setProfesores(listaProfesores)

      // Seleccionar por defecto la primera carrera o mantener la activa
      const primera = listaCarreras[0]
      if (primera && (!carreraSeleccionada || !listaCarreras.some(c => c.id === carreraSeleccionada.id))) {
        setCarreraSeleccionada(primera)
        cargarMateriasDeCarrera(primera.id)
      } else if (carreraSeleccionada) {
        cargarMateriasDeCarrera(carreraSeleccionada.id)
      }
    } catch (e) {
      console.error('Error al cargar datos académicos:', e)
    } finally {
      setCargandoAcademico(false)
    }
  }

  async function cargarMateriasDeCarrera(carreraId) {
    if (!carreraId) return
    try {
      const lista = await obtenerMaterias(carreraId)
      setMaterias(lista)
    } catch (e) {
      console.error('Error al cargar materias:', e)
    }
  }

  async function handleGuardarNuevaCarrera(e) {
    e.preventDefault()
    if (!formCarrera.nombre.trim()) return
    try {
      const nueva = await crearCarrera(formCarrera)
      setMostrarModalNuevaCarrera(false)
      setFormCarrera({ nombre: '', sigla: '', duracion_anios: 3 })
      await cargarDatosAcademicos()
      setCarreraSeleccionada(nueva)
      setMensaje({ tipo: 'exito', texto: `Carrera "${nueva.nombre}" guardada correctamente.` })
      setTimeout(() => setMensaje(null), 3500)
    } catch (err) {
      alert(err.message || 'Error al guardar la carrera.')
    }
  }

  async function handleGuardarNuevaMateria(e) {
    e.preventDefault()
    if (!carreraSeleccionada || !formMateria.nombre.trim()) return
    try {
      await crearMateria({
        ...formMateria,
        carrera_id: carreraSeleccionada.id,
        anio_cursada: parseInt(formMateria.anio_cursada, 10) || 1
      })
      setMostrarModalNuevaMateria(false)
      setFormMateria({ nombre: '', anio_cursada: 1, profesor_titular_id: '' })
      await cargarMateriasDeCarrera(carreraSeleccionada.id)
      setMensaje({ tipo: 'exito', texto: 'Materia registrada correctamente.' })
      setTimeout(() => setMensaje(null), 3000)
    } catch (err) {
      alert(err.message || 'Error al guardar la materia.')
    }
  }

  async function handleGuardar(clave) {
    setGuardando(clave)
    try {
      await actualizarAjuste(clave, ajustes[clave])
      setMensaje({ tipo: 'exito', texto: 'Cambio guardado correctamente' })
      setTimeout(() => setMensaje(null), 3000)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar el cambio' })
    } finally {
      setGuardando(null)
    }
  }

  async function handleInterruptor(clave) {
    const anterior = interruptorActivo(ajustes, clave)
    const nuevo = !anterior
    setAjustes(prev => ({ ...prev, [clave]: String(nuevo) }))
    setGuardando(clave)
    try {
      await actualizarAjuste(clave, String(nuevo))
      setMensaje({ tipo: 'exito', texto: `${nuevo ? 'Activado' : 'Desactivado'} correctamente` })
      setTimeout(() => setMensaje(null), 2500)
    } catch (err) {
      setAjustes(prev => ({ ...prev, [clave]: String(anterior) }))
      setMensaje({ tipo: 'error', texto: 'No se pudo actualizar el ajuste' })
    } finally {
      setGuardando(null)
    }
  }

  const renderInterruptorCompacto = (clave, label, icono, descripcion) => {
    const activo = interruptorActivo(ajustes, clave)
    const estaGuardando = guardando === clave
    return (
      <div className="group bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs hover:border-sky-200 transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg shrink-0 transition-colors ${activo ? 'bg-sky-50 text-sky-600' : 'bg-slate-50 text-slate-400'}`}>
              {icono}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-800 truncate">{label}</h3>
                <span className={`rounded-full px-1.5 py-0.2 text-[8px] font-black uppercase tracking-wider ${activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 truncate sm:whitespace-normal">{descripcion}</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={activo}
            disabled={estaGuardando}
            onClick={() => handleInterruptor(clave)}
            className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-all cursor-pointer ${activo ? 'bg-sky-500' : 'bg-slate-200'}`}
          >
            <span className={`block h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${activo ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    )
  }

  const secciones = [
    { id: 'plataforma', nombre: 'Plataforma', detalle: 'Comportamiento y accesos', icono: SlidersHorizontal },
    { id: 'academico', nombre: 'Académico', detalle: 'Carreras, materias y docentes', icono: GraduationCap },
    { id: 'identidad', nombre: 'Identidad', detalle: 'Institución y presentación', icono: Building2 },
    { id: 'apariencia', nombre: 'Apariencia', detalle: 'Fondos y estilos visuales', icono: Palette },
    { id: 'ceremonia', nombre: 'Reglas y Cupos', detalle: 'Parámetros por defecto', icono: LayoutGrid },
    { id: 'correo', nombre: 'Correo', detalle: 'Pruebas de envío', icono: Mail },
  ]

  const renderFilaCompacta = (clave, label, icono, descripcion) => {
    const valor = ajustes[clave]
    const estaGuardando = guardando === clave

    return (
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 text-slate-500 rounded-lg shrink-0">
              {icono}
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">{label}</h3>
              <p className="text-[10px] text-slate-500">{descripcion}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={valor || ''}
              onChange={e => setAjustes(prev => ({ ...prev, [clave]: e.target.value }))}
              className="w-full sm:w-60 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none transition-all"
            />
            <button
              onClick={() => handleGuardar(clave)}
              disabled={estaGuardando}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-sky-600 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              {estaGuardando ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
              <span>{estaGuardando ? '...' : 'Guardar'}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="font-sans max-w-5xl mx-auto space-y-4">
      {/* Encabezado compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white shadow-xs">
            <Settings size={20} />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-sky-600">Configuración</span>
            <h1 className="text-base font-bold text-slate-900">Ajustes Institucionales</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ceremoniaActiva && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              Ceremonia activa: {ceremoniaActiva.nombre}
            </span>
          )}
        </div>
      </div>

      {/* Pestañas de navegación compactas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {secciones.map(({ id, nombre, detalle, icono: Icono }) => {
          const activa = seccionActiva === id
          return (
            <button
              key={id}
              onClick={() => setSeccionActiva(id)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                activa 
                  ? 'border-sky-300 bg-sky-50/80 text-sky-800 font-bold shadow-xs' 
                  : 'border-slate-200/70 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <Icono size={16} className={`mb-1 ${activa ? 'text-sky-600' : 'text-slate-400'}`} />
              <span className="text-xs leading-none">{nombre}</span>
              <span className="text-[8px] text-slate-400 mt-0.5 truncate w-full">{detalle}</span>
            </button>
          )
        })}
      </div>

      {mensaje && (
        <div className={`p-3 rounded-xl border text-xs font-bold animate-in fade-in ${
          mensaje.tipo === 'exito' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {cargando ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
          <RefreshCw size={20} className="animate-spin text-sky-500 mb-2" />
          <span>Cargando configuración...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* SECCIÓN 1: COMPORTAMIENTO GENERAL */}
          {seccionActiva === 'plataforma' && (
            <section className="space-y-2.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Comportamiento del Sistema</span>
              <div className="grid gap-2">
                {renderInterruptorCompacto('mostrar_presentacion_inicial', 'Pantalla de bienvenida', <Monitor size={16} />, 'Omite la portada y abre directamente el acceso administrativo.')}
                {renderInterruptorCompacto('modo_mantenimiento', 'Modo mantenimiento', <Shield size={16} />, 'Bloquea temporalmente el portal público de graduados.')}
                {renderInterruptorCompacto('acceso_oculto_egresado', 'Acceso reservado para graduados', <Fingerprint size={16} />, 'Oculta el botón directo en portada y conserva el ingreso con 5 clics.')}
                {renderInterruptorCompacto('acceso_directo_admin', 'Ruta directa administrativo', <Shield size={16} />, 'Habilita ingreso mediante la ruta /admin sin pasar por la bienvenida.')}
              </div>
            </section>
          )}

          {/* SECCIÓN 2: MÓDULO ACADÉMICO (CARRERAS Y MATERIAS) */}
          {seccionActiva === 'academico' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">Estructura Académica</h2>
                  <p className="text-[11px] text-slate-500">Carreras institucionales, materias y docentes titulares vinculados.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevaCarrera(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 transition cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Nueva Carrera</span>
                </button>
              </div>

              {/* Selector de Carrera */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {carreras.map(c => {
                  const esActiva = carreraSeleccionada?.id === c.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCarreraSeleccionada(c)
                        cargarMateriasDeCarrera(c.id)
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        esActiva 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {c.nombre} {c.sigla ? `(${c.sigla})` : ''}
                    </button>
                  )
                })}
              </div>

              {/* Detalle de la Carrera y sus Materias */}
              {carreraSeleccionada && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{carreraSeleccionada.nombre}</h3>
                      <p className="text-[10px] text-slate-500">
                        Duración: {carreraSeleccionada.duracion_anios} años · {materias.length} materias registradas
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMostrarModalNuevaMateria(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Agregar Materia</span>
                    </button>
                  </div>

                  {/* Materias agrupadas por Año de Cursada */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Array.from({ length: carreraSeleccionada.duracion_anios || 3 }, (_, i) => i + 1).map(anio => {
                      const materiasAnio = materias.filter(m => Number(m.anio_cursada) === anio)
                      return (
                        <div key={anio} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700">
                              {anio}° Año
                            </span>
                            <span className="text-[9px] font-bold text-slate-400">
                              {materiasAnio.length} materias
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {materiasAnio.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic py-2">Sin materias asignadas</p>
                            ) : (
                              materiasAnio.map(m => (
                                <div key={m.id} className="bg-white rounded-lg p-2 border border-slate-200/70 shadow-xs">
                                  <p className="text-xs font-bold text-slate-800">{m.nombre}</p>
                                  <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-500">
                                    <Award size={10} className="text-indigo-500 shrink-0" />
                                    <span className="truncate">{m.profesor_nombre || 'Docente sin asignar'}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* SECCIÓN 3: IDENTIDAD INSTITUCIONAL */}
          {seccionActiva === 'identidad' && (
            <section className="space-y-2.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Presentación Oficial</span>
              <div className="grid gap-2">
                {renderFilaCompacta('nombre_institucion', 'Nombre institucional', <Building2 size={16} />, 'Utilizado en credenciales, certificados y encabezados oficiales.')}
              </div>
            </section>
          )}

          {/* SECCIÓN 4: APARIENCIA */}
          {seccionActiva === 'apariencia' && (
            <section className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Tema y Fondo</span>
                <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                  {FONDOS_DISPONIBLES.find(f => f.id === fondoId)?.nombre || 'Azul Beltrán'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {FONDOS_DISPONIBLES.map(f => {
                  const activo = fondoId === f.id
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleCambiarFondo(f.id)}
                      className={`group relative flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                        activo 
                          ? 'border-sky-500 bg-sky-50/80 shadow-md ring-2 ring-sky-500/20 scale-[1.01]' 
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs hover:bg-slate-50/50'
                      }`}
                    >
                      <div 
                        className="h-10 w-10 rounded-xl border border-slate-300/80 shadow-xs shrink-0 flex items-center justify-center relative overflow-hidden" 
                        style={{ 
                          background: `linear-gradient(135deg, ${f.colores[0]}, ${f.colores[1]})` 
                        }}
                      >
                        <span 
                          className="w-3 h-3 rounded-full border border-white/60 shadow-xs" 
                          style={{ backgroundColor: f.colorPrincipal }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-black text-slate-800 truncate">{f.nombre}</p>
                          {f.badge && (
                            <span 
                              className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md shrink-0 border"
                              style={{
                                backgroundColor: `${f.colorPrincipal}18`,
                                color: f.colorPrincipal,
                                borderColor: `${f.colorPrincipal}35`
                              }}
                            >
                              {f.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">{f.descripcion || 'Tema visual'}</p>
                      </div>
                      {activo && (
                        <div className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 rounded-full bg-sky-500 text-white">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Grid size={15} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">Cuadrícula Tecnológica</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleCuadricula}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${cuadriculaActiva ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    {cuadriculaActiva ? 'Activa' : 'Oculta'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Layers size={15} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">Marca de Agua Beltrán</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleMarcaAgua}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${marcaAguaActiva ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    {marcaAguaActiva ? 'Activa' : 'Oculta'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* SECCIÓN 5: REGLAS Y CUPOS */}
          {seccionActiva === 'ceremonia' && (
            <section className="space-y-2.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Parámetros Operativos</span>
              <div className="grid gap-2">
                {renderFilaCompacta('max_invitados', 'Cupo de Invitados', <Users size={16} />, 'Acompañantes permitidos por graduado.')}
                {renderFilaCompacta('formato_identificador', 'Formato Identificador', <Settings size={16} />, '{CARRERA}-{LEGAJO}-{AÑO}')}
                {renderFilaCompacta('campos_identificador', 'Campos Obligatorios', <Users size={16} />, 'carrera,legajo,anio_inscripcion')}
              </div>
            </section>
          )}

          {/* SECCIÓN 6: CORREO */}
          {seccionActiva === 'correo' && (
            <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Prueba de Correo Saliente</h3>
                <p className="text-[10px] text-slate-500">Envía un mensaje de diagnóstico para validar el servidor SMTP o Resend.</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  value={correoPrueba}
                  onChange={e => setCorreoPrueba(e.target.value)}
                  placeholder="destino@correo.com"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
                />
                <button
                  type="button"
                  disabled={enviandoPrueba}
                  onClick={async () => {
                    if (!correoPrueba.trim()) return
                    setEnviandoPrueba(true)
                    try {
                      const res = await enviarCorreoPrueba(correoPrueba)
                      setResultadoCorreo({ tipo: 'exito', texto: 'Correo enviado con éxito.' })
                    } catch (err) {
                      setResultadoCorreo({ tipo: 'error', texto: err.message || 'Error de envío' })
                    } finally {
                      setEnviandoPrueba(false)
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-sky-600 transition cursor-pointer disabled:opacity-50"
                >
                  {enviandoPrueba ? 'Enviando...' : 'Enviar Prueba'}
                </button>
              </div>

              {resultadoCorreo && (
                <p className={`text-xs font-bold ${resultadoCorreo.tipo === 'exito' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {resultadoCorreo.texto}
                </p>
              )}
            </section>
          )}

          {/* Pie de accesos rápidos */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavegar('seleccion-asientos')}
              className="text-xs font-bold text-slate-600 hover:text-sky-600 flex items-center gap-1 cursor-pointer"
            >
              <LayoutGrid size={13} />
              <span>Diseñar Anfiteatro</span>
            </button>
            <button
              onClick={onCerrarSesion}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Crear Nueva Carrera */}
      {mostrarModalNuevaCarrera && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleGuardarNuevaCarrera} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Nueva Carrera Institucional</h3>
              <button type="button" onClick={() => setMostrarModalNuevaCarrera(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre de la Carrera *</label>
                <input
                  type="text"
                  required
                  value={formCarrera.nombre}
                  onChange={e => setFormCarrera(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej. Tecnicatura Superior en Ciberseguridad"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Sigla / Código</label>
                  <input
                    type="text"
                    value={formCarrera.sigla}
                    onChange={e => setFormCarrera(p => ({ ...p, sigla: e.target.value }))}
                    placeholder="Ej. TSCS"
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Duración (Años)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formCarrera.duracion_anios}
                    onChange={e => setFormCarrera(p => ({ ...p, duracion_anios: parseInt(e.target.value, 10) || 3 }))}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalNuevaCarrera(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-sky-600 transition"
              >
                Guardar Carrera
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Crear Nueva Materia */}
      {mostrarModalNuevaMateria && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleGuardarNuevaMateria} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-sky-600">{carreraSeleccionada?.nombre}</span>
                <h3 className="text-sm font-bold text-slate-900">Nueva Materia</h3>
              </div>
              <button type="button" onClick={() => setMostrarModalNuevaMateria(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre de la Materia *</label>
                <input
                  type="text"
                  required
                  value={formMateria.nombre}
                  onChange={e => setFormMateria(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej. Redes y Conectividad"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Año de Cursada</label>
                  <select
                    value={formMateria.anio_cursada}
                    onChange={e => setFormMateria(p => ({ ...p, anio_cursada: parseInt(e.target.value, 10) }))}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white cursor-pointer"
                  >
                    {Array.from({ length: carreraSeleccionada?.duracion_anios || 3 }, (_, i) => i + 1).map(anio => (
                      <option key={anio} value={anio}>{anio}° Año</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Profesor Titular</label>
                  <select
                    value={formMateria.profesor_titular_id}
                    onChange={e => setFormMateria(p => ({ ...p, profesor_titular_id: e.target.value }))}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white cursor-pointer"
                  >
                    <option value="">-- Sin Asignar --</option>
                    {profesores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalNuevaMateria(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-sky-600 transition"
              >
                Guardar Materia
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
