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
import { useState, useEffect } from 'react'

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

// Componentes Globales
import { ControlExpositor } from './componentes/ControlExpositor'

// Servicios
import { validarToken, obtenerCeremoniaActiva, obtenerEstadoSetup, responderInvitacion, limpiarTokenSesion } from './servicios/api'

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
  const [pantallaAdmin, setPantallaAdmin] = useState('bienvenida')

  const [vistaLogin, setVistaLogin] = useState(() => {
    const p = window.location.pathname
    return (p === '/egresado' || p === '/graduado' || p === '/carga') ? 'graduado' : null
  })

  const [ceremoniaActiva, setCeremoniaActiva] = useState(null)
  
  // ─── 3.0 ESTADO DE CONFIGURACIÓN INICIAL (SETUP) ───
  const [requiereSetup, setRequiereSetup] = useState(null)
  const [cargandoSetup, setCargandoSetup] = useState(true)

  // Sincronizar estado inicial y ceremonia activa al iniciar
  useEffect(() => {
    async function inicializarApp() {
      try {
        const estado = await obtenerEstadoSetup()
        setRequiereSetup(estado.requiereConfiguracionInicial)
        
        if (!estado.requiereConfiguracionInicial) {
          const c = await obtenerCeremoniaActiva()
          setCeremoniaActiva(c)
        }
      } catch (e) {
        console.warn("No se pudo contactar al servidor para el estado inicial:", e.message)
      } finally {
        setCargandoSetup(false)
      }
    }
    inicializarApp()
  }, [])

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
    setAdminUser(datos)
    setAdminActivo(true)
    localStorage.setItem('sesion_admin', 'true')
    localStorage.setItem('admin_user', JSON.stringify(datos))
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
    setGraduadoUsuario(datos)
    setGraduadoActivo(true)
    localStorage.setItem('sesion_graduado', 'true')
    localStorage.setItem('graduado_usuario', JSON.stringify(datos))
    setVistaLogin(null)
    setTokenURL(null)
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F4F8]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Conectando al Servidor SiGIC...</p>
        </div>
      </div>
    )
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
    // Subcase B.3: Estado RECHAZADO → Inhabilitado, cerrar sesión
    else {
      cerrarSesionGraduado()
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
    } else {
      contenido = (
        <PantallaBienvenida
          usuario={adminUser}
          ceremoniaActiva={ceremoniaActiva}
          onCerrarSesion={cerrarSesionAdmin}
          onNavegar={setPantallaAdmin}
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
        onSeleccionarAdmin={() => setVistaLogin('admin')}
        onSeleccionarEgresado={() => setVistaLogin('graduado')}
        onSeleccionarManual={() => setVistaLogin('manual')}
      />
    )
  }

  return (
    <>
      {contenido}
      
      {/* Herramienta para presentaciones (Modo Demo) */}
      <ControlExpositor 
        onSimularAdmin={manejarLoginAdminExitoso}
        onSimularEgresado={manejarLoginGraduadoExitoso}
        onLimpiar={limpiarTodo}
      />
    </>
  )
}

export default App
