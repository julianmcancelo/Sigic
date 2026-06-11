import { useState, useEffect } from 'react'

import { PaginaInicioSesion } from './paginas/PaginaInicioSesion'
import { PantallaBienvenida } from './paginas/PantallaBienvenida'
import { GestionInvitados } from './paginas/GestionInvitados'
import { RegistroInvitados } from './paginas/RegistroInvitados'
import { ControlIngreso } from './paginas/ControlIngreso'
import { LoginEgresado } from './paginas/LoginEgresado'
import { PantallaSeleccionLogin } from './paginas/PantallaSeleccionLogin'
import { PanelAjustes } from './paginas/PanelAjustes'
import { GestionCeremonias } from './paginas/GestionCeremonias'
import { EditorAnfiteatro } from './paginas/EditorAnfiteatro'
import { GestionProfesores } from './paginas/GestionProfesores'
import { AsistenteConfiguracionInicial } from './paginas/AsistenteConfiguracionInicial'
import { GestionUsuarios } from './paginas/GestionUsuarios'
import { CentroSuperAdmin } from './paginas/CentroSuperAdmin'

import { ControlExpositor } from './componentes/ControlExpositor'
import { validarToken, obtenerCeremoniaActiva, obtenerEstadoSetup, limpiarTokenSesion } from './servicios/api'

