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
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Home, ScanLine, Users, GraduationCap, MapPin, BarChart3, Settings, Calendar, CalendarPlus, RefreshCw, Shield, Server, Search, Power, Bell, Wifi, Volume2, ChevronRight, ChevronUp, ArrowRight, LayoutGrid, X, Minus, Maximize2, Square, Copy, Sun, Moon, MousePointer2, Lock, ClipboardCheck, Activity, Send, ListChecks, ScrollText, Sparkles, Armchair, Award, QrCode, Palette } from 'lucide-react'

// Importación de Modal de Fondo
import { ModalPersonalizarFondo } from './componentes/ModalPersonalizarFondo'

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
import { PantallaBienvenidaPro } from './paginas/operacion/PantallaBienvenidaPro'
import { PanelReportes } from './paginas/operacion/PanelReportes'
import { GestionPorteria } from './paginas/operacion/GestionPorteria'
import { CentroControl } from './paginas/operacion/CentroControl'
import { GestionGraduados } from './paginas/operacion/GestionGraduados'
import { GestionConvocatoria } from './paginas/operacion/GestionConvocatoria'
import { PreparacionCeremonia } from './paginas/operacion/PreparacionCeremonia'
import { ControlIngreso } from './paginas/operacion/ControlIngreso'
import { PanelAjustes } from './paginas/operacion/PanelAjustes'
import { GestionCeremonias } from './paginas/operacion/GestionCeremonias'
import { EditorAnfiteatro } from './paginas/operacion/EditorAnfiteatro'
import { GestionProfesores } from './paginas/operacion/GestionProfesores'
import { CentroOperacionesDemo } from './paginas/operacion/CentroOperacionesDemo'
import { EstadoCeremonia } from './paginas/operacion/EstadoCeremonia'


// Componentes Globales
import { ADMIN_DEMO, ControlExpositor, EGRESADA_DEMO, MarcaAguaDemo } from './componentes/ControlExpositor'
import { GuiaDemostracionAutomatica } from './componentes/GuiaDemostracionAutomatica'
import { PantallaCargaInicial } from './componentes/PantallaCargaInicial'
import { AsistenteOperativoCeremonia } from './componentes/AsistenteOperativoCeremonia'
import { MenuInicio } from './componentes/MenuInicio'

// Servicios
import { validarToken, obtenerCeremoniaActiva, obtenerEstadoSetup, responderInvitacion, limpiarTokenSesion, guardarTokenSesion, obtenerTokenSesion, obtenerAjustes, actualizarAjuste } from './servicios/api'
import { generarDatosDemoAleatorios, obtenerDatosDemoActuales, limpiarDatosDemo } from './lib/generador-datos-demo'
import { demoSandbox } from './lib/demo-sandbox'

function verificarModoDemo() {
  if (typeof window === 'undefined') return false
  
  // 1. Parámetro explícito en la URL (?demo=1 o ?demo=true activa, ?demo=0 o ?demo=false desactiva)
  const params = new URLSearchParams(window.location.search)
  const demoParam = params.get('demo')
  if (demoParam === '1' || demoParam === 'true') {
    localStorage.setItem('sigic_modo_demo', 'true')
    return true
  }
  if (demoParam === '0' || demoParam === 'false') {
    localStorage.setItem('sigic_modo_demo', 'false')
    return false
  }

  // 2. Detección automática por subdominio (demo.sigic.com.ar activa demo por defecto)
  const host = window.location.hostname.toLowerCase()
  if (host === 'demo.sigic.com.ar' || host.startsWith('demo.') || host.includes('-demo.')) {
    return true
  }
  if (host === 'app.sigic.com.ar') {
    // En producción institucional real, desactivado por defecto salvo preferencia manual en localStorage
    const demoGuardado = localStorage.getItem('sigic_modo_demo')
    if (demoGuardado === 'true') return true
    return false
  }

  // 3. Preferencia en memoria local
  const demoGuardado = localStorage.getItem('sigic_modo_demo')
  if (demoGuardado === 'true') return true
  if (demoGuardado === 'false') return false

  // 4. Si hay una sesión activa con token JWT real, priorizar modo real
  const token = sessionStorage.getItem('sigic_token')
  if (token && !token.startsWith('bypass-')) {
    return false
  }

  // 5. Variable de entorno explícita
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'false') return false

  // 6. Por defecto en SiGIC: Modo Real conectado a PostgreSQL
  return false
}

function normalizarCorreoInstitucional(correo) {
  return typeof correo === 'string'
    ? correo.replace(/@beltran\.edu\.ar$/i, '@ibeltran.com.ar')
    : correo
}

