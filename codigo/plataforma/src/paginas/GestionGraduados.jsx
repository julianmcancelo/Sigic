/**
 * GestionGraduados - Pantalla administrativa para gestionar graduados y su flujo de trabajo.
 * Muestra indicadores de progreso para cada graduado: invitación, aceptación, invitados, entregadores.
 * Reemplaza a la antigua GestionInvitados.jsx con terminología actualizada.
 */
import { useState, useEffect } from 'react'
import { Users, Search, Upload, Trash2, X, Mail, Link2, CreditCard, UserX, CheckCircle2, Clock, AlertCircle, CircleDot, Armchair, Circle, Send, Award } from 'lucide-react'

import { 
  obtenerGraduados, 
  eliminarGraduado,
  vaciarGraduados,
  obtenerInvitados, 
  enviarInvitacion 
} from '../servicios/api'

import { StepCard } from '../componentes/StepCard'
import { ModalQR } from '../componentes/ModalQR'
import { ModalLinkRegistro } from '../componentes/ModalLinkRegistro'
import { ModalCredencial } from '../componentes/ModalCredencial'
import { FormularioGraduado } from '../componentes/FormularioGraduado'
import { ModalImportar } from '../componentes/ModalImportar'
import { HeaderGlobal } from '../componentes/HeaderGlobal'
import { ModalAsignarAsientos } from '../componentes/ModalAsignarAsientos'

// Configuración visual de los estados del flujo (sin emojis)
const ESTADOS_FLUJO = {
  SIN_INVITAR:       { etiqueta: 'Sin invitar',        color: 'bg-slate-100/80 text-slate-600 border border-slate-200/50',   iconKey: 'SIN_INVITAR' },
  PENDIENTE:         { etiqueta: 'Esperando respuesta', color: 'bg-amber-50/80 text-amber-700 border border-amber-200/50',    iconKey: 'PENDIENTE' },
  CARGA_INCOMPLETA:  { etiqueta: 'Carga incompleta',   color: 'bg-orange-50/80 text-orange-700 border border-orange-200/50',  iconKey: 'CARGA_INCOMPLETA' },
  COMPLETO:          { etiqueta: 'Listo para asignar',  color: 'bg-emerald-50/80 text-emerald-700 border border-emerald-200/50', iconKey: 'COMPLETO' },
  RECHAZADO:         { etiqueta: 'No aceptó',        color: 'bg-red-50/80 text-red-700 border border-red-200/50',        iconKey: 'RECHAZADO' },
}

