import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle } from 'lucide-react'

export function ModalConfirmacion({
  abierto,
  onConfirmar,
  onCancelar,
  titulo,
  descripcion,
  textoConfirmar = 'Confirmar',
}) {
  return (
    <Dialog.Root open={abierto} onOpenChange={(estado) => !estado && onCancelar()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[#B3E5FC] bg-white shadow-[0_24px_64px_rgba(41,171,226,0.22)] focus:outline-none">
          <div className="bg-[#2A3448]">
            <div className="h-1 bg-[#29ABE2]" />
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-[#29ABE2]/20 text-[#29ABE2]">
                <AlertTriangle size={18} />
              </div>
              <Dialog.Title className="text-sm font-bold text-white">
                {titulo}
              </Dialog.Title>
            </div>
          </div>

          <div className="space-y-4 px-5 py-5">
            <Dialog.Description className="text-sm leading-relaxed text-[#546E7A]">
              {descripcion}
            </Dialog.Description>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancelar}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#546E7A] transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={onConfirmar}
                className="rounded-lg bg-[#29ABE2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0288D1] active:bg-[#0277BD]"
              >
                {textoConfirmar}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
