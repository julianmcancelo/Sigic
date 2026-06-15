import { useState, useEffect } from 'react'
import { 
  Users, 
  UserPlus, 
  LogOut, 
  Trash2, 
  Edit3, 
  QrCode, 
  LayoutDashboard, 
  AlertCircle,
  Plus,
  CheckCircle,
  X,
  Armchair,
  GraduationCap,
  UserCheck
} from 'lucide-react'
import {
  BASE,
  obtenerInvitadosDeEgresado,
  eliminarInvitado,
  actualizarInvitado,
  cargarInvitados,
  asignarAsientos,
  actualizarEntregadorLegacy as actualizarEntregador
} from '../servicios/api'
import { ModalCredencial } from '../componentes/ModalCredencial'
import { SeleccionAsientos } from './SeleccionAsientos'

const DARK   = '#0d1b2e'
const ACCENT = '#29ABE2'
const BG     = '#f1f5f9'

export function RegistroInvitados({ egresadoSesion, onCerrarSesion }) {
  const [egresado, setEgresado] = useState(egresadoSesion)
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [pestana, setPestana] = useState('invitados') // 'invitados' | 'asientos' | 'credencial'
  const [maxInvitados, setMaxInvitados] = useState(4)
  
  // Estado para el Entregador
  const [nombreEntregador, setNombreEntregador] = useState(egresadoSesion.entregador_nombre || '')
  
  // Estado para el formulario de Agregar/Editar invitados
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [datosForm, setDatosForm] = useState({
    nombre: '', dni: '', telefono: '', correo: '', relacion: 'Acompañante', discapacidad: false
  })
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      setCargando(true)
      const data = await obtenerInvitadosDeEgresado(egresadoSesion.id)
      setInvitados(data)

      const resConfig = await fetch(`${BASE}/configuracion`)
      const config = await resConfig.json()
      if (config.max_invitados_por_egresado) {
        setMaxInvitados(parseInt(config.max_invitados_por_egresado.valor))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  async function guardarEntregador() {
    setProcesando(true)
    try {
      await actualizarEntregador(egresado.id, nombreEntregador)
      setEgresado({...egresado, entregador_nombre: nombreEntregador})
      setMensaje({ tipo: 'exito', texto: 'Entregador actualizado correctamente.' })
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000)
    } catch (err) {
      alert(err.message)
    } finally {
      setProcesando(false)
    }
  }

  function limpiarForm() {
    setDatosForm({ nombre: '', dni: '', telefono: '', correo: '', relacion: 'Acompañante', discapacidad: false })
    setEditandoId(null)
    setMostrarForm(false)
    setMensaje({ tipo: '', texto: '' })
  }

  function iniciarEdicion(inv) {
    setDatosForm({
      nombre: inv.nombre,
      dni: inv.dni,
      telefono: inv.telefono,
      correo: inv.correo || '',
      relacion: inv.relacion || 'Acompañante',
      discapacidad: inv.discapacidad === 1 || inv.discapacidad === true
    })
    setEditandoId(inv.id)
    setMostrarForm(true)
  }

  async function guardarInvitado(e) {
    e.preventDefault()
    
    // VALIDACIONES
    if (datosForm.nombre.trim().length < 3) {
      return setMensaje({ tipo: 'error', texto: 'El nombre debe tener al menos 3 caracteres.' })
    }
    if (!/^\d{7,10}$/.test(datosForm.dni)) {
      return setMensaje({ tipo: 'error', texto: 'El DNI debe ser numérico (7 a 10 dígitos).' })
    }
    if (datosForm.telefono.trim().length < 8) {
      return setMensaje({ tipo: 'error', texto: 'Ingrese un número de teléfono válido.' })
    }

    // Check duplicados local
    const existe = invitados.find(i => i.dni === datosForm.dni && i.id !== editandoId)
    if (existe) {
      return setMensaje({ tipo: 'error', texto: 'Este DNI ya está registrado en tu lista.' })
    }

    setProcesando(true)
    try {
      if (editandoId) {
        await actualizarInvitado(editandoId, datosForm)
      } else {
        await cargarInvitados(null, [datosForm], egresadoSesion.id)
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

  async function manejarEliminar(id) {
    if (!window.confirm('¿Estás seguro de eliminar a este invitado?')) return
    try {
      await eliminarInvitado(id)
      setInvitados(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  async function confirmarAsientos(seleccion) {
    const totalRequerido = 2 + invitados.length
    if (seleccion.length !== totalRequerido) {
      return alert(`Debes seleccionar exactamente ${totalRequerido} asientos.`)
    }

    setProcesando(true)
    try {
      const data = {
        egresadoAsiento: seleccion[0],
        entregadorAsiento: seleccion[1],
        invitadosAsientos: {}
      }
      // Asignar el resto a los invitados (empezando del índice 2)
      invitados.forEach((inv, i) => {
        if (seleccion[i+2]) {
          data.invitadosAsientos[inv.id] = seleccion[i+2]
        }
      })

      await asignarAsientos(egresadoSesion.id, data)
      alert("¡Ubicaciones reservadas con éxito!")
      setPestana('credencial')
    } catch (err) {
      alert(err.message)
    } finally {
      setProcesando(false)
    }
  }

  // Estado para la pre-selección de asientos en tiempo real
  const [seleccionActual, setSeleccionActual] = useState([])

  if (cargando && invitados.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    )
  }

  const todosLosAsientos = [
    egresado.asiento_id, 
    egresado.entregador_asiento_id,
    ...invitados.map(i => i.asiento_id)
  ].filter(Boolean)

  const faltaEntregador = !egresado.entregador_nombre

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#0d1b2e] text-white flex flex-col">
        <div className="p-6 border-b border-white/10 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="h-8 w-8 bg-sky-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">S</div>
            <span className="font-black tracking-wider text-xl">SiGIC</span>
          </div>
          <p className="text-[9px] text-sky-400 font-bold mt-1 tracking-widest uppercase opacity-70">Panel Egresado v3.0</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setPestana('invitados')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pestana === 'invitados' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <Users size={18} /> <span className="text-sm font-bold">Acompañantes</span>
          </button>
          
          <div className="relative group">
            <button 
              disabled={faltaEntregador}
              onClick={() => setPestana('asientos')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pestana === 'asientos' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-white/5'} ${faltaEntregador ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <Armchair size={18} /> <span className="text-sm font-bold">Ubicaciones</span>
            </button>
            {faltaEntregador && (
              <div className="absolute left-full ml-2 top-0 bg-slate-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity w-32 pointer-events-none z-50">
                Debes definir el Entregador primero
              </div>
            )}
          </div>
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
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">{egresado.nombre}</h1>
            <p className="text-slate-500 font-medium">Legajo {egresado.legajo} • Sede Beltrán</p>
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
            <div className="hidden sm:flex items-center gap-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <div className="h-10 w-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Armchair size={20} />
              </div>
              <div>
                <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">Asientos</p>
                <p className="text-xl font-black text-slate-800 leading-none">{todosLosAsientos.length || seleccionActual.length}</p>
              </div>
            </div>
          </div>
        </header>

        {/* VISTA: INVITADOS */}
        {pestana === 'invitados' && (
          <div className="space-y-8">
            
            {/* SECCIÓN ENTREGADOR */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <GraduationCap size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Persona que entrega el Diploma</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre Completo del Entregador</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none transition-all font-medium"
                    placeholder="Ej: Juan Pérez (Padre / Docente)"
                    value={nombreEntregador}
                    onChange={e => setNombreEntregador(e.target.value)}
                  />
                </div>
                <button 
                  onClick={guardarEntregador}
                  disabled={procesando || !nombreEntregador}
                  className="sm:self-end bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-30"
                >
                  {procesando ? 'Guardando...' : 'Guardar Nombre'}
                </button>
              </div>
              {mensaje.texto && mensaje.tipo === 'exito' && !mostrarForm && (
                <p className="mt-3 text-xs text-emerald-600 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={14} /> {mensaje.texto}
                </p>
              )}
            </div>

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

            {/* FORMULARIO INVITADO */}
            {mostrarForm && (
              <div className="bg-white rounded-[32px] p-8 border-2 border-sky-100 shadow-2xl animate-in zoom-in-95 duration-300">
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
                      <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                        <AlertCircle size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-indigo-900 leading-tight">Acceso Prioritario</p>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wide">¿Requiere ubicación para movilidad reducida?</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={datosForm.discapacidad}
                        onChange={e => setDatosForm({...datosForm, discapacidad: e.target.checked})}
                      />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {invitados.map(inv => (
                <div key={inv.id} className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-sky-300 transition-all hover:shadow-xl hover:shadow-slate-200/40">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center font-black group-hover:bg-sky-50 group-hover:text-sky-500 transition-all duration-300 text-xl">{inv.nombre.charAt(0)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-lg leading-tight">{inv.nombre}</h4>
                        {inv.discapacidad === 1 && (
                          <span className="bg-indigo-100 text-indigo-600 p-1 rounded-md" title="Acceso Prioritario">
                            <AlertCircle size={14} />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{inv.relacion} • DNI {inv.dni}</p>
                      {inv.asiento_id && <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block mt-2">FILA {inv.asiento_id.split('-')[1]} • ASIENTO {inv.asiento_id.split('-')[2]}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button onClick={() => iniciarEdicion(inv)} className="p-3 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => manejarEliminar(inv.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA: ASIENTOS */}
        {pestana === 'asientos' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                 <div className="h-12 w-12 bg-sky-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200"><Armchair size={24} /></div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Reserva de Ubicaciones</h2>
                    <p className="text-slate-400 font-medium">Seleccionados: {seleccionActual.length} / {2 + invitados.length}</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                 <div className={`p-4 rounded-2xl border-2 transition-all ${seleccionActual[0] ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${seleccionActual[0] ? 'text-indigo-200' : 'text-indigo-500'}`}>Tú (Egresado)</p>
                    <p className="text-xs font-bold">{seleccionActual[0] ? seleccionActual[0].replace(/-/g, ' ') : 'Pendiente'}</p>
                 </div>
                 <div className={`p-4 rounded-2xl border-2 transition-all ${seleccionActual[1] ? 'bg-slate-800 border-slate-800 text-white shadow-lg' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${seleccionActual[1] ? 'text-slate-400' : 'text-slate-500'}`}>Entregador</p>
                    <p className="text-xs font-bold">{seleccionActual[1] ? seleccionActual[1].replace(/-/g, ' ') : 'Pendiente'}</p>
                 </div>
                 <div className={`p-4 rounded-2xl border-2 transition-all ${seleccionActual.slice(2).length > 0 ? 'bg-sky-100 border-sky-200 text-sky-800 shadow-lg' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-1">Familiares ({invitados.length})</p>
                    <p className="text-[10px] font-bold truncate">
                      {seleccionActual.slice(2).length > 0 
                        ? seleccionActual.slice(2).map(s => s.split('-')[2]).join(', ') 
                        : 'Pendientes'}
                    </p>
                 </div>
              </div>

              <SeleccionAsientos 
                maxSeleccion={2 + invitados.length} 
                onConfirmar={confirmarAsientos}
                onSeleccionChange={setSeleccionActual}
                estaCargando={procesando}
              />
            </div>
          </div>
        )}

        {/* VISTA: CREDENCIAL */}
        {pestana === 'credencial' && (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
             <div className="w-full max-w-lg">
                <ModalCredencial 
                  egresado={{...egresado, asientos: todosLosAsientos, invitados}} 
                  onCerrar={() => setPestana('invitados')} 
                />
             </div>
          </div>
        )}

      </main>
    </div>
  )
}
