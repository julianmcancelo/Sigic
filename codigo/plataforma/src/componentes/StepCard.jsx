import React from 'react'

/**
 * Componente de tarjeta con estilo SiGIC (encabezado oscuro + cuerpo blanco)
 */
export function StepCard({ titulo, icono: Icono, children, accion }) {
  const ACCENT = '#29ABE2'
  const DARK = '#2A3448'

  return (
    <div
      className="overflow-hidden rounded-[14px] border"
      style={{ borderColor: `${ACCENT}22`, boxShadow: '0 4px 16px rgba(41,171,226,0.07)' }}
    >
      <div className="flex items-center justify-between px-5 py-3" style={{ background: DARK }}>
        <div className="flex items-center gap-2.5">
          {Icono && <Icono size={14} style={{ color: ACCENT }} />}
          <span className="text-[13px] font-semibold text-white">{titulo}</span>
        </div>
        {accion}
      </div>
      <div className="bg-white">{children}</div>
    </div>
  )
}
