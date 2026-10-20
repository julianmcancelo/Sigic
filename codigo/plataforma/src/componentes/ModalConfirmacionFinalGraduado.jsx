import React from 'react'
import {
  X, CheckCircle2, ScrollText, Users, GraduationCap,
  CalendarDays, MapPin, Clock, ArrowRight,
  ShieldCheck, Award, HeartHandshake, Edit3, Sparkles, LoaderCircle
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

  let fechaLimiteTexto = null
  if (fechaLimite) {
    try {
      const d = new Date(fechaLimite)
      if (!isNaN(d.getTime())) {
        fechaLimiteTexto = new Intl.DateTimeFormat('es-AR', {
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        }).format(d)
      }
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end sm:place-items-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onCerrar}
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-300 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO MINIMALISTA */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400 block">
                Verificación Previa
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight mt-0.5">
                Revisión y Confirmación Final
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENIDO SCROLLABLE MOBILE-FIRST */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 divide-y divide-slate-100">
          
          {/* BANNER INFORMATIVO SUTIL DE PLAZOS */}
          <div className="rounded-2xl bg-sky-50/70 border border-sky-100 p-3.5 sm:p-4 text-sky-950 space-y-2">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-sky-600 shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-900">
                {fechaLimiteTexto ? `Modificaciones hasta el ${fechaLimiteTexto} hs.` : 'Plazo de Modificación Abierto'}
              </span>
            </div>
            <p className="text-xs text-sky-900/90 leading-relaxed font-medium">
              Al confirmar, tu inscripción quedará consolidada. <strong>Podrás ingresar nuevamente y editar tus acompañantes o tus padrinos</strong> las veces que quieras antes de la fecha de cierre institucional.
            </p>
          </div>

          {/* SECCIÓN 1: FÓRMULA DE JURAMENTO */}
          <div className="pt-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
                  <ScrollText size={13} />
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  1. Fórmula de Juramento
                </span>
              </div>
              {onIrASeccion && (
                <button
                  type="button"
                  onClick={() => { onCerrar(); onIrASeccion('juramento'); }}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={11} /> Modificar
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-slate-150/80 bg-slate-50/50 p-3 sm:p-3.5 ml-0 sm:ml-8">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-black text-slate-900">{formulaJuramento.titulo}</p>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {formulaJuramento.etiquetaCorta}
                </span>
              </div>
              {graduado?.comentarios && (
                <p className="text-[11px] text-slate-500 font-medium mt-1.5 pt-1.5 border-t border-slate-200/60">
                  <strong>Nota enviada:</strong> &ldquo;{graduado.comentarios}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* SECCIÓN 2: ACOMPAÑANTES */}
          <div className="pt-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Users size={13} />
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  2. Acompañantes ({invitados.length})
                </span>
              </div>
              {onIrASeccion && (
                <button
                  type="button"
                  onClick={() => { onCerrar(); onIrASeccion('invitados'); }}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={11} /> Modificar
                </button>
              )}
            </div>

            <div className="ml-0 sm:ml-8">
              {invitados.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center">
                  <p className="text-xs text-slate-500 font-medium">
                    Asistirás de forma individual (sin acompañantes registrados).
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {invitados.map(inv => (
                    <div key={inv.id} className="p-2.5 rounded-xl bg-white border border-slate-150/80 shadow-2xs text-xs">
                      <p className="font-bold text-slate-900 truncate">{inv.nombre}</p>
                      <div className="flex items-center justify-between mt-0.5 text-[10.5px] text-slate-400 font-medium">
                        <span>{inv.relacion || 'Acompañante'} · DNI {inv.dni}</span>
                        {(inv.discapacidad === 1 || inv.discapacidad === true) && (
                          <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded text-[9px]">
                            Accesible
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 3: PADRINOS */}
          <div className="pt-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                  <Award size={13} />
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  3. Padrinos / Entregadores ({entregadores.length}/3)
                </span>
              </div>
              {onIrASeccion && (
                <button
                  type="button"
                  onClick={() => { onCerrar(); onIrASeccion('entregadores'); }}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={11} /> Modificar
                </button>
              )}
            </div>

            <div className="ml-0 sm:ml-8">
              {entregadores.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center">
                  <p className="text-xs text-slate-500 font-medium">
                    Sin padrinos designados (la entrega la realizará la autoridad protocolar).
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {entregadores.map(e => (
                    <div key={e.id} className="p-2.5 rounded-xl bg-white border border-slate-150/80 shadow-2xs text-xs">
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 block">
                        {e.orden}° Entrega
                      </span>
                      <p className="font-bold text-slate-900 truncate mt-0.5">{e.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {e.tipo === 'PROFESOR' ? 'Docente' : 'Acompañante'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DETALLES DE SEDE */}
          <div className="pt-3.5">
            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-sky-500 shrink-0" />
                <span><strong>Fecha:</strong> {fechaCeremonia}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-indigo-500 shrink-0" />
                <span className="truncate"><strong>Lugar:</strong> {lugarCeremonia}</span>
              </div>
            </div>
          </div>

        </div>

        {/* PIE DE ACCIONES RESPONSIVE */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer disabled:opacity-40"
          >
            Volver y revisar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {cargando ? (
              <>
                <LoaderCircle size={15} className="animate-spin" />
                <span>Confirmando registro...</span>
              </>
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
