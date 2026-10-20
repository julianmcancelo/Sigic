import React, { useState, useEffect } from 'react'
import {
  Sparkles, Calendar, MapPin, Users, Award, Shield, CheckCircle2,
  ChevronRight, ArrowRight, ExternalLink, Play, Globe, Download,
  QrCode, BookOpen, Clock, Heart, Terminal, Cpu, Layers, HelpCircle,
  FileText, Sparkle, LayoutDashboard, UserCheck, Armchair, ChevronDown,
  Mail, MessageSquare, Compass, Send, Check, AlertCircle, Edit3
} from 'lucide-react'

// Datos mock / editables de la landing estilo Nerdearla
export const DATOS_LANDING_SIGIC = {
  evento: {
    edicion: 'Edición 2026',
    titulo: 'SiGIC Con 2026',
    subtitulo: 'La mayor ceremonia académica y tecnológica institucional',
    lema: 'Celebrando el esfuerzo de nuestros egresados · En vivo y presencial',
    fechaTexto: '28 de Noviembre de 2026',
    horarioTexto: '18:00hs GMT-3 (Acreditación desde las 17:00hs)',
    lugarNombre: 'Anfiteatro Central - Instituto Tecnológico Beltrán',
    lugarDireccion: 'Av. Manuel Belgrano 1191, Avellaneda, Buenos Aires',
    cuentaRegresivaFecha: '2026-11-28T18:00:00-03:00',
    transmisionVivoUrl: 'https://youtube.com',
  },
  metricas: [
    { valor: '+1.200', etiqueta: 'Egresados Habilitados', descripcion: 'Graduados de todas las carreras y tecnicaturas' },
    { valor: '100%', etiqueta: 'Acreditación QR Digital', descripcion: 'Ingreso ágil sin filas ni planillas impresas' },
    { valor: '4.800+', etiqueta: 'Familiares & Invitados', descripcion: 'Butacas y ubicaciones asignadas por algoritmo' },
    { valor: '48hs', etiqueta: 'Convocatoria Veloz', descripcion: 'Confirmación y gestión de padrinos con OTP institucional' },
  ],
  tracks: [
    { id: 'todos', nombre: 'Todos los Actos' },
    { id: 'sistemas', nombre: 'Informática & Sistemas' },
    { id: 'ingenieria', nombre: 'Ingeniería & Industria' },
    { id: 'gestion', nombre: 'Administración & Gestión' },
    { id: 'autoridades', nombre: 'Mesa Académica' }
  ],
  cronograma: [
    {
      hora: '17:00 - 17:45',
      titulo: 'Apertura de Puertas & Check-in QR Digital',
      categoria: 'Acreditación',
      track: 'todos',
      lugar: 'Hall Principal & Accesos Belgrano',
      descripcion: 'Ingreso de egresados y familiares mediante validación con la App Móvil de Portería SiGIC.',
      speaker: {
        nombre: 'Cuerpo de Seguridad y Portería',
        cargo: 'Equipo de Logística SiGIC',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
      }
    },
    {
      hora: '18:00 - 18:30',
      titulo: 'Apertura de Sesión Extraordinaria y Palabras de Bienvenida',
      categoria: 'Institucional',
      track: 'autoridades',
      lugar: 'Escenario Principal',
      descripcion: 'Ingreso solemne de autoridades institucionales y docentes directores de carrera.',
      speaker: {
        nombre: 'Ing. Gustavo Torres',
        cargo: 'Rector & Consejo Académico',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
      }
    },
    {
      hora: '18:30 - 19:30',
      titulo: 'Colación Promoción Analista de Sistemas & Desarrollo de Software',
      categoria: 'Graduación',
      track: 'sistemas',
      lugar: 'Estrado Mayor',
      descripcion: 'Juramento profesional con fórmula elegida y entrega de diplomas junto a padrinos seleccionados.',
      speaker: {
        nombre: 'Lic. Mariana Gómez',
        cargo: 'Directora de Departamento de Tecnología',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'
      }
    },
    {
      hora: '19:30 - 20:30',
      titulo: 'Colación Tecnicaturas Industriales y Gestión Empresarial',
      categoria: 'Graduación',
      track: 'ingenieria',
      lugar: 'Estrado Mayor',
      descripcion: 'Entrega de medallas al mérito académico y reconocimientos por trayectorias destacadas.',
      speaker: {
        nombre: 'Dr. Alejandro Bianchi',
        cargo: 'Secretario Académico',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
      }
    },
    {
      hora: '20:30 - 21:30',
      titulo: 'Cierre Solemne, Brindis & Espacio de Fotografía Oficial',
      categoria: 'Celebración',
      track: 'todos',
      lugar: 'Patio Central de los Laureles',
      descripcion: 'Área de retratos institucionales con diplomas y despedida de la camada de egresados.',
      speaker: {
        nombre: 'Comisión de Graduados ITB',
        cargo: 'Red Alumni Beltrán',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80'
      }
    }
  ],
  autoridades: [
    {
      nombre: 'Ing. Gustavo Torres',
      rol: 'Rectorado',
      institucion: 'Instituto Tecnológico Beltrán',
      bio: 'Liderando la formación tecnológica y profesional en zona sur desde hace más de 20 años.',
      foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      tag: 'Mesa Académica'
    },
    {
      nombre: 'Lic. Mariana Gómez',
      rol: 'Directora de Carrera',
      institucion: 'Analista de Sistemas / TIC',
      bio: 'Especialista en arquitecturas de software distributed y promotora de inclusión tecnológica.',
      foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      tag: 'Docente Padrino'
    },
    {
      nombre: 'Dr. Alejandro Bianchi',
      rol: 'Secretario Académico',
      institucion: 'Coordinación Pedagógica',
      bio: 'Investigador en metodologías de enseñanza y seguimiento de planes integrales de estudio.',
      foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      tag: 'Mesa Académica'
    },
    {
      nombre: 'Prof. Carlos Rossi',
      rol: 'Padrino de Promoción',
      institucion: 'Cátedra Práctica Profesionalizante',
      bio: 'Tutor de proyectos finales y enlace con las empresas del parque tecnológico industrial.',
      foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      tag: 'Docente Padrino'
    }
  ],
  patrocinadores: {
    diamante: [
      { nombre: 'Instituto Tecnológico Beltrán', tag: 'Sede Anfitriona & Académica', logo: '/logo-oficial.png' },
      { nombre: 'Campus Virtual Beltrán', tag: 'Plataforma Educativa', logo: '/logo.png' }
    ],
    comunidad: [
      { nombre: 'Red Alumni ITB', tipo: 'Graduados' },
      { nombre: 'Centro de Formación Continua', tipo: 'Cursos & Talleres' },
      { nombre: 'Laboratorio de Innovación Abierta', tipo: 'I+D' },
      { nombre: 'Secretaría de Bienestar Estudiantil', tipo: 'Comunidad' }
    ]
  },
  faq: [
    {
      pregunta: '¿Cómo accedo como egresado para gestionar mis invitados?',
      respuesta: 'Ingresá al portal haciendo clic en "Soy Egresado" con tu DNI y el código OTP enviado a tu correo institucional. Allí podrás confirmar juramento, registrar acompañantes y descargar tu credencial QR.'
    },
    {
      pregunta: '¿Cuántos invitados puedo registrar por egresado?',
      respuesta: 'El cupo estándar por egresado es asignado automáticamente por el algoritmo de distribución de butacas del anfiteatro (habitualmente entre 2 y 4 acompañantes con asiento numerado).'
    },
    {
      pregunta: '¿Qué pasa si no puedo asistir a la ceremonia?',
      respuesta: 'Podés indicar la no asistencia desde tu panel de autogestión de forma inmediata para que tu lugar sea reasignado. Tu diploma quedará a resguardo para retiro por secretaría.'
    },
    {
      pregunta: '¿Cómo se ingresa el día del acto?',
      respuesta: 'Cada egresado e invitado debe presentar su credencial digital (código QR) en su teléfono o impresa. El equipo de portería validará el acceso al instante con la app móvil SiGIC.'
    }
  ]
}

