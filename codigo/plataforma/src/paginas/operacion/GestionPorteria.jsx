'use client'

import React, { useState, useEffect } from 'react'
import { 
  Shield, UserPlus, QrCode, RefreshCw, AlertCircle, 
  ArrowLeft, CheckCircle2, Lock, Unlock, X, Settings, 
  Search, Mail, Smartphone, CalendarDays, Eye, Cpu, 
  Check, XCircle, Users, Wifi, Globe, Trash2, PowerOff,
  Radio, Sparkles, Copy, CheckCheck, ExternalLink, KeyRound,
  Info, Laptop, Tablet, Clock, Activity, ShieldCheck, ChevronRight
} from 'lucide-react'
import { 
  obtenerUsuarios, 
  crearUsuario, 
  actualizarUsuarioEstado, 
  obtenerUsuarioToken,
  enviarInvitacionUsuario,
  obtenerCeremonias,
  obtenerCeremoniaActiva,
  obtenerAutorizacionesCeremonia,
  actualizarAutorizacionCeremonia,
  autorizarTodosEnCeremonia,
  desautorizarTodosEnCeremonia,
  obtenerDispositivosMoviles,
  desvincularDispositivoAdmin,
  BASE_CLASSIC
} from '../../servicios/api'
import { QRCodeSVG } from 'qrcode.react'
import { useSincronizacion, emitirCambioSync } from '../../lib/sync'

const DARK = '#0F172A'

