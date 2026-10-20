import { origenPortalGraduados } from '../../lib/graduate-origin'
import { useState, useEffect } from 'react'
import { 
  Users, Search, Upload, Trash2, X, Link2, CreditCard,
  UserX, CheckCircle2, Clock, AlertCircle, Armchair, Send, PlusCircle, BadgeCheck, Edit3, MoreHorizontal,
  FileSpreadsheet, Download, ArrowRight, UserPlus, Sparkles, Award, LayoutGrid, List, Mail, Check,
  GraduationCap, Phone, Calendar
} from 'lucide-react'
import * as XLSX from 'xlsx'

import { 
  obtenerGraduados,
  eliminarGraduado,
  vaciarGraduados,
  obtenerInvitados, 
  corroborarGraduado, actualizarGraduado, buscarHistorialGraduados,
  obtenerCarreras
} from '../../servicios/api'
import { useSincronizacion, emitirCambioSync } from '../../lib/sync'

import { ModalLinkRegistro } from '../../componentes/ModalLinkRegistro'
import { ModalCredencial } from '../../componentes/ModalCredencial'
import { FormularioGraduado } from '../../componentes/FormularioGraduado'
import { ModalImportar } from '../../componentes/ModalImportar'
import { ModalAsignarAsientos } from '../../componentes/ModalAsignarAsientos'
import { useConfirmacion } from '../../componentes/ModalConfirmacion'
import { InputCampo } from '../../componentes/InputCampo'

const ESTADOS_FLUJO = {
  SIN_INVITAR:       { etiqueta: 'Sin invitar',        color: 'bg-slate-100 text-slate-700 border border-slate-200',   iconKey: 'SIN_INVITAR' },
  PENDIENTE:         { etiqueta: 'Esperando respuesta', color: 'bg-amber-50 text-amber-800 border border-amber-200',    iconKey: 'PENDIENTE' },
  CARGA_INCOMPLETA:  { etiqueta: 'Carga incompleta',   color: 'bg-orange-50 text-orange-800 border border-orange-200',  iconKey: 'CARGA_INCOMPLETA' },
  COMPLETO:          { etiqueta: 'Listo para asignar',  color: 'bg-emerald-50 text-emerald-800 border border-emerald-200', iconKey: 'COMPLETO' },
  RECHAZADO:         { etiqueta: 'No aceptó',        color: 'bg-rose-50 text-rose-800 border border-rose-200',        iconKey: 'RECHAZADO' },
}

const DARK   = '#2A3448'

