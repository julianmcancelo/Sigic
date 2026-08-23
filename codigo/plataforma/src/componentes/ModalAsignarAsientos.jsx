import React, { useState, useEffect } from 'react'
import { X, Armchair, CheckCircle2, User, RefreshCw, AlertTriangle, LockKeyhole, Users } from 'lucide-react'
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
    // Inicializar asignaciones de invitados
    const invAsientos = {}
    invitados.forEach(inv => {
      invAsientos[inv.id] = inv.asiento_id || null
    })
    setAsignaciones(prev => ({
      ...prev,
      invitadosAsientos: invAsientos
    }))
  }, [invitados])

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

    // 2. Asignar el asiento a la persona activa
    if (personaActiva.tipo === 'egresado') {
      nuevasAsignaciones.egresadoAsiento = asientoId
    } else if (personaActiva.tipo === 'invitado') {
      nuevasAsignaciones.invitadosAsientos[personaActiva.id] = asientoId
    }

    setAsignaciones(nuevasAsignaciones)

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-300">
      <div className="w-full max-w-6xl h-[min(92vh,760px)] bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
        
        {/* HEADER */}
        <div className="shrink-0 px-5 py-4 sm:px-7 sm:py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-[#102a43] text-white flex items-center justify-between gap-4">
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.22em] text-sky-300 mb-1">Mesa de asignación</p>
            <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
              <Armchair className="text-sky-400 shrink-0" />
              Butacas del grupo
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold truncate max-w-[250px] sm:max-w-none">
              Grupo de {graduado.nombre} · DNI: {graduado.dni}
            </p>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar asignación de butacas" className="shrink-0 p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* SIDEBAR IZQUIERDO: INTEGRANTES */}
          <aside className="w-full md:w-[19rem] md:shrink-0 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 px-4 py-3 sm:p-5 overflow-y-auto space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Integrantes del grupo</h3>
                <span className="flex items-center gap-1 text-[10px] font-black text-slate-500"><Users size={13} /> {personasGrupo.length}</span>
              </div>
              <p className="text-[10px] sm:text-[11px] leading-relaxed text-slate-400 mt-1.5">Elegí una persona y luego una butaca disponible en el mapa.</p>
            </div>
            
            <div className="flex md:block gap-2 md:space-y-2 overflow-x-auto pb-1 md:pb-0">
              {personasGrupo.map((p, idx) => {
                const esActivo = personaActiva.tipo === p.tipo && personaActiva.id === p.id
                return (
                  <button
                    key={idx}
                    onClick={() => setPersonaActiva({ tipo: p.tipo, id: p.id })}
                    className={`min-w-[245px] md:min-w-0 w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                      esActivo 
                        ? 'border-sky-500 bg-white shadow-md ring-2 ring-sky-100' 
                        : 'border-transparent bg-white hover:bg-slate-100 text-slate-500'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      esActivo ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <User size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{p.nombre}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.rolLabel}</p>
                    </div>
                    <div className="text-right">
                      {p.asiento ? (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                          {p.asiento}
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-amber-200">
                          S/A
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              onClick={limpiarSeleccion}
              className="w-full py-2.5 border border-dashed border-red-200 hover:bg-red-50 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
            >
              Limpiar Selección
            </button>
          </aside>

          {/* ÁREA CENTRAL: MAPA DE ASIENTOS */}
          <div className="flex-1 min-h-0 bg-[radial-gradient(circle_at_top,_#f0f9ff,_#ffffff_55%)] p-3 sm:p-5 overflow-auto flex flex-col items-center">
            <div className="w-full max-w-3xl shrink-0 flex items-start gap-3 rounded-2xl border border-sky-100 bg-white/85 px-3.5 py-2.5 mb-3 shadow-sm">
              <LockKeyhole size={16} className="text-sky-600 mt-0.5 shrink-0" />
              <p className="text-[11px] leading-relaxed text-slate-500"><strong className="text-slate-700">Asignación administrada.</strong> Las butacas ocupadas, de autoridades y reservadas permanecen bloqueadas. Las butacas de graduado solo se habilitan al seleccionar al graduado.</p>
            </div>
            {estructura ? (
              <SeleccionAsientos
                ceremoniaId={ceremoniaId}
                estructura={estructura}
                mapaRoles={mapaRolesParaAsignacion()}
                seleccionados={asientosGrupoActual}
                setSeleccionados={() => {}} // Manejado internamente por el click
                onAsientoClick={manejarAsientoClick}
                maxSeleccion={personasGrupo.length}
              />
            ) : (
              <div className="text-center opacity-40">
                <RefreshCw className="animate-spin text-sky-500 mx-auto mb-4" size={32} />
                <p className="text-xs font-black uppercase tracking-widest">Cargando Anfiteatro...</p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-600">
              Asientos asignados: <span className="font-black text-slate-900">{asientosGrupoActual.length} / {personasGrupo.length}</span>
            </p>
            <p className={`text-[10px] font-bold mt-1 ${asignacionCompleta ? 'text-emerald-600' : 'text-amber-600'}`}>
              {asignacionCompleta ? 'El grupo está listo para guardar.' : 'Falta asignar al menos una persona.'}
            </p>
          </div>

          {error && (
            <p className="text-xs font-black text-red-500 uppercase tracking-wider bg-red-50 border border-red-100 px-4 py-2 rounded-xl flex items-center gap-1.5">
              <AlertTriangle size={14} /> {error}
            </p>
          )}

          <div className="flex gap-4">
            <button
              onClick={onCerrar}
              className="px-4 sm:px-6 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={procesando || !asignacionCompleta}
              className="bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs py-3 px-5 sm:px-8 rounded-xl shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {procesando ? 'Guardando...' : 'Guardar Asignación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
