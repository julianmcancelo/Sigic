import React, { useState, useEffect } from 'react'
import { X, Armchair, CheckCircle2, User, HelpCircle, RefreshCw, AlertTriangle } from 'lucide-react'
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
    entregadorAsiento: graduado.entregador_asiento_id || null,
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
        if (g.entregador_asiento_id) ocupados.add(g.entregador_asiento_id)
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

  if (graduado.entregador_nombre) {
    personasGrupo.push({
      tipo: 'entregador',
      id: null,
      nombre: graduado.entregador_nombre,
      rolLabel: 'Entregador',
      asiento: asignaciones.entregadorAsiento
    })
  }

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
    if (asignaciones.entregadorAsiento) seleccionados.push(asignaciones.entregadorAsiento)
    Object.values(asignaciones.invitadosAsientos).forEach(seatId => {
      if (seatId) seleccionados.push(seatId)
    })
    return seleccionados
  }

  const asientosGrupoActual = obtenerTodosAsientosGrupo()

  // Al hacer clic en un asiento del mapa
  const manejarAsientoClick = (asientoId) => {
    // 1. Si el asiento ya está ocupado por otra persona de este grupo, removerlo de esa persona
    let nuevasAsignaciones = { ...asignaciones }
    
    if (nuevasAsignaciones.egresadoAsiento === asientoId) {
      nuevasAsignaciones.egresadoAsiento = null
    } else if (nuevasAsignaciones.entregadorAsiento === asientoId) {
      nuevasAsignaciones.entregadorAsiento = null
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
    } else if (personaActiva.tipo === 'entregador') {
      nuevasAsignaciones.entregadorAsiento = asientoId
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
                           p.tipo === 'entregador' ? nuevasAsignaciones.entregadorAsiento :
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
    const invAsientos = {}
    invitados.forEach(inv => { invAsientos[inv.id] = null })
    setAsignaciones({
      egresadoAsiento: null,
      entregadorAsiento: null,
      invitadosAsientos: invAsientos
    })
    setPersonaActiva({ tipo: 'egresado', id: null })
  }

  // Guardar asignación final
  const guardar = async () => {
    setProcesando(true)
    setError('')
    try {
      await asignarAsientos(graduado.id, {
        egresadoAsiento: asignaciones.egresadoAsiento,
        entregadorAsiento: asignaciones.entregadorAsiento,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-6xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* HEADER */}
        <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3">
              <Armchair className="text-sky-400" />
              Asignación de Asientos
            </h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
              Grupo de {graduado.nombre} · DNI: {graduado.dni}
            </p>
          </div>
          <button onClick={onCerrar} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* SIDEBAR IZQUIERDO: INTEGRANTES */}
          <aside className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-6 overflow-y-auto space-y-6">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Integrantes del Grupo</h3>
            
            <div className="space-y-3">
              {personasGrupo.map((p, idx) => {
                const esActivo = personaActiva.tipo === p.tipo && personaActiva.id === p.id
                return (
                  <button
                    key={idx}
                    onClick={() => setPersonaActiva({ tipo: p.tipo, id: p.id })}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
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
              className="w-full py-3 border border-dashed border-red-200 hover:bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Limpiar Selección
            </button>
          </aside>

          {/* ÁREA CENTRAL: MAPA DE ASIENTOS */}
          <div className="flex-1 bg-white p-8 overflow-y-auto flex flex-col items-center justify-center min-h-[400px]">
            {estructura ? (
              <SeleccionAsientos
                ceremoniaId={ceremoniaId}
                estructura={estructura}
                mapaRoles={obtenerMapaRolesConOcupados()}
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
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs font-bold text-slate-500">
            Asientos asignados: <span className="font-black text-slate-800">{asientosGrupoActual.length} / {personasGrupo.length}</span>
          </div>

          {error && (
            <p className="text-xs font-black text-red-500 uppercase tracking-wider bg-red-50 border border-red-100 px-4 py-2 rounded-xl flex items-center gap-1.5">
              <AlertTriangle size={14} /> {error}
            </p>
          )}

          <div className="flex gap-4">
            <button
              onClick={onCerrar}
              className="px-8 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={procesando}
              className="bg-slate-900 text-white font-black uppercase tracking-widest text-xs py-4 px-10 rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {procesando ? 'Guardando...' : 'Guardar Asignación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
