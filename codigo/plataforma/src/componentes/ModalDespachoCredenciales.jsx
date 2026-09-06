import React, { useState, useEffect } from 'react'
import {
  Send, Download, Printer, CheckCircle2, AlertCircle, QrCode,
  Users, Armchair, ShieldCheck, Search, Filter, RefreshCw, X,
  ExternalLink, Mail, Award, Check, Sparkles, ChevronRight, Eye
} from 'lucide-react'
import { BASE, cabeceras } from '../servicios/api'
import { ModalCredencial } from './ModalCredencial'

export function ModalDespachoCredenciales({
  ceremonia,
  graduados = [],
  invitados = [],
  onCerrar,
  onIrAPorteria
}) {
  const [listaGraduados, setListaGraduados] = useState(graduados)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroCarrera, setFiltroCarrera] = useState('todas')
  const [enviandoMasivo, setEnviandoMasivo] = useState(false)
  const [progresoEnvio, setProgresoEnvio] = useState({ actual: 0, total: 0, actualNombre: '' })
  const [mensajeResultado, setMensajeResultado] = useState(null)
  const [graduadoSeleccionadoQR, setGraduadoSeleccionadoQR] = useState(null)
  const [enviandoId, setEnviandoId] = useState(null)

  useEffect(() => {
    setListaGraduados(graduados)
  }, [graduados])

  const graduadosConfirmados = listaGraduados.filter(g => 
    g.estado === 'ACEPTADO' || g.estado === 'CONFIRMADO' || g.asiento_id
  )

  const carrerasUnicas = Array.from(new Set(graduadosConfirmados.map(g => g.carrera).filter(Boolean)))

  const graduadosFiltrados = graduadosConfirmados.filter(g => {
    const coincideBusqueda = 
      (g.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (g.dni || '').includes(busqueda) ||
      (g.correo || '').toLowerCase().includes(busqueda.toLowerCase())

    const coincideCarrera = filtroCarrera === 'todas' || g.carrera === filtroCarrera
    const tieneCredencial = Boolean(g.credencial_enviada_en || g.credencial_envios_count > 0)
    
    let coincideEstado = true
    if (filtroEstado === 'enviados') coincideEstado = tieneCredencial
    if (filtroEstado === 'pendientes') coincideEstado = !tieneCredencial

    return coincideBusqueda && coincideCarrera && coincideEstado
  })

  const totalEnviados = graduadosConfirmados.filter(g => g.credencial_enviada_en || g.credencial_envios_count > 0).length
  const totalPendientes = graduadosConfirmados.length - totalEnviados

  async function despacharIndividual(graduado) {
    if (!graduado.id) return
    setEnviandoId(graduado.id)
    try {
      const res = await fetch(`${BASE}/egresados/${graduado.id}/enviar-credencial`, {
        method: 'POST',
        headers: cabeceras()
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setListaGraduados(prev => prev.map(item => 
          item.id === graduado.id ? { ...item, credencial_enviada_en: new Date().toISOString(), credencial_envios_count: (item.credencial_envios_count || 0) + 1 } : item
        ))
        setMensajeResultado({ tipo: 'exito', texto: `Credencial enviada con éxito a ${graduado.nombre} (${graduado.correo})` })
      } else {
        throw new Error(data.error || 'No se pudo enviar la credencial.')
      }
    } catch (err) {
      setMensajeResultado({ tipo: 'error', texto: err.message || 'Fallo de conexión al enviar credencial.' })
    } finally {
      setEnviandoId(null)
      setTimeout(() => setMensajeResultado(null), 4000)
    }
  }

  async function ejecutarDespachoMasivo() {
    const destinatarios = graduadosConfirmados.filter(g => g.correo)
    if (destinatarios.length === 0) {
      alert('No hay graduados con correo electrónico confirmado para enviar.')
      return
    }

    if (!confirm(`¿Deseas enviar las credenciales digitales con código QR a los ${destinatarios.length} egresados confirmados?`)) {
      return
    }

    setEnviandoMasivo(true)
    setProgresoEnvio({ actual: 0, total: destinatarios.length, actualNombre: '' })

    let exitosos = 0
    let fallidos = 0

    for (let i = 0; i < destinatarios.length; i++) {
      const g = destinatarios[i]
      setProgresoEnvio({ actual: i + 1, total: destinatarios.length, actualNombre: g.nombre })

      try {
        const res = await fetch(`${BASE}/egresados/${g.id}/enviar-credencial`, {
          method: 'POST',
          headers: cabeceras()
        })
        const data = await res.json()
        if (res.ok && data.ok) {
          exitosos++
          setListaGraduados(prev => prev.map(item => 
            item.id === g.id ? { ...item, credencial_enviada_en: new Date().toISOString(), credencial_envios_count: (item.credencial_envios_count || 0) + 1 } : item
          ))
        } else {
          fallidos++
        }
      } catch (err) {
        fallidos++
      }

      await new Promise(r => setTimeout(r, 200))
    }

    setEnviandoMasivo(false)
    setMensajeResultado({
      tipo: 'exito',
      texto: `Despacho masivo completado: ${exitosos} credenciales enviadas correctamente${fallidos > 0 ? ', ' + fallidos + ' con advertencia' : ''}.`
    })
  }

  function imprimirPadronCompleto() {
    const tituloAnterior = document.title
    document.title = `Padron_Credenciales_${ceremonia?.nombre || 'Ceremonia'}`
    window.print()
    setTimeout(() => { document.title = tituloAnterior }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-5xl bg-white border border-slate-200/90 rounded-[28px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* CABECERA */}
        <header className="shrink-0 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shadow-inner">
              <QrCode size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">
                Fase 4 · Protocolo y Acreditación
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Centro de Despacho de Credenciales QR
              </h2>
              <p className="text-xs text-slate-300/80 font-medium">
                {ceremonia?.nombre || 'Ceremonia Oficial'} · Emisión masiva de pases grupales
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        {/* FEEDBACK BANNER */}
        {mensajeResultado && (
          <div className={`shrink-0 p-3 px-6 flex items-center justify-between text-xs font-bold border-b ${
            mensajeResultado.tipo === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              {mensajeResultado.tipo === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
              <span>{mensajeResultado.texto}</span>
            </div>
            <button onClick={() => setMensajeResultado(null)} className="cursor-pointer opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* BARRA DE PROGRESO DE ENVÍO MASIVO */}
        {enviandoMasivo && (
          <div className="shrink-0 bg-sky-50 border-b border-sky-200 p-3 px-6 space-y-1.5 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-sky-900">
              <span className="flex items-center gap-2">
                <RefreshCw size={13} className="animate-spin text-sky-600" />
                <span>Despachando a <strong>{progresoEnvio.actualNombre}</strong>...</span>
              </span>
              <span>{progresoEnvio.actual} de {progresoEnvio.total} ({Math.round((progresoEnvio.actual / progresoEnvio.total) * 100)}%)</span>
            </div>
            <div className="w-full bg-sky-200/80 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-sky-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(progresoEnvio.actual / progresoEnvio.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* CUERPO PRINCIPAL CON KPIS, CONTROLES Y LISTADO */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
          
          {/* KPI CARDS RESUMEN */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Egresados Confirmados</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{graduadosConfirmados.length}</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">Credenciales Enviadas</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">{totalEnviados}</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-600">Pendientes de Envío</p>
              <p className="text-xl font-black text-amber-600 mt-0.5">{totalPendientes}</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <p className="text-[9px] font-black uppercase tracking-wider text-indigo-600">Acompañantes con Pase</p>
              <p className="text-xl font-black text-indigo-600 mt-0.5">{invitados.length}</p>
            </div>
          </div>

          {/* ACCIONES MASIVAS PRINCIPALES */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={ejecutarDespachoMasivo}
                disabled={enviandoMasivo || graduadosConfirmados.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Send size={14} />
                <span>Despachar a Todos por Email ({graduadosConfirmados.length})</span>
              </button>

              <button
                type="button"
                onClick={imprimirPadronCompleto}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir Padrón con QRs</span>
              </button>
            </div>

            {onIrAPorteria && (
              <button
                type="button"
                onClick={onIrAPorteria}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition active:scale-95 cursor-pointer shadow-xs ml-auto"
              >
                <ShieldCheck size={14} />
                <span>Ir a Acreditación en Portería</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          {/* FILTROS Y BÚSQUEDA */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, DNI o correo..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none shadow-2xs cursor-pointer"
              >
                <option value="todos">Todos los Estados</option>
                <option value="pendientes">Pendientes ({totalPendientes})</option>
                <option value="enviados">Enviados ({totalEnviados})</option>
              </select>

              {carrerasUnicas.length > 0 && (
                <select
                  value={filtroCarrera}
                  onChange={e => setFiltroCarrera(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none shadow-2xs cursor-pointer max-w-[180px] truncate"
                >
                  <option value="todas">Todas las Carreras</option>
                  {carrerasUnicas.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* TABLA DE GRADUADOS */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Graduado / DNI</th>
                    <th className="py-3 px-4">Carrera</th>
                    <th className="py-3 px-4">Butaca Asignada</th>
                    <th className="py-3 px-4">Acompañantes</th>
                    <th className="py-3 px-4 text-center">Estado Pase</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {graduadosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium text-xs">
                        No se encontraron egresados con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    graduadosFiltrados.map((g) => {
                      const tieneEnvio = Boolean(g.credencial_enviada_en || g.credencial_envios_count > 0)
                      const estaEnviando = enviandoId === g.id
                      const invitadosGraduado = invitados.filter(i => i.egresado_id === g.id || i.egresadoId === g.id)

                      return (
                        <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-black text-slate-900">{g.nombre}</p>
                            <p className="text-[11px] text-slate-400 font-mono">DNI: {g.dni || '—'} · {g.correo || 'Sin correo'}</p>
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-600 max-w-[200px] truncate">
                            {g.carrera || 'General'}
                          </td>

                          <td className="py-3 px-4">
                            {g.asiento_id ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-black">
                                <Armchair size={12} />
                                Butaca {g.asiento_id}
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">
                                Sin Asignar
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-600">
                              <Users size={12} />
                              {invitadosGraduado.length} pase(s)
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {tieneEnvio ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-black text-emerald-700">
                                <Check size={11} strokeWidth={3} /> Enviada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">
                                Pendiente
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => setGraduadoSeleccionadoQR({
                                  ...g,
                                  ceremonia_nombre: ceremonia?.nombre,
                                  ceremonia_fecha: ceremonia?.fecha,
                                  ceremonia_lugar: ceremonia?.lugar,
                                  invitados: invitadosGraduado
                                })}
                                title="Ver y descargar credencial digital QR"
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600 text-slate-600 transition cursor-pointer"
                              >
                                <Eye size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => despacharIndividual(g)}
                                disabled={estaEnviando || !g.correo}
                                title={g.correo ? 'Despachar por correo electrónico' : 'No tiene correo registrado'}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition active:scale-95 disabled:opacity-40 cursor-pointer"
                              >
                                {estaEnviando ? (
                                  <RefreshCw size={12} className="animate-spin" />
                                ) : (
                                  <Mail size={12} />
                                )}
                                <span>{tieneEnvio ? 'Reenviar' : 'Enviar'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* PIE */}
        <footer className="shrink-0 p-4 sm:px-6 bg-white border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-500">
            Mostrando <strong>{graduadosFiltrados.length}</strong> de {graduadosConfirmados.length} graduados confirmados
          </p>

          <button
            type="button"
            onClick={onCerrar}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </footer>

      </div>

      {/* MODAL DE CREDENCIAL QR INDIVIDUAL */}
      {graduadoSeleccionadoQR && (
        <ModalCredencial
          egresado={graduadoSeleccionadoQR}
          onCerrar={() => setGraduadoSeleccionadoQR(null)}
        />
      )}
    </div>
  )
}
