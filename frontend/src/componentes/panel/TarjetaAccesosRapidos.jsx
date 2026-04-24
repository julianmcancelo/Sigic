export function TarjetaAccesosRapidos({ accesosRapidos }) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-white/[0.08]"
      style={{ background: 'linear-gradient(135deg, #1a2d45 0%, #2A3448 100%)' }}
    >
      {/* Línea top */}
      <div className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #29ABE2, transparent)' }} />

      {/* Header */}
      <div className="border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
        <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#29ABE2]">
          Accesos rápidos
        </p>
      </div>

      {/* Grid de botones */}
      <div className="grid gap-2 p-3 sm:grid-cols-3">
        {accesosRapidos.map((acceso) => {
          const Icono = acceso.icono
          return (
            <button
              key={acceso.titulo}
              type="button"
              className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3.5 py-3 text-left transition hover:border-[#29ABE2]/30 hover:bg-[#29ABE2]/10"
            >
              <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-[#29ABE2] transition group-hover:border-[#29ABE2]/40 group-hover:bg-[#29ABE2]/15">
                <Icono size={15} />
              </div>
              <span className="text-[12px] font-semibold text-white/65 transition group-hover:text-white">
                {acceso.titulo}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
