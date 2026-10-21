import React, { useState, useEffect } from 'react'
import { 
  X, CalendarPlus, Sparkles, Building2, Calendar, MapPin, Users, Award, 
  ArrowRight, CheckCircle2, AlertCircle, ChevronDown, Check,
  Laptop, Bot, ShieldCheck, Ruler, Cpu, Clock, Layers, UserCheck, 
  Eye, EyeOff, Search, FileSpreadsheet, Info, RefreshCw, Database
} from 'lucide-react'
import { crearCeremonia, activarCeremonia, obtenerEstudiantesHabilitados } from '../servicios/api'

// Catálogo institucional oficial de carreras del Instituto Tecnológico Beltrán
export const CARRERAS_BELTRAN = [
  {
    id: 'TSAS',
    nombre: 'Tecnicatura Superior en Analista de Sistemas',
    tituloCorto: 'Analista de Sistemas',
    icono: Laptop,
    esPredeterminada: true,
    cohorteSugerida: 'Promoción 2026',
    codigoPlan: 'Resolución N° 5834/03',
    duracion: '3 Años · Nivel Superior Técnico',
    alumnosEstimados: 48,
    descripcion: 'Ingeniería de software, bases de datos relacionales y arquitectura de sistemas empresariales.'
  },
  {
    id: 'TSCDIA',
    nombre: 'Tecnicatura Superior en Ciencia de Datos e Inteligencia Artificial',
    tituloCorto: 'Ciencia de Datos e IA',
    icono: Bot,
    cohorteSugerida: 'Cohorte Pionera 2026',
    codigoPlan: 'Resolución N° 1245/21',
    duracion: '3 Años · Nivel Superior Técnico',
    alumnosEstimados: 32,
    descripcion: 'Machine Learning, pipelines de Big Data, análisis predictivo y modelos matemáticos.'
  },
  {
    id: 'TSHSAL',
    nombre: 'Tecnicatura Superior en Higiene, Seguridad y Ambiente Laboral',
    tituloCorto: 'Higiene y Seguridad',
    icono: ShieldCheck,
    cohorteSugerida: 'Promoción Anual 2026',
    codigoPlan: 'Resolución N° 3209/16',
    duracion: '3 Años · Nivel Superior Técnico',
    alumnosEstimados: 26,
    descripcion: 'Gestión preventiva de riesgos del trabajo, ergonomía, auditoría y normativas ambientales.'
  },
  {
    id: 'TSDI',
    nombre: 'Tecnicatura Superior en Diseño Industrial',
    tituloCorto: 'Diseño Industrial',
    icono: Ruler,
    cohorteSugerida: 'Graduación 2026',
    codigoPlan: 'Resolución N° 4110/18',
    duracion: '3 Años · Nivel Superior Técnico',
    alumnosEstimados: 19,
    descripcion: 'Modelado CAD/CAM 3D, desarrollo de productos, matricería y prototipado tecnológico.'
  },
  {
    id: 'TSAR',
    nombre: 'Tecnicatura Superior en Automatización y Robótica',
    icono: Cpu,
    tituloCorto: 'Automatización y Robótica',
    cohorteSugerida: 'Promoción Técnica 2026',
    codigoPlan: 'Resolución N° 2790/19',
    duracion: '3 Años · Nivel Superior Técnico',
    alumnosEstimados: 24,
    descripcion: 'Controladores lógicos programables (PLC), robótica industrial, sensores y sistemas SCADA.'
  }
]

