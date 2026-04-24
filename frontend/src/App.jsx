import { useState, useEffect } from 'react'

// Importación de Páginas
import { PaginaInicioSesion } from './paginas/PaginaInicioSesion'
import { PantallaBienvenida } from './paginas/PantallaBienvenida'
import { GestionInvitados } from './paginas/GestionInvitados'
import { RegistroInvitados } from './paginas/RegistroInvitados'
import { ControlIngreso } from './paginas/ControlIngreso'
import { LoginEgresado } from './paginas/LoginEgresado'
import { PantallaSeleccionLogin } from './paginas/PantallaSeleccionLogin'
import { SeleccionAsientos } from './paginas/SeleccionAsientos'
import { PanelAjustes } from './paginas/PanelAjustes'
import { GestionCeremonias } from './paginas/GestionCeremonias'
import { EditorAnfiteatro } from './paginas/EditorAnfiteatro'


// Componentes Globales
import { ControlExpositor } from './componentes/ControlExpositor'

// Servicios
import { validarToken, obtenerCeremoniaActiva } from './servicios/api'

/**
 * Componente Principal (Orquestador).
 * Controla todas las sesiones (Admin y Egresado) y decide qué pantalla mostrar
 * basándose en el estado de autenticación y la URL.
 */
function App() {
  // ─── 0. DETECCIÓN DE CONTEXTO (URL) ───
  // Verifica si venimos de un link directo por correo (?token=...)
  const [tokenURL, setTokenURL] = useState(
    () => new URLSearchParams(window.location.search).get('token')
  )
  const [datosToken, setDatosToken] = useState(null)
  const [errorToken, setErrorToken] = useState(false)
  // Iniciamos en true si hay un token para evitar "saltos" de pantalla
  const [validandoToken, setValidandoToken] = useState(!!tokenURL)

  // ─── 1. SESIÓN DE ADMINISTRADOR ───
  const [adminActivo, setAdminActivo] = useState(
    () => localStorage.getItem('sesion_admin') === 'true',
  )
  const [adminUser, setAdminUser] = useState(
    () => JSON.parse(localStorage.getItem('admin_user') || 'null') ?? { nombre: '', correo: '' },
  )

  // ─── 2. SESIÓN DE EGRESADO (OTP) ───
  const [egresadoActivo, setEgresadoActivo] = useState(
    () => localStorage.getItem('sesion_egresado') === 'true',
  )
  const [egresadoUser, setEgresadoUser] = useState(
    () => JSON.parse(localStorage.getItem('egresado_user') || 'null'),
  )

  // ─── 3. ESTADO DE NAVEGACIÓN ───
  // Controla las sub-paginas del panel de administración
  const [pantallaAdmin, setPantallaAdmin] = useState('bienvenida')

  // Controla qué tipo de login estamos intentando realizar al inicio
  const [vistaLogin, setVistaLogin] = useState(() => {
    // Soporte para rutas simplificadas /egresado o /carga
    const p = window.location.pathname
    return (p === '/egresado' || p === '/carga') ? 'egresado' : null
  })

  const [ceremoniaActiva, setCeremoniaActiva] = useState(null)

  // Sincronizar ceremonia activa al iniciar
  useEffect(() => {
    async function sync() {
      try {
        const c = await obtenerCeremoniaActiva()
        setCeremoniaActiva(c)
      } catch (e) {
        console.warn("No se pudo sincronizar la ceremonia activa:", e.message)
      }
    }
    sync()
  }, [])

  // ─── 3.1 VALIDACIÓN DE TOKEN (NUEVO FLUJO) ───
  useEffect(() => {
    async function validar() {
      if (!tokenURL) return
      
      setValidandoToken(true)
      try {
        const datos = await validarToken(tokenURL)
        setDatosToken(datos)
      } catch (err) {
        console.error("Token inválido:", err.message)
        setErrorToken(true)
      } finally {
        setValidandoToken(false)
      }
    }
    validar()
  }, [tokenURL])

  // Escucha eventos globales para cambiar de vista (ej. desde el botón de selección)
  useEffect(() => {
    const handleNav = () => setVistaLogin('egresado')
    window.addEventListener('ir-a-login-egresado', handleNav)
    return () => window.removeEventListener('ir-a-login-egresado', handleNav)
  }, [])

  // ─── 4. LOGICA DE ADMINISTRACIÓN ───
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
    setPantallaAdmin('bienvenida')
  }

  // ─── 5. LOGICA DE EGRESADO ───
  function manejarLoginEgresadoExitoso(datos) {
    setEgresadoUser(datos)
    setEgresadoActivo(true)
    localStorage.setItem('sesion_egresado', 'true')
    localStorage.setItem('egresado_user', JSON.stringify(datos))
    setVistaLogin(null)
    setTokenURL(null) // Si ya inició sesión, ignoramos el token de la URL
  }

  function cerrarSesionEgresado() {
    setEgresadoUser(null)
    setEgresadoActivo(false)
    localStorage.removeItem('sesion_egresado')
    localStorage.removeItem('egresado_user')
    setTokenURL(null)
    // Limpia la URL dejando solo la raíz
    window.history.replaceState({}, document.title, "/")
  }

  function limpiarTodo() {
    localStorage.clear()
    window.location.href = '/'
  }

  // ──────────────────────────────────────────────────────────────
  // ─── 6. RENDERIZADO DINÁMICO (Orquestador de Vistas) ───
  // ──────────────────────────────────────────────────────────────
  let contenido = null

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
        <div className="flex min-h-screen items-center justify-center bg-[#F0F4F8]">
          <div className="max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl border border-red-100">
            <h2 className="text-lg font-black text-red-500 mb-2">Enlace expirado</h2>
            <p className="text-xs text-slate-500">Este link de invitación ya no es válido o está mal escrito.</p>
          </div>
        </div>
      )
    } else if (datosToken) {
      if (egresadoActivo && egresadoUser?.id !== datosToken.id) {
          localStorage.removeItem('sesion_egresado')
          localStorage.removeItem('egresado_user')
      }
      contenido = (
        <LoginEgresado 
          emailInicial={datosToken.correo} 
          onLoginExitoso={manejarLoginEgresadoExitoso}
          onVolver={() => setTokenURL(null)}
        />
      )
    } else {
      contenido = <div className="flex min-h-screen bg-[#F0F4F8]" />
    }
  }

  // CASO B: Hay una sesión de Egresado activa
  else if (egresadoActivo && egresadoUser) {
    contenido = <RegistroInvitados egresadoSesion={egresadoUser} onCerrarSesion={cerrarSesionEgresado} />
  }

  // CASO C: El usuario es Administrador logueado
  else if (adminActivo) {
    if (pantallaAdmin === 'gestion-invitados') {
      contenido = (
        <GestionInvitados
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
  } else if (vistaLogin === 'egresado') {
    contenido = (
      <LoginEgresado 
        onLoginExitoso={manejarLoginEgresadoExitoso} 
        onVolver={() => setVistaLogin(null)} 
      />
    )
  }

  // CASO E: Selección Inicial
  else {
    contenido = (
      <PantallaSeleccionLogin 
        onSeleccionarAdmin={() => setVistaLogin('admin')}
        onSeleccionarEgresado={() => setVistaLogin('egresado')}
      />
    )
  }

  return (
    <>
      {contenido}
      
      {/* Herramienta para presentaciones (Demo Mode) */}
      <ControlExpositor 
        onSimularAdmin={manejarLoginAdminExitoso}
        onSimularEgresado={manejarLoginEgresadoExitoso}
        onLimpiar={limpiarTodo}
      />
    </>
  )
}

export default App
