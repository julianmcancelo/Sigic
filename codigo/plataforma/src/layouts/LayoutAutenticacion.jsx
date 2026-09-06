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
          <section className="md:col-span-5 bg-gradient-to-br from-[#0a1526] via-[#0d1e38] to-[#07111e] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
            
            {/* Resplandores ambientales y red sutil */}
            <div className="absolute -top-28 -left-28 w-64 h-64 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-28 -right-28 w-64 h-64 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            {/* Cabecera del Panel */}
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white p-2 shadow-xl shadow-sky-950/50 flex items-center justify-center border border-white/20 shrink-0">
                  <img src="/logo.png" alt="SiGIC" className="h-full w-full object-contain" />
                </div>
                <div>
                  <span className="inline-block text-[9px] font-black uppercase tracking-[0.22em] text-sky-400">
                    Instituto Beltrán
                  </span>
                  <h1 className="text-xl font-black text-white tracking-tight leading-tight">
                    SiGIC
                  </h1>
                </div>
              </div>

              <div>
                <h2 className="text-2xl sm:text-[26px] font-black text-white tracking-tight leading-snug">
                  Gestión Integral de Colaciones
                </h2>
                <p className="text-xs text-slate-300/85 font-normal leading-relaxed mt-2.5">
                  El protocolo institucional y la acreditación de grado, unificados en una sola experiencia digital.
                </p>
              </div>

              {/* ══ Visual Original: Anfiteatro Lumínico Ceremonial (Arte SVG Vectorial) ══ */}
              <div className="relative pt-3 pb-2 flex flex-col items-center justify-center">
                <div className="w-full max-w-[260px] aspect-[4/3] relative flex items-center justify-center">
                  
                  {/* Círculos concéntricos de butacas (Arcos del anfiteatro) */}
                  <svg viewBox="0 0 240 160" className="w-full h-full drop-shadow-[0_0_15px_rgba(56,189,248,0.25)]">
                    <defs>
                      <linearGradient id="arcGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.3" />
                      </linearGradient>
                      <radialGradient id="stageGlow" cx="50%" cy="100%" r="80%">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Escenario central */}
                    <path d="M 70 145 Q 120 120 170 145" stroke="#38bdf8" strokeWidth="2.5" fill="none" opacity="0.9" />
                    <ellipse cx="120" cy="142" rx="40" ry="14" fill="url(#stageGlow)" />
                    <text x="120" y="145" textAnchor="middle" fill="#7dd3fc" fontSize="7" fontWeight="bold" letterSpacing="1.5">ESCENARIO</text>

                    {/* Fila 1 de Butacas */}
                    <path d="M 50 115 Q 120 78 190 115" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3 4" fill="none" />
                    {[55, 75, 95, 120, 145, 165, 185].map((x, i) => {
                      const y = 115 - Math.sin(((x - 50) / 140) * Math.PI) * 37
                      return <circle key={'f1-' + i} cx={x} cy={y} r="2.2" fill={i % 3 === 0 ? '#38bdf8' : 'rgba(255,255,255,0.4)'} className={i % 3 === 0 ? 'animate-pulse' : ''} />
                    })}

                    {/* Fila 2 de Butacas */}
                    <path d="M 35 90 Q 120 45 205 90" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3 4" fill="none" />
                    {[40, 60, 80, 100, 120, 140, 160, 180, 200].map((x, i) => {
                      const y = 90 - Math.sin(((x - 35) / 170) * Math.PI) * 45
                      return <circle key={'f2-' + i} cx={x} cy={y} r="2.2" fill={i % 2 === 0 ? '#818cf8' : 'rgba(255,255,255,0.3)'} />
                    })}

                    {/* Fila 3 de Butacas */}
                    <path d="M 20 65 Q 120 12 220 65" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 4" fill="none" />
                    {[25, 45, 65, 85, 105, 120, 135, 155, 175, 195, 215].map((x, i) => {
                      const y = 65 - Math.sin(((x - 20) / 200) * Math.PI) * 53
                      return <circle key={'f3-' + i} cx={x} cy={y} r="2.2" fill={i === 5 ? '#38bdf8' : 'rgba(255,255,255,0.25)'} />
                    })}
                  </svg>
                  
                  {/* Badge sutil sobre el anfiteatro */}
                  <div className="absolute bottom-0 text-[10px] font-bold text-sky-300/80 tracking-widest uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                    <span>Disposición de Ceremonia</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Pie del Panel Izquierdo */}
            <div className="relative z-10 pt-5 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <ShieldCheck size={15} />
                <span>Acceso Seguro SSL</span>
              </div>
              <span className="text-slate-400 text-[10px] font-mono">v2.5</span>
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

