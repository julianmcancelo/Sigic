import React from 'react'
import {
  Sparkles, CheckCircle2, Award, Users, Send,
  Armchair, QrCode, Calendar, MapPin, X, ArrowRight, RotateCcw
} from 'lucide-react'

export function ModalResumenDemostracion({
  ceremonia,
  graduados = [],
  invitados = [],
  butacasAsignadas = 0,
  onCerrar,
  onReiniciar
}) {
  const nombreCeremonia = ceremonia?.nombre || 'Colación Oficial Beltrán 2026'
  const fechaCeremonia = ceremonia?.fecha
    ? new Date(`${ceremonia.fecha}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '20 de Noviembre de 2026'
  const sedeCeremonia = ceremonia?.lugar || 'Auditorio Mayor Instituto Beltrán'
  const totalGraduados = graduados.length || 12
  const totalAcompanantes = invitados.length || 24

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-250">
        
        {/* ENCABEZADO SOLEMNE INSTITUCIONAL */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 p-6 sm:p-7 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shadow-inner">
                <Award size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-400">SiGIC · Plataforma Institucional</p>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">Ciclo de Colación Concluido</h2>
              </div>
            </div>

            <button
              id="btn-cerrar-modal-resumen-x"
              type="button"
              onClick={onCerrar}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-bold">
              <Calendar size={13} className="text-sky-400" />
              <span>{fechaCeremonia}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <MapPin size={13} className="text-sky-400" />
              <span>{sedeCeremonia}</span>
            </div>
          </div>
        </div>

        {/* CUERPO CON HITOS Y MÉTRICAS */}
        <div className="p-6 overflow-y-auto space-y-5 [scrollbar-width:thin]">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              Resumen Operativo de la Ceremonia: "{nombreCeremonia}"
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
                  <Users size={15} />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Graduados</span>
                </div>
                <p className="text-xl font-black text-slate-900">{totalGraduados}</p>
                <p className="text-[9.5px] text-slate-400 font-semibold">6 carreras técnicas</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                  <Send size={15} />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Convocatoria</span>
                </div>
                <p className="text-xl font-black text-slate-900">100%</p>
                <p className="text-[9.5px] text-slate-400 font-semibold">Tokens OTP enviados</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-1.5 text-teal-600 mb-1">
                  <QrCode size={15} />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Credenciales</span>
                </div>
                <p className="text-xl font-black text-slate-900">Digital</p>
                <p className="text-[9.5px] text-slate-400 font-semibold">QR + Google Wallet</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                  <Armchair size={15} />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Auto-Seating</span>
                </div>
                <p className="text-xl font-black text-slate-900">100%</p>
                <p className="text-[9.5px] text-slate-400 font-semibold">Butacas asignadas</p>
              </div>
            </div>
          </div>

          {/* LISTA DE HITOS COMPLETADOS */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-2.5">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Flujo Integral de Autogestión Completado
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-emerald-800">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Padrón oficial importado y validado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Despacho de invitaciones y autenticación OTP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Fórmula protocolar de juramento confirmada</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Docente padrino y familiares registrados</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Pase grupal emitido con código QR de seguridad</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Distribución algorítmica en Platea y Pullman</span>
              </div>
            </div>
          </div>

          {/* MENSAJE INSTITUCIONAL DE AGRADECIMIENTO */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl space-y-2 border border-slate-800">
            <div className="flex items-center gap-2 text-sky-400">
              <Sparkles size={16} />
              <h4 className="text-xs font-black uppercase tracking-wider">Agradecimiento Institucional</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Expresamos nuestro sincero agradecimiento a las autoridades rectorales, al cuerpo docente y a la comunidad educativa del <strong className="text-white font-bold">Instituto Tecnológico Beltrán</strong> por hacer posible la modernización de los actos de colación con SiGIC.
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Eficiencia, transparencia y solemnidad para cada egresado y su familia.
            </p>
          </div>
        </div>

        {/* PIE CON ACCIONES */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {onReiniciar && (
            <button
              id="btn-reiniciar-demo"
              type="button"
              onClick={onReiniciar}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Volver a Demostrar</span>
            </button>
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              id="btn-cerrar-resumen-demo"
              type="button"
              onClick={onCerrar}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
            >
              <span>Finalizar Demostración</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
