import { useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

// Campo reutilizable para mantener el mismo estilo en todos los inputs del login.
export function CampoFormulario({
  etiqueta,
  tipo = 'text',
  nombre,
  valor,
  placeholder,
  mensajeError,
  onChange,
}) {
  const [mostrarClave, setMostrarClave] = useState(false)
  const tieneError = Boolean(mensajeError)
  const esPassword = tipo === 'password'
  const tipoEfectivo = esPassword ? (mostrarClave ? 'text' : 'password') : tipo

  return (
    <label className="block">
      <div className="relative">
        <input
          className={`w-full rounded-lg border px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 ${
            tieneError
              ? 'border-rose-300 bg-rose-50 focus:border-rose-400'
              : 'border-transparent bg-[#EEF6FC] focus:border-[#29ABE2] focus:bg-white'
          } ${esPassword ? 'pr-11' : ''}`}
          type={tipoEfectivo}
          name={nombre}
          value={valor}
          placeholder={placeholder || etiqueta}
          onChange={onChange}
        />

        {esPassword ? (
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
            onClick={() => setMostrarClave((v) => !v)}
          >
            {mostrarClave ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        ) : null}
      </div>

      {tieneError ? (
        <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-rose-50/60 border border-rose-100/70 p-3 text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span className="text-[11px] font-bold leading-tight">{mensajeError}</span>
        </div>
      ) : null}
    </label>
  )
}
