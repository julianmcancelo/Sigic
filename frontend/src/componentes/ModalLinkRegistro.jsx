import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, CheckCircle2, Copy } from 'lucide-react'

const DARK = '#2A3448'
const ACCENT = '#29ABE2'

/**
 * Modal que muestra el link de registro y su correspondiente código QR.
 * Facilita que el administrador comparta el acceso al egresado.
 */
export function ModalLinkRegistro({ egresado, link, onCerrar }) {
  const [copiado, setCopiado] = useState(false)

  if (!egresado || !link) return null

  // Función para copiar el enlace al portapapeles con feedback visual
  function copiarAlPortapapeles() {
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: 'rgba(13, 27, 45, 0.7)' }}
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 py-6 text-center" style={{ background: DARK }}>
          <div
            className="absolute -top-12 -left-12 h-32 w-32 rounded-full blur-[40px] opacity-20"
            style={{ background: ACCENT }}
          />
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#29ABE2]">Acceso Directo</p>
          <h3 className="mt-1 text-[17px] font-black text-white">Link de Registro</h3>
          <p className="mt-1 text-[11px] text-white/40">{egresado.nombre}</p>
          <button
            onClick={onCerrar}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col items-center p-8 gap-6">
          <div className="rounded-[20px] bg-slate-50 p-6 shadow-inner border border-slate-100">
            <QRCodeSVG value={link} size={180} level="H" fgColor={DARK} />
          </div>

          <div className="w-full space-y-3">
            <p className="text-center text-[11px] leading-relaxed text-slate-400">
              Escaneá este código o copiá el link para enviarlo.
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-2">
              <input
                readOnly
                value={link}
                className="flex-1 bg-transparent px-2 text-[10px] text-slate-500 outline-none"
              />
              <button
                onClick={copiarAlPortapapeles}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm"
                style={{ color: copiado ? '#10b981' : ACCENT }}
              >
                {copiado ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="w-full rounded-xl py-3 text-[13px] font-bold text-white transition-all"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, #1a87c0)`,
              boxShadow: '0 4px 15px rgba(41,171,226,0.3)',
            }}
          >
            Listo, ya lo compartí
          </button>
        </div>
      </div>
    </div>
  )
}
