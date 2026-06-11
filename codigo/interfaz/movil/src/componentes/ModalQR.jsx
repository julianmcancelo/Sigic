import React, { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Download, CheckCircle2, Clock } from 'lucide-react'

// Colores del sistema para mantener consistencia
const DARK = '#2A3448'
const ACCENT = '#29ABE2'

/**
 * Modal para ver y descargar el QR de un invitado específico.
 */
export function ModalQR({ invitado, onCerrar }) {
  const refSVG = useRef(null)

  if (!invitado) return null

  // Función para convertir el SVG del QR a una imagen PNG y descargarla
  function descargarQR() {
    const svg = refSVG.current?.querySelector('svg')
    if (!svg) return

    const datos = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([datos], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 300
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, 300, 300)
      ctx.drawImage(img, 0, 0, 300, 300)
      const link = document.createElement('a')
      link.download = `QR-${invitado.nombre.replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL()
      link.click()
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-[18px] border"
        style={{ borderColor: `${ACCENT}33`, boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ background: DARK }}>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
              Código QR · Invitado
            </p>
            <p className="mt-0.5 text-[15px] font-bold text-white">{invitado.nombre}</p>
          </div>
          <button
            onClick={onCerrar}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
        
        <div className="flex flex-col items-center bg-white px-6 py-6 gap-4">
          <div ref={refSVG} className="rounded-[12px] border p-4" style={{ borderColor: `${ACCENT}22` }}>
            <QRCodeSVG value={invitado.id} size={180} bgColor="#ffffff" fgColor={DARK} level="M" />
          </div>
          
          <div className="w-full space-y-1.5">
            {[
              ['Nombre', invitado.nombre],
              ['DNI', invitado.dni],
              ['Relación', invitado.relacion],
              ['Egresado', invitado.egresadoNombre],
            ].map(([etiqueta, valor]) => (
              <div key={etiqueta} className="flex justify-between text-[12px]">
                <span style={{ color: '#9ca3af' }}>{etiqueta}</span>
                <span className="font-semibold" style={{ color: DARK }}>{valor}</span>
              </div>
            ))}
          </div>
          
          <div
            className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2"
            style={{ 
              background: invitado.presente ? '#f0fdf4' : '#fef9c3', 
              border: `1px solid ${invitado.presente ? '#bbf7d0' : '#fde68a'}` 
            }}
          >
            {invitado.presente ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Clock size={14} className="text-yellow-500" />}
            <span className="text-[11px] font-semibold" style={{ color: invitado.presente ? '#166534' : '#92400e' }}>
              {invitado.presente ? 'Ya ingresó al evento' : 'Aún no ingresó'}
            </span>
          </div>
          
          <button
            onClick={descargarQR}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] py-2.5 text-[13px] font-bold text-white transition"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #1a87c0)`, boxShadow: '0 4px 14px rgba(41,171,226,0.3)' }}
          >
            <Download size={14} /> Descargar QR como PNG
          </button>
        </div>
      </div>
    </div>
  )
}