export function GestionPorteria({ usuario, onVolver, onCerrarSesion }) {
  // Pestaña activa: 'personal' o 'dispositivos'
  const [pestañaActiva, setPestañaActiva] = useState('personal')

  // Listados principales
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(null)

  // Ceremonias y matriz de autorización
  const [ceremonias, setCeremonias] = useState([])
  const [cargandoCeremonias, setCargandoCeremonias] = useState(true)
  const [ceremoniaSeleccionadaId, setCeremoniaSeleccionadaId] = useState('')
  const [autorizadosMap, setAutorizadosMap] = useState({})
  const [guardandoAutorizacion, setGuardandoAutorizacion] = useState(null)
  const [procesandoLote, setProcesandoLote] = useState(false)

  // Dispositivos móviles
  const [dispositivos, setDispositivos] = useState([])
  const [cargandoDispositivos, setCargandoDispositivos] = useState(true)
  const [dispositivoSeleccionado, setDispositivoSeleccionado] = useState(null)
  const [desvinculandoId, setDesvinculandoId] = useState(null)

  // Búsqueda y filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todos')

  // Modales
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviarInvitacionCorreo, setEnviarInvitacionCorreo] = useState(true)
  const [enviandoInvitacionId, setEnviandoInvitacionId] = useState(null)
  const [autoAutorizarActiva, setAutoAutorizarActiva] = useState(true)
  const [creando, setCreando] = useState(false)

  // Modal QR & Enlace
  const [mostrarModalQR, setMostrarModalQR] = useState(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [tokenCargando, setTokenCargando] = useState(false)
  const [tokenUsuario, setTokenUsuario] = useState('')
  const [pestañaModalQR, setPestañaModalQR] = useState('login') // 'login' | 'servidor'
  const [copiadoToken, setCopiadoToken] = useState(false)
  const [copiadoUrl, setCopiadoUrl] = useState(false)
  const [localIp, setLocalIp] = useState(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api`
    }
    return 'https://sigic-one.vercel.app/api'
  })

  // 1. Carga inicial
  useEffect(() => {
    refrescarTodo()
  }, [])

  // Sincronización en vivo
  useSincronizacion(['DISPOSITIVOS', 'USUARIOS', 'CEREMONIAS'], () => {
    cargarUsuarios(false)
    cargarDispositivos(false)
  })

  // 2. Al cambiar la ceremonia seleccionada, recargar el mapa de autorizaciones
  useEffect(() => {
    if (ceremoniaSeleccionadaId) {
      cargarAutorizaciones(ceremoniaSeleccionadaId)
    }
  }, [ceremoniaSeleccionadaId])

  async function cargarCeremonias() {
    setCargandoCeremonias(true)
    try {
      const list = await obtenerCeremonias()
      setCeremonias(list)
      const activa = await obtenerCeremoniaActiva()
      if (activa) {
        setCeremoniaSeleccionadaId(activa.id)
      } else if (list.length > 0) {
        setCeremoniaSeleccionadaId(list[0].id)
      }
    } catch (err) {
      console.error('Error al cargar ceremonias:', err)
    } finally {
      setCargandoCeremonias(false)
    }
  }

  async function cargarAutorizaciones(cerId) {
    if (!cerId) return
    try {
      const list = await obtenerAutorizacionesCeremonia(cerId)
      const map = {}
      if (Array.isArray(list)) {
        list.forEach(userId => {
          map[String(userId)] = true
        })
      }
      setAutorizadosMap(map)
    } catch (err) {
      console.error('Error al cargar autorizaciones:', err)
    }
  }

  async function cargarUsuarios(mostrarCargando = true) {
    if (mostrarCargando) setCargando(true)
    setError(null)
    try {
      const datos = await obtenerUsuarios()
      setUsuarios(datos.filter(u => u.rol === 'PORTERIA'))
    } catch (err) {
      console.error(err)
      setError('Error al obtener la lista de personal de seguridad.')
    } finally {
      if (mostrarCargando) setCargando(false)
    }
  }

  async function cargarDispositivos(mostrarCargando = true) {
    if (mostrarCargando) setCargandoDispositivos(true)
    try {
      const datos = await obtenerDispositivosMoviles()
      setDispositivos(Array.isArray(datos) ? datos : [])
    } catch (err) {
      console.error('Error al cargar dispositivos:', err)
    } finally {
      if (mostrarCargando) setCargandoDispositivos(false)
    }
  }

  function refrescarTodo() {
    cargarUsuarios(true)
    cargarCeremonias()
    cargarDispositivos(true)
  }

  // Toggle de autorización individual para una ceremonia
  async function handleToggleAutorizacion(userId, customCeremoniaId = null) {
    const cerId = customCeremoniaId || ceremoniaSeleccionadaId
    if (!cerId) return
    setGuardandoAutorizacion(userId)
    setError(null)
    
    // Comprobar si está autorizado en esa ceremonia específica
    const actualmenteAutorizado = customCeremoniaId 
      ? (usuarios.find(u => u.id === userId)?.ceremoniasAutorizadas || []).includes(cerId)
      : !!autorizadosMap[String(userId)]

    const nuevoEstado = !actualmenteAutorizado

    try {
      await actualizarAutorizacionCeremonia(cerId, userId, nuevoEstado)
      
      // Actualización optimista del mapa local
      if (cerId === ceremoniaSeleccionadaId) {
        setAutorizadosMap(prev => ({
          ...prev,
          [String(userId)]: nuevoEstado
        }))
      }

      // Actualizar en el array de ceremoniasAutorizadas del usuario
      setUsuarios(prev => prev.map(u => {
        if (u.id !== userId) return u
        const auths = u.ceremoniasAutorizadas ? [...u.ceremoniasAutorizadas] : []
        if (nuevoEstado && !auths.includes(cerId)) auths.push(cerId)
        if (!nuevoEstado) {
          const idx = auths.indexOf(cerId)
          if (idx !== -1) auths.splice(idx, 1)
        }
        return { ...u, ceremoniasAutorizadas: auths }
      }))

      emitirCambioSync('USUARIOS', { id: userId })
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la autorización.')
    } finally {
      setGuardandoAutorizacion(null)
    }
  }

  // Autorizar a todo el personal en la ceremonia seleccionada
  async function handleAutorizarTodos() {
    if (!ceremoniaSeleccionadaId) return
    setProcesandoLote(true)
    setError(null)
    setExito(null)
    try {
      await autorizarTodosEnCeremonia(ceremoniaSeleccionadaId)
      setExito('Todo el personal activo ha sido autorizado en esta ceremonia.')
      await cargarAutorizaciones(ceremoniaSeleccionadaId)
      await cargarUsuarios(false)
      emitirCambioSync('USUARIOS')
      setTimeout(() => setExito(null), 3500)
    } catch (err) {
      setError(err.message || 'No se pudieron autorizar a todos los usuarios.')
    } finally {
      setProcesandoLote(false)
    }
  }

  // Revocar acceso de todo el personal en la ceremonia seleccionada
  async function handleDesautorizarTodos() {
    if (!ceremoniaSeleccionadaId) return
    if (!confirm('¿Deseas quitar la autorización de todo el personal en esta ceremonia?')) return
    setProcesandoLote(true)
    setError(null)
    setExito(null)
    try {
      await desautorizarTodosEnCeremonia(ceremoniaSeleccionadaId)
      setExito('Se han revocado las autorizaciones de esta ceremonia.')
      setAutorizadosMap({})
      await cargarUsuarios(false)
      emitirCambioSync('USUARIOS')
      setTimeout(() => setExito(null), 3500)
    } catch (err) {
      setError(err.message || 'No se pudieron revocar los accesos.')
    } finally {
      setProcesandoLote(false)
    }
  }

  // Enviar invitación de activación a un usuario existente
  async function handleEnviarInvitacion(userId, userEmail) {
    setEnviandoInvitacionId(userId)
    setError(null)
    setExito(null)
    try {
      await enviarInvitacionUsuario(userId)
      setExito(`Enlace de activación enviado por correo a ${userEmail}`)
      setTimeout(() => setExito(null), 4500)
    } catch (err) {
      setError(err.message || 'No se pudo enviar la invitación por correo.')
    } finally {
      setEnviandoInvitacionId(null)
    }
  }

  // Crear nuevo personal de seguridad
  async function handleCrear(e) {
    e.preventDefault()
    if (!nombre || !email) {
      setError('El nombre y el correo electrónico son obligatorios.')
      return
    }
    if (!enviarInvitacionCorreo && !password) {
      setError('Ingresá una contraseña o tildá el envío de invitación por correo.')
      return
    }
    setCreando(true)
    setError(null)
    setExito(null)
    try {
      const res = await crearUsuario({
        nombre,
        email,
        password: enviarInvitacionCorreo ? '' : password,
        rol: 'PORTERIA',
        enviarInvitacion: enviarInvitacionCorreo
      })
      if (res?.usuario?.id && autoAutorizarActiva && ceremoniaSeleccionadaId) {
        await actualizarAutorizacionCeremonia(ceremoniaSeleccionadaId, res.usuario.id, true)
      }
      setExito(
        enviarInvitacionCorreo
          ? `Personal registrado. Se envió el correo de activación a ${email}.`
          : 'Personal de seguridad registrado correctamente.'
      )
      setNombre('')
      setEmail('')
      setPassword('')
      setMostrarModalNuevo(false)
      refrescarTodo()
      setTimeout(() => setExito(null), 4500)
    } catch (err) {
      setError(err.message || 'Error al intentar registrar el usuario.')
    } finally {
      setCreando(false)
    }
  }

  // Bloquear / Reactivar cuenta
  async function handleToggleEstado(id, activoActual) {
    setError(null)
    setExito(null)
    const nuevoEstado = activoActual === 1 ? 0 : 1
    try {
      await actualizarUsuarioEstado(id, nuevoEstado)
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: nuevoEstado } : u))
      setExito(nuevoEstado === 1 ? 'Cuenta reactivada correctamente.' : 'Cuenta bloqueada correctamente.')
      emitirCambioSync('USUARIOS', { id })
      setTimeout(() => setExito(null), 3000)
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado del usuario.')
    }
  }

  // Desvincular dispositivo remoto (forzar cierre de sesión)
  async function handleDesvincularDispositivo(dispositivoId) {
    if (!confirm('¿Deseas cerrar la sesión remota de este dispositivo móvil?')) return
    setDesvinculandoId(dispositivoId)
    try {
      await desvincularDispositivoAdmin(dispositivoId)
      setDispositivos(prev => prev.map(d => d.dispositivoId === dispositivoId ? { ...d, sesionActiva: 0, enLinea: false } : d))
      setExito('Sesión del dispositivo cerrada correctamente.')
      emitirCambioSync('DISPOSITIVOS')
      setTimeout(() => setExito(null), 3000)
    } catch (err) {
      setError(err.message || 'No se pudo desvincular el dispositivo.')
    } finally {
      setDesvinculandoId(null)
      if (dispositivoSeleccionado?.dispositivoId === dispositivoId) {
        setDispositivoSeleccionado(null)
      }
    }
  }

  // Generar QR de acceso
  async function handleGenerarQR(userObj) {
    setUsuarioSeleccionado(userObj)
    setTokenCargando(true)
    setTokenUsuario('')
    setPestañaModalQR('login')
    setCopiadoToken(false)
    setCopiadoUrl(false)
    setMostrarModalQR(true)
    try {
      const res = await obtenerUsuarioToken(userObj.id)
      setTokenUsuario(res.token)
    } catch (err) {
      console.error(err)
      setError('Error al generar el token de acceso.')
      setMostrarModalQR(false)
    } finally {
      setTokenCargando(false)
    }
  }

  function copiarAlPortapapeles(texto, tipo) {
    if (!navigator?.clipboard) return
    navigator.clipboard.writeText(texto).then(() => {
      if (tipo === 'token') {
        setCopiadoToken(true)
        setTimeout(() => setCopiadoToken(false), 2500)
      } else {
        setCopiadoUrl(true)
        setTimeout(() => setCopiadoUrl(false), 2500)
      }
    })
  }

  // Métricas calculadas
  const totalPorteros = usuarios.length
  const autorizadosActivos = usuarios.filter(u => autorizadosMap[String(u.id)]).length
  const porterosActivos = usuarios.filter(u => u.activo === 1).length
  const dispositivosEnLinea = dispositivos.filter(d => d.enLinea).length
  const dispositivosTotales = dispositivos.length

  const personalVisible = usuarios.filter(u => {
    const coincide = `${u.nombre} ${u.email}`.toLowerCase().includes(busqueda.trim().toLowerCase())
    if (!coincide) return false
    const estaAutorizado = !!autorizadosMap[String(u.id)]
    if (filtro === 'autorizados') return estaAutorizado
    if (filtro === 'sin-acceso') return !estaAutorizado
    if (filtro === 'inactivos') return u.activo !== 1
    return true
  })

  const ceremoniaSeleccionada = ceremonias.find(c => String(c.id) === String(ceremoniaSeleccionadaId))

  return (
    <div className="font-sans pb-12 max-w-7xl mx-auto w-full px-3 sm:px-6">
      
      {/* ── HERO BANNER MODERNO CON GRADIENTE Y CONTRASTE ── */}
      <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-slate-900 via-slate-850 to-[#0c182c] p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 mb-8 border border-white/10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky-500/15 blur-[60px]" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-56 w-56 rounded-full bg-indigo-500/10 blur-[50px]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {onVolver && (
              <button 
                onClick={onVolver}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 border border-white/15 backdrop-blur-md cursor-pointer"
                title="Volver al panel"
              >
                <ArrowLeft size={19} />
              </button>
            )}
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-400 text-white shadow-lg shadow-sky-500/30 border border-sky-300/30">
              <Shield size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Seguridad y Control de Accesos</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-400/15 text-sky-300 border border-sky-400/25 text-[10px] font-black uppercase tracking-wider">
                  <Activity size={12} className="text-sky-400 animate-pulse" />
                  Módulo de Portería
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-300/80 mt-1 max-w-xl leading-relaxed">
                Administrá operadores de acreditación, permisos dinámicos por ceremonia y terminales móviles en vivo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <button 
              onClick={refrescarTodo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition active:scale-95 backdrop-blur-sm cursor-pointer shadow-sm"
              title="Refrescar datos en vivo"
            >
              <RefreshCw size={14} className={cargando || cargandoDispositivos ? 'animate-spin text-sky-300' : ''} />
              <span>Actualizar</span>
            </button>

            <button 
              onClick={() => setMostrarModalNuevo(true)} 
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-500/25 active:scale-95 transition-all cursor-pointer border border-sky-300/30"
            >
              <UserPlus size={15} /> 
              <span>Registrar Personal</span>
            </button>
          </div>
        </div>
      </div>

      {/* ALERTAS GLOBALES */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl border bg-rose-50 border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={17} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-rose-100 rounded-lg text-rose-500 cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {exito && (
        <div className="mb-6 p-4 rounded-2xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
            <span>{exito}</span>
          </div>
          <button onClick={() => setExito(null)} className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-500 cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {/* ── BENTO GRID DE MÉTRICAS CON MICRO-GLOW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.16em]">Total Operadores</span>
            <div className="h-10 w-10 rounded-2xl bg-slate-100/80 flex items-center justify-center text-slate-700 border border-slate-200/60"><Users size={19} /></div>
          </div>
          <span className="text-3xl font-black text-slate-900 tabular-nums mt-2 block tracking-tight">{totalPorteros}</span>
          <span className="block text-[11px] font-semibold text-slate-500 mt-1">Cuentas creadas</span>
        </div>

        <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="block text-[10px] font-black uppercase text-emerald-600 tracking-[0.16em]">Habilitados en Foco</span>
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center"><CheckCircle2 size={19} /></div>
          </div>
          <span className="text-3xl font-black text-emerald-600 tabular-nums mt-2 block tracking-tight">{autorizadosActivos}</span>
          <span className="block text-[11px] font-semibold text-slate-500 mt-1 truncate">
            En {ceremoniaSeleccionada?.nombre || 'ceremonia'}
          </span>
        </div>

        <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="block text-[10px] font-black uppercase text-sky-600 tracking-[0.16em]">Cuentas Operativas</span>
            <div className="h-10 w-10 rounded-2xl bg-sky-50 text-sky-500 border border-sky-100 flex items-center justify-center"><Unlock size={19} /></div>
          </div>
          <span className="text-3xl font-black text-sky-500 tabular-nums mt-2 block tracking-tight">{porterosActivos}</span>
          <span className="block text-[11px] font-semibold text-slate-500 mt-1">Sin bloqueo activo</span>
        </div>

        <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="block text-[10px] font-black uppercase text-indigo-600 tracking-[0.16em]">Móviles en Línea</span>
              {dispositivosEnLinea > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center"><Smartphone size={19} /></div>
          </div>
          <span className="text-3xl font-black text-indigo-600 tabular-nums mt-2 block tracking-tight">{dispositivosEnLinea}</span>
          <span className="block text-[11px] font-semibold text-slate-500 mt-1">De {dispositivosTotales} vinculados</span>
        </div>
      </div>

      {/* ── SELECTOR DE PESTAÑAS TIPO CAPSULA PREMIUM ── */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 mb-7 max-w-fit shadow-inner">
        <button
          onClick={() => setPestañaActiva('personal')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            pestañaActiva === 'personal'
              ? 'bg-white text-slate-900 shadow-md shadow-slate-900/5'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users size={16} className={pestañaActiva === 'personal' ? 'text-sky-500' : ''} />
          <span>Personal & Permisos por Ceremonia</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${pestañaActiva === 'personal' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {totalPorteros}
          </span>
        </button>

        <button
          onClick={() => setPestañaActiva('dispositivos')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
            pestañaActiva === 'dispositivos'
              ? 'bg-white text-slate-900 shadow-md shadow-slate-900/5'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone size={16} className={pestañaActiva === 'dispositivos' ? 'text-indigo-500' : ''} />
          <span>Dispositivos Móviles & Telemetría</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${dispositivosEnLinea > 0 ? 'bg-emerald-500 text-white' : pestañaActiva === 'dispositivos' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {dispositivosTotales}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: PERSONAL & MATRIZ DE AUTORIZACIONES */}
      {/* ======================================================== */}
      {pestañaActiva === 'personal' && (
        <div className="space-y-5">
          
          {/* BARRA DE CONFIGURACIÓN Y ACCIONES EN LOTE POR CEREMONIA */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 border border-sky-100">
                <Settings size={22} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Ceremonia en Configuración</span>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={ceremoniaSeleccionadaId}
                    onChange={e => setCeremoniaSeleccionadaId(e.target.value)}
                    className="bg-slate-50 border border-slate-250 hover:border-sky-400 focus:border-sky-500 focus:bg-white text-xs font-black rounded-xl px-4 py-2 text-slate-900 outline-none transition cursor-pointer shadow-sm"
                  >
                    {ceremonias.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.activa === 1 ? '★ [ACTIVA]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ACCIONES RÁPIDAS EN LOTE */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <button
                onClick={handleAutorizarTodos}
                disabled={procesandoLote || !ceremoniaSeleccionadaId}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
                title="Habilita a todos los operadores activos para escanear en esta ceremonia"
              >
                <CheckCircle2 size={15} />
                <span>Autorizar a Todos</span>
              </button>

              <button
                onClick={handleDesautorizarTodos}
                disabled={procesandoLote || !ceremoniaSeleccionadaId}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
                title="Revoca el acceso de todos los operadores en esta ceremonia"
              >
                <XCircle size={15} />
                <span>Revocar Todos</span>
              </button>
            </div>
          </div>

          {/* FILTROS Y BÚSQUEDA */}
          <div className="flex flex-col sm:flex-row gap-3.5 items-center justify-between bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Filtrar:</span>
              <select
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-sky-400 cursor-pointer"
              >
                <option value="todos">Todos los operadores ({usuarios.length})</option>
                <option value="autorizados">Autorizados en esta ceremonia ({autorizadosActivos})</option>
                <option value="sin-acceso">Sin autorización en esta ceremonia ({totalPorteros - autorizadosActivos})</option>
                <option value="inactivos">Cuentas bloqueadas</option>
              </select>
            </div>
          </div>

          {/* LISTADO DE TARJETAS DE PERSONAL */}
          {cargando ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-14 text-center shadow-sm">
              <RefreshCw size={28} className="animate-spin text-sky-500 mx-auto mb-3" />
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Cargando cuentas de seguridad...</p>
            </div>
          ) : personalVisible.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 px-6 text-center shadow-sm">
              <Shield size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-base font-black text-slate-900">No se encontraron operadores</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Registrá un operador o modificá los filtros de búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {personalVisible.map(u => {
                const autorizadoEnSeleccionada = !!autorizadosMap[String(u.id)]
                const activo = u.activo === 1
                const authsList = u.ceremoniasAutorizadas || []

                return (
                  <article 
                    key={u.id} 
                    className={`rounded-[28px] border p-6 transition-all duration-200 shadow-sm flex flex-col justify-between hover:shadow-md ${
                      autorizadoEnSeleccionada && activo 
                        ? 'border-sky-300/80 bg-gradient-to-br from-white via-white to-sky-50/35 ring-1 ring-sky-200' 
                        : 'border-slate-200/90 bg-white'
                    }`}
                  >
                    <div>
                      {/* ENCABEZADO DE LA TARJETA */}
                      <div className="flex items-start justify-between gap-3.5 mb-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black shadow-sm ${
                            activo ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'
                          }`}>
                            {u.nombre?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-black text-slate-900">{u.nombre}</h3>
                            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-500">
                              <Mail size={13} /> {u.email}
                            </p>
                          </div>
                        </div>

                        <span className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
                          activo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {activo ? 'Activo' : 'Bloqueado'}
                        </span>
                      </div>

                      {/* MATRIZ / PÍLDORAS DE CEREMONIAS ASIGNADAS */}
                      <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                            Ceremonias asignadas ({authsList.length}):
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold">Tocar para alternar</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {ceremonias.map(c => {
                            const estaAuth = authsList.includes(String(c.id))
                            const esLaEnFoco = String(c.id) === String(ceremoniaSeleccionadaId)

                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleToggleAutorizacion(u.id, c.id)}
                                disabled={guardandoAutorizacion === u.id}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition active:scale-95 cursor-pointer border ${
                                  estaAuth
                                    ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                } ${esLaEnFoco ? 'ring-2 ring-sky-400 ring-offset-1' : ''}`}
                                title={`${estaAuth ? 'Quitar permiso' : 'Autorizar'} en "${c.nombre}"`}
                              >
                                {estaAuth ? <Check size={12} className="stroke-[3]" /> : <X size={12} />}
                                <span className="truncate max-w-[140px]">{c.nombre}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* METADATOS COMPACTOS */}
                      <div className="grid grid-cols-2 gap-2.5 mb-4 text-[10px]">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <span className="text-slate-400 font-bold block uppercase text-[8px]">Último Acceso</span>
                          <strong className="text-slate-800 block truncate mt-0.5">
                            {u.ultimo_login ? new Date(u.ultimo_login).toLocaleString('es-AR') : 'Nunca'}
                          </strong>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${
                          autorizadoEnSeleccionada ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-amber-50/80 border-amber-200 text-amber-900'
                        }`}>
                          <span className="font-bold block uppercase text-[8px]">En ceremonia en foco</span>
                          <strong className="block truncate mt-0.5">
                            {autorizadoEnSeleccionada ? '✓ Habilitado' : '✗ Sin permiso'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="flex flex-wrap items-center gap-2 pt-3.5 border-t border-slate-100 mt-1">
                      <button
                        onClick={() => handleToggleAutorizacion(u.id)}
                        disabled={guardandoAutorizacion === u.id}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer ${
                          autorizadoEnSeleccionada
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-slate-900 text-white hover:bg-sky-500 shadow-sm'
                        }`}
                      >
                        {guardandoAutorizacion === u.id ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : autorizadoEnSeleccionada ? (
                          <XCircle size={13} />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                        <span>{autorizadoEnSeleccionada ? 'Quitar de esta' : 'Autorizar en esta'}</span>
                      </button>

                      <button
                        onClick={() => handleToggleEstado(u.id, u.activo)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer border ${
                          activo 
                            ? 'bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {activo ? <Lock size={13} /> : <Unlock size={13} />}
                        <span>{activo ? 'Bloquear' : 'Reactivar'}</span>
                      </button>

                      <button
                        onClick={() => handleEnviarInvitacion(u.id, u.email)}
                        disabled={enviandoInvitacionId === u.id || !activo}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-200 text-[10px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer disabled:opacity-40"
                        title="Enviar por correo electrónico el enlace para crear o cambiar su contraseña privada"
                      >
                        {enviandoInvitacionId === u.id ? (
                          <RefreshCw size={13} className="animate-spin text-sky-500" />
                        ) : (
                          <Mail size={13} className="text-sky-600" />
                        )}
                        <span>{enviandoInvitacionId === u.id ? 'Enviando...' : 'Invitar'}</span>
                      </button>

                      <button
                        onClick={() => handleGenerarQR(u)}
                        disabled={!activo}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-sky-50 hover:bg-sky-500 text-sky-600 hover:text-white border border-sky-200 text-[10px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer disabled:opacity-40"
                        title="Generar credencial QR para inicio de sesión directo en la app"
                      >
                        <QrCode size={13} />
                        <span>Pase QR</span>
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: DISPOSITIVOS MÓVILES & TELEMETRÍA EN VIVO */}
      {/* ======================================================== */}
      {pestañaActiva === 'dispositivos' && (
        <div className="space-y-5">
          
          {/* HEADER DE ESTADO DE DISPOSITIVOS */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="h-13 w-13 rounded-2xl bg-white/10 text-sky-400 flex items-center justify-center border border-white/10 shadow-inner">
                <Smartphone size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-black">Escáneres y Terminales Vinculadas</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[9px] font-black uppercase tracking-wider">
                    Telemetría en Vivo
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Dispositivos autorizados que operan la aplicación móvil SiGIC Accesos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-right">
                <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Estado</span>
                <span className="text-xs font-black text-emerald-400 flex items-center gap-2 justify-end mt-0.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {dispositivosEnLinea} en línea · {dispositivosTotales} vinculados
                </span>
              </div>
            </div>
          </div>

          {/* LISTA DE DISPOSITIVOS */}
          {cargandoDispositivos ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-14 text-center shadow-sm">
              <RefreshCw size={28} className="animate-spin text-sky-500 mx-auto mb-3" />
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Consultando terminales móviles...</p>
            </div>
          ) : dispositivos.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 px-6 text-center shadow-sm">
              <Smartphone size={44} className="mx-auto mb-3 text-slate-300" />
              <h3 className="text-base font-black text-slate-900">Todavía no hay dispositivos móviles registrados</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Los dispositivos aparecerán automáticamente tan pronto como un operador abra la app móvil SiGIC Accesos o inicie sesión escaneando su Pase QR.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {dispositivos.map(d => {
                const enLinea = Boolean(d.enLinea)
                const sesionActiva = d.sesionActiva === 1

                return (
                  <article 
                    key={d.dispositivoId}
                    className="bg-white rounded-[28px] border border-slate-200/90 p-5.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* ESTADO SUPERIOR */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                            enLinea ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <Smartphone size={22} />
                            <span className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
                              enLinea ? 'bg-emerald-500' : sesionActiva ? 'bg-amber-400' : 'bg-slate-400'
                            }`} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-black text-slate-900">
                              {d.nombreDispositivo || `${d.marca || 'Móvil'} ${d.modelo || ''}`}
                            </h4>
                            <p className="truncate text-xs font-semibold text-slate-500 mt-0.5">
                              {d.usuarioNombre || 'Operador de portería'}
                            </p>
                          </div>
                        </div>

                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-wider ${
                          enLinea 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : sesionActiva 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {enLinea ? '🟢 En línea' : sesionActiva ? '🟡 Inactivo' : '⚪ Desconectado'}
                        </span>
                      </div>

                      {/* DATOS DE TELEMETRÍA */}
                      <div className="grid grid-cols-2 gap-2 my-3.5 text-[10px]">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 font-bold block uppercase text-[8px]">Sistema Operativo</span>
                          <strong className="text-slate-800 block truncate mt-0.5">
                            {d.sistema || 'Android'} {d.versionSistema?.slice(0, 10) || ''}
                          </strong>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 font-bold block uppercase text-[8px]">Versión App</span>
                          <strong className="text-slate-800 block truncate mt-0.5">
                            {d.versionApp || '1.0.5+6'}
                          </strong>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 font-bold block uppercase text-[8px]">IP Origen</span>
                          <strong className="text-slate-800 block truncate mt-0.5 font-mono">
                            {d.ipUltimoAcceso || '127.0.0.1'}
                          </strong>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 font-bold block uppercase text-[8px]">Último Ping</span>
                          <strong className="text-slate-800 block truncate mt-0.5">
                            {d.ultimoAcceso ? new Date(d.ultimoAcceso).toLocaleTimeString('es-AR') : '—'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* BOTONES DE CONTROL REMOTO */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-2">
                      <button
                        onClick={() => setDispositivoSeleccionado(d)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Detalles</span>
                      </button>

                      {sesionActiva && (
                        <button
                          onClick={() => handleDesvincularDispositivo(d.dispositivoId)}
                          disabled={desvinculandoId === d.dispositivoId}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer disabled:opacity-50"
                          title="Forzar cierre de sesión en este móvil"
                        >
                          {desvinculandoId === d.dispositivoId ? <RefreshCw size={13} className="animate-spin" /> : <PowerOff size={13} />}
                          <span>Desconectar</span>
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DETALLE DIAGNÓSTICO DEL DISPOSITIVO */}
      {/* ======================================================== */}
      {dispositivoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-[32px] border border-white/10 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative overflow-hidden bg-slate-900 p-7 text-white">
              <button 
                onClick={() => setDispositivoSeleccionado(null)} 
                className="absolute right-5 top-5 z-10 rounded-xl bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
              <div className="relative flex items-center gap-4 pr-10">
                <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-sky-400/20 text-sky-300 border border-sky-300/20 shadow-inner">
                  <Smartphone size={26} />
                </span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-400">Diagnóstico de Terminal</p>
                  <h3 className="mt-1 text-lg font-black">{dispositivoSeleccionado.nombreDispositivo || dispositivoSeleccionado.marca || 'Móvil'}</h3>
                  <p className="mt-0.5 text-xs font-semibold text-slate-400">{dispositivoSeleccionado.usuarioNombre} · {dispositivoSeleccionado.usuarioEmail}</p>
                </div>
              </div>
            </div>

            <div className="p-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  ['Fabricante / Marca', dispositivoSeleccionado.fabricante || dispositivoSeleccionado.marca || 'No informado'],
                  ['Modelo', dispositivoSeleccionado.modelo || 'No informado'],
                  ['Sistema operativo', `${dispositivoSeleccionado.sistema || 'Desconocido'} ${dispositivoSeleccionado.versionSistema || ''}`.trim()],
                  ['Versión de SiGIC', dispositivoSeleccionado.versionApp || '1.0.5+6'],
                  ['Dirección IP', dispositivoSeleccionado.ipUltimoAcceso || 'No disponible'],
                  ['Primera conexión', dispositivoSeleccionado.primeraConexion ? new Date(dispositivoSeleccionado.primeraConexion).toLocaleString('es-AR') : 'No disponible'],
                  ['Último contacto', dispositivoSeleccionado.ultimoAcceso ? new Date(dispositivoSeleccionado.ultimoAcceso).toLocaleString('es-AR') : 'No disponible'],
                  ['Estado de Sesión', dispositivoSeleccionado.sesionActiva === 1 ? 'Activa' : 'Cerrada'],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">{etiqueta}</span>
                    <strong className="mt-1 block break-words text-xs font-bold text-slate-800">{valor}</strong>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/80 p-3.5">
                <span className="block text-[8px] font-black uppercase tracking-wider text-sky-700">ID de Telemetría Única</span>
                <code className="mt-1 block break-all text-[11px] font-mono font-bold text-sky-950">{dispositivoSeleccionado.dispositivoId}</code>
              </div>

              <div className="mt-6 flex gap-3">
                {dispositivoSeleccionado.sesionActiva === 1 && (
                  <button 
                    onClick={() => handleDesvincularDispositivo(dispositivoSeleccionado.dispositivoId)}
                    className="flex-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-3 text-xs font-bold transition cursor-pointer"
                  >
                    Cerrar Sesión Remota
                  </button>
                )}
                <button 
                  onClick={() => setDispositivoSeleccionado(null)} 
                  className="flex-1 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-sky-500 cursor-pointer shadow-md"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR NUEVO OPERADOR */}
      {/* ======================================================== */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-7 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-500 border border-sky-100 flex items-center justify-center shadow-sm">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Registrar Personal</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Crear credenciales de acceso para portería</p>
                </div>
              </div>
              <button 
                onClick={() => setMostrarModalNuevo(false)} 
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCrear} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Nombre Completo</label>
                <input 
                  type="text" 
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)} 
                  placeholder="Ej: Marcos Gómez"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="porteria@sigic.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none transition"
                  required
                />
              </div>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80 cursor-pointer transition hover:bg-sky-50">
                <input
                  type="checkbox"
                  checked={enviarInvitacionCorreo}
                  onChange={e => setEnviarInvitacionCorreo(e.target.checked)}
                  className="mt-0.5 rounded text-sky-500 focus:ring-sky-400 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="block text-xs font-bold text-sky-950 leading-tight">
                    Enviar enlace de activación por correo electrónico
                  </span>
                  <span className="block text-[11px] font-medium text-sky-700 mt-0.5">
                    El operador recibirá un correo para definir su propia contraseña privada.
                  </span>
                </div>
              </label>

              {!enviarInvitacionCorreo && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Contraseña Manual</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Mínimo 8 caracteres"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none transition"
                    required={!enviarInvitacionCorreo}
                    minLength={8}
                  />
                </div>
              )}

              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAutorizarActiva}
                  onChange={e => setAutoAutorizarActiva(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-sky-400 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700 leading-snug">
                  Habilitar automáticamente en la ceremonia en foco
                </span>
              </label>

              <div className="pt-3 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setMostrarModalNuevo(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={creando}
                  className="flex-1 py-3 bg-slate-900 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {creando ? <RefreshCw size={15} className="animate-spin" /> : 'Crear Operador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ENLAZAR ESCÁNER Y PASE QR (DISEÑO ULTRA-POLISHED) */}
      {/* ======================================================== */}
      {mostrarModalQR && usuarioSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] overflow-hidden max-w-2xl w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            
            {/* CABECERA CON CONTRASTE ELEGANTE */}
            <div className="relative bg-slate-900 p-6 sm:p-7 text-white overflow-hidden">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-500/20 blur-2xl" />
              <button 
                onClick={() => setMostrarModalQR(false)} 
                className="absolute right-5 top-5 z-10 rounded-xl bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white cursor-pointer"
              >
                <X size={19} />
              </button>
              <div className="relative flex items-center gap-4 pr-8">
                <div className="w-13 h-13 rounded-2xl bg-sky-400/20 text-sky-300 border border-sky-300/20 flex items-center justify-center shadow-inner">
                  <QrCode size={26} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-400">Acceso Rápido Móvil</span>
                  <h3 className="mt-0.5 text-lg font-black text-white">Enlazar Escáner de Portería</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    Operador: <strong className="text-white">{usuarioSeleccionado.nombre}</strong> · {usuarioSeleccionado.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* SELECTOR DE PESTAÑAS DENTRO DEL MODAL */}
              <div className="flex items-center gap-2 mb-6 p-1 bg-slate-100 rounded-xl border border-slate-200/60 max-w-fit">
                <button
                  onClick={() => setPestañaModalQR('login')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                    pestañaModalQR === 'login'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound size={14} className={pestañaModalQR === 'login' ? 'text-sky-500' : ''} />
                  <span>Pase de Inicio de Sesión</span>
                </button>

                <button
                  onClick={() => setPestañaModalQR('servidor')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                    pestañaModalQR === 'servidor'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe size={14} className={pestañaModalQR === 'servidor' ? 'text-amber-500' : ''} />
                  <span>Configuración Servidor API</span>
                </button>
              </div>

              {/* CONTENIDO PESTAÑA 1: LOGIN DIRECTO */}
              {pestañaModalQR === 'login' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50/80 rounded-2xl border border-slate-200 shadow-inner">
                    {tokenCargando ? (
                      <div className="w-44 h-44 flex items-center justify-center">
                        <RefreshCw size={28} className="animate-spin text-sky-500" />
                      </div>
                    ) : tokenUsuario ? (
                      <QRCodeSVG 
                        value={`sigic-login:${tokenUsuario}`} 
                        size={175} 
                        level="L" 
                        fgColor={DARK} 
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-rose-500 text-xs font-bold text-center p-4">
                        No se pudo generar el token. Reintentar.
                      </div>
                    )}
                    <span className="mt-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Pase QR de Operador
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-100">
                      <div className="flex items-center gap-2 text-sky-900 font-bold text-xs">
                        <Sparkles size={16} className="text-sky-500 shrink-0" />
                        <span>Inicio instantáneo con la cámara</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1.5">
                        Abrí la app móvil <strong>SiGIC Accesos</strong> y apuntá la cámara a este código para iniciar sesión sin teclear usuario ni contraseña.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Token de sesión segura:</span>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-bold text-slate-800 truncate">
                          {tokenUsuario ? `${tokenUsuario.slice(0, 24)}...` : 'Generando...'}
                        </code>
                        {tokenUsuario && (
                          <button
                            onClick={() => copiarAlPortapapeles(tokenUsuario, 'token')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 transition active:scale-95 cursor-pointer shrink-0 shadow-sm"
                          >
                            {copiadoToken ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            <span>{copiadoToken ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENIDO PESTAÑA 2: CONFIGURACIÓN DE SERVIDOR / RED */}
              {pestañaModalQR === 'servidor' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50/80 rounded-2xl border border-slate-200 shadow-inner">
                    <QRCodeSVG 
                      value={`sigic-config:${localIp}`} 
                      size={175} 
                      level="H" 
                      fgColor={DARK} 
                    />
                    <span className="mt-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                      QR de Enlace de Red
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <Globe size={16} className="text-amber-600 shrink-0" />
                        <span>Enlace de Servidor API</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1.5">
                        Si el teléfono opera en una red Wi-Fi local o servidor privado, escaneá este código para enlazar la dirección API en un toque.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Dirección Base API:</span>
                        <button
                          onClick={() => copiarAlPortapapeles(localIp, 'url')}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 transition active:scale-95 cursor-pointer shadow-sm"
                        >
                          {copiadoUrl ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          <span>{copiadoUrl ? 'Copiada' : 'Copiar'}</span>
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={localIp}
                        onChange={e => setLocalIp(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PIE DEL MODAL */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">
                  SiGIC Accesos · App Flutter Oficial
                </span>
                <button 
                  onClick={() => setMostrarModalQR(false)}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-sky-500 transition active:scale-95 shadow-md cursor-pointer ml-auto"
                >
                  Listo, Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
