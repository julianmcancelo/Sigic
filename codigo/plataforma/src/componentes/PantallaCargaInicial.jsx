import { useState, useEffect } from 'react'

/**
 * PantallaCargaInicial: Pantalla de carga inicial premium para SiGIC.
 * Presenta el logo oficial flotante, doble anillo orbital giratorio (reactor arc style),
 * mensajes de estado dinámicos que cambian periódicamente, y el enlace oficial a sigic.com.ar.
 */
export function PantallaCargaInicial() {
  const [mensajeIdx, setMensajeIdx] = useState(0)

  const mensajes = [
    'Conectando al servidor principal...',
    'Estableciendo canal de datos seguro...',
    'Sincronizando base de datos Neon PostgreSQL...',
    'Verificando certificados de seguridad...',
    'Conectando al nodo cloud sigic.com.ar...'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setMensajeIdx((prev) => (prev + 1) % mensajes.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#f4f6fa] select-none text-slate-800 font-sans">
      {/* Fondo con gradiente y orbes de luz en movimiento lento */}
      <div className="absolute inset-0 pointer-events-none bg-radial-light" />
      <div className="absolute top-1/3 left-1/4 h-[350px] w-[350px] rounded-full bg-cyan-400/10 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 h-[350px] w-[350px] rounded-full bg-indigo-400/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Línea superior decorativa */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0EA5E9] to-transparent opacity-30 z-20" />

      {/* Tarjeta de Carga Glassmorphism */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-8 py-12 text-center bg-white/70 border border-white/80 rounded-[32px] backdrop-blur-xl shadow-[0_20px_50px_rgba(15,23,42,0.05)] animate-fade-slide-up gap-8">
        
        {/* Cargador Orbital de Doble Anillo con Logo Oficial */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Anillo exterior */}
          <div 
            className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" 
            style={{ animationDuration: '0.8s' }} 
          />
          {/* Anillo interior */}
          <div 
            className="absolute inset-1.5 rounded-full border-4 border-b-indigo-500 border-t-transparent border-r-transparent border-l-transparent animate-spin" 
            style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} 
          />
          {/* Logo flotante */}
          <img 
            src="/logo-oficial.png" 
            alt="SiGIC" 
            className="h-9 w-auto object-contain animate-pulse z-10 filter drop-shadow-[0_0_8px_rgba(14,165,233,0.4)]" 
          />
        </div>

        {/* Textos de Carga */}
        <div className="space-y-2.5">
          <h1 className="text-xl font-black tracking-wider text-slate-800 uppercase">
            SiGIC
          </h1>
          <div className="mx-auto h-[1.5px] w-10 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
          
          {/* Mensaje de estado animado */}
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600 animate-pulse min-h-[16px] max-w-[280px] leading-relaxed">
            {mensajes[mensajeIdx]}
          </p>
        </div>

        {/* Footer de la Tarjeta con Enlace Oficial */}
        <div className="pt-4 border-t border-slate-100 w-full text-center space-y-1">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Nodo Servidor Oficial
          </p>
          <a 
            href="https://sigic.com.ar" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-block text-[11px] font-black text-cyan-600 hover:text-cyan-500 tracking-wider hover:underline transition-colors filter drop-shadow-[0_0_6px_rgba(14,165,233,0.3)]"
          >
            sigic.com.ar
          </a>
        </div>
      </div>

      {/* Estilos locales CSS */}
      <style>{`
        .bg-radial-light {
          background: radial-gradient(circle at center, #f8fafc 0%, #e2e8f0 100%);
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(15px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .animate-fade-slide-up {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </main>
  )
}
