import { CloudSun, MapPin } from 'lucide-react'

export function TarjetaClima({
  detalleClima,
  estadoClima,
  ubicacion,
}) {
  const IconoClima = detalleClima.icono

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#B3E5FC] bg-gradient-to-b from-[#E8F7FD] to-[#F0FAFF] p-2.5 shadow-[0_8px_20px_rgba(41,171,226,0.08)]">
      <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-[#29ABE2] opacity-[0.06]" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#29ABE2] shadow-sm">
            <CloudSun size={13} />
          </div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#29ABE2]">
            Clima
          </p>
        </div>

        {/* El modulo queda minimo: solo estado actual e icono. */}
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/80 px-2.5 py-2 shadow-sm">
          <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-white text-[#29ABE2] shadow-sm">
            <IconoClima size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#29ABE2]">
              Ahora
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-[#2A3448]">
              {estadoClima}
            </p>
          </div>
        </div>

        <div className="mt-2 rounded-lg bg-white/80 px-2.5 py-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-[#90A4AE]">
            <MapPin size={12} />
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em]">
              Ubicacion
            </p>
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-[#2A3448]">
            {ubicacion}
          </p>
        </div>
      </div>
    </section>
  )
}
