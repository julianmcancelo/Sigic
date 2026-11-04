import { AlertCircle, ChevronRight, X } from 'lucide-react'

export function FormularioAcompanante({
  datosForm,
  setDatosForm,
  editandoId,
  procesando,
  onSubmit,
  onCancelar
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-600">Datos del acompañante</span>
          <h2 className="text-xl font-black text-slate-800">
            {editandoId ? 'Editar acompañante' : 'Nuevo acompañante'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">Solo el nombre y el documento son obligatorios.</p>
        </div>
        <button
          onClick={onCancelar}
          aria-label="Cerrar formulario"
          className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-5">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Nombre y apellido</span>
            <input
              type="text"
              required
              placeholder="Ej. María Pérez"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              value={datosForm.nombre}
              onChange={e => setDatosForm({ ...datosForm, nombre: e.target.value })}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">DNI / Pasaporte</span>
            <input
              type="text"
              required
              placeholder="Sin puntos"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              value={datosForm.dni}
              onChange={e => setDatosForm({ ...datosForm, dni: e.target.value })}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Vínculo</span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              value={datosForm.relacion}
              onChange={e => setDatosForm({ ...datosForm, relacion: e.target.value })}
            >
              <option value="Acompañante">Acompañante</option>
              <option value="Padre/Madre">Padre / Madre</option>
              <option value="Hermano/a">Hermano / Hermana</option>
              <option value="Pareja">Pareja</option>
              <option value="Otro">Otro familiar</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
              Teléfono <span className="font-semibold normal-case tracking-normal text-slate-400">(opcional)</span>
            </span>
            <input
              type="tel"
              inputMode="tel"
              placeholder="Ej. 11 5555 5555"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              value={datosForm.telefono}
              onChange={e => setDatosForm({ ...datosForm, telefono: e.target.value })}
            />
          </label>

          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
              Correo electrónico <span className="font-semibold normal-case tracking-normal text-slate-400">(opcional)</span>
            </span>
            <input
              type="email"
              placeholder="nombre@correo.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              value={datosForm.correo}
              onChange={e => setDatosForm({ ...datosForm, correo: e.target.value })}
            />
          </label>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
                <AlertCircle size={17} />
              </span>
              <div>
                <p className="text-xs font-black text-indigo-950">Necesita ubicación accesible</p>
                <p className="mt-0.5 text-[10px] text-indigo-600/70">Lo tendremos en cuenta al elegir las butacas.</p>
              </div>
            </div>
            <label className="relative inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                aria-label="Necesita ubicación accesible"
                className="peer sr-only"
                checked={datosForm.discapacidad}
                onChange={e => setDatosForm({ ...datosForm, discapacidad: e.target.checked })}
              />
              <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-indigo-500 peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition after:content-[''] peer-checked:after:translate-x-full" />
            </label>
          </div>

          <div className="sigic-graduate-guest-form-actions flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end md:col-span-2">
            <button
              type="button"
              onClick={onCancelar}
              className="min-h-11 rounded-xl px-5 text-xs font-bold text-slate-500 transition hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={procesando}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-xs font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 disabled:cursor-wait disabled:opacity-60"
            >
              {procesando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Agregar acompañante'} <ChevronRight size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
