/**
 * PanelGraduado - Panel principal que ve el graduado al iniciar sesión.
 * Contiene 4 pestañas: Juramento, Acompañantes, Padrinos y Credencial.
 * El graduado propone las butacas del grupo y administración confirma la asignación final.
 */
import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Users, LogOut, QrCode,
  GraduationCap, Armchair,
  CalendarDays, MapPin, Check, ArrowLeft, ScrollText
} from 'lucide-react'
import { 
  obtenerInvitadosDeEgresado, eliminarInvitado, actualizarInvitado, 
  cargarInvitados, obtenerProfesores, obtenerEntregadoresDeGraduado,
  asignarEntregador, eliminarEntregador, finalizarInscripcionGraduado, obtenerAjustes,
  obtenerGraduadoPorId
} from '../servicios/api'
import { useSincronizacion, emitirCambioSync } from '../lib/sync'
import { ModalCredencial } from '../componentes/ModalCredencial'
import { ListaHistorialGraduado } from './HistorialGraduado'
import { FormularioAcompanante } from '../componentes/graduado/FormularioAcompanante'
import { ListaAcompanantes } from '../componentes/graduado/ListaAcompanantes'
import { SeccionPadrinos } from '../componentes/graduado/SeccionPadrinos'
import { SeccionJuramento, FORMULAS_JURAMENTO } from '../componentes/graduado/SeccionJuramento'
import { useConfirmacion } from '../componentes/ModalConfirmacion'

