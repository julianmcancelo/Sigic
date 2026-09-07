import React, { useState, useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Download, Printer, Wallet, Sparkles, ShieldCheck,
  Armchair, Users, Award, ExternalLink, Check, Copy, AlertCircle
} from 'lucide-react'
import { obtenerGoogleWalletPass } from '../../servicios/api'

export function CredencialLanyard3D({ egresado, onDescargarPNG, onImprimir }) {
  const [rotacion, setRotacion] = useState({ x: 0, y: 0 })
  const [brillo, setBrillo] = useState({ x: 50, y: 50, opacidad: 0 })
  const [estaSobre, setEstaSobre] = useState(false)
  const [cargandoWallet, setCargandoWallet] = useState(false)
  const [mensajeWallet, setMensajeWallet] = useState({ tipo: '', texto: '' })
  const tarjetaRef = useRef(null)

  const invitados = egresado?.invitados || []
  const cantidadInvitados = invitados.length
  const todosLosAsientos = egresado?.asientos || (egresado?.asiento_id ? [egresado.asiento_id] : [])
  const asientoPrincipal = egresado?.asiento_id || (todosLosAsientos.length > 0 ? todosLosAsientos[0] : null)

  const rawFecha = egresado?.ceremonia_fecha || egresado?.fecha_evento
  let fechaFormateada = 'Fecha a confirmar'
  if (rawFecha) {
    try {
      const fechaLimpia = String(rawFecha).includes('T') ? String(rawFecha) : `${String(rawFecha).trim()}T12:00:00`
      const d = new Date(fechaLimpia)
      if (!isNaN(d.getTime())) {
        fechaFormateada = new Intl.DateTimeFormat('es-AR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }).format(d)
      }
    } catch {}
  }

  const carreraNombre = egresado?.carrera || 'Graduado Institucional'

  // Manejo de física 3D al mover el mouse sobre la tarjeta
  const manejarMouseMove = (e) => {
    if (!tarjetaRef.current) return
    const rect = tarjetaRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Calcular ángulos de rotación (-14 a +14 grados)
    const rotX = ((y - centerY) / centerY) * -12
    const rotY = ((x - centerX) / centerX) * 12

    setRotacion({ x: rotX, y: rotY })
    setBrillo({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacidad: 0.28
    })
  }

  const manejarMouseEnter = () => {
    setEstaSobre(true)
  }

  const manejarMouseLeave = () => {
    setEstaSobre(false)
    setRotacion({ x: 0, y: 0 })
    setBrillo({ x: 50, y: 50, opacidad: 0 })
  }

  const guardarEnGoogleWallet = async () => {
    if (egresado?.google_wallet_url) {
      window.open(egresado.google_wallet_url, '_blank')
      return
    }
    setCargandoWallet(true)
    setMensajeWallet({ tipo: '', texto: '' })
    try {
      const respuesta = await obtenerGoogleWalletPass(egresado.id)
      if (respuesta?.url) {
        window.open(respuesta.url, '_blank')
      } else {
        throw new Error('No se pudo generar el pase de Google Wallet')
      }
    } catch (err) {
      setMensajeWallet({
        tipo: 'error',
        texto: err.message || 'Servicio de Google Wallet no configurado temporalmente.'
      })
      setTimeout(() => setMensajeWallet({ tipo: '', texto: '' }), 5000)
    } finally {
      setCargandoWallet(false)
    }
  }

  const qrValor = JSON.stringify({
    id: egresado?.id,
    token: egresado?.token,
    dni: egresado?.dni,
    asientos: todosLosAsientos
  })

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* ─── CINTA / LANYARD SUPERIOR COLGANTE ─── */}
      <div className="relative flex flex-col items-center w-full max-w-[340px] pointer-events-none">
        {/* Cintas en V */}
        <div className="flex justify-center items-start w-36 h-20 -mb-5 relative z-0">
          <div
            className="w-8 h-24 bg-gradient-to-b from-sky-700 via-sky-600 to-slate-900 shadow-md transform -rotate-12 origin-top rounded-b-sm border-x border-sky-400/30 flex items-center justify-center overflow-hidden"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 6px)' }}
          >
            <span className="text-[7px] font-black text-sky-200/40 uppercase tracking-widest rotate-90 whitespace-nowrap">
              BELTRAN
            </span>
          </div>
          <div
            className="w-8 h-24 bg-gradient-to-b from-sky-700 via-sky-600 to-slate-900 shadow-md transform rotate-12 origin-top rounded-b-sm border-x border-sky-400/30 -ml-2 flex items-center justify-center overflow-hidden"
            style={{ backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 6px)' }}
          >
            <span className="text-[7px] font-black text-sky-200/40 uppercase tracking-widest -rotate-90 whitespace-nowrap">
              SIGIC 2026
            </span>
          </div>
        </div>

        {/* Hebilla metálica & Remache */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-11 h-4 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-sm shadow-md border border-slate-300/80 flex items-center justify-center">
            <div className="w-7 h-1.5 bg-slate-800/80 rounded-full" />
          </div>
          {/* Gancho mosquetón metálico */}
          <div className="w-5 h-6 bg-gradient-to-b from-slate-300 via-slate-100 to-slate-400 border border-slate-300 rounded-b-md shadow-sm -mt-0.5 flex items-center justify-center">
            <div className="w-2 h-3 border-2 border-slate-600/70 rounded-b-sm" />
          </div>
        </div>
      </div>

      {/* ─── TARJETA CREDENCIAL 3D ─── */}
      <div
        className="w-full max-w-[340px] pt-1"
        style={{ perspective: '1200px' }}
      >
        <div
          ref={tarjetaRef}
          onMouseMove={manejarMouseMove}
          onMouseEnter={manejarMouseEnter}
          onMouseLeave={manejarMouseLeave}
          className="relative w-full rounded-[28px] overflow-hidden transition-all duration-200 ease-out shadow-2xl cursor-grab active:cursor-grabbing"
          style={{
            transform: `rotateX(${rotacion.x}deg) rotateY(${rotacion.y}deg) ${estaSobre ? 'scale3d(1.02, 1.02, 1.02)' : 'scale3d(1, 1, 1)'}`,
            transformStyle: 'preserve-3d',
            background: 'linear-gradient(165deg, #111827 0%, #0F172A 40%, #030712 100%)',
            boxShadow: estaSobre
              ? '0 25px 60px -15px rgba(14, 165, 233, 0.35), 0 0 40px rgba(14, 165, 233, 0.15)'
              : '0 20px 45px -10px rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(56, 189, 248, 0.35)'
          }}
        >
          {/* Capa de Brillo Especular Holográfico */}
          <div
            className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 mix-blend-overlay"
            style={{
              background: `radial-gradient(circle at ${brillo.x}% ${brillo.y}%, rgba(255, 255, 255, 0.9) 0%, rgba(56, 189, 248, 0.4) 30%, transparent 70%)`,
              opacity: brillo.opacidad
            }}
          />

          {/* Ranura superior del porta-credencial */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-16 h-2 bg-slate-950/80 border border-slate-700/60 rounded-full shadow-inner" />
          </div>

          {/* ── ENCABEZADO DE LA CREDENCIAL ── */}
          <div className="px-6 pt-2 pb-3 flex items-center justify-between border-b border-sky-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center shadow-md shadow-sky-500/30">
                <Award size={15} className="text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[9px] font-black text-sky-400 tracking-[0.2em] uppercase">INSTITUTO BELTRÁN</p>
                <p className="text-[11px] font-black text-white tracking-wide leading-none mt-0.5">COLACIÓN 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-300 uppercase tracking-wider">CONFIRMADO</span>
            </div>
          </div>

          {/* ── CUERPO CON QR Y DATOS ── */}
          <div className="p-6 flex flex-col items-center text-center">
            {/* Tag de Rol */}
            <div className="mb-2.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={11} className="text-sky-400" />
              PASE DE GRADUADO
            </div>

            {/* Nombre del Egresado */}
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight max-w-[260px] line-clamp-2">
              {egresado?.nombre || 'Graduado'}
            </h3>
            <p className="text-xs font-bold text-sky-300/80 mt-1 max-w-[260px] truncate">
              {carreraNombre}
            </p>
            {egresado?.dni && (
              <p className="text-[10px] font-mono text-slate-400 mt-0.5 tracking-wider">
                DNI {egresado.dni}
              </p>
            )}

            {/* Contenedor del Código QR */}
            <div className="my-5 relative p-3 rounded-2xl bg-white shadow-xl shadow-black/50 border-2 border-sky-400/40">
              <QRCodeSVG
                value={qrValor}
                size={168}
                level="M"
                includeMargin={false}
                fgColor="#0F172A"
                bgColor="#FFFFFF"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-slate-900 text-[8px] font-mono font-bold text-sky-400 rounded-full border border-sky-500/30 tracking-widest whitespace-nowrap shadow-md">
                PASE GRUPAL · {1 + cantidadInvitados} {1 + cantidadInvitados === 1 ? 'LUGAR' : 'LUGARES'}
              </div>
            </div>

            {/* Badge de Ubicación y Butaca */}
            <div className="w-full grid grid-cols-2 gap-2 mt-1">
              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-left">
                <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <Armchair size={11} className="text-sky-400" /> Butaca
                </span>
                <p className="text-xs font-black text-white truncate mt-0.5">
                  {asientoPrincipal ? `Fila ${asientoPrincipal.replace('-', ' ')}` : 'Asignada en sala'}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-left">
                <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <Users size={11} className="text-emerald-400" /> Acompañantes
                </span>
                <p className="text-xs font-black text-white truncate mt-0.5">
                  {cantidadInvitados} {cantidadInvitados === 1 ? 'familiar' : 'familiares'}
                </p>
              </div>
            </div>

            {/* Pie de Seguridad */}
            <div className="mt-4 pt-3 w-full border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
              <span className="flex items-center gap-1 font-bold">
                <ShieldCheck size={12} className="text-sky-400" /> QR Oficial SiGIC
              </span>
              <span className="font-mono text-slate-400 text-[8px]">
                {egresado?.token ? `TK-${String(egresado.token).slice(0, 8).toUpperCase()}` : 'VERIFICADO'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTONES DE ACCIÓN RÁPIDA DEBAJO DE LA TARJETA ─── */}
      <div className="w-full max-w-[340px] mt-5 space-y-2">
        <p className="text-[11px] font-bold text-slate-400 text-center mb-1">
          Llevá tu credencial en el teléfono
        </p>

        {/* Botón Google Wallet */}
        <button
          onClick={guardarEnGoogleWallet}
          disabled={cargandoWallet}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs border border-slate-700/80 shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          {cargandoWallet ? (
            <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Wallet size={16} className="text-sky-400" />
          )}
          <span>{egresado?.google_wallet_url ? 'Ver en Google Wallet' : 'Añadir a Google Wallet'}</span>
        </button>

        {/* Botones de Descarga e Impresión */}
        <div className="grid grid-cols-2 gap-2">
          {onDescargarPNG && (
            <button
              onClick={onDescargarPNG}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <Download size={13} className="text-sky-400" />
              <span>Guardar PNG</span>
            </button>
          )}
          {onImprimir && (
            <button
              onClick={onImprimir}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <Printer size={13} className="text-slate-300" />
              <span>Imprimir Pase</span>
            </button>
          )}
        </div>

        {mensajeWallet.texto && (
          <div className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
            mensajeWallet.tipo === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
          }`}>
            <AlertCircle size={13} />
            <span>{mensajeWallet.texto}</span>
          </div>
        )}
      </div>
    </div>
  )
}
