import { useState, useEffect } from 'react'
import { 
  Smartphone, ShieldCheck, ArrowLeft, LogOut, 
  Zap, CheckCircle2, QrCode, Camera, Wifi, GraduationCap
} from 'lucide-react'
import { HeaderGlobal } from '../componentes/HeaderGlobal'

const ACCENT = '#0EA5E9'
const BG     = '#F8FAFC'

export function ControlIngreso({ onVolver, onCerrarSesion }) {
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
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      <HeaderGlobal 
        titulo="Control de Ingreso"
        subtitulo="SiGIC Mobile"
        onVolver={onVolver}
        onCerrarSesion={onCerrarSesion}
      />

      {/* Contenido Central */}
      <main className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Columna Texto: Enfoque Alumnos */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  Control de Acceso <br />
                  <span className="text-sky-500">desde el Celular</span>
                </h1>
                <p className="text-lg font-medium text-slate-400 leading-relaxed max-w-md">
                  Estamos desarrollando una **App nativa** para que el staff pueda controlar el ingreso en la puerta de la colación usando solo el celular.
                </p>
            </div>

            <div className="grid gap-4 max-w-md">
              <div className="flex items-start gap-4 p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
                 <div className="h-10 w-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                    <Zap size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Más agilidad</h4>
                    <p className="text-[12px] text-slate-400">Escaneá el QR de la credencial y el sistema te confirma el asiento al instante.</p>
                 </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
                 <div className="h-10 w-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                    <Smartphone size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Sin cables ni PCs</h4>
                    <p className="text-[12px] text-slate-400">Diseñado para funcionar en la puerta del auditorio, lejos de un escritorio.</p>
                 </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                 "Desarrollado como proyecto final por alumnos de la carrera. <br /> 
                 Próximamente disponible para descarga directa (APK)."
               </p>
            </div>
          </div>

          {/* Columna Mockup: Celular Realista */}
          <div className="relative flex justify-center animate-in fade-in slide-in-from-right-8 duration-1000">
            {/* Decoración sutil */}
            <div className="absolute inset-0 bg-sky-500/5 rounded-full blur-[100px] -m-20"></div>
            
            <div className="relative w-72 h-[580px] bg-slate-900 rounded-[50px] border-[10px] border-slate-800 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
               {/* Pantalla */}
               <div className="absolute inset-0 bg-white flex flex-col pt-10">
                  
                  {/* Mockup Header */}
                  <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
                     <span className="text-[10px] font-black uppercase text-sky-500">SiGIC ITB</span>
                     <Wifi size={14} className="text-slate-300" />
                  </div>

                  {/* Mockup Content */}
                  <div className="flex-1 p-6 flex flex-col">
                     {vistaMockup === 'home' && (
                        <div className="flex-1 flex flex-col gap-6 animate-in fade-in">
                           <div className="space-y-1">
                              <h3 className="text-xl font-black text-slate-900">Hola, Staff</h3>
                              <p className="text-[11px] font-bold text-slate-400 uppercase">Módulo de Ingreso</p>
                           </div>
                           
                           <div onClick={() => setVistaMockup('scan')} className="flex-1 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-100 transition-colors">
                              <div className="h-16 w-16 rounded-full bg-white shadow-lg flex items-center justify-center text-sky-500">
                                 <Camera size={32} />
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tocar para Escanear</span>
                           </div>

                           <div className="p-5 rounded-2xl bg-sky-500 text-white text-center">
                              <p className="text-[10px] font-black uppercase opacity-60">Total Ingresados</p>
                              <p className="text-2xl font-black">142</p>
                           </div>
                        </div>
                     )}

                     {vistaMockup === 'scan' && (
                        <div className="flex-1 flex flex-col gap-4 animate-in fade-in">
                           <h3 className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Escaneando...</h3>
                           <div className="flex-1 rounded-[32px] bg-slate-900 relative overflow-hidden flex items-center justify-center">
                              <div className="absolute inset-x-0 h-0.5 bg-sky-400 shadow-[0_0_10px_#0EA5E9] animate-scan-line"></div>
                              <QrCode size={60} className="text-white/10" />
                           </div>
                        </div>
                     )}

                     {vistaMockup === 'success' && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center animate-in zoom-in-95">
                           <div className="h-24 w-24 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-50">
                              <CheckCircle2 size={48} />
                           </div>
                           <div>
                              <h3 className="text-lg font-black text-slate-900 leading-tight">Ingreso OK</h3>
                              <p className="text-[11px] font-bold text-slate-400 uppercase">Fila B • Asiento 12</p>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Home Bar */}
                  <div className="h-10 flex items-center justify-center">
                     <div className="w-24 h-1.5 bg-slate-100 rounded-full"></div>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Humilde */}
      <footer className="p-8 text-center border-t border-slate-50">
         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
           Diseñado y Programado por Alumnos • ITB Beltrán • 2026
         </p>
      </footer>

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
