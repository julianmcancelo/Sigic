import React, { useState, useEffect, useRef } from 'react'
import {
  Armchair, Sparkles, Users, Layers, Save, RotateCcw,
  CheckCircle2, AlertCircle, Search, ArrowRight, UserCheck,
  Download, Layout, ShieldCheck, ChevronRight, ChevronLeft,
  X, Info, GraduationCap, ZoomIn, ZoomOut, Check, Award, RefreshCw
} from 'lucide-react'
import {
  BASE,
  obtenerCeremoniaActiva,
  obtenerGraduados,
  obtenerInvitados,
  autoAsignarButacas,
  cabeceras
} from '../../servicios/api'
import { SeleccionAsientos } from '../SeleccionAsientos'
import { ModalAsignarAsientos } from '../../componentes/ModalAsignarAsientos'
import { ModalAutoAsignar } from '../../componentes/ModalAutoAsignar'
import { ModalResumenDemostracion } from '../../componentes/ModalResumenDemostracion'
import { ModalDespachoCredenciales } from '../../componentes/ModalDespachoCredenciales'
import { emitirCambioSync, useSincronizacion } from '../../lib/sync'

export function PreparacionCeremonia({ onNavegar, ceremoniaActiva: ceremoniaProp }) {
  const [ceremonia, setCeremonia] = useState(ceremoniaProp || null)
  const [graduados, setGraduados] = useState([])
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [autoAsignando, setAutoAsignando] = useState(false)
  const [mostrarModalAutoAsignar, setMostrarModalAutoAsignar] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [mostrarResumenFinal, setMostrarResumenFinal] = useState(false)
  const [mostrarDespachoCredenciales, setMostrarDespachoCredenciales] = useState(false)
  
  // Pestañas
  const [pestana, setPestana] = useState('mapa') // 'mapa' | 'graduados' | 'estructura'
  
  // Estado del mapa
  const [nivel, setNivel] = useState('baja')
  const [zoom, setZoom] = useState(0.9)
  const [rolPincel, setRolPincel] = useState('egresado')
  const [estructura, setEstructura] = useState({
    baja: { filas: 7, asientos: 20 },
    alta: { filas: 5, asientos: 22 }
  })
  const [estructuraOriginal, setEstructuraOriginal] = useState(null)
  const [mapaRoles, setMapaRoles] = useState({})
  const [mapaRolesOriginal, setMapaRolesOriginal] = useState(null)
  const [asientoSeleccionadoInfo, setAsientoSeleccionadoInfo] = useState(null)

  // Búsqueda y modal de asignación individual
  const [busqueda, setBusqueda] = useState('')
  const [graduadoParaAsignar, setGraduadoParaAsignar] = useState(null)

  // Cargar todos los datos
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

      if (cerActiva?.id) {
        const res = await fetch(`${BASE}/configuracion/anfiteatro/estructura/${cerActiva.id}`, {
          headers: cabeceras()
        })
        if (res.ok) {
          const data = await res.json()
          if (data.estructura) {
            setEstructura(data.estructura)
            setEstructuraOriginal(data.estructura)
          }
          if (data.mapaRoles) {
            setMapaRoles(data.mapaRoles)
            setMapaRolesOriginal(data.mapaRoles)
          }
        }
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al sincronizar datos del auditorio.' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Sincronización en vivo
  useSincronizacion(['BUTACAS', 'EGRESADOS', 'INVITADOS'], () => {
    cargarDatos()
  })

  // Ejecutar Auto-Seating (Distribución Inteligente)
  async function ejecutarAutoSeating(opciones = {}) {
    if (!ceremonia?.id) return
    setAutoAsignando(true)
    setMensaje(null)
    try {
      const res = await autoAsignarButacas(ceremonia.id, opciones)
      setMensaje({ 
        tipo: 'exito', 
        texto: res.mensaje || '¡Distribución inteligente completada con éxito! Todos los alumnos y acompañantes fueron ubicados.' 
      })
      setMostrarModalAutoAsignar(false)
      emitirCambioSync('BUTACAS')
      await cargarDatos()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'No se pudo completar la auto-asignación.' })
    } finally {
      setAutoAsignando(false)
    }
  }

  // Guardar configuración del mapa
  async function guardarMapa() {
    if (!ceremonia?.id) return
    setGuardando(true)
    try {
      const res = await fetch(`${BASE}/configuracion/anfiteatro/estructura/${ceremonia.id}`, {
        method: 'POST',
        headers: cabeceras(),
        body: JSON.stringify({ estructura, mapaRoles })
      })
      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: 'Estructura y sectores del anfiteatro guardados exitosamente.' })
        setEstructuraOriginal(JSON.parse(JSON.stringify(estructura)))
        setMapaRolesOriginal(JSON.parse(JSON.stringify(mapaRoles)))
        emitirCambioSync('BUTACAS')
        setTimeout(() => setMensaje(null), 3000)
      } else {
        throw new Error('No se pudo guardar la configuración')
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar el mapa.' })
    } finally {
      setGuardando(false)
    }
  }

  // Presets arquitectónicos
  const aplicarPlantilla = (tipo) => {
    if (tipo === 'beltran') {
      const nuevaEstructura = {
        baja: { filas: 7, asientos: 20 },
        alta: { filas: 5, asientos: 22 }
      }
      const nuevosRoles = {}
      const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
      letras.forEach((letra, idx) => {
        nuevosRoles[`baja-${letra}-5`] = 'bloqueado'
        nuevosRoles[`baja-${letra}-16`] = 'bloqueado'
        if (idx === 0 || idx === 1) {
          for (let col = 6; col <= 15; col++) nuevosRoles[`baja-${letra}-${col}`] = 'egresado'
        }
        if (idx === 2) {
          for (let col = 6; col <= 15; col++) nuevosRoles[`baja-${letra}-${col}`] = 'padrino'
        }
        if (idx === 0) {
          nuevosRoles[`baja-A-4`] = 'discapacitado'
          nuevosRoles[`baja-A-17`] = 'discapacitado'
          nuevosRoles[`baja-A-1`] = 'autoridad'
          nuevosRoles[`baja-A-2`] = 'autoridad'
        }
      })
      setEstructura(nuevaEstructura)
      setMapaRoles(nuevosRoles)
      setMensaje({ tipo: 'exito', texto: 'Plantilla Auditorio Beltrán (3 Bloques) aplicada.' })
    } else if (tipo === 'pasillo-central') {
      const nuevaEstructura = {
        baja: { filas: 8, asientos: 17 },
        alta: { filas: 6, asientos: 17 }
      }
      const nuevosRoles = {}
      const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
      letras.forEach((letra, idx) => {
        nuevosRoles[`baja-${letra}-9`] = 'bloqueado'
        if (idx < 2) {
          for (let col = 1; col <= 8; col++) nuevosRoles[`baja-${letra}-${col}`] = 'egresado'
          for (let col = 10; col <= 17; col++) nuevosRoles[`baja-${letra}-${col}`] = 'egresado'
        }
      })
      setEstructura(nuevaEstructura)
      setMapaRoles(nuevosRoles)
      setMensaje({ tipo: 'exito', texto: 'Plantilla de Pasillo Central aplicada.' })
    } else if (tipo === 'limpiar') {
      setMapaRoles({})
      setMensaje({ tipo: 'exito', texto: 'Mapa de roles restablecido a disponibles.' })
    }
    setTimeout(() => setMensaje(null), 3000)
  }

  // Click en asiento en pestaña de mapa
  const manejarClickAsientoMapa = (asientoId) => {
    // Verificar si está ocupado por graduado o invitado
    const gradOcupante = graduados.find(g => g.asiento_id === asientoId)
    const invOcupante = invitados.find(i => i.asiento_id === asientoId)

    if (gradOcupante) {
      setAsientoSeleccionadoInfo({
        asientoId,
        tipo: 'Graduado',
        nombre: gradOcupante.nombre,
        dni: gradOcupante.dni,
        carrera: gradOcupante.carrera,
        objeto: gradOcupante
      })
      return
    }

    if (invOcupante) {
      const g = graduados.find(x => x.id === invOcupante.egresado_id || x.id === invOcupante.egresadoId)
      setAsientoSeleccionadoInfo({
        asientoId,
        tipo: 'Acompañante',
        nombre: invOcupante.nombre,
        dni: invOcupante.dni,
        carrera: g ? `Acompaña a: ${g.nombre}` : 'Acompañante',
        objeto: invOcupante
      })
      return
    }

    // Si no está ocupado por persona, aplicar el pincel de rol
    setAsientoSeleccionadoInfo(null)
    setMapaRoles(prev => ({
      ...prev,
      [asientoId]: rolPincel
    }))
  }

  // Métricas calculadas
  const totalCapacidad = (estructura.baja.filas * estructura.baja.asientos) + (estructura.alta.filas * estructura.alta.asientos)
  const graduadosConAsiento = graduados.filter(g => g.asiento_id)
  const invitadosConAsiento = invitados.filter(i => i.asiento_id)
  const totalOcupados = graduadosConAsiento.length + invitadosConAsiento.length
  const disponibles = Math.max(0, totalCapacidad - totalOcupados)

  // Asientos ocupados en el mapa y tooltip con nombre de asignados
  const mapaRolesVisual = { ...mapaRoles }
  const datosPorAsiento = {}

  graduadosConAsiento.forEach(g => {
    mapaRolesVisual[g.asiento_id] = 'egresado'
    datosPorAsiento[g.asiento_id] = {
      nombre: g.nombre,
      carrera: g.carrera,
      tipo: 'Graduado',
      juramento: g.formula_juramento === 'DIOS_Y_PATRIA' ? 'Dios y Patria' : 'Por la Patria'
    }
  })

  invitadosConAsiento.forEach(i => {
    mapaRolesVisual[i.asiento_id] = 'reservado'
    const egresadoTitular = graduados.find(x => x.id === i.egresado_id || x.id === i.egresadoId)
    datosPorAsiento[i.asiento_id] = {
      nombre: i.nombre,
      carrera: egresadoTitular ? `Acompañante de ${egresadoTitular.nombre}` : 'Acompañante',
      tipo: i.es_padrino || i.esPadrino ? 'Padrino de Diploma' : 'Acompañante'
    }
  })

  // Filtrado de graduados para la pestaña de lista
  const graduadosFiltrados = graduados.filter(g => {
    const q = busqueda.toLowerCase().trim()
    if (!q) return true
    return (
      (g.nombre && g.nombre.toLowerCase().includes(q)) ||
      (g.dni && String(g.dni).includes(q)) ||
      (g.carrera && g.carrera.toLowerCase().includes(q)) ||
      (g.asiento_id && g.asiento_id.toLowerCase().includes(q))
    )
  })

  return (
    <div className="font-sans space-y-2.5 max-w-7xl mx-auto pb-4">
      
      {/* HEADER ULTRA COMPACTO */}
      <header className="rounded-xl bg-slate-900 px-4 py-2.5 text-white shadow-sm flex flex-wrap items-center justify-between gap-2.5 border border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/20 text-sky-400 flex items-center justify-center shrink-0">
            <Armchair size={17} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-tight truncate">
                Distribución y Asignación de Butacas
              </h2>
              {ceremonia && (
                <span className="text-[9.5px] font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded shrink-0 truncate max-w-[140px]">
                  {ceremonia.nombre}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              Auto-Seating inteligente, mapa de auditorio y control de sectores
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-auto-asignar-butacas"
            type="button"
            onClick={() => setMostrarModalAutoAsignar(true)}
            disabled={autoAsignando || graduados.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-3 py-1.5 text-[11px] font-black shadow-xs transition active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {autoAsignando ? <Sparkles size={13} className="animate-spin" /> : <Sparkles size={13} />}
            <span>{autoAsignando ? 'Auto-asignando...' : 'Auto-Asignar Butacas'}</span>
          </button>

          <button
            type="button"
            onClick={guardarMapa}
            disabled={guardando}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 cursor-pointer disabled:opacity-40"
          >
            <Save size={12} />
            <span>{guardando ? 'Guardando...' : 'Guardar Mapa'}</span>
          </button>

          <button
            type="button"
            id="btn-despacho-credenciales"
            onClick={() => setMostrarDespachoCredenciales(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 cursor-pointer shadow-xs"
            title="Centro de Despacho y Emisión de Credenciales QR"
          >
            <Download size={12} />
            <span>Despacho QR</span>
          </button>

          {onNavegar && (
            <button
              type="button"
              id="btn-finalizar-preparacion"
              onClick={() => setMostrarResumenFinal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/80 px-3 py-1.5 text-[11px] font-black transition active:scale-95 cursor-pointer shadow-xs"
            >
              <CheckCircle2 size={12} />
              <span>Finalizar</span>
            </button>
          )}
        </div>
      </header>

      {/* FEEDBACK BANNER COMPACTO */}
      {mensaje && (
        <div className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-2xs animate-in slide-in-from-top duration-200 ${
          mensaje.tipo === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {mensaje.tipo === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            <span className="text-[11px]">{mensaje.texto}</span>
          </div>
          <button onClick={() => setMensaje(null)} className="cursor-pointer opacity-70 hover:opacity-100 p-0.5">✕</button>
        </div>
      )}

      {/* KPI STATS BAR COMPACTO */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Layers size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest truncate">Capacidad</p>
            <p className="text-xs font-black text-slate-900 leading-tight truncate">{totalCapacidad} butacas</p>
          </div>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <UserCheck size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-[8.5px] font-black text-indigo-600 uppercase tracking-widest truncate">Graduados</p>
            <p className="text-xs font-black text-slate-900 leading-tight truncate">
              {graduadosConAsiento.length} <span className="text-[10px] text-slate-400 font-bold">/ {graduados.length}</span>
            </p>
          </div>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Users size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-[8.5px] font-black text-amber-600 uppercase tracking-widest truncate">Acompañantes</p>
            <p className="text-xs font-black text-slate-900 leading-tight truncate">
              {invitadosConAsiento.length} <span className="text-[10px] text-slate-400 font-bold">/ {invitados.length}</span>
            </p>
          </div>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Armchair size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-[8.5px] font-black text-sky-600 uppercase tracking-widest truncate">Ocupadas</p>
            <p className="text-xs font-black text-slate-900 leading-tight truncate">{totalOcupados} asientos</p>
          </div>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5 col-span-2 sm:col-span-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-[8.5px] font-black text-emerald-600 uppercase tracking-widest truncate">Disponibles</p>
            <p className="text-xs font-black text-slate-900 leading-tight truncate">{disponibles} libres</p>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN COMPACTAS */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-1 pt-0.5">
        <div className="flex gap-1 bg-slate-100/90 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setPestana('mapa')}
            className={`px-3 py-1 rounded-md text-[11px] font-black transition cursor-pointer flex items-center gap-1.5 ${
              pestana === 'mapa' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Armchair size={13} className={pestana === 'mapa' ? 'text-sky-500' : ''} />
            Mapa Interactivo
          </button>

          <button
            type="button"
            onClick={() => setPestana('graduados')}
            className={`px-3 py-1 rounded-md text-[11px] font-black transition cursor-pointer flex items-center gap-1.5 ${
              pestana === 'graduados' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users size={13} className={pestana === 'graduados' ? 'text-indigo-600' : ''} />
            Padrón y Butacas ({graduados.length})
          </button>

          <button
            type="button"
            onClick={() => setPestana('estructura')}
            className={`px-3 py-1 rounded-md text-[11px] font-black transition cursor-pointer flex items-center gap-1.5 ${
              pestana === 'estructura' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layout size={13} className={pestana === 'estructura' ? 'text-sky-600' : ''} />
            Estructura & Presets
          </button>
        </div>

        {pestana === 'mapa' && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setNivel('baja')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase transition cursor-pointer ${
                nivel === 'baja' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Platea Baja
            </button>
            <button
              type="button"
              onClick={() => setNivel('alta')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase transition cursor-pointer ${
                nivel === 'alta' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Pullman (Balcón)
            </button>
          </div>
        )}
      </div>

      {/* CONTENIDO: MAPA INTERACTIVO */}
      {pestana === 'mapa' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          
          {/* MAPA PRINCIPAL (8 COLS) */}
          <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-col items-center min-h-[460px] overflow-hidden">
            
            {/* Info si se cliquea una butaca */}
            {asientoSeleccionadoInfo ? (
              <div className="w-full mb-3 p-3 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-white border border-sky-200 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    <Armchair size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-slate-900 leading-tight">
                        {asientoSeleccionadoInfo.nombre}
                      </p>
                      <span className="text-[9px] bg-indigo-100 text-indigo-800 font-black px-1.5 py-0.5 rounded uppercase border border-indigo-200/60">
                        {asientoSeleccionadoInfo.tipo}
                      </span>
                      {asientoSeleccionadoInfo.objeto?.formula_juramento && (
                        <span className="text-[9px] bg-sky-100 text-sky-800 font-black px-1.5 py-0.5 rounded border border-sky-200/60">
                          {asientoSeleccionadoInfo.objeto.formula_juramento === 'DIOS_Y_PATRIA' ? 'Juramento: Dios y Patria' : 'Juramento: Por la Patria'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-600 font-medium mt-0.5 leading-tight flex items-center gap-2">
                      <span>Ubicación: <strong className="text-slate-900 font-black">{asientoSeleccionadoInfo.asientoId}</strong></span>
                      {asientoSeleccionadoInfo.dni && <span>· DNI: <strong>{asientoSeleccionadoInfo.dni}</strong></span>}
                      {asientoSeleccionadoInfo.carrera && <span>· {asientoSeleccionadoInfo.carrera}</span>}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAsientoSeleccionadoInfo(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-lg cursor-pointer transition"
                  title="Cerrar detalle"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="w-full mb-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Info size={13} className="text-sky-500" />
                  <strong>Consejo:</strong> Pasá el mouse sobre cualquier butaca para ver quién está asignado o hacé clic para ver su ficha.
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {graduadosConAsiento.length} graduados ubicados
                </span>
              </div>
            )}

            <div className="w-full overflow-x-auto flex justify-center py-1 [&_.sigic-mapa]:p-2 [&_.sigic-mapa]:rounded-xl [&_.sigic-escenario]:mb-2 [&_.sigic-escenario__sombra]:h-1 [&_.sigic-stats__pill]:px-2 [&_.sigic-stats__pill]:py-1">
              <SeleccionAsientos
                ceremoniaId={ceremonia?.id}
                nivel={nivel}
                setNivel={setNivel}
                zoom={zoom}
                setZoom={setZoom}
                estructura={estructura}
                mapaRoles={mapaRolesVisual}
                seleccionados={[]}
                onAsientoClick={manejarClickAsientoMapa}
                compacto={true}
                datosPorAsiento={datosPorAsiento}
              />
            </div>
          </div>

          {/* PANEL LATERAL DE PINCELES Y ZOOM (4 COLS) */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-2.5">
            
            {/* Pinceles de Rol Compactos */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h4 className="text-[9.5px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <ShieldCheck size={13} className="text-sky-500" /> Pincel de Sectores
                </h4>
                <span className="text-[8.5px] font-bold text-slate-400">Clic para pintar</span>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {[
                  { id: 'egresado', label: 'Sector Graduados', color: 'bg-indigo-600 text-white', desc: 'Primeras filas Platea' },
                  { id: 'padrino', label: 'Sector Padrinos', color: 'bg-red-500 text-white', desc: 'Exclusivo padrinos de diploma' },
                  { id: 'disponible', label: 'Sector Acompañantes / Libre', color: 'bg-white border border-slate-300 text-slate-700', desc: 'Libre para auto-seating' },
                  { id: 'autoridad', label: 'Autoridades / Estrado', color: 'bg-slate-900 text-white', desc: 'Mesa académica' },
                  { id: 'discapacitado', label: 'Accesibilidad Reducida', color: 'bg-purple-600 text-white', desc: 'Extremos y pasillos' },
                  { id: 'reservado', label: 'Reservado Especial', color: 'bg-amber-500 text-white', desc: 'Protocolo institucional' },
                  { id: 'bloqueado', label: 'Pasillo / Columna', color: 'bg-slate-200 text-slate-600', desc: 'Espacio no transitable' },
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRolPincel(r.id)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition cursor-pointer active:scale-98 ${
                      rolPincel === r.id
                        ? 'border-sky-500 bg-sky-50/80 ring-1 ring-sky-400'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 text-[9px] font-bold shadow-2xs ${r.color}`}>
                      ✓
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-black leading-none truncate ${rolPincel === r.id ? 'text-sky-950' : 'text-slate-800'}`}>
                        {r.label}
                      </p>
                      <p className="text-[8.5px] text-slate-400 truncate mt-0.5">{r.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Controles de Escala Compactos */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-2 shadow-2xs flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider ml-1">Escala Mapa</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                  className="w-6 h-6 rounded-md border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 cursor-pointer active:scale-95"
                  title="Reducir zoom"
                >
                  <ZoomOut size={11} />
                </button>
                <span className="text-[10px] font-bold text-slate-700 w-8 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(1.3, z + 0.1))}
                  className="w-6 h-6 rounded-md border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 cursor-pointer active:scale-95"
                  title="Aumentar zoom"
                >
                  <ZoomIn size={11} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA: LISTA DE GRADUADOS Y ASIGNACIONES */}
      {pestana === 'graduados' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          
          {/* Barra de búsqueda */}
          <div className="p-2.5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50/50">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Buscar por nombre, DNI, carrera o butaca..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
              />
            </div>
            <div className="text-[10px] font-bold text-slate-500 shrink-0">
              {graduadosFiltrados.length} de {graduados.length} graduados
            </div>
          </div>

          {/* Tabla de graduados compacta */}
          <div className="overflow-x-auto max-h-[500px] [scrollbar-width:thin]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[9px] border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3">Estudiante</th>
                  <th className="py-2 px-3">Carrera</th>
                  <th className="py-2 px-3">Butaca Graduado</th>
                  <th className="py-2 px-3">Acompañantes</th>
                  <th className="py-2 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {graduadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 font-bold text-xs">
                      No se encontraron graduados registrados.
                    </td>
                  </tr>
                ) : (
                  graduadosFiltrados.map(g => {
                    const invs = invitados.filter(i => i.egresado_id === g.id || i.egresadoId === g.id)
                    return (
                      <tr key={g.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3">
                          <p className="font-bold text-slate-900 leading-tight">{g.nombre}</p>
                          <p className="text-[9.5px] text-slate-400">DNI: {g.dni} {g.legajo ? `· Leg: ${g.legajo}` : ''}</p>
                        </td>
                        <td className="py-2 px-3 text-slate-600 max-w-xs truncate text-[10.5px]">
                          {g.carrera || '-'}
                        </td>
                        <td className="py-2 px-3">
                          {g.asiento_id ? (
                            <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-black text-[10px]">
                              <Armchair size={11} /> {g.asiento_id}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[9.5px]">Sin asignar</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {invs.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {invs.map(inv => {
                                const esPadrino = Boolean(inv.es_padrino || inv.esPadrino)
                                return (
                                  <span
                                    key={inv.id}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      esPadrino
                                        ? 'bg-red-100 border border-red-300 text-red-900 font-black'
                                        : 'bg-slate-50 border border-slate-200 text-slate-700'
                                    }`}
                                    title={esPadrino ? 'Padrino de diploma' : 'Acompañante regular'}
                                  >
                                    {esPadrino && <Award size={9} className="text-red-700 shrink-0" />}
                                    {inv.nombre}{esPadrino ? ' (Padrino)' : ''}: {inv.asiento_id || 'S/B'}
                                  </span>
                                )
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[9.5px]">0 acompañantes</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setGraduadoParaAsignar(g)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-200 rounded-lg text-[10px] font-bold transition cursor-pointer active:scale-95"
                          >
                            <Armchair size={11} /> Asignar
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA: ESTRUCTURA Y PRESETS */}
      {pestana === 'estructura' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Plantillas / Presets */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Sparkles size={14} className="text-sky-500" /> Plantillas de Sala Preconfiguradas
            </h4>
            <p className="text-[11px] text-slate-500">
              Aplicá una arquitectura de sala predeterminada con pasillos y sectores definidos:
            </p>
            <div className="space-y-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => aplicarPlantilla('beltran')}
                className="w-full text-left p-2.5 rounded-lg bg-sky-50/80 hover:bg-sky-100/80 border border-sky-200 text-sky-950 transition cursor-pointer"
              >
                <p className="font-black text-xs">★ Auditorio Beltrán (3 Bloques + 2 Pasillos)</p>
                <p className="text-[9.5px] text-sky-700">7 filas en Platea Baja + 5 filas en Pullman con pasillos laterales.</p>
              </button>

              <button
                type="button"
                onClick={() => aplicarPlantilla('pasillo-central')}
                className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition cursor-pointer"
              >
                <p className="font-black text-xs">Aula Magna (2 Bloques con Pasillo Central)</p>
                <p className="text-[9.5px] text-slate-500">8 filas en Platea Baja con pasillo divisorio en columna central.</p>
              </button>

              <button
                type="button"
                onClick={() => aplicarPlantilla('limpiar')}
                className="w-full text-left p-2 rounded-lg bg-rose-50/60 hover:bg-rose-100 border border-rose-100 text-rose-700 transition text-[11px] font-bold cursor-pointer"
              >
                Restablecer todos los roles a disponibles
              </button>
            </div>
          </div>

          {/* Configuración de Filas y Columnas */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Layout size={14} className="text-sky-500" /> Dimensiones de la Sala
            </h4>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Platea Baja: Filas ({estructura.baja.filas}) x Asientos ({estructura.baja.asientos})
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={estructura.baja.filas}
                    onChange={e => setEstructura(prev => ({ ...prev, baja: { ...prev.baja, filas: parseInt(e.target.value) || 1 } }))}
                    className="p-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={estructura.baja.asientos}
                    onChange={e => setEstructura(prev => ({ ...prev, baja: { ...prev.baja, asientos: parseInt(e.target.value) || 1 } }))}
                    className="p-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Pullman: Filas ({estructura.alta.filas}) x Asientos ({estructura.alta.asientos})
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={estructura.alta.filas}
                    onChange={e => setEstructura(prev => ({ ...prev, alta: { ...prev.alta, filas: parseInt(e.target.value) || 1 } }))}
                    className="p-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={estructura.alta.asientos}
                    onChange={e => setEstructura(prev => ({ ...prev, alta: { ...prev.alta, asientos: parseInt(e.target.value) || 1 } }))}
                    className="p-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400">Aforo Teórico Total</p>
                  <p className="text-sm font-black text-slate-900">{totalCapacidad} Butacas</p>
                </div>
                <button
                  type="button"
                  onClick={guardarMapa}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-black transition cursor-pointer active:scale-95"
                >
                  Aplicar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ASIGNACIÓN INDIVIDUAL */}
      {graduadoParaAsignar && (
        <ModalAsignarAsientos
          graduado={graduadoParaAsignar}
          invitados={invitados.filter(i => i.egresado_id === graduadoParaAsignar.id || i.egresadoId === graduadoParaAsignar.id)}
          ceremoniaId={ceremonia?.id}
          todosLosGraduados={graduados}
          todosLosInvitados={invitados}
          modo="confirmacion"
          onCerrar={() => setGraduadoParaAsignar(null)}
          onAsignado={async (resultado) => {
            setGraduadoParaAsignar(null)
            await cargarDatos()
            if (resultado?.credencialEnviada) {
              setMensaje({ tipo: 'exito', texto: 'Butacas confirmadas y credencial con indicaciones del evento enviada al correo del egresado.' })
            } else if (resultado?.mensajeCredencial) {
              setMensaje({ tipo: 'advertencia', texto: `Butacas guardadas. ${resultado.mensajeCredencial}` })
            } else {
              setMensaje({ tipo: 'exito', texto: 'Ubicación guardada con éxito.' })
            }
          }}
        />
      )}

      {/* MODAL DE AUTO-ASIGNACIÓN INTELIGENTE */}
      <ModalAutoAsignar
        abierto={mostrarModalAutoAsignar}
        onCerrar={() => setMostrarModalAutoAsignar(false)}
        onConfirmar={ejecutarAutoSeating}
        cargando={autoAsignando}
        totalGraduados={graduados.length}
        graduadosAceptados={graduados.filter(g => g.estado === 'ACEPTADO').length}
        totalInvitados={invitados.length}
      />

      {/* MODAL DE DESPACHO Y EMISIÓN DE CREDENCIALES QR */}
      {mostrarDespachoCredenciales && (
        <ModalDespachoCredenciales
          ceremonia={ceremonia}
          graduados={graduados}
          invitados={invitados}
          onCerrar={() => {
            setMostrarDespachoCredenciales(false)
            cargarDatos()
          }}
          onIrAPorteria={() => {
            setMostrarDespachoCredenciales(false)
            if (onNavegar) onNavegar('porteria')
          }}
        />
      )}

      {/* MODAL DE RESUMEN EJECUTIVO Y AGRADECIMIENTO */}
      {mostrarResumenFinal && (
        <ModalResumenDemostracion
          ceremonia={ceremonia}
          graduados={graduados}
          invitados={invitados}
          butacasAsignadas={graduadosConAsiento.length + invitadosConAsiento.length}
          onCerrar={() => {
            setMostrarResumenFinal(false)
            if (onNavegar) onNavegar('bienvenida')
          }}
          onReiniciar={() => {
            setMostrarResumenFinal(false)
            window.location.reload()
          }}
        />
      )}

    </div>
  )
}
