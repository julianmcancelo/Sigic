import React from 'react'
import { Mail, Send, CheckCircle2, UserCheck, QrCode, Trash2, Armchair } from 'lucide-react'

const ACCENT = '#29ABE2'

/**
 * Representa una fila individual en la lista de egresados.
 * Muestra información básica, lista de invitados y botones de acción.
 */
export function TarjetaEgresado({
  egresado,
  invitados,
  enviandoId,
  exitoEnvio,
  onEnviarInvitacion,
  onCredencial,
  onLink,
  onEliminar,
  onInvitadoClick,
  onAsignarAsientos
}) {
  return (
    <div className="group/card bg-white hover:bg-slate-50/50 px-8 py-6 border-b border-slate-100 last:border-0 transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-6">
        {/* Información del Egresado */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20 group-hover/card:scale-110 transition-transform duration-500">
             <span className="text-sm font-black">{egresado.nombre.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <p className="font-black text-slate-800 text-lg tracking-tight leading-none">{egresado.nombre}</p>
              {egresado.correo && (
                <div className="h-5 w-5 bg-sky-50 rounded-lg flex items-center justify-center text-sky-500">
                  <Mail size={12} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                 ID: {egresado.legajo}
               </span>
               <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">
                 {invitados.length} Invitados
               </span>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onEnviarInvitacion(egresado)}
            disabled={enviandoId === egresado.id}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95
              ${exitoEnvio === egresado.id 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
            `}
          >
            {enviandoId === egresado.id ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            ) : exitoEnvio === egresado.id ? (
              <CheckCircle2 size={14} />
            ) : (
              <Send size={14} />
            )}
            {exitoEnvio === egresado.id ? 'Sincronizado' : 'Invitar'}
          </button>

          <button
            onClick={() => onCredencial(egresado)}
            className="p-2.5 rounded-xl border-2 border-slate-100 text-slate-400 hover:border-sky-500/30 hover:text-sky-600 hover:bg-sky-50 transition-all"
            title="Ver Credencial"
          >
            <UserCheck size={18} />
          </button>

          <button
            onClick={() => onLink(egresado)}
            className="p-2.5 rounded-xl border-2 border-slate-100 text-slate-400 hover:border-sky-500/30 hover:text-sky-600 hover:bg-sky-50 transition-all"
            title="Copiar Enlace"
          >
            <QrCode size={18} />
          </button>

          <button
            onClick={() => onAsignarAsientos(egresado)}
            className="p-2.5 rounded-xl border-2 border-slate-100 text-slate-400 hover:border-sky-500/30 hover:text-sky-600 hover:bg-sky-50 transition-all"
            title="Asignar Asientos"
          >
            <Armchair size={18} />
          </button>

          <div className="w-px h-6 bg-slate-100 mx-1" />

          <button
            onClick={() => onEliminar(egresado.id)}
            className="p-2.5 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Eliminar Registro"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Lista Horizontal de Invitados vinculados */}
      <div className="mt-6 flex flex-wrap gap-4 pl-16">
        {invitados.map((inv) => (
          <button
            key={inv.id}
            onClick={() => onInvitadoClick({ ...inv, egresadoNombre: egresado.nombre })}
            className="group/inv flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 pl-3 pr-4 py-1.5 text-[11px] font-bold text-slate-600 transition-all hover:bg-white hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/5 active:scale-95"
          >
            <div className="relative">
              <div className={`h-2 w-2 rounded-full ${inv.presente ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`} />
              {inv.presente && <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />}
            </div>
            {inv.nombre}
            <QrCode size={12} className="text-slate-300 group-hover/inv:text-sky-500 transition-colors" />
          </button>
        ))}
        
        {invitados.length === 0 && (
          <div className="flex items-center gap-2 opacity-30">
            <div className="w-8 h-px bg-slate-300" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
              Sin acompañantes
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
