import React, { useState, useEffect } from 'react'
import {
  Sparkles, GraduationCap, Users, QrCode, BookOpen,
  Download, ArrowRight, ShieldCheck, CheckCircle2, Clock,
  MapPin, Smartphone, ChevronDown, Lock, KeyRound,
  ExternalLink, Search, Calendar, Award, Heart,
  Check, ArrowUpRight, HelpCircle, Smile, UserCheck, Ticket,
  Star, Share2, Info, MessageCircle, Map, School
} from 'lucide-react'
import { VERSION_LABEL } from '../lib/version'
import { obtenerCeremoniaActiva } from '../servicios/api'

export function LandingInstitucional({
  onSeleccionarAdmin,
  onSeleccionarEgresado,
  onSeleccionarManual,
  enMantenimiento,
  modoDemo = false
}) {
  const [ceremonia, setCeremonia] = useState(null)
  const [cargandoCeremonia, setCargandoCeremonia] = useState(true)
  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [faqAbierta, setFaqAbierta] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    async function cargarCeremonia() {
      try {
        const datos = await obtenerCeremoniaActiva()
        if (datos && !datos.error) {
          setCeremonia(datos)
        }
      } catch (err) {
        console.warn('No se pudo cargar ceremonia activa en landing:', err)
      } finally {
        setCargandoCeremonia(false)
      }
    }
    cargarCeremonia()
  }, [])

  function manejarBuscarEgresado(e) {
    e.preventDefault()
    onSeleccionarEgresado(terminoBusqueda)
  }

  const toggleFaq = (index) => {
    setFaqAbierta(faqAbierta === index ? null : index)
  }

  // Formatear fecha amigable en español
  let fechaCeremoniaTexto = 'Fecha a confirmar'
  let horaCeremoniaTexto = '18:30 hs'
  if (ceremonia?.fecha) {
    try {
      const d = new Date(ceremonia.fecha.includes('T') ? ceremonia.fecha : `${ceremonia.fecha}T12:00:00`)
      if (!isNaN(d.getTime())) {
        fechaCeremoniaTexto = new Intl.DateTimeFormat('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(d)
        fechaCeremoniaTexto = fechaCeremoniaTexto.charAt(0).toUpperCase() + fechaCeremoniaTexto.slice(1)
      }
    } catch {}
    if (ceremonia.hora) {
      horaCeremoniaTexto = `${ceremonia.hora} hs`
    }
  }

  const pasosSimples = [
    {
      numero: '01',
      icono: UserCheck,
      titulo: 'Confirmá tu Asistencia',
      descripcion: 'Ingresá con tu DNI para verificar tus datos personales, elegir tu juramento y confirmar tu participación.',
      etiqueta: 'Paso Inicial',
      gradient: 'from-blue-600 to-cyan-500',
      bgGlow: 'bg-blue-500/10 text-blue-600 border-blue-200/80'
    },
    {
      numero: '02',
      icono: Users,
      titulo: 'Anotá a tus Invitados',
      descripcion: 'Cargá los nombres y DNI de tus seres queridos que van a compartir este momento con vos en el auditorio.',
      etiqueta: 'Acompañantes',
      gradient: 'from-indigo-600 to-purple-500',
      bgGlow: 'bg-indigo-500/10 text-indigo-600 border-indigo-200/80'
    },
    {
      numero: '03',
      icono: Ticket,
      titulo: 'Descargá tu Pase QR',
      descripcion: 'Obtené tu credencial digital lista en el celular. Entran todos juntos escaneando un solo código en la puerta.',
      etiqueta: 'Ingreso Rápido',
      gradient: 'from-emerald-600 to-teal-500',
      bgGlow: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/80'
    }
  ]

  const faqs = [
    {
      pregunta: '¿Tiene algún costo registrarme o llevar acompañantes?',
      respuesta: '¡No, para nada! El acto de colación y el uso de la plataforma SiGIC es 100% gratuito e institucional, brindado por el Instituto Tecnológico Beltrán para vos y tu familia.'
    },
    {
      pregunta: '¿Cómo ingreso si no recibí el correo de invitación?',
      respuesta: 'Solo necesitás ingresar tu número de DNI en el buscador de esta página. El sistema validará tu identidad y te enviará un código de verificación seguro a tu casilla registrada para ingresar al instante.'
    },
    {
      pregunta: '¿Puedo modificar la lista de invitados después de guardar?',
      respuesta: 'Sí, totalmente. Podés ingresar a tu portal y editar o reasignar tus acompañantes las veces que lo necesites hasta la fecha límite establecida por la institución.'
    },
    {
      pregunta: '¿Cómo ingresamos al auditorio el día de la ceremonia?',
      respuesta: 'Al llegar a la sede, solo mostrás tu Pase QR desde la pantalla de tu celular al personal de portería. El código funciona como pase grupal para vos y tus acompañantes registrados.'
    },
    {
      pregunta: '¿Qué sucede si no puedo asistir al acto presencial?',
      respuesta: 'Podés indicar tu inasistencia desde el portal con un solo clic. Tu título y medalla quedarán debidamente resguardados para que los retires por secretaría académica.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden relative">
      
      {/* ══ MESH GRADIENT DECORATIVO DE FONDO ════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-100/50 via-sky-50/40 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-indigo-100/35 rounded-full blur-[120px]" />
        <div className="absolute top-2/3 -left-40 w-[450px] h-[450px] bg-emerald-100/30 rounded-full blur-[110px]" />
      </div>

      {/* ══ 1. NAVBAR FLOTANTE GLASSMORPHISM ═════════════════════════ */}
      <header
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-5xl transition-all duration-300 rounded-full animate-pill-header ${
          scrolled
            ? 'landing-glass bg-white/90 shadow-[0_12px_36px_rgba(15,23,42,0.08)] py-2 px-3 sm:px-6'
            : 'bg-white/80 backdrop-blur-md border border-slate-200/70 shadow-sm shadow-slate-200/40 py-2.5 px-4 sm:px-6'
        }`}
      >
        <div className="flex items-center justify-between">
          
          {/* Logo Beltrán con micro brillo */}
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-slate-200/80 bg-white p-1 shadow-xs animate-float">
              <img src="/logo-oficial.png" alt="Instituto Beltrán" className="h-full w-full object-contain" />
            </div>
            <a href="#" className="flex items-center gap-2 group">
              <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                SiGIC
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-blue-50/90 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-blue-700 border border-blue-200/60">
                <Sparkles size={10} className="text-blue-600" />
                Colaciones 2026
              </span>
            </a>
          </div>

          {/* Links de navegación suave */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600">
            <a href="#portal" className="transition-colors hover:text-blue-600 duration-150 py-1">Portal Egresados</a>
            <a href="#pasos" className="transition-colors hover:text-blue-600 duration-150 py-1">¿Cómo funciona?</a>
            <a href="#evento" className="transition-colors hover:text-blue-600 duration-150 py-1">La Ceremonia</a>
            <a href="#preguntas" className="transition-colors hover:text-blue-600 duration-150 py-1">Preguntas Frecuentes</a>
          </nav>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSeleccionarManual}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 hover:bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition duration-150 cursor-pointer shadow-2xs"
            >
              <BookOpen size={13} className="text-blue-600" />
              <span>Ayuda</span>
            </button>

            <button
              onClick={onSeleccionarAdmin}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 hover:bg-blue-600 px-4 py-1.5 text-xs font-black text-white shadow-md shadow-slate-900/10 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Lock size={12} />
              <span>Acceso Personal</span>
            </button>
          </div>

        </div>
      </header>

      {/* ══ 2. HERO PRINCIPAL: HIGH AESTHETIC & INTERACTIVE ═══════════ */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 px-4 sm:px-8 overflow-hidden grain-overlay z-10">
        <div className="relative mx-auto max-w-5xl text-center space-y-7">
          
          {/* Badge de Felicitaciones Flotante */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/90 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm shadow-blue-500/5 animate-reveal-up animation-delay-100">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 pulsing-dot" />
            <span>✨ ¡Felicitaciones a los nuevos Egresados!</span>
            <span className="text-slate-300">·</span>
            <span className="font-extrabold text-blue-900">Instituto Beltrán</span>
          </div>

          {/* Título Monumental & Tipografía Refinada */}
          <div className="space-y-3 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1] animate-slide-up">
              Un momento único para{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                celebrar tu logro
              </span>{' '}
              con quienes más querés.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed animate-reveal-up animation-delay-200">
              Confirmá tu asistencia en 1 minuto, anotá a tus acompañantes y obtené tu pase digital QR para ingresar juntos el día de la colación.
            </p>
          </div>

          {/* ══ BUSCADOR AMIGABLE + SIMULADOR DE PASE QR ══ */}
          <div id="portal" className="pt-4 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center animate-scale-in animation-delay-300">
            
            {/* Columna Izquierda: Buscador de Egresado */}
            <div className="lg:col-span-7 text-left">
              <div className="landing-glass-card rounded-3xl p-6 sm:p-8 border border-white/90 shadow-xl shadow-blue-950/5">
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Portal de Autogestión</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Acceso directo para graduados</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                    <Check size={12} /> 100% Gratuito
                  </span>
                </div>

                <form onSubmit={manejarBuscarEgresado} className="space-y-3">
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={terminoBusqueda}
                      onChange={(e) => setTerminoBusqueda(e.target.value)}
                      placeholder="Ingresá tu DNI o Correo electrónico..."
                      className="w-full rounded-2xl border border-slate-200 bg-white/95 pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 shadow-inner"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                  >
                    <span>Entrar a mi Portal de Graduado</span>
                    <ArrowRight size={17} />
                  </button>
                </form>

                <div className="mt-4 pt-3.5 border-t border-slate-200/60 flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                  <span>Sin contraseñas difíciles: ingresás con un código simple a tu correo.</span>
                </div>

              </div>
            </div>

            {/* Columna Derecha: Vista Previa Estética de la Credencial QR */}
            <div className="lg:col-span-5">
              <div className="relative group">
                
                {/* Glow decorativo de fondo */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition duration-300" />
                
                {/* Tarjeta Credencial Simulada */}
                <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-6 text-white border border-slate-700/80 shadow-2xl overflow-hidden text-left">
                  
                  {/* Hologram Reflection */}
                  <div className="absolute inset-0 hologram-shine pointer-events-none opacity-20" />

                  {/* Header de la Credencial */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-white/10 p-0.5 border border-white/20">
                        <img src="/logo-oficial.png" alt="Logo" className="h-full w-full object-contain" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-200">
                        Pase Digital SiGIC
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Activo
                    </span>
                  </div>

                  {/* Cuerpo de la Credencial */}
                  <div className="py-4 space-y-3 relative z-10">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Graduado/a</span>
                      <p className="text-sm font-black text-white flex items-center gap-1.5">
                        <Award size={14} className="text-amber-400" />
                        Egresado Beltrán
                      </p>
                      <p className="text-[11px] text-slate-300 font-medium truncate">Tecnicatura Superior</p>
                    </div>

                    {/* QR Preview Box */}
                    <div className="bg-white p-3 rounded-2xl flex items-center justify-between gap-3 text-slate-900 shadow-lg">
                      <div className="h-16 w-16 bg-slate-100 rounded-xl p-1.5 border border-slate-200 flex items-center justify-center shrink-0">
                        <QrCode size={52} className="text-slate-900" />
                      </div>
                      <div className="space-y-1 text-right">
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          Pase Grupal
                        </span>
                        <p className="text-xs font-bold text-slate-800">Egresado + 2 Invitados</p>
                        <p className="text-[10px] text-slate-500 font-semibold">Ubicación Asignada</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer de la Credencial */}
                  <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 relative z-10 border-t border-white/10">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-blue-400" /> Auditorio Beltrán
                    </span>
                    <span className="text-slate-300 font-bold">Colación Oficial 2026</span>
                  </div>

                </div>

              </div>
            </div>

          </div>

          {/* Micro badges de confianza */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" /> Confirmación en 1 minuto
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={15} className="text-indigo-600" /> Registro de acompañantes
            </span>
            <span className="flex items-center gap-1.5">
              <Smartphone size={15} className="text-blue-600" /> Ingreso 100% digital
            </span>
          </div>

        </div>
      </section>

      {/* ══ 3. PASO A PASO SUPER CLARO CON CONECTOR ═════════════════ */}
      <section id="pasos" className="py-20 px-4 sm:px-8 bg-white border-y border-slate-200/80 relative z-10">
        <div className="mx-auto max-w-5xl">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2 animate-reveal-up">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
              Proceso Simplificado
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-2">
              ¿Cómo asegurás tu lugar?
            </h2>
            <p className="text-sm text-slate-500">
              Solo 3 pasos intuitivos para que vos y tu familia disfruten de este logro sin complicaciones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {pasosSimples.map((paso, idx) => {
              const Icono = paso.icono
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-slate-200/90 bg-slate-50/60 p-7 shadow-xs hover:shadow-xl hover:border-blue-300 hover:bg-white transition-all duration-300 group flex flex-col justify-between animate-reveal-up relative"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${paso.bgGlow}`}>
                        <Icono size={22} />
                      </div>
                      <span className="text-2xl font-black text-slate-300 group-hover:text-blue-600 transition-colors">
                        {paso.numero}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {paso.etiqueta}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors mt-1.5">
                        {paso.titulo}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {paso.descripcion}
                    </p>
                  </div>

                  <div className="pt-4 mt-5 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <CheckCircle2 size={15} />
                    <span>Rápido y desde el celular</span>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ══ 4. DATOS DE TU CEREMONIA (EVENTO EN VIVO) ════════════════ */}
      <section id="evento" className="mx-auto max-w-5xl px-4 sm:px-8 py-16 relative z-10">
        <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-white via-sky-50/40 to-blue-50/50 p-7 sm:p-10 shadow-lg shadow-blue-500/5 relative overflow-hidden group animate-reveal-up">
          
          <div className="space-y-6 relative z-10">
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold uppercase tracking-wide">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Convocatoria en Curso
              </span>
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 bg-white px-3.5 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                <MapPin size={14} className="text-blue-600" />
                {ceremonia?.lugar || 'Auditorio Central · Instituto Beltrán'}
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {ceremonia?.nombre || 'Ceremonia Oficial de Colación'}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-normal max-w-2xl">
                Entrega formal de diplomas y medallas de honor a los egresados de tecnicaturas superiores y carreras académicas.
              </p>
            </div>

            {/* Tarjetas informativas de fecha, hora y acceso */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar size={13} className="text-blue-600" /> Fecha del Acto
                </p>
                <p className="font-extrabold text-slate-800 text-sm mt-1">{fechaCeremoniaTexto}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock size={13} className="text-blue-600" /> Horario
                </p>
                <p className="font-extrabold text-slate-800 text-sm mt-1">{horaCeremoniaTexto}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <QrCode size={13} className="text-blue-600" /> Modalidad de Ingreso
                </p>
                <p className="font-extrabold text-blue-700 text-sm mt-1">Pase QR en tu Celular</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ══ 5. BENTO GRID DE BENEFICIOS Y COMODIDAD ══════════════════ */}
      <section className="py-20 px-4 sm:px-8 bg-slate-50/70 border-t border-slate-200/80 relative z-10">
        <div className="mx-auto max-w-5xl">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2 animate-reveal-up">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
              Pensado para vos
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-2">
              Todo resuelto desde tu portal
            </h2>
            <p className="text-sm text-slate-500">
              Diseñamos cada detalle para que disfrutes de tu graduación sin estrés ni demoras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bento Card 1: Padrino/Madrina */}
            <div className="landing-glass-card rounded-3xl p-7 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 group flex items-start gap-5 animate-reveal-up">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Heart size={22} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                  Momento Especial
                </span>
                <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  Elegí a tu Padrino o Madrina
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Podés seleccionar al docente o directivo con quien compartiste tu trayecto académico para que te entregue tu diploma sobre el escenario.
                </p>
              </div>
            </div>

            {/* Bento Card 2: Pase QR Grupal */}
            <div className="landing-glass-card rounded-3xl p-7 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 group flex items-start gap-5 animate-reveal-up">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <QrCode size={22} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                  Fácil y Rápido
                </span>
                <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  Pase Familiar Unificado
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Un único código QR sirve para vos y todos tus invitados, facilitando el ingreso ágil y ordenado por portería sin imprimir papeles.
                </p>
              </div>
            </div>

            {/* Bento Card 3: 100% Móvil */}
            <div className="landing-glass-card rounded-3xl p-7 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 group flex items-start gap-5 animate-reveal-up">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Smartphone size={22} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                  Sin Complicaciones
                </span>
                <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  100% Digital y Autogestionable
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Hacé todos los pasos desde tu celular o computadora en 2 minutos: confirmá, editá tus invitados y descargá tu credencial.
                </p>
              </div>
            </div>

            {/* Bento Card 4: Ubicaciones Cómodas */}
            <div className="landing-glass-card rounded-3xl p-7 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 group flex items-start gap-5 animate-reveal-up">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Smile size={22} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  Tu Lugar Asegurado
                </span>
                <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  Asientos Reservados
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Tanto vos en el sector de graduados como tus seres queridos en las butacas del auditorio contarán con sus ubicaciones previstas.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ══ 6. FRASE INSPIRADORA CON ORGULLO INSTITUCIONAL ═══════════ */}
      <section className="py-20 px-6 sm:px-12 bg-white border-t border-slate-200/80 text-center relative z-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <p className="text-2xl sm:text-4xl font-black text-slate-900 leading-snug tracking-tight">
            "El esfuerzo y la dedicación de estos años culminan en este día.{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ¡Estamos profundamente orgullosos de tus logros!
            </span>"
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Comunidad Académica · Instituto Tecnológico Beltrán
          </p>
        </div>
      </section>

      {/* ══ 7. PREGUNTAS FRECUENTES (FAQ INTERACTIVO) ════════════════ */}
      <section id="preguntas" className="mx-auto max-w-3xl px-4 sm:px-8 py-16 border-t border-slate-200/80 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
            Centro de Ayuda
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 pt-2">
            Preguntas Frecuentes
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Respuestas claras y directas para que tengas toda la tranquilidad.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const abierta = faqAbierta === index
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-slate-800 hover:text-blue-600 transition-colors duration-150 cursor-pointer text-sm"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle size={18} className="text-blue-600 shrink-0" />
                    {faq.pregunta}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 shrink-0 ${abierta ? 'rotate-180 text-blue-600' : ''}`}
                  />
                </button>
                {abierta && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50 animate-reveal-up">
                    {faq.respuesta}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Banner de soporte directo */}
        <div className="mt-8 rounded-2xl bg-blue-50/70 border border-blue-200/70 p-4 text-center sm:flex sm:items-center sm:justify-between gap-4">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-blue-900 mb-2 sm:mb-0">
            <Info size={16} className="text-blue-600 shrink-0" />
            <span>¿Tenés alguna consulta adicional sobre tu situación académica?</span>
          </div>
          <button
            onClick={onSeleccionarManual}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-white border border-blue-200 px-3.5 py-1.5 rounded-full shadow-2xs cursor-pointer"
          >
            <BookOpen size={13} />
            <span>Ver Manual de Ayuda</span>
          </button>
        </div>
      </section>

      {/* ══ 8. FOOTER INSTITUCIONAL BELTRÁN ══════════════════════════ */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-8 text-slate-600 text-xs relative z-10">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-2xs animate-float">
              <img src="/logo-oficial.png" alt="Instituto Beltrán" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 text-sm">Instituto Tecnológico Beltrán</p>
              <p className="text-[11px] text-slate-500">Av. Belgrano 1191, Avellaneda, Buenos Aires</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 font-semibold text-slate-600 text-xs">
            <button onClick={onSeleccionarManual} className="hover:text-blue-600 transition-colors duration-150 cursor-pointer">Manual de Ayuda</button>
            <span>·</span>
            <button onClick={onSeleccionarAdmin} className="hover:text-blue-600 transition-colors duration-150 cursor-pointer">Acceso Personal</button>
            <span>·</span>
            <a href="https://www.ibeltran.com.ar" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors duration-150 flex items-center gap-1">
              Sitio Oficial Beltrán <ExternalLink size={12} />
            </a>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
            <span>SiGIC</span>
            <span className="text-slate-400">·</span>
            <span className="font-bold text-blue-600">{VERSION_LABEL}</span>
          </div>

        </div>
      </footer>

    </div>
  )
}




