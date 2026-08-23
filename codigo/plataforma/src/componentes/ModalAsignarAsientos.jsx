import React, { useState, useEffect } from 'react'
import { X, Armchair, CheckCircle2, User, RefreshCw, AlertTriangle, LockKeyhole, Users, ChevronRight, RotateCcw } from 'lucide-react'
import { SeleccionAsientos } from '../paginas/SeleccionAsientos'
import { BASE, asignarAsientos, obtenerAjustes } from '../servicios/api'

export function ModalAsignarAsientos({
  graduado,
  invitados,
  ceremoniaId,
  todosLosGraduados,
  todosLosInvitados,
  onCerrar,
  onAsignado
}) {
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const [estructura, setEstructura] = useState(null)
  const [mapaRoles, setMapaRoles] = useState({})
  
  // Asignaciones locales en tiempo real
  const [asignaciones, setAsignaciones] = useState({
    egresadoAsiento: graduado.asiento_id || null,
    invitadosAsientos: {} // { [invitadoId]: asientoId }
  })

  // Persona activa para recibir el click en el asiento
  // tipo: 'egresado' | 'entregador' | 'invitado'
  // id: null (para egresado/entregador) o ID de invitado
  const [personaActiva, setPersonaActiva] = useState({ tipo: 'egresado', id: null })

  useEffect(() => {
    // Cada grupo abre una sesión local nueva para que no se filtren selecciones previas.
    const invAsientos = {}
    invitados.forEach(inv => {
      invAsientos[inv.id] = inv.asiento_id || null
    })
    setAsignaciones({
      egresadoAsiento: graduado.asiento_id || null,
      invitadosAsientos: invAsientos
    })
    const primerPendiente = !graduado.asiento_id
      ? { tipo: 'egresado', id: null }
      : invitados.find(inv => !inv.asiento_id)
        ? { tipo: 'invitado', id: invitados.find(inv => !inv.asiento_id).id }
        : { tipo: 'egresado', id: null }
    setPersonaActiva(primerPendiente)
    setError('')
  }, [graduado.id, graduado.asiento_id, invitados])

  // Cargar mapa del anfiteatro
  useEffect(() => {
    async function cargarMapa() {
      try {
        const res = await fetch(`${BASE}/configuracion/anfiteatro/estructura/${ceremoniaId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.estructura) setEstructura(data.estructura)
          if (data.mapaRoles) setMapaRoles(data.mapaRoles)
        }
      } catch (err) {
        console.error('Error al cargar mapa del anfiteatro:', err)
        setError('No se pudo cargar el mapa de asientos.')
      }
    }
    cargarMapa()
  }, [ceremoniaId])

  // Calcular asientos ocupados por OTROS grupos
  const obtenerAsientosOcupadosPorOtros = () => {
    const ocupados = new Set()
    
    // Asientos de otros graduados
    todosLosGraduados.forEach(g => {
      if (g.id !== graduado.id) {
        if (g.asiento_id) ocupados.add(g.asiento_id)
      }
    })

    // Asientos de otros invitados
    todosLosInvitados.forEach(i => {
      if (i.egresado_id !== graduado.id && i.egresadoId !== graduado.id) {
        if (i.asiento_id) ocupados.add(i.asiento_id)
      }
    })

    return ocupados
  }

  const asientosOcupadosOtros = obtenerAsientosOcupadosPorOtros()

  // Inyectar asientos ocupados por otros como 'bloqueados'
  const obtenerMapaRolesConOcupados = () => {
    const roles = { ...mapaRoles }
    asientosOcupadosOtros.forEach(seatId => {
      roles[seatId] = 'bloqueado'
    })
    return roles
  }

  // Lista de todas las personas en el grupo para renderizar en la barra lateral
  const personasGrupo = []
  
  personasGrupo.push({
    tipo: 'egresado',
    id: null,
    nombre: graduado.nombre,
    rolLabel: 'Graduado',
    asiento: asignaciones.egresadoAsiento
  })

  invitados.forEach(inv => {
    personasGrupo.push({
      tipo: 'invitado',
      id: inv.id,
      nombre: inv.nombre,
      rolLabel: `Acompañante (${inv.relacion || 'Familiar'})`,
      asiento: asignaciones.invitadosAsientos[inv.id] || null
    })
  })

  // Obtener todos los asientos seleccionados por el grupo actual
  const obtenerTodosAsientosGrupo = () => {
    const seleccionados = []
    if (asignaciones.egresadoAsiento) seleccionados.push(asignaciones.egresadoAsiento)
    Object.values(asignaciones.invitadosAsientos).forEach(seatId => {
      if (seatId) seleccionados.push(seatId)
    })
    return seleccionados
  }

  const asientosGrupoActual = obtenerTodosAsientosGrupo()
  const asignacionCompleta = asientosGrupoActual.length === personasGrupo.length
  const personaActivaDatos = personasGrupo.find(
    persona => persona.tipo === personaActiva.tipo && persona.id === personaActiva.id
  ) || personasGrupo[0]
  const pasoActivo = Math.max(0, personasGrupo.findIndex(
    persona => persona.tipo === personaActivaDatos.tipo && persona.id === personaActivaDatos.id
  ))
  const faltantes = personasGrupo.filter(persona => !persona.asiento).length
  const grupoEnRevision = asignacionCompleta

  const mapaRolesParaAsignacion = () => {
    const roles = obtenerMapaRolesConOcupados()
    Object.entries(roles).forEach(([asientoId, rol]) => {
      if (['autoridad', 'reservado', 'bloqueado'].includes(rol)) roles[asientoId] = 'bloqueado'
      if (rol === 'egresado' && personaActiva.tipo !== 'egresado') roles[asientoId] = 'bloqueado'
    })
    return roles
  }

  // Al hacer clic en un asiento del mapa
  const manejarAsientoClick = (asientoId) => {
    // 1. Si el asiento ya está ocupado por otra persona de este grupo, removerlo de esa persona
    let nuevasAsignaciones = { ...asignaciones }
    
    if (nuevasAsignaciones.egresadoAsiento === asientoId) {
      nuevasAsignaciones.egresadoAsiento = null
    } else {
      const invKey = Object.keys(nuevasAsignaciones.invitadosAsientos).find(
        key => nuevasAsignaciones.invitadosAsientos[key] === asientoId
      )
      if (invKey) {
        nuevasAsignaciones.invitadosAsientos[invKey] = null
      }
    }

    // Si vuelve a tocar su propia butaca, la libera para poder corregirla.
    const asientoActivo = personaActiva.tipo === 'egresado'
      ? asignaciones.egresadoAsiento
      : asignaciones.invitadosAsientos[personaActiva.id]
    if (asientoActivo === asientoId) {
      setAsignaciones(nuevasAsignaciones)
      return
    }

    // 2. Asignar el asiento a la persona activa
    if (personaActiva.tipo === 'egresado') {
      nuevasAsignaciones.egresadoAsiento = asientoId
    } else if (personaActiva.tipo === 'invitado') {
      nuevasAsignaciones.invitadosAsientos[personaActiva.id] = asientoId
    }

    setAsignaciones(nuevasAsignaciones)
    setError('')

    // 3. Auto-seleccionar a la siguiente persona sin asiento
    const idxActivo = personasGrupo.findIndex(
      p => p.tipo === personaActiva.tipo && p.id === personaActiva.id
    )

    // Buscamos a partir de la siguiente persona
    let proxPersona = null
    for (let i = 1; i < personasGrupo.length; i++) {
      const idx = (idxActivo + i) % personasGrupo.length
      const p = personasGrupo[idx]
      // Si la persona de la lista local actualizada no tiene asiento
      const tieneAsiento = p.tipo === 'egresado' ? nuevasAsignaciones.egresadoAsiento :
                           nuevasAsignaciones.invitadosAsientos[p.id]

      if (!tieneAsiento) {
        proxPersona = p
        break
      }
    }

    if (proxPersona) {
      setPersonaActiva({ tipo: proxPersona.tipo, id: proxPersona.id })
    }
  }

  const limpiarPersonaActiva = () => {
    setAsignaciones(actual => {
      if (personaActiva.tipo === 'egresado') {
        return { ...actual, egresadoAsiento: null }
      }
      return {
        ...actual,
        invitadosAsientos: { ...actual.invitadosAsientos, [personaActiva.id]: null }
      }
    })
    setError('')
  }

  // Limpiar toda la selección actual
  const limpiarSeleccion = () => {
    if (asientosGrupoActual.length > 0 && !window.confirm('Se quitarán todas las butacas de este grupo. Podés cancelar para conservar los cambios.')) return
    const invAsientos = {}
    invitados.forEach(inv => { invAsientos[inv.id] = null })
    setAsignaciones({
      egresadoAsiento: null,
      invitadosAsientos: invAsientos
    })
    setPersonaActiva({ tipo: 'egresado', id: null })
  }

  // Guardar asignación final
  const guardar = async () => {
    if (!asignacionCompleta) {
      setError('Asigná una butaca a cada integrante antes de guardar.')
      return
    }
    setProcesando(true)
    setError('')
    try {
      await asignarAsientos(graduado.id, {
        egresadoAsiento: asignaciones.egresadoAsiento,
        invitadosAsientos: asignaciones.invitadosAsientos
      })
      onAsignado()
    } catch (err) {
      setError(err.message || 'Error al guardar la asignación')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-300">
      <div className="w-full max-w-6xl h-[min(84dvh,650px)] bg-[#f8fafc] rounded-[20px] sm:rounded-[24px] shadow-2xl overflow-hidden grid grid-rows-[auto_minmax(0,1fr)_auto]">
        <header className="px-5 py-3 sm:px-6 bg-gradient-to-r from-slate-950 via-slate-900 to-[#13314d] text-white flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0"><Armchair size={19} /></div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black">Butacas del grupo</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold truncate">{graduado.nombre} · {personasGrupo.length} integrantes</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right">
              <p className="text-[8px] uppercase font-black tracking-widest text-slate-400">Asignados</p>
              <p className="text-xs font-black text-sky-300">{asientosGrupoActual.length} / {personasGrupo.length}</p>
            </div>
            <button onClick={onCerrar} aria-label="Cerrar asignación de butacas" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><X size={22} /></button>
          </div>
        </header>

        <div className="min-h-0 grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] overflow-hidden">
          <aside className="min-h-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
            <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Integrantes</h3>
                <p className="text-[9px] text-slate-400 mt-0.5">Elegí una persona para editar.</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600"><Users size={13} /> {personasGrupo.length}</span>
            </div>

            <div className="p-2 space-y-1.5 overflow-y-auto">
              {personasGrupo.map((persona, indice) => {
                const esActivo = personaActivaDatos.tipo === persona.tipo && personaActivaDatos.id === persona.id
                return (
                  <button key={`${persona.tipo}-${persona.id || 'grupo'}`} onClick={() => { setPersonaActiva({ tipo: persona.tipo, id: persona.id }); setError('') }} className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${esActivo ? 'border-sky-400 bg-sky-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${persona.asiento ? 'bg-emerald-100 text-emerald-700' : esActivo ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {persona.asiento ? <CheckCircle2 size={18} /> : indice + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-800 truncate">{persona.nombre}</p>
                      <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">{persona.rolLabel}</p>
                    </div>
                    <div className={`shrink-0 rounded-md px-1.5 py-1 text-[9px] font-black ${persona.asiento ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>{persona.asiento || 'S/A'}</div>
                  </button>
                )
              })}
            </div>

            <div className="p-2 border-t border-slate-100">
              <button onClick={limpiarSeleccion} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-red-200 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"><RotateCcw size={13} /> Reiniciar grupo</button>
            </div>
          </aside>

          <section className="min-h-0 p-2.5 sm:p-3 bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f8fafc_42%)] flex flex-col gap-2 overflow-hidden">
            <div className="shrink-0 bg-white/90 border border-sky-100 rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center"><User size={16} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] uppercase tracking-[0.16em] font-black text-sky-600">{grupoEnRevision ? 'Revisión del grupo' : `Paso ${pasoActivo + 1} de ${personasGrupo.length}`}</p>
                <p className="text-xs font-black text-slate-800 truncate">{grupoEnRevision ? `Revisando: ${personaActivaDatos.nombre}` : `Asignando a ${personaActivaDatos.nombre}`}</p>
              </div>
              {personaActivaDatos.asiento ? (
                <button onClick={limpiarPersonaActiva} className="shrink-0 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[9px] font-black uppercase tracking-wider text-amber-700 hover:bg-amber-100 transition-colors">Liberar {personaActivaDatos.asiento}</button>
              ) : <ChevronRight className="text-sky-400 shrink-0" size={22} />}
            </div>

            <div className="shrink-0 flex items-center gap-2 px-1 text-[9px] text-slate-500"><LockKeyhole size={13} className="text-slate-400" /> Reservadas, autoridades y ocupadas: bloqueadas.</div>

            {estructura ? (
              <div className="min-h-0 flex-1 overflow-auto rounded-xl [scrollbar-width:thin] [&_.sigic-wrapper]:gap-1.5 [&_.sigic-mapa]:p-3 [&_.sigic-mapa]:rounded-xl [&_.sigic-escenario]:mb-2 [&_.sigic-escenario__sombra]:h-1 [&_.sigic-stats__pill]:px-2 [&_.sigic-stats__pill]:py-1">
                <SeleccionAsientos ceremoniaId={ceremoniaId} estructura={estructura} mapaRoles={mapaRolesParaAsignacion()} seleccionados={asientosGrupoActual} setSeleccionados={() => {}} onAsientoClick={manejarAsientoClick} maxSeleccion={personasGrupo.length} zoom={0.68} setZoom={() => {}} compacto />
              </div>
            ) : (
              <div className="flex-1 grid place-items-center text-center opacity-50"><div><RefreshCw className="animate-spin text-sky-500 mx-auto mb-3" size={28} /><p className="text-[10px] font-black uppercase tracking-widest">Cargando anfiteatro</p></div></div>
            )}
          </section>
        </div>

        <footer className="px-4 py-2.5 sm:px-5 bg-white border-t border-slate-200 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {error ? <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-red-500"><AlertTriangle size={14} /> {error}</p> : <p className={`text-[11px] font-bold ${asignacionCompleta ? 'text-emerald-600' : 'text-slate-500'}`}>{asignacionCompleta ? 'Grupo completo. La asignación está lista para confirmar.' : `${faltantes} integrante${faltantes === 1 ? '' : 's'} sin butaca.`}</p>}
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <button onClick={onCerrar} className="px-3 sm:px-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">Cancelar</button>
            <button onClick={guardar} disabled={procesando || !asignacionCompleta} className="bg-slate-900 text-white font-black uppercase tracking-widest text-[9px] py-2.5 px-4 sm:px-5 rounded-lg shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{procesando ? 'Guardando...' : 'Confirmar asignación'}</button>
          </div>
        </footer>
      </div>
    </div>
  )
}
