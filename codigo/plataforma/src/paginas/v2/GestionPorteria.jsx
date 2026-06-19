import React, { useState, useEffect } from 'react'
import { 
  Shield, UserPlus, QrCode, RefreshCw, AlertCircle, 
  ArrowLeft, CheckCircle2, Lock, Unlock, X, Settings, HelpCircle,
  Search, Mail, Smartphone, CalendarDays, Wifi, Eye, Cpu
} from 'lucide-react'
import { 
  obtenerUsuarios, 
  crearUsuario, 
  actualizarUsuarioEstado, 
  obtenerUsuarioToken,
  obtenerCeremonias,
  obtenerCeremoniaActiva,
  obtenerAutorizacionesCeremonia,
  actualizarAutorizacionCeremonia,
  obtenerDispositivosMoviles,
  BASE_CLASSIC
} from '../../servicios/api'
import { QRCodeSVG } from 'qrcode.react'

const ACCENT = '#0EA5E9'
const DARK   = '#2A3448'

export function GestionPorteria({ usuario, onVolver, onCerrarSesion }) {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(null)

  // Estados de Ceremonia y Autorización
  const [ceremonias, setCeremonias] = useState([])
  const [cargandoCeremonias, setCargandoCeremonias] = useState(true)
  const [ceremoniaSeleccionadaId, setCeremoniaSeleccionadaId] = useState('')
  const [autorizadosMap, setAutorizadosMap] = useState({})
  const [guardandoAutorizacion, setGuardandoAutorizacion] = useState(null)

  // Modales y formularios
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creando, setCreando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [dispositivos, setDispositivos] = useState([])
  const [cargandoDispositivos, setCargandoDispositivos] = useState(true)
  const [dispositivoSeleccionado, setDispositivoSeleccionado] = useState(null)

  // QR Modal State
  const [mostrarModalQR, setMostrarModalQR] = useState(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [tokenCargando, setTokenCargando] = useState(false)
  const [tokenUsuario, setTokenUsuario] = useState('')
  const [localIp, setLocalIp] = useState(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin
      return `${origin}/api`
    }
    return 'http://192.168.1.100:3000/api'
  })

  useEffect(() => {
    cargarUsuarios()
    cargarCeremonias()
    cargarDispositivos()
  }, [])

  useEffect(() => {
    if (ceremoniaSeleccionadaId) {
      cargarAutorizaciones()
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

  async function cargarAutorizaciones() {
    try {
      const list = await obtenerAutorizacionesCeremonia(ceremoniaSeleccionadaId)
      const map = {}
      list.forEach(userId => {
        map[userId] = true
      })
      setAutorizadosMap(map)
    } catch (err) {
      console.error('Error al cargar autorizaciones:', err)
    }
  }

  async function handleToggleAutorizacion(userId) {
    if (!ceremoniaSeleccionadaId) return
    setGuardandoAutorizacion(userId)
    setError(null)
    const actualmenteAutorizado = !!autorizadosMap[userId]
    try {
      await actualizarAutorizacionCeremonia(ceremoniaSeleccionadaId, userId, !actualmenteAutorizado)
      setAutorizadosMap(prev => ({
        ...prev,
        [userId]: !actualmenteAutorizado
      }))
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la autorización del usuario.')
    } finally {
      setGuardandoAutorizacion(null)
    }
  }

  async function cargarUsuarios() {
    setCargando(true)
    setError(null)
    try {
      const datos = await obtenerUsuarios()
      setUsuarios(datos.filter(u => u.rol === 'PORTERIA'))
    } catch (err) {
      console.error(err)
      setError('Error al obtener la lista de usuarios. Asegurate de ser SUPER_ADMIN para gestionar usuarios.')
    } finally {
      setCargando(false)
    }
  }

  async function cargarDispositivos() {
    setCargandoDispositivos(true)
    try {
      setDispositivos(await obtenerDispositivosMoviles())
    } catch (err) {
      console.error('Error al cargar dispositivos:', err)
    } finally {
      setCargandoDispositivos(false)
    }
  }

  function refrescarTodo() {
    cargarUsuarios()
    cargarCeremonias()
    cargarDispositivos()
  }

  async function handleCrear(e) {
    e.preventDefault()
    if (!nombre || !email || !password) {
      setError('Todos los campos son obligatorios.')
      return
    }
    setCreando(true)
    setError(null)
    setExito(null)
    try {
      await crearUsuario({ nombre, email, password, rol: 'PORTERIA' })
      setExito('Usuario creado correctamente.')
      setNombre('')
      setEmail('')
      setPassword('')
      setMostrarModalNuevo(false)
      cargarUsuarios()
    } catch (err) {
      setError(err.message || 'Error al intentar crear el usuario.')
    } finally {
      setCreando(false)
    }
  }

  async function handleToggleEstado(id, activoActual) {
    setError(null)
    setExito(null)
    const nuevoEstado = activoActual === 1 ? 0 : 1
    try {
      await actualizarUsuarioEstado(id, nuevoEstado)
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: nuevoEstado } : u))
      setExito('Estado del usuario actualizado correctamente.')
      setTimeout(() => setExito(null), 3000)
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado del usuario.')
    }
  }

  async function handleGenerarQR(userObj) {
    setUsuarioSeleccionado(userObj)
    setTokenCargando(true)
    setTokenUsuario('')
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
  }  // Calcular métricas
  const totalPorteros = usuarios.filter(u => u.rol === 'PORTERIA').length
  const autorizadosActivos = usuarios.filter(u => u.rol === 'PORTERIA' && autorizadosMap[u.id]).length
  const porterosActivos = usuarios.filter(u => u.rol === 'PORTERIA' && u.activo === 1).length
  const dispositivosEnLinea = dispositivos.filter(d => d.enLinea).length
  const personalVisible = usuarios.filter(u => {
    const coincide = `${u.nombre} ${u.email}`.toLowerCase().includes(busqueda.trim().toLowerCase())
    if (!coincide) return false
    if (filtro === 'autorizados') return !!autorizadosMap[u.id]
    if (filtro === 'sin-acceso') return !autorizadosMap[u.id]
    if (filtro === 'inactivos') return u.activo !== 1
    return true
  })
  const ceremoniaSeleccionada = ceremonias.find(c => String(c.id) === String(ceremoniaSeleccionadaId))

  return (
    <div className="font-sans pb-6 max-w-6xl mx-auto w-full px-1 sm:px-2">
      {/* HEADER INTEGRADO PRO */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100/80 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button 
            onClick={onVolver}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition active:scale-95 shadow-sm shadow-slate-100/50 bg-white"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-black tracking-tight" style={{ color: DARK }}>Personal de Seguridad / Portería</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestión de Cuentas Móviles & Códigos de Acceso QR</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button 
            onClick={refrescarTodo}
            className="p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-850 bg-white transition active:scale-95 shadow-sm shadow-slate-100/50"
            title="Refrescar lista"
          >
            <RefreshCw size={14} className={cargando || cargandoDispositivos ? 'animate-spin' : ''} />
          </button>
          
          <button 
            onClick={() => setMostrarModalNuevo(true)} 
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md shadow-sky-500/20 active:scale-95 transition-all"
          >
            <UserPlus size={14} /> Registrar Personal
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl border bg-rose-50 border-rose-100 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {exito && (
        <div className="mb-6 p-4 rounded-2xl border bg-emerald-50 border-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={15} /> {exito}
        </div>
      )}

      {/* METRICAS COMPACTAS (BENTO CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white border border-slate-100 rounded-[20px] p-4 shadow-sm flex items-center justify-between transition-all hover:-translate-y-0.5 duration-300">
          <div>
            <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Total Personal</span>
            <span className="text-xl font-black tracking-tight tabular-nums mt-0.5 block" style={{ color: DARK }}>{totalPorteros}</span>
            <span className="block text-[10px] mt-1 font-medium text-slate-400">Cuentas de seguridad</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100"><Shield size={16} /></div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[20px] p-4 shadow-sm flex items-center justify-between transition-all hover:-translate-y-0.5 duration-300">
          <div>
            <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Autorizados en Ceremonia</span>
            <span className="text-xl font-black tracking-tight tabular-nums mt-0.5 block text-emerald-600">{autorizadosActivos}</span>
            <span className="block text-[10px] mt-1 font-medium text-slate-400">Acceso a la ceremonia activa</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-50/50 flex items-center justify-center text-emerald-500 border border-emerald-100"><CheckCircle2 size={16} /></div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[20px] p-4 shadow-sm flex items-center justify-between transition-all hover:-translate-y-0.5 duration-300">
          <div>
            <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Cuentas Activas</span>
            <span className="text-xl font-black tracking-tight tabular-nums mt-0.5 block text-sky-500">{porterosActivos}</span>
            <span className="block text-[10px] mt-1 font-medium text-slate-400">Usuarios habilitados</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 border border-sky-100"><Unlock size={16} /></div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[20px] p-4 shadow-sm flex items-center justify-between transition-all hover:-translate-y-0.5 duration-300">
          <div>
            <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Móviles en línea</span>
            <span className="text-xl font-black tracking-tight tabular-nums mt-0.5 block text-indigo-500">{dispositivosEnLinea}</span>
            <span className="block text-[10px] mt-1 font-medium text-slate-400">De {dispositivos.length} vinculados</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100"><Smartphone size={16} /></div>
        </div>
      </div>

      {/* CONTROL DE ACCESOS POR CEREMONIA SELECTOR (BENTO CARD) */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-[22px] p-4 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-all duration-300">
        <div className="flex items-center gap-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-500 border border-sky-100 shadow-sm shadow-sky-100/50">
            <Settings size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Control de Accesos por Ceremonia</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Elegí una ceremonia para configurar qué personal de seguridad está autorizado.
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-auto flex items-center gap-2">
          {cargandoCeremonias ? (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider animate-pulse">Cargando ceremonias...</span>
          ) : (
            <select
              value={ceremoniaSeleccionadaId}
              onChange={e => setCeremoniaSeleccionadaId(e.target.value)}
              className="w-full md:w-72 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white text-xs font-bold rounded-2xl px-4 py-3 text-slate-800 outline-none transition duration-150 cursor-pointer shadow-sm"
            >
              {ceremonias.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.activa === 1 ? '● ACTIVA' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* DISPOSITIVOS VINCULADOS */}
      <section className="mb-4 rounded-[24px] border border-slate-100 bg-slate-900 p-4 sm:p-5 text-white shadow-lg shadow-slate-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sky-300 border border-white/10"><Smartphone size={16} /></span>
            <div>
              <h3 className="text-sm font-black">Dispositivos vinculados</h3>
              <p className="mt-0.5 text-[9px] font-semibold text-slate-400">Equipos que iniciaron sesión en SiGIC Accesos.</p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-slate-300">
            {dispositivosEnLinea} en línea · {dispositivos.length} registrados
          </span>
        </div>

        {cargandoDispositivos ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-7 text-[9px] font-black uppercase tracking-wider text-slate-400">
            <RefreshCw size={13} className="animate-spin" /> Consultando móviles
          </div>
        ) : dispositivos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-7 text-center">
            <Smartphone size={22} className="mx-auto mb-2 text-slate-500" />
            <p className="text-xs font-black text-slate-300">Todavía no hay dispositivos registrados</p>
            <p className="mt-1 text-[9px] font-semibold text-slate-500">Aparecerán cuando el personal abra o inicie sesión en la aplicación móvil actualizada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {dispositivos.map(d => (
              <article key={d.dispositivoId} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 transition hover:bg-white/[0.09]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${d.enLinea ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/5 text-slate-400'}`}>
                      <Smartphone size={17} />
                      <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 ${d.enLinea ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    </span>
                    <div className="min-w-0">
                      <h4 className="truncate text-xs font-black text-white">{d.marca} {d.modelo}</h4>
                      <p className="truncate text-[9px] font-semibold text-slate-400 mt-0.5">{d.usuarioNombre || 'Usuario de portería'}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-wider ${d.enLinea ? 'bg-emerald-400/15 text-emerald-300' : d.sesionActiva === 1 ? 'bg-amber-400/15 text-amber-300' : 'bg-white/5 text-slate-500'}`}>
                    {d.enLinea ? 'En línea' : d.sesionActiva === 1 ? 'Sin conexión' : 'Sesión cerrada'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="flex items-center gap-1.5 text-[8px] font-semibold text-slate-400"><Cpu size={10} /> {d.sistema} {d.versionSistema || ''}</span>
                  <button onClick={() => setDispositivoSeleccionado(d)} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500 hover:text-white">
                    <Eye size={10} /> Detalles
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* PERSONAL AUTORIZADO */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 select-none bg-white border border-slate-100 rounded-[32px]">
          <div className="relative w-14 h-14 flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-full border-3 border-t-[#0ea5e9] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
            <div className="absolute inset-1 rounded-full border-3 border-b-indigo-500 border-t-transparent border-r-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
            <img 
              src="/logo-oficial.png" 
              alt="SiGIC" 
              className="h-7 w-auto object-contain animate-pulse z-10 filter drop-shadow-[0_0_6px_rgba(14,165,233,0.5)]" 
            />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Cargando Cuentas...</p>
        </div>
      ) : (
        <div className="rounded-[24px] border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-500"><Shield size={14} /></span>
                <h3 className="text-sm font-black text-slate-800">Equipo de seguridad</h3>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 mt-2">Administrá las cuentas móviles y su acceso a {ceremoniaSeleccionada?.nombre || 'la ceremonia seleccionada'}.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <label className="relative flex-1 lg:w-64">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o correo"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </label>
              <select
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[10px] font-black text-slate-600 outline-none focus:border-sky-400"
              >
                <option value="todos">Todos</option>
                <option value="autorizados">Autorizados</option>
                <option value="sin-acceso">Sin autorización</option>
                <option value="inactivos">Cuentas inactivas</option>
              </select>
            </div>
          </div>

          {personalVisible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-14 text-center">
              <Shield size={26} className="mx-auto mb-3 text-slate-300" />
              <p className="text-xs font-black text-slate-600">No encontramos personal de seguridad</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">Registrá una cuenta o modificá los filtros de búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {personalVisible.map(u => {
                const autorizado = !!autorizadosMap[u.id]
                const activo = u.activo === 1
                return (
                  <article key={u.id} className={`relative overflow-hidden rounded-[20px] border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${autorizado && activo ? 'border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40' : 'border-slate-100 bg-white'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${activo ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {u.nombre?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-black text-slate-800">{u.nombre}</h4>
                          <p className="mt-1 flex items-center gap-1.5 truncate text-[10px] font-semibold text-slate-400"><Mail size={11} /> {u.email}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-wider ${activo ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {activo ? 'Cuenta activa' : 'Cuenta bloqueada'}
                      </span>
                    </div>

                    <div className="my-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-slate-50 p-2.5">
                        <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider text-slate-400"><CalendarDays size={11} /> Último acceso</span>
                        <strong className="mt-1.5 block text-[10px] font-bold text-slate-600">{u.ultimo_login ? new Date(u.ultimo_login).toLocaleString('es-AR') : 'Todavía no ingresó'}</strong>
                      </div>
                      <div className={`rounded-xl p-2.5 ${autorizado ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                        <span className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider ${autorizado ? 'text-emerald-500' : 'text-amber-500'}`}><Smartphone size={11} /> Ceremonia</span>
                        <strong className={`mt-1.5 block text-[10px] font-bold ${autorizado ? 'text-emerald-700' : 'text-amber-700'}`}>{autorizado ? 'Acceso habilitado' : 'Sin autorización'}</strong>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-1.5 border-t border-slate-100 pt-3">
                      <button
                        onClick={() => handleToggleAutorizacion(u.id)}
                        disabled={guardandoAutorizacion === u.id}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-[8px] font-black uppercase tracking-wider transition active:scale-95 ${autorizado ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-900 text-white hover:bg-sky-500'}`}
                      >
                        {guardandoAutorizacion === u.id ? <RefreshCw size={12} className="animate-spin" /> : autorizado ? <CheckCircle2 size={12} /> : <Unlock size={12} />}
                        {autorizado ? 'Quitar acceso' : 'Autorizar ceremonia'}
                      </button>
                      <button
                        onClick={() => handleToggleEstado(u.id, u.activo)}
                        className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[8px] font-black uppercase tracking-wider transition active:scale-95 ${activo ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}
                      >
                        {activo ? <Lock size={12} /> : <Unlock size={12} />} {activo ? 'Bloquear' : 'Reactivar'}
                      </button>
                      <button
                        onClick={() => handleGenerarQR(u)}
                        disabled={!activo || !autorizado}
                        title={!activo || !autorizado ? 'La cuenta debe estar activa y autorizada' : 'Enlazar dispositivo móvil'}
                        className="flex items-center justify-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-[8px] font-black uppercase tracking-wider text-sky-600 transition hover:bg-sky-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <QrCode size={12} /> Acceso QR
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}



      {/* MODAL: DETALLE DEL DISPOSITIVO */}
      {dispositivoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative overflow-hidden bg-slate-900 p-6 text-white">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-500/20 blur-3xl" />
              <button onClick={() => setDispositivoSeleccionado(null)} className="absolute right-4 top-4 z-10 rounded-xl bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white"><X size={16} /></button>
              <div className="relative flex items-center gap-4 pr-10">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300 border border-sky-300/10"><Smartphone size={22} /></span>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-sky-300">Dispositivo de acceso</p>
                  <h3 className="mt-1 text-lg font-black">{dispositivoSeleccionado.marca} {dispositivoSeleccionado.modelo}</h3>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{dispositivoSeleccionado.usuarioNombre} · {dispositivoSeleccionado.usuarioEmail}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ['Fabricante', dispositivoSeleccionado.fabricante || 'No informado'],
                  ['Nombre del equipo', dispositivoSeleccionado.nombreDispositivo || 'No informado'],
                  ['Sistema operativo', `${dispositivoSeleccionado.sistema || 'Desconocido'} ${dispositivoSeleccionado.versionSistema || ''}`.trim()],
                  ['Tipo', ({ '1': 'Teléfono', '2': 'Tablet', '3': 'Escritorio', '4': 'TV' })[String(dispositivoSeleccionado.tipoDispositivo)] || 'Dispositivo móvil'],
                  ['Versión de la app', dispositivoSeleccionado.versionApp || 'No informada'],
                  ['IP del último acceso', dispositivoSeleccionado.ipUltimoAcceso || 'No disponible'],
                  ['Primera conexión', dispositivoSeleccionado.primeraConexion ? new Date(dispositivoSeleccionado.primeraConexion).toLocaleString('es-AR') : 'No disponible'],
                  ['Último contacto', dispositivoSeleccionado.ultimoAcceso ? new Date(dispositivoSeleccionado.ultimoAcceso).toLocaleString('es-AR') : 'No disponible'],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400">{etiqueta}</span>
                    <strong className="mt-1 block break-words text-[10px] font-bold text-slate-700">{valor}</strong>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50 p-3">
                <span className="block text-[8px] font-black uppercase tracking-wider text-sky-500">Identificador seguro de instalación</span>
                <code className="mt-1 block break-all text-[10px] font-bold text-sky-800">{dispositivoSeleccionado.dispositivoId}</code>
                <p className="mt-1.5 text-[9px] font-semibold leading-relaxed text-sky-700/70">Se utiliza en lugar del IMEI, que los sistemas móviles modernos no permiten consultar por privacidad.</p>
              </div>
              <button onClick={() => setDispositivoSeleccionado(null)} className="mt-5 w-full rounded-xl bg-slate-900 py-3 text-[9px] font-black uppercase tracking-wider text-white transition hover:bg-sky-500">Cerrar detalle</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVO USUARIO */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100/50 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-black tracking-tight" style={{ color: DARK }}>Registrar Personal de Seguridad</h3>
              <button 
                onClick={() => setMostrarModalNuevo(false)} 
                className="p-1.5 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrear} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seguridad@sigic.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 mb-1">Contraseña</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none transition-all"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <Shield size={16} className="mt-0.5 shrink-0 text-sky-500" />
                <div>
                  <span className="block text-[9px] font-black uppercase tracking-wider text-sky-700">Perfil de seguridad</span>
                  <p className="mt-1 text-[10px] font-semibold leading-relaxed text-sky-700/70">La cuenta se crea para operar accesos desde la aplicación móvil. Después podrás habilitarla solamente en las ceremonias que correspondan.</p>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setMostrarModalNuevo(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={creando}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-sky-500 transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-slate-250/20"
                >
                  {creando ? <RefreshCw size={14} className="animate-spin" /> : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QR DE ACCESO Y CONFIGURACIÓN */}
      {mostrarModalQR && usuarioSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 max-w-xl w-full shadow-2xl border border-slate-100/50 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black tracking-tight text-slate-800">Enlazar Dispositivo Móvil</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Usuario: {usuarioSeleccionado.nombre}</p>
              </div>
              <button 
                onClick={() => setMostrarModalQR(false)} 
                className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-4">
              
              {/* COLUMNA 1: QR DE CONFIGURACIÓN DE RUTA */}
              <div className="flex flex-col items-center text-center gap-4 border-r border-slate-100 pr-0 md:pr-4">
                <span className="inline-block px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-bold uppercase tracking-wider">
                  Paso 1: Configurar Servidor
                </span>
                
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <QRCodeSVG 
                    value={`sigic-config:${localIp}`} 
                    size={160} 
                    level="H" 
                    fgColor={DARK} 
                  />
                </div>
                
                <div className="w-full space-y-2">
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    Escanear este código QR en la app móvil para enlazar la dirección de la plataforma de forma automática.
                  </p>
                  
                  <div className="flex gap-1.5 items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-450 uppercase shrink-0">IP API:</span>
                    <input 
                      type="text" 
                      value={localIp}
                      onChange={e => setLocalIp(e.target.value)}
                      className="bg-transparent text-[10px] font-bold text-slate-800 outline-none w-full border-none p-0"
                    />
                  </div>
                </div>
              </div>

              {/* COLUMNA 2: QR DE INICIO DE SESIÓN */}
              <div className="flex flex-col items-center text-center gap-4">
                <span className="inline-block px-3 py-1 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 text-[8px] font-bold uppercase tracking-wider">
                  Paso 2: Iniciar Sesión QR
                </span>
                
                {tokenCargando ? (
                  <div className="w-40 h-40 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-150">
                    <RefreshCw size={24} className="animate-spin text-[#0ea5e9]" />
                  </div>
                ) : tokenUsuario ? (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                    <QRCodeSVG 
                      value={`sigic-login:${tokenUsuario}`} 
                      size={160} 
                      level="L" 
                      fgColor={DARK} 
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-150 text-red-500 text-xs font-bold">
                    Error al generar QR
                  </div>
                )}
                
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  Escanear este código QR en la app móvil para iniciar sesión como **{usuarioSeleccionado.nombre}** de forma instantánea y sin contraseña.
                </p>
              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setMostrarModalQR(false)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-sky-500 transition-all active:scale-95 shadow-md shadow-slate-200/20"
              >
                Listo, Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