export function ModalCrearCircuito({ abierto, onCerrar, onCircuitoCreado, onIniciarModoPrueba }) {
  if (!abierto) return null

  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Selección multi-carrera (TSAS seleccionada por defecto)
  const [carrerasSeleccionadas, setCarrerasSeleccionadas] = useState(['TSAS'])
  
  // Padrón Real cargado desde PostgreSQL Neon
  const [alumnosReales, setAlumnosReales] = useState([])
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false)
  const [mostrarAlumnos, setMostrarAlumnos] = useState(false)
  const [filtroBusquedaAlumnos, setFiltroBusquedaAlumnos] = useState('')

  // Formulario general
  const [formulario, setFormulario] = useState({
    nombre: `Colación Solemne TSAS - Promoción 2026`,
    fecha: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hora: '19:00',
    lugar: 'Sede Beltrán Avellaneda (Av. Belgrano 1191)',
    auditorio: 'Anfiteatro Central Beltrán',
    max_invitados: 4,
    max_entregadores: 2,
    poblarConDemo: false
  })

  // Consulta en tiempo real de la base de datos al cambiar carreras
  useEffect(() => {
    let cancelado = false

    async function cargarPadron() {
      if (carrerasSeleccionadas.length === 0) {
        setAlumnosReales([])
        return
      }

      setCargandoAlumnos(true)
      try {
        const datos = await obtenerEstudiantesHabilitados(carrerasSeleccionadas, filtroBusquedaAlumnos)
        if (!cancelado) {
          setAlumnosReales(Array.isArray(datos) ? datos : [])
        }
      } catch (err) {
        console.error('Error al consultar estudiantes habilitados de Neon:', err)
      } finally {
        if (!cancelado) setCargandoAlumnos(false)
      }
    }

    cargarPadron()
    return () => { cancelado = true }
  }, [carrerasSeleccionadas, filtroBusquedaAlumnos])

  // Alternar selección de una carrera
  const toggleCarrera = (id) => {
    setCarrerasSeleccionadas(prev => {
      let nueva
      if (prev.includes(id)) {
        if (prev.length === 1) return prev
        nueva = prev.filter(c => c !== id)
      } else {
        nueva = [...prev, id]
      }

      const codigos = nueva.join(' + ')
      setFormulario(f => ({
        ...f,
        nombre: `Colación ${codigos} - Promoción 2026`
      }))

      return nueva
    })
  }

  const manejarCambio = (campo, valor) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }))
    if (error) setError('')
  }

  const estimacionEgresados = CARRERAS_BELTRAN
    .filter(c => carrerasSeleccionadas.includes(c.id))
    .reduce((acc, curr) => acc + curr.alumnosEstimados, 0)

  const manejarCrearReal = async () => {
    if (!formulario.nombre.trim()) {
      setError('Por favor, ingresá un nombre representativo para la ceremonia.')
      return
    }
    if (!formulario.fecha) {
      setError('Por favor, seleccioná la fecha oficial del evento.')
      return
    }
    if (carrerasSeleccionadas.length === 0) {
      setError('Debes seleccionar al menos una carrera para la ceremonia.')
      return
    }

    setCargando(true)
    setError('')

    try {
      const carrerasNombres = CARRERAS_BELTRAN
        .filter(c => carrerasSeleccionadas.includes(c.id))
        .map(c => c.nombre)
        .join(', ')

      const payload = {
        nombre: formulario.nombre.trim(),
        fecha: formulario.fecha,
        hora: formulario.hora,
        lugar: formulario.lugar.trim(),
        carrera: carrerasNombres,
        carrera_id: carrerasSeleccionadas.join(','),
        max_invitados: Number(formulario.max_invitados) || 4,
        max_entregadores: Number(formulario.max_entregadores) || 2,
        activa: 1
      }

      const nueva = await crearCeremonia(payload)
      if (nueva && nueva.id) {
        await activarCeremonia(nueva.id)
      }

      if (formulario.poblarConDemo && onIniciarModoPrueba) {
        onIniciarModoPrueba()
      } else if (onCircuitoCreado) {
        onCircuitoCreado(nueva)
      }

      onCerrar()
    } catch (err) {
      console.error('Error al inicializar circuito institucional:', err)
      setError(err.message || 'No se pudo crear la ceremonia. Verificá la conexión con el servidor.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Contenedor Modal con soporte estricto claro/oscuro de alto contraste */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Cabecera Institucional Beltrán */}
        <div className="relative px-6 py-4.5 bg-gradient-to-r from-slate-900 via-[#0B1E38] to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/20 border border-sky-400/30 text-sky-400 shadow-inner">
              <CalendarPlus size={22} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-400/15 border border-sky-400/30 mb-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-[9.5px] font-black uppercase tracking-widest text-sky-300">
                  Instituto Tecnológico Beltrán
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Inicialización de Nuevo Circuito de Colación
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar asistente"
          >
            <X size={18} />
          </button>
        </div>

        {/* Indicador de Etapas */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold shrink-0">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
              paso === 1 ? 'bg-sky-600 text-white shadow-xs' : 'bg-emerald-600 text-white'
            }`}>
              {paso === 1 ? '1' : '✔'}
            </span>
            <span className={paso === 1 ? 'text-slate-900 font-black' : 'text-slate-600'}>
              Etapa 1: Carreras Participantes y Padrón
            </span>
          </div>

          <div className="hidden sm:block h-0.5 w-24 bg-slate-300 rounded-full" />

          <div className="flex items-center gap-2.5">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
              paso === 2 ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-300 text-slate-700 font-bold'
            }`}>
              2
            </span>
            <span className={paso === 2 ? 'text-slate-900 font-black' : 'text-slate-500'}>
              Etapa 2: Aforo, Auditorio y Modo
            </span>
          </div>
        </div>

        {/* Contenido Desplazable del Formulario */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold">
              <AlertCircle size={17} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= ETAPA 1 ================= */}
          {paso === 1 && (
            <div className="space-y-5">
              
              {/* Selección Multi-Carrera con Fichas de Alto Contraste */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-900">
                      Carreras Académicas en esta Colación
                    </label>
                    <p className="text-[11.5px] text-slate-600 font-medium">
                      Marcá las carreras oficiales Beltrán que formarán parte de este acto de colación.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11.5px]">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 font-black border border-sky-300">
                      {carrerasSeleccionadas.length} seleccionada{carrerasSeleccionadas.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-slate-400 font-semibold">•</span>
                    <span className="text-slate-800 font-bold">
                      ~{estimacionEgresados} egresados est.
                    </span>
                  </div>
                </div>

                {/* Grid de Carreras Beltrán */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CARRERAS_BELTRAN.map(c => {
                    const seleccionada = carrerasSeleccionadas.includes(c.id)
                    const IconoCarrera = c.icono
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleCarrera(c.id)}
                        className={`group relative flex items-start gap-3.5 p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                          seleccionada
                            ? 'bg-sky-50/90 border-sky-600 shadow-sm ring-2 ring-sky-500/10'
                            : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/80 shadow-2xs'
                        }`}
                      >
                        {/* Checkbox Visual Nítido */}
                        <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-lg border transition-colors shrink-0 ${
                          seleccionada
                            ? 'bg-sky-600 border-sky-600 text-white'
                            : 'border-slate-400 bg-white text-transparent group-hover:border-slate-600'
                        }`}>
                          <Check size={13} strokeWidth={3} />
                        </div>

                        {/* Icono de Especialidad */}
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-colors ${
                          seleccionada
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-slate-200'
                        }`}>
                          <IconoCarrera size={19} strokeWidth={2.2} />
                        </div>

                        {/* Textos y Ficha con Excelente Legibilidad */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-xs font-black truncate ${
                              seleccionada ? 'text-sky-950' : 'text-slate-900'
                            }`}>
                              {c.nombre}
                            </h4>
                            {c.esPredeterminada && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sky-200 text-sky-900 border border-sky-300 shrink-0">
                                Oficial
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-semibold mt-0.5">
                            <span className="text-slate-700">{c.codigoPlan}</span>
                            <span>•</span>
                            <span className="text-slate-900 font-bold">~{c.alumnosEstimados} alumnos</span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                            {c.descripcion}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Panel de Vista Previa de Alumnos Conectado a Neon PostgreSQL */}
              <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900">
                          Padrón Habilitado para esta Selección ({alumnosReales.length} graduados registrados)
                        </h4>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[9px] font-black text-emerald-700">
                          <Database size={10} /> Base Neon En Vivo
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Nómina académica oficial de estudiantes con correlativas acreditadas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cargandoAlumnos && (
                      <RefreshCw size={14} className="animate-spin text-sky-600" />
                    )}
                    <button
                      type="button"
                      onClick={() => setMostrarAlumnos(!mostrarAlumnos)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 transition cursor-pointer shadow-2xs"
                    >
                      {mostrarAlumnos ? <EyeOff size={14} className="text-slate-600" /> : <Eye size={14} className="text-sky-700" />}
                      <span>{mostrarAlumnos ? 'Ocultar nómina' : 'Ver nómina previa'}</span>
                    </button>
                  </div>
                </div>

                {/* Tabla de Alumnos Desplegable */}
                {mostrarAlumnos && (
                  <div className="mt-4 pt-3.5 border-t border-slate-200 animate-in fade-in duration-150">
                    {/* Barra de búsqueda interna */}
                    <div className="relative mb-3">
                      <input
                        type="text"
                        value={filtroBusquedaAlumnos}
                        onChange={e => setFiltroBusquedaAlumnos(e.target.value)}
                        placeholder="Buscar en la base de datos por apellido, nombre, DNI o legajo..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-medium outline-none focus:bg-white focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20"
                      />
                      <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
                    </div>

                    {/* Tabla de Alumnos Reales */}
                    <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <table className="w-full text-left text-[11.5px]">
                        <thead className="bg-slate-100 text-slate-800 sticky top-0 font-black border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3.5">Estudiante</th>
                            <th className="py-2.5 px-3.5">DNI</th>
                            <th className="py-2.5 px-3.5">Legajo</th>
                            <th className="py-2.5 px-3.5">Carrera</th>
                            <th className="py-2.5 px-3.5 text-center">Promedio</th>
                            <th className="py-2.5 px-3.5 text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {cargandoAlumnos && alumnosReales.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-slate-500 font-medium">
                                Consultando base de datos académica Neon...
                              </td>
                            </tr>
                          ) : alumnosReales.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-500 font-medium px-4">
                                <div className="max-w-md mx-auto space-y-2">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto">
                                    <FileSpreadsheet size={20} />
                                  </div>
                                  <p className="text-xs font-bold text-slate-800">
                                    Aún no hay graduados cargados en la base de datos para esta carrera.
                                  </p>
                                  <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Al crear el circuito se generará el entorno vacío listo para importar la nómina oficial mediante archivo Excel en el <strong>Paso 02 (PADRÓN)</strong>.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            alumnosReales.map(a => {
                              const carreraInfo = CARRERAS_BELTRAN.find(c => c.id === a.carrera_id)
                              return (
                                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2 px-3.5 font-bold text-slate-900 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                    {a.nombre}
                                  </td>
                                  <td className="py-2 px-3.5 font-mono text-[11px] text-slate-600 font-semibold">{a.dni}</td>
                                  <td className="py-2 px-3.5 font-mono text-[11px] text-slate-600 font-semibold">{a.legajo}</td>
                                  <td className="py-2 px-3.5 font-semibold text-slate-700">
                                    {carreraInfo?.tituloCorto || a.carrera_nombre || a.carrera_id}
                                  </td>
                                  <td className="py-2 px-3.5 text-center font-mono font-bold text-sky-700">
                                    {Number(a.promedio).toFixed(2)}
                                  </td>
                                  <td className="py-2 px-3.5 text-right">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[10px]">
                                      {a.estado_academico || 'Habilitado'}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Nombre de la Ceremonia */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                  Nombre Oficial de la Ceremonia
                </label>
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={e => manejarCambio('nombre', e.target.value)}
                  placeholder="Ej: Colación TSAS - Promoción 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Este título figurará en las credenciales digitales y actas de colación.</p>
              </div>

              {/* Fecha y Horario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                    Fecha del Acto
                  </label>
                  <input
                    type="date"
                    value={formulario.fecha}
                    onChange={e => manejarCambio('fecha', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold focus:border-sky-600 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                    Horario de Apertura
                  </label>
                  <input
                    type="time"
                    value={formulario.hora}
                    onChange={e => manejarCambio('hora', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold focus:border-sky-600 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= ETAPA 2 ================= */}
          {paso === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                  Sede Institucional
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formulario.lugar}
                    onChange={e => manejarCambio('lugar', e.target.value)}
                    placeholder="Ej: Sede Beltrán Avellaneda (Av. Belgrano 1191)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold focus:border-sky-600 outline-none transition"
                  />
                  <MapPin size={17} className="absolute left-3.5 top-3 text-slate-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                    Límite de Acompañantes por Graduado
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formulario.max_invitados}
                    onChange={e => manejarCambio('max_invitados', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold focus:border-sky-600 outline-none transition"
                  />
                  <p className="text-[11px] text-slate-500 font-medium mt-1">Pase QR grupal para butacas de invitados.</p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                    Máximo de Entregadores de Diploma
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formulario.max_entregadores}
                    onChange={e => manejarCambio('max_entregadores', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold focus:border-sky-600 outline-none transition"
                  />
                  <p className="text-[11px] text-slate-500 font-medium mt-1">Familiares o docentes asignados para el título.</p>
                </div>
              </div>

              {/* Selección del Tipo de Inicialización */}
              <div className="pt-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                  Modalidad de Inicialización
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div
                    onClick={() => manejarCambio('poblarConDemo', false)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      !formulario.poblarConDemo
                        ? 'border-sky-600 bg-sky-50/90 shadow-sm'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Layers size={17} className={!formulario.poblarConDemo ? 'text-sky-700' : 'text-slate-600'} />
                        <span className="text-xs font-black text-slate-900">Circuito Limpio</span>
                      </div>
                      {!formulario.poblarConDemo && <CheckCircle2 size={17} className="text-sky-700" />}
                    </div>
                    <p className="text-[11px] font-medium text-slate-600 leading-snug">
                      Inicializa el entorno vacío listo para importar la nómina oficial mediante archivo Excel.
                    </p>
                  </div>

                  <div
                    onClick={() => manejarCambio('poblarConDemo', true)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      formulario.poblarConDemo
                        ? 'border-indigo-600 bg-indigo-50/90 shadow-sm'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Sparkles size={17} className={formulario.poblarConDemo ? 'text-indigo-700' : 'text-slate-600'} />
                        <span className="text-xs font-black text-slate-900">Entorno de Demostración</span>
                      </div>
                      {formulario.poblarConDemo && <CheckCircle2 size={17} className="text-indigo-700" />}
                    </div>
                    <p className="text-[11px] font-medium text-slate-600 leading-snug">
                      Carga graduados simulados y datos de prueba para recorrer el circuito en 1 clic.
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumen Informativo de la Ceremonia */}
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-300 text-[11.5px] text-slate-700 flex items-start gap-2.5">
                <Info size={17} className="text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Resumen operativo: </span>
                  Se generará la ceremonia para <strong>{carrerasSeleccionadas.length} carrera{carrerasSeleccionadas.length > 1 ? 's' : ''}</strong> con un aforo proyectado de ~{estimacionEgresados} egresados y hasta {(formulario.max_invitados || 4) * estimacionEgresados} acompañantes en el anfiteatro.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie de Acciones */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          {paso === 1 ? (
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPaso(1)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Atrás
            </button>
          )}

          {paso === 1 ? (
            <button
              type="button"
              onClick={() => {
                if (!formulario.nombre.trim()) {
                  setError('Por favor, ingresá un nombre representativo para la ceremonia.')
                  return
                }
                if (carrerasSeleccionadas.length === 0) {
                  setError('Por favor, seleccioná al menos una carrera institucional.')
                  return
                }
                setPaso(2)
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-sky-600 text-white text-xs font-black tracking-wide shadow-md transition active:scale-95 cursor-pointer"
            >
              Continuar a Etapa 2
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={cargando}
              onClick={manejarCrearReal}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-black tracking-wide shadow-lg shadow-sky-600/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {cargando ? 'Inicializando...' : 'Crear y Activar Circuito'}
              <CheckCircle2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
