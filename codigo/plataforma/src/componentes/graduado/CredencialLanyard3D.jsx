import React, { useState, useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Download, Printer, Wallet, Sparkles, ShieldCheck,
  Armchair, Users, Award, ExternalLink, Check, Copy, AlertCircle,
  Maximize2
} from 'lucide-react'
import { obtenerGoogleWalletPass } from '../../servicios/api'

export function CredencialLanyard3D({ egresado, onImprimir }) {
  const [rotacion, setRotacion] = useState({ x: 0, y: 0 })
  const [brillo, setBrillo] = useState({ x: 50, y: 50, opacidad: 0 })
  const [estaSobre, setEstaSobre] = useState(false)
  const [cargandoWallet, setCargandoWallet] = useState(false)
  const [mensajeWallet, setMensajeWallet] = useState({ tipo: '', texto: '' })
  const [descargandoPNG, setDescargandoPNG] = useState(false)
  const tarjetaRef = useRef(null)
  const svgQRRef = useRef(null)

  const invitados = egresado?.invitados || []
  const cantidadInvitados = invitados.length
  const todosLosAsientos = egresado?.asientos || (egresado?.asiento_id ? [egresado.asiento_id] : [])
  const asientoPrincipal = egresado?.asiento_id || (todosLosAsientos.length > 0 ? todosLosAsientos[0] : null)

  const rawFecha = egresado?.ceremonia_fecha || egresado?.fecha_evento
  let fechaFormateada = '27 de Agosto de 2026'
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

  // Manejo de física 3D en tiempo real al mover el cursor
  const manejarMouseMove = (e) => {
    if (!tarjetaRef.current) return
    const rect = tarjetaRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotX = ((y - centerY) / centerY) * -14
    const rotY = ((x - centerX) / centerX) * 14

    setRotacion({ x: rotX, y: rotY })
    setBrillo({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacidad: 0.35
    })
  }

  const manejarMouseEnter = () => setEstaSobre(true)
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
        texto: err.message || 'Servicio de Google Wallet en configuración.'
      })
      setTimeout(() => setMensajeWallet({ tipo: '', texto: '' }), 5000)
    } finally {
      setCargandoWallet(false)
    }
  }

  // Generador de imagen PNG en alta definición para descargar al celular
  const descargarCredencialPNG = () => {
    setDescargandoPNG(true)
    try {
      const svg = svgQRRef.current?.querySelector('svg')
      if (!svg) throw new Error('No se encontró el código QR')

      const svgData = new XMLSerializer().serializeToString(svg)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const URLObj = window.URL || window.webkitURL || window
      const blobURL = URLObj.createObjectURL(svgBlob)

      const imgQR = new Image()
      imgQR.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 800
        canvas.height = 1200
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Fondo oscuro institucional con gradiente
        const gradient = ctx.createLinearGradient(0, 0, 800, 1200)
        gradient.addColorStop(0, '#0F172A')
        gradient.addColorStop(0.4, '#111827')
        gradient.addColorStop(1, '#030712')
        ctx.fillStyle = gradient
        ctx.roundRect(0, 0, 800, 1200, 40)
        ctx.fill()

        // Borde neón celeste
        ctx.strokeStyle = '#0EA5E9'
        ctx.lineWidth = 6
        ctx.roundRect(10, 10, 780, 1180, 36)
        ctx.stroke()

        // Encabezado
        ctx.fillStyle = '#38BDF8'
        ctx.font = 'bold 24px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('INSTITUTO TECNOLÓGICO BELTRÁN', 400, 100)

        ctx.fillStyle = '#FFFFFF'
        ctx.font = '900 38px sans-serif'
        ctx.fillText('COLACIÓN DE GRADOS 2026', 400, 150)

        // Nombre del Graduado
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '900 44px sans-serif'
        ctx.fillText(egresado?.nombre || 'Graduado', 400, 240)

        ctx.fillStyle = '#7DD3FC'
        ctx.font = 'bold 26px sans-serif'
        ctx.fillText(carreraNombre, 400, 285)

        if (egresado?.dni) {
          ctx.fillStyle = '#94A3B8'
          ctx.font = '22px monospace'
          ctx.fillText(`DNI: ${egresado.dni}`, 400, 325)
        }

        // Marco blanco para el QR
        ctx.fillStyle = '#FFFFFF'
        ctx.roundRect(175, 370, 450, 450, 28)
        ctx.fill()

        // Dibujar QR
        ctx.drawImage(imgQR, 200, 395, 400, 400)

        // Butaca y Acompañantes
        ctx.fillStyle = '#1E293B'
        ctx.roundRect(80, 860, 300, 110, 20)
        ctx.fill()
        ctx.roundRect(420, 860, 300, 110, 20)
        ctx.fill()

        ctx.fillStyle = '#38BDF8'
        ctx.font = 'bold 20px sans-serif'
        ctx.fillText('BUTACA GRADUADO', 230, 900)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '900 28px sans-serif'
        ctx.fillText(asientoPrincipal ? `Fila ${asientoPrincipal.replace('-', ' ')}` : 'Asignada en sala', 230, 945)

        ctx.fillStyle = '#34D399'
        ctx.font = 'bold 20px sans-serif'
        ctx.fillText('GRUPO INVITADOS', 570, 900)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '900 28px sans-serif'
        ctx.fillText(`${cantidadInvitados} ${cantidadInvitados === 1 ? 'Acompañante' : 'Acompañantes'}`, 570, 945)

        // Pie
        ctx.fillStyle = '#64748B'
        ctx.font = 'bold 18px monospace'
        ctx.fillText(`PASE DIGITAL OFICIAL · SIGIC · ${egresado?.token ? String(egresado.token).slice(0, 10).toUpperCase() : 'OK'}`, 400, 1060)

        // Descarga
        const pngURL = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `Credencial_Beltran_${String(egresado?.nombre || 'Graduado').replace(/\s+/g, '_')}.png`
        link.href = pngURL
        link.click()
        URLObj.revokeObjectURL(blobURL)
        setDescargandoPNG(false)
      }
      imgQR.src = blobURL
    } catch (e) {
      console.error('Error al generar PNG de credencial:', e)
      setDescargandoPNG(false)
    }
  }

  const qrValor = JSON.stringify({
    id: egresado?.id,
    token: egresado?.token,
    dni: egresado?.dni,
    asientos: todosLosAsientos
  })

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[360px]">
      {/* ─── CINTA / LANYARD SUPERIOR COLGANTE ─── */}
      <div className="relative flex flex-col items-center w-full pointer-events-none">
        {/* Cintas en V */}
        <div className="flex justify-center items-start w-40 h-24 -mb-6 relative z-0">
          <div
            className="w-9 h-28 bg-gradient-to-b from-sky-600 via-sky-700 to-slate-900 shadow-xl transform -rotate-12 origin-top rounded-b-sm border-x border-sky-400/40 flex items-center justify-center overflow-hidden"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 6px)' }}
          >
            <span className="text-[8px] font-black text-sky-200/60 uppercase tracking-[0.25em] rotate-90 whitespace-nowrap">
              INSTITUTO BELTRÁN
            </span>
          </div>
          <div
            className="w-9 h-28 bg-gradient-to-b from-sky-600 via-sky-700 to-slate-900 shadow-xl transform rotate-12 origin-top rounded-b-sm border-x border-sky-400/40 -ml-2.5 flex items-center justify-center overflow-hidden"
            style={{ backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 6px)' }}
          >
            <span className="text-[8px] font-black text-sky-200/60 uppercase tracking-[0.25em] -rotate-90 whitespace-nowrap">
              SIGIC · COLACIÓN
            </span>
          </div>
        </div>

        {/* Hebilla metálica & Remache pasante */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-4 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 rounded-sm shadow-md border border-slate-300 flex items-center justify-center">
            <div className="w-8 h-1.5 bg-slate-900/90 rounded-full" />
          </div>
          {/* Gancho mosquetón cromado */}
          <div className="w-6 h-7 bg-gradient-to-b from-slate-300 via-slate-100 to-slate-400 border border-slate-300 rounded-b-lg shadow-md -mt-0.5 flex items-center justify-center">
            <div className="w-2.5 h-3.5 border-2 border-slate-700/80 rounded-b-sm" />
          </div>
        </div>
      </div>

      {/* ─── TARJETA CREDENCIAL 3D INTERACTIVA ─── */}
      <div
        className="w-full pt-1"
        style={{ perspective: '1200px' }}
      >
        <div
          ref={tarjetaRef}
          onMouseMove={manejarMouseMove}
          onMouseEnter={manejarMouseEnter}
          onMouseLeave={manejarMouseLeave}
          className="relative w-full rounded-[30px] overflow-hidden transition-all duration-200 ease-out shadow-2xl cursor-grab active:cursor-grabbing border border-sky-500/40"
          style={{
            transform: `rotateX(${rotacion.x}deg) rotateY(${rotacion.y}deg) ${estaSobre ? 'scale3d(1.025, 1.025, 1.025)' : 'scale3d(1, 1, 1)'}`,
            transformStyle: 'preserve-3d',
            background: 'linear-gradient(165deg, #0F172A 0%, #111827 45%, #030712 100%)',
            boxShadow: estaSobre
              ? '0 30px 70px -15px rgba(14, 165, 233, 0.4), 0 0 50px rgba(14, 165, 233, 0.2)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}
        >
          {/* Capa de Brillo Especular Holográfico */}
          <div
            className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 mix-blend-overlay"
            style={{
              background: `radial-gradient(circle at ${brillo.x}% ${brillo.y}%, rgba(255, 255, 255, 0.95) 0%, rgba(56, 189, 248, 0.45) 30%, transparent 70%)`,
              opacity: brillo.opacidad
            }}
          />

          {/* Ranura del porta-credencial */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-16 h-2 bg-slate-950 border border-slate-700/80 rounded-full shadow-inner" />
          </div>

          {/* ── ENCABEZADO DE LA CREDENCIAL ── */}
          <div className="px-5 pt-2 pb-3.5 flex items-center justify-between border-b border-sky-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/30">
                <Award size={17} className="text-slate-950 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black text-sky-400 tracking-[0.2em] uppercase">INSTITUTO BELTRÁN</p>
                <p className="text-[12px] font-black text-white tracking-wide leading-none mt-0.5">COLACIÓN 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">CONFIRMADO</span>
            </div>
          </div>

          {/* ── CUERPO CON QR Y DATOS ── */}
          <div className="p-5 sm:p-6 flex flex-col items-center text-center">
            {/* Tag de Rol */}
            <div className="mb-2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-300 text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={12} className="text-sky-400" />
              PASE DE GRADUADO
            </div>

            {/* Nombre del Egresado */}
            <h3 className="text-xl font-black text-white tracking-tight leading-tight max-w-[280px]">
              {egresado?.nombre || 'Graduado'}
            </h3>
            <p className="text-xs font-bold text-sky-300/90 mt-1 max-w-[280px] truncate">
              {carreraNombre}
            </p>
            {egresado?.dni && (
              <p className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 tracking-wider">
                DNI {egresado.dni}
              </p>
            )}

            {/* Contenedor del Código QR en Alta Calidad */}
            <div
              ref={svgQRRef}
              className="my-4 relative p-3.5 rounded-2xl bg-white shadow-2xl shadow-black/80 border-2 border-sky-400/50"
            >
              <QRCodeSVG
                value={qrValor}
                size={175}
                level="M"
                includeMargin={false}
                fgColor="#0F172A"
                bgColor="#FFFFFF"
              />
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-slate-900 text-[8.5px] font-mono font-bold text-sky-400 rounded-full border border-sky-500/40 tracking-widest whitespace-nowrap shadow-lg">
                PASE GRUPAL · {1 + cantidadInvitados} {1 + cantidadInvitados === 1 ? 'LUGAR' : 'LUGARES'}
              </div>
            </div>

            {/* Butacas y Grupo */}
            <div className="w-full grid grid-cols-2 gap-2 mt-1">
              <div className="p-2.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 text-left">
                <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <Armchair size={12} className="text-sky-400" /> Butaca
                </span>
                <p className="text-xs font-black text-white truncate mt-1">
                  {asientoPrincipal ? `Fila ${asientoPrincipal.replace('-', ' ')}` : 'Asignada en sala'}
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 text-left">
                <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <Users size={12} className="text-emerald-400" /> Acompañantes
                </span>
                <p className="text-xs font-black text-white truncate mt-1">
                  {cantidadInvitados} {cantidadInvitados === 1 ? 'familiar' : 'familiares'}
                </p>
              </div>
            </div>

            {/* Pie de Seguridad */}
            <div className="mt-3.5 pt-3 w-full border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
              <span className="flex items-center gap-1.5 font-bold">
                <ShieldCheck size={13} className="text-sky-400" /> QR Oficial SiGIC
              </span>
              <span className="font-mono text-slate-400 text-[8.5px] font-bold">
                {egresado?.token ? `TK-${String(egresado.token).slice(0, 8).toUpperCase()}` : 'VERIFICADO'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTONES DE ACCIÓN RÁPIDA DEBAJO DE LA TARJETA ─── */}
      <div className="w-full mt-5 space-y-2.5">
        <p className="text-[11px] font-bold text-slate-400 text-center">
          Guardá tu credencial en el teléfono
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
          <button
            onClick={descargarCredencialPNG}
            disabled={descargandoPNG}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            {descargandoPNG ? (
              <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={13} className="text-sky-400" />
            )}
            <span>Guardar PNG</span>
          </button>
          
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
