import { useState, useEffect } from 'react'

/**
 * PantallaCargaInicial: Pantalla de carga inicial premium, limpia y realista para SiGIC.
 * Presenta un cargador horizontal progresivo (0-99%), mensajes de estado reales y profesionales,
 * el logo oficial y el enlace oficial a sigic.com.ar.
 */
export function PantallaCargaInicial() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          // Ralentizar al llegar al final para simular espera de respuesta real
          return prev + (prev < 99 ? 1 : 0)
        }
        // Incrementos aleatorios suaves
        const increment = Math.floor(Math.random() * 8) + 3
        return Math.min(prev + increment, 99)
      })
    }, 150)

    return () => clearInterval(timer)
  }, [])

  // Mensaje realista según el porcentaje de carga
  let estadoText = 'Conectando al servidor...'
  if (progress > 80) {
    estadoText = 'Iniciando SiGIC...'
  } else if (progress > 40) {
    estadoText = 'Cargando datos de sesión...'
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#f8fafc] select-none text-slate-800 font-sans">
      {/* Fondo sutil con luces suaves de fondo */}
      <div className="absolute inset-0 pointer-events-none bg-radial-light" />
      <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-400/5 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-400/5 blur-[120px] animate-pulse" style={{ animationDelay: '2.5s' }} />

      {/* Tarjeta de Carga Elegante */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-8 py-10 text-center bg-white border border-slate-100 rounded-3xl shadow-[0_15px_40px_rgba(15,23,42,0.04)] animate-fade-slide-up gap-8">
        
        {/* Contenedor del Logo Oficial */}
        <div className="relative flex items-center justify-center">
          <img 
            src="/logo-oficial.png" 
            alt="SiGIC" 
            className="h-12 w-auto object-contain filter drop-shadow-sm transition-transform hover:scale-105 duration-350" 
          />
        </div>

        {/* Textos y Barra de Progreso Horizontal */}
        <div className="w-full space-y-4">
          <div className="flex justify-between items-end text-xs font-semibold px-0.5">
            <span className="text-slate-500 tracking-wide transition-all duration-300">
              {estadoText}
            </span>
            <span className="text-slate-800 font-mono">
              {progress}%
            </span>
          </div>

          {/* Barra de progreso horizontal limpia */}
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Enlace oficial sutil al pie */}
        <div className="pt-4 border-t border-slate-100 w-full text-center space-y-1">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
            Servicio Oficial
          </p>
          <a 
            href="https://sigic.com.ar" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-block text-xs font-bold text-blue-600 hover:text-blue-700 tracking-wide hover:underline transition-colors"
          >
            sigic.com.ar
          </a>
        </div>
      </div>

      {/* Estilos locales */}
      <style>{`
        .bg-radial-light {
          background: radial-gradient(circle at center, #ffffff 0%, #f1f5f9 100%);
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-slide-up {
          animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </main>
  )
}
