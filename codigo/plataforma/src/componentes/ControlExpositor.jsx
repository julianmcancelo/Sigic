import React, { useEffect, useRef, useState } from 'react'
import { GraduationCap, Info, LogOut, Settings, Shield, X } from 'lucide-react'

const ADMIN_DEMO = { nombre: 'Administración SiGIC · Demo', correo: 'admin@demo.com', rol: 'ADMIN' }
const EGRESADA_DEMO = {
  id: '44444444-4444-4444-8444-444444444441', ceremonia_id: '22222222-2222-4222-8222-222222222222',
  ceremonia_activa: true, nombre: 'Julieta Pérez', legajo: 'SIG-001', dni: '40111222',
  correo: 'julieta.demo@sigic.com.ar', carrera: 'Analista de Sistemas', anio_inscripcion: 2023,
  estado: 'ACEPTADO', promedio: 9.1, asiento_id: 'baja-A-1',
}

/** Controles exclusivos del entorno público de demostración. */
export function ControlExpositor({ onSimularAdmin, onSimularEgresado, onLimpiar }) {
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
    <aside className="fixed bottom-4 right-4 z-[9999] no-print" aria-label="Herramientas de demostración">
      {abierto && (
        <div ref={panelRef} role="dialog" aria-modal="false" aria-labelledby="demo-panel-title" className="absolute bottom-16 right-0 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 bg-slate-950 px-5 py-4 text-white">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Entorno seguro</p>
              <h2 id="demo-panel-title" className="mt-1 text-base font-black">Centro de demo</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">Cambiá de rol sin contraseña. Todos los datos son ficticios.</p>
            </div>
            <button onClick={() => setAbierto(false)} aria-label="Cerrar centro de demo" className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"><X size={20} aria-hidden="true" /></button>
          </div>

          <div className="space-y-2 p-3">
            <button onClick={() => ejecutar(() => onSimularAdmin(ADMIN_DEMO))} className="group flex min-h-16 w-full items-center gap-3 rounded-xl border border-slate-200 px-3 text-left hover:border-cyan-300 hover:bg-cyan-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-100 text-cyan-700 group-hover:bg-cyan-700 group-hover:text-white"><Shield size={19} aria-hidden="true" /></span>
              <span><strong className="block text-sm text-slate-800">Entrar como administrador</strong><small className="text-xs text-slate-500">Gestión, reportes, accesos y ceremonias</small></span>
            </button>
            <button onClick={() => ejecutar(() => onSimularEgresado(EGRESADA_DEMO))} className="group flex min-h-16 w-full items-center gap-3 rounded-xl border border-slate-200 px-3 text-left hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white"><GraduationCap size={19} aria-hidden="true" /></span>
              <span><strong className="block text-sm text-slate-800">Entrar como egresada</strong><small className="text-xs text-slate-500">Perfil de Julieta, invitados y ubicación</small></span>
            </button>
            <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"><Info size={17} className="mt-0.5 shrink-0" aria-hidden="true" /><p>Podés explorar y modificar la información demo sin afectar el sistema real.</p></div>
            <button onClick={() => ejecutar(onLimpiar)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"><LogOut size={16} aria-hidden="true" /> Reiniciar demo y volver al inicio</button>
          </div>
        </div>
      )}

      <button onClick={() => setAbierto((valor) => !valor)} aria-expanded={abierto} aria-label="Abrir centro de demo" className="flex min-h-12 items-center gap-2 rounded-full bg-slate-950 px-4 font-bold text-white shadow-2xl ring-2 ring-cyan-400/70 transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-cyan-300">
        <Settings size={18} aria-hidden="true" /><span className="text-xs">Centro de demo</span>
      </button>
    </aside>
  )
}

export function MarcaAguaDemo() {
  return <><div className="demo-watermark" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index}>DEMO · DATOS FICTICIOS</span>)}</div><div className="demo-environment-badge" role="status">DEMO · DATOS FICTICIOS</div></>
}
