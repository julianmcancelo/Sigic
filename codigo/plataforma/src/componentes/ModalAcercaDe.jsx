import React, { useState } from 'react'
import { 
  Info, BookOpen, GraduationCap, Users, Calendar, 
  MapPin, Shield, CheckCircle, ExternalLink, Sparkles, 
  ChevronRight, Award, Laptop, Heart, FileText
} from 'lucide-react'

export function ModalAcercaDe({ abierto, onCerrar, onAbrirManual }) {
  const [pestana, setPestana] = useState('acerca') // 'acerca' | 'equipo' | 'modulos'

  if (!abierto) return null

  const integrantes = [
    { nombre: 'Cancelo Julián', rol: 'Arquitectura & Desarrollo Fullstack' },
    { nombre: 'Alfonso Alan Alexis', rol: 'Desarrollo & Lógica de Negocio' },
    { nombre: 'Contreras Villalba Sol Heilin', rol: 'Diseño UX/UI & Documentación' },
    { nombre: 'Frassia Matías', rol: 'Infraestructura & Base de Datos' },
    { nombre: 'Santillán Luis Gabriel', rol: 'Control de Calidad & Testing' },
  ]

  const caracteristicas = [
    {
      titulo: 'Gestión Completa de Ceremonias',
      desc: 'Administración de actos de colación, capacidad de sala, fechas y estados operativos.',
      icono: Calendar,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
    },
    {
      titulo: 'Portal de Autogestión del Graduado',
      desc: 'Confirmación con OTP, asignación de invitados y elección de profesores entregadores.',
      icono: GraduationCap,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      titulo: 'Anfiteatro y Mapa de Butacas',
      desc: 'Distribución algorítmica por fórmula de juramento y visualización interactiva.',
      icono: MapPin,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      titulo: 'Acreditación Móvil con QR',
      desc: 'Pase grupal digital con validación sin conexión (offline) para el día del evento.',
      icono: Shield,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    }
  ]

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-sky-500/30 bg-[#03080e] shadow-2xl text-slate-100 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera Institucional */}
        <div className="relative bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 p-6 border-b border-sky-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shadow-inner">
                <img src="/logo-oficial.png" alt="SiGIC Logo" className="h-8 w-8 object-contain" onError={(e) => { e.target.style.display = 'none' }} />
                <Sparkles size={22} className="hidden only:block" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-wide text-white">SiGIC</h2>
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-300 border border-sky-500/30">
                    v2026 Live
                  </span>
                </div>
                <p className="text-xs text-sky-300/80 font-medium">
                  Sistema Institucional de Gestión Integral de Colaciones
                </p>
              </div>
            </div>

            <button 
              onClick={onCerrar}
              className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              title="Cerrar ventana"
            >
              ✕
            </button>
          </div>

          {/* Selector de pestañas */}
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => setPestana('acerca')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                pestana === 'acerca' 
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' 
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              Acerca de SiGIC
            </button>
            <button
              onClick={() => setPestana('equipo')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                pestana === 'equipo' 
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' 
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              Equipo Beltrán
            </button>
            <button
              onClick={() => setPestana('modulos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                pestana === 'modulos' 
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20' 
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              Módulos y Arquitectura
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-sm">
          {pestana === 'acerca' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-4">
                <h3 className="text-sm font-bold text-sky-300 mb-1 flex items-center gap-2">
                  <Laptop size={16} /> Práctica Profesionalizante 2026
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Desarrollado para el <strong>Instituto Tecnológico Beltrán</strong> como solución integral de automatización y control para actos solemnes de colación de grado, abarcando desde la importación inicial de egresados hasta la acreditación ágil en portería.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {caracteristicas.map((c, i) => {
                  const Icono = c.icono
                  return (
                    <div key={i} className={`p-3.5 rounded-2xl border ${c.color} bg-slate-900/40`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icono size={16} />
                        <h4 className="text-xs font-bold text-white">{c.titulo}</h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{c.desc}</p>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-sky-400" size={22} />
                  <div>
                    <h4 className="text-xs font-bold text-white">Manual Oficial de Usuario y Soporte</h4>
                    <p className="text-[11px] text-slate-400">Guía interactiva completa paso a paso con capturas y procedimientos.</p>
                  </div>
                </div>
                {onAbrirManual && (
                  <button
                    onClick={() => {
                      onCerrar()
                      onAbrirManual()
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-black text-xs hover:bg-sky-400 transition cursor-pointer shrink-0"
                  >
                    Ver Manual <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {pestana === 'equipo' && (
            <div className="space-y-4">
              <div className="text-center p-3 rounded-2xl bg-sky-950/20 border border-sky-500/20">
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-widest">Instituto Tecnológico Beltrán</span>
                <h3 className="text-sm font-black text-white mt-0.5">Alumnos de la Práctica Profesionalizante</h3>
              </div>

              <div className="space-y-2">
                {integrantes.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-sky-500/30 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-sky-500/20 text-sky-300 font-black text-xs flex items-center justify-center border border-sky-500/30">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-bold text-white">{m.nombre}</span>
                    </div>
                    <span className="text-[11px] text-sky-300/80 font-medium">{m.rol}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pestana === 'modulos' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                SiGIC OS Appliance está construido sobre una arquitectura desacoplada de alto rendimiento:
              </p>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 font-bold">Frontend Web</span>
                  <span className="text-white font-mono">React 19 + Next.js 16 (Turbopack)</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 font-bold">Estilos & UI</span>
                  <span className="text-white font-mono">TailwindCSS 4 + Lucide Icons</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 font-bold">Base de Datos</span>
                  <span className="text-white font-mono">PostgreSQL / Base Embebida</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 font-bold">App Móvil Portería</span>
                  <span className="text-white font-mono">React Native + Expo Router</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Sistema Operativo</span>
                  <span className="text-sky-300 font-mono">SiGIC OS (Debian Live XFCE)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie institucional */}
        <div className="p-4 bg-slate-950/80 border-t border-sky-500/20 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-rose-500 fill-rose-500" />
            <span>Instituto Tecnológico Beltrán · 2026</span>
          </div>
          <button
            onClick={onCerrar}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
