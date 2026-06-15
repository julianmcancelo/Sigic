import { useState, useEffect } from 'react'
import { 
  Smartphone, ShieldCheck, ArrowLeft, LogOut, 
  Zap, CheckCircle2, QrCode, Camera, Wifi, GraduationCap,
  Volume2, Users, WifiOff, AlertTriangle, XCircle, Info
} from 'lucide-react'
import { HeaderGlobal } from '../componentes/HeaderGlobal'

const ACCENT = '#0EA5E9'
const BG     = '#F8FAFC'

export function ControlIngreso({ onVolver, onCerrarSesion }) {
  const [vistaMockup, setVistaMockup] = useState('home') 
  const [resultadoEsperado, setResultadoEsperado] = useState('success')
  const [contadorIngresos, setContadorIngresos] = useState(142)

  useEffect(() => {
    if (vistaMockup === 'scan') {
      const timer = setTimeout(() => {
        setVistaMockup(resultadoEsperado)
        if (resultadoEsperado === 'success' || resultadoEsperado === 'accessibility') {
          setContadorIngresos(prev => prev + 1)
        }
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [vistaMockup, resultadoEsperado])

  const desencadenarEscaneo = (resultado) => {
    setResultadoEsperado(resultado)
    setVistaMockup('scan')
  }

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
                <span className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-500 border border-sky-100 text-[10px] font-black uppercase tracking-widest">
                  Aplicación Oficial SiGIC
                </span>
                <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  Control de Acceso <br />
                  <span className="text-sky-500">desde el Celular</span>
                </h1>
                <p className="text-lg font-medium text-slate-400 leading-relaxed max-w-md">
                  La aplicación móvil de portería de **SiGIC** está completamente integrada y operativa. Permite al personal de control acreditar accesos de graduados e invitados de forma ágil y portable.
                </p>
            </div>

            <div className="grid gap-4 max-w-md">
              <div className="flex items-start gap-4 p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition">
                 <div className="h-10 w-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                    <Zap size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Acreditación Instantánea</h4>
                    <p className="text-[12px] text-slate-400 mt-0.5">Escaneá el código QR impreso o en pantalla y el sistema valida la identidad del graduado al instante.</p>
                 </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition">
                 <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                    <ShieldCheck size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Modo Offline Autónomo</h4>
                    <p className="text-[12px] text-slate-400 mt-0.5">Sincronización local en segundo plano que permite acreditar ingresos sin conexión a internet en la puerta.</p>
                 </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition">
                 <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                    <Volume2 size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Alertas Auditivas e Indicadores</h4>
                    <p className="text-[12px] text-slate-400 mt-0.5">Tonos y notificaciones en tiempo real para accesos correctos, duplicados o asistencia de accesibilidad.</p>
                 </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition">
                 <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                    <Users size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Monitoreo de Ocupación</h4>
                    <p className="text-[12px] text-slate-400 mt-0.5">Sincronización instantánea de ingresados que actualiza la ocupación del auditorio en el sistema central.</p>
                 </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                 "Ecosistema SiGIC Mobile · Diseñado y Homologado para <br /> 
                 dispositivos corporativos y personales de portería (PWA / APK)."
               </p>
            </div>
          </div>

          {/* Columna Mockup: Celular Realista */}
          <div className="relative flex flex-col items-center gap-4 animate-in fade-in slide-in-from-right-8 duration-1000">
            {/* Decoración sutil */}
            <div className="absolute inset-0 bg-sky-500/5 rounded-full blur-[100px] -m-20 pointer-events-none"></div>
            
            <div className="relative w-72 h-[510px] bg-slate-900 rounded-[44px] border-[10px] border-slate-800 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col justify-between select-none">
               {/* Notch superior simulado */}
               <div className="absolute top-0 inset-x-0 h-4 bg-slate-900 z-30 flex justify-center items-start">
                 <div className="w-24 h-3 bg-slate-900 rounded-b-lg flex items-center justify-around px-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                   <div className="w-8 h-1 bg-slate-800 rounded-full"></div>
                 </div>
               </div>

               {/* Pantalla */}
               <div className="flex-1 bg-white flex flex-col pt-6 overflow-hidden">
                  
                  {/* Mockup Header */}
                  <div className="px-5 py-2 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                     <span className="text-[9.5px] font-black uppercase text-sky-600 tracking-wider">SiGIC Entry</span>
                     <div className="flex items-center gap-1.5">
                       <span className="text-[8px] font-bold text-slate-400">09:41</span>
                       <Wifi size={12} className="text-sky-500" />
                     </div>
                  </div>

                  {/* Mockup Content */}
                  <div className="flex-1 p-5 flex flex-col justify-between min-h-0 bg-slate-50/20">
                     
                     {/* ESTADO: HOME */}
                     {vistaMockup === 'home' && (
                        <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
                           <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-slate-900">Hola, Staff</h3>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              </div>
                              <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Módulo de Control</p>
                           </div>

                           <div className="py-2.5 px-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-2.5">
                             <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                             <div>
                               <p className="text-[8.5px] font-black text-emerald-800 uppercase leading-none">Modo Offline Activo</p>
                               <p className="text-[8px] text-emerald-600/90 mt-0.5 font-medium leading-none">Base sincronizada (150 egresados)</p>
                             </div>
                           </div>
                           
                           <button 
                             onClick={() => desencadenarEscaneo('success')}
                             className="flex-1 my-3 rounded-3xl bg-white border border-dashed border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 hover:border-sky-300 transition duration-200 group"
                           >
                              <div className="h-12 w-12 rounded-full bg-sky-5 group-hover:bg-sky-100 flex items-center justify-center text-sky-500 transition duration-200">
                                 <Camera size={22} />
                              </div>
                              <span className="text-[8.5px] font-black text-slate-400 group-hover:text-sky-500 uppercase tracking-widest transition duration-200">Tocar para Escanear</span>
                           </button>

                           <div className="p-3.5 rounded-2xl bg-sky-500 text-white text-center shadow-sm relative overflow-hidden">
                              <div className="absolute right-0 top-0 opacity-10 translate-x-2 -translate-y-2">
                                <Users size={56} />
                              </div>
                              <p className="text-[8.5px] font-bold uppercase tracking-wider opacity-75">Acreditados en Sala</p>
                              <p className="text-lg font-black leading-none mt-1">{contadorIngresos} <span className="text-xs font-normal opacity-70">/ 150</span></p>
                           </div>
                        </div>
                     )}

                     {/* ESTADO: SCANNING */}
                     {vistaMockup === 'scan' && (
                        <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
                           <div className="space-y-1 text-center">
                              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest animate-pulse">Escaneando...</h3>
                              <p className="text-[8px] text-slate-400 font-semibold uppercase">Apunte al código QR de la credencial</p>
                           </div>
                           <div className="flex-1 my-3 rounded-3xl bg-slate-950 relative overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                              <div className="absolute inset-x-0 h-0.5 bg-sky-400 shadow-[0_0_8px_#0EA5E9] animate-scan-line"></div>
                              <QrCode size={50} className="text-white/10" />
                           </div>
                           <div className="text-center">
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[8px] font-bold uppercase">Luz de cámara encendida</span>
                           </div>
                        </div>
                     )}

                     {/* ESTADO: SUCCESS (Verde) */}
                     {vistaMockup === 'success' && (
                        <div className="flex-1 flex flex-col justify-between text-center animate-in zoom-in-95 duration-200">
                           <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-md mx-auto mt-2">
                              <CheckCircle2 size={28} />
                           </div>
                           <div className="my-3 space-y-2">
                              <div>
                                 <h4 className="text-xs font-black text-emerald-600 uppercase tracking-wider">Acceso Autorizado</h4>
                                 <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[8px] text-emerald-700 font-bold uppercase mt-1">
                                   <Volume2 size={10} /> Sonido Emitido
                                 </div>
                              </div>
                              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-1">
                                 <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Graduado</p>
                                 <p className="text-[11px] font-black text-slate-800 leading-none">Julian Manuel Cancelo</p>
                                 <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                                   <span className="text-[8px] font-bold text-sky-600 uppercase">TSAS</span>
                                   <span className="text-[9px] font-black text-slate-700">Fila B · Asiento 12</span>
                                 </div>
                              </div>
                           </div>
                           <button 
                             onClick={() => setVistaMockup('home')}
                             className="w-full py-2 rounded-xl bg-slate-900 text-white text-[8.5px] font-black uppercase tracking-wider hover:bg-slate-800 transition"
                           >
                             Continuar
                           </button>
                        </div>
                     )}

                     {/* ESTADO: DUPLICADO (Rojo) */}
                     {vistaMockup === 'error_duplicado' && (
                        <div className="flex-1 flex flex-col justify-between text-center animate-in zoom-in-95 duration-200">
                           <div className="h-14 w-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shadow-md mx-auto mt-2">
                              <AlertTriangle size={28} />
                           </div>
                           <div className="my-3 space-y-2">
                              <div>
                                 <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider">Acceso Denegado</h4>
                                 <span className="inline-block px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[7.5px] text-rose-700 font-bold uppercase mt-1">
                                   Error Crítico
                                 </span>
                              </div>
                              <div className="p-3 rounded-2xl bg-rose-50/30 border border-rose-100/50 text-left space-y-1">
                                 <p className="text-[8px] font-bold text-rose-400 uppercase leading-none">Código Duplicado</p>
                                 <p className="text-[10px] font-black text-slate-800">Invitación ya escaneada</p>
                                 <p className="text-[8px] text-slate-500 font-semibold leading-relaxed pt-1.5 border-t border-slate-100/50 mt-1.5">
                                   Ingreso previo: hace 4 min en Puerta A.
                                 </p>
                              </div>
                           </div>
                           <button 
                             onClick={() => setVistaMockup('home')}
                             className="w-full py-2 rounded-xl bg-slate-900 text-white text-[8.5px] font-black uppercase tracking-wider hover:bg-slate-800 transition"
                           >
                             Volver
                           </button>
                        </div>
                     )}

                     {/* ESTADO: RECHAZADO (Rojo) */}
                     {vistaMockup === 'error_rechazado' && (
                        <div className="flex-1 flex flex-col justify-between text-center animate-in zoom-in-95 duration-200">
                           <div className="h-14 w-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shadow-md mx-auto mt-2">
                              <XCircle size={28} />
                           </div>
                           <div className="my-3 space-y-2">
                              <div>
                                 <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider">Acceso Denegado</h4>
                                 <span className="inline-block px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[7.5px] text-rose-700 font-bold uppercase mt-1">
                                   Invitado Ausente
                                 </span>
                              </div>
                              <div className="p-3 rounded-2xl bg-rose-50/30 border border-rose-100/50 text-left space-y-1">
                                 <p className="text-[8px] font-bold text-rose-400 uppercase leading-none">Inasistencia</p>
                                 <p className="text-[10px] font-black text-slate-800">Confirmación Rechazada</p>
                                 <p className="text-[8px] text-slate-500 font-semibold leading-relaxed pt-1.5 border-t border-slate-100/50 mt-1.5">
                                   El egresado declaró previamente que no asistirá a la colación.
                                 </p>
                              </div>
                           </div>
                           <button 
                             onClick={() => setVistaMockup('home')}
                             className="w-full py-2 rounded-xl bg-slate-900 text-white text-[8.5px] font-black uppercase tracking-wider hover:bg-slate-800 transition"
                           >
                             Volver
                           </button>
                        </div>
                     )}

                     {/* ESTADO: ACCESIBILIDAD (Azul/Amarillo) */}
                     {vistaMockup === 'accessibility' && (
                        <div className="flex-1 flex flex-col justify-between text-center animate-in zoom-in-95 duration-200">
                           <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shadow-md mx-auto mt-2">
                              <Info size={28} />
                           </div>
                           <div className="my-3 space-y-2">
                              <div>
                                 <h4 className="text-xs font-black text-blue-600 uppercase tracking-wider">Acceso Especial</h4>
                                 <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[7.5px] text-amber-700 font-bold uppercase mt-1">
                                   Accesibilidad
                                 </span>
                              </div>
                              <div className="p-3 rounded-2xl bg-blue-50/30 border border-blue-100/50 text-left space-y-1">
                                 <p className="text-[8px] font-bold text-blue-400 uppercase leading-none">Atención Especial</p>
                                 <p className="text-[10px] font-black text-slate-800 leading-none font-black">Movilidad Reducida</p>
                                 <div className="flex items-center justify-between pt-1 border-t border-slate-100/50 mt-1">
                                   <span className="text-[8px] font-bold text-amber-600 uppercase">Rampa</span>
                                   <span className="text-[9px] font-black text-slate-700">Fila A · Asiento 1</span>
                                 </div>
                              </div>
                           </div>
                           <button 
                             onClick={() => setVistaMockup('home')}
                             className="w-full py-2 rounded-xl bg-slate-900 text-white text-[8.5px] font-black uppercase tracking-wider hover:bg-slate-800 transition"
                           >
                             Continuar
                           </button>
                        </div>
                     )}

                  </div>

                  {/* Home Bar */}
                  <div className="h-4 flex items-center justify-center border-t border-slate-100 bg-slate-50/20">
                     <div className="w-20 h-1 bg-slate-200 rounded-full"></div>
                  </div>
               </div>
            </div>

            {/* Panel de control de simulación */}
            <div className="w-full max-w-[288px] space-y-1.5 bg-slate-50 p-3.5 rounded-[24px] border border-slate-100">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">
                Consola de Simulación App
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  onClick={() => setVistaMockup('home')} 
                  className={`py-1.5 px-2 text-[8px] font-bold uppercase rounded-lg border transition ${
                    vistaMockup === 'home' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Pantalla Inicio
                </button>
                <button 
                  onClick={() => desencadenarEscaneo('success')}
                  disabled={vistaMockup === 'scan'}
                  className="py-1.5 px-2 text-[8px] font-bold uppercase rounded-lg bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 disabled:opacity-50 transition"
                >
                  Escanear Exito
                </button>
                <button 
                  onClick={() => desencadenarEscaneo('error_duplicado')}
                  disabled={vistaMockup === 'scan'}
                  className="py-1.5 px-2 text-[8px] font-bold uppercase rounded-lg bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 disabled:opacity-50 transition"
                >
                  Simular Duplicado
                </button>
                <button 
                  onClick={() => desencadenarEscaneo('error_rechazado')}
                  disabled={vistaMockup === 'scan'}
                  className="py-1.5 px-2 text-[8px] font-bold uppercase rounded-lg bg-white border border-slate-200 text-amber-600 hover:bg-amber-50 hover:border-amber-200 disabled:opacity-50 transition"
                >
                  Simular Rechazo
                </button>
              </div>
              <button 
                onClick={() => desencadenarEscaneo('accessibility')}
                disabled={vistaMockup === 'scan'}
                className="w-full py-1.5 px-2 text-[8px] font-bold uppercase rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 disabled:opacity-50 transition"
              >
                Simular Accesibilidad
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Humilde */}
      <footer className="p-8 text-center border-t border-slate-100 bg-white">
         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
           Ecosistema SiGIC • ITB Beltrán • 2026
         </p>
      </footer>

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .animate-scan-line {
          animation: scan 1.2s ease-in-out infinite alternate;
          position: absolute;
          width: 100%;
        }
      `}</style>
    </div>
  )
}
