import { useState } from 'react'
import { iniciarSesionAdmin } from '../servicios/api'
import { validarFormularioLogin } from '../utilidades/validar-formulario-login'
import { CampoFormulario } from './CampoFormulario'

const formularioInicial = { correo: '', clave: '' }

export function FormularioInicioSesion({ onInicioSesionExitoso }) {
  const [formulario, setFormulario] = useState(formularioInicial)
  const [errores, setErrores] = useState({})
  const [mensajeEstado, setMensajeEstado] = useState('')
  const [modalVisible, setModalVisible] = useState(false)

  const [cargando, setCargando] = useState(false)

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
      setMensajeEstado('Revisa los campos marcados antes de continuar.')
      return
    }

    setCargando(true)
    setMensajeEstado('')

    try {
      const respuesta = await iniciarSesionAdmin(formulario.correo, formulario.clave)
      
      setErrores({})
      setMensajeEstado('Inicio de sesion correcto.')

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
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <div className="px-8 py-9">
        {/* Título */}
        <h1 className="mb-1 text-center text-[1.45rem] font-bold text-[#2A3448]">
          Inicio de sesion
        </h1>
        <p className="mb-5 text-center text-xs text-[#90A4AE]">
          Acceso exclusivo para organizadores del evento
        </p>

        <form className="space-y-3" onSubmit={manejarEnvio}>
          <CampoFormulario
            etiqueta="Correo electronico"
            tipo="email"
            nombre="correo"
            valor={formulario.correo}
            placeholder="ejemplo@correo.com"
            mensajeError={errores.correo}
            onChange={manejarCambio}
          />

          <CampoFormulario
            etiqueta="Contrasena"
            tipo="password"
            nombre="clave"
            valor={formulario.clave}
            placeholder="Ingresa tu contrasena"
            mensajeError={errores.clave}
            onChange={manejarCambio}
          />

          <button
            className="mt-1 w-full rounded-lg bg-[#29ABE2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0288D1] active:bg-[#0277BD] disabled:bg-slate-300 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            type="submit"
            disabled={cargando}
          >
            {cargando ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verificando...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>

          {/* Mensaje de estado */}
          {mensajeEstado ? (
            <p
              className={`rounded-xl px-3 py-2 text-xs ${
                mensajeEstado.includes('correcto')
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {mensajeEstado}
            </p>
          ) : null}
        </form>

        {/* Links inferiores */}
        <div className="mt-8 space-y-4 text-center">
          <p className="text-sm text-[#546E7A]">
            <button
              type="button"
              className="font-medium text-[#1565C0] underline-offset-2 hover:underline"
              onClick={() => setModalVisible(true)}
            >
              Olvidé mi contraseña
            </button>
          </p>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest bg-white px-2 text-slate-300">O acceder como</div>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('ir-a-login-egresado'))}
            className="w-full rounded-xl border-2 border-slate-100 py-3 text-xs font-black uppercase tracking-widest text-slate-500 transition-all hover:border-[#29ABE2] hover:text-[#29ABE2] active:scale-95"
          >
            Soy Graduado
          </button>
        </div>
      </div>

      {/* Modal de credenciales demo */}
      {modalVisible ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={() => setModalVisible(false)}
        >
          <div
            className="w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#2A3448] px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-[#29ABE2]">
                Cuenta de prueba
              </p>
            </div>

            <div className="space-y-3 px-5 py-4">
              <p className="text-xs text-[#546E7A]">
                Usa estas credenciales para probar el sistema sin una cuenta real.
              </p>

              <div className="rounded-lg border border-[#B3E5FC] bg-[#EEF6FC] px-4 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#546E7A]">
                  Correo
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-[#1565C0]">
                  Tu correo registrado
                </p>
              </div>

              <div className="rounded-lg border border-[#B3E5FC] bg-[#EEF6FC] px-4 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#546E7A]">
                  Contraseña
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-[#1565C0]">
                  Tu clave personal
                </p>
              </div>

              <button
                className="w-full rounded-lg bg-[#29ABE2] py-2 text-sm font-semibold text-white transition hover:bg-[#0288D1]"
                onClick={() => setModalVisible(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