export function LandingPageNerdearlaStyle({
  onIrAEgresado,
  onIrAAdmin,
  onIrAManual,
  onVolver
}) {
  const [trackActivo, setTrackActivo] = useState('todos')
  const [faqAbierto, setFaqAbierto] = useState(null)
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false)
  const [modoEdicionEnVivo, setModoEdicionEnVivo] = useState(false)
  const [datos, setDatos] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const guardado = localStorage.getItem('sigic_landing_config')
        if (guardado) return JSON.parse(guardado)
      } catch (e) {
        console.warn('Error leyendo config local de landing:', e)
      }
    }
    return DATOS_LANDING_SIGIC
  })

  // Cuenta regresiva
  const [tiempoRestante, setTiempoRestante] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 })

  useEffect(() => {
    const calcular = () => {
      const destino = new Date(datos.evento.cuentaRegresivaFecha).getTime()
      const ahora = new Date().getTime()
      const diff = Math.max(0, destino - ahora)

      const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
      const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const segundos = Math.floor((diff % (1000 * 60)) / 1000)

      setTiempoRestante({ dias, horas, minutos, segundos })
    }

    calcular()
    const int = setInterval(calcular, 1000)
    return () => clearInterval(int)
  }, [datos.evento.cuentaRegresivaFecha])

  const guardarCambiosDatos = (nuevos) => {
    setDatos(nuevos)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sigic_landing_config', JSON.stringify(nuevos))
    }
  }

  const restablecerDatosOriginales = () => {
    guardarCambiosDatos(DATOS_LANDING_SIGIC)
    setModalEdicionAbierto(false)
  }

  // Filtrado de cronograma
  const cronogramaFiltrado = datos.cronograma.filter(item => {
    if (trackActivo === 'todos') return true
    return item.track === trackActivo || item.track === 'todos'
  })

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black antialiased relative overflow-x-hidden">
      
      {/* ─── BARRA DE ESTADO / TOOLBAR DE EDICIÓN LOCAL ─── */}
      <div className="sticky top-0 z-50 bg-[#0d1527]/90 backdrop-blur-md border-b border-cyan-500/20 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-extrabold uppercase tracking-wider text-[10px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
            Landing Page SiGIC · Live Local Sandbox
          </span>
          <span className="hidden md:inline text-slate-400 text-[11px]">
            Estilo Nerdearla adaptado al ecosistema de colaciones
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalEdicionAbierto(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-[11px] transition cursor-pointer"
            title="Editar textos, fecha, cronograma y autoridades en local"
          >
            <Edit3 size={13} />
            <span>Personalizar Landing</span>
          </button>
          
          {onVolver && (
            <button
              onClick={onVolver}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition cursor-pointer"
            >
              Volver al Sistema
            </button>
          )}
        </div>
      </div>

      {/* ─── HEADER / NAVBAR ESTILO NERDEARLA ─── */}
      <header className="relative z-40 border-b border-white/10 bg-[#070b14]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo y Nombre */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
                <div className="h-full w-full bg-[#0d1527] rounded-[14px] flex items-center justify-center p-1.5">
                  <img src="/logo-oficial.png" alt="SiGIC" className="h-full w-full object-contain" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xl tracking-tight text-white">SiGIC</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    2026
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Gestión Institucional de Colaciones
                </p>
              </div>
            </div>
          </div>

          {/* Menú Central Navegación */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#evento" className="hover:text-cyan-400 transition">El Evento</a>
            <a href="#cronograma" className="hover:text-cyan-400 transition">Cronograma</a>
            <a href="#autoridades" className="hover:text-cyan-400 transition">Mesa Académica</a>
            <a href="#patrocinadores" className="hover:text-cyan-400 transition">Institución</a>
            <a href="#faq" className="hover:text-cyan-400 transition">Preguntas</a>
          </nav>

          {/* Acciones de Login Rápidos */}
          <div className="flex items-center gap-3">
            <button
              onClick={onIrAManual}
              className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl transition"
            >
              <BookOpen size={14} className="text-cyan-400" />
              <span>Manual</span>
            </button>

            <button
              onClick={onIrAEgresado}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Award size={14} />
              <span>Soy Egresado</span>
            </button>

            <button
              onClick={onIrAAdmin}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Shield size={13} className="text-cyan-400" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ESTILO NERDEARLA ─── */}
      <section id="evento" className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Luces y Grilla de Fondo */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[450px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-widest mb-8 backdrop-blur-md shadow-inner">
            <Sparkles size={14} className="text-cyan-400 animate-spin-slow" />
            <span>{datos.evento.edicion} · Acto Oficial de Graduación</span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span>Presencial & Streaming</span>
          </div>

          {/* Título Principal */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.08]">
            {datos.evento.titulo}
            <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              {datos.evento.subtitulo}
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
            {datos.evento.lema}
          </p>

          {/* Datos clave del evento (Fecha, Hora, Sede) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-300">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-sm">
              <Calendar size={16} className="text-cyan-400" />
              <span>{datos.evento.fechaTexto}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-sm">
              <Clock size={16} className="text-cyan-400" />
              <span>{datos.evento.horarioTexto}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-sm">
              <MapPin size={16} className="text-cyan-400" />
              <span>{datos.evento.lugarNombre}</span>
            </div>
          </div>

          {/* Botones CTA Principales */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onIrAEgresado}
              className="px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-500/25 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2.5"
            >
              <QrCode size={18} />
              <span>Confirmar Asistencia / Obtener QR</span>
              <ChevronRight size={18} />
            </button>

            <a
              href="#cronograma"
              className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Calendar size={17} className="text-cyan-400" />
              <span>Ver Cronograma Completo</span>
            </a>
          </div>

          {/* ─── CONTADOR REGRESIVO ESTILO CONFERENCIA ─── */}
          <div className="mt-14 max-w-2xl mx-auto bg-gradient-to-b from-[#0f172a]/80 to-[#070b14]/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-28 w-28 bg-cyan-500/10 rounded-full blur-2xl" />
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-4">
              Cuenta Regresiva para la Ceremonia
            </p>
            <div className="grid grid-cols-4 gap-3 sm:gap-4 text-center">
              <div className="bg-[#131d35] rounded-2xl p-3 sm:p-4 border border-white/5">
                <span className="block text-2xl sm:text-4xl font-black text-white font-mono">{tiempoRestante.dias}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Días</span>
              </div>
              <div className="bg-[#131d35] rounded-2xl p-3 sm:p-4 border border-white/5">
                <span className="block text-2xl sm:text-4xl font-black text-white font-mono">{String(tiempoRestante.horas).padStart(2, '0')}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Horas</span>
              </div>
              <div className="bg-[#131d35] rounded-2xl p-3 sm:p-4 border border-white/5">
                <span className="block text-2xl sm:text-4xl font-black text-white font-mono">{String(tiempoRestante.minutos).padStart(2, '0')}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Min</span>
              </div>
              <div className="bg-[#131d35] rounded-2xl p-3 sm:p-4 border border-white/5">
                <span className="block text-2xl sm:text-4xl font-black text-cyan-400 font-mono animate-pulse">{String(tiempoRestante.segundos).padStart(2, '0')}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Seg</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── MÉTRICAS / IMPACTO DE LA COLACIÓN ─── */}
      <section className="border-y border-white/10 bg-[#0d1527]/50 py-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {datos.metricas.map((m, idx) => (
              <div key={idx} className="text-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition">
                <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-200 font-mono">
                  {m.valor}
                </p>
                <p className="mt-2 text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  {m.etiqueta}
                </p>
                <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                  {m.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA EL CIRCUITO DE ACREDITACIÓN (PASO A PASO) ─── */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-400">
              Circuito 100% Digital
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-white">
              De la invitación al estrado en 4 pasos
            </h2>
            <p className="mt-4 text-sm text-slate-400">
              SiGIC moderniza y agiliza cada instante de tu colación para que vos y tu familia solo se preocupen por disfrutar.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/10 hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-1">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-black text-lg mb-5">
                01
              </span>
              <h3 className="text-base font-black text-white">Acceso OTP Seguro</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Ingresá con tu DNI y código de un solo uso recibido por correo institucional. Sin contraseñas que olvidar.
              </p>
            </div>

            <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/10 hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-1">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-black text-lg mb-5">
                02
              </span>
              <h3 className="text-base font-black text-white">Invitados & Padrinos</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Cargá a tus acompañantes y elegí a la autoridad o docente que te entregará el diploma en el estrado.
              </p>
            </div>

            <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/10 hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-1">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-black text-lg mb-5">
                03
              </span>
              <h3 className="text-base font-black text-white">Pase Digital QR</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Generá tu credencial digital con QR grupal. Llevala en el teléfono o agregala a tu Google Wallet.
              </p>
            </div>

            <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/10 hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-1">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-black text-lg mb-5">
                04
              </span>
              <h3 className="text-base font-black text-white">Check-in de Puerta</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Portería escanea tu QR en 1 segundo y confirma tus butacas sin esperas ni planillas de papel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CRONOGRAMA & AGENDA ESTILO NERDEARLA ─── */}
      <section id="cronograma" className="py-20 bg-[#090f1d] border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-400">
                Agenda Oficial
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black text-white">
                Cronograma de la Ceremonia
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Horarios precisos de cada fase del acto y entrega por carreras.
              </p>
            </div>

            {/* Selector de Tracks / Carreras */}
            <div className="flex flex-wrap gap-2">
              {datos.tracks.map(track => (
                <button
                  key={track.id}
                  onClick={() => setTrackActivo(track.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                    trackActivo === track.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {track.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Sesiones / Bloques */}
          <div className="space-y-4">
            {cronogramaFiltrado.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#0f172a]/90 border border-white/10 hover:border-cyan-500/50 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Columna Izquierda: Horario y Tag */}
                <div className="md:w-56 shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/20 mb-2">
                    <Clock size={12} />
                    <span>{item.hora}</span>
                  </div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {item.lugar}
                  </span>
                </div>

                {/* Columna Central: Título y descripción */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-slate-800 text-slate-300 border border-white/10">
                      {item.categoria}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {item.titulo}
                  </h3>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed max-w-2xl">
                    {item.descripcion}
                  </p>
                </div>

                {/* Columna Derecha: Disertante / Autoridad */}
                <div className="flex items-center gap-3 md:w-64 shrink-0 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                  <img
                    src={item.speaker.avatar}
                    alt={item.speaker.nombre}
                    className="h-10 w-10 rounded-full object-cover border border-cyan-400/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.speaker.nombre}</p>
                    <p className="text-[10px] text-cyan-400 truncate font-semibold">{item.speaker.cargo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── AUTORIDADES Y MESA ACADÉMICA (SPEAKERS ESTILO NERDEARLA) ─── */}
      <section id="autoridades" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-400">
              Mesa Académica & Padrinos
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-white">
              Autoridades de la Ceremonia
            </h2>
            <p className="mt-4 text-sm text-slate-400">
              El equipo directivo y cuerpo docente que acompañó la trayectoria de cada egresado.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {datos.autoridades.map((autoridad, idx) => (
              <div
                key={idx}
                className="bg-[#0f172a] rounded-3xl overflow-hidden border border-white/10 hover:border-cyan-500/40 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="h-56 w-full relative overflow-hidden bg-slate-800">
                  <img
                    src={autoridad.foto}
                    alt={autoridad.nombre}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent" />
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-cyan-950/80 backdrop-blur-md border border-cyan-500/40 text-[10px] font-black text-cyan-300 uppercase tracking-wider">
                    {autoridad.tag}
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition">
                    {autoridad.nombre}
                  </h3>
                  <p className="text-xs font-bold text-cyan-400 mt-0.5">
                    {autoridad.rol}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    {autoridad.institucion}
                  </p>
                  <p className="mt-3 text-xs text-slate-300/80 leading-relaxed line-clamp-3">
                    {autoridad.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── SPONSORS & RESPALDO INSTITUCIONAL (TIERED ESTILO NERDEARLA) ─── */}
      <section id="patrocinadores" className="py-20 bg-[#080d19] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-400">
            Respaldo Institucional
          </span>
          <h2 className="mt-3 text-3xl font-black text-white">
            Organizado por la Comunidad Beltrán
          </h2>
          <p className="mt-4 text-sm text-slate-400 max-w-2xl mx-auto">
            Garantizado bajo estándares oficiales del Instituto Tecnológico Beltrán y fiscalizado por el Consejo Superior Académico.
          </p>

          {/* Nivel Diamante / Organizadores */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            {datos.patrocinadores.diamante.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 hover:border-cyan-500/40 transition"
              >
                <img src={item.logo} alt={item.nombre} className="h-12 w-12 object-contain" />
                <div className="text-left">
                  <p className="text-sm font-black text-white">{item.nombre}</p>
                  <p className="text-[11px] text-cyan-400 font-semibold">{item.tag}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comunidad y Redes */}
          <div className="mt-10 pt-10 border-t border-white/5 max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">
              Áreas y Entidades Participantes
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {datos.patrocinadores.comunidad.map((com, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 font-semibold"
                >
                  <span className="text-cyan-400 mr-1.5 font-bold">#</span>
                  {com.nombre}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── PREGUNTAS FRECUENTES (FAQ ESTILO NERDEARLA) ─── */}
      <section id="faq" className="py-20 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-400">
              ¿Tenés dudas?
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-white">
              Preguntas Frecuentes
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Todo lo que necesitás saber antes de llegar al anfiteatro.
            </p>
          </div>

          <div className="space-y-3">
            {datos.faq.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setFaqAbierto(faqAbierto === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-black text-sm text-white hover:text-cyan-300 transition cursor-pointer"
                >
                  <span>{item.pregunta}</span>
                  <ChevronDown
                    size={18}
                    className={`text-cyan-400 shrink-0 transition-transform duration-200 ${
                      faqAbierto === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {faqAbierto === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/5">
                    {item.respuesta}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Banner de Contacto / Soporte */}
          <div className="mt-12 bg-gradient-to-r from-cyan-950/40 via-sky-950/30 to-indigo-950/40 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 text-center">
            <h3 className="text-lg font-black text-white">¿No encontraste respuesta a tu consulta?</h3>
            <p className="mt-2 text-xs text-slate-300 max-w-xl mx-auto">
              El equipo de soporte institucional y secretaría académica está disponible para asistirte con acreditaciones especiales o solicitudes de accesibilidad.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:soporte@ibeltran.com.ar"
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
              >
                <Mail size={14} />
                <span>Contactar a Soporte</span>
              </a>
              <button
                onClick={onIrAManual}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition cursor-pointer flex items-center gap-2"
              >
                <BookOpen size={14} />
                <span>Abrir Manual Completo</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ─── FOOTER ESTILO NERDEARLA ─── */}
      <footer className="border-t border-white/10 bg-[#05080f] py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            
            <div className="flex items-center gap-3">
              <img src="/logo-oficial.png" alt="SiGIC" className="h-9 w-9 object-contain" />
              <div>
                <p className="text-sm font-black text-white">SiGIC · Beltrán Colaciones</p>
                <p className="text-[10px] text-slate-500">Sistema de Gestión Institucional de Colaciones</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-400">
              <button onClick={onIrAEgresado} className="hover:text-cyan-400 transition cursor-pointer">Portal Egresado</button>
              <button onClick={onIrAAdmin} className="hover:text-cyan-400 transition cursor-pointer">Panel Administrador</button>
              <button onClick={onIrAManual} className="hover:text-cyan-400 transition cursor-pointer">Documentación</button>
              <a href="mailto:soporte@ibeltran.com.ar" className="hover:text-cyan-400 transition">Contacto</a>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© 2026 Instituto Tecnológico Beltrán. Todos los derechos reservados.</p>
            <p>Desarrollado en el marco de las Prácticas Profesionalizantes de Analista de Sistemas.</p>
          </div>
        </div>
      </footer>

      {/* ─── MODAL DE EDICIÓN LOCAL DE LA LANDING ─── */}
      {modalEdicionAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#0d1527] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden">
            
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#131d35]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Editor Local de Landing Page</h3>
                  <p className="text-[10px] text-slate-400">Modificá textos y configuraciones en vivo para tu entorno</p>
                </div>
              </div>
              <button
                onClick={() => setModalEdicionAbierto(false)}
                className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulario de Edición */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Título Principal
                  </label>
                  <input
                    type="text"
                    value={datos.evento.titulo}
                    onChange={e => guardarCambiosDatos({
                      ...datos,
                      evento: { ...datos.evento, titulo: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-white/10 text-white font-bold focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Subtítulo / Bajada
                  </label>
                  <input
                    type="text"
                    value={datos.evento.subtitulo}
                    onChange={e => guardarCambiosDatos({
                      ...datos,
                      evento: { ...datos.evento, subtitulo: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-white/10 text-white font-bold focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Lema / Descripción Hero
                </label>
                <textarea
                  rows={2}
                  value={datos.evento.lema}
                  onChange={e => guardarCambiosDatos({
                    ...datos,
                    evento: { ...datos.evento, lema: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-white/10 text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Fecha del Evento (Texto)
                  </label>
                  <input
                    type="text"
                    value={datos.evento.fechaTexto}
                    onChange={e => guardarCambiosDatos({
                      ...datos,
                      evento: { ...datos.evento, fechaTexto: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-white/10 text-white font-bold focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Horario (Texto)
                  </label>
                  <input
                    type="text"
                    value={datos.evento.horarioTexto}
                    onChange={e => guardarCambiosDatos({
                      ...datos,
                      evento: { ...datos.evento, horarioTexto: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-white/10 text-white font-bold focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Nombre del Lugar / Sede
                  </label>
                  <input
                    type="text"
                    value={datos.evento.lugarNombre}
                    onChange={e => guardarCambiosDatos({
                      ...datos,
                      evento: { ...datos.evento, lugarNombre: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-white/10 text-white font-bold focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Fecha Countdown (ISO)
                  </label>
                  <input
                    type="datetime-local"
                    value={datos.evento.cuentaRegresivaFecha.substring(0, 16)}
                    onChange={e => guardarCambiosDatos({
                      ...datos,
                      evento: { ...datos.evento, cuentaRegresivaFecha: `${e.target.value}:00-03:00` }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-white/10 text-white font-bold focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <Check size={14} /> Guardado automático en tu navegador (localStorage)
                </p>
                <p className="text-slate-400">
                  Los cambios se reflejan inmediatamente en tiempo real mientras navegás y editás la landing en local.
                </p>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-[#131d35]">
              <button
                type="button"
                onClick={restablecerDatosOriginales}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold transition cursor-pointer"
              >
                Restablecer a valores por defecto
              </button>

              <button
                type="button"
                onClick={() => setModalEdicionAbierto(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
              >
                Listo, Ver Cambios
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
