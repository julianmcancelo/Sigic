import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock3, CreditCard, Mail, RefreshCw, Send, UserPlus, Users } from 'lucide-react'
import { enviarCredencialCeremonia, enviarInvitacion, obtenerGraduados } from '../../servicios/api'
import { useConfirmacion } from '../../componentes/ModalConfirmacion'

const FILTROS = [
  { id: 'PENDIENTES', etiqueta: 'Por invitar' },
  { id: 'RESPUESTAS', etiqueta: 'Esperando respuesta' },
  { id: 'GRUPOS', etiqueta: 'Completando grupo' },
  { id: 'CREDENCIALES', etiqueta: 'Credenciales listas' },
  { id: 'SIN_CORREO', etiqueta: 'Sin correo' },
]

export function GestionConvocatoria({ onNavegar }) {
  const { confirmar, dialogoConfirmacion } = useConfirmacion()
  const [graduados, setGraduados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(null)
  const [filtro, setFiltro] = useState('PENDIENTES')
  const [aviso, setAviso] = useState('')
  const [error, setError] = useState('')

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      setGraduados(await obtenerGraduados())
    } catch (err) {
      setError(err.message || 'No se pudo cargar la convocatoria.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const pendientes = graduados.filter(item => !item.invitacion_enviada && item.estado_flujo !== 'RECHAZADO' && item.correo)
  const sinCorreo = graduados.filter(item => !item.correo && item.estado_flujo !== 'RECHAZADO')
  const esperandoRespuesta = graduados.filter(item => item.invitacion_enviada && item.estado_flujo === 'PENDIENTE')
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

  async function enviarInvitacionIndividual(graduado) {
    setProcesando(`invitacion-${graduado.id}`)
    setAviso('')
    try {
      await enviarInvitacion(graduado.id)
      setAviso(`La invitación fue enviada a ${graduado.nombre}.`)
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
      descripcion: `Se enviarán ${pendientes.length} invitaciones por correo electrónico.`,
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
    setAviso(fallidos ? `${enviados} invitaciones enviadas y ${fallidos} pendientes para reintentar.` : `${enviados} invitaciones enviadas correctamente.`)
    await cargar()
  }

  async function enviarCredencial(graduado) {
    setProcesando(`credencial-${graduado.id}`)
    setAviso('')
    try {
      const respuesta = await enviarCredencialCeremonia(graduado.id)
      setAviso(respuesta.googleWallet
        ? `Credencial enviada a ${graduado.nombre} con acceso a Google Wallet.`
        : `Credencial enviada a ${graduado.nombre}.`)
      await cargar()
    } catch (err) {
      setError(err.message || 'No se pudo enviar la credencial.')
    } finally {
      setProcesando(null)
    }
  }

  const metricas = [
    { etiqueta: 'Por invitar', valor: pendientes.length, icono: Send, color: 'text-sky-600 bg-sky-50' },
    { etiqueta: 'Sin respuesta', valor: esperandoRespuesta.length, icono: Clock3, color: 'text-amber-600 bg-amber-50' },
    { etiqueta: 'Completando grupo', valor: completandoGrupo.length, icono: Users, color: 'text-violet-600 bg-violet-50' },
    { etiqueta: 'Credenciales listas', valor: credencialesListas.length, icono: CreditCard, color: 'text-indigo-600 bg-indigo-50' },
    { etiqueta: 'Requieren correo', valor: sinCorreo.length, icono: AlertCircle, color: 'text-rose-600 bg-rose-50' },
  ]

  return <>
  <section className="mx-auto w-full max-w-5xl font-sans">
    <header className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[.18em] text-sky-600">Ceremonia activa</p>
        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">Convocatoria</h2>
        <p className="mt-1 max-w-xl text-sm text-slate-500">Gestioná comunicaciones y seguí las respuestas sin mezclar esta tarea con la edición del padrón.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onNavegar('gestion-graduados')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Users size={14} /> Ver padrón</button>
        <button onClick={enviarPendientes} disabled={!pendientes.length || Boolean(procesando)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-45"><Send size={14} />{procesando === 'lote-invitaciones' ? 'Enviando...' : `Enviar pendientes (${pendientes.length})`}</button>
      </div>
    </header>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {metricas.map(({ etiqueta, valor, icono: Icono, color }) => <article key={etiqueta} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><span className={`grid h-8 w-8 place-items-center rounded-xl ${color}`}><Icono size={16} /></span><strong className="mt-4 block text-2xl font-black text-slate-900">{valor}</strong><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{etiqueta}</span></article>)}
    </div>

    <div className="mt-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {FILTROS.map(item => <button key={item.id} onClick={() => setFiltro(item.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black transition ${filtro === item.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{item.etiqueta} ({listados[item.id].length})</button>)}
        </div>
        <button onClick={cargar} disabled={cargando} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600"><RefreshCw size={14} className={cargando ? 'animate-spin' : ''} /> Actualizar</button>
      </div>

      {aviso && <p role="status" className="m-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><CheckCircle2 size={15} />{aviso}</p>}
      {error && <p role="alert" className="m-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800"><AlertCircle size={15} />{error}</p>}

      {cargando ? <div className="flex min-h-56 items-center justify-center gap-2 text-xs font-semibold text-slate-400"><RefreshCw size={16} className="animate-spin" /> Cargando convocatoria...</div> : lista.length === 0 ? <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center"><Mail size={30} className="mb-3 text-slate-200" /><h3 className="text-sm font-black text-slate-700">No hay acciones pendientes</h3><p className="mt-1 max-w-sm text-xs text-slate-400">Esta sección se actualiza cuando haya personas que convocar, respuestas por seguir o credenciales para enviar.</p>{filtro === 'SIN_CORREO' && <button onClick={() => onNavegar('gestion-graduados')} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"><UserPlus size={14} /> Completar datos</button>}</div> : <div className="divide-y divide-slate-100">
        {lista.map(graduado => {
          const esInvitacion = filtro === 'PENDIENTES'
          const esCredencial = filtro === 'CREDENCIALES'
          const accion = esInvitacion ? () => enviarInvitacionIndividual(graduado) : esCredencial ? () => enviarCredencial(graduado) : () => onNavegar('gestion-graduados')
          const etiqueta = esInvitacion ? 'Enviar invitación' : esCredencial ? 'Enviar credencial' : filtro === 'SIN_CORREO' ? 'Editar datos' : 'Ver graduado'
          const ocupado = procesando === `invitacion-${graduado.id}` || procesando === `credencial-${graduado.id}`
          return <article key={graduado.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-500 text-sm font-black text-white">{graduado.nombre?.slice(0, 1)?.toUpperCase() || '?'}</div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-black text-slate-800">{graduado.nombre}</h3><p className="mt-0.5 truncate text-xs text-slate-400">{graduado.correo || 'Sin correo registrado'} · DNI {graduado.dni}</p></div><span className="text-[10px] font-bold text-slate-400">{graduado.estado_flujo?.replaceAll('_', ' ') || 'SIN ESTADO'}</span><button onClick={accion} disabled={ocupado} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-sky-600 disabled:opacity-50">{ocupado ? <RefreshCw size={14} className="animate-spin" /> : esCredencial ? <CreditCard size={14} /> : <Send size={14} />}{ocupado ? 'Enviando...' : etiqueta}</button></article>
        })}
      </div>}
    </div>
  </section>
  {dialogoConfirmacion}
  </>
}
