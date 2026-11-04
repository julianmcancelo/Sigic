import { useCallback, useEffect, useRef, useState } from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { AlertTriangle, Info, Trash2 } from 'lucide-react'

const ESTILOS = {
  peligro: {
    Icono: Trash2,
    icono: 'bg-rose-50 text-rose-600 ring-rose-100',
    boton: 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-300',
  },
  advertencia: {
    Icono: AlertTriangle,
    icono: 'bg-amber-50 text-amber-600 ring-amber-100',
    boton: 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-300',
  },
  info: {
    Icono: Info,
    icono: 'bg-sky-50 text-sky-600 ring-sky-100',
    boton: 'bg-sky-600 hover:bg-sky-700 focus-visible:ring-sky-300',
  },
}

export function ModalConfirmacion({
  abierto,
  onConfirmar,
  onCancelar,
  titulo,
  descripcion,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  tipo = 'peligro',
}) {
  const estilo = ESTILOS[tipo] || ESTILOS.peligro
  const Icono = estilo.Icono

  return (
    <AlertDialog.Root open={abierto} onOpenChange={(estado) => !estado && onCancelar()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-[#061426]/60 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />

        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(2,20,40,.30)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
          <div className="px-6 pb-5 pt-6 sm:px-7 sm:pt-7">
            <div className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ring-4 ${estilo.icono}`}>
              <Icono size={22} strokeWidth={2.2} />
            </div>

            <AlertDialog.Title className="text-xl font-black tracking-tight text-[#10243c]">
              {titulo}
            </AlertDialog.Title>
            <AlertDialog.Description asChild>
              <div className="mt-2 text-sm font-medium leading-6 text-slate-500">
              {descripcion}
              </div>
            </AlertDialog.Description>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                {textoCancelar}
              </button>
            </AlertDialog.Cancel>

            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={onConfirmar}
                className={`min-h-11 rounded-xl px-5 text-sm font-black text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-4 ${estilo.boton}`}
              >
                {textoConfirmar}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

export function useConfirmacion() {
  const [opciones, setOpciones] = useState(null)
  const resolver = useRef(null)

  const confirmar = useCallback((nuevasOpciones) => new Promise((resolve) => {
    if (resolver.current) resolver.current(false)
    resolver.current = resolve
    setOpciones(nuevasOpciones)
  }), [])

  const responder = useCallback((respuesta) => {
    const resolverActual = resolver.current
    resolver.current = null
    setOpciones(null)
    resolverActual?.(respuesta)
  }, [])

  useEffect(() => () => {
    resolver.current?.(false)
    resolver.current = null
  }, [])

  const dialogoConfirmacion = opciones ? (
    <ModalConfirmacion
      abierto
      {...opciones}
      onConfirmar={() => responder(true)}
      onCancelar={() => responder(false)}
    />
  ) : null

  return { confirmar, dialogoConfirmacion }
}
