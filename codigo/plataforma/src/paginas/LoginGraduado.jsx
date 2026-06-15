/**
 * LoginGraduado - Pantalla de inicio de sesión para graduados (Passwordless OTP).
 * El graduado ingresa su correo y recibe un código de 6 dígitos para acceder.
 * Versión actualizada con terminología "Graduado" en lugar de "Egresado".
 */
import { useState, useEffect } from 'react'
import { solicitarOTP, verificarOTP } from '../servicios/api'
import { LayoutAutenticacion } from '../layouts/LayoutAutenticacion'
import { CampoFormulario } from '../componentes/CampoFormulario'
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, X, Code2, Heart, Clock } from 'lucide-react'

export function LoginGraduado({ onLoginExitoso, onVolver, emailInicial = '' }) {
  const [email, setEmail] = useState(emailInicial)
  const [otp, setOtp] = useState('')
  const [paso, setPaso] = useState(1) // 1: Email, 2: Código
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  const [verEquipo, setVerEquipo] = useState(false)
  const [tiempoRestante, setTiempoRestante] = useState(600) // 10 minutos en segundos

  // Temporizador de cuenta regresiva para el OTP
  useEffect(() => {
    if (paso !== 2 || tiempoRestante <= 0) return

    const intervalo = setInterval(() => {
      setTiempoRestante((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(intervalo)
  }, [paso, tiempoRestante])

  const formatearTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60)
    const secs = segundos % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Si venimos con mail pre-cargado (vía link), solicitamos el código automáticamente
  useEffect(() => {
    if (emailInicial && paso === 1 && !cargando && !mensajeExito) {
      manejarSolicitudOTP()
    }
  }, [emailInicial])

  async function manejarSolicitudOTP(e) {
    if (e) e.preventDefault()
    if (!email.trim()) return
    setCargando(true)
    setError('')
    try {
      await solicitarOTP(email)
      setPaso(2)
      setTiempoRestante(600) // Reiniciar temporizador
      setMensajeExito(`Código enviado a ${email}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  async function manejarVerificarOTP(e) {
    if (e) e.preventDefault()
    if (otp.length !== 6) return
    setCargando(true)
    setError('')
    try {
      const data = await verificarOTP(email, otp)
      onLoginExitoso(data.usuario)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const equipo = [
    { nombre: 'Alan Alexis Alfonso',       rol: 'Desarrollo Frontend',       color: 'bg-sky-500' },
    { nombre: 'Julián Cancelo',            rol: 'Arquitectura y Backend',    color: 'bg-indigo-500' },
    { nombre: 'Sol Heilin Contreras V.',   rol: 'Diseño UX y Documentación', color: 'bg-pink-500' },
    { nombre: 'Matías Frassia',            rol: 'Testing y Base de Datos',   color: 'bg-amber-500' },
    { nombre: 'Luis Gabriel Santillán',    rol: 'Infraestructura y Deploy',  color: 'bg-emerald-500' },
  ]

  return (
    <LayoutAutenticacion>
      <div className="px-8 py-9">
        {/* Encabezado */}
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={onVolver}
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#0EA5E9] transition-colors"
          >
            <ArrowLeft size={12} /> Volver
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0EA5E9]">Acceso Graduados</span>
          </div>
        </div>

        <h1 className="mb-1 text-[1.45rem] font-bold text-[#2A3448]">
          {paso === 1 
            ? (emailInicial ? 'Hola de nuevo' : 'Hola Graduado')
            : 'Verificá tu identidad'}
        </h1>
        <p className="mb-8 text-xs leading-relaxed text-[#90A4AE]">
          {paso === 1 
            ? (emailInicial 
                ? `Solicitá un código para acceder a tu panel vinculado a ${emailInicial}.`
                : 'Ingresá tu correo institucional para recibir el código de acceso a tu panel.')
            : 'Copiá los 6 dígitos que te enviamos por correo electrónico.'}
        </p>

        {paso === 1 ? (
          error && error.includes('inasistencia') ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-6 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <AlertCircle size={24} />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm mb-2">Inasistencia Confirmada</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {error}
                </p>
                <div className="text-[10px] font-black text-slate-400 border-t border-slate-100 pt-4 uppercase tracking-wider">
                  Soporte Técnico
                </div>
                <a href="mailto:soporte@beltran.edu.ar" className="block text-[#0EA5E9] font-black text-xs mt-2 hover:underline">
                  soporte@beltran.edu.ar
                </a>
              </div>
              
              <button
                type="button"
                onClick={() => { setEmail(''); setError(''); }}
                className="w-full py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/50 transition-all active:scale-[0.98]"
              >
                Volver a intentar
              </button>
            </div>
          ) : (
            <form onSubmit={manejarSolicitudOTP} className="space-y-5">
              <CampoFormulario
                etiqueta="Correo Institucional"
                tipo="email"
                valor={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.correo@instituto.edu.ar"
                mensajeError={error}
              />

              <button
                type="submit"
                disabled={cargando || !email}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#0EA5E9] py-4 text-sm font-black text-white shadow-lg shadow-[#0EA5E9]/20 transition hover:bg-[#0288D1] active:scale-[0.98] disabled:opacity-50"
              >
                {cargando ? 'Enviando...' : 'Obtener Código'}
                {!cargando && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={manejarVerificarOTP} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#90A4AE] ml-1">Código de 6 dígitos</label>
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.8em] rounded-xl border border-slate-100 bg-slate-50/50 py-5 text-2xl font-black text-[#2A3448] outline-none transition-all focus:border-[#0EA5E9] focus:bg-white placeholder:text-slate-200"
                  disabled={tiempoRestante === 0}
                />
                {/* Barra de progreso */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#0EA5E9] rounded-full transition-all duration-300" 
                    style={{ width: `${(otp.length / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Temporizador de validez del OTP */}
            <div className="mt-7 flex items-center justify-center gap-1.5 text-slate-500 animate-in fade-in duration-300">
              <Clock size={13} className={tiempoRestante < 60 ? "text-rose-500 animate-pulse" : "text-sky-500"} />
              <span className={`text-[10px] font-black uppercase tracking-wider ${tiempoRestante < 60 ? "text-rose-500" : "text-slate-400"}`}>
                El código expira en:
              </span>
              <span className={`text-xs font-mono font-black ${tiempoRestante < 60 ? "text-rose-500 animate-pulse" : "text-[#29ABE2]"}`}>
                {formatearTiempo(tiempoRestante)}
              </span>
            </div>

            {mensajeExito && !error && tiempoRestante > 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-sky-50/60 p-3 text-sky-600 border border-sky-100/70 mt-6 animate-in fade-in slide-in-from-top-1 duration-200">
                <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                <p className="text-[11px] font-bold leading-tight">{mensajeExito}</p>
              </div>
            )}

            {tiempoRestante === 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50/60 p-3 text-rose-600 border border-rose-100/70 mt-6 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p className="text-[11px] font-bold leading-tight">El código ha expirado. Solicitá uno nuevo para continuar.</p>
              </div>
            )}

            {error && tiempoRestante > 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50/60 p-3 text-rose-600 border border-rose-100/70 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p className="text-[11px] font-bold leading-tight">{error}</p>
              </div>
            )}

            <div className="space-y-4 pt-4">
              <button
                type="submit"
                disabled={cargando || otp.length !== 6 || tiempoRestante === 0}
                className="w-full rounded-xl bg-[#0EA5E9] py-4 text-sm font-black text-white shadow-lg shadow-[#0EA5E9]/20 transition hover:bg-[#0288D1] active:scale-[0.98] disabled:opacity-30"
              >
                {cargando ? 'Verificando...' : (tiempoRestante === 0 ? 'Código Expirado' : 'Ingresar al sistema')}
              </button>
              
              <button 
                type="button" 
                onClick={() => { setPaso(1); setTiempoRestante(600); setError(''); setOtp(''); setMensajeExito(''); }}
                className="w-full text-[10px] font-black text-slate-400 hover:text-sky-500 transition-colors uppercase tracking-[0.2em] flex items-center justify-center gap-1.5"
              >
                Solicitar nuevo código / Usar otro correo
              </button>
            </div>
          </form>
        )}

        {/* Separador + botón equipo */}
        <div className="mt-12 border-t border-slate-100 pt-6 flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">
            Instituto Beltrán · SiGIC 2026
          </p>
          <button 
            onClick={() => setVerEquipo(true)}
            className="p-2 rounded-full text-slate-300 hover:text-sky-500 hover:bg-sky-50 transition-all"
            title="Equipo de desarrollo"
          >
            <Code2 size={14} />
          </button>
        </div>
      </div>

      {/* ══════════ MODAL DEL EQUIPO ══════════ */}
      {verEquipo && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          onClick={() => setVerEquipo(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div 
            onClick={e => e.stopPropagation()} 
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Encabezado */}
            <div className="px-6 pt-7 pb-4 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0EA5E9]">Proyecto Final · ITB</p>
                  <h2 className="text-[1.2rem] font-bold text-[#2A3448]">Nuestro Equipo</h2>
               </div>
               <button 
                 onClick={() => setVerEquipo(false)} 
                 className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-all"
               >
                 <X size={16} />
               </button>
            </div>

            {/* Lista */}
            <div className="px-6 pb-6 space-y-2">
               {equipo.map((m, i) => (
                  <div 
                    key={m.nombre}
                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all duration-200"
                  >
                     <div className={`h-9 w-9 rounded-lg ${m.color} flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0 transition-transform duration-200 group-hover:scale-110`}>
                        {m.nombre.charAt(0)}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-[12px] font-bold text-[#2A3448] truncate">{m.nombre}</h4>
                        <p className="text-[10px] text-[#90A4AE]">{m.rol}</p>
                     </div>
                  </div>
               ))}
            </div>

            {/* Pie */}
            <div className="px-6 py-4 border-t border-slate-100 text-center">
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                 Instituto Beltrán · 2026
               </p>
            </div>
          </div>
        </div>
      )}
    </LayoutAutenticacion>
  )
}
