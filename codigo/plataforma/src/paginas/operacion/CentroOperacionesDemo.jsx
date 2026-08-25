import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Armchair, CheckCircle2, ChevronRight, ClipboardCheck, Download, DoorOpen, Mail, RefreshCw, Smartphone, Users, X } from 'lucide-react'
import { obtenerCeremoniaActiva, obtenerGraduados, obtenerInvitados } from '../../servicios/api'

export function CentroOperacionesDemo({ onNavegar }) {
  const [datos, setDatos] = useState({ cargando: true, ceremonia: null, graduados: [], invitados: [] })
  const [pasoActivo, setPasoActivo] = useState(null)

  async function cargar() {
    setDatos(actual => ({ ...actual, cargando: true }))
    try {
      const [ceremonia, graduados, invitados] = await Promise.all([obtenerCeremoniaActiva(), obtenerGraduados(), obtenerInvitados()])
      setDatos({ cargando: false, ceremonia, graduados, invitados })
    } catch {
      setDatos(actual => ({ ...actual, cargando: false }))
    }
  }

  useEffect(() => {
    let activo = true
    Promise.all([obtenerCeremoniaActiva(), obtenerGraduados(), obtenerInvitados()])
      .then(([ceremonia, graduados, invitados]) => {
        if (activo) setDatos({ cargando: false, ceremonia, graduados, invitados })
      })
      .catch(() => {
        if (activo) setDatos(actual => ({ ...actual, cargando: false }))
      })
    return () => { activo = false }
  }, [])

  const { graduados, invitados } = datos
  const enviados = graduados.filter(item => item.invitacion_enviada).length
  const aceptados = graduados.filter(item => item.estado === 'ACEPTADO').length
  const listos = graduados.filter(item => item.estado_flujo === 'COMPLETO').length
  const conButaca = graduados.filter(item => item.asiento_id).length
  const propuestas = graduados.filter(item => item.estado_asignacion_butacas === 'PENDIENTE_REVISION').length
  const confirmados = graduados.filter(item => item.estado_asignacion_butacas === 'CONFIRMADA').length
  const credenciales = graduados.filter(item => item.credencial_enviada_en).length
  const pasos = [
    { titulo: 'Cargar graduados', detalle: `${graduados.length} registrados`, listo: graduados.length > 0, icono: Users, destino: 'gestion-graduados', accion: 'Gestionar padrón', descripcion: 'Personas registradas para la ceremonia.' },
    { titulo: 'Enviar invitaciones', detalle: `${enviados} de ${graduados.length} enviadas`, listo: graduados.length > 0 && enviados === graduados.length, icono: Mail, destino: 'convocatoria', accion: 'Enviar invitaciones', descripcion: 'Graduados que todavía deben recibir su acceso.' },
    { titulo: 'Revisar respuestas', detalle: `${aceptados} aceptaron participar`, listo: aceptados > 0, icono: CheckCircle2, destino: 'gestion-graduados', accion: 'Revisar respuestas', descripcion: 'Estado de participación de cada graduado.' },
    { titulo: 'Completar grupos', detalle: `${invitados.length} acompañantes cargados`, listo: aceptados > 0 && listos === aceptados, icono: ClipboardCheck, destino: 'gestion-graduados', accion: 'Completar grupos', descripcion: 'Grupos aceptados que aún tienen datos pendientes.' },
    { titulo: 'Revisar propuestas', detalle: `${propuestas} grupos esperan revisión`, listo: aceptados > 0 && propuestas === 0, icono: Armchair, destino: 'gestion-graduados', accion: 'Revisar propuestas', descripcion: 'Propuestas de ubicación pendientes de revisión.' },
    { titulo: 'Confirmar butacas', detalle: `${confirmados}/${aceptados} grupos confirmados`, listo: aceptados > 0 && confirmados === aceptados && conButaca >= confirmados, icono: CheckCircle2, destino: 'gestion-graduados', accion: 'Confirmar butacas', descripcion: 'Grupos aceptados sin ubicación definitiva.' },
    { titulo: 'Enviar credenciales', detalle: `${credenciales}/${confirmados} enviadas`, listo: confirmados > 0 && credenciales === confirmados, icono: Mail, destino: 'convocatoria', accion: 'Enviar credenciales', descripcion: 'Credenciales listas para generar y enviar.' },
    { titulo: 'Controlar ingresos', detalle: datos.ceremonia?.estado === 'EN_VIVO' ? 'Ceremonia en vivo' : 'Ceremonia fuera de línea', listo: datos.ceremonia?.estado === 'FINALIZADA', icono: DoorOpen, destino: 'control-ingreso', accion: 'Abrir acreditación', descripcion: 'Invitados y graduados para acreditar.' },
  ]
  const proximo = pasos.find(item => !item.listo) || pasos.at(-1)
  const indiceActivo = pasoActivo === null ? -1 : pasoActivo

  if (indiceActivo >= 0) {
    const paso = pasos[indiceActivo]
    const Icono = paso.icono
    const porcentaje = Math.round(((indiceActivo + 1) / pasos.length) * 100)
    const colecciones = [
      graduados,
      graduados.filter(item => !item.invitacion_enviada),
      graduados.filter(item => item.invitacion_enviada),
      graduados.filter(item => item.estado === 'ACEPTADO' && item.estado_flujo !== 'COMPLETO'),
      graduados.filter(item => item.estado_asignacion_butacas === 'PENDIENTE_REVISION'),
      graduados.filter(item => item.estado === 'ACEPTADO' && item.estado_asignacion_butacas !== 'CONFIRMADA'),
      graduados.filter(item => item.estado_asignacion_butacas === 'CONFIRMADA' && !item.credencial_enviada_en),
      invitados.filter(item => !item.presente),
    ]
    const pendientes = colecciones[indiceActivo] || []

    return <div className="mx-auto max-w-4xl pb-8 font-sans">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><span className="h-3 w-3 rounded-full bg-sky-500" /><div className="min-w-0"><p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Asistente de operaciones · Paso {indiceActivo + 1} de {pasos.length}</p><p className="truncate text-xs font-black text-slate-800">{paso.titulo}</p></div></div>
          <button type="button" onClick={() => setPasoActivo(null)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700" aria-label="Cerrar paso"><X size={17} /></button>
        </header>

        <div className="h-1.5 bg-slate-100"><div className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all" style={{ width: `${porcentaje}%` }} /></div>

        <main className="p-6 sm:p-8">
          <div className="flex items-center gap-4"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${paso.listo ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}>{paso.listo ? <CheckCircle2 size={24} /> : <Icono size={24} />}</span><div className="min-w-0"><p className={`text-[9px] font-black uppercase tracking-[0.18em] ${paso.listo ? 'text-emerald-600' : 'text-sky-600'}`}>{paso.listo ? 'Completado' : 'Pendiente'}</p><h2 className="truncate text-xl font-black text-slate-900">{paso.titulo}</h2></div><strong className="ml-auto hidden text-sm text-slate-500 sm:block">{paso.detalle}</strong></div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3"><p className="text-xs font-bold text-slate-600">{paso.descripcion}</p><span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-slate-500">{pendientes.length}</span></div>
            <div className="divide-y divide-slate-100">{pendientes.slice(0, 5).map((item, indice) => <div key={item.id || indice} className="flex items-center gap-3 px-4 py-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[9px] font-black text-slate-500">{(item.nombre || item.nombre_completo || '?').charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-700">{item.nombre || item.nombre_completo || `Registro ${indice + 1}`}</span><span className="text-[9px] font-bold uppercase text-slate-400">{item.estado_flujo || item.estado || (item.presente ? 'Ingresó' : 'Pendiente')}</span></div>)}{pendientes.length === 0 && <div className="grid place-items-center px-4 py-10 text-center"><CheckCircle2 size={24} className="text-emerald-500" /><p className="mt-2 text-xs font-bold text-slate-500">No hay pendientes</p></div>}</div>
          </div>

          <button type="button" onClick={() => onNavegar(paso.destino)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-sky-700">{paso.accion}<ChevronRight size={16} /></button>
        </main>

        <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6"><button type="button" onClick={() => indiceActivo > 0 ? setPasoActivo(indiceActivo - 1) : setPasoActivo(null)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100"><ArrowLeft size={14} />{indiceActivo > 0 ? 'Anterior' : 'Recorrido'}</button><div className="flex gap-1.5">{pasos.map((_, indice) => <button type="button" key={indice} onClick={() => setPasoActivo(indice)} aria-label={`Abrir paso ${indice + 1}`} className={`h-1.5 rounded-full transition-all ${indice === indiceActivo ? 'w-5 bg-sky-500' : 'w-1.5 bg-slate-200'}`} />)}</div>{indiceActivo < pasos.length - 1 ? <button type="button" onClick={() => setPasoActivo(indiceActivo + 1)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-black uppercase text-slate-700 hover:bg-slate-100">Siguiente<ArrowRight size={14} /></button> : <button type="button" onClick={() => setPasoActivo(null)} className="rounded-lg px-3 py-2 text-[10px] font-black uppercase text-emerald-600 hover:bg-emerald-50">Finalizar</button>}</footer>
      </section>
    </div>
  }

  return <div className="mx-auto max-w-5xl pb-8 font-sans">
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-4">
      <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-600">Demo guiada</p><h2 className="mt-1 text-xl font-black text-slate-900">Centro de operaciones</h2><p className="mt-1 text-xs text-slate-500">{datos.ceremonia?.nombre || 'Ceremonia activa'} · avanzá una etapa por vez.</p></div>
      <button onClick={cargar} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"><RefreshCw size={13} className={datos.cargando ? 'animate-spin' : ''} /> Actualizar</button>
    </header>

    <section className="mb-4 rounded-2xl bg-slate-950 p-4 text-white sm:flex sm:items-center sm:justify-between">
      <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">Siguiente acción</p><h3 className="mt-1 text-base font-black">{proximo.titulo}</h3><p className="mt-1 text-xs text-slate-400">{proximo.detalle}</p></div>
      <button onClick={() => setPasoActivo(pasos.indexOf(proximo))} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-950 sm:mt-0">Abrir guía <ChevronRight size={14} /></button>
    </section>

    <section className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50/70 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-600 text-white"><Smartphone size={18} /></span>
        <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-sky-700">App de portería</p><p className="text-xs font-black text-slate-800">APK Android v1.0.3 · Shorebird activo</p><p className="text-[10px] text-slate-500">Instalación directa para dispositivos de control de acceso.</p></div>
      </div>
      <a href="/descargas/SIGIC-Porteria-1.0.4.apk" download className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-sky-700"><Download size={14} /> Descargar APK</a>
    </section>

    <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {pasos.map((paso, indice) => { const Icono = paso.icono; return <button key={paso.titulo} onClick={() => setPasoActivo(indice)} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md">
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${paso.listo ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>{paso.listo ? <CheckCircle2 size={18} /> : <Icono size={18} />}</span>
        <span className="min-w-0 flex-1"><span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Paso {indice + 1}</span><span className="block truncate text-xs font-black text-slate-800">{paso.titulo}</span><span className="block truncate text-[10px] text-slate-500">{paso.detalle}</span></span><ChevronRight size={15} className="text-slate-300 group-hover:text-sky-500" />
      </button> })}
    </section>
  </div>
}
