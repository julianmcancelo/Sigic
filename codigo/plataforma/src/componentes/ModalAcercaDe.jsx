import React, { useState } from 'react'
import { 
  Info, BookOpen, GraduationCap, Users, Calendar, 
  MapPin, Shield, CheckCircle, ExternalLink, Sparkles, 
  ChevronRight, Award, Laptop, Heart, FileText, Check, Copy,
  Layers, Database, Server, Smartphone, Monitor
} from 'lucide-react'

export function ModalAcercaDe({ abierto, onCerrar, onAbrirManual }) {
  const [pestana, setPestana] = useState('acerca') // 'acerca' | 'equipo' | 'arquitectura'
  const [copiado, setCopiado] = useState(false)

  if (!abierto) return null

  const integrantes = [
    { nombre: 'Cancelo Julián', rol: 'Arquitectura & Desarrollo Fullstack', tag: 'Lead Dev' },
    { nombre: 'Alfonso Alan Alexis', rol: 'Desarrollo & Lógica de Negocio', tag: 'Backend' },
    { nombre: 'Contreras Villalba Sol Heilin', rol: 'Diseño UX/UI & Documentación', tag: 'Design' },
    { nombre: 'Frassia Matías', rol: 'Infraestructura & Base de Datos', tag: 'DevOps' },
    { nombre: 'Santillán Luis Gabriel', rol: 'Control de Calidad & Testing', tag: 'QA' },
  ]

  const caracteristicas = [
    {
      titulo: 'Gestión Completa de Ceremonias',
      desc: 'Administración de actos de colación, aforo de anfiteatro, fechas y estados del evento.',
      icono: Calendar,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
    },
    {
      titulo: 'Portal de Autogestión del Graduado',
      desc: 'Confirmación de asistencia, selección de butacas y entrega de títulos por docentes.',
      icono: GraduationCap,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      titulo: 'Anfiteatro y Butacas Interactivas',
      desc: 'Distribución inteligente según fórmula de juramento y visualización en tiempo real.',
      icono: MapPin,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      titulo: 'Acreditación Móvil con QR Dinámico',
      desc: 'Validación en portería de grupos de invitados con soporte para trabajo offline.',
      icono: Shield,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    }
  ]

  const stack = [
    { icono: Monitor, capa: 'Frontend Web', tech: 'React 19 + Next.js 16 (Turbopack)', detalle: 'SPA reactiva y animada' },
    { icono: Layers, capa: 'Diseño & Estilos', tech: 'TailwindCSS 4 + Lucide Icons', detalle: 'Bento Grid & Glassmorphism' },
    { icono: Database, capa: 'Base de Datos', tech: 'Neon PostgreSQL (SSL / Pool)', detalle: 'Persistencia transaccional' },
    { icono: Smartphone, capa: 'App Móvil', tech: 'React Native + Expo Router', detalle: 'Control de ingresos en portería' },
    { icono: Server, capa: 'Distribución', tech: 'SiGIC Live (Debian) + Docker', detalle: 'Actualizaciones OTA 1-Click' }
  ]

  function copiarCreditos() {
    const texto = `SiGIC — Sistema de Gestión Institucional de Colaciones\nInstituto Tecnológico Beltrán · Tecnicatura Superior en Analista de Sistemas\nEquipo: Cancelo Julián, Alfonso Alan, Contreras Sol, Frassia Matías, Santillán Luis.`
    navigator.clipboard?.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div 
      className="sg-chill-backdrop"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="sg-chill-container !max-w-xl !max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header estilo Chill */}
        <div className="sg-chill-header">
          <div className="sg-chill-brand">
            <div className="sg-chill-logo">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3>SiGIC</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-400">
                  v0.3.2 Oficial
                </span>
              </div>
              <p>Sistema de Gestión Institucional de Colaciones</p>
            </div>
          </div>

          <button 
            onClick={onCerrar}
            className="sg-chill-close"
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Pestañas de Navegación Chill */}
        <div className="sg-chill-tabs pt-3 border-b border-white/5 pb-3">
          <button
            onClick={() => setPestana('acerca')}
            className={`sg-chill-tab ${pestana === 'acerca' ? 'activo' : ''}`}
          >
            Acerca de SiGIC
          </button>
          <button
            onClick={() => setPestana('equipo')}
            className={`sg-chill-tab ${pestana === 'equipo' ? 'activo' : ''}`}
          >
            Equipo Beltrán
          </button>
          <button
            onClick={() => setPestana('arquitectura')}
            className={`sg-chill-tab ${pestana === 'arquitectura' ? 'activo' : ''}`}
          >
            Módulos & Stack
          </button>
        </div>

        {/* Contenido Dinámico con Scroll Suave */}
        <div className="sg-chill-scroll space-y-4 py-4">
          {pestana === 'acerca' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-sky-500/[0.04] border border-sky-500/15">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-1">
                  Propósito Institucional
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Desarrollado para centralizar, automatizar y jerarquizar los actos de colación académica del <strong>Instituto Tecnológico Beltrán</strong> en la <strong>Tecnicatura Superior en Analista de Sistemas</strong>. Cubre desde la importación de padrones hasta la emisión de credenciales QR y el control de accesos en tiempo real.
                </p>
              </div>

              {/* Grid de Características */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {caracteristicas.map((c, i) => {
                  const Icono = c.icono
                  return (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3 items-start hover:border-white/10 transition">
                      <div className={`p-2 rounded-lg shrink-0 border ${c.color}`}>
                        <Icono size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-white mb-0.5">{c.titulo}</h4>
                        <p className="text-[11px] text-slate-400 leading-snug">{c.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Acceso Directo al Manual */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-white">Manual Oficial de Usuario</h4>
                    <p className="text-[11px] text-slate-400">Guía paso a paso con capturas y flujos operativos.</p>
                  </div>
                </div>
                {onAbrirManual && (
                  <button
                    onClick={() => {
                      onCerrar()
                      onAbrirManual()
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition cursor-pointer"
                  >
                    Abrir <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>
          )}

          {pestana === 'equipo' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3 rounded-xl bg-sky-500/[0.03] border border-sky-500/15 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block">
                    Instituto Tecnológico Beltrán
                  </span>
                  <h4 className="text-xs font-semibold text-white">Prácticas Profesionalizantes</h4>
                </div>
                <button
                  onClick={copiarCreditos}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 transition cursor-pointer border border-white/5"
                  title="Copiar información de los autores"
                >
                  {copiado ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiado ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {integrantes.map((m, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-sky-500/20 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-lg bg-sky-500/10 text-sky-300 font-bold text-[11px] flex items-center justify-center border border-sky-500/20">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-medium text-slate-200">{m.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 hidden sm:inline">{m.rol}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5">
                        {m.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pestana === 'arquitectura' && (
            <div className="space-y-2.5 animate-in fade-in duration-150">
              <p className="text-xs text-slate-400">
                Arquitectura desacoplada, orientada a microservicios y despliegues autónomos:
              </p>
              <div className="space-y-1.5">
                {stack.map((item, idx) => {
                  const Icono = item.icono
                  return (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-white/5 text-slate-400">
                          <Icono size={14} />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-200 block">{item.capa}</span>
                          <span className="text-[10px] text-slate-500">{item.detalle}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-sky-400">{item.tech}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Chill */}
        <div className="sg-chill-footer">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Heart size={13} className="text-rose-400 fill-rose-400" />
            <span>Instituto Tecnológico Beltrán · 2026</span>
          </div>
          <button
            onClick={onCerrar}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs transition border border-white/10 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
