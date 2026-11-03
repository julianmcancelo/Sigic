import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Users, UserPlus, Trash2, X, AlertCircle, CheckCircle2,
  Award, ShieldCheck, Mail, Phone, Edit3, Check, HeartHandshake,
  ScrollText, Sparkles, UserCheck, Armchair, GraduationCap
} from 'lucide-react'
import {
  obtenerInvitadosDeEgresado,
  cargarInvitados,
  eliminarInvitado,
  obtenerEntregadoresDeGraduado,
  obtenerProfesores,
  asignarEntregador,
  eliminarEntregador,
  actualizarGraduado,
  responderInvitacion
} from '../servicios/api'
import { emitirCambioSync } from '../lib/sync'
import { useConfirmacion } from './ModalConfirmacion'

export function ModalGestionPresencialGraduado({ egresado: egresadoInicial, onCerrar, onActualizado }) {
  const { confirmar, dialogoConfirmacion } = useConfirmacion()
  const [egresado, setEgresado] = useState(egresadoInicial)
  const [pestana, setPestana] = useState('datos') // 'datos' | 'familiares' | 'entregadores' | 'estado'

  // Estados de datos personales
  const [formDatos, setFormDatos] = useState({
    nombre: egresadoInicial?.nombre || '',
    dni: egresadoInicial?.dni || '',
    legajo: egresadoInicial?.legajo || '',
    correo: egresadoInicial?.correo || '',
    correo_personal: egresadoInicial?.correo_personal || '',
    telefono: egresadoInicial?.telefono || '',
    formula_juramento: egresadoInicial?.formula_juramento || 'PATRIA'
  })

  // Estados de familiares
  const [invitados, setInvitados] = useState([])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoDni, setNuevoDni] = useState('')
  const [esPadrino, setEsPadrino] = useState(false)

  // Estados de entregadores (docentes de estrado)
  const [entregadores, setEntregadores] = useState([])
  const [profesores, setProfesores] = useState([])
  const [profesorSeleccionado, setProfesorSeleccionado] = useState('')

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  useEffect(() => {
    if (!egresado?.id) return
    cargarTodo()
  }, [egresado?.id])

  async function cargarTodo() {
    setCargando(true)
    setError('')
    try {
      const [listaInvs, listaEntregadores, listaProfs] = await Promise.all([
        obtenerInvitadosDeEgresado(egresado.id).catch(() => []),
        obtenerEntregadoresDeGraduado(egresado.id).catch(() => []),
        obtenerProfesores().catch(() => [])
      ])
      setInvitados(Array.isArray(listaInvs) ? listaInvs : [])
      setEntregadores(Array.isArray(listaEntregadores) ? listaEntregadores : [])
      setProfesores(Array.isArray(listaProfs) ? listaProfs : [])
    } catch (err) {
      setError(err.message || 'Error al cargar los datos del graduado.')
    } finally {
      setCargando(false)
    }
  }

  // 1. Guardar Datos Personales y Fórmula de Jura
  async function handleGuardarDatos(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      const actualizados = await actualizarGraduado(egresado.id, {
        nombre: formDatos.nombre.trim(),
        dni: formDatos.dni.replace(/\D/g, ''),
        legajo: formDatos.legajo.trim(),
        correo: formDatos.correo.trim().toLowerCase(),
        correo_personal: formDatos.correo_personal ? formDatos.correo_personal.trim().toLowerCase() : null,
        telefono: formDatos.telefono ? formDatos.telefono.trim() : null,
        formula_juramento: formDatos.formula_juramento
      })
      setEgresado(prev => ({ ...prev, ...actualizados, ...formDatos }))
      setExito('Datos personales y académicos guardados correctamente.')
      emitirCambioSync('EGRESADOS', { id: egresado.id })
      if (onActualizado) onActualizado()
      setTimeout(() => setExito(''), 3500)
    } catch (err) {
      setError(err.message || 'Error al guardar los datos')
    } finally {
      setGuardando(false)
    }
  }

  // 2. Agregar Familiar / Acompañante
  async function handleAgregarFamiliar(e) {
    e.preventDefault()
    if (!nuevoNombre.trim()) {
      setError('Ingresá el nombre y apellido del acompañante')
      return
    }

    const dniLimpio = nuevoDni.replace(/\D/g, '')
    if (dniLimpio && dniLimpio.length < 6) {
      setError('El DNI debe tener al menos 6 dígitos numéricos')
      return
    }

    setGuardando(true)
    setError('')
    try {
      const nuevoInvitado = {
        nombre: nuevoNombre.trim(),
        dni: dniLimpio,
        es_padrino: esPadrino
      }

      await cargarInvitados(null, [nuevoInvitado], egresado.id)
      setNuevoNombre('')
      setNuevoDni('')
      setEsPadrino(false)
      setExito('Acompañante registrado con éxito.')
      emitirCambioSync('INVITADOS', { egresadoId: egresado.id })
      const listaActualizada = await obtenerInvitadosDeEgresado(egresado.id)
      setInvitados(Array.isArray(listaActualizada) ? listaActualizada : [])
      if (onActualizado) onActualizado()
      setTimeout(() => setExito(''), 3500)
    } catch (err) {
      setError(err.message || 'No se pudo agregar el acompañante')
    } finally {
      setGuardando(false)
    }
  }

  // 3. Eliminar Familiar con Modal Profesional
  async function handleEliminarFamiliar(inv) {
    const seguro = await confirmar({
      titulo: 'Eliminar acompañante',
      descripcion: `¿Deseas quitar a ${inv.nombre} de la lista de pases de este graduado?`,
      textoConfirmar: 'Eliminar pase',
      tipo: 'peligro'
    })
    if (!seguro) return

    setGuardando(true)
    setError('')
    try {
      await eliminarInvitado(inv.id)
      emitirCambioSync('INVITADOS', { egresadoId: egresado.id })
      const listaActualizada = await obtenerInvitadosDeEgresado(egresado.id)
      setInvitados(Array.isArray(listaActualizada) ? listaActualizada : [])
      if (onActualizado) onActualizado()
      setExito('Acompañante eliminado.')
      setTimeout(() => setExito(''), 3000)
    } catch (err) {
      setError(err.message || 'Error al eliminar acompañante')
    } finally {
      setGuardando(false)
    }
  }

  // 4. Asignar Docente Entregador de Diploma
  async function handleAsignarEntregador(e) {
    e.preventDefault()
    if (!profesorSeleccionado) return
    const prof = profesores.find(p => String(p.id) === String(profesorSeleccionado))
    if (!prof) return

    setGuardando(true)
    setError('')
    try {
      await asignarEntregador({
        egresado_id: egresado.id,
        nombre: prof.nombre,
        tipo: 'PROFESOR',
        profesor_id: prof.id
      })
      setProfesorSeleccionado('')
      const listaEnt = await obtenerEntregadoresDeGraduado(egresado.id)
      setEntregadores(Array.isArray(listaEnt) ? listaEnt : [])
      setExito(`Profesor ${prof.nombre} asignado como entregador de diploma.`)
      emitirCambioSync('ENTREGADORES', { egresadoId: egresado.id })
      if (onActualizado) onActualizado()
      setTimeout(() => setExito(''), 3500)
    } catch (err) {
      setError(err.message || 'Error al vincular el docente entregador')
    } finally {
      setGuardando(false)
    }
  }

  // 5. Eliminar Entregador
  async function handleEliminarEntregador(ent) {
    const seguro = await confirmar({
      titulo: 'Quitar entregador de diploma',
      descripcion: `¿Deseas quitar a ${ent.nombre} como entregador de diploma de este graduado?`,
      textoConfirmar: 'Quitar entregador',
      tipo: 'advertencia'
    })
    if (!seguro) return

    setGuardando(true)
    setError('')
    try {
      await eliminarEntregador(ent.id)
      const listaEnt = await obtenerEntregadoresDeGraduado(egresado.id)
      setEntregadores(Array.isArray(listaEnt) ? listaEnt : [])
      setExito('Entregador quitado.')
      emitirCambioSync('ENTREGADORES', { egresadoId: egresado.id })
      if (onActualizado) onActualizado()
      setTimeout(() => setExito(''), 3000)
    } catch (err) {
      setError(err.message || 'Error al quitar entregador')
    } finally {
      setGuardando(false)
    }
  }

  // 6. Cambiar Estado / Confirmar Asistencia / Subsanar Rechazo
  async function handleCambiarEstado(nuevoEstado) {
    const mensajes = {
      ACEPTADO: '¿Deseas confirmar la asistencia de este estudiante? Pasará a estado Aceptado/Confirmado.',
      RECHAZADO: '¿Registrar inasistencia oficial para este egresado?',
      PENDIENTE: '¿Restablecer el estado a pendiente de respuesta?'
    }
    const seguro = await confirmar({
      titulo: 'Modificar estado de convocatoria',
      descripcion: mensajes[nuevoEstado] || '¿Confirmar cambio de estado?',
      textoConfirmar: 'Aplicar cambio',
      tipo: nuevoEstado === 'RECHAZADO' ? 'peligro' : 'info'
    })
    if (!seguro) return

    setGuardando(true)
    setError('')
    try {
      await responderInvitacion(egresado.id, nuevoEstado)
      setEgresado(prev => ({ ...prev, estado: nuevoEstado, estado_flujo: nuevoEstado === 'ACEPTADO' ? 'COMPLETO' : nuevoEstado }))
      setExito(`Estado actualizado a ${nuevoEstado}.`)
      emitirCambioSync('EGRESADOS', { id: egresado.id })
      if (onActualizado) onActualizado()
      setTimeout(() => setExito(''), 3500)
    } catch (err) {
      setError(err.message || 'Error al actualizar estado')
    } finally {
      setGuardando(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera Principal */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
              <GraduationCap size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md inline-block">
                  Atención Presencial / Ventanilla
                </span>
                <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md ${
                  egresado?.estado === 'ACEPTADO' ? 'bg-emerald-100 text-emerald-800' :
                  egresado?.estado === 'RECHAZADO' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {egresado?.estado === 'ACEPTADO' ? 'Confirmado' : egresado?.estado === 'RECHAZADO' ? 'Inasistencia' : 'Pendiente'}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 leading-tight truncate">
                {egresado?.nombre || 'Graduado'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {egresado?.carrera || 'Carrera Beltrán'} · DNI {egresado?.dni || '-'} · Legajo {egresado?.legajo || '—'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Pestañas de Navegación del Modal */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 px-5 pt-2 bg-slate-50/50 overflow-x-auto [scrollbar-width:none]">
          {[
            { id: 'datos', label: 'Datos & Jura', icon: Edit3 },
            { id: 'familiares', label: `Familiares (${invitados.length})`, icon: Users },
            { id: 'entregadores', label: `Docentes Estrado (${entregadores.length})`, icon: Award },
            { id: 'estado', label: 'Estado & Convocatoria', icon: ShieldCheck }
          ].map(t => {
            const Icon = t.icon
            const activo = pestana === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setPestana(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-bold transition cursor-pointer shrink-0 ${
                  activo
                    ? 'border-sky-600 text-sky-700 bg-white font-black rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-lg'
                }`}
              >
                <Icon size={14} className={activo ? 'text-sky-600' : 'text-slate-400'} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* Alertas */}
        <div className="px-5 pt-3">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-bold text-rose-800 animate-in fade-in">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {exito && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-800 animate-in fade-in">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{exito}</span>
            </div>
          )}
        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: DATOS PERSONALES, CONTACTO Y JURA */}
          {pestana === 'datos' && (
            <form onSubmit={handleGuardarDatos} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Nombre Completo Oficial *
                  </label>
                  <input
                    type="text"
                    required
                    value={formDatos.nombre}
                    onChange={e => setFormDatos(p => ({ ...p, nombre: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    DNI *
                  </label>
                  <input
                    type="text"
                    required
                    value={formDatos.dni}
                    onChange={e => setFormDatos(p => ({ ...p, dni: e.target.value.replace(/\D/g, '') }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Legajo
                  </label>
                  <input
                    type="text"
                    value={formDatos.legajo}
                    onChange={e => setFormDatos(p => ({ ...p, legajo: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Correo Institucional
                  </label>
                  <input
                    type="email"
                    value={formDatos.correo}
                    onChange={e => setFormDatos(p => ({ ...p, correo: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Correo Personal / Alternativo
                  </label>
                  <input
                    type="email"
                    value={formDatos.correo_personal}
                    onChange={e => setFormDatos(p => ({ ...p, correo_personal: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formDatos.telefono}
                    onChange={e => setFormDatos(p => ({ ...p, telefono: e.target.value }))}
                    placeholder="Ej. 11 4455 6677"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Fórmula de Juramento Protocolar
                  </label>
                  <select
                    value={formDatos.formula_juramento}
                    onChange={e => setFormDatos(p => ({ ...p, formula_juramento: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="PATRIA">Por la Patria</option>
                    <option value="DIOS_Y_PATRIA">Por Dios y la Patria</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{guardando ? 'Guardando...' : 'Guardar Datos del Graduado'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: GESTIÓN DE FAMILIARES Y ACOMPAÑANTES */}
          {pestana === 'familiares' && (
            <div className="space-y-4">
              <form onSubmit={handleAgregarFamiliar} className="bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <UserPlus size={14} className="text-sky-600" />
                    <span>Cargar Acompañante Presencialmente</span>
                  </p>
                  <span className="text-[9.5px] text-slate-400 font-semibold">Genera pase digital QR</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Vidal Cristina"
                      value={nuevoNombre}
                      onChange={e => setNuevoNombre(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                      DNI (Opcional para menores)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 10090267"
                      value={nuevoDni}
                      onChange={e => setNuevoDni(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
                      maxLength={9}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-bold">
                    <input
                      type="checkbox"
                      checked={esPadrino}
                      onChange={e => setEsPadrino(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="flex items-center gap-1">
                      <Award size={13} className={esPadrino ? 'text-amber-500' : 'text-slate-400'} />
                      Familiar Padrino (Sube al estrado a entregar título)
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={guardando || !nuevoNombre.trim()}
                    className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-lg transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <UserPlus size={13} />
                    <span>Agregar</span>
                  </button>
                </div>
              </form>

              {/* Lista de Acompañantes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Acompañantes Inscriptos ({invitados.length})</span>
                </div>

                {invitados.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
                    Sin acompañantes registrados aún.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                    {invitados.map(inv => {
                      const esPad = Boolean(inv.es_padrino || inv.esPadrino)
                      return (
                        <div key={inv.id} className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50/80 transition">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              esPad ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {esPad ? <Award size={15} /> : <Users size={15} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 leading-tight truncate">
                                {inv.nombre}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                {inv.dni ? `DNI ${inv.dni}` : 'Sin DNI'}
                                {inv.asiento_id ? ` · Butaca ${inv.asiento_id}` : ' · Sin butaca'}
                                {esPad && <strong className="text-amber-700 ml-1.5">· Padrino</strong>}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleEliminarFamiliar(inv)}
                            disabled={guardando}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Eliminar acompañante"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DOCENTES ENTREGADORES DE DIPLOMA */}
          {pestana === 'entregadores' && (
            <div className="space-y-4">
              <form onSubmit={handleAsignarEntregador} className="bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Award size={14} className="text-amber-600" />
                    <span>Asignar Docente para Entrega de Diploma</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={profesorSeleccionado}
                    onChange={e => setProfesorSeleccionado(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Seleccionar Profesor / Autoridad --</option>
                    {profesores.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.departamento ? `(${p.departamento})` : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={guardando || !profesorSeleccionado}
                    className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-lg transition cursor-pointer shrink-0"
                  >
                    Asignar
                  </button>
                </div>
              </form>

              {/* Lista de Entregadores */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600">Entregadores en Estrado ({entregadores.length})</p>
                {entregadores.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
                    Sin entregadores asignados. Las autoridades entregarán por defecto en el estrado.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                    {entregadores.map(ent => (
                      <div key={ent.id} className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50/80 transition">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                            <Award size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 leading-tight">{ent.nombre}</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{ent.tipo || 'Docente'}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEliminarEntregador(ent)}
                          disabled={guardando}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Quitar entregador"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ESTADO INSTITUCIONAL Y REINCORPORACIÓN */}
          {pestana === 'estado' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Estado Actual en la Ceremonia</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Permite modificar el estado de convocatoria en caso de que el graduado confirme presencialmente, presente un certificado o haya declinado la asistencia por error.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCambiarEstado('ACEPTADO')}
                    disabled={guardando || egresado?.estado === 'ACEPTADO'}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 size={14} />
                    <span>Confirmar / Subsanar Asistencia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCambiarEstado('PENDIENTE')}
                    disabled={guardando || egresado?.estado === 'PENDIENTE'}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Users size={14} />
                    <span>Marcar Pendiente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCambiarEstado('RECHAZADO')}
                    disabled={guardando || egresado?.estado === 'RECHAZADO'}
                    className="bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <AlertCircle size={14} />
                    <span>Registrar Inasistencia Oficial</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-3 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <HeartHandshake size={14} className="text-sky-600" />
            Atención presencial institucional
          </span>
          <button
            type="button"
            onClick={onCerrar}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>

      </div>

      {dialogoConfirmacion}
    </div>,
    document.body
  )
}
