import React from 'react'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

export function LayoutAutenticacion({ children, centrado = false, onVolver }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 sm:p-6 text-slate-800 font-sans bg-gradient-to-tr from-slate-100 via-sky-50/40 to-blue-50/30 select-none">
      
      {/* Fondo ambiental sutil con orbes luminosos */}
      <div className="absolute inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(56,189,248,.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,.1),transparent_40%)]" />
      <div className="absolute top-1/6 left-1/4 h-[400px] w-[400px] rounded-full bg-sky-200/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/6 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-200/20 blur-[130px] pointer-events-none" />

      {/* Botón Volver Flotante Superior */}
      {onVolver && (
        <button
          onClick={onVolver}
          className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-4 py-2 text-xs font-bold text-slate-600 shadow-xs hover:bg-white hover:text-slate-950 hover:shadow-sm transition-all cursor-pointer group backdrop-blur-md"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver al inicio</span>
        </button>
      )}

      {/* Contenedor Shell de Autenticación */}
      <div className={`relative z-10 w-full overflow-hidden rounded-[28px] sm:rounded-[32px] border border-slate-200/90 bg-white shadow-[0_24px_60px_-15px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl ${
        centrado 
          ? 'max-w-md p-8' 
          : 'max-w-4xl grid grid-cols-1 md:grid-cols-12'
      }`}>
        
        {/* Panel Izquierdo: Branding Institucional Beltrán con Visual Original de Anfiteatro */}
        {!centrado && (
          <section className="relative flex flex-col overflow-hidden bg-[#081b30] px-7 py-8 text-white md:col-span-5 md:px-9 md:py-10">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_40%,rgba(14,165,233,0.18),transparent_65%)]" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-2.5 shadow-lg shadow-black/10">
                <img src="/logo.png" alt="" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-sky-300">Instituto Tecnológico Beltrán</p>
                <p className="mt-1 text-xl font-extrabold tracking-tight">SiGIC</p>
              </div>
            </div>

            <div className="relative mt-8 md:mt-10">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">Ceremonias de colación</p>
              <h2 className="max-w-[280px] text-[30px] font-bold leading-[1.15] tracking-[-0.035em] sm:text-[34px]">Tu próximo<br /><span className="text-sky-300">gran momento.</span></h2>
              <p className="mt-4 max-w-[270px] text-[13px] leading-6 text-slate-300">Confirmá tu participación y prepará tu credencial.</p>
            </div>

            <div aria-hidden="true" className="group relative my-4 hidden h-[275px] items-center justify-center [perspective:900px] md:flex">
              <div className="absolute bottom-0 h-8 w-40 rounded-full bg-black/30 blur-xl" />
              <svg viewBox="0 0 280 330" className="h-full w-auto origin-top -rotate-[5deg] drop-shadow-[10px_18px_12px_rgba(0,0,0,.35)] motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:rotate-[3deg] motion-safe:group-hover:[transform:rotate(3deg)_rotateY(-10deg)]">
                <defs>
                  <linearGradient id="acceso-cinta" x2="1" y2="0"><stop stopColor="#010409"/><stop offset=".5" stopColor="#202b36"/><stop offset="1" stopColor="#03070c"/></linearGradient>
                  <linearGradient id="acceso-metal" x2="1" y2=".3"><stop stopColor="#516376"/><stop offset=".3" stopColor="#eef5ff"/><stop offset=".55" stopColor="#94a8bd"/><stop offset=".8" stopColor="#f3f8ff"/><stop offset="1" stopColor="#607489"/></linearGradient>
                  <linearGradient id="acceso-tarjeta" x2="1" y2="1"><stop stopColor="#153d5d"/><stop offset=".45" stopColor="#0a2039"/><stop offset="1" stopColor="#061223"/></linearGradient>
                  <linearGradient id="acceso-brillo" x2="1" y2="1"><stop stopColor="white" stopOpacity=".16"/><stop offset=".45" stopColor="white" stopOpacity="0"/></linearGradient>
                  <pattern id="acceso-tejido" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 0h3" stroke="white" strokeOpacity=".08"/></pattern>
                </defs>
                <path d="M90-15h25l34 99-19 12Z" fill="url(#acceso-cinta)" stroke="#354452" strokeWidth=".6"/>
                <path d="M171-15h25l-48 111-21-12Z" fill="url(#acceso-cinta)" stroke="#354452" strokeWidth=".6"/>
                <path d="M90-15h25l34 99-19 12ZM171-15h25l-48 111-21-12Z" fill="url(#acceso-tejido)"/>
                <text transform="translate(105 9) rotate(70)" fill="#7dd3fc" fontSize="7" fontWeight="700" letterSpacing="1.4">INSTITUTO BELTRÁN</text>
                <text transform="translate(173 7) rotate(112)" fill="#7dd3fc" fontSize="7" fontWeight="700" letterSpacing="1.4">SiGIC · COLACIÓN</text>
                <rect x="48" y="115" width="184" height="207" rx="19" fill="url(#acceso-tarjeta)" stroke="#38bdf8" strokeOpacity=".8" strokeWidth="1.3"/>
                <rect x="51" y="118" width="178" height="201" rx="16" fill="url(#acceso-brillo)"/>
                <rect x="117" y="123" width="46" height="6" rx="3" fill="#020810" stroke="#506d85"/>
                <rect x="126" y="83" width="28" height="13" rx="3" fill="url(#acceso-metal)"/>
                <circle cx="132" cy="89" r="2" fill="#304359"/><circle cx="148" cy="89" r="2" fill="#304359"/>
                <path d="M136 96h8v8h-8z" fill="url(#acceso-metal)"/>
                <rect x="133" y="102" width="14" height="29" rx="6" fill="url(#acceso-metal)" stroke="#8ca5ba"/>
                <path d="M138 108v15q2 4 5 0v-11" stroke="#344b60" strokeWidth="1.5" fill="none"/>
                <rect x="69" y="150" width="35" height="35" rx="10" fill="white"/>
                <image href="/logo.png" x="76" y="157" width="21" height="21"/>
                <text x="114" y="163" fill="#7dd3fc" fontSize="7" fontWeight="700" letterSpacing="1.3">INSTITUTO</text>
                <text x="114" y="176" fill="white" fontSize="11" fontWeight="700">BELTRÁN</text>
                <path d="M69 201h142" stroke="#7dd3fc" strokeOpacity=".2"/>
                <text x="69" y="222" fill="#7dd3fc" fontSize="7" fontWeight="700" letterSpacing="1.7">CEREMONIA DE</text>
                <text x="68" y="249" fill="white" fontSize="25" fontWeight="800" letterSpacing="-.7">Colación</text>
                <text x="69" y="267" fill="#a7bbcf" fontSize="9">Tu historia continúa.</text>
                <path d="M69 289h25" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round"/>
                <text x="211" y="298" textAnchor="end" fill="#7dd3fc" fontSize="11" fontWeight="700">SiGIC</text>
              </svg>
            </div>

            <div className="relative mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-300 md:mt-auto">
              <span>Tu inscripción</span><span>Tu grupo</span><span>Tu credencial</span>
            </div>
            <div className="relative mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-[11px] text-slate-400">
              <ShieldCheck size={15} className="shrink-0 text-sky-300" />
              <span>Portal institucional · Acceso protegido</span>
            </div>
          </section>
        )}

        {/* Panel Derecho: Formulario de Login */}
        <section className={`${centrado ? 'w-full' : 'md:col-span-7'} bg-white p-8 sm:p-11 flex flex-col justify-center`}>
          {children}
        </section>

      </div>

      {/* Footer Minimalista */}
      <footer className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Instituto Tecnológico Beltrán · Sistema SiGIC
      </footer>
    </main>
  )
}

