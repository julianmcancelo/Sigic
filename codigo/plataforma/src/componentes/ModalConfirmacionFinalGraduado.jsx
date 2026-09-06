import React from 'react'
import {
  X, CheckCircle2, ScrollText, Users, GraduationCap,
  CalendarDays, MapPin, Clock, AlertTriangle, ArrowRight,
  ShieldCheck, Award, HeartHandshake, Edit3
} from 'lucide-react'
import { FORMULAS_JURAMENTO } from './graduado/SeccionJuramento'

export function ModalConfirmacionFinalGraduado({
  abierto,
  onCerrar,
  onConfirmar,
  cargando = false,
  graduado = {},
  invitados = [],
  entregadores = [],
  fechaCeremonia = '',
  lugarCeremonia = '',
  onIrASeccion
}) {
  if (!abierto) return null

  const formulaJuramento = FORMULAS_JURAMENTO[graduado?.formula_juramento] || FORMULAS_JURAMENTO['PATRIA']
  const fechaLimite = graduado.ceremonia_fecha_limite_confirmacion || graduado.ceremonia_fecha_limite || graduado.fecha_limite_confirmacion
  const plazoVencido = Boolean(fechaLimite && new Date(fechaLimite).getTime() < Date.now())

  let fechaLimiteTexto = null
  if (fechaLimite) {
    try {
      const d = new Date(fechaLimite)
      if (!isNaN(d.getTime())) {
        fechaLimiteTexto = new Intl.DateTimeFormat('es-AR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(d)
      }
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-none">Revisión y Confirmación Final</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Verificá tus elecciones antes de finalizar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer disabled:opacity-30"
          >
            <X size={17} />
          </button>
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* BANNER INFORMATIVO DE PLAZOS Y MODIFICACIONES */}
          <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200/80 text-sky-950 space-y-1.5">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-sky-600 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-sky-800">
                {fechaLimiteTexto ? `Plazo de Modificación: Hasta el ${fechaLimiteTexto} hs.` : 'Plazo de Modificación Abierto'}
              </span>
            </div>
            <p className="text-xs text-sky-900/90 leading-relaxed font-medium">
              Al confirmar, tu registro quedará guardado oficialmente. <strong>Podés volver a ingresar y hacer cambios en tus acompañantes o padrinos en cualquier momento antes de la fecha de cierre</strong>.
            </p>
            <p className="text-[11px] text-sky-800/80 leading-snug font-medium pt-1 border-t border-sky-200/60">
              💡 <em>Importante: Si alguno de tus acompañantes no podrá asistir, por favor retiralo del sistema antes del cierre para que la institución pueda liberar ese espacio en el auditorio.</em>
            </p>
          </div>

          {/* TARJETA 1: FÓRMULA DE JURAMENTO */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                  <ScrollText size={13} />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">1. Fórmula de Juramento</span>
              </div>
              {onIrASeccion && (
                <button
                  type="button"
                  onClick={() => { onCerrar(); onIrASeccion('juramento'); }}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={12} /> Modificar
                </button>
              )}
            </div>

            <div className="pl-8">
              <p className="text-sm font-black text-slate-900">{formulaJuramento.titulo}</p>
              <p className="text-xs text-slate-500 italic mt-0.5">&ldquo;{formulaJuramento.texto}&rdquo;</p>
            </div>
          </div>

          {/* TARJETA 2: ACOMPAÑANTES */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Users size={13} />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  2. Acompañantes ({invitados.length})
                </span>
              </div>
              {onIrASeccion && (
                <button
                  type="button"
                  onClick={() => { onCerrar(); onIrASeccion('invitados'); }}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={12} /> Modificar
                </button>
              )}
            </div>

            {invitados.length === 0 ? (
              <p className="text-xs text-slate-500 pl-8 italic">
                Asistirás de forma individual (sin acompañantes registrados).
              </p>
            ) : (
              <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {invitados.map(inv => (
                  <div key={inv.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-xs">
                    <p className="font-bold text-slate-900 truncate">{inv.nombre}</p>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      {inv.relacion || 'Acompañante'} · DNI {inv.dni}
                      {(inv.discapacidad === 1 || inv.discapacidad === true) && (
                        <span className="ml-1.5 text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded text-[9px]">
                          Accesible
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TARJETA 3: PADRINOS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <Award size={13} />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  3. Padrinos / Entregadores ({entregadores.length}/3)
                </span>
              </div>
              {onIrASeccion && (
                <button
                  type="button"
                  onClick={() => { onCerrar(); onIrASeccion('entregadores'); }}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={12} /> Modificar
                </button>
              )}
            </div>

            {entregadores.length === 0 ? (
              <p className="text-xs text-slate-500 pl-8 italic">
                No has designado padrinos específicos (la entrega la realizará la autoridad de mesa protocolar).
              </p>
            ) : (
              <div className="pl-8 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {entregadores.map(e => (
                  <div key={e.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-xs">
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-600 block">
                      {e.orden}° Padrino
                    </span>
                    <p className="font-bold text-slate-900 truncate mt-0.5">{e.nombre}</p>
                    <p className="text-[10px] text-slate-400">
                      {e.tipo === 'PROFESOR' ? 'Docente' : 'Familiar'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DETALLES DE LA CEREMONIA */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-slate-400" />
              <span><strong>Fecha:</strong> {fechaCeremonia}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-slate-400" />
              <span><strong>Lugar:</strong> {lugarCeremonia}</span>
            </div>
          </div>

        </div>

        {/* PIE DE ACCIONES */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/80 transition cursor-pointer disabled:opacity-40"
          >
            Volver y revisar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition active:scale-95 cursor-pointer disabled:opacity-40"
          >
            {cargando ? (
              <span>Guardando y enviando confirmación...</span>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Confirmar y Finalizar Selección</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
