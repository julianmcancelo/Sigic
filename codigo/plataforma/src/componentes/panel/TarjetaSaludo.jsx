export function TarjetaSaludo({ usuario }) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-white/[0.08]"
      style={{ background: 'linear-gradient(135deg, #1a2d45 0%, #2A3448 100%)' }}
    >
      {/* Círculos decorativos */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-10 blur-[50px]"
        style={{ background: '#29ABE2' }} />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-8 blur-[40px]"
        style={{ background: '#1565C0' }} />

      {/* Patrón de puntos */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

      {/* Línea top azul */}
      <div className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, #29ABE2, #1565C0, transparent)' }} />

      <div className="relative flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">

        {/* Izquierda */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: '#29ABE2' }}>
            SISTEMA INTEGRAL · SiGIC
          </p>
          <h1 className="mt-1.5 text-[1.4rem] font-black leading-tight text-white sm:text-[1.6rem]">
            Bienvenido,{' '}
            <span style={{ color: '#29ABE2' }}>
              {usuario.nombre || 'Administrador'}
            </span>
          </h1>
          <p className="mt-1 text-[11px] font-medium text-white/40">
            Ceremonia de Colación 2026 · IT Beltrán
          </p>
        </div>

        {/* Badge sesión activa */}
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em]">
            Sesión activa
          </span>
        </div>
      </div>
    </section>
  )
}
