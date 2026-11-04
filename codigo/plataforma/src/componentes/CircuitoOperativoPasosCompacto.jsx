import React, { useState, useEffect } from 'react'
import {
  CalendarPlus, GraduationCap, Send, Armchair, ScanLine,
  CheckCircle2, ChevronRight, Minimize2, Maximize2, Sparkles, Layers
} from 'lucide-react'

export function CircuitoOperativoPasosCompacto({ 
  ceremonia, 
  vistaActual, 
  onNavegar,
  className = ""
}) {
  const [comprimido, setComprimido] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sigic_circuito_comprimido') === 'true'
    }
    return false
  })

  const alternarCompresion = () => {
    const nuevo = !comprimido
    setComprimido(nuevo)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sigic_circuito_comprimido', String(nuevo))
    }
  }

  const totalEgresados = Number(ceremonia?.total_egresados || 0)
  const invitacionesEnviadas = Number(ceremonia?.invitaciones_enviadas || 0)
  const egresadosConfirmados = Number(ceremonia?.egresados_confirmados || 0)
  const planoConfigurado = Boolean(ceremonia?.plano_configurado || ceremonia?.egresados_con_butaca)
  const estadoOperativo = ceremonia?.estado_operativo

  // Evaluación de estado de cada paso
  const paso1Completado = Boolean(ceremonia?.id)
  const paso2Completado = totalEgresados > 0
  const paso3Completado = totalEgresados > 0 && invitacionesEnviadas >= totalEgresados
  const paso4Completado = planoConfigurado
  const paso5Completado = estadoOperativo === 'FINALIZADA'

  // Mapeo de vista activa actual
  const pasoActualPorVista = {
    'gestion-ceremonias': 1,
    'gestion-graduados': 2,
    'convocatoria': 3,
    'preparacion-ceremonia': 4,
    'despacho-credenciales': 4,
    'control-ingreso': 5
  }[vistaActual] || null

  let pasoSugerido = 1
  if (!paso1Completado) pasoSugerido = 1
  else if (!paso2Completado) pasoSugerido = 2
  else if (!paso3Completado) pasoSugerido = 3
  else if (!paso4Completado) pasoSugerido = 4
  else pasoSugerido = 5

  const pasos = [
    {
      numero: '01',
      clave: 'gestion-ceremonias',
      etiqueta: 'INICIAR',
      titulo: 'Ceremonia',
      detalle: ceremonia?.nombre ? (ceremonia.nombre.length > 20 ? ceremonia.nombre.slice(0, 20) + '...' : ceremonia.nombre) : 'Crear / Activar',
      destino: 'gestion-ceremonias',
      icono: CalendarPlus,
      completado: paso1Completado,
      activo: pasoActualPorVista ? pasoActualPorVista === 1 : pasoSugerido === 1
    },
    {
      numero: '02',
      clave: 'gestion-graduados',
      etiqueta: 'PADRÓN',
      titulo: 'Graduados',
      detalle: totalEgresados > 0 ? `${totalEgresados} inscriptos` : 'Importar nómina',
      destino: 'gestion-graduados',
      icono: GraduationCap,
      completado: paso2Completado,
      activo: pasoActualPorVista ? pasoActualPorVista === 2 : pasoSugerido === 2
    },
    {
      numero: '03',
      clave: 'convocatoria',
      etiqueta: 'CONVOCAR',
      titulo: 'Invitaciones',
      detalle: invitacionesEnviadas > 0 ? `${invitacionesEnviadas} env. (${egresadosConfirmados} conf.)` : 'Despachar correos',
      destino: 'convocatoria',
      icono: Send,
      completado: paso3Completado,
      activo: pasoActualPorVista ? pasoActualPorVista === 3 : pasoSugerido === 3
    },
    {
      numero: '04',
      clave: 'preparacion-ceremonia',
      etiqueta: 'BUTACAS',
      titulo: 'Preparación',
      detalle: planoConfigurado ? 'Distribución lista' : 'Asignación automática',
      destino: 'preparacion-ceremonia',
      icono: Armchair,
      completado: paso4Completado,
      activo: pasoActualPorVista ? pasoActualPorVista === 4 : pasoSugerido === 4
    },
    {
      numero: '05',
      clave: 'control-ingreso',
      etiqueta: 'EN VIVO',
      titulo: 'Acreditación',
      detalle: estadoOperativo === 'FINALIZADA' ? 'Concluida' : 'Escáner QR',
      destino: 'control-ingreso',
      icono: ScanLine,
      completado: paso5Completado,
      activo: pasoActualPorVista ? pasoActualPorVista === 5 : pasoSugerido === 5
    }
  ]

  return (
    <div className={`w-full bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xs transition-all duration-300 ${comprimido ? 'py-1.5 px-3' : 'p-2.5 sm:p-3'} ${className}`}>
      
      {/* Barra de cabecera ultra compacta */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-800 truncate">
            Circuito Operativo Institucional
          </p>
          <span className="hidden sm:inline-block text-[9px] px-2 py-0.2 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-200/60">
            Flujo Guiado
          </span>
          {ceremonia?.nombre && (
            <span className="hidden md:inline-block text-[10px] text-slate-400 font-medium truncate">
              · {ceremonia.nombre}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={alternarCompresion}
          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-600 transition active:scale-95 cursor-pointer shrink-0"
          title={comprimido ? "Expandir tarjetas de circuito" : "Comprimir circuito a barra minimalista"}
        >
          {comprimido ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
          <span>{comprimido ? 'Expandir' : 'Comprimir'}</span>
        </button>
      </div>

      {/* Grid de pasos: versión normal o ultra comprimida */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2 transition-all duration-300`}>
        {pasos.map((paso) => {
          const Icono = paso.icono
          const esPasoActual = paso.activo

          if (comprimido) {
            return (
              <button
                key={paso.numero}
                type="button"
                onClick={() => onNavegar && onNavegar(paso.destino)}
                className={`group flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-left transition-all active:scale-98 cursor-pointer ${
                  esPasoActual
                    ? 'bg-sky-50 border-sky-400 text-sky-950 font-black shadow-2xs ring-1 ring-sky-400/30'
                    : paso.completado
                    ? 'bg-slate-50/80 hover:bg-white border-slate-200 text-slate-700'
                    : 'bg-white hover:bg-slate-50 border-slate-200/70 text-slate-500'
                }`}
                title={`Ir a ${paso.titulo}`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`text-[9px] font-mono font-black ${esPasoActual ? 'text-sky-700' : 'text-slate-400'}`}>
                    {paso.numero}
                  </span>
                  <span className="text-[11px] font-bold truncate">
                    {paso.titulo}
                  </span>
                </div>

                {paso.completado ? (
                  <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                ) : esPasoActual ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0 animate-ping" />
                ) : (
                  <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                )}
              </button>
            )
          }

          // Versión estándar pero estilizada y compacta
          return (
            <button
              key={paso.numero}
              type="button"
              onClick={() => onNavegar && onNavegar(paso.destino)}
              className={`group relative flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all duration-200 active:scale-98 cursor-pointer ${
                esPasoActual
                  ? 'bg-gradient-to-b from-sky-50 via-white to-sky-50/30 border-sky-400 shadow-sm ring-2 ring-sky-400/20'
                  : paso.completado
                  ? 'bg-slate-50/70 hover:bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200/70 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[9.5px] font-black font-mono tracking-wider ${
                  esPasoActual ? 'text-sky-700' : paso.completado ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  {paso.numero}. {paso.etiqueta}
                </span>

                {paso.completado ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={11} strokeWidth={2.5} />
                  </span>
                ) : esPasoActual ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-100 text-sky-600 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  </span>
                ) : (
                  <Icono size={13} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                )}
              </div>

              <div>
                <h4 className={`text-xs font-black tracking-tight leading-tight group-hover:text-sky-700 transition-colors ${
                  esPasoActual ? 'text-sky-950' : 'text-slate-800'
                }`}>
                  {paso.titulo}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5 leading-tight">
                  {paso.detalle}
                </p>
              </div>

              <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold">
                <span className={esPasoActual ? 'text-sky-700' : 'text-slate-400 group-hover:text-slate-600'}>
                  {esPasoActual ? 'En este paso' : paso.completado ? 'Revisar' : 'Ir al paso'}
                </span>
                <ChevronRight size={11} className={`transition-transform duration-200 ${
                  esPasoActual ? 'text-sky-600 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-600'
                }`} />
              </div>
            </button>
          )
        })}
      </div>

    </div>
  )
}
