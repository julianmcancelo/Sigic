import { useState, useEffect } from 'react'
import { LogOut, ArrowLeft, User, LayoutGrid, Palette, ArrowUpCircle } from 'lucide-react'
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

          {/* Perfil del Operador */}
          {usuario && (
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100 transition-colors cursor-default">
               <div className="flex flex-col items-end justify-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Operador</span>
                  <span className="text-xs font-black text-slate-700 leading-none">{usuario.nombre || 'Administrador'}</span>
               </div>
               <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <User size={14} strokeWidth={2.5} />
               </div>
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
    </header>
  )
}
