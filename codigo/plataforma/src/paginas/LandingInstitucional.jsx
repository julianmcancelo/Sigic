import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles, GraduationCap, Users, QrCode, BookOpen,
  Download, ArrowRight, ShieldCheck, CheckCircle2, Clock,
  MapPin, Smartphone, Monitor, ChevronRight, Lock, KeyRound,
  ExternalLink, Search, Server, Calendar, Award, ChevronDown,
  Building2, Check, ArrowUpRight, HelpCircle, FileSpreadsheet,
  ChevronLeft, Layers, Zap, Cpu, BellRing, Fingerprint
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
  const [moduloActivo, setModuloActivo] = useState(0)
  const carruselRef = useRef(null)

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

  const scrollCarrusel = (direccion) => {
    if (carruselRef.current) {
      const scrollAmount = direccion === 'izq' ? -380 : 380
      carruselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Formatear fecha de la ceremonia activa si existe
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

  const modulosDestacados = [
    {
      id: 'padron',
      tag: '01 · GESTIÓN INSTITUCIONAL',
      titulo: 'Padrón & Ceremonias',
      descripcion: 'Importación ágil de graduados desde planillas Excel, parametrización de títulos académicos, designación de cuerpo docente y despacho masivo de invitaciones con links de un solo uso.',
      imagen: '/gestion_ceremonias.png',
      badge: 'Control Total',
      metricas: ['Carga Masiva Excel', 'Despacho SMTP', 'Gestión de Padrinos']
    },
    {
      id: 'graduado',
      tag: '02 · EXPERIENCIA DEL EGRESADO',
      titulo: 'Portal de Autogestión',
      descripcion: 'Entorno privado con autenticación OTP sin contraseña. El graduado corrobora sus datos personales, elige su juramento formal, registra acompañantes y obtiene su credencial digital interactiva.',
      imagen: '/gestion_graduados.png',
      badge: '100% Autogestionable',
      metricas: ['Acceso OTP Seguro', 'Elección de Padrino', 'Pase Familiar QR']
    },
    {
      id: 'anfiteatro',
      tag: '03 · CARTOGRAFÍA INTELIGENTE',
      titulo: 'Editor del Anfiteatro',
      descripcion: 'Diseño tridimensional interactivo de butacas. Distribución armónica de graduados por carrera, platea para familiares y palcos para autoridades protocolares.',
      imagen: '/diseno_anfiteatro.png',
      badge: 'Mapeo Visual 3D',
      metricas: ['Aforo en Tiempo Real', 'Sectores VIP', 'Numeración Dinámica']
    }
  ]

  const tecnologias = [
    {
      categoria: 'Criptografía',
      titulo: 'Autenticación OTP Dinámica',
      descripcion: 'Ingreso sin contraseñas mediante tokens temporales enviados por correo institucional, garantizando privacidad absoluta.',
      icono: Fingerprint,
      accent: 'from-blue-500/10 to-cyan-500/10 text-blue-600 border-blue-200/80'
    },
    {
      categoria: 'Acreditación',
      titulo: 'Escaneo QR de Ultra-Baja Latencia',
      descripcion: 'Lectura instantánea de credenciales en los accesos con la app móvil oficial, validando cupos en menos de 1.5 segundos.',
      icono: QrCode,
      accent: 'from-indigo-500/10 to-purple-500/10 text-indigo-600 border-indigo-200/80'
    },
    {
      categoria: 'Cartografía',
      titulo: 'Asignación Dinámica de Butacas',
      descripcion: 'Algoritmo de acomodación automática de graduados por orden alfabético y carrera en el auditorio central.',
      icono: Layers,
      accent: 'from-sky-500/10 to-blue-500/10 text-sky-600 border-sky-200/80'
    },
    {
      categoria: 'Infraestructura',
      titulo: 'Base de Datos Cloud con SSL',
      descripcion: 'Arquitectura PostgreSQL serverless de alta velocidad con replicación continua y tolerancia a fallos.',
      icono: Server,
      accent: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200/80'
    },
    {
      categoria: 'Comunicaciones',
      titulo: 'Despacho Automatizado SMTP',
      descripcion: 'Envío de notificaciones y recordatorios masivos con confirmación de recepción y seguimiento de lectura.',
      icono: BellRing,
      accent: 'from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-200/80'
    },
    {
      categoria: 'Protocolo',
      titulo: 'Acta Oficial y Cierre Notarial',
      descripcion: 'Generación automática del libro de egresados al concluir el escaneo en portería con firma digitalizada.',
      icono: Award,
      accent: 'from-rose-500/10 to-pink-500/10 text-rose-600 border-rose-200/80'
    }
  ]

  const faqs = [
    {
      pregunta: '¿Cómo accedo si no recibí el correo de invitación?',
      respuesta: 'Podés ingresar directamente con tu número de DNI en el buscador principal de esta página. El sistema validará tu identidad mediante un código temporal de seguridad (OTP) enviado a tu correo o teléfono registrado.'
    },
    {
      pregunta: '¿Puedo modificar mis acompañantes luego de confirmar?',
      respuesta: 'Sí, podés ingresar a tu portal de egresado cuantas veces lo necesites hasta la fecha límite establecida por la institución. Pasada esa fecha, el aforo queda reservado de forma definitiva.'
    },
    {
      pregunta: '¿Cómo funciona la credencial digital con código QR?',
      respuesta: 'Una vez confirmada tu asistencia, se generará una credencial digital única. Este QR funciona como pase grupal para vos y tus acompañantes, y será escaneado en el ingreso por el equipo de portería.'
    },
    {
      pregunta: '¿Puedo elegir quién me entrega el diploma?',
      respuesta: 'Sí, en tu portal de egresado podrás seleccionar a tus docentes o directivos preferidos de la lista oficial de entregadores habilitados para tu carrera.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* ══ 1. FLOATING PILL NAVBAR (ESTILO EVASION) ═══════════════ */}
      <header
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl transition-all duration-300 rounded-full border ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-slate-300/80 shadow-[0_10px_30px_rgba(0,0,0,0.08)] py-2 px-3 sm:px-5'
            : 'bg-white/80 backdrop-blur-md border-slate-200/80 shadow-md shadow-slate-200/50 py-2.5 px-4 sm:px-6'
        }`}
      >
        <div className="flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-white p-1 shadow-xs">
              <img src="/logo-oficial.png" alt="Instituto Beltrán" className="h-full w-full object-contain" />
            </div>
            <a href="#" className="flex items-center gap-1.5 group">
              <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition">SiGIC</span>
              <span className="hidden sm:inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase text-blue-700 border border-blue-200/70">
                2026
              </span>
            </a>
          </div>

          {/* Links de Navegación */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
            <a href="#portal" className="transition hover:text-blue-600">Portal Egresado</a>
            <a href="#modulos" className="transition hover:text-blue-600">Módulos</a>
            <a href="#tecnologia" className="transition hover:text-blue-600">Tecnología</a>
            <a href="#descargas" className="transition hover:text-blue-600">Descargas</a>
            <a href="#faq" className="transition hover:text-blue-600">Ayuda</a>
          </nav>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSeleccionarManual}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/80 hover:bg-slate-200/80 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              <BookOpen size={13} className="text-blue-600" />
              <span>Manual</span>
            </button>

            <button
              onClick={onSeleccionarAdmin}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 hover:bg-blue-600 px-4 py-1.5 text-xs font-black text-white shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Lock size={12} />
              <span>Acceso Admin</span>
            </button>
          </div>

        </div>
      </header>

      {/* ══ 2. KINETIC HERO SECTION (ESTILO EVASION CON ANIMACIÓN DE LETRAS) ══ */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 px-4 sm:px-8 overflow-hidden">
        
        {/* Glow de fondo atmosférico */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 h-[450px] w-[750px] rounded-full bg-gradient-to-tr from-sky-200/50 via-blue-100/40 to-indigo-100/40 blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 right-4 h-[300px] w-[300px] rounded-full bg-emerald-100/40 blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-5xl text-center space-y-6">
          
          {/* Badge institucional animado */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/90 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm shadow-blue-500/5">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
            <span className="tracking-wide">Instituto Tecnológico Beltrán</span>
            <span className="text-slate-300">·</span>
            <span className="font-extrabold text-blue-900">Sistema Oficial de Colaciones</span>
          </div>

          {/* Título Cinético con Letras Animadas */}
          <div className="py-2">
            <h1 className="text-[13vw] sm:text-[9vw] lg:text-[7.5rem] font-black leading-[0.9] tracking-tighter text-slate-900 select-none">
              <span className="inline-block animate-slide-up" style={{ animationDelay: '0.05s' }}>S</span>
              <span className="inline-block animate-slide-up" style={{ animationDelay: '0.12s' }}>·</span>
              <span className="inline-block animate-slide-up" style={{ animationDelay: '0.19s' }}>i</span>
              <span className="inline-block animate-slide-up" style={{ animationDelay: '0.26s' }}>·</span>
              <span className="inline-block animate-slide-up" style={{ animationDelay: '0.33s' }}>G</span>
              <span className="inline-block animate-slide-up" style={{ animationDelay: '0.40s' }}>·</span>
              <span className="inline-block animate-slide-up" style={{ animationDelay: '0.47s' }}>I</span>
              <span className="inline-block animate-slide-up" style={{ animationDelay: '0.54s' }}>·</span>
              <span className="inline-block animate-slide-up" style={{ animationDelay: '0.61s' }}>C</span>
            </h1>
            <p className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-blue-600 mt-2">
              Gestión Integral de Actos Académicos
            </p>
          </div>

          {/* Subtítulo limpio */}
          <p className="text-base sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            La plataforma inteligente que centraliza padrones oficiales, autogestión de juramentos, asignación de butacas y acreditación QR en tiempo real.
          </p>

          {/* ══ BUSCADOR / ACCESO DIRECTO DEL GRADUADO ══ */}
          <div id="portal" className="pt-4 max-w-2xl mx-auto">
            <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all hover:shadow-[0_25px_60px_rgba(0,0,0,0.09)]">
              
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-black uppercase tracking-wider text-blue-700 flex items-center gap-2">
                  <GraduationCap size={18} className="text-blue-600" />
                  ¿Sos egresado? Ingresá a tu Portal
                </span>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Acceso Seguro OTP
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition active:scale-95 cursor-pointer shrink-0"
                >
                  <span>Ingresar al Portal</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Beneficios rápidos */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Confirmación en 1 Clic</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Registro de Acompañantes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Pase Digital con QR</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ══ 3. CEREMONIA ACTIVA & RADAR EN VIVO ════════════════════ */}
      <section className="mx-auto max-w-6xl px-4 sm:px-8 pb-16">
        <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-white via-sky-50/40 to-blue-50/50 p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold uppercase tracking-wide">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Convocatoria Oficial Activa
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-200/70">
                  <MapPin size={13} className="text-blue-600" />
                  {ceremonia?.lugar || 'Auditorio Central Beltrán'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {ceremonia?.nombre || 'Ceremonia de Colación Institucional'}
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {ceremonia?.descripcion || 'Acto solemne de entrega de diplomas para las tecnicaturas superiores del Instituto Tecnológico Beltrán.'}
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto shrink-0">
              <div className="bg-white p-3.5 rounded-2xl border border-blue-100 shadow-2xs min-w-[140px]">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fecha del Acto</p>
                <p className="font-extrabold text-slate-800 text-xs sm:text-sm mt-0.5">{fechaCeremoniaTexto}</p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-blue-100 shadow-2xs min-w-[140px]">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Acreditación</p>
                <p className="font-extrabold text-blue-700 text-xs sm:text-sm mt-0.5">Credencial QR + App</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══ 4. MÓDULOS DEL SISTEMA (ESTILO ALPINE & FOREST DE EVASION) ══ */}
      <section id="modulos" className="py-20 px-4 sm:px-8 border-t border-slate-200/80 bg-white">
        <div className="mx-auto max-w-6xl">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
              Arquitectura Integral
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight pt-2">
              Conocé los Módulos de SiGIC
            </h2>
            <p className="text-sm sm:text-base text-slate-500">
              Diseñados con precisión para los tres momentos críticos de la ceremonia.
            </p>
          </div>

          {/* Selector de Módulos (Tabs) */}
          <div className="flex justify-center mb-10 overflow-x-auto pb-2">
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
              {modulosDestacados.map((modulo, index) => (
                <button
                  key={modulo.id}
                  onClick={() => setModuloActivo(index)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    moduloActivo === index
                      ? 'bg-white text-slate-900 shadow-md shadow-slate-200/80 scale-[1.02]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {modulo.titulo}
                </button>
              ))}
            </div>
          </div>

          {/* Tarjeta Visual Destacada del Módulo Seleccionado */}
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              
              {/* Información del Módulo */}
              <div className="space-y-5">
                <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
                  {modulosDestacados[moduloActivo].tag}
                </span>

                <h3 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {modulosDestacados[moduloActivo].titulo}
                </h3>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {modulosDestacados[moduloActivo].descripcion}
                </p>

                {/* Métricas / Chips */}
                <div className="pt-2 flex flex-wrap gap-2">
                  {modulosDestacados[moduloActivo].metricas.map((metrica, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs"
                    >
                      <Check size={14} className="text-emerald-600" />
                      {metrica}
                    </span>
                  ))}
                </div>

                <div className="pt-4">
                  <button
                    onClick={onSeleccionarManual}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 hover:bg-blue-600 px-6 py-3.5 text-xs font-black text-white transition active:scale-95 cursor-pointer shadow-md"
                  >
                    <span>Ver Documentación de este Módulo</span>
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>

              {/* Vista Previa Visual del Módulo */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900 group">
                <img
                  src={modulosDestacados[moduloActivo].imagen}
                  alt={modulosDestacados[moduloActivo].titulo}
                  className="h-full w-full object-cover object-top group-hover:scale-105 transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4">
                  <span className="backdrop-blur-md px-3.5 py-1.5 text-xs font-black rounded-full bg-white/90 text-slate-900 border border-white/50 shadow-md">
                    {modulosDestacados[moduloActivo].badge}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ══ 5. TECNOLOGÍA & ALTO RENDIMIENTO (6 CARDS CON HOVER EFFECT) ══ */}
      <section id="tecnologia" className="py-20 px-4 sm:px-8 bg-slate-50/60 border-t border-slate-200/80">
        <div className="mx-auto max-w-6xl">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
              Ingeniería & Seguridad
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-2">
              Tecnología de Alto Rendimiento
            </h2>
            <p className="text-sm text-slate-500">
              Cada componente fue diseñado para garantizar cero demoras y máxima confiabilidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tecnologias.map((tech, idx) => {
              const Icono = tech.icono
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.07)] hover:border-blue-300 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tech.accent} border flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icono size={22} />
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        {tech.categoria}
                      </p>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {tech.titulo}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {tech.descripcion}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>Protocolo SiGIC</span>
                    <CheckCircle2 size={15} className="text-emerald-500" />
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ══ 6. STAT STRIP DE IMPACTO (ESTILO MINIMALISTA EVASION) ════ */}
      <section className="border-y border-slate-200 bg-white py-12 px-4 sm:px-8">
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          
          <div className="p-4 border-r border-slate-100 last:border-r-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Padrón y Actas</p>
            <p className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">100%</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Digital y sin papel</p>
          </div>

          <div className="p-4 md:border-r border-slate-100 last:border-r-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Escaneo QR</p>
            <p className="text-3xl sm:text-5xl font-black text-blue-600 tracking-tight">&lt; 1.5s</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Por grupo familiar</p>
          </div>

          <div className="p-4 border-r border-slate-100 last:border-r-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Seguridad OTP</p>
            <p className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">0 Claves</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Tokens de un solo uso</p>
          </div>

          <div className="p-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Disponibilidad</p>
            <p className="text-3xl sm:text-5xl font-black text-emerald-600 tracking-tight">99.9%</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Neon Cloud Serverless</p>
          </div>

        </div>
      </section>

      {/* ══ 7. CARRUSEL / GALERÍA DE INTERFACES EN VIVO ══════════════ */}
      <section className="py-20 px-4 sm:px-8 bg-[#f8fafc] overflow-hidden">
        <div className="mx-auto max-w-6xl">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
                Galería Visual
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                La experiencia en pantalla
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollCarrusel('izq')}
                className="h-10 w-10 rounded-full border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scrollCarrusel('der')}
                className="h-10 w-10 rounded-full border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Carrusel Desplazable */}
          <div
            ref={carruselRef}
            className="flex gap-6 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory"
          >
            
            <div className="min-w-[300px] sm:min-w-[420px] rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-lg snap-start group">
              <div className="aspect-[16/10] overflow-hidden bg-slate-900">
                <img
                  src="/gestion_ceremonias.png"
                  alt="Gestión de Ceremonias"
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Panel Principal</span>
                <h4 className="text-base font-black text-slate-900 mt-0.5">Control Central de Ceremonias</h4>
                <p className="text-xs text-slate-500 mt-1">Configuración de fechas, sedes, aforo y estado de la convocatoria.</p>
              </div>
            </div>

            <div className="min-w-[300px] sm:min-w-[420px] rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-lg snap-start group">
              <div className="aspect-[16/10] overflow-hidden bg-slate-900">
                <img
                  src="/diseno_anfiteatro.png"
                  alt="Editor del Anfiteatro"
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-5">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Mapeo Espacial</span>
                <h4 className="text-base font-black text-slate-900 mt-0.5">Mapa 3D del Auditorio</h4>
                <p className="text-xs text-slate-500 mt-1">Asignación nominal de butacas para egresados, familiares y autoridades.</p>
              </div>
            </div>

            <div className="min-w-[300px] sm:min-w-[420px] rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-lg snap-start group">
              <div className="aspect-[16/10] overflow-hidden bg-slate-900">
                <img
                  src="/gestion_graduados.png"
                  alt="Padrón de Graduados"
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Padrón Oficial</span>
                <h4 className="text-base font-black text-slate-900 mt-0.5">Administración de Egresados</h4>
                <p className="text-xs text-slate-500 mt-1">Importación masiva desde Excel y seguimiento de confirmaciones.</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ══ 8. CITA EDITORIAL FILOSÓFICA (ESTILO EVASION) ════════════ */}
      <section className="py-24 px-6 sm:px-12 bg-white border-t border-slate-200/80 text-center">
        <div className="mx-auto max-w-4xl space-y-6">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            Declaración Institucional
          </p>
          <p className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
            "La tecnología no reemplaza la solemnidad de un acto académico: <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">la custodia, la jerarquiza y la hace inolvidable</span>."
          </p>
          <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">
            Comité Académico · Instituto Tecnológico Beltrán
          </p>
        </div>
      </section>

      {/* ══ 9. CENTRO DE DESCARGAS & APLICACIONES OFICIALES ════════ */}
      <section id="descargas" className="mx-auto max-w-6xl px-4 sm:px-8 py-14 border-t border-slate-200/80">
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-8 sm:p-12 shadow-2xl relative overflow-hidden text-white">
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                <Download size={14} /> Aplicaciones Oficiales SiGIC
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Herramientas para el día de la ceremonia
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Descargá la app móvil para portería (Android APK) y consultá el manual operativo completo del sistema institucional.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3.5 w-full lg:w-auto shrink-0">
              <a
                href="/descargas"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 px-6 py-4 text-xs font-black text-slate-950 shadow-lg shadow-cyan-400/20 transition active:scale-95 text-center cursor-pointer"
              >
                <Smartphone size={17} />
                <span>App Portería Android (.APK)</span>
              </a>

              <button
                onClick={onSeleccionarManual}
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-6 py-4 text-xs font-black text-white transition active:scale-95 cursor-pointer backdrop-blur-xs"
              >
                <BookOpen size={17} className="text-cyan-300" />
                <span>Manual de Usuario</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ══ 10. PREGUNTAS FRECUENTES (FAQ ACCORDION) ═══════════════ */}
      <section id="faq" className="mx-auto max-w-4xl px-4 sm:px-8 py-16 border-t border-slate-200/80">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
            Centro de Ayuda
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 pt-2">
            Preguntas Frecuentes
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Respuestas directas para egresados e invitados a la colación.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const abierta = faqAbierta === index
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-slate-800 hover:text-blue-600 transition cursor-pointer text-sm"
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
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.respuesta}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ══ 11. FOOTER INSTITUCIONAL BELTRÁN ═══════════════════════ */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-8 text-slate-600 text-xs">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
              <img src="/logo-oficial.png" alt="Instituto Beltrán" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 text-sm">Instituto Tecnológico Beltrán</p>
              <p className="text-[11px] text-slate-500">Av. Belgrano 1191, Avellaneda, Buenos Aires</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 font-semibold text-slate-600 text-xs">
            <button onClick={onSeleccionarManual} className="hover:text-blue-600 cursor-pointer">Manual de Usuario</button>
            <span>·</span>
            <button onClick={onSeleccionarAdmin} className="hover:text-blue-600 cursor-pointer">Acceso Administrativo</button>
            <span>·</span>
            <a href="https://www.ibeltran.com.ar" target="_blank" rel="noreferrer" className="hover:text-blue-600 flex items-center gap-1">
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


