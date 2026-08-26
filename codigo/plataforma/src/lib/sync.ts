'use client'

import { useEffect, useRef } from 'react'

export type TipoSync = 'BUTACAS' | 'EGRESADOS' | 'INVITADOS' | 'ENTREGADORES' | 'CEREMONIAS' | 'TODOS'

export interface EventoSync {
  tipo: TipoSync
  payload?: any
  timestamp: number
  origenId?: string
}

const NOMBRE_CANAL = 'sigic_live_channel'
const CLAVE_STORAGE = 'sigic_sync_event'
const ID_SESION_LOCAL = typeof window !== 'undefined'
  ? `tab_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`
  : 'server'

let canalBroadcast: BroadcastChannel | null = null

function obtenerCanal(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null
  if (!canalBroadcast && typeof BroadcastChannel !== 'undefined') {
    try {
      canalBroadcast = new BroadcastChannel(NOMBRE_CANAL)
    } catch {
      canalBroadcast = null
    }
  }
  return canalBroadcast
}

/**
 * Emite un evento en tiempo real a todas las pestañas, ventanas y dispositivos locales.
 */
export function emitirCambioSync(tipo: TipoSync, payload?: any) {
  if (typeof window === 'undefined') return

  const evento: EventoSync = {
    tipo,
    payload,
    timestamp: Date.now(),
    origenId: ID_SESION_LOCAL
  }

  // 1. BroadcastChannel (Sincronización instantánea entre pestañas / ventanas en 0ms)
  const canal = obtenerCanal()
  if (canal) {
    try {
      canal.postMessage(evento)
    } catch (err) {
      console.warn('Error al emitir en BroadcastChannel:', err)
    }
  }

  // 2. Storage event (Fallback robusto para navegadores)
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(evento))
  } catch {}

  // 3. CustomEvent local (Para componentes dentro de la misma pestaña)
  try {
    window.dispatchEvent(new CustomEvent('sigic:sync', { detail: evento }))
  } catch {}
}

interface OpcionesSincronizacion {
  intervaloMs?: number // Intervalo opcional de polling en segundo plano cuando la pestaña está activa
  desactivarEnSegundoPlano?: boolean
}

/**
 * Hook de React para escuchar cambios en vivo y sincronizar datos automáticamente.
 */
export function useSincronizacion(
  tipos: TipoSync[],
  callback: (evento: EventoSync) => void,
  opciones: OpcionesSincronizacion = {}
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const tiposSet = useRef(new Set(tipos.includes('TODOS') ? ['TODOS', 'BUTACAS', 'EGRESADOS', 'INVITADOS', 'ENTREGADORES', 'CEREMONIAS'] : tipos))
  tiposSet.current = new Set(tipos.includes('TODOS') ? ['TODOS', 'BUTACAS', 'EGRESADOS', 'INVITADOS', 'ENTREGADORES', 'CEREMONIAS'] : tipos)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const procesarEvento = (evento: EventoSync) => {
      if (!evento || !evento.tipo) return
      if (tiposSet.current.has(evento.tipo) || tiposSet.current.has('TODOS')) {
        callbackRef.current(evento)
      }
    }

    // 1. Escuchar BroadcastChannel
    const canal = obtenerCanal()
    const manejarMensajeCanal = (ev: MessageEvent<EventoSync>) => {
      if (ev.data && ev.data.origenId !== ID_SESION_LOCAL) {
        procesarEvento(ev.data)
      }
    }
    if (canal) {
      canal.addEventListener('message', manejarMensajeCanal)
    }

    // 2. Escuchar Storage Event
    const manejarStorage = (ev: StorageEvent) => {
      if (ev.key === CLAVE_STORAGE && ev.newValue) {
        try {
          const parsed = JSON.parse(ev.newValue) as EventoSync
          if (parsed.origenId !== ID_SESION_LOCAL) {
            procesarEvento(parsed)
          }
        } catch {}
      }
    }
    window.addEventListener('storage', manejarStorage)

    // 3. Escuchar CustomEvent local
    const manejarCustomEvent = (ev: Event) => {
      const customEv = ev as CustomEvent<EventoSync>
      if (customEv.detail) {
        procesarEvento(customEv.detail)
      }
    }
    window.addEventListener('sigic:sync', manejarCustomEvent)

    // 4. Sincronizar al volver a la pestaña o darle foco
    const manejarVisibilidad = () => {
      if (document.visibilityState === 'visible') {
        procesarEvento({ tipo: 'TODOS', timestamp: Date.now() })
      }
    }
    document.addEventListener('visibilitychange', manejarVisibilidad)
    window.addEventListener('focus', manejarVisibilidad)

    // 5. Polling suave opcional (por defecto 6000ms si se especifica o está visible)
    let intervaloId: NodeJS.Timeout | null = null
    const intervalo = opciones.intervaloMs ?? 6000
    if (intervalo > 0) {
      intervaloId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          procesarEvento({ tipo: 'TODOS', timestamp: Date.now() })
        }
      }, intervalo)
    }

    return () => {
      if (canal) {
        canal.removeEventListener('message', manejarMensajeCanal)
      }
      window.removeEventListener('storage', manejarStorage)
      window.removeEventListener('sigic:sync', manejarCustomEvent)
      document.removeEventListener('visibilitychange', manejarVisibilidad)
      window.removeEventListener('focus', manejarVisibilidad)
      if (intervaloId) clearInterval(intervaloId)
    }
  }, [opciones.intervaloMs])
}
