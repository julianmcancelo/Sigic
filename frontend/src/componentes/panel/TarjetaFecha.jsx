import { CalendarDays } from 'lucide-react'
import { obtenerTextoFecha, obtenerTextoMes } from '../../utilidades/formatear-fecha'

export function TarjetaFecha({ fechaActual }) {
  const [diaSemana, restoFecha] = obtenerTextoFecha(fechaActual).split(', ')

  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-white/[0.08]"
      style={{ background: 'linear-gradient(135deg, #1a2d45 0%, #2A3448 100%)' }}
    >
      {/* Círculo decorativo */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-10 blur-[40px]"
        style={{ background: '#29ABE2' }} />

      {/* Franja izquierda de color */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ background: 'linear-gradient(180deg, #29ABE2, #1565C0)' }} />

      <div className="relative p-4 pl-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-[#29ABE2]">
            <CalendarDays size={13} />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#29ABE2]">
            Fecha
          </p>
        </div>

        {/* Número del día grande */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[2.8rem] font-800 leading-none text-white" style={{ fontWeight: 800 }}>
              {fechaActual.getDate()}
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#29ABE2]">
              {obtenerTextoMes(fechaActual)}
            </p>
          </div>

          {/* Año en badge */}
          <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-right">
            <p className="text-[8px] uppercase tracking-wider text-white/30">Año</p>
            <p className="text-[13px] font-bold text-white/80">
              {fechaActual.getFullYear()}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-2.5 h-px bg-white/[0.07]" />

        {/* Día semana */}
        <p className="text-[11px] font-semibold capitalize text-white/55">
          {diaSemana}
          {restoFecha ? `, ${restoFecha}` : ''}
        </p>
      </div>
    </article>
  )
}
