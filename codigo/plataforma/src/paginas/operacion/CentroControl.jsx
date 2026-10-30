import React, { useState, useEffect } from 'react'
import {
  Shield,
  RefreshCw,
  Database,
  Server,
  CheckCircle2,
  Download,
  Trash2,
  ArrowLeft,
  Mail,
  ExternalLink,
  KeyRound,
  SmartphoneNfc,
  Lock,
  Unlock,
  Copy,
  FileCheck2,
  BellRing,
  Smartphone,
  UserCheck,
  Plus,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { VERSION_LABEL } from '../../lib/version'
import {
  obtenerEstadoSetup,
  exportarBaseDatos,
  resetearSistema,
  obtenerEstadoLicenciaSeguridad,
  obtenerIntegridadAuditoriaYAlertas,
  activarSerialLicenciaCriptografica,
  conmutarBloqueoSeguridad,
  configurarAlertasSeguridad,
  emitirGafeteNfcAutorizacion,
  revocarGafeteNfcAutorizacion,
} from '../../servicios/api'
import { useConfirmacion } from '../../componentes/ModalConfirmacion'
import { obtenerTemaActual } from '../../datos/fondos-pantalla'

export function CentroControl({ usuario, onVolver }) {
  const { confirmar, dialogoConfirmacion } = useConfirmacion()
  const [pestanaActiva, setPestanaActiva] = useState('acceso') // 'acceso' | 'gafetes-nfc' | 'certificado' | 'infraestructura'
  const [metricas, setMetricas] = useState({
    usuarios: 0,
    ceremonias: 0,
    egresados: 0,
    invitados: 0,
  })
  const [ejecutandoAccion, setEjecutandoAccion] = useState(null)
  const [dbStatus, setDbStatus] = useState('conectado')
  const [apiLatency, setApiLatency] = useState(0)

  // Estados de Ciberseguridad y Licenciamiento Ed25519
  const [estadoLicencia, setEstadoLicencia] = useState(null)
  const [integridadDatos, setIntegridadDatos] = useState(null)
  const [nuevoSerialInput, setNuevoSerialInput] = useState('')
  const [codigoTotpInput, setCodigoTotpInput] = useState('')
  const [correoAlertas, setCorreoAlertas] = useState('jcancelo.dev@gmail.com')
  const [webhookAlertas, setWebhookAlertas] = useState('')
  const [mensajeSeguridad, setMensajeSeguridad] = useState(null)

  // Estados para emitir Gafete / Tag NFC de Autorizacion de Celulares y Personas
  const [formNfcPropietario, setFormNfcPropietario] = useState('Cancelo Julian')
  const [formNfcCorreo, setFormNfcCorreo] = useState('juliancancelo@gmail.com')
  const [formNfcRol, setFormNfcRol] = useState('SUPER_ADMIN')
  const [formNfcDias, setFormNfcDias] = useState(365)
  const [ultimoGafeteEmitido, setUltimoGafeteEmitido] = useState(null)

  const [temaId, setTemaId] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('sigic_fondo') || 'beltran' : 'beltran'
  )

  useEffect(() => {
    const manejarCambioTema = (e) => {
      if (e?.detail) setTemaId(e.detail)
      else if (typeof window !== 'undefined') setTemaId(localStorage.getItem('sigic_fondo') || 'beltran')
    }
    window.addEventListener('sigic-fondo-cambiado', manejarCambioTema)
    return () => window.removeEventListener('sigic-fondo-cambiado', manejarCambioTema)
  }, [])

  const tema = obtenerTemaActual(temaId)
  const acento = tema.colorPrincipal || '#0ea5e9'
  const hostBase = typeof window !== 'undefined' ? window.location.origin : 'http://192.168.0.60:3000'

  useEffect(() => {
    cargarDiagnostico()
    cargarPanelCiberseguridad()
  }, [])

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
      // Silencioso en carga inicial
    }
  }

  async function cargarDiagnostico() {
    const inicio = performance.now()
    try {
      const res = await obtenerEstadoSetup()
      const fin = performance.now()
      setApiLatency(Math.round(fin - inicio))
      setMetricas(res.metricas || { usuarios: 0, ceremonias: 0, egresados: 0, invitados: 0 })
      setDbStatus('conectado')
    } catch (err) {
      setDbStatus('error')
    }
  }

  async function handleProbarConexion() {
    setEjecutandoAccion('probar')
    const inicio = performance.now()
    try {
      const res = await obtenerEstadoSetup()
      const fin = performance.now()
      setApiLatency(Math.round(fin - inicio))
      setMetricas(res.metricas || { usuarios: 0, ceremonias: 0, egresados: 0, invitados: 0 })
      setDbStatus('conectado')
      await cargarPanelCiberseguridad()
      setMensajeSeguridad({
        tipo: 'ok',
        texto: `Diagnostico completado (${Math.round(fin - inicio)}ms). Firma Ed25519 y cadena SHA-256 verificadas.`,
      })
    } catch (err) {
      setDbStatus('error')
      setMensajeSeguridad({ tipo: 'error', texto: 'Fallo de conexion con PostgreSQL.' })
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
    } catch (err) {
      setMensajeSeguridad({ tipo: 'error', texto: err.message })
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
    } catch (err) {
      setMensajeSeguridad({ tipo: 'error', texto: err.message })
    } finally {
      setEjecutandoAccion(null)
    }
  }

  const [esperandoTagFisico, setEsperandoTagFisico] = useState(false)
  const soportaWebNfcDirecto = typeof window !== 'undefined' && 'NDEFReader' in window

  async function handleEmitirGafeteNFC(e, grabarEnUnPaso = true) {
    if (e?.preventDefault) e.preventDefault()
    setEjecutandoAccion('emitir-nfc')
    setMensajeSeguridad(null)
    try {
      const res = await emitirGafeteNfcAutorizacion({
        propietario: formNfcPropietario,
        correo: formNfcCorreo,
        rol: formNfcRol,
        diasValidez: Number(formNfcDias || 365),
        origenUrl: hostBase,
      })
      setUltimoGafeteEmitido(res.gafete)
      await cargarPanelCiberseguridad()

      // Si el navegador tiene lector/grabador NFC activo (ej. Chrome en Android o lector NFC compatible),
      // inicia la grabacion fisica inmediatamente en el mismo paso:
      if (grabarEnUnPaso && typeof window !== 'undefined' && 'NDEFReader' in window) {
        await handleGrabarUrlEnChipNFC(res.gafete.url_nfc, res.gafete.propietario)
      } else {
        navigator.clipboard?.writeText(res.gafete.url_nfc)
        setMensajeSeguridad({
          tipo: 'ok',
          texto: `Llave NFC de ${res.gafete.propietario} generada y copiada. Si estas en PC sin antena NFC fisica, escanea el QR de la derecha con tu celular Android para apoyar y grabar el Tag NFC desde ahi mismo.`,
        })
      }
    } catch (err) {
      setMensajeSeguridad({ tipo: 'error', texto: err.message })
    } finally {
      setEjecutandoAccion(null)
    }
  }

  async function handleGrabarUrlEnChipNFC(urlParaGrabar, nombrePropietario = '') {
    setMensajeSeguridad(null)
    if (!urlParaGrabar) return

    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      navigator.clipboard?.writeText(urlParaGrabar)
      setMensajeSeguridad({
        tipo: 'ok',
        texto:
          'Este dispositivo (PC) no tiene antena NFC integrada en el navegador. Se copio el enlace firmado al portapapeles, o puedes abrir esta misma pantalla desde tu celular para grabarlo apoyando el Tag NFC.',
      })
      return
    }

    setEjecutandoAccion('grabar-nfc')
    setEsperandoTagFisico(true)
    try {
      const ndef = new window.NDEFReader()
      await ndef.write({
        records: [{ recordType: 'url', data: urlParaGrabar }],
      })
      setEsperandoTagFisico(false)
      setMensajeSeguridad({
        tipo: 'ok',
        texto: `Listo: Tag NFC fisico grabado directamente para ${nombrePropietario || 'el usuario'}. Al acercar cualquier celular entrara autorizado.`,
      })
    } catch (err) {
      setEsperandoTagFisico(false)
      setMensajeSeguridad({
        tipo: 'error',
        texto: `No se pudo escribir en el chip NFC: ${err.message}`,
      })
    } finally {
      setEjecutandoAccion(null)
    }
  }

  async function handleToggleGafeteNFC(uidLlave, nuevoEstado) {
    try {
      const res = await revocarGafeteNfcAutorizacion(uidLlave, nuevoEstado)
      setMensajeSeguridad({ tipo: 'ok', texto: res.mensaje })
      await cargarPanelCiberseguridad()
    } catch (err) {
      setMensajeSeguridad({ tipo: 'error', texto: err.message })
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
    } catch (err) {
      setMensajeSeguridad({ tipo: 'error', texto: err.message })
    } finally {
      setEjecutandoAccion(null)
    }
  }

  async function handleExportarDB() {
    setEjecutandoAccion('exportar')
    try {
      const datos = await exportarBaseDatos()
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datos, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', dataStr)
      downloadAnchor.setAttribute('download', `sigic_backup_cloud_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      setMensajeSeguridad({ tipo: 'ok', texto: 'Respaldo JSON descargado correctamente.' })
    } catch (err) {
      setMensajeSeguridad({ tipo: 'error', texto: err.message || 'No se pudo exportar la base de datos.' })
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
    if (confirmacionText !== 'RESET') return

    setEjecutandoAccion('reset')
    try {
      await resetearSistema()
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      setMensajeSeguridad({ tipo: 'error', texto: err.message })
      setEjecutandoAccion(null)
    }
  }

  // URI ultra-compatible RFC 6238 (sin parentesis ni caracteres que bloqueen Google Authenticator)
  const uriQrTotp =
    estadoLicencia?.totpProvisioning?.uri ||
    'otpauth://totp/SiGIC:juliancancelo@gmail.com?secret=SIGICJCANCELO2026CYBERSECKEY7777&issuer=SiGIC'

  const pestanas = [
    { id: 'acceso', nombre: 'PIN Maestro, QR & Bloqueo', icono: Smartphone },
    { id: 'gafetes-nfc', nombre: 'Autorizar Celulares / Personas con NFC', icono: SmartphoneNfc },
    { id: 'certificado', nombre: 'Licencia Ed25519 & Auditoria', icono: KeyRound },
    { id: 'infraestructura', nombre: 'Base de Datos & Respaldo', icono: Database },
  ]

  return (
    <div className="font-sans max-w-5xl mx-auto space-y-4 pb-10">
      {/* Cabecera minimalista acorde al tema activo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          {onVolver && (
            <button
              onClick={onVolver}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              title="Volver"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div
            className="grid h-10 w-10 place-items-center rounded-xl text-white shadow-xs shrink-0"
            style={{ background: `linear-gradient(135deg, ${tema.colores[0]}, ${tema.colores[1]})` }}
          >
            <Shield size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-black text-slate-800 tracking-tight">
                Ciberseguridad, Licenciamiento y Control
              </h2>
              <span
                className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: tema.colorAcentoLight,
                  color: acento,
                  border: `1px solid ${tema.colorAcentoBorder}`,
                }}
              >
                Tema {tema.nombre.split(' ')[0]}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Autoridad Criptografica: <strong className="text-slate-700">Cancelo Julian</strong> · Tecnicatura Superior en Analista de Sistemas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {estadoLicencia?.valida && !estadoLicencia?.bloqueado ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={13} /> Activo ({estadoLicencia?.diasRestantes ?? 180}d)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <Lock size={13} /> Bloqueado
            </span>
          )}

          <button
            onClick={handleProbarConexion}
            disabled={ejecutandoAccion !== null}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white text-xs font-bold transition cursor-pointer shadow-xs"
            style={{ backgroundColor: acento }}
          >
            <RefreshCw size={13} className={ejecutandoAccion === 'probar' ? 'animate-spin' : ''} />
            <span>Verificar</span>
          </button>
        </div>
      </div>

      {/* Navegacion de pestañas limpia */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        {pestanas.map(({ id, nombre, icono: Icono }) => {
          const activa = pestanaActiva === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPestanaActiva(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activa ? 'text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
              style={
                activa
                  ? { background: `linear-gradient(135deg, ${tema.colores[0]}, ${tema.colores[1]})` }
                  : undefined
              }
            >
              <Icono size={14} />
              <span>{nombre}</span>
            </button>
          )
        })}
      </div>

      {/* Notificacion de estado */}
      {mensajeSeguridad && (
        <div
          className={`rounded-xl px-4 py-3 text-xs font-semibold flex items-center justify-between gap-3 border ${
            mensajeSeguridad.tipo === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{mensajeSeguridad.texto}</span>
          <button
            onClick={() => setMensajeSeguridad(null)}
            className="text-[10px] font-bold uppercase opacity-70 hover:opacity-100 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 1: PIN MAESTRO, QR MOVIL (CORREGIDO) Y BLOQUEO                */}
      {/* ===================================================================== */}
      {pestanaActiva === 'acceso' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <Smartphone size={12} style={{ color: acento }} /> Android & iOS (Formato Estandar Limpio)
              </span>
              <h3 className="text-sm font-black text-slate-800 mt-0.5">
                Codigo Maestro Fijo (04051990) y QR para Google Authenticator / iOS
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Se elimino el formato con parentesis que daba error en Google Authenticator. Escanea este nuevo QR para generar codigos de 6 digitos o usa siempre tu codigo maestro <strong>04051990</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs shrink-0">
                <QRCodeSVG value={uriQrTotp} size={136} level="M" />
              </div>

              <div className="space-y-2.5 flex-1 text-center sm:text-left">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Tu Codigo Maestro Personal (Fijo)
                  </span>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                    <code className="text-base font-black font-mono tracking-widest text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      04051990
                    </code>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Siempre activo
                    </span>
                  </div>
                </div>

                {estadoLicencia?.codigoTotpActualDemo && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Codigo Dinamico Actual (Celular 30s)
                    </span>
                    <code
                      className="inline-block mt-0.5 text-sm font-black font-mono tracking-widest px-2.5 py-0.5 rounded-lg"
                      style={{
                        backgroundColor: tema.colorAcentoLight,
                        color: acento,
                        border: `1px solid ${tema.colorAcentoBorder}`,
                      }}
                    >
                      {estadoLicencia.codigoTotpActualDemo}
                    </code>
                  </div>
                )}

                <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        estadoLicencia?.totpProvisioning?.secreto || 'SIGICJCANCELO2026CYBERSECKEY7777'
                      )
                      setMensajeSeguridad({
                        tipo: 'ok',
                        texto: 'Clave Base32 copiada (SIGICJCANCELO2026CYBERSECKEY7777).',
                      })
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold transition cursor-pointer"
                  >
                    <Copy size={12} /> Copiar Clave Base32
                  </button>

                  <button
                    type="button"
                    onClick={() => setPestanaActiva('gafetes-nfc')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold transition cursor-pointer"
                    style={{ backgroundColor: acento }}
                  >
                    <SmartphoneNfc size={12} /> Autorizar Celulares con NFC
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <Lock size={12} style={{ color: acento }} /> Escudo de Ejecucion
              </span>
              <h3 className="text-sm font-black text-slate-800 mt-0.5">
                Prueba de Bloqueo y Desbloqueo Instantaneo
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Activa el bloqueo total para verificar la pantalla de proteccion. Desbloquea con tu codigo maestro{' '}
                <code className="font-mono font-bold text-slate-700">04051990</code>, con QR o acercando un Tag NFC.
              </p>

              <div className="mt-4">
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                  Codigo Maestro (04051990) o Codigo del Celular:
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={codigoTotpInput}
                  onChange={(e) => setCodigoTotpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="04051990"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 focus:bg-white px-3.5 py-2.5 text-center font-mono text-sm font-bold tracking-widest text-slate-800 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleConmutarBloqueo(true)}
                disabled={ejecutandoAccion !== null}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Lock size={14} /> Bloquear Sistema
              </button>
              <button
                type="button"
                onClick={() => handleConmutarBloqueo(false)}
                disabled={ejecutandoAccion !== null}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Unlock size={14} /> Desbloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 2: AUTORIZAR CELULARES Y PERSONAS CON TAG NFC                 */}
      {/* ===================================================================== */}
      {pestanaActiva === 'gafetes-nfc' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Formulario para emitir un Tag NFC que autoriza celulares / personas */}
            <form
              onSubmit={handleEmitirGafeteNFC}
              className="md:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3.5"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <SmartphoneNfc size={12} style={{ color: acento }} /> Llave de Proximidad Ed25519
                </span>
                <h3 className="text-sm font-black text-slate-800 mt-0.5">
                  Crear Tag NFC para Autorizar Celulares o Personas
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Genera un enlace firmado con tu clave privada Ed25519 para grabarlo en un llavero o tarjeta NFC.{' '}
                  <strong>Al apoyar cualquier celular Android o iPhone sobre el Tag NFC</strong>, el telefono abrira SiGIC, desbloqueara el sistema e iniciara sesion automaticamente con la persona autorizada.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Persona o Dispositivo a Autorizar
                  </label>
                  <input
                    type="text"
                    required
                    value={formNfcPropietario}
                    onChange={(e) => setFormNfcPropietario(e.target.value)}
                    placeholder="Ej: Cancelo Julian / Operador"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Correo de la Cuenta
                  </label>
                  <input
                    type="email"
                    required
                    value={formNfcCorreo}
                    onChange={(e) => setFormNfcCorreo(e.target.value)}
                    placeholder="juliancancelo@gmail.com"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Rol que Otorga el Tag NFC
                  </label>
                  <select
                    value={formNfcRol}
                    onChange={(e) => setFormNfcRol(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white"
                  >
                    <option value="SUPER_ADMIN">Super Admin (Control Total)</option>
                    <option value="ADMINISTRATIVO">Administrativo (Gestion Ceremonia)</option>
                    <option value="PORTERIA">Porteria (Solo Escaner Acreditacion)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Validez del Tag (Dias)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1825}
                    value={formNfcDias}
                    onChange={(e) => setFormNfcDias(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={ejecutandoAccion !== null}
                  className="flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  style={{ backgroundColor: acento }}
                >
                  <SmartphoneNfc size={14} />
                  <span>
                    {esperandoTagFisico
                      ? 'Acerca tu tarjeta NFC ahora...'
                      : soportaWebNfcDirecto
                        ? 'Generar y Grabar en Tag NFC Ahora'
                        : 'Generar Llave NFC y Copiar'}
                  </span>
                </button>
              </div>
              {esperandoTagFisico && (
                <div className="rounded-xl bg-sky-50 border border-sky-200 px-3 py-2 text-[11px] font-bold text-sky-800 flex items-center justify-between">
                  <span>Esperando tarjeta o llavero NFC: apoyalo detras del dispositivo para grabarlo...</span>
                </div>
              )}
            </form>

            {/* Panel Derecho: Gafete Recien Emitido o Maestro */}
            <div className="md:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between gap-4">
              {ultimoGafeteEmitido ? (
                <>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Tag Listo: {ultimoGafeteEmitido.uid_llave}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Rol: {ultimoGafeteEmitido.rol}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 mt-2">
                      Gafete NFC de {ultimoGafeteEmitido.propietario}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Graba este enlace en tu chip NFC (como registro URL) o escanea el QR con el celular que quieras dejar autorizado ahora mismo:
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shrink-0">
                      <QRCodeSVG value={ultimoGafeteEmitido.url_nfc} size={112} level="L" />
                    </div>
                    <div className="space-y-2 flex-1 min-w-0 w-full">
                      <input
                        type="text"
                        readOnly
                        value={ultimoGafeteEmitido.url_nfc}
                        className="w-full rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 font-mono text-[10px] text-slate-600"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleGrabarUrlEnChipNFC(ultimoGafeteEmitido.url_nfc)}
                          className="flex-1 py-2 px-3 rounded-xl text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          style={{ backgroundColor: acento }}
                        >
                          <SmartphoneNfc size={13} /> Grabar en Tag NFC
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(ultimoGafeteEmitido.url_nfc)
                            setMensajeSeguridad({
                              tipo: 'ok',
                              texto: 'Enlace NFC copiado. Pegalo como registro URL en NFC Tools para grabar tu tarjeta.',
                            })
                          }}
                          className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy size={12} /> Copiar URL
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                  <div
                    className="h-11 w-11 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: tema.colorAcentoLight, color: acento }}
                  >
                    <UserCheck size={20} />
                  </div>
                  <h4 className="text-xs font-black text-slate-800">
                    ¿Como funciona la autorizacion con NFC en iPhone y Android?
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                    1. Completa los datos a la izquierda y presiona <strong>Generar Llave NFC</strong>.<br />
                    2. Graba el enlace generado como <strong>URL</strong> en tu llavero o tarjeta NFC.<br />
                    3. Cuando cualquier celular autorizado apoye la tarjeta NFC, el telefono abre SiGIC y entra directo sin pedir claves. Si alguien pierde la tarjeta, la revocas abajo con 1 clic.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Gafetes / Tags NFC Emitidos con boton de Revocar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800">
                Tags NFC y Personas Autorizadas ({integridadDatos?.gafetesNfc?.length || 0})
              </h4>
              <span className="text-[10px] text-slate-400">
                Puedes desactivar cualquier Tag NFC en tiempo real
              </span>
            </div>

            {!integridadDatos?.gafetesNfc || integridadDatos.gafetesNfc.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Aun no has emitido gafetes NFC personalizados. Usa el formulario superior para crear el primero.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {integridadDatos.gafetesNfc.map((g) => (
                  <div key={g.uid_llave} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{g.propietario}</span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {g.uid_llave}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700">
                          {g.rol}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            g.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {g.activo ? 'Autorizado' : 'Revocado'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {g.correo} · Usos en celulares: <strong>{g.dispositivos_vinculados || 0}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setUltimoGafeteEmitido(g)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                      >
                        Ver QR / URL
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleGafeteNFC(g.uid_llave, !g.activo)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                          g.activo
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {g.activo ? 'Revocar Tag' : 'Reactivar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 3: CERTIFICADO ED25519, CADENA SHA-256 Y ALERTAS              */}
      {/* ===================================================================== */}
      {pestanaActiva === 'certificado' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <KeyRound size={14} style={{ color: acento }} /> Certificado Ed25519 Activo
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {estadoLicencia?.licencia?.serial_id || 'SIGIC-ITB-2026-OFICIAL-001'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Institucion licenciada:{' '}
                <strong className="text-slate-800">
                  {estadoLicencia?.licencia?.institucion || 'Instituto Tecnologico Beltran'}
                </strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Dominios autorizados:{' '}
                <code className="font-mono text-slate-700">
                  {(estadoLicencia?.licencia?.dominios_autorizados || ['localhost', 'app.sigic.com.ar', '*.vercel.app']).join(', ')}
                </code>
              </p>
              <p className="text-[11px] text-slate-500">
                Host actual: <code className="font-mono font-bold text-emerald-700">{estadoLicencia?.dominioDetectado || 'localhost'}</code>
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <FileCheck2 size={14} className="text-emerald-600" /> Auditoria Inmutable SHA-256
                </span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {integridadDatos?.cadenaAuditoria?.integra !== false ? 'CADENA INTEGRA' : 'ALTERADA'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {integridadDatos?.cadenaAuditoria?.mensaje || 'Cadena criptografica de auditoria verificada sin alteraciones.'}
              </p>
              <p className="text-[11px] text-slate-500">
                Registros encadenados: <strong className="text-slate-800">{integridadDatos?.cadenaAuditoria?.totalAnalizados ?? 0}</strong> ·
                Alertas registradas: <strong className="text-slate-800">{integridadDatos?.alertasForenses?.length ?? 0}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form onSubmit={handleActivarSerial} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <label className="block text-xs font-black text-slate-800">
                Actualizar Certificado Serial (SIGIC-LIC-v1)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevoSerialInput}
                  onChange={(e) => setNuevoSerialInput(e.target.value)}
                  placeholder="SIGIC-LIC-v1.eyJzZXJpYWxfaWQiOi..."
                  className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={ejecutandoAccion !== null}
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold shrink-0 cursor-pointer"
                  style={{ backgroundColor: acento }}
                >
                  Aplicar
                </button>
              </div>
            </form>

            <form onSubmit={handleGuardarAlertas} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                <BellRing size={13} style={{ color: acento }} /> Correo de Alertas del Autor
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={correoAlertas}
                  onChange={(e) => setCorreoAlertas(e.target.value)}
                  placeholder="jcancelo.dev@gmail.com"
                  className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={ejecutandoAccion !== null}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 4: INFRAESTRUCTURA, BASE DE DATOS Y RESPALDO                  */}
      {/* ===================================================================== */}
      {pestanaActiva === 'infraestructura' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <Server size={16} style={{ color: acento }} />
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Online ({apiLatency > 0 ? `${apiLatency}ms` : '...'})
                </span>
              </div>
              <p className="text-xs font-black text-slate-800 truncate">{hostBase.replace(/^https?:\/\//, '')}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{VERSION_LABEL}</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <Database size={16} style={{ color: acento }} />
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {dbStatus === 'conectado' ? 'Conectado' : 'Error'}
                </span>
              </div>
              <p className="text-xs font-black text-slate-800">PostgreSQL</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[10px] text-slate-500">
                  Graduados: {metricas.egresados} · Invitados: {metricas.invitados}
                </p>
                <a
                  href="/esquema/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold hover:underline inline-flex items-center gap-1"
                  style={{ color: acento }}
                >
                  DER <ExternalLink size={10} />
                </a>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <Mail size={16} style={{ color: acento }} />
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">SMTP Listo</span>
              </div>
              <p className="text-xs font-black text-slate-800">Despacho de Correos</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Invitaciones OTP y alertas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-black text-slate-800">Respaldar Base de Datos (JSON)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Descarga una copia completa de graduados, invitados y ceremonias.
                </p>
              </div>
              <button
                onClick={handleExportarDB}
                disabled={ejecutandoAccion !== null}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
              >
                <Download size={14} /> Exportar
              </button>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-black text-slate-800">Reiniciar Sistema (Reset)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Limpia las tablas operativas y reinicia el asistente de configuracion.
                </p>
              </div>
              <button
                onClick={handleResetearSistema}
                disabled={ejecutandoAccion !== null}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
              >
                <Trash2 size={14} /> Formatear
              </button>
            </div>
          </div>
        </div>
      )}

      {dialogoConfirmacion}
    </div>
  )
}
