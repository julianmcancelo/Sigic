import { useEffect, useState } from 'react'
import { Activity, CalendarDays, ChevronRight, CircleAlert, Clock3, GraduationCap, MapPin, RefreshCw, UsersRound, UserRoundCheck, UserRoundX } from 'lucide-react'
import { BASE, cabeceras } from '../../servicios/api'

const intervaloActualizacion = 15000

function estadoDeFecha(fecha) {
  if (!fecha) return { etiqueta: 'Sin fecha', clase: 'bg-slate-100 text-slate-600' }
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const fechaCeremonia = new Date(`${String(fecha).slice(0, 10)}T00:00:00`)
  if (fechaCeremonia.getTime() === hoy.getTime()) return { etiqueta: 'En curso hoy', clase: 'bg-emerald-100 text-emerald-700' }
  if (fechaCeremonia > hoy) return { etiqueta: 'Próxima ceremonia', clase: 'bg-sky-100 text-sky-700' }
  return { etiqueta: 'Ceremonia finalizada', clase: 'bg-slate-100 text-slate-600' }
}

function formatearFecha(fecha) {
  if (!fecha) return 'Fecha a definir'
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${String(fecha).slice(0, 10)}T12:00:00`))
}

function TarjetaMetrica({ icono: Icono, etiqueta, valor, detalle, tono }) {
  return <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{etiqueta}</p><strong className="mt-1 block text-2xl font-black tracking-tight text-slate-900 tabular-nums">{valor}</strong></div><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tono}`}><Icono size={17} /></span></div>
    <p className="mt-2 text-[11px] font-semibold text-slate-500">{detalle}</p>
  </article>
}

