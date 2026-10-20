import { useState } from 'react'
import { Check, CheckCircle2, Flag, LoaderCircle, ScrollText, Sparkles, BookOpen, MessageSquare } from 'lucide-react'
import { actualizarJuramentoGraduado } from '../../servicios/api'

export const FORMULAS_JURAMENTO = {
  DIOS_Y_PATRIA: {
    id: 'DIOS_Y_PATRIA',
    titulo: 'Por Dios y por La Patria',
    subtitulo: 'Fórmula tradicional',
    textoCompleto: 'JURO POR DIOS Y LA PATRIA, AJUSTAR MI CONDUCTA AL BIEN COMUN Y EN EL MARCO DE LA LEY, DEDICAR MIS ESFUERZOS AL DESARROLLO SOSTENIBLE DE LA NACION Y PONER AL SERVICIO DE LA SOCIEDAD LOS CONOCIMIENTOS DE MI PROFESION.',
    etiquetaCorta: 'Dios y Patria'
  },
  PATRIA: {
    id: 'PATRIA',
    titulo: 'Por La Patria',
    subtitulo: 'Fórmula cívica',
    textoCompleto: 'JURO POR LA PATRIA, AJUSTAR MI CONDUCTA AL BIEN COMUN Y EN EL MARCO DE LA LEY, DEDICAR MIS ESFUERZOS AL DESARROLLO SOSTENIBLE DE LA NACION Y PONER AL SERVICIO DE LA SOCIEDAD LOS CONOCIMIENTOS DE MI PROFESION.',
    etiquetaCorta: 'Por la Patria'
  }
}

export function SeccionJuramento({ graduado, onActualizar }) {
  const [formulaSeleccionada, setFormulaSeleccionada] = useState(
    graduado?.formula_juramento === 'DIOS_Y_PATRIA' ? 'DIOS_Y_PATRIA' : 'PATRIA'
  )
  const [comentarios, setComentarios] = useState(graduado?.comentarios || '')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  async function guardarFormula(nuevaFormula, nuevosComentarios = comentarios) {
    setFormulaSeleccionada(nuevaFormula)
    setGuardando(true)
    setMensaje('')
    try {
      await actualizarJuramentoGraduado(graduado.id, nuevaFormula, nuevosComentarios)
      setMensaje('Tu elección de juramento quedó registrada correctamente.')
      if (onActualizar) onActualizar({ formula_juramento: nuevaFormula, comentarios: nuevosComentarios })
    } catch (err) {
      setMensaje('No se pudo guardar la elección. Por favor, reintentá.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ENCABEZADO MINIMALISTA */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-100/80 text-[10px] font-black uppercase tracking-wider text-sky-600">
            <BookOpen size={12} />
            Protocolo Académico
          </span>
          <span className="text-[11px] font-bold text-slate-400">
            Fórmula seleccionada: {FORMULAS_JURAMENTO[formulaSeleccionada]?.etiquetaCorta}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-1">
          Fórmula de Juramento
        </h2>
        <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed max-w-xl">
          Elegí la fórmula protocolar bajo la cual prestarás juramento frente a las autoridades en el acto.
        </p>
      </div>

      {mensaje && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>{mensaje}</span>
        </div>
      )}

      {/* TARJETAS DE FÓRMULA OFICIAL (MOBILE FIRST GRID) */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        {/* OPCION 1: DIOS Y PATRIA */}
        <div
          id="tarjeta-formula-dios-patria"
          onClick={() => guardarFormula('DIOS_Y_PATRIA')}
          className={`relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            formulaSeleccionada === 'DIOS_Y_PATRIA'
              ? 'border-sky-500 bg-sky-50/30 shadow-xs ring-2 ring-sky-500/20'
              : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/40 shadow-2xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-sky-600">
                Fórmula I
              </span>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  formulaSeleccionada === 'DIOS_Y_PATRIA'
                    ? 'border-sky-600 bg-sky-600 text-white shadow-2xs'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {formulaSeleccionada === 'DIOS_Y_PATRIA' && <Check size={12} strokeWidth={3} />}
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Por Dios y por La Patria
            </h3>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Fórmula tradicional
            </p>

            <div className="mt-3.5 p-3.5 rounded-xl bg-white border border-slate-150/80 shadow-2xs">
              <p className="text-[11px] font-medium leading-relaxed text-slate-700 font-mono uppercase">
                &ldquo;JURO POR DIOS Y LA PATRIA, AJUSTAR MI CONDUCTA AL BIEN COMÚN Y EN EL MARCO DE LA LEY, DEDICAR MIS ESFUERZOS AL DESARROLLO SOSTENIBLE DE LA NACIÓN Y PONER AL SERVICIO DE LA SOCIEDAD LOS CONOCIMIENTOS DE MI PROFESIÓN.&rdquo;
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-slate-400">Respuesta en estrado:</span>
            <span className="font-black text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md text-[11px]">
              ¡Sí, juro!
            </span>
          </div>
        </div>

        {/* OPCION 2: POR LA PATRIA */}
        <div
          id="tarjeta-formula-patria"
          onClick={() => guardarFormula('PATRIA')}
          className={`relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            formulaSeleccionada === 'PATRIA'
              ? 'border-indigo-500 bg-indigo-50/30 shadow-xs ring-2 ring-indigo-500/20'
              : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/40 shadow-2xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                Fórmula II
              </span>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  formulaSeleccionada === 'PATRIA'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {formulaSeleccionada === 'PATRIA' && <Check size={12} strokeWidth={3} />}
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Por La Patria
            </h3>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Fórmula cívica
            </p>

            <div className="mt-3.5 p-3.5 rounded-xl bg-white border border-slate-150/80 shadow-2xs">
              <p className="text-[11px] font-medium leading-relaxed text-slate-700 font-mono uppercase">
                &ldquo;JURO POR LA PATRIA, AJUSTAR MI CONDUCTA AL BIEN COMÚN Y EN EL MARCO DE LA LEY, DEDICAR MIS ESFUERZOS AL DESARROLLO SOSTENIBLE DE LA NACIÓN Y PONER AL SERVICIO DE LA SOCIEDAD LOS CONOCIMIENTOS DE MI PROFESIÓN.&rdquo;
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-slate-400">Respuesta en estrado:</span>
            <span className="font-black text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md text-[11px]">
              ¡Sí, juro!
            </span>
          </div>
        </div>
      </div>

      {/* COMENTARIOS ADICIONALES */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-slate-400" />
          <label className="text-xs font-black text-slate-800">
            Observaciones o consultas para la organización (opcional)
          </label>
        </div>
        <textarea
          id="textarea-juramento-comentarios"
          rows={3}
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          placeholder="Dejanos cualquier duda o requerimiento especial para el acto..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/10"
        />
        <div className="flex justify-end">
          <button
            id="btn-guardar-juramento"
            type="button"
            onClick={() => guardarFormula(formulaSeleccionada, comentarios)}
            disabled={guardando}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-900 hover:bg-sky-600 px-4 text-xs font-black text-white shadow-2xs transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {guardando ? <LoaderCircle size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{guardando ? 'Guardando...' : 'Guardar observaciones'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
