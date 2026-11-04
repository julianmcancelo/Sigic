import { useState, useEffect, useRef } from 'react'
import {
  Users, GraduationCap, BookOpen, ChevronRight, Info, LogIn,
  Sparkles, Award, Shield, ArrowRight, Lock
} from 'lucide-react'
import { VERSION_LABEL } from '../lib/version'

export function PantallaSeleccionLogin({
  onSeleccionarAdmin,
  onSeleccionarEgresado,
  onSeleccionarManual,
  onSeleccionarLanding,
  enMantenimiento,
  accesoOculto,
  modoDemo = false
}) {
  const [clickCount, setClickCount] = useState(0)
  const [revelado, setRevelado] = useState(false)
  const [mostrarInfo, setMostrarInfo] = useState(false)

  useEffect(() => {
    if (accesoOculto === false) {
      setRevelado(true)
    }
  }, [accesoOculto])

  function manejarClickLogo() {
    if (revelado) return
    const nuevo = clickCount + 1
    if (nuevo >= 5) {
      setRevelado(true)
    } else {
      setClickCount(nuevo)
    }
  }

  const equipo = [
    { nombre: 'Alan Alexis Alfonso', cargo: 'Desarrollo Frontend / UI' },
    { nombre: 'Julián Cancelo', cargo: 'Arquitectura & Seguridad' },
    { nombre: 'Sol Contreras V.', cargo: 'Protocolo & UX' },
    { nombre: 'Matías Frassia', cargo: 'Base de Datos & Backend' },
    { nombre: 'Luis Gabriel Santillán', cargo: 'Infraestructura & Redes' },
  ]

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#070e17] text-white font-sans selection:bg-sky-500 selection:text-slate-950 p-4 sm:p-6 antialiased">
      {/* Resplandor solemne azul Beltrán en el fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0c2e4e] via-[#071322] to-[#070e17] opacity-90 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Contenedor central elevado */}
      <div className="relative z-10 w-full max-w-xl mx-auto text-center flex flex-col items-center">
        
        {/* Escudo Beltrán con microinteracción de seguridad (5 clics) */}
        <div
          onClick={manejarClickLogo}
          className="group relative mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-white border border-sky-400/40 p-2 cursor-pointer shadow-xl shadow-sky-950/60 transition-transform active:scale-95 hover:scale-105"
          title="Instituto Tecnológico Beltrán · SiGIC"
        >
          <img
            src="/logo-escudo-recortado.png"
            alt="Instituto Beltrán"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Insignia Institucional */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-950 border border-sky-500/40 text-sky-300 text-xs font-semibold mb-6">
          <Award size={14} className="text-sky-400" />
          <span>Instituto Tecnológico Beltrán · Promoción 2026</span>
        </div>

        {/* Título Principal de Vanguardia */}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Sistema de Gestión <br />
          <span className="text-sky-400">Institucional de Colaciones</span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-md mx-auto leading-relaxed">
          Plataforma oficial de autogestión de egresados, asignación de butacas en anfiteatro y acreditación digital en portería.
        </p>

        {/* Modo Mantenimiento */}
        {enMantenimiento && (
          <div className="mt-6 w-full p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs">
            El sistema se encuentra temporalmente en mantenimiento técnico.
          </div>
        )}

        {/* ─── VISTA NORMAL: ACCIONES PRINCIPALES BOLDER ─── */}
        {!revelado && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
            {/* Botón Principal: Portal de la Ceremonia */}
            <button
              type="button"
              onClick={onSeleccionarLanding}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-sky-950/50 transition active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Sparkles size={16} />
              <span>Ver Ceremonia Beltrán</span>
            </button>

            {/* Botón Secundario: Ingreso Directo a Autogestión / Administración */}
            <button
              type="button"
              onClick={() => setRevelado(true)}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-sky-800 bg-[#0c1f33] hover:bg-sky-900/60 px-5 py-3.5 text-xs font-bold text-sky-200 hover:text-white transition active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <LogIn size={15} />
              <span>Iniciar Sesión</span>
            </button>
          </div>
        )}

        {/* ─── VISTA REVELADA: SELECCIÓN DE ROL / ACCESO DIRECTO ─── */}
        {revelado && (
          <div className="mt-8 w-full max-w-md bg-[#0b1a2a] border border-sky-900/60 rounded-3xl p-6 shadow-2xl text-left animate-fade-in">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-sky-950">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Acceso al Sistema</p>
                <h2 className="text-base font-black text-white">Seleccioná tu perfil</h2>
              </div>
              <button
                type="button"
                onClick={() => setRevelado(false)}
                className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                Volver
              </button>
            </div>

            <div className="space-y-3">
              {/* Opción Portal Egresado */}
              <button
                type="button"
                onClick={onSeleccionarEgresado}
                className="group w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#071322] border border-sky-950 hover:border-sky-500/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-sky-950 border border-sky-600/40 text-sky-300 flex items-center justify-center shrink-0 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">Portal del Graduado</p>
                    <p className="text-[11px] text-slate-400">Confirmación, acompañantes y credencial QR</p>
                  </div>
                </div>
                <ArrowRight size={15} className="text-sky-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Opción Administración */}
              <button
                type="button"
                onClick={onSeleccionarAdmin}
                className="group w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#071322] border border-sky-950 hover:border-sky-500/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#0c2438] border border-sky-700/40 text-sky-300 flex items-center justify-center shrink-0 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">Administración & Secretaría</p>
                    <p className="text-[11px] text-slate-400">Padrón, anfiteatro, invitaciones y control</p>
                  </div>
                </div>
                <ArrowRight size={15} className="text-sky-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Opción Manual de Usuario */}
              {onSeleccionarManual && (
                <button
                  type="button"
                  onClick={onSeleccionarManual}
                  className="group w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#071322] border border-sky-950 hover:border-sky-500/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Manual del Sistema</p>
                      <p className="text-[11px] text-slate-400">Guías operativas y documentación oficial</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer Institucional */}
        <div className="mt-14 space-y-1.5">
          <button
            type="button"
            onClick={() => setMostrarInfo(true)}
            className="text-[11px] font-bold text-sky-300 hover:text-white uppercase tracking-wider transition cursor-pointer"
          >
            Instituto Tecnológico Beltrán · Analista de Sistemas
          </button>
          <p className="text-[10px] text-slate-400 font-mono">{VERSION_LABEL}</p>
        </div>

      </div>

      {/* Modal de Información del Proyecto */}
      {mostrarInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-sky-900/60 bg-[#0b1a2a] p-6 text-center shadow-2xl relative">
            <h3 className="text-sm font-black uppercase tracking-wider text-sky-400">
              Proyecto Integrador PPT3
            </h3>
            <p className="text-xs text-slate-300 mt-1 font-semibold">
              Tecnicatura Superior en Analista de Sistemas
            </p>

            <div className="my-4 h-px bg-sky-950" />

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              SiGIC fue concebido y desarrollado para sistematizar de punta a punta las ceremonias solemnes de colación del Instituto Beltrán.
            </p>

            <div className="space-y-2 text-left mb-6">
              {equipo.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-sky-950/60">
                  <span className="font-bold text-white">{m.nombre}</span>
                  <span className="text-[10px] text-sky-400">{m.cargo}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMostrarInfo(false)}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
