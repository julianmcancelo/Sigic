import { useState } from 'react'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { LayoutAutenticacion } from '../layouts/LayoutAutenticacion'
import { restablecerContrasena } from '../servicios/api'

export function RestablecerContrasena() {
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [completado, setCompletado] = useState(false)
  const token = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('token') || ''

  async function enviar(evento) {
    evento.preventDefault()
    if (!token) return setError('El enlace no es válido. Solicitá uno nuevo desde el acceso administrativo.')
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirmacion) return setError('Las contraseñas no coinciden.')
    setCargando(true)
    setError('')
    try {
      await restablecerContrasena(token, password)
      setCompletado(true)
    } catch (err) {
      setError(err.message || 'No pudimos actualizar la contraseña.')
    } finally {
      setCargando(false)
    }
  }

  return <LayoutAutenticacion centrado>
    <div className="px-8 py-9">
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><KeyRound size={20} /></div>
      <p className="text-[10px] font-black uppercase tracking-[.16em] text-sky-600">Recuperación de acceso</p>
      <h1 className="mt-2 text-2xl font-black text-slate-800">Nueva contraseña</h1>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">Elegí una contraseña segura para volver a ingresar al panel administrativo.</p>
      {completado ? <div className="mt-6 space-y-4"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="mb-2" size={20} />Tu contraseña fue actualizada correctamente.</div><a href="/admin" className="block rounded-lg bg-[#29ABE2] py-3 text-center text-sm font-semibold text-white">Ir al inicio de sesión</a></div> : <form className="mt-6 space-y-4" onSubmit={enviar}><label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Nueva contraseña<input required minLength="8" type="password" value={password} onChange={evento => setPassword(evento.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm normal-case tracking-normal outline-none focus:border-[#29ABE2] focus:ring-2 focus:ring-sky-100" /></label><label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Repetir contraseña<input required minLength="8" type="password" value={confirmacion} onChange={evento => setConfirmacion(evento.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm normal-case tracking-normal outline-none focus:border-[#29ABE2] focus:ring-2 focus:ring-sky-100" /></label>{error ? <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-xs text-rose-700">{error}</p> : null}<button disabled={cargando} className="w-full rounded-lg bg-[#29ABE2] py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:bg-slate-300">{cargando ? 'Actualizando...' : 'Guardar nueva contraseña'}</button></form>}
    </div>
  </LayoutAutenticacion>
}
