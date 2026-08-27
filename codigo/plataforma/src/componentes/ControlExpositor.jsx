import React, { useEffect, useRef, useState } from 'react'
import { GraduationCap, Info, LogOut, Settings, Shield, X, Sparkles } from 'lucide-react'

export const ADMIN_DEMO = { nombre: 'Administración SiGIC · Demo', correo: 'admin@demo.com', rol: 'ADMIN' }
export const EGRESADA_DEMO = {
  id: '44444444-4444-4444-8444-444444444441', ceremonia_id: '22222222-2222-4222-8222-222222222222',
  ceremonia_activa: true, nombre: 'Julieta Pérez', legajo: 'SIG-001', dni: '40111222',
  correo: 'julieta.demo@sigic.com.ar', carrera: 'Analista de Sistemas', anio_inscripcion: 2023,
  estado: 'ACEPTADO', promedio: 9.1, asiento_id: 'baja-A-1',
}

/** Controles exclusivos del entorno público de demostración. */
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
    <aside className="fixed bottom-3 right-3 z-[9999] no-print" aria-label="Herramientas de demostración">
      {abierto && (
        <div ref={panelRef} role="dialog" aria-modal="false" aria-labelledby="demo-panel-title" className="absolute bottom-12 right-0 w-72 sm:w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between gap-2 bg-slate-950 px-4 py-2.5 text-white">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">Modo Presentación</p>
              <h2 id="demo-panel-title" className="text-xs font-black">Centro de Demostración</h2>
            </div>
            <button onClick={() => setAbierto(false)} aria-label="Cerrar centro de demo" className="p-1 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"><X size={15} aria-hidden="true" /></button>
          </div>

          <div className="space-y-1.5 p-2.5">
            {/* BOTÓN PRINCIPAL PILOTO AUTOMÁTICO */}
            <button 
              onClick={() => ejecutar(onIniciarDemo)} 
              className="group flex w-full items-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 p-2.5 text-left text-white shadow-md transition hover:brightness-110 active:scale-[0.98] cursor-pointer"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/20 text-white backdrop-blur-md">
                <Sparkles size={16} className="animate-spin-slow" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <strong className="block text-xs font-black truncate">🎬 Iniciar Demostración Completa</strong>
                <small className="block text-[9px] text-white/80 truncate">Piloto automático: 10 fases explicadas</small>
              </span>
            </button>

            <div className="h-[1px] bg-slate-100 my-0.5" />

            <button onClick={() => ejecutar(() => onSimularAdmin(ADMIN_DEMO))} className="group flex w-full items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-left hover:border-cyan-300 hover:bg-cyan-50 cursor-pointer">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-cyan-100 text-cyan-700 group-hover:bg-cyan-700 group-hover:text-white"><Shield size={14} aria-hidden="true" /></span>
              <span><strong className="block text-[11px] font-bold text-slate-800">Entrar como Administrador</strong><small className="block text-[9px] text-slate-500">Gestión, reportes y configuración</small></span>
            </button>
            <button onClick={() => ejecutar(() => onSimularEgresado(EGRESADA_DEMO))} className="group flex w-full items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-left hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white"><GraduationCap size={14} aria-hidden="true" /></span>
              <span><strong className="block text-[11px] font-bold text-slate-800">Entrar como Egresada</strong><small className="block text-[9px] text-slate-500">Juramento, invitados y credencial QR</small></span>
            </button>
            <button onClick={() => ejecutar(onLimpiar)} className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-100 hover:text-red-700 cursor-pointer"><LogOut size={13} aria-hidden="true" /> Reiniciar y volver al inicio</button>
          </div>
        </div>
      )}

      <button onClick={() => setAbierto((valor) => !valor)} aria-expanded={abierto} aria-label="Abrir centro de demo" className="flex h-9 items-center gap-1.5 rounded-full bg-slate-950/90 backdrop-blur-md px-3 font-bold text-white shadow-xl ring-1 ring-cyan-400/60 transition hover:bg-slate-900 active:scale-95 cursor-pointer">
        <Settings size={14} className="text-cyan-400" aria-hidden="true" /><span className="text-[11px]">Centro de demo</span>
      </button>
    </aside>
  )
}

export function MarcaAguaDemo() {
  return <><div className="demo-watermark" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index}>DEMO · DATOS FICTICIOS</span>)}</div><div className="demo-environment-badge" role="status">DEMO · DATOS FICTICIOS</div></>
}
