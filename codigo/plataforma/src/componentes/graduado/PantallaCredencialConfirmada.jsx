import React, { useState } from 'react'
import Image from 'next/image'
import {
  Calendar, MapPin, CheckCircle2, Share2, Copy, Check,
  ExternalLink, LogOut, Edit3, Armchair, Users, Award,
  ScrollText, Sparkles, AlertCircle, Clock, Send, MessageCircle,
  ShieldCheck, HeartHandshake, ArrowRight, UserCheck, GraduationCap,
  Ticket, BookmarkCheck, FileText
} from 'lucide-react'
import { CredencialLanyard3D } from './CredencialLanyard3D'
import { FORMULAS_JURAMENTO } from './SeccionJuramento'

export function PantallaCredencialConfirmada({
  graduado,
  invitados = [],
  entregadores = [],
  profesores = [],
  onCerrarSesion,
  onEditarDatos
}) {
  const [copiado, setCopiado] = useState(false)

  const todosLosAsientos = graduado?.asientos || (graduado?.asiento_id ? [graduado.asiento_id] : [])
  const cantidadInvitados = invitados.length
  
  // Datos de la ceremonia activa
  const rawFecha = graduado?.ceremonia_fecha || graduado?.fecha_evento || '2026-08-27'
  let fechaFormateada = 'Jueves 27 de Agosto de 2026'

  if (rawFecha) {
    try {
      const fechaLimpia = String(rawFecha).includes('T') ? String(rawFecha) : `${String(rawFecha).trim()}T18:00:00`
      const d = new Date(fechaLimpia)
      if (!isNaN(d.getTime())) {
        fechaFormateada = new Intl.DateTimeFormat('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(d)
        fechaFormateada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)
      }
    } catch {}
  }

  const lugarEvento = graduado?.ceremonia_sede || graduado?.ceremonia_lugar || graduado?.sede || 'Auditorio Central · Sede Beltrán'
  const nombreCeremonia = graduado?.ceremonia_nombre || 'Ceremonia de Colación de Grados 2026'
  const formulaJuramento = FORMULAS_JURAMENTO[graduado?.formula_juramento] || FORMULAS_JURAMENTO['PATRIA']

  // Enlace para compartir
  const hostBase = typeof window !== 'undefined' ? window.location.origin : 'https://sigic.beltran.edu.ar'
  const linkCompartir = `${hostBase}/?token=${graduado?.token || ''}`

  const copiarEnlace = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(linkCompartir)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 3000)
    }
  }

  // Calendarios
  const tituloEvento = encodeURIComponent(`Colación Beltrán 2026 - ${graduado?.nombre || 'Graduado'}`)
  const descripcionEvento = encodeURIComponent(`Ceremonia de Colación del Instituto Tecnológico Beltrán.\nGraduado: ${graduado?.nombre}\nCredencial oficial: ${linkCompartir}`)
  const ubicacionEvento = encodeURIComponent(lugarEvento)

  const urlGoogleCalendar = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${tituloEvento}&dates=20260827T210000Z/20260828T000000Z&details=${descripcionEvento}&location=${ubicacionEvento}`
  const urlOutlook = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${tituloEvento}&body=${descripcionEvento}&location=${ubicacionEvento}&startdt=2026-08-27T18:00:00&enddt=2026-08-27T21:00:00`

  // Descarga archivo iCal (.ics)
  const descargarICal = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SiGIC//Instituto Tecnologico Beltran//ES',
      'BEGIN:VEVENT',
      `SUMMARY:Colacion Beltran 2026 - ${graduado?.nombre || 'Graduado'}`,
      `DESCRIPTION:Ceremonia de Colacion Instituto Tecnologico Beltran. Tu credencial: ${linkCompartir}`,
      `LOCATION:${lugarEvento}`,
      'DTSTART:20260827T210000Z',
      'DTEND:20260828T000000Z',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'colacion-beltran-2026.ics')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Compartir por WhatsApp
  const mensajeWhatsApp = encodeURIComponent(
    `Hola! Ya tengo confirmada mi entrada y las de mis acompañantes para el Acto de Colación 2026 en el Instituto Beltrán.\n\nPodes ver nuestra credencial grupal y butacas acá:\n${linkCompartir}`
  )
  const urlWhatsApp = `https://wa.me/?text=${mensajeWhatsApp}`

  // Compartir por Telegram
  const urlTelegram = `https://t.me/share/url?url=${encodeURIComponent(linkCompartir)}&text=${encodeURIComponent('Nuestra credencial para la Colación Beltrán 2026')}`

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-800 font-sans antialiased pb-24 selection:bg-sky-500 selection:text-white">
      {/* ─── BARRA SUPERIOR INSTITUCIONAL CLARA ─── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/90 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 flex items-center justify-center shadow-xs">
            <Image src="/logo-oficial.png" alt="Logo Beltrán" fill className="object-contain p-1" sizes="44px" priority />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#0284C7]">SiGIC</span>
              <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-[#0369A1] border border-sky-200">
                Portal del Graduado
              </span>
            </div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none mt-0.5">
              {graduado?.nombre || 'Graduado'} <span className="text-slate-500 font-medium text-xs hidden sm:inline">· {graduado?.carrera || 'Egresado'}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onEditarDatos && (
            <button
              onClick={onEditarDatos}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/90 transition-all hover:border-sky-400 active:scale-95 cursor-pointer shadow-xs"
            >
              <Edit3 size={14} className="text-[#0284C7]" />
              <span className="hidden sm:inline">Modificar Datos</span>
            </button>
          )}

          {onCerrarSesion && (
            <button
              onClick={onCerrarSesion}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-bold border border-slate-200 hover:border-red-200 transition-all active:scale-95 cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── CONTENEDOR PRINCIPAL BENTO GRID EN MODO CLARO ─── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ── COLUMNA IZQUIERDA: CREDENCIAL 3D LANYARD (5 cols) ── */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center lg:sticky lg:top-24">
            <CredencialLanyard3D
              egresado={{ ...graduado, asientos: todosLosAsientos, invitados }}
              onImprimir={() => window.print()}
            />
          </div>

          {/* ── COLUMNA DERECHA: BENTO DE CONFIRMACIÓN (7 cols) ── */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* CARD 1: ¡TU LUGAR ESTÁ CONFIRMADO! */}
            <div className="p-6 sm:p-8 rounded-[30px] bg-white border border-slate-200/90 shadow-xl shadow-slate-200/60 relative overflow-hidden">
              {/* Suaves halos de fondo */}
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-sky-100/70 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-50/80 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  Acreditación Oficial Confirmada
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2.5">
                    <BookmarkCheck size={28} className="text-[#0284C7] shrink-0" />
                    ¡Tu lugar está confirmado!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                    Tu inscripción oficial y la de tu grupo se encuentran confirmadas en el sistema.
                  </p>
                </div>

                {/* Banner Destacado del Evento */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50/60 to-slate-50 border border-sky-200/80 space-y-2.5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#0369A1]">
                    {nombreCeremonia}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm font-bold text-slate-800">
                    <span className="flex items-center gap-2">
                      <Calendar size={16} className="text-[#0284C7] shrink-0" />
                      {fechaFormateada}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin size={16} className="text-emerald-600 shrink-0" />
                      {lugarEvento}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Enviamos el comprobante a <span className="font-bold text-slate-900">{graduado?.correo || 'tu correo registrado'}</span>. El día del acto, presentá el código QR en pantalla o impreso en portería para ingresar junto a tus acompañantes.
                </p>

                {/* ── AGREGAR AL CALENDARIO ── */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2.5">
                    AGREGAR AL CALENDARIO
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={urlGoogleCalendar}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/90 transition-all active:scale-95 shadow-xs"
                    >
                      <Calendar size={13} className="text-[#0284C7]" />
                      Google Calendar
                    </a>
                    <button
                      onClick={descargarICal}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/90 transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                      <Calendar size={13} className="text-purple-600" />
                      Apple / iCal (.ics)
                    </button>
                    <a
                      href={urlOutlook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/90 transition-all active:scale-95 shadow-xs"
                    >
                      <Calendar size={13} className="text-blue-600" />
                      Outlook
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: RESUMEN DE ASIGNACIÓN PROTOCOLAR */}
            <div className="p-6 rounded-[26px] bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <Users size={15} className="text-[#0284C7]" />
                  Grupo Protocolar ({1 + cantidadInvitados} {1 + cantidadInvitados === 1 ? 'Persona' : 'Personas'})
                </h3>
                {onEditarDatos && (
                  <button
                    onClick={onEditarDatos}
                    className="text-xs font-bold text-[#0284C7] hover:text-[#0369A1] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Editar</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {/* Graduado */}
                <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-[#0284C7] flex items-center justify-center font-bold text-sm shadow-xs">
                      <GraduationCap size={16} className="text-[#0284C7]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{graduado?.nombre}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Graduado · DNI {graduado?.dni || 'S/D'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-sky-200 text-[#0369A1] text-[11px] font-bold shadow-xs">
                      <Armchair size={13} className="text-[#0284C7]" />
                      {graduado?.asiento_id ? `Fila ${graduado.asiento_id.replace('-', ' ')}` : 'Asignada en sala'}
                    </span>
                  </div>
                </div>

                {/* Acompañantes */}
                {invitados.length > 0 ? (
                  invitados.map((inv, idx) => (
                    <div key={inv.id || idx} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{inv.nombre}</p>
                          <p className="text-[10px] text-slate-500">{inv.relacion || 'Acompañante'} · DNI {inv.dni}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11px] font-medium shadow-xs">
                          <Armchair size={13} className="text-slate-400" />
                          {inv.asiento_id ? `Fila ${inv.asiento_id.replace('-', ' ')}` : 'Junto al graduado'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 text-center">Asistencia individual sin acompañantes registrados.</p>
                )}
              </div>

              {/* Padrino & Juramento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
                  <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Award size={13} className="text-amber-500" /> Padrino / Entregador
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {entregadores.length > 0 ? entregadores[0].nombre : 'Autoridad Institucional'}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
                  <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <ScrollText size={13} className="text-[#0284C7]" /> Fórmula de Juramento
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                    {formulaJuramento.titulo}
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 3: COMPARTIR CON TU FAMILIA */}
            <div className="p-6 rounded-[26px] bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <Share2 size={15} className="text-emerald-600" />
                  Compartir Pase con tus Acompañantes
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Enviá este enlace a tus familiares para que lleven el código QR en sus teléfonos:
                </p>
              </div>

              {/* Input copiar enlace */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition-colors">
                <input
                  type="text"
                  readOnly
                  value={linkCompartir}
                  className="w-full bg-transparent px-3 text-xs text-[#0369A1] font-mono font-medium focus:outline-none truncate select-all"
                />
                <button
                  onClick={copiarEnlace}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs transition-all active:scale-95 shrink-0 cursor-pointer shadow-md shadow-sky-600/20"
                >
                  {copiado ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiado ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

              {/* Botones de Redes Sociales / Mensajería */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={urlWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all active:scale-95"
                >
                  <MessageCircle size={16} />
                  <span>Compartir por WhatsApp</span>
                </a>
                <a
                  href={urlTelegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-md shadow-sky-700/20 transition-all active:scale-95"
                >
                  <Send size={15} />
                  <span>Compartir por Telegram</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
