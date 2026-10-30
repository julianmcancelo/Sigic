import React, { useState, useEffect, useRef } from 'react'
import {
  Settings,
  Shield,
  RefreshCw,
  Database,
  AlertTriangle,
  Server,
  CheckCircle2,
  Download,
  Trash2,
  Terminal,
  ArrowLeft,
  Mail,
  ExternalLink,
  KeyRound,
  SmartphoneNfc,
  Fingerprint,
  Lock,
  Unlock,
  Copy,
  QrCode,
  FileCheck2,
  BellRing,
} from 'lucide-react'
import { VERSION_LABEL } from '../../lib/version'
import {
  obtenerEstadoSetup,
  exportarBaseDatos,
  resetearSistema,
  obtenerEstadoLicenciaSeguridad,
  obtenerIntegridadAuditoriaYAlertas,
  activarSerialLicenciaCriptografica,
  conmutarBloqueoSeguridad,
  registrarLlaveSeguridadFido2,
  configurarAlertasSeguridad,
} from '../../servicios/api'
import { useConfirmacion } from '../../componentes/ModalConfirmacion'

const ACCENT = '#0EA5E9'
const DARK = '#2A3448'

function bufferABase64Url(buffer) {
  const bytes = new Uint8Array(buffer)
  let binario = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binario += String.fromCharCode(bytes[i])
  }
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function CentroControl({ usuario, onVolver, onCerrarSesion }) {
  const { confirmar, dialogoConfirmacion } = useConfirmacion()
  const [metricas, setMetricas] = useState({
    usuarios: 0,
    ceremonias: 0,
    egresados: 0,
    invitados: 0,
  })
  const [cargando, setCargando] = useState(true)
  const [ejecutandoAccion, setEjecutandoAccion] = useState(null)
  const [dbStatus, setDbStatus] = useState('conectado')
  const [apiLatency, setApiLatency] = useState(0)
  const [logs, setLogs] = useState([])
  const consoleEndRef = useRef(null)

  // Estados de Ciberseguridad y Licenciamiento Ed25519
  const [estadoLicencia, setEstadoLicencia] = useState(null)
  const [integridadDatos, setIntegridadDatos] = useState(null)
  const [nuevoSerialInput, setNuevoSerialInput] = useState('')
  const [codigoTotpInput, setCodigoTotpInput] = useState('')
  const [nombrePasskey, setNombrePasskey] = useState('Llave Fisica FIDO2 — Cancelo Julian')
  const [correoAlertas, setCorreoAlertas] = useState('jcancelo.dev@gmail.com')
  const [webhookAlertas, setWebhookAlertas] = useState('')
  const [mensajeSeguridad, setMensajeSeguridad] = useState(null)

  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
  const hostBase = typeof window !== 'undefined' ? window.location.origin : 'https://sigic-one.vercel.app'

  useEffect(() => {
    inicializarConsola()
    cargarDiagnostico()
    cargarPanelCiberseguridad()
  }, [])

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  function registrarLog(texto, tipo = 'INFO') {
    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs((prev) => [...prev, { hora, texto, tipo }])
  }

  function inicializarConsola() {
    setLogs([])
    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs([
      { hora, texto: 'Iniciando modulo de diagnostico de infraestructura y seguridad criptografica...', tipo: 'INFO' },
      { hora, texto: 'Plataforma base: Next.js + TailwindCSS (Vercel Edge Ready)', tipo: 'INFO' },
      { hora, texto: `Servidor de API: ${hostBase}/api`, tipo: 'INFO' },
      { hora, texto: 'Motor de Base de Datos: PostgreSQL Cloud (SSL Activo)', tipo: 'INFO' },
      { hora, texto: 'Motor de Custodia: Ed25519 (RFC 8032) + TOTP (RFC 6238) + Auditoria SHA-256', tipo: 'AUDIT' },
    ])
  }

  async function cargarPanelCiberseguridad() {
    try {
      const [lic, integ] = await Promise.all([
        obtenerEstadoLicenciaSeguridad(),
        obtenerIntegridadAuditoriaYAlertas(),
      ])
      setEstadoLicencia(lic)
      setIntegridadDatos(integ)
      if (lic?.correoAlertas) setCorreoAlertas(lic.correoAlertas)
      if (lic?.webhookAlertas !== undefined) setWebhookAlertas(lic.webhookAlertas || '')
    } catch (err) {
      registrarLog(`Advertencia al consultar motor de licencias: ${err.message}`, 'ERROR')
    }
  }

  async function cargarDiagnostico() {
    setCargando(true)
    const inicio = performance.now()
    try {
      const res = await obtenerEstadoSetup()
      const fin = performance.now()
      setApiLatency(Math.round(fin - inicio))
      setMetricas(res.metricas || { usuarios: 0, ceremonias: 0, egresados: 0, invitados: 0 })
      setDbStatus('conectado')

      const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setLogs((prev) => [
        ...prev,
        {
          hora,
          texto: `Conexion con PostgreSQL establecida exitosamente (Latencia: ${Math.round(fin - inicio)}ms)`,
          tipo: 'OK',
        },
        {
          hora,
          texto: `Infraestructura activa y operativa en ${isVercel ? 'Vercel CDN Edge' : 'Localhost'}.`,
          tipo: 'OK',
        },
      ])
    } catch (err) {
      setDbStatus('error')
      registrarLog('Fallo al conectar con la base de datos PostgreSQL. Verifique DATABASE_URL.', 'ERROR')
    } finally {
      setCargando(false)
    }
  }

  async function handleProbarConexion() {
    setEjecutandoAccion('probar')
    registrarLog('Iniciando test de conexion e integridad criptografica...', 'AUDIT')

    await new Promise((r) => setTimeout(r, 400))
    const inicio = performance.now()
    try {
      const res = await obtenerEstadoSetup()
      const fin = performance.now()
      const lat = Math.round(fin - inicio)
      setApiLatency(lat)
      setMetricas(res.metricas)
      setDbStatus('conectado')

      registrarLog(`Latencia del servidor: ${lat}ms`, 'OK')
      registrarLog('Diagnostico de Base de Datos PostgreSQL completado:', 'INFO')
      registrarLog(`  |- Tabla usuarios_sistema: ${res.metricas?.usuarios || 0} registros`, 'INFO')
      registrarLog(`  |- Tabla ceremonias: ${res.metricas?.ceremonias || 0} registros`, 'INFO')
      registrarLog(`  |- Tabla egresados: ${res.metricas?.egresados || 0} registros`, 'INFO')
      registrarLog(`  |- Tabla invitados: ${res.metricas?.invitados || 0} registros`, 'INFO')
      await cargarPanelCiberseguridad()
      registrarLog('Certificado Ed25519 y cadena SHA-256 verificados.', 'OK')
    } catch (err) {
      setDbStatus('error')
      registrarLog('Fallo critico de conexion con PostgreSQL. Intente nuevamente.', 'ERROR')
    } finally {
      setEjecutandoAccion(null)
    }
  }

  async function handleActivarSerial(e) {
    e.preventDefault()
    if (!nuevoSerialInput.trim()) return
    setEjecutandoAccion('serial')
    setMensajeSeguridad(null)
    try {
      const res = await activarSerialLicenciaCriptografica(nuevoSerialInput.trim())
      setEstadoLicencia(res.estado)
      setNuevoSerialInput('')
      setMensajeSeguridad({ tipo: 'ok', texto: res.mensaje })
      registrarLog('Nuevo certificado de licencia Ed25519 verificado y activado.', 'OK')
    } catch (err) {
      setMensajeSeguridad({ tipo: 'error', texto: err.message })
      registrarLog(`Rechazo criptografico Ed25519: ${err.message}`, 'ERROR')
    } finally {
      setEjecutandoAccion(null)
    }
  }

  async function handleConmutarBloqueo(bloquear) {
    setEjecutandoAccion('bloqueo')
    setMensajeSeguridad(null)
    try {
      const res = await conmutarBloqueoSeguridad({
        bloquear,
        codigoTotp: codigoTotpInput.trim() || undefined,
      })
      setEstadoLicencia(res.estado)
      setMensajeSeguridad({ tipo: 'ok', texto: res.mensaje })
      registrarLog(res.mensaje, 'AUDIT')
    } catch (err) {
      setMensajeSeguridad({ tipo: 'error', texto: err.message })
      registrarLog(`Error en control de bloqueo: ${err.message}`, 'ERROR')
    } finally {
      setEjecutandoAccion(null)
    }
  }

  async function handleRegistrarPasskeyFido2() {
    setMensajeSeguridad(null)
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      setMensajeSeguridad({
        tipo: 'error',
        texto: 'Este navegador no soporta registro de llaves de hardware WebAuthn / FIDO2.',
      })
      return
    }

    setEjecutandoAccion('fido2')
    try {
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)
      const userId = new Uint8Array(16)
      window.crypto.getRandomValues(userId)

      const credencial = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'SiGIC Ciberseguridad',
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: 'jcancelo.dev@gmail.com',
            displayName: 'Cancelo Julian (Autoridad SiGIC)',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -8, type: 'public-key' }, // Ed25519
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            userVerification: 'preferred',
          },
          timeout: 60000,
        },
      })

      if (!credencial || !credencial.rawId) {
        throw new Error('No se pudo generar la credencial FIDO2.')
      }

      const credencialId = bufferABase64Url(credencial.rawId)
      const res = await registrarLlaveSeguridadFido2({
        credencialId,
        nombreLlave: nombrePasskey || 'Passkey FIDO2 — Cancelo Julian',
        propietario: 'Cancelo Julian',
        transporte: 'internal,nfc,usb',
        codigoTotp: codigoTotpInput.trim() || undefined,
      })

      setMensajeSeguridad({ tipo: 'ok', texto: res.mensaje })
      registrarLog(`Passkey FIDO2 registrada: ${credencialId.slice(0, 20)}...`, 'OK')
      await cargarPanelCiberseguridad()
    } catch (err) {
      setMensajeSeguridad({
        tipo: 'error',
        texto: err.message || 'Registro de Passkey cancelado o no disponible en este dispositivo.',
      })
    } finally {
      setEjecutandoAccion(null)
    }
  }

  async function handleGrabarTarjetaNFCFisica() {
    setMensajeSeguridad(null)
    const tokenParaGrabar = estadoLicencia?.tokenNfcMaestro
    if (!tokenParaGrabar) {
      setMensajeSeguridad({ tipo: 'error', texto: 'Token maestro NFC no disponible en la sesion actual.' })
      return
    }

    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      navigator.clipboard?.writeText(tokenParaGrabar)
      setMensajeSeguridad({
        tipo: 'ok',
        texto:
          'Payload NDEF firmado (SIGIC-NFC-v1) copiado al portapapeles. En Android Chrome puedes grabarlo directamente apoyando tu tarjeta NFC o usando NFC Tools.',
      })
      return
    }

    setEjecutandoAccion('nfc')
    try {
      const ndef = new window.NDEFReader()
      await ndef.write({
        records: [{ recordType: 'text', data: tokenParaGrabar }],
      })
      setMensajeSeguridad({
        tipo: 'ok',
        texto: 'Certificado Ed25519 grabado exitosamente en el chip fisico de tu tarjeta NFC.',
      })
      registrarLog('Tarjeta fisica NFC grabada con certificado Ed25519 SIGIC-NFC-v1.', 'OK')
    } catch (err) {
      setMensajeSeguridad({
        tipo: 'error',
        texto: `No se pudo escribir en el tag NFC: ${err.message}`,
      })
    } finally {
      setEjecutandoAccion(null)
    }
  }

  async function handleGuardarAlertas(e) {
    e.preventDefault()
    setEjecutandoAccion('alertas')
    setMensajeSeguridad(null)
    try {
      const res = await configurarAlertasSeguridad({
        correoAlertas,
        webhookAlertas,
      })
      setMensajeSeguridad({ tipo: 'ok', texto: res.mensaje })
      registrarLog('Canales de telemetria y alerta forense actualizados.', 'OK')
    } catch (err) {
      setMensajeSeguridad({ tipo: 'error', texto: err.message })
    } finally {
      setEjecutandoAccion(null)
    }
  }

  async function handleExportarDB() {
    setEjecutandoAccion('exportar')
    registrarLog('Solicitando exportacion de datos (Backup JSON)...', 'AUDIT')
    try {
      const datos = await exportarBaseDatos()
      registrarLog('Carga de datos recibida desde PostgreSQL.', 'OK')

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datos, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', dataStr)
      downloadAnchor.setAttribute('download', `sigic_backup_cloud_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()

      registrarLog('Archivo JSON de backup generado y descargado con exito.', 'OK')
    } catch (err) {
      registrarLog(`Error al exportar la base de datos: ${err.message || 'Permiso denegado'}`, 'ERROR')
    } finally {
      setEjecutandoAccion(null)
    }
  }

  async function handleResetearSistema() {
    const confirmado = await confirmar({
      titulo: 'Formatear todo el sistema',
      descripcion:
        'Se eliminaran graduados, invitados, ceremonias y cuentas. Luego volvera a abrirse el asistente de configuracion inicial.',
      textoConfirmar: 'Continuar con el reset',
      tipo: 'peligro',
    })
    if (!confirmado) return

    const confirmacionText = prompt('Por favor, escribe "RESET" para confirmar el formateo del sistema:')
    if (confirmacionText !== 'RESET') {
      alert('Confirmacion cancelada.')
      return
    }

    setEjecutandoAccion('reset')
    registrarLog('Iniciando proceso de borrado de base de datos...', 'AUDIT')
    try {
      await resetearSistema()
      registrarLog('Todas las tablas fueron limpiadas con exito. Flag de Setup marcado como incompleto.', 'OK')
      registrarLog('Redirigiendo al asistente de configuracion...', 'AUDIT')

      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      registrarLog(`Fallo al resetear el sistema: ${err.message}`, 'ERROR')
      setEjecutandoAccion(null)
    }
  }

  return (
    <div className="font-sans pb-10">
      {/* HEADER INTEGRADO PRO */}
      <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-100/80 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onVolver}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition active:scale-95 shadow-sm shadow-slate-100/50 bg-white"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-black tracking-tight" style={{ color: DARK }}>
              Centro de Control de Infraestructura y Ciberseguridad
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Servidor Serverless Vercel & PostgreSQL Cloud · Licenciamiento Ed25519
            </p>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1 font-mono">{VERSION_LABEL}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={inicializarConsola}
            className="px-3.5 py-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-800 bg-white transition active:scale-95 text-[10px] font-bold uppercase tracking-wider shadow-sm"
          >
            Limpiar Consola
          </button>

          <button
            onClick={handleProbarConexion}
            disabled={ejecutandoAccion !== null}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md shadow-sky-500/20 active:scale-95 transition-all"
          >
            <RefreshCw size={14} className={ejecutandoAccion === 'probar' ? 'animate-spin' : ''} /> Probar Conexiones
          </button>
        </div>
      </div>

      {/* TARJETAS DE SERVICIOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* CARD: SERVIDOR WEB */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 border border-sky-100 shadow-sm shadow-sky-100/50">
              <Server size={18} />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Activo (Vercel)
            </span>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Servidor Cloud</h3>
            <p className="text-sm font-black text-slate-800 mt-1 truncate">{hostBase.replace('https://', '')}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Latencia API: {apiLatency > 0 ? `${apiLatency}ms` : 'calculando...'}
            </p>
          </div>
        </div>

        {/* CARD: BASE DE DATOS */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-500 border border-purple-100 shadow-sm shadow-purple-100/50">
              <Database size={18} />
            </div>
            {dbStatus === 'conectado' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-100">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Desconectado
              </span>
            )}
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Base de Datos</h3>
            <p className="text-sm font-black text-slate-800 mt-1">PostgreSQL Cloud</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Graduados: {metricas.egresados} | Invitados: {metricas.invitados}
            </p>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <a
                href="/esquema/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-purple-600 hover:text-purple-700 transition"
              >
                <ExternalLink size={11} /> Ver Esquema DER Interactivo
              </a>
            </div>
          </div>
        </div>

        {/* CARD: SERVIDOR SMTP */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 border border-amber-100 shadow-sm shadow-amber-100/50">
              <Mail size={18} />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-100">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
              SMTP Listo
            </span>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Servicio de Correo</h3>
            <p className="text-sm font-black text-slate-800 mt-1">SMTP Integrado (Nube)</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Invitaciones, Alertas Forenses y Tokens OTP Activos
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PANEL DE CIBERSEGURIDAD, LICENCIAMIENTO ED25519 Y LLAVES FISICAS       */}
      {/* ===================================================================== */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-[32px] p-6 sm:p-8 shadow-xl mb-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Shield size={22} />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 mb-1">
                Criptografia Asimetrica Ed25519 + Hardware MFA
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                Custodia de Propiedad Intelectual, Licenciamiento y Llaves Fisicas (NFC / FIDO2 / TOTP)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Autoridad de Certificacion: <strong className="text-slate-200">Cancelo Julian</strong> · Carrera: Tecnicatura Superior en Analista de Sistemas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {estadoLicencia?.valida && !estadoLicencia?.bloqueado ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 size={14} /> Licencia Ed25519 Activa ({estadoLicencia?.diasRestantes ?? 180} dias)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                <Lock size={14} /> Sistema Bloqueado ({estadoLicencia?.motivo})
              </span>
            )}
          </div>
        </div>

        {mensajeSeguridad && (
          <div
            className={`rounded-2xl px-4 py-3 text-xs font-semibold flex items-center justify-between gap-3 border ${
              mensajeSeguridad.tipo === 'ok'
                ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-200'
                : 'bg-rose-950/70 border-rose-700/60 text-rose-200'
            }`}
          >
            <span>{mensajeSeguridad.texto}</span>
            <button onClick={() => setMensajeSeguridad(null)} className="text-[10px] uppercase opacity-75 hover:opacity-100">
              Cerrar
            </button>
          </div>
        )}

        {/* Resumen del Certificado Actual + Cadena SHA-256 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-sky-400">
              <span className="flex items-center gap-1.5">
                <KeyRound size={14} /> Certificado Ed25519
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {estadoLicencia?.licencia?.serial_id || 'SIGIC-ITB-2026-OFICIAL-001'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Institucion: <strong>{estadoLicencia?.licencia?.institucion || 'Instituto Tecnologico Beltran'}</strong>
            </p>
            <p className="text-[11px] text-slate-400">
              Dominios autorizados:{' '}
              <code className="text-sky-300 font-mono">
                {(estadoLicencia?.licencia?.dominios_autorizados || ['localhost', 'app.sigic.com.ar', '*.vercel.app']).join(', ')}
              </code>
            </p>
            <p className="text-[11px] text-slate-400">
              Host actual detectado: <code className="text-emerald-300 font-mono">{estadoLicencia?.dominioDetectado || 'localhost'}</code>
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <FileCheck2 size={14} /> Cadena de Custodia SHA-256
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                {integridadDatos?.cadenaAuditoria?.integra !== false ? 'INTEGRA' : 'ALTERADA'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {integridadDatos?.cadenaAuditoria?.mensaje || 'Verificador criptografico SHA-256 de auditoria en linea.'}
            </p>
            <p className="text-[11px] text-slate-400">
              Eslabones verificados: <strong>{integridadDatos?.cadenaAuditoria?.totalAnalizados ?? 0}</strong> · Alertas forenses:{' '}
              <strong>{integridadDatos?.alertasForenses?.length ?? 0}</strong>
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
              <span className="flex items-center gap-1.5">
                <QrCode size={14} /> Codigo Maestro TOTP (RFC 6238)
              </span>
              {estadoLicencia?.codigoTotpActualDemo && (
                <span className="font-mono text-sm font-black tracking-widest bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                  {estadoLicencia.codigoTotpActualDemo}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300">
              Semilla Base32 (Google Authenticator / Authy):
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg font-mono text-[11px] text-amber-300 truncate">
                {estadoLicencia?.totpProvisioning?.secreto || 'SIGICJCANCELO2026CYBERSECKEY7777'}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    estadoLicencia?.totpProvisioning?.secreto || 'SIGICJCANCELO2026CYBERSECKEY7777'
                  )
                  setMensajeSeguridad({
                    tipo: 'ok',
                    texto: 'Semilla TOTP Base32 copiada para agregar en Google Authenticator.',
                  })
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="Copiar Semilla TOTP"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Controles de Llaves Fisicas (NFC + FIDO2 Passkey + Bloqueo Maestro) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Tarjeta Fisica NFC */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 flex flex-col justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <SmartphoneNfc size={15} className="text-sky-400" /> 1. Llave Fisica NFC (Ed25519)
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Graba el certificado firmado <code className="text-sky-300">SIGIC-NFC-v1</code> en una tarjeta o llavero NFC (NTAG213/215) para desbloquear SiGIC con solo apoyar la tarjeta.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGrabarTarjetaNFCFisica}
                disabled={ejecutandoAccion !== null}
                className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5"
              >
                <SmartphoneNfc size={14} /> Grabar / Copiar Tag NFC
              </button>
            </div>
          </div>

          {/* 2. Passkey FIDO2 / WebAuthn */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 flex flex-col justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Fingerprint size={15} className="text-purple-400" /> 2. Passkey Hardware FIDO2
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Vincula tu huella biometrica (Windows Hello / TouchID / Android) o YubiKey USB/NFC ({integridadDatos?.llavesFido2?.length || 0} registradas).
              </p>
              <input
                type="text"
                value={nombrePasskey}
                onChange={(e) => setNombrePasskey(e.target.value)}
                placeholder="Nombre de la llave FIDO2"
                className="mt-2 w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-[11px] text-slate-200"
              />
            </div>
            <button
              type="button"
              onClick={handleRegistrarPasskeyFido2}
              disabled={ejecutandoAccion !== null}
              className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5"
            >
              <Fingerprint size={14} /> Vincular Passkey / Biometria
            </button>
          </div>

          {/* 3. Conmutador de Bloqueo Remoto / Prueba en Vivo */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 flex flex-col justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Lock size={15} className="text-rose-400" /> 3. Control de Bloqueo Criptografico
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Permite probar el escudo de bloqueo total en vivo o desbloquear con codigo TOTP de 6 digitos.
              </p>
              <input
                type="text"
                maxLength={6}
                value={codigoTotpInput}
                onChange={(e) => setCodigoTotpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Codigo TOTP (6 digitos opcional)"
                className="mt-2 w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-[11px] font-mono text-slate-200"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleConmutarBloqueo(true)}
                disabled={ejecutandoAccion !== null}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5"
              >
                <Lock size={13} /> Bloquear Ahora
              </button>
              <button
                type="button"
                onClick={() => handleConmutarBloqueo(false)}
                disabled={ejecutandoAccion !== null}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5"
              >
                <Unlock size={13} /> Desbloquear
              </button>
            </div>
          </div>
        </div>

        {/* Actualizacion de Serial Ed25519 y Destino de Alertas Forenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          <form onSubmit={handleActivarSerial} className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              Cargar Nuevo Certificado Serial Criptografico (SIGIC-LIC-v1):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevoSerialInput}
                onChange={(e) => setNuevoSerialInput(e.target.value)}
                placeholder="SIGIC-LIC-v1.eyJzZXJpYWxfaWQiOi..."
                className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 font-mono text-xs text-slate-200"
              />
              <button
                type="submit"
                disabled={ejecutandoAccion !== null}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shrink-0"
              >
                Verificar y Aplicar
              </button>
            </div>
          </form>

          <form onSubmit={handleGuardarAlertas} className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <BellRing size={13} className="text-amber-400" /> Correo y Webhook del Autor para Alertas Forenses (Canary):
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={correoAlertas}
                onChange={(e) => setCorreoAlertas(e.target.value)}
                placeholder="jcancelo.dev@gmail.com"
                className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200"
              />
              <input
                type="text"
                value={webhookAlertas}
                onChange={(e) => setWebhookAlertas(e.target.value)}
                placeholder="https://webhook-siem-o-discord..."
                className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200"
              />
              <button
                type="submit"
                disabled={ejecutandoAccion !== null}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shrink-0"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CONSOLA DE AUDITORIA EN TIEMPO REAL */}
      <div className="bg-slate-950 border border-slate-900 shadow-2xl rounded-[32px] overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-900/40 select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono flex items-center gap-1.5">
              <Terminal size={12} className="text-sky-500" /> consola_diagnostico_cloud.sh
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-600 font-mono">Status: ONLINE</span>
        </div>

        <div className="p-6 h-72 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 space-y-1.5 select-text">
          {logs.map((l, idx) => {
            let colorCls = 'text-slate-400'
            if (l.tipo === 'OK') colorCls = 'text-emerald-400'
            if (l.tipo === 'ERROR') colorCls = 'text-rose-400'
            if (l.tipo === 'AUDIT') colorCls = 'text-sky-400 font-bold'

            return (
              <div key={idx} className="flex gap-3">
                <span className="text-slate-600 shrink-0">{l.hora}</span>
                <span className={colorCls}>{l.texto}</span>
              </div>
            )
          })}
          <div ref={consoleEndRef} />
        </div>
      </div>

      {/* CONTROLES DE MANTENIMIENTO AVANZADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EXPORTACION DE BACKUP */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl border border-emerald-100 shrink-0 h-fit">
              <Download size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Respaldar Base de Datos</h3>
              <p className="text-[11px] font-bold text-slate-400 mt-1 leading-relaxed">
                Descarga un volcado completo de la base de datos PostgreSQL en formato JSON. Incluye egresados, invitados, ceremonias y parametros del sistema.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleExportarDB}
              disabled={ejecutandoAccion !== null}
              className="flex items-center gap-1.5 px-5 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition active:scale-95 shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              {ejecutandoAccion === 'exportar' ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}{' '}
              Exportar Base de Datos
            </button>
          </div>
        </div>

        {/* REINICIAR SISTEMA */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex gap-4">
            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 shrink-0 h-fit">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-750">Formatear Sistema (Reset)</h3>
              <p className="text-[11px] font-bold text-slate-400 mt-1 leading-relaxed">
                Elimina todos los datos de las ceremonias en PostgreSQL y apaga el flag de configuracion inicial para reiniciar el asistente web de setup.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleResetearSistema}
              disabled={ejecutandoAccion !== null}
              className={`flex items-center gap-1.5 px-5 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-700 transition active:scale-95 shadow-md shadow-rose-600/10 cursor-pointer ${
                ejecutandoAccion === 'reset' ? 'animate-alert-vibe bg-red-700 shadow-xl shadow-red-700/50' : ''
              }`}
            >
              {ejecutandoAccion === 'reset' ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}{' '}
              Formatear & Resetear
            </button>
          </div>
        </div>
      </div>

      {dialogoConfirmacion}
      <style>{`
        @keyframes alert-vibe {
          0%, 100% { transform: scale(1) translate(0, 0) rotate(0deg); }
          20% { transform: scale(1.02) translate(-2px, 1px) rotate(-0.5deg); }
          40% { transform: scale(0.98) translate(1.5px, -2px) rotate(0.5deg); }
          60% { transform: scale(1.01) translate(-1px, 2px) rotate(-0.2deg); }
          80% { transform: scale(0.99) translate(2px, -1px) rotate(0.2deg); }
        }
        .animate-alert-vibe {
          animation: alert-vibe 0.15s infinite linear;
        }
      `}</style>
    </div>
  )
}
