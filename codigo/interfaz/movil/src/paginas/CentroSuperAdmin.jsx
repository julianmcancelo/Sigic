import { Shield, UserCog, Database, Lock, Bell, ChevronRight } from 'lucide-react'
import { HeaderGlobal } from '../componentes/HeaderGlobal'

function Bloque({ titulo, descripcion, habilitado = false, onClick }) {
  return (
    <button
      type="button"
      onClick={habilitado ? onClick : undefined}
      className={`w-full rounded-3xl border p-6 text-left transition-all ${
        habilitado
          ? 'border-sky-200 bg-white hover:border-sky-400 hover:shadow-lg'
          : 'border-slate-200 bg-slate-50 opacity-70'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">{titulo}</h3>
          <p className="mt-2 text-sm text-slate-500">{descripcion}</p>
        </div>
        <ChevronRight size={18} className={habilitado ? 'text-sky-500' : 'text-slate-300'} />
      </div>
      {!habilitado ? (
        <p className="mt-4 inline-block rounded-full bg-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          Proximamente
        </p>
      ) : null}
    </button>
  )
}

export function CentroSuperAdmin({ usuario, onVolver, onCerrarSesion, onNavegar }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <HeaderGlobal titulo="Centro Super Administrador" subtitulo="Acceso exclusivo" usuario={usuario} onVolver={onVolver} onCerrarSesion={onCerrarSesion} />

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <Shield className="text-sky-400" size={24} />
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">Super Administrador</p>
          </div>
          <h1 className="mt-3 text-3xl font-black">Control maestro de la plataforma</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Esta pantalla concentra funciones críticas de plataforma: gestión de usuarios del sistema, seguridad, base de datos y herramientas operativas avanzadas.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Bloque
            titulo="Usuarios del Sistema"
            descripcion="Crear cuentas de administrativo, porteria y otros perfiles; activar o desactivar accesos y ajustar roles."
            habilitado
            onClick={() => onNavegar('gestion-usuarios')}
          />
          <Bloque
            titulo="Seguridad de Acceso"
            descripcion="Políticas de contraseñas, bloqueo por intentos, segundo factor y trazabilidad de inicio de sesión."
          />
          <Bloque
            titulo="Operaciones de Base de Datos"
            descripcion="Respaldo, mantenimiento, limpieza de datos y estados de inicialización por entorno."
          />
          <Bloque
            titulo="Alertas y Monitoreo"
            descripcion="Canales de alerta, auditoría en vivo, métricas operativas y estado de servicios críticos."
          />
        </section>
      </main>
    </div>
  )
}

