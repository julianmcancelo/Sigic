import React from 'react'
import { Trash2, ChevronDown } from 'lucide-react'

const DARK = '#2A3448'
const ACCENT = '#29ABE2'

const RELACIONES = [
  'Padre / Madre',
  'Hermano/a',
  'Abuelo/a',
  'Tío/a',
  'Pareja',
  'Amigo/a',
  'Otro familiar',
]

/**
 * Selector estilizado para la relación con el egresado.
 */
function SelectorRelacion({ value, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border px-3 py-2 text-[13px] pr-8 focus:outline-none transition-all"
        style={{
          borderColor: value ? `${ACCENT}55` : '#d1d5db',
          background: '#FAFBFC',
          color: value ? DARK : '#9ca3af',
        }}
      >
        <option value="" disabled>Seleccioná la relación...</option>
        {RELACIONES.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  )
}

/**
 * Input estilizado específico para el registro.
 */
function InputRegistro({ value, onChange, placeholder, tipo = 'text' }) {
  return (
    <input
      type={tipo}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border px-3 py-2 text-[13px] focus:outline-none transition-all"
      style={{
        borderColor: value ? `${ACCENT}55` : '#d1d5db',
        background: '#FAFBFC',
        color: DARK,
      }}
    />
  )
}

/**
 * Tarjeta que contiene el formulario de un invitado individual.
 */
export function TarjetaInvitadoForm({ index, data, onChange, onQuitar, total }) {
  return (
    <div className="rounded-[12px] border overflow-hidden" style={{ borderColor: `${ACCENT}22` }}>
      {/* Cabecera oscura de la tarjeta de invitado */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: `${DARK}f0` }}>
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: ACCENT }}
          >
            {index + 1}
          </span>
          <span className="text-[12px] font-semibold text-white/80">
            {data.nombre || `Invitado ${index + 1}`}
          </span>
          {data.relacion && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: `${ACCENT}22`, color: ACCENT }}
            >
              {data.relacion}
            </span>
          )}
        </div>
        
        {total > 1 && (
          <button
            type="button"
            onClick={onQuitar}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-white/40 transition hover:bg-red-500/20 hover:text-red-400"
          >
            <Trash2 size={11} />
            Quitar
          </button>
        )}
      </div>

      {/* Cuerpo del formulario */}
      <div className="grid grid-cols-1 gap-3 bg-white p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Relación con el egresado *
          </label>
          <SelectorRelacion value={data.relacion} onChange={(v) => onChange('relacion', v)} />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Nombre completo *
          </label>
          <InputRegistro value={data.nombre} onChange={(v) => onChange('nombre', v)} placeholder="Ej: María López" />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            DNI *
          </label>
          <InputRegistro value={data.dni} onChange={(v) => onChange('dni', v)} placeholder="Ej: 38456789" />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Teléfono *
          </label>
          <InputRegistro 
            tipo="tel" 
            value={data.telefono} 
            onChange={(v) => onChange('telefono', v)} 
            placeholder="Ej: 11 2345-6789" 
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Correo (opcional)
          </label>
          <InputRegistro 
            tipo="email" 
            value={data.correo} 
            onChange={(v) => onChange('correo', v)} 
            placeholder="Ej: mail@correo.com" 
          />
        </div>
      </div>
    </div>
  )
}
