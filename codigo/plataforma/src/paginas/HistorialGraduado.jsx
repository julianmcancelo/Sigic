import { CalendarDays, CheckCircle2, Clock3, GraduationCap, History, LogOut, MapPin, RotateCcw, XCircle } from 'lucide-react'

function datosEstado(registro) {
  const activa = registro.ceremonia_activa === true || registro.ceremonia_activa === 1
  if (!activa && registro.estado === 'ACEPTADO') {
    return { texto: 'Finalizada', clases: 'bg-slate-100 text-slate-600', Icono: CheckCircle2 }
  }
  if (registro.estado === 'RECHAZADO') {
    return { texto: 'No participó', clases: 'bg-rose-50 text-rose-600', Icono: XCircle }
  }
  if (registro.estado === 'ACEPTADO') {
    return { texto: activa ? 'Participación confirmada' : 'Finalizada', clases: 'bg-emerald-50 text-emerald-700', Icono: CheckCircle2 }
  }
  return { texto: activa ? 'Pendiente de respuesta' : 'Cerrada sin respuesta', clases: 'bg-amber-50 text-amber-700', Icono: Clock3 }
}

function fechaLegible(fecha) {
  if (!fecha) return 'Fecha no informada'
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function ListaHistorialGraduado({ historial = [], actualId }) {
  if (!historial.length) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No hay otras participaciones registradas.</p>
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {historial.map((registro) => {
        const estado = datosEstado(registro)
        const actual = String(registro.id) === String(actualId)
        return (
          <article
            key={registro.id}
            className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-sm transition ${actual ? 'border-sky-300 ring-4 ring-sky-100/70' : 'border-slate-200'}`}
          >
            {actual && <span className="absolute right-4 top-4 rounded-full bg-sky-500 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-white">Seleccionada</span>}
            <div className="mb-4 flex items-start gap-3 pr-20">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <GraduationCap size={21} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black leading-snug text-slate-800">{registro.ceremonia_nombre || 'Ceremonia de colación'}</h3>
                <p className="mt-1 text-[11px] font-bold text-sky-600">{registro.carrera || 'Carrera no informada'}</p>
              </div>
            </div>

            <div className="grid gap-2 text-[11px] text-slate-500 sm:grid-cols-2">
              <p className="flex items-center gap-2"><CalendarDays size={13} className="text-slate-400" /> {fechaLegible(registro.ceremonia_fecha)}</p>
              <p className="flex items-center gap-2"><MapPin size={13} className="text-slate-400" /> {registro.ceremonia_lugar || 'Sede Beltrán'}</p>
              <p className="flex items-center gap-2"><History size={13} className="text-slate-400" /> Legajo {registro.legajo || '—'}</p>
              <p className="text-slate-400">Cohorte {registro.anio_inscripcion || '—'}</p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${estado.clases}`}>
                <estado.Icono size={12} /> {estado.texto}
              </span>
              {registro.promedio && <span className="text-[10px] font-bold text-slate-400">Promedio {registro.promedio}</span>}
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function HistorialGraduado({ graduado, onCerrarSesion, onCambiarCeremonia }) {
  const historial = graduado.historial?.length ? graduado.historial : [graduado]
  const estadoActual = datosEstado(graduado)

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-5 rounded-[32px] bg-[#0d1b2e] p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <img src="/logo-oficial.png" alt="SiGIC" className="h-14 w-14 rounded-2xl bg-white object-contain p-1.5" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-sky-400">Historial académico ceremonial</p>
              <h1 className="mt-1 text-2xl font-black">{graduado.nombre}</h1>
              <p className="mt-1 text-xs text-slate-400">DNI {graduado.dni} · {historial.length} {historial.length === 1 ? 'participación' : 'participaciones'}</p>
            </div>
          </div>
          <button onClick={onCerrarSesion} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-300 hover:bg-white/10">
            <LogOut size={15} /> Cerrar sesión
          </button>
        </header>

        <section className="mb-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Participación seleccionada</p>
              <h2 className="mt-2 text-xl font-black text-slate-800">{graduado.ceremonia_nombre || 'Ceremonia de colación'}</h2>
              <p className="mt-1 text-sm font-bold text-sky-600">{graduado.carrera || 'Carrera no informada'}</p>
              <span className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-wider ${estadoActual.clases}`}>
                <estadoActual.Icono size={13} /> {estadoActual.texto}
              </span>
            </div>
            <button onClick={onCambiarCeremonia} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-sky-200 hover:bg-sky-600">
              <RotateCcw size={15} /> Elegir otra ceremonia
            </button>
          </div>
        </section>

        <div className="mb-5">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-600">Todas tus participaciones</p>
          <h2 className="mt-1 text-2xl font-black text-slate-800">Historial de ceremonias</h2>
          <p className="mt-1 text-sm text-slate-500">Las ceremonias cerradas se conservan como consulta y no modifican las inscripciones actuales.</p>
        </div>
        <ListaHistorialGraduado historial={historial} actualId={graduado.id} />
      </div>
    </main>
  )
}
