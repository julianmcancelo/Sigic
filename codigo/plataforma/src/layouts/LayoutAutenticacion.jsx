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
              <h2 className="max-w-[280px] text-[30px] font-bold leading-[1.15] tracking-[-0.035em] sm:text-[34px]">Un gran logro.<br /><span className="text-sky-300">Un nuevo comienzo.</span></h2>
              <p className="mt-4 max-w-[270px] text-[13px] leading-6 text-slate-300">Todo lo que necesitás para ser parte de tu ceremonia, en un solo lugar.</p>
            </div>

            <div aria-hidden="true" className="relative my-6 hidden md:block">
              <svg viewBox="0 0 300 210" className="mx-auto w-full max-w-[280px]" fill="none">
                <ellipse cx="150" cy="186" rx="99" ry="13" fill="#020d1b" opacity=".45" />
                <circle cx="154" cy="100" r="87" stroke="#7dd3fc" strokeOpacity=".12" />
                <circle cx="154" cy="100" r="68" stroke="#7dd3fc" strokeOpacity=".08" />
                <g transform="rotate(-7 145 110)">
                  <rect x="51" y="42" width="192" height="132" rx="13" fill="#102e48" stroke="#315570" />
                  <rect x="60" y="51" width="174" height="114" rx="7" stroke="#7dd3fc" strokeOpacity=".25" />
                  <path d="m112 85 35-16 35 16-35 16-35-16Z" fill="#38bdf8" />
                  <path d="M125 96v14c14 9 30 9 44 0V96" stroke="#7dd3fc" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M182 86v26" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                  <path d="M108 131h78M123 141h47" stroke="#8eafc5" strokeWidth="3" strokeLinecap="round" />
                  <path d="m207 145-9 30 13-5 9 8 4-32" fill="#0284c7" />
                  <circle cx="215" cy="139" r="16" fill="#0ea5e9" stroke="#7dd3fc" strokeWidth="2" />
                  <path d="m208 139 5 5 9-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <path d="M40 62h10M45 57v10M252 118h8M256 114v8" stroke="#7dd3fc" strokeOpacity=".6" strokeLinecap="round" />
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

