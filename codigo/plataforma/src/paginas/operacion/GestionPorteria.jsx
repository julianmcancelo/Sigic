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
import './seguridad.css'

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
  const [cargandoAutorizaciones, setCargandoAutorizaciones] = useState(false)
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
    setCargandoAutorizaciones(true)
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
    } finally {
      setCargandoAutorizaciones(false)
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
  const totalPorteros = usuarios.length
  const autorizadosActivos = usuarios.filter(u => autorizadosMap[String(u.id)]).length
  const porterosActivos = usuarios.filter(u => u.activo === 1).length
  const dispositivosEnLinea = dispositivos.filter(d => d.enLinea).length
  const dispositivosTotales = dispositivos.length

  const personalVisible = usuarios.filter(u => {
    const coincide = `${u.nombre} ${u.email} ${u.rol}`.toLowerCase().includes(busqueda.trim().toLowerCase())
    if (!coincide) return false
    const estaAutorizado = !!autorizadosMap[String(u.id)]
    if (filtro === 'administrativos') return u.rol === 'ADMINISTRATIVO'
    if (filtro === 'porteria') return u.rol === 'PORTERIA'
    if (filtro === 'autorizados') return estaAutorizado
    if (filtro === 'sin-acceso') return !estaAutorizado
    if (filtro === 'inactivos') return u.activo !== 1
    return true
  })

  const ceremoniaSeleccionada = ceremonias.find(c => String(c.id) === String(ceremoniaSeleccionadaId))
  const dispositivosVisibles = dispositivos.filter(d => {
    const coincide = `${d.nombreDispositivo || ''} ${d.modelo || ''} ${d.marca || ''} ${d.usuarioNombre || ''} ${d.usuarioEmail || ''}`.toLowerCase().includes(busqueda.trim().toLowerCase())
    return coincide
  })

  return (
    <div className="sigic-security">
      <header className="sg-sec-header">
        <div className="sg-sec-title">{onVolver && <button className="sg-icon-button" onClick={onVolver} aria-label="Volver al inicio"><ArrowLeft size={18} /></button>}<span className="sg-sec-emblem"><ShieldCheck size={22} /></span><div><h1>Seguridad</h1><p>Personal, permisos y dispositivos.</p></div></div>
        <div className="sg-sec-actions"><button className="sg-button" onClick={refrescarTodo} disabled={cargando || cargandoDispositivos} aria-label="Actualizar seguridad"><RefreshCw size={15} className={cargando || cargandoDispositivos ? 'animate-spin' : ''} /><span>Actualizar</span></button><button className="sg-button sg-button-primary" onClick={() => setMostrarModalNuevo(true)}><UserPlus size={15} />Nuevo personal</button></div>
      </header>

      <div className="sg-sec-summary" aria-label="Resumen de seguridad">
        <button onClick={() => { setPestañaActiva('personal'); setFiltro('todos'); setBusqueda('') }}><Users size={17} /><strong>{usuarios.length}</strong><span>Personas</span></button>
        <button onClick={() => { setPestañaActiva('personal'); setFiltro('activos'); setBusqueda('') }}><ShieldCheck size={17} /><strong>{porterosActivos}</strong><span>Cuentas activas</span></button>
        <button onClick={() => { setPestañaActiva('personal'); setFiltro('sin-acceso'); setBusqueda('') }}><KeyRound size={17} /><strong>{usuarios.filter(u => u.rol === 'PORTERIA' && !autorizadosMap[String(u.id)]).length}</strong><span>Sin permiso en ceremonia</span></button>
        <button onClick={() => { setPestañaActiva('dispositivos'); setBusqueda('') }}><Smartphone size={17} /><strong>{dispositivosEnLinea}</strong><span>Dispositivos en línea</span></button>
      </div>

      {error && <div className="sg-notice sg-notice-error" role="alert"><AlertCircle size={17} /><span>{error}</span><button onClick={() => setError(null)} aria-label="Cerrar error"><X size={15} /></button></div>}
      {exito && <div className="sg-notice sg-notice-success" role="status"><CheckCircle2 size={17} /><span>{exito}</span><button onClick={() => setExito(null)} aria-label="Cerrar aviso"><X size={15} /></button></div>}

      <nav className="sg-sec-tabs" aria-label="Secciones de seguridad">
        <button aria-pressed={pestañaActiva === 'personal'} onClick={() => { setPestañaActiva('personal'); setBusqueda('') }}><Users size={16} />Personal y permisos<span>{usuarios.length}</span></button>
        <button aria-pressed={pestañaActiva === 'dispositivos'} onClick={() => { setPestañaActiva('dispositivos'); setBusqueda('') }}><Smartphone size={16} />Dispositivos<span>{dispositivosTotales}</span></button>
      </nav>

      {pestañaActiva === 'personal' && <section className="sg-sec-panel" aria-label="Personal y permisos">
        <div className="sg-sec-eventbar"><CalendarDays size={18} /><label><span>Permisos para la ceremonia</span><select aria-label="Ceremonia para permisos" value={ceremoniaSeleccionadaId} disabled={cargandoCeremonias || procesandoLote || guardandoAutorizacion !== null} onChange={e => setCeremoniaSeleccionadaId(e.target.value)}>{!ceremonias.length && <option value="">{cargandoCeremonias ? 'Cargando ceremonias…' : 'Sin ceremonias disponibles'}</option>}{ceremonias.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.activa ? ' · Activa' : ''}</option>)}</select></label><details className="sg-sec-bulk"><summary>Acciones en lote<ChevronRight size={14} /></summary><div><button onClick={handleAutorizarTodos} disabled={!ceremoniaSeleccionadaId || procesandoLote || cargandoAutorizaciones}>Autorizar personal activo</button><button className="sg-danger-text" onClick={handleDesautorizarTodos} disabled={!ceremoniaSeleccionadaId || procesandoLote || cargandoAutorizaciones}>Quitar permisos de la ceremonia</button></div></details></div>
        <div className="sg-sec-toolbar"><div className="sg-sec-search"><Search size={16} /><input aria-label="Buscar personal" placeholder="Buscar por nombre, correo o rol…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />{busqueda && <button onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda de personal"><X size={14} /></button>}</div><select aria-label="Filtrar personal" value={filtro} onChange={e => setFiltro(e.target.value)}><option value="todos">Todo el personal</option><option value="administrativos">Administrativos</option><option value="porteria">Portería</option><option value="activos">Cuentas activas</option><option value="autorizados">Con acceso a esta ceremonia</option><option value="sin-acceso">Portería sin permiso</option><option value="inactivos">Cuentas bloqueadas</option></select></div>
        <div className="sg-sec-list-meta"><span>{personalVisible.length} de {usuarios.length} personas</span><span>{cargandoAutorizaciones ? 'Actualizando permisos…' : 'Seleccioná una persona para ver sus opciones'}</span></div>
        {cargando ? <div className="sg-sec-empty" role="status"><RefreshCw className="animate-spin" size={24} /><strong>Cargando personal…</strong></div> : !personalVisible.length ? <div className="sg-sec-empty"><Search size={26} /><strong>{usuarios.length ? 'Nadie coincide con estos filtros' : 'Tu equipo empieza acá'}</strong><p>{usuarios.length ? 'Probá otro nombre o mostrá todo el personal.' : 'Registrá a quienes van a administrar y acreditar la ceremonia.'}</p><button className="sg-button" onClick={() => usuarios.length ? (setBusqueda(''), setFiltro('todos')) : setMostrarModalNuevo(true)}>{usuarios.length ? 'Limpiar filtros' : 'Agregar personal'}</button></div> : <div className="sg-sec-list">
          <div className="sg-sec-columns" aria-hidden="true"><span>Persona</span><span>Rol</span><span>Acceso a la ceremonia</span><span /></div>
          {personalVisible.map(u => {
            const activo = Number(u.activo) === 1
            const administrativo = u.rol === 'ADMINISTRATIVO'
            const autorizado = !!autorizadosMap[String(u.id)]
            const expandido = String(personalExpandido) === String(u.id)
            return <article className={`sg-sec-person ${expandido ? 'is-expanded' : ''}`} key={u.id}>
              <div className="sg-sec-row"><button className="sg-sec-identity" onClick={() => setPersonalExpandido(expandido ? null : u.id)} aria-expanded={expandido} aria-controls={`personal-detalle-${u.id}`}><span className={`sg-sec-avatar ${!activo ? 'is-blocked' : ''}`}>{u.nombre?.charAt(0)?.toUpperCase() || 'P'}</span><span><strong>{u.nombre}{String(u.id) === String(usuario?.id) && <small>Vos</small>}</strong><small>{u.email}</small></span></button><span className={`sg-sec-role ${administrativo ? 'is-admin' : ''}`}>{administrativo ? 'Administrativo' : 'Portería'}</span><div className="sg-sec-access">{!activo ? <span className="sg-sec-blocked"><Lock size={13} />Cuenta bloqueada</span> : administrativo ? <span className="sg-sec-global"><ShieldCheck size={14} />Acceso de gestión</span> : <button className={`sg-sec-permission ${autorizado ? 'is-allowed' : ''}`} onClick={() => handleToggleAutorizacion(u.id)} disabled={!ceremoniaSeleccionadaId || cargandoAutorizaciones || guardandoAutorizacion !== null || procesandoLote} aria-pressed={autorizado} aria-label={`${autorizado ? 'Quitar permiso a' : 'Autorizar a'} ${u.nombre} en la ceremonia seleccionada`}>{guardandoAutorizacion === u.id ? <RefreshCw size={14} className="animate-spin" /> : autorizado ? <CheckCircle2 size={14} /> : <KeyRound size={14} />}{autorizado ? 'Autorizado' : 'Autorizar'}</button>}</div><button className="sg-icon-button sg-sec-expand" aria-label={`${expandido ? 'Ocultar' : 'Ver'} opciones de ${u.nombre}`} aria-expanded={expandido} onClick={() => setPersonalExpandido(expandido ? null : u.id)}><ChevronRight size={17} /></button></div>
              {expandido && <div className="sg-sec-detail" id={`personal-detalle-${u.id}`}><div className="sg-sec-detail-heading"><label>Rol del personal<select aria-label={`Rol de ${u.nombre}`} value={u.rol} onChange={e => handleCambiarRol(u.id, e.target.value)}><option value="ADMINISTRATIVO">Administrativo</option><option value="PORTERIA">Portería</option></select></label><div><span>Último ingreso</span><strong>{u.ultimo_login ? new Date(u.ultimo_login).toLocaleString('es-AR') : 'Todavía no inició sesión'}</strong></div><span className={`sg-sec-account-state ${activo ? 'is-active' : ''}`}>{activo ? 'Cuenta activa' : 'Cuenta bloqueada'}</span></div>
                {administrativo ? <p className="sg-sec-help"><ShieldCheck size={15} />El personal administrativo gestiona todas las ceremonias.</p> : <div className="sg-sec-assigned"><span>Ceremonias autorizadas</span><div>{ceremonias.map(c => { const asignada = (u.ceremoniasAutorizadas || []).map(String).includes(String(c.id)); return <button key={c.id} aria-pressed={asignada} onClick={() => handleToggleAutorizacion(u.id, c.id)} disabled={!activo || guardandoAutorizacion !== null || procesandoLote || cargandoAutorizaciones}>{asignada ? <Check size={13} /> : <span className="sg-sec-unchecked" />}{c.nombre}</button> })}{!ceremonias.length && <small>No hay ceremonias para asignar.</small>}</div></div>}
                <div className="sg-sec-detail-actions"><button className="sg-button" onClick={() => handleEnviarInvitacion(u.id, u.email)} disabled={enviandoInvitacionId === u.id || !activo}><Mail size={14} />{enviandoInvitacionId === u.id ? 'Enviando…' : 'Enviar invitación'}</button>{!administrativo && <button className="sg-button" onClick={() => handleGenerarQR(u)} disabled={!activo}><QrCode size={14} />Pase QR</button>}<button className="sg-button" onClick={() => handleToggleEstado(u.id, Number(u.activo))}>{activo ? <Lock size={14} /> : <Unlock size={14} />}{activo ? 'Bloquear cuenta' : 'Reactivar cuenta'}</button><button className="sg-icon-button sg-danger-text" onClick={() => handleEliminarUsuario(u.id, u.nombre)} disabled={eliminandoId === u.id} aria-label={`Eliminar a ${u.nombre}`} title="Eliminar persona"><Trash2 size={16} /></button></div>
              </div>}
            </article>
          })}
        </div>}
      </section>}

      {pestañaActiva === 'dispositivos' && <section className="sg-sec-panel" aria-label="Dispositivos vinculados"><div className="sg-sec-device-header"><div><h2>Dispositivos vinculados</h2><p>Equipos que usan SiGIC Accesos.</p></div><span className="sg-sec-account-state is-active">{dispositivosEnLinea} en línea</span></div><div className="sg-sec-toolbar"><div className="sg-sec-search"><Search size={16} /><input aria-label="Buscar dispositivos" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar dispositivo o persona…" />{busqueda && <button onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda de dispositivos"><X size={14} /></button>}</div></div>{cargandoDispositivos ? <div className="sg-sec-empty" role="status"><RefreshCw size={24} className="animate-spin" /><strong>Cargando dispositivos…</strong></div> : !dispositivosVisibles.length ? <div className="sg-sec-empty"><Smartphone size={26} /><strong>{busqueda ? 'No encontramos ese dispositivo' : 'Todavía no hay dispositivos'}</strong><p>{busqueda ? 'Probá con el nombre de la persona o del equipo.' : 'Aparecerán cuando el personal inicie sesión en la app móvil.'}</p></div> : <div className="sg-sec-devices">{dispositivosVisibles.map(d => <article key={d.dispositivoId}><span className="sg-sec-device-icon"><Smartphone size={20} /></span><button className="sg-sec-device-name" onClick={() => setDispositivoSeleccionado(d)}><strong>{d.nombreDispositivo || d.modelo || d.marca || 'Dispositivo móvil'}</strong><small>{d.usuarioNombre || 'Sin usuario'} · {d.sistema || 'Sistema no informado'}</small></button><span className={`sg-sec-account-state ${d.enLinea ? 'is-active' : ''}`}>{d.enLinea ? 'En línea' : Number(d.sesionActiva) === 1 ? 'Sin conexión' : 'Sesión cerrada'}</span><button className="sg-icon-button" onClick={() => setDispositivoSeleccionado(d)} aria-label={`Ver dispositivo ${d.nombreDispositivo || d.modelo || d.dispositivoId}`}><ChevronRight size={17} /></button></article>)}</div>}</section>}

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
