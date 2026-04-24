import React, { useState } from 'react'
import { Settings, User, Shield, RefreshCcw, X } from 'lucide-react'

/**
 * Componente exclusivo para demostraciones (Demo Mode).
 * Permite al expositor cambiar entre roles de forma dinámica y rápida.
 */
export function ControlExpositor({ onSimularAdmin, onSimularEgresado, onLimpiar }) {
  const [abierto, setAbierto] = useState(false)

  const mockAdmin = { 
    nombre: 'Administración - Instituto Beltrán', 
    correo: 'admin.sigic@beltran.edu.ar' 
  }

  const mockEgresado = { 
    id: '2f24c4a0-dd43-4d78-9350-9666db2838e8', 
    nombre: 'Cancelo Julian Manuel', 
    legajo: '1045', 
    correo: '35230531@itbeltran.com.ar' 
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] no-print">
      {/* Botón Flotante (FAB) */}
      <button
        onClick={() => setAbierto(!abierto)}
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
          abierto ? 'bg-slate-800 rotate-90' : 'bg-[#29ABE2] hover:scale-110'
        } text-white`}
      >
        {abierto ? <X size={20} /> : <Settings size={20} />}
      </button>

      {/* Menú de Opciones */}
      {abierto && (
        <div className="absolute bottom-16 right-0 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Panel del Expositor</p>
          </div>
          
          <div className="p-2 space-y-1">
            <button
              onClick={() => { onSimularAdmin(mockAdmin); setAbierto(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-blue-50 group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Shield size={16} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-700">Perfil Administrador</p>
                <p className="text-[10px] text-slate-400">Ver panel de gestión</p>
              </div>
            </button>

            <button
              onClick={() => { onSimularEgresado(mockEgresado); setAbierto(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-emerald-50 group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <User size={16} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-700">Perfil Egresado</p>
                <p className="text-[10px] text-slate-400">Simular carga de invitados</p>
              </div>
            </button>

            <div className="my-2 border-t border-slate-100" />

            <button
              onClick={() => { onLimpiar(); setAbierto(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-red-50 group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <RefreshCcw size={16} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-700">Limpiar Sistema</p>
                <p className="text-[10px] text-slate-400">Cerrar todas las sesiones</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
