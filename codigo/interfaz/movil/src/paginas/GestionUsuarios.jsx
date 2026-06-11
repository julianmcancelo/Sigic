import { useEffect, useState } from 'react'
import {
  listarUsuariosSistema,
  crearUsuarioSistema,
  actualizarEstadoUsuario,
  actualizarRolUsuario,
} from '../servicios/api'
import { HeaderGlobal } from '../componentes/HeaderGlobal'

const ROLES = ['SUPER_ADMIN', 'ADMINISTRATIVO', 'ADMIN', 'PORTERIA', 'AUDITOR']

export function GestionUsuarios({ usuario, onVolver, onCerrarSesion }) {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'PORTERIA' })

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const data = await listarUsuariosSistema()
      setUsuarios(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  async function onCrear(e) {
    e.preventDefault()
    setError('')
    setOk('')
    try {
      await crearUsuarioSistema({ ...form })
      setOk('Usuario creado correctamente')
      setForm({ nombre: '', email: '', password: '', rol: 'PORTERIA' })
      await cargar()
    } catch (e2) {
      setError(e2.message)
    }
  }

  async function onCambiarEstado(u) {
    setError('')
    try {
      await actualizarEstadoUsuario(u.id, u.activo ? 0 : 1)
      await cargar()
    } catch (e) {
      setError(e.message)
    }
  }

  async function onCambiarRol(u, rol) {
    setError('')
    try {
      await actualizarRolUsuario(u.id, rol)
      await cargar()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <HeaderGlobal titulo="Gestion de Usuarios" subtitulo="Super Administrador" onVolver={onVolver} onCerrarSesion={onCerrarSesion} />
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-800">Crear nuevo usuario</h2>
          <p className="text-sm text-slate-500 mt-1">Desde aqui podes crear cuentas para administrativo, porteria y otros perfiles.</p>
          <form onSubmit={onCrear} className="mt-5 grid gap-3 md:grid-cols-2">
            <input className="rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="Nombre y apellido" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} required />
            <input className="rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="Email institucional" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            <input className="rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="Contrasena inicial" type="password" minLength={6} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
            <select className="rounded-xl border border-slate-200 px-4 py-3 text-sm" value={form.rol} onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="md:col-span-2">
              <button className="rounded-xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white">Crear usuario</button>
            </div>
          </form>
          {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
          {ok ? <p className="mt-4 text-sm text-emerald-600">{ok}</p> : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-800">Usuarios existentes</h2>
          {cargando ? <p className="mt-4 text-sm text-slate-500">Cargando usuarios...</p> : null}
          {!cargando ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Nombre</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Rol</th>
                    <th className="py-2">Estado</th>
                    <th className="py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100">
                      <td className="py-2 font-semibold text-slate-700">{u.nombre}</td>
                      <td className="py-2 text-slate-600">{u.email}</td>
                      <td className="py-2">
                        <select className="rounded-lg border border-slate-200 px-2 py-1 text-xs" value={u.rol} onChange={(e) => onCambiarRol(u, e.target.value)}>
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${u.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-2">
                        <button onClick={() => onCambiarEstado(u)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50">
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}

