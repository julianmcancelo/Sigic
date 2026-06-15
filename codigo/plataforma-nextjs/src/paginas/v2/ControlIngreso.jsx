import { useState, useEffect } from 'react'
import { 
  Smartphone, ShieldCheck, Zap, CheckCircle2, QrCode, Camera, Wifi, AlertTriangle, XCircle,
  Volume2, Users, WifiOff, RefreshCw, Info, Check, X
} from 'lucide-react'

const ACCENT = '#0EA5E9'
const DARK   = '#2A3448'

export function ControlIngreso({ onVolver, onCerrarSesion, sinHeader }) {
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
              Aplicación Oficial SiGIC
            </span>
            <h3 className="text-3xl font-black tracking-tight leading-none" style={{ color: DARK }}>
              Control de Acceso <br />
              <span style={{ color: ACCENT }}>desde el Celular</span>
            </h3>
            <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-md">
              La aplicación móvil de portería de **SiGIC** está completamente integrada y operativa. Permite al personal de control escanear credenciales e invitaciones de forma ágil desde cualquier dispositivo Android o iOS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="h-9 w-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                <Zap size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wide text-slate-700">Acreditación Instantánea</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Escaneo de códigos QR físicos o desde pantallas celulares con validación en menos de 1 segundo.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wide text-slate-700">Modo Offline Autónomo</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Sincronización local en segundo plano para seguir controlando los accesos en áreas sin cobertura de internet.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <Volume2 size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wide text-slate-700">Respuestas Auditivas</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Alertas sonoras y visuales inmediatas para distinguir accesos correctos, duplicados o inasistencias.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <Users size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wide text-slate-700">Aforo en Tiempo Real</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Cada ingreso aprobado se sincroniza al instante, actualizando la ocupación del anfiteatro en la base central.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 max-w-md">
            <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              "Ecosistema SiGIC Mobile · Desarrollado y Homologado para <br />
              dispositivos corporativos y personales de portería (PWA / APK)."
            </p>
          </div>
        </div>

        {/* Columna Mockup: Celular Realista */}
        <div className="lg:col-span-5 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-sky-500/5 rounded-full blur-[80px] -m-10 pointer-events-none" />
            
            <div className="relative w-64 h-[460px] bg-slate-900 rounded-[36px] border-[8px] border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between select-none">
              {/* Notch superior simulado */}
              <div className="absolute top-0 inset-x-0 h-4 bg-slate-900 z-30 flex justify-center items-start">
                <div className="w-20 h-3 bg-slate-900 rounded-b-lg flex items-center justify-around px-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                  <div className="w-6 h-1 bg-slate-800 rounded-full"></div>
                </div>
              </div>

              {/* Pantalla */}
              <div className="flex-1 bg-white flex flex-col pt-5 overflow-hidden">
                
                {/* Mockup Header */}
                <div className="px-4 py-1.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                  <span className="text-[8.5px] font-black uppercase text-sky-600 tracking-wider">SiGIC Entry</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[7.5px] font-bold text-slate-400">09:41</span>
                    <Wifi size={10} className="text-sky-500" />
                  </div>
                </div>

                {/* Mockup Content */}
                <div className="flex-1 p-5 flex flex-col justify-between min-h-0 bg-slate-50/20">
                  
                  {/* ESTADO: HOME */}
                  {vistaMockup === 'home' && (
                    <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-base font-black text-slate-900">Hola, Staff</h4>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Módulo de Control</p>
                      </div>

                      <div className="py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-[8px] font-black text-emerald-800 uppercase leading-none">Modo Offline Activo</p>
                          <p className="text-[7.5px] text-emerald-600/90 mt-0.5 font-medium leading-none">Base sincronizada (150 egresados)</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => desencadenarEscaneo('success')} 
                        className="flex-1 my-3 rounded-2xl bg-white border border-dashed border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 hover:border-sky-300 transition duration-200 group"
                      >
                        <div className="h-10 w-10 rounded-full bg-sky-50 group-hover:bg-sky-100 flex items-center justify-center text-sky-500 transition duration-200">
                          <Camera size={18} />
                        </div>
                        <span className="text-[7.5px] font-black text-slate-400 group-hover:text-sky-500 uppercase tracking-widest transition duration-200">Tocar para Escanear</span>
                      </button>

                      <div className="p-3 rounded-xl bg-sky-500 text-white text-center shadow-sm relative overflow-hidden">
                        <div className="absolute right-0 top-0 opacity-10 translate-x-2 -translate-y-2">
                          <Users size={48} />
                        </div>
                        <p className="text-[7.5px] font-bold uppercase tracking-wider opacity-75">Acreditados en Sala</p>
                        <p className="text-base font-black leading-none mt-1">{contadorIngresos} <span className="text-[10px] font-normal opacity-70">/ 150</span></p>
                      </div>
                    </div>
                  )}

                  {/* ESTADO: SCANNING */}
                  {vistaMockup === 'scan' && (
                    <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
                      <div className="space-y-1 text-center">
                        <h4 className="text-[9.5px] font-black text-slate-600 uppercase tracking-widest animate-pulse">Escaneando...</h4>
                        <p className="text-[7.5px] text-slate-400 font-semibold uppercase">Apunte al código QR de la credencial</p>
                      </div>
                      <div className="flex-1 my-3 rounded-2xl bg-slate-950 relative overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                        <div className="absolute inset-x-0 h-0.5 bg-sky-400 shadow-[0_0_8px_#0EA5E9] animate-scan-line"></div>
                        <QrCode size={40} className="text-white/10" />
                      </div>
                      <div className="text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[7.5px] font-bold uppercase">Luz de cámara encendida</span>
                      </div>
                    </div>
                  )}

                  {/* ESTADO: SUCCESS (Verde) */}
                  {vistaMockup === 'success' && (
                    <div className="flex-1 flex flex-col justify-between text-center animate-in zoom-in-95 duration-200">
                      <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-md mx-auto mt-2">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="my-3 space-y-2">
                        <div>
                          <h4 className="text-xs font-black text-emerald-600 uppercase tracking-wider">Acceso Autorizado</h4>
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[7.5px] text-emerald-700 font-bold uppercase mt-1">
                            <Volume2 size={8} /> Sonido Emitido
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-left space-y-1">
                          <p className="text-[7.5px] font-bold text-slate-400 uppercase leading-none">Graduado</p>
                          <p className="text-[10px] font-black text-slate-800 leading-none">Julian Manuel Cancelo</p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                            <span className="text-[7.5px] font-bold text-sky-600 uppercase">TSAS</span>
                            <span className="text-[8px] font-black text-slate-700">Fila B · Asiento 12</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setVistaMockup('home')}
                        className="w-full py-1.5 rounded-lg bg-slate-900 text-white text-[8px] font-black uppercase tracking-wider hover:bg-slate-800 transition"
                      >
                        Continuar
                      </button>
                    </div>
                  )}

                  {/* ESTADO: DUPLICADO (Rojo) */}
                  {vistaMockup === 'error_duplicado' && (
                    <div className="flex-1 flex flex-col justify-between text-center animate-in zoom-in-95 duration-200">
                      <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shadow-md mx-auto mt-2">
                        <AlertTriangle size={24} />
                      </div>
                      <div className="my-3 space-y-2">
                        <div>
                          <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider">Acceso Denegado</h4>
                          <span className="inline-block px-1.5 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[7px] text-rose-700 font-bold uppercase mt-1">
                            Error Crítico
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-50/30 border border-rose-100/50 text-left space-y-1">
                          <p className="text-[7.5px] font-bold text-rose-400 uppercase leading-none">Código Duplicado</p>
                          <p className="text-[9.5px] font-black text-slate-800">Invitación ya escaneada</p>
                          <p className="text-[7.5px] text-slate-500 font-semibold leading-relaxed pt-1 border-t border-slate-100/50 mt-1">
                            Ingreso previo: hace 4 min en Puerta A.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setVistaMockup('home')}
                        className="w-full py-1.5 rounded-lg bg-slate-900 text-white text-[8px] font-black uppercase tracking-wider hover:bg-slate-800 transition"
                      >
                        Volver
                      </button>
                    </div>
                  )}

                  {/* ESTADO: RECHAZADO (Rojo) */}
                  {vistaMockup === 'error_rechazado' && (
                    <div className="flex-1 flex flex-col justify-between text-center animate-in zoom-in-95 duration-200">
                      <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shadow-md mx-auto mt-2">
                        <XCircle size={24} />
                      </div>
                      <div className="my-3 space-y-2">
                        <div>
                          <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider">Acceso Denegado</h4>
                          <span className="inline-block px-1.5 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[7px] text-rose-700 font-bold uppercase mt-1">
                            Invitado Ausente
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-50/30 border border-rose-100/50 text-left space-y-1">
                          <p className="text-[7.5px] font-bold text-rose-400 uppercase leading-none">Inasistencia</p>
                          <p className="text-[9.5px] font-black text-slate-800">Confirmación Rechazada</p>
                          <p className="text-[7.5px] text-slate-500 font-semibold leading-relaxed pt-1 border-t border-slate-100/50 mt-1">
                            El egresado declaró previamente que no asistirá a la colación.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setVistaMockup('home')}
                        className="w-full py-1.5 rounded-lg bg-slate-900 text-white text-[8px] font-black uppercase tracking-wider hover:bg-slate-800 transition"
                      >
                        Volver
                      </button>
                    </div>
                  )}

                  {/* ESTADO: ACCESIBILIDAD (Azul/Amarillo) */}
                  {vistaMockup === 'accessibility' && (
                    <div className="flex-1 flex flex-col justify-between text-center animate-in zoom-in-95 duration-200">
                      <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shadow-md mx-auto mt-2">
                        <Info size={24} />
                      </div>
                      <div className="my-3 space-y-2">
                        <div>
                          <h4 className="text-xs font-black text-blue-600 uppercase tracking-wider">Acceso Especial</h4>
                          <span className="inline-block px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[7px] text-amber-700 font-bold uppercase mt-1">
                            Accesibilidad
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-50/30 border border-blue-100/50 text-left space-y-1">
                          <p className="text-[7.5px] font-bold text-blue-400 uppercase leading-none">Atención Especial</p>
                          <p className="text-[9.5px] font-black text-slate-800 leading-none">Movilidad Reducida</p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100/50 mt-1">
                            <span className="text-[7.5px] font-bold text-amber-600 uppercase">Rampa</span>
                            <span className="text-[8px] font-black text-slate-700">Fila A · Asiento 1</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setVistaMockup('home')}
                        className="w-full py-1.5 rounded-lg bg-slate-900 text-white text-[8px] font-black uppercase tracking-wider hover:bg-slate-800 transition"
                      >
                        Continuar
                      </button>
                    </div>
                  )}

                </div>

                {/* Home Bar */}
                <div className="h-4 flex items-center justify-center border-t border-slate-100 bg-slate-50/20">
                  <div className="w-16 h-1 bg-slate-200 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de control de simulación */}
          <div className="w-full max-w-[280px] space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">
              Consola de Simulación App
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                onClick={() => setVistaMockup('home')} 
                className={`py-1 px-2 text-[8px] font-bold uppercase rounded-lg border transition ${
                  vistaMockup === 'home' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Pantalla Inicio
              </button>
              <button 
                onClick={() => desencadenarEscaneo('success')}
                disabled={vistaMockup === 'scan'}
                className="py-1 px-2 text-[8px] font-bold uppercase rounded-lg bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 disabled:opacity-50 transition"
              >
                Escanear Exito
              </button>
              <button 
                onClick={() => desencadenarEscaneo('error_duplicado')}
                disabled={vistaMockup === 'scan'}
                className="py-1 px-2 text-[8px] font-bold uppercase rounded-lg bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 disabled:opacity-50 transition"
              >
                Simular Duplicado
              </button>
              <button 
                onClick={() => desencadenarEscaneo('error_rechazado')}
                disabled={vistaMockup === 'scan'}
                className="py-1 px-2 text-[8px] font-bold uppercase rounded-lg bg-white border border-slate-200 text-amber-600 hover:bg-amber-50 hover:border-amber-200 disabled:opacity-50 transition"
              >
                Simular Rechazo
              </button>
            </div>
            <button 
              onClick={() => desencadenarEscaneo('accessibility')}
              disabled={vistaMockup === 'scan'}
              className="w-full py-1 px-2 text-[8px] font-bold uppercase rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 disabled:opacity-50 transition"
            >
              Simular Accesibilidad
            </button>
          </div>
        </div>
      </div>

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
