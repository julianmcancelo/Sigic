import React, { useState, useEffect } from 'react'
import {
  Sparkles, GraduationCap, Users, QrCode, BookOpen,
  Download, ArrowRight, ShieldCheck, CheckCircle2, Clock,
  MapPin, Smartphone, ChevronDown, Lock, KeyRound,
  ExternalLink, Search, Calendar, Award, Heart,
  Check, ArrowUpRight, HelpCircle, Smile, UserCheck, Ticket
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
      setScrolled(window.scrollY > 30)
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
      numero: '1',
      icono: UserCheck,
      titulo: 'Confirmá tu Asistencia',
      descripcion: 'Ingresá con tu DNI para revisar tus datos, elegir tu juramento y confirmar que vas a estar presente.',
      color: 'from-blue-500/15 to-sky-500/15 text-blue-700 border-blue-200'
    },
    {
      numero: '2',
      icono: Users,
      titulo: 'Anotá a tus Acompañantes',
      descripcion: 'Cargá a los familiares o amigos que van a compartir este momento con vos para reservarles su lugar.',
      color: 'from-indigo-500/15 to-purple-500/15 text-indigo-700 border-indigo-200'
    },
    {
      numero: '3',
      icono: Ticket,
      titulo: 'Descargá tu Pase QR',
      descripcion: 'Obtené tu pase digital para entrar juntos al auditorio mostrándolo desde el celular, ¡sin imprimir nada!',
      color: 'from-emerald-500/15 to-teal-500/15 text-emerald-700 border-emerald-200'
    }
  ]

  const beneficios = [
    {
      icono: Heart,
      titulo: 'Elegí a tu Padrino o Madrina',
      descripcion: 'Podés elegir qué profesor o directivo preferís que te haga entrega de tu diploma y medalla de egreso.',
      badge: 'Momento Especial'
    },
    {
      icono: QrCode,
      titulo: 'Pase Familiar Grupal',
      descripcion: 'Un único código QR sirve para vos y todos tus invitados, facilitando el ingreso rápido al auditorio.',
      badge: 'Fácil y Rápido'
    },
    {
      icono: Smartphone,
      titulo: '100% Digital y Gratuito',
      descripcion: 'Hacé todos los trámites desde tu teléfono o computadora en 2 minutos, sin filas ni papelerío.',
      badge: 'Cero Complicaciones'
    },
    {
      icono: Smile,
      titulo: 'Ubicaciones Cómodas',
      descripcion: 'Tanto vos como tus seres queridos contarán con asientos reservados para disfrutar de la ceremonia.',
      badge: 'Tu Lugar Asegurado'
    }
  ]

  const faqs = [
    {
      pregunta: '¿Tiene algún costo registrarme o llevar invitados?',
      respuesta: '¡No, para nada! El acto de colación y el uso de la plataforma SiGIC es 100% gratuito e institucional brindado por el Instituto Beltrán.'
    },
    {
      pregunta: '¿Cómo ingreso si no me llegó el correo?',
      respuesta: 'Solo necesitás ingresar tu número de DNI en el buscador de esta página. El sistema te enviará un código de verificación simple para acceder al instante.'
    },
    {
      pregunta: '¿Hasta cuándo puedo agregar o cambiar mis acompañantes?',
      respuesta: 'Podés ingresar y modificar tus invitados todas las veces que quieras hasta la fecha de cierre indicada en tu portal de egresado.'
    },
    {
      pregunta: '¿Cómo ingresamos el día del evento?',
      respuesta: 'Al llegar a la sede, solo mostrás desde tu celular el código QR de tu pase digital al personal de recepción en la entrada y ellos los acompañarán a sus lugares.'
    },
    {
      pregunta: '¿Qué pasa si no puedo asistir a la ceremonia?',
      respuesta: 'Podés indicar tu inasistencia desde el portal. Tu título quedará resguardado para que puedas retirarlo por la secretaría del instituto en los días posteriores.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* ══ 1. NAVBAR FLOTANTE AMIGABLE ════════════════════════════ */}
      <header
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl transition-all duration-300 rounded-full border animate-pill-header ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl border-slate-300/80 shadow-[0_10px_30px_rgba(0,0,0,0.08)] py-2 px-3 sm:px-5'
            : 'bg-white/85 backdrop-blur-md border-slate-200/80 shadow-md shadow-slate-200/50 py-2.5 px-4 sm:px-6'
        }`}
      >
        <div className="flex items-center justify-between">
          
          {/* Logo Beltrán */}
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-white p-1 shadow-xs animate-float">
              <img src="/logo-oficial.png" alt="Instituto Beltrán" className="h-full w-full object-contain" />
            </div>
            <a href="#" className="flex items-center gap-1.5 group">
              <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors duration-300">SiGIC</span>
              <span className="hidden sm:inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-blue-700 border border-blue-200/70">
                Colaciones 2026
              </span>
            </a>
          </div>

          {/* Links simples de navegación */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
            <a href="#portal" className="transition-colors hover:text-blue-600 duration-200">Ingreso Egresados</a>
            <a href="#pasos" className="transition-colors hover:text-blue-600 duration-200">¿Cómo funciona?</a>
            <a href="#evento" className="transition-colors hover:text-blue-600 duration-200">Tu Ceremonia</a>
            <a href="#preguntas" className="transition-colors hover:text-blue-600 duration-200">Preguntas Frecuentes</a>
          </nav>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSeleccionarManual}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/80 hover:bg-slate-200/80 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition duration-200 cursor-pointer"
            >
              <BookOpen size={13} className="text-blue-600" />
              <span>Ayuda</span>
            </button>

            <button
              onClick={onSeleccionarAdmin}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 hover:bg-blue-600 px-4 py-1.5 text-xs font-black text-white shadow-sm transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <Lock size={12} />
              <span>Acceso Personal</span>
            </button>
          </div>

        </div>
      </header>

      {/* ══ 2. HERO PRINCIPAL: CÁLIDO, AMIGABLE Y DIRECTO ═══════════ */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-24 px-4 sm:px-8 overflow-hidden grain-overlay">
        
        {/* Luces cálidas y suaves */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 h-[450px] w-[750px] rounded-full bg-gradient-to-tr from-sky-200/40 via-blue-100/30 to-amber-100/40 blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 right-4 h-[300px] w-[300px] rounded-full bg-emerald-100/40 blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center space-y-6 z-10">
          
          {/* Badge de Felicitaciones */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/95 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm shadow-blue-500/5 animate-reveal-up animation-delay-100">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>✨ ¡Felicitaciones por tu Graduación!</span>
            <span className="text-slate-300">·</span>
            <span className="font-extrabold text-blue-900">Instituto Beltrán</span>
          </div>

          {/* Título Monumental pero Cálido */}
          <div className="py-2 space-y-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.15] animate-slide-up">
              Un momento único para <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">celebrar tu logro</span> con quienes más querés.
            </h1>
          </div>

          {/* Subtítulo Claro y Humano */}
          <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed animate-reveal-up animation-delay-200">
            Confirmá tu asistencia en 1 minuto, anotá a tus acompañantes y obtené tu pase digital con código QR para entrar juntos el día de la colación.
          </p>

          {/* ══ BUSCADOR AMIGABLE DEL GRADUADO (SCALE IN) ══ */}
          <div id="portal" className="pt-4 max-w-xl mx-auto animate-scale-in animation-delay-300">
            <div className="rounded-3xl border border-blue-200/90 bg-white p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.07)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_25px_60px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
              
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-black uppercase tracking-wider text-blue-700 flex items-center gap-2">
                  <GraduationCap size={19} className="text-blue-600 animate-float" />
                  ¿Sos egresado? Ingresá a tu Portal
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                  Acceso Gratuito
                </span>
              </div>
              
              <form onSubmit={manejarBuscarEgresado} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={terminoBusqueda}
                    onChange={(e) => setTerminoBusqueda(e.target.value)}
                    placeholder="Ingresá tu DNI o Correo electrónico..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
                >
                  <span>Entrar a mi Portal</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Mensaje de tranquilidad */}
              <p className="text-xs text-slate-500 text-left mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-blue-600 shrink-0" />
                <span>Sin contraseñas difíciles: te enviamos un código directo y seguro a tu correo.</span>
              </p>

            </div>
          </div>

        </div>
      </section>

      {/* ══ 3. PASO A PASO SUPER CLARO Y AMIGABLE ═══════════════════ */}
      <section id="pasos" className="py-20 px-4 sm:px-8 bg-white border-t border-slate-200/80">
        <div className="mx-auto max-w-5xl">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2 animate-reveal-up">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
              Súper Simple
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-2">
              ¿Cómo gestionás tu lugar?
            </h2>
            <p className="text-sm text-slate-500">
              Solo 3 pasos sencillos para que vos y tu familia disfruten sin preocupaciones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pasosSimples.map((paso, idx) => {
              const Icono = paso.icono
              const delayClass = `animation-delay-${(idx + 1) * 150}`
              return (
                <div
                  key={idx}
                  className={`rounded-3xl border border-slate-200 bg-slate-50/50 p-7 shadow-xs hover:shadow-xl hover:border-blue-300 hover:bg-white transition-all duration-300 group flex flex-col justify-between animate-reveal-up ${delayClass}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${paso.color} border flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icono size={22} />
                      </div>
                      <span className="text-2xl font-black text-slate-300 group-hover:text-blue-600 transition-colors">
                        0{paso.numero}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                      {paso.titulo}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {paso.descripcion}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
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
      <section id="evento" className="mx-auto max-w-5xl px-4 sm:px-8 py-16">
        <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-white via-sky-50/50 to-blue-50/60 p-7 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.05)] relative overflow-hidden group animate-reveal-up">
          
          <div className="space-y-6 relative z-10">
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold uppercase tracking-wide">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Convocatoria en Curso
              </span>
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-white px-3.5 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                <MapPin size={14} className="text-blue-600" />
                {ceremonia?.lugar || 'Auditorio Central · Instituto Beltrán'}
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {ceremonia?.nombre || 'Ceremonia Oficial de Colación'}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-normal max-w-2xl">
                Entrega formal de diplomas y medallas a los egresados de las tecnicaturas superiores y carreras de grado.
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
                  <QrCode size={13} className="text-blue-600" /> Ingreso
                </p>
                <p className="font-extrabold text-blue-700 text-sm mt-1">Pase QR en tu Celular</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ══ 5. BENEFICIOS Y COMODIDAD (LO QUE PODÉS HACER) ═══════════ */}
      <section className="py-20 px-4 sm:px-8 bg-slate-50/60 border-t border-slate-200/80">
        <div className="mx-auto max-w-5xl">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2 animate-reveal-up">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
              Pensado para vos
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-2">
              Todo resuelto desde tu portal
            </h2>
            <p className="text-sm text-slate-500">
              Diseñamos cada detalle para que disfrutes de tu graduación sin estrés.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {beneficios.map((item, idx) => {
              const Icono = item.icono
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 group flex items-start gap-5 animate-reveal-up"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Icono size={22} />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {item.badge}
                    </span>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.titulo}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.descripcion}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ══ 6. FRASE INSPIRADORA ═════════════════════════════════════ */}
      <section className="py-20 px-6 sm:px-12 bg-white border-t border-slate-200/80 text-center animate-reveal-up">
        <div className="mx-auto max-w-3xl space-y-4">
          <p className="text-2xl sm:text-4xl font-black text-slate-900 leading-snug tracking-tight">
            "El esfuerzo de estos años se corona en este día. <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">¡Estamos orgullosos de tus logros!</span>"
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Comunidad Académica · Instituto Tecnológico Beltrán
          </p>
        </div>
      </section>

      {/* ══ 7. PREGUNTAS FRECUENTES (FAQ AMIGABLE) ═══════════════════ */}
      <section id="preguntas" className="mx-auto max-w-3xl px-4 sm:px-8 py-16 border-t border-slate-200/80 animate-reveal-up">
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
                className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-slate-800 hover:text-blue-600 transition-colors duration-200 cursor-pointer text-sm"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle size={18} className="text-blue-600 shrink-0" />
                    {faq.pregunta}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-300 shrink-0 ${abierta ? 'rotate-180 text-blue-600' : ''}`}
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
      </section>

      {/* ══ 8. FOOTER INSTITUCIONAL BELTRÁN ══════════════════════════ */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-8 text-slate-600 text-xs">
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
            <button onClick={onSeleccionarManual} className="hover:text-blue-600 transition-colors duration-200 cursor-pointer">Manual de Ayuda</button>
            <span>·</span>
            <button onClick={onSeleccionarAdmin} className="hover:text-blue-600 transition-colors duration-200 cursor-pointer">Acceso Administrativo</button>
            <span>·</span>
            <a href="https://www.ibeltran.com.ar" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors duration-200 flex items-center gap-1">
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



