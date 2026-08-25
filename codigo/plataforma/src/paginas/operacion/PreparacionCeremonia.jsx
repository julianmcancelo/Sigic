import { useEffect, useState } from 'react'
import { AlertCircle, Armchair, CheckCircle2, ClipboardCheck, LoaderCircle, Play, Send, Users } from 'lucide-react'
import { actualizarEstadoCeremonia, obtenerCeremoniaActiva, obtenerGraduados, obtenerInvitados } from '../../servicios/api'

export function PreparacionCeremonia({ onNavegar }) {
  const [datos, setDatos] = useState({ ceremonia: null, graduados: [], invitados: [] })
  const [cargando, setCargando] = useState(true)
  const [abriendo, setAbriendo] = useState(false)
  const [mensaje, setMensaje] = useState('')

  async function cargar() {
    setCargando(true)
    setMensaje('')
    try {
      const [ceremonia, graduados, invitados] = await Promise.all([obtenerCeremoniaActiva(), obtenerGraduados(), obtenerInvitados()])
      setDatos({ ceremonia, graduados, invitados })
    } catch (error) {
      setMensaje(error.message || 'No se pudo cargar la preparación de la ceremonia.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const aceptados = datos.graduados.filter(item => item.estado === 'ACEPTADO')
  const conGrupoCompleto = aceptados.filter(item => item.estado_flujo === 'COMPLETO')
  const pendientesRevision = aceptados.filter(item => item.estado_asignacion_butacas === 'PENDIENTE_REVISION')
  const confirmados = aceptados.filter(item => item.estado_asignacion_butacas === 'CONFIRMADA' && item.asiento_id)
  const sinUbicacion = aceptados.filter(item => !item.asiento_id || item.estado_asignacion_butacas !== 'CONFIRMADA')
  const credencialesPendientes = confirmados.filter(item => !item.credencial_enviada_en)
  const listoParaVivo = aceptados.length > 0 && sinUbicacion.length === 0

  async function abrirAcreditacion() {
    if (!datos.ceremonia || !listoParaVivo) return
    setAbriendo(true)
    setMensaje('')
    try {
      await actualizarEstadoCeremonia(datos.ceremonia.id, 'EN_VIVO')
      onNavegar('control-ingreso')
    } catch (error) {
      setMensaje(error.message || 'No se pudo abrir la acreditación.')
    } finally {
      setAbriendo(false)
    }
  }

  const controles = [
    { titulo: 'Grupos completos', detalle: `${conGrupoCompleto.length} de ${aceptados.length} grupos aceptados completaron sus datos.`, listo: aceptados.length > 0 && conGrupoCompleto.length === aceptados.length, icono: Users, destino: 'gestion-graduados', accion: 'Revisar grupos' },
    { titulo: 'Propuestas por revisar', detalle: pendientesRevision.length ? `${pendientesRevision.length} grupo(s) esperan confirmación administrativa.` : 'No hay propuestas pendientes.', listo: pendientesRevision.length === 0, icono: ClipboardCheck, destino: 'gestion-graduados', accion: 'Revisar butacas' },
    { titulo: 'Butacas confirmadas', detalle: `${confirmados.length} de ${aceptados.length} grupos tienen ubicación definitiva.`, listo: aceptados.length > 0 && confirmados.length === aceptados.length, icono: Armchair, destino: 'gestion-graduados', accion: 'Asignar butacas' },
    { titulo: 'Credenciales', detalle: credencialesPendientes.length ? `${credencialesPendientes.length} credencial(es) listas para comunicar.` : 'Todas las credenciales confirmadas fueron enviadas.', listo: credencialesPendientes.length === 0, icono: Send, destino: 'convocatoria', accion: 'Abrir convocatoria' },
  ]

  return <section className="mx-auto w-full max-w-5xl font-sans">
    <header className="mb-5 rounded-2xl bg-slate-950 px-5 py-5 text-white shadow-lg sm:flex sm:items-end sm:justify-between sm:px-7">
      <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Etapa 5 · Preparación</p><h2 className="mt-1 text-xl font-black">Revisión final de ceremonia</h2><p className="mt-1 text-sm text-slate-300">{datos.ceremonia?.nombre || 'Ceremonia activa'} · Antes de abrir la acreditación.</p></div>
      <button onClick={cargar} disabled={cargando} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-50 sm:mt-0"><LoaderCircle size={14} className={cargando ? 'animate-spin' : ''} /> Actualizar</button>
    </header>

    {mensaje && <p role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800"><AlertCircle size={15} />{mensaje}</p>}
    {cargando ? <div className="grid min-h-72 place-items-center text-sm font-semibold text-slate-400"><span className="inline-flex items-center gap-2"><LoaderCircle size={18} className="animate-spin" /> Preparando controles...</span></div> : !datos.ceremonia ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><AlertCircle className="mx-auto mb-3 text-amber-500" /><h3 className="font-black text-slate-800">No hay una ceremonia activa</h3><p className="mt-1 text-sm text-slate-500">Activá una ceremonia para continuar con la preparación.</p><button onClick={() => onNavegar('gestion-ceremonias')} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white">Ir a ceremonias</button></div> : <>
      <div className="grid gap-3 md:grid-cols-2">{controles.map(({ titulo, detalle, listo, icono: Icono, destino, accion }) => <article key={titulo} className={`rounded-2xl border p-5 ${listo ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-100 bg-white shadow-sm'}`}><div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${listo ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}><Icono size={18} /></span>{listo ? <CheckCircle2 size={19} className="text-emerald-500" /> : <AlertCircle size={19} className="text-amber-500" />}</div><h3 className="mt-4 text-sm font-black text-slate-900">{titulo}</h3><p className="mt-1 min-h-10 text-xs leading-relaxed text-slate-500">{detalle}</p><button onClick={() => onNavegar(destino)} className="mt-3 text-xs font-black text-sky-700 hover:text-sky-900">{accion}</button></article>)}</div>
      <footer className={`mt-5 rounded-2xl border p-5 sm:flex sm:items-center sm:justify-between ${listoParaVivo ? 'border-emerald-200 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}><div><p className={`text-[10px] font-black uppercase tracking-[.18em] ${listoParaVivo ? 'text-emerald-700' : 'text-amber-700'}`}>{listoParaVivo ? 'Preparación completada' : 'Preparación pendiente'}</p><h3 className="mt-1 text-base font-black text-slate-900">{listoParaVivo ? 'La ceremonia está lista para acreditar.' : `Faltan ${sinUbicacion.length} grupo(s) con butacas por confirmar.`}</h3><p className="mt-1 text-xs text-slate-600">Al abrir la acreditación, la ceremonia quedará en estado En vivo.</p></div><button onClick={abrirAcreditacion} disabled={!listoParaVivo || abriendo} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 sm:mt-0">{abriendo ? <LoaderCircle size={15} className="animate-spin" /> : <Play size={15} />}{abriendo ? 'Abriendo...' : 'Abrir acreditación'}</button></footer>
    </>}
  </section>
}
