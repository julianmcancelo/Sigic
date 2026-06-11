import React, { useState, useEffect } from 'react'
import { X, Armchair, CheckCircle2, User, Users, GraduationCap } from 'lucide-react'
import { SeleccionAsientos } from '../paginas/SeleccionAsientos'
import { BASE, cabeceras } from '../servicios/api'

export function ModalAsignarAsientos({ graduado, invitados, onCerrar, onCompletado }) {
  const [personaSeleccionada, setPersonaSeleccionada] = useState('graduado')
  const [asientos, setAsientos] = useState({
    graduado: graduado.asiento_id || null,
    entregador: graduado.entregador_asiento_id || null,
    invitados: invitados.reduce((acc, inv) => ({ ...acc, [inv.id]: inv.asiento_id || null }), {})
  })
  const [guardando, setGuardando] = useState(false)

  // Recopilar todos los seleccionados actuales para pasarlos al mapa
  const getSeleccionadosFlat = () => {
    const list = []
    if (asientos.graduado) list.push(asientos.graduado)
    if (asientos.entregador) list.push(asientos.entregador)
    Object.values(asientos.invitados).forEach(a => { if (a) list.push(a) })
    return list
  }

  const handleAsientoClick = (seatId) => {
    // Si la persona ya tiene ese asiento, deseleccionarlo
    if (
      (personaSeleccionada === 'graduado' && asientos.graduado === seatId) ||
      (personaSeleccionada === 'entregador' && asientos.entregador === seatId) ||
      (personaSeleccionada.startsWith('inv-') && asientos.invitados[personaSeleccionada.replace('inv-', '')] === seatId)
    ) {
      if (personaSeleccionada === 'graduado') setAsientos({ ...asientos, graduado: null })
      else if (personaSeleccionada === 'entregador') setAsientos({ ...asientos, entregador: null })
      else setAsientos({ ...asientos, invitados: { ...asientos.invitados, [personaSeleccionada.replace('inv-', '')]: null } })
      return
    }

    // Asignar al sujeto seleccionado
    if (personaSeleccionada === 'graduado') {
      setAsientos({ ...asientos, graduado: seatId })
    } else if (personaSeleccionada === 'entregador') {
      setAsientos({ ...asientos, entregador: seatId })
    } else if (personaSeleccionada.startsWith('inv-')) {
      const invId = personaSeleccionada.replace('inv-', '')
      setAsientos({ ...asientos, invitados: { ...asientos.invitados, [invId]: seatId } })
    }
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      const payload = {
        graduadoAsiento: asientos.graduado,
        entregadorAsiento: asientos.entregador,
        invitadosAsientos: asientos.invitados
      }
      
      const res = await fetch(`${BASE}/egresados/${graduado.id}/asientos`, {
        method: 'PUT',
        headers: cabeceras(),
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) throw new Error('Error al guardar asientos')
      onCompletado()
    } catch (err) {
      alert(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-[#f8fafc] rounded-[40px] shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-8 py-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Armchair className="text-sky-500" />
              Asignación de Asientos
            </h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Graduado: <span className="text-sky-500">{graduado.nombre}</span>
            </p>
          </div>
          <button onClick={onCerrar} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Panel Lateral: Lista de personas */}
          <div className="w-full lg:w-80 bg-white border-r border-slate-100 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-6 space-y-6">
              
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Principal</p>
                
                <button 
                  onClick={() => setPersonaSeleccionada('graduado')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${personaSeleccionada === 'graduado' ? 'border-sky-500 bg-sky-50 ring-4 ring-sky-500/10' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <GraduationCap size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{graduado.nombre}</p>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">Graduado</p>
                    </div>
                  </div>
                  {asientos.graduado && <CheckCircle2 size={16} className="text-emerald-500" />}
                </button>

                <button 
                  onClick={() => setPersonaSeleccionada('entregador')}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${personaSeleccionada === 'entregador' ? 'border-sky-500 bg-sky-50 ring-4 ring-sky-500/10' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{graduado.entregador_nombre || 'Entregador'}</p>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">Medalla/Diploma</p>
                    </div>
                  </div>
                  {asientos.entregador && <CheckCircle2 size={16} className="text-emerald-500" />}
                </button>
              </div>

              {invitados.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Acompañantes</p>
                  
                  {invitados.map(inv => (
                    <button 
                      key={inv.id}
                      onClick={() => setPersonaSeleccionada(`inv-${inv.id}`)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${personaSeleccionada === `inv-${inv.id}` ? 'border-sky-500 bg-sky-50 ring-4 ring-sky-500/10' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                          <Users size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{inv.nombre}</p>
                          <p className="text-[10px] uppercase tracking-widest text-slate-400">Invitado</p>
                        </div>
                      </div>
                      {asientos.invitados[inv.id] && <CheckCircle2 size={16} className="text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 mt-auto border-t border-slate-100 bg-slate-50">
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="w-full bg-slate-900 hover:bg-sky-600 text-white py-4 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar Asignación'}
              </button>
            </div>
          </div>

          {/* Área Principal: Mapa interactivo */}
          <div className="flex-1 relative overflow-auto bg-[#f8fafc] p-6 flex flex-col items-center">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 min-w-full flex justify-center">
               <SeleccionAsientos 
                 ceremoniaId={graduado.ceremonia_id}
                 seleccionados={getSeleccionadosFlat()}
                 onAsientoClick={handleAsientoClick}
                 maxSeleccion={99}
                 estaCargando={false}
               />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
