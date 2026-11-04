import React, { useState, useEffect } from 'react'
import {
  Sparkles, Calendar, MapPin, Users, Award, Shield, CheckCircle2,
  ChevronRight, ArrowRight, ExternalLink, Play, Globe, Download,
  QrCode, BookOpen, Clock, Heart, Terminal, Cpu, Layers, HelpCircle,
  FileText, LayoutDashboard, UserCheck, Armchair, ChevronDown,
  Mail, MessageSquare, Compass, Send, Check, AlertCircle, Edit3,
  Phone, Building2, Bookmark, GraduationCap, ChevronUp
} from 'lucide-react'

export const DATOS_PORTAL_BELTRAN = {
  institucion: {
    nombre: 'Instituto Tecnológico Beltrán',
    subtitulo: 'Educación Superior Técnica & Tecnológica de Vanguardia',
    sede: 'Sede Central Avellaneda · Av. Manuel Belgrano 1191',
    carreraPrincipal: 'Tecnicatura Superior en Analista de Sistemas',
    sitioOficial: 'https://www.ibeltran.com.ar',
    telefono: '+54 11 4265-0200 / 0300',
    emailContacto: 'colaciones@sigic.com.ar'
  },
  ceremonia: {
    titulo: 'Ceremonia Oficial de Colación',
    edicion: 'Promoción 2026',
    lema: 'Celebración del mérito académico, juramento profesional y entrega de diplomas',
    fechaTexto: 'Viernes 27 de Noviembre de 2026',
    horarioInicio: '18:30 hs (Convocatoria general desde las 17:45 hs)',
    lugarNombre: 'Anfiteatro Central Beltrán',
    lugarDireccion: 'Av. Manuel Belgrano 1191, Avellaneda, Buenos Aires',
    cuentaRegresivaFecha: '2026-11-27T18:30:00-03:00',
    cuposInvitadosTexto: 'Hasta 4 acompañantes con butaca numerada por egresado'
  },
  estadisticas: [
    { valor: '100%', etiqueta: 'Acreditación Digital', detalle: 'Ingreso ágil sin filas mediante credencial QR' },
    { valor: '+1.200', etiqueta: 'Egresados Habilitados', detalle: 'Analistas de Sistemas y tecnicaturas afines' },
    { valor: '4.800+', etiqueta: 'Ubicaciones en Sala', detalle: 'Asignación automática y reservada en anfiteatro' },
    { valor: '45 min', etiqueta: 'Convocatoria Previa', detalle: 'Check-in ordenado para egresados y familias' }
  ],
  pasosCircuito: [
    {
      numero: '01',
      titulo: 'Acceso por Token OTP',
      descripcion: 'Ingresá a tu portal con tu correo institucional y el código de seguridad de un solo uso.',
      badge: 'Autogestión'
    },
    {
      numero: '02',
      titulo: 'Confirmación y Juramento',
      descripcion: 'Confirmá tu presencia y seleccioná tu fórmula de juramento profesional ante la mesa académica.',
      badge: 'Protocolo'
    },
    {
      numero: '03',
      titulo: 'Acompañantes y Padrinos',
      descripcion: 'Registrá a tus familiares y asigná formalmente a quienes te entregarán el diploma en el estrado.',
      badge: 'Familia'
    },
    {
      numero: '04',
      titulo: 'Credencial Oficial PDF y QR',
      descripcion: 'Descargá la credencial digital con el código QR grupal y los pases individuales para tus invitados.',
      badge: 'Acreditación'
    }
  ],
  cronograma: [
    {
      hora: '17:45 - 18:15',
      etapa: 'Convocatoria y Acreditación en Portería',
      lugar: 'Accesos Av. Belgrano 1191',
      descripcion: 'Escaneo de credenciales QR digitales en los molinetes y recepción formal de egresados y familias.'
    },
    {
      hora: '18:15 - 18:30',
      etapa: 'Ubicación en Anfiteatro',
      lugar: 'Sectores Egresados y Plateas Familiares',
      descripcion: 'Ingreso al salón principal guiado hacia las butacas numeradas reservadas.'
    },
    {
      hora: '18:30 - 19:15',
      etapa: 'Apertura Solemne y Juramento',
      lugar: 'Estrado Oficial Beltrán',
      descripcion: 'Entrada del Consejo Académico, Himno Nacional y toma de juramento profesional a los egresados.'
    },
    {
      hora: '19:15 - 20:30',
      etapa: 'Entrega de Diplomas y Reconocimientos',
      lugar: 'Estrado Oficial Beltrán',
      descripcion: 'Llamado nominal por orden de mérito, entrega de títulos por parte de los padrinos y palabras alusivas.'
    },
    {
      hora: '20:30 - 21:15',
      etapa: 'Cierre Institucional y Brindis Familiar',
      lugar: 'Patio de los Laureles Beltrán',
      descripcion: 'Fotografía oficial de la camada de graduados, felicitaciones y cierre del acto.'
    }
  ],
  mesaAcademica: [
    {
      nombre: 'Ing. Gustavo Torres',
      cargo: 'Rectorado Institucional',
      entidad: 'Instituto Tecnológico Beltrán'
    },
    {
      nombre: 'Lic. Mariana Gómez',
      cargo: 'Dirección de Carrera TSAS',
      entidad: 'Tecnicatura Superior en Analista de Sistemas'
    },
    {
      nombre: 'Dr. Alejandro Bianchi',
      cargo: 'Secretaría Académica',
      entidad: 'Consejo Superior Beltrán'
    },
    {
      nombre: 'Prof. Ing. Roberto González',
      cargo: 'Docente Padrino de Promoción',
      entidad: 'Cátedras de Sistemas y Práctica Profesional'
    }
  ],
  preguntasFrecuentes: [
    {
      pregunta: '¿Cómo accedo como egresado a gestionar mis datos?',
      respuesta: 'Hacé clic en el botón "Portal Egresado" en esta página o desde el enlace que recibiste por correo. Solo necesitás tu DNI y el código OTP enviado a tu casilla.'
    },
    {
      pregunta: '¿Los familiares e invitados necesitan su propia entrada?',
      respuesta: 'El egresado titular genera una credencial oficial en PDF que incluye el Pase Grupal y, en la segunda página, los carnets con código QR individual para cada familiar registrado, listos para ingresar por separado si lo prefieren.'
    },
    {
      pregunta: '¿Quiénes pueden subir al estrado para la entrega del diploma?',
      respuesta: 'Podés designar a tus padrinos de diploma (padres, cónyuge, hijos o padrinos afectivos) o solicitar la entrega junto a los docentes de la carrera que hayas elegido en tu portal.'
    },
    {
      pregunta: '¿Qué indumentaria y documentación se solicita para el ingreso?',
      respuesta: 'Se sugiere vestimenta formal acorde a la solemnidad de la ceremonia. En portería es obligatorio presentar la credencial digital (código QR en el celular o impreso) junto con el DNI físico.'
    }
  ]
}

