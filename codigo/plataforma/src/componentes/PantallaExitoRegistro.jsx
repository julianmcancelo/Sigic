import React from 'react'
import { CheckCircle2 } from 'lucide-react'

const DARK = '#2A3448'
const ACCENT = '#29ABE2'
const BG = '#F0F4F8'

/**
 * Pantalla de confirmación de registro completado.
 * Se muestra una vez que la API responde exitosamente al guardado de invitados.
 */
export function PantallaExitoRegistro({ invitadosCreados }) {
  return (
    <div 
      className="flex min-h-screen items-center justify-center p-4 transition-all animate-in fade-in zoom-in-95" 
      style={{ background: BG }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-2xl">
        {/* Cabecera de éxito */}
        <div className="relative px-8 py-10 text-center" style={{ background: DARK }}>
          <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full blur-[60px] opacity-20" style={{ background: ACCENT }} />
          
          <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 size={40} />
          </div>
          
          <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: ACCENT }}>
            TRAMITE COMPLETADO
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">Registro Exitoso</h2>
          <p className="mt-2 text-[13px] text-white/40 leading-relaxed">
            Tus invitados han sido cargados correctamente en el sistema SiGIC.
          </p>
        </div>

        {/* Resumen de invitados cargados */}
        <div className="bg-white px-8 py-8">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 mb-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              Invitados Registrados:
            </p>
            <div className="grid gap-2">
              {invitadosCreados.map((inv, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                  <span className="text-[13px] font-bold text-slate-700">{inv.nombre}</span>
                  <span className="rounded-full bg-[#29ABE2]/10 px-2.5 py-1 text-[10px] font-black uppercase text-[#29ABE2]">
                    {inv.relacion}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[12px] text-slate-400 text-center italic mb-8">
            "Los códigos QR de ingreso serán validados en la entrada por el personal de portería el día del evento."
          </p>

          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl py-4 text-[14px] font-black text-white transition-all active:scale-95 hover:brightness-110"
            style={{ 
              background: `linear-gradient(135deg, ${ACCENT}, #1a87c0)`,
              boxShadow: '0 8px 20px rgba(41,171,226,0.3)'
            }}
          >
            Finalizar y volver al inicio
          </button>
        </div>
      </div>
    </div>
  )
}