function formatearFechaCeremonia(valor) {
  if (!valor) return 'Fecha a confirmar'

  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(String(valor))
    ? new Date(`${valor}T12:00:00`)
    : new Date(valor)

  if (Number.isNaN(fecha.getTime())) return 'Fecha a confirmar'

  return fecha.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function PanelGraduado({ graduadoSesion, onCerrarSesion, pestanaForzada }) {
  const { confirmar, dialogoConfirmacion } = useConfirmacion()
  const [graduado, setGraduado] = useState(graduadoSesion)
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [pestana, setPestana] = useState(pestanaForzada || 'juramento') // 'juramento' | 'invitados' | 'entregadores' | 'credencial'
  const [maxInvitados, setMaxInvitados] = useState(4)

  useEffect(() => {
    if (pestanaForzada) {
      setPestana(pestanaForzada)
    }
  }, [pestanaForzada])

  // Formulario de invitados
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [datosForm, setDatosForm] = useState({
    nombre: '', dni: '', telefono: '', correo: '', relacion: 'Acompañante', discapacidad: false
  })
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const [finalizandoInscripcion, setFinalizandoInscripcion] = useState(false)
  const [mostrarButacas, setMostrarButacas] = useState(false)

  // Entregadores
  const [profesores, setProfesores] = useState([])
  const [entregadores, setEntregadores] = useState([])
  const [mostrarSelectorEntregador, setMostrarSelectorEntregador] = useState(false)

  async function cargarDatos(mostrarSpinner = true) {
    try {
      if (mostrarSpinner) setCargando(true)
      const [resultadoInvitados, resultadoProfesores, resultadoEntregadores, resultadoGraduado] = await Promise.allSettled([
        obtenerInvitadosDeEgresado(graduadoSesion.id),
        obtenerProfesores(),
        obtenerEntregadoresDeGraduado(graduadoSesion.id),
        obtenerGraduadoPorId(graduadoSesion.id)
      ])

      if (resultadoInvitados.status === 'fulfilled') {
        setInvitados(resultadoInvitados.value)
      }
      if (resultadoProfesores.status === 'fulfilled') {
        setProfesores(resultadoProfesores.value)
      }
      if (resultadoEntregadores.status === 'fulfilled') {
        setEntregadores(resultadoEntregadores.value)
      }
      if (resultadoGraduado.status === 'fulfilled' && resultadoGraduado.value) {
        setGraduado(prev => ({ ...prev, ...resultadoGraduado.value }))
      }

      try {
        const config = await obtenerAjustes()
        if (config?.max_invitados_por_egresado) {
          setMaxInvitados(parseInt(config.max_invitados_por_egresado.valor, 10))
        }
      } catch {}
    } catch (err) {
      console.error('Error al cargar datos del panel:', err)
      if (mostrarSpinner) {
        setMensaje({ tipo: 'error', texto: 'No pudimos cargar tu grupo. Actualizá la página para volver a intentar.' })
      }
    } finally {
      if (mostrarSpinner) setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos(true)
  }, [graduadoSesion.id])

  // Escuchar cambios en vivo emitidos desde el administrador u otras pestañas
  useSincronizacion(['BUTACAS', 'EGRESADOS', 'INVITADOS', 'ENTREGADORES'], () => {
    cargarDatos(false)
  })

  // ─── Funciones de invitados ─────────────────────────────────

  function limpiarForm() {
    setDatosForm({ nombre: '', dni: '', telefono: '', correo: '', relacion: 'Acompañante', discapacidad: false })
    setEditandoId(null)
    setMostrarForm(false)
    setMensaje({ tipo: '', texto: '' })
  }

  function iniciarEdicion(inv) {
    setDatosForm({
      nombre: inv.nombre, dni: inv.dni, telefono: inv.telefono || '',
      correo: inv.correo || '', relacion: inv.relacion || 'Acompañante',
      discapacidad: inv.discapacidad === 1 || inv.discapacidad === true
    })
    setEditandoId(inv.id)
    setMostrarForm(true)
  }

  async function guardarInvitado(e) {
    e.preventDefault()
    if (datosForm.nombre.trim().length < 3) return setMensaje({ tipo: 'error', texto: 'El nombre debe tener al menos 3 caracteres.' })
    if (!/^\d{7,10}$/.test(datosForm.dni)) return setMensaje({ tipo: 'error', texto: 'El DNI debe ser numérico (7 a 10 dígitos).' })
    if (datosForm.telefono.trim() && datosForm.telefono.trim().length < 8) return setMensaje({ tipo: 'error', texto: 'Si cargás un contacto, ingresá un número válido.' })

    const existe = invitados.find(i => i.dni === datosForm.dni && i.id !== editandoId)
    if (existe) return setMensaje({ tipo: 'error', texto: 'Este DNI ya está registrado en tu lista.' })

    setProcesando(true)
    try {
      if (editandoId) {
        const actualizado = await actualizarInvitado(editandoId, datosForm)
        setInvitados(prev => prev.map(i => i.id === editandoId ? actualizado : i))
        setEntregadores(prev => prev.map(e => e.invitado_id === editandoId ? { ...e, nombre: actualizado.nombre } : e))
        setMensaje({ tipo: 'exito', texto: 'Acompañante actualizado correctamente.' })
        emitirCambioSync('INVITADOS', { egresadoId: graduadoSesion.id })
      } else {
        const [creado] = await cargarInvitados(null, [datosForm], graduadoSesion.id)
        setInvitados(prev => [...prev, creado])
        if (graduado.estado_asignacion_butacas === 'CONFIRMADA') {
          setGraduado(prev => ({ ...prev, estado_asignacion_butacas: 'PENDIENTE_REVISION' }))
          setMensaje({ tipo: 'info', texto: `${creado.nombre} agregado. Al cambiar tu grupo, podés asignarle una butaca para enviar la propuesta a administración.` })
        } else {
          setMensaje({ tipo: 'exito', texto: 'Acompañante añadido con éxito.' })
        }
        emitirCambioSync('INVITADOS', { egresadoId: graduadoSesion.id })
        emitirCambioSync('EGRESADOS', { egresadoId: graduadoSesion.id })
      }
      setTimeout(limpiarForm, 1000)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setProcesando(false)
    }
  }

  async function manejarEliminarInvitado(id) {
    const invitadoABorrar = invitados.find(i => i.id === id)
    const tieneButaca = Boolean(invitadoABorrar?.asiento_id || invitadoABorrar?.asiento_solicitado_id)
    const aviso = tieneButaca 
      ? `¿Estás seguro de eliminar a ${invitadoABorrar?.nombre}? Su butaca asignada quedará liberada.`
      : `¿Estás seguro de eliminar a ${invitadoABorrar?.nombre || 'este acompañante'}?`

    const confirmado = await confirmar({
      titulo: 'Eliminar acompañante',
      descripcion: aviso.replace(/^¿|\?$/g, ''),
      textoConfirmar: 'Eliminar',
      tipo: 'peligro',
    })
    if (!confirmado) return
    try {
      await eliminarInvitado(id)
      setInvitados(prev => prev.filter(i => i.id !== id))
      setEntregadores(prev => prev.filter(e => e.invitado_id !== id))
      if (graduado.estado_asignacion_butacas === 'CONFIRMADA' || tieneButaca) {
        setGraduado(prev => ({ ...prev, estado_asignacion_butacas: 'PENDIENTE_REVISION' }))
      }
      emitirCambioSync('INVITADOS', { egresadoId: graduadoSesion.id })
      emitirCambioSync('EGRESADOS', { egresadoId: graduadoSesion.id })
      emitirCambioSync('BUTACAS', { egresadoId: graduadoSesion.id })
      setMensaje({ tipo: 'exito', texto: `Acompañante eliminado${tieneButaca ? ' y su butaca fue liberada.' : '.'}` })
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al eliminar acompañante' })
    }
  }

  async function finalizarInscripcion() {
    setFinalizandoInscripcion(true)
    try {
      const resultado = await finalizarInscripcionGraduado(graduado.id)
      setGraduado(valor => ({ ...valor, ...resultado.graduado }))
      emitirCambioSync('EGRESADOS', { egresadoId: graduado.id })
      setMensaje({ tipo: 'exito', texto: resultado.mensaje })
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo finalizar la inscripción.' })
    } finally {
      setFinalizandoInscripcion(false)
    }
  }

  // ─── Funciones de entregadores ─────────────────────────────

  async function manejarAgregarEntregador(tipo, referencia) {
    setProcesando(true)
    try {
      const ordenLibre = [1, 2, 3].find(o => !entregadores.some(e => Number(e.orden) === Number(o))) || (entregadores.length + 1)
      const datos = {
        egresado_id: graduadoSesion.id,
        tipo: tipo,
        nombre: referencia.nombre,
        orden: ordenLibre
      }
      if (tipo === 'PROFESOR') datos.profesor_id = referencia.id
      if (tipo === 'FAMILIAR') datos.invitado_id = referencia.id

      const creado = await asignarEntregador(datos)
      setEntregadores(prev => [...prev, creado])
      setMostrarSelectorEntregador(false)
      emitirCambioSync('ENTREGADORES', { egresadoId: graduadoSesion.id })
      setMensaje({ tipo: 'exito', texto: `${referencia.nombre} agregado como padrino` })
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setProcesando(false)
    }
  }

  async function manejarEliminarEntregador(id) {
    const padrino = entregadores.find(entregador => entregador.id === id)
    const confirmado = await confirmar({
      titulo: 'Quitar padrino',
      descripcion: `Se quitará a ${padrino?.nombre || 'esta persona'} de la entrega del diploma.`,
      textoConfirmar: 'Quitar padrino',
      tipo: 'peligro',
    })
    if (!confirmado) return
    try {
      await eliminarEntregador(id)
      setEntregadores(prev => prev.filter(e => e.id !== id))
      emitirCambioSync('ENTREGADORES', { egresadoId: graduadoSesion.id })
    } catch (err) { alert(err.message) }
  }

  // ─── Info de estado del portal ─────────────────────────────

  const todosLosAsientos = [
    graduado.asiento_id || graduado.asiento_solicitado_id,
    graduado.entregador_asiento_id,
    ...invitados.map(i => i.asiento_id || i.asiento_solicitado_id)
  ].filter(Boolean)
  const perfilCompleto = Boolean(graduado.perfil_finalizado_en)
  const tieneJuramento = Boolean(graduado.formula_juramento)
  const tienePadrinos = entregadores.length > 0
  const cuposRestantes = Math.max(maxInvitados - invitados.length, 0)
  const fechaCeremonia = formatearFechaCeremonia(graduado.ceremonia_fecha)
  const lugarCeremonia = graduado.ceremonia_lugar || 'Sede Beltrán'
  const nombreCeremonia = graduado.ceremonia_nombre || 'Ceremonia de colación'

  const etapasPortal = [
    { etiqueta: 'Juramento', completada: tieneJuramento },
    { etiqueta: 'Acompañantes', completada: perfilCompleto },
    { etiqueta: 'Padrinos', completada: tienePadrinos },
    { etiqueta: 'Credencial', completada: perfilCompleto }
  ]
  const pasosCompletados = etapasPortal.filter(etapa => etapa.completada).length

  const accionSiguiente = !tieneJuramento
    ? {
        titulo: 'Elegí tu fórmula de juramento',
        detalle: 'Seleccioná la fórmula de juramento protocolar para el acto de colación.',
        etiqueta: 'Prestar juramento',
        accion: () => setPestana('juramento')
      }
    : !perfilCompleto
      ? {
          titulo: 'Confirmá tus acompañantes',
          detalle: 'Cargá los datos de tus invitados o confirmá tu asistencia individual.',
          etiqueta: 'Gestionar acompañantes',
          accion: () => { setPestana('invitados'); setMostrarForm(false); }
        }
      : !tienePadrinos
        ? {
            titulo: 'Elegí tus padrinos',
            detalle: 'Seleccioná hasta 3 profesores o familiares para la entrega de diploma.',
            etiqueta: 'Elegir padrinos',
            accion: () => setPestana('entregadores')
          }
        : {
            titulo: '¡Registro completado con éxito!',
            detalle: 'Tus datos quedaron confirmados. La institución asignará las butacas automáticamente. Ya podés ver y descargar tu credencial digital.',
            etiqueta: 'Ver credencial digital',
            accion: () => setPestana('credencial')
          }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <p className="text-xs font-semibold">Cargando tu panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16 font-sans">
      {/* Topbar Institucional */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-slate-200 bg-white p-1">
              <Image src="/logo.png" alt="Logo Beltrán" fill className="object-contain" sizes="36px" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">SiGIC · Instituto Beltrán</p>
              <h1 className="text-sm font-black text-slate-800">{nombreCeremonia}</h1>
            </div>
          </div>
          <button
            onClick={onCerrarSesion}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
          >
            <LogOut size={14} /> <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        {/* Banner de Bienvenida y Estado */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0c1e33] via-[#10243c] to-[#0a1829] p-6 text-white shadow-xl sm:p-8">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-sky-300 backdrop-blur-sm">
                <span>{nombreCeremonia}</span>
                <span className="h-1 w-1 rounded-full bg-sky-400" />
                <span className="text-white/80">{fechaCeremonia}</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Portal del Graduado</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl text-white">Hola, {graduado.nombre}</h1>
                <p className="mt-1 text-xs font-medium text-white/70">
                  Legajo {graduado.legajo} · {graduado.carrera || 'Tecnicatura Superior'} · DNI {graduado.dni}
                </p>
              </div>
            </div>

            {/* Próximo Paso Card */}
            <div className="w-full lg:max-w-md rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-300">Próximo paso</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black text-white">
                  {pasosCompletados} de 3 listos
                </span>
              </div>
              <h3 className="mt-2 text-sm font-black text-white">{accionSiguiente.titulo}</h3>
              <p className="mt-1 text-xs text-white/75 leading-relaxed">{accionSiguiente.detalle}</p>
              <button
                onClick={accionSiguiente.accion}
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-black text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 cursor-pointer"
              >
                {accionSiguiente.etiqueta}
              </button>
            </div>
          </div>

          {/* Progreso de 3 etapas */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="grid grid-cols-3 gap-2">
              {etapasPortal.map((etapa, idx) => (
                <div key={etapa.etiqueta} className="flex items-center gap-2">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-black ${etapa.completada ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'}`}>
                    {etapa.completada ? <Check size={12} strokeWidth={3} /> : idx + 1}
                  </span>
                  <span className={`text-xs font-bold truncate ${etapa.completada ? 'text-white' : 'text-white/60'}`}>
                    {etapa.etiqueta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mensajes de feedback */}
        {mensaje.texto && (
          <div className={`mt-4 flex items-center justify-between rounded-2xl p-4 text-xs font-bold ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : mensaje.tipo === 'info' ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
            <span>{mensaje.texto}</span>
            <button onClick={() => setMensaje({ tipo: '', texto: '' })} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">✕</button>
          </div>
        )}

        {/* Resumen Compacto de Ceremonia */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fecha</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <CalendarDays size={14} className="text-sky-500" /> {fechaCeremonia}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Lugar</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-700 truncate">
              <MapPin size={14} className="text-indigo-500" /> {lugarCeremonia}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Juramento</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-700 truncate">
              <ScrollText size={14} className="text-sky-500" />
              {FORMULAS_JURAMENTO[graduado?.formula_juramento]?.etiquetaCorta || 'Por la Patria'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Padrinos</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <GraduationCap size={14} className="text-purple-500" />
              {entregadores.length > 0 ? `${entregadores.length}/3 asignados` : 'Pendiente'}
            </p>
          </div>
        </section>

        {/* Pestañas de Navegación */}
        <nav className="mt-6 flex border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => { setPestana('juramento'); limpiarForm(); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black transition shrink-0 cursor-pointer ${pestana === 'juramento' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
          >
            <ScrollText size={16} /> Juramento ({FORMULAS_JURAMENTO[graduado?.formula_juramento]?.etiquetaCorta || 'Por la Patria'})
          </button>
          <button
            onClick={() => { setPestana('invitados'); limpiarForm(); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black transition shrink-0 cursor-pointer ${pestana === 'invitados' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
          >
            <Users size={16} /> Acompañantes ({invitados.length})
          </button>
          <button
            onClick={() => setPestana('entregadores')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black transition shrink-0 cursor-pointer ${pestana === 'entregadores' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
          >
            <GraduationCap size={16} /> Padrinos ({entregadores.length}/3)
          </button>
          <button
            onClick={() => setPestana('credencial')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black transition shrink-0 cursor-pointer ${pestana === 'credencial' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
          >
            <QrCode size={16} /> Credencial Digital
          </button>
        </nav>

        {/* Contenido de Pestañas */}
        <section className="mt-6">
          {pestana === 'juramento' && (
            <SeccionJuramento
              graduado={graduado}
              onActualizar={(nuevosDatos) => {
                setGraduado(prev => ({ ...prev, ...nuevosDatos }))
              }}
            />
          )}

          {pestana === 'invitados' && (
            mostrarForm ? (
              <div className="space-y-4">
                <button
                  onClick={limpiarForm}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Volver a acompañantes
                </button>
                <FormularioAcompanante
                  datosForm={datosForm}
                  setDatosForm={setDatosForm}
                  editandoId={editandoId}
                  procesando={procesando}
                  onSubmit={guardarInvitado}
                  onCancelar={limpiarForm}
                />
              </div>
            ) : (
              <ListaAcompanantes
                invitados={invitados}
                maxInvitados={maxInvitados}
                cuposRestantes={cuposRestantes}
                perfilCompleto={perfilCompleto}
                graduadoEstado={graduado.estado}
                finalizandoInscripcion={finalizandoInscripcion}
                onAgregar={() => { limpiarForm(); setMostrarForm(true); }}
                onEditar={iniciarEdicion}
                onEliminar={manejarEliminarInvitado}
                onFinalizar={finalizarInscripcion}
              />
            )
          )}

          {pestana === 'entregadores' && (
            <SeccionPadrinos
              entregadores={entregadores}
              profesores={profesores}
              invitados={invitados}
              procesando={procesando}
              mostrarSelector={mostrarSelectorEntregador}
              setMostrarSelector={setMostrarSelectorEntregador}
              onAgregar={manejarAgregarEntregador}
              onEliminar={manejarEliminarEntregador}
            />
          )}

          {pestana === 'credencial' && (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-lg">
                <ModalCredencial 
                  egresado={{ ...graduado, asientos: todosLosAsientos, invitados }} 
                  onCerrar={() => setPestana('invitados')} 
                />
              </div>
            </div>
          )}
        </section>
      </main>
      {dialogoConfirmacion}
    </div>
  )
}
