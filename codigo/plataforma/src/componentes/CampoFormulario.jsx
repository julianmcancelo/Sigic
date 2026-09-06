import { useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

// Campo reutilizable con estética moderna, microinteracciones y foco de alta definición.
export function CampoFormulario({
  etiqueta,
  tipo = 'text',
  nombre,
  valor,
  placeholder,
  mensajeError,
  onChange,
  icono: Icono,
  mostrarEtiqueta = false,
  reservarError = false,
  onKeyDown,
  onKeyUp,
  onBlur,
  autoComplete,
}) {
  const [mostrarClave, setMostrarClave] = useState(false)
  const tieneError = Boolean(mensajeError)
  const esPassword = tipo === 'password'
  const tipoEfectivo = esPassword ? (mostrarClave ? 'text' : 'password') : tipo

  return (
    <div className="block text-left">
      {mostrarEtiqueta ? (
        <label htmlFor={nombre} className="block mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
          {etiqueta}
        </label>
      ) : null}
      
      <div className="group relative">
        {Icono ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Icono size={17} aria-hidden="true" />
          </div>
        ) : null}

        <input
          id={nombre}
          className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 ${
            tieneError
              ? 'border-rose-300 bg-rose-50/60 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10'
              : 'border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10'
          } ${esPassword ? 'pr-11' : ''} ${Icono ? 'pl-11' : ''}`}
          type={tipoEfectivo}
          name={nombre}
          value={valor}
          placeholder={placeholder || etiqueta}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={onBlur}
          autoComplete={autoComplete}
          aria-invalid={tieneError}
        />

        {esPassword ? (
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            onClick={() => setMostrarClave((v) => !v)}
            title={mostrarClave ? 'Ocultar contraseña' : 'Ver contraseña'}
          >
            {mostrarClave ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : null}
      </div>

      {reservarError ? (
        <div className={`flex items-center gap-1.5 mt-1.5 min-h-[18px] text-[11px] font-semibold text-rose-600 transition-opacity duration-200 ${tieneError ? 'opacity-100' : 'opacity-0'}`} aria-live="polite">
          {tieneError ? <><AlertCircle size={12} className="shrink-0" /> <span>{mensajeError}</span></> : null}
        </div>
      ) : tieneError ? (
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 px-3 py-2 text-rose-700 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle size={14} className="shrink-0" />
          <span className="text-[11px] font-bold">{mensajeError}</span>
        </div>
      ) : null}
    </div>
  )
}
