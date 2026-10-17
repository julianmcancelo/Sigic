import React from 'react'

/**
 * Campo de texto estilizado con etiqueta e icono opcional
 * Rediseñado para una estética premium con transiciones suaves y estados definidos.
 */
export function InputCampo({ label, valor, onChange, onBlur, placeholder, icon: Icon, type = "text", inputMode, maxLength, compact = false }) {
  return (
    <div className="flex flex-col gap-1 w-full group">
      {label && (
        <label className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 ml-1 transition-colors group-focus-within:text-sky-600">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-all duration-200 group-focus-within:text-sky-500">
            <Icon size={15} />
          </div>
        )}
        
        <input
          type={type}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          className={`
            w-full bg-white border border-slate-200 rounded-xl py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800
            transition-all duration-200 ease-out placeholder:text-slate-350 placeholder:font-normal
            focus:outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10 focus:shadow-sm
            ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5
          `}
        />
      </div>
    </div>
  )
}
