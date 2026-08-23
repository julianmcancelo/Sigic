import { useEffect, useState } from 'react'
import { Armchair, CheckCircle2, ChevronRight, ClipboardCheck, DoorOpen, Mail, RefreshCw, Users } from 'lucide-react'
import { obtenerCeremoniaActiva, obtenerGraduados, obtenerInvitados } from '../../servicios/api'

export function CentroOperacionesDemo({ onNavegar }) {
  const [datos, setDatos] = useState({ cargando: true, ceremonia: null, graduados: [], invitados: [] })

  async function cargar() {
    setDatos(actual => ({ ...actual, cargando: true }))
    try {
      const [ceremonia, graduados, invitados] = await Promise.all([obtenerCeremoniaActiva(), obtenerGraduados(), obtenerInvitados()])
      setDatos({ cargando: false, ceremonia, graduados, invitados })
    } catch {
      setDatos(actual => ({ ...actual, cargando: false }))
    }
  }

  useEffect(() => { cargar() }, [])

  const { graduados, invitados } = datos
  const enviados = graduados.filter(item => item.invitacion_enviada).length
  const aceptados = graduados.filter(item => item.estado === 'ACEPTADO').length
  const listos = graduados.filter(item => item.estado_flujo === 'COMPLETO').length
  const conButaca = graduados.filter(item => item.asiento_id).length
  const pasos = [
    { titulo: 'Cargar graduados', detalle: `${graduados.length} registrados`, listo: graduados.length > 0, icono: Users, destino: 'gestion-graduados' },
    { titulo: 'Enviar invitaciones', detalle: `${enviados} de ${graduados.length} enviadas`, listo: graduados.length > 0 && enviados === graduados.length, icono: Mail, destino: 'gestion-graduados' },
    { titulo: 'Revisar respuestas', detalle: `${aceptados} aceptaron participar`, listo: aceptados > 0, icono: CheckCircle2, destino: 'gestion-graduados' },
    { titulo: 'Completar grupos', detalle: `${invitados.length} acompañantes cargados`, listo: aceptados > 0 && invitados.length > 0, icono: ClipboardCheck, destino: 'gestion-graduados' },
    { titulo: 'Asignar butacas', detalle: `${conButaca} graduados ubicados · ${listos} listos`, listo: listos > 0 && conButaca >= listos, icono: Armchair, destino: 'gestion-graduados' },
    { titulo: 'Controlar ingresos', detalle: 'Abrir escáner de acceso', listo: false, icono: DoorOpen, destino: 'control-ingreso' },
  ]
  const proximo = pasos.find(item => !item.listo) || pasos.at(-1)

  return <div className="mx-auto max-w-5xl pb-8 font-sans">
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-4">
      <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-600">Demo guiada</p><h2 className="mt-1 text-xl font-black text-slate-900">Centro de operaciones</h2><p className="mt-1 text-xs text-slate-500">{datos.ceremonia?.nombre || 'Ceremonia activa'} · avanzá una etapa por vez.</p></div>
      <button onClick={cargar} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"><RefreshCw size={13} className={datos.cargando ? 'animate-spin' : ''} /> Actualizar</button>
    </header>

    <section className="mb-4 rounded-2xl bg-slate-950 p-4 text-white sm:flex sm:items-center sm:justify-between">
      <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">Siguiente acción</p><h3 className="mt-1 text-base font-black">{proximo.titulo}</h3><p className="mt-1 text-xs text-slate-400">{proximo.detalle}</p></div>
      <button onClick={() => onNavegar(proximo.destino)} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-950 sm:mt-0">Ir al paso <ChevronRight size={14} /></button>
    </section>

    <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {pasos.map((paso, indice) => { const Icono = paso.icono; return <button key={paso.titulo} onClick={() => onNavegar(paso.destino)} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-sky-300 hover:shadow-sm">
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${paso.listo ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>{paso.listo ? <CheckCircle2 size={18} /> : <Icono size={18} />}</span>
        <span className="min-w-0 flex-1"><span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Paso {indice + 1}</span><span className="block truncate text-xs font-black text-slate-800">{paso.titulo}</span><span className="block truncate text-[10px] text-slate-500">{paso.detalle}</span></span><ChevronRight size={15} className="text-slate-300 group-hover:text-sky-500" />
      </button> })}
    </section>
  </div>
}
