import { useState } from 'react'
import { Users, GraduationCap, BookOpen, ChevronRight } from 'lucide-react'

export function PantallaSeleccionLogin({ onSeleccionarAdmin, onSeleccionarEgresado, onSeleccionarManual }) {
  const [clickCount, setClickCount] = useState(0)
  const [cargandoBackdoor, setCargandoBackdoor] = useState(false)
  const [faseTexto, setFaseTexto] = useState('Cargando portal...')
  const [revelado, setRevelado] = useState(false)

  function manejarClickLogo() {
    if (revelado || cargandoBackdoor) return
    const nuevoConteo = clickCount + 1
    if (nuevoConteo >= 5) {
      setCargandoBackdoor(true)
      
      // Secuencia de estados de texto limpios y profesionales
      setTimeout(() => setFaseTexto('Verificando credenciales...'), 600)
      setTimeout(() => setFaseTexto('Cargando accesos...'), 1300)
      
      // Revelado de las opciones
      setTimeout(() => {
        setCargandoBackdoor(false)
        setRevelado(true)
      }, 2000)
    } else {
      setClickCount(nuevoConteo)
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f4f6fa] select-none text-slate-800 font-sans">
      {/* Fondo con gradiente claro y orbes difusos */}
      <div className="absolute inset-0 pointer-events-none bg-radial-light" />

      {/* Orbes de luz decorativos de fondo con muy baja opacidad */}
      <div className={`absolute top-1/3 left-1/4 h-[350px] w-[350px] rounded-full blur-[100px] transition-all duration-1000 ${
        cargandoBackdoor ? 'bg-cyan-400/20 scale-110' : 'bg-cyan-400/10'
      } animate-pulse`} />
      <div className={`absolute bottom-1/3 right-1/4 h-[350px] w-[350px] rounded-full blur-[100px] transition-all duration-1000 ${
        cargandoBackdoor ? 'bg-indigo-400/20 scale-110' : 'bg-indigo-400/10'
      } animate-pulse`} style={{ animationDelay: '2s' }} />

      {/* Grilla sutil en color oscuro de baja opacidad */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, #000000 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Contenedor Principal (Tarjeta Glassmorphism Clara) */}
      <div className={`relative z-10 flex flex-col items-center max-w-sm w-full px-8 py-10 text-center bg-white/70 border rounded-[32px] backdrop-blur-xl transition-all duration-550 ${
        cargandoBackdoor 
          ? 'border-cyan-500/30 shadow-[0_20px_50px_rgba(6,182,212,0.08)] scale-[1.02]' 
          : 'border-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.05)]'
      }`}>
        
        {/* Ondas expansivas de energía sutiles */}
        {cargandoBackdoor && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-[32px]">
            <div className="anillo-expand" style={{ animationDelay: '0s' }} />
            <div className="anillo-expand" style={{ animationDelay: '0.4s' }} />
            <div className="anillo-expand" style={{ animationDelay: '0.8s' }} />
          </div>
        )}

        {/* Logo de SIGIC interactivo */}
        <div 
          onClick={manejarClickLogo}
          className={`relative mb-6 flex h-36 w-36 items-center justify-center cursor-pointer active:scale-95 transition-all duration-500 ${
            cargandoBackdoor ? 'scale-110 rotate-[360deg]' : ''
          }`}
          title="SiGIC"
        >
          {/* Anillos decorativos */}
          <div className={`absolute inset-0 rounded-full border border-cyan-500/10 pointer-events-none transition-all ${
            cargandoBackdoor ? 'animate-spin-fast border-cyan-500/30' : 'animate-spin-slow'
          }`} />
          <div className={`absolute inset-3 rounded-full border border-dashed border-indigo-500/10 pointer-events-none transition-all ${
            cargandoBackdoor ? 'animate-spin-reverse-fast border-indigo-500/30' : 'animate-spin-reverse'
          }`} />
          <div className="absolute inset-6 rounded-full bg-cyan-500/5 blur-xl pointer-events-none" />
          
          <img
            src="/logo-oficial.png"
            alt="SiGIC"
            className={`h-20 w-auto object-contain relative z-10 transition-all duration-500 ${
              cargandoBackdoor 
                ? 'filter drop-shadow-[0_4px_12px_rgba(6,182,212,0.3)]' 
                : 'logo-flotar filter drop-shadow-[0_8px_16px_rgba(14,165,233,0.1)]'
            }`}
          />
        </div>

        {/* Branding Principal / Consola de carga */}
        <div className="space-y-2.5 w-full min-h-[90px] flex flex-col justify-center">
          {cargandoBackdoor ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-cyan-600">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Acceso Seguro</span>
              </div>
              <p className="text-[13px] font-semibold text-slate-650 tracking-wide transition-all duration-300">
                {faseTexto}
              </p>
              <div className="w-40 mx-auto bg-slate-100 h-1 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full w-full animate-progress-bar" />
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-black tracking-[0.12em] text-[#1e293b]">
                SiGIC
              </h1>
              <div className="mx-auto h-[2px] w-12 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
              <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed mx-auto">
                Sistema de Gestión de Ceremonias de Colación
              </p>
            </>
          )}
        </div>

        {/* Opciones de Login (Ocultas por defecto, se revelan al hacer 5 clicks en el logo) */}
        {revelado && (
          <div className="mt-8 w-full space-y-3 animate-fade-slide-up bg-white/90 border border-slate-100 p-4 rounded-3xl shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 mb-2">
              Panel de Autenticación Habilitado
            </p>
            
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
        )}

        {/* Footer */}
        <div className="mt-10 text-center opacity-50">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Instituto Tecnológico Beltrán
          </p>
        </div>
      </div>

      {/* Estilos CSS Inline */}
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

        .animate-spin-fast {
          animation: spin 1.2s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 35s linear infinite;
        }

        .animate-spin-reverse-fast {
          animation: spin-reverse 1.5s linear infinite;
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
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-slide-up {
          animation: fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes pulseExpand {
          0% { transform: scale(0.6); opacity: 0.6; }
          100% { transform: scale(2.4); opacity: 0; }
        }

        .anillo-expand {
          position: absolute;
          border: 2px solid #06b6d4;
          border-radius: 50%;
          width: 120px;
          height: 120px;
          opacity: 0;
          animation: pulseExpand 1.6s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
        }

        @keyframes progressBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0%); }
        }

        .animate-progress-bar {
          animation: progressBar 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </main>
  )
}
