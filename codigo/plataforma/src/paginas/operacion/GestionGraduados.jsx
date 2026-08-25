import { useState, useEffect } from 'react'
import { 
  Users, Search, Upload, Trash2, X, Link2, CreditCard,
  UserX, CheckCircle2, Clock, AlertCircle, Armchair, Send, PlusCircle, BadgeCheck, Edit3, MoreHorizontal
} from 'lucide-react'

import { 
  obtenerGraduados,
  eliminarGraduado,
  vaciarGraduados,
  obtenerInvitados, 
  corroborarGraduado, actualizarGraduado, buscarHistorialGraduados
} from '../../servicios/api'

import { ModalLinkRegistro } from '../../componentes/ModalLinkRegistro'
import { ModalCredencial } from '../../componentes/ModalCredencial'
import { FormularioGraduado } from '../../componentes/FormularioGraduado'
import { ModalImportar } from '../../componentes/ModalImportar'
import { ModalAsignarAsientos } from '../../componentes/ModalAsignarAsientos'

const ESTADOS_FLUJO = {
  SIN_INVITAR:       { etiqueta: 'Sin invitar',        color: 'bg-slate-100 text-slate-600 border border-slate-200/50',   iconKey: 'SIN_INVITAR' },
  PENDIENTE:         { etiqueta: 'Esperando respuesta', color: 'bg-amber-50 text-amber-700 border border-amber-200/50',    iconKey: 'PENDIENTE' },
  CARGA_INCOMPLETA:  { etiqueta: 'Carga incompleta',   color: 'bg-orange-50 text-orange-700 border border-orange-200/50',  iconKey: 'CARGA_INCOMPLETA' },
  COMPLETO:          { etiqueta: 'Listo para asignar',  color: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50', iconKey: 'COMPLETO' },
  RECHAZADO:         { etiqueta: 'No aceptó',        color: 'bg-rose-50 text-rose-700 border border-rose-200/50',        iconKey: 'RECHAZADO' },
}

const DARK   = '#2A3448'

export function GestionGraduados({ usuario, ceremoniaActiva, onVolver, onCerrarSesion, sinHeader }) {
  function obtenerIconoEstado(key, size = 12) {
    switch(key) {
      case 'SIN_INVITAR': return <Send size={size} />
      case 'PENDIENTE': return <Clock size={size} />
      case 'CARGA_INCOMPLETA': return <AlertCircle size={size} />
      case 'COMPLETO': return <CheckCircle2 size={size} />
      case 'RECHAZADO': return <UserX size={size} />
      default: return <Send size={size} />
    }
  }

  const [graduados, setGraduados] = useState([])
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarImportar, setMostrarImportar] = useState(false)
  const [linkQR, setLinkQR] = useState(null)
  const [graduadoCredencial, setGraduadoCredencial] = useState(null)
  const [graduadoAsignar, setGraduadoAsignar] = useState(null)

  const [corroborandoId, setCorroborandoId] = useState(null)
  const [altaExitosa, setAltaExitosa] = useState('')
  const [graduadoEditar, setGraduadoEditar] = useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [historialGlobal, setHistorialGlobal] = useState([])
  const [buscandoHistorial, setBuscandoHistorial] = useState(false)
  const [ceremoniaMostrada, setCeremoniaMostrada] = useState(ceremoniaActiva || null)

  useEffect(() => {
    setCeremoniaMostrada(ceremoniaActiva || null)
    cargarDatos(ceremoniaActiva?.id)
  }, [ceremoniaActiva?.id])

  useEffect(() => {
    const actualizarEntorno = evento => {
      const ceremonia = evento.detail || null
      setCeremoniaMostrada(ceremonia)
      cargarDatos(ceremonia?.id)
    }
    window.addEventListener('sigic-ceremonia-cambiada', actualizarEntorno)
    return () => window.removeEventListener('sigic-ceremonia-cambiada', actualizarEntorno)
  }, [])

  useEffect(() => {
    const termino = busqueda.trim()
    if (termino.length < 2) {
      setHistorialGlobal([])
      setBuscandoHistorial(false)
      return undefined
    }

    let vigente = true
    const temporizador = window.setTimeout(async () => {
      setBuscandoHistorial(true)
      try {
        const resultado = await buscarHistorialGraduados(termino)
        if (vigente) setHistorialGlobal(Array.isArray(resultado) ? resultado : [])
      } catch {
        if (vigente) setHistorialGlobal([])
      } finally {
        if (vigente) setBuscandoHistorial(false)
      }
    }, 280)

    return () => {
      vigente = false
      window.clearTimeout(temporizador)
    }
  }, [busqueda])

  async function cargarDatos(ceremoniaId = ceremoniaMostrada?.id || ceremoniaActiva?.id) {
    setCargando(true)
    setError('')
    try {
      const [listaGrad, listaInv] = await Promise.all([
        obtenerGraduados(ceremoniaId),
        obtenerInvitados(ceremoniaId)
      ])
      setGraduados(listaGrad)
      setInvitados(listaInv)
    } catch {
      setError('Error de conexión al servidor')
    } finally {
      setCargando(false)
    }
  }

  function manejarLink(grad) {
    const host = window.location.hostname.toLowerCase()
    const origen = host.includes('sigic-demo') || host === 'demo.sigic.com.ar'
      ? 'https://demo.sigic.com.ar'
      : host.endsWith('.sigic.com.ar')
        ? window.location.origin
        : 'https://app.sigic.com.ar'
    const url = `${origen}/?token=${grad.token}`
    setLinkQR({ egresado: grad, link: url })
  }

  async function manejarEliminar(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este graduado y todos sus datos asociados?')) return
    try {
      await eliminarGraduado(id)
      cargarDatos()
    } catch (err) {
      alert(err.message)
    }
  }

  async function manejarVaciar() {
    if (!confirm('¡ATENCIÓN! ¿Estás seguro de que deseas eliminar TODOS los graduados registrados?')) return
    if (!confirm('Esta acción no se puede deshacer. Se perderán todos los datos.')) return
    try {
      await vaciarGraduados()
      cargarDatos()
    } catch (err) {
      alert(err.message)
    }
  }

  const graduadosFiltrados = graduados.filter(g => {
    const term = busqueda.toLowerCase().trim()
    const coincideBusqueda = !term || 
      g.nombre?.toLowerCase().includes(term) || 
      g.dni?.includes(term) || 
      g.legajo?.toLowerCase().includes(term)

    const coincideEstado = filtroEstado === 'TODOS' || g.estado_flujo === filtroEstado

    return coincideBusqueda && coincideEstado
  })

  const historialAgrupado = historialGlobal.reduce((grupos, registro) => {
    const clave = String(registro.dni || registro.correo || registro.nombre || registro.id).toLowerCase()
    const existente = grupos.find(grupo => grupo.clave === clave)
    if (existente) existente.participaciones.push(registro)
    else grupos.push({ clave, nombre: registro.nombre, dni: registro.dni, correo: registro.correo, participaciones: [registro] })
    return grupos
  }, [])

  const contadores = {
    TODOS: graduados.length,
    SIN_INVITAR: graduados.filter(g => g.estado_flujo === 'SIN_INVITAR').length,
    PENDIENTE: graduados.filter(g => g.estado_flujo === 'PENDIENTE').length,
    CARGA_INCOMPLETA: graduados.filter(g => g.estado_flujo === 'CARGA_INCOMPLETA').length,
    COMPLETO: graduados.filter(g => g.estado_flujo === 'COMPLETO').length,
    RECHAZADO: graduados.filter(g => g.estado_flujo === 'RECHAZADO').length,
  }
  const sinCorreo = graduados.filter(grad => !grad.correo && grad.estado_flujo !== 'RECHAZADO')
  const sinCorroborar = graduados.filter(grad => !grad.identidad_corrobada_en)

  const invitadosDe = (id) => invitados.filter(i => i.egresadoId === id || i.egresado_id === id)

  function abrirAsignacion(grad) {
    setGraduadoAsignar(grad)
  }

  async function manejarCorroboracion(grad) {
    setCorroborandoId(grad.id)
    try {
      const respuesta = await corroborarGraduado(grad.id)
      setGraduados(actuales => actuales.map(item => item.id === grad.id ? {
        ...item, identidad_corrobada_en: respuesta.graduado.identidad_corrobada_en
      } : item))
    } catch (err) {
      alert(err.message)
    } finally {
      setCorroborandoId(null)
    }
  }

  async function guardarEdicion(datos) {
    const actualizado = await actualizarGraduado(graduadoEditar.id, datos)
    setGraduados(actuales => actuales.map(item => item.id === actualizado.id ? { ...item, ...actualizado } : item))
    setGraduadoEditar(null)
    setAltaExitosa(`Datos de ${actualizado.nombre} actualizados.`)
    setTimeout(() => setAltaExitosa(''), 4000)
  }

  function siguientePaso(grad) {
    if (grad.estado_flujo === 'RECHAZADO') return 'Participación rechazada'
    if (!grad.invitacion_enviada) return 'Enviar invitación'
    if (grad.estado !== 'ACEPTADO') return 'Esperar respuesta'
    if (grad.estado_flujo === 'COMPLETO') return 'Asignar butacas'
    return 'Completar grupo'
  }

  return (
    <div className="font-sans">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: DARK }}>Gestión de Estudiantes</h2>
          <p className="mt-0.5 text-xs text-slate-400">{ceremoniaMostrada ? `Ceremonia activa: ${ceremoniaMostrada.nombre} · ` : ''}{graduados.length} estudiantes · {invitados.length} acompañantes</p>
        </div>

        <div className="flex items-center gap-2">
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50"><MoreHorizontal size={14} /> Acciones</summary>
            <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <button onClick={() => setMostrarImportar(true)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><Upload size={14} /> Importar archivo</button>
              {graduados.length > 0 && <button onClick={manejarVaciar} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 size={14} /> Vaciar padrón</button>}
            </div>
          </details>
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-[10px] font-black text-white transition hover:bg-sky-700"
          >
            {mostrarForm ? <X size={14} /> : <PlusCircle size={14} />} {mostrarForm ? 'Cerrar' : 'Nuevo estudiante'}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-semibold text-slate-500">
        <span><strong className="text-slate-800">{graduados.length - sinCorroborar}</strong> verificados</span>
        <span><strong className="text-slate-800">{contadores.COMPLETO}</strong> listos para ubicar</span>
        {sinCorreo.length > 0 && <span className="text-amber-700"><strong>{sinCorreo.length}</strong> sin correo</span>}
      </div>

      {/* FILTROS PILLS */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 [scrollbar-width:thin]">
        {[
          { clave: 'TODOS', etiqueta: 'Todos', color: 'bg-slate-900 text-white' },
          { clave: 'SIN_INVITAR', etiqueta: 'Sin invitar', color: 'bg-slate-400 text-white' },
          { clave: 'PENDIENTE', etiqueta: 'Pendientes', color: 'bg-amber-500 text-white' },
          { clave: 'CARGA_INCOMPLETA', etiqueta: 'Incompletos', color: 'bg-orange-500 text-white' },
          { clave: 'COMPLETO', etiqueta: 'Completos', color: 'bg-emerald-500 text-white' },
          { clave: 'RECHAZADO', etiqueta: 'Rechazados', color: 'bg-rose-500 text-white' },
        ].map(f => (
          <button
            key={f.clave}
            onClick={() => setFiltroEstado(f.clave)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
              filtroEstado === f.clave 
                ? f.color + ' shadow-sm' 
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {f.etiqueta} ({contadores[f.clave] || 0})
          </button>
        ))}
      </div>

      {/* BUSCADOR & ELIMINAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Buscar en el padrón e historial: nombre, DNI, legajo o correo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-sky-500 transition-all shadow-sm placeholder-slate-400"
          />
        </div>
        
      </div>

      {busqueda.trim().length >= 2 && (
        <section className="mb-4 overflow-hidden rounded-xl border border-sky-100 bg-sky-50/60">
          <div className="flex items-center justify-between gap-3 border-b border-sky-100 bg-white/80 px-4 py-2.5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-sky-700">Historial institucional</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Participaciones anteriores. No modifica la ceremonia activa.</p>
            </div>
            <span className="rounded-full bg-sky-100 px-2 py-1 text-[9px] font-black text-sky-700">
              {buscandoHistorial ? 'Buscando...' : `${historialAgrupado.length} persona${historialAgrupado.length === 1 ? '' : 's'}`}
            </span>
          </div>
          {!buscandoHistorial && historialAgrupado.length > 0 && (
            <div className="divide-y divide-sky-100/80">
              {historialAgrupado.map(persona => (
                <div key={persona.clave} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-slate-800">{persona.nombre}</p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">{persona.dni ? `DNI ${persona.dni}` : persona.correo || 'Sin identificador disponible'}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {persona.participaciones.map(participacion => (
                      <span key={participacion.id} className={`rounded-md px-2 py-1 text-[9px] font-bold ${participacion.ceremonia_activa ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
                        {participacion.ceremonia_nombre || 'Ceremonia sin nombre'}{participacion.ceremonia_fecha ? ` · ${new Date(`${participacion.ceremonia_fecha}T12:00:00`).toLocaleDateString('es-AR')}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!buscandoHistorial && historialAgrupado.length === 0 && <p className="px-4 py-3 text-[11px] font-medium text-slate-500">No hay participaciones históricas para esta búsqueda.</p>}
        </section>
      )}

      {/* FORMULARIO DE ALTA */}
      {mostrarForm && (
          <FormularioGraduado
            enModal
            onCreado={(nuevo) => {
              setMostrarForm(false)
              setAltaExitosa(`${nuevo.nombre} fue registrado correctamente en la ceremonia activa.`)
              cargarDatos()
              setTimeout(() => setAltaExitosa(''), 6000)
            }}
            onCancelar={() => setMostrarForm(false)}
          />
      )}

      {altaExitosa && (
        <div role="status" aria-live="polite" className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800 shadow-sm">
          <CheckCircle2 size={18} className="shrink-0" />
          <p className="text-sm font-bold">{altaExitosa}</p>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-2.5 rounded-xl text-xs mb-6 font-bold">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* LISTA */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 select-none">
          <div className="relative w-14 h-14 flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-full border-3 border-t-[#0ea5e9] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
            <div className="absolute inset-1 rounded-full border-3 border-b-indigo-500 border-t-transparent border-r-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
            <img 
              src="/logo-oficial.png" 
              alt="SiGIC" 
              className="h-7 w-auto object-contain animate-pulse z-10 filter drop-shadow-[0_0_6px_rgba(14,165,233,0.5)]" 
            />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Cargando padrón...</p>
        </div>
      ) : graduadosFiltrados.length === 0 ? (
        <div className="py-20 text-center bg-white border border-slate-100 rounded-2xl">
          <Users size={36} className="mx-auto mb-3 text-slate-200" />
          <h3 className="text-sm font-black text-slate-400 mb-1">Sin coincidencias</h3>
          <p className="text-xs text-slate-400">No se encontraron estudiantes en esta selección.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {graduadosFiltrados.map(grad => {
            const estadoConfig = ESTADOS_FLUJO[grad.estado_flujo] || ESTADOS_FLUJO.SIN_INVITAR
            const misInvitados = invitadosDe(grad.id)
            const esRechazado = grad.estado_flujo === 'RECHAZADO'

            return (
              <div
                key={grad.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                  esRechazado ? 'border-red-150 opacity-70 bg-red-50/10' : 'border-slate-100'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black text-white ${esRechazado ? 'bg-rose-400' : 'bg-sky-500'}`}>{grad.nombre?.charAt(0)?.toUpperCase() || '?'}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h4 className="truncate text-sm font-black text-slate-800">{grad.nombre}</h4><span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${estadoConfig.color}`}>{obtenerIconoEstado(estadoConfig.iconKey, 9)}{estadoConfig.etiqueta}</span></div>
                      <p className="mt-1 truncate text-[10px] text-slate-400">DNI {grad.dni} · {grad.legajo || 'Sin legajo'} · {grad.correo || 'Sin correo'}</p>
                    </div>
                    {!esRechazado && <span className="hidden text-[9px] font-bold text-slate-400 sm:block">{siguientePaso(grad)}</span>}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <button onClick={() => setGraduadoEditar(grad)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-[9px] font-bold text-white"><Edit3 size={12} className="mr-1 inline" />Editar</button>
                    {!esRechazado && grad.estado === 'ACEPTADO' && <button onClick={() => abrirAsignacion(grad)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-[9px] font-bold text-white"><Armchair size={12} className="mr-1 inline" />Butacas</button>}
                    {misInvitados.length > 0 && <span className="text-[9px] font-semibold text-slate-400">{misInvitados.length} acompañantes</span>}
                    <details className="relative ml-auto">
                      <summary className="grid h-7 w-8 cursor-pointer list-none place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><MoreHorizontal size={15} /></summary>
                      <div className="absolute bottom-9 right-0 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                        {!esRechazado && !grad.identidad_corrobada_en && <button onClick={() => manejarCorroboracion(grad)} disabled={corroborandoId === grad.id} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"><BadgeCheck size={13} /> Verificar datos</button>}
                        {!esRechazado && <button onClick={() => manejarLink(grad)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"><Link2 size={13} /> Enlace</button>}
                        {!esRechazado && <button onClick={() => setGraduadoCredencial(grad)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"><CreditCard size={13} /> Ver credencial</button>}
                        <button onClick={() => manejarEliminar(grad.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50"><Trash2 size={13} /> Eliminar</button>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CONTADOR */}
      {!cargando && graduados.length > 0 && (
        <p className="text-center text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-wider">
          Mostrando {graduadosFiltrados.length} de {graduados.length} estudiantes
        </p>
      )}

      {/* MODALES */}
      {graduadoCredencial && <ModalCredencial egresado={graduadoCredencial} onCerrar={() => setGraduadoCredencial(null)} />}
      {linkQR && <ModalLinkRegistro egresado={linkQR.egresado} link={linkQR.link} onCerrar={() => setLinkQR(null)} />}
      {mostrarImportar && <ModalImportar onCerrar={() => setMostrarImportar(false)} onCompletado={cargarDatos} />}
      {graduadoAsignar && (
        <ModalAsignarAsientos
          graduado={graduadoAsignar}
          invitados={invitadosDe(graduadoAsignar.id)}
          ceremoniaId={graduadoAsignar.ceremonia_id}
          todosLosGraduados={graduados}
          todosLosInvitados={invitados}
          onCerrar={() => setGraduadoAsignar(null)}
          onAsignado={async () => {
            setGraduadoAsignar(null)
            await cargarDatos()
          }}
        />
      )}
      {graduadoEditar && <ModalEditarGraduado graduado={graduadoEditar} onCerrar={() => setGraduadoEditar(null)} onGuardar={guardarEdicion} />}
    </div>
  )
}
function ModalEditarGraduado({ graduado, onCerrar, onGuardar }) {
  const [form, setForm] = useState({ nombre: graduado.nombre || '', dni: graduado.dni || '', legajo: graduado.legajo || '', correo: graduado.correo || '', carrera: graduado.carrera || '', promedio: graduado.promedio || '' })
  const [guardando, setGuardando] = useState(false)
  async function enviar(evento) { evento.preventDefault(); setGuardando(true); try { await onGuardar(form) } catch (error) { alert(error.message) } finally { setGuardando(false) } }
  const campo = (clave, etiqueta, tipo = 'text') => <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500"><span>{etiqueta}</span><input type={tipo} value={form[clave]} onChange={e => setForm(actual => ({ ...actual, [clave]: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-sky-400" /></label>
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"><form onSubmit={enviar} className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-sky-600">Edición administrativa</p><h3 className="mt-1 text-lg font-black text-slate-900">Actualizar graduado</h3></div><button type="button" onClick={onCerrar} className="text-slate-400 hover:text-slate-900"><X size={20} /></button></div><div className="grid gap-3 sm:grid-cols-2">{campo('nombre', 'Nombre completo')}{campo('dni', 'DNI', 'text')}{campo('legajo', 'Legajo')}{campo('correo', 'Correo', 'email')}{campo('carrera', 'Carrera')}{campo('promedio', 'Promedio', 'number')}</div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCerrar} className="px-4 py-2 text-xs font-bold text-slate-500">Cancelar</button><button disabled={guardando} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-black text-white disabled:opacity-50">{guardando ? 'Guardando...' : 'Guardar cambios'}</button></div></form></div>
}
