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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight leading-none">Auto-Asignar Butacas</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Configuración del algoritmo de ubicación inteligente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer disabled:opacity-30"
          >
            <X size={15} />
          </button>
        </div>

        {/* CONTENIDO DEL FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-slate-700">
          
          {/* SECCIÓN 1: CRITERIO DE ORDENAMIENTO */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ArrowUpDown size={12} className="text-sky-500" />
              1. Criterio de Ordenamiento Principal
            </label>

            <div className="grid grid-cols-1 gap-2">
              {/* Opción A: Por Fórmula de Juramento */}
              <div
                onClick={() => setCriterio('JURAMENTO')}
                className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col gap-1.5 ${
                  criterio === 'JURAMENTO'
                    ? 'border-sky-500 bg-sky-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs text-slate-900">
                    <ScrollText size={14} className={criterio === 'JURAMENTO' ? 'text-sky-600' : 'text-slate-500'} />
                    <span>Por Fórmula de Juramento</span>
                    <span className="text-[9px] bg-sky-100 text-sky-700 font-black px-1.5 py-0.5 rounded uppercase">Protocolar</span>
                  </div>
                  <input
                    type="radio"
                    name="criterio"
                    checked={criterio === 'JURAMENTO'}
                    onChange={() => setCriterio('JURAMENTO')}
                    className="accent-sky-600 cursor-pointer"
                  />
                </div>
                <p className="text-[10.5px] text-slate-500 leading-snug">
                  Agrupa y sienta primero a los graduados según su juramento para agilizar la toma conjunta sobre el escenario.
                </p>

                {criterio === 'JURAMENTO' && (
                  <div className="mt-1 pt-2 border-t border-sky-100 flex flex-col gap-1.5 animate-in slide-in-from-top-1 duration-150">
                    <span className="text-[10px] font-bold text-sky-900">Orden de bloques de juramento:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPrioridadJuramento('DIOS_Y_PATRIA_PRIMERO')}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black text-left transition border cursor-pointer ${
                          prioridadJuramento === 'DIOS_Y_PATRIA_PRIMERO'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        1° Dios y Patria<br />
                        <span className="text-[8.5px] font-semibold opacity-85">2° Por la Patria</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPrioridadJuramento('PATRIA_PRIMERO')}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black text-left transition border cursor-pointer ${
                          prioridadJuramento === 'PATRIA_PRIMERO'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        1° Por la Patria<br />
                        <span className="text-[8.5px] font-semibold opacity-85">2° Dios y Patria</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Opción B: Por Carrera y Alfabético */}
              <div
                onClick={() => setCriterio('CARRERA')}
                className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col gap-1 ${
                  criterio === 'CARRERA'
                    ? 'border-sky-500 bg-sky-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs text-slate-900">
                    <GraduationCap size={14} className={criterio === 'CARRERA' ? 'text-indigo-600' : 'text-slate-500'} />
                    <span>Por Carrera Académica</span>
                  </div>
                  <input
                    type="radio"
                    name="criterio"
                    checked={criterio === 'CARRERA'}
                    onChange={() => setCriterio('CARRERA')}
                    className="accent-sky-600 cursor-pointer"
                  />
                </div>
                <p className="text-[10.5px] text-slate-500 leading-snug">
                  Agrupa por titulación académica y los ordena alfabéticamente dentro de cada bloque.
                </p>
              </div>

              {/* Opción C: Alfabético Puro */}
              <div
                onClick={() => setCriterio('ALFABETICO')}
                className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col gap-1 ${
                  criterio === 'ALFABETICO'
                    ? 'border-sky-500 bg-sky-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs text-slate-900">
                    <ArrowDownAZ size={14} className={criterio === 'ALFABETICO' ? 'text-emerald-600' : 'text-slate-500'} />
                    <span>Alfabético Estricto (A-Z)</span>
                  </div>
                  <input
                    type="radio"
                    name="criterio"
                    checked={criterio === 'ALFABETICO'}
                    onChange={() => setCriterio('ALFABETICO')}
                    className="accent-sky-600 cursor-pointer"
                  />
                </div>
                <p className="text-[10.5px] text-slate-500 leading-snug">
                  Orden alfabético global de todos los egresados independientemente de juramento o carrera.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: ALCANCE DE GRADUADOS Y ACOMPAÑANTES */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users size={12} className="text-indigo-500" />
              2. Alcance y Ubicación
            </label>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={incluirPendientes}
                  onChange={(e) => setIncluirPendientes(e.target.checked)}
                  className="mt-0.5 accent-sky-600 cursor-pointer rounded"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Incluir todos los egresados del padrón</span>
                    <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.2 rounded">
                      {totalGraduados} alumnos
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-normal leading-snug mt-0.5">
                    {incluirPendientes
                      ? 'Recomendado: Organiza el plano completo anticipadamente, incluso egresados aún sin confirmar.'
                      : `Solo se ubicarán los ${graduadosAceptados} egresados con asistencia confirmada.`}
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={ubicarInvitados}
                  onChange={(e) => setUbicarInvitados(e.target.checked)}
                  className="mt-0.5 accent-sky-600 cursor-pointer rounded"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Ubicar acompañantes e invitados</span>
                    <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.2 rounded">
                      {totalInvitados} acompañantes
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-normal leading-snug mt-0.5">
                    Distribuye a los acompañantes en butacas generales disponibles del auditorio.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* RESUMEN PREVIO */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-[11px] font-semibold text-slate-600">Total a procesar:</span>
            <span className="text-xs font-black text-slate-900">
              {egresadosAProcesar} graduados {ubicarInvitados ? `+ ${totalInvitados} invitados` : ''}
            </span>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onCerrar}
              disabled={cargando}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
            >
              Cancelar
            </button>

            <button
              id="btn-confirmar-auto-asignar"
              type="submit"
              disabled={cargando || egresadosAProcesar === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-black shadow-md shadow-sky-500/20 transition active:scale-95 cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
            >
              {cargando ? (
                <>
                  <Sparkles size={13} className="animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Ejecutar Asignación</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
