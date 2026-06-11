import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

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
        <span className="mt-1 block text-xs text-rose-600">{mensajeError}</span>
      ) : null}
    </label>
  )
}
