import React, { useState, useEffect } from 'react'
import {
  Sparkles, GraduationCap, Users, QrCode, BookOpen,
  Download, ArrowRight, ShieldCheck, CheckCircle2, Clock,
  MapPin, Smartphone, Monitor, ChevronRight, Lock, KeyRound,
  ExternalLink, Search, Server, Calendar, Award, ChevronDown,
  Building2, Check, ArrowUpRight, HelpCircle, FileSpreadsheet
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

  const faqs = [
    {
      pregunta: '¿Cómo ingreso si no recibí el correo de invitación?',
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/40 text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* ══ 1. NAVBAR INSTITUCIONAL CLARO ════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          
          {/* Logo & Marca Beltrán */}
          <div className="flex items-center gap-3.5">
            <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-md shadow-slate-200/60">
              <img src="/logo-oficial.png" alt="Instituto Beltrán" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">SiGIC</span>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700 border border-blue-200/60">
                  Institucional
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500">Instituto Tecnológico Beltrán</p>
            </div>
          </div>

          {/* Links de Navegación Rápida */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#portal-egresado" className="transition hover:text-blue-600">Portal Egresados</a>
            <a href="#ceremonia-activa" className="transition hover:text-blue-600">Ceremonia Activa</a>
            <a href="#ecosistema" className="transition hover:text-blue-600">Ecosistema SiGIC</a>
            <a href="#descargas" className="transition hover:text-blue-600">Descargas</a>
            <a href="#preguntas" className="transition hover:text-blue-600">Ayuda</a>
          </nav>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onSeleccionarManual}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-xs"
            >
              <BookOpen size={14} className="text-blue-600" />
              <span>Manual Web</span>
            </button>

            <button
              onClick={onSeleccionarAdmin}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2 text-xs font-black text-white shadow-md shadow-blue-500/20 transition active:scale-95 cursor-pointer"
            >
              <Lock size={13} />
              <span>Acceso Administrativo</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══ 2. HERO PRINCIPAL ELEGANTE Y CLARO ══════════════════════ */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-8">
        
        {/* Fondos y resplandores suaves */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-sky-200/40 via-blue-100/30 to-indigo-100/40 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 h-[300px] w-[300px] rounded-full bg-emerald-100/40 blur-[90px] pointer-events-none" />

        <div className="relative mx-auto max-w-5xl text-center space-y-7">
          
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm shadow-blue-500/5">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="tracking-wide">Sistema Oficial de Actos de Colación y Graduación</span>
            <span className="text-slate-300">|</span>
            <span className="font-extrabold text-blue-900">Ciclo 2026</span>
          </div>

          {/* Título de impacto */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] max-w-4xl mx-auto">
            La solemnidad y jerarquía que merece <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">cada acto de graduación</span>.
          </h1>

          {/* Subtítulo */}
          <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Plataforma integral del Instituto Tecnológico Beltrán para la confirmación de graduados, selección de juramento, pases de invitados con credencial QR y control de accesos en tiempo real.
          </p>

          {/* ══ BUSCADOR / ACCESO DIRECTO DEL GRADUADO ══ */}
          <div id="portal-egresado" className="pt-2 max-w-2xl mx-auto">
            <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-xl">
              
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-black uppercase tracking-wider text-blue-700 flex items-center gap-2">
                  <GraduationCap size={18} className="text-blue-600" />
                  Portal de Autogestión del Graduado
                </span>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
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
                    placeholder="Ingresá tu número de DNI o Correo..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition active:scale-95 cursor-pointer shrink-0"
                >
                  <span>Ingresar al Portal</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Beneficios / Pasos rápidos */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Confirmá tu asistencia</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Cargá tus acompañantes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Obtené tu Credencial QR</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ══ 3. CEREMONIA ACTIVA & ESTADO DEL SISTEMA ═══════════════ */}
      <section id="ceremonia-activa" className="mx-auto max-w-6xl px-4 sm:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Tarjeta Ceremonia Activa Destacada */}
          <div className="lg:col-span-2 rounded-3xl border border-blue-200/80 bg-gradient-to-br from-white via-sky-50/40 to-blue-50/50 p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden">
            
            {/* Decoración de fondo */}
            <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-3 relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold uppercase tracking-wide">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Convocatoria Oficial Activa
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200/70 shadow-2xs">
                  <MapPin size={14} className="text-blue-600" />
                  {ceremonia?.lugar || 'Auditorio Central · Sede Beltrán'}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 pt-1">
                {ceremonia?.nombre || 'Ceremonia de Colación Institucional'}
              </h3>
              
              <p className="text-sm text-slate-600 leading-relaxed font-normal max-w-xl">
                {ceremonia?.descripcion || 'Acto solemne de entrega de diplomas para las tecnicaturas superiores y carreras de grado del Instituto Tecnológico Beltrán.'}
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-blue-200/60 grid grid-cols-2 sm:grid-cols-3 gap-4 relative z-10">
              <div className="bg-white/80 p-3 rounded-2xl border border-blue-100 shadow-2xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar size={12} className="text-blue-600" /> Fecha del Acto
                </p>
                <p className="font-extrabold text-slate-800 text-xs sm:text-sm mt-1">{fechaCeremoniaTexto}</p>
              </div>

              <div className="bg-white/80 p-3 rounded-2xl border border-blue-100 shadow-2xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock size={12} className="text-blue-600" /> Horario
                </p>
                <p className="font-extrabold text-slate-800 text-xs sm:text-sm mt-1">{horaCeremoniaTexto}</p>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-white/80 p-3 rounded-2xl border border-blue-100 shadow-2xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <QrCode size={12} className="text-blue-600" /> Acreditación
                </p>
                <p className="font-extrabold text-blue-700 text-xs sm:text-sm mt-1">Pase QR Grupal</p>
              </div>
            </div>

          </div>

          {/* Tarjeta Seguridad e Infraestructura */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">Garantía y Seguridad</h4>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Protocolo Institucional</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Base de Datos Cloud</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Conectado (SSL)
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Validación OTP</span>
                  <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                    <KeyRound size={14} /> Sin Contraseñas
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Acreditación Móvil</span>
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                    <Smartphone size={14} /> App Portería
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-snug border-t border-slate-100 pt-3">
              Toda la información de graduados e invitados se gestiona bajo estrictos estándares de confidencialidad institucional.
            </p>
          </div>

        </div>
      </section>

      {/* ══ 4. LOS TRES PILARES DEL SISTEMA (ECOSISTEMA) ════════════ */}
      <section id="ecosistema" className="mx-auto max-w-6xl px-4 sm:px-8 py-16 border-t border-slate-200/80">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
            Ecosistema SiGIC
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 pt-2">
            Gestión de punta a punta
          </h2>
          <p className="text-sm text-slate-600">
            Diseñado especialmente para optimizar cada etapa del protocolo académico.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Pilar 1 */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] hover:border-blue-300 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/60 text-blue-600 font-black flex items-center justify-center text-base mb-5 group-hover:scale-110 transition-transform">
              <FileSpreadsheet size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">1. Padrón & Convocatoria</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Carga ágil desde Excel con validación de carreras, fórmulas de juramento, cuerpo de profesores entregadores y despacho masivo de invitaciones personalizadas.
            </p>
          </div>

          {/* Pilar 2 */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] hover:border-indigo-300 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 font-black flex items-center justify-center text-base mb-5 group-hover:scale-110 transition-transform">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">2. Autogestión del Egresado</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Portal interactivo con acceso por OTP temporal. Confirmación de presencia, registro de familiares acompañantes, elección de docentes y credencial digital.
            </p>
          </div>

          {/* Pilar 3 */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] hover:border-emerald-300 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 font-black flex items-center justify-center text-base mb-5 group-hover:scale-110 transition-transform">
              <QrCode size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">3. Acreditación en Portería</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Validación instantánea en los ingresos mediante la aplicación móvil oficial de escaneo QR, actualizando en tiempo real el aforo y el libro de actas.
            </p>
          </div>

        </div>
      </section>

      {/* ══ 5. CENTRO DE DESCARGAS & APLICACIONES OFICIALES ════════ */}
      <section id="descargas" className="mx-auto max-w-6xl px-4 sm:px-8 py-12 border-t border-slate-200/80">
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

      {/* ══ 6. PREGUNTAS FRECUENTES (FAQ) ══════════════════════════ */}
      <section id="preguntas" className="mx-auto max-w-4xl px-4 sm:px-8 py-16 border-t border-slate-200/80">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
            Centro de Ayuda
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 pt-2">
            Preguntas Frecuentes
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Respuestas rápidas para graduados y participantes de la colación.
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

      {/* ══ 7. FOOTER INSTITUCIONAL BELTRÁN ════════════════════════ */}
      <footer className="border-t border-slate-200 bg-white py-10 px-4 sm:px-8 text-slate-600 text-xs">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3.5">
            <div className="h-9 w-9 overflow-hidden rounded-xl border border-slate-200 bg-white p-1">
              <img src="/logo-oficial.png" alt="Instituto Beltrán" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 text-sm">Instituto Tecnológico Beltrán</p>
              <p className="text-[11px] text-slate-500">Av. Belgrano 1191, Avellaneda, Buenos Aires</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 font-semibold text-slate-600 text-xs">
            <button onClick={onSeleccionarManual} className="hover:text-blue-600 cursor-pointer">Manual de Usuario</button>
            <span>·</span>
            <button onClick={onSeleccionarAdmin} className="hover:text-blue-600 cursor-pointer">Acceso Administrativo</button>
            <span>·</span>
            <a href="https://www.ibeltran.com.ar" target="_blank" rel="noreferrer" className="hover:text-blue-600 flex items-center gap-1">
              Sitio Oficial Beltrán <ExternalLink size={12} />
            </a>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <span>SiGIC</span>
            <span className="text-slate-400">·</span>
            <span className="font-bold text-blue-600">{VERSION_LABEL}</span>
          </div>

        </div>
      </footer>

    </div>
  )
}

