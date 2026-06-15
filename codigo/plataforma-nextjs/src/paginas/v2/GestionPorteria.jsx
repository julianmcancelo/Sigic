import React, { useState, useEffect } from 'react'
import { 
  Shield, UserPlus, QrCode, RefreshCw, AlertCircle, 
  ArrowLeft, CheckCircle2, Lock, Unlock, X, Settings, HelpCircle
} from 'lucide-react'
import { 
  obtenerUsuarios, 
  crearUsuario, 
  actualizarUsuarioEstado, 
  actualizarUsuarioRol, 
  obtenerUsuarioToken,
  obtenerCeremonias,
  obtenerCeremoniaActiva,
  obtenerAutorizacionesCeremonia,
  actualizarAutorizacionCeremonia,
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
  const [rol, setRol] = useState('PORTERIA')
  const [creando, setCreando] = useState(false)

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
      // Filtrar o priorizar los de rol PORTERIA
      setUsuarios(datos)
    } catch (err) {
      console.error(err)
      setError('Error al obtener la lista de usuarios. Asegurate de ser SUPER_ADMIN para gestionar usuarios.')
    } finally {
      setCargando(false)
    }
  }

  async function handleCrear(e) {
    e.preventDefault()
    if (!nombre || !email || !password || !rol) {
      setError('Todos los campos son obligatorios.')
      return
    }
    setCreando(true)
    setError(null)
    setExito(null)
    try {
      await crearUsuario({ nombre, email, password, rol })
      setExito('Usuario creado correctamente.')
      setNombre('')
      setEmail('')
      setPassword('')
      setRol('PORTERIA')
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

  async function handleCambiarRol(id, nuevoRol) {
    setError(null)
    setExito(null)
    try {
      await actualizarUsuarioRol(id, nuevoRol)
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, rol: nuevoRol } : u))
      setExito('Rol del usuario actualizado.')
      setTimeout(() => setExito(null), 3000)
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el rol.')
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
            <h2 className="text-lg font-black tracking-tight" style={{ color: DARK }}>Personal de Seguridad / Portería</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestión de Cuentas Móviles & Códigos de Acceso QR</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button 
            onClick={cargarUsuarios} 
            className="p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-850 bg-white transition active:scale-95 shadow-sm shadow-slate-100/50"
            title="Refrescar lista"
          >
            <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm flex items-center justify-between transition-all hover:scale-[1.02] duration-300">
          <div>
            <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Total Personal</span>
            <span className="text-2xl font-black tracking-tight tabular-nums mt-1 block" style={{ color: DARK }}>{totalPorteros}</span>
            <span className="block text-[10px] mt-1 font-medium text-slate-400">Cuentas de seguridad</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100"><Shield size={16} /></div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm flex items-center justify-between transition-all hover:scale-[1.02] duration-300">
          <div>
            <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Autorizados en Ceremonia</span>
            <span className="text-2xl font-black tracking-tight tabular-nums mt-1 block text-emerald-600">{autorizadosActivos}</span>
            <span className="block text-[10px] mt-1 font-medium text-slate-400">Acceso a la ceremonia activa</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-50/50 flex items-center justify-center text-emerald-500 border border-emerald-100"><CheckCircle2 size={16} /></div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm flex items-center justify-between transition-all hover:scale-[1.02] duration-300">
          <div>
            <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Cuentas Activas</span>
            <span className="text-2xl font-black tracking-tight tabular-nums mt-1 block text-sky-500">{porterosActivos}</span>
            <span className="block text-[10px] mt-1 font-medium text-slate-400">Dispositivos móviles activos</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 border border-sky-100"><Unlock size={16} /></div>
        </div>
      </div>

      {/* CONTROL DE ACCESOS POR CEREMONIA SELECTOR (BENTO CARD) */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-[32px] p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 border border-sky-100 shadow-sm shadow-sky-100/50">
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

      {/* USER LIST CARDS (BENTO LIST) */}
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
        <div className="bg-white border border-slate-100 shadow-sm rounded-[32px] overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4.5 border-b border-slate-50 bg-slate-50/20">
            <div className="flex h-[24px] w-[24px] items-center justify-center rounded-lg bg-sky-50 text-sky-500 border border-sky-100 shadow-sm shadow-sky-100/50">
              <Shield size={13} />
            </div>
            <span className="text-[12px] font-black uppercase tracking-wider text-slate-655">Cuentas Registradas / Porteros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[9px] font-black text-slate-450 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-450 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-450 uppercase tracking-wider">Rol de Seguridad</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-450 uppercase tracking-wider">Autorización</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-450 uppercase tracking-wider">Estado Cuenta</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-450 uppercase tracking-wider">Último Acceso</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-450 uppercase tracking-wider text-right">Acciones QR / Operación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-705">
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-xs font-semibold text-slate-400">
                      No hay usuarios registrados. Registrá uno nuevo para comenzar.
                    </td>
                  </tr>
                ) : (
                  usuarios.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/40 transition duration-150">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs uppercase shadow-sm border ${
                            u.rol === 'PORTERIA' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {u.nombre.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-black block text-slate-800">{u.nombre}</span>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">ID: {u.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-xs font-semibold text-slate-600">{u.email}</td>
                      <td className="px-6 py-4.5">
                        <select 
                          value={u.rol} 
                          onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 hover:border-sky-500 text-[10px] font-bold rounded-xl px-2.5 py-1.5 text-slate-700 outline-none transition duration-155 cursor-pointer shadow-sm"
                        >
                          <option value="PORTERIA">PORTERIA (Seguridad)</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN (Admin)</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
                          <option value="AUDITOR">AUDITOR (Lectura)</option>
                        </select>
                      </td>
                      <td className="px-6 py-4.5">
                        {u.rol === 'PORTERIA' ? (
                          <button
                            onClick={() => handleToggleAutorizacion(u.id)}
                            disabled={guardandoAutorizacion === u.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all active:scale-95 shadow-sm ${
                              autorizadosMap[u.id]
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {guardandoAutorizacion === u.id ? (
                              <RefreshCw size={10} className="animate-spin text-slate-400" />
                            ) : autorizadosMap[u.id] ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-350" />
                            )}
                            {autorizadosMap[u.id] ? 'Autorizado' : 'Sin Acceso'}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-sky-600 bg-sky-50 border border-sky-100 shadow-sm shadow-sky-50/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-550" />
                            Acceso Global
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5">
                        <button
                          onClick={() => handleToggleEstado(u.id, u.activo)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all active:scale-95 shadow-sm ${
                            u.activo === 1 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100' 
                              : 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {u.activo === 1 ? <Unlock size={10} /> : <Lock size={10} />}
                          {u.activo === 1 ? 'Activo' : 'Desactivado'}
                        </button>
                      </td>
                      <td className="px-6 py-4.5 text-xs font-semibold text-slate-400">
                        {u.ultimo_login ? new Date(u.ultimo_login).toLocaleString('es-AR') : 'Nunca'}
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleGenerarQR(u)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 text-[#0ea5e9] border border-sky-100 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all active:scale-95 shadow-sm shadow-sky-50/50"
                          >
                            <QrCode size={12} /> Mostrar Acceso QR
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 mb-1">Rol Operativo</label>
                <select 
                  value={rol} 
                  onChange={e => setRol(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-2xl px-4 py-3 text-xs font-semibold text-slate-850 outline-none transition-all"
                >
                  <option value="PORTERIA">PORTERIA (Seguridad de Ingreso)</option>
                  <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="AUDITOR">AUDITOR</option>
                </select>
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
