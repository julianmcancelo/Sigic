import { useEffect, useState } from 'react'
import { Activity, CalendarDays, ChevronRight, CircleAlert, Clock3, GraduationCap, MapPin, Radio, RefreshCw, TrendingUp, UsersRound, UserRoundCheck, UserRoundX, FileText } from 'lucide-react'
import { BASE, cabeceras, obtenerGraduados } from '../../servicios/api'
import { ModalActaCierre } from '../../componentes/ModalActaCierre'

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

function GraficoIngresos({ datos = [] }) {
  const maximo = Math.max(1, ...datos.map(item => Number(item.total) || 0))
  const puntos = datos.map((item, indice) => `${(indice / 23) * 100},${92 - ((Number(item.total) || 0) / maximo) * 72}`).join(' ')
  const total = datos.reduce((acumulado, item) => acumulado + (Number(item.total) || 0), 0)
  return <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">Tendencia de acreditaciones</h3><p className="text-[10px] font-semibold text-slate-500">Ingresos registrados por franja horaria.</p></div><span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-cyan-700"><TrendingUp size={12} /> {total} hoy</span></div>
    <div className="mt-4 h-44"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible" role="img" aria-label="Tendencia horaria de ingresos"><defs><linearGradient id="areaIngresos" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity=".38" /><stop offset="100%" stopColor="#22d3ee" stopOpacity="0" /></linearGradient></defs><path d={`M 0,92 L ${puntos} L 100,92 Z`} fill="url(#areaIngresos)" /><line x1="0" x2="100" y1="92" y2="92" stroke="#cbd5e1" strokeWidth=".7" /><line x1="0" x2="100" y1="56" y2="56" stroke="#e2e8f0" strokeWidth=".5" strokeDasharray="2 2" /><line x1="0" x2="100" y1="20" y2="20" stroke="#e2e8f0" strokeWidth=".5" strokeDasharray="2 2" /><polyline points={puntos} fill="none" stroke="#0891b2" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" /></svg></div>
    <div className="flex justify-between text-[9px] font-bold text-slate-400"><span>00 h</span><span>06 h</span><span>12 h</span><span>18 h</span><span>23 h</span></div>
  </article>
}

