import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Armchair, CheckCircle2, ChevronRight, ClipboardCheck, Download, DoorOpen, Lightbulb, Mail, RefreshCw, Smartphone, Users, X } from 'lucide-react'
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
    { titulo: 'Cargar graduados', detalle: `${graduados.length} registrados`, listo: graduados.length > 0, icono: Users, destino: 'gestion-graduados', accion: 'Abrir padrón de graduados', descripcion: 'Armá el padrón de personas que participarán de la ceremonia.', instrucciones: ['Abrí la gestión de graduados.', 'Cargá una persona manualmente o importá el padrón disponible.', 'Comprobá nombre, correo y documento antes de continuar.'], ayuda: 'Para recorrer el demo alcanza con tener al menos un graduado registrado.' },
    { titulo: 'Enviar invitaciones', detalle: `${enviados} de ${graduados.length} enviadas`, listo: graduados.length > 0 && enviados === graduados.length, icono: Mail, destino: 'gestion-graduados', accion: 'Preparar invitaciones', descripcion: 'Enviá a cada graduado el acceso para confirmar su participación.', instrucciones: ['Entrá en la ficha de un graduado.', 'Verificá que el correo sea correcto.', 'Usá la acción de envío y revisá que figure como invitación enviada.'], ayuda: 'En el demo los envíos son simulados: podés avanzar sin contactar a una persona real.' },
    { titulo: 'Revisar respuestas', detalle: `${aceptados} aceptaron participar`, listo: aceptados > 0, icono: CheckCircle2, destino: 'gestion-graduados', accion: 'Revisar confirmaciones', descripcion: 'Controlá quién aceptó, rechazó o todavía no respondió la invitación.', instrucciones: ['Filtrá el padrón por estado de respuesta.', 'Abrí las fichas pendientes para ver su situación.', 'Confirmá que al menos un graduado haya aceptado.'], ayuda: 'Los estados del demo permiten observar el circuito sin esperar respuestas externas.' },
    { titulo: 'Completar grupos', detalle: `${invitados.length} acompañantes cargados`, listo: aceptados > 0 && listos === aceptados, icono: ClipboardCheck, destino: 'gestion-graduados', accion: 'Completar acompañantes', descripcion: 'Revisá que cada graduado aceptado haya informado su grupo de acompañantes.', instrucciones: ['Abrí un graduado con participación aceptada.', 'Revisá invitados, acompañantes y entregadores cargados.', 'Completá los datos faltantes hasta cerrar el grupo.'], ayuda: 'El indicador se completa cuando todos los graduados aceptados tienen su grupo listo.' },
    { titulo: 'Revisar propuestas', detalle: `${propuestas} grupos esperan revisión`, listo: aceptados > 0 && propuestas === 0, icono: Armchair, destino: 'gestion-graduados', accion: 'Revisar propuestas de butacas', descripcion: 'Evaluá las ubicaciones propuestas por cada grupo antes de confirmarlas.', instrucciones: ['Localizá los grupos pendientes de revisión.', 'Abrí la propuesta y observá las butacas elegidas.', 'Aprobala o ajustala según disponibilidad y accesibilidad.'], ayuda: 'Priorizá mantener juntos a los integrantes del grupo y respetar necesidades especiales.' },
    { titulo: 'Confirmar butacas', detalle: `${confirmados}/${aceptados} grupos confirmados`, listo: aceptados > 0 && confirmados === aceptados && conButaca >= confirmados, icono: CheckCircle2, destino: 'gestion-graduados', accion: 'Confirmar ubicaciones', descripcion: 'Dejá asignadas y confirmadas las butacas definitivas de cada grupo.', instrucciones: ['Verificá que no haya propuestas pendientes.', 'Confirmá las ubicaciones grupo por grupo.', 'Comprobá que cada graduado aceptado tenga una butaca.'], ayuda: 'Después de confirmar, las ubicaciones quedan listas para incluirse en las credenciales.' },
    { titulo: 'Enviar credenciales', detalle: `${credenciales}/${confirmados} enviadas`, listo: confirmados > 0 && credenciales === confirmados, icono: Mail, destino: 'gestion-graduados', accion: 'Generar y enviar credenciales', descripcion: 'Entregá las credenciales finales con la información necesaria para ingresar.', instrucciones: ['Abrí un grupo con butacas confirmadas.', 'Revisá los datos y la ubicación antes de generar la credencial.', 'Enviá la credencial y verificá la marca de envío.'], ayuda: 'La credencial reúne la identificación y ubicación ya validadas en los pasos anteriores.' },
    { titulo: 'Controlar ingresos', detalle: datos.ceremonia?.estado === 'EN_VIVO' ? 'Ceremonia en vivo: abrir acreditación' : 'Activá la ceremonia antes de acreditar', listo: datos.ceremonia?.estado === 'FINALIZADA', icono: DoorOpen, destino: 'control-ingreso', accion: 'Abrir control de ingreso', descripcion: 'Acreditá asistentes durante la ceremonia y seguí la ocupación en tiempo real.', instrucciones: ['Confirmá que la ceremonia esté en estado “En vivo”.', 'Abrí el control de ingreso o escáner.', 'Validá credenciales y observá el contador de acreditados.'], ayuda: 'Este es el último paso operativo. La ceremonia debe estar activa para registrar ingresos.' },
  ]
  const proximo = pasos.find(item => !item.listo) || pasos.at(-1)
  const indiceActivo = pasoActivo === null ? -1 : pasoActivo

  if (indiceActivo >= 0) {
    const paso = pasos[indiceActivo]
    const Icono = paso.icono
    const porcentaje = Math.round(((indiceActivo + 1) / pasos.length) * 100)

    return <div className="mx-auto max-w-4xl pb-8 font-sans">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><span className="h-3 w-3 rounded-full bg-sky-500" /><div className="min-w-0"><p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Asistente de operaciones · Paso {indiceActivo + 1} de {pasos.length}</p><p className="truncate text-xs font-black text-slate-800">{paso.titulo}</p></div></div>
          <button type="button" onClick={() => setPasoActivo(null)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700" aria-label="Cerrar paso"><X size={17} /></button>
        </header>

        <div className="h-1.5 bg-slate-100"><div className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all" style={{ width: `${porcentaje}%` }} /></div>

        <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
          <main className="p-6 sm:p-8">
            <div className="flex items-start gap-4"><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${paso.listo ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}>{paso.listo ? <CheckCircle2 size={27} /> : <Icono size={27} />}</span><div><p className={`text-[10px] font-black uppercase tracking-[0.18em] ${paso.listo ? 'text-emerald-600' : 'text-sky-600'}`}>{paso.listo ? 'Paso completado' : 'Paso pendiente'}</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{paso.titulo}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{paso.descripcion}</p></div></div>

            <div className="mt-8 rounded-2xl border border-slate-200 p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Seguí estas indicaciones</p><ol className="mt-4 space-y-4">{paso.instrucciones.map((instruccion, indice) => <li key={instruccion} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-900 text-[10px] font-black text-white">{indice + 1}</span><p className="pt-1 text-sm font-semibold leading-5 text-slate-700">{instruccion}</p></li>)}</ol></div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><Lightbulb size={19} className="mt-0.5 shrink-0 text-amber-600" /><div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-700">Ayuda del asistente</p><p className="mt-1 text-xs leading-5 text-amber-900/75">{paso.ayuda}</p></div></div>

            <button type="button" onClick={() => onNavegar(paso.destino)} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 sm:w-auto">{paso.accion}<ChevronRight size={16} /></button>
          </main>

          <aside className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Tu avance</p><p className="mt-2 text-2xl font-black text-slate-900">{paso.detalle}</p><div className="mt-5 space-y-2">{pasos.map((item, indice) => <button type="button" key={item.titulo} onClick={() => setPasoActivo(indice)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${indice === indiceActivo ? 'bg-white shadow-sm ring-1 ring-sky-200' : 'hover:bg-white'}`}><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-black ${item.listo ? 'bg-emerald-100 text-emerald-700' : indice === indiceActivo ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{item.listo ? '✓' : indice + 1}</span><span className="truncate text-[10px] font-bold text-slate-700">{item.titulo}</span></button>)}</div></aside>
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-4 sm:px-6"><button type="button" onClick={() => indiceActivo > 0 ? setPasoActivo(indiceActivo - 1) : setPasoActivo(null)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"><ArrowLeft size={14} />{indiceActivo > 0 ? 'Anterior' : 'Ver recorrido'}</button>{indiceActivo < pasos.length - 1 && <button type="button" onClick={() => setPasoActivo(indiceActivo + 1)} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-slate-800">Siguiente<ArrowRight size={14} /></button>}</footer>
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
