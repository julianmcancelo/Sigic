import { useState, useEffect, useRef } from 'react'
import { Settings, Users, GraduationCap, BookOpen, ChevronRight, Info, LogIn } from 'lucide-react'
import { VERSION_LABEL } from '../lib/version'

export function PantallaSeleccionLogin({ onSeleccionarAdmin, onSeleccionarEgresado, onSeleccionarManual, enMantenimiento, accesoOculto, modoDemo = false }) {
  const [clickCount, setClickCount] = useState(0)
  const [snapActivo, setSnapActivo] = useState(false)
  const [revelado, setRevelado] = useState(false)
  const [mostrarInfo, setMostrarInfo] = useState(false)
  const [fraseTooltip, setFraseTooltip] = useState('SiGIC')
  const canvasRef = useRef(null)

  useEffect(() => {
    if (accesoOculto === false) {
      setRevelado(true)
    }
  }, [accesoOculto])

  useEffect(() => {
    const frases = [
      'Perfectamente equilibrado, como todo debe estar...',
      'I love you 3000',
      '¿De verdad creíste que era solo un logo?',
      'El fin está cerca...',
      'Iniciativa Vengadores activa.'
    ]
    const seleccionada = frases[Math.floor(Math.random() * frases.length)]
    setFraseTooltip(seleccionada)
  }, [])

  function manejarClickLogo() {
    if (revelado || snapActivo) return
    const nuevoConteo = clickCount + 1
    if (nuevoConteo >= 5) {
      setSnapActivo(true)
      
      // La animación de desintegración dura 1.6 segundos
      setTimeout(() => {
        setSnapActivo(false)
        setRevelado(true)
      }, 1600)
    } else {
      setClickCount(nuevoConteo)
    }
  }

  // Animación HTML5 Canvas para el efecto de polvo/cenizas de Thanos
  useEffect(() => {
    if (!snapActivo) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    // Dimensiones que cubren la pantalla completa
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = []
    
    // Área aproximada de la tarjeta central a desintegrar (dinámica)
    const cardWidth = Math.min(384, window.innerWidth - 32)
    const cardHeight = Math.min(350, window.innerHeight - 32)
    const startX = window.innerWidth / 2 - cardWidth / 2
    const startY = window.innerHeight / 2 - cardHeight / 2

    // Crear 1200 partículas de polvo
    for (let i = 0; i < 1200; i++) {
      const px = startX + Math.random() * cardWidth
      const py = startY + Math.random() * cardHeight
      
      // Paleta de colores inspirada en la tarjeta clara (blanco, gris y detalles cian/índigo)
      let color = '#ffffff'
      const rand = Math.random()
      if (rand < 0.4) color = '#cbd5e1' // slate-300
      else if (rand < 0.6) color = '#0ea5e9' // cyan-500
      else if (rand < 0.7) color = '#6366f1' // indigo-500

      particles.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.2) * 1.8, // Flotar mayormente hacia la derecha
        vy: -0.8 - Math.random() * 2.5, // Flotar hacia arriba
        size: 0.8 + Math.random() * 2.2,
        alpha: 1,
        decay: 0.004 + Math.random() * 0.012,
        color
      })
    }

    let shockwaveRadius = 10
    const maxShockwaveRadius = Math.max(window.innerWidth, window.innerHeight) * 0.8

    let animFrameId
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Dibujar onda de choque expansiva
      if (shockwaveRadius < maxShockwaveRadius) {
        ctx.save()
        ctx.strokeStyle = `rgba(14, 165, 233, ${1 - (shockwaveRadius / maxShockwaveRadius)})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(window.innerWidth / 2, window.innerHeight / 2, shockwaveRadius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
        shockwaveRadius += 16
      }

      let active = 0
      particles.forEach(p => {
        if (p.alpha <= 0) return
        active++

        // Actualizar coordenadas y desvanecimiento
        p.x += p.vx
        p.y += p.vy
        p.alpha -= p.decay

        // Dibujar partícula circular
        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      if (active > 0 || shockwaveRadius < maxShockwaveRadius) {
        animFrameId = requestAnimationFrame(draw)
      }
    }

    draw()

    return () => cancelAnimationFrame(animFrameId)
  }, [snapActivo])

  const equipo = [
    { nombre: 'Alan Alexis Alfonso',     hex: '#0ea5e9' },
    { nombre: 'Julián Cancelo',          hex: '#6366f1' },
    { nombre: 'Sol Contreras V.',        hex: '#ec4899' },
    { nombre: 'Matías Frassia',          hex: '#f59e0b' },
    { nombre: 'Luis Gabriel Santillán',  hex: '#10b981' },
  ]

  if (modoDemo) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16 text-slate-800 bg-gradient-to-tr from-slate-100 via-sky-50/50 to-blue-50/40">
        <div className="absolute inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(56,189,248,.18),transparent_34%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,.12),transparent_30%)]" />
        <section className="relative z-10 w-full max-w-3xl text-center" aria-labelledby="demo-title">
          <img src="/logo.png" alt="SiGIC" className="mx-auto h-20 w-20 rounded-2xl bg-white object-cover shadow-xl border border-slate-200/80 p-1" />
          <p className="mt-7 text-xs font-black uppercase tracking-[0.25em] text-sky-600">Entorno de demostración</p>
          <h1 id="demo-title" className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">¿Cómo querés ingresar?</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600">Elegí un perfil para recorrer SiGIC. No necesitás usuario ni contraseña y todos los datos son ficticios.</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <button onClick={onSeleccionarAdmin} className="group flex min-h-40 flex-col items-start justify-between rounded-3xl border border-slate-200/90 bg-white/90 p-6 text-left shadow-md shadow-slate-200/50 backdrop-blur transition hover:-translate-y-1 hover:border-sky-400 hover:shadow-xl hover:bg-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-sky-300 cursor-pointer">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors"><Users size={24} aria-hidden="true" /></span>
              <span><strong className="block text-xl text-slate-900">Administrador</strong><small className="mt-1 block text-sm text-slate-500">Gestionar graduados, ceremonias, ingresos y reportes</small></span>
              <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-sky-600">Ingresar <ChevronRight size={15} aria-hidden="true" /></span>
            </button>

            <button onClick={onSeleccionarEgresado} className="group flex min-h-40 flex-col items-start justify-between rounded-3xl border border-slate-200/90 bg-white/90 p-6 text-left shadow-md shadow-slate-200/50 backdrop-blur transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl hover:bg-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-emerald-300 cursor-pointer">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><GraduationCap size={24} aria-hidden="true" /></span>
              <span><strong className="block text-xl text-slate-900">Egresado</strong><small className="mt-1 block text-sm text-slate-500">Consultar invitación, acompañantes, credencial y ubicación</small></span>
              <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-emerald-600">Ingresar <ChevronRight size={15} aria-hidden="true" /></span>
            </button>
          </div>

          <p className="mt-10 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 font-mono">{VERSION_LABEL}</p>
        </section>
      </main>
    )
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden select-none text-slate-800 font-sans bg-gradient-to-tr from-slate-100 via-sky-50/40 to-blue-50/30">
      {/* Fondo con gradiente claro y orbes suaves */}
      <div className="absolute inset-0 pointer-events-none opacity-60 [background-image:radial-gradient(circle_at_20%_20%,rgba(56,189,248,.15),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,.1),transparent_35%)]" />

      {/* Orbes de luz decorativos de fondo */}
      <div className="absolute top-1/3 left-1/4 h-[350px] w-[350px] rounded-full bg-sky-300/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 h-[350px] w-[350px] rounded-full bg-indigo-300/15 blur-[120px] pointer-events-none" />

      {/* Canvas para partículas de Thanos */}
      {snapActivo && (
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 z-30 pointer-events-none" 
        />
      )}

      {/* Modo Mantenimiento */}
      {enMantenimiento && (
        <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-8 py-12 text-center bg-white/95 rounded-[32px] border border-slate-200/90 shadow-xl shadow-slate-200/50 animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-500 mb-6 shadow-inner">
            <Settings size={32} className="animate-[spin_4s_linear_infinite]" />
          </div>
          
          <h1 className="text-xl font-black text-slate-800 tracking-tight mb-2">
            Modo Mantenimiento
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed px-4">
            Estamos realizando ajustes técnicos y mejoras en el servidor. El acceso a SiGIC se encuentra temporalmente suspendido.
          </p>

          <div className="mt-8 w-full border-t border-slate-200/60 pt-6">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Instituto Tecnológico Beltrán
            </p>
          </div>
        </div>
      )}

      {/* Contenedor Principal (Vista Minimalista: Estamos preparando algo importante) */}
      {!revelado && !enMantenimiento && (
        <div className={`relative z-10 flex flex-col items-center max-w-2xl w-full px-6 py-12 text-center transition-all ${
          snapActivo ? 'animate-thanos pointer-events-none' : ''
        }`}>
          
          {/* Logo de SiGIC en tarjeta blanca */}
          <div 
            onClick={manejarClickLogo}
            className={`relative mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-slate-200/80 shadow-xl shadow-slate-200/60 p-2.5 cursor-pointer active:scale-95 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 ${
              clickCount === 1 ? 'animate-shake-1' :
              clickCount === 2 ? 'animate-shake-2' :
              clickCount === 3 ? 'animate-shake-3' :
              clickCount === 4 ? 'animate-shake-4' : ''
            }`}
            title={fraseTooltip}
          >
            <img
              src="/logo.png"
              alt="SiGIC"
              className="h-full w-full object-contain"
            />
          </div>

          {/* Kicker Institucional */}
          <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] text-sky-600 mb-3.5">
            Sistema de Gestión Integral de Ceremonias
          </p>

          {/* Título Monumental */}
          <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-black text-slate-900 tracking-tight leading-[1.1] max-w-2xl mx-auto">
            Estamos preparando <br className="hidden sm:inline" /> algo importante.
          </h1>

          {/* Subtítulo */}
          <p className="mt-4 text-sm sm:text-base text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
            Muy pronto vas a poder conocer la plataforma completa de SiGIC.
          </p>

          {/* 2 Botones de Acción: [->] Ingresar y ● Próximamente */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onSeleccionarAdmin}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-slate-900/15 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <LogIn size={15} />
              <span>Ingresar</span>
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
              <span>Próximamente</span>
            </div>
          </div>

          {/* Footer Minimalista */}
          <div className="mt-16 text-center space-y-1">
            <button
              onClick={() => setMostrarInfo(true)}
              className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400/80 hover:text-sky-600 transition-colors cursor-pointer"
            >
              Instituto Tecnológico Beltrán
            </button>
            <p className="text-[9px] font-bold text-slate-300 font-mono tracking-wider">{VERSION_LABEL}</p>
          </div>
        </div>
      )}

      {/* Opciones de Login (Reveladas al hacer clic en Ingresar o con el Easter Egg) */}
      {revelado && (
        <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-8 py-10 text-center bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] animate-fade-slide-up">
          
          <div className="flex items-center justify-between w-full mb-5 pb-3 border-b border-slate-100">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-sky-600">
                Acceso a SiGIC
              </p>
              <h2 className="text-sm font-black text-slate-900">Seleccioná tu rol</h2>
            </div>
            <button
              onClick={() => setRevelado(false)}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Volver
            </button>
          </div>
          
          <div className="w-full space-y-3 mb-6">
            {/* Opción Admin */}
            <button
              onClick={onSeleccionarAdmin}
              className="group relative flex w-full items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 transition-all hover:bg-sky-50/50 hover:border-sky-300 active:scale-[0.98] cursor-pointer text-left shadow-xs hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-600 group-hover:text-white shrink-0">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Administrador</p>
                <p className="text-[11px] text-slate-500 font-medium">Organizadores y directivos</p>
              </div>
              <ChevronRight size={15} className="absolute right-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-sky-500" />
            </button>

            {/* Opción Egresado */}
            <button
              onClick={onSeleccionarEgresado}
              className="group relative flex w-full items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 transition-all hover:bg-emerald-50/50 hover:border-emerald-300 active:scale-[0.98] cursor-pointer text-left shadow-xs hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white shrink-0">
                <GraduationCap size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Graduado</p>
                <p className="text-[11px] text-slate-500 font-medium">Ingreso de invitados y datos</p>
              </div>
              <ChevronRight size={15} className="absolute right-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-500" />
            </button>

            {/* Opción Manual */}
            <button
              onClick={onSeleccionarManual}
              className="group relative flex w-full items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] cursor-pointer text-left shadow-xs hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-700 group-hover:text-white shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Manual de Usuario</p>
                <p className="text-[11px] text-slate-500 font-medium">Guías de uso del sistema</p>
              </div>
              <ChevronRight size={15} className="absolute right-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-600" />
            </button>
          </div>

          {/* Footer */}
          <div className="text-center opacity-60">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Instituto Tecnológico Beltrán
            </p>
          </div>
        </div>
      )}

      {/* Modal de Información del Proyecto */}
      {mostrarInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs rounded-[32px] border border-slate-155 bg-white/95 p-6 text-center shadow-2xl animate-fade-slide-up relative">
            <div className="flex justify-center mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-50 text-cyan-600 border border-cyan-100/50">
                <Info size={10} /> Proyecto Académico
              </span>
            </div>

            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-850">
              Proyecto Integrador Final
            </h3>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
              PPT3 · Analista de Sistemas
            </p>
            <div className="my-3.5 h-[1px] bg-slate-100" />
            
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mb-5">
              SiGIC es el Sistema de Gestión de Ceremonias desarrollado como proyecto integrador para la materia de Prácticas Profesionalizantes 3 en el Instituto Beltrán.
            </p>

            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-3">
              Equipo de Desarrollo
            </p>

            {/* Grupo de Avatares Interactivos */}
            <div className="flex justify-center -space-x-2.5 hover:-space-x-1.5 transition-all duration-300 py-3 mb-6">
              {equipo.map((m, i) => {
                const partes = m.nombre.split(' ')
                const iniciales = (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase()
                
                return (
                  <div 
                    key={i} 
                    className="group relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-[11px] font-black text-white cursor-pointer shadow-md transition-all duration-300 hover:-translate-y-2 hover:scale-115 hover:z-30 hover:shadow-lg"
                    style={{ 
                      backgroundColor: m.hex,
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' 
                    }}
                  >
                    {iniciales}
                    {/* Tooltip flotante */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 scale-75 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-250 ease-elastic bg-slate-900 text-white px-3 py-1.5 rounded-2xl whitespace-nowrap shadow-xl border border-white/10 text-center z-50">
                      <p className="text-[10px] font-bold tracking-wide leading-none">{m.nombre}</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-1.5 h-1.5 rotate-45 bg-slate-900 border-r border-b border-white/10" />
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setMostrarInfo(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider shadow-md hover:shadow-lg active:scale-98"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Estilos CSS */}
      <style>{`
        .bg-radial-light {
          background: radial-gradient(circle at center, #f8fafc 0%, #e2e8f0 100%);
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1deg); }
        }
        
        .logo-flotar {
          animation: float 5s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin 30s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 35s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(15px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .animate-fade-slide-up {
          animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .ease-elastic {
          transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        /* Infinity Stones Shake & Glow Levels */
        @keyframes shake-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(0.5px, 0.5px) rotate(0.1deg); }
          75% { transform: translate(-0.5px, -0.5px) rotate(-0.1deg); }
        }
        @keyframes shake-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(1px, -1px) rotate(0.2deg); }
          40% { transform: translate(-1px, 1.5px) rotate(-0.2deg); }
          60% { transform: translate(1px, 1px) rotate(0.1deg); }
          80% { transform: translate(-1.5px, -1px) rotate(-0.1deg); }
        }
        @keyframes shake-3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          15% { transform: translate(2px, -2px) rotate(0.5deg); }
          30% { transform: translate(-2px, 2px) rotate(-0.5deg); }
          45% { transform: translate(2px, 2px) rotate(0.3deg); }
          60% { transform: translate(-2px, -1.5px) rotate(-0.3deg); }
          75% { transform: translate(1.5px, -2px) rotate(0.4deg); }
          90% { transform: translate(-1.5px, 2px) rotate(-0.4deg); }
        }
        @keyframes shake-4 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(3.5px, -3.5px) rotate(1.2deg); }
          20% { transform: translate(-3.5px, 3.5px) rotate(-1.2deg); }
          30% { transform: translate(3px, 3.5px) rotate(0.8deg); }
          40% { transform: translate(-3.5px, -2.5px) rotate(-0.8deg); }
          50% { transform: translate(2.5px, -3px) rotate(1.0deg); }
          60% { transform: translate(-2.5px, 3.5px) rotate(-1.0deg); }
          70% { transform: translate(3px, -2.5px) rotate(0.9deg); }
          80% { transform: translate(-3.5px, 2.5px) rotate(-0.9deg); }
          90% { transform: translate(2.5px, 3.5px) rotate(1.1deg); }
        }

        .animate-shake-1 { animation: shake-1 0.3s linear infinite; filter: drop-shadow(0 0 8px rgba(14, 165, 233, 0.4)); }
        .animate-shake-2 { animation: shake-2 0.25s linear infinite; filter: drop-shadow(0 0 16px rgba(14, 165, 233, 0.65)); }
        .animate-shake-3 { animation: shake-3 0.2s linear infinite; filter: drop-shadow(0 0 24px rgba(99, 102, 241, 0.85)); }
        .animate-shake-4 { animation: shake-4 0.15s linear infinite; filter: drop-shadow(0 0 40px rgba(236, 72, 153, 0.95)); }

        /* Efecto de desintegración de Thanos */
        @keyframes thanosSnap {
          0% {
            transform: scale(1) translateY(0) rotate(0deg);
            filter: blur(0px) brightness(1);
            opacity: 1;
          }
          40% {
            transform: scale(1.02) translateY(-4px) rotate(0.2deg);
            filter: blur(2px) brightness(1.1);
            opacity: 0.9;
          }
          100% {
            transform: scale(0.88) translateY(-30px) rotate(1.5deg);
            filter: blur(16px) brightness(0.6);
            opacity: 0;
          }
        }

        .animate-thanos {
          animation: thanosSnap 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </main>
  )
}
