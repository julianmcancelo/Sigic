import React, { useState, useEffect } from 'react'
import {
  Sparkles, ArrowRight, ArrowLeft, CheckCircle2,
  X, HelpCircle, ChevronRight, Check
} from 'lucide-react'

// Mapeo canónico del circuito administrativo
const MAPA_PASOS = {
  'gestion-ceremonias': {
    numero: 1,
    clave: 'gestion-ceremonias',
    titulo: 'Paso 1: Ceremonia y Acto',
    subtitulo: 'Definición del evento, fecha, lugar y aforo',
    siguiente: 'gestion-graduados',
    nombreSiguiente: 'Padrón de Graduados',
    anterior: null,
    sugerencia: '¿Ya definiste fecha, lugar y estado activo de la ceremonia?',
    consejo: 'Podés revisar el nombre oficial o avanzar al Paso 2 para cargar o verificar el padrón de alumnos.'
  },
  'gestion-graduados': {
    numero: 2,
    clave: 'gestion-graduados',
    titulo: 'Paso 2: Padrón de Graduados',
    subtitulo: 'Carga de alumnos, revisión de DNI y legajo',
    siguiente: 'convocatoria',
    nombreSiguiente: 'Convocatoria e Invitaciones',
    anterior: 'gestion-ceremonias',
    nombreAnterior: 'Ceremonia',
    sugerencia: '¿Terminaste de verificar o importar la nómina de graduados?',
    consejo: 'Si el padrón está completo, avanzá al Paso 3 para despachar los enlaces y correos de invitación.'
  },
  'convocatoria': {
    numero: 3,
    clave: 'convocatoria',
    titulo: 'Paso 3: Convocatoria e Invitaciones',
    subtitulo: 'Despacho de invitaciones, WhatsApp y seguimiento de respuestas',
    siguiente: 'preparacion-ceremonia',
    nombreSiguiente: 'Preparación de Butacas',
    anterior: 'gestion-graduados',
    nombreAnterior: 'Padrón de Graduados',
    sugerencia: '¿Despachaste las invitaciones o compartiste los enlaces?',
    consejo: 'A medida que los alumnos confirmen, podés ir al Paso 4 para la asignación y plano de asientos.'
  },
  'preparacion-ceremonia': {
    numero: 4,
    clave: 'preparacion-ceremonia',
    titulo: 'Paso 4: Preparación y Butacas',
    subtitulo: 'Distribución en anfiteatro y entrega de diplomas',
    siguiente: 'control-ingreso',
    nombreSiguiente: 'Acreditación y Control en Vivo',
    anterior: 'convocatoria',
    nombreAnterior: 'Convocatoria',
    sugerencia: '¿Las butacas de graduados y acompañantes quedaron asignadas?',
    consejo: 'Asegurate de emitir las credenciales QR antes de pasar al control de ingreso en portería.'
  },
  'despacho-credenciales': {
    numero: 4,
    clave: 'despacho-credenciales',
    titulo: 'Paso 4: Despacho de Credenciales',
    subtitulo: 'Emisión masiva de pases y códigos QR',
    siguiente: 'control-ingreso',
    nombreSiguiente: 'Acreditación y Control en Vivo',
    anterior: 'convocatoria',
    nombreAnterior: 'Convocatoria',
    sugerencia: '¿Finalizaste el envío de credenciales con código QR?',
    consejo: 'El día del evento podés ingresar directamente al módulo de Acreditación / Portería.'
  },
  'control-ingreso': {
    numero: 5,
    clave: 'control-ingreso',
    titulo: 'Paso 5: Acreditación en Vivo',
    subtitulo: 'Escaneo de códigos QR y control de asistencia',
    siguiente: null,
    nombreSiguiente: null,
    anterior: 'preparacion-ceremonia',
    nombreAnterior: 'Preparación de Butacas',
    sugerencia: 'Módulo de acceso en vivo activo para el acto.',
    consejo: 'Podés volver a revisar el mapa de butacas o consultar el resumen de confirmaciones si es necesario.'
  }
}

/**
 * SugerenciaFlotantePaso
 * Widget sutil e inteligente que aparece después de unos segundos en una vista administrativa
 * para orientar al operador, sugerir avanzar al paso siguiente o volver a revisar el anterior.
 */
export function SugerenciaFlotantePaso({
  vistaActual,
  onNavegar,
  segundosEspera = 14,
  ceremonia = null
}) {
  const [visible, setVisible] = useState(false)
  const [descartado, setDescartado] = useState(false)
  const [tiempoEnPantalla, setTiempoEnPantalla] = useState(0)

  const configPaso = MAPA_PASOS[vistaActual]

  // Reset al cambiar de pantalla
  useEffect(() => {
    setVisible(false)
    setDescartado(false)
    setTiempoEnPantalla(0)

    if (!configPaso || !onNavegar) return

    // Contador de tiempo en la ventana
    const timer = setTimeout(() => {
      setVisible(true)
    }, segundosEspera * 1000)

    return () => clearTimeout(timer)
  }, [vistaActual, segundosEspera, configPaso, onNavegar])

  if (!visible || descartado || !configPaso) return null

  return (
    <aside
      aria-label="Asistente de flujo administrativo"
      className="fixed bottom-6 right-6 z-40 max-w-sm sm:max-w-md w-[calc(100vw-3rem)] animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative overflow-hidden rounded-2xl border border-sky-200/90 bg-white/95 p-4 shadow-xl shadow-sky-950/10 backdrop-blur-md">
        {/* Glow decorativo sutil */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-sky-400/15 blur-2xl" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
              <Sparkles size={14} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-600">
                Guía Operativa · Paso {configPaso.numero}
              </span>
              <h4 className="text-xs font-black text-slate-800 leading-tight">
                {configPaso.sugerencia}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDescartado(true)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
            title="Cerrar sugerencia"
          >
            <X size={14} />
          </button>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-slate-500 font-medium">
          {configPaso.consejo}
        </p>

        {/* Acciones de Navegación del Circuito */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          {configPaso.anterior ? (
            <button
              type="button"
              onClick={() => {
                setDescartado(true)
                onNavegar(configPaso.anterior)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={12} />
              <span>Volver a {configPaso.nombreAnterior || 'Revisar'}</span>
            </button>
          ) : <span />}

          {configPaso.siguiente && (
            <button
              type="button"
              onClick={() => {
                setDescartado(true)
                onNavegar(configPaso.siguiente)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-[11px] font-black text-white shadow-xs transition active:scale-95 cursor-pointer ml-auto"
            >
              <span>Continuar a {configPaso.nombreSiguiente}</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
