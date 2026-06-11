import React from 'react'

/**
 * Campo de texto estilizado con etiqueta e icono opcional
 * Rediseñado para una estética premium con transiciones suaves y estados definidos.
 */
export function InputCampo({ label, valor, onChange, placeholder, icon: Icon, type = "text" }) {
  return (
    <div className="flex flex-col gap-1.5 w-full group">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 transition-colors group-focus-within:text-sky-600">
        {label}
      </label>
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-all duration-300 group-focus-within:text-sky-500 group-focus-within:scale-110">
            <Icon size={16} />
          </div>
        )}
        
        <input
          type={type}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full bg-white border-2 border-slate-100 rounded-2xl py-3.5 text-sm font-semibold text-slate-700
            transition-all duration-300 ease-out placeholder:text-slate-300 placeholder:font-medium
            focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/5 focus:shadow-xl focus:shadow-sky-500/10
            ${Icon ? 'pl-12' : 'pl-5'} pr-5
          `}
        />
      </div>
    </div>
  )
}
