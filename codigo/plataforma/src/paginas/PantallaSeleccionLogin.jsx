import { useState, useEffect, useRef } from 'react'
import { Users, GraduationCap, BookOpen, ChevronRight, Info } from 'lucide-react'

export function PantallaSeleccionLogin({ onSeleccionarAdmin, onSeleccionarEgresado, onSeleccionarManual }) {
  const [clickCount, setClickCount] = useState(0)
  const [snapActivo, setSnapActivo] = useState(false)
  const [revelado, setRevelado] = useState(false)
  const [mostrarInfo, setMostrarInfo] = useState(false)
  const canvasRef = useRef(null)

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
    
    // Área aproximada de la tarjeta central a desintegrar
    const cardWidth = 384
    const cardHeight = 350
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

    let animFrameId
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
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

      if (active > 0) {
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

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f4f6fa] select-none text-slate-800 font-sans">
      {/* Fondo con gradiente claro y orbes */}
      <div className="absolute inset-0 pointer-events-none bg-radial-light" />

      {/* Orbes de luz decorativos de fondo */}
      <div className="absolute top-1/3 left-1/4 h-[350px] w-[350px] rounded-full bg-cyan-400/10 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 h-[350px] w-[350px] rounded-full bg-indigo-400/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Canvas para partículas de Thanos */}
      {snapActivo && (
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 z-30 pointer-events-none" 
        />
      )}

      {/* Contenedor Principal (Tarjeta Glassmorphism Clara) */}
      {!revelado && (
        <div className={`relative z-10 flex flex-col items-center max-w-sm w-full px-8 py-10 text-center bg-white/70 border border-white/80 rounded-[32px] backdrop-blur-xl shadow-[0_20px_50px_rgba(15,23,42,0.05)] transition-all ${
          snapActivo ? 'animate-thanos pointer-events-none' : ''
        }`}>
          
          {/* Logo de SIGIC interactivo */}
          <div 
            onClick={manejarClickLogo}
            className="relative mb-6 flex h-36 w-36 items-center justify-center cursor-pointer active:scale-95 transition-transform duration-300"
            title="SiGIC"
          >
            {/* Anillos decorativos */}
            <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-spin-slow pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-dashed border-indigo-500/10 animate-spin-reverse pointer-events-none" />
            <div className="absolute inset-6 rounded-full bg-cyan-500/5 blur-xl pointer-events-none" />
            
            <img
              src="/logo-oficial.png"
              alt="SiGIC"
              className="h-20 w-auto object-contain relative z-10 logo-flotar filter drop-shadow-[0_8px_16px_rgba(14,165,233,0.1)]"
            />
          </div>

          {/* Branding Principal */}
          <div className="space-y-2.5">
            <h1 className="text-3xl font-black tracking-[0.12em] text-[#1e293b]">
              SiGIC
            </h1>
            <div className="mx-auto h-[2px] w-12 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
            <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed">
              Sistema de Gestión de Ceremonias de Colación
            </p>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Instituto Tecnológico Beltrán
            </p>
            <button 
              onClick={() => setMostrarInfo(true)}
              className="block w-full text-[8px] font-bold uppercase tracking-[0.15em] text-slate-400/60 hover:text-cyan-600 transition-colors cursor-pointer animate-pulse"
            >
              Proyecto Final · PPT3 · Analista de Sistemas
            </button>
          </div>
        </div>
      )}

      {/* Opciones de Login (Reveladas con efecto de reconstrucción tras la desintegración de Thanos) */}
      {revelado && (
        <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-8 py-10 text-center bg-white/80 border border-slate-100 rounded-[32px] shadow-2xl backdrop-blur-xl animate-fade-slide-up">
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 mb-4">
            Panel de Autenticación Habilitado
          </p>
          
          <div className="w-full space-y-3 mb-6">
            {/* Opción Admin */}
            <button
              onClick={onSeleccionarAdmin}
              className="group relative flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition-all hover:bg-slate-50 hover:border-cyan-500/30 active:scale-[0.98] cursor-pointer text-left shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 transition-colors group-hover:bg-cyan-600 group-hover:text-white">
                <Users size={18} />
              </div>
              <div>
                <p className="text-[12px] font-black text-slate-800">Administrador</p>
                <p className="text-[10px] text-slate-400 font-medium">Organizadores y seguridad</p>
              </div>
              <ChevronRight size={14} className="absolute right-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-cyan-500" />
            </button>

            {/* Opción Egresado */}
            <button
              onClick={onSeleccionarEgresado}
              className="group relative flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition-all hover:bg-slate-50 hover:border-indigo-500/30 active:scale-[0.98] cursor-pointer text-left shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <GraduationCap size={18} />
              </div>
              <div>
                <p className="text-[12px] font-black text-slate-800">Graduado</p>
                <p className="text-[10px] text-slate-400 font-medium">Ingreso de invitados y datos</p>
              </div>
              <ChevronRight size={14} className="absolute right-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
            </button>

            {/* Opción Manual */}
            <button
              onClick={onSeleccionarManual}
              className="group relative flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition-all hover:bg-slate-50 hover:border-slate-350/30 active:scale-[0.98] cursor-pointer text-left shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-500 group-hover:text-white">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="text-[12px] font-black text-slate-800">Manual de Usuario</p>
                <p className="text-[10px] text-slate-400 font-medium">Guías de uso del sistema</p>
              </div>
              <ChevronRight size={14} className="absolute right-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-500" />
            </button>
          </div>

          {/* Footer */}
          <div className="text-center opacity-50">
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