export function EstadoCeremonia({ onVolver, onNavegar }) {
  const [estado, setEstado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [actualizando, setActualizando] = useState(false)

  async function cargar({ silencioso = false } = {}) {
    if (!silencioso) setCargando(true)
    setActualizando(true)
    try {
      const respuesta = await fetch(`${BASE}/stats`, { headers: cabeceras() })
      const datos = await respuesta.json()
      if (!respuesta.ok) throw new Error(datos.error || 'No se pudo consultar el estado de la ceremonia.')
      setEstado(datos); setError('')
    } catch (err) { setError(err.message || 'No se pudo actualizar el tablero.') }
    finally { setCargando(false); setActualizando(false) }
  }

  useEffect(() => {
    cargar()
    const timer = window.setInterval(() => cargar({ silencioso: true }), intervaloActualizacion)
    return () => window.clearInterval(timer)
  }, [])

  const ceremonia = estado?.ceremonia
  const fase = estadoDeFecha(ceremonia?.fecha)
  const asistentesEsperados = (estado?.totalEgresados || 0) + (estado?.totalInvitados || 0)
  const asistenciaConfirmada = estado?.presentes || 0

  return <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
    <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300 shadow-lg shadow-slate-900/15"><Activity size={20} /></div><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-600">Operación en vivo</p><h1 className="text-xl font-black tracking-tight text-slate-900">Estado de la ceremonia</h1><p className="mt-0.5 text-xs font-semibold text-slate-500">Tablero operativo actualizado automáticamente cada 15 segundos.</p></div></div>
      <div className="flex items-center gap-2"><button onClick={() => cargar()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 transition hover:border-sky-300 hover:text-sky-700"><RefreshCw size={13} className={actualizando ? 'animate-spin' : ''} />Actualizar</button><button onClick={onVolver} className="rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white">Volver</button></div>
    </header>

    {error && <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700"><CircleAlert size={16} />{error}</div>}
    {cargando ? <div className="grid min-h-[360px] place-items-center rounded-3xl border border-slate-100 bg-white"><RefreshCw className="animate-spin text-sky-500" size={24} /></div> : !ceremonia ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><CalendarDays className="mx-auto text-slate-300" size={30} /><h2 className="mt-3 font-black text-slate-800">No hay una ceremonia activa</h2><p className="mx-auto mt-1 max-w-md text-xs font-semibold text-slate-500">Activá una ceremonia desde el módulo Ceremonias para comenzar a medir su operación.</p><button onClick={() => onNavegar('gestion-ceremonias')} className="mt-5 rounded-xl bg-sky-500 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white">Gestionar ceremonias</button></div> : <>
      <section className="overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/15 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${fase.clase}`}>{fase.etiqueta}</span><h2 className="mt-3 text-2xl font-black tracking-tight">{ceremonia.nombre}</h2><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-300"><span className="inline-flex items-center gap-1.5"><CalendarDays size={13} className="text-cyan-300" />{formatearFecha(ceremonia.fecha)}</span><span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-cyan-300" />{ceremonia.lugar || 'Lugar a definir'}</span></div></div><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Asistencia acreditada</p><strong className="mt-1 block text-3xl font-black text-cyan-300 tabular-nums">{estado.porcentajeAsistencia}%</strong><span className="text-[10px] font-bold text-slate-400">{asistenciaConfirmada} acompañantes acreditados</span></div></div></section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><TarjetaMetrica icono={GraduationCap} etiqueta="Egresados" valor={estado.totalEgresados} detalle={`${estado.egresadosConfirmados} confirmados · ${estado.egresadosPendientes} pendientes`} tono="bg-sky-50 text-sky-600" /><TarjetaMetrica icono={UsersRound} etiqueta="Acompañantes" valor={estado.totalInvitados} detalle={`${estado.ausentes} aún sin acreditar`} tono="bg-violet-50 text-violet-600" /><TarjetaMetrica icono={UserRoundCheck} etiqueta="Ingresos" valor={estado.presentes} detalle={`${estado.gruposConIngreso} grupos con asistencia`} tono="bg-emerald-50 text-emerald-600" /><TarjetaMetrica icono={UserRoundX} etiqueta="Pendientes" valor={estado.ausentes} detalle={`${asistentesEsperados} personas registradas`} tono="bg-amber-50 text-amber-600" /></section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_.75fr]"><article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="font-black text-slate-900">Últimos ingresos</h3><p className="text-[10px] font-semibold text-slate-500">Acreditaciones registradas en la ceremonia activa.</p></div><button onClick={() => onNavegar('panel-reportes')} className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-sky-600">Ver reportes <ChevronRight size={13} /></button></div><div className="mt-3 divide-y divide-slate-100">{estado.ultimosIngresos?.length ? estado.ultimosIngresos.map(ingreso => <div key={ingreso.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><strong className="block truncate text-xs text-slate-800">{ingreso.nombre}</strong><span className="text-[10px] font-semibold text-slate-500">{ingreso.relacion || 'Acompañante'} de {ingreso.egresado}</span></div><span className="shrink-0 text-[10px] font-black text-emerald-600">{ingreso.hora}</span></div>) : <p className="py-8 text-center text-xs font-semibold text-slate-400">Todavía no se registraron ingresos.</p>}</div></article>
      <article className="rounded-2xl border border-slate-100 bg-sky-50/60 p-4"><div className="flex items-center gap-2 text-sky-700"><Clock3 size={16} /><h3 className="text-xs font-black uppercase tracking-wider">Siguiente ceremonia</h3></div>{estado.proximaCeremonia ? <div className="mt-3"><strong className="block text-sm text-slate-900">{estado.proximaCeremonia.nombre}</strong><p className="mt-1 text-xs font-semibold text-slate-600">{formatearFecha(estado.proximaCeremonia.fecha)}</p><p className="text-xs font-semibold text-slate-500">{estado.proximaCeremonia.lugar || 'Lugar a definir'}</p><button onClick={() => onNavegar('gestion-ceremonias')} className="mt-4 text-[10px] font-black uppercase tracking-wider text-sky-700">Preparar ceremonia</button></div> : <p className="mt-3 text-xs font-semibold text-slate-500">No hay otra ceremonia programada.</p>}</article></section>
    </>}
  </div>
}
