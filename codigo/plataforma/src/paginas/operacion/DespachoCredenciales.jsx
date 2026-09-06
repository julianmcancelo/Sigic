'use client'

import React, { useState, useEffect } from 'react'
import {
  Send, Download, Printer, CheckCircle2, AlertCircle, QrCode,
  Users, Armchair, ShieldCheck, Search, Filter, RefreshCw, X,
  ExternalLink, Mail, Award, Check, Sparkles, ChevronRight, Eye, ArrowLeft
} from 'lucide-react'
import { BASE, cabeceras, obtenerCeremoniaActiva, obtenerGraduados, obtenerInvitados } from '../../servicios/api'
import { ModalCredencial } from '../../componentes/ModalCredencial'
import { useSincronizacion, emitirCambioSync } from '../../lib/sync'

export function DespachoCredenciales({
  onNavegar,
  ceremoniaActiva: ceremoniaProp,
  usuario
}) {
  const [ceremonia, setCeremonia] = useState(ceremoniaProp || null)
  const [graduados, setGraduados] = useState([])
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroCarrera, setFiltroCarrera] = useState('todas')
  const [enviandoMasivo, setEnviandoMasivo] = useState(false)
  const [progresoEnvio, setProgresoEnvio] = useState({ actual: 0, total: 0, actualNombre: '' })
  const [mensajeResultado, setMensajeResultado] = useState(null)
  const [graduadoSeleccionadoQR, setGraduadoSeleccionadoQR] = useState(null)
  const [enviandoId, setEnviandoId] = useState(null)

  async function cargarDatos() {
    setCargando(true)
    try {
      const cerActiva = ceremoniaProp || await obtenerCeremoniaActiva().catch(() => null)
      setCeremonia(cerActiva)

      const [grads, invs] = await Promise.all([
        obtenerGraduados(cerActiva?.id).catch(() => []),
        obtenerInvitados(cerActiva?.id).catch(() => [])
      ])
      setGraduados(grads)
      setInvitados(invs)
    } catch (e) {
      console.warn('Error cargando datos de despacho:', e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [ceremoniaProp])

  useSincronizacion(['EGRESADOS', 'INVITADOS', 'CEREMONIAS'], () => {
    cargarDatos()
  })

  const graduadosConfirmados = graduados.filter(g => 
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
        setGraduados(prev => prev.map(item => 
          item.id === graduado.id ? { ...item, credencial_enviada_en: new Date().toISOString(), credencial_envios_count: (item.credencial_envios_count || 0) + 1 } : item
        ))
        emitirCambioSync('EGRESADOS', { id: graduado.id })
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
          setGraduados(prev => prev.map(item => 
            item.id === g.id ? { ...item, credencial_enviada_en: new Date().toISOString(), credencial_envios_count: (item.credencial_envios_count || 0) + 1 } : item
          ))
        } else {
          fallidos++
        }
      } catch (err) {
        fallidos++
      }

      await new Promise(r => setTimeout(r, 180))
    }

    setEnviandoMasivo(false)
    emitirCambioSync('EGRESADOS', { masivo: true })
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
    <div className="h-full flex flex-col font-sans select-none overflow-hidden bg-slate-50/60">
      
      {/* 1. ENCABEZADO COMPACTO DE MÓDULO (IDENTICO A PREPARACION Y GRADUADOS) */}
      <header className="shrink-0 p-3 sm:px-4 bg-slate-900 text-white flex items-center justify-between gap-3 shadow-xs border-b border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
            <QrCode size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight truncate">
                Emisión y Despacho de Credenciales QR
              </h1>
              {ceremonia && (
                <span className="text-[9.5px] font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded shrink-0 truncate max-w-[140px]">
                  {ceremonia.nombre}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              Generación de credenciales digitales, pases grupales y envío masivo por email
            </p>
          </div>
        </div>

        {/* BOTONES DE ACCION PRINCIPAL */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            id="btn-despachar-masivo-top"
            onClick={ejecutarDespachoMasivo}
            disabled={enviandoMasivo || graduadosConfirmados.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-3 py-1.5 text-[11px] font-black shadow-xs transition active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {enviandoMasivo ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
            <span>{enviandoMasivo ? 'Despachando...' : `Despachar a Todos (${graduadosConfirmados.length})`}</span>
          </button>

          <button
            type="button"
            onClick={imprimirPadronCompleto}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 cursor-pointer"
            title="Imprimir padrón con códigos QR"
          >
            <Printer size={12} />
            <span>Imprimir Padrón</span>
          </button>

          {onNavegar && (
            <button
              type="button"
              id="btn-continuar-porteria"
              onClick={() => onNavegar('control-ingreso')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/80 px-3 py-1.5 text-[11px] font-black transition active:scale-95 cursor-pointer shadow-xs"
            >
              <ShieldCheck size={12} />
              <span>Acreditación</span>
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </header>

      {/* FEEDBACK BANNER */}
      {mensajeResultado && (
        <div className={`shrink-0 p-2.5 px-4 flex items-center justify-between text-xs font-bold border-b ${
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
        <div className="shrink-0 bg-sky-50 border-b border-sky-200 p-2.5 px-4 space-y-1.5 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-sky-900">
            <span className="flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin text-sky-600" />
              <span>Despachando a <strong>{progresoEnvio.actualNombre}</strong>...</span>
            </span>
            <span>{progresoEnvio.actual} de {progresoEnvio.total} ({Math.round((progresoEnvio.actual / progresoEnvio.total) * 100)}%)</span>
          </div>
          <div className="w-full bg-sky-200/80 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-sky-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(progresoEnvio.actual / progresoEnvio.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 2. CUERPO PRINCIPAL */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 [scrollbar-width:thin]">
        
        {/* KPI STATS BAR COMPACTO */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Users size={14} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Confirmados</p>
              <p className="text-sm font-black text-slate-900">{graduadosConfirmados.length}</p>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={14} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">QRs Enviados</p>
              <p className="text-sm font-black text-emerald-700">{totalEnviados}</p>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Mail size={14} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-600">Pendientes</p>
              <p className="text-sm font-black text-amber-700">{totalPendientes}</p>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Armchair size={14} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-indigo-600">Pases Acompañantes</p>
              <p className="text-sm font-black text-indigo-700">{invitados.length}</p>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTRO Y BUSCADOR COMPACTO */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar graduado por nombre, DNI o correo..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-[11px] font-medium text-slate-800 outline-none focus:border-sky-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none cursor-pointer hover:bg-white transition"
            >
              <option value="todos">Todos ({graduadosConfirmados.length})</option>
              <option value="pendientes">Pendientes ({totalPendientes})</option>
              <option value="enviados">Enviados ({totalEnviados})</option>
            </select>

            {carrerasUnicas.length > 0 && (
              <select
                value={filtroCarrera}
                onChange={e => setFiltroCarrera(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none cursor-pointer max-w-[160px] truncate hover:bg-white transition"
              >
                <option value="todas">Todas las Carreras</option>
                {carrerasUnicas.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* TABLA PRINCIPAL DE DESPACHO */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">Graduado / DNI</th>
                  <th className="py-2.5 px-3">Carrera</th>
                  <th className="py-2.5 px-3">Ubicación</th>
                  <th className="py-2.5 px-3">Pases</th>
                  <th className="py-2.5 px-3 text-center">Estado Credencial</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargando ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium text-xs">
                      <RefreshCw size={16} className="animate-spin mx-auto mb-2 text-sky-500" />
                      Cargando graduados y pases...
                    </td>
                  </tr>
                ) : graduadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 font-medium text-xs">
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
                        <td className="py-2 px-3">
                          <p className="font-bold text-slate-900 text-xs">{g.nombre}</p>
                          <p className="text-[10px] text-slate-400 font-mono">DNI: {g.dni || '—'} · {g.correo || 'Sin correo'}</p>
                        </td>

                        <td className="py-2 px-3 font-semibold text-slate-600 text-[11px] max-w-[170px] truncate">
                          {g.carrera || 'General'}
                        </td>

                        <td className="py-2 px-3">
                          {g.asiento_id ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-800 text-[10.5px] font-black">
                              <Armchair size={11} />
                              Butaca {g.asiento_id}
                            </span>
                          ) : (
                            <span className="text-[9.5px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                              Sin Asignar
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-600 text-[11px]">
                            <Users size={11} />
                            {invitadosGraduado.length} pase(s)
                          </span>
                        </td>

                        <td className="py-2 px-3 text-center">
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

                        <td className="py-2 px-3 text-right">
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10.5px] transition active:scale-95 disabled:opacity-40 cursor-pointer"
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

      {/* PIE DE PAGINA CON RESUMEN */}
      <footer className="shrink-0 p-2.5 px-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
        <span>Mostrando <strong>{graduadosFiltrados.length}</strong> de {graduadosConfirmados.length} graduados confirmados</span>
        {onNavegar && (
          <button
            type="button"
            onClick={() => onNavegar('preparacion-ceremonia')}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft size={12} />
            <span>Volver a Butacas</span>
          </button>
        )}
      </footer>

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
