import { useState } from 'react'
import { CloudSun, LogOut } from 'lucide-react'
import { ModalConfirmacion } from '../ModalConfirmacion'

export function BarraSuperior({ usuario, temperatura, onCerrarSesion }) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const textoTemperatura = temperatura !== null ? `${temperatura}\u00B0C` : '--'
  const logoInstitucional = '/footer.png'

  return (
    <header
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0d1b2e 0%, #1a2d45 50%, #2A3448 100%)' }}
    >
      {/* Línea superior azul */}
      <div className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #29ABE2, transparent)' }} />

      {/* Patrón de fondo sutil */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

      {/* Círculo decorativo */}
      <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full opacity-10 blur-[60px]"
        style={{ background: '#29ABE2' }} />

      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

        {/* Logo + título evento */}
        <div className="flex items-center gap-3">
          <img
            src={logoInstitucional}
            alt="Instituto Tecnologico Beltran"
            className="h-9 w-auto object-contain drop-shadow-lg"
          />
          <div className="hidden sm:block">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/40">
              Ceremonia de Colación 2026
            </p>
            <p className="text-[12px] font-700 text-white/80 leading-tight">
              Panel de Administración
            </p>
          </div>
        </div>

        {/* Derecha: cerrar */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Cerrar sesión */}
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-[11px] font-semibold text-white/80 transition hover:border-[#29ABE2]/40 hover:bg-[#29ABE2]/10 hover:text-white"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Cerrar sesion</span>
          </button>
        </div>
      </div>

      {/* Línea inferior */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.06]" />

      <ModalConfirmacion
        abierto={modalAbierto}
        onConfirmar={onCerrarSesion}
        onCancelar={() => setModalAbierto(false)}
        titulo="Cerrar sesion"
        descripcion="Vas a salir del sistema. Podes volver a ingresar cuando quieras con tus credenciales."
        textoConfirmar="Si, cerrar sesion"
      />
    </header>
  )
}
