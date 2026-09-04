import React, { useState } from 'react'
import {
  Sparkles, CheckCircle2, Award, Users, Send,
  Armchair, QrCode, Calendar, MapPin, X, ArrowRight,
  RotateCcw, GraduationCap, Check, Maximize2, Minimize2, Minus, HeartHandshake
} from 'lucide-react'

const INTEGRANTES_EQUIPO_2 = [
  { apellido: 'Cancelo', nombres: 'Julián' },
  { apellido: 'Alfonso', nombres: 'Alan Alexis' },
  { apellido: 'Contreras Villalba', nombres: 'Sol Heilin' },
  { apellido: 'Frassia', nombres: 'Matías' },
  { apellido: 'Santillán', nombres: 'Luis Gabriel' },
]

export function ModalResumenDemostracion({
  ceremonia,
  graduados = [],
  invitados = [],
  butacasAsignadas = 0,
  onCerrar,
  onReiniciar
}) {
  const [maximizado, setMaximizado] = useState(false)

  const nombreCeremonia = ceremonia?.nombre || 'LXIV Ceremonia Solemne de Grado Beltrán'
  const fechaCeremonia = ceremonia?.fecha
    ? new Date(`${ceremonia.fecha}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '20 de Noviembre de 2026'
  const sedeCeremonia = ceremonia?.lugar || 'Auditorio Mayor Instituto Beltrán'
  const totalGraduados = graduados.length || 12

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full bg-white shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden transition-all duration-200 ${
          maximizado
            ? 'fixed inset-2 sm:inset-4 rounded-2xl sm:rounded-3xl max-w-none max-h-none h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)]'
            : 'max-w-5xl rounded-2xl sm:rounded-3xl max-h-[90vh]'
        }`}
      >
        
        {/* BARRA SUPERIOR DE VENTANA INSTITUCIONAL CON CONTROLES */}
        <div className="shrink-0 bg-slate-950 px-4 py-2.5 sm:px-6 sm:py-3 text-white border-b border-white/10 flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/90 hover:bg-red-600 cursor-pointer inline-block" onClick={onCerrar} title="Cerrar" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90 hover:bg-amber-600 cursor-pointer inline-block" onClick={() => setMaximizado(false)} title="Restaurar" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 hover:bg-emerald-600 cursor-pointer inline-block" onClick={() => setMaximizado(!maximizado)} title="Maximizar" />
            </div>
            <div className="h-4 w-[1px] bg-white/15 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Award size={14} className="text-amber-400" />
              <span className="text-xs font-black tracking-tight text-white truncate">
                SiGIC · Ventana de Balance y Agradecimiento · Equipo 2
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/20 text-[9px] font-black uppercase tracking-wider text-sky-300 border border-sky-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ciclo Concluido
            </span>
            <button
              type="button"
              onClick={() => setMaximizado(!maximizado)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition"
              title={maximizado ? 'Restaurar tamaño' : 'Maximizar'}
            >
              {maximizado ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            <button
              id="btn-cerrar-modal-resumen-x"
              type="button"
              onClick={onCerrar}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Cerrar ventana"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* CUERPO PRINCIPAL RESPONSIVE (FLEX-1 CON LAYOUT EN 2 COLUMNAS) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 [scrollbar-width:thin] bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* COLUMNA IZQUIERDA: RESUMEN OPERATIVO + KPIS + HITOS (7 COLS EN DESKTOP) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* ENCABEZADO DE CEREMONIA */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                    Ceremonia Oficial de Grado
                  </span>
                  <span className="text-[10.5px] font-semibold text-slate-500 flex items-center gap-1">
                    <Calendar size={12} className="text-sky-500" />
                    {fechaCeremonia}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {nombreCeremonia}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                  <MapPin size={12} className="text-slate-400 shrink-0" />
                  <span>{sedeCeremonia}</span>
                </p>
              </div>

              {/* KPIS EJECUTIVOS BENTO (4 TARJETAS) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-indigo-600 mb-1">
                    <Users size={15} />
                    <span className="text-[8px] font-bold uppercase text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">Padrón</span>
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 leading-none mb-0.5">{totalGraduados}</p>
                    <p className="text-[9.5px] text-slate-500 font-semibold">6 carreras técnicas</p>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-blue-600 mb-1">
                    <Send size={15} />
                    <span className="text-[8px] font-bold uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Tokens</span>
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 leading-none mb-0.5">100%</p>
                    <p className="text-[9.5px] text-slate-500 font-semibold">OTP validados</p>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-teal-600 mb-1">
                    <QrCode size={15} />
                    <span className="text-[8px] font-bold uppercase text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">Pase</span>
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 leading-none mb-0.5">Digital</p>
                    <p className="text-[9.5px] text-slate-500 font-semibold">QR + Wallet</p>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-emerald-600 mb-1">
                    <Armchair size={15} />
                    <span className="text-[8px] font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Seating</span>
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 leading-none mb-0.5">100%</p>
                    <p className="text-[9.5px] text-slate-500 font-semibold">Platea y Pullman</p>
                  </div>
                </div>
              </div>

              {/* HITOS PROTOCOLARES CERTIFICADOS */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10.5px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    Hitos Protocolares de la Demostración
                  </h4>
                  <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    6 de 6 Cumplidos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <span className="font-semibold text-slate-800 text-[11px]">Padrón oficial validado</span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <span className="font-semibold text-slate-800 text-[11px]">Invitaciones y tokens OTP</span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <span className="font-semibold text-slate-800 text-[11px]">Fórmula de juramento</span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <span className="font-semibold text-slate-800 text-[11px]">Padrinos docentes y familia</span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <span className="font-semibold text-slate-800 text-[11px]">Pase grupal QR y Wallet</span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <span className="font-semibold text-slate-800 text-[11px]">Auto-Seating en auditorio</span>
                  </div>
                </div>
              </div>

            </div>

            {/* COLUMNA DERECHA: PLACA DEL EQUIPO 2 + INTEGRANTES (5 COLS EN DESKTOP) */}
            <div className="lg:col-span-5 space-y-3">
              
              <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-[#002447] to-slate-950 p-4 sm:p-5 text-white border border-sky-400/30 shadow-md">
                
                {/* BADGE INSTITUCIONAL BELTRÁN */}
                <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Sparkles size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                      Equipo 2 · Prácticas Profesionalizantes
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">
                    Beltrán 2026
                  </span>
                </div>

                {/* MENSAJE DE AGRADECIMIENTO EN PRIMERA PERSONA */}
                <p className="text-xs text-slate-200 leading-relaxed font-normal mb-3">
                  Queremos expresar nuestro sincero agradecimiento a los <strong className="text-white font-bold">profesores de la mesa evaluadora, directivos y a las autoridades del Instituto Tecnológico Beltrán</strong> por su tiempo, guía y vocación docente durante nuestra formación.
                </p>

                <p className="text-[11px] text-slate-300 leading-relaxed font-normal mb-3.5">
                  <strong className="text-sky-300">SiGIC</strong> nace como una propuesta desarrollada por nosotros para modernizar y dar solemnidad a cada acto de grado de nuestra propia institución.
                </p>

                {/* NÓMINA OFICIAL DE INTEGRANTES DEL EQUIPO 2 */}
                <div className="space-y-2 pt-2.5 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-wider text-sky-300">
                      Integrantes del Equipo 2
                    </p>
                    <span className="text-[9px] font-bold text-slate-400">
                      Prácticas Profesionalizantes
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-1.5">
                    {INTEGRANTES_EQUIPO_2.map((integrante, indice) => (
                      <div
                        key={`${integrante.apellido}-${integrante.nombres}`}
                        className="flex items-center gap-2.5 bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 rounded-xl px-3 py-1.5 transition text-xs"
                      >
                        <span className="text-[10px] font-mono font-bold text-sky-400/80 w-4 text-center shrink-0">
                          {String(indice + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-white text-xs tracking-tight">
                            {integrante.apellido},
                          </span>
                          <span className="text-slate-200 text-xs font-medium">
                            {integrante.nombres}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1 text-slate-300">
                    <GraduationCap size={12} className="text-sky-400" />
                    Muchas gracias por su atención.
                  </span>
                  <span className="text-sky-300/80 font-bold">
                    Alumnos ITB
                  </span>
                </div>

              </div>

            </div>

          </div>
        </div>

        {/* PIE DE ACCIONES (SHRINK-0, SIEMPRE VISIBLE Y SIN CORTES) */}
        <div className="shrink-0 p-3 sm:px-6 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          {onReiniciar ? (
            <button
              id="btn-reiniciar-demo"
              type="button"
              onClick={onReiniciar}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl transition cursor-pointer hover:bg-slate-100"
            >
              <RotateCcw size={13} />
              <span>Volver a Demostrar</span>
            </button>
          ) : <div />}

          <button
            id="btn-cerrar-resumen-demo"
            type="button"
            onClick={onCerrar}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/25 transition active:scale-95 cursor-pointer ml-auto"
          >
            <span>Finalizar Demostración</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  )
}

