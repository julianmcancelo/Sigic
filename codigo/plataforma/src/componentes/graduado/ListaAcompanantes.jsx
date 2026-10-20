import {
  Users, UserCheck, Plus, AlertCircle, Edit3, Trash2, CircleCheck, ChevronRight, UserPlus, Sparkles, ArrowRight
} from 'lucide-react'

function obtenerIniciales(nombre = '') {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte.charAt(0).toUpperCase())
    .join('') || 'A'
}

export function ListaAcompanantes({
  invitados,
  maxInvitados,
  cuposRestantes,
  perfilCompleto,
  graduadoEstado,
  finalizandoInscripcion,
  onAgregar,
  onEditar,
  onEliminar,
  onFinalizar,
  onContinuarButacas
}) {
  return (
    <div className="space-y-6">
      {/* TOOLBAR Y ENCABEZADO MINIMALISTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-100/80 text-[10px] font-black uppercase tracking-wider text-sky-600">
              <Users size={12} />
              Lista de Invitados
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {invitados.length}/{maxInvitados} registrados
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-1">
            Tus Acompañantes
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed max-w-xl">
            Registrá a las personas que te acompañarán al auditorio durante la colación.
          </p>
        </div>

        {cuposRestantes > 0 && invitados.length > 0 && (
          <button
            onClick={onAgregar}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-sky-600 px-4 text-xs font-black text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Agregar acompañante</span>
          </button>
        )}
      </div>

      {/* ESTADO VACÍO — MOBILE FIRST MINIMALISTA */}
      {invitados.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200/90 bg-white/70 p-6 sm:p-10 text-center flex flex-col items-center justify-center">
          <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-sky-50 text-sky-600 mb-4 border border-sky-100/60 shadow-2xs">
            <Users size={26} strokeWidth={1.8} />
            <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-sky-600 text-white shadow-2xs">
              <Plus size={10} strokeWidth={3} />
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Todavía no agregaste acompañantes
          </h3>
          <p className="mt-1 max-w-md text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
            Podés registrar hasta {maxInvitados} personas. Si vas a asistir solo/a, también podés continuar directamente.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onAgregar}
              className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-sky-600 px-5 text-xs font-black text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Agregar acompañante</span>
            </button>

            {!perfilCompleto && (
              <button
                onClick={onFinalizar}
                disabled={finalizandoInscripcion}
                className="w-full sm:w-auto min-h-11 rounded-xl px-4 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {finalizandoInscripcion ? 'Guardando...' : 'Asistiré sin acompañantes'}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* LISTADO DE TARJETAS DE ACOMPAÑANTES */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {invitados.map(inv => (
            <article
              key={inv.id}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs transition-all hover:border-sky-200 hover:shadow-xs"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-50 to-slate-100 border border-sky-100 text-xs font-black text-sky-700">
                  {obtenerIniciales(inv.nombre)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-xs sm:text-sm font-black text-slate-800">{inv.nombre}</h3>
                    {(inv.discapacidad === 1 || inv.discapacidad === true) && (
                      <span className="rounded-md bg-indigo-50 px-1 py-0.5 text-[9px] font-bold text-indigo-600 flex items-center gap-0.5" title="Requiere ubicación accesible">
                        <AlertCircle size={10} /> Accesible
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                    {inv.relacion || 'Acompañante'} · DNI {inv.dni}
                  </p>
                  {(inv.asiento_id || inv.asiento_solicitado_id) && (
                    <span className="mt-1.5 inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700 border border-emerald-100">
                      {inv.asiento_id ? 'Butaca' : 'Asignación'} {inv.asiento_id || inv.asiento_solicitado_id}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => onEditar(inv)}
                  aria-label={`Editar a ${inv.nombre}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors cursor-pointer"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => onEliminar(inv.id)}
                  aria-label={`Eliminar a ${inv.nombre}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* BANNER INFERIOR DE CONFIRMACIÓN O CONTINUIDAD */}
      {(invitados.length > 0 || perfilCompleto) && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
              perfilCompleto 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : 'bg-sky-50 text-sky-600 border-sky-100'
            }`}>
              <CircleCheck size={18} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-800">
                {perfilCompleto ? 'Acompañantes registrados' : '¿Tu lista de acompañantes está completa?'}
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {cuposRestantes > 0 
                  ? `Tenés ${cuposRestantes} ${cuposRestantes === 1 ? 'cupo disponible' : 'cupos disponibles'} de un total de ${maxInvitados}.` 
                  : 'Completaste el límite máximo de acompañantes.'}
              </p>
            </div>
          </div>

          <button
            onClick={onFinalizar}
            disabled={finalizandoInscripcion}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-emerald-600 px-5 text-xs font-black uppercase tracking-wider text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shrink-0"
          >
            <span>{finalizandoInscripcion ? 'Guardando...' : 'Revisar y Continuar'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
