import { useState } from 'react'
import { Users, GraduationCap, BookOpen, ChevronRight } from 'lucide-react'

export function PantallaSeleccionLogin({ onSeleccionarAdmin, onSeleccionarEgresado, onSeleccionarManual }) {
  const [clickCount, setClickCount] = useState(0)
  const [revelado, setRevelado] = useState(false)

  function manejarClickLogo() {
    if (revelado) return
    const nuevoConteo = clickCount + 1
    if (nuevoConteo >= 5) {
      setRevelado(true)
    } else {
      setClickCount(nuevoConteo)
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#070b19] select-none text-white font-sans">
      {/* Fondo con gradiente profundo y orbes difusos */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at center, #0f1c3f 0%, #070b19 100%)'
      }} />

      {/* Orbes de luz decorativos de fondo */}
      <div className="absolute top-1/3 left-1/4 h-[350px] w-[350px] rounded-full bg-cyan-500/5 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 h-[350px] w-[350px] rounded-full bg-indigo-500/5 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Grilla tecnológica sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Estrellas parpadeantes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${1 + Math.random() * 1.5}px`,
              height: `${1 + Math.random() * 1.5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.1,
              animation: `parpadeo ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Contenedor Principal */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center">
        
        {/* Logo de SIGIC interactivo */}
        <div 
          onClick={manejarClickLogo}
          className="relative mb-6 flex h-40 w-40 items-center justify-center cursor-pointer active:scale-95 transition-transform duration-300"
          title="SiGIC"
        >
          {/* Anillos de energía decorativos */}
          <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-spin-slow pointer-events-none" />
          <div className="absolute inset-3 rounded-full border border-dashed border-indigo-500/10 animate-spin-reverse pointer-events-none" />
          <div className="absolute inset-6 rounded-full bg-cyan-500/5 blur-xl pointer-events-none" />
          
          <img
            src="/logo-oficial.png"
            alt="SiGIC"
            className="h-24 w-auto object-contain relative z-10 logo-flotar filter drop-shadow-[0_4px_20px_rgba(14,165,233,0.15)]"
          />
        </div>

        {/* Branding Principal */}
        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-[0.15em] text-white">
            SiGIC
          </h1>
          <div className="mx-auto h-[2px] w-14 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed">
            Sistema de Gestión de Ceremonias de Colación
          </p>
        </div>

        {/* Opciones de Login (Ocultas por defecto, se revelan al hacer 5 clicks en el logo) */}
        {revelado && (
          <div className="mt-10 w-full space-y-3 animate-fade-slide-up bg-slate-950/40 border border-white/5 p-5 rounded-3xl backdrop-blur-xl shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
              Panel de Autenticación Habilitado
            </p>
            
            {/* Opción Admin */}
            <button
              onClick={onSeleccionarAdmin}
              className="group relative flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3.5 transition-all hover:bg-white/10 hover:border-cyan-500/30 active:scale-[0.98] cursor-pointer text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 transition-colors group-hover:bg-cyan-500 group-hover:text-white">
                <Users size={18} />
              </div>
              <div>
                <p className="text-[12px] font-black text-white">Administrador</p>
                <p className="text-[10px] text-slate-400 font-medium">Organizadores y seguridad</p>
              </div>
              <ChevronRight size={14} className="absolute right-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-cyan-400" />
            </button>

            {/* Opción Egresado */}
            <button
              onClick={onSeleccionarEgresado}
              className="group relative flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3.5 transition-all hover:bg-white/10 hover:border-indigo-500/30 active:scale-[0.98] cursor-pointer text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
                <GraduationCap size={18} />
              </div>
              <div>
                <p className="text-[12px] font-black text-white">Graduado</p>
                <p className="text-[10px] text-slate-400 font-medium">Ingreso de invitados y datos</p>
              </div>
              <ChevronRight size={14} className="absolute right-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-indigo-400" />
            </button>

            {/* Opción Manual */}
            <button
              onClick={onSeleccionarManual}
              className="group relative flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3.5 transition-all hover:bg-white/10 hover:border-slate-500/30 active:scale-[0.98] cursor-pointer text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10 text-slate-400 transition-colors group-hover:bg-slate-500 group-hover:text-white">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="text-[12px] font-black text-white">Manual de Usuario</p>
                <p className="text-[10px] text-slate-400 font-medium">Guías de uso del sistema</p>
              </div>
              <ChevronRight size={14} className="absolute right-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-slate-350" />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center opacity-40">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Instituto Tecnológico Beltrán
          </p>
        </div>
      </div>

      {/* Estilos CSS Inline */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(1.5deg);
          }
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

        @keyframes parpadeo {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.8; }
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-slide-up {
          animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </main>
  )
}
