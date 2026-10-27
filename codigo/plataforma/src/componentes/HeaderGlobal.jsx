import { useState, useEffect } from 'react'
import { LogOut, ArrowLeft, User, LayoutGrid, Palette, ArrowUpCircle, QrCode, X, Copy, CheckCheck, RefreshCw, KeyRound, Globe, Sparkles } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { obtenerUsuarioToken, obtenerTokenSesion } from '../lib/api'
import { ModalActualizarSigic } from './ModalActualizarSigic'
import { ModalConfirmacion } from './ModalConfirmacion'
import { ModalPersonalizarFondo } from './ModalPersonalizarFondo'
import { AnimatedThemeToggler } from './AnimatedThemeToggler'
import { aplicarTemaGlobal, obtenerTemaActual } from '../datos/fondos-pantalla'

/**
 * HeaderGlobal PRO: Cabecera maestra para toda la plataforma SiGIC.
 * Diseño Enterprise, responsivo, con glassmorphism y control de sesión unificado.
 */
export function HeaderGlobal({ 
  titulo = "Panel de Control", 
  subtitulo = "Módulo del Sistema",
  usuario = null,
  onVolver = null, 
  onCerrarSesion = null,
  onCambiarVersion = null,
  onCambiarEstiloInterfaz = null
}) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalFondoAbierto, setModalFondoAbierto] = useState(false)
  const [modalActualizarAbierto, setModalActualizarAbierto] = useState(false)
  const [fondoId, setFondoId] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_fondo') || 'beltran' : 'beltran'))
  const [cuadriculaActiva, setCuadriculaActiva] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_cuadricula') !== 'false' : true))
  const [marcaAguaActiva, setMarcaAguaActiva] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_marca_agua') !== 'false' : true))
  const [scrolled, setScrolled] = useState(false)
  const [modalQRUsuarioAbierto, setModalQRUsuarioAbierto] = useState(false)
  const [tokenQRUsuario, setTokenQRUsuario] = useState('')
  const [cargandoTokenQR, setCargandoTokenQR] = useState(false)
  const [pestanaModalQR, setPestanaModalQR] = useState('login')
  const [copiadoToken, setCopiadoToken] = useState(false)
  const [copiadoUrl, setCopiadoUrl] = useState(false)

  const handleAbrirQRModal = async () => {
    setModalQRUsuarioAbierto(true)
    setCargandoTokenQR(true)
    setPestanaModalQR('login')
    setCopiadoToken(false)
    setCopiadoUrl(false)

    try {
      if (usuario && usuario.id) {
        const res = await obtenerUsuarioToken(usuario.id)
        if (res && res.token) {
          setTokenQRUsuario(res.token)
          setCargandoTokenQR(false)
          return
        }
      }
    } catch (_) {
      // Fallback
    }

    const tokenActual = obtenerTokenSesion()
    setTokenQRUsuario(tokenActual || 'sigic-session-demo-token')
    setCargandoTokenQR(false)
  }

  const copiarTexto = (texto, tipo) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(() => {
        if (tipo === 'token') {
          setCopiadoToken(true)
          setTimeout(() => setCopiadoToken(false), 2000)
        } else {
          setCopiadoUrl(true)
          setTimeout(() => setCopiadoUrl(false), 2000)
        }
      })
    }
  }

  // Efecto para detectar scroll y añadir sombra al header dinámicamente
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Sincronización en vivo del tema
  useEffect(() => {
    const handleFondo = (e) => {
      if (e.detail) {
        setFondoId(e.detail)
        aplicarTemaGlobal(e.detail)
      }
    }
    const handleCuadricula = (e) => {
      if (typeof e.detail === 'boolean') setCuadriculaActiva(e.detail)
    }
    const handleMarcaAgua = (e) => {
      if (typeof e.detail === 'boolean') setMarcaAguaActiva(e.detail)
    }

    window.addEventListener('sigic-fondo-cambiado', handleFondo)
    window.addEventListener('sigic-cuadricula-cambiada', handleCuadricula)
    window.addEventListener('sigic-marca-agua-cambiada', handleMarcaAgua)
    return () => {
      window.removeEventListener('sigic-fondo-cambiado', handleFondo)
      window.removeEventListener('sigic-cuadricula-cambiada', handleCuadricula)
      window.removeEventListener('sigic-marca-agua-cambiada', handleMarcaAgua)
    }
  }, [])

  const handleCambiarFondo = (nuevoFondo) => {
    setFondoId(nuevoFondo)
    localStorage.setItem('sigic_fondo', nuevoFondo)
    aplicarTemaGlobal(nuevoFondo)
    window.dispatchEvent(new CustomEvent('sigic-fondo-cambiado', { detail: nuevoFondo }))
  }

  const handleCambiarCuadricula = (valor) => {
    setCuadriculaActiva(valor)
    localStorage.setItem('sigic_cuadricula', String(valor))
    window.dispatchEvent(new CustomEvent('sigic-cuadricula-cambiada', { detail: valor }))
  }

  const handleCambiarMarcaAgua = (valor) => {
    setMarcaAguaActiva(valor)
    localStorage.setItem('sigic_marca_agua', String(valor))
    window.dispatchEvent(new CustomEvent('sigic-marca-agua-cambiada', { detail: valor }))
  }

  const temaActual = obtenerTemaActual(fondoId)

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.05)]' 
          : 'bg-white border-b border-slate-100'
      }`}
      style={{
        borderTop: `3px solid ${temaActual?.colorPrincipal || '#0ea5e9'}`
      }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        
        {/* BLOQUE IZQUIERDO: Navegación + Menú Inicio + Branding + Título Contextual */}
        <div className="flex items-center gap-2 sm:gap-4">
          {onVolver && (
            <button 
              onClick={onVolver}
              className="group relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100/80 text-slate-400 transition-all hover:bg-sky-500 hover:border-sky-500 hover:text-white hover:shadow-lg hover:shadow-sky-500/20 active:scale-90"
              title="Volver atrás"
            >
              <ArrowLeft size={16} className="sm:hidden" />
              <ArrowLeft size={20} className="hidden sm:block transition-transform group-hover:-translate-x-0.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('sigic-abrir-menu'))}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#091b2e] hover:bg-sky-600 text-white transition-all duration-200 active:scale-95 shadow-md shadow-slate-950/10 cursor-pointer border border-cyan-500/30 group"
            title="Abrir Menú de Inicio SiGIC (Ctrl + K)"
          >
            <LayoutGrid size={15} className="text-cyan-400 group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-xs font-black tracking-wide hidden md:inline">Menú SiGIC</span>
            <kbd className="hidden lg:inline text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/80">Ctrl K</kbd>
          </button>
          
          <div className="flex items-center min-w-0">
            {/* Branding Logo Oficial */}
            <div className="flex items-center gap-1.5 sm:gap-2 pr-2 sm:pr-5 border-r border-slate-200/60 shrink-0">
              <img src="/logo-oficial.png" alt="SiGIC Oficial" className="h-8 sm:h-11 md:h-12 w-auto object-contain drop-shadow-md" />
            </div>

            {/* Título de la Página Actual */}
            <div className="pl-2 sm:pl-5 hidden sm:block min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none mb-1 truncate">
                {subtitulo}
              </p>
              <h2 className="text-[14px] sm:text-[15px] font-black text-slate-800 tracking-tight leading-none truncate">
                {titulo}
              </h2>
            </div>
          </div>
        </div>

        {/* BLOQUE DERECHO: Perfil de Usuario y Acciones */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          
          {/* Switch de Tema Animado Día/Noche */}
          <div className="flex items-center">
            <AnimatedThemeToggler size="sm" />
          </div>

          {/* Personalizar Fondo & Tema */}
          <button
            onClick={() => setModalFondoAbierto(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 hover:bg-white text-slate-700 hover:text-amber-600 hover:border-amber-400/50 text-[10px] font-bold tracking-tight transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
            title="Personalizar tema de color y fondo institucional"
          >
            <Palette size={13} className="text-amber-500 shrink-0" />
            <span className="hidden sm:inline">Tema & Fondo</span>
          </button>

          {/* Perfil del Operador con botón QR para inicio móvil */}
          {usuario && (
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100 transition-colors cursor-default">
                 <div className="flex flex-col items-end justify-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Operador</span>
                    <span className="text-xs font-black text-slate-700 leading-none">{usuario.nombre || 'Administrador'}</span>
                 </div>
                 <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                    <User size={14} strokeWidth={2.5} />
                 </div>
              </div>

              {/* Botón QR Móvil destacado */}
              <button
                type="button"
                onClick={handleAbrirQRModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-sky-50 hover:bg-sky-500 text-sky-700 hover:text-white border border-sky-200/80 hover:border-sky-500 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs group"
                title="Generar código QR para iniciar sesión en la App Móvil"
              >
                <QrCode size={16} className="text-sky-600 group-hover:text-white transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-wider">Pase QR</span>
              </button>
            </div>
          )}

          {/* Botón de Cierre de Sesión (Destacado) */}
          {onCerrarSesion && (
            <button
              onClick={() => setModalAbierto(true)}
              className="flex items-center gap-1.5 sm:gap-2 rounded-2xl bg-slate-900 px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white transition-all duration-300 hover:bg-red-500 hover:shadow-xl hover:shadow-red-500/20 active:scale-95"
              title="Cerrar sesión segura"
            >
              <LogOut size={15} className="opacity-90 shrink-0" />
              <span className="hidden xs:inline sm:inline">Salir</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal de Confirmación Estilizado */}
      {onCerrarSesion && (
        <ModalConfirmacion
          abierto={modalAbierto}
          onConfirmar={() => {
            setModalAbierto(false)
            onCerrarSesion()
          }}
          onCancelar={() => setModalAbierto(false)}
          titulo="Finalizar Sesión"
          descripcion="¿Estás seguro que deseas salir del panel de control? Los servicios seguirán activos en segundo plano."
          textoConfirmar="Sí, cerrar sesión"
        />
      )}

      {/* Modal de Personalización de Tema & Fondo */}
      {modalFondoAbierto && (
        <ModalPersonalizarFondo
          fondoActual={fondoId}
          alCambiarFondo={handleCambiarFondo}
          cuadriculaActiva={cuadriculaActiva}
          alCambiarCuadricula={handleCambiarCuadricula}
          marcaAguaActiva={marcaAguaActiva}
          alCambiarMarcaAgua={handleCambiarMarcaAgua}
          onCerrar={() => setModalFondoAbierto(false)}
        />
      )}
          {/* Modal de Actualización Dinámica SiGIC */}
      <ModalActualizarSigic
        abierto={modalActualizarAbierto}
        onCerrar={() => setModalActualizarAbierto(false)}
      />
    
      {/* Modal Pase QR de Acceso Móvil */}
      {modalQRUsuarioAbierto && usuario && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] overflow-hidden max-w-2xl w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Cabecera */}
            <div className="relative bg-slate-900 p-6 sm:p-7 text-white overflow-hidden">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-500/20 blur-2xl" />
              <button 
                onClick={() => setModalQRUsuarioAbierto(false)} 
                className="absolute right-5 top-5 z-10 rounded-xl bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white cursor-pointer"
              >
                <X size={19} />
              </button>
              <div className="relative flex items-center gap-4 pr-8">
                <div className="w-13 h-13 rounded-2xl bg-sky-400/20 text-sky-300 border border-sky-300/20 flex items-center justify-center shadow-inner">
                  <QrCode size={26} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-400">Acceso Rápido Móvil</span>
                  <h3 className="mt-0.5 text-lg font-black text-white">Iniciar Sesión con QR en SiGIC</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    Cuenta: <strong className="text-white">{usuario.nombre || 'Administrador'}</strong> · {usuario.correo || usuario.email || 'Rol Administrativo'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Pestañas */}
              <div className="flex items-center gap-2 mb-6 p-1 bg-slate-100 rounded-xl border border-slate-200/60 max-w-fit">
                <button
                  type="button"
                  onClick={() => setPestanaModalQR('login')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                    pestanaModalQR === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound size={14} className={pestanaModalQR === 'login' ? 'text-sky-500' : ''} />
                  <span>Pase de Inicio de Sesión</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPestanaModalQR('servidor')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                    pestanaModalQR === 'servidor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe size={14} className={pestanaModalQR === 'servidor' ? 'text-amber-500' : ''} />
                  <span>Configuración Servidor API</span>
                </button>
              </div>

              {pestanaModalQR === 'login' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50/80 rounded-2xl border border-slate-200 shadow-inner">
                    {cargandoTokenQR ? (
                      <div className="w-44 h-44 flex items-center justify-center">
                        <RefreshCw size={28} className="animate-spin text-sky-500" />
                      </div>
                    ) : tokenQRUsuario ? (
                      <QRCodeSVG 
                        value={`sigic-login:${tokenQRUsuario}`} 
                        size={175} 
                        level="L" 
                        fgColor="#0f172a" 
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-rose-500 text-xs font-bold text-center p-4">
                        No se pudo generar el código.
                      </div>
                    )}
                    <span className="mt-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Pase QR de Acceso Móvil
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-100">
                      <div className="flex items-center gap-2 text-sky-900 font-bold text-xs">
                        <Sparkles size={16} className="text-sky-500 shrink-0" />
                        <span>Acceso Instantáneo con la Cámara</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1.5">
                        Abrí la app <strong>SiGIC</strong> en tu teléfono móvil, tocá <strong>Escanear QR de Operador o Administrativo</strong> y apuntá la cámara para ingresar inmediatamente.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Token de sesión segura:</span>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-bold text-slate-800 truncate">
                          {tokenQRUsuario ? `${tokenQRUsuario.slice(0, 24)}...` : 'Generando...'}
                        </code>
                        {tokenQRUsuario && (
                          <button
                            type="button"
                            onClick={() => copiarTexto(tokenQRUsuario, 'token')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 transition active:scale-95 cursor-pointer shrink-0 shadow-sm"
                          >
                            {copiadoToken ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            <span>{copiadoToken ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50/80 rounded-2xl border border-slate-200 shadow-inner">
                    <QRCodeSVG 
                      value={`sigic-config:${typeof window !== 'undefined' ? window.location.origin : ''}`} 
                      size={175} 
                      level="H" 
                      fgColor="#0f172a" 
                    />
                    <span className="mt-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                      QR de Enlace de Servidor
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <Globe size={16} className="text-amber-600 shrink-0" />
                        <span>Enlace de Servidor API</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1.5">
                        Si tu teléfono está en la misma red o necesitás configurar la dirección del servidor sin escribirla a mano, escaneá este código.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Dirección del servidor:</span>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono font-bold text-slate-800 truncate">
                          {typeof window !== 'undefined' ? window.location.origin : ''}
                        </code>
                        <button
                          type="button"
                          onClick={() => copiarTexto(typeof window !== 'undefined' ? window.location.origin : '', 'url')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 transition active:scale-95 cursor-pointer shrink-0 shadow-sm"
                        >
                          {copiadoUrl ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          <span>{copiadoUrl ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </header>
  )
}
