import React from 'react'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

export function LayoutAutenticacion({ children, centrado = false, onVolver }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 sm:p-6 text-slate-800 font-sans bg-gradient-to-tr from-slate-100 via-sky-50/50 to-blue-50/40 select-none">
      
      {/* Fondo con orbes suaves y gradiente ambiental */}
      <div className="absolute inset-0 pointer-events-none opacity-50 [background-image:radial-gradient(circle_at_20%_20%,rgba(56,189,248,.18),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,.12),transparent_35%)]" />
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-sky-300/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-indigo-300/15 blur-[120px] pointer-events-none" />

      {/* Botón Volver Flotante Superior */}
      {onVolver && (
        <button
          onClick={onVolver}
          className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-4 py-2 text-xs font-bold text-slate-600 shadow-xs hover:bg-white hover:text-slate-900 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Volver al inicio</span>
        </button>
      )}

      {/* Contenedor Shell de Autenticación */}
      <div className={`relative z-10 w-full overflow-hidden rounded-[32px] border border-slate-200/90 bg-white/95 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] backdrop-blur-2xl ${
        centrado 
          ? 'max-w-md p-8' 
          : 'max-w-4xl grid grid-cols-1 md:grid-cols-12'
      }`}>
        
        {/* Panel Izquierdo: Branding Institucional Beltrán */}
        {!centrado && (
          <section className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
            
            {/* Hologram / Light flare */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center border border-white/20">
                <img src="/logo.png" alt="SiGIC" className="h-full w-full object-contain" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">
                  Acceso Institucional
                </p>
                <h1 className="text-3xl font-black text-white tracking-tight mt-1">
                  SiGIC
                </h1>
              </div>

              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Sistema Integral de Gestión Institucional para ceremonias de colación de grado y tecnicaturas.
              </p>
            </div>

            <div className="relative z-10 pt-8 mt-8 border-t border-white/10 flex items-center gap-2 text-[11px] font-bold text-emerald-400">
              <ShieldCheck size={16} />
              <span>Conexión y sesión protegida</span>
            </div>
          </section>
        )}

        {/* Panel Derecho: Formulario de Login */}
        <section className={`${centrado ? 'w-full' : 'md:col-span-7'} bg-white p-8 sm:p-10 flex flex-col justify-center`}>
          {children}
        </section>

      </div>

      {/* Footer Minimalista */}
      <footer className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Instituto Tecnológico Beltrán · SiGIC
      </footer>
    </main>
  )
}

