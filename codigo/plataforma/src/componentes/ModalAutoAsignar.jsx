import React, { useState } from 'react'
import {
  X, Sparkles, ScrollText, GraduationCap, ArrowDownAZ,
  Users, ArrowUpDown
} from 'lucide-react'

export function ModalAutoAsignar({
  abierto,
  onCerrar,
  onConfirmar,
  cargando = false,
  totalGraduados = 0,
  graduadosAceptados = 0,
  totalInvitados = 0
}) {
  const [criterio, setCriterio] = useState('JURAMENTO')
  const [prioridadJuramento, setPrioridadJuramento] = useState('DIOS_Y_PATRIA_PRIMERO')
  const [incluirPendientes, setIncluirPendientes] = useState(true)
  const [ubicarInvitados, setUbicarInvitados] = useState(true)

  if (!abierto) return null

  const egresadosAProcesar = incluirPendientes ? totalGraduados : graduadosAceptados

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirmar({
      criterio,
      prioridadJuramento,
      incluirPendientes,
      ubicarInvitados
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles size={14} />
            </div>
            <div>
              <h3 className="text-[13px] font-black tracking-tight leading-none">Auto-Asignar Butacas</h3>
              <p className="text-[9.5px] text-slate-400 font-medium mt-0.5">Algoritmo de ubicación inteligente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer disabled:opacity-30"
          >
            <X size={14} />
          </button>
        </div>

        {/* CONTENIDO */}
        <form onSubmit={handleSubmit} className="px-4 py-3 overflow-y-auto space-y-3 text-slate-700">
          
          {/* SECCIÓN 1: CRITERIO */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <ArrowUpDown size={10} className="text-sky-500" />
              1. Criterio de Ordenamiento
            </label>

            <div className="space-y-1.5">
              {/* Opción A: Juramento */}
              <div
                onClick={() => setCriterio('JURAMENTO')}
                className={`px-3 py-2 rounded-lg border-2 transition cursor-pointer ${
                  criterio === 'JURAMENTO'
                    ? 'border-sky-500 bg-sky-50/60'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-[11px] text-slate-900">
                    <ScrollText size={12} className={criterio === 'JURAMENTO' ? 'text-sky-600' : 'text-slate-400'} />
                    <span>Por Fórmula de Juramento</span>
                    <span className="text-[8px] bg-sky-100 text-sky-700 font-black px-1 py-px rounded uppercase leading-tight">Protocolar</span>
                  </div>
                  <input type="radio" name="criterio" checked={criterio === 'JURAMENTO'} onChange={() => setCriterio('JURAMENTO')} className="accent-sky-600 cursor-pointer w-3.5 h-3.5" />
                </div>
                <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                  Agrupa según juramento para agilizar la toma conjunta en escenario.
                </p>

                {criterio === 'JURAMENTO' && (
                  <div className="mt-1.5 pt-1.5 border-t border-sky-100 animate-in slide-in-from-top-1 duration-150">
                    <span className="text-[9px] font-bold text-sky-800">Orden de bloques:</span>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => setPrioridadJuramento('DIOS_Y_PATRIA_PRIMERO')}
                        className={`px-2 py-1 rounded-md text-[9px] font-black text-left transition border cursor-pointer leading-tight ${
                          prioridadJuramento === 'DIOS_Y_PATRIA_PRIMERO'
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        1° Dios y Patria<br />
                        <span className="text-[8px] font-semibold opacity-80">2° Por la Patria</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrioridadJuramento('PATRIA_PRIMERO')}
                        className={`px-2 py-1 rounded-md text-[9px] font-black text-left transition border cursor-pointer leading-tight ${
                          prioridadJuramento === 'PATRIA_PRIMERO'
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        1° Por la Patria<br />
                        <span className="text-[8px] font-semibold opacity-80">2° Dios y Patria</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Opción B: Carrera */}
              <div
                onClick={() => setCriterio('CARRERA')}
                className={`px-3 py-2 rounded-lg border-2 transition cursor-pointer ${
                  criterio === 'CARRERA'
                    ? 'border-sky-500 bg-sky-50/60'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-[11px] text-slate-900">
                    <GraduationCap size={12} className={criterio === 'CARRERA' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span>Por Carrera Académica</span>
                  </div>
                  <input type="radio" name="criterio" checked={criterio === 'CARRERA'} onChange={() => setCriterio('CARRERA')} className="accent-sky-600 cursor-pointer w-3.5 h-3.5" />
                </div>
                <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                  Agrupa por titulación y ordena alfabéticamente dentro de cada bloque.
                </p>
              </div>

              {/* Opción C: Alfabético */}
              <div
                onClick={() => setCriterio('ALFABETICO')}
                className={`px-3 py-2 rounded-lg border-2 transition cursor-pointer ${
                  criterio === 'ALFABETICO'
                    ? 'border-sky-500 bg-sky-50/60'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-[11px] text-slate-900">
                    <ArrowDownAZ size={12} className={criterio === 'ALFABETICO' ? 'text-emerald-600' : 'text-slate-400'} />
                    <span>Alfabético Estricto (A-Z)</span>
                  </div>
                  <input type="radio" name="criterio" checked={criterio === 'ALFABETICO'} onChange={() => setCriterio('ALFABETICO')} className="accent-sky-600 cursor-pointer w-3.5 h-3.5" />
                </div>
                <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                  Orden global sin distinguir juramento ni carrera.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: ALCANCE */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Users size={10} className="text-indigo-500" />
              2. Alcance y Ubicación
            </label>

            <div className="space-y-1.5">
              <label className="flex items-start gap-2 px-2.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition">
                <input type="checkbox" checked={incluirPendientes} onChange={(e) => setIncluirPendientes(e.target.checked)} className="mt-px accent-sky-600 cursor-pointer" />
                <div className="text-[11px] leading-snug">
                  <span className="font-bold text-slate-900">Incluir todos los egresados del padrón</span>
                  <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1 py-px rounded ml-1">{totalGraduados}</span>
                  <p className="text-[9.5px] text-slate-500 font-normal mt-px">
                    {incluirPendientes
                      ? 'Organiza el plano anticipadamente, incluso sin confirmar.'
                      : `Solo los ${graduadosAceptados} egresados confirmados.`}
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2 px-2.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition">
                <input type="checkbox" checked={ubicarInvitados} onChange={(e) => setUbicarInvitados(e.target.checked)} className="mt-px accent-sky-600 cursor-pointer" />
                <div className="text-[11px] leading-snug">
                  <span className="font-bold text-slate-900">Ubicar acompañantes e invitados</span>
                  <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1 py-px rounded ml-1">{totalInvitados}</span>
                  <p className="text-[9.5px] text-slate-500 font-normal mt-px">
                    Distribuye acompañantes en butacas generales disponibles.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* RESUMEN + ACCIONES */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500">Total a procesar:</span>
              <span className="text-[11px] font-black text-slate-900">
                {egresadosAProcesar} graduados {ubicarInvitados ? `+ ${totalInvitados} invitados` : ''}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCerrar}
                disabled={cargando}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                id="btn-confirmar-auto-asignar"
                type="submit"
                disabled={cargando || egresadosAProcesar === 0}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-[11px] font-black shadow-md shadow-sky-500/20 transition active:scale-95 cursor-pointer disabled:opacity-40 flex items-center gap-1"
              >
                {cargando ? (
                  <>
                    <Sparkles size={12} className="animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Ejecutar Asignación</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}
