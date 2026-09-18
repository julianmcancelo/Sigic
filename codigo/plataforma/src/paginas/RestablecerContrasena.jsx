import { useState } from 'react'
import { CheckCircle2, KeyRound, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, ShieldAlert, Sparkles, Check, X } from 'lucide-react'
import { LayoutAutenticacion } from '../layouts/LayoutAutenticacion'
import { restablecerContrasena } from '../servicios/api'

export function RestablecerContrasena() {
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [completado, setCompletado] = useState(false)

  const token = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('token') || ''

  // Medidor y criterios de seguridad
  const tieneLargo = password.length >= 8
  const tieneNumero = /\d/.test(password)
  const tieneSimbolo = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const tieneMayuscula = /[A-Z]/.test(password)
  const tieneMinuscula = /[a-z]/.test(password)

  // Cálculo de fuerza (0 a 4)
  const puntaje = [tieneLargo, tieneNumero, tieneSimbolo, (tieneMayuscula && tieneMinuscula)].filter(Boolean).length
  const nivelesFuerza = [
    { texto: 'Muy débil', color: 'bg-rose-500', textoColor: 'text-rose-600', ancho: 'w-1/4' },
    { texto: 'Regular', color: 'bg-amber-500', textoColor: 'text-amber-600', ancho: 'w-2/4' },
    { texto: 'Buena', color: 'bg-sky-500', textoColor: 'text-sky-600', ancho: 'w-3/4' },
    { texto: 'Excelente', color: 'bg-emerald-500', textoColor: 'text-emerald-600', ancho: 'w-full' },
  ]
  const nivelActual = password.length > 0 ? nivelesFuerza[Math.max(0, puntaje - 1)] : null

  const coinciden = password.length > 0 && confirmacion.length > 0 && password === confirmacion
  const noCoinciden = confirmacion.length > 0 && password !== confirmacion
  const puedeEnviar = tieneLargo && (tieneNumero || tieneSimbolo) && coinciden && !cargando

  async function enviar(evento) {
    evento.preventDefault()
    if (!token) {
      setError('El enlace de seguridad no es válido o ha expirado. Solicitá una nueva invitación a tu administrador.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmacion) {
      setError('Las contraseñas ingresadas no coinciden.')
      return
    }
    setCargando(true)
    setError('')
    try {
      await restablecerContrasena(token, password)
      setCompletado(true)
    } catch (err) {
      setError(err.message || 'No pudimos actualizar la contraseña. El enlace puede haber expirado.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <LayoutAutenticacion>
      <div className="w-full max-w-md mx-auto py-2 sm:py-4">
        
        {/* ENCABEZADO INSTITUCIONAL */}
        <header className="mb-6 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-sky-700 shadow-xs">
            <ShieldCheck size={14} className="text-sky-600" />
            <span>Seguridad Institucional</span>
          </div>
          
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25">
              <KeyRound size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Definir Contraseña
              </h1>
              <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                Elegí una contraseña privada para asegurar tu acceso a la plataforma SiGIC.
              </p>
            </div>
          </div>
        </header>

        {completado ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="rounded-3xl border border-emerald-200/90 bg-emerald-50/70 p-6 text-emerald-950 shadow-sm">
              <div className="flex items-center gap-3 font-black text-base text-emerald-800 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h2 className="text-base font-black text-emerald-900 leading-tight">¡Contraseña activada!</h2>
                  <span className="text-[11px] font-semibold text-emerald-700">Tu cuenta institucional ya está segura</span>
                </div>
              </div>
              <p className="mt-3 text-xs sm:text-sm text-emerald-800 leading-relaxed">
                Se guardó tu nueva contraseña correctamente. Ya podés iniciar sesión con tus credenciales y acceder a la plataforma.
              </p>
            </div>

            <a
              href="/admin"
              className="group flex items-center justify-center gap-2.5 w-full rounded-2xl bg-slate-900 hover:bg-sky-600 py-4 text-center text-xs font-black uppercase tracking-wider text-white transition-all shadow-lg shadow-slate-900/15 hover:shadow-sky-600/25 active:scale-[0.99] cursor-pointer"
            >
              <span>Ir al Inicio de Sesión</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={enviar}>
            
            {/* CAMPO CONTRASEÑA */}
            <div className="space-y-2 text-left">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                Nueva Contraseña Privada
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-sky-600 transition-colors">
                  <Lock size={17} />
                </div>
                <input
                  required
                  minLength={8}
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={evento => setPassword(evento.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-11 py-3 text-sm font-semibold text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 hover:border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  tabIndex={-1}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Barra de progreso de seguridad interactiva */}
              {password.length > 0 && (
                <div className="pt-1.5 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500">Nivel de seguridad:</span>
                    <span className={nivelActual?.textoColor}>{nivelActual?.texto}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/60">
                    <div
                      className={`h-full transition-all duration-300 ${nivelActual?.color} ${nivelActual?.ancho}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CAMPO CONFIRMAR CONTRASEÑA */}
            <div className="space-y-2 text-left">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                Confirmar Contraseña
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-sky-600 transition-colors">
                  <Lock size={17} />
                </div>
                <input
                  required
                  minLength={8}
                  type={mostrarConfirmacion ? 'text' : 'password'}
                  value={confirmacion}
                  onChange={evento => setConfirmacion(evento.target.value)}
                  placeholder="Repetí la contraseña ingresada"
                  className={`w-full rounded-xl border pl-10 pr-11 py-3 text-sm font-semibold text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-4 hover:border-slate-300 ${
                    noCoinciden
                      ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-500/10'
                      : coinciden
                      ? 'border-emerald-300 bg-emerald-50/40 focus:border-emerald-500 focus:ring-emerald-500/10'
                      : 'border-slate-200 bg-slate-50/70 focus:border-sky-500 focus:ring-sky-500/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacion(!mostrarConfirmacion)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  tabIndex={-1}
                  aria-label={mostrarConfirmacion ? 'Ocultar confirmación' : 'Ver confirmación'}
                >
                  {mostrarConfirmacion ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* CHECKLIST DE REQUISITOS EN CARDS VISUALES */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 space-y-2">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Requisitos de Seguridad
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium">
                <div className={`flex items-center gap-2 rounded-xl p-2 transition-all ${tieneLargo ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${tieneLargo ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span>8 caracteres mínimo</span>
                </div>

                <div className={`flex items-center gap-2 rounded-xl p-2 transition-all ${(tieneNumero || tieneSimbolo) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${(tieneNumero || tieneSimbolo) ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span>Número o símbolo</span>
                </div>

                <div className={`flex items-center gap-2 rounded-xl p-2 transition-all ${(tieneMayuscula && tieneMinuscula) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${(tieneMayuscula && tieneMinuscula) ? 'bg-emerald-50 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span>Mayúsculas y minúsculas</span>
                </div>

                <div className={`flex items-center gap-2 rounded-xl p-2 transition-all ${
                  coinciden 
                    ? 'bg-emerald-50 text-emerald-700 font-bold' 
                    : noCoinciden 
                    ? 'bg-rose-50 text-rose-700 font-bold' 
                    : 'text-slate-500'
                }`}>
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    coinciden 
                      ? 'bg-emerald-500 text-white' 
                      : noCoinciden 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    {noCoinciden ? <X size={11} strokeWidth={3} /> : <Check size={11} strokeWidth={3} />}
                  </div>
                  <span>{noCoinciden ? 'No coinciden' : 'Coinciden ambas'}</span>
                </div>
              </div>
            </div>

            {/* ALERTA DE ERROR */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200/90 p-3.5 text-xs font-bold text-rose-700 animate-in fade-in slide-in-from-top-1">
                <ShieldAlert size={16} className="shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* BOTÓN DE ACCIÓN */}
            <button
              type="submit"
              disabled={!puedeEnviar}
              className="group relative flex w-full items-center justify-center gap-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 py-4 text-center text-xs font-black uppercase tracking-wider text-white transition-all shadow-lg shadow-sky-600/25 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              {cargando ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Guardando contraseña...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="opacity-80 group-hover:rotate-12 transition-transform" />
                  <span>Guardar Contraseña e Ingresar</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </LayoutAutenticacion>
  )
}
