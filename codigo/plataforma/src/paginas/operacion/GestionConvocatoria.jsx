import React, { useEffect, useState, useMemo } from 'react'
import {
  AlertCircle, Check, CheckCircle2, Clock3, Copy, CreditCard, Edit3, ExternalLink,
  Mail, MessageSquare, RefreshCw, Send, UserCheck, UserPlus, Users, X, Sparkles,
  PhoneCall, ArrowRight, Armchair, Search, Filter, CheckSquare, Square, Eye,
  FileSpreadsheet, MessageCircle, ChevronDown, CheckCheck
} from 'lucide-react'
import {
  enviarCredencialCeremonia,
  enviarInvitacion,
  obtenerGraduados,
  obtenerCeremoniaActiva,
  responderInvitacion,
  actualizarGraduado
} from '../../servicios/api'
import { useConfirmacion } from '../../componentes/ModalConfirmacion'
import { ModalPreviewCorreo } from '../../componentes/ModalPreviewCorreo'
import { ModalDespachoMasivo } from '../../componentes/ModalDespachoMasivo'

const PESTANAS = [
  { id: 'TODOS', etiqueta: 'Todos' },
  { id: 'PENDIENTES', etiqueta: 'Por Invitar' },
  { id: 'RESPUESTAS', etiqueta: 'Sin Respuesta' },
  { id: 'ACEPTADOS', etiqueta: 'Confirmados' },
  { id: 'GRUPOS', etiqueta: 'Completando Grupo' },
  { id: 'CREDENCIALES', etiqueta: 'Credenciales Listas' },
  { id: 'SIN_CORREO', etiqueta: 'Sin Correo' },
]

