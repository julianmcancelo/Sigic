import React, { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  X, Printer, Download, MapPin, Calendar, CheckCircle2,
  Armchair, Ticket, ShieldCheck
} from 'lucide-react'

export function ModalCredencial({ egresado, onCerrar }) {
  const [falloLogo, setFalloLogo] = useState(false)

  useEffect(() => {
    const cerrarConEscape = (evento) => {
      if (evento.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', cerrarConEscape)
    return () => document.removeEventListener('keydown', cerrarConEscape)
  }, [onCerrar])

  if (!egresado) return null

  const invitados = egresado.invitados || []
  const asientosInvitados = invitados.filter(invitado => invitado.asiento_id)
  const fechaEvento = egresado.ceremonia_fecha || egresado.fecha_evento || 'Fecha a confirmar'
  const sedeEvento = egresado.ceremonia_sede || egresado.sede || 'Sede Beltrán · Anfiteatro'

  const qrData = JSON.stringify({
    id: egresado.id,
    token: egresado.token,
    dni: egresado.dni,
    asientos: egresado.asientos || []
  })

  const imprimir = () => {
    const tituloAnterior = document.title
    document.title = `Credencial_${String(egresado.nombre || 'Graduado').replace(/\s+/g, '_')}`
    document.body.classList.add('imprimiendo-credencial-graduado')
    const restaurar = () => {
      document.title = tituloAnterior
      document.body.classList.remove('imprimiendo-credencial-graduado')
      window.removeEventListener('afterprint', restaurar)
    }
    window.addEventListener('afterprint', restaurar)
    window.print()
    setTimeout(restaurar, 1500)
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-credencial-graduado"
      onMouseDown={(evento) => { if (evento.target === evento.currentTarget) onCerrar() }}
    >
      <div className="flex max-h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-emerald-600">Registro completado</p>
              <h2 id="titulo-credencial-graduado" className="text-lg font-black text-[#06194d]">Tu credencial está lista</h2>
            </div>
          </div>
          <button type="button" onClick={onCerrar} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-sky-300 hover:bg-sky-50 hover:text-[#0056b3]" aria-label="Cerrar credencial">
            <X size={19} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-100/80 p-4 sm:p-7">
          <div className="hoja-credencial-graduado relative mx-auto max-w-[680px]">
            <div className="linea-corte-graduado hidden" aria-hidden="true" />

            <article id="credencial-imprimible" className="credencial-graduado relative overflow-hidden rounded-[26px] border-[3px] border-white bg-white text-[#06194d] shadow-[0_0_0_1px_#b9d6ff,0_22px_55px_rgba(0,62,150,0.18)]">
              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rotate-12 bg-gradient-to-br from-[#0069ff] via-[#087fbd] to-[#003b9c]" />
              <div className="pointer-events-none absolute -right-24 top-8 h-48 w-48 rotate-[32deg] bg-[#b9dcff]/80" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-2 w-full bg-gradient-to-r from-[#0069ff] via-[#29ABE2] to-[#003b9c]" />
              <div className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-[#0069ff]" />

              <div className="contenido-credencial relative grid gap-5 p-5 sm:grid-cols-[1fr_190px] sm:gap-7 sm:p-7">
                <section className="min-w-0">
                  <div className="flex items-center justify-between gap-3 border-b border-blue-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-white p-1.5 shadow-sm">
                        {falloLogo ? (
                          <span className="text-lg font-black tracking-tight text-[#0056b3]">SG</span>
                        ) : (
                          <img src="/logo.png?v=20260618" alt="Logo oficial de SiGIC" className="h-full w-full object-contain" onError={() => setFalloLogo(true)} />
                        )}
                      </div>
                      <div>
                        <p className="text-xl font-black tracking-[0.12em] text-[#06194d]">SiGIC</p>
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#087fbd]">Ceremonia de colación</p>
                      </div>
                    </div>
                    <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-emerald-700 sm:flex sm:items-center sm:gap-1.5">
                      <ShieldCheck size={12} /> Credencial válida
                    </div>
                  </div>

                  <div className="py-5">
                    <p className="text-[8px] font-black uppercase tracking-[0.22em] text-slate-400">Graduado/a</p>
                    <h1 className="mt-1 break-words text-2xl font-black uppercase leading-[1.05] tracking-tight text-[#071a3d] sm:text-[30px]">
                      {egresado.nombre}
                    </h1>
                    <div className="mt-4 flex flex-wrap gap-x-7 gap-y-3">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Legajo</p>
                        <p className="text-xs font-black text-slate-700">{egresado.legajo || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Documento</p>
                        <p className="text-xs font-black text-slate-700">{egresado.dni || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Código</p>
                        <p className="font-mono text-xs font-black text-[#0056b3]">{egresado.token || egresado.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5">
                    <div className="mb-2.5 flex items-center gap-2">
                      <Armchair size={15} className="text-[#087fbd]" />
                      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#0b3980]">Ubicaciones asignadas</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-lg bg-[#0056b3] px-3 py-1.5 text-[9px] font-black text-white">GRADUADO · {egresado.asiento_id || 'S/A'}</span>
                      {egresado.entregador_asiento_id && <span className="rounded-lg bg-[#06194d] px-3 py-1.5 text-[9px] font-black text-white">ENTREGADOR · {egresado.entregador_asiento_id}</span>}
                      {asientosInvitados.map(invitado => (
                        <span key={invitado.id} className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-[9px] font-black text-[#087fbd]">INVITADO · {invitado.asiento_id}</span>
                      ))}
                    </div>
                  </div>
                </section>

                <aside className="relative z-10 flex flex-col items-center justify-center rounded-[24px] border border-white/60 bg-white/95 p-4 shadow-xl backdrop-blur-sm">
                  <p className="mb-3 text-[8px] font-black uppercase tracking-[0.2em] text-[#0056b3]">Pase grupal</p>
                  <div className="rounded-[18px] border border-blue-100 bg-white p-2.5 shadow-md">
                    <QRCodeSVG value={qrData} size={145} level="H" marginSize={1} fgColor="#06194d" bgColor="#ffffff" title="Código QR de la credencial" />
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-emerald-600">
                    <Ticket size={12} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Listo para ingresar</span>
                  </div>
                  <p className="mt-1 text-center text-[8px] leading-relaxed text-slate-500">Presentá este QR en portería. Es válido para el grupo asociado.</p>
                </aside>
              </div>

              <footer className="relative flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-blue-100 bg-slate-50/90 px-5 py-3 text-[8px] font-black uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1.5"><Calendar size={12} className="text-[#087fbd]" /> {fechaEvento}</span>
                <span className="flex items-center gap-1.5"><MapPin size={12} className="text-[#087fbd]" /> {sedeEvento}</span>
              </footer>
            </article>
          </div>

          <p className="mx-auto mt-5 max-w-lg text-center text-[11px] leading-relaxed text-slate-500">
            Guardá esta credencial en tu teléfono o imprimila. El QR debe verse completo y sin pliegues para que portería pueda leerlo.
          </p>
        </div>

        <footer className="grid grid-cols-1 gap-2.5 border-t border-slate-100 bg-white p-4 sm:grid-cols-3 sm:p-5">
          <button type="button" onClick={imprimir} className="flex items-center justify-center gap-2 rounded-xl bg-[#0056b3] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-[#087fbd] active:scale-[0.98]">
            <Download size={16} /> Exportar PDF
          </button>
          <button type="button" onClick={imprimir} className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#0056b3] transition hover:bg-blue-100 active:scale-[0.98]">
            <Printer size={16} /> Imprimir
          </button>
          <button type="button" onClick={onCerrar} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]">Cerrar</button>
        </footer>
      </div>

      <style>{`
        @media print {
          html,
          body {
            width: 150mm !important;
            height: 95mm !important;
            min-width: 150mm !important;
            min-height: 95mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: white !important;
          }
          body.imprimiendo-credencial-graduado > * {
            height: 0 !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          body * { visibility: hidden !important; }
          .hoja-credencial-graduado,
          .hoja-credencial-graduado *,
          .credencial-graduado,
          .credencial-graduado * { visibility: visible !important; }
          .hoja-credencial-graduado {
            position: fixed !important;
            inset: 0 !important;
            width: 150mm !important;
            height: 95mm !important;
            min-height: 95mm !important;
            max-width: none !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            background: white !important;
          }
          .credencial-graduado {
            position: absolute !important;
            inset: 5mm auto auto 5mm !important;
            width: 140mm !important;
            height: 85mm !important;
            min-height: 0 !important;
            box-sizing: border-box !important;
            border-radius: 6mm !important;
            box-shadow: 0 0 0 .3mm #b9d6ff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: hidden !important;
          }
          .contenido-credencial {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) 45mm !important;
            gap: 4mm !important;
            padding: 5mm !important;
          }
          .linea-corte-graduado {
            display: block !important;
            position: absolute !important;
            inset: 4.25mm !important;
            border: .25mm dashed #64748b !important;
            border-radius: 6.5mm !important;
            z-index: 30 !important;
            pointer-events: none !important;
            box-sizing: border-box !important;
          }
          .linea-corte-graduado::before {
            content: 'LÍNEA DE CORTE' !important;
            position: absolute !important;
            top: -3.2mm !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            padding: 0 1.5mm !important;
            background: white !important;
            color: #64748b !important;
            font: 700 6pt/1 sans-serif !important;
            letter-spacing: .8pt !important;
            white-space: nowrap !important;
          }
          @page { size: 150mm 95mm; margin: 0; }
        }
      `}</style>
    </div>
  )
}
