/**
 * App.jsx - Componente Principal (Orquestador).
 * Controla todas las sesiones (Admin y Graduado) y decide qué pantalla mostrar
 * basándose en el estado de autenticación, la URL y el flujo de trabajo del graduado.
 * 
 * Flujo del graduado:
 * 1. Inicia sesión → Si estado es PENDIENTE → PantallaAceptacion
 * 2. Si acepta → PanelGraduado (cargar invitados, elegir entregadores)
 * 3. Si rechaza → Inhabilitado, se cierra sesión automáticamente
 */
import { useState, useEffect, useRef } from 'react'
import { Home, ScanLine, Users, GraduationCap, MapPin, BarChart3, Settings, Calendar, RefreshCw, Shield, Server, Search, Power, Bell, Wifi, Volume2, ChevronUp, LayoutGrid, X, Minus, Maximize2, Sun, Moon, MousePointer2, Lock } from 'lucide-react'

// Importación de Páginas
import { PaginaInicioSesion } from './paginas/PaginaInicioSesion'
import { PantallaBienvenida } from './paginas/PantallaBienvenida'
import { PanelGraduado } from './paginas/PanelGraduado'
import { HistorialGraduado } from './paginas/HistorialGraduado'
import { LoginGraduado } from './paginas/LoginGraduado'
import { PantallaSeleccionLogin } from './paginas/PantallaSeleccionLogin'
import { AsistenteSetup } from './paginas/AsistenteSetup'
import { PantallaAceptacion } from './paginas/PantallaAceptacion'
import { ManualUsuarioWeb } from './paginas/ManualUsuarioWeb'
import { PantallaBienvenidaPro } from './paginas/v2/PantallaBienvenidaPro'
import { PanelReportes } from './paginas/v2/PanelReportes'
import { GestionPorteria } from './paginas/v2/GestionPorteria'
import { CentroControl } from './paginas/v2/CentroControl'
import { GestionGraduados } from './paginas/v2/GestionGraduados'
import { ControlIngreso } from './paginas/v2/ControlIngreso'
import { PanelAjustes } from './paginas/v2/PanelAjustes'
import { GestionCeremonias } from './paginas/v2/GestionCeremonias'
import { EditorAnfiteatro } from './paginas/v2/EditorAnfiteatro'
import { GestionProfesores } from './paginas/v2/GestionProfesores'


// Componentes Globales
import { ControlExpositor } from './componentes/ControlExpositor'
import { PantallaCargaInicial } from './componentes/PantallaCargaInicial'

// Servicios
import { validarToken, obtenerCeremoniaActiva, obtenerEstadoSetup, responderInvitacion, limpiarTokenSesion, obtenerAjustes, actualizarAjuste } from './servicios/api'

function normalizarCorreoInstitucional(correo) {
  return typeof correo === 'string'
    ? correo.replace(/@beltran\.edu\.ar$/i, '@ibeltran.com.ar')
    : correo
}

