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
  }

  return (
    <div className="font-sans pb-10">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: DARK }}>Personal de Seguridad / Portería</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestión de Cuentas Móviles & Códigos de Acceso QR</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={cargarUsuarios} 
            className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition"
          >
            <RefreshCw size={15} />
          </button>
          
          <button 
            onClick={() => setMostrarModalNuevo(true)} 
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-sky-500 shadow-sm active:scale-95 transition"
          >
            <UserPlus size={14} /> Registrar Personal
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border bg-rose-50 border-rose-100 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {exito && (
        <div className="mb-6 p-4 rounded-xl border bg-emerald-50 border-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={15} /> {exito}
        </div>
      )}

      {/* CONTROL DE ACCESOS POR CEREMONIA SELECTOR */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 mb-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">Control de Accesos por Ceremonia</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Elegí una ceremonia para configurar qué personal de seguridad está autorizado para trabajar.
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-auto flex items-center gap-2">
          {cargandoCeremonias ? (
            <span className="text-[10px] font-bold text-slate-400 uppercase animate-pulse">Cargando ceremonias...</span>
          ) : (
            <select
              value={ceremoniaSeleccionadaId}
              onChange={e => setCeremoniaSeleccionadaId(e.target.value)}
              className="w-full md:w-64 bg-slate-50 border border-slate-200 focus:border-[#0ea5e9] focus:bg-white text-xs font-bold rounded-xl px-4 py-3 text-slate-800 outline-none transition-all"
            >
              {ceremonias.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.activa === 1 ? '(Activa)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* USER LIST CARDS */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative w-12 h-12 flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-full border-3 border-t-[#0ea5e9] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <Shield size={20} className="text-sky-500 animate-pulse" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Cargando Usuarios...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider">Autorización</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider">Último Login</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Acciones QR / Operación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-xs font-semibold text-slate-400">
                      No hay usuarios registrados. Registrá uno nuevo para comenzar.
                    </td>
                  </tr>
                ) : (
                  usuarios.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                            u.rol === 'PORTERIA' ? 'bg-sky-50 text-sky-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.nombre.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-black block">{u.nombre}</span>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">ID: {u.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">{u.email}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={u.rol} 
                          onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 text-[10px] font-bold rounded-lg px-2 py-1 text-slate-700 outline-none"
                        >
                          <option value="PORTERIA">PORTERIA (Seguridad)</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN (Admin)</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
                          <option value="AUDITOR">AUDITOR (Lectura)</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {u.rol === 'PORTERIA' ? (
                          <button
                            onClick={() => handleToggleAutorizacion(u.id)}
                            disabled={guardandoAutorizacion === u.id}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition ${
                              autorizadosMap[u.id]
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-50 border-slate-250 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {guardandoAutorizacion === u.id ? (
                              <RefreshCw size={10} className="animate-spin text-slate-400" />
                            ) : autorizadosMap[u.id] ? (
                              <CheckCircle2 size={10} />
                            ) : (
                              <X size={10} />
                            )}
                            {autorizadosMap[u.id] ? 'Autorizado' : 'Sin Acceso'}
                          </button>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-wider text-sky-600 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-full">
                            Acceso Global
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleEstado(u.id, u.activo)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition ${
                            u.activo === 1 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100' 
                              : 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {u.activo === 1 ? <Unlock size={10} /> : <Lock size={10} />}
                          {u.activo === 1 ? 'Activo' : 'Desactivado'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-400">
                        {u.ultimo_login ? new Date(u.ultimo_login).toLocaleString('es-AR') : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleGenerarQR(u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-[#0ea5e9] border border-sky-100 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-sky-500 hover:text-white transition active:scale-95"
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
                className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-700"
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
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none transition-all"
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
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none transition-all"
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
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none transition-all"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 mb-1">Rol Operativo</label>
                <select 
                  value={rol} 
                  onChange={e => setRol(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 text-xs font-semibold text-slate-850 outline-none transition-all"
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
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={creando}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-sky-500 transition-all active:scale-95 flex items-center justify-center gap-1.5"
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
                <h3 className="text-base font-black tracking-tight" style={{ color: DARK }}>Enlazar Dispositivo Móvil</h3>
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
                <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-bold uppercase tracking-wider">
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
                  
                  <div className="flex gap-1.5 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase shrink-0">IP API:</span>
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
                <span className="inline-block px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 text-[8px] font-bold uppercase tracking-wider">
                  Paso 2: Iniciar Sesión QR
                </span>
                
                {tokenCargando ? (
                  <div className="w-40 h-40 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-150">
                    <RefreshCw size={24} className="animate-spin text-sky-500" />
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
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-sky-500 transition-all active:scale-95"
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
