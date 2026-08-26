import { useState } from 'react'
import { Check, CheckCircle2, Flag, LoaderCircle, ScrollText, Sparkles } from 'lucide-react'
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
    <div className="space-y-6 max-w-3xl mx-auto font-sans">
      {/* ENCABEZADO */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[9px] font-black uppercase tracking-wider">
            Protocolo Académico
          </span>
        </div>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
          Juramento y Compromiso Profesional
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-500 leading-relaxed">
          Durante la ceremonia de colación realizarás la jura solemne de tu título. Elegí la fórmula protocolar bajo la cual prestarás juramento frente a las autoridades institucionales.
        </p>
      </div>

      {mensaje && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{mensaje}</span>
        </div>
      )}

      {/* TARJETAS DE FÓRMULA OFICIAL */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* OPCION 1: DIOS Y PATRIA */}
        <div
          onClick={() => guardarFormula('DIOS_Y_PATRIA')}
          className={`relative rounded-3xl border-2 p-6 transition-all cursor-pointer flex flex-col justify-between ${
            formulaSeleccionada === 'DIOS_Y_PATRIA'
              ? 'border-sky-500 bg-sky-50/30 shadow-lg ring-4 ring-sky-100 scale-[1.01]'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-100 text-sky-700 font-black">
                <ScrollText size={20} />
              </span>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  formulaSeleccionada === 'DIOS_Y_PATRIA'
                    ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {formulaSeleccionada === 'DIOS_Y_PATRIA' && <Check size={14} strokeWidth={3} />}
              </div>
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider text-sky-600">Fórmula I</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              Por Dios y por La Patria
            </h3>

            {/* TEXTO OFICIAL EN RECUADRO */}
            <div className="mt-4 p-4 rounded-2xl bg-white/90 border border-slate-150 shadow-xs">
              <p className="font-mono text-xs font-semibold uppercase leading-relaxed text-slate-700">
                &ldquo;JURO POR DIOS Y LA PATRIA, AJUSTAR MI CONDUCTA AL BIEN COMÚN Y EN EL MARCO DE LA LEY, DEDICAR MIS ESFUERZOS AL DESARROLLO SOSTENIBLE DE LA NACIÓN Y PONER AL SERVICIO DE LA SOCIEDAD LOS CONOCIMIENTOS DE MI PROFESIÓN.&rdquo;
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-slate-400">Respuesta en estrado:</span>
            <span className="font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">¡Sí, juro!</span>
          </div>
        </div>

        {/* OPCION 2: POR LA PATRIA */}
        <div
          onClick={() => guardarFormula('PATRIA')}
          className={`relative rounded-3xl border-2 p-6 transition-all cursor-pointer flex flex-col justify-between ${
            formulaSeleccionada === 'PATRIA'
              ? 'border-indigo-500 bg-indigo-50/30 shadow-lg ring-4 ring-indigo-100 scale-[1.01]'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-100 text-indigo-700 font-black">
                <Flag size={20} />
              </span>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  formulaSeleccionada === 'PATRIA'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {formulaSeleccionada === 'PATRIA' && <Check size={14} strokeWidth={3} />}
              </div>
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Fórmula II</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              Por La Patria
            </h3>

            {/* TEXTO OFICIAL EN RECUADRO */}
            <div className="mt-4 p-4 rounded-2xl bg-white/90 border border-slate-150 shadow-xs">
              <p className="font-mono text-xs font-semibold uppercase leading-relaxed text-slate-700">
                &ldquo;JURO POR LA PATRIA, AJUSTAR MI CONDUCTA AL BIEN COMÚN Y EN EL MARCO DE LA LEY, DEDICAR MIS ESFUERZOS AL DESARROLLO SOSTENIBLE DE LA NACIÓN Y PONER AL SERVICIO DE LA SOCIEDAD LOS CONOCIMIENTOS DE MI PROFESIÓN.&rdquo;
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-slate-400">Respuesta en estrado:</span>
            <span className="font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">¡Sí, juro!</span>
          </div>
        </div>
      </div>

      {/* CAMPO DE COMENTARIOS Y CONSULTAS ADICIONALES (COMO EN EL FORMULARIO OFICIAL) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
          Comentarios o consultas adicionales para la organización (opcional)
        </label>
        <textarea
          rows={3}
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          placeholder="Dejanos cualquier duda o requerimiento especial para el acto..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => guardarFormula(formulaSeleccionada, comentarios)}
            disabled={guardando}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-sky-600 px-5 py-2.5 text-xs font-black text-white shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            {guardando ? <LoaderCircle size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{guardando ? 'Guardando...' : 'Guardar comentarios'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