function App() {
  const parametros = new URLSearchParams(window.location.search)
  const forzarAsistentePorUrl = parametros.get('asistente') === '1'
  const forzarAsistentePorStorage = localStorage.getItem('forzar_asistente_inicial') === '1'
  const forzarAsistente = forzarAsistentePorUrl || forzarAsistentePorStorage

  const [tokenURL, setTokenURL] = useState(() => new URLSearchParams(window.location.search).get('token'))
  const [datosToken, setDatosToken] = useState(null)
  const [errorToken, setErrorToken] = useState(false)
  const [validandoToken, setValidandoToken] = useState(!!tokenURL)

  const [adminActivo, setAdminActivo] = useState(() => localStorage.getItem('sesion_admin') === 'true')
  const [adminUser, setAdminUser] = useState(() => JSON.parse(localStorage.getItem('admin_user') || 'null') ?? { nombre: '', correo: '' })

  const [egresadoActivo, setEgresadoActivo] = useState(() => localStorage.getItem('sesion_egresado') === 'true')
  const [egresadoUser, setEgresadoUser] = useState(() => JSON.parse(localStorage.getItem('egresado_user') || 'null'))

  const [pantallaAdmin, setPantallaAdmin] = useState('bienvenida')
  const [vistaLogin, setVistaLogin] = useState(() => {
    const p = window.location.pathname
    return (p === '/egresado' || p === '/carga') ? 'egresado' : null
  })

  const [ceremoniaActiva, setCeremoniaActiva] = useState(null)
  const [estadoSetup, setEstadoSetup] = useState({ cargando: true, requiere: false })

  useEffect(() => {
    async function sync() {
      try {
        const c = await obtenerCeremoniaActiva()
        setCeremoniaActiva(c)
      } catch (e) {
        console.warn('No se pudo sincronizar la ceremonia activa:', e.message)
      }
    }
    sync()
  }, [])

  useEffect(() => {
    if (forzarAsistente) {
      setEstadoSetup({ cargando: false, requiere: true })
      return
    }

    async function revisarSetup() {
      try {
        const estado = await obtenerEstadoSetup()
        setEstadoSetup({ cargando: false, requiere: !!estado.requiereConfiguracionInicial })
      } catch (_e) {
        // Si backend/setup no responde, forzamos asistente para no dejar al usuario bloqueado en login.
        setEstadoSetup({ cargando: false, requiere: true })
      }
    }
    revisarSetup()
  }, [forzarAsistente])

  useEffect(() => {
    async function validar() {
      if (!tokenURL) return
      setValidandoToken(true)
      try {
        const datos = await validarToken(tokenURL)
        setDatosToken(datos)
      } catch (err) {
        console.error('Token invalido:', err.message)
        setErrorToken(true)
      } finally {
        setValidandoToken(false)
      }
    }
    validar()
  }, [tokenURL])

  useEffect(() => {
    const handleNav = () => setVistaLogin('egresado')
    window.addEventListener('ir-a-login-egresado', handleNav)
    return () => window.removeEventListener('ir-a-login-egresado', handleNav)
  }, [])

  function manejarLoginAdminExitoso(datos) {
    setAdminUser(datos)
    setAdminActivo(true)
    localStorage.setItem('sesion_admin', 'true')
    localStorage.setItem('admin_user', JSON.stringify(datos))
    if (datos?.rol === 'SUPER_ADMIN') {
      setPantallaAdmin('super-admin')
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

  function manejarLoginEgresadoExitoso(datos) {
    setEgresadoUser(datos)
    setEgresadoActivo(true)
    localStorage.setItem('sesion_egresado', 'true')
    localStorage.setItem('egresado_user', JSON.stringify(datos))
    setVistaLogin(null)
    setTokenURL(null)
  }

  function cerrarSesionEgresado() {
    setEgresadoUser(null)
    setEgresadoActivo(false)
    localStorage.removeItem('sesion_egresado')
    localStorage.removeItem('egresado_user')
    limpiarTokenSesion()
    setTokenURL(null)
    window.history.replaceState({}, document.title, '/')
  }

  function limpiarTodo() {
    localStorage.clear()
    window.location.href = '/'
  }

  if (estadoSetup.cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F4F8]">
        <div className="text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#29ABE2] border-t-transparent mx-auto mb-3" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#29ABE2]">Preparando sistema</p>
        </div>
      </div>
    )
  }

  if (estadoSetup.requiere) {
    return (
      <AsistenteConfiguracionInicial
        onFinalizado={(usuario) => {
          localStorage.removeItem('forzar_asistente_inicial')
          manejarLoginAdminExitoso({ id: usuario.id, nombre: usuario.nombre, correo: usuario.email, rol: usuario.rol })
          setEstadoSetup({ cargando: false, requiere: false })
        }}
      />
    )
  }

  let contenido = null

  if (tokenURL) {
    if (validandoToken) {
      contenido = (
        <div className="flex min-h-screen items-center justify-center bg-[#F0F4F8]">
          <div className="text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#29ABE2] border-t-transparent mx-auto mb-3" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#29ABE2]">Verificando acceso</p>
          </div>
        </div>
      )
    } else if (errorToken) {
      contenido = (
        <div className="flex min-h-screen items-center justify-center bg-[#F0F4F8]">
          <div className="max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl border border-red-100">
            <h2 className="text-lg font-black text-red-500 mb-2">Enlace expirado</h2>
            <p className="text-xs text-slate-500">Este link de invitacion ya no es valido o esta mal escrito.</p>
          </div>
        </div>
      )
    } else if (datosToken) {
      if (egresadoActivo && egresadoUser?.id !== datosToken.id) {
        localStorage.removeItem('sesion_egresado')
        localStorage.removeItem('egresado_user')
      }
      contenido = <LoginEgresado emailInicial={datosToken.correo} onLoginExitoso={manejarLoginEgresadoExitoso} onVolver={() => setTokenURL(null)} />
    } else {
      contenido = <div className="flex min-h-screen bg-[#F0F4F8]" />
    }
  } else if (egresadoActivo && egresadoUser) {
    contenido = <RegistroInvitados egresadoSesion={egresadoUser} onCerrarSesion={cerrarSesionEgresado} />
  } else if (adminActivo) {
    if (adminUser?.rol === 'SUPER_ADMIN' && pantallaAdmin === 'gestion-ceremonias') {
      contenido = <CentroSuperAdmin usuario={adminUser} onVolver={() => setPantallaAdmin('bienvenida')} onCerrarSesion={cerrarSesionAdmin} onNavegar={setPantallaAdmin} />
    } else
    if (pantallaAdmin === 'gestion-invitados') {
      contenido = <GestionInvitados usuario={adminUser} onVolver={() => setPantallaAdmin('bienvenida')} onCerrarSesion={cerrarSesionAdmin} />
    } else if (pantallaAdmin === 'control-ingreso') {
      contenido = <ControlIngreso usuario={adminUser} onVolver={() => setPantallaAdmin('bienvenida')} onCerrarSesion={cerrarSesionAdmin} />
    } else if (pantallaAdmin === 'seleccion-asientos') {
      contenido = <EditorAnfiteatro onVolver={() => setPantallaAdmin('bienvenida')} ceremoniaId={ceremoniaActiva?.id} />
    } else if (pantallaAdmin === 'ajustes') {
      contenido = <PanelAjustes usuario={adminUser} onVolver={() => setPantallaAdmin('bienvenida')} onCerrarSesion={cerrarSesionAdmin} />
    } else if (pantallaAdmin === 'gestion-ceremonias') {
      contenido = <GestionCeremonias onVolver={() => setPantallaAdmin('bienvenida')} onCambioCeremonia={() => obtenerCeremoniaActiva().then(setCeremoniaActiva)} onEditarAnfiteatro={(id) => { setCeremoniaActiva({ id }); setPantallaAdmin('seleccion-asientos') }} />
    } else if (pantallaAdmin === 'gestion-profesores') {
      contenido = <GestionProfesores onVolver={() => setPantallaAdmin('bienvenida')} />
    } else if (pantallaAdmin === 'gestion-usuarios') {
      contenido = <GestionUsuarios usuario={adminUser} onVolver={() => setPantallaAdmin('bienvenida')} onCerrarSesion={cerrarSesionAdmin} />
    } else if (pantallaAdmin === 'super-admin') {
      contenido = <CentroSuperAdmin usuario={adminUser} onVolver={() => setPantallaAdmin('bienvenida')} onCerrarSesion={cerrarSesionAdmin} onNavegar={setPantallaAdmin} />
    } else {
      contenido = <PantallaBienvenida usuario={adminUser} ceremoniaActiva={ceremoniaActiva} onCerrarSesion={cerrarSesionAdmin} onNavegar={setPantallaAdmin} />
    }
  } else if (vistaLogin === 'admin') {
    contenido = <PaginaInicioSesion onInicioSesionExitoso={manejarLoginAdminExitoso} onVolver={() => setVistaLogin(null)} />
  } else if (vistaLogin === 'egresado') {
    contenido = <LoginEgresado onLoginExitoso={manejarLoginEgresadoExitoso} onVolver={() => setVistaLogin(null)} />
  } else {
    contenido = <PantallaSeleccionLogin onSeleccionarAdmin={() => setVistaLogin('admin')} onSeleccionarEgresado={() => setVistaLogin('egresado')} />
  }

  return (
    <>
      {contenido}
      <ControlExpositor onSimularAdmin={manejarLoginAdminExitoso} onSimularEgresado={manejarLoginEgresadoExitoso} onLimpiar={limpiarTodo} />
    </>
  )
}

export default App
