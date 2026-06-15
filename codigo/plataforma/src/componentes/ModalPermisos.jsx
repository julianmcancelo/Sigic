import * as Dialog from '@radix-ui/react-dialog'
import { Bell, MapPin } from 'lucide-react'

function obtenerTextoEstado(estado) {
  if (estado === 'granted') {
    return 'Permitido'
  }

  if (estado === 'denied') {
    return 'Bloqueado'
  }

  if (estado === 'unsupported') {
    return 'No disponible'
  }

  return 'Pendiente'
}

function FilaPermiso({
  icono,
  titulo,
  estado,
  textoBoton,
  onSolicitar,
  deshabilitado,
}) {
  const permisoConcedido = estado === 'granted'
  const Icono = icono

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#B3E5FC] bg-[#F8FCFE] px-3 py-3">
      <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-[#29ABE2]/15 text-[#1565C0]">
        <Icono size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#2A3448]">{titulo}</p>
        <p className="text-xs text-[#546E7A]">{obtenerTextoEstado(estado)}</p>
      </div>

      <button
        type="button"
        onClick={onSolicitar}
        disabled={deshabilitado || permisoConcedido}
        className="rounded-lg bg-[#29ABE2] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0288D1] disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {permisoConcedido ? 'Listo' : textoBoton}
      </button>
    </div>
  )
}

export function ModalPermisos({
  abierto,
  permisos,
  onSolicitarUbicacion,
  onSolicitarNotificaciones,
  onContinuar,
}) {
  return (
    <Dialog.Root open={abierto}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#B3E5FC] bg-white p-5 shadow-[0_24px_64px_rgba(41,171,226,0.18)] focus:outline-none">
          <Dialog.Title className="text-base font-semibold text-[#2A3448]">
            Permisos necesarios
          </Dialog.Title>

          <Dialog.Description className="mt-1 text-sm text-[#546E7A]">
            Habilita ubicacion para el clima real. Las notificaciones son opcionales.
          </Dialog.Description>

          <div className="mt-4 space-y-3">
            <FilaPermiso
              icono={MapPin}
              titulo="Ubicacion"
              estado={permisos.ubicacion}
              textoBoton="Permitir"
              onSolicitar={onSolicitarUbicacion}
              deshabilitado={false}
            />

            <FilaPermiso
              icono={Bell}
              titulo="Notificaciones"
              estado={permisos.notificaciones}
              textoBoton={
                permisos.notificaciones === 'unsupported'
                  ? 'Sin soporte'
                  : 'Permitir'
              }
              onSolicitar={onSolicitarNotificaciones}
              deshabilitado={permisos.notificaciones === 'unsupported'}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onContinuar}
              className="rounded-lg bg-[#29ABE2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0288D1]"
            >
              Continuar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
