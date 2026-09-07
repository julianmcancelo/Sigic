import React, { useState, useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Download, Printer, Wallet, ShieldCheck,
  Armchair, Users, Award, Check, AlertCircle,
  GraduationCap, Sparkles, QrCode, Lock, BadgeCheck
} from 'lucide-react'
import { obtenerGoogleWalletPass } from '../../servicios/api'

export function CredencialLanyard3D({ egresado, onImprimir }) {
  const [rotacion, setRotacion] = useState({ x: 0, y: 0, z: 0 })
  const [brillo, setBrillo] = useState({ x: 50, y: 50, opacidad: 0 })
  const [estaSobre, setEstaSobre] = useState(false)
  const [cargandoWallet, setCargandoWallet] = useState(false)
  const [mensajeWallet, setMensajeWallet] = useState({ tipo: '', texto: '' })
  const [descargandoPNG, setDescargandoPNG] = useState(false)

  const tarjetaRef = useRef(null)
  const svgQRRef = useRef(null)
  const animFrameRef = useRef(null)
  const tiempoRef = useRef(0)

  // Físicas de resorte (Spring Physics)
  const posObjetivo = useRef({ rotX: 0, rotY: 0, rotZ: 0, cintaTilt: 0 })
  const posActual = useRef({ rotX: 0, rotY: 0, rotZ: 0, cintaTilt: 0 })

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

  // Bucle de animación continua con oscilación pendular natural y resorte reactivo
  useEffect(() => {
    let activo = true

    const loopAnimacion = () => {
      if (!activo) return
      tiempoRef.current += 0.025

      // Si no hay hover, genera un balanceo pendular orgánico suave
      if (!estaSobre) {
        const oscilacionX = Math.sin(tiempoRef.current * 0.8) * 3
        const oscilacionY = Math.cos(tiempoRef.current * 0.6) * 4.5
        const oscilacionZ = Math.sin(tiempoRef.current * 0.5) * 1.5
        const oscilacionCinta = Math.sin(tiempoRef.current * 0.6) * 3

        posObjetivo.current = {
          rotX: oscilacionX,
          rotY: oscilacionY,
          rotZ: oscilacionZ,
          cintaTilt: oscilacionCinta
        }
      }

      // Interpolación exponencial (Lerp) de alta respuesta
      const amortiguacion = estaSobre ? 0.12 : 0.06
      posActual.current.rotX += (posObjetivo.current.rotX - posActual.current.rotX) * amortiguacion
      posActual.current.rotY += (posObjetivo.current.rotY - posActual.current.rotY) * amortiguacion
      posActual.current.rotZ += (posObjetivo.current.rotZ - posActual.current.rotZ) * amortiguacion
      posActual.current.cintaTilt += (posObjetivo.current.cintaTilt - posActual.current.cintaTilt) * amortiguacion

      setRotacion({
        x: Number(posActual.current.rotX.toFixed(2)),
        y: Number(posActual.current.rotY.toFixed(2)),
        z: Number(posActual.current.rotZ.toFixed(2)),
        cintaTilt: Number(posActual.current.cintaTilt.toFixed(2))
      })

      animFrameRef.current = requestAnimationFrame(loopAnimacion)
    }

    animFrameRef.current = requestAnimationFrame(loopAnimacion)
    return () => {
      activo = false
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [estaSobre])

  // Manejador del movimiento interactivo del cursor
  const manejarMouseMove = (e) => {
    if (!tarjetaRef.current) return
    const rect = tarjetaRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Ángulos de inclinación basados en la distancia al centro
    const rotX = Math.max(-18, Math.min(18, ((y - centerY) / centerY) * -16))
    const rotY = Math.max(-20, Math.min(20, ((x - centerX) / centerX) * 18))
    const rotZ = Math.max(-5, Math.min(5, ((x - centerX) / centerX) * 3))
    const cintaTilt = Math.max(-8, Math.min(8, ((x - centerX) / centerX) * 6))

    posObjetivo.current = { rotX, rotY, rotZ, cintaTilt }

    setBrillo({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacidad: 0.55
    })
  }

  const manejarMouseEnter = () => setEstaSobre(true)
  const manejarMouseLeave = () => {
    setEstaSobre(false)
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

  // Generador de imagen PNG HD de la credencial
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

        // Fondo oscuro institucional de alta gama
        const gradient = ctx.createLinearGradient(0, 0, 800, 1200)
        gradient.addColorStop(0, '#07101E')
        gradient.addColorStop(0.5, '#0E1F3D')
        gradient.addColorStop(1, '#050A14')
        ctx.fillStyle = gradient
        ctx.roundRect(0, 0, 800, 1200, 44)
        ctx.fill()

        // Borde dorado/celeste institucional
        ctx.strokeStyle = '#0284C7'
        ctx.lineWidth = 6
        ctx.roundRect(14, 14, 772, 1172, 38)
        ctx.stroke()

        // Encabezado
        ctx.fillStyle = '#38BDF8'
        ctx.font = 'bold 22px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('INSTITUTO TECNOLÓGICO BELTRÁN', 400, 95)

        ctx.fillStyle = '#FFFFFF'
        ctx.font = '900 36px sans-serif'
        ctx.fillText('COLACIÓN DE GRADOS 2026', 400, 145)

        // Nombre del Graduado
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '900 42px sans-serif'
        ctx.fillText(egresado?.nombre || 'Graduado', 400, 235)

        ctx.fillStyle = '#7DD3FC'
        ctx.font = 'bold 26px sans-serif'
        ctx.fillText(carreraNombre, 400, 280)

        if (egresado?.dni) {
          ctx.fillStyle = '#94A3B8'
          ctx.font = '22px monospace'
          ctx.fillText(`DNI: ${egresado.dni}`, 400, 320)
        }

        // Marco QR
        ctx.fillStyle = '#FFFFFF'
        ctx.roundRect(175, 360, 450, 450, 28)
        ctx.fill()

        // Dibujar QR
        ctx.drawImage(imgQR, 200, 385, 400, 400)

        // Butacas
        ctx.fillStyle = '#1E293B'
        ctx.roundRect(80, 850, 300, 110, 20)
        ctx.fill()
        ctx.roundRect(420, 850, 300, 110, 20)
        ctx.fill()

        ctx.fillStyle = '#38BDF8'
        ctx.font = 'bold 19px sans-serif'
        ctx.fillText('BUTACA GRADUADO', 230, 890)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '900 26px sans-serif'
        ctx.fillText(asientoPrincipal ? `Fila ${asientoPrincipal.replace('-', ' ')}` : 'Asignada en sala', 230, 935)

        ctx.fillStyle = '#34D399'
        ctx.font = 'bold 19px sans-serif'
        ctx.fillText('GRUPO INVITADOS', 570, 890)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '900 26px sans-serif'
        ctx.fillText(`${cantidadInvitados} ${cantidadInvitados === 1 ? 'Acompañante' : 'Acompañantes'}`, 570, 935)

        // Pie
        ctx.fillStyle = '#64748B'
        ctx.font = 'bold 17px monospace'
        ctx.fillText(`PASE DIGITAL OFICIAL · SIGIC · ${egresado?.token ? String(egresado.token).slice(0, 10).toUpperCase() : 'OK'}`, 400, 1060)

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
      console.error('Error al generar PNG:', e)
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
      
      {/* ─── CONTENEDOR MAESTRO DE SUSPENSIÓN CON FÍSICA REALISTA ─── */}
      <div
        className="w-full flex flex-col items-center origin-top transition-transform duration-75 ease-out"
        style={{
          perspective: '1200px',
          transformStyle: 'preserve-3d',
          transform: `rotateZ(${(rotacion.cintaTilt || 0) * 0.4}deg)`
        }}
      >

        {/* ─── CINTA / LANYARD SUPERIOR REALISTA EN V DE TELA SATINADA ─── */}
        <div
          className="relative flex flex-col items-center w-full pointer-events-none -mb-3.5 z-20 origin-top"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${(rotacion.y || 0) * 0.35}deg)`
          }}
        >
          {/* Cintas en V */}
          <div className="relative flex justify-center items-start w-56 h-36 overflow-visible">
            {/* Cinta izquierda */}
            <div
              className="w-12 h-40 bg-gradient-to-b from-[#020712] via-[#061426] to-[#0A1C33] shadow-2xl transform -rotate-12 origin-top rounded-b-sm border-l-2 border-r-2 border-slate-700/80 flex items-center justify-center relative overflow-hidden"
              style={{
                boxShadow: '0 16px 35px -5px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(0, 0, 0, 0.8)',
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.09) 2px, transparent 2px, transparent 5px)'
              }}
            >
              <div className="flex items-center gap-1.5 rotate-90 whitespace-nowrap">
                <span className="text-[8.5px] font-black text-sky-200 uppercase tracking-[0.25em] drop-shadow-md">
                  INSTITUTO BELTRÁN
                </span>
              </div>
            </div>

            {/* Cinta derecha */}
            <div
              className="w-12 h-40 bg-gradient-to-b from-[#020712] via-[#061426] to-[#0A1C33] shadow-2xl transform rotate-12 origin-top rounded-b-sm border-l-2 border-r-2 border-slate-700/80 -ml-4 flex items-center justify-center relative overflow-hidden"
              style={{
                boxShadow: '0 16px 35px -5px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(0, 0, 0, 0.8)',
                backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.09) 2px, transparent 2px, transparent 5px)'
              }}
            >
              <div className="flex items-center gap-1.5 -rotate-90 whitespace-nowrap">
                <span className="text-[8.5px] font-black text-sky-200 uppercase tracking-[0.25em] drop-shadow-md">
                  SIGIC · COLACIÓN
                </span>
              </div>
            </div>
          </div>

          {/* ── HERRAJE DE UNIÓN Y MOSQUETÓN METÁLICO CROMADO ── */}
          <div className="relative -mt-6 z-30 flex flex-col items-center">
            {/* Pasador de acero con remaches dobles */}
            <div className="w-14 h-5 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 rounded-sm shadow-xl border border-slate-300 flex items-center justify-around px-2">
              <div className="w-2 h-2 bg-slate-700 rounded-full shadow-inner border border-slate-400" />
              <div className="w-2 h-2 bg-slate-700 rounded-full shadow-inner border border-slate-400" />
            </div>
            
            {/* Anilla articulada giratoria */}
            <div className="w-4 h-4 rounded-full border-2 border-slate-400 bg-gradient-to-b from-slate-200 to-slate-400 shadow-sm -mt-0.5" />
            
            {/* Mosquetón cromado de enganche */}
            <div className="w-6 h-8 bg-gradient-to-b from-slate-200 via-white to-slate-400 border-2 border-slate-400 rounded-b-xl shadow-lg -mt-1 flex flex-col items-center justify-end pb-1">
              <div className="w-2.5 h-4 border-2 border-slate-700 rounded-b-md" />
            </div>
          </div>
        </div>

        {/* ─── TARJETA CREDENCIAL 3D INTERACTIVA CON PARALLAX ─── */}
        <div
          className="w-full pt-1"
          style={{
            perspective: '1400px',
            transformOrigin: 'top center'
          }}
        >
          <div
            ref={tarjetaRef}
            onMouseMove={manejarMouseMove}
            onMouseEnter={manejarMouseEnter}
            onMouseLeave={manejarMouseLeave}
            className="relative w-full rounded-[32px] overflow-hidden transition-all duration-150 ease-out shadow-2xl cursor-grab active:cursor-grabbing border-2 border-sky-400/50"
            style={{
              transform: `rotateX(${rotacion.x}deg) rotateY(${rotacion.y}deg) rotateZ(${rotacion.z}deg) ${estaSobre ? 'scale3d(1.03, 1.03, 1.03)' : 'scale3d(1, 1, 1)'}`,
              transformStyle: 'preserve-3d',
              background: 'linear-gradient(160deg, #0A162B 0%, #0F2344 40%, #040913 100%)',
              boxShadow: estaSobre
                ? '0 35px 80px -15px rgba(2, 132, 199, 0.45), 0 0 45px rgba(14, 165, 233, 0.25)'
                : '0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 10px 20px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* Capa de Brillo Holográfico Especular Reactivo */}
            <div
              className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 mix-blend-overlay"
              style={{
                background: `radial-gradient(circle at ${brillo.x}% ${brillo.y}%, rgba(255, 255, 255, 0.95) 0%, rgba(56, 189, 248, 0.5) 28%, transparent 68%)`,
                opacity: brillo.opacidad
              }}
            />

            {/* Ranura del porta-credencial con marco metálico */}
            <div className="flex justify-center pt-3 pb-1" style={{ transform: 'translateZ(12px)' }}>
              <div className="w-16 h-2.5 bg-slate-950 border-2 border-slate-600 rounded-full shadow-inner flex items-center justify-center">
                <div className="w-12 h-1 bg-black rounded-full" />
              </div>
            </div>

            {/* ── ENCABEZADO DE LA CREDENCIAL (Capa Parallax 1) ── */}
            <div className="px-5 pt-2 pb-3.5 flex items-center justify-between border-b border-sky-500/25" style={{ transform: 'translateZ(20px)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-cyan-300 flex items-center justify-center shadow-lg shadow-sky-500/30">
                  <GraduationCap size={17} className="text-slate-950 stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black text-sky-300 tracking-[0.2em] uppercase">INSTITUTO BELTRÁN</p>
                  <p className="text-[12px] font-black text-white tracking-wide leading-none mt-0.5">COLACIÓN 2026</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">CONFIRMADO</span>
              </div>
            </div>

            {/* ── CUERPO CON QR Y DATOS (Capa Parallax 2) ── */}
            <div className="p-5 sm:p-6 flex flex-col items-center text-center" style={{ transform: 'translateZ(30px)' }}>
              {/* Tag de Rol */}
              <div className="mb-2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-500/20 border border-sky-400/50 text-sky-200 text-[10px] font-black uppercase tracking-widest shadow-sm">
                <BadgeCheck size={12} className="text-sky-300" />
                PASE DE GRADUADO
              </div>

              {/* Nombre del Egresado */}
              <h3 className="text-xl font-black text-white tracking-tight leading-tight max-w-[280px] drop-shadow-md">
                {egresado?.nombre || 'Graduado'}
              </h3>
              <p className="text-xs font-bold text-sky-200 mt-1 max-w-[280px] truncate">
                {carreraNombre}
              </p>
              {egresado?.dni && (
                <p className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 tracking-wider">
                  DNI {egresado.dni}
                </p>
              )}

              {/* Contenedor del Código QR Flotante (Capa Parallax 3) */}
              <div
                ref={svgQRRef}
                className="my-4 relative p-3.5 rounded-2xl bg-white shadow-2xl shadow-black/70 border-2 border-sky-400/60"
                style={{ transform: 'translateZ(25px)' }}
              >
                <QRCodeSVG
                  value={qrValor}
                  size={175}
                  level="M"
                  includeMargin={false}
                  fgColor="#0F172A"
                  bgColor="#FFFFFF"
                />
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-slate-900 text-[8.5px] font-mono font-bold text-sky-300 rounded-full border border-sky-400/50 tracking-widest whitespace-nowrap shadow-lg flex items-center gap-1.5">
                  <QrCode size={11} className="text-sky-400" />
                  PASE GRUPAL · {1 + cantidadInvitados} {1 + cantidadInvitados === 1 ? 'LUGAR' : 'LUGARES'}
                </div>
              </div>

              {/* Butacas y Grupo */}
              <div className="w-full grid grid-cols-2 gap-2 mt-1" style={{ transform: 'translateZ(15px)' }}>
                <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-sky-500/30 text-left shadow-md">
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-sky-300 uppercase tracking-wider">
                    <Armchair size={12} className="text-sky-400" /> Butaca
                  </span>
                  <p className="text-xs font-black text-white truncate mt-1">
                    {asientoPrincipal ? `Fila ${asientoPrincipal.replace('-', ' ')}` : 'Asignada en sala'}
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 text-left shadow-md">
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
                    <Users size={12} className="text-emerald-400" /> Acompañantes
                  </span>
                  <p className="text-xs font-black text-white truncate mt-1">
                    {cantidadInvitados} {cantidadInvitados === 1 ? 'familiar' : 'familiares'}
                  </p>
                </div>
              </div>

              {/* Pie de Seguridad */}
              <div className="mt-3.5 pt-3 w-full border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400" style={{ transform: 'translateZ(10px)' }}>
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <ShieldCheck size={13} className="text-sky-400" /> QR Oficial SiGIC
                </span>
                <span className="font-mono text-sky-300 text-[8.5px] font-bold">
                  {egresado?.token ? `TK-${String(egresado.token).slice(0, 8).toUpperCase()}` : 'VERIFICADO'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ─── BOTONES DE ACCIÓN RÁPIDA DEBAJO DE LA TARJETA ─── */}
      <div className="w-full mt-5 space-y-2.5">
        <p className="text-[11px] font-bold text-slate-500 text-center">
          Guardá tu credencial en el teléfono
        </p>

        {/* Botón Google Wallet */}
        <button
          onClick={guardarEnGoogleWallet}
          disabled={cargandoWallet}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs border border-slate-200 shadow-md transition-all active:scale-[0.98] cursor-pointer hover:border-sky-400"
        >
          {cargandoWallet ? (
            <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Wallet size={16} className="text-sky-600" />
          )}
          <span>{egresado?.google_wallet_url ? 'Ver en Google Wallet' : 'Añadir a Google Wallet'}</span>
        </button>

        {/* Botones de Descarga e Impresión */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={descargarCredencialPNG}
            disabled={descargandoPNG}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition-all active:scale-95 cursor-pointer hover:text-sky-600 hover:border-sky-300"
          >
            {descargandoPNG ? (
              <div className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={13} className="text-sky-500" />
            )}
            <span>Guardar PNG</span>
          </button>
          
          <button
            onClick={onImprimir}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition-all active:scale-95 cursor-pointer hover:text-slate-900"
          >
            <Printer size={13} className="text-slate-500" />
            <span>Imprimir Pase</span>
          </button>
        </div>

        {mensajeWallet.texto && (
          <div className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
            mensajeWallet.tipo === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}>
            <AlertCircle size={13} />
            <span>{mensajeWallet.texto}</span>
          </div>
        )}
      </div>
    </div>
  )
}
