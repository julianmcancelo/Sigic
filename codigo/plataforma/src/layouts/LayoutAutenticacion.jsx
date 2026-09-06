import React from 'react'
import { ShieldCheck, ArrowLeft, Calendar, QrCode, Users } from 'lucide-react'

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
        
        {/* Panel Izquierdo: Branding Institucional Beltrán */}
        {!centrado && (
          <section className="md:col-span-5 bg-gradient-to-br from-[#0c1a2e] via-[#0f2744] to-[#0a1829] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
            
            {/* Resplandores ambientales internos */}
            <div className="absolute -top-24 -left-24 w-56 h-56 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-56 h-56 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center border border-white/20 shrink-0">
                  <img src="/logo.png" alt="SiGIC" className="h-full w-full object-contain" />
                </div>
                <div>
                  <span className="inline-block text-[9px] font-black uppercase tracking-[0.2em] text-sky-400">
                    Plataforma Oficial
                  </span>
                  <h1 className="text-xl font-black text-white tracking-tight leading-tight">
                    SiGIC
                  </h1>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white tracking-tight leading-snug">
                  Gestión Integral de Colaciones
                </h2>
                <p className="text-xs text-slate-300/90 font-medium leading-relaxed mt-2">
                  Sistema de administración y acreditación para ceremonias de graduación del Instituto Tecnológico Beltrán.
                </p>
              </div>

              {/* Características institucionales en píldoras */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] border border-white/[0.08] px-3.5 py-2.5 backdrop-blur-sm">
                  <Calendar size={15} className="text-sky-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-200">Cronograma y Aforo en Tiempo Real</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] border border-white/[0.08] px-3.5 py-2.5 backdrop-blur-sm">
                  <QrCode size={15} className="text-sky-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-200">Acreditación Rápida con Código QR</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] border border-white/[0.08] px-3.5 py-2.5 backdrop-blur-sm">
                  <Users size={15} className="text-sky-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-200">Portal de Autogestión para Egresados</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <ShieldCheck size={15} />
                <span>Acceso Cifrado SSL</span>
              </div>
              <span className="text-slate-400 text-[10px]">v2.5</span>
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

