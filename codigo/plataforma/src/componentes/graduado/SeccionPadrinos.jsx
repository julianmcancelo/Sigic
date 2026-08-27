import {
  GraduationCap, Users, Trash2, Plus, X, CheckCircle
} from 'lucide-react'

export function SeccionPadrinos({
  entregadores,
  profesores,
  invitados,
  procesando,
  mostrarSelector,
  setMostrarSelector,
  onAgregar,
  onEliminar
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-800 mb-2">Seleccioná tus Padrinos</h2>
        <p className="text-sm font-medium text-slate-500">
          Elegí hasta 3 personas que te entreguen el título, entre profesores de la institución y tus familiares invitados.
        </p>
      </div>

      {/* Slots de entregadores (1°, 2°, 3°) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map(orden => {
          const entregadorActual = entregadores.find(e => Number(e.orden) === Number(orden))

          return (
            <div
              key={orden}
              className={`bg-white rounded-3xl border-2 p-6 transition-all ${
                entregadorActual ? 'border-indigo-200 shadow-lg' : 'border-dashed border-slate-200'
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4">
                {orden}° Padrino
              </p>

              {entregadorActual ? (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black shadow-lg ${
                        entregadorActual.tipo === 'PROFESOR'
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                          : 'bg-gradient-to-br from-sky-500 to-cyan-600'
                      }`}
                    >
                      {entregadorActual.nombre?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{entregadorActual.nombre}</p>
                      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {entregadorActual.tipo === 'PROFESOR' ? <GraduationCap size={12} /> : <Users size={12} />}
                        {entregadorActual.tipo === 'PROFESOR' ? 'Profesor' : 'Familiar'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onEliminar(entregadorActual.id)}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 hover:text-red-600 transition-all"
                  >
                    <Trash2 size={12} /> Quitar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setMostrarSelector(true)}
                  disabled={entregadores.length >= 3}
                  className="w-full flex flex-col items-center justify-center py-8 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-2xl transition-all disabled:opacity-30"
                >
                  <Plus size={32} className="mb-2" />
                  <span className="text-xs font-bold">Agregar padrino</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Selector de entregador (modal inline) */}
      {mostrarSelector && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-400">Elegí un padrino</p>
            <button
              onClick={() => setMostrarSelector(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            {/* Sección Profesores */}
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">
              <GraduationCap size={13} /> Profesores de la institución
            </p>
            {profesores.length === 0 ? (
              <p className="text-xs text-slate-400 mb-6">No hay profesores cargados en el sistema.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {profesores.map(prof => {
                  const yaAsignado = entregadores.some(e => e.profesor_id === prof.id)
                  return (
                    <button
                      key={prof.id}
                      onClick={() => onAgregar('PROFESOR', prof)}
                      disabled={yaAsignado || procesando}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        yaAsignado
                          ? 'bg-slate-50 opacity-40 cursor-not-allowed'
                          : 'hover:bg-indigo-50 hover:border-indigo-300 border border-slate-100'
                      }`}
                    >
                      <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {prof.nombre?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{prof.nombre}</p>
                        {prof.materia && <p className="text-[10px] text-slate-400">{prof.materia}</p>}
                      </div>
                      {yaAsignado && (
                        <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-emerald-500">
                          <CheckCircle size={11} /> Asignado
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Sección Familiares */}
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-sky-500 mb-3">
              <Users size={13} /> Mis invitados
            </p>
            {invitados.length === 0 ? (
              <p className="text-xs text-slate-400">
                Primero cargá invitados en la pestaña &quot;Acompañantes&quot;.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {invitados.map(inv => {
                  const yaAsignado = entregadores.some(e => e.invitado_id === inv.id)
                  return (
                    <button
                      key={inv.id}
                      onClick={() => onAgregar('FAMILIAR', inv)}
                      disabled={yaAsignado || procesando}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        yaAsignado
                          ? 'bg-slate-50 opacity-40 cursor-not-allowed'
                          : 'hover:bg-sky-50 hover:border-sky-300 border border-slate-100'
                      }`}
                    >
                      <div className="h-9 w-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {inv.nombre?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{inv.nombre}</p>
                        <p className="text-[10px] text-slate-400">{inv.relacion}</p>
                      </div>
                      {yaAsignado && (
                        <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-emerald-500">
                          <CheckCircle size={11} /> Asignado
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
