import { useState, useEffect } from 'react'
import { LogOut, ArrowLeft, User } from 'lucide-react'
import { ModalConfirmacion } from './ModalConfirmacion'

/**
 * HeaderGlobal PRO: Cabecera maestra para toda la plataforma SiGIC.
 * Diseño Enterprise, responsivo, con glassmorphism y control de sesión unificado.
 */
export function HeaderGlobal({ 
  titulo = "Panel de Control", 
  subtitulo = "Módulo del Sistema",
  usuario = null,
  onVolver = null, 
  onCerrarSesion = null
}) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Efecto para detectar scroll y añadir sombra al header dinámicamente
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.05)]' 
          : 'bg-white border-b border-slate-100'
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        
        {/* BLOQUE IZQUIERDO: Navegación + Branding + Título Contextual */}
        <div className="flex items-center gap-3 sm:gap-5">
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
          
          <div className="flex items-center">
            {/* Branding Logo Oficial */}
            <div className="flex items-center gap-2 pr-3 sm:pr-5 border-r border-slate-200/60">
              <img src="/logo-oficial.png" alt="SiGIC Oficial" className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-md" />
            </div>

            {/* Título de la Página Actual */}
            <div className="pl-3 sm:pl-5 hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">
                {subtitulo}
              </p>
              <h2 className="text-[15px] font-black text-slate-800 tracking-tight leading-none">
                {titulo}
              </h2>
            </div>
          </div>
        </div>

        {/* BLOQUE DERECHO: Perfil de Usuario y Acciones */}
        <div className="flex items-center gap-4">
          
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
              className="flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white transition-all duration-300 hover:bg-red-500 hover:shadow-xl hover:shadow-red-500/20 active:scale-95"
              title="Cerrar sesión segura"
            >
              <LogOut size={16} className="opacity-90" />
              <span className="hidden sm:inline">Salir</span>
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
    </header>
  )
}
