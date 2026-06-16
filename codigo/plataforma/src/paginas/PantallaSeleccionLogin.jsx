import { useState } from 'react'
import { Lock, Fingerprint, ChevronRight, Users, GraduationCap, BookOpen, ShieldAlert } from 'lucide-react'

export function PantallaSeleccionLogin({ onSeleccionarAdmin, onSeleccionarEgresado, onSeleccionarManual }) {
  const [escaneando, setEscaneando] = useState(false)
  const [revelado, setRevelado] = useState(false)

  function iniciarEscaneo() {
    if (escaneando || revelado) return
    setEscaneando(true)
    // Simular escaneo biométrico y revelado
    setTimeout(() => {
      setEscaneando(false)
      setRevelado(true)
    }, 1800)
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b19] select-none">
      {/* Fondo Animado con Gradiente y Orbes */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />
      
      {/* Orbes de luz de fondo */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Grilla de puntos tecnológica */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '25px 25px',
        }}
      />

      {/* Tarjeta de Acceso Glassmorphism */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/40 p-8 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.6)] text-center transition-all duration-500">
        
        {/* Línea de escaneo láser (activa durante escaneando) */}
        {escaneando && (
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-laser" />
        )}

        {/* Sección del Logo y Branding */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-5 flex h-32 w-32 items-center justify-center">
            {/* Anillos de energía decorativos */}
            <div className={`absolute inset-0 rounded-full border border-cyan-500/20 ${escaneando ? 'animate-spin-fast' : 'animate-spin-slow'}`} />
            <div className={`absolute inset-2 rounded-full border border-dashed border-indigo-500/20 ${escaneando ? 'animate-spin-reverse-fast' : 'animate-spin-reverse-slow'}`} />
            <div className="absolute inset-4 rounded-full bg-cyan-500/5 blur-md" />
            
            {/* Logo de SIGIC */}
            <img
              src="/logo-oficial.png"
              alt="SiGIC"
              className={`h-20 w-auto object-contain relative z-10 transition-all duration-300 ${
                escaneando ? 'scale-110 filter drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]' : 'logo-flotar'
              }`}
            />
          </div>

          <h1 className="text-3xl font-black tracking-[0.1em] text-white font-sans drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
            SiGIC
          </h1>
          <div className="mt-2 h-[2px] w-12 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/80">
            {escaneando ? 'Verificando dispositivo...' : revelado ? 'Identidad validada' : 'Acceso seguro en la nube'}
          </p>
        </div>

        {/* CONTENIDO INTERACTIVO */}
        <div className="min-h-[180px] flex flex-col justify-center">
          {!revelado ? (
            /* Vista 1: Camuflada (Lockscreen / Biométrico) */
            <div className="space-y-6 animate-fade-in">
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Esta plataforma está restringida a personal autorizado. Por favor presione a continuación para iniciar el protocolo de acceso.
              </p>

              <button
                onClick={iniciarEscaneo}
                disabled={escaneando}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 p-[1px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 disabled:opacity-80"
              >
                <div className="relative flex items-center justify-center gap-3 rounded-2xl bg-[#090e1f] px-6 py-4 transition-colors group-hover:bg-transparent">
                  {escaneando ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                      <span className="text-xs font-black uppercase tracking-wider text-cyan-400">Escaneando...</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="h-5 w-5 text-cyan-400 group-hover:text-white transition-colors" />
                      <span className="text-xs font-black uppercase tracking-wider text-white">Validar Credencial</span>
                    </>
                  )}
                </div>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
                <Lock size={10} />
                <span>Encriptación de extremo a extremo</span>
              </div>
            </div>
          ) : (
            /* Vista 2: Revelada (Botones de Acceso con Animación) */
            <div className="space-y-3.5 animate-slide-up">
              {/* Opción Admin */}
              <button
                onClick={onSeleccionarAdmin}
                className="group relative flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3.5 transition-all hover:bg-white/10 hover:border-cyan-500/30 active:scale-[0.98] cursor-pointer"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 transition-colors group-hover:bg-cyan-500 group-hover:text-white">
                  <Users size={18} />
                </div>
                <div className="text-left">
                  <p className="text-[12px] font-black text-white">Administrador</p>
                  <p className="text-[10px] text-slate-400 font-medium">Organizadores y seguridad</p>
                </div>
                <ChevronRight size={14} className="absolute right-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-cyan-400" />
              </button>

              {/* Opción Egresado */}
              <button
                onClick={onSeleccionarEgresado}
                className="group relative flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3.5 transition-all hover:bg-white/10 hover:border-indigo-500/30 active:scale-[0.98] cursor-pointer"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
                  <GraduationCap size={18} />
                </div>
                <div className="text-left">
                  <p className="text-[12px] font-black text-white">Graduado</p>
                  <p className="text-[10px] text-slate-400 font-medium">Ingreso de invitados y datos</p>
                </div>
                <ChevronRight size={14} className="absolute right-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-indigo-400" />
              </button>

              {/* Opción Manual */}
              <button
                onClick={onSeleccionarManual}
                className="group relative flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3.5 transition-all hover:bg-white/10 hover:border-slate-500/30 active:scale-[0.98] cursor-pointer"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10 text-slate-400 transition-colors group-hover:bg-slate-500 group-hover:text-white">
                  <BookOpen size={18} />
                </div>
                <div className="text-left">
                  <p className="text-[12px] font-black text-white">Manual de Usuario</p>
                  <p className="text-[10px] text-slate-400 font-medium">Guías de uso del sistema</p>
                </div>
                <ChevronRight size={14} className="absolute right-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-slate-350" />
              </button>
            </div>
          )}
        </div>

        {/* Footer de la tarjeta */}
        <div className="mt-8 border-t border-white/5 pt-4 text-center">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-600">
            Instituto Tecnológico Beltrán · SiGIC
          </p>
        </div>
      </div>

      {/* Estilos CSS Inline para las animaciones y estética */}
      <style>{`
        .bg-radial-gradient {
          background: radial-gradient(circle at center, #0f1c3f 0%, #070b19 100%);
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(2deg);
          }
        }
        
        .logo-flotar {
          animation: float 4s ease-in-out infinite;
        }

        @keyframes laser {
          0% {
            top: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        
        .animate-laser {
          animation: laser 1.8s linear infinite;
        }

        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        
        .animate-spin-fast {
          animation: spin 3s linear infinite;
        }

        .animate-spin-reverse-slow {
          animation: spin-reverse 25s linear infinite;
        }

        .animate-spin-reverse-fast {
          animation: spin-reverse 4s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-slide-up {
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </main>
  )
}
