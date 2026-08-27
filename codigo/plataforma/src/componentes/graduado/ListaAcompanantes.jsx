import {
  Users, UserCheck, Plus, AlertCircle, Edit3, Trash2, CircleCheck, ChevronRight
} from 'lucide-react'

function obtenerIniciales(nombre = '') {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte.charAt(0).toUpperCase())
    .join('') || 'G'
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
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Toolbar superior */}
      <div className="sigic-guest-toolbar flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-50 text-sky-600">
              <UserCheck size={17} />
            </span>
            <h2 className="text-xl font-black text-slate-800">Acompañantes</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-500">
              {invitados.length}/{maxInvitados}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Administrá las personas que asistirán con vos.</p>
        </div>
        {cuposRestantes > 0 && invitados.length > 0 && (
          <button
            onClick={onAgregar}
            className="sigic-guest-add-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 active:scale-[.98]"
          >
            <Plus size={15} /> Agregar acompañante
          </button>
        )}
      </div>

      {/* Estado vacío o listado de tarjetas */}
      {invitados.length === 0 ? (
        <div className="flex min-h-[230px] flex-col items-center justify-center px-4 py-8 text-center">
          <div className="relative grid h-20 w-20 place-items-center rounded-[24px] bg-sky-50 text-sky-500">
            <Users size={32} strokeWidth={1.7} />
            <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full border-4 border-white bg-sky-500 text-white">
              <Plus size={12} strokeWidth={3} />
            </span>
          </div>
          <h3 className="mt-5 text-lg font-black text-slate-800">Todavía no agregaste acompañantes</h3>
          <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
            Podés cargar hasta {maxInvitados}. Si vas a asistir solo, también podés cerrar el grupo ahora.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={onAgregar}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-xs font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600"
            >
              <Plus size={15} /> Agregar acompañante
            </button>
            {!perfilCompleto && (
              <button
                onClick={onFinalizar}
                disabled={finalizandoInscripcion}
                className="min-h-11 rounded-xl px-5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 disabled:opacity-60"
              >
                {finalizandoInscripcion ? 'Guardando...' : 'Continuar sin acompañantes'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="sigic-guest-list mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {invitados.map(inv => (
            <article
              key={inv.id}
              className="sigic-guest-card group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-sky-200 hover:shadow-md"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sm font-black text-sky-600">
                  {obtenerIniciales(inv.nombre)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-black text-slate-800">{inv.nombre}</h3>
                    {(inv.discapacidad === 1 || inv.discapacidad === true) && (
                      <span className="rounded-md bg-indigo-50 p-1 text-indigo-600" title="Requiere ubicación accesible">
                        <AlertCircle size={12} />
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
                    {inv.relacion || 'Acompañante'} · DNI {inv.dni}
                  </p>
                  {(inv.asiento_id || inv.asiento_solicitado_id) && (
                    <span className="mt-2 inline-flex rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700">
                      {inv.asiento_id ? 'Butaca' : 'Propuesta'} {inv.asiento_id || inv.asiento_solicitado_id}
                    </span>
                  )}
                </div>
              </div>
              <div className="sigic-guest-card-actions flex shrink-0 gap-1">
                <button
                  onClick={() => onEditar(inv)}
                  aria-label={`Editar a ${inv.nombre}`}
                  title="Editar"
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => onEliminar(inv.id)}
                  aria-label={`Eliminar a ${inv.nombre}`}
                  title="Eliminar"
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Banner de confirmación de grupo */}
      {(invitados.length > 0 || perfilCompleto) && (
        <div
          className={`mt-5 flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
            perfilCompleto ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                perfilCompleto ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'
              }`}
            >
              <CircleCheck size={18} />
            </span>
            <div>
              <h3 className="text-xs font-black text-slate-800">
                {perfilCompleto ? 'Tu grupo quedó guardado' : '¿Tu grupo ya está listo?'}
              </h3>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                {perfilCompleto
                  ? 'Podés editarlo si necesitás hacer un cambio.'
                  : `${cuposRestantes} ${cuposRestantes === 1 ? 'lugar disponible' : 'lugares disponibles'} antes de continuar.`}
              </p>
            </div>
          </div>
          {perfilCompleto ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100/80 text-emerald-800 rounded-xl text-xs font-black">
                <CircleCheck size={14} /> Grupo Confirmado
              </span>
            </div>
          ) : (
            <button
              onClick={onFinalizar}
              disabled={finalizandoInscripcion}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-sky-600 active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {finalizandoInscripcion ? 'Guardando...' : 'Guardar y confirmar grupo'} <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
