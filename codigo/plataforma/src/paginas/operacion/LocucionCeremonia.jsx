import { useEffect, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Award, CheckCircle2, ChevronLeft, ChevronRight,
  Flag, GraduationCap, Mic, RefreshCw, ScrollText, Sparkles, UserCheck, Users, Volume2, FileText
} from 'lucide-react'
import { obtenerCeremoniaActiva, obtenerGraduados, marcarDiplomaEntregado } from '../../servicios/api'
import { FORMULAS_JURAMENTO } from '../../componentes/graduado/SeccionJuramento'
import { ModalActaCierre } from '../../componentes/ModalActaCierre'

export function LocucionCeremonia({ onVolver, onNavegar }) {
  const [ceremonia, setCeremonia] = useState(null)
  const [graduados, setGraduados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modo, setModo] = useState('JURAMENTO') // 'JURAMENTO' | 'ESTRADO'
  const [tandaJuramento, setTandaJuramento] = useState('DIOS_Y_PATRIA') // 'DIOS_Y_PATRIA' | 'PATRIA'
  const [indiceActual, setIndiceActual] = useState(0)
  const [procesando, setProcesando] = useState(false)
  const [mostrarActa, setMostrarActa] = useState(false)

  async function cargar() {
    setCargando(true)
    try {
      const [cer, grad] = await Promise.all([
        obtenerCeremoniaActiva(),
        obtenerGraduados()
      ])
      setCeremonia(cer)
      // Ordenar por carrera y nombre para el estrado
      const confirmados = grad
        .filter(g => g.estado === 'ACEPTADO')
        .sort((a, b) => {
          const compCarrera = (a.carrera || '').localeCompare(b.carrera || '')
          if (compCarrera !== 0) return compCarrera
          return (a.nombre || '').localeCompare(b.nombre || '')
        })
      setGraduados(confirmados)

      // Encontrar el primer alumno sin diploma entregado
      const primerPendiente = confirmados.findIndex(g => !g.diploma_entregado)
      if (primerPendiente !== -1) {
        setIndiceActual(primerPendiente)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  // Control por teclado para agilidad en estrado
  useEffect(() => {
    function manejarTeclado(e) {
      if (modo !== 'ESTRADO') return
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        avanzarSiguiente(true)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        retrocederAnterior()
      }
    }
    window.addEventListener('keydown', manejarTeclado)
    return () => window.removeEventListener('keydown', manejarTeclado)
  }, [modo, indiceActual, graduados])

  const graduadosDiosYPatria = graduados.filter(g => g.formula_juramento === 'DIOS_Y_PATRIA')
  const graduadosPatria = graduados.filter(g => g.formula_juramento !== 'DIOS_Y_PATRIA')

  const alumnoActual = graduados[indiceActual]
  const entregadosCount = graduados.filter(g => g.diploma_entregado).length
  const totalAlumnos = graduados.length
  const porcentaje = totalAlumnos ? Math.round((entregadosCount / totalAlumnos) * 100) : 0

  async function avanzarSiguiente(marcarEntregado = true) {
    if (!alumnoActual) return
    setProcesando(true)
    try {
      if (marcarEntregado && !alumnoActual.diploma_entregado) {
        await marcarDiplomaEntregado(alumnoActual.id, true)
        setGraduados(prev => prev.map((g, idx) => idx === indiceActual ? { ...g, diploma_entregado: true } : g))
      }
      if (indiceActual < graduados.length - 1) {
        setIndiceActual(idx => idx + 1)
      }
    } finally {
      setProcesando(false)
    }
  }

  function retrocederAnterior() {
    if (indiceActual > 0) {
      setIndiceActual(idx => idx - 1)
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin text-sky-400" size={24} />
          <span className="text-sm font-bold">Cargando libreto del estrado...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between select-none">
      {/* HEADER TELEPROMPTER */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onVolver}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Salir
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-red-400">En vivo · Conducción de Estrado</p>
            </div>
            <h1 className="text-sm font-black text-white">{ceremonia?.nombre || 'Acto de Colación'}</h1>
          </div>
        </div>

        {/* SELECTOR DE MODALIDAD (JURAMENTO / ESTRADO) */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setModo('JURAMENTO')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              modo === 'JURAMENTO' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ScrollText size={14} /> Toma de Juramento
          </button>
          <button
            onClick={() => setModo('ESTRADO')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              modo === 'ESTRADO' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic size={14} /> Entrega de Diplomas ({entregadosCount}/{totalAlumnos})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarActa(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-sm transition cursor-pointer"
          >
            <FileText size={14} /> Acta Oficial (PDF)
          </button>
        </div>
      </header>

      {/* CUERPO PRINCIPAL SEGÚN EL MODO */}
      <main className="flex-1 flex flex-col justify-center p-6 md:p-12 max-w-5xl mx-auto w-full">
        {modo === 'JURAMENTO' ? (
          /* ========================================================================= */
          /* MODO JURAMENTO PROTOCOLAR                                                 */
          /* ========================================================================= */
          <div className="space-y-8 animate-in fade-in">
            {/* TANDAS DE JURA */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setTandaJuramento('DIOS_Y_PATRIA')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition cursor-pointer border ${
                  tandaJuramento === 'DIOS_Y_PATRIA'
                    ? 'bg-sky-500 border-sky-400 text-white shadow-lg ring-4 ring-sky-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <ScrollText size={16} />
                <span>Fórmula I: Dios y Patria ({graduadosDiosYPatria.length})</span>
              </button>

              <button
                onClick={() => setTandaJuramento('PATRIA')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition cursor-pointer border ${
                  tandaJuramento === 'PATRIA'
                    ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg ring-4 ring-indigo-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Flag size={16} />
                <span>Fórmula II: Por la Patria ({graduadosPatria.length})</span>
              </button>
            </div>

            {/* INDICACIÓN PARA EL LOCUTOR */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-xs font-bold text-amber-300 uppercase tracking-widest">
                Indicación protocolar para locución:
              </p>
              <p className="text-sm font-semibold text-amber-100 mt-1">
                {tandaJuramento === 'DIOS_Y_PATRIA'
                  ? '“Se invita a ponerse de pie a los graduados que prestarán juramento por Dios y por la Patria.”'
                  : '“Se invita a ponerse de pie a los graduados que prestarán juramento por la Patria.”'}
              </p>
            </div>

            {/* TEXTO SOLEMNE EN TIPOGRAFÍA GIGANTE PARA EL RECTOR */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 md:p-10 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-[10px] font-black uppercase tracking-[.2em] text-sky-400">
                  Lectura Solemne de la Autoridad
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {tandaJuramento === 'DIOS_Y_PATRIA' ? 'Fórmula I' : 'Fórmula II'}
                </span>
              </div>

              <blockquote className="text-xl md:text-2xl lg:text-3xl font-black leading-relaxed tracking-wide text-white font-mono">
                {tandaJuramento === 'DIOS_Y_PATRIA' ? (
                  <>
                    &ldquo;¿JURÁIS POR DIOS Y LA PATRIA, AJUSTAR VUESTRA CONDUCTA AL BIEN COMÚN Y EN EL MARCO DE LA LEY, DEDICAR VUESTROS ESFUERZOS AL DESARROLLO SOSTENIBLE DE LA NACIÓN Y PONER AL SERVICIO DE LA SOCIEDAD LOS CONOCIMIENTOS DE VUESTRA PROFESIÓN?&rdquo;
                  </>
                ) : (
                  <>
                    &ldquo;¿JURÁIS POR LA PATRIA, AJUSTAR VUESTRA CONDUCTA AL BIEN COMÚN Y EN EL MARCO DE LA LEY, DEDICAR VUESTROS ESFUERZOS AL DESARROLLO SOSTENIBLE DE LA NACIÓN Y PONER AL SERVICIO DE LA SOCIEDAD LOS CONOCIMIENTOS DE VUESTRA PROFESIÓN?&rdquo;
                  </>
                )}
              </blockquote>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <span className="text-xs text-slate-400">Respuesta al unísono de los graduados:</span>
                <span className="text-lg font-black text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-xl border border-emerald-500/30">
                  ¡SÍ, JURO!
                </span>
              </div>
            </div>

            {/* NÓMINA DE GRADUADOS DE ESTA TANDA */}
            <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/50">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                Graduados de pie en esta tanda ({(tandaJuramento === 'DIOS_Y_PATRIA' ? graduadosDiosYPatria : graduadosPatria).length})
              </p>
              <div className="flex flex-wrap gap-2">
                {(tandaJuramento === 'DIOS_Y_PATRIA' ? graduadosDiosYPatria : graduadosPatria).map(g => (
                  <span key={g.id} className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700">
                    {g.nombre} ({g.carrera || 'Tecnicatura'})
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODO ESTRADO: LLAMADA CORRELATIVA AL ESCENARIO                            */
          /* ========================================================================= */
          alumnoActual ? (
            <div className="space-y-6 animate-in fade-in">
              {/* TARJETA GIGANTE DEL ALUMNO SUBIENDO AL ESTRADO */}
              <div className="relative rounded-3xl border-2 border-sky-500/50 bg-gradient-to-b from-slate-900 to-slate-950 p-8 md:p-12 shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-black uppercase tracking-wider">
                      Alumno {indiceActual + 1} de {totalAlumnos}
                    </span>
                    {alumnoActual.asiento_id && (
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
                        Butaca: {alumnoActual.asiento_id}
                      </span>
                    )}
                  </div>
                  {alumnoActual.diploma_entregado && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                      <CheckCircle2 size={14} /> Diploma Entregado
                    </span>
                  )}
                </div>

                {/* NOMBRE DEL EGRESADO GIGANTE */}
                <div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase font-sans">
                    {alumnoActual.nombre}
                  </h2>
                  <p className="text-xl md:text-2xl font-bold text-sky-400 mt-2">
                    {alumnoActual.carrera || 'Tecnicatura Superior'}
                  </p>
                </div>

                {/* DETALLES DE ESTRADO */}
                <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-slate-800">
                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Entrega de Diploma / Medalla:
                    </span>
                    <strong className="text-base font-black text-white mt-1 block">
                      {alumnoActual.entregador_nombre || 'Docente de la Institución'}
                    </strong>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Fórmula de Jura:
                    </span>
                    <strong className="text-base font-black text-sky-300 mt-1 block">
                      {FORMULAS_JURAMENTO[alumnoActual.formula_juramento]?.titulo || 'Por la Patria'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* PRÓXIMOS 3 ALUMNOS EN FILA */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                  Próximos en fila para subir:
                </span>
                <div className="flex flex-wrap gap-2">
                  {graduados.slice(indiceActual + 1, indiceActual + 4).map((prox, i) => (
                    <div key={prox.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">
                      <span className="text-slate-500 font-bold">{indiceActual + 2 + i}.</span>
                      <span>{prox.nombre}</span>
                      <span className="text-slate-500 text-[10px]">({prox.carrera})</span>
                    </div>
                  ))}
                  {indiceActual >= totalAlumnos - 1 && (
                    <span className="text-xs font-bold text-emerald-400">¡Último alumno de la nómina!</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
              <h2 className="text-2xl font-black text-white">Todos los diplomas fueron entregados</h2>
              <p className="text-sm text-slate-400">El acto de colación concluyó exitosamente.</p>
              <button
                onClick={() => setMostrarActa(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-sm font-black text-white shadow-lg transition cursor-pointer"
              >
                <FileText size={18} /> Generar y Descargar Acta Oficial (PDF)
              </button>
            </div>
          )
        )}
      </main>

      {/* FOOTER DE CONTROL / BOTONES GIGANTES DE NAVEGACIÓN */}
      <footer className="border-t border-slate-800 bg-slate-900/90 px-6 py-4 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={retrocederAnterior}
            disabled={indiceActual === 0 || modo !== 'ESTRADO'}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Alumno Anterior
          </button>

          {/* BARRA DE PROGRESO */}
          <div className="flex-1 max-w-xs hidden sm:block text-center">
            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-1">
              <span>Progreso del Acto</span>
              <span>{entregadosCount} de {totalAlumnos} ({porcentaje}%)</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full transition-all duration-300" style={{ width: `${porcentaje}%` }} />
            </div>
          </div>

          <button
            onClick={() => avanzarSiguiente(true)}
            disabled={indiceActual >= totalAlumnos - 1 && alumnoActual?.diploma_entregado}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-sm font-black text-white shadow-lg shadow-sky-500/25 transition cursor-pointer disabled:opacity-40"
          >
            <span>{alumnoActual?.diploma_entregado ? 'Siguiente Alumno' : 'Diploma Entregado (Siguiente)'}</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </footer>

      {/* MODAL DE ACTA OFICIAL DE CIERRE */}
      {mostrarActa && (
        <ModalActaCierre
          ceremonia={ceremonia}
          graduados={graduados}
          onCerrar={() => setMostrarActa(false)}
        />
      )}
    </div>
  )
}
