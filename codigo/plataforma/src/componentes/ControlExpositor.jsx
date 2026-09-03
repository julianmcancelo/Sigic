import React, { useEffect, useRef, useState } from 'react'
import { GraduationCap, Info, LogOut, Settings, Shield, X, Sparkles } from 'lucide-react'

export const ADMIN_DEMO = { nombre: 'Administración SiGIC · Demo', correo: 'admin@demo.com', rol: 'ADMIN' }
export const EGRESADA_DEMO = {
  id: '44444444-4444-4444-8444-444444444441', ceremonia_id: '22222222-2222-4222-8222-222222222222',
  ceremonia_activa: true, nombre: 'Julieta Pérez', legajo: 'SIG-001', dni: '40111222',
  correo: 'julieta.demo@sigic.com.ar', carrera: 'Analista de Sistemas', anio_inscripcion: 2023,
  estado: 'ACEPTADO', promedio: 9.1, asiento_id: 'baja-A-1',
}

/** Controles compactos para presentaciones y demostraciones en vivo. */
export function ControlExpositor({ onSimularAdmin, onSimularEgresado, onLimpiar, onIniciarDemo }) {
  const [abierto, setAbierto] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!abierto) return undefined
    const cerrarConEscape = (event) => { if (event.key === 'Escape') setAbierto(false) }
    document.addEventListener('keydown', cerrarConEscape)
    panelRef.current?.querySelector('button')?.focus()
    return () => document.removeEventListener('keydown', cerrarConEscape)
  }, [abierto])

  const ejecutar = (accion) => { accion(); setAbierto(false) }

  return (
    <aside className="fixed bottom-2.5 right-2.5 z-[9999] no-print font-sans" aria-label="Herramientas de demostración">
      {abierto && (
        <div 
          ref={panelRef} 
          role="dialog" 
          aria-modal="false" 
          aria-labelledby="demo-panel-title" 
          className="absolute bottom-10 right-0 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in zoom-in-95 duration-100"
        >
          {/* Cabecera ultra compacta */}
          <div className="flex items-center justify-between bg-slate-950 px-3 py-1.5 text-white">
            <span id="demo-panel-title" className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
              Demo / Presentación
            </span>
            <button 
              onClick={() => setAbierto(false)} 
              aria-label="Cerrar" 
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-1 p-2">
            {/* BOTÓN PILOTO AUTOMÁTICO COMPACTO */}
            <button 
              onClick={() => ejecutar(onIniciarDemo)} 
              className="flex w-full items-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-2.5 py-2 text-left text-white shadow-sm transition hover:brightness-110 active:scale-95 cursor-pointer"
            >
              <Sparkles size={14} className="animate-spin-slow shrink-0 text-cyan-200" aria-hidden="true" />
              <div className="min-w-0">
                <strong className="block text-[11px] font-black leading-tight truncate">🎬 Demostración Automática</strong>
                <span className="block text-[8px] text-white/80 leading-none truncate">9 fases guiadas</span>
              </div>
            </button>

            {/* Accesos rápidos a roles */}
            <button 
              onClick={() => ejecutar(() => onSimularAdmin(ADMIN_DEMO))} 
              className="flex w-full items-center gap-2 rounded-md border border-slate-100 px-2 py-1.5 text-left text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
            >
              <Shield size={13} className="text-cyan-600 shrink-0" aria-hidden="true" />
              <span className="text-[11px] font-bold truncate">Administrador</span>
            </button>

            <button 
              onClick={() => ejecutar(() => onSimularEgresado(EGRESADA_DEMO))} 
              className="flex w-full items-center gap-2 rounded-md border border-slate-100 px-2 py-1.5 text-left text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
            >
              <GraduationCap size={13} className="text-emerald-600 shrink-0" aria-hidden="true" />
              <span className="text-[11px] font-bold truncate">Egresada (Julieta)</span>
            </button>

            {/* Reset */}
            <button 
              onClick={() => ejecutar(onLimpiar)} 
              className="flex w-full items-center justify-center gap-1 pt-1 text-[9px] font-bold text-slate-400 hover:text-red-600 transition cursor-pointer"
            >
              <LogOut size={11} aria-hidden="true" /> Reiniciar sistema
            </button>
          </div>
        </div>
      )}

      {/* Botón disparador ultra discreto */}
      <button 
        onClick={() => setAbierto((valor) => !valor)} 
        aria-expanded={abierto} 
        aria-label="Abrir centro de demo" 
        className="flex h-7 items-center gap-1.5 rounded-full bg-slate-950/85 backdrop-blur-sm px-2.5 text-[10px] font-bold text-slate-300 border border-slate-700/60 shadow-md transition hover:text-white hover:bg-slate-900 active:scale-95 cursor-pointer"
      >
        <Settings size={12} className="text-cyan-400" aria-hidden="true" />
        <span>Demo</span>
      </button>
    </aside>
  )
}

export function MarcaAguaDemo() {
  return null
}
