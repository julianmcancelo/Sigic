import { Users, GraduationCap, ChevronRight, BookOpen } from 'lucide-react'
import { LayoutAutenticacion } from '../layouts/LayoutAutenticacion'

const DARK   = '#2A3448'
const ACCENT = '#29ABE2'

export function PantallaSeleccionLogin({ onSeleccionarAdmin, onSeleccionarEgresado, onSeleccionarManual }) {
  return (
    <LayoutAutenticacion>
      <div className="px-8 py-9">
        <h1 className="mb-1 text-[1.45rem] font-bold text-[#2A3448]">
          Bienvenido a SiGIC
        </h1>
        <p className="mb-8 text-xs text-[#90A4AE]">
          Seleccioná tu perfil para ingresar al sistema de gestión de la ceremonia.
        </p>

        <div className="space-y-4">
          {/* Opción Admin */}
          <button
            onClick={onSeleccionarAdmin}
            className="group relative flex w-full items-center gap-4 rounded-xl border-2 border-slate-100 bg-white p-4 transition-all hover:border-[#29ABE2] hover:bg-slate-50 active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white transition-colors group-hover:bg-[#29ABE2]">
              <Users size={24} />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-black text-slate-800">Administrador</p>
              <p className="text-[11px] text-slate-400 font-medium">Acceso para organizadores y portería</p>
            </div>
            <ChevronRight size={16} className="absolute right-4 text-slate-300 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Opción Egresado */}
          <button
            onClick={onSeleccionarEgresado}
            className="group relative flex w-full items-center gap-4 rounded-xl border-2 border-slate-100 bg-white p-4 transition-all hover:border-[#29ABE2] hover:bg-slate-50 active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#29ABE2]/10 text-[#29ABE2] transition-colors group-hover:bg-[#29ABE2] group-hover:text-white">
              <GraduationCap size={24} />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-black text-slate-800">Graduado</p>
              <p className="text-[11px] text-slate-400 font-medium">Acceso al portal del graduado</p>
            </div>
            <ChevronRight size={16} className="absolute right-4 text-slate-300 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Opción Manual */}
          <button
            onClick={onSeleccionarManual}
            className="group relative flex w-full items-center gap-4 rounded-xl border-2 border-slate-100 bg-white p-4 transition-all hover:border-[#29ABE2] hover:bg-slate-50 active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-[#29ABE2] group-hover:text-white">
              <BookOpen size={24} />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-black text-slate-800">Manual de Usuario</p>
              <p className="text-[11px] text-slate-400 font-medium">Guías paso a paso del sistema</p>
            </div>
            <ChevronRight size={16} className="absolute right-4 text-slate-300 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="mt-12 border-t border-slate-100 pt-6 text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">
            Instituto Tecnológico Beltrán · SiGIC 2026
          </p>
        </div>
      </div>
    </LayoutAutenticacion>
  )
}
