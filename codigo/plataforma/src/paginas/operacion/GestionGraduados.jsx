import { useState, useEffect } from 'react'
import { 
  Users, Search, Upload, Trash2, X, Link2, CreditCard,
  UserX, CheckCircle2, Clock, AlertCircle, Armchair, Send, PlusCircle, BadgeCheck, Edit3, MoreHorizontal,
  FileSpreadsheet, Download, ArrowRight, UserPlus, Sparkles
} from 'lucide-react'
import * as XLSX from 'xlsx'

import { 
  obtenerGraduados,
  eliminarGraduado,
  vaciarGraduados,
  obtenerInvitados, 
  corroborarGraduado, actualizarGraduado, buscarHistorialGraduados
} from '../../servicios/api'
import { useSincronizacion, emitirCambioSync } from '../../lib/sync'

import { ModalLinkRegistro } from '../../componentes/ModalLinkRegistro'
import { ModalCredencial } from '../../componentes/ModalCredencial'
import { FormularioGraduado } from '../../componentes/FormularioGraduado'
import { ModalImportar } from '../../componentes/ModalImportar'
import { ModalAsignarAsientos } from '../../componentes/ModalAsignarAsientos'
import { useConfirmacion } from '../../componentes/ModalConfirmacion'

const ESTADOS_FLUJO = {
  SIN_INVITAR:       { etiqueta: 'Sin invitar',        color: 'bg-slate-100 text-slate-600 border border-slate-200/50',   iconKey: 'SIN_INVITAR' },
  PENDIENTE:         { etiqueta: 'Esperando respuesta', color: 'bg-amber-50 text-amber-700 border border-amber-200/50',    iconKey: 'PENDIENTE' },
  CARGA_INCOMPLETA:  { etiqueta: 'Carga incompleta',   color: 'bg-orange-50 text-orange-700 border border-orange-200/50',  iconKey: 'CARGA_INCOMPLETA' },
  COMPLETO:          { etiqueta: 'Listo para asignar',  color: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50', iconKey: 'COMPLETO' },
  RECHAZADO:         { etiqueta: 'No aceptó',        color: 'bg-rose-50 text-rose-700 border border-rose-200/50',        iconKey: 'RECHAZADO' },
}

const DARK   = '#2A3448'

export function GestionGraduados({ usuario, ceremoniaActiva, onVolver, onCerrarSesion, sinHeader, onNavegar }) {
  const { confirmar, dialogoConfirmacion } = useConfirmacion()
  function obtenerIconoEstado(key, size = 12) {
    switch(key) {
      case 'SIN_INVITAR': return <Send size={size} />
      case 'PENDIENTE': return <Clock size={size} />
      case 'CARGA_INCOMPLETA': return <AlertCircle size={size} />
      case 'COMPLETO': return <CheckCircle2 size={size} />
      case 'RECHAZADO': return <UserX size={size} />
      default: return <Send size={size} />
    }
  }

  const [graduados, setGraduados] = useState([])
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const descargarPlantillaExcel = () => {
    const datosEjemplo = [
      { 'Nombre Completo': 'García Juan Manuel', 'DNI': '40123456', 'Legajo': 'LEG-2024-001', 'Correo': 'juan.garcia@gmail.com', 'Carrera': 'Desarrollo de Software', 'Año': 2024 },
      { 'Nombre Completo': 'Martínez Lucía Belén', 'DNI': '41234567', 'Legajo': 'LEG-2024-002', 'Correo': 'lucia.martinez@gmail.com', 'Carrera': 'Automatización y Robótica', 'Año': 2024 },
      { 'Nombre Completo': 'Rodríguez Matías', 'DNI': '39987654', 'Legajo': 'LEG-2024-003', 'Correo': 'matias.rodriguez@gmail.com', 'Carrera': 'Redes e Infraestructura', 'Año': 2024 },
    ]
    const ws = XLSX.utils.json_to_sheet(datosEjemplo)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Graduados')
    XLSX.writeFile(wb, 'Plantilla_Padron_SiGIC.xlsx')
  }

  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarImportar, setMostrarImportar] = useState(false)
  const [linkQR, setLinkQR] = useState(null)
  const [graduadoCredencial, setGraduadoCredencial] = useState(null)
  const [graduadoAsignar, setGraduadoAsignar] = useState(null)

  const [corroborandoId, setCorroborandoId] = useState(null)
  const [altaExitosa, setAltaExitosa] = useState('')
  const [graduadoEditar, setGraduadoEditar] = useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [historialGlobal, setHistorialGlobal] = useState([])
  const [buscandoHistorial, setBuscandoHistorial] = useState(false)
  const [ceremoniaMostrada, setCeremoniaMostrada] = useState(ceremoniaActiva || null)

  useEffect(() => {
    setCeremoniaMostrada(ceremoniaActiva || null)
    cargarDatos(ceremoniaActiva?.id)
  }, [ceremoniaActiva?.id])

  useEffect(() => {
    const actualizarEntorno = evento => {
      const ceremonia = evento.detail || null
      setCeremoniaMostrada(ceremonia)
      cargarDatos(ceremonia?.id)
    }
    window.addEventListener('sigic-ceremonia-cambiada', actualizarEntorno)
    return () => window.removeEventListener('sigic-ceremonia-cambiada', actualizarEntorno)
  }, [])

  useEffect(() => {
    const termino = busqueda.trim()
    if (termino.length < 2) {
      setHistorialGlobal([])
      setBuscandoHistorial(false)
      return undefined
    }

    let vigente = true
    const temporizador = window.setTimeout(async () => {
      setBuscandoHistorial(true)
      try {
        const resultado = await buscarHistorialGraduados(termino)
        if (vigente) setHistorialGlobal(Array.isArray(resultado) ? resultado : [])
      } catch {
        if (vigente) setHistorialGlobal([])
      } finally {
        if (vigente) setBuscandoHistorial(false)
      }
    }, 280)

    return () => {
      vigente = false
      window.clearTimeout(temporizador)
    }
  }, [busqueda])

  // Escuchar cambios en vivo emitidos desde el portal del graduado, otras pestañas u otros usuarios
  useSincronizacion(['BUTACAS', 'EGRESADOS', 'INVITADOS', 'CEREMONIAS'], () => {
    cargarDatos(undefined, false)
  })

  async function cargarDatos(ceremoniaId = ceremoniaMostrada?.id || ceremoniaActiva?.id, mostrarSpinner = true) {
    if (mostrarSpinner) setCargando(true)
    setError('')
    try {
      const [listaGrad, listaInv] = await Promise.all([
        obtenerGraduados(ceremoniaId),
        obtenerInvitados(ceremoniaId)
      ])
      setGraduados(listaGrad)
      const idsGraduados = new Set(listaGrad.map(graduado => String(graduado.id)))
      setInvitados(listaInv.filter(invitado => idsGraduados.has(String(invitado.egresadoId || invitado.egresado_id))))
    } catch {
      setError('Error de conexión al servidor')
    } finally {
      if (mostrarSpinner) setCargando(false)
    }
  }

  function manejarLink(grad) {
    const host = window.location.hostname.toLowerCase()
    const origen = host.includes('sigic-demo') || host === 'demo.sigic.com.ar'
      ? 'https://demo.sigic.com.ar'
      : host.endsWith('.sigic.com.ar')
        ? window.location.origin
        : 'https://app.sigic.com.ar'
    const url = `${origen}/?token=${grad.token}`
    setLinkQR({ egresado: grad, link: url })
  }

  async function manejarEliminar(id) {
    const graduado = graduados.find(item => item.id === id)
    const confirmado = await confirmar({
      titulo: 'Eliminar graduado',
      descripcion: `Se eliminará a ${graduado?.nombre || 'este graduado'} junto con sus acompañantes, padrinos y asignaciones.`,
      textoConfirmar: 'Eliminar graduado',
      tipo: 'peligro',
    })
    if (!confirmado) return
    try {
      await eliminarGraduado(id)
      emitirCambioSync('EGRESADOS', { id })
      emitirCambioSync('BUTACAS')
      cargarDatos(undefined, false)
    } catch (err) {
      alert(err.message)
    }
  }

  async function manejarVaciar() {
    const confirmado = await confirmar({
      titulo: 'Vaciar todo el padrón',
      descripcion: `Se eliminarán los ${graduados.length} graduados registrados y todos sus datos asociados. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Vaciar padrón',
      tipo: 'peligro',
    })
    if (!confirmado) return
    try {
      await vaciarGraduados()
      emitirCambioSync('EGRESADOS')
      emitirCambioSync('BUTACAS')
      cargarDatos(undefined, false)
    } catch (err) {
      alert(err.message)
    }
  }

  const graduadosFiltrados = graduados.filter(g => {
    const term = busqueda.toLowerCase().trim()
    const coincideBusqueda = !term || 
      g.nombre?.toLowerCase().includes(term) || 
      g.dni?.includes(term) || 
      g.legajo?.toLowerCase().includes(term)

    const coincideEstado = filtroEstado === 'TODOS' || g.estado_flujo === filtroEstado

    return coincideBusqueda && coincideEstado
  })

  const historialAgrupado = historialGlobal.reduce((grupos, registro) => {
    const clave = String(registro.dni || registro.correo || registro.nombre || registro.id).toLowerCase()
    const existente = grupos.find(grupo => grupo.clave === clave)
    if (existente) existente.participaciones.push(registro)
    else grupos.push({ clave, nombre: registro.nombre, dni: registro.dni, correo: registro.correo, participaciones: [registro] })
    return grupos
  }, [])

  const contadores = {
    TODOS: graduados.length,
    SIN_INVITAR: graduados.filter(g => g.estado_flujo === 'SIN_INVITAR').length,
    PENDIENTE: graduados.filter(g => g.estado_flujo === 'PENDIENTE').length,
    CARGA_INCOMPLETA: graduados.filter(g => g.estado_flujo === 'CARGA_INCOMPLETA').length,
    COMPLETO: graduados.filter(g => g.estado_flujo === 'COMPLETO').length,
    RECHAZADO: graduados.filter(g => g.estado_flujo === 'RECHAZADO').length,
  }
  const sinCorreo = graduados.filter(grad => !grad.correo && grad.estado_flujo !== 'RECHAZADO')
  const sinCorroborar = graduados.filter(grad => !grad.identidad_corrobada_en)

  const invitadosDe = (id) => invitados.filter(i => i.egresadoId === id || i.egresado_id === id)

  function abrirAsignacion(grad) {
    setGraduadoAsignar(grad)
  }

  async function manejarCorroboracion(grad) {
    setCorroborandoId(grad.id)
    try {
      const respuesta = await corroborarGraduado(grad.id)
      setGraduados(actuales => actuales.map(item => item.id === grad.id ? {
        ...item, identidad_corrobada_en: respuesta.graduado.identidad_corrobada_en
      } : item))
      emitirCambioSync('EGRESADOS', { id: grad.id })
    } catch (err) {
      alert(err.message)
    } finally {
      setCorroborandoId(null)
    }
  }

  async function guardarEdicion(datos) {
    const actualizado = await actualizarGraduado(graduadoEditar.id, datos)
    setGraduados(actuales => actuales.map(item => item.id === actualizado.id ? { ...item, ...actualizado } : item))
    setGraduadoEditar(null)
    setAltaExitosa(`Datos de ${actualizado.nombre} actualizados.`)
    emitirCambioSync('EGRESADOS', { id: actualizado.id })
    setTimeout(() => setAltaExitosa(''), 4000)
  }

  function siguientePaso(grad) {
    if (grad.estado_flujo === 'RECHAZADO' || grad.estado === 'RECHAZADO') return 'Participación rechazada'
    if (!grad.invitacion_enviada) return 'Enviar invitación'
    if (grad.estado !== 'ACEPTADO') return 'Esperar respuesta'
    if (grad.estado_asignacion_butacas === 'CONFIRMADA') return 'Butacas confirmadas'
    if (grad.estado_asignacion_butacas === 'PENDIENTE_REVISION') return 'Revisar propuesta de butacas'
    if (grad.estado_flujo === 'COMPLETO') return 'Asignar butacas'
    return 'Completar grupo'
  }

  return (
    <div className="font-sans">
      {/* CABECERA COMPACTA */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black tracking-tight text-slate-800">Padrón de Graduados</h2>
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {ceremoniaMostrada ? ceremoniaMostrada.nombre : 'Ceremonia activa'} · <strong className="text-slate-900">{graduados.length}</strong> alumnos {invitados.length > 0 ? `· ${invitados.length} acomp.` : ''}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-importar-excel"
            onClick={() => setMostrarImportar(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10.5px] font-black text-white shadow-xs hover:bg-emerald-500 transition active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet size={13} /> Importar Excel / CSV
          </button>

          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-2.5 py-1.5 text-[10.5px] font-black text-white shadow-xs hover:bg-sky-500 transition active:scale-95 cursor-pointer"
          >
            {mostrarForm ? <X size={13} /> : <UserPlus size={13} />} {mostrarForm ? 'Cerrar' : 'Nuevo Alumno'}
          </button>

          <button
            onClick={descargarPlantillaExcel}
            title="Descargar plantilla Excel modelo"
            className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2 py-1.5 text-[10px] font-bold text-slate-600 transition cursor-pointer"
          >
            <Download size={12} /> Plantilla
          </button>

          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50">
              <MoreHorizontal size={14} />
            </summary>
            <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
              <button onClick={descargarPlantillaExcel} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                <Download size={13} /> Descargar plantilla Excel
              </button>
              <button onClick={() => setMostrarImportar(true)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                <Upload size={13} /> Importar archivo
              </button>
              {graduados.length > 0 && (
                <button onClick={manejarVaciar} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer">
                  <Trash2 size={13} /> Vaciar padrón
                </button>
              )}
            </div>
          </details>
        </div>
      </div>

      {/* BANNER DE CONTINUIDAD AL PASO 3 (SOLO CON ALUMNOS) */}
      {graduados.length > 0 && onNavegar && (
        <div className="mb-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50 px-3 py-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-lg bg-sky-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              ✓
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-900 leading-tight">Padrón cargado ({graduados.length} alumnos registrados)</p>
              <p className="text-[9.5px] text-slate-500 font-medium">¿Listo para continuar? Despachá las invitaciones con tokens OTP por correo.</p>
            </div>
          </div>
          <button
            id="btn-paso3-convocatoria"
            onClick={() => onNavegar('convocatoria')}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1.5 text-[9.5px] font-black uppercase tracking-wider shadow-xs transition active:scale-95 cursor-pointer shrink-0"
          >
            Paso 3: Convocatoria <ArrowRight size={11} />
          </button>
        </div>
      )}

      {/* BUSCADOR Y FILTROS INTEGRADOS (SOLO CUANDO HAY ALUMNOS O SE BUSCA) */}
      {(graduados.length > 0 || busqueda.trim().length > 0) && (
        <div className="mb-2.5 space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                id="buscador-graduados"
                type="text"
                placeholder="Buscar en el padrón: nombre, DNI, legajo o correo..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-1 pl-8 pr-3 text-[11px] font-semibold focus:outline-none focus:border-sky-500 transition shadow-xs placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 shrink-0">
              <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100"><strong>{graduados.length - sinCorroborar.length}</strong> verif.</span>
              <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100"><strong>{contadores.COMPLETO}</strong> listos</span>
              {sinCorreo.length > 0 && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100"><strong>{sinCorreo.length}</strong> sin mail</span>}
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            {[
              { clave: 'TODOS', etiqueta: 'Todos', color: 'bg-slate-900 text-white' },
              { clave: 'SIN_INVITAR', etiqueta: 'Sin invitar', color: 'bg-slate-400 text-white' },
              { clave: 'PENDIENTE', etiqueta: 'Pendientes', color: 'bg-amber-500 text-white' },
              { clave: 'CARGA_INCOMPLETA', etiqueta: 'Incompletos', color: 'bg-orange-500 text-white' },
              { clave: 'COMPLETO', etiqueta: 'Completos', color: 'bg-emerald-500 text-white' },
              { clave: 'RECHAZADO', etiqueta: 'Rechazados', color: 'bg-rose-500 text-white' },
            ].map(f => (
              <button
                key={f.clave}
                onClick={() => setFiltroEstado(f.clave)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider transition-all ${
                  filtroEstado === f.clave 
                    ? f.color + ' shadow-xs' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {f.etiqueta} ({contadores[f.clave] || 0})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* HISTORIAL GLOBAL EN BUSCADOR */}
      {busqueda.trim().length >= 2 && (
        <section className="mb-2.5 overflow-hidden rounded-xl border border-sky-100 bg-sky-50/60">
          <div className="flex items-center justify-between gap-3 border-b border-sky-100 bg-white/80 px-3 py-2">
            <div>
              <p className="text-[9.5px] font-black uppercase tracking-wider text-sky-700">Historial institucional</p>
              <p className="mt-0.5 text-[9.5px] text-slate-500">Participaciones anteriores.</p>
            </div>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[8.5px] font-black text-sky-700">
              {buscandoHistorial ? 'Buscando...' : `${historialAgrupado.length} persona${historialAgrupado.length === 1 ? '' : 's'}`}
            </span>
          </div>
          {!buscandoHistorial && historialAgrupado.length > 0 && (
            <div className="divide-y divide-sky-100/80">
              {historialAgrupado.map(persona => (
                <div key={persona.clave} className="flex flex-col gap-1.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-slate-800">{persona.nombre}</p>
                    <p className="text-[9.5px] font-medium text-slate-500">{persona.dni ? `DNI ${persona.dni}` : persona.correo || 'Sin identificador'}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {persona.participaciones.map(participacion => (
                      <span key={participacion.id} className={`rounded px-1.5 py-0.5 text-[8.5px] font-bold ${participacion.ceremonia_activa ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
                        {participacion.ceremonia_nombre || 'Ceremonia'}{participacion.ceremonia_fecha ? ` · ${new Date(`${participacion.ceremonia_fecha}T12:00:00`).toLocaleDateString('es-AR')}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!buscandoHistorial && historialAgrupado.length === 0 && <p className="px-3 py-2 text-[10px] font-medium text-slate-500">No hay participaciones históricas para esta búsqueda.</p>}
        </section>
      )}

      {/* FORMULARIO DE ALTA */}
      {mostrarForm && (
        <FormularioGraduado
          enModal
          onCreado={(nuevo) => {
            setMostrarForm(false)
            setAltaExitosa(`${nuevo.nombre} fue registrado correctamente en la ceremonia activa.`)
            cargarDatos()
            setTimeout(() => setAltaExitosa(''), 6000)
          }}
          onCancelar={() => setMostrarForm(false)}
        />
      )}

      {altaExitosa && (
        <div role="status" aria-live="polite" className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-emerald-800 shadow-xs">
          <CheckCircle2 size={15} className="shrink-0" />
          <p className="text-xs font-bold">{altaExitosa}</p>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-3.5 py-2 rounded-xl text-xs mb-3 font-bold">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* LISTA O EMPTY STATE GUIADO */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-12 select-none">
          <div className="relative w-10 h-10 flex items-center justify-center mb-3">
            <div className="absolute inset-0 rounded-full border-2 border-t-[#0ea5e9] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
            <div className="absolute inset-1 rounded-full border-2 border-b-indigo-500 border-t-transparent border-r-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
            <img 
              src="/logo-oficial.png" 
              alt="SiGIC" 
              className="h-5 w-auto object-contain animate-pulse z-10" 
            />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Cargando padrón...</p>
        </div>
      ) : graduadosFiltrados.length === 0 ? (
        graduados.length === 0 && !busqueda.trim() ? (
          /* EMPTY STATE GUIADO ONBOARDING ULTRA-COMPACTO */
          <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 animate-in fade-in duration-200">
            <div className="text-center max-w-md mx-auto space-y-1">
              <div className="inline-flex p-2 rounded-xl bg-emerald-50 text-emerald-600 mb-0.5">
                <Users size={22} />
              </div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">El padrón de graduados está vacío</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Cargá a los estudiantes de la colación para comenzar:
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {/* OPCIÓN 1: EXCEL */}
              <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-50/40 p-3.5 flex flex-col justify-between space-y-2.5 hover:border-emerald-500 transition">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="p-1.5 rounded-lg bg-emerald-500 text-white inline-block shadow-xs">
                      <FileSpreadsheet size={15} />
                    </span>
                    <span className="text-[8.5px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Recomendado</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900">Carga Masiva con Excel (.xlsx / .csv)</h4>
                  <p className="text-[10px] text-slate-600 font-medium leading-normal">
                    Importá el padrón con DNI, legajo, correo y carrera en 1 segundo.
                  </p>
                </div>
                
                <div className="space-y-1 pt-1">
                  <button
                    onClick={() => setMostrarImportar(true)}
                    className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-black text-[10.5px] uppercase tracking-wider shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Upload size={13} /> Subir Archivo Excel
                  </button>
                  <button
                    onClick={descargarPlantillaExcel}
                    className="w-full flex items-center justify-center gap-1 text-[9.5px] font-bold text-emerald-700 hover:text-emerald-800 py-0.5 transition cursor-pointer"
                  >
                    <Download size={11} /> Descargar plantilla de ejemplo (.xlsx)
                  </button>
                </div>
              </div>

              {/* OPCIÓN 2: MANUAL */}
              <div className="rounded-xl border-2 border-slate-200 bg-slate-50/50 p-3.5 flex flex-col justify-between space-y-2.5 hover:border-sky-400 transition">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="p-1.5 rounded-lg bg-sky-500 text-white inline-block shadow-xs">
                      <UserPlus size={15} />
                    </span>
                    <span className="text-[8.5px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">Manual</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900">Carga Individual</h4>
                  <p className="text-[10px] text-slate-600 font-medium leading-normal">
                    Registrá un estudiante completando el formulario de alta.
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => setMostrarForm(true)}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg font-black text-[10.5px] uppercase tracking-wider shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <UserPlus size={13} /> Cargar Alumno Manualmente
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center bg-white border border-slate-100 rounded-xl">
            <Users size={28} className="mx-auto mb-2 text-slate-200" />
            <h3 className="text-xs font-black text-slate-400 mb-0.5">Sin coincidencias</h3>
            <p className="text-[11px] text-slate-400">No se encontraron estudiantes en esta selección.</p>
          </div>
        )
      ) : (
        <div className="space-y-2">
          {graduadosFiltrados.map(grad => {
            const estadoConfig = ESTADOS_FLUJO[grad.estado_flujo] || ESTADOS_FLUJO.SIN_INVITAR
            const misInvitados = invitadosDe(grad.id)
            const esRechazado = grad.estado_flujo === 'RECHAZADO'

            return (
              <div
                key={grad.id}
                className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-sm ${
                  esRechazado ? 'border-red-150 opacity-70 bg-red-50/10' : 'border-slate-100'
                }`}
              >
                <div className="p-3">
                  <div className="flex items-start gap-2.5">
                    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black text-white ${esRechazado ? 'bg-rose-400' : 'bg-sky-500'}`}>
                      {grad.nombre?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-xs font-black text-slate-800">{grad.nombre}</h4>
                        <span className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[7.5px] font-black uppercase ${estadoConfig.color}`}>
                          {obtenerIconoEstado(estadoConfig.iconKey, 8)}{estadoConfig.etiqueta}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[9.5px] text-slate-400">DNI {grad.dni} · {grad.legajo || 'Sin legajo'} · {grad.correo || 'Sin correo'}</p>
                    </div>
                    {!esRechazado && <span className="hidden text-[8.5px] font-bold text-slate-400 sm:block">{siguientePaso(grad)}</span>}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2">
                    <button onClick={() => setGraduadoEditar(grad)} className="rounded-md bg-slate-900 px-2.5 py-1 text-[8.5px] font-bold text-white cursor-pointer hover:bg-slate-800 transition"><Edit3 size={11} className="mr-1 inline" />Editar</button>
                    {!esRechazado && grad.estado === 'ACEPTADO' && <button onClick={() => abrirAsignacion(grad)} className="rounded-md bg-slate-900 px-2.5 py-1 text-[8.5px] font-bold text-white cursor-pointer hover:bg-slate-800 transition"><Armchair size={11} className="mr-1 inline" />Butacas</button>}
                    {misInvitados.length > 0 && <span className="text-[8.5px] font-semibold text-slate-400">{misInvitados.length} acomp.</span>}
                    <details className="relative ml-auto">
                      <summary className="grid h-6 w-7 cursor-pointer list-none place-items-center rounded text-slate-400 hover:bg-slate-100"><MoreHorizontal size={13} /></summary>
                      <div className="absolute bottom-7 right-0 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                        {!esRechazado && !grad.identidad_corrobada_en && <button onClick={() => manejarCorroboracion(grad)} disabled={corroborandoId === grad.id} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 cursor-pointer"><BadgeCheck size={12} /> Verificar datos</button>}
                        {!esRechazado && <button onClick={() => manejarLink(grad)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"><Link2 size={12} /> Enlace</button>}
                        {!esRechazado && <button onClick={() => setGraduadoCredencial(grad)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"><CreditCard size={12} /> Ver credencial</button>}
                        <button onClick={() => manejarEliminar(grad.id)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"><Trash2 size={12} /> Eliminar</button>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CONTADOR */}
      {!cargando && graduados.length > 0 && (
        <p className="text-center text-[9px] text-slate-400 mt-4 font-bold uppercase tracking-wider">
          Mostrando {graduadosFiltrados.length} de {graduados.length} estudiantes
        </p>
      )}

      {/* MODALES */}
      {graduadoCredencial && <ModalCredencial egresado={graduadoCredencial} onCerrar={() => setGraduadoCredencial(null)} />}
      {linkQR && <ModalLinkRegistro egresado={linkQR.egresado} link={linkQR.link} onCerrar={() => setLinkQR(null)} />}
      {mostrarImportar && (
        <ModalImportar 
          onCerrar={() => setMostrarImportar(false)} 
          graduadosExistentes={graduados}
          onActualizarPadron={() => {
            cargarDatos()
            emitirCambioSync('EGRESADOS')
          }}
          onCompletado={() => {
            setMostrarImportar(false)
            cargarDatos()
            emitirCambioSync('EGRESADOS')
          }} 
        />
      )}
      {graduadoAsignar && (
        <ModalAsignarAsientos
          graduado={graduadoAsignar}
          invitados={invitadosDe(graduadoAsignar.id)}
          ceremoniaId={graduadoAsignar.ceremonia_id}
          todosLosGraduados={graduados}
          todosLosInvitados={invitados}
          onCerrar={() => setGraduadoAsignar(null)}
          onAsignado={async () => {
            setGraduadoAsignar(null)
            await cargarDatos()
          }}
        />
      )}
      {graduadoEditar && <ModalEditarGraduado graduado={graduadoEditar} onCerrar={() => setGraduadoEditar(null)} onGuardar={guardarEdicion} />}
      {dialogoConfirmacion}
    </div>
  )
}

function ModalEditarGraduado({ graduado, onCerrar, onGuardar }) {
  const [form, setForm] = useState({ nombre: graduado.nombre || '', dni: graduado.dni || '', legajo: graduado.legajo || '', correo: graduado.correo || '', carrera: graduado.carrera || '', promedio: graduado.promedio || '' })
  const [guardando, setGuardando] = useState(false)
  async function enviar(evento) { evento.preventDefault(); setGuardando(true); try { await onGuardar(form) } catch (error) { alert(error.message) } finally { setGuardando(false) } }
  const campo = (clave, etiqueta, tipo = 'text') => <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500"><span>{etiqueta}</span><input type={tipo} value={form[clave]} onChange={e => setForm(actual => ({ ...actual, [clave]: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-sky-400" /></label>
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"><form onSubmit={enviar} className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-sky-600">Edición administrativa</p><h3 className="mt-1 text-lg font-black text-slate-900">Actualizar graduado</h3></div><button type="button" onClick={onCerrar} className="text-slate-400 hover:text-slate-900"><X size={20} /></button></div><div className="grid gap-3 sm:grid-cols-2">{campo('nombre', 'Nombre completo')}{campo('dni', 'DNI', 'text')}{campo('legajo', 'Legajo')}{campo('correo', 'Correo', 'email')}{campo('carrera', 'Carrera')}{campo('promedio', 'Promedio', 'number')}</div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCerrar} className="px-4 py-2 text-xs font-bold text-slate-500">Cancelar</button><button disabled={guardando} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-black text-white disabled:opacity-50">{guardando ? 'Guardando...' : 'Guardar cambios'}</button></div></form></div>
}
