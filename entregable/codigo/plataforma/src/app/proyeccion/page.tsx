'use client'

import React, { useEffect, useState } from 'react'
import { Award, GraduationCap, Sparkles, Users, Maximize2, Minimize2 } from 'lucide-react'
import { obtenerGraduadoEnEstrado, obtenerCeremoniaActiva } from '@/servicios/api'

export default function PaginaProyeccionEscenario() {
  const [graduado, setGraduado] = useState<any>(null)
  const [ceremonia, setCeremonia] = useState<any>(null)
  const [hora, setHora] = useState(new Date())
  const [pantallaCompleta, setPantallaCompleta] = useState(false)

  // 1. Reloj en vivo
  useEffect(() => {
    const timer = setInterval(() => setHora(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 2. Cargar ceremonia inicial
  useEffect(() => {
    obtenerCeremoniaActiva()
      .then((c) => setCeremonia(c))
      .catch(() => {})
  }, [])

  // 3. Polling en tiempo real del estrado
  useEffect(() => {
    let cancelado = false

    async function sincronizarEstrado() {
      try {
        const resp = await obtenerGraduadoEnEstrado(ceremonia?.id)
        if (!cancelado) {
          setGraduado(resp?.enEstrado || null)
        }
      } catch (err) {
        // En caso de fallo de red momentáneo, mantener el último estado
      }
    }

    sincronizarEstrado()
    const intervalo = setInterval(sincronizarEstrado, 1200)

    return () => {
      cancelado = true
      clearInterval(intervalo)
    }
  }, [ceremonia?.id])

  // 4. Alternar pantalla completa
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setPantallaCompleta(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setPantallaCompleta(false)).catch(() => {})
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white font-sans overflow-hidden flex flex-col justify-between select-none">
      
      {/* Fondo institucional con gradientes sutiles */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* CABECERA DE LA PANTALLA GIGANTE */}
      <header className="relative z-10 px-10 py-8 flex items-center justify-between border-b border-slate-800/60 bg-slate-900/30 backdrop-blur-md">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 grid place-items-center shadow-lg shadow-sky-500/20">
            <GraduationCap size={32} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">
              Instituto Tecnológico Beltrán
            </p>
            <h1 className="text-2xl font-black tracking-tight text-white mt-0.5">
              {ceremonia?.nombre || 'Acto Solemne de Colación'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-3xl font-black text-slate-100 tracking-wider">
              {hora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {hora.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <button
            onClick={toggleFullscreen}
            aria-label="Pantalla completa"
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700/60"
            title="Alternar Pantalla Completa"
          >
            {pantallaCompleta ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </header>

      {/* ÁREA CENTRAL DE PROYECCIÓN */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-12">
        {graduado ? (
          /* MODO GRADUADO EN ESTRADO */
          <div className="w-full max-w-6xl text-center space-y-8 animate-in zoom-in-95 fade-in duration-300">
            
            {/* Pill de Estado */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-black uppercase tracking-widest shadow-inner">
              <Sparkles size={16} className="text-cyan-400" />
              <span>En Estrado · Entrega de Título</span>
            </div>

            {/* Nombre del Graduado */}
            <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white drop-shadow-2xl">
              {graduado.nombre}
            </h2>

            {/* Carrera / Título */}
            <div className="space-y-3">
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-300">
                {graduado.carrera}
              </p>
              
              {graduado.promedio && Number(graduado.promedio) >= 9.0 && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-base font-bold">
                  <Award size={18} className="text-amber-400" />
                  <span>Distinción de Honor · Promedio: {graduado.promedio}</span>
                </div>
              )}
            </div>

            {/* Padrinos / Entregadores */}
            {(graduado.entregador_nombre || graduado.asiento_id) && (
              <div className="pt-6 flex flex-wrap items-center justify-center gap-8 text-slate-300">
                {graduado.entregador_nombre && (
                  <div className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                    <Users size={20} className="text-indigo-400" />
                    <span className="text-lg font-semibold">Entrega: <strong className="text-white font-bold">{graduado.entregador_nombre}</strong></span>
                  </div>
                )}
                {graduado.asiento_id && (
                  <div className="px-6 py-3 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm text-lg font-semibold">
                    Butaca: <strong className="text-cyan-400 font-bold">{graduado.asiento_id}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* MODO REPOSO / BIENVENIDA INSTITUCIONAL */
          <div className="text-center space-y-6 max-w-3xl animate-in fade-in duration-500">
            <div className="h-24 w-24 mx-auto rounded-3xl bg-gradient-to-tr from-sky-600 to-indigo-600 grid place-items-center shadow-2xl shadow-sky-500/30">
              <GraduationCap size={56} className="text-white" />
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {ceremonia?.nombre || 'Ceremonia de Graduación'}
            </h2>

            <p className="text-xl sm:text-2xl text-slate-300 font-medium leading-relaxed">
              {ceremonia?.lugar || 'Auditorio Central'}
            </p>

            <div className="inline-block px-6 py-2 rounded-full bg-slate-900 border border-slate-800 text-sm font-bold text-slate-400 uppercase tracking-widest">
              Acto Solemne de Colación
            </div>
          </div>
        )}
      </main>

      {/* PIE DE PANTALLA */}
      <footer className="relative z-10 px-10 py-6 border-t border-slate-800/60 bg-slate-900/20 backdrop-blur-md flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
        <span>SiGIC · Plataforma Institucional de Ceremonias</span>
        <span>Instituto Tecnológico Beltrán</span>
      </footer>
    </div>
  )
}
