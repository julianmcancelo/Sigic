import { GraduationCap } from 'lucide-react'

export function LayoutAutenticacion({ children }) {
  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0d1b2e 0%, #1a2d45 45%, #2A3448 100%)',
      }}
    >
      {/* Orbes que se mueven lento por el fondo */}
      <div className="orbe orbe-1"></div>
      <div className="orbe orbe-2"></div>
      <div className="orbe orbe-3"></div>

      {/* Grilla de puntos sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Estrellas parpadeantes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0,
              animation: `parpadeo ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}
      </div>

      {/* Línea superior decorativa */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0EA5E9] to-transparent opacity-70" />

      {/* Icono home */}
      <div className="absolute right-5 top-5 z-10">
        <button
          className="rounded-full p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
          title="Instituto Tecnológico Beltrán"
        >
          <GraduationCap size={24} />
        </button>
      </div>

      {/* Layout split */}
      <div className="relative flex min-h-screen flex-col lg:flex-row">
        {/* Panel izquierdo — branding */}
        <div className="flex flex-1 items-center justify-center px-8 py-12 lg:py-0">
          <div className="flex flex-col items-center gap-5 text-center">
            {/* Anillos giratorios detrás del logo */}
            <div className="relative">
              <div className="absolute inset-0 m-auto w-40 h-40 border border-sky-500/10 rounded-full anillo-gira"></div>
              <div className="absolute inset-0 m-auto w-52 h-52 border border-indigo-500/5 rounded-full anillo-gira-inv"></div>
              <div className="absolute inset-0 bg-sky-500 blur-[60px] opacity-15 animate-pulse rounded-full"></div>
              <img
                src="https://ibeltran.com.ar/img/logo/footer.png"
                alt="Instituto Tecnologico Beltran"
                className="h-28 w-auto object-contain drop-shadow-2xl relative z-10 logo-flotar"
              />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">
                Ceremonia de colacion 2026
              </p>
              <div className="mx-auto h-px w-10 bg-gradient-to-r from-transparent via-[#0EA5E9] to-transparent" />
              <p className="text-[13px] font-medium text-white/55">
                Panel de administracion del evento
              </p>
            </div>
          </div>
        </div>

        {/* Panel derecho — formulario */}
        <div className="flex flex-1 items-center justify-center px-4 py-10 lg:py-0">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
            {children}
          </div>
        </div>
      </div>

      <style>{`
        .orbe {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .orbe-1 {
          width: 400px; height: 400px;
          background: rgba(14, 165, 233, 0.12);
          top: -100px; left: -100px;
          animation: orbitar1 12s ease-in-out infinite;
        }
        .orbe-2 {
          width: 300px; height: 300px;
          background: rgba(99, 102, 241, 0.08);
          bottom: -50px; right: -50px;
          animation: orbitar2 15s ease-in-out infinite;
        }
        .orbe-3 {
          width: 200px; height: 200px;
          background: rgba(236, 72, 153, 0.06);
          top: 50%; left: 60%;
          animation: orbitar3 10s ease-in-out infinite;
        }
        @keyframes orbitar1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(80px, 60px) scale(1.1); }
          50% { transform: translate(40px, 120px) scale(0.9); }
          75% { transform: translate(-30px, 80px) scale(1.05); }
        }
        @keyframes orbitar2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-70px, -50px) scale(1.15); }
          66% { transform: translate(-30px, -100px) scale(0.85); }
        }
        @keyframes orbitar3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-60px, -40px); }
        }
        @keyframes parpadeo {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.7; }
        }
        .anillo-gira {
          animation: girar 20s linear infinite;
        }
        .anillo-gira-inv {
          animation: girar 25s linear infinite reverse;
        }
        @keyframes girar {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .logo-flotar {
          animation: flotar-logo 4s ease-in-out infinite;
        }
        @keyframes flotar-logo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </main>
  )
}
