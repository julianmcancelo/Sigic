import React, { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  X, Printer, Download, MapPin, Calendar, CheckCircle2,
  Armchair, Ticket, ShieldCheck, Wallet, Loader2, Info, AlertTriangle,
  Sparkles, Award, Users, Check
} from 'lucide-react'
import { obtenerGoogleWalletPass } from '../servicios/api'

export function ModalCredencial({ egresado, onCerrar }) {
  const [falloLogo, setFalloLogo] = useState(false)
  const [cargandoWallet, setCargandoWallet] = useState(false)
  const [walletMensaje, setWalletMensaje] = useState({ tipo: '', texto: '' })

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
  
  // Formateo elegante de fecha en español
  const rawFecha = egresado.ceremonia_fecha || egresado.fecha_evento
  let fechaFormateada = '27 de agosto de 2026'
  if (rawFecha) {
    try {
      const fechaLimpia = String(rawFecha).includes('T') ? String(rawFecha) : `${String(rawFecha).trim()}T12:00:00`
      const d = new Date(fechaLimpia)
      if (!isNaN(d.getTime())) {
        fechaFormateada = new Intl.DateTimeFormat('es-AR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(d)
      }
    } catch {}
  }

  const sedeEvento = egresado.ceremonia_sede || egresado.ceremonia_lugar || egresado.sede || 'Auditorio Central · Sede Beltrán'
  const nombreCeremonia = egresado.ceremonia_nombre || 'Ceremonia de Graduación'

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

  const guardarEnGoogleWallet = async () => {
    if (egresado.google_wallet_url) {
      window.open(egresado.google_wallet_url, '_blank')
      return
    }
    setCargandoWallet(true)
    setWalletMensaje({ tipo: '', texto: '' })
    try {
      const res = await obtenerGoogleWalletPass(egresado.id)
      if (res.url) {
        window.open(res.url, '_blank')
      } else if (res.noConfigurado) {
        setWalletMensaje({ tipo: 'info', texto: 'Google Wallet no se encuentra configurado en este entorno de desarrollo.' })
      }
    } catch (err) {
      setWalletMensaje({ tipo: 'error', texto: err.message || 'No se pudo generar el pase para Google Wallet.' })
    } finally {
      setCargandoWallet(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md sm:p-6 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-credencial-graduado"
      onMouseDown={(evento) => { if (evento.target === evento.currentTarget) onCerrar() }}
    >
      <div className="flex max-h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-slate-700/60 bg-slate-900 shadow-2xl text-white">
        
        {/* CABECERA MODAL */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4 sm:px-8">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Padrón Oficial Habilitado</p>
              <h2 id="titulo-credencial-graduado" className="text-base sm:text-lg font-black text-white">Credencial Digital & Pase Grupal</h2>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onCerrar} 
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer" 
            aria-label="Cerrar credencial"
          >
            <X size={18} />
          </button>
        </header>

        {/* CUERPO CON LA TARJETA IMPRIMIBLE */}
        <div className="flex-1 overflow-y-auto bg-slate-950/90 p-4 sm:p-7">
          <div className="hoja-credencial-graduado relative mx-auto max-w-[680px]">
            <div className="linea-corte-graduado hidden" aria-hidden="true" />

            <article 
              id="credencial-imprimible" 
              className="credencial-graduado relative overflow-hidden rounded-[28px] border-2 border-white/20 bg-white text-slate-900 shadow-2xl"
            >
              {/* ORBES Y GRADIENTES DECORATIVOS SUPERIORES */}
              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rotate-12 bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#0f172a]" />
              <div className="pointer-events-none absolute -right-24 top-8 h-48 w-48 rotate-[32deg] bg-[#bae6fd]/70" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-2 w-full bg-gradient-to-r from-[#0284c7] via-[#38bdf8] to-[#0f172a]" />
              <div className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-[#0284c7]" />

              <div className="contenido-credencial relative grid gap-5 p-5 sm:grid-cols-[1fr_205px] sm:gap-6 sm:p-7">
                
                {/* LADO IZQUIERDO: INFORMACIÓN DEL GRADUADO */}
                <section className="min-w-0 flex flex-col justify-between">
                  
                  {/* ENCABEZADO INSTITUCIONAL */}
                  <div>
                    <div className="flex items-center justify-between gap-3 border-b border-slate-150 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-13 w-13 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
                          {falloLogo ? (
                            <span className="text-base font-black tracking-tight text-sky-600">SiGIC</span>
                          ) : (
                            <img src="/logo-oficial.png" alt="SiGIC" className="h-full w-full object-contain" onError={() => setFalloLogo(true)} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-lg font-black tracking-tight text-slate-900">SiGIC</p>
                            <span className="text-[9px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/80">Oficial</span>
                          </div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                            {nombreCeremonia}
                          </p>
                        </div>
                      </div>
                      
                      <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700 sm:flex sm:items-center sm:gap-1.5 shadow-xs">
                        <ShieldCheck size={13} /> Credencial Válida
                      </div>
                    </div>

                    {/* NOMBRE Y CARRERA */}
                    <div className="py-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Graduado/a</p>
                      <h1 className="mt-0.5 break-words text-2xl sm:text-[28px] font-black uppercase leading-tight tracking-tight text-slate-900">
                        {egresado.nombre}
                      </h1>
                      
                      {egresado.carrera && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-sky-800 font-bold">
                          <Award size={13} className="text-sky-600 shrink-0" />
                          <span className="truncate">{egresado.carrera}</span>
                        </div>
                      )}

                      {/* DETALLES DE LEGAJO, DOCUMENTO Y TOKEN */}
                      <div className="mt-3.5 flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-slate-100">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Legajo</p>
                          <p className="text-xs font-black text-slate-800">{egresado.legajo || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Documento</p>
                          <p className="text-xs font-black text-slate-800">{egresado.dni || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Código de Acceso</p>
                          <p className="font-mono text-xs font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
                            {egresado.token || egresado.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CAJA DE UBICACIONES ASIGNADAS */}
                  <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50/80 to-indigo-50/50 p-3.5 mt-2">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Armchair size={14} className="text-sky-600" />
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-700">Ubicaciones Asignadas</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-lg bg-sky-600 px-2.5 py-1 text-[9px] font-black text-white shadow-xs">
                        GRADUADO · {egresado.asiento_id ? `Butaca ${egresado.asiento_id}` : 'General'}
                      </span>
                      {egresado.entregador_asiento_id && (
                        <span className="rounded-lg bg-indigo-900 px-2.5 py-1 text-[9px] font-black text-white shadow-xs">
                          PADRINO · {egresado.entregador_asiento_id}
                        </span>
                      )}
                      {asientosInvitados.map(invitado => (
                        <span key={invitado.id} className="rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-[9px] font-black text-sky-700 shadow-2xs">
                          INVITADO · {invitado.asiento_id}
                        </span>
                      ))}
                      {asientosInvitados.length === 0 && !egresado.asiento_id && (
                        <span className="text-[10px] text-slate-500 font-semibold italic py-0.5">
                          Sin butacas asignadas formalmente
                        </span>
                      )}
                    </div>
                  </div>
                </section>

                {/* LADO DERECHO: QR CODE DEL PASE GRUPAL */}
                <aside className="relative z-10 flex flex-col items-center justify-between rounded-[24px] border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="text-center w-full">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100 inline-block">
                      Pase Grupal
                    </span>
                  </div>

                  <div className="my-2.5 rounded-2xl border-2 border-slate-100 bg-white p-2.5 shadow-sm">
                    <QRCodeSVG 
                      value={qrData} 
                      size={140} 
                      level="H" 
                      marginSize={1} 
                      fgColor="#0f172a" 
                      bgColor="#ffffff" 
                      title="Código QR de la credencial" 
                    />
                  </div>

                  <div className="text-center space-y-1 w-full">
                    <div className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100 text-[9px] font-black uppercase tracking-wider">
                      <Ticket size={11} /> Listo para ingresar
                    </div>
                    <p className="text-[8px] leading-tight text-slate-400 font-medium px-1">
                      Presentá este QR en portería. Es válido para todo el grupo.
                    </p>
                  </div>
                </aside>

              </div>

              {/* PIE DE TARJETA CON FECHA Y SEDE */}
              <footer className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-slate-150 bg-slate-50 px-6 py-2.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-sky-600" /> {fechaFormateada}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-sky-600" /> {sedeEvento}
                </span>
              </footer>
            </article>
          </div>

          {walletMensaje.texto && (
            <div className={`mx-auto mt-4 max-w-[680px] flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold ${walletMensaje.tipo === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-sky-200 bg-sky-50 text-sky-800'}`}>
              {walletMensaje.tipo === 'error' ? <AlertTriangle size={16} /> : <Info size={16} />}
              <span>{walletMensaje.texto}</span>
            </div>
          )}

          <p className="mx-auto mt-4 max-w-lg text-center text-[11px] leading-relaxed text-slate-400">
            Guardá esta credencial en tu billetera digital o imprimila. El código QR debe verse nítido para la lectura en portería.
          </p>
        </div>

        {/* FOOTER DE BOTONES DE ACCIÓN */}
        <footer className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 border-t border-slate-800 bg-slate-900 p-4 sm:p-5">
          <button 
            id="btn-credencial-google-wallet"
            type="button" 
            onClick={guardarEnGoogleWallet} 
            disabled={cargandoWallet} 
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700 px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-sm"
          >
            {cargandoWallet ? <Loader2 size={16} className="animate-spin text-sky-400" /> : <Wallet size={16} className="text-sky-400" />} 
            <span>Google Wallet</span>
          </button>
          
          <button 
            id="btn-credencial-exportar-pdf"
            type="button" 
            onClick={imprimir} 
            className="flex items-center justify-center gap-2 rounded-2xl bg-sky-600 hover:bg-sky-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition active:scale-[0.98] cursor-pointer shadow-md shadow-sky-600/20"
          >
            <Download size={16} /> <span>Exportar PDF</span>
          </button>
          
          <button 
            type="button" 
            onClick={imprimir} 
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-200 transition active:scale-[0.98] cursor-pointer"
          >
            <Printer size={16} /> <span>Imprimir</span>
          </button>
          
          <button 
            type="button" 
            onClick={onCerrar} 
            className="rounded-2xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition active:scale-[0.98] cursor-pointer text-center"
          >
            Cerrar
          </button>
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
