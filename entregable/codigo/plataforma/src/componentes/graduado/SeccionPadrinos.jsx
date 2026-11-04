import { useState, useMemo } from 'react'
import {
  GraduationCap, Users, Trash2, Plus, X, CheckCircle2, Search, HeartHandshake, ChevronRight, ArrowRight, Sparkles
} from 'lucide-react'

export function SeccionPadrinos({
  entregadores,
  profesores,
  invitados,
  procesando,
  mostrarSelector,
  setMostrarSelector,
  onAgregar,
  onEliminar,
  onRevisarFinal
}) {
  const [tabSelector, setTabSelector] = useState('PROFESORES') // 'PROFESORES' | 'INVITADOS'
  const [busqueda, setBusqueda] = useState('')

  const profesoresFiltrados = useMemo(() => {
    if (!busqueda.trim()) return profesores
    const q = busqueda.toLowerCase().trim()
    return profesores.filter(p => 
      p.nombre?.toLowerCase().includes(q) || 
      p.materia?.toLowerCase().includes(q)
    )
  }, [profesores, busqueda])

  const invitadosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return invitados
    const q = busqueda.toLowerCase().trim()
    return invitados.filter(i => 
      i.nombre?.toLowerCase().includes(q) || 
      i.relacion?.toLowerCase().includes(q)
    )
  }, [invitados, busqueda])

  return (
    <div className="space-y-6">
      {/* TÍTULO Y DESCRIPCIÓN MINIMALISTA */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-[10px] font-black uppercase tracking-wider text-indigo-600">
            <HeartHandshake size={12} />
            Entrega de Diploma
          </span>
          <span className="text-[11px] font-bold text-slate-400">
            {entregadores.length}/3 asignados
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-1">
          Elegí tus Padrinos
        </h2>
        <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed max-w-2xl">
          Podés asignar hasta 3 personas para que suban al estrado a entregarte el título: tus docentes del Beltrán o tus acompañantes.
        </p>
      </div>

      {/* SLOTS DE PADRINOS — MOBILE-FIRST GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[1, 2, 3].map(orden => {
          const entregadorActual = entregadores.find(e => Number(e.orden) === Number(orden))

          return (
            <div
              key={orden}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${
                entregadorActual 
                  ? 'border-indigo-100 bg-gradient-to-b from-indigo-50/40 via-white to-white p-4 shadow-2xs' 
                  : 'border-dashed border-slate-200 bg-slate-50/50 p-4 hover:border-indigo-300 hover:bg-indigo-50/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/80">
                  {orden}° Entrega
                </span>
                {entregadorActual && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {entregadorActual.tipo === 'PROFESOR' ? <GraduationCap size={10} /> : <Users size={10} />}
                    {entregadorActual.tipo === 'PROFESOR' ? 'Docente' : 'Familiar'}
                  </span>
                )}
              </div>

              {entregadorActual ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-2xs ${
                        entregadorActual.tipo === 'PROFESOR'
                          ? 'bg-gradient-to-br from-indigo-500 to-indigo-700'
                          : 'bg-gradient-to-br from-sky-500 to-sky-700'
                      }`}
                    >
                      {entregadorActual.nombre?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 text-sm truncate">{entregadorActual.nombre}</p>
                      <p className="text-[11px] font-medium text-slate-400 truncate">
                        {entregadorActual.tipo === 'PROFESOR' ? 'Cuerpo Docente' : 'Acompañante'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onEliminar(entregadorActual.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 text-rose-600 rounded-xl text-[11px] font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Quitar</span>
                  </button>
                </div>
              ) : (
                <button
                  id={orden === 1 ? 'btn-agregar-padrino' : undefined}
                  onClick={() => setMostrarSelector(true)}
                  disabled={entregadores.length >= 3}
                  className="w-full flex flex-row sm:flex-col items-center justify-center gap-2 py-4 text-slate-500 hover:text-indigo-600 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-500 shadow-2xs">
                    <Plus size={16} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-bold">Asignar persona</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* SELECTOR MODAL FLOTANTE (ESTILO MODAL CENTRADO EN DESKTOP / BOTTOM SHEET EN MÓVIL) */}
      {mostrarSelector && (
        <div className="fixed inset-0 z-[70] grid place-items-end sm:place-items-center bg-slate-950/50 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-xl max-h-[90vh] sm:max-h-[82vh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-300">
            
            {/* Header del modal */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-400">
                  Selección de Padrino
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                  ¿Quién te entregará el título?
                </h3>
              </div>
              <button
                id="btn-cerrar-selector-padrinos"
                onClick={() => { setMostrarSelector(false); setBusqueda(''); }}
                className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Pestañas de origen y barra de búsqueda */}
            <div className="p-4 pb-2 border-b border-slate-100 bg-slate-50/50 space-y-3">
              <div className="grid grid-cols-2 gap-1.5 bg-slate-200/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTabSelector('PROFESORES')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    tabSelector === 'PROFESORES'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap size={14} className={tabSelector === 'PROFESORES' ? 'text-indigo-600' : ''} />
                  <span>Profesores ({profesores.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTabSelector('INVITADOS')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    tabSelector === 'INVITADOS'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users size={14} className={tabSelector === 'INVITADOS' ? 'text-sky-600' : ''} />
                  <span>Mis Invitados ({invitados.length})</span>
                </button>
              </div>

              {/* Buscador de personas */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder={tabSelector === 'PROFESORES' ? 'Buscar docente por nombre o materia...' : 'Buscar invitado por nombre...'}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Listado scrolleable optimizado */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
              {tabSelector === 'PROFESORES' && (
                profesoresFiltrados.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs font-semibold text-slate-400">
                      {busqueda ? 'No se encontraron profesores con esa búsqueda.' : 'No hay profesores registrados en el sistema.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {profesoresFiltrados.map((prof, pIdx) => {
                      const yaAsignado = entregadores.some(e => e.profesor_id === prof.id)
                      return (
                        <button
                          key={prof.id}
                          id={pIdx === 0 ? 'btn-elegir-primer-profesor' : undefined}
                          onClick={() => { onAgregar('PROFESOR', prof); setMostrarSelector(false); setBusqueda(''); }}
                          disabled={yaAsignado || procesando}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                            yaAsignado
                              ? 'bg-slate-50/70 opacity-50 cursor-not-allowed'
                              : 'hover:bg-indigo-50/60 active:scale-[0.99] border border-transparent hover:border-indigo-100 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">
                              {prof.nombre?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{prof.nombre}</p>
                              {prof.materia ? (
                                <p className="text-[10px] text-slate-400 truncate">{prof.materia}</p>
                              ) : (
                                <p className="text-[10px] text-slate-400">Docente Beltrán</p>
                              )}
                            </div>
                          </div>

                          {yaAsignado ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
                              <CheckCircle2 size={11} /> Asignado
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 shrink-0 flex items-center gap-1">
                              Elegir <ChevronRight size={12} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              )}

              {tabSelector === 'INVITADOS' && (
                invitadosFiltrados.length === 0 ? (
                  <div className="py-8 text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-400">
                      {busqueda ? 'No se encontraron invitados con esa búsqueda.' : 'Aún no tenés acompañantes registrados.'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Podés cargarlos primero en la pestaña &quot;Acompañantes&quot;.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {invitadosFiltrados.map(inv => {
                      const yaAsignado = entregadores.some(e => e.invitado_id === inv.id)
                      return (
                        <button
                          key={inv.id}
                          onClick={() => { onAgregar('FAMILIAR', inv); setMostrarSelector(false); setBusqueda(''); }}
                          disabled={yaAsignado || procesando}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                            yaAsignado
                              ? 'bg-slate-50/70 opacity-50 cursor-not-allowed'
                              : 'hover:bg-sky-50/60 active:scale-[0.99] border border-transparent hover:border-sky-100 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 shrink-0 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs border border-sky-100">
                              {inv.nombre?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{inv.nombre}</p>
                              <p className="text-[10px] text-slate-400 truncate">{inv.relacion || 'Acompañante'}</p>
                            </div>
                          </div>

                          {yaAsignado ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
                              <CheckCircle2 size={11} /> Asignado
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 shrink-0 flex items-center gap-1">
                              Elegir <ChevronRight size={12} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              )}
            </div>

            {/* Footer de selector */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => { setMostrarSelector(false); setBusqueda(''); }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANNER DE REVISIÓN Y CONFIRMACIÓN MINIMALISTA */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <GraduationCap size={18} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-800">
              {entregadores.length > 0 ? `${entregadores.length} de 3 padrinos asignados` : '¿Preferís no designar padrinos?'}
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {entregadores.length > 0
                ? 'Listo para revisar el resumen consolidado de tu inscripción.'
                : 'Podés continuar sin padrinos. La entrega del título la realizará la autoridad protocolar.'}
            </p>
          </div>
        </div>
        
        {typeof onRevisarFinal === 'function' && (
          <button
            id="btn-revisar-final-padrinos"
            type="button"
            onClick={onRevisarFinal}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-emerald-600 px-5 text-xs font-black uppercase tracking-wider text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <span>Revisar y Confirmar</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
