import { useState, useEffect } from 'react'
import { 
  Smartphone, ShieldCheck, Zap, CheckCircle2, QrCode, Camera, Wifi, AlertTriangle, XCircle
} from 'lucide-react'

const ACCENT = '#0EA5E9'
const DARK   = '#2A3448'

export function ControlIngreso({ onVolver, onCerrarSesion, sinHeader }) {
  const [vistaMockup, setVistaMockup] = useState('home') 

  useEffect(() => {
    if (vistaMockup === 'scan') {
      const timer = setTimeout(() => setVistaMockup('success'), 1500)
      return () => clearTimeout(timer)
    }
    if (vistaMockup === 'success') {
      const timer = setTimeout(() => setVistaMockup('home'), 2500)
      return () => clearTimeout(timer)
    }
  }, [vistaMockup])

  return (
    <div className="font-sans">
      {/* HEADER INTEGRADO PRO */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: DARK }}>Control de Acreditación</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acreditación Inteligente & Acceso en Puerta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Columna Texto: Enfoque Alumnos */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <span className="inline-block px-2.5 py-1 rounded-full bg-sky-50 text-[#0ea5e9] border border-sky-100 text-[8.5px] font-black uppercase tracking-widest">
              Proyecto Integrador ITB
            </span>
            <h3 className="text-2xl font-black tracking-tight leading-tight" style={{ color: DARK }}>
              Control de Acceso <br />
              <span style={{ color: ACCENT }}>desde el Celular</span>
            </h3>
            <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-md">
              Estamos desarrollando una aplicación móvil nativa para que el staff de portería pueda acreditar los ingresos escaneando las credenciales QR directamente desde la entrada del salón.
            </p>
          </div>

          <div className="grid gap-4 max-w-md">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow transition">
              <div className="h-9 w-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                <Zap size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wide" style={{ color: DARK }}>Agilidad en Puerta</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Escaneo instantáneo de códigos QR con respuesta sonora y visual del aforo asignado.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow transition">
              <div className="h-9 w-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                <Smartphone size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wide" style={{ color: DARK }}>Sin Infraestructura Compleja</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Olvidate de cables, computadoras o impresoras en la entrada. El personal gestiona todo de forma portátil.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 max-w-md">
            <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              "Desarrollado como proyecto académico de prácticas profesionales. <br /> 
              Próximamente disponible para descarga directa (APK)."
            </p>
          </div>
        </div>

        {/* Columna Mockup: Celular Realista */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="absolute inset-0 bg-sky-500/5 rounded-full blur-[80px] -m-10 pointer-events-none" />
          
          <div className="relative w-64 h-[460px] bg-slate-900 rounded-[36px] border-[8px] border-slate-800 shadow-lg overflow-hidden flex flex-col justify-between select-none">
            {/* Pantalla */}
            <div className="flex-1 bg-white flex flex-col pt-6 overflow-hidden">
              
              {/* Mockup Header */}
              <div className="px-4 py-2 flex items-center justify-between border-b border-slate-50">
                <span className="text-[9px] font-black uppercase text-sky-500 tracking-wider">SiGIC ITB</span>
                <Wifi size={12} className="text-slate-300" />
              </div>

              {/* Mockup Content */}
              <div className="flex-1 p-5 flex flex-col justify-between min-h-0">
                {vistaMockup === 'home' && (
                  <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-slate-900">Hola, Staff</h4>
                      <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Módulo de Entrada</p>
                    </div>
                    
                    <button 
                      onClick={() => setVistaMockup('scan')} 
                      className="flex-1 my-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-100 transition"
                    >
                      <div className="h-12 w-12 rounded-full bg-white shadow-md flex items-center justify-center text-sky-500">
                        <Camera size={22} />
                      </div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tocar para Escanear</span>
                    </button>

                    <div className="p-3.5 rounded-xl bg-sky-500 text-white text-center shadow-sm">
                      <p className="text-[8px] font-black uppercase opacity-75">Acreditados en Sala</p>
                      <p className="text-lg font-black">142</p>
                    </div>
                  </div>
                )}

                {vistaMockup === 'scan' && (
                  <div className="flex-1 flex flex-col gap-3 animate-in fade-in duration-200">
                    <h4 className="text-center text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Escaneando...</h4>
                    <div className="flex-1 rounded-2xl bg-slate-950 relative overflow-hidden flex items-center justify-center border border-slate-800">
                      <div className="absolute inset-x-0 h-0.5 bg-sky-400 shadow-[0_0_8px_#0EA5E9] animate-scan-line"></div>
                      <QrCode size={40} className="text-white/10" />
                    </div>
                  </div>
                )}

                {vistaMockup === 'success' && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center animate-in zoom-in-95 duration-200">
                    <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-md">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight">Acceso Permitido</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Fila B · Asiento 12</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Home Bar */}
              <div className="h-6 flex items-center justify-center">
                <div className="w-16 h-1 bg-slate-100 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .animate-scan-line {
          animation: scan 1.5s ease-in-out infinite alternate;
          position: absolute;
          width: 100%;
        }
      `}</style>
    </div>
  )
}
