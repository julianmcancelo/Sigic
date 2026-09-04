import React from 'react'
import {
  Sparkles, CheckCircle2, Award, Users, Send,
  Armchair, QrCode, Calendar, MapPin, X, ArrowRight,
  RotateCcw, GraduationCap, Check
} from 'lucide-react'

export function ModalResumenDemostracion({
  ceremonia,
  graduados = [],
  invitados = [],
  butacasAsignadas = 0,
  onCerrar,
  onReiniciar
}) {
  const nombreCeremonia = ceremonia?.nombre || 'LXIV Ceremonia Solemne de Grado Beltrán'
  const fechaCeremonia = ceremonia?.fecha
    ? new Date(`${ceremonia.fecha}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '20 de Noviembre de 2026'
  const sedeCeremonia = ceremonia?.lugar || 'Auditorio Mayor Instituto Beltrán'
  const totalGraduados = graduados.length || 12

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* ENCABEZADO SOLEMNE INSTITUCIONAL (SHRINK-0) */}
        <div className="shrink-0 bg-gradient-to-r from-slate-950 via-[#002b49] to-slate-900 p-5 sm:p-6 text-white border-b border-white/10 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shadow-inner shrink-0">
                <Award size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-400/20 border border-sky-400/30 text-[9px] font-black uppercase tracking-wider text-sky-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Instituto Tecnológico Beltrán · SiGIC
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Ciclo de Colación Concluido
                </h2>
                <p className="text-xs text-slate-300 font-medium">
                  {nombreCeremonia}
                </p>
              </div>
            </div>

            <button
              id="btn-cerrar-modal-resumen-x"
              type="button"
              onClick={onCerrar}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
              title="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-semibold">
              <Calendar size={13} className="text-sky-400 shrink-0" />
              <span>{fechaCeremonia}</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold">
              <MapPin size={13} className="text-sky-400 shrink-0" />
              <span>{sedeCeremonia}</span>
            </div>
          </div>
        </div>

        {/* CUERPO SCROLLEABLE CON KPIS, HITOS Y AGRADECIMIENTO (FLEX-1 MIN-H-0) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 [scrollbar-width:thin]">
          
          {/* TARJETAS DE MÉTRICAS EJECUTIVAS (BENTO GRID) */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
              Balance Operativo de la Colación
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-600 mb-1">
                  <Users size={15} />
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">100% Padrón</span>
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 leading-none mb-1">{totalGraduados}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">6 carreras oficiales</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-blue-600 mb-1">
                  <Send size={15} />
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">Emitidos</span>
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 leading-none mb-1">100%</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Tokens OTP validados</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-teal-600 mb-1">
                  <QrCode size={15} />
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">Pase Grupal</span>
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 leading-none mb-1">Digital</p>
                  <p className="text-[10px] text-slate-500 font-semibold">QR + Google Wallet</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-600 mb-1">
                  <Armchair size={15} />
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">Auto-Seating</span>
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 leading-none mb-1">100%</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Platea y Pullman</p>
                </div>
              </div>
            </div>
          </div>

          {/* MATRIZ DE HITOS PROTOCOLARES VERIFICADOS */}
          <div className="p-3.5 sm:p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Hitos Protocolares Cumplidos
              </h4>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                Ciclo Completo Certificado
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={10} strokeWidth={3} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-[11px]">Padrón oficial verificado</p>
                  <p className="text-[9.5px] text-slate-500">12 egresados con DNI y legajo correlativo</p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={10} strokeWidth={3} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-[11px]">Convocatoria y autenticación OTP</p>
                  <p className="text-[9.5px] text-slate-500">Invitaciones emitidas con token único</p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={10} strokeWidth={3} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-[11px]">Fórmula de juramento protocolar</p>
                  <p className="text-[9.5px] text-slate-500">Opción protocolar confirmada para el estrado</p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={10} strokeWidth={3} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-[11px]">Docentes padrinos y acompañantes</p>
                  <p className="text-[9.5px] text-slate-500">Familiares con DNI y entrega de diploma</p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={10} strokeWidth={3} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-[11px]">Pase grupal con QR y Wallet</p>
                  <p className="text-[9.5px] text-slate-500">Credencial segura escaneable en portería</p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={10} strokeWidth={3} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-[11px]">Distribución inteligente de butacas</p>
                  <p className="text-[9.5px] text-slate-500">Algoritmo Auto-Seating en Platea y Pullman</p>
                </div>
              </div>
            </div>
          </div>

          {/* PLACA SOLEMNE: AGRADECIMIENTO DEL EQUIPO EXPOSITOR */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-[#002447] to-slate-950 p-4 sm:p-5 text-white border border-sky-400/30 shadow-md">
            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <Sparkles size={16} />
              <h4 className="text-xs font-black uppercase tracking-wider text-sky-300">
                Agradecimiento del Equipo Expositor
              </h4>
            </div>
            
            <p className="text-xs text-slate-200 leading-relaxed font-normal mb-2.5">
              Queremos expresar nuestro sincero agradecimiento a los <strong className="text-white font-bold">profesores, directivos y a las autoridades del Instituto Tecnológico Beltrán</strong> por su tiempo, orientación y por permitirnos compartir esta demostración de la plataforma <strong className="text-sky-300 font-bold">SiGIC</strong>.
            </p>

            <p className="text-xs text-slate-300 leading-relaxed font-normal mb-3">
              Este proyecto representa la integración práctica de los conocimientos adquiridos a lo largo de nuestra trayectoria académica, con el propósito de poner la tecnología al servicio de nuestra propia comunidad educativa.
            </p>

            <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <GraduationCap size={13} className="text-sky-400" />
                <span>Muchas gracias por su atención y apoyo constante.</span>
              </div>
              <span className="text-[10px] font-bold text-sky-300/90 tracking-wide uppercase">
                Alumnos del Instituto Tecnológico Beltrán
              </span>
            </div>
          </div>

        </div>

        {/* PIE CON ACCIONES (SHRINK-0, SIEMPRE VISIBLE Y SIN CORTES) */}
        <div className="shrink-0 p-3.5 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {onReiniciar ? (
            <button
              id="btn-reiniciar-demo"
              type="button"
              onClick={onReiniciar}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl transition cursor-pointer hover:bg-slate-200/60"
            >
              <RotateCcw size={13} />
              <span>Volver a Demostrar</span>
            </button>
          ) : <div />}

          <button
            id="btn-cerrar-resumen-demo"
            type="button"
            onClick={onCerrar}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/25 transition active:scale-95 cursor-pointer"
          >
            <span>Finalizar Demostración</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  )
}