function App() {
  const [modoDemoActivo, setModoDemoActivo] = useState(() => verificarModoDemo())

  const alternarModoDemo = () => {
    const nuevo = !modoDemoActivo
    setModoDemoActivo(nuevo)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sigic_modo_demo', String(nuevo))
      if (!nuevo) {
        limpiarTodo()
      } else {
        guardarTokenSesion('bypass-admin-token')
      }
    }
  }

  useEffect(() => {
    if (!window.__TAURI_INTERNALS__) return
    import('@tauri-apps/plugin-updater').then(async ({ check }) => {
      const actualizacion = await check()
      if (!actualizacion || !window.confirm(`Hay una actualización de SiGIC Escritorio disponible (${actualizacion.version}).\n\n¿Deseás descargarla e instalarla ahora?`)) return
      await actualizacion.downloadAndInstall()
    }).catch(() => {})
  }, [])
  // ─── 0. DETECCIÓN DE CONTEXTO (URL) ───
  const [tokenURL, setTokenURL] = useState(
    () => typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null
  )
  const [esModoPreview, setEsModoPreview] = useState(() => {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    return params.get('vista') === 'preview' || 
           params.get('admin_preview') === '1' ||
           Boolean(sessionStorage.getItem('sigic_admin_preview'))
  })
  const [datosToken, setDatosToken] = useState(null)
  const [errorToken, setErrorToken] = useState(null)
  const [validandoToken, setValidandoToken] = useState(!!tokenURL)

  // ─── 1. SESIÓN DE ADMINISTRADOR ───
  const [adminActivo, setAdminActivo] = useState(() => {
    if (typeof window === 'undefined') return false
    const activo = localStorage.getItem('sesion_admin') === 'true'
    if (activo && verificarModoDemo() && !obtenerTokenSesion()) {
      guardarTokenSesion('bypass-admin-token')
    }
    return activo
  })
  const [adminUser, setAdminUser] = useState(
    () => {
      if (typeof window === 'undefined') return { nombre: '', correo: '' }
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
    () => {
      if (typeof window === 'undefined') return false
      return localStorage.getItem('sesion_graduado') === 'true' || Boolean(sessionStorage.getItem('preview_graduado_usuario'))
    }
  )
  const [graduadoUsuario, setGraduadoUsuario] = useState(
    () => {
      if (typeof window === 'undefined') return null
      const preview = sessionStorage.getItem('preview_graduado_usuario')
      if (preview) {
        try { return JSON.parse(preview) } catch (_) {}
      }
      return JSON.parse(localStorage.getItem('graduado_usuario') || 'null')
    }
  )

  // ─── 3. ESTADO DE NAVEGACIÓN ───
  const [pantallaAdmin, setPantallaAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      const moduloSolicitado = new URLSearchParams(window.location.search).get('modulo')
      if (moduloSolicitado && /^[a-z-]+$/.test(moduloSolicitado)) {
        return moduloSolicitado
      }
      try {
        const u = JSON.parse(localStorage.getItem('admin_user') || 'null');
        if (u?.rol === 'ADMINISTRATIVO') {
          return 'centro-control';
        }
        if (u && (u.rol === 'PORTERIA' || u.rol === 'SEGURIDAD')) {
          return 'control-ingreso';
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

  async function sincronizarEntornoCeremonia() {
    const ceremonia = await obtenerCeremoniaActiva()
    setCeremoniaActiva(ceremonia)
    window.dispatchEvent(new CustomEvent('sigic-ceremonia-cambiada', { detail: ceremonia }))
    return ceremonia
  }
  
  // ─── 3.1 MODO DEMOSTRACIÓN AUTOMÁTICA GUIADA (PILOTO AUTOMÁTICO) ───
  const [demoAutomaticaActiva, setDemoAutomaticaActiva] = useState(false)
  const [pestanaGraduadoDemo, setPestanaGraduadoDemo] = useState('juramento')

  const iniciarDemostracionCompleta = async () => {
    // Generar un conjunto aleatorio y realista nuevo para esta demostración
    const datasetAleatorio = generarDatosDemoAleatorios()
    demoSandbox.iniciar(datasetAleatorio)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sigic_demo_activa', 'true')
      for (let f = 1; f <= 7; f++) {
        try {
          const key = `sigic_demo_secuencia_${f}`
          const raw = localStorage.getItem(key)
          if (raw && (raw.includes('Inicializar') || raw.includes('NUEVO ENTORNO') || raw.includes('FECHA LÍMITE') || raw.includes('"selector":"form"') || raw.includes('"selector":"main"'))) {
            localStorage.removeItem(key)
          }
        } catch {}
      }
    }

    guardarTokenSesion('bypass-admin-token')
    localStorage.setItem('sesion_admin', 'true')
    localStorage.setItem('admin_user', JSON.stringify(ADMIN_DEMO))
    setAdminActivo(true)
    setAdminUser(ADMIN_DEMO)
    setPantallaAdmin('gestion-ceremonias')
    setDemoAutomaticaActiva(true)

    setCeremoniaActiva(datasetAleatorio.ceremonia)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sigic-ceremonia-cambiada', { detail: datasetAleatorio.ceremonia }))
    }
  }

  const finalizarDemostracionCompleta = () => {
    setDemoAutomaticaActiva(false)
    demoSandbox.limpiar()
    limpiarDatosDemo()
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sigic_demo_activa')
    }
    limpiarTodo()
  }

  const aplicarPasoDemo = useCallback((paso) => {
    if (!paso) return
    const dataset = obtenerDatosDemoActuales()

    if (paso.tipoUsuario === 'admin') {
      setGraduadoActivo(prev => prev ? false : prev)
      setGraduadoUsuario(prev => prev ? null : prev)
      guardarTokenSesion('bypass-admin-token')
      localStorage.setItem('sesion_admin', 'true')
      localStorage.setItem('admin_user', JSON.stringify(ADMIN_DEMO))
      setAdminActivo(prev => !prev ? true : prev)
      setAdminUser(prev => prev?.correo === ADMIN_DEMO.correo ? prev : ADMIN_DEMO)
      const vistaDestino = paso.vistaAdmin || 'gestion-ceremonias'
      setPantallaAdmin(prev => prev !== vistaDestino ? vistaDestino : prev)

      if (dataset?.ceremonia) {
        setCeremoniaActiva(prev => prev?.id !== dataset.ceremonia.id ? dataset.ceremonia : prev)
      }
    } else if (paso.tipoUsuario === 'graduado') {
      const graduado = dataset?.graduado || EGRESADA_DEMO
      setAdminActivo(prev => prev ? false : prev)
      setGraduadoActivo(prev => !prev ? true : prev)
      setGraduadoUsuario(prev => prev?.id !== graduado.id ? graduado : prev)
      guardarTokenSesion(`bypass-egresado-${graduado.id}`)
      if (paso.pestanaGraduado) {
        setPestanaGraduadoDemo(prev => prev !== paso.pestanaGraduado ? paso.pestanaGraduado : prev)
      }
    }
  }, [])

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
        // Si esta pestaña tiene una sesión de admin activa, ignoramos para no cerrarle la sesión al admin
        if (adminActivoRef.current || localStorage.getItem('sesion_admin') === 'true') {
          return
        }
        const nuevoEstado = e.newValue === 'true'
        setGraduadoActivo(nuevoEstado)
        if (!nuevoEstado) setGraduadoUsuario(null)
      }
      if (e.key === 'admin_user') {
        setAdminUser(e.newValue ? JSON.parse(e.newValue) : { nombre: '', correo: '' })
      }
      if (e.key === 'graduado_usuario') {
        // Si esta pestaña tiene sesión de admin activa, ignoramos
        if (adminActivoRef.current || localStorage.getItem('sesion_admin') === 'true') {
          return
        }
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
      const inicioCarga = Date.now()
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
        // La apertura institucional debe ser perceptible incluso con respuestas muy rápidas.
        const esperaRestante = Math.max(0, 1600 - (Date.now() - inicioCarga))
        if (esperaRestante) {
          await new Promise(resolve => setTimeout(resolve, esperaRestante))
        }
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

        // Salvaguarda demo: Si el sandbox de demostración debe interceptar esta llamada para no tocar la BD
        if (demoSandbox.esPeticionDemo(url, args[1])) {
          try {
            const respuestaSimulada = await demoSandbox.manejarPeticion(url, args[1])
            if (respuestaSimulada) {
              return respuestaSimulada
            }
          } catch (errSandbox) {
            console.warn('Error en interceptor demoSandbox, pasando a red:', errSandbox)
          }
        }

        const response = await originalFetch(...args)
        
        const esRutaAuth = url.includes('/verificar-otp') || 
                           url.includes('/auth/login') || 
                           url.includes('/egresados/token/') ||
                           url.includes('/solicitar-otp')

        const token = obtenerTokenSesion()
        const esBypass = token.startsWith('bypass-')

        if ((response.status === 401 || response.status === 403) && !esRutaAuth && !esBypass) {
          window.dispatchEvent(new CustomEvent('sigic-desautorizado'))
        }
        return response;
      }
    }

    const manejarDesautorizado = () => {
      if (demoAutomaticaActiva) {
        console.warn('Interceptor 401/403 ignorado durante la demostración automática.')
        return
      }
      console.warn('La sesión expiró o ya no tiene autorización. Cerrando el acceso actual...')
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
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const esAdmin = typeof window !== 'undefined' && localStorage.getItem('sesion_admin') === 'true'
      const esPreview = params?.get('vista') === 'preview' || 
                        params?.get('admin_preview') === '1' || 
                        esAdmin || 
                        esModoPreview

      if (esPreview) {
        setEsModoPreview(true)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sigic_admin_preview', '1')
        }
        console.log("Acceso a token en modo vista previa de administración: preservando sesión de admin.")
      } else {
        console.log("Detectado token de acceso en URL. Limpiando sesiones previas para evitar conflictos...")
        localStorage.removeItem('sesion_admin')
        localStorage.removeItem('admin_user')
        setAdminActivo(false)
        setAdminUser({ nombre: '', correo: '' })
        limpiarTokenSesion()
      }
      
      // Siempre aislamos el estado previo del graduado
      setGraduadoActivo(false)
      setGraduadoUsuario(null)
    }
  }, [tokenURL, esModoPreview])

  // ─── 3.1 VALIDACIÓN DE TOKEN ───
  useEffect(() => {
    async function validar() {
      if (!tokenURL) return
      
      setValidandoToken(true)
      try {
        const datos = await validarToken(tokenURL)
        setDatosToken(datos)
        // El token personal incluido en la invitación ya fue validado por el
        // servidor y genera una sesión segura. Abrimos directamente la decisión
        // de asistencia, sin pedir un segundo inicio de sesión por OTP.
        manejarLoginGraduadoExitoso(datos.egresado)
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
    
    // Si ya existe un token real de base de datos, asegurar modo real y no inyectar bypass
    const tokenActual = obtenerTokenSesion()
    if (tokenActual && !tokenActual.startsWith('bypass-')) {
      setModoDemoActivo(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem('sigic_modo_demo', 'false')
        sessionStorage.removeItem('sigic_demo_activa')
        sessionStorage.removeItem('sigic_demo_sandbox_activo')
      }
    } else if (datosNormalizados?.esDemo || modoDemoActivo) {
      const tokenBypass = (datosNormalizados && datosNormalizados.correo && datosNormalizados.correo.toLowerCase() === 'soporte@ibeltran.com.ar')
        ? 'bypass-support-token'
        : 'bypass-admin-token'
      guardarTokenSesion(tokenBypass)
    }
    if (datosNormalizados?.rol === 'ADMINISTRATIVO') {
      setPantallaAdmin('centro-control')
    } else if (datosNormalizados && (datosNormalizados.rol === 'PORTERIA' || datosNormalizados.rol === 'SEGURIDAD')) {
      setPantallaAdmin('control-ingreso')
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
    const esAdmin = typeof window !== 'undefined' && localStorage.getItem('sesion_admin') === 'true'
    const esPreview = esModoPreview || esAdmin

    if (!esPreview) {
      // Limpiar sesión de administrador previa para disparar la sincronización en otras pestañas
      localStorage.removeItem('sesion_admin')
      localStorage.removeItem('admin_user')
      setAdminActivo(false)
      setAdminUser({ nombre: '', correo: '' })

      setGraduadoUsuario(datos)
      setGraduadoActivo(true)
      localStorage.setItem('sesion_graduado', 'true')
      localStorage.setItem('graduado_usuario', JSON.stringify(datos))
    } else {
      // Modo vista previa de administración: aislamiento total en sessionStorage
      setGraduadoUsuario(datos)
      setGraduadoActivo(true)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('preview_graduado_usuario', JSON.stringify(datos))
      }
    }
    
    // Si es una simulación del expositor o preview, guardamos el token de bypass correspondiente
    const tokenActual = obtenerTokenSesion()
    if (!tokenActual || tokenActual.startsWith('bypass-') || esPreview) {
      guardarTokenSesion(`bypass-egresado-${datos.id}`)
    }
    
    setVistaLogin(null)
    setTokenURL(null)
    if (typeof window !== 'undefined' && !esPreview) {
      window.history.replaceState({}, document.title, "/")
    }
  }

  function cerrarSesionGraduado() {
    setGraduadoUsuario(null)
    setGraduadoActivo(false)

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('preview_graduado_usuario')
      sessionStorage.removeItem('sigic_admin_preview')
    }

    if (!esModoPreview) {
      localStorage.removeItem('sesion_graduado')
      localStorage.removeItem('graduado_usuario')
      limpiarTokenSesion()
    }

    setTokenURL(null)
    setEsModoPreview(false)

    if (esModoPreview && typeof window !== 'undefined' && window.opener) {
      window.close()
    } else if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, "/")
    }
  }

  // ─── 5.1 FLUJO DE ACEPTACIÓN/RECHAZO ───
  async function manejarAceptarInvitacion() {
    await responderInvitacion(graduadoUsuario.id, 'ACEPTADO')
    const historial = (graduadoUsuario.historial || []).map((registro) =>
      String(registro.id) === String(graduadoUsuario.id) ? { ...registro, estado: 'ACEPTADO' } : registro
    )
    const actualizado = { ...graduadoUsuario, estado: 'ACEPTADO', historial }
    setGraduadoUsuario(actualizado)
    if (!esModoPreview) {
      localStorage.setItem('graduado_usuario', JSON.stringify(actualizado))
    } else if (typeof window !== 'undefined') {
      sessionStorage.setItem('preview_graduado_usuario', JSON.stringify(actualizado))
    }
  }

  async function manejarRechazarInvitacion() {
    await responderInvitacion(graduadoUsuario.id, 'RECHAZADO')
    const historial = (graduadoUsuario.historial || []).map((registro) =>
      String(registro.id) === String(graduadoUsuario.id) ? { ...registro, estado: 'RECHAZADO' } : registro
    )
    const actualizado = { ...graduadoUsuario, estado: 'RECHAZADO', historial }
    setGraduadoUsuario(actualizado)
    if (!esModoPreview) {
      localStorage.setItem('graduado_usuario', JSON.stringify(actualizado))
    } else if (typeof window !== 'undefined') {
      sessionStorage.setItem('preview_graduado_usuario', JSON.stringify(actualizado))
    }
  }

  function limpiarTodo() {
    if (esModoPreview) {
      if (typeof window !== 'undefined' && window.opener) {
        window.close()
      } else {
        cerrarSesionGraduado()
      }
      return
    }
    demoSandbox.limpiar()
    limpiarDatosDemo()
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sigic_demo_activa')
    }
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
        modoDemo={MODO_DEMO}
        enMantenimiento={enMantenimiento}
        accesoOculto={accesoOculto}
        onSeleccionarAdmin={() => MODO_DEMO ? manejarLoginAdminExitoso(ADMIN_DEMO) : setVistaLogin('admin')}
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
      contenido = <div className="flex min-h-screen bg-[#F0F4F8]" />
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
      contenido = <PanelGraduado graduadoSesion={graduadoUsuario} onCerrarSesion={cerrarSesionGraduado} pestanaForzada={pestanaGraduadoDemo} />
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

    if (esModoPreview) {
      contenido = (
        <div className="min-h-screen flex flex-col bg-[#F0F4F8]">
          <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md text-white px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-sky-500/40 shadow-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-sky-400 animate-pulse" />
              <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-sky-500/30 shrink-0">
                Vista Previa Admin
              </span>
              <span className="text-slate-400 text-xs font-bold hidden sm:inline">|</span>
              <span className="text-xs font-bold text-slate-200 truncate">
                Visualizando portal de {graduadoUsuario.nombre} {graduadoUsuario.dni ? `(${graduadoUsuario.dni})` : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={cerrarSesionGraduado}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white text-[11px] font-bold transition-all cursor-pointer border border-white/10 shrink-0 ml-3"
            >
              Cerrar Vista Previa
            </button>
          </div>
          <div className="flex-1">
            {contenido}
          </div>
        </div>
      )
    }
  }

  // CASO C: El usuario es Administrador logueado
  else if (adminActivo) {
    if (pantallaAdmin === 'operaciones-demo' && modoDemoActivo) {
      contenido = <CentroOperacionesDemo onNavegar={setPantallaAdmin} />
    } else if (pantallaAdmin === 'estado-ceremonia') {
      contenido = <EstadoCeremonia onVolver={() => setPantallaAdmin('bienvenida')} onNavegar={setPantallaAdmin} />
    } else if (pantallaAdmin === 'gestion-graduados') {
      contenido = (
        <GestionGraduados
          usuario={adminUser}
          ceremoniaActiva={ceremoniaActiva}
          onVolver={() => setPantallaAdmin('bienvenida')}
          onCerrarSesion={cerrarSesionAdmin}
          onNavegar={setPantallaAdmin}
        />
      )
    } else if (pantallaAdmin === 'convocatoria') {
      contenido = <GestionConvocatoria onNavegar={setPantallaAdmin} ceremoniaActiva={ceremoniaActiva} />
    } else if (pantallaAdmin === 'preparacion-ceremonia') {
      contenido = <PreparacionCeremonia onNavegar={setPantallaAdmin} ceremoniaActiva={ceremoniaActiva} />
    } else if (pantallaAdmin === 'asistente-operativo') {
      contenido = <AsistenteOperativoCeremonia onNavegar={setPantallaAdmin} />
    } else if (pantallaAdmin === 'control-ingreso' || adminUser?.rol === 'PORTERIA' || adminUser?.rol === 'SEGURIDAD') {
      contenido = (
        <ControlIngreso
          usuario={adminUser}
          onVolver={adminUser?.rol === 'PORTERIA' || adminUser?.rol === 'SEGURIDAD' ? null : () => setPantallaAdmin('bienvenida')}
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
          onNavegar={setPantallaAdmin}
          onCambioCeremonia={sincronizarEntornoCeremonia}
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
      if (adminUser?.rol === 'ADMINISTRATIVO') {
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
          onCambioCeremonia={sincronizarEntornoCeremonia}
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
        modoDemo={modoDemoActivo}
        enMantenimiento={enMantenimiento}
        accesoOculto={accesoOculto}
        onSeleccionarAdmin={() => modoDemoActivo ? manejarLoginAdminExitoso(ADMIN_DEMO) : setVistaLogin('admin')}
        onSeleccionarEgresado={() => modoDemoActivo ? manejarLoginGraduadoExitoso(EGRESADA_DEMO) : setVistaLogin('graduado')}
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
      modoDemo={modoDemoActivo}
    >
      {contenido}
    </EscritorioSIGIC>
  ) : contenido

  return (
    <>
      {contenidoDeEscritorio}
      {modoDemoActivo && <MarcaAguaDemo />}
      
      {/* Herramienta para alternar modo de operación y demostraciones */}
      <ControlExpositor
        modoDemoActivo={modoDemoActivo}
        onAlternarModoDemo={alternarModoDemo}
        onSimularAdmin={manejarLoginAdminExitoso}
        onSimularEgresado={manejarLoginGraduadoExitoso}
        onLimpiar={limpiarTodo}
        onIniciarDemo={iniciarDemostracionCompleta}
      />

      {/* Orquestador de Piloto Automático y Showcase en Vivo */}
      {demoAutomaticaActiva && (
        <GuiaDemostracionAutomatica
          onAplicarPaso={aplicarPasoDemo}
          onFinalizarDemo={finalizarDemostracionCompleta}
        />
      )}
    </>
  )
}

function EscritorioSIGIC({ children, pantallaActual, onNavegar, usuario, onCerrarSesion, modoDemo }) {
  // La versión instalada ya tiene ventana y controles nativos: no replicamos un navegador dentro de ella.
  const esAplicacionNativa = typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__)
  const [inicioAbierto, setInicioAbierto] = useState(false)
  const [hora, setHora] = useState(new Date())
  const [tema, setTema] = useState(() => localStorage.getItem('sigic_tema') || 'oscuro')
  const [fondoId, setFondoId] = useState(() => localStorage.getItem('sigic_fondo') || 'beltran')
  const [cuadriculaActiva, setCuadriculaActiva] = useState(() => localStorage.getItem('sigic_cuadricula') !== 'false')
  const [marcaAguaActiva, setMarcaAguaActiva] = useState(() => localStorage.getItem('sigic_marca_agua') !== 'false')
  const [mostrarModalFondo, setMostrarModalFondo] = useState(false)

  const cambiarFondo = (nuevoFondo) => {
    setFondoId(nuevoFondo)
    localStorage.setItem('sigic_fondo', nuevoFondo)
    window.dispatchEvent(new CustomEvent('sigic-fondo-cambiado', { detail: nuevoFondo }))
    if (nuevoFondo === 'alabaster') {
      setTema('claro')
      localStorage.setItem('sigic_tema', 'claro')
    } else {
      setTema('oscuro')
      localStorage.setItem('sigic_tema', 'oscuro')
    }
  }

  const cambiarCuadricula = (valor) => {
    setCuadriculaActiva(valor)
    localStorage.setItem('sigic_cuadricula', String(valor))
    window.dispatchEvent(new CustomEvent('sigic-cuadricula-cambiada', { detail: valor }))
  }

  const cambiarMarcaAgua = (valor) => {
    setMarcaAguaActiva(valor)
    localStorage.setItem('sigic_marca_agua', String(valor))
    window.dispatchEvent(new CustomEvent('sigic-marca-agua-cambiada', { detail: valor }))
  }

  useEffect(() => {
    const handleFondoEvento = (e) => {
      if (e.detail) setFondoId(e.detail)
    }
    const handleCuadriculaEvento = (e) => {
      if (typeof e.detail === 'boolean') setCuadriculaActiva(e.detail)
    }
    const handleMarcaAguaEvento = (e) => {
      if (typeof e.detail === 'boolean') setMarcaAguaActiva(e.detail)
    }
    window.addEventListener('sigic-fondo-cambiado', handleFondoEvento)
    window.addEventListener('sigic-cuadricula-cambiada', handleCuadriculaEvento)
    window.addEventListener('sigic-marca-agua-cambiada', handleMarcaAguaEvento)
    return () => {
      window.removeEventListener('sigic-fondo-cambiado', handleFondoEvento)
      window.removeEventListener('sigic-cuadricula-cambiada', handleCuadriculaEvento)
      window.removeEventListener('sigic-marca-agua-cambiada', handleMarcaAguaEvento)
    }
  }, [])

  const [menuContextual, setMenuContextual] = useState(null)
  const [mostrarEquipo, setMostrarEquipo] = useState(false)
  const [ceremoniaActiva, setCeremoniaActiva] = useState(null)

  const [ventanasAbiertas, setVentanasAbiertas] = useState(() => {
    return (!pantallaActual || pantallaActual === 'bienvenida') ? [] : [pantallaActual]
  })
  const [contenidoVentanas, setContenidoVentanas] = useState({})
  const [ventanasMinimizadas, setVentanasMinimizadas] = useState([])
  const [ventanasCerrandose, setVentanasCerrandose] = useState([])
  const [disenoVentanas, setDisenoVentanas] = useState({})
  const [arrastrandoVentana, setArrastrandoVentana] = useState(false)
  const [redimensionandoVentana, setRedimensionandoVentana] = useState(false)
  const [zonaAjuste, setZonaAjuste] = useState(null)
  const arrastreRef = useRef(null)
  const redimensionRef = useRef(null)
  const ventanaRef = useRef(null)
  const inicioRef = useRef(null)
  const inicioBotonRef = useRef(null)
  const pantallaAnteriorRef = useRef(null)
  const esAdministrativo = usuario?.rol === 'ADMINISTRATIVO'
  const aplicaciones = [
    { id: 'bienvenida', titulo: 'Inicio', icono: Home, color: 'bg-sky-500', escritorio: true },
    { id: 'gestion-ceremonias', titulo: 'Ceremonias', icono: CalendarPlus, color: 'bg-indigo-500', escritorio: true },
    { id: 'gestion-graduados', titulo: 'Graduados', icono: GraduationCap, color: 'bg-emerald-500', escritorio: true },
    { id: 'convocatoria', titulo: 'Convocatoria', icono: Send, color: 'bg-blue-500', escritorio: true },
    { id: 'preparacion-ceremonia', titulo: 'Preparación', icono: Armchair, color: 'bg-cyan-600', escritorio: true },
    { id: 'control-ingreso', titulo: 'Acreditación', icono: ScanLine, color: 'bg-amber-500', escritorio: true },
    { id: 'estado-ceremonia', titulo: 'En vivo', icono: Activity, color: 'bg-teal-500', escritorio: true },
    { id: 'panel-reportes', titulo: 'Reportes', icono: BarChart3, color: 'bg-purple-500', escritorio: true },
    { id: 'gestion-profesores', titulo: 'Docentes', icono: Award, color: 'bg-indigo-500', escritorio: false },
    { id: 'gestion-porteria', titulo: 'Seguridad', icono: Shield, color: 'bg-violet-500', escritorio: false },
    { id: 'ajustes', titulo: 'Ajustes', icono: Settings, color: 'bg-slate-500', escritorio: esAdministrativo },
    { id: 'seleccion-asientos', titulo: 'Anfiteatro', icono: MapPin, color: 'bg-orange-500', escritorio: false },
    ...(modoDemo ? [{ id: 'operaciones-demo', titulo: 'Operaciones', icono: ClipboardCheck, color: 'bg-slate-500', escritorio: false }] : []),
  ]
  const accesos = aplicaciones.filter(app => app.escritorio)
  const disenoInicial = (indice = 0) => {
    const anchoDefecto = typeof window !== 'undefined'
      ? Math.min(1040, Math.max(680, window.innerWidth - 180))
      : 980
    const altoDefecto = typeof window !== 'undefined'
      ? Math.min(660, Math.max(460, window.innerHeight - 150))
      : 620
    const baseX = 110 + (indice % 5) * 32
    const baseY = 24 + (indice % 5) * 26
    return {
      posicion: { x: Math.max(96, baseX), y: Math.max(10, baseY) },
      tamano: { ancho: anchoDefecto, alto: altoDefecto },
      maximizada: false,
      ajuste: null
    }
  }
  const obtenerDiseno = (id, indice = 0) => disenoVentanas[id] || disenoInicial(indice)
  const actualizarDiseno = (id, cambios) => setDisenoVentanas(ventanas => ({ ...ventanas, [id]: { ...disenoInicial(), ...ventanas[id], ...cambios } }))
  const enfocarVentana = (id) => {
    setVentanasAbiertas(ventanas => [...ventanas.filter(item => item !== id), id])
    setVentanasMinimizadas(ventanas => ventanas.filter(item => item !== id))
    onNavegar(id)
  }

  useEffect(() => {
    const intervalo = setInterval(() => setHora(new Date()), 1000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    let vigente = true
    const cargarCeremonia = async () => {
      try {
        const ceremonia = await obtenerCeremoniaActiva()
        if (vigente) setCeremoniaActiva(ceremonia)
      } catch {
        if (vigente) setCeremoniaActiva(null)
      }
    }
    cargarCeremonia()
    return () => { vigente = false }
  }, [pantallaActual])

  useEffect(() => {
    const actualizarEntorno = evento => setCeremoniaActiva(evento.detail || null)
    window.addEventListener('sigic-ceremonia-cambiada', actualizarEntorno)
    return () => window.removeEventListener('sigic-ceremonia-cambiada', actualizarEntorno)
  }, [])

  useEffect(() => {
    localStorage.setItem('sigic_tema', tema)
  }, [tema])

  useEffect(() => {
    const anterior = pantallaAnteriorRef.current
    pantallaAnteriorRef.current = pantallaActual
    if (!pantallaActual || pantallaActual === 'bienvenida') return
    setVentanasAbiertas(ventanas => ventanas.includes(pantallaActual) ? ventanas : [...ventanas, pantallaActual])
    setVentanasMinimizadas(ventanas => ventanas.filter(item => item !== pantallaActual))
    setVentanasCerrandose(ventanas => ventanas.filter(item => item !== pantallaActual))
    setDisenoVentanas(ventanas => {
      if (ventanas[pantallaActual]) return ventanas
      return { ...ventanas, [pantallaActual]: disenoInicial(ventanasAbiertas.length) }
    })
    if (esAplicacionNativa) actualizarDiseno(pantallaActual, { maximizada: true, ajuste: null })
  }, [pantallaActual, esAplicacionNativa])

  const ultimoChildrenRef = useRef(children)
  useEffect(() => {
    ultimoChildrenRef.current = children
  })

  useEffect(() => {
    if (!pantallaActual || pantallaActual === 'bienvenida') return
    // Conserva cada módulo montado al abrir otra ventana para no perder su estado.
    setContenidoVentanas(contenidos => ({ ...contenidos, [pantallaActual]: ultimoChildrenRef.current }))
  }, [pantallaActual])

  useEffect(() => {
    const abrirBusqueda = evento => {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
        evento.preventDefault()
        setInicioAbierto(abierto => !abierto)
      }
    }
    window.addEventListener('keydown', abrirBusqueda)
    return () => window.removeEventListener('keydown', abrirBusqueda)
  }, [])

  useEffect(() => {
    const mover = evento => {
      // 1. Redimensionamiento
      if (redimensionRef.current) {
        const { id, inicioX, inicioY, anchoInicial, altoInicial } = redimensionRef.current
        const deltaX = evento.clientX - inicioX
        const deltaY = evento.clientY - inicioY
        const nuevoAncho = Math.max(480, Math.min(window.innerWidth - 40, anchoInicial + deltaX))
        const nuevoAlto = Math.max(340, Math.min(window.innerHeight - 70, altoInicial + deltaY))
        actualizarDiseno(id, { tamano: { ancho: nuevoAncho, alto: nuevoAlto } })
        return
      }

      // 2. Arrastre de ventana
      if (arrastreRef.current) {
        const { id, inicioX, inicioY, posicionInicial } = arrastreRef.current
        const diseno = obtenerDiseno(id)
        const anchoVentana = diseno.tamano?.ancho || 980
        const minimoX = -(anchoVentana - 120)
        const maximoX = window.innerWidth - 120
        const minimoY = 0
        const maximoY = window.innerHeight - 80
        actualizarDiseno(id, {
          posicion: {
            x: Math.max(minimoX, Math.min(maximoX, posicionInicial.x + evento.clientX - inicioX)),
            y: Math.max(minimoY, Math.min(maximoY, posicionInicial.y + evento.clientY - inicioY)),
          }
        })
        if (evento.clientY <= 16) setZonaAjuste('maximizada')
        else if (evento.clientX <= 20) setZonaAjuste('izquierda')
        else if (evento.clientX >= window.innerWidth - 20) setZonaAjuste('derecha')
        else setZonaAjuste(null)
      }
    }

    const terminar = evento => {
      if (redimensionRef.current) {
        redimensionRef.current = null
        setRedimensionandoVentana(false)
      }
      if (arrastreRef.current) {
        const { id } = arrastreRef.current
        if (evento.clientY <= 16) {
          actualizarDiseno(id, { maximizada: true, ajuste: null })
        } else if (evento.clientX <= 20) {
          actualizarDiseno(id, { maximizada: false, ajuste: 'izquierda' })
        } else if (evento.clientX >= window.innerWidth - 20) {
          actualizarDiseno(id, { maximizada: false, ajuste: 'derecha' })
        }
        arrastreRef.current = null
        setArrastrandoVentana(false)
        setZonaAjuste(null)
      }
    }

    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', terminar)
    return () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', terminar)
    }
  }, [])

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
        inicioBotonRef.current?.focus()
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
    const app = aplicaciones.find(item => item.id === id)
    if (id === 'bienvenida') {
      setVentanasMinimizadas(ventanasAbiertas)
      onNavegar('bienvenida')
      setInicioAbierto(true)
      setMenuContextual(null)
      return
    }
    // En Tauri cada módulo se abre en su propia ventana del sistema operativo.
    // La ventana principal permanece disponible como escritorio de trabajo.
    if (esAplicacionNativa && id !== pantallaActual && id !== 'bienvenida') {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : undefined
      import('@tauri-apps/api/core')
        .then(({ invoke }) => invoke('abrir_modulo', { ruta: `?modulo=${encodeURIComponent(id)}`, titulo: app?.titulo || 'SiGIC', baseUrl }))
        .catch(() => onNavegar(id))
      setInicioAbierto(false)
      setMenuContextual(null)
      return
    }
    const yaEstabaAbierta = ventanasAbiertas.includes(id)
    setVentanasAbiertas(ventanas => [...ventanas.filter(item => item !== id), id])
    setVentanasCerrandose(ventanas => ventanas.filter(item => item !== id))
    setVentanasMinimizadas(ventanas => ventanas.filter(item => item !== id))
    onNavegar(id)
    if (!yaEstabaAbierta) {
      actualizarDiseno(id, { ...disenoInicial(ventanasAbiertas.length), maximizada: id === 'estado-ceremonia' })
    }
    setInicioAbierto(false)
    setMenuContextual(null)
  }

  const iniciarArrastre = (evento, id) => {
    if (evento.button !== 0) return
    const diseno = obtenerDiseno(id)
    let pos = diseno.posicion
    if (diseno.maximizada || diseno.ajuste) {
      const ancho = diseno.tamano?.ancho || 980
      const nuevaX = Math.max(96, Math.min(window.innerWidth - ancho - 20, evento.clientX - Math.round(ancho / 2)))
      const nuevaY = Math.max(10, evento.clientY - 16)
      pos = { x: nuevaX, y: nuevaY }
      actualizarDiseno(id, { maximizada: false, ajuste: null, posicion: pos })
    }
    arrastreRef.current = {
      id,
      inicioX: evento.clientX,
      inicioY: evento.clientY,
      posicionInicial: pos
    }
    setArrastrandoVentana(true)
  }

  const iniciarRedimension = (evento, id) => {
    evento.preventDefault()
    evento.stopPropagation()
    if (evento.button !== 0) return
    const diseno = obtenerDiseno(id)
    if (diseno.maximizada || diseno.ajuste) return
    if (id !== pantallaActual) enfocarVentana(id)
    redimensionRef.current = {
      id,
      inicioX: evento.clientX,
      inicioY: evento.clientY,
      anchoInicial: diseno.tamano?.ancho || 980,
      altoInicial: diseno.tamano?.alto || 620
    }
    setRedimensionandoVentana(true)
  }

  const cerrarVentana = (id) => {
    if (!ventanasAbiertas.includes(id) || ventanasCerrandose.includes(id)) return
    const restantes = ventanasAbiertas.filter(item => item !== id)
    const siguiente = restantes.at(-1) || 'bienvenida'

    if (id === pantallaActual) {
      pantallaAnteriorRef.current = siguiente
      onNavegar(siguiente)
    }

    setVentanasAbiertas(ventanas => ventanas.filter(item => item !== id))
    setVentanasMinimizadas(ventanas => ventanas.filter(item => item !== id))
    setVentanasCerrandose(ventanas => [...ventanas, id])

    window.setTimeout(() => {
      setVentanasCerrandose(ventanas => ventanas.filter(item => item !== id))
      setDisenoVentanas(ventanas => { const { [id]: cerrada, ...restantesDisenos } = ventanas; return restantesDisenos })
      setContenidoVentanas(contenidos => { const { [id]: cerrada, ...restantesContenidos } = contenidos; return restantesContenidos })
    }, 180)
  }

  const alternarMinimizada = (id) => {
    const estaMinimizada = ventanasMinimizadas.includes(id)
    if (estaMinimizada) {
      setVentanasMinimizadas(ventanas => ventanas.filter(item => item !== id))
      enfocarVentana(id)
      return
    }
    setVentanasMinimizadas(ventanas => [...ventanas, id])
    const siguiente = [...ventanasAbiertas].reverse().find(item => item !== id && !ventanasMinimizadas.includes(item))
    if (siguiente) onNavegar(siguiente)
    else onNavegar('bienvenida')
  }

  const manejarClickTarea = (id) => {
    const estaMinimizada = ventanasMinimizadas.includes(id)
    const estaActiva = id === pantallaActual && !estaMinimizada
    if (estaActiva) {
      alternarMinimizada(id)
      return
    }
    if (estaMinimizada) {
      setVentanasMinimizadas(ventanas => ventanas.filter(item => item !== id))
    }
    enfocarVentana(id)
  }

  const alternarMaximizada = (id) => {
    const diseno = obtenerDiseno(id)
    if (id !== pantallaActual) enfocarVentana(id)
    actualizarDiseno(id, { maximizada: !diseno.maximizada, ajuste: null })
  }

  const alternarMostrarEscritorio = () => {
    const ventanasVisibles = ventanasAbiertas.filter(id => !ventanasMinimizadas.includes(id))
    if (ventanasVisibles.length > 0) {
      setVentanasMinimizadas([...ventanasAbiertas])
      onNavegar('bienvenida')
    } else {
      setVentanasMinimizadas([])
      const ultima = ventanasAbiertas[ventanasAbiertas.length - 1]
      if (ultima) onNavegar(ultima)
    }
  }

  const tipoDeVentana = (id) => esAplicacionNativa
    ? 'sigic-window-native'
    : ['control-ingreso', 'panel-reportes', 'estado-ceremonia'].includes(id) ? 'sigic-window-browser' : ['gestion-graduados', 'convocatoria', 'preparacion-ceremonia', 'gestion-profesores', 'gestion-ceremonias'].includes(id) ? 'sigic-window-explorer' : id === 'gestion-porteria' ? 'sigic-window-secure' : 'sigic-window-default'
  const cambiarTema = () => setTema(actual => actual === 'oscuro' ? 'claro' : 'oscuro')
  const abrirMenuContextual = (evento) => {
    evento.preventDefault()
    setInicioAbierto(false)
    setMenuContextual({ x: Math.min(evento.clientX, window.innerWidth - 230), y: Math.min(evento.clientY, window.innerHeight - 245) })
  }

  return (
    <main className={`sigic-os-shell ${esAplicacionNativa ? 'sigic-native-host' : ''} sigic-theme-${tema} sigic-wallpaper-${fondoId}`} onContextMenu={abrirMenuContextual} onClick={() => menuContextual && setMenuContextual(null)}>
      {cuadriculaActiva && <div className="sigic-os-grid" />}
      {marcaAguaActiva && (
        <div className="sigic-watermark" aria-hidden="true">
          <img src="/logo-oficial.png" alt="" />
          <span>SIGIC</span>
          <small>Sistema Integral de Gestión Institucional</small>
        </div>
      )}
      <header className="sigic-os-topbar">
        <div className="flex items-center gap-3">
          <img src="/logo-oficial.png" alt="Logo de SIGIC" className="sigic-real-logo" />
          <div><p className="sigic-brand">SIGIC</p><p className="sigic-subbrand">Sistema Integral de Gestión Institucional</p></div>
        </div>
        <div className="sigic-active-ceremony" title={ceremoniaActiva ? `Entorno activo: ${ceremoniaActiva.nombre}` : 'No hay una ceremonia activa'}><Calendar size={13} /><div><span>Entorno activo</span><strong>{ceremoniaActiva?.nombre || 'Sin ceremonia activa'}</strong></div>{ceremoniaActiva?.fecha && <small>{new Date(`${ceremoniaActiva.fecha}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</small>}</div>
        <div className="hidden items-center gap-5 text-white/60 md:flex"><span className="text-[10px] uppercase tracking-[.24em]">Sesión segura</span><div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" /></div>
      </header>
      <section className="sigic-os-workspace">
        <div className="sigic-os-shortcuts">
          {accesos.map(({ id, titulo, icono: Icono, color }) => <button key={id} onClick={() => abrirVentana(id)} className="sigic-desktop-icon"><span className={`${color} sigic-desktop-icon-art`}><Icono size={22} /></span><span>{titulo}</span></button>)}
        </div>
        {ventanasAbiertas.filter(id => !ventanasMinimizadas.includes(id)).map((id, indice) => {
          const app = aplicaciones.find(item => item.id === id)
          const activa = id === pantallaActual
          const diseno = obtenerDiseno(id, indice)
          const maximizada = diseno.maximizada
          const ajuste = diseno.ajuste
          const contenidoVentana = activa ? children : contenidoVentanas[id]
          const posicion = diseno.posicion
          const tamano = diseno.tamano || { ancho: 980, alto: 620 }
          const titulo = app?.titulo || 'SIGIC'

          const estiloVentana = maximizada || ajuste
            ? { zIndex: activa ? 60 : 20 + indice }
            : {
                transform: `translate3d(${posicion.x}px, ${posicion.y}px, 0)`,
                width: `${tamano.ancho}px`,
                height: `${tamano.alto}px`,
                zIndex: activa ? 60 : 20 + indice
              }

          return (
            <div
              key={id}
              ref={activa ? ventanaRef : undefined}
              onPointerDown={() => !activa && enfocarVentana(id)}
              style={estiloVentana}
              className={`sigic-window ${tipoDeVentana(id)} ${activa ? 'sigic-window-active' : 'sigic-window-inactive'} ${maximizada ? 'sigic-window-maximized' : ''} ${ajuste ? `sigic-window-snapped sigic-window-snapped-${ajuste}` : ''} ${activa && arrastrandoVentana ? 'sigic-window-dragging' : ''} ${activa && redimensionandoVentana ? 'sigic-window-resizing' : ''} ${ventanasCerrandose.includes(id) ? 'sigic-window-closing' : ''}`}
            >
              <div
                className="sigic-window-bar"
                onDoubleClick={() => alternarMaximizada(id)}
              >
                <div
                  className="sigic-window-heading"
                  onPointerDown={evento => {
                    if (!activa) enfocarVentana(id)
                    iniciarArrastre(evento, id)
                  }}
                >
                  <div className="sigic-window-app-icon">
                    <span className="sigic-window-app-dot" />
                  </div>
                  <span className="sigic-window-title">{titulo}</span>
                </div>
                <div
                  className="sigic-window-controls"
                  onPointerDown={evento => evento.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={evento => {
                      evento.stopPropagation()
                      alternarMinimizada(id)
                    }}
                    aria-label="Minimizar ventana"
                    title="Minimizar"
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={evento => {
                      evento.stopPropagation()
                      alternarMaximizada(id)
                    }}
                    aria-label={maximizada ? 'Restaurar ventana' : 'Maximizar ventana'}
                    title={maximizada ? 'Restaurar' : 'Maximizar'}
                  >
                    {maximizada ? <Copy size={12} /> : <Square size={12} />}
                  </button>
                  <button
                    type="button"
                    className="sigic-btn-close"
                    onClick={evento => {
                      evento.stopPropagation()
                      cerrarVentana(id)
                    }}
                    aria-label="Cerrar ventana"
                    title="Cerrar"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              {!esAplicacionNativa && (
                <div className="sigic-explorer-toolbar">
                  <button onClick={() => window.history.back()} aria-label="Atrás" title="Atrás">
                    <ChevronRight size={14} className="rotate-180" />
                  </button>
                  <button onClick={() => window.history.forward()} aria-label="Adelante" title="Adelante">
                    <ChevronRight size={14} />
                  </button>
                  <button onClick={() => abrirVentana('bienvenida')} aria-label="Inicio" title="Inicio">
                    <Home size={13} />
                  </button>
                  <div className="sigic-explorer-address">
                    <span>SiGIC</span><b>›</b><span>{titulo}</span>
                  </div>
                  <button onClick={() => window.location.reload()} aria-label="Actualizar" title="Actualizar">
                    <RefreshCw size={13} />
                  </button>
                </div>
              )}
              <div className="sigic-window-body">{contenidoVentana}</div>
              {!maximizada && !ajuste && (
                <div
                  className="sigic-window-resize-handle"
                  onPointerDown={evento => iniciarRedimension(evento, id)}
                  title="Redimensionar tamaño"
                />
              )}
            </div>
          )
        })}
        {zonaAjuste && <div className={`sigic-snap-preview sigic-snap-preview-${zonaAjuste}`} aria-hidden="true" />}
        <aside className="sigic-session-card"><div className="sigic-session-avatar">{(usuario?.nombre || 'A').slice(0, 1).toUpperCase()}</div><div><strong>{usuario?.nombre || 'Administrador'}</strong><span>{normalizarCorreoInstitucional(usuario?.correo) || 'Sesión administrativa'}</span></div><span className="sigic-session-state">En línea</span></aside>
      </section>
      {inicioAbierto && (
        <MenuInicio
          ref={inicioRef}
          aplicaciones={aplicaciones}
          usuario={usuario}
          ceremonia={ceremoniaActiva}
          ventanas={ventanasAbiertas}
          onAbrir={abrirVentana}
          onCerrar={() => { setInicioAbierto(false); inicioBotonRef.current?.focus() }}
          onCerrarSesion={onCerrarSesion}
        />
      )}
      <footer className="sigic-taskbar">
        <button ref={inicioBotonRef} onClick={() => setInicioAbierto(value => !value)} className={`sigic-start-button ${inicioAbierto ? 'is-active' : ''}`} aria-label="Abrir menú principal" aria-expanded={inicioAbierto} aria-controls="sigic-menu-inicio" title="Menú principal · Ctrl K"><img src="/logo-oficial.png" alt="" className="sigic-task-logo" /></button>
        <div className="sigic-task-divider" />
        <button onClick={() => abrirVentana('bienvenida')} className="sigic-task-app" title="Escritorio SIGIC"><Home size={15} /><span>Escritorio SIGIC</span></button>
        <div className="sigic-open-tasks">{ventanasAbiertas.map(id => { const app = aplicaciones.find(item => item.id === id); const IconoTarea = app?.icono || LayoutGrid; return <button key={id} onClick={() => manejarClickTarea(id)} className={`sigic-open-task ${id === pantallaActual && !ventanasMinimizadas.includes(id) ? 'is-current' : ''} ${ventanasMinimizadas.includes(id) ? 'is-minimized' : ''}`} title={`${app?.titulo || 'SIGIC'}${ventanasMinimizadas.includes(id) ? ' (minimizada)' : ''}`}><IconoTarea size={13} />{app?.titulo || 'SIGIC'}</button> })}</div>
        <div className="ml-auto flex items-center gap-3 text-white/65">
          <button onClick={() => setMostrarModalFondo(true)} className="sigic-theme-button" title="Personalizar fondo de pantalla y estilos" aria-label="Personalizar fondo"><Palette size={15} /></button>
          <button onClick={cambiarTema} className="sigic-theme-button" aria-label={`Cambiar a modo ${tema === 'oscuro' ? 'claro' : 'oscuro'}`}>{tema === 'oscuro' ? <Sun size={15} /> : <Moon size={15} />}</button>
          <Bell size={15} />
          <Wifi size={15} />
          <Volume2 size={15} />
          <div className="sigic-clock"><strong>{hora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</strong><span>{hora.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span></div>
          <ChevronUp size={15} />
        </div>
        <button
          type="button"
          onClick={alternarMostrarEscritorio}
          className="sigic-show-desktop-button"
          title="Mostrar escritorio"
          aria-label="Mostrar escritorio"
        />
      </footer>
      {menuContextual && (
        <div className="sigic-context-menu" style={{ left: menuContextual.x, top: menuContextual.y }} onClick={evento => evento.stopPropagation()}>
          <p className="sigic-context-title"><MousePointer2 size={13} /> Acciones del escritorio</p>
          <button onClick={() => abrirVentana('bienvenida')}><LayoutGrid size={14} /> Abrir escritorio SIGIC</button>
          <button onClick={() => { setMenuContextual(null); setMostrarModalFondo(true) }}><Palette size={14} /> Cambiar fondo de pantalla...</button>
          <button onClick={cambiarTema}>{tema === 'oscuro' ? <Sun size={14} /> : <Moon size={14} />} Cambiar a modo {tema === 'oscuro' ? 'claro' : 'oscuro'}</button>
          <button onClick={() => setInicioAbierto(true)}><Search size={14} /> Buscar una aplicación</button>
          <button onClick={() => setMostrarEquipo(true)}><Users size={14} /> Conocer al equipo</button>
          <div className="sigic-context-separator" />
          <button onClick={() => window.location.reload()}><RefreshCw size={14} /> Actualizar escritorio</button>
        </div>
      )}
      {mostrarEquipo && <div className="sigic-team-overlay" onClick={() => setMostrarEquipo(false)}><section className="sigic-team-card" onClick={evento => evento.stopPropagation()}><button className="sigic-team-close" onClick={() => setMostrarEquipo(false)} aria-label="Cerrar"><X size={16} /></button><img src="/logo-oficial.png" alt="Logo de SIGIC" className="sigic-team-logo" /><p className="sigic-team-kicker">Easter egg de SIGIC</p><h2>El equipo detrás del sistema</h2><p className="sigic-team-copy">Desarrollado en el marco de las Prácticas Profesionalizantes del Instituto Tecnológico Beltrán.</p><div className="sigic-team-grid">{['Cancelo Julian', 'Alfonso Alan Alexis', 'Contreras V. Sol', 'Frassia Matias', 'Santillan Luis G.'].map((nombre, indice) => <div key={nombre} className="sigic-team-person"><span>{String(indice + 1).padStart(2, '0')}</span><strong>{nombre}</strong></div>)}</div><a className="sigic-team-contact" href="mailto:soporte@ibeltran.com.ar">soporte@ibeltran.com.ar</a><small>Proyecto SIGIC · 2026</small></section></div>}
      {mostrarModalFondo && (
        <ModalPersonalizarFondo
          fondoActual={fondoId}
          alCambiarFondo={cambiarFondo}
          cuadriculaActiva={cuadriculaActiva}
          alCambiarCuadricula={cambiarCuadricula}
          marcaAguaActiva={marcaAguaActiva}
          alCambiarMarcaAgua={cambiarMarcaAgua}
          onCerrar={() => setMostrarModalFondo(false)}
        />
      )}
    </main>
  )
}

// ─── COMPONENTE NAV DOCKER ADMINISTRATIVO PERSISTENTE ───
function AdminDock({ pantallaActual, onNavegar, posicion, setPosicion, usuario }) {
  const esSoporte = usuario?.rol === 'ADMINISTRATIVO'

  const items = [
    { id: 'bienvenida', titulo: 'Inicio', icono: Home },
    { id: 'gestion-ceremonias', titulo: 'Inicializar', icono: Sparkles },
    { id: 'gestion-graduados', titulo: 'Graduados', icono: Users },
    { id: 'convocatoria', titulo: 'Convocatoria', icono: Send },
    { id: 'preparacion-ceremonia', titulo: 'Preparación', icono: ListChecks },
    { id: 'control-ingreso', titulo: 'Acreditación', icono: ScanLine },
    { id: 'estado-ceremonia', titulo: 'En vivo', icono: Activity },
    { id: 'panel-reportes', titulo: 'Reportes', icono: BarChart3 },
    ...(esSoporte ? [
      { id: 'gestion-porteria', titulo: 'Seguridad', icono: Shield },
      { id: 'centro-control', titulo: 'Control', icono: Server }
    ] : [
      { id: 'ajustes', titulo: 'Ajustes', icono: Settings }
    ])
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
