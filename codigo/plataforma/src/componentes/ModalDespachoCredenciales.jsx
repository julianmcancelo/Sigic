import React, { useState, useEffect } from 'react'
import {
  Send, Download, Printer, CheckCircle2, AlertCircle, QrCode,
  Users, Armchair, ShieldCheck, Search, Filter, RefreshCw, X,
  ExternalLink, Mail, Award, Check, Sparkles, ChevronRight, Eye, Maximize2, Minimize2
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
  const [maximizado, setMaximizado] = useState(false)

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in select-none">
      <div className={`w-full bg-white border border-slate-200/90 flex flex-col overflow-hidden shadow-2xl transition-all duration-200 ${
        maximizado 
          ? 'fixed inset-2 sm:inset-4 rounded-2xl sm:rounded-3xl max-w-none max-h-none h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)]'
          : 'max-w-5xl rounded-2xl sm:rounded-3xl max-h-[90vh]'
      }`}>
        
        {/* BARRA SUPERIOR DE VENTANA INSTITUCIONAL CON CONTROLES */}
        <header className="shrink-0 bg-slate-950 px-4 py-2.5 sm:px-6 sm:py-3 text-white border-b border-white/10 flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/90 hover:bg-red-600 cursor-pointer inline-block" onClick={onCerrar} title="Cerrar" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90 hover:bg-amber-600 cursor-pointer inline-block" onClick={() => setMaximizado(false)} title="Restaurar" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 hover:bg-emerald-600 cursor-pointer inline-block" onClick={() => setMaximizado(!maximizado)} title="Maximizar" />
            </div>
            <div className="h-4 w-[1px] bg-white/15 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2">
              <QrCode size={14} className="text-sky-400" />
              <span className="text-xs font-black tracking-tight text-white truncate">
                SiGIC · Emisión y Despacho de Credenciales QR · {ceremonia?.nombre || 'Ceremonia Oficial'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/20 text-[9px] font-black uppercase tracking-wider text-sky-300 border border-sky-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Emisión Digital
            </span>
            <button
              type="button"
              onClick={() => setMaximizado(!maximizado)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title={maximizado ? 'Restaurar tamaño' : 'Maximizar'}
            >
              {maximizado ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Cerrar ventana"
            >
              <X size={14} />
            </button>
          </div>
        </header>

        {/* FEEDBACK BANNER */}
        {mensajeResultado && (
          <div className={`shrink-0 p-2.5 px-5 flex items-center justify-between text-xs font-bold border-b ${
            mensajeResultado.tipo === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              {mensajeResultado.tipo === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
              <span>{mensajeResultado.texto}</span>
            </div>
            <button onClick={() => setMensajeResultado(null)} className="cursor-pointer opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* BARRA DE PROGRESO DE ENVÍO MASIVO */}
        {enviandoMasivo && (
          <div className="shrink-0 bg-sky-50 border-b border-sky-200 p-2.5 px-5 space-y-1.5 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-sky-900">
              <span className="flex items-center gap-2">
                <RefreshCw size={12} className="animate-spin text-sky-600" />
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
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50 [scrollbar-width:thin]">
          
          {/* KPI CARDS RESUMEN COMPACTO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Egresados Confirmados</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">{graduadosConfirmados.length}</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">Credenciales Enviadas</p>
              <p className="text-lg font-black text-emerald-600 mt-0.5">{totalEnviados}</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-600">Pendientes de Envío</p>
              <p className="text-lg font-black text-amber-600 mt-0.5">{totalPendientes}</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
              <p className="text-[9px] font-black uppercase tracking-wider text-indigo-600">Acompañantes con Pase</p>
              <p className="text-lg font-black text-indigo-600 mt-0.5">{invitados.length}</p>
            </div>
          </div>

          {/* ACCIONES MASIVAS PRINCIPALES */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-despachar-todos-email"
                onClick={ejecutarDespachoMasivo}
                disabled={enviandoMasivo || graduadosConfirmados.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Send size={13} />
                <span>Despachar a Todos por Email ({graduadosConfirmados.length})</span>
              </button>

              <button
                type="button"
                onClick={imprimirPadronCompleto}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                <Printer size={13} />
                <span>Imprimir Padrón con QRs</span>
              </button>
            </div>

            {onIrAPorteria && (
              <button
                type="button"
                id="btn-ir-a-porteria-desde-despacho"
                onClick={onIrAPorteria}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition active:scale-95 cursor-pointer shadow-xs ml-auto"
              >
                <ShieldCheck size={13} />
                <span>Continuar a Acreditación</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>

          {/* FILTROS Y BÚSQUEDA */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, DNI o correo..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none shadow-2xs cursor-pointer"
              >
                <option value="todos">Todos los Estados</option>
                <option value="pendientes">Pendientes ({totalPendientes})</option>
                <option value="enviados">Enviados ({totalEnviados})</option>
              </select>

              {carrerasUnicas.length > 0 && (
                <select
                  value={filtroCarrera}
                  onChange={e => setFiltroCarrera(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none shadow-2xs cursor-pointer max-w-[180px] truncate"
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
                    <th className="py-2.5 px-3.5">Graduado / DNI</th>
                    <th className="py-2.5 px-3.5">Carrera</th>
                    <th className="py-2.5 px-3.5">Butaca Asignada</th>
                    <th className="py-2.5 px-3.5">Acompañantes</th>
                    <th className="py-2.5 px-3.5 text-center">Estado Pase</th>
                    <th className="py-2.5 px-3.5 text-right">Acciones</th>
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
                          <td className="py-2.5 px-3.5">
                            <p className="font-black text-slate-900">{g.nombre}</p>
                            <p className="text-[10.5px] text-slate-400 font-mono">DNI: {g.dni || '—'} · {g.correo || 'Sin correo'}</p>
                          </td>

                          <td className="py-2.5 px-3.5 font-semibold text-slate-600 max-w-[180px] truncate">
                            {g.carrera || 'General'}
                          </td>

                          <td className="py-2.5 px-3.5">
                            {g.asiento_id ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[10.5px] font-black">
                                <Armchair size={11} />
                                Butaca {g.asiento_id}
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">
                                Sin Asignar
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3.5">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-600 text-[11px]">
                              <Users size={11} />
                              {invitadosGraduado.length} pase(s)
                            </span>
                          </td>

                          <td className="py-2.5 px-3.5 text-center">
                            {tieneEnvio ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9.5px] font-black text-emerald-700">
                                <Check size={10} strokeWidth={3} /> Enviada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[9.5px] font-bold text-amber-700">
                                Pendiente
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3.5 text-right">
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
                                <Eye size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => despacharIndividual(g)}
                                disabled={estaEnviando || !g.correo}
                                title={g.correo ? 'Despachar por correo electrónico' : 'No tiene correo registrado'}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10.5px] transition active:scale-95 disabled:opacity-40 cursor-pointer"
                              >
                                {estaEnviando ? (
                                  <RefreshCw size={11} className="animate-spin" />
                                ) : (
                                  <Mail size={11} />
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
        <footer className="shrink-0 p-3 sm:px-6 bg-white border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-500">
            Mostrando <strong>{graduadosFiltrados.length}</strong> de {graduadosConfirmados.length} graduados confirmados
          </p>

          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
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
