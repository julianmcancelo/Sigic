'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Shield, UserPlus, QrCode, RefreshCw, AlertCircle, 
  ArrowLeft, CheckCircle2, Lock, Unlock, X, Settings, 
  Search, Mail, Smartphone, CalendarDays, Eye, Cpu, 
  Check, XCircle, Users, Wifi, Globe, Trash2, PowerOff,
  Radio, Sparkles, Copy, CheckCheck, ExternalLink, KeyRound,
  Info, Laptop, Tablet, Clock, Activity, ShieldCheck, ChevronRight,
  Maximize2, Minimize2, ChevronDown, ChevronUp, SlidersHorizontal
} from 'lucide-react'
import { 
  obtenerUsuarios, 
  crearUsuario, 
  actualizarUsuarioEstado, 
  actualizarUsuarioRol,
  eliminarUsuario,
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
// Eliminar import './seguridad.css' ya que se usan clases nativas de Tailwind CSS
const DARK = '#0F172A'
const normalizarBusqueda = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

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
  const [cargandoAutorizaciones, setCargandoAutorizaciones] = useState(false)
  const solicitudAutorizaciones = useRef(0)
  const [personalExpandido, setPersonalExpandido] = useState(null)
  const [procesandoLote, setProcesandoLote] = useState(false)

  // Dispositivos móviles
  const [dispositivos, setDispositivos] = useState([])
  const [cargandoDispositivos, setCargandoDispositivos] = useState(true)
  const [dispositivoSeleccionado, setDispositivoSeleccionado] = useState(null)
  const [desvinculandoId, setDesvinculandoId] = useState(null)

  // Búsqueda y filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [modoComprimido, setModoComprimido] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_porteria_comprimido') === 'true' : false))
  const [mostrarStats, setMostrarStats] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_porteria_stats') !== 'false' : true))

  // Modales
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rolNuevo, setRolNuevo] = useState('ADMINISTRATIVO')
  const [enviarInvitacionCorreo, setEnviarInvitacionCorreo] = useState(true)
  const [enviandoInvitacionId, setEnviandoInvitacionId] = useState(null)
  const [eliminandoId, setEliminandoId] = useState(null)
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
    const solicitud = ++solicitudAutorizaciones.current
    setCargandoAutorizaciones(true)
    setAutorizadosMap({})
    try {
      const list = await obtenerAutorizacionesCeremonia(cerId)
      if (solicitud !== solicitudAutorizaciones.current) return
      const map = {}
      if (Array.isArray(list)) {
        list.forEach(userId => {
          map[String(userId)] = true
        })
      }
      setAutorizadosMap(map)
    } catch (err) {
      if (solicitud === solicitudAutorizaciones.current) setError('No se pudieron cargar los permisos. Actualizá para volver a intentar.')
    } finally {
      if (solicitud === solicitudAutorizaciones.current) setCargandoAutorizaciones(false)
    }
  }

  async function cargarUsuarios(mostrarCargando = true) {
    if (mostrarCargando) setCargando(true)
    setError(null)
    try {
      const datos = await obtenerUsuarios()
      setUsuarios(Array.isArray(datos) ? datos : [])
    } catch (err) {
      console.error(err)
      setError('Error al obtener la lista de usuarios del equipo.')
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
    if (!cerId || guardandoAutorizacion !== null || procesandoLote || cargandoAutorizaciones) return
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

  // Cambiar rol de un usuario existente
  async function handleCambiarRol(userId, nuevoRol) {
    setError(null)
    setExito(null)
    try {
      await actualizarUsuarioRol(userId, nuevoRol)
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, rol: nuevoRol } : u))
      setExito('Rol del usuario actualizado correctamente.')
      emitirCambioSync('USUARIOS', { id: userId })
      setTimeout(() => setExito(null), 3000)
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el rol.')
    }
  }

  // Eliminar usuario permanentemente
  async function handleEliminarUsuario(userId, userNombre) {
    if (!confirm(`¿Estás seguro de que deseas eliminar a "${userNombre || 'este usuario'}"? Esta acción borrará permanentemente sus accesos.`)) {
      return
    }
    setEliminandoId(userId)
    setError(null)
    setExito(null)
    try {
      await eliminarUsuario(userId)
      setUsuarios(prev => prev.filter(u => u.id !== userId))
      setExito(`Usuario "${userNombre}" eliminado correctamente.`)
      emitirCambioSync('USUARIOS', { id: userId })
      setTimeout(() => setExito(null), 3500)
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el usuario.')
    } finally {
      setEliminandoId(null)
    }
  }

  // Crear o invitar nuevo usuario del equipo
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
        rol: rolNuevo,
        enviarInvitacion: enviarInvitacionCorreo
      })
      if (res?.usuario?.id && autoAutorizarActiva && ceremoniaSeleccionadaId) {
        await actualizarAutorizacionCeremonia(ceremoniaSeleccionadaId, res.usuario.id, true)
      }
      setExito(
        enviarInvitacionCorreo
          ? `Usuario registrado como ${rolNuevo}. Se envió la invitación de activación a ${email}.`
          : `Usuario registrado como ${rolNuevo} correctamente.`
      )
      setNombre('')
      setEmail('')
      setPassword('')
      setRolNuevo('ADMINISTRATIVO')
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
  const porterosActivos = usuarios.filter(u => Number(u.activo) === 1).length
  const dispositivosEnLinea = dispositivos.filter(d => d.enLinea).length
  const dispositivosTotales = dispositivos.length
  const usuariosSinPermiso = usuarios.filter(u => u.rol === 'PORTERIA' && !autorizadosMap[String(u.id)]).length

  const personalVisible = usuarios.filter(u => {
    const coincide = normalizarBusqueda(`${u.nombre} ${u.email} ${u.rol}`).includes(normalizarBusqueda(busqueda.trim()))
    if (!coincide) return false
    const estaAutorizado = Number(u.activo) === 1 && (u.rol === 'ADMINISTRATIVO' || !!autorizadosMap[String(u.id)])
    if (filtro === 'administrativos') return u.rol === 'ADMINISTRATIVO'
    if (filtro === 'porteria') return u.rol === 'PORTERIA'
    if (filtro === 'autorizados') return estaAutorizado
    if (filtro === 'sin-acceso') return u.rol === 'PORTERIA' && !autorizadosMap[String(u.id)]
    if (filtro === 'activos') return Number(u.activo) === 1
    if (filtro === 'inactivos') return Number(u.activo) !== 1
    return true
  })

  const dispositivosVisibles = dispositivos.filter(d => {
    const coincide = normalizarBusqueda(`${d.nombreDispositivo || ''} ${d.modelo || ''} ${d.marca || ''} ${d.usuarioNombre || ''} ${d.usuarioEmail || ''}`).includes(normalizarBusqueda(busqueda.trim()))
    return coincide
  })

  const ceremoniaActual = ceremonias.find(c => String(c.id) === String(ceremoniaSeleccionadaId))

  return (
    <div className="font-sans space-y-6">
      {/* HEADER INTEGRADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          {onVolver && (
            <button 
              onClick={onVolver} 
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
              aria-label="Volver al panel"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Seguridad y Accesos Móviles
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200/80 px-2 py-0.5 rounded-md">
                Control Institucional
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Gestión de personal de portería, asignación de permisos por ceremonia y terminales móviles conectadas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Botón para Ocultar / Mostrar Cuadros de Métricas */}
          <button 
            type="button"
            onClick={() => {
              const nuevo = !mostrarStats;
              setMostrarStats(nuevo);
              if (typeof window !== 'undefined') localStorage.setItem('sigic_porteria_stats', String(nuevo));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition active:scale-95 shadow-2xs cursor-pointer"
            title={mostrarStats ? "Ocultar tarjetas de métricas" : "Mostrar tarjetas de métricas"}
          >
            {mostrarStats ? <Eye size={14} className="text-slate-500" /> : <Eye size={14} className="text-sky-600" />}
            <span className="hidden sm:inline">{mostrarStats ? 'Ocultar Métricas' : 'Ver Métricas'}</span>
          </button>

          <button 
            onClick={refrescarTodo} 
            disabled={cargando || cargandoDispositivos}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition active:scale-95 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={cargando || cargandoDispositivos ? 'animate-spin text-sky-500' : 'text-slate-500'} />
            <span>Actualizar</span>
          </button>
          <button 
            onClick={() => setMostrarModalNuevo(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md shadow-slate-900/10 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Nuevo Personal</span>
          </button>
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS BENTO CON COLAPSO FLUIDO */}
      <div className={`transition-all duration-400 ease-in-out overflow-hidden ${
        mostrarStats ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 pointer-events-none'
      }`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-0.5">
          <button 
            onClick={() => { setPestañaActiva('personal'); setFiltro('todos'); setBusqueda('') }}
            className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer group flex flex-col justify-between ${
              pestañaActiva === 'personal' && filtro === 'todos'
                ? 'bg-gradient-to-br from-sky-50/90 to-white border-sky-300 shadow-xs ring-1 ring-sky-400/20'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Personal</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
                <Users size={16} />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{usuarios.length}</div>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Operadores y gestión</p>
            </div>
          </button>

          <button 
            onClick={() => { setPestañaActiva('personal'); setFiltro('activos'); setBusqueda('') }}
            className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer group flex flex-col justify-between ${
              pestañaActiva === 'personal' && filtro === 'activos'
                ? 'bg-gradient-to-br from-emerald-50/90 to-white border-emerald-300 shadow-xs ring-1 ring-emerald-400/20'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cuentas Activas</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">{porterosActivos}</div>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Habilitados para operar</p>
            </div>
          </button>

          <button 
            onClick={() => { setPestañaActiva('personal'); setFiltro('sin-acceso'); setBusqueda('') }}
            className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer group flex flex-col justify-between ${
              pestañaActiva === 'personal' && filtro === 'sin-acceso'
                ? 'bg-gradient-to-br from-amber-50/90 to-white border-amber-300 shadow-xs ring-1 ring-amber-400/20'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sin Permiso</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <KeyRound size={16} />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-700 tracking-tight">{usuariosSinPermiso}</div>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">En ceremonia activa</p>
            </div>
          </button>

          <button 
            onClick={() => { setPestañaActiva('dispositivos'); setBusqueda('') }}
            className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer group flex flex-col justify-between ${
              pestañaActiva === 'dispositivos'
                ? 'bg-gradient-to-br from-indigo-50/90 to-white border-indigo-300 shadow-xs ring-1 ring-indigo-400/20'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Terminales Móviles</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <Smartphone size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-xl sm:text-2xl font-black text-indigo-900 tracking-tight">{dispositivosEnLinea}</div>
                <span className="text-xs font-bold text-slate-400">/ {dispositivosTotales} tot.</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Enlazados a la app Flutter</p>
            </div>
          </button>
        </div>
      </div>

      {/* NOTIFICACIONES Y AVISOS */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 text-rose-500 hover:text-rose-800 rounded-lg hover:bg-rose-100 cursor-pointer">
            <X size={15} />
          </button>
        </div>
      )}

      {exito && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{exito}</span>
          </div>
          <button onClick={() => setExito(null)} className="p-1 text-emerald-500 hover:text-emerald-800 rounded-lg hover:bg-emerald-100 cursor-pointer">
            <X size={15} />
          </button>
        </div>
      )}

      {/* NAVEGACIÓN POR PESTAÑAS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-0">
        <button
          onClick={() => { setPestañaActiva('personal'); setBusqueda('') }}
          className={`flex items-center gap-2.5 px-4 py-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
            pestañaActiva === 'personal'
              ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Users size={16} />
          <span>Personal y Permisos</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            pestañaActiva === 'personal' ? 'bg-sky-200/70 text-sky-900' : 'bg-slate-100 text-slate-600'
          }`}>
            {usuarios.length}
          </span>
        </button>

        <button
          onClick={() => { setPestañaActiva('dispositivos'); setBusqueda('') }}
          className={`flex items-center gap-2.5 px-4 py-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
            pestañaActiva === 'dispositivos'
              ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Smartphone size={16} />
          <span>Dispositivos Móviles</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            pestañaActiva === 'dispositivos' ? 'bg-sky-200/70 text-sky-900' : 'bg-slate-100 text-slate-600'
          }`}>
            {dispositivosTotales}
          </span>
        </button>
      </div>

      {/* PESTAÑA 1: PERSONAL Y PERMISOS */}
      {pestañaActiva === 'personal' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* BARRA DE CEREMONIA & ACCIONES EN LOTE */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-sky-50/30 to-slate-50 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-sky-600 shrink-0">
                <CalendarDays size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Ceremonia bajo control
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <select 
                    aria-label="Ceremonia para permisos" 
                    value={ceremoniaSeleccionadaId} 
                    disabled={cargandoCeremonias || procesandoLote || guardandoAutorizacion !== null} 
                    onChange={e => setCeremoniaSeleccionadaId(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400/20 cursor-pointer max-w-sm truncate shadow-2xs"
                  >
                    {!ceremonias.length && <option value="">{cargandoCeremonias ? 'Cargando ceremonias…' : 'Sin ceremonias disponibles'}</option>}
                    {ceremonias.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.activa ? '· Activa en Puesto' : ''}
                      </option>
                    ))}
                  </select>
                  {ceremoniaActual?.activa && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Activa
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ACCIONES EN LOTE */}
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleAutorizarTodos} 
                disabled={!ceremoniaSeleccionadaId || procesandoLote || cargandoAutorizaciones}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-50"
                title="Habilitar a todo el personal activo en esta ceremonia"
              >
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Autorizar Todos</span>
              </button>

              <button 
                onClick={handleDesautorizarTodos} 
                disabled={!ceremoniaSeleccionadaId || procesandoLote || cargandoAutorizaciones}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-50"
                title="Revocar acceso a esta ceremonia a todo el personal"
              >
                <XCircle size={14} className="text-rose-600" />
                <span>Revocar Todos</span>
              </button>
            </div>
          </div>

          {/* BARRA DE BÚSQUEDA Y FILTROS */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input 
                aria-label="Buscar personal" 
                placeholder="Buscar por nombre, correo electrónico o rol…" 
                value={busqueda} 
                onChange={e => setBusqueda(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded-xl pl-10 pr-9 py-2.5 text-xs font-semibold text-slate-800 outline-none transition"
              />
              {busqueda && (
                <button 
                  onClick={() => setBusqueda('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Botón para alternar modo comprimido de filas */}
              <button
                type="button"
                onClick={() => {
                  const nuevo = !modoComprimido;
                  setModoComprimido(nuevo);
                  if (typeof window !== 'undefined') localStorage.setItem('sigic_porteria_comprimido', String(nuevo));
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                  modoComprimido
                    ? 'bg-sky-50 border-sky-300 text-sky-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title={modoComprimido ? "Cambiar a filas amplias" : "Cambiar a filas comprimidas"}
              >
                {modoComprimido ? <Minimize2 size={13} className="text-sky-600" /> : <Maximize2 size={13} className="text-slate-500" />}
                <span className="hidden sm:inline">{modoComprimido ? 'Comprimido' : 'Normal'}</span>
              </button>

              <select 
                aria-label="Filtrar personal" 
                value={filtro} 
                onChange={e => setFiltro(e.target.value)}
                className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-sky-500 cursor-pointer shadow-2xs"
              >
                <option value="todos">Todos ({usuarios.length})</option>
                <option value="porteria">Solo Portería ({usuarios.filter(u => u.rol === 'PORTERIA').length})</option>
                <option value="administrativos">Administrativos ({usuarios.filter(u => u.rol === 'ADMINISTRATIVO').length})</option>
                <option value="activos">Cuentas Activas ({porterosActivos})</option>
                <option value="autorizados">Autorizados en Ceremonia</option>
                <option value="sin-acceso">Portería Sin Permiso ({usuariosSinPermiso})</option>
                <option value="inactivos">Bloqueados ({usuarios.length - porterosActivos})</option>
              </select>
            </div>
          </div>

          {/* LISTA DE PERSONAL */}
          {cargando ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="animate-spin text-sky-500 mb-3" size={32} />
              <p className="text-xs font-bold text-slate-600">Cargando plantel de seguridad...</p>
            </div>
          ) : !personalVisible.length ? (
            <div className="py-16 text-center max-w-sm mx-auto px-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Search size={24} />
              </div>
              <h3 className="text-sm font-black text-slate-800">
                {usuarios.length ? 'Sin coincidencias para los filtros aplicados' : 'No hay personal registrado aún'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                {usuarios.length ? 'Probá con otro término de búsqueda o restablecé los filtros.' : 'Comenzá agregando operadores para acreditar el ingreso a las ceremonias.'}
              </p>
              <button 
                onClick={() => usuarios.length ? (setBusqueda(''), setFiltro('todos')) : setMostrarModalNuevo(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-sky-600 transition shadow-sm cursor-pointer"
              >
                {usuarios.length ? 'Limpiar Filtros' : 'Registrar Primer Operador'}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* ENCABEZADOS DE COLUMNA */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <span className="col-span-5">Personal / Cuenta</span>
                <span className="col-span-2">Rol</span>
                <span className="col-span-3">Acceso en Ceremonia</span>
                <span className="col-span-2 text-right">Opciones</span>
              </div>

              {personalVisible.map(u => {
                const activo = Number(u.activo) === 1
                const administrativo = u.rol === 'ADMINISTRATIVO'
                const autorizado = !!autorizadosMap[String(u.id)]
                const expandido = String(personalExpandido) === String(u.id)

                return (
                  <article key={u.id} className={`transition-colors ${expandido ? 'bg-sky-50/30' : 'hover:bg-slate-50/60'}`}>
                    {/* FILA PRINCIPAL */}
                    <div className={`grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center transition-all ${
                      modoComprimido 
                        ? 'p-2.5 sm:px-6 sm:py-2' 
                        : 'p-4 sm:px-6 sm:py-3.5'
                    }`}>
                      {/* IDENTIDAD */}
                      <div className="sm:col-span-5 flex items-center gap-3 min-w-0">
                        <div className={`rounded-xl flex items-center justify-center font-black shrink-0 border transition-all ${
                          modoComprimido ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm rounded-2xl'
                        } ${
                          !activo 
                            ? 'bg-slate-100 text-slate-400 border-slate-200' 
                            : administrativo 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-2xs' 
                              : 'bg-sky-50 text-sky-700 border-sky-100 shadow-2xs'
                        }`}>
                          {u.nombre?.charAt(0)?.toUpperCase() || 'P'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-black text-slate-900 truncate ${modoComprimido ? 'text-[11.5px]' : 'text-xs'}`}>
                              {u.nombre}
                            </span>
                            {String(u.id) === String(usuario?.id) && (
                              <span className="px-1.5 py-0.2 rounded-md bg-sky-100 text-sky-800 text-[8.5px] font-black uppercase">
                                Vos
                              </span>
                            )}
                          </div>
                          <span className={`block font-semibold text-slate-400 truncate ${modoComprimido ? 'text-[10px]' : 'text-[11px]'}`}>
                            {u.email}
                          </span>
                        </div>
                      </div>

                      {/* ROL */}
                      <div className="sm:col-span-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider border ${
                          modoComprimido ? 'py-0.5' : 'py-1'
                        } ${
                          administrativo
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {administrativo ? 'Administrativo' : 'Portería'}
                        </span>
                      </div>

                      {/* ACCESO EN CEREMONIA SELECCIONADA */}
                      <div className="sm:col-span-3">
                        {!activo ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
                            <Lock size={13} />
                            <span>Bloqueado</span>
                          </span>
                        ) : administrativo ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
                            <ShieldCheck size={14} className="text-indigo-600" />
                            <span>Gestión Total</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleAutorizacion(u.id)}
                            disabled={!ceremoniaSeleccionadaId || cargandoAutorizaciones || guardandoAutorizacion !== null || procesandoLote}
                            className={`inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer border ${
                              modoComprimido ? 'py-1 text-[11px]' : 'py-1.5 text-xs'
                            } ${
                              autorizado
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {guardandoAutorizacion === u.id ? (
                              <RefreshCw size={13} className="animate-spin text-sky-600" />
                            ) : autorizado ? (
                              <CheckCircle2 size={13} className="text-emerald-600" />
                            ) : (
                              <KeyRound size={13} className="text-slate-400" />
                            )}
                            <span>{autorizado ? 'Habilitado' : 'Sin permiso'}</span>
                          </button>
                        )}
                      </div>

                      {/* ACCIONES Y BOTÓN EXPANDIR */}
                      <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
                        {!administrativo && activo && (
                          <button 
                            onClick={() => handleGenerarQR(u)} 
                            className={`rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition active:scale-95 cursor-pointer ${
                              modoComprimido ? 'p-1.5' : 'p-2'
                            }`}
                            title="Generar Pase QR de acceso móvil"
                          >
                            <QrCode size={modoComprimido ? 14 : 16} />
                          </button>
                        )}
                        <button 
                          onClick={() => setPersonalExpandido(expandido ? null : u.id)} 
                          className={`rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition active:scale-95 cursor-pointer ${
                            modoComprimido ? 'p-1.5' : 'p-2'
                          } ${
                            expandido ? 'bg-slate-100 text-slate-800 rotate-90' : ''
                          }`}
                          title="Ver detalle y permisos del operador"
                        >
                          <ChevronRight size={modoComprimido ? 15 : 17} />
                        </button>
                      </div>
                    </div>

                    {/* DETALLE EXPANDIBLE (ACORDEÓN ELEGANTE) */}
                    {expandido && (
                      <div className="px-6 py-5 bg-slate-50/70 border-t border-slate-200/60 animate-in fade-in duration-150 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                              Cambiar Rol de Sistema
                            </label>
                            <select 
                              value={u.rol} 
                              onChange={e => handleCambiarRol(u.id, e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-sky-500 cursor-pointer shadow-2xs"
                            >
                              <option value="ADMINISTRATIVO">Administrativo</option>
                              <option value="PORTERIA">Portería</option>
                            </select>
                          </div>

                          <div>
                            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                              Último Ingreso
                            </span>
                            <div className="text-xs font-bold text-slate-700 py-2">
                              {u.ultimo_login ? new Date(u.ultimo_login).toLocaleString('es-AR') : 'Nunca inició sesión'}
                            </div>
                          </div>

                          <div>
                            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                              Estado de la Cuenta
                            </span>
                            <div className="py-1.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                activo ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${activo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {activo ? 'Cuenta Habilitada' : 'Cuenta Bloqueada'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* MATRIZ DE CEREMONIAS ASIGNADAS */}
                        {!administrativo && (
                          <div className="pt-2 border-t border-slate-200/60">
                            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                              Ceremonias en las que está habilitado este operador
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {ceremonias.map(c => {
                                const asignada = (u.ceremoniasAutorizadas || []).map(String).includes(String(c.id))
                                return (
                                  <button
                                    key={c.id}
                                    onClick={() => handleToggleAutorizacion(u.id, c.id)}
                                    disabled={!activo || guardandoAutorizacion !== null || procesandoLote || cargandoAutorizaciones}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer border ${
                                      asignada
                                        ? 'bg-sky-50 border-sky-300 text-sky-800'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                                  >
                                    {asignada ? <Check size={13} className="text-sky-600" /> : <span className="w-3 h-3 rounded border border-slate-300" />}
                                    <span>{c.nombre}</span>
                                  </button>
                                )
                              })}
                              {!ceremonias.length && <span className="text-xs text-slate-400">No hay ceremonias cargadas.</span>}
                            </div>
                          </div>
                        )}

                        {/* ACCIONES DE GESTIÓN */}
                        <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button 
                              onClick={() => handleEnviarInvitacion(u.id, u.email)} 
                              disabled={enviandoInvitacionId === u.id || !activo}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs disabled:opacity-50"
                            >
                              <Mail size={14} className="text-slate-500" />
                              <span>{enviandoInvitacionId === u.id ? 'Enviando…' : 'Enviar Invitación'}</span>
                            </button>

                            <button 
                              onClick={() => handleToggleEstado(u.id, Number(u.activo))}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                            >
                              {activo ? <Lock size={14} className="text-amber-600" /> : <Unlock size={14} className="text-emerald-600" />}
                              <span>{activo ? 'Bloquear Cuenta' : 'Reactivar Cuenta'}</span>
                            </button>
                          </div>

                          <button 
                            onClick={() => handleEliminarUsuario(u.id, u.nombre)} 
                            disabled={eliminandoId === u.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                          >
                            <Trash2 size={14} />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: DISPOSITIVOS MÓVILES */}
      {pestañaActiva === 'dispositivos' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* HEADER DE FLOTA */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Flota de Escáneres Móviles</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Dispositivos Android / iOS que ejecutan la app SiGIC Accesos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {dispositivosEnLinea} en línea ahora
              </span>
            </div>
          </div>

          {/* BUSCADOR */}
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <div className="relative w-full max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input 
                aria-label="Buscar dispositivos" 
                value={busqueda} 
                onChange={e => setBusqueda(e.target.value)} 
                placeholder="Buscar por terminal, marca o nombre del operador…" 
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded-xl pl-10 pr-9 py-2.5 text-xs font-semibold text-slate-800 outline-none transition"
              />
              {busqueda && (
                <button 
                  onClick={() => setBusqueda('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* LISTADO DE DISPOSITIVOS */}
          {cargandoDispositivos ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="animate-spin text-sky-500 mb-3" size={32} />
              <p className="text-xs font-bold text-slate-600">Sincronizando estado de terminales...</p>
            </div>
          ) : !dispositivosVisibles.length ? (
            <div className="py-16 text-center max-w-sm mx-auto px-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Smartphone size={24} />
              </div>
              <h3 className="text-sm font-black text-slate-800">
                {busqueda ? 'No encontramos ese dispositivo' : 'Aún no hay terminales enlazadas'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {busqueda ? 'Probá con otro nombre de equipo o persona.' : 'Los teléfonos aparecerán aquí automáticamente al iniciar sesión en SiGIC Accesos.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-5">
              {dispositivosVisibles.map(d => (
                <article 
                  key={d.dispositivoId} 
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      d.enLinea 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-2xs' 
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      <Smartphone size={22} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-black text-slate-900 truncate">
                          {d.nombreDispositivo || d.modelo || d.marca || 'Terminal Móvil'}
                        </strong>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          d.enLinea 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : Number(d.sesionActiva) === 1 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-slate-100 text-slate-500'
                        }`}>
                          {d.enLinea ? 'En Línea' : Number(d.sesionActiva) === 1 ? 'Standby' : 'Sesión Cerrada'}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                        Operador: <strong className="text-slate-700">{d.usuarioNombre || 'Sin asignar'}</strong> · {d.sistema || 'Android / iOS'}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setDispositivoSeleccionado(d)} 
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition active:scale-95 shrink-0 cursor-pointer shadow-2xs"
                    title="Ver telemetría y diagnóstico"
                  >
                    <ChevronRight size={17} />
                  </button>
                </article>
              ))}
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
                  <h3 className="text-base font-black text-slate-900">Registrar / Invitar Personal</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Crear cuenta institucional para el equipo</p>
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
                  placeholder="usuario@sigic.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none transition"
                  required
                />
              </div>

              {/* SELECTOR DE ROL */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                  Rol Asignado
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ADMINISTRATIVO', nombre: 'Administrativo', desc: 'Gestión y edición general' },
                    { id: 'PORTERIA', nombre: 'Portería', desc: 'Escaneo y control de accesos' },
                  ].map(r => {
                    const seleccionado = rolNuevo === r.id
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRolNuevo(r.id)}
                        className={`p-2.5 rounded-xl border text-left transition active:scale-95 cursor-pointer flex flex-col justify-between ${
                          seleccionado
                            ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-400/20 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-[11px] font-black ${seleccionado ? 'text-sky-950' : 'text-slate-800'}`}>
                            {r.nombre}
                          </span>
                          <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                            seleccionado ? 'border-sky-500 bg-sky-500' : 'border-slate-300 bg-white'
                          }`}>
                            {seleccionado && <span className="w-1 h-1 rounded-full bg-white" />}
                          </span>
                        </div>
                        <span className="text-[9px] font-semibold text-slate-500 leading-tight">
                          {r.desc}
                        </span>
                      </button>
                    )
                  })}
                </div>
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
                    El usuario recibirá un correo institucional para definir su propia contraseña privada.
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
                  {creando ? <RefreshCw size={15} className="animate-spin" /> : 'Guardar e Invitar'}
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