export function GestionConvocatoria({ onNavegar, usuario }) {
  const { confirmar, dialogoConfirmacion } = useConfirmacion()
  const [ceremonia, setCeremonia] = useState(null)
  const [graduados, setGraduados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(null)
  const [pestaña, setPestaña] = useState('PENDIENTES')
  const [busqueda, setBusqueda] = useState('')
  const [carreraSeleccionada, setCarreraSeleccionada] = useState('TODAS')
  const [seleccionados, setSeleccionados] = useState([])
  const [aviso, setAviso] = useState('')
  const [error, setError] = useState('')
  const [copiadoId, setCopiadoId] = useState(null)

  // Modales
  const [modalPreviewAbierto, setModalPreviewAbierto] = useState(false)
  const [modalDespachoConfig, setModalDespachoConfig] = useState(null) // { graduados: [], tipo: 'invitacion' }
  const [editandoCorreo, setEditandoCorreo] = useState(null)
  const [nuevoCorreo, setNuevoCorreo] = useState('')
  const [guardandoCorreo, setGuardandoCorreo] = useState(false)

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const cerActiva = await obtenerCeremoniaActiva().catch(() => null)
      setCeremonia(cerActiva)
      const data = await obtenerGraduados(cerActiva?.id)
      setGraduados(data || [])
    } catch (err) {
      setError(err.message || 'No se pudo cargar la convocatoria.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  // Carreras únicas para el filtro
  const carrerasDisponibles = useMemo(() => {
    const setCarreras = new Set()
    graduados.forEach(g => {
      if (g.carrera && g.carrera.trim()) setCarreras.add(g.carrera.trim())
    })
    return Array.from(setCarreras).sort()
  }, [graduados])

  // Segmentaciones del padrón
  const pendientes = useMemo(() => graduados.filter(item => !item.invitacion_enviada && item.estado_flujo !== 'RECHAZADO' && item.correo), [graduados])
  const esperandoRespuesta = useMemo(() => graduados.filter(item => item.invitacion_enviada && (item.estado_flujo === 'PENDIENTE' || !item.estado || item.estado === 'PENDIENTE')), [graduados])
  const aceptados = useMemo(() => graduados.filter(item => item.estado === 'ACEPTADO'), [graduados])
  const completandoGrupo = useMemo(() => graduados.filter(item => item.estado === 'ACEPTADO' && item.estado_flujo !== 'COMPLETO'), [graduados])
  const credencialesListas = useMemo(() => graduados.filter(item => item.estado === 'ACEPTADO' && item.estado_asignacion_butacas === 'CONFIRMADA' && item.asiento_id && !item.credencial_enviada_en), [graduados])
  const sinCorreo = useMemo(() => graduados.filter(item => !item.correo && item.estado_flujo !== 'RECHAZADO'), [graduados])

  // Filtrado reactivo combinado (Pestaña + Búsqueda + Carrera)
  const listaFiltrada = useMemo(() => {
    let base = graduados
    if (pestaña === 'PENDIENTES') base = pendientes
    else if (pestaña === 'RESPUESTAS') base = esperandoRespuesta
    else if (pestaña === 'ACEPTADOS') base = aceptados
    else if (pestaña === 'GRUPOS') base = completandoGrupo
    else if (pestaña === 'CREDENCIALES') base = credencialesListas
    else if (pestaña === 'SIN_CORREO') base = sinCorreo

    if (carreraSeleccionada !== 'TODAS') {
      base = base.filter(g => g.carrera === carreraSeleccionada)
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim()
      base = base.filter(g => 
        (g.nombre && g.nombre.toLowerCase().includes(q)) ||
        (g.dni && String(g.dni).includes(q)) ||
        (g.correo && g.correo.toLowerCase().includes(q)) ||
        (g.carrera && g.carrera.toLowerCase().includes(q))
      )
    }

    return base
  }, [graduados, pestaña, carreraSeleccionada, busqueda, pendientes, esperandoRespuesta, aceptados, completandoGrupo, credencialesListas, sinCorreo])

  // Selección múltiple
  const todosSeleccionados = listaFiltrada.length > 0 && listaFiltrada.every(g => seleccionados.includes(g.id))
  
  const toggleSeleccionarTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados([])
    } else {
      setSeleccionados(listaFiltrada.map(g => g.id))
    }
  }

  const toggleSeleccionarUno = (id) => {
    setSeleccionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // ─── ACCIONES OPERATIVAS INDIVIDUALES & LOTE ───────────────────

  async function enviarIndividual(graduado, esReenvio = false) {
    setProcesando(`invitacion-${graduado.id}`)
    setAviso('')
    try {
      await enviarInvitacion(graduado.id)
      setAviso(esReenvio 
        ? `Recordatorio reenviado a ${graduado.nombre} (${graduado.correo}).`
        : `Invitación oficial enviada a ${graduado.nombre}.`)
      await cargar()
    } catch (err) {
      setError(err.message || 'No se pudo enviar el correo.')
    } finally {
      setProcesando(null)
    }
  }

  async function enviarCredencialIndividual(graduado) {
    setProcesando(`credencial-${graduado.id}`)
    setAviso('')
    try {
      const respuesta = await enviarCredencialCeremonia(graduado.id)
      setAviso(respuesta.googleWallet
        ? `Credencial enviada a ${graduado.nombre} con pase digital de Google Wallet.`
        : `Credencial enviada a ${graduado.nombre}.`)
      await cargar()
    } catch (err) {
      setError(err.message || 'No se pudo enviar la credencial.')
    } finally {
      setProcesando(null)
    }
  }

  async function confirmarManual(graduado) {
    const confirmado = await confirmar({
      titulo: 'Confirmar asistencia por ventanilla / teléfono',
      descripcion: `¿Deseás registrar formalmente la asistencia de ${graduado.nombre}? El egresado pasará al estado ACEPTADO.`,
      textoConfirmar: 'Confirmar asistencia',
      tipo: 'exito',
    })
    if (!confirmado) return

    setProcesando(`confirmar-${graduado.id}`)
    setAviso('')
    try {
      await responderInvitacion(graduado.id, 'ACEPTADO')
      setAviso(`Asistencia de ${graduado.nombre} confirmada manualmente.`)
      await cargar()
    } catch (err) {
      setError(err.message || 'No se pudo registrar la confirmación.')
    } finally {
      setProcesando(null)
    }
  }

  function copiarLinkAcceso(graduado) {
    const host = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${host}/?token=${graduado.token}`
    navigator.clipboard.writeText(url)
    setCopiadoId(graduado.id)
    setAviso(`Enlace de acceso copiado para ${graduado.nombre}.`)
    setTimeout(() => setCopiadoId(null), 3000)
  }

  function abrirWhatsApp(graduado) {
    const host = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${host}/?token=${graduado.token}`
    const fechaTexto = ceremonia?.fecha 
      ? new Date(`${ceremonia.fecha}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'próximamente'

    const mensajeWhatsApp = `Hola ${graduado.nombre}, te escribimos desde el Instituto Tecnológico Beltrán. Te convocamos formalmente a la Ceremonia de Graduación (${fechaTexto}). Podés confirmar tu asistencia y cargar a tus acompañantes desde este enlace oficial: ${url}`
    
    window.open(`https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp)}`, '_blank')
  }

  function abrirPortalEgresado(graduado) {
    const host = typeof window !== 'undefined' ? window.location.origin : ''
    window.open(`${host}/?token=${graduado.token}`, '_blank')
  }

  // Despacho masivo mediante Modal con barra de progreso
  function iniciarDespachoLote(tipo = 'invitacion') {
    let listaAEnviar = []
    if (seleccionados.length > 0) {
      listaAEnviar = graduados.filter(g => seleccionados.includes(g.id) && g.correo)
    } else {
      if (tipo === 'invitacion') listaAEnviar = pendientes
      else if (tipo === 'recordatorio') listaAEnviar = esperandoRespuesta
      else if (tipo === 'credencial') listaAEnviar = credencialesListas
    }

    if (listaAEnviar.length === 0) {
      setError('No hay destinatarios válidos con correo electrónico para despachar.')
      return
    }

    setModalDespachoConfig({ graduados: listaAEnviar, tipo })
  }

  // Exportar a CSV
  function exportarCSV() {
    if (listaFiltrada.length === 0) return
    const encabezados = ['ID', 'Nombre', 'DNI', 'Carrera', 'Correo', 'Estado', 'Invitacion Enviada', 'Envíos Realizados', 'Asiento']
    const filas = listaFiltrada.map(g => [
      g.id,
      `"${g.nombre || ''}"`,
      g.dni || '',
      `"${g.carrera || ''}"`,
      g.correo || '',
      g.estado || 'PENDIENTE',
      g.invitacion_enviada ? 'SI' : 'NO',
      g.invitacion_envios_count || 0,
      g.asiento_id || ''
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [encabezados.join(','), ...filas.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `SiGIC_Convocatoria_${pestaña}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Guardar correo editado
  async function handleGuardarCorreo(e) {
    e.preventDefault()
    if (!editandoCorreo || !nuevoCorreo.trim() || !nuevoCorreo.includes('@')) {
      setError('Ingresá un correo electrónico válido.')
      return
    }
    setGuardandoCorreo(true)
    try {
      await actualizarGraduado(editandoCorreo.id, { correo: nuevoCorreo.trim() })
      setAviso(`Correo actualizado correctamente para ${editandoCorreo.nombre}.`)
      setEditandoCorreo(null)
      setNuevoCorreo('')
      await cargar()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el correo.')
    } finally {
      setGuardandoCorreo(false)
    }
  }

  return (
    <>
      <section className="mx-auto w-full max-w-6xl font-sans space-y-4">
        
        {/* HEADER MINIMALISTA & ACCIONES RÁPIDAS */}
        <header className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 text-[9px] font-black uppercase tracking-wider">
                Fase 3 · Convocatoria Masiva
              </span>
              {ceremonia && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  {ceremonia.nombre}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Convocatoria & Comunicaciones
            </h1>
            <p className="text-xs font-medium text-slate-500 max-w-xl">
              Despacho masivo por correo electrónico, seguimiento en tiempo real y contingencia por WhatsApp Web.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setModalPreviewAbierto(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              title="Previsualizar plantillas de correo"
            >
              <Eye size={14} /> Template Studio
            </button>

            <button
              type="button"
              onClick={() => onNavegar('gestion-graduados')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <Users size={14} /> Padrón
            </button>

            <button
              type="button"
              onClick={() => onNavegar('preparacion-ceremonia')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-sky-600 text-white text-xs font-black transition cursor-pointer shadow-sm"
            >
              <Armchair size={14} /> Asignar Butacas <ArrowRight size={13} />
            </button>
          </div>
        </header>

        {/* METRICAS COMPACTAS EN PASTILLAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PESTANAS.map(item => {
            let cant = 0
            if (item.id === 'TODOS') cant = graduados.length
            else if (item.id === 'PENDIENTES') cant = pendientes.length
            else if (item.id === 'RESPUESTAS') cant = esperandoRespuesta.length
            else if (item.id === 'ACEPTADOS') cant = aceptados.length
            else if (item.id === 'GRUPOS') cant = completandoGrupo.length
            else if (item.id === 'CREDENCIALES') cant = credencialesListas.length
            else if (item.id === 'SIN_CORREO') cant = sinCorreo.length

            const esActiva = pestaña === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { setPestaña(item.id); setSeleccionados([]) }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  esActiva 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                    : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider block truncate ${esActiva ? 'text-slate-400' : 'text-slate-400'}`}>
                  {item.etiqueta}
                </span>
                <strong className="text-xl font-black block mt-0.5">{cant}</strong>
              </button>
            )
          })}
        </div>

        {/* BARRA DE FILTROS & BÚSQUEDA */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
          
          {/* BUSCADOR */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, DNI, carrera o correo..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-medium outline-none focus:border-sky-500 focus:bg-white transition"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* FILTRO POR CARRERA */}
          {carrerasDisponibles.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <Filter size={14} className="text-slate-400" />
              <select
                value={carreraSeleccionada}
                onChange={(e) => setCarreraSeleccionada(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer hover:bg-white transition max-w-[240px] truncate"
              >
                <option value="TODAS">Todas las Carreras ({graduados.length})</option>
                {carrerasDisponibles.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* BOTONES DE ACCIÓN RÁPIDA DE LA BARRA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={exportarCSV}
              disabled={listaFiltrada.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer disabled:opacity-40"
              title="Exportar listado a Excel / CSV"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={cargar}
              disabled={cargando}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              title="Actualizar listado"
            >
              <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* MENSAJES DE ESTADO */}
        {aviso && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{aviso}</span>
            </div>
            <button onClick={() => setAviso('')} className="text-slate-400 hover:text-slate-700 cursor-pointer">×</button>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-slate-400 hover:text-slate-700 cursor-pointer">×</button>
          </div>
        )}

        {/* BARRA FLOTANTE DE ACCIONES POR LOTE (SI HAY SELECCIÓN) */}
        {seleccionados.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500 text-slate-950 font-black text-[11px]">
                {seleccionados.length}
              </span>
              <span>graduados seleccionados</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => iniciarDespachoLote('invitacion')}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition cursor-pointer"
              >
                Enviar Invitación ({seleccionados.length})
              </button>

              <button
                type="button"
                onClick={() => iniciarDespachoLote('recordatorio')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer"
              >
                Reenviar Recordatorio ({seleccionados.length})
              </button>

              <button
                type="button"
                onClick={() => setSeleccionados([])}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Deseleccionar
              </button>
            </div>
          </div>
        )}

        {/* TABLA PRINCIPAL DE ALTA DENSIDAD */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          
          {/* ENCABEZADO DE LA TABLA */}
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-500">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSeleccionarTodos}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                title={todosSeleccionados ? 'Deseleccionar todos' : 'Seleccionar todos'}
              >
                {todosSeleccionados ? <CheckSquare size={16} className="text-sky-600" /> : <Square size={16} />}
              </button>
              <span>Graduado ({listaFiltrada.length})</span>
            </div>

            {/* BOTÓN RÁPIDO DE DESPACHO TOTAL DE LA PESTAÑA */}
            {pestaña === 'PENDIENTES' && pendientes.length > 0 && seleccionados.length === 0 && (
              <button
                type="button"
                onClick={() => iniciarDespachoLote('invitacion')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-sm"
              >
                <Send size={13} /> Despachar todas las pendientes ({pendientes.length})
              </button>
            )}

            {pestaña === 'RESPUESTAS' && esperandoRespuesta.length > 0 && seleccionados.length === 0 && (
              <button
                type="button"
                onClick={() => iniciarDespachoLote('recordatorio')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-sm"
              >
                <Clock3 size={13} /> Reenviar recordatorio a todos ({esperandoRespuesta.length})
              </button>
            )}

            {pestaña === 'CREDENCIALES' && credencialesListas.length > 0 && seleccionados.length === 0 && (
              <button
                type="button"
                onClick={() => iniciarDespachoLote('credencial')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-sm"
              >
                <CreditCard size={13} /> Despachar todas las credenciales ({credencialesListas.length})
              </button>
            )}
          </div>

          {/* FILAS DE GRADUADOS */}
          {cargando ? (
            <div className="py-20 text-center text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-sky-500" /> Cargando convocatoria...
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Mail size={36} className="mx-auto text-slate-300" />
              <h3 className="text-sm font-black text-slate-700">No se encontraron egresados</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No hay registros que coincidan con la pestaña y los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
              {listaFiltrada.map((g) => {
                const seleccionado = seleccionados.includes(g.id)
                const ocupado = procesando === `invitacion-${g.id}` || procesando === `credencial-${g.id}` || procesando === `confirmar-${g.id}`
                const esCopiado = copiadoId === g.id

                return (
                  <div
                    key={g.id}
                    className={`p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                      seleccionado ? 'bg-sky-50/50' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* CHECKBOX + DATOS DEL GRADUADO */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleSeleccionarUno(g.id)}
                        className="text-slate-400 hover:text-slate-600 transition cursor-pointer shrink-0"
                      >
                        {seleccionado ? <CheckSquare size={16} className="text-sky-600" /> : <Square size={16} />}
                      </button>

                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                        {g.nombre ? g.nombre.slice(0, 1).toUpperCase() : '?'}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-xs sm:text-sm font-black text-slate-900 truncate">
                            {g.nombre}
                          </strong>
                          {g.carrera && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold truncate max-w-[200px]">
                              {g.carrera}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                          <span>DNI: <strong className="text-slate-700">{g.dni}</strong></span>
                          <span>·</span>
                          {g.correo ? (
                            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                              <span>{g.correo}</span>
                              <button
                                type="button"
                                onClick={() => { setEditandoCorreo(g); setNuevoCorreo(g.correo) }}
                                className="text-slate-400 hover:text-sky-600 p-0.5 cursor-pointer"
                                title="Modificar correo"
                              >
                                <Edit3 size={11} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setEditandoCorreo(g); setNuevoCorreo('') }}
                              className="text-rose-500 hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <AlertCircle size={12} /> Cargar correo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ESTADO & ENLACES DE CONVOCATORIA */}
                    <div className="flex items-center gap-3 justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      
                      {/* BADGE DE ESTADO */}
                      <div className="text-left md:text-right space-y-0.5">
                        {g.estado === 'ACEPTADO' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider block text-center">
                            Confirmado
                          </span>
                        ) : g.estado === 'RECHAZADO' ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-black uppercase tracking-wider block text-center">
                            Inasistente
                          </span>
                        ) : g.invitacion_enviada ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black uppercase tracking-wider block text-center">
                            {g.invitacion_envios_count > 1 ? `Invitado x${g.invitacion_envios_count}` : 'Invitado'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-black uppercase tracking-wider block text-center">
                            Por invitar
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 font-medium block">
                          {g.asiento_id ? `Butaca ${g.asiento_id}` : 'Sin butaca'}
                        </span>
                      </div>

                      {/* BOTONES DE ACCIÓN RÁPIDA */}
                      <div className="flex items-center gap-1.5">
                        
                        {/* BOTÓN ENVIAR CORREO */}
                        {g.correo && (
                          <button
                            type="button"
                            onClick={() => enviarIndividual(g, g.invitacion_enviada)}
                            disabled={ocupado}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-sky-500 hover:text-white text-slate-700 transition cursor-pointer disabled:opacity-40"
                            title={g.invitacion_enviada ? 'Reenviar invitación por correo' : 'Enviar invitación por correo'}
                          >
                            {ocupado ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                          </button>
                        )}

                        {/* BOTÓN WHATSAPP */}
                        <button
                          type="button"
                          onClick={() => abrirWhatsApp(g)}
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 transition cursor-pointer border border-emerald-100"
                          title="Enviar enlace directo por WhatsApp Web"
                        >
                          <MessageCircle size={14} />
                        </button>

                        {/* BOTÓN COPIAR LINK */}
                        <button
                          type="button"
                          onClick={() => copiarLinkAcceso(g)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                          title="Copiar link de acceso directo"
                        >
                          {esCopiado ? <CheckCheck size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>

                        {/* BOTÓN VER PORTAL */}
                        <button
                          type="button"
                          onClick={() => abrirPortalEgresado(g)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                          title="Abrir portal del graduado en pestaña nueva"
                        >
                          <ExternalLink size={14} />
                        </button>

                        {/* BOTÓN CONFIRMAR MANUAL (SI NO CONFIRMÓ AÚN) */}
                        {g.estado !== 'ACEPTADO' && g.estado !== 'RECHAZADO' && (
                          <button
                            type="button"
                            onClick={() => confirmarManual(g)}
                            disabled={ocupado}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-[11px] font-black transition cursor-pointer border border-emerald-200"
                            title="Confirmar asistencia manualmente por ventanilla"
                          >
                            Confirmar
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>

      </section>

      {/* MODAL DE EDICIÓN INLINE DE CORREO */}
      {editandoCorreo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Editar Correo Electrónico</h3>
              <button onClick={() => setEditandoCorreo(null)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Graduado: <strong className="text-slate-800">{editandoCorreo.nombre}</strong> (DNI {editandoCorreo.dni})
            </p>

            <form onSubmit={handleGuardarCorreo} className="space-y-4">
              <input
                type="email"
                required
                value={nuevoCorreo}
                onChange={(e) => setNuevoCorreo(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-sky-500 focus:bg-white"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditandoCorreo(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCorreo || !nuevoCorreo.trim()}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition disabled:opacity-50 cursor-pointer"
                >
                  {guardandoCorreo ? 'Guardando...' : 'Guardar Correo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TEMPLATE STUDIO / PREVIEW */}
      {modalPreviewAbierto && (
        <ModalPreviewCorreo
          graduadoEjemplo={graduados[0]}
          ceremonia={ceremonia}
          usuarioActual={usuario}
          onCerrar={() => setModalPreviewAbierto(false)}
        />
      )}

      {/* MODAL DESPACHO MASIVO CON PROGRESO EN VIVO */}
      {modalDespachoConfig && (
        <ModalDespachoMasivo
          graduados={modalDespachoConfig.graduados}
          tipo={modalDespachoConfig.tipo}
          onCerrar={() => setModalDespachoConfig(null)}
          onCompletado={() => {
            setModalDespachoConfig(null)
            setSeleccionados([])
            cargar()
          }}
        />
      )}

      {dialogoConfirmacion}
    </>
  )
}
