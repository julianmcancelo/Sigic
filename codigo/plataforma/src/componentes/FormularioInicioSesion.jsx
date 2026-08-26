import { useEffect, useState } from 'react'
import { iniciarSesionAdmin, solicitarRestablecimientoContrasena } from '../servicios/api'
import { validarFormularioLogin } from '../utilidades/validar-formulario-login'
import { CampoFormulario } from './CampoFormulario'
import { AlertTriangle, ArrowRight, BookOpen, Check, GraduationCap, LifeBuoy, LockKeyhole, Mail } from 'lucide-react'

const formularioInicial = { correo: '', clave: '' }

export function FormularioInicioSesion({ onInicioSesionExitoso }) {
  const [formulario, setFormulario] = useState(() => ({ ...formularioInicial, correo: typeof window !== 'undefined' ? localStorage.getItem('sigic_correo_recordado') || '' : '' }))
  const [recordarCorreo, setRecordarCorreo] = useState(() => typeof window !== 'undefined' && Boolean(localStorage.getItem('sigic_correo_recordado')))
  const [errores, setErrores] = useState({})
  const [mensajeEstado, setMensajeEstado] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [correoRecuperacion, setCorreoRecuperacion] = useState('')
  const [recuperando, setRecuperando] = useState(false)
  const [recuperacionEnviada, setRecuperacionEnviada] = useState(false)
  const [errorRecuperacion, setErrorRecuperacion] = useState('')
  const [bloqMayus, setBloqMayus] = useState(false)
  const [bloqueoSegundos, setBloqueoSegundos] = useState(0)
  const [verificado, setVerificado] = useState(false)

  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (bloqueoSegundos <= 0) return undefined
    const temporizador = window.setInterval(() => setBloqueoSegundos(valor => Math.max(0, valor - 1)), 1000)
    return () => window.clearInterval(temporizador)
  }, [bloqueoSegundos])

  function manejarCambio(evento) {
    const { name, value } = evento.target
    setFormulario((prev) => ({ ...prev, [name]: value }))
    setErrores((prev) => ({ ...prev, [name]: '' }))
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()

    const nuevosErrores = validarFormularioLogin(formulario)
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      setMensajeEstado('Revisá los campos marcados antes de continuar.')
      return
    }

    setCargando(true)
    setVerificado(false)
    setMensajeEstado('')

    try {
      const respuesta = await iniciarSesionAdmin(formulario.correo, formulario.clave)
      
      setErrores({})
      setVerificado(true)
      setMensajeEstado('Sesión verificada. Abriendo tu panel…')
      if (recordarCorreo) localStorage.setItem('sigic_correo_recordado', formulario.correo.trim().toLowerCase())
      else localStorage.removeItem('sigic_correo_recordado')
      await new Promise(resolve => window.setTimeout(resolve, 450))

      // La respuesta del backend devuelve el objeto { ok: true, usuario: { id, nombre, email, rol } }
      onInicioSesionExitoso({ 
        nombre: respuesta.usuario.nombre, 
        correo: respuesta.usuario.email,
        id: respuesta.usuario.id,
        rol: respuesta.usuario.rol
      })
    } catch (error) {
      setErrores({ clave: error.message })
      setMensajeEstado('No pudimos validar tus datos.')
      if (error.segundosRestantes) setBloqueoSegundos(error.segundosRestantes)
    } finally {
      setCargando(false)
    }
  }

  async function solicitarRecuperacion(evento) {
    evento.preventDefault()
    setRecuperando(true)
    setErrorRecuperacion('')
    try {
      await solicitarRestablecimientoContrasena(correoRecuperacion)
      setRecuperacionEnviada(true)
    } catch (error) {
      setErrorRecuperacion(error.message || 'No pudimos enviar el enlace.')
    } finally {
      setRecuperando(false)
    }
  }

  if (modalVisible) {
    return (
      <div className="sigic-login-minimal sigic-login-recovery">
        <button type="button" className="sigic-back-link" onClick={() => setModalVisible(false)}>← Volver al acceso</button>
        <header className="sigic-login-title">
          <span>Recuperación segura</span>
          <h1>Nueva contraseña</h1>
          <p>Te enviaremos un enlace válido por 30 minutos.</p>
        </header>
        {recuperacionEnviada ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs leading-relaxed text-emerald-800">Si el correo corresponde a una cuenta activa, recibirás el enlace. Revisá también correo no deseado.</p>
            <button className="w-full rounded-lg bg-[#29ABE2] py-2.5 text-sm font-semibold text-white" onClick={() => setModalVisible(false)}>Volver al acceso</button>
          </div>
        ) : (
          <form onSubmit={solicitarRecuperacion}>
            <CampoFormulario etiqueta="Correo electrónico" tipo="email" nombre="correoRecuperacion" valor={correoRecuperacion} placeholder="nombre@institucion.edu.ar" onChange={evento => setCorreoRecuperacion(evento.target.value)} icono={Mail} mostrarEtiqueta />
            {errorRecuperacion ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorRecuperacion}</p> : null}
            <button disabled={recuperando} className="w-full rounded-lg bg-[#29ABE2] py-3 text-sm font-semibold text-white disabled:bg-slate-300">{recuperando ? 'Enviando...' : 'Enviar enlace seguro'}</button>
          </form>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="sigic-login-minimal sigic-login-admin">
        <header className="sigic-login-title">
          <span>Panel administrativo</span>
          <h1>Bienvenido</h1>
          <p>Ingresá con tus credenciales institucionales.</p>
        </header>

        <form className="space-y-3" onSubmit={manejarEnvio}>
          <CampoFormulario
            etiqueta="Correo electrónico"
            tipo="email"
            nombre="correo"
            valor={formulario.correo}
            placeholder="ejemplo@correo.com"
            mensajeError={errores.correo}
            onChange={manejarCambio}
            icono={Mail}
            mostrarEtiqueta
            reservarError
            autoComplete="username"
          />

          <CampoFormulario
            etiqueta="Contraseña"
            tipo="password"
            nombre="clave"
            valor={formulario.clave}
            placeholder="Ingresá tu contraseña"
            mensajeError={errores.clave}
            onChange={manejarCambio}
            icono={LockKeyhole}
            mostrarEtiqueta
            reservarError
            autoComplete="current-password"
            onKeyDown={evento => setBloqMayus(evento.getModifierState('CapsLock'))}
            onKeyUp={evento => setBloqMayus(evento.getModifierState('CapsLock'))}
            onBlur={() => setBloqMayus(false)}
          />

          <div className="sigic-login-options">
            <label><input type="checkbox" checked={recordarCorreo} onChange={evento => setRecordarCorreo(evento.target.checked)} /> Recordar correo</label>
            {bloqMayus ? <span><AlertTriangle size={12} /> Bloq Mayús activo</span> : <span aria-hidden="true" />}
          </div>

          <button
            className="mt-1 w-full rounded-lg bg-[#29ABE2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0288D1] active:bg-[#0277BD] disabled:bg-slate-300 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            type="submit"
            disabled={cargando || bloqueoSegundos > 0}
          >
            {verificado ? <><Check size={17} /> Acceso verificado</> : bloqueoSegundos > 0 ? (
              `Intentá nuevamente en ${Math.floor(bloqueoSegundos / 60)}:${String(bloqueoSegundos % 60).padStart(2, '0')}`
            ) : cargando ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verificando...
              </>
            ) : (
              <>Ingresar <ArrowRight size={17} /></>
            )}
          </button>

          {/* Mensaje de estado */}
          {mensajeEstado ? (
            <p
              className={`rounded-xl px-3 py-2 text-xs ${
                verificado
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {mensajeEstado}
            </p>
          ) : null}
        </form>

        <div className="sigic-login-help">
          <p className="text-sm text-[#546E7A]">
            <button
              type="button"
              className="font-medium text-[#1565C0] underline-offset-2 hover:underline"
              onClick={() => {
                setCorreoRecuperacion(formulario.correo)
                setErrorRecuperacion('')
                setRecuperacionEnviada(false)
                setModalVisible(true)
              }}
            >
              Olvidé mi contraseña
            </button>
          </p>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('ir-a-login-egresado'))}
            className="sigic-graduate-access"
          >
            <GraduationCap size={17} />
            <span><strong>Acceso para graduados</strong><small>Ingresar al portal</small></span>
            <ArrowRight size={16} />
          </button>

          <nav className="sigic-login-links" aria-label="Ayuda">
            <a href="/manual"><BookOpen size={13} /> Manual</a>
            <a href="mailto:soporte@ibeltran.com.ar"><LifeBuoy size={13} /> Soporte</a>
          </nav>

        </div>
      </div>

    </>
  )
}
