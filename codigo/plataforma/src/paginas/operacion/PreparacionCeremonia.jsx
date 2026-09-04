import React, { useState, useEffect, useRef } from 'react'
import {
  Armchair, Sparkles, Users, Layers, Save, RotateCcw,
  CheckCircle2, AlertCircle, Search, ArrowRight, UserCheck,
  Download, Layout, ShieldCheck, ChevronRight, ChevronLeft,
  X, Info, GraduationCap, ZoomIn, ZoomOut, Check
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
import { emitirCambioSync, useSincronizacion } from '../../lib/sync'

export function PreparacionCeremonia({ onNavegar, ceremoniaActiva: ceremoniaProp }) {
  const [ceremonia, setCeremonia] = useState(ceremoniaProp || null)
  const [graduados, setGraduados] = useState([])
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [autoAsignando, setAutoAsignando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  
  // Pestañas
  const [pestana, setPestana] = useState('mapa') // 'mapa' | 'graduados' | 'estructura'
  
  // Estado del mapa
  const [nivel, setNivel] = useState('baja')
  const [zoom, setZoom] = useState(1)
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
  async function ejecutarAutoSeating() {
    if (!ceremonia?.id) return
    setAutoAsignando(true)
    setMensaje(null)
    try {
      const res = await autoAsignarButacas(ceremonia.id)
      setMensaje({ 
        tipo: 'exito', 
        texto: res.mensaje || '¡Distribución inteligente completada con éxito! Todos los alumnos y acompañantes fueron ubicados.' 
      })
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

  // Asientos ocupados en el mapa
  const mapaRolesVisual = { ...mapaRoles }
  graduadosConAsiento.forEach(g => { mapaRolesVisual[g.asiento_id] = 'egresado' })
  invitadosConAsiento.forEach(i => { mapaRolesVisual[i.asiento_id] = 'reservado' })

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
    <div className="font-sans space-y-4 max-w-7xl mx-auto pb-10">
      
      {/* HEADER DE FASE 4 */}
      <header className="rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-[9px] font-black uppercase tracking-wider">
              Fase 4 · Asignación de Butacas & Auditorio
            </span>
            {ceremonia && (
              <span className="text-[10px] font-bold text-slate-400 bg-white/10 px-2 py-0.5 rounded-md">
                {ceremonia.nombre}
              </span>
            )}
          </div>
          <h2 className="mt-1 text-xl font-black tracking-tight flex items-center gap-2">
            <Armchair className="text-cyan-400" size={20} />
            Distribución y Asignación de Butacas
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Mapa interactivo, ubicación de graduados y ejecución de Auto-Seating inteligente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            id="btn-auto-asignar-butacas"
            type="button"
            onClick={ejecutarAutoSeating}
            disabled={autoAsignando || graduados.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-3.5 py-2 text-xs font-black shadow-md shadow-cyan-500/20 transition active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {autoAsignando ? <Sparkles size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{autoAsignando ? 'Auto-asignando...' : 'Auto-Asignar Butacas'}</span>
          </button>

          <button
            type="button"
            onClick={guardarMapa}
            disabled={guardando}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white px-3 py-2 text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-40"
          >
            <Save size={13} />
            <span>{guardando ? 'Guardando...' : 'Guardar Mapa'}</span>
          </button>

          {onNavegar && (
            <button
              type="button"
              id="btn-finalizar-preparacion"
              onClick={() => onNavegar('bienvenida')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 px-3.5 py-2 text-xs font-black transition active:scale-95 cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              <CheckCircle2 size={13} />
              <span>Finalizar Preparación</span>
            </button>
          )}
        </div>
      </header>

      {/* FEEDBACK BANNER */}
      {mensaje && (
        <div className={`p-3.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs ${
          mensaje.tipo === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {mensaje.tipo === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{mensaje.texto}</span>
          </div>
          <button onClick={() => setMensaje(null)} className="cursor-pointer opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* KPI STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
            <Layers size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capacidad</p>
            <p className="text-sm font-black text-slate-900">{totalCapacidad} butacas</p>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
            <UserCheck size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Graduados Ubicados</p>
            <p className="text-sm font-black text-slate-900">{graduadosConAsiento.length} <span className="text-xs text-slate-400 font-bold">/ {graduados.length}</span></p>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
            <Users size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Acompañantes</p>
            <p className="text-sm font-black text-slate-900">{invitadosConAsiento.length} <span className="text-xs text-slate-400 font-bold">/ {invitados.length}</span></p>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs shrink-0">
            <Armchair size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">Total Ocupadas</p>
            <p className="text-sm font-black text-slate-900">{totalOcupados} asientos</p>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Disponibles</p>
            <p className="text-sm font-black text-slate-900">{disponibles} libres</p>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setPestana('mapa')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              pestana === 'mapa' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Armchair size={14} className={pestana === 'mapa' ? 'text-cyan-600' : ''} />
            Mapa Interactivo del Auditorio
          </button>

          <button
            type="button"
            onClick={() => setPestana('graduados')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              pestana === 'graduados' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users size={14} className={pestana === 'graduados' ? 'text-indigo-600' : ''} />
            Padrón y Asignaciones ({graduados.length})
          </button>

          <button
            type="button"
            onClick={() => setPestana('estructura')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              pestana === 'estructura' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layout size={14} className={pestana === 'estructura' ? 'text-sky-600' : ''} />
            Estructura & Presets
          </button>
        </div>

        {pestana === 'mapa' && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setNivel('baja')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black uppercase transition cursor-pointer ${
                nivel === 'baja' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Platea Baja
            </button>
            <button
              type="button"
              onClick={() => setNivel('alta')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black uppercase transition cursor-pointer ${
                nivel === 'alta' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Pullman (Balcón)
            </button>
          </div>
        )}
      </div>

      {/* CONTENIDO SEGÚN PESTAÑA */}
      {pestana === 'mapa' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          
          {/* MAPA PRINCIPAL */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col items-center min-h-[480px]">
            
            {/* Tarjeta de info si se cliquea una butaca ocupada */}
            {asientoSeleccionadoInfo && (
              <div className="w-full mb-3 p-3 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold text-xs">
                    <Armchair size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">
                      {asientoSeleccionadoInfo.nombre} · <span className="text-cyan-700 font-bold uppercase text-[10px]">{asientoSeleccionadoInfo.tipo}</span>
                    </p>
                    <p className="text-[10.5px] text-slate-500 font-medium">
                      Butaca: <strong>{asientoSeleccionadoInfo.asientoId}</strong> {asientoSeleccionadoInfo.carrera ? `· ${asientoSeleccionadoInfo.carrera}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAsientoSeleccionadoInfo(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="w-full overflow-x-auto flex justify-center py-2">
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
                compacto={false}
              />
            </div>
          </div>

          {/* PANEL DE PINCELES Y HERRAMIENTAS */}
          <div className="space-y-3">
            
            {/* Pinceles de Rol */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-sky-500" /> Pincel de Sectores
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'egresado', label: 'Sector Graduados', color: 'bg-indigo-600 text-white', desc: 'Primeras filas Platea' },
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
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition cursor-pointer ${
                      rolPincel === r.id
                        ? 'border-cyan-500 bg-cyan-50/70 ring-1 ring-cyan-400'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold shadow-xs ${r.color}`}>
                      ✓
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[10.5px] font-black leading-tight truncate ${rolPincel === r.id ? 'text-cyan-950' : 'text-slate-800'}`}>
                        {r.label}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate">{r.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Controles de Zoom */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Escala</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(0.6, z - 0.1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="text-xs font-bold text-slate-700 w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(1.4, z + 0.1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <ZoomIn size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA: LISTA DE GRADUADOS Y ASIGNACIONES */}
      {pestana === 'graduados' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Barra de búsqueda */}
          <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Buscar graduado por nombre, DNI, carrera o butaca..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 shadow-xs"
              />
            </div>
            <div className="text-[11px] font-bold text-slate-500 shrink-0">
              Mostrando {graduadosFiltrados.length} de {graduados.length} graduados
            </div>
          </div>

          {/* Tabla de graduados */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[9.5px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Estudiante</th>
                  <th className="py-2.5 px-4">Carrera</th>
                  <th className="py-2.5 px-4">Butaca Graduado</th>
                  <th className="py-2.5 px-4">Acompañantes</th>
                  <th className="py-2.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {graduadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                      No se encontraron graduados registrados.
                    </td>
                  </tr>
                ) : (
                  graduadosFiltrados.map(g => {
                    const invs = invitados.filter(i => i.egresado_id === g.id || i.egresadoId === g.id)
                    return (
                      <tr key={g.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4">
                          <p className="font-bold text-slate-900">{g.nombre}</p>
                          <p className="text-[10px] text-slate-400">DNI: {g.dni} {g.legajo ? `· Leg: ${g.legajo}` : ''}</p>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">
                          {g.carrera || '-'}
                        </td>
                        <td className="py-2.5 px-4">
                          {g.asiento_id ? (
                            <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-md font-black text-[10.5px]">
                              <Armchair size={12} /> {g.asiento_id}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Sin asignar</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {invs.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {invs.map(inv => (
                                <span key={inv.id} className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                                  {inv.nombre}: {inv.asiento_id || 'Sin butaca'}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">0 acompañantes</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setGraduadoParaAsignar(g)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border border-slate-200 hover:border-cyan-200 rounded-lg text-[10.5px] font-bold transition cursor-pointer"
                          >
                            <Armchair size={12} /> Asignar Butaca
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Plantillas / Presets */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Sparkles size={15} className="text-cyan-500" /> Plantillas de Sala Preconfiguradas
            </h4>
            <p className="text-xs text-slate-500">
              Aplicá una arquitectura de sala predeterminada con pasillos y sectores definidos:
            </p>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => aplicarPlantilla('beltran')}
                className="w-full text-left p-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-950 transition cursor-pointer"
              >
                <p className="font-black text-xs">★ Auditorio Beltrán (3 Bloques + 2 Pasillos)</p>
                <p className="text-[10px] text-cyan-700">7 filas en Platea Baja + 5 filas en Pullman con pasillos laterales.</p>
              </button>

              <button
                type="button"
                onClick={() => aplicarPlantilla('pasillo-central')}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition cursor-pointer"
              >
                <p className="font-black text-xs">Aula Magna (2 Bloques con Pasillo Central)</p>
                <p className="text-[10px] text-slate-500">8 filas en Platea Baja con pasillo divisorio en columna central.</p>
              </button>

              <button
                type="button"
                onClick={() => aplicarPlantilla('limpiar')}
                className="w-full text-left p-2.5 rounded-xl bg-rose-50/60 hover:bg-rose-100 border border-rose-100 text-rose-700 transition text-xs font-bold cursor-pointer"
              >
                Restablecer todos los roles a libres
              </button>
            </div>
          </div>

          {/* Configuración de Filas y Columnas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Layout size={15} className="text-sky-500" /> Dimensiones de la Sala
            </h4>

            <div className="space-y-3">
              <div>
                <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
                  Platea Baja: Filas ({estructura.baja.filas}) x Asientos ({estructura.baja.asientos})
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={estructura.baja.filas}
                    onChange={e => setEstructura(prev => ({ ...prev, baja: { ...prev.baja, filas: parseInt(e.target.value) || 1 } }))}
                    className="p-2 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={estructura.baja.asientos}
                    onChange={e => setEstructura(prev => ({ ...prev, baja: { ...prev.baja, asientos: parseInt(e.target.value) || 1 } }))}
                    className="p-2 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
                  Pullman: Filas ({estructura.alta.filas}) x Asientos ({estructura.alta.asientos})
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={estructura.alta.filas}
                    onChange={e => setEstructura(prev => ({ ...prev, alta: { ...prev.alta, filas: parseInt(e.target.value) || 1 } }))}
                    className="p-2 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={estructura.alta.asientos}
                    onChange={e => setEstructura(prev => ({ ...prev, alta: { ...prev.alta, asientos: parseInt(e.target.value) || 1 } }))}
                    className="p-2 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Aforo Teórico Total</p>
                  <p className="text-base font-black text-slate-900">{totalCapacidad} Butacas</p>
                </div>
                <button
                  type="button"
                  onClick={guardarMapa}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer"
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
          onAsignado={async () => {
            setGraduadoParaAsignar(null)
            await cargarDatos()
            setMensaje({ tipo: 'exito', texto: 'Ubicación guardada con éxito.' })
          }}
        />
      )}

    </div>
  )
}