export function GestionGraduados({ usuario, onVolver, onCerrarSesion, sinHeader }) {
  // Función para obtener el componente de ícono correspondiente (sin emojis)
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

  // Calcular el promedio máximo
  const promediosValidos = graduados.map(g => parseFloat(g.promedio)).filter(p => !isNaN(p) && p > 0)
  const maxPromedio = promediosValidos.length > 0 ? Math.max(...promediosValidos) : 0

  // Filtrado por búsqueda y estado
  const graduadosFiltrados = graduados.filter(g => {
    const term = busqueda.toLowerCase().trim()
    const coincideBusqueda = !term || 
      g.nombre?.toLowerCase().includes(term) || 
      g.dni?.includes(term) || 
      g.legajo?.toLowerCase().includes(term)

    const coincideEstado = filtroEstado === 'TODOS' || g.estado_flujo === filtroEstado

    return coincideBusqueda && coincideEstado
  })

  // Contadores por estado
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
    <div className={sinHeader ? '' : 'min-h-screen bg-[#F0F4F8]'}>
      {!sinHeader && (
        <HeaderGlobal
          titulo="Gestión de Graduados"
          onVolver={onVolver}
          onCerrarSesion={onCerrarSesion}
        />
      )}

      <main className={`mx-auto max-w-7xl ${sinHeader ? 'px-0 py-4' : 'px-5 py-8'}`}>
        {/* Encabezado Principal */}
        <section className="mb-8 overflow-hidden rounded-[40px] bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/20 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -ml-32 -mb-32" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1 bg-sky-500/20 rounded-full border border-sky-500/30">
                  <span className="text-[10px] font-black uppercase text-sky-400 tracking-widest">Panel de Control</span>
                </div>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-2">Gestión de Graduados</h1>
              <div className="flex items-center gap-4 text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span className="text-xs font-bold uppercase tracking-widest">{graduados.length} Graduados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-widest">{invitados.length} Invitados</span>
                </div>
                {maxPromedio > 0 && (
                  <div className="flex items-center gap-2 text-amber-400">
                    <Award size={14} />
                    <span className="text-xs font-bold uppercase tracking-widest">Mejor Promedio: {maxPromedio.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setMostrarForm(!mostrarForm)}
              className={`group relative overflow-hidden px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all duration-300
                ${mostrarForm ? 'bg-white/10 text-white border border-white/20' : 'bg-sky-500 text-white shadow-xl shadow-sky-500/20 hover:scale-105 active:scale-95'}`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {mostrarForm ? 'Cerrar Formulario' : 'Nuevo Graduado'}
                {!mostrarForm && <Users size={16} className="transition-transform group-hover:-translate-y-0.5" />}
              </span>
            </button>
          </div>
        </section>

        {/* Filtros por Estado (Pills) */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { clave: 'TODOS', etiqueta: 'Todos', color: 'bg-slate-900 text-white' },
            { clave: 'SIN_INVITAR', etiqueta: 'Sin invitar', color: 'bg-slate-500 text-white' },
            { clave: 'PENDIENTE', etiqueta: 'Pendientes', color: 'bg-amber-500 text-white' },
            { clave: 'CARGA_INCOMPLETA', etiqueta: 'Incompletos', color: 'bg-orange-500 text-white' },
            { clave: 'COMPLETO', etiqueta: 'Completos', color: 'bg-emerald-500 text-white' },
            { clave: 'RECHAZADO', etiqueta: 'Rechazados', color: 'bg-red-500 text-white' },
          ].map(f => (
            <button
              key={f.clave}
              onClick={() => setFiltroEstado(f.clave)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                filtroEstado === f.clave 
                  ? f.color + ' shadow-lg' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'
              }`}
            >
              {f.etiqueta} ({contadores[f.clave] || 0})
            </button>
          ))}
        </div>

        {/* Barra de Búsqueda y Acciones */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o legajo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-semibold focus:outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/5 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setMostrarImportar(true)} className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:border-sky-500/30 hover:text-sky-600 transition-all">
              <Upload size={14} /> Importar CSV/XLSX
            </button>
            <button onClick={manejarVaciar} className="flex items-center gap-2 px-4 py-3 bg-red-50 border-2 border-red-100 rounded-2xl text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all" title="Vaciar lista completa">
              <Trash2 size={14} /> Vaciar
            </button>
          </div>
        </div>

        {/* Formulario de Alta */}
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
            <CheckCircle2 size={20} className="shrink-0" />
            <p className="text-sm font-bold">{altaExitosa}</p>
          </div>
        )}

        {/* Error de conexión */}
        {error && !cargando && (
          <div className="flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100 mb-6">
            <X size={16} className="text-red-500" />
            <div className="flex-1">
              <p className="text-xs font-bold text-red-800">{error}</p>
              <p className="text-[10px] text-red-600/70">Asegurate de que el servidor backend esté encendido.</p>
            </div>
            <button onClick={cargarDatos} className="rounded-lg bg-red-500 px-3 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm hover:bg-red-600">
              Reintentar
            </button>
          </div>
        )}

        {/* Lista de Graduados */}
        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Cargando graduados...</p>
            </div>
          </div>
        ) : graduadosFiltrados.length === 0 ? (
          <div className="py-20 text-center">
            <Users size={48} className="mx-auto mb-4 text-slate-200" />
            <h3 className="text-xl font-black text-slate-400 mb-2">
              {busqueda || filtroEstado !== 'TODOS' ? 'No hay coincidencias' : 'Sin graduados registrados'}
            </h3>
            <p className="text-sm text-slate-400">
              {busqueda || filtroEstado !== 'TODOS' ? 'Probá cambiar los filtros o la búsqueda' : 'Comenzá agregando graduados con el botón superior.'}
            </p>
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
                  className={`bg-white rounded-3xl border shadow-sm hover:shadow-xl hover:shadow-slate-100/40 transition-all duration-300 overflow-hidden ${
                    esRechazado ? 'border-red-200 opacity-60' : 'border-slate-100/80'
                  }`}
                >
                  <div className="p-6">
                    {/* Fila superior: Info del graduado + Acciones */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-md flex-shrink-0 ${
                          esRechazado ? 'bg-red-400' : 'bg-gradient-to-br from-sky-500 to-indigo-600 shadow-sky-500/10'
                        }`}>
                          {grad.nombre?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">{grad.nombre}</h3>
                            {!esRechazado && maxPromedio > 0 && parseFloat(grad.promedio) === maxPromedio && (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg text-[9px] font-black uppercase tracking-widest ml-2">
                                <Award size={12} className="text-amber-500" />
                                Excelencia Académica
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-md text-[11px] font-semibold border border-slate-100">
                              <span className="opacity-50 font-black">DNI</span> {grad.dni}
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-md text-[11px] font-semibold border border-slate-100">
                              <span className="opacity-50 font-black">L</span> {grad.legajo}
                            </span>
                            {grad.correo && (
                              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-md text-[11px] font-semibold border border-slate-100">
                                <Mail size={12} className="opacity-40" />
                                {grad.correo}
                              </span>
                            )}
                            {grad.promedio && parseFloat(grad.promedio) > 0 && (
                              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 rounded-md text-[11px] font-bold border border-slate-200/80">
                                Promedio: {parseFloat(grad.promedio).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Badge de estado (sin emojis) */}
                      <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${estadoConfig.color}`}>
                        {obtenerIconoEstado(estadoConfig.iconKey, 12)}
                        <span>{estadoConfig.etiqueta}</span>
                      </div>
                    </div>

                    {/* Pipeline visual del flujo de trabajo (sin emojis y centrado en flex) */}
                    {!esRechazado && (
                      <div className="flex items-center justify-between w-full mb-6 mt-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60">
                        {/* Paso 1: Invitación */}
                        <PasoFlujo
                          etiqueta="Invitación"
                          completado={grad.invitacion_enviada}
                          activo={!grad.invitacion_enviada}
                        />
                        <LineaConexion completada={grad.invitacion_enviada} />

                        {/* Paso 2: Aceptación */}
                        <PasoFlujo
                          etiqueta="Aceptación"
                          completado={grad.estado === 'ACEPTADO'}
                          activo={grad.estado === 'PENDIENTE'}
                          pendiente={grad.estado === 'PENDIENTE'}
                        />
                        <LineaConexion completada={grad.estado === 'ACEPTADO'} />

                        {/* Paso 3: Invitados */}
                        <PasoFlujo
                          etiqueta={`Invitados (${grad.cantidad_invitados || 0})`}
                          completado={(grad.cantidad_invitados || 0) > 0}
                          activo={grad.estado === 'ACEPTADO' && (grad.cantidad_invitados || 0) === 0}
                        />
                        <LineaConexion completada={(grad.cantidad_invitados || 0) > 0 && (grad.cantidad_entregadores || 0) > 0} />

                        {/* Paso 4: Entregadores */}
                        <PasoFlujo
                          etiqueta={`Entregadores (${grad.cantidad_entregadores || 0}/3)`}
                          completado={(grad.cantidad_entregadores || 0) > 0}
                          activo={grad.estado === 'ACEPTADO' && (grad.cantidad_entregadores || 0) === 0}
                        />
                      </div>
                    )}

                    {/* Acciones rápidas (Ghost style) */}
                    {!esRechazado && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100/50">
                        <button
                          onClick={() => manejarEnvioInvitacion(grad)}
                          disabled={enviandoId === grad.id || !grad.correo}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 ${
                            exitoEnvio === grad.id 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                              : 'bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white border border-transparent'
                          }`}
                        >
                          {exitoEnvio === grad.id ? <CheckCircle2 size={14} /> : <Send size={14} />}
                          {enviandoId === grad.id ? 'Enviando...' : exitoEnvio === grad.id ? 'Enviado' : 'Enviar invitación'}
                        </button>
                        
                        <div className="w-px h-6 bg-slate-200 mx-1" />

                        <button
                          onClick={() => manejarLink(grad)}
                          className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                        >
                          <Link2 size={14} /> Link
                        </button>
                        <button
                          onClick={() => setGraduadoCredencial(grad)}
                          className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                        >
                          <CreditCard size={14} /> Credencial
                        </button>
                        {grad.estado === 'ACEPTADO' && (
                          <button
                            onClick={() => setGraduadoAsignar(grad)}
                            className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                          >
                            <Armchair size={14} /> Asientos
                          </button>
                        )}
                        <div className="flex-1" />
                        <button
                          onClick={() => manejarEliminar(grad.id)}
                          className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    )}

                    {/* Lista de invitados cargados */}
                    {misInvitados.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                          Invitados registrados ({misInvitados.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {misInvitados.map(inv => (
                            <button
                              key={inv.id}
                              onClick={() => setInvitadoQR(inv)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-all border border-slate-100"
                            >
                              <div className={`w-2 h-2 rounded-full ${inv.presente ? 'bg-emerald-500' : 'bg-slate-300'}`} />
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

        {/* Contador final */}
        {!cargando && graduados.length > 0 && (
          <p className="text-center text-xs text-slate-400 mt-8 font-semibold">
            Mostrando {graduadosFiltrados.length} de {graduados.length} graduados
          </p>
        )}
      </main>

      {/* Modales */}
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

// ─── Componentes auxiliares del pipeline de flujo ─────────────

function PasoFlujo({ etiqueta, completado, activo, pendiente }) {
  return (
    <div className="flex flex-col items-center flex-1 z-10">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border-2 bg-white ${
        completado ? 'border-sky-500 text-sky-500 shadow-sm' :
        activo ? 'border-sky-500 border-[3px] shadow-[0_0_12px_rgba(14,165,233,0.3)]' :
        'border-slate-200'
      }`}>
        {completado ? <div className="w-2.5 h-2.5 bg-sky-500 rounded-full" /> :
         activo ? <div className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-pulse" /> :
         null}
      </div>
      <span className={`text-[10px] uppercase tracking-wider text-center mt-3 ${
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
    <div className="flex-1 flex items-center justify-center px-0 min-w-[20px] self-start mt-3">
      <div className={`h-[2px] w-full transition-all duration-300 ${
        completada ? 'bg-sky-500' : 'bg-slate-200'
      }`} />
    </div>
  )
}