export function GestionGraduados({ 
  usuario, 
  ceremoniaActiva, 
  onVolver, 
  onCerrarSesion, 
  sinHeader, 
  onNavegar,
  formato = 'dashboard'
}) {
  const { confirmar, dialogoConfirmacion } = useConfirmacion()
  const [modoVista, setModoVista] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sigic_vista_graduados') || 'tarjetas'
    }
    return 'tarjetas'
  })

  function cambiarModoVista(nuevoModo) {
    setModoVista(nuevoModo)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sigic_vista_graduados', nuevoModo)
    }
  }

  function obtenerIconoEstado(key, size = 13) {
    switch(key) {
      case 'SIN_INVITAR': return <Send size={size} />
      case 'PENDIENTE': return <Clock size={size} />
      case 'CARGA_INCOMPLETA': return <AlertCircle size={size} />
      case 'COMPLETO': return <CheckCircle2 size={size} />
      case 'RECHAZADO': return <UserX size={size} />
      default: return <Send size={size} />
    }
  }

  const [pestanaPadron, setPestanaPadron] = useState('ceremonia') // 'ceremonia' | 'general'
  const [padronGeneral, setPadronGeneral] = useState([])
  const [cargandoPadronGeneral, setCargandoPadronGeneral] = useState(false)
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
    cargarPadronGeneral()
  }, [ceremoniaActiva?.id])

  useEffect(() => {
    const actualizarEntorno = evento => {
      const ceremonia = evento.detail || null
      setCeremoniaMostrada(ceremonia)
      cargarDatos(ceremonia?.id)
      cargarPadronGeneral()
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
    cargarPadronGeneral()
  })

  async function cargarPadronGeneral() {
    setCargandoPadronGeneral(true)
    try {
      const listaGlobal = await obtenerGraduados('todas')
      if (Array.isArray(listaGlobal)) {
        setPadronGeneral(listaGlobal)
      }
    } catch (e) {
      console.warn('No se pudo cargar el padrón general histórico:', e)
    } finally {
      setCargandoPadronGeneral(false)
    }
  }

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
    const url = `${origenPortalGraduados()}/?token=${grad.token}`
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

  const dnisEnCeremoniaActiva = new Set(graduados.map(g => String(g.dni || '').replace(/\D/g, '')).filter(Boolean))

  const padronGeneralFiltrado = padronGeneral.filter(g => {
    const term = busqueda.toLowerCase().trim()
    if (!term) return true
    return (
      g.nombre?.toLowerCase().includes(term) ||
      g.dni?.includes(term) ||
      g.legajo?.toLowerCase().includes(term) ||
      g.correo?.toLowerCase().includes(term) ||
      g.carrera?.toLowerCase().includes(term) ||
      g.ceremoniaNombre?.toLowerCase().includes(term)
    )
  })

  const graduadosFiltrados = graduados.filter(g => {
    const term = busqueda.toLowerCase().trim()
    const coincideBusqueda = !term || 
      g.nombre?.toLowerCase().includes(term) || 
      g.dni?.includes(term) || 
      g.legajo?.toLowerCase().includes(term) ||
      g.correo?.toLowerCase().includes(term) ||
      g.carrera?.toLowerCase().includes(term)

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
    setAltaExitosa(`Datos de ${actualizado.nombre} actualizados correctamente.`)
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

  const esEscritorio = formato === 'escritorio'

  return (
    <div className={`font-sans space-y-4 ${esEscritorio ? 'sigic-formato-escritorio text-sm' : ''}`}>
      {/* CABECERA Y TOOLBAR PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {!sinHeader && (
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Padrón de Graduados
              </h2>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 border border-sky-200/80 px-2.5 py-1 text-xs font-bold text-sky-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {ceremoniaMostrada ? ceremoniaMostrada.nombre : 'Ceremonia activa'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
              <strong className="text-slate-900">{graduados.length}</strong> alumnos {invitados.length > 0 ? `· ${invitados.length} acomp.` : ''}
            </span>
          </div>
          {sinHeader && (
            <p className="text-xs text-slate-500 font-medium mt-1">
              Nómina oficial de graduados y gestión de acompañantes para la ceremonia activa.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Selector de Vista: Tarjetas vs Lista */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/90 p-0.5">
            <button
              type="button"
              onClick={() => cambiarModoVista('tarjetas')}
              className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
                modoVista === 'tarjetas' 
                  ? 'bg-white text-slate-900 shadow-xs font-bold' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Vista en cuadrícula (Tarjetas)"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => cambiarModoVista('lista')}
              className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
                modoVista === 'lista' 
                  ? 'bg-white text-slate-900 shadow-xs font-bold' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Vista en tabla (Lista detallada)"
            >
              <List size={15} />
            </button>
          </div>

          <button
            id="btn-importar-excel"
            onClick={() => setMostrarImportar(true)}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-2.5 sm:px-3.5 py-2 text-xs font-black text-white shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span className="hidden sm:inline">Importar Excel / CSV</span>
            <span className="sm:hidden">Importar</span>
          </button>

          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-2.5 sm:px-3.5 py-2 text-xs font-black text-white shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            {mostrarForm ? <X size={15} /> : <UserPlus size={15} />}
            <span>{mostrarForm ? 'Cerrar' : 'Nuevo Alumno'}</span>
          </button>

          <button
            onClick={descargarPlantillaExcel}
            title="Descargar plantilla Excel modelo (.xlsx)"
            className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            <span>Plantilla</span>
          </button>

          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">
              <MoreHorizontal size={16} />
            </summary>
            <div className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <button onClick={descargarPlantillaExcel} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                <Download size={14} className="text-slate-500" /> Descargar plantilla Excel
              </button>
              <button onClick={() => setMostrarImportar(true)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                <Upload size={14} className="text-slate-500" /> Importar archivo
              </button>
              {graduados.length > 0 && (
                <button onClick={manejarVaciar} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer border-t border-slate-100 mt-1 pt-1.5">
                  <Trash2 size={14} /> Vaciar padrón completo
                </button>
              )}
            </div>
          </details>
        </div>
      </div>

      {/* SELECTOR DE PESTAÑA: CEREMONIA ACTIVA VS PADRÓN GENERAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button
            onClick={() => setPestanaPadron('ceremonia')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              pestanaPadron === 'ceremonia'
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap size={15} />
            <span>Ceremonia en Curso</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              pestanaPadron === 'ceremonia' ? 'bg-sky-400 text-slate-950' : 'bg-slate-100 text-slate-700'
            }`}>
              {graduados.length}
            </span>
          </button>

          <button
            onClick={() => setPestanaPadron('general')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              pestanaPadron === 'general'
                ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>Padrón General</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              pestanaPadron === 'general' ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-700'
            }`}>
              {padronGeneral.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
          {pestanaPadron === 'ceremonia' ? (
            <span>Nómina exclusiva de: <strong className="text-sky-700">{ceremoniaMostrada?.nombre || 'Ceremonia activa'}</strong></span>
          ) : (
            <span>Histórico consolidado de todas las ceremonias para verificación cruzada</span>
          )}
        </div>
      </div>

      {/* BANNER DE CONTINUIDAD AL PASO 3 (SOLO CON ALUMNOS) */}
      {graduados.length > 0 && onNavegar && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-blue-50/70 to-indigo-50/50 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 leading-tight">
                Padrón cargado ({graduados.length} alumnos registrados)
              </p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                ¿Listo para continuar? Despachá las invitaciones con tokens OTP por correo institucional.
              </p>
            </div>
          </div>
          <button
            id="btn-paso3-convocatoria"
            onClick={() => onNavegar('convocatoria')}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider shadow-xs transition active:scale-95 cursor-pointer shrink-0"
          >
            <span>Paso 3: Convocatoria</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* BUSCADOR Y FILTROS INTEGRADOS */}
      {(graduados.length > 0 || busqueda.trim().length > 0) && (
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="buscador-graduados"
                type="text"
                placeholder="Buscar en el padrón por nombre, DNI, legajo o correo..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/10 transition shadow-xs placeholder-slate-400"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 shrink-0 flex-wrap">
              <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/60">
                <strong className="text-slate-900">{graduados.length - sinCorroborar.length}</strong> verificados
              </span>
              <span className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200/60">
                <strong className="text-emerald-950">{contadores.COMPLETO}</strong> listos
              </span>
              {sinCorreo.length > 0 && (
                <span className="bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200/60">
                  <strong className="text-amber-950">{sinCorreo.length}</strong> sin mail
                </span>
              )}
            </div>
          </div>

          {/* Filtros por estado */}
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {[
              { clave: 'TODOS', etiqueta: 'Todos', color: 'bg-slate-900 text-white' },
              { clave: 'SIN_INVITAR', etiqueta: 'Sin invitar', color: 'bg-slate-500 text-white' },
              { clave: 'PENDIENTE', etiqueta: 'Esperando respuesta', color: 'bg-amber-500 text-white' },
              { clave: 'CARGA_INCOMPLETA', etiqueta: 'Carga incompleta', color: 'bg-orange-500 text-white' },
              { clave: 'COMPLETO', etiqueta: 'Listos para asignar', color: 'bg-emerald-600 text-white' },
              { clave: 'RECHAZADO', etiqueta: 'Rechazados', color: 'bg-rose-500 text-white' },
            ].map(f => (
              <button
                key={f.clave}
                onClick={() => setFiltroEstado(f.clave)}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  filtroEstado === f.clave 
                    ? f.color + ' shadow-xs ring-2 ring-slate-900/10' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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
        <section className="overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/60">
          <div className="flex items-center justify-between gap-3 border-b border-sky-100 bg-white/80 px-4 py-2.5">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-sky-700">Historial institucional</p>
              <p className="text-xs text-slate-500">Participaciones anteriores en otras ceremonias.</p>
            </div>
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-black text-sky-700">
              {buscandoHistorial ? 'Buscando...' : `${historialAgrupado.length} persona${historialAgrupado.length === 1 ? '' : 's'}`}
            </span>
          </div>
          {!buscandoHistorial && historialAgrupado.length > 0 && (
            <div className="divide-y divide-sky-100/80">
              {historialAgrupado.map(persona => (
                <div key={persona.clave} className="flex flex-col gap-1.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-800">{persona.nombre}</p>
                    <p className="text-xs font-medium text-slate-500">{persona.dni ? `DNI ${persona.dni}` : persona.correo || 'Sin identificador'}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {persona.participaciones.map(participacion => (
                      <span key={participacion.id} className={`rounded-lg px-2 py-1 text-xs font-bold ${participacion.ceremonia_activa ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
                        {participacion.ceremonia_nombre || 'Ceremonia'}{participacion.ceremonia_fecha ? ` · ${new Date(`${participacion.ceremonia_fecha}T12:00:00`).toLocaleDateString('es-AR')}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!buscandoHistorial && historialAgrupado.length === 0 && (
            <p className="px-4 py-3 text-xs font-medium text-slate-500">No hay participaciones históricas para esta búsqueda.</p>
          )}
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
        <div role="status" aria-live="polite" className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-xs">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <p className="text-xs font-bold">{altaExitosa}</p>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-bold">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* LISTA O EMPTY STATE GUIADO DE LA CEREMONIA ACTIVA */}
      {pestanaPadron === 'ceremonia' && (
        cargando ? (
          <div className="flex flex-col items-center justify-center py-16 select-none">
            <div className="relative w-12 h-12 flex items-center justify-center mb-3">
              <div className="absolute inset-0 rounded-full border-2 border-t-[#0ea5e9] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
              <div className="absolute inset-1 rounded-full border-2 border-b-indigo-500 border-t-transparent border-r-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
              <img 
                src="/logo-oficial.png" 
                alt="SiGIC" 
                className="h-6 w-auto object-contain animate-pulse z-10" 
              />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Cargando padrón...</p>
          </div>
        ) : graduadosFiltrados.length === 0 ? (
          graduados.length === 0 && !busqueda.trim() ? (
            /* EMPTY STATE GUIADO ONBOARDING */
          <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-6 sm:p-8 text-center space-y-6 animate-in fade-in duration-200">
            <div className="max-w-md mx-auto space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-1">
                <Users size={28} />
              </div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">El padrón de graduados está vacío</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                Cargá a los estudiantes de la colación para comenzar el flujo de acreditación e invitaciones:
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              {/* OPCIÓN 1: EXCEL */}
              <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/30 p-5 flex flex-col justify-between space-y-3 hover:border-emerald-500 transition">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-emerald-500 text-white inline-block shadow-xs">
                      <FileSpreadsheet size={18} />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">Recomendado</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Carga Masiva con Excel (.xlsx / .csv)</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Importá la nómina completa con DNI, legajo, correo y carrera en un solo paso.
                  </p>
                </div>
                
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setMostrarImportar(true)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Upload size={14} /> Subir Archivo Excel
                  </button>
                  <button
                    onClick={descargarPlantillaExcel}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 py-1 transition cursor-pointer"
                  >
                    <Download size={13} /> Descargar plantilla modelo (.xlsx)
                  </button>
                </div>
              </div>

              {/* OPCIÓN 2: MANUAL */}
              <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 flex flex-col justify-between space-y-3 hover:border-sky-400 transition">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-sky-500 text-white inline-block shadow-xs">
                      <UserPlus size={18} />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">Manual</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Carga Individual</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Registrá a un estudiante de forma individual completando el formulario.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setMostrarForm(true)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <UserPlus size={14} /> Cargar Alumno Manualmente
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center bg-white border border-slate-200/80 rounded-2xl">
            <Users size={36} className="mx-auto mb-2.5 text-slate-300" />
            <h3 className="text-sm font-black text-slate-700 mb-1">Sin coincidencias para esta búsqueda</h3>
            <p className="text-xs text-slate-400">Probá con otro término o limpiá los filtros activos.</p>
          </div>
        )
      ) : modoVista === 'tarjetas' ? (
        /* VISTA DE CUADRÍCULA (TARJETAS) */
        <div className={`grid grid-cols-1 ${esEscritorio ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'} gap-4`}>
          {graduadosFiltrados.map(grad => {
            const estadoConfig = ESTADOS_FLUJO[grad.estado_flujo] || ESTADOS_FLUJO.SIN_INVITAR
            const misInvitados = invitadosDe(grad.id)
            const esRechazado = grad.estado_flujo === 'RECHAZADO'

            return (
              <div
                key={grad.id}
                className={`bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-md relative group ${
                  esRechazado 
                    ? 'border-rose-200 bg-rose-50/15 opacity-80' 
                    : 'border-slate-200/90 hover:border-sky-300'
                }`}
              >
                <div>
                  {/* Cabecera de la tarjeta: Avatar + Nombre + Estado */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-11 w-11 rounded-2xl grid place-items-center text-sm font-black text-white shrink-0 shadow-xs ${
                        esRechazado ? 'bg-rose-500' : 'bg-gradient-to-tr from-sky-500 to-indigo-600'
                      }`}>
                        {grad.nombre?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-sky-600 transition" title={grad.nombre}>
                          {grad.nombre}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5 font-medium">
                          DNI {grad.dni} {grad.legajo ? `· Leg. ${grad.legajo}` : ''}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shrink-0 ${estadoConfig.color}`}>
                      {obtenerIconoEstado(estadoConfig.iconKey, 11)}
                      {estadoConfig.etiqueta}
                    </span>
                  </div>

                  {/* Detalles: Carrera y Correo */}
                  <div className="space-y-1.5 py-2 border-t border-slate-100 text-xs text-slate-600">
                    {grad.carrera && (
                      <div className="flex items-center gap-2 truncate">
                        <Award size={13} className="text-sky-500 shrink-0" />
                        <span className="truncate font-semibold text-slate-700">{grad.carrera}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className={`truncate font-mono ${grad.correo ? 'text-slate-600' : 'text-amber-600 font-bold'}`}>
                        {grad.correo || 'Sin correo registrado'}
                      </span>
                    </div>
                  </div>

                  {/* Flujo y Acompañantes */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Siguiente:</span>
                      <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[11px]">
                        {siguientePaso(grad)}
                      </span>
                    </div>

                    {misInvitados.length > 0 && (
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-xs">
                        <Users size={13} className="text-slate-400" />
                        <span>{misInvitados.length} acomp.</span>
                        {misInvitados.some(i => i.es_padrino || i.esPadrino) && (
                          <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider inline-flex items-center gap-1" title="Incluye padrino designado">
                            <Award size={10} /> Padrino
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de acción inferiores */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setGraduadoEditar(grad)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                    >
                      <Edit3 size={12} />
                      <span>Editar</span>
                    </button>

                    {!esRechazado && grad.estado === 'ACEPTADO' && (
                      <button
                        onClick={() => abrirAsignacion(grad)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                      >
                        <Armchair size={12} />
                        <span>Butacas</span>
                      </button>
                    )}
                  </div>

                  {/* Menú de acciones secundarias */}
                  <details className="relative">
                    <summary className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                      <MoreHorizontal size={16} />
                    </summary>
                    <div className="absolute bottom-9 right-0 z-20 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      {!esRechazado && !grad.identidad_corrobada_en && (
                        <button
                          onClick={() => manejarCorroboracion(grad)}
                          disabled={corroborandoId === grad.id}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 cursor-pointer"
                        >
                          <BadgeCheck size={14} /> Verificar datos
                        </button>
                      )}
                      {!esRechazado && (
                        <button
                          onClick={() => manejarLink(grad)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Link2 size={14} /> Enlace de acceso
                        </button>
                      )}
                      {!esRechazado && (
                        <button
                          onClick={() => setGraduadoCredencial(grad)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <CreditCard size={14} /> Ver credencial
                        </button>
                      )}
                      <button
                        onClick={() => manejarEliminar(grad.id)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  </details>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* VISTA DE LISTA (TABLA RESPONSIVA) */
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="overflow-x-auto min-h-[300px] pb-12">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Alumno</th>
                  <th className="py-3 px-4">Documento & Contacto</th>
                  <th className="py-3 px-4">Carrera</th>
                  <th className="py-3 px-4">Estado del Flujo</th>
                  <th className="py-3 px-4">Acompañantes</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {graduadosFiltrados.map(grad => {
                  const estadoConfig = ESTADOS_FLUJO[grad.estado_flujo] || ESTADOS_FLUJO.SIN_INVITAR
                  const misInvitados = invitadosDe(grad.id)
                  const esRechazado = grad.estado_flujo === 'RECHAZADO'

                  return (
                    <tr key={grad.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl grid place-items-center text-xs font-black text-white shrink-0 ${
                            esRechazado ? 'bg-rose-500' : 'bg-gradient-to-tr from-sky-500 to-indigo-600'
                          }`}>
                            {grad.nombre?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{grad.nombre}</p>
                            <p className="text-[11px] text-slate-500">{siguientePaso(grad)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-medium text-slate-700">DNI {grad.dni}</p>
                        <p className="text-slate-500 font-mono text-[11px]">{grad.correo || 'Sin correo'}</p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {grad.carrera || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${estadoConfig.color}`}>
                          {obtenerIconoEstado(estadoConfig.iconKey, 11)}
                          {estadoConfig.etiqueta}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {misInvitados.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                            <Users size={13} className="text-slate-400" />
                            <span>{misInvitados.length} acomp.</span>
                            {misInvitados.some(i => i.es_padrino || i.esPadrino) && (
                              <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                                Padrino
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setGraduadoEditar(grad)}
                            className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 text-xs font-bold cursor-pointer transition"
                          >
                            Editar
                          </button>
                          {!esRechazado && grad.estado === 'ACEPTADO' && (
                            <button
                              onClick={() => abrirAsignacion(grad)}
                              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 text-xs font-bold cursor-pointer transition"
                            >
                              Butacas
                            </button>
                          )}
                          <details className="relative">
                            <summary className="grid h-7 w-7 cursor-pointer list-none place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                              <MoreHorizontal size={14} />
                            </summary>
                            <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-2xl text-left">
                              {!esRechazado && !grad.identidad_corrobada_en && (
                                <button onClick={() => manejarCorroboracion(grad)} disabled={corroborandoId === grad.id} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer">
                                  <BadgeCheck size={13} /> Verificar datos
                                </button>
                              )}
                              {!esRechazado && (
                                <button onClick={() => manejarLink(grad)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                                  <Link2 size={13} /> Enlace
                                </button>
                              )}
                              {!esRechazado && (
                                <button onClick={() => setGraduadoCredencial(grad)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                                  <CreditCard size={13} /> Ver credencial
                                </button>
                              )}
                              <button onClick={() => manejarEliminar(grad.id)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer">
                                <Trash2 size={13} /> Eliminar
                              </button>
                            </div>
                          </details>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* VISTA 2: PADRÓN GENERAL HISTÓRICO CON COMPARADOR EN TIEMPO REAL */}
      {pestanaPadron === 'general' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                Archivo Central de Alumnos
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Padrón General Institucional ({padronGeneral.length} registros totales)
              </h3>
              <p className="text-xs text-slate-400 font-medium max-w-xl">
                Registro histórico que reúne graduados de todas las colaciones anteriores y en curso. Permite verificar si una persona ya fue cargada, en qué fecha colacionó y evitar duplicaciones accidentales.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 shrink-0">
              <Sparkles size={16} className="text-amber-400" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">En Ceremonia Activa</span>
                <strong className="text-emerald-400 font-mono text-sm">{graduados.length} alumnos</strong>
              </div>
            </div>
          </div>

          {/* BUSCADOR DEDICADO DE PADRÓN GENERAL */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar en el archivo histórico por nombre, DNI, carrera o nombre de colación..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition shadow-xs placeholder-slate-400"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {cargandoPadronGeneral ? (
            <div className="py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
              Cargando padrón histórico completo...
            </div>
          ) : padronGeneralFiltrado.length === 0 ? (
            <div className="py-14 text-center bg-white border border-slate-200/80 rounded-2xl space-y-2">
              <Users size={32} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No se encontraron registros en el padrón general</p>
              <p className="text-xs text-slate-400">Verificá el término de búsqueda ingresado.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="overflow-x-auto min-h-[260px]">
                <table className="w-full text-left text-xs min-w-[760px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Alumno</th>
                      <th className="py-3 px-4">Identificación</th>
                      <th className="py-3 px-4">Carrera</th>
                      <th className="py-3 px-4">Ceremonia Asignada</th>
                      <th className="py-3 px-4">Estado en Acto Activo</th>
                      <th className="py-3 px-4 text-right">Verificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {padronGeneralFiltrado.map((grad) => {
                      const dniLimpio = String(grad.dni || '').replace(/\D/g, '')
                      const estaEnActiva = dnisEnCeremoniaActiva.has(dniLimpio) || String(grad.ceremonia_id) === String(ceremoniaMostrada?.id)
                      const estadoConfig = ESTADOS_FLUJO[grad.estado_flujo] || ESTADOS_FLUJO.SIN_INVITAR

                      return (
                        <tr key={grad.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-xl grid place-items-center text-xs font-black text-white shrink-0 ${
                                estaEnActiva ? 'bg-emerald-600' : 'bg-slate-600'
                              }`}>
                                {grad.nombre?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm leading-tight">{grad.nombre}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">{grad.correo || 'Sin correo registrado'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-mono font-bold text-slate-800">DNI {grad.dni}</p>
                            <p className="text-[10.5px] font-mono text-slate-500">Leg: {grad.legajo || '—'}</p>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {grad.carrera || 'No especificada'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 block text-xs">
                              {grad.ceremoniaNombre || grad.ceremonia_nombre || 'Sin ceremonia asignada'}
                            </span>
                            {grad.ceremonia_fecha && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                Fecha: {grad.ceremonia_fecha}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {estaEnActiva ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10.5px] font-black">
                                <CheckCircle2 size={13} className="text-emerald-600" /> Registrado en ceremonia actual
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10.5px] font-bold">
                                No está en esta colación
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${estadoConfig.color}`}>
                              {obtenerIconoEstado(estadoConfig.iconKey, 11)}
                              {estadoConfig.etiqueta}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTADOR */}
      {!cargando && (
        <p className="text-center text-xs text-slate-400 mt-4 font-bold uppercase tracking-wider">
          {pestanaPadron === 'ceremonia' 
            ? `Mostrando ${graduadosFiltrados.length} de ${graduados.length} estudiantes en la ceremonia activa`
            : `Mostrando ${padronGeneralFiltrado.length} de ${padronGeneral.length} estudiantes del historial general`}
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

const CARRERAS_PREDETERMINADAS_MODAL = [
  { id: 'Analista de Sistemas', nombre: 'Tecnicatura Superior en Analista de Sistemas', iniciales: 'TSAS' },
  { id: 'Ciencia de Datos e IA', nombre: 'Tecnicatura Superior en Ciencia de Datos e Inteligencia Artificial', iniciales: 'TSCDIA' },
  { id: 'Higiene y Seguridad', nombre: 'Tecnicatura Superior en Higiene, Seguridad y Ambiente Laboral', iniciales: 'TSHSAL' },
  { id: 'Diseño Industrial', nombre: 'Tecnicatura Superior en Diseño Industrial', iniciales: 'TSDI' },
  { id: 'Automatización y Robótica', nombre: 'Tecnicatura Superior en Automatización y Robótica', iniciales: 'TSAR' },
  { id: 'Desarrollo de Software', nombre: 'Tecnicatura Superior en Analista de Sistemas', iniciales: 'TSAS' },
]

function ModalEditarGraduado({ graduado, onCerrar, onGuardar }) {
  const [form, setForm] = useState({
    nombre: graduado.nombre || '',
    dni: graduado.dni || '',
    legajo: graduado.legajo || '',
    correo: graduado.correo || '',
    correo_personal: graduado.correo_personal || '',
    telefono: graduado.telefono || '',
    carrera: graduado.carrera || '',
    anio_inscripcion: graduado.anio_inscripcion || '',
    promedio: graduado.promedio !== null && graduado.promedio !== undefined ? graduado.promedio : ''
  })
  const [carrerasDisponibles, setCarrerasDisponibles] = useState(CARRERAS_PREDETERMINADAS_MODAL)
  const [esOtraCarrera, setEsOtraCarrera] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarCarreras() {
      try {
        const lista = await obtenerCarreras().catch(() => [])
        if (Array.isArray(lista) && lista.length > 0) {
          const mapeadas = lista.map(c => ({
            id: c.id,
            nombre: c.nombre,
            iniciales: c.sigla || ''
          }))
          setCarrerasDisponibles(mapeadas)
          const existe = mapeadas.some(c => c.nombre.toLowerCase() === (graduado.carrera || '').toLowerCase())
          if (!existe && graduado.carrera) {
            setEsOtraCarrera(true)
          }
        } else if (graduado.carrera) {
          const existePre = CARRERAS_PREDETERMINADAS_MODAL.some(c => c.nombre.toLowerCase() === graduado.carrera.toLowerCase())
          if (!existePre) setEsOtraCarrera(true)
        }
      } catch (err) {
        console.error('Error al cargar carreras en modal de edición:', err)
      }
    }
    cargarCarreras()
  }, [graduado])

  const sugerirCorreoInstitucional = () => {
    const d = form.dni.replace(/\D/g, '')
    if (d) {
      setForm(p => ({ ...p, correo: `${d}@itbeltran.com.ar` }))
    }
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (!form.nombre.trim()) {
      setError('El nombre completo es requerido.')
      return
    }
    if (!form.dni.trim()) {
      setError('El DNI es requerido.')
      return
    }
    setError('')
    setGuardando(true)
    try {
      await onGuardar({
        ...form,
        dni: form.dni.replace(/\D/g, ''),
        promedio: form.promedio === '' ? null : form.promedio,
        anio_inscripcion: form.anio_inscripcion === '' ? null : Number(form.anio_inscripcion)
      })
    } catch (err) {
      setError(err.message || 'Error al actualizar graduado')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <form onSubmit={enviar} className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
        
        {/* Cabecera */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
              Edición Administrativa
            </span>
            <h3 className="mt-1.5 text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Actualizar graduado
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Modifica los datos académicos o de contacto del egresado.
            </p>
          </div>
          <button 
            type="button" 
            onClick={onCerrar} 
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 animate-in fade-in">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Nombre y DNI */}
          <InputCampo
            label="Nombre Completo *"
            valor={form.nombre}
            onChange={(v) => setForm(p => ({ ...p, nombre: v }))}
            placeholder="Ej. Cancelo Julian"
            icon={Users}
          />
          <InputCampo
            label="DNI *"
            valor={form.dni}
            onChange={(v) => setForm(p => ({ ...p, dni: v }))}
            placeholder="Ej. 35230531"
            icon={BadgeCheck}
          />

          {/* Legajo y Teléfono */}
          <InputCampo
            label="Legajo"
            valor={form.legajo}
            onChange={(v) => setForm(p => ({ ...p, legajo: v }))}
            placeholder="Ej. TSAS-2025-0100"
            icon={GraduationCap}
          />
          <InputCampo
            label="Teléfono / WhatsApp"
            valor={form.telefono}
            onChange={(v) => setForm(p => ({ ...p, telefono: v }))}
            placeholder="Ej. 11 3456-7890"
            icon={Phone}
            type="tel"
          />

          {/* Correo Institucional con botón de sugerencia rápida */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1 ml-1">
              <label className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                Correo Institucional
              </label>
              {form.dni && !form.correo && (
                <button 
                  type="button" 
                  onClick={sugerirCorreoInstitucional}
                  className="text-[9px] font-bold text-sky-600 hover:text-sky-800 transition-colors"
                >
                  + Beltrán (@itbeltran.com.ar)
                </button>
              )}
            </div>
            <InputCampo
              valor={form.correo}
              onChange={(v) => setForm(p => ({ ...p, correo: v }))}
              placeholder="35230531@itbeltran.com.ar"
              icon={Mail}
              type="email"
            />
          </div>

          {/* Correo Personal */}
          <div className="sm:col-span-2">
            <InputCampo
              label="Correo Personal (Opcional)"
              valor={form.correo_personal}
              onChange={(v) => setForm(p => ({ ...p, correo_personal: v }))}
              placeholder="ejemplo@gmail.com"
              icon={Mail}
              type="email"
            />
          </div>

          {/* Carrera */}
          <div className="sm:col-span-2">
            <label className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 ml-1 mb-1 block">
              Carrera de Graduación
            </label>
            <div className="relative">
              <select
                value={esOtraCarrera ? '__OTRA__' : form.carrera}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '__OTRA__') {
                    setEsOtraCarrera(true)
                    setForm(p => ({ ...p, carrera: '' }))
                  } else {
                    setEsOtraCarrera(false)
                    setForm(p => ({ ...p, carrera: val }))
                  }
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-8 text-xs sm:text-sm font-semibold text-slate-800 outline-none transition-all focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10 cursor-pointer"
              >
                <option value="">-- Seleccionar Carrera --</option>
                {carrerasDisponibles.map(c => (
                  <option key={c.id || c.nombre} value={c.nombre}>
                    {c.nombre} {c.iniciales ? `(${c.iniciales})` : ''}
                  </option>
                ))}
                <option value="__OTRA__">+ Otra carrera (personalizada)...</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">
                ▼
              </div>
            </div>
            {esOtraCarrera && (
              <div className="mt-2 animate-in fade-in">
                <InputCampo
                  label="Nombre de la carrera"
                  valor={form.carrera}
                  onChange={(v) => setForm(p => ({ ...p, carrera: v }))}
                  placeholder="Ej. Tecnicatura Superior en Logística"
                  icon={GraduationCap}
                />
              </div>
            )}
          </div>

          {/* Promedio y Año de Inscripción */}
          <InputCampo
            label="Promedio General"
            valor={form.promedio}
            onChange={(v) => setForm(p => ({ ...p, promedio: v }))}
            placeholder="Ej. 9.00"
            icon={Award}
          />
          <InputCampo
            label="Año de Inscripción"
            valor={form.anio_inscripcion}
            onChange={(v) => setForm(p => ({ ...p, anio_inscripcion: v }))}
            placeholder="Ej. 2022"
            icon={Calendar}
          />
        </div>

        {/* Acciones */}
        <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
          <button 
            type="button" 
            onClick={onCerrar} 
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={guardando} 
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black text-white hover:bg-sky-600 transition-all shadow-md shadow-slate-900/10 disabled:opacity-50 cursor-pointer"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
