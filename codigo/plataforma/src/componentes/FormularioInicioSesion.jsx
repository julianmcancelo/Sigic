import { useEffect, useState } from 'react'
import { iniciarSesionAdmin, solicitarRestablecimientoContrasena } from '../servicios/api'
import { validarFormularioLogin } from '../utilidades/validar-formulario-login'
import { CampoFormulario } from './CampoFormulario'
import { AlertTriangle, ArrowRight, BookOpen, Check, GraduationCap, LifeBuoy, LockKeyhole, Mail, ArrowLeft, Shield } from 'lucide-react'

const formularioInicial = { correo: '', clave: '' }

export function FormularioInicioSesion({ onInicioSesionExitoso, onIrAEgresado, onIrAManual }) {
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

      onInicioSesionExitoso({ 
        nombre: respuesta.usuario.nombre, 
        correo: respuesta.usuario.email,
        id: respuesta.usuario.id,
        rol: respuesta.usuario.rol
      })
    } catch (error) {
      setErrores({ clave: error.message })
      setMensajeEstado('No pudimos validar tus credenciales.')
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

  function handleIrAEgresado() {
    if (onIrAEgresado) {
      onIrAEgresado()
    } else {
      window.dispatchEvent(new CustomEvent('ir-a-login-egresado'))
    }
  }

  function handleIrAManual(e) {
    if (onIrAManual) {
      e.preventDefault()
      onIrAManual()
    }
  }

  if (modalVisible) {
    return (
      <div className="space-y-6 animate-reveal-up text-left">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer group"
          onClick={() => setModalVisible(false)}
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver al acceso</span>
        </button>

        <header className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/70">
            <Shield size={11} /> Recuperación Segura
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Restablecer clave</h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Ingresá tu correo institucional y te enviaremos las instrucciones de restablecimiento.
          </p>
        </header>

        {recuperacionEnviada ? (
          <div className="space-y-4 pt-1">
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4 text-xs font-medium leading-relaxed text-emerald-900 flex items-start gap-3">
              <Check className="text-emerald-600 shrink-0 mt-0.5" size={17} />
              <span>Si la cuenta existe en el sistema, recibirás un enlace de acceso en tu casilla en los próximos minutos.</span>
            </div>
            <button
              className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-3 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
              onClick={() => setModalVisible(false)}
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <form onSubmit={solicitarRecuperacion} className="space-y-4 pt-1">
            <CampoFormulario
              etiqueta="Correo institucional"
              tipo="email"
              nombre="correoRecuperacion"
              valor={correoRecuperacion}
              placeholder="nombre@ibeltran.com.ar"
              onChange={evento => setCorreoRecuperacion(evento.target.value)}
              icono={Mail}
              mostrarEtiqueta
            />
            {errorRecuperacion ? (
              <p className="rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-xs text-rose-700 font-semibold">
                {errorRecuperacion}
              </p>
            ) : null}
            <button
              disabled={recuperando}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {recuperando ? 'Enviando instrucciones...' : 'Enviar enlace seguro'}
            </button>
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-reveal-up text-left">
      <header className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/70">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          Panel Administrativo
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Iniciar Sesión
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Ingresá con tus credenciales de organizador o directivo.
        </p>
      </header>

      <form className="space-y-4" onSubmit={manejarEnvio}>
        <CampoFormulario
          etiqueta="Correo electrónico"
          tipo="email"
          nombre="correo"
          valor={formulario.correo}
          placeholder="ejemplo@ibeltran.com.ar"
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
          placeholder="••••••••••••"
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

        <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={recordarCorreo}
              onChange={evento => setRecordarCorreo(evento.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
            />
            <span>Recordar usuario</span>
          </label>

          {bloqMayus ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <AlertTriangle size={12} /> Mayúsculas activas
            </span>
          ) : (
            <button
              type="button"
              className="font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              onClick={() => {
                setCorreoRecuperacion(formulario.correo)
                setErrorRecuperacion('')
                setRecuperacionEnviada(false)
                setModalVisible(true)
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </div>

        <button
          className="w-full rounded-xl bg-slate-950 hover:bg-blue-600 active:scale-[0.99] px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-slate-900/10 hover:shadow-lg hover:shadow-blue-600/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer mt-2"
          type="submit"
          disabled={cargando || bloqueoSegundos > 0}
        >
          {verificado ? (
            <>
              <Check size={18} className="text-emerald-400" />
              <span>Acceso verificado</span>
            </>
          ) : bloqueoSegundos > 0 ? (
            `Reintentar en ${Math.floor(bloqueoSegundos / 60)}:${String(bloqueoSegundos % 60).padStart(2, '0')}`
          ) : cargando ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verificando...</span>
            </>
          ) : (
            <>
              <span>Ingresar al Sistema</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Mensaje de estado */}
        {mensajeEstado ? (
          <p
            className={`rounded-xl p-3 text-xs font-semibold ${
              verificado
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {mensajeEstado}
          </p>
        ) : null}
      </form>

      {/* ══ APARTADO DE ACCESO DISCRETO PARA GRADUADOS ══ */}
      <div className="pt-3 space-y-4 border-t border-slate-100">
        
        <button
          type="button"
          onClick={handleIrAEgresado}
          className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50/90 to-blue-50/40 hover:border-blue-300 hover:bg-blue-50/60 hover:shadow-sm transition-all duration-200 cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center group-hover:scale-105 shadow-xs transition-transform shrink-0">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                ¿Sos egresado?
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Consultá tu estado o descargá tu pase digital QR
              </p>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </button>

        <nav className="flex items-center justify-center gap-6 text-[11px] font-semibold text-slate-400" aria-label="Ayuda">
          <a 
            href="/manual" 
            onClick={handleIrAManual} 
            className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
          >
            <BookOpen size={13} />
            <span>Manual de Ayuda</span>
          </a>
          <span className="text-slate-300">·</span>
          <a href="mailto:soporte@ibeltran.com.ar" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
            <LifeBuoy size={13} />
            <span>Soporte Técnico</span>
          </a>
        </nav>

      </div>
    </div>
  )
}