function App() {
  // ─── 0. DETECCIÓN DE CONTEXTO (URL) ───
  const [tokenURL, setTokenURL] = useState(
    () => new URLSearchParams(window.location.search).get('token')
  )
  const [datosToken, setDatosToken] = useState(null)
  const [errorToken, setErrorToken] = useState(null)
  const [validandoToken, setValidandoToken] = useState(!!tokenURL)

  // ─── 1. SESIÓN DE ADMINISTRADOR ───
  const [adminActivo, setAdminActivo] = useState(
    () => localStorage.getItem('sesion_admin') === 'true',
  )
  const [adminUser, setAdminUser] = useState(
    () => {
      const usuario = JSON.parse(localStorage.getItem('admin_user') || 'null')
      if (usuario?.correo) {
        const actualizado = { ...usuario, correo: normalizarCorreoInstitucional(usuario.correo) }
        localStorage.setItem('admin_user', JSON.stringify(actualizado))
        return actualizado
      }
      return usuario ?? { nombre: '', correo: '' }
    },
  )

  // ─── 2. SESIÓN DE GRADUADO (OTP) ───
  const [graduadoActivo, setGraduadoActivo] = useState(
    () => localStorage.getItem('sesion_graduado') === 'true',
  )
  const [graduadoUsuario, setGraduadoUsuario] = useState(
    () => JSON.parse(localStorage.getItem('graduado_usuario') || 'null'),
  )

  // ─── 3. ESTADO DE NAVEGACIÓN ───
  const [pantallaAdmin, setPantallaAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = JSON.parse(localStorage.getItem('admin_user') || 'null');
        if (u && u.correo && u.correo.toLowerCase() === 'soporte@ibeltran.com.ar') {
          return 'centro-control';
        }
      } catch (e) {
        // Ignorar
      }
    }
    return 'bienvenida';
  })
  const [versionAdmin, setVersionAdmin] = useState(
    () => localStorage.getItem('version_admin') || 'clasica'
  )

  const [dockPosicion, setDockPosicion] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('sigic_dock_posicion') : 'abajo') || 'abajo'
  )


  const [vistaLogin, setVistaLogin] = useState(() => {
    const p = window.location.pathname
    if (p === '/manual') return 'manual'
    if (p === '/admin') {
      if (typeof window !== 'undefined' && localStorage.getItem('acceso_directo_admin') === 'false') {
        return null
      }
      return 'admin'
    }
    if (p === '/egresado' || p === '/graduado' || p === '/carga') return 'graduado'
    if (p === '/' && localStorage.getItem('mostrar_presentacion_inicial') === 'false') return 'admin'
    return null
  })

  const [ceremoniaActiva, setCeremoniaActiva] = useState(null)
  
  // ─── 3.0 ESTADO DE CONFIGURACIÓN INICIAL (SETUP) ───
  const [requiereSetup, setRequiereSetup] = useState(null)
  const [cargandoSetup, setCargandoSetup] = useState(true)

  const [mostrarPresentacionInicial, setMostrarPresentacionInicial] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mostrar_presentacion_inicial') !== 'false'
    }
    return true
  })

  const [enMantenimiento, setEnMantenimiento] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('modo_mantenimiento') === 'true'
    }
    return false
  })

  const [accesoOculto, setAccesoOculto] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('acceso_oculto_egresado') !== 'false'
    }
    return true
  })

  const [accesoDirectoAdmin, setAccesoDirectoAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('acceso_directo_admin') !== 'false'
    }
    return true
  })

  function toggleMantenimiento() {
    const nuevo = !enMantenimiento
    setEnMantenimiento(nuevo)
    localStorage.setItem('modo_mantenimiento', nuevo.toString())
    actualizarAjuste('modo_mantenimiento', nuevo.toString()).catch(err => {
      console.warn("Error guardando modo mantenimiento", err)
    })
  }

  // Refs para evitar stale closures en el interceptor global
  const adminActivoRef = useRef(adminActivo)
  const graduadoActivoRef = useRef(graduadoActivo)
  
  useEffect(() => {
    adminActivoRef.current = adminActivo
  }, [adminActivo])
  
  useEffect(() => {
    graduadoActivoRef.current = graduadoActivo
  }, [graduadoActivo])

  // Sincronizar sesiones entre pestañas de forma activa
  useEffect(() => {
    const sincronizarPestanas = (e) => {
      if (e.key === 'sesion_admin') {
        const nuevoEstado = e.newValue === 'true'
        setAdminActivo(nuevoEstado)
        if (!nuevoEstado) setAdminUser({ nombre: '', correo: '' })
      }
      if (e.key === 'sesion_graduado') {
        const nuevoEstado = e.newValue === 'true'
        setGraduadoActivo(nuevoEstado)
        if (!nuevoEstado) setGraduadoUsuario(null)
      }
      if (e.key === 'admin_user') {
        setAdminUser(e.newValue ? JSON.parse(e.newValue) : { nombre: '', correo: '' })
      }
      if (e.key === 'graduado_usuario') {
        setGraduadoUsuario(e.newValue ? JSON.parse(e.newValue) : null)
      }
      if (e.key === 'mostrar_presentacion_inicial') {
        const mostrar = e.newValue !== 'false'
        setMostrarPresentacionInicial(mostrar)
        if (!mostrar) setVistaLogin('admin')
      }
    }
    window.addEventListener('storage', sincronizarPestanas)
    return () => window.removeEventListener('storage', sincronizarPestanas)
  }, [])

  useEffect(() => {
    const aplicarPresentacion = (evento) => {
      const mostrar = evento.detail?.mostrar !== false
      setMostrarPresentacionInicial(mostrar)
      if (!mostrar) setVistaLogin('admin')
    }
    window.addEventListener('sigic-presentacion-cambiada', aplicarPresentacion)
    return () => window.removeEventListener('sigic-presentacion-cambiada', aplicarPresentacion)
  }, [])

  // Sincronizar estado inicial y ceremonia activa al iniciar
  useEffect(() => {
    async function inicializarApp() {
      try {
        const estado = await obtenerEstadoSetup()
        setRequiereSetup(estado.requiereConfiguracionInicial)
        
        if (!estado.requiereConfiguracionInicial) {
          const c = await obtenerCeremoniaActiva()
          setCeremoniaActiva(c)

          try {
            const ajustesDb = await obtenerAjustes()
            if (ajustesDb) {
              if (ajustesDb.modo_mantenimiento) {
                const modoMant = ajustesDb.modo_mantenimiento.valor === 'true'
                setEnMantenimiento(modoMant)
                localStorage.setItem('modo_mantenimiento', modoMant.toString())
              }
              if (ajustesDb.acceso_oculto_egresado) {
                const oculto = ajustesDb.acceso_oculto_egresado.valor !== 'false'
                setAccesoOculto(oculto)
                localStorage.setItem('acceso_oculto_egresado', oculto.toString())
              }
              if (ajustesDb.acceso_directo_admin) {
                const directo = ajustesDb.acceso_directo_admin.valor !== 'false'
                setAccesoDirectoAdmin(directo)
                localStorage.setItem('acceso_directo_admin', directo.toString())
                if (!directo && window.location.pathname === '/admin') {
                  window.location.href = '/'
                }
              }
              if (ajustesDb.mostrar_presentacion_inicial) {
                const preferenciaLocalAnterior = localStorage.getItem('mostrar_presentacion_inicial')
                const mostrar = ajustesDb.mostrar_presentacion_inicial.valor !== 'false'
                setMostrarPresentacionInicial(mostrar)
                localStorage.setItem('mostrar_presentacion_inicial', mostrar.toString())
                if (window.location.pathname === '/' && !tokenURL) {
                  if (!mostrar) {
                    setVistaLogin('admin')
                  } else if (preferenciaLocalAnterior === 'false') {
                    setVistaLogin(null)
                  }
                }
              }
            }
          } catch (errAjustes) {
            console.warn("Error leyendo ajustes", errAjustes)
          }
        }
      } catch (e) {
        console.warn("No se pudo contactar al servidor para el estado inicial:", e.message)
      } finally {
        setCargandoSetup(false)
      }
    }
    inicializarApp()
  }, [])

  // ─── 3.0.1 INTERCEPTOR DE 401 Y SESIÓN EXPIRADA ───
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.__fetch_interceptado) {
      window.__fetch_interceptado = true
      const originalFetch = window.fetch
      window.fetch = async function (...args) {
        const urlParam = args[0]
        let url = ''
        if (typeof urlParam === 'string') {
          url = urlParam
        } else if (urlParam && typeof urlParam === 'object') {
          url = urlParam.url || ''
        }

        const response = await originalFetch(...args)
        
        const esRutaAuth = url.includes('/verificar-otp') || 
                           url.includes('/auth/login') || 
                           url.includes('/egresados/token/') ||
                           url.includes('/solicitar-otp')

        const token = localStorage.getItem('sigic_token') || ''
        const esBypass = token.startsWith('bypass-')

        if ((response.status === 401 || response.status === 403) && !esRutaAuth && !esBypass) {
          window.dispatchEvent(new CustomEvent('sigic-desautorizado'))
        }
        return response;
      }
    }

    const manejarDesautorizado = () => {
      console.warn("Sesión expirada o desautorizada (HTTP 401). Cerrando sesión...")
      if (adminActivoRef.current) cerrarSesionAdmin()
      if (graduadoActivoRef.current) cerrarSesionGraduado()
    }


    window.addEventListener('sigic-desautorizado', manejarDesautorizado)
    return () => {
      window.removeEventListener('sigic-desautorizado', manejarDesautorizado)
    }
  }, [])

  // Las inscripciones rechazadas o finalizadas conservan acceso de consulta.
  useEffect(() => {
    if (graduadoActivo && graduadoUsuario && !['PENDIENTE', 'ACEPTADO', 'RECHAZADO'].includes(graduadoUsuario.estado)) {
      cerrarSesionGraduado()
    }
  }, [graduadoActivo, graduadoUsuario])


  // Limpiar cualquier sesión previa si ingresamos por URL con un token
  useEffect(() => {
    if (tokenURL) {
      console.log("Detectado token de acceso en URL. Limpiando sesiones previas para evitar conflictos...")
      
      localStorage.removeItem('sesion_admin')
      localStorage.removeItem('admin_user')
      setAdminActivo(false)
      setAdminUser({ nombre: '', correo: '' })
      
      localStorage.removeItem('sesion_graduado')
      localStorage.removeItem('graduado_usuario')
      setGraduadoActivo(false)
      setGraduadoUsuario(null)
      
      limpiarTokenSesion()
    }
  }, [tokenURL])

  // ─── 3.1 VALIDACIÓN DE TOKEN ───
  useEffect(() => {
    async function validar() {
      if (!tokenURL) return
      
      setValidandoToken(true)
      try {
        const datos = await validarToken(tokenURL)
        setDatosToken(datos)
      } catch (err) {
        console.error("Token inválido:", err.message)
        setErrorToken(err.message || 'Este link de invitación ya no es válido o está mal escrito.')
      } finally {
        setValidandoToken(false)
      }
    }
    validar()
  }, [tokenURL])

  // Escucha eventos globales para cambiar de vista
  useEffect(() => {
    const manejarNav = () => setVistaLogin('graduado')
    const manejarManual = () => setVistaLogin('manual')
    window.addEventListener('ir-a-login-egresado', manejarNav)
    window.addEventListener('ir-a-manual', manejarManual)
    return () => {
      window.removeEventListener('ir-a-login-egresado', manejarNav)
      window.removeEventListener('ir-a-manual', manejarManual)
    }
  }, [])

  // ─── 4. LÓGICA DE ADMINISTRACIÓN ───
  function manejarLoginAdminExitoso(datos) {
    // Limpiar sesión de graduado previa para disparar la sincronización en otras pestañas
    localStorage.removeItem('sesion_graduado')
    localStorage.removeItem('graduado_usuario')
    setGraduadoActivo(false)
    setGraduadoUsuario(null)

    const datosNormalizados = { ...datos, correo: normalizarCorreoInstitucional(datos?.correo) }
    setAdminUser(datosNormalizados)
    setAdminActivo(true)
    localStorage.setItem('sesion_admin', 'true')
    localStorage.setItem('admin_user', JSON.stringify(datosNormalizados))
    
    // Si es una simulación del expositor (no hay token real guardado), guardamos el token de bypass correspondiente
    const tokenActual = localStorage.getItem('sigic_token')
    if (!tokenActual || tokenActual.startsWith('bypass-')) {
    const tokenBypass = (datosNormalizados && datosNormalizados.correo && datosNormalizados.correo.toLowerCase() === 'soporte@ibeltran.com.ar')
        ? 'bypass-support-token'
        : 'bypass-admin-token'
      localStorage.setItem('sigic_token', tokenBypass)
    }
    if (datosNormalizados && datosNormalizados.correo && datosNormalizados.correo.toLowerCase() === 'soporte@ibeltran.com.ar') {
      setPantallaAdmin('centro-control')
    } else {
      setPantallaAdmin('bienvenida')
    }
    
    setVistaLogin(null)
  }

  function cerrarSesionAdmin() {
    setAdminUser({ nombre: '', correo: '' })
    setAdminActivo(false)
    localStorage.removeItem('sesion_admin')
    localStorage.removeItem('admin_user')
    limpiarTokenSesion()
    window.location.href = '/'
  }

  // ─── 5. LÓGICA DE GRADUADO ───
  function manejarLoginGraduadoExitoso(datos) {
    // Limpiar sesión de administrador previa para disparar la sincronización en otras pestañas
    localStorage.removeItem('sesion_admin')
    localStorage.removeItem('admin_user')
    setAdminActivo(false)
    setAdminUser({ nombre: '', correo: '' })

    setGraduadoUsuario(datos)
    setGraduadoActivo(true)
    localStorage.setItem('sesion_graduado', 'true')
    localStorage.setItem('graduado_usuario', JSON.stringify(datos))
    
    // Si es una simulación del expositor (no hay token real guardado), guardamos el token de bypass correspondiente
    const tokenActual = localStorage.getItem('sigic_token')
    if (!tokenActual || tokenActual.startsWith('bypass-')) {
      localStorage.setItem('sigic_token', `bypass-egresado-${datos.id}`)
    }
    
    setVistaLogin(null)
    setTokenURL(null)
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, "/")
    }
  }

  function cerrarSesionGraduado() {
    setGraduadoUsuario(null)
    setGraduadoActivo(false)
    localStorage.removeItem('sesion_graduado')
    localStorage.removeItem('graduado_usuario')
    limpiarTokenSesion()
    setTokenURL(null)
    window.history.replaceState({}, document.title, "/")
  }

  // ─── 5.1 FLUJO DE ACEPTACIÓN/RECHAZO ───
  async function manejarAceptarInvitacion() {
    await responderInvitacion(graduadoUsuario.id, 'ACEPTADO')
    const historial = (graduadoUsuario.historial || []).map((registro) =>
      String(registro.id) === String(graduadoUsuario.id) ? { ...registro, estado: 'ACEPTADO' } : registro
    )
    const actualizado = { ...graduadoUsuario, estado: 'ACEPTADO', historial }
    setGraduadoUsuario(actualizado)
    localStorage.setItem('graduado_usuario', JSON.stringify(actualizado))
  }

  async function manejarRechazarInvitacion() {
    await responderInvitacion(graduadoUsuario.id, 'RECHAZADO')
    const historial = (graduadoUsuario.historial || []).map((registro) =>
      String(registro.id) === String(graduadoUsuario.id) ? { ...registro, estado: 'RECHAZADO' } : registro
    )
    const actualizado = { ...graduadoUsuario, estado: 'RECHAZADO', historial }
    setGraduadoUsuario(actualizado)
    localStorage.setItem('graduado_usuario', JSON.stringify(actualizado))
  }

  function limpiarTodo() {
    localStorage.clear()
    window.location.href = '/'
  }

  // ──────────────────────────────────────────────────────────────
  // ─── 6. RENDERIZADO DINÁMICO (Orquestador de Vistas) ───
  // ──────────────────────────────────────────────────────────────
  let contenido = null

  // CASO EXPLICITO: Acceso directo y libre al Manual de Usuario
  if (typeof window !== 'undefined' && window.location.pathname === '/manual') {
    return <ManualUsuarioWeb onVolver={() => window.location.href = '/'} />
  }

  // CASO 0: Cargando estado inicial
  if (cargandoSetup) {
    return <PantallaCargaInicial />
    /*
    return (
      <PantallaSeleccionLogin
        enMantenimiento={enMantenimiento}
        accesoOculto={accesoOculto}
        onSeleccionarAdmin={() => setVistaLogin('admin')}
        onSeleccionarEgresado={() => setVistaLogin('graduado')}
        onSeleccionarManual={() => setVistaLogin('manual')}
      />
    )
    */
  }

  // CASO 0.1: Sistema Virgen (Requiere Asistente de Configuración)
  if (requiereSetup) {
    return <AsistenteSetup onFinalizado={() => {
      window.location.href = '/'
    }} />
  }

  // CASO A: El usuario entró por un Link Directo (?token=...)
  if (tokenURL) {
    if (validandoToken) {
      contenido = (
        <div className="flex min-h-screen items-center justify-center bg-[#F0F4F8]">
          <div className="text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#29ABE2] border-t-transparent mx-auto mb-3" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#29ABE2]">Verificando Acceso</p>
          </div>
        </div>
      )
    } else if (errorToken) {
      contenido = (
        <div className="flex min-h-screen items-center justify-center bg-[#F0F4F8] p-4">
          <div className="max-w-md w-full rounded-[32px] bg-white p-10 text-center shadow-xl border border-red-100/50">
            <h2 className="text-lg font-black text-red-500 mb-2">Acceso denegado</h2>
            <p className="text-xs text-slate-600 font-bold leading-relaxed">{errorToken}</p>
            {errorToken && errorToken.includes('inasistencia') && (
              <div className="mt-5 pt-4 border-t border-slate-100/80">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contacto de Soporte</p>
                <a href="mailto:soporte@ibeltran.com.ar" className="text-xs font-black text-[#0EA5E9] hover:underline">
                  soporte@ibeltran.com.ar
                </a>
              </div>
            )}
            <button 
              onClick={limpiarTodo}
              className="mt-6 w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )
    } else if (datosToken) {
      if (graduadoActivo && graduadoUsuario?.id !== datosToken.id) {
          localStorage.removeItem('sesion_graduado')
          localStorage.removeItem('graduado_usuario')
      }
      contenido = (
        <LoginGraduado 
          emailInicial={datosToken.correo} 
          onLoginExitoso={manejarLoginGraduadoExitoso}
          onVolver={() => setTokenURL(null)}
        />
      )
    } else {
      contenido = <div className="flex min-h-screen bg-[#F0F4F8]" />
    }
  }

  // CASO B: Hay una sesión de Graduado activa
  else if (graduadoActivo && graduadoUsuario) {
    const ceremoniaSeleccionadaActiva = graduadoUsuario.ceremonia_activa === true || graduadoUsuario.ceremonia_activa === 1
    // Subcase B.1: Estado PENDIENTE → Pantalla de Aceptación
    if (graduadoUsuario.estado === 'PENDIENTE' && ceremoniaSeleccionadaActiva) {
      contenido = (
        <PantallaAceptacion
          graduado={graduadoUsuario}
          onAceptar={manejarAceptarInvitacion}
          onRechazar={manejarRechazarInvitacion}
        />
      )
    }
    // Subcase B.2: Estado ACEPTADO → Panel completo del graduado
    else if (graduadoUsuario.estado === 'ACEPTADO' && ceremoniaSeleccionadaActiva) {
      contenido = <PanelGraduado graduadoSesion={graduadoUsuario} onCerrarSesion={cerrarSesionGraduado} />
    }
    // Rechazadas y ceremonias anteriores: consulta histórica protegida.
    else {
      contenido = (
        <HistorialGraduado
          graduado={graduadoUsuario}
          onCerrarSesion={cerrarSesionGraduado}
          onCambiarCeremonia={() => {
            cerrarSesionGraduado()
            setVistaLogin('graduado')
          }}
        />
      )
    }

  }

  // CASO C: El usuario es Administrador logueado
  else if (adminActivo) {
    if (pantallaAdmin === 'gestion-graduados') {
      contenido = (
        <GestionGraduados
          usuario={adminUser}
          onVolver={() => setPantallaAdmin('bienvenida')}
          onCerrarSesion={cerrarSesionAdmin}
        />
      )
    } else if (pantallaAdmin === 'control-ingreso') {
      contenido = (
        <ControlIngreso
          usuario={adminUser}
          onVolver={() => setPantallaAdmin('bienvenida')}
          onCerrarSesion={cerrarSesionAdmin}
        />
      )
    } else if (pantallaAdmin === 'seleccion-asientos') {
      contenido = (
        <EditorAnfiteatro
          onVolver={() => setPantallaAdmin('bienvenida')}
          ceremoniaId={ceremoniaActiva?.id}
        />
      )
    } else if (pantallaAdmin === 'ajustes') {
      contenido = (
        <PanelAjustes
          usuario={adminUser}
          onVolver={() => setPantallaAdmin('bienvenida')}
          onCerrarSesion={cerrarSesionAdmin}
          onNavegar={setPantallaAdmin}
          ceremoniaActiva={ceremoniaActiva}
        />
      )
    } else if (pantallaAdmin === 'gestion-ceremonias') {
      contenido = (
        <GestionCeremonias
          onVolver={() => setPantallaAdmin('bienvenida')}
          onCambioCeremonia={() => {
            obtenerCeremoniaActiva().then(setCeremoniaActiva)
          }}
        />
      )
    } else if (pantallaAdmin === 'gestion-profesores') {
      contenido = (
        <GestionProfesores
          usuario={adminUser}
          onVolver={() => setPantallaAdmin('bienvenida')}
          onCerrarSesion={cerrarSesionAdmin}
        />
      )
    } else if (pantallaAdmin === 'panel-reportes') {
      contenido = (
        <PanelReportes
          usuario={adminUser}
          onVolver={() => setPantallaAdmin('bienvenida')}
          onCerrarSesion={cerrarSesionAdmin}
        />
      )
    } else if (pantallaAdmin === 'gestion-porteria') {
      contenido = (
        <GestionPorteria
          usuario={adminUser}
          onVolver={() => setPantallaAdmin('bienvenida')}
          onCerrarSesion={cerrarSesionAdmin}
        />
      )
    } else if (pantallaAdmin === 'centro-control') {
      if (adminUser?.correo?.toLowerCase() === 'soporte@ibeltran.com.ar') {
        contenido = (
          <CentroControl
            usuario={adminUser}
            onVolver={() => setPantallaAdmin('bienvenida')}
            onCerrarSesion={cerrarSesionAdmin}
          />
        )
      } else {
        contenido = (
          <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
            <div className="text-center p-8 rounded-[32px] bg-white border border-slate-100 shadow-xl max-w-sm">
              <h2 className="text-lg font-black text-red-500 mb-2">Acceso Denegado</h2>
              <p className="text-xs text-slate-500 font-semibold mb-4 leading-relaxed">Esta sección está restringida exclusivamente para el personal de soporte técnico autorizado.</p>
              <button 
                onClick={() => setPantallaAdmin('bienvenida')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        )
      }
    } else {
      contenido = versionAdmin === 'clasica' ? (
        <PantallaBienvenida
          usuario={adminUser}
          ceremoniaActiva={ceremoniaActiva}
          onCerrarSesion={cerrarSesionAdmin}
          onNavegar={setPantallaAdmin}
          onCambiarVersion={() => {
            setVersionAdmin('pro')
            localStorage.setItem('version_admin', 'pro')
          }}
        />
      ) : (
        <PantallaBienvenidaPro
          usuario={adminUser}
          ceremoniaActiva={ceremoniaActiva}
          onCerrarSesion={cerrarSesionAdmin}
          onNavegar={setPantallaAdmin}
          onCambiarVersion={() => {
            setVersionAdmin('clasica')
            localStorage.setItem('version_admin', 'clasica')
          }}
          onCambioCeremonia={() => {
            obtenerCeremoniaActiva().then(setCeremoniaActiva)
          }}
        />
      )
    }
  }

  // CASO D: Login Manual
  else if (vistaLogin === 'admin') {
    contenido = (
      <PaginaInicioSesion 
        onInicioSesionExitoso={manejarLoginAdminExitoso} 
        onVolver={() => setVistaLogin(null)}
      />
    )
  } else if (vistaLogin === 'graduado') {
    contenido = (
      <LoginGraduado 
        onLoginExitoso={manejarLoginGraduadoExitoso} 
        onVolver={() => setVistaLogin(null)} 
      />
    )
  } else if (vistaLogin === 'manual') {
    contenido = (
      <ManualUsuarioWeb 
        onVolver={() => setVistaLogin(null)} 
      />
    )
  }

  // CASO E.1: acceso administrativo directo, sin portada de bienvenida
  else if (false && !mostrarPresentacionInicial) {
    contenido = (
      <PaginaInicioSesion
        onInicioSesionExitoso={manejarLoginAdminExitoso}
      />
    )
  }

  // CASO E.2: Selección Inicial
  else {
    contenido = (
      <PantallaSeleccionLogin 
        enMantenimiento={enMantenimiento}
        accesoOculto={accesoOculto}
        onSeleccionarAdmin={() => setVistaLogin('admin')}
        onSeleccionarEgresado={() => setVistaLogin('graduado')}
        onSeleccionarManual={() => setVistaLogin('manual')}
      />
    )
  }

  const contenidoDeEscritorio = adminActivo ? (
    <EscritorioSIGIC
      pantallaActual={pantallaAdmin}
      onNavegar={setPantallaAdmin}
      usuario={adminUser}
      onCerrarSesion={cerrarSesionAdmin}
    >
      {contenido}
    </EscritorioSIGIC>
  ) : contenido

  return (
    <>
      {contenidoDeEscritorio}
      
      {/* Herramienta para presentaciones (Modo Demo) */}
      <ControlExpositor 
        enMantenimiento={enMantenimiento}
        onToggleMantenimiento={toggleMantenimiento}
        onSimularAdmin={manejarLoginAdminExitoso}
        onSimularEgresado={manejarLoginGraduadoExitoso}
        onLimpiar={limpiarTodo}
      />
    </>
  )
}

function EscritorioSIGIC({ children, pantallaActual, onNavegar, usuario, onCerrarSesion }) {
  const [inicioAbierto, setInicioAbierto] = useState(false)
  const [hora, setHora] = useState(new Date())
  const [tema, setTema] = useState(() => localStorage.getItem('sigic_tema') || 'oscuro')
  const [menuContextual, setMenuContextual] = useState(null)
  const [mostrarEquipo, setMostrarEquipo] = useState(false)
  const [ventanasAbiertas, setVentanasAbiertas] = useState([])
  const [ventanasMinimizadas, setVentanasMinimizadas] = useState([])
  const [ventanasCerrandose, setVentanasCerrandose] = useState([])
  const [ventanaMaximizada, setVentanaMaximizada] = useState(false)
  const [posicionVentana, setPosicionVentana] = useState({ x: 0, y: 0 })
  const arrastreRef = useRef(null)
  const inicioRef = useRef(null)
  const inicioBotonRef = useRef(null)
  const buscadorInicioRef = useRef(null)
  const pantallaAnteriorRef = useRef(pantallaActual)
  const esSuperAdmin = usuario?.rol === 'SUPER_ADMIN'
  const aplicaciones = [
    { id: 'bienvenida', titulo: 'Inicio', icono: Home, color: 'bg-cyan-500', escritorio: true },
    { id: 'gestion-graduados', titulo: 'Graduados', icono: Users, color: 'bg-emerald-500', escritorio: true },
    { id: 'control-ingreso', titulo: 'Escáner', icono: ScanLine, color: 'bg-amber-500', escritorio: true },
    { id: 'panel-reportes', titulo: 'Reportes', icono: BarChart3, color: 'bg-rose-500', escritorio: true },
    { id: 'gestion-porteria', titulo: 'Seguridad', icono: Shield, color: 'bg-violet-500', escritorio: true },
    { id: 'gestion-ceremonias', titulo: 'Ceremonias', icono: Calendar, color: 'bg-blue-500', escritorio: esSuperAdmin },
    { id: 'ajustes', titulo: 'Ajustes', icono: Settings, color: 'bg-slate-500', escritorio: esSuperAdmin },
    { id: 'gestion-profesores', titulo: 'Docentes', icono: GraduationCap, color: 'bg-indigo-500', escritorio: false },
    { id: 'seleccion-asientos', titulo: 'Anfiteatro', icono: MapPin, color: 'bg-orange-500', escritorio: false },
  ]
  const accesos = aplicaciones.filter(app => app.escritorio)

  useEffect(() => {
    const intervalo = setInterval(() => setHora(new Date()), 1000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    localStorage.setItem('sigic_tema', tema)
  }, [tema])

  useEffect(() => {
    const anterior = pantallaAnteriorRef.current
    pantallaAnteriorRef.current = pantallaActual
    if (!pantallaActual || pantallaActual === anterior) return
    setVentanasAbiertas(ventanas => ventanas.includes(pantallaActual) ? ventanas : [...ventanas, pantallaActual])
    setVentanasCerrandose(ventanas => ventanas.filter(item => item !== pantallaActual))
  }, [pantallaActual])

  useEffect(() => {
    if (!inicioAbierto) return
    buscadorInicioRef.current?.focus()
  }, [inicioAbierto])

  useEffect(() => {
    const mover = evento => {
      if (!arrastreRef.current || ventanaMaximizada) return
      const { inicioX, inicioY, posicionInicial } = arrastreRef.current
      setPosicionVentana({ x: posicionInicial.x + evento.clientX - inicioX, y: posicionInicial.y + evento.clientY - inicioY })
    }
    const terminar = () => { arrastreRef.current = null }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', terminar)
    return () => { window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', terminar) }
  }, [ventanaMaximizada])

  useEffect(() => {
    const manejarClickGlobal = evento => {
      if (!inicioAbierto) return
      if (inicioRef.current?.contains(evento.target)) return
      if (inicioBotonRef.current?.contains(evento.target)) return
      setInicioAbierto(false)
    }

    const manejarEscape = evento => {
      if (evento.key !== 'Escape') return
      if (menuContextual) {
        setMenuContextual(null)
        return
      }
      if (mostrarEquipo) {
        setMostrarEquipo(false)
        return
      }
      if (inicioAbierto) {
        setInicioAbierto(false)
        return
      }
      if (pantallaActual && ventanasAbiertas.includes(pantallaActual) && !ventanasMinimizadas.includes(pantallaActual)) {
        alternarMinimizada(pantallaActual)
      }
    }

    document.addEventListener('pointerdown', manejarClickGlobal)
    window.addEventListener('keydown', manejarEscape)
    return () => {
      document.removeEventListener('pointerdown', manejarClickGlobal)
      window.removeEventListener('keydown', manejarEscape)
    }
  }, [inicioAbierto, menuContextual, mostrarEquipo, pantallaActual, ventanasAbiertas, ventanasMinimizadas])

  const abrirVentana = (id) => {
    setVentanasAbiertas(ventanas => ventanas.includes(id) ? ventanas : [...ventanas, id])
    setVentanasCerrandose(ventanas => ventanas.filter(item => item !== id))
    setVentanasMinimizadas(ventanas => ventanas.filter(item => item !== id))
    onNavegar(id)
    setPosicionVentana({ x: 0, y: 0 })
    setVentanaMaximizada(false)
    setInicioAbierto(false)
    setMenuContextual(null)
  }

  const iniciarArrastre = evento => {
    if (evento.button !== 0 || ventanaMaximizada) return
    arrastreRef.current = { inicioX: evento.clientX, inicioY: evento.clientY, posicionInicial: posicionVentana }
  }

  const cerrarVentana = (id) => {
    if (!ventanasAbiertas.includes(id) || ventanasCerrandose.includes(id)) return
    const restantes = ventanasAbiertas.filter(item => item !== id)
    setVentanasCerrandose(ventanas => [...ventanas, id])
    setVentanasMinimizadas(ventanas => ventanas.filter(item => item !== id))
    setVentanaMaximizada(false)
    window.setTimeout(() => {
      setVentanasAbiertas(ventanas => ventanas.filter(item => item !== id))
      setVentanasCerrandose(ventanas => ventanas.filter(item => item !== id))
      if (id === pantallaActual) {
        const siguiente = restantes.at(-1)
        if (siguiente) {
          onNavegar(siguiente)
        }
      }
    }, 180)
  }

  const alternarMinimizada = (id) => {
    const estaMinimizada = ventanasMinimizadas.includes(id)
    if (estaMinimizada) {
      setVentanasMinimizadas(ventanas => ventanas.filter(item => item !== id))
      abrirVentana(id)
      return
    }
    setVentanasMinimizadas(ventanas => [...ventanas, id])
    const siguiente = [...ventanasAbiertas].reverse().find(item => item !== id && !ventanasMinimizadas.includes(item))
    if (siguiente) onNavegar(siguiente)
  }

  const manejarClickTarea = (id) => {
    const estaActiva = id === pantallaActual && !ventanasMinimizadas.includes(id)
    if (estaActiva) {
      alternarMinimizada(id)
      return
    }
    abrirVentana(id)
  }

  const tituloVentana = aplicaciones.find(item => item.id === pantallaActual)?.titulo || 'Escritorio SIGIC'
  const tipoVentana = ['control-ingreso', 'panel-reportes'].includes(pantallaActual) ? 'sigic-window-browser' : ['gestion-graduados', 'gestion-profesores', 'gestion-ceremonias'].includes(pantallaActual) ? 'sigic-window-explorer' : pantallaActual === 'gestion-porteria' ? 'sigic-window-secure' : 'sigic-window-default'
  const direccionVentana = pantallaActual === 'control-ingreso' ? 'sigic://acreditaciones/ingresos' : pantallaActual === 'panel-reportes' ? 'sigic://informes/ceremonia-activa' : pantallaActual === 'gestion-porteria' ? 'sigic://seguridad/centro-de-control' : `sigic://aplicaciones/${pantallaActual}`
  const cambiarTema = () => setTema(actual => actual === 'oscuro' ? 'claro' : 'oscuro')
  const abrirMenuContextual = (evento) => {
    evento.preventDefault()
    setInicioAbierto(false)
    setMenuContextual({ x: Math.min(evento.clientX, window.innerWidth - 230), y: Math.min(evento.clientY, window.innerHeight - 245) })
  }

  return (
    <main className={`sigic-os-shell sigic-theme-${tema}`} onContextMenu={abrirMenuContextual} onClick={() => menuContextual && setMenuContextual(null)}>
      <div className="sigic-os-grid" />
      <div className="sigic-watermark" aria-hidden="true"><img src="/logo-oficial.png" alt="" /><span>SIGIC</span><small>Sistema Integral de Gestión Institucional</small></div>
      <header className="sigic-os-topbar">
        <div className="flex items-center gap-3">
          <img src="/logo-oficial.png" alt="Logo de SIGIC" className="sigic-real-logo" />
          <div><p className="sigic-brand">SIGIC</p><p className="sigic-subbrand">Sistema Integral de Gestión Institucional</p></div>
        </div>
        <div className="hidden items-center gap-5 text-white/60 md:flex"><span className="text-[10px] uppercase tracking-[.24em]">Sesión segura</span><div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" /></div>
      </header>
      <section className="sigic-os-workspace">
        <div className="sigic-os-shortcuts">
          {accesos.map(({ id, titulo, icono: Icono, color }) => <button key={id} onClick={() => abrirVentana(id)} className="sigic-desktop-icon"><span className={`${color} sigic-desktop-icon-art`}><Icono size={22} /></span><span>{titulo}</span></button>)}
        </div>
        {ventanasAbiertas.includes(pantallaActual) && !ventanasMinimizadas.includes(pantallaActual) ? <div style={!ventanaMaximizada ? { transform: `translate(${posicionVentana.x}px, ${posicionVentana.y}px)` } : undefined} className={`sigic-window ${tipoVentana} ${pantallaActual === 'bienvenida' ? 'sigic-window-welcome' : ''} ${ventanaMaximizada ? 'sigic-window-maximized' : ''} ${ventanasCerrandose.includes(pantallaActual) ? 'sigic-window-closing' : ''}`}>
          <div className="sigic-window-bar" onPointerDown={iniciarArrastre} onDoubleClick={() => setVentanaMaximizada(value => !value)}><div className="sigic-window-heading"><div className="sigic-window-app-icon"><span className="sigic-window-app-dot" /></div><span className="sigic-window-title">{tituloVentana}</span><span className="sigic-window-caption">{tipoVentana === 'sigic-window-browser' ? 'Pestaña activa' : tipoVentana === 'sigic-window-explorer' ? 'Explorador SIGIC' : 'Ventana independiente'}</span></div>{tipoVentana === 'sigic-window-browser' && <div className="sigic-address-bar"><Lock size={10} />{direccionVentana}</div>}<div className="sigic-window-controls"><button type="button" onPointerDown={evento => evento.stopPropagation()} onClick={evento => { evento.stopPropagation(); alternarMinimizada(pantallaActual) }} aria-label="Minimizar ventana" title="Minimizar"><Minus size={14} /></button><button type="button" onPointerDown={evento => evento.stopPropagation()} onClick={evento => { evento.stopPropagation(); setVentanaMaximizada(value => !value) }} aria-label="Maximizar ventana" title={ventanaMaximizada ? 'Restaurar' : 'Maximizar'}><Maximize2 size={13} /></button><button type="button" onPointerDown={evento => evento.stopPropagation()} onClick={evento => { evento.stopPropagation(); cerrarVentana(pantallaActual) }} aria-label="Cerrar ventana" title="Cerrar"><X size={14} /></button></div></div><div className="sigic-window-body">{children}</div>
        </div> : null}
        {ventanasAbiertas.filter(id => id !== pantallaActual && !ventanasMinimizadas.includes(id)).map(id => <button key={id} onClick={() => abrirVentana(id)} className="sigic-background-window"><span className="sigic-window-app-dot" />{aplicaciones.find(item => item.id === id)?.titulo || id}<span>Activar ventana</span></button>)}
        <aside className="sigic-session-card"><div className="sigic-session-avatar">{(usuario?.nombre || 'A').slice(0, 1).toUpperCase()}</div><div><strong>{usuario?.nombre || 'Administrador'}</strong><span>{normalizarCorreoInstitucional(usuario?.correo) || 'Sesión administrativa'}</span></div><span className="sigic-session-state">En línea</span></aside>
      </section>
      {inicioAbierto && <div ref={inicioRef} className="sigic-start-menu" role="dialog" aria-modal="false" aria-label="Menú principal de SIGIC"><div className="sigic-start-header"><div className="sigic-user-avatar">{(usuario?.nombre || 'A').slice(0, 1).toUpperCase()}</div><div><p className="text-sm font-bold text-white">{usuario?.nombre || 'Administrador'}</p><p className="text-[10px] text-white/45">Administrador de SIGIC</p></div><button onClick={onCerrarSesion} className="ml-auto rounded-lg p-2 text-white/45 hover:bg-white/10 hover:text-white" aria-label="Cerrar sesión"><Power size={16} /></button></div><div className="sigic-start-search"><Search size={15} /><input ref={buscadorInicioRef} placeholder="Buscar en SIGIC" /></div><p className="sigic-start-label">Aplicaciones disponibles</p><div className="grid grid-cols-3 gap-2">{aplicaciones.map(({ id, titulo, icono: Icono, color }) => <button key={id} onClick={() => abrirVentana(id)} className="sigic-start-app"><span className={`${color} sigic-start-app-icon`}><Icono size={16} /></span><span>{titulo}</span></button>)}</div></div>}
      <footer className="sigic-taskbar"><button ref={inicioBotonRef} onClick={() => setInicioAbierto(value => !value)} className={`sigic-start-button ${inicioAbierto ? 'is-active' : ''}`} aria-label="Abrir menú principal" aria-expanded={inicioAbierto} title="Menú principal"><img src="/logo-oficial.png" alt="" className="sigic-task-logo" /></button><div className="sigic-task-divider" /><button onClick={() => abrirVentana('bienvenida')} className="sigic-task-app" title="Escritorio SIGIC"><Home size={15} /><span>Escritorio SIGIC</span></button><div className="sigic-open-tasks">{ventanasAbiertas.map(id => { const app = aplicaciones.find(item => item.id === id); const IconoTarea = app?.icono || LayoutGrid; return <button key={id} onClick={() => manejarClickTarea(id)} className={`sigic-open-task ${id === pantallaActual && !ventanasMinimizadas.includes(id) ? 'is-current' : ''} ${ventanasMinimizadas.includes(id) ? 'is-minimized' : ''}`} title={`${app?.titulo || 'SIGIC'}${ventanasMinimizadas.includes(id) ? ' (minimizada)' : ''}`}><IconoTarea size={13} />{app?.titulo || 'SIGIC'}</button> })}</div><div className="ml-auto flex items-center gap-3 text-white/65"><button onClick={cambiarTema} className="sigic-theme-button" aria-label={`Cambiar a modo ${tema === 'oscuro' ? 'claro' : 'oscuro'}`}>{tema === 'oscuro' ? <Sun size={15} /> : <Moon size={15} />}</button><Bell size={15} /><Wifi size={15} /><Volume2 size={15} /><div className="sigic-clock"><strong>{hora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</strong><span>{hora.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span></div><ChevronUp size={15} /></div></footer>
      {menuContextual && <div className="sigic-context-menu" style={{ left: menuContextual.x, top: menuContextual.y }} onClick={evento => evento.stopPropagation()}><p className="sigic-context-title"><MousePointer2 size={13} /> Acciones del escritorio</p><button onClick={() => abrirVentana('bienvenida')}><LayoutGrid size={14} /> Abrir escritorio SIGIC</button><button onClick={cambiarTema}>{tema === 'oscuro' ? <Sun size={14} /> : <Moon size={14} />} Cambiar a modo {tema === 'oscuro' ? 'claro' : 'oscuro'}</button><button onClick={() => setInicioAbierto(true)}><Search size={14} /> Buscar una aplicación</button><button onClick={() => setMostrarEquipo(true)}><Users size={14} /> Conocer al equipo</button><div className="sigic-context-separator" /><button onClick={() => window.location.reload()}><RefreshCw size={14} /> Actualizar escritorio</button></div>}
      {mostrarEquipo && <div className="sigic-team-overlay" onClick={() => setMostrarEquipo(false)}><section className="sigic-team-card" onClick={evento => evento.stopPropagation()}><button className="sigic-team-close" onClick={() => setMostrarEquipo(false)} aria-label="Cerrar"><X size={16} /></button><img src="/logo-oficial.png" alt="Logo de SIGIC" className="sigic-team-logo" /><p className="sigic-team-kicker">Easter egg de SIGIC</p><h2>El equipo detrás del sistema</h2><p className="sigic-team-copy">Desarrollado en el marco de las Prácticas Profesionalizantes del Instituto Tecnológico Beltrán.</p><div className="sigic-team-grid">{['Cancelo Julian', 'Alfonso Alan Alexis', 'Contreras V. Sol', 'Frassia Matias', 'Santillan Luis G.'].map((nombre, indice) => <div key={nombre} className="sigic-team-person"><span>{String(indice + 1).padStart(2, '0')}</span><strong>{nombre}</strong></div>)}</div><a className="sigic-team-contact" href="mailto:soporte@ibeltran.com.ar">soporte@ibeltran.com.ar</a><small>Proyecto SIGIC · 2026</small></section></div>}
    </main>
  )
}

// ─── COMPONENTE NAV DOCKER ADMINISTRATIVO PERSISTENTE ───
function AdminDock({ pantallaActual, onNavegar, posicion, setPosicion, usuario }) {
  const esSoporte = usuario?.correo && usuario.correo.toLowerCase() === 'soporte@ibeltran.com.ar'

  const items = [
    { id: 'bienvenida', titulo: 'Inicio', icono: Home },
    ...(esSoporte ? [
      { id: 'gestion-porteria', titulo: 'Seguridad', icono: Shield }
    ] : [
      { id: 'control-ingreso', titulo: 'Escáner', icono: ScanLine },
      { id: 'gestion-graduados', titulo: 'Graduados', icono: Users },
      { id: 'gestion-profesores', titulo: 'Docentes', icono: GraduationCap },
      { id: 'seleccion-asientos', titulo: 'Anfiteatro', icono: MapPin },
      { id: 'panel-reportes', titulo: 'Reportes', icono: BarChart3 },
      { id: 'gestion-porteria', titulo: 'Seguridad', icono: Shield },
    ]),
    ...(esSoporte ? [] : [
      { id: 'ajustes', titulo: 'Ajustes', icono: Settings },
    ]),
    { id: 'gestion-ceremonias', titulo: 'Ceremonias', icono: Calendar },
    ...(esSoporte ? [
      { id: 'centro-control', titulo: 'Control', icono: Server }
    ] : [])
  ]

  const alternarPosicion = () => {
    const nueva = posicion === 'abajo' ? 'izquierda' : 'abajo'
    setPosicion(nueva)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sigic_dock_posicion', nueva)
    }
  }

  const claseContenedor = posicion === 'abajo'
    ? 'fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-row items-center gap-2 px-3 py-2 rounded-2xl border border-white/20 shadow-2xl z-50 max-w-[92vw] overflow-x-auto scrollbar-none'
    : 'fixed bottom-4 left-1/2 -translate-x-1/2 md:bottom-auto md:left-4 md:top-1/2 md:-translate-y-1/2 flex flex-row md:flex-col items-center gap-2 px-3 py-2 md:px-2 md:py-3 rounded-2xl border border-white/20 shadow-2xl z-50 max-w-[92vw] md:max-w-none md:max-h-[90vh] overflow-x-auto md:overflow-x-visible md:overflow-y-auto scrollbar-none'

  return (
    <div
      className={`${claseContenedor} bg-white/70 backdrop-blur-lg transition-all duration-300`}
      style={{
        boxShadow: '0 20px 50px -12px rgba(13,27,46,0.15)',
      }}
    >
      {/* Botón de alternar posición */}
      <button
        onClick={alternarPosicion}
        className="hidden md:flex flex-shrink-0 group relative h-9 w-9 items-center justify-center rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-400 hover:text-sky-500 border border-slate-100 hover:border-sky-100 transition-all cursor-pointer"
      >
        <RefreshCw size={13} className="transition-transform duration-300 group-hover:rotate-180" />
        <span className={`absolute invisible group-hover:visible bg-slate-900/90 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-md whitespace-nowrap z-55 border border-slate-700/50 ${
          posicion === 'abajo' ? '-top-9' : 'left-11 top-1/2 -translate-y-1/2'
        }`}>
          Mover Dock
        </span>
      </button>

      {/* Línea divisoria */}
      <div className={`hidden md:block ${posicion === 'abajo' ? 'h-6 w-[1px] bg-slate-200' : 'h-[1px] w-6 bg-slate-200'}`} />

      {/* Items del Dock */}
      {items.map((item) => {
        const Icono = item.icono
        const activo = pantallaActual === item.id

        return (
          <button
            key={item.id}
            onClick={() => onNavegar(item.id)}
            className={`flex-shrink-0 group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 cursor-pointer ${
              activo
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/35'
                : 'bg-white hover:bg-sky-50 text-slate-650 hover:text-sky-500 border border-slate-100 hover:border-sky-200 hover:scale-115 hover:-translate-y-0.5'
            }`}
          >
            <Icono size={18} />
            
            {/* Indicador de activo */}
            {activo && (
              <span className={`absolute h-1.5 w-1.5 rounded-full bg-white ${
                posicion === 'abajo' ? 'bottom-1' : 'right-1'
              }`} />
            )}

            {/* Tooltip */}
            <span className={`absolute invisible group-hover:visible bg-slate-900/90 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-md whitespace-nowrap z-55 border border-slate-700/50 ${
              posicion === 'abajo' ? '-top-9' : 'left-11 top-1/2 -translate-y-1/2'
            }`}>
              {item.titulo}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default App
