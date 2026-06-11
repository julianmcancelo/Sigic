/**
 * PanelGraduado - Panel principal que ve el graduado al iniciar sesión.
 * Contiene 3 pestañas: Acompañantes, Entregadores y Credencial.
 * Los asientos son asignados por el admin (solo lectura para el graduado).
 * Reemplaza a RegistroInvitados.jsx con terminología y flujo actualizado.
 */
import { useState, useEffect } from 'react'
import { 
  Users, UserPlus, LogOut, Trash2, Edit3, QrCode, 
  AlertCircle, Plus, CheckCircle, X, GraduationCap, 
  UserCheck, Armchair
} from 'lucide-react'
import { 
  obtenerInvitadosDeEgresado, eliminarInvitado, actualizarInvitado, 
  cargarInvitados, obtenerProfesores, obtenerEntregadoresDeGraduado,
  asignarEntregador, eliminarEntregador, obtenerAjustes
} from '../servicios/api'
import { ModalCredencial } from '../componentes/ModalCredencial'

export function PanelGraduado({ graduadoSesion, onCerrarSesion }) {
  const [graduado, setGraduado] = useState(graduadoSesion)
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [pestana, setPestana] = useState('invitados') // 'invitados' | 'entregadores' | 'credencial'
  const [maxInvitados, setMaxInvitados] = useState(4)

  // Formulario de invitados
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [datosForm, setDatosForm] = useState({
    nombre: '', dni: '', telefono: '', correo: '', relacion: 'Acompañante', discapacidad: false
  })
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  // Entregadores
  const [profesores, setProfesores] = useState([])
  const [entregadores, setEntregadores] = useState([])
  const [mostrarSelectorEntregador, setMostrarSelectorEntregador] = useState(false)

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    try {
      setCargando(true)
      const [dataInv, dataProf, dataEntr] = await Promise.all([
        obtenerInvitadosDeEgresado(graduadoSesion.id),
        obtenerProfesores(),
        obtenerEntregadoresDeGraduado(graduadoSesion.id)
      ])
      setInvitados(dataInv)
      setProfesores(dataProf)
      setEntregadores(dataEntr)

      try {
        const config = await obtenerAjustes()
        if (config.max_invitados_por_egresado) {
          setMaxInvitados(parseInt(config.max_invitados_por_egresado.valor))
        }
      } catch {}
    } catch (err) {
      console.error('Error al cargar datos del panel:', err)
    } finally {
      setCargando(false)
    }
  }

  // ─── Funciones de invitados ─────────────────────────────────

  function limpiarForm() {
    setDatosForm({ nombre: '', dni: '', telefono: '', correo: '', relacion: 'Acompañante', discapacidad: false })
    setEditandoId(null)
    setMostrarForm(false)
    setMensaje({ tipo: '', texto: '' })
  }

  function iniciarEdicion(inv) {
    setDatosForm({
      nombre: inv.nombre, dni: inv.dni, telefono: inv.telefono,
      correo: inv.correo || '', relacion: inv.relacion || 'Acompañante',
      discapacidad: inv.discapacidad === 1 || inv.discapacidad === true
    })
    setEditandoId(inv.id)
    setMostrarForm(true)
  }

  async function guardarInvitado(e) {
    e.preventDefault()
    if (datosForm.nombre.trim().length < 3) return setMensaje({ tipo: 'error', texto: 'El nombre debe tener al menos 3 caracteres.' })
    if (!/^\d{7,10}$/.test(datosForm.dni)) return setMensaje({ tipo: 'error', texto: 'El DNI debe ser numérico (7 a 10 dígitos).' })
    if (datosForm.telefono.trim().length < 8) return setMensaje({ tipo: 'error', texto: 'Ingresá un número de teléfono válido.' })

    const existe = invitados.find(i => i.dni === datosForm.dni && i.id !== editandoId)
    if (existe) return setMensaje({ tipo: 'error', texto: 'Este DNI ya está registrado en tu lista.' })

    setProcesando(true)
    try {
      if (editandoId) {
        await actualizarInvitado(editandoId, datosForm)
      } else {
        await cargarInvitados(null, [datosForm], graduadoSesion.id)
      }
      await cargarDatos()
      setMensaje({ tipo: 'exito', texto: editandoId ? 'Actualizado correctamente' : 'Invitado añadido con éxito' })
      setTimeout(limpiarForm, 1000)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setProcesando(false)
    }
  }

  async function manejarEliminarInvitado(id) {
    if (!window.confirm('¿Estás seguro de eliminar a este invitado?')) return
    try {
      await eliminarInvitado(id)
      setInvitados(prev => prev.filter(i => i.id !== id))
    } catch (err) { alert(err.message) }
  }

  // ─── Funciones de entregadores ─────────────────────────────

  async function manejarAgregarEntregador(tipo, referencia) {
    setProcesando(true)
    try {
      const datos = {
        egresado_id: graduadoSesion.id,
        tipo: tipo,
        nombre: referencia.nombre,
        orden: entregadores.length + 1
      }
      if (tipo === 'PROFESOR') datos.profesor_id = referencia.id
      if (tipo === 'FAMILIAR') datos.invitado_id = referencia.id

      await asignarEntregador(datos)
      await cargarDatos()
      setMostrarSelectorEntregador(false)
      setMensaje({ tipo: 'exito', texto: `${referencia.nombre} agregado como entregador` })
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setProcesando(false)
    }
  }

  async function manejarEliminarEntregador(id) {
    if (!confirm('¿Quitar este entregador de la lista?')) return
    try {
      await eliminarEntregador(id)
      await cargarDatos()
    } catch (err) { alert(err.message) }
  }

  // ─── Info de asientos (solo lectura) ───────────────────────

  const todosLosAsientos = [
    graduado.asiento_id,
    graduado.entregador_asiento_id,
    ...invitados.map(i => i.asiento_id)
  ].filter(Boolean)

  if (cargando && invitados.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent mx-auto mb-4" />
          <p className="text-xs font-bold uppercase tracking-widest text-sky-500">Cargando tu panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#0d1b2e] text-white flex flex-col">
        <div className="p-6 border-b border-white/10 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="h-8 w-8 bg-sky-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">S</div>
            <span className="font-black tracking-wider text-xl">SiGIC</span>
          </div>
          <p className="text-[9px] text-sky-400 font-bold mt-1 tracking-widest uppercase opacity-70">Panel Graduado v4.0</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setPestana('invitados')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pestana === 'invitados' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <Users size={18} /> <span className="text-sm font-bold">Acompañantes</span>
          </button>
          <button onClick={() => setPestana('entregadores')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pestana === 'entregadores' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <GraduationCap size={18} /> <span className="text-sm font-bold">Entregadores</span>
          </button>
          <button onClick={() => setPestana('credencial')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pestana === 'credencial' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <QrCode size={18} /> <span className="text-sm font-bold">Credencial</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={onCerrarSesion} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={18} /> <span className="text-sm font-bold">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-500 mb-1">Bienvenido al Portal</p>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">{graduado.nombre}</h1>
            <p className="text-slate-500 font-medium">Legajo {graduado.legajo} • Sede Beltrán</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <div className="h-10 w-10 bg-sky-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">Invitados</p>
                <p className="text-xl font-black text-slate-800 leading-none">{invitados.length} / {maxInvitados}</p>
              </div>
            </div>

            {/* Asientos asignados (solo lectura) */}
            {todosLosAsientos.length > 0 && (
              <div className="flex items-center gap-4 bg-emerald-50 p-5 rounded-3xl shadow-sm border border-emerald-100">
                <div className="h-10 w-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Armchair size={20} />
                </div>
                <div>
                  <p className="text-[9px] uppercase font-black text-emerald-600 tracking-widest leading-none mb-1">Asientos asignados</p>
                  <p className="text-xl font-black text-emerald-700 leading-none">{todosLosAsientos.length}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mensaje global */}
        {mensaje.texto && (
          <div className={`mb-6 px-5 py-3 rounded-2xl text-sm font-semibold border ${
            mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        {/* ═══════ PESTAÑA: ACOMPAÑANTES ═══════ */}
        {pestana === 'invitados' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <UserCheck className="text-sky-500" size={24} />
                Invitados Familiares
              </h2>
              {invitados.length < maxInvitados && (
                <button onClick={() => { limpiarForm(); setMostrarForm(true); }} className="flex items-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-sky-500/30 hover:bg-sky-600 transition-all active:scale-95">
                  <Plus size={16} /> Añadir Familiar
                </button>
              )}
            </div>

            {/* Formulario inline */}
            {mostrarForm && (
              <div className="bg-white rounded-[32px] p-8 border-2 border-sky-100 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editandoId ? 'Editar Datos' : 'Nuevo Acompañante'}</h3>
                  <button onClick={limpiarForm} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl transition-all"><X size={20} /></button>
                </div>
                <form onSubmit={guardarInvitado} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre y Apellido</label>
                    <input type="text" required className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all" value={datosForm.nombre} onChange={e => setDatosForm({...datosForm, nombre: e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">DNI / Pasaporte</label>
                    <input type="text" required className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all" value={datosForm.dni} onChange={e => setDatosForm({...datosForm, dni: e.target.value})}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Vínculo</label>
                    <select className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all" value={datosForm.relacion} onChange={e => setDatosForm({...datosForm, relacion: e.target.value})}>
                      <option value="Padre/Madre">Padre/Madre</option>
                      <option value="Hermano/a">Hermano/a</option>
                      <option value="Pareja">Pareja</option>
                      <option value="Otro">Otro Familiar</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Contacto</label>
                    <input type="tel" required className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all" value={datosForm.telefono} onChange={e => setDatosForm({...datosForm, telefono: e.target.value})}/>
                  </div>
                  <div className="md:col-span-2 bg-indigo-50 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center"><AlertCircle size={18} /></div>
                      <div>
                        <p className="text-sm font-black text-indigo-900 leading-tight">Acceso Prioritario</p>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wide">¿Requiere ubicación para movilidad reducida?</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={datosForm.discapacidad} onChange={e => setDatosForm({...datosForm, discapacidad: e.target.checked})}/>
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                  <div className="md:col-span-2 flex gap-4 pt-4">
                    <button type="submit" disabled={procesando} className="flex-1 bg-sky-500 text-white font-black py-4 rounded-2xl hover:bg-sky-600 disabled:opacity-50 text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                      {procesando ? 'Procesando...' : 'Confirmar Registro'}
                    </button>
                    <button type="button" onClick={limpiarForm} className="bg-slate-100 text-slate-600 font-black px-10 rounded-2xl hover:bg-slate-200 text-xs uppercase tracking-widest transition-all">Cancelar</button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de invitados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {invitados.map(inv => (
                <div key={inv.id} className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-sky-300 transition-all hover:shadow-xl">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center font-black group-hover:bg-sky-50 group-hover:text-sky-500 transition-all text-xl">{inv.nombre.charAt(0)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-lg leading-tight">{inv.nombre}</h4>
                        {inv.discapacidad === 1 && (
                          <span className="bg-indigo-100 text-indigo-600 p-1 rounded-md" title="Acceso Prioritario"><AlertCircle size={14} /></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{inv.relacion} • DNI {inv.dni}</p>
                      {inv.asiento_id && <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block mt-2">ASIENTO: {inv.asiento_id}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => iniciarEdicion(inv)} className="p-3 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => manejarEliminarInvitado(inv.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ PESTAÑA: ENTREGADORES ═══════ */}
        {pestana === 'entregadores' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Seleccioná quién te entrega el título</h2>
              <p className="text-sm text-slate-500 font-medium">Podés elegir hasta 3 personas entre profesores de la institución y tus familiares invitados.</p>
            </div>

            {/* Slots de entregadores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map(orden => {
                const entregadorActual = entregadores.find(e => e.orden === orden)

                return (
                  <div key={orden} className={`bg-white rounded-3xl border-2 p-6 transition-all ${
                    entregadorActual ? 'border-indigo-200 shadow-lg' : 'border-dashed border-slate-200'
                  }`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4">{orden}° Entregador</p>

                    {entregadorActual ? (
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black shadow-lg ${
                            entregadorActual.tipo === 'PROFESOR' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-sky-500 to-cyan-600'
                          }`}>
                            {entregadorActual.nombre?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{entregadorActual.nombre}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {entregadorActual.tipo === 'PROFESOR' ? '🎓 Profesor' : '👨‍👩‍👦 Familiar'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => manejarEliminarEntregador(entregadorActual.id)}
                          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 hover:text-red-600 transition-all"
                        >
                          <Trash2 size={12} /> Quitar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setMostrarSelectorEntregador(true)}
                        disabled={entregadores.length >= 3}
                        className="w-full flex flex-col items-center justify-center py-8 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-2xl transition-all disabled:opacity-30"
                      >
                        <Plus size={32} className="mb-2" />
                        <span className="text-xs font-bold">Agregar entregador</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Selector de entregador (modal inline) */}
            {mostrarSelectorEntregador && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-400">Elegí un entregador</p>
                  <button onClick={() => setMostrarSelectorEntregador(false)} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
                </div>

                <div className="p-6">
                  {/* Sección Profesores */}
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">🎓 Profesores de la institución</p>
                  {profesores.length === 0 ? (
                    <p className="text-xs text-slate-400 mb-6">No hay profesores cargados en el sistema.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                      {profesores.map(prof => {
                        const yaAsignado = entregadores.some(e => e.profesor_id === prof.id)
                        return (
                          <button
                            key={prof.id}
                            onClick={() => manejarAgregarEntregador('PROFESOR', prof)}
                            disabled={yaAsignado || procesando}
                            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                              yaAsignado ? 'bg-slate-50 opacity-40 cursor-not-allowed' : 'hover:bg-indigo-50 hover:border-indigo-300 border border-slate-100'
                            }`}
                          >
                            <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {prof.nombre?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">{prof.nombre}</p>
                              {prof.materia && <p className="text-[10px] text-slate-400">{prof.materia}</p>}
                            </div>
                            {yaAsignado && <span className="ml-auto text-[9px] font-bold text-emerald-500">✓ Asignado</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Sección Familiares */}
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-500 mb-3">👨‍👩‍👦 Mis invitados</p>
                  {invitados.length === 0 ? (
                    <p className="text-xs text-slate-400">Primero cargá invitados en la pestaña "Acompañantes".</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {invitados.map(inv => {
                        const yaAsignado = entregadores.some(e => e.invitado_id === inv.id)
                        return (
                          <button
                            key={inv.id}
                            onClick={() => manejarAgregarEntregador('FAMILIAR', inv)}
                            disabled={yaAsignado || procesando}
                            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                              yaAsignado ? 'bg-slate-50 opacity-40 cursor-not-allowed' : 'hover:bg-sky-50 hover:border-sky-300 border border-slate-100'
                            }`}
                          >
                            <div className="h-9 w-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {inv.nombre?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">{inv.nombre}</p>
                              <p className="text-[10px] text-slate-400">{inv.relacion}</p>
                            </div>
                            {yaAsignado && <span className="ml-auto text-[9px] font-bold text-emerald-500">✓ Asignado</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ PESTAÑA: CREDENCIAL ═══════ */}
        {pestana === 'credencial' && (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-lg">
              <ModalCredencial 
                egresado={{...graduado, asientos: todosLosAsientos, invitados}} 
                onCerrar={() => setPestana('invitados')} 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
