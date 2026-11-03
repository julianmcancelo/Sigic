import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Users, UserPlus, Trash2, X, AlertCircle, CheckCircle2,
  Award, Shield, Phone, CreditCard, Sparkles, HeartHandshake
} from 'lucide-react'
import {
  obtenerInvitadosDeEgresado,
  cargarInvitados,
  eliminarInvitado
} from '../servicios/api'
import { emitirCambioSync } from '../lib/sync'

export function ModalGestionFamiliaresAdmin({ egresado, onCerrar, onActualizado }) {
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  // Formulario nuevo acompañante
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoDni, setNuevoDni] = useState('')
  const [esPadrino, setEsPadrino] = useState(false)

  useEffect(() => {
    if (!egresado?.id) return
    cargarFamiliares()
  }, [egresado?.id])

  async function cargarFamiliares() {
    setCargando(true)
    setError('')
    try {
      const lista = await obtenerInvitadosDeEgresado(egresado.id)
      setInvitados(Array.isArray(lista) ? lista : [])
    } catch (err) {
      setError(err.message || 'No se pudieron recuperar los acompañantes')
    } finally {
      setCargando(false)
    }
  }

  async function handleAgregar(e) {
    e.preventDefault()
    if (!nuevoNombre.trim()) {
      setError('Ingresá el nombre y apellido del familiar')
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
      setExito('Acompañante agregado correctamente.')
      emitirCambioSync('INVITADOS', { egresadoId: egresado.id })
      await cargarFamiliares()
      if (onActualizado) onActualizado()
      setTimeout(() => setExito(''), 3500)
    } catch (err) {
      setError(err.message || 'Error al guardar el acompañante')
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar(idInvitado) {
    if (!window.confirm('¿Seguro que deseas eliminar a este familiar de la lista de pases?')) return
    setGuardando(true)
    setError('')
    try {
      await eliminarInvitado(idInvitado)
      emitirCambioSync('INVITADOS', { egresadoId: egresado.id })
      await cargarFamiliares()
      if (onActualizado) onActualizado()
      setExito('Acompañante eliminado.')
      setTimeout(() => setExito(''), 3000)
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el acompañante')
    } finally {
      setGuardando(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
              <Users size={18} />
            </div>
            <div>
              <span className="text-[9.5px] font-black uppercase tracking-wider text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded-md inline-block">
                Gestión Asistida de Acompañantes
              </span>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                {egresado?.nombre || 'Graduado'}
              </h3>
              <p className="text-[10.5px] text-slate-500 font-medium">
                {egresado?.carrera || 'Carrera Beltrán'} · DNI {egresado?.dni || '-'}
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

        {/* Contenido / Lista */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
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

          {/* Formulario rápido para cargar familiar */}
          <form onSubmit={handleAgregar} className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10.5px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <UserPlus size={13} className="text-sky-600" />
                <span>Agregar Familiar / Acompañante</span>
              </p>
              <span className="text-[9.5px] text-slate-400 font-semibold">Carga institucional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Nombre y Apellido *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Gómez Roberto"
                  value={nuevoNombre}
                  onChange={e => setNuevoNombre(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  DNI (Opcional para menores)
                </label>
                <input
                  type="text"
                  placeholder="Ej. 18234567"
                  value={nuevoDni}
                  onChange={e => setNuevoDni(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
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
                  Es Padrino / Entregador de diploma
                </span>
              </label>

              <button
                type="submit"
                disabled={guardando || !nuevoNombre.trim()}
                className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <UserPlus size={13} />
                <span>Agregar</span>
              </button>
            </div>
          </form>

          {/* Nómina de acompañantes registrados */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Familiares Registrados ({invitados.length})</span>
              <span className="text-[10px] text-slate-400 font-semibold">Pase institucional QR único</span>
            </div>

            {cargando ? (
              <p className="text-center py-6 text-xs text-slate-400 font-bold">Cargando familiares...</p>
            ) : invitados.length === 0 ? (
              <div className="p-5 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
                Este egresado aún no tiene acompañantes registrados.
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
                            {inv.dni ? `DNI ${inv.dni}` : 'Sin DNI especificado'}
                            {inv.asiento_id ? ` · Butaca ${inv.asiento_id}` : ' · Sin butaca'}
                            {esPad && <strong className="text-amber-700 ml-1.5">· Padrino</strong>}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEliminar(inv.id)}
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

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-3 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <HeartHandshake size={14} className="text-sky-600" />
            Asistencia presencial / telefónica
          </span>
          <button
            type="button"
            onClick={onCerrar}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
