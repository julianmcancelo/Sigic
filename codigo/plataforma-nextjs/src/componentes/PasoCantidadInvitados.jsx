import React from 'react'

const ACCENT = '#0EA5E9'

export function PasoCantidadInvitados({ cuposDisponibles, cantidadElegida, onElegir }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/40">
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-slate-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black text-white bg-sky-500 shadow-lg shadow-sky-200">1</span>
        <span className="text-[14px] font-black text-slate-900 uppercase tracking-tight">¿Cuántos invitados vas a registrar?</span>
      </div>
      
      <div className="bg-white px-6 py-8 text-center sm:text-left">
        <p className="mb-6 text-[12px] text-slate-400 font-bold uppercase tracking-wider">
          {cuposDisponibles > 0 
            ? `Podés elegir hasta ${cuposDisponibles} invitados nuevos.` 
            : "Ya alcanzaste el límite máximo de 4 invitados."}
        </p>
        
        <div className="flex flex-wrap justify-center sm:justify-start gap-4">
          {Array.from({ length: cuposDisponibles }).map((_, i) => {
            const n = i + 1;
            const esSeleccionado = cantidadElegida === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onElegir(n)}
                className={`flex h-20 w-20 flex-col items-center justify-center rounded-[20px] border-2 font-black transition-all active:scale-95 ${
                  esSeleccionado
                    ? 'border-sky-500 bg-sky-50 text-sky-600 shadow-lg shadow-sky-100'
                    : 'border-slate-100 bg-white text-slate-300 hover:border-sky-200 hover:text-sky-500'
                }`}
              >
                <span className="text-3xl leading-none">{n}</span>
                <span className="mt-1 text-[9px] uppercase tracking-widest">{n === 1 ? 'Persona' : 'Personas'}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  )
}
