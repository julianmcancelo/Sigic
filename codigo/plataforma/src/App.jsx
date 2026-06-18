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
import { Home, ScanLine, Users, GraduationCap, MapPin, BarChart3, Settings, Calendar, RefreshCw, Shield, Server } from 'lucide-react'

// Importación de Páginas
import { PaginaInicioSesion } from './paginas/PaginaInicioSesion'
import { PantallaBienvenida } from './paginas/PantallaBienvenida'
import { GestionGraduados } from './paginas/GestionGraduados'
import { PanelGraduado } from './paginas/PanelGraduado'
import { ControlIngreso } from './paginas/ControlIngreso'
import { LoginGraduado } from './paginas/LoginGraduado'
import { PantallaSeleccionLogin } from './paginas/PantallaSeleccionLogin'
import { PanelAjustes } from './paginas/PanelAjustes'
import { GestionCeremonias } from './paginas/GestionCeremonias'
import { EditorAnfiteatro } from './paginas/EditorAnfiteatro'
import { AsistenteSetup } from './paginas/AsistenteSetup'
import { PantallaAceptacion } from './paginas/PantallaAceptacion'
import { GestionProfesores } from './paginas/GestionProfesores'
import { ManualUsuarioWeb } from './paginas/ManualUsuarioWeb'
import { PantallaBienvenidaPro } from './paginas/v2/PantallaBienvenidaPro'
import { PanelReportes } from './paginas/v2/PanelReportes'
import { GestionPorteria } from './paginas/v2/GestionPorteria'
import { CentroControl } from './paginas/v2/CentroControl'


// Componentes Globales
import { ControlExpositor } from './componentes/ControlExpositor'
import { PantallaCargaInicial } from './componentes/PantallaCargaInicial'

// Servicios
import { validarToken, obtenerCeremoniaActiva, obtenerEstadoSetup, responderInvitacion, limpiarTokenSesion, obtenerAjustes, actualizarAjuste } from './servicios/api'

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
    () => JSON.parse(localStorage.getItem('admin_user') || 'null') ?? { nombre: '', correo: '' },
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
        if (u && u.correo && u.correo.toLowerCase() === 'soporte@sigic.com.ar') {
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
    return (p === '/egresado' || p === '/graduado' || p === '/carga') ? 'graduado' : null
  })

  const [ceremoniaActiva, setCeremoniaActiva] = useState(null)
  
  // ─── 3.0 ESTADO DE CONFIGURACIÓN INICIAL (SETUP) ───
  const [requiereSetup, setRequiereSetup] = useState(null)
  const [cargandoSetup, setCargandoSetup] = useState(true)

  const [enMantenimiento, setEnMantenimiento] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('modo_mantenimiento') === 'true'
    }
    return false
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
    }
    window.addEventListener('storage', sincronizarPestanas)
    return () => window.removeEventListener('storage', sincronizarPestanas)
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
            if (ajustesDb && ajustesDb.modo_mantenimiento) {
              const modoMant = ajustesDb.modo_mantenimiento.valor === 'true'
              setEnMantenimiento(modoMant)
              localStorage.setItem('modo_mantenimiento', modoMant.toString())
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

  // ─── 3.0.2 CONTROL DE SESIÓN DE EGRESADOS POR CICLO DE VIDA ───
  useEffect(() => {
    if (graduadoActivo && graduadoUsuario && graduadoUsuario.estado !== 'PENDIENTE' && graduadoUsuario.estado !== 'ACEPTADO') {
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

    setAdminUser(datos)
    setAdminActivo(true)
    localStorage.setItem('sesion_admin', 'true')
    localStorage.setItem('admin_user', JSON.stringify(datos))
    
    // Si es una simulación del expositor (no hay token guardado), guardamos el token de bypass
    if (!localStorage.getItem('sigic_token')) {
      localStorage.setItem('sigic_token', 'bypass-admin-token')
    }
    if (datos && datos.correo && datos.correo.toLowerCase() === 'soporte@sigic.com.ar') {
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
    setPantallaAdmin('bienvenida')
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
    
    // Si es una simulación del expositor (no hay token guardado), guardamos el token de bypass
    if (!localStorage.getItem('sigic_token')) {
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
    const actualizado = { ...graduadoUsuario, estado: 'ACEPTADO' }
    setGraduadoUsuario(actualizado)
    localStorage.setItem('graduado_usuario', JSON.stringify(actualizado))
  }

  async function manejarRechazarInvitacion() {
    await responderInvitacion(graduadoUsuario.id, 'RECHAZADO')
    cerrarSesionGraduado()
  }

  function limpiarTodo() {
    localStorage.clear()
    window.location.href = '/'
  }

  // ──────────────────────────────────────────────────────────────
  // ─── 6. RENDERIZADO DINÁMICO (Orquestador de Vistas) ───
  // ──────────────────────────────────────────────────────────────
  let contenido = null

  // CASO 0: Cargando estado inicial
  if (cargandoSetup) {
    return <PantallaCargaInicial />
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
                <a href="mailto:soporte@beltran.edu.ar" className="text-xs font-black text-[#0EA5E9] hover:underline">
                  soporte@beltran.edu.ar
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
    // Subcase B.1: Estado PENDIENTE → Pantalla de Aceptación
    if (graduadoUsuario.estado === 'PENDIENTE') {
      contenido = (
        <PantallaAceptacion
          graduado={graduadoUsuario}
          onAceptar={manejarAceptarInvitacion}
          onRechazar={manejarRechazarInvitacion}
        />
      )
    }
    // Subcase B.2: Estado ACEPTADO → Panel completo del graduado
    else if (graduadoUsuario.estado === 'ACEPTADO') {
      contenido = <PanelGraduado graduadoSesion={graduadoUsuario} onCerrarSesion={cerrarSesionGraduado} />
    }
    // Subcase B.3: Estado RECHAZADO → Inhabilitado, cerrar sesión (manejado por useEffect)
    else {
      contenido = <div className="flex min-h-screen bg-[#F0F4F8]" />
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
      if (adminUser?.correo?.toLowerCase() === 'soporte@sigic.com.ar') {
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

  // CASO E: Selección Inicial
  else {
    contenido = (
      <PantallaSeleccionLogin 
        enMantenimiento={enMantenimiento}
        onSeleccionarAdmin={() => setVistaLogin('admin')}
        onSeleccionarEgresado={() => setVistaLogin('graduado')}
        onSeleccionarManual={() => setVistaLogin('manual')}
      />
    )
  }

  return (
    <>
      {contenido}

      {adminActivo && (
        <AdminDock
          pantallaActual={pantallaAdmin}
          onNavegar={setPantallaAdmin}
          posicion={dockPosicion}
          setPosicion={setDockPosicion}
          usuario={adminUser}
        />
      )}
      
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

// ─── COMPONENTE NAV DOCKER ADMINISTRATIVO PERSISTENTE ───
function AdminDock({ pantallaActual, onNavegar, posicion, setPosicion, usuario }) {
  const esSoporte = usuario?.correo && usuario.correo.toLowerCase() === 'soporte@sigic.com.ar'

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