export function EstadoCeremonia({ onVolver, onNavegar }) {
  const [estado, setEstado] = useState(null)
  const [graduados, setGraduados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [actualizando, setActualizando] = useState(false)
  const [mostrarActa, setMostrarActa] = useState(false)

  async function cargar({ silencioso = false } = {}) {
    if (!silencioso) setCargando(true)
    setActualizando(true)
    try {
      const [respuestaStats, datosGraduados] = await Promise.all([
        fetch(`${BASE}/stats`, { headers: cabeceras() }),
        obtenerGraduados().catch(() => [])
      ])
      const datos = await respuestaStats.json()
      if (!respuestaStats.ok) throw new Error(datos.error || 'No se pudo consultar el estado de la ceremonia.')
      setEstado(datos)
      setGraduados(datosGraduados)
      setError('')
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
      <div className="flex items-center gap-2">
        <button onClick={() => setMostrarActa(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-sm transition cursor-pointer">
          <FileText size={13} /> Acta Oficial (PDF)
        </button>
        <button onClick={() => cargar()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 transition hover:border-sky-300 hover:text-sky-700 cursor-pointer"><RefreshCw size={13} className={actualizando ? 'animate-spin' : ''} />Actualizar</button>
        <button onClick={onVolver} className="rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white cursor-pointer">Volver</button>
      </div>
    </header>

    {error && <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700"><CircleAlert size={16} />{error}</div>}
    {cargando ? <div className="grid min-h-[360px] place-items-center rounded-3xl border border-slate-100 bg-white"><RefreshCw className="animate-spin text-sky-500" size={24} /></div> : !ceremonia ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><CalendarDays className="mx-auto text-slate-300" size={30} /><h2 className="mt-3 font-black text-slate-800">No hay una ceremonia activa</h2><p className="mx-auto mt-1 max-w-md text-xs font-semibold text-slate-500">Activá una ceremonia desde el módulo Ceremonias para comenzar a medir su operación.</p><button onClick={() => onNavegar('gestion-ceremonias')} className="mt-5 rounded-xl bg-sky-500 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white cursor-pointer">Gestionar ceremonias</button></div> : <>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#061a31] via-[#0b4f70] to-[#07162a] p-5 pb-14 text-white shadow-xl shadow-cyan-950/20 sm:p-7 sm:pb-16"><div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" /><div className="relative flex flex-wrap items-start justify-between gap-4"><div><span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${fase.clase}`}>{fase.etiqueta}</span><p className="mt-4 text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">Ceremonia de hoy en vivo</p><h2 className="mt-1 text-3xl font-black tracking-tight">{ceremonia.nombre}</h2><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-200"><span className="inline-flex items-center gap-1.5"><CalendarDays size={13} className="text-cyan-300" />{formatearFecha(ceremonia.fecha)}</span><span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-cyan-300" />{ceremonia.lugar || 'Lugar a definir'}</span></div></div><div className="rounded-2xl border border-cyan-300/20 bg-white/10 px-5 py-3 text-right backdrop-blur"><p className="flex items-center justify-end gap-1 text-[9px] font-black uppercase tracking-wider text-cyan-100"><Radio size={11} className="animate-pulse" /> En vivo</p><strong className="mt-1 block text-4xl font-black text-cyan-200 tabular-nums">{asistenciaConfirmada}</strong><span className="text-[10px] font-bold text-slate-200">acreditaciones · {estado.porcentajeAsistencia}%</span></div></div></section>

      <section className="relative z-10 -mt-8 grid gap-3 px-3 sm:grid-cols-2 sm:px-5 lg:grid-cols-4"><TarjetaMetrica icono={GraduationCap} etiqueta="Egresados" valor={estado.totalEgresados} detalle={`${estado.egresadosConfirmados} confirmados · ${estado.egresadosPendientes} pendientes`} tono="bg-sky-50 text-sky-600" /><TarjetaMetrica icono={UsersRound} etiqueta="Acompañantes" valor={estado.totalInvitados} detalle={`${estado.ausentes} aún sin acreditar`} tono="bg-violet-50 text-violet-600" /><TarjetaMetrica icono={UserRoundCheck} etiqueta="Grupos ingresados" valor={estado.gruposConIngreso} detalle={`${estado.presentes} personas acreditadas`} tono="bg-emerald-50 text-emerald-600" /><TarjetaMetrica icono={UserRoundX} etiqueta="Pendientes" valor={estado.ausentes} detalle={`${asistentesEsperados} personas registradas`} tono="bg-amber-50 text-amber-600" /></section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[.85fr_1.45fr_.8fr]"><article className="rounded-2xl border border-slate-100 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><h3 className="font-black text-slate-900">Métricas de operación</h3><p className="text-[10px] font-semibold text-slate-500">Estado de la convocatoria.</p></div><div className="grid grid-cols-2 divide-x divide-y divide-slate-100"><div className="p-4"><span className="text-[9px] font-black uppercase text-slate-400">Confirmación</span><strong className="mt-1 block text-xl font-black text-slate-900">{estado.totalEgresados ? Math.round((estado.egresadosConfirmados / estado.totalEgresados) * 100) : 0}%</strong></div><div className="p-4"><span className="text-[9px] font-black uppercase text-slate-400">Asistencia</span><strong className="mt-1 block text-xl font-black text-slate-900">{estado.porcentajeAsistencia}%</strong></div><div className="p-4"><span className="text-[9px] font-black uppercase text-slate-400">Sin ingreso</span><strong className="mt-1 block text-xl font-black text-slate-900">{estado.ausentes}</strong></div><div className="p-4"><span className="text-[9px] font-black uppercase text-slate-400">Actualización</span><strong className="mt-1 block text-xs font-black text-emerald-600">Activa</strong></div></div></article><GraficoIngresos datos={estado.ingresosPorHora} /><article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><h3 className="font-black text-slate-900">Ingresos por vínculo</h3><p className="text-[10px] font-semibold text-slate-500">Composición acreditada.</p><div className="mt-4 space-y-3">{estado.ingresosPorRelacion?.length ? estado.ingresosPorRelacion.map(item => <div key={item.relacion}><div className="flex justify-between text-[10px] font-bold text-slate-600"><span>{item.relacion}</span><span>{item.total}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max(8, (item.total / Math.max(1, estado.presentes)) * 100)}%` }} /></div></div>) : <p className="py-8 text-center text-xs font-semibold text-slate-400">Sin ingresos todavía.</p>}</div></article></section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_.75fr]"><article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="font-black text-slate-900">Actividad reciente</h3><p className="text-[10px] font-semibold text-slate-500">Últimas acreditaciones registradas.</p></div><button onClick={() => onNavegar('panel-reportes')} className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-sky-600 cursor-pointer">Ver reportes <ChevronRight size={13} /></button></div><div className="mt-3 divide-y divide-slate-100">{estado.ultimosIngresos?.length ? estado.ultimosIngresos.map(ingreso => <div key={ingreso.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><strong className="block truncate text-xs text-slate-800">{ingreso.nombre}</strong><span className="text-[10px] font-semibold text-slate-500">{ingreso.relacion || 'Acompañante'} de {ingreso.egresado}</span></div><span className="shrink-0 text-[10px] font-black text-emerald-600">{ingreso.hora}</span></div>) : <p className="py-8 text-center text-xs font-semibold text-slate-400">Todavía no se registraron ingresos.</p>}</div></article><article className="rounded-2xl border border-slate-100 bg-sky-50/60 p-4"><div className="flex items-center gap-2 text-sky-700"><Clock3 size={16} /><h3 className="text-xs font-black uppercase tracking-wider">Siguiente ceremonia</h3></div>{estado.proximaCeremonia ? <div className="mt-3"><strong className="block text-sm text-slate-900">{estado.proximaCeremonia.nombre}</strong><p className="mt-1 text-xs font-semibold text-slate-600">{formatearFecha(estado.proximaCeremonia.fecha)}</p><p className="text-xs font-semibold text-slate-500">{estado.proximaCeremonia.lugar || 'Lugar a definir'}</p><button onClick={() => onNavegar('gestion-ceremonias')} className="mt-4 text-[10px] font-black uppercase tracking-wider text-sky-700 cursor-pointer">Preparar ceremonia</button></div> : <p className="mt-3 text-xs font-semibold text-slate-500">No hay otra ceremonia programada.</p>}</article></section>

      {mostrarActa && (
        <ModalActaCierre
          ceremonia={ceremonia}
          graduados={graduados}
          onCerrar={() => setMostrarActa(false)}
        />
      )}
    </>}
  </div>
}
