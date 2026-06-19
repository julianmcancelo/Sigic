import { useState, useEffect } from 'react'
import { 
  Users, Search, Upload, Trash2, X, Mail, Link2, CreditCard, 
  UserX, CheckCircle2, Clock, AlertCircle, Armchair, Send, Award, PlusCircle
} from 'lucide-react'

import { 
  obtenerGraduados, 
  eliminarGraduado,
  vaciarGraduados,
  obtenerInvitados, 
  enviarInvitacion 
} from '../../servicios/api'

import { ModalQR } from '../../componentes/ModalQR'
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

const ACCENT = '#0EA5E9'
const DARK   = '#2A3448'

export function GestionGraduados({ usuario, onVolver, onCerrarSesion, sinHeader }) {
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
  const [invitadoQR, setInvitadoQR] = useState(null)
  const [linkQR, setLinkQR] = useState(null)
  const [graduadoCredencial, setGraduadoCredencial] = useState(null)
  const [graduadoAsignar, setGraduadoAsignar] = useState(null)

  const [enviandoId, setEnviandoId] = useState(null)
  const [exitoEnvio, setExitoEnvio] = useState(null)
  const [altaExitosa, setAltaExitosa] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    setCargando(true)
    setError('')
    try {
      const [listaGrad, listaInv] = await Promise.all([obtenerGraduados(), obtenerInvitados()])
      setGraduados(listaGrad)
      setInvitados(listaInv)
    } catch {
      setError('Error de conexión al servidor')
    } finally {
      setCargando(false)
    }
  }

  async function manejarEnvioInvitacion(grad) {
    if (!grad.correo) {
      alert('Este graduado no tiene un correo electrónico registrado.')
      return
    }
    setEnviandoId(grad.id)
    try {
      await enviarInvitacion(grad.id)
      setExitoEnvio(grad.id)
      setTimeout(() => setExitoEnvio(null), 3000)
      await cargarDatos()
    } catch (err) {
      alert(err.message)
    } finally {
      setEnviandoId(null)
    }
  }

  function manejarLink(grad) {
    const url = `${window.location.origin}${window.location.pathname}?token=${grad.token}`
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

  const promediosValidos = graduados.map(g => parseFloat(g.promedio)).filter(p => !isNaN(p) && p > 0)
  const maxPromedio = promediosValidos.length > 0 ? Math.max(...promediosValidos) : 0

  const graduadosFiltrados = graduados.filter(g => {
    const term = busqueda.toLowerCase().trim()
    const coincideBusqueda = !term || 
      g.nombre?.toLowerCase().includes(term) || 
      g.dni?.includes(term) || 
      g.legajo?.toLowerCase().includes(term)

    const coincideEstado = filtroEstado === 'TODOS' || g.estado_flujo === filtroEstado

    return coincideBusqueda && coincideEstado
  })

  const contadores = {
    TODOS: graduados.length,
    SIN_INVITAR: graduados.filter(g => g.estado_flujo === 'SIN_INVITAR').length,
    PENDIENTE: graduados.filter(g => g.estado_flujo === 'PENDIENTE').length,
    CARGA_INCOMPLETA: graduados.filter(g => g.estado_flujo === 'CARGA_INCOMPLETA').length,
    COMPLETO: graduados.filter(g => g.estado_flujo === 'COMPLETO').length,
    RECHAZADO: graduados.filter(g => g.estado_flujo === 'RECHAZADO').length,
  }

  const invitadosDe = (id) => invitados.filter(i => i.egresadoId === id || i.egresado_id === id)

  return (
    <div className="font-sans">
      {/* HEADER INTEGRADO PRO */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: DARK }}>Gestión de Estudiantes</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Padrón de Graduados & Acompañantes</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMostrarImportar(true)} 
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm"
          >
            <Upload size={13} /> Importar Excel/CSV
          </button>
          
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-sky-600 transition-all active:scale-95 shadow-sm"
          >
            <PlusCircle size={14} /> {mostrarForm ? 'Cerrar Formulario' : 'Nuevo Estudiante'}
          </button>
        </div>
      </div>

      {/* METRICAS COMPACTAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Total Estudiantes</span>
            <span className="text-xl font-black tabular-nums" style={{ color: DARK }}>{graduados.length}</span>
          </div>
          <div className="h-8 w-8 rounded-lg bg-sky-50 flex items-center justify-center text-[#0EA5E9]"><Users size={16} /></div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Acompañantes Registrados</span>
            <span className="text-xl font-black tabular-nums" style={{ color: DARK }}>{invitados.length}</span>
          </div>
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500"><Users size={16} /></div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Mejor Promedio</span>
            <span className="text-xl font-black tabular-nums text-amber-500">{maxPromedio > 0 ? maxPromedio.toFixed(2) : '-'}</span>
          </div>
          <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500"><Award size={16} /></div>
        </div>
      </div>

      {/* FILTROS PILLS */}
      <div className="flex flex-wrap gap-1.5 mb-6">
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
            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
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
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o legajo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-sky-500 transition-all shadow-sm placeholder-slate-400"
          />
        </div>
        
        {graduados.length > 0 && (
          <button 
            onClick={manejarVaciar} 
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
          >
            <Trash2 size={13} /> Vaciar Lista
          </button>
        )}
      </div>

      {/* FORMULARIO DE ALTA */}
      {mostrarForm && (
        <div className="mb-6">
          <FormularioGraduado
            onCreado={(nuevo) => {
              setMostrarForm(false)
              setAltaExitosa(`${nuevo.nombre} fue registrado correctamente en la ceremonia activa.`)
              cargarDatos()
              setTimeout(() => setAltaExitosa(''), 6000)
            }}
            onCancelar={() => setMostrarForm(false)}
          />
        </div>
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
        <div className="space-y-4">
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
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm ${
                        esRechazado ? 'bg-red-400' : 'bg-gradient-to-br from-[#0EA5E9] to-indigo-500'
                      }`}>
                        {grad.nombre?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-sm tracking-tight" style={{ color: DARK }}>{grad.nombre}</h4>
                          {!esRechazado && maxPromedio > 0 && parseFloat(grad.promedio) === maxPromedio && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[7.5px] font-black uppercase tracking-wider">
                              <Award size={10} className="text-amber-500" /> Excelencia
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 font-semibold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                            DNI: {grad.dni}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                            Legajo: {grad.legajo}
                          </span>
                          {grad.carrera && (
                            <span className="text-[10px] text-[#0ea5e9] font-bold bg-sky-50 border border-sky-100 px-2 py-0.5 rounded">
                              {grad.carrera}
                            </span>
                          )}
                          {grad.promedio && parseFloat(grad.promedio) > 0 && (
                            <span className="text-[10px] text-slate-600 font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                              Prom: {parseFloat(grad.promedio).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${estadoConfig.color}`}>
                      {obtenerIconoEstado(estadoConfig.iconKey, 10)}
                      <span>{estadoConfig.etiqueta}</span>
                    </div>
                  </div>

                  {/* Pipeline de Flujo Compacto */}
                  {!esRechazado && (
                    <div className="flex items-center justify-between w-full mb-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <PasoFlujo
                        etiqueta="Invitación"
                        completado={grad.invitacion_enviada}
                        activo={!grad.invitacion_enviada}
                      />
                      <LineaConexion completada={grad.invitacion_enviada} />

                      <PasoFlujo
                        etiqueta="Aceptación"
                        completado={grad.estado === 'ACEPTADO'}
                        activo={grad.estado === 'PENDIENTE'}
                      />
                      <LineaConexion completada={grad.estado === 'ACEPTADO'} />

                      <PasoFlujo
                        etiqueta={`Invitados (${grad.cantidad_invitados || 0})`}
                        completado={(grad.cantidad_invitados || 0) > 0}
                        activo={grad.estado === 'ACEPTADO' && (grad.cantidad_invitados || 0) === 0}
                      />
                      <LineaConexion completada={(grad.cantidad_invitados || 0) > 0 && (grad.cantidad_entregadores || 0) > 0} />

                      <PasoFlujo
                        etiqueta={`Entregadores (${grad.cantidad_entregadores || 0}/3)`}
                        completado={(grad.cantidad_entregadores || 0) > 0}
                        activo={grad.estado === 'ACEPTADO' && (grad.cantidad_entregadores || 0) === 0}
                      />
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                    {!esRechazado && (
                      <>
                        <button
                          onClick={() => manejarEnvioInvitacion(grad)}
                          disabled={enviandoId === grad.id || !grad.correo}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 border ${
                            exitoEnvio === grad.id 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                              : 'bg-sky-50 text-sky-600 border-transparent hover:bg-sky-500 hover:text-white'
                          }`}
                        >
                          {exitoEnvio === grad.id ? <CheckCircle2 size={12} /> : <Send size={12} />}
                          {enviandoId === grad.id ? 'Enviando...' : exitoEnvio === grad.id ? 'Enviado' : 'Enviar invitación'}
                        </button>
                        
                        <button
                          onClick={() => manejarLink(grad)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors border border-transparent"
                        >
                          <Link2 size={12} /> Link
                        </button>
                        
                        <button
                          onClick={() => setGraduadoCredencial(grad)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors border border-transparent"
                        >
                          <CreditCard size={12} /> Credencial
                        </button>
                        
                        {grad.estado === 'ACEPTADO' && (
                          <button
                            onClick={() => setGraduadoAsignar(grad)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors border border-transparent"
                          >
                            <Armchair size={12} /> Asientos
                          </button>
                        )}
                      </>
                    )}
                    <div className="flex-1" />
                    <button
                      onClick={() => manejarEliminar(grad.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors border border-transparent"
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>

                  {/* Invitados del graduado */}
                  {misInvitados.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                        Acompañantes ({misInvitados.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {misInvitados.map(inv => (
                          <button
                            key={inv.id}
                            onClick={() => setInvitadoQR(inv)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded text-[9.5px] font-semibold text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-all"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${inv.presente ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                            {inv.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
      {invitadoQR && <ModalQR invitado={invitadoQR} onCerrar={() => setInvitadoQR(null)} />}
      {mostrarImportar && <ModalImportar onCerrar={() => setMostrarImportar(false)} onCompletado={cargarDatos} />}
      {graduadoAsignar && (
        <ModalAsignarAsientos
          graduado={graduadoAsignar}
          invitados={invitadosDe(graduadoAsignar.id)}
          ceremoniaId={graduadoAsignar.ceremonia_id}
          todosLosGraduados={graduados}
          todosLosInvitados={invitados}
          onCerrar={() => setGraduadoAsignar(null)}
          onAsignado={() => {
            setGraduadoAsignar(null)
            cargarDatos()
          }}
        />
      )}
    </div>
  )
}

function PasoFlujo({ etiqueta, completado, activo }) {
  return (
    <div className="flex flex-col items-center flex-1 z-10">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 border bg-white ${
        completado ? 'border-sky-500' :
        activo ? 'border-sky-500 border-2 shadow-[0_0_8px_rgba(14,165,233,0.35)]' :
        'border-slate-200'
      }`}>
        {completado ? <div className="w-1.5 h-1.5 bg-sky-500 rounded-full" /> :
         activo ? <div className="w-1 h-1 bg-sky-500 rounded-full animate-pulse" /> :
         null}
      </div>
      <span className={`text-[8px] uppercase tracking-wider text-center mt-1.5 ${
        completado ? 'text-slate-700 font-bold' : 
        activo ? 'text-sky-600 font-black' : 
        'text-slate-400 font-semibold'
      }`}>
        <span className="sm:hidden">{etiqueta.split(' ')[0]}</span>
        <span className="hidden sm:inline">{etiqueta}</span>
      </span>
    </div>
  )
}

function LineaConexion({ completada }) {
  return (
    <div className="flex-1 flex items-center justify-center px-0 min-w-[15px] self-start mt-2">
      <div className={`h-[1px] w-full transition-all duration-300 ${
        completada ? 'bg-sky-400' : 'bg-slate-200'
      }`} />
    </div>
  )
}
