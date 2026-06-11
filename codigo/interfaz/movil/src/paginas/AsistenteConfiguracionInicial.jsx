import { useState } from 'react'
import { inicializarSistema } from '../servicios/api'

const inicial = {
  nombre: '',
  email: '',
  password: '',
  nombreEvento: 'Ceremonia de Colacion',
  fechaEvento: '2026-12-01',
  lugarEvento: 'Sede Beltran',
}

export function AsistenteConfiguracionInicial({ onFinalizado }) {
  const [form, setForm] = useState(inicial)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  function onChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  async function onSubmit(e) {
    e.preventDefault()
    setCargando(true)
    setError('')
    try {
      const res = await inicializarSistema(form)
      onFinalizado(res.usuario)
    } catch (err) {
      setError(err.message || 'No se pudo completar la configuracion inicial')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_45%,#ffffff_100%)] px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-100 bg-white p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">Configuracion inicial</p>
          <h1 className="mt-2 text-3xl font-black text-slate-800">Bienvenidos a SiGIC</h1>
          <p className="mt-2 text-sm text-slate-500">
            Este asistente deja la plataforma lista para uso real. Vamos a crear el primer usuario Super Admin y una ceremonia activa base.
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Nombre completo del Super Admin</label>
            <input name="nombre" value={form.nombre} onChange={onChange} required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Email de acceso</label>
            <input name="email" type="email" value={form.email} onChange={onChange} required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Contrasena inicial</label>
            <input name="password" type="password" value={form.password} onChange={onChange} required minLength={6} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Nombre del evento</label>
            <input name="nombreEvento" value={form.nombreEvento} onChange={onChange} required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Fecha del evento</label>
            <input name="fechaEvento" type="date" value={form.fechaEvento} onChange={onChange} required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Lugar</label>
            <input name="lugarEvento" value={form.lugarEvento} onChange={onChange} required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />
          </div>

          {error ? (
            <div className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {cargando ? 'Configurando plataforma...' : 'Crear Super Admin e iniciar plataforma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

