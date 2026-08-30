import { useState } from 'react'
import { CheckCircle2, KeyRound, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Shield } from 'lucide-react'
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

  // Medidor de seguridad de contraseña
  const tieneLargo = password.length >= 8
  const tieneNumeroOSimbolo = /[\d!@#$%^&*(),.?":{}|<>]/.test(password)
  const tieneMayuscula = /[A-Z]/.test(password)
  const coinciden = password.length > 0 && password === confirmacion

  async function enviar(evento) {
    evento.preventDefault()
    if (!token) {
      setError('El enlace no es válido o ha expirado. Solicitá una nueva invitación a tu administrador.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.')
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
    <LayoutAutenticacion centrado>
      <div className="px-6 py-8 sm:px-8 sm:py-10">
        
        {/* ENCABEZADO */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 border border-sky-500/20 shadow-inner">
            <KeyRound size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
              Seguridad Institucional
            </span>
            <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
              Definir Contraseña
            </h1>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-600 font-medium mb-6">
          Elegí una contraseña privada y segura para acceder a tu cuenta en la plataforma SiGIC.
        </p>

        {completado ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-900">
              <div className="flex items-center gap-2.5 font-black text-sm text-emerald-800 mb-1.5">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <span>¡Contraseña configurada con éxito!</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Tu cuenta institucional ya se encuentra activa. Ya podés iniciar sesión en la plataforma con tu correo y tu nueva contraseña privada.
              </p>
            </div>

            <a
              href="/admin"
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-slate-900 hover:bg-sky-500 py-3.5 text-center text-xs font-black uppercase tracking-wider text-white transition active:scale-[0.98] shadow-md shadow-slate-900/10 cursor-pointer"
            >
              <span>Ir al Inicio de Sesión</span>
              <ArrowRight size={16} />
            </a>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={enviar}>
            
            {/* CAMPO CONTRASEÑA */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                Nueva Contraseña Privada
              </label>
              <div className="relative">
                <input
                  required
                  minLength={8}
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={evento => setPassword(evento.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-11 text-xs font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                  tabIndex={-1}
                >
                  {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* CAMPO REPETIR CONTRASEÑA */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  required
                  minLength={8}
                  type={mostrarConfirmacion ? 'text' : 'password'}
                  value={confirmacion}
                  onChange={evento => setConfirmacion(evento.target.value)}
                  placeholder="Repetí la contraseña"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-11 text-xs font-semibold text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacion(!mostrarConfirmacion)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                  tabIndex={-1}
                >
                  {mostrarConfirmacion ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* REGLAS / INDICADORES DE SEGURIDAD */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5 text-[10px] font-semibold text-slate-500">
              <div className={`flex items-center gap-1.5 ${tieneLargo ? 'text-emerald-600 font-bold' : ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${tieneLargo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>Al menos 8 caracteres</span>
              </div>
              <div className={`flex items-center gap-1.5 ${tieneNumeroOSimbolo ? 'text-emerald-600 font-bold' : ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${tieneNumeroOSimbolo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>Incluye un número o símbolo</span>
              </div>
              {confirmacion.length > 0 && (
                <div className={`flex items-center gap-1.5 ${coinciden ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${coinciden ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span>{coinciden ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}</span>
                </div>
              )}
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-bold text-rose-700 leading-relaxed">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando || !tieneLargo || (confirmacion.length > 0 && !coinciden)}
              className="w-full rounded-2xl bg-sky-600 hover:bg-sky-500 py-3.5 text-center text-xs font-black uppercase tracking-wider text-white transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-sky-600/20 cursor-pointer"
            >
              {cargando ? 'Guardando contraseña...' : 'Guardar Contraseña e Ingresar'}
            </button>
          </form>
        )}
      </div>
    </LayoutAutenticacion>
  )
}