export function LandingInstitucionalBeltran({

  onIrAEgresado,
  onIrAAdmin,
  onIrAManual,
  onVolver
}) {
  const [faqAbierto, setFaqAbierto] = useState(null)
  const [tiempoRestante, setTiempoRestante] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 })

  useEffect(() => {
    const calcular = () => {
      const destino = new Date(DATOS_PORTAL_BELTRAN.ceremonia.cuentaRegresivaFecha).getTime()
      const ahora = new Date().getTime()
      const diff = Math.max(0, destino - ahora)

      const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
      const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const segundos = Math.floor((diff % (1000 * 60)) / 1000)

      setTiempoRestante({ dias, horas, minutos, segundos })
    }

    calcular()
    const timer = setInterval(calcular, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#070e17] text-white font-sans selection:bg-sky-500 selection:text-slate-950 antialiased relative overflow-x-hidden">
      
      {/* ─── BARRA SUPERIOR INSTITUCIONAL ─── */}
      <div className="bg-[#002038] border-b border-sky-900/60 text-xs px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-sky-100">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-[11px] tracking-wide text-sky-200">
            {DATOS_PORTAL_BELTRAN.institucion.nombre}
          </span>
          <span className="hidden md:inline text-sky-300/60">·</span>
          <span className="hidden md:inline text-sky-200/90 text-[11px]">
            {DATOS_PORTAL_BELTRAN.institucion.carreraPrincipal}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="hidden sm:inline text-sky-200/80">{DATOS_PORTAL_BELTRAN.institucion.sede}</span>
          {onVolver && (
            <button
              onClick={onVolver}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
            >
              Volver al Sistema
            </button>
          )}
        </div>
      </div>

      {/* ─── HEADER / NAVEGACIÓN PRINCIPAL ─── */}
      <header className="sticky top-0 z-40 bg-[#071322]/90 backdrop-blur-xl border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Identidad Institucional Beltrán */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-12 w-12 rounded-xl bg-white p-1 border border-sky-400/40 shadow-md shadow-sky-900/30 flex items-center justify-center">
              <img src="/logo-escudo-recortado.png" alt="Instituto Beltrán" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">SiGIC</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/30">
                  Colaciones
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Instituto Tecnológico Beltrán
              </p>
            </div>
          </div>

          {/* Menú de Anclaje */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#ceremonia" className="hover:text-sky-400 transition">Ceremonia</a>
            <a href="#circuito" className="hover:text-sky-400 transition">Cómo Funciona</a>
            <a href="#cronograma" className="hover:text-sky-400 transition">Cronograma</a>
            <a href="#autoridades" className="hover:text-sky-400 transition">Mesa Académica</a>
            <a href="#preguntas" className="hover:text-sky-400 transition">Preguntas</a>
          </nav>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3">
            {onIrAManual && (
              <button
                onClick={onIrAManual}
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl border border-slate-700/60 hover:border-slate-500 transition cursor-pointer"
              >
                <BookOpen size={14} className="text-sky-400" />
                <span>Manual</span>
              </button>
            )}

            <button
              onClick={onIrAEgresado}
              className="px-4.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <GraduationCap size={15} />
              <span>Portal Egresado</span>
            </button>

            <button
              onClick={onIrAAdmin}
              className="px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              title="Acceso administrativo y de auditoría"
            >
              <Shield size={14} className="text-sky-400" />
              <span className="hidden md:inline">Gestión</span>
            </button>
          </div>

        </div>
      </header>

      {/* ─── HERO SECTION: PORTADA INSTITUCIONAL BELTRÁN ─── */}
      <section id="ceremonia" className="relative pt-16 pb-24 sm:pt-24 sm:pb-32 overflow-hidden">
        {/* Fondos y resplandores azul Beltrán */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0c2e4e] via-[#071322] to-[#070e17] opacity-80 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge institucional */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-md">
            <Award size={14} className="text-sky-400" />
            <span>{DATOS_PORTAL_BELTRAN.ceremonia.edicion} · {DATOS_PORTAL_BELTRAN.institucion.carreraPrincipal}</span>
          </div>

          {/* Título Principal */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            {DATOS_PORTAL_BELTRAN.ceremonia.titulo}
            <span className="block mt-3 text-sky-400 font-black">
              {DATOS_PORTAL_BELTRAN.institucion.nombre}
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            {DATOS_PORTAL_BELTRAN.ceremonia.lema}
          </p>

          {/* Ficha Rápida del Evento */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm font-semibold text-slate-300">
            <div className="flex items-center gap-2 bg-[#0c1f33]/80 border border-sky-900/80 px-4 py-2.5 rounded-2xl shadow-md">
              <Calendar size={16} className="text-sky-400" />
              <span>{DATOS_PORTAL_BELTRAN.ceremonia.fechaTexto}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0c1f33]/80 border border-sky-900/80 px-4 py-2.5 rounded-2xl shadow-md">
              <Clock size={16} className="text-sky-400" />
              <span>{DATOS_PORTAL_BELTRAN.ceremonia.horarioInicio}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0c1f33]/80 border border-sky-900/80 px-4 py-2.5 rounded-2xl shadow-md">
              <MapPin size={16} className="text-sky-400" />
              <span>{DATOS_PORTAL_BELTRAN.ceremonia.lugarNombre}</span>
            </div>
          </div>

          {/* Botones de Entrada Principal */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onIrAEgresado}
              className="px-8 py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-sky-500/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-3"
            >
              <QrCode size={19} />
              <span>Ingresar al Portal del Graduado</span>
              <ChevronRight size={18} />
            </button>

            <a
              href="#circuito"
              className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-slate-700 text-white font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Conocer el Circuito Operativo</span>
              <ArrowRight size={16} className="text-sky-400" />
            </a>
          </div>

          {/* ─── CUENTA REGRESIVA SOLEMNE ─── */}
          <div className="mt-14 max-w-xl mx-auto bg-gradient-to-b from-[#0b2238] to-[#081525] border border-sky-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-400 mb-4">
              Cuenta Regresiva para la Colación Oficial
            </p>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-[#06121f] rounded-2xl p-3 border border-sky-900/50">
                <span className="block text-2xl sm:text-4xl font-black text-white font-mono tabular-nums">{tiempoRestante.dias}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Días</span>
              </div>
              <div className="bg-[#06121f] rounded-2xl p-3 border border-sky-900/50">
                <span className="block text-2xl sm:text-4xl font-black text-white font-mono tabular-nums">{String(tiempoRestante.horas).padStart(2, '0')}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Horas</span>
              </div>
              <div className="bg-[#06121f] rounded-2xl p-3 border border-sky-900/50">
                <span className="block text-2xl sm:text-4xl font-black text-white font-mono tabular-nums">{String(tiempoRestante.minutos).padStart(2, '0')}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Minutos</span>
              </div>
              <div className="bg-[#06121f] rounded-2xl p-3 border border-sky-900/50">
                <span className="block text-2xl sm:text-4xl font-black text-cyan-400 font-mono tabular-nums animate-pulse">{String(tiempoRestante.segundos).padStart(2, '0')}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Segundos</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── INDICADORES INSTITUCIONALES ─── */}
      <section className="border-y border-slate-800 bg-[#091522] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {DATOS_PORTAL_BELTRAN.estadisticas.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-3xl sm:text-4xl font-black text-sky-400 font-mono tabular-nums">
                  {item.valor}
                </p>
                <p className="mt-2 text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  {item.etiqueta}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {item.detalle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PASO A PASO: CIRCUITO DE ACREDITACIÓN PARA EL EGRESADO Y FAMILIAS ─── */}
      <section id="circuito" className="py-24 bg-[#070e17] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-sky-400">
              Circuito Oficial Beltrán
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-white">
              De la Convocatoria al Estrado
            </h2>
            <p className="mt-4 text-sm text-slate-400">
              Proceso guiado de 4 pasos para garantizar la asignación de butacas, el juramento y la acreditación ágil el día del evento.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DATOS_PORTAL_BELTRAN.pasosCircuito.map((paso, idx) => (
              <div
                key={idx}
                className="bg-[#0b1a2a] rounded-3xl p-6 border border-slate-800 hover:border-sky-500/40 transition-all duration-300 hover:-translate-y-1 shadow-lg"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-400/30 text-sky-400 font-mono tabular-nums font-black text-base">
                    {paso.numero}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-950 text-sky-300 border border-sky-800/60">
                    {paso.badge}
                  </span>
                </div>
                <h3 className="text-base font-black text-white">{paso.titulo}</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  {paso.descripcion}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── CRONOGRAMA OFICIAL DE LA CEREMONIA ─── */}
      <section id="cronograma" className="py-24 bg-[#091522] border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-sky-400">
              Horarios y Protocolo
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-white">
              Cronograma de la Ceremonia
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Se solicita puntualidad para asegurar el desarrollo armonioso del acto académico.
            </p>
          </div>

          <div className="space-y-4">
            {DATOS_PORTAL_BELTRAN.cronograma.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#070e17] border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-sky-500/30 transition shadow-md"
              >
                <div className="md:w-52 shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sky-500/10 text-sky-300 font-mono tabular-nums text-xs font-bold border border-sky-500/20 mb-2">
                    <Clock size={13} />
                    <span>{item.hora}</span>
                  </div>
                  <span className="block text-[11px] font-bold uppercase text-slate-400">
                    {item.lugar}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-black text-white">{item.etapa}</h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    {item.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── MESA ACADÉMICA Y AUTORIDADES ─── */}
      <section id="autoridades" className="py-24 bg-[#070e17] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-sky-400">
              Estrado Mayor Beltrán
            </span>
            <h2 className="mt-2 text-3xl font-black text-white">
              Mesa Académica y Docentes
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Autoridades institucionales y cuerpo docente a cargo de la toma de juramento y entrega de diplomas.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DATOS_PORTAL_BELTRAN.mesaAcademica.map((aut, idx) => (
              <div
                key={idx}
                className="bg-[#0b1a2a] border border-slate-800 rounded-2xl p-6 text-center shadow-lg hover:border-sky-500/30 transition"
              >
                <div className="h-16 w-16 mx-auto rounded-2xl bg-sky-950/80 border border-sky-500/30 text-sky-300 flex items-center justify-center font-black text-xl mb-4">
                  {aut.nombre.split(' ').slice(-1)[0][0]}
                </div>
                <h3 className="text-sm font-black text-white">{aut.nombre}</h3>
                <p className="mt-1 text-xs font-bold text-sky-400">{aut.cargo}</p>
                <p className="mt-1 text-[11px] text-slate-400">{aut.entidad}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── PREGUNTAS FRECUENTES ─── */}
      <section id="preguntas" className="py-24 bg-[#091522] border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-sky-400">
              Información de Interés
            </span>
            <h2 className="mt-2 text-3xl font-black text-white">
              Preguntas Frecuentes
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Respuestas a las consultas habituales sobre la acreditación, acompañantes y protocolo.
            </p>
          </div>

          <div className="space-y-3">
            {DATOS_PORTAL_BELTRAN.preguntasFrecuentes.map((faq, idx) => (
              <div
                key={idx}
                className="bg-[#070e17] border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setFaqAbierto(faqAbierto === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-sky-300 transition cursor-pointer"
                >
                  <span>{faq.pregunta}</span>
                  <ChevronDown
                    size={18}
                    className={`text-sky-400 shrink-0 transition-transform duration-200 ${
                      faqAbierto === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {faqAbierto === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80">
                    {faq.respuesta}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Banner de Contacto */}
          <div className="mt-12 bg-gradient-to-r from-[#002038] to-[#071322] border border-sky-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-xl">
            <h3 className="text-base font-black text-white">¿Tenés alguna consulta particular o requerimiento de accesibilidad?</h3>
            <p className="mt-2 text-xs text-slate-300 max-w-xl mx-auto">
              La secretaría de colaciones del Instituto Tecnológico Beltrán está disponible para coordinar ingresos asistidos o situaciones especiales.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
              <a
                href={`mailto:${DATOS_PORTAL_BELTRAN.institucion.emailContacto}`}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition"
              >
                <Mail size={14} className="text-sky-400" />
                <span>{DATOS_PORTAL_BELTRAN.institucion.emailContacto}</span>
              </a>
              <span className="text-slate-400">{DATOS_PORTAL_BELTRAN.institucion.telefono}</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─── FOOTER INSTITUCIONAL BELTRÁN ─── */}
      <footer className="bg-[#002038] border-t border-sky-900/60 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white p-1 border border-sky-400/40 flex items-center justify-center">
              <img src="/logo-escudo-recortado.png" alt="Instituto Beltrán" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{DATOS_PORTAL_BELTRAN.institucion.nombre}</p>
              <p className="text-[11px] text-sky-300">{DATOS_PORTAL_BELTRAN.institucion.carreraPrincipal}</p>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-slate-300 font-semibold">{DATOS_PORTAL_BELTRAN.institucion.sede}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              SiGIC © 2026 · Sistema de Gestión Institucional de Colaciones
            </p>
          </div>

        </div>
      </footer>

    </div>
  )
}

export const LandingPageNerdearlaStyle = LandingInstitucionalBeltran;
