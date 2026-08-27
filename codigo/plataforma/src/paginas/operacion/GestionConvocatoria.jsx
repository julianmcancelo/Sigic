import { useEffect, useState } from 'react'
import {
  AlertCircle, Check, CheckCircle2, Clock3, Copy, CreditCard, Edit3, ExternalLink,
  Mail, MessageSquare, RefreshCw, Send, UserCheck, UserPlus, Users, X, Sparkles, PhoneCall,
  ArrowRight, Armchair
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

const FILTROS = [
  { id: 'PENDIENTES', etiqueta: 'Por invitar' },
  { id: 'RESPUESTAS', etiqueta: 'Esperando respuesta' },
  { id: 'GRUPOS', etiqueta: 'Completando grupo' },
  { id: 'CREDENCIALES', etiqueta: 'Credenciales listas' },
  { id: 'SIN_CORREO', etiqueta: 'Requieren correo' },
]

export function GestionConvocatoria({ onNavegar }) {
  const { confirmar, dialogoConfirmacion } = useConfirmacion()
  const [ceremonia, setCeremonia] = useState(null)
  const [graduados, setGraduados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(null)
  const [filtro, setFiltro] = useState('PENDIENTES')
  const [aviso, setAviso] = useState('')
  const [error, setError] = useState('')
  const [copiadoId, setCopiadoId] = useState(null)

  // Modal para edición inline de correo
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
      setGraduados(data)

      // Selección inteligente de pestaña si la actual está vacía
      const p = data.filter(item => !item.invitacion_enviada && item.estado_flujo !== 'RECHAZADO' && item.correo)
      const r = data.filter(item => item.invitacion_enviada && (item.estado_flujo === 'PENDIENTE' || !item.estado || item.estado === 'PENDIENTE'))
      const c = data.filter(item => item.estado === 'ACEPTADO' && item.estado_asignacion_butacas === 'CONFIRMADA' && item.asiento_id && !item.credencial_enviada_en)
      const g = data.filter(item => item.estado === 'ACEPTADO' && item.estado_flujo !== 'COMPLETO')
      const s = data.filter(item => !item.correo && item.estado_flujo !== 'RECHAZADO')

      setFiltro(actual => {
        if (actual === 'PENDIENTES' && p.length === 0 && r.length > 0) return 'RESPUESTAS'
        if (actual === 'PENDIENTES' && p.length === 0 && r.length === 0 && g.length > 0) return 'GRUPOS'
        if (actual === 'PENDIENTES' && p.length === 0 && r.length === 0 && c.length > 0) return 'CREDENCIALES'
        if (actual === 'PENDIENTES' && p.length === 0 && r.length === 0 && s.length > 0) return 'SIN_CORREO'
        return actual
      })
    } catch (err) {
      setError(err.message || 'No se pudo cargar la convocatoria.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const pendientes = graduados.filter(item => !item.invitacion_enviada && item.estado_flujo !== 'RECHAZADO' && item.correo)
  const sinCorreo = graduados.filter(item => !item.correo && item.estado_flujo !== 'RECHAZADO')
  const esperandoRespuesta = graduados.filter(item => item.invitacion_enviada && (item.estado_flujo === 'PENDIENTE' || !item.estado || item.estado === 'PENDIENTE'))
  const completandoGrupo = graduados.filter(item => item.estado === 'ACEPTADO' && item.estado_flujo !== 'COMPLETO')
  const credencialesListas = graduados.filter(item => item.estado === 'ACEPTADO' && item.estado_asignacion_butacas === 'CONFIRMADA' && item.asiento_id && !item.credencial_enviada_en)

  const listados = {
    PENDIENTES: pendientes,
    RESPUESTAS: esperandoRespuesta,
    GRUPOS: completandoGrupo,
    CREDENCIALES: credencialesListas,
    SIN_CORREO: sinCorreo,
  }
  const lista = listados[filtro] || []

  // ─── ACCIONES OPERATIVAS ────────────────────────────────────────

  async function enviarInvitacionIndividual(graduado, esReenvio = false) {
    setProcesando(`invitacion-${graduado.id}`)
    setAviso('')
    try {
      await enviarInvitacion(graduado.id)
      setAviso(esReenvio 
        ? `Recordatorio de invitación reenviado a ${graduado.nombre} (${graduado.correo}).`
        : `Invitación enviada a ${graduado.nombre}.`)
      await cargar()
    } catch (err) {
      setError(err.message || 'No se pudo enviar la invitación.')
    } finally {
      setProcesando(null)
    }
  }

  async function enviarPendientes() {
    if (!pendientes.length) return
    const confirmado = await confirmar({
      titulo: 'Enviar invitaciones pendientes',
      descripcion: `Se despacharán ${pendientes.length} invitaciones formales por correo electrónico.`,
      textoConfirmar: 'Enviar invitaciones',
      tipo: 'info',
    })
    if (!confirmado) return
    setProcesando('lote-invitaciones')
    setAviso('')
    let enviados = 0
    let fallidos = 0
    for (const graduado of pendientes) {
      try {
        await enviarInvitacion(graduado.id)
        enviados += 1
      } catch {
        fallidos += 1
      }
    }
    setProcesando(null)
    setAviso(fallidos 
      ? `${enviados} invitaciones enviadas y ${fallidos} pendientes para reintentar.` 
      : `${enviados} invitaciones enviadas correctamente.`)
    await cargar()
  }

  async function reenviarRecordatorioTodos() {
    if (!esperandoRespuesta.length) return
    const confirmado = await confirmar({
      titulo: 'Reenviar recordatorio a graduados sin respuesta',
      descripcion: `Se volverá a enviar el correo de invitación a los ${esperandoRespuesta.length} graduados que aún no confirmaron ni rechazaron.`,
      textoConfirmar: `Reenviar recordatorios (${esperandoRespuesta.length})`,
      tipo: 'info',
    })
    if (!confirmado) return
    setProcesando('lote-recordatorios')
    setAviso('')
    let enviados = 0
    let fallidos = 0
    for (const graduado of esperandoRespuesta) {
      try {
        await enviarInvitacion(graduado.id)
        enviados += 1
      } catch {
        fallidos += 1
      }
    }
    setProcesando(null)
    setAviso(`${enviados} recordatorios despachados exitosamente.`)
    await cargar()
  }

  async function confirmarAsistenciaManual(graduado) {
    const confirmado = await confirmar({
      titulo: 'Confirmar asistencia por ventanilla / teléfono',
      descripcion: `¿Deseás registrar formalmente la asistencia de ${graduado.nombre}? El graduado pasará al estado ACEPTADO y podrá continuar con la carga de acompañantes.`,
      textoConfirmar: 'Confirmar asistencia',
      tipo: 'exito',
    })
    if (!confirmado) return

    setProcesando(`confirmar-${graduado.id}`)
    setAviso('')
    try {
      await responderInvitacion(graduado.id, 'ACEPTADO')
      setAviso(`Asistencia de ${graduado.nombre} confirmada manualmente. Pasó a la etapa de carga de acompañantes.`)
      await cargar()
    } catch (err) {
      setError(err.message || 'No se pudo confirmar la asistencia.')
    } finally {
      setProcesando(null)
    }
  }

  function copiarEnlaceWhatsApp(graduado) {
    const host = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${host}/?token=${graduado.token}`
    navigator.clipboard.writeText(url)
    setCopiadoId(graduado.id)
    setAviso(`Enlace de acceso copiado para ${graduado.nombre}. Podés pegarlo directamente en WhatsApp Web o chat.`)
    setTimeout(() => setCopiadoId(null), 3000)
  }

  function abrirPortalEgresado(graduado) {
    const host = typeof window !== 'undefined' ? window.location.origin : ''
    window.open(`${host}/?token=${graduado.token}`, '_blank')
  }

  async function enviarCredencial(graduado) {
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

  async function enviarTodasLasCredenciales() {
    if (!credencialesListas.length) return
    const confirmado = await confirmar({
      titulo: 'Enviar credenciales digitales',
      descripcion: `Se despacharán ${credencialesListas.length} credenciales con código QR y pase de Google Wallet a los graduados confirmados.`,
      textoConfirmar: 'Enviar todas las credenciales',
      tipo: 'exito',
    })
    if (!confirmado) return
    setProcesando('lote-credenciales')
    setAviso('')
    let enviados = 0
    let fallidos = 0
    for (const graduado of credencialesListas) {
      try {
        await enviarCredencialCeremonia(graduado.id)
        enviados += 1
      } catch {
        fallidos += 1
      }
    }
    setProcesando(null)
    setAviso(`${enviados} credenciales digitales enviadas exitosamente.`)
    await cargar()
  }

  async function guardarYEnviarCorreo(evento) {
    evento.preventDefault()
    if (!editandoCorreo || !nuevoCorreo.trim() || !nuevoCorreo.includes('@')) {
      setError('Ingresá un correo electrónico válido.')
      return
    }
    setGuardandoCorreo(true)
    setError('')
    try {
      await actualizarGraduado(editandoCorreo.id, { correo: nuevoCorreo.trim() })
      await enviarInvitacion(editandoCorreo.id)
      setAviso(`Correo guardado e invitación enviada a ${editandoCorreo.nombre} (${nuevoCorreo.trim()}).`)
      setEditandoCorreo(null)
      setNuevoCorreo('')
      await cargar()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el correo.')
    } finally {
      setGuardandoCorreo(false)
    }
  }

  const metricas = [
    { id: 'PENDIENTES', etiqueta: 'Por invitar', valor: pendientes.length, icono: Send, color: 'text-sky-600 bg-sky-50 border-sky-100' },
    { id: 'RESPUESTAS', etiqueta: 'Sin respuesta', valor: esperandoRespuesta.length, icono: Clock3, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { id: 'GRUPOS', etiqueta: 'Completando grupo', valor: completandoGrupo.length, icono: Users, color: 'text-violet-600 bg-violet-50 border-violet-100' },
    { id: 'CREDENCIALES', etiqueta: 'Credenciales listas', valor: credencialesListas.length, icono: CreditCard, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { id: 'SIN_CORREO', etiqueta: 'Requieren correo', valor: sinCorreo.length, icono: AlertCircle, color: 'text-rose-600 bg-rose-50 border-rose-100' },
  ]

  return (
    <>
      <section className="mx-auto w-full max-w-5xl font-sans space-y-5">
        {/* HEADER PRINCIPAL */}
        <header className="flex flex-col gap-4 border-b border-slate-150 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black uppercase tracking-wider">
                Fase 3 · Convocatoria Masiva
              </span>
              {ceremonia && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {ceremonia.nombre}
                </span>
              )}
            </div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Convocatoria & Comunicaciones</h2>
            <p className="mt-1 max-w-xl text-xs font-medium text-slate-500">
              Gestioná las invitaciones, seguí las respuestas en tiempo real y enviá recordatorios o accesos directos por WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavegar('gestion-graduados')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
            >
              <Users size={14} /> Ver padrón
            </button>

            {filtro === 'PENDIENTES' && pendientes.length > 0 && (
              <button
                onClick={enviarPendientes}
                disabled={Boolean(procesando)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-sky-600 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Send size={14} />
                {procesando === 'lote-invitaciones' ? 'Enviando...' : `Enviar todas las pendientes (${pendientes.length})`}
              </button>
            )}

            {filtro === 'RESPUESTAS' && esperandoRespuesta.length > 0 && (
              <button
                onClick={reenviarRecordatorioTodos}
                disabled={Boolean(procesando)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-500 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Mail size={14} />
                {procesando === 'lote-recordatorios' ? 'Reenviando...' : `Reenviar recordatorio a todos (${esperandoRespuesta.length})`}
              </button>
            )}

            {filtro === 'CREDENCIALES' && credencialesListas.length > 0 && (
              <button
                onClick={enviarTodasLasCredenciales}
                disabled={Boolean(procesando)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-500 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <CreditCard size={14} />
                {procesando === 'lote-credenciales' ? 'Enviando...' : `Enviar todas las credenciales (${credencialesListas.length})`}
              </button>
            )}

            <button
              onClick={() => onNavegar('preparacion-ceremonia')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-black text-white hover:bg-cyan-500 shadow-sm transition-all cursor-pointer"
            >
              <Armchair size={14} /> Paso 4: Butacas & Sala <ArrowRight size={13} />
            </button>
          </div>
        </header>

        {/* METRICAS Y TARJETAS INTERACTIVAS */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {metricas.map(({ id, etiqueta, valor, icono: Icono, color }) => (
            <button
              key={id}
              onClick={() => setFiltro(id)}
              className={`rounded-2xl border p-4 text-left transition-all cursor-pointer shadow-sm relative group ${
                filtro === id
                  ? 'bg-white ring-2 ring-sky-500 border-sky-400 shadow-md scale-[1.02]'
                  : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`grid h-8 w-8 place-items-center rounded-xl border ${color}`}>
                  <Icono size={16} />
                </span>
                {filtro === id && (
                  <span className="h-2 w-2 rounded-full bg-sky-500 ring-4 ring-sky-100" />
                )}
              </div>
              <strong className="mt-3 block text-2xl font-black text-slate-900">{valor}</strong>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
                {etiqueta}
              </span>
            </button>
          ))}
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* BARRA DE PESTAÑAS */}
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {FILTROS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setFiltro(item.id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-black transition cursor-pointer ${
                    filtro === item.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.etiqueta} ({listados[item.id].length})
                </button>
              ))}
            </div>

            <button
              onClick={cargar}
              disabled={cargando}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 cursor-pointer"
            >
              <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} /> Actualizar
            </button>
          </div>

          {/* MENSAJES DE ESTADO */}
          {aviso && (
            <div role="status" className="m-4 flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 animate-in fade-in duration-200 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{aviso}</span>
              </div>
              <button onClick={() => setAviso('')} className="opacity-70 hover:opacity-100 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          )}

          {error && (
            <div role="alert" className="m-4 flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 animate-in fade-in duration-200 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError('')} className="opacity-70 hover:opacity-100 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          )}

          {/* BANNER EXPLICATIVO SEGÚN LA PESTAÑA */}
          {filtro === 'RESPUESTAS' && esperandoRespuesta.length > 0 && (
            <div className="mx-4 mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5">
                <Clock3 size={16} className="text-amber-600 shrink-0" />
                <span>
                  Hay <strong>{esperandoRespuesta.length} graduados</strong> que ya recibieron su invitación pero aún no ingresaron a confirmar su asistencia.
                </span>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-lg shrink-0">
                Podés mandarles el link por WhatsApp o confirmarlos por ventanilla
              </span>
            </div>
          )}

          {/* LISTADO DINÁMICO */}
          {cargando ? (
            <div className="flex min-h-56 items-center justify-center gap-2 text-xs font-semibold text-slate-400">
              <RefreshCw size={16} className="animate-spin text-sky-500" /> Cargando estado de convocatoria...
            </div>
          ) : lista.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Mail size={24} />
              </div>
              <h3 className="text-sm font-black text-slate-800">
                {filtro === 'PENDIENTES' ? 'No hay invitaciones pendientes por enviar' :
                 filtro === 'RESPUESTAS' ? 'Todos los graduados invitados ya respondieron' :
                 filtro === 'GRUPOS' ? 'No hay graduados completando grupo actualmente' :
                 filtro === 'CREDENCIALES' ? 'No hay credenciales listas pendientes de envío' :
                 'Todos los graduados tienen correo electrónico registrado'}
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                {filtro === 'PENDIENTES' && esperandoRespuesta.length > 0
                  ? `Revisá la pestaña "Esperando respuesta (${esperandoRespuesta.length})" para hacer el seguimiento.`
                  : 'Esta sección se actualiza automáticamente a medida que los egresados interactúan con el sistema.'}
              </p>

              {filtro === 'PENDIENTES' && esperandoRespuesta.length > 0 && (
                <button
                  onClick={() => setFiltro('RESPUESTAS')}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-sky-600 transition cursor-pointer"
                >
                  Ver graduados sin respuesta ({esperandoRespuesta.length})
                </button>
              )}

              {filtro === 'SIN_CORREO' && (
                <button
                  onClick={() => onNavegar('gestion-graduados')}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-sky-600 transition cursor-pointer"
                >
                  <UserPlus size={14} /> Ir al padrón a cargar datos
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lista.map(graduado => {
                const ocupadoInvitacion = procesando === `invitacion-${graduado.id}`
                const ocupadoCredencial = procesando === `credencial-${graduado.id}`
                const ocupadoConfirmacion = procesando === `confirmar-${graduado.id}`
                const esCopiado = copiadoId === graduado.id

                return (
                  <article
                    key={graduado.id}
                    className="flex flex-col gap-3.5 p-4 sm:flex-row sm:items-center justify-between hover:bg-slate-50/70 transition-colors"
                  >
                    {/* INFO DEL GRADUADO */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 text-sm font-black text-white shadow-sm">
                        {graduado.nombre?.slice(0, 1)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="truncate text-sm font-black text-slate-900">{graduado.nombre}</h3>
                          {graduado.carrera && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              {graduado.carrera}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {graduado.correo ? (
                            <span className="font-mono text-slate-600">{graduado.correo}</span>
                          ) : (
                            <span className="text-rose-500 font-semibold">Sin correo registrado</span>
                          )}{' '}
                          · DNI {graduado.dni}
                        </p>

                        {/* DETALLES DE ESTADO */}
                        <div className="mt-1 flex items-center gap-3 text-[10px] font-bold text-slate-400">
                          {filtro === 'RESPUESTAS' && (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                              {graduado.invitacion_envios_count > 1 
                                ? `Invitado ${graduado.invitacion_envios_count} veces` 
                                : 'Invitación enviada'}
                            </span>
                          )}
                          {filtro === 'GRUPOS' && (
                            <span className="text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200/60">
                              {graduado.cantidad_invitados || 0} acompañante(s) · {graduado.asiento_id ? `Butaca ${graduado.asiento_id}` : 'Sin butaca'}
                            </span>
                          )}
                          {filtro === 'CREDENCIALES' && (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                              Asiento {graduado.asiento_id} · Listo para QR
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* BOTONES DE ACCIÓN DIRECTA */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* PESTAÑA: POR INVITAR */}
                      {filtro === 'PENDIENTES' && (
                        <>
                          <button
                            onClick={() => copiarEnlaceWhatsApp(graduado)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
                            title="Copiar enlace de acceso"
                          >
                            {esCopiado ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            <span>{esCopiado ? '¡Copiado!' : 'Copiar Link'}</span>
                          </button>
                          <button
                            onClick={() => enviarInvitacionIndividual(graduado)}
                            disabled={ocupadoInvitacion}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-sky-600 text-xs font-black text-white shadow-sm transition cursor-pointer disabled:opacity-50"
                          >
                            {ocupadoInvitacion ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                            <span>{ocupadoInvitacion ? 'Enviando...' : 'Enviar invitación'}</span>
                          </button>
                        </>
                      )}

                      {/* PESTAÑA: ESPERANDO RESPUESTA */}
                      {filtro === 'RESPUESTAS' && (
                        <>
                          <button
                            onClick={() => copiarEnlaceWhatsApp(graduado)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-xs font-bold text-slate-700 transition cursor-pointer shadow-xs"
                            title="Copiar link directo para enviar por WhatsApp"
                          >
                            {esCopiado ? <Check size={13} className="text-emerald-600" /> : <MessageSquare size={13} className="text-emerald-600" />}
                            <span>{esCopiado ? '¡Copiado!' : 'WhatsApp'}</span>
                          </button>

                          <button
                            onClick={() => enviarInvitacionIndividual(graduado, true)}
                            disabled={ocupadoInvitacion}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
                            title="Reenviar correo electrónico formal"
                          >
                            {ocupadoInvitacion ? <RefreshCw size={13} className="animate-spin text-sky-500" /> : <Mail size={13} />}
                            <span>Reenviar mail</span>
                          </button>

                          <button
                            onClick={() => confirmarAsistenciaManual(graduado)}
                            disabled={ocupadoConfirmacion}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-sm transition cursor-pointer disabled:opacity-50"
                            title="Confirmar asistencia presencial o telefónica"
                          >
                            {ocupadoConfirmacion ? <RefreshCw size={13} className="animate-spin" /> : <UserCheck size={13} />}
                            <span>Confirmar</span>
                          </button>

                          <button
                            onClick={() => abrirPortalEgresado(graduado)}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                            title="Abrir portal del egresado en nueva pestaña"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </>
                      )}

                      {/* PESTAÑA: COMPLETANDO GRUPO */}
                      {filtro === 'GRUPOS' && (
                        <>
                          <button
                            onClick={() => copiarEnlaceWhatsApp(graduado)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
                          >
                            {esCopiado ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            <span>Copiar link</span>
                          </button>
                          <button
                            onClick={() => abrirPortalEgresado(graduado)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition cursor-pointer"
                          >
                            <ExternalLink size={13} />
                            <span>Abrir portal</span>
                          </button>
                        </>
                      )}

                      {/* PESTAÑA: CREDENCIALES LISTAS */}
                      {filtro === 'CREDENCIALES' && (
                        <button
                          onClick={() => enviarCredencial(graduado)}
                          disabled={ocupadoCredencial}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black text-white shadow-sm transition cursor-pointer disabled:opacity-50"
                        >
                          {ocupadoCredencial ? <RefreshCw size={13} className="animate-spin" /> : <CreditCard size={13} />}
                          <span>{ocupadoCredencial ? 'Enviando...' : 'Enviar credencial QR'}</span>
                        </button>
                      )}

                      {/* PESTAÑA: REQUIEREN CORREO */}
                      {filtro === 'SIN_CORREO' && (
                        <button
                          onClick={() => {
                            setEditandoCorreo(graduado)
                            setNuevoCorreo('')
                            setError('')
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-sky-600 text-xs font-black text-white shadow-sm transition cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>Asignar correo</span>
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* MODAL PARA ASIGNAR CORREO DIRECTO */}
      {editandoCorreo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Asignar correo electrónico</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editandoCorreo.nombre} · DNI {editandoCorreo.dni}</p>
              </div>
              <button
                onClick={() => setEditandoCorreo(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={guardarYEnviarCorreo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Correo Electrónico</label>
                <input
                  type="email"
                  autoFocus
                  required
                  value={nuevoCorreo}
                  onChange={(e) => setNuevoCorreo(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none font-medium"
                />
              </div>

              <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-800 space-y-1">
                <p className="font-bold text-sky-900">Acción automática:</p>
                <p className="text-[11px] leading-relaxed">
                  Al guardar, el sistema asignará el correo al padrón e inmediatamente despachará la invitación de acceso formal.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditandoCorreo(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCorreo || !nuevoCorreo.trim()}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-sky-600 text-xs font-black text-white shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {guardandoCorreo ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>{guardandoCorreo ? 'Guardando...' : 'Guardar y Enviar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dialogoConfirmacion}
    </>
  )
}
