import { useState, useEffect } from 'react'
import { 
  BarChart3, Users, GraduationCap, CheckCircle2, 
  ArrowLeft, Download, Search, AlertCircle, FileSpreadsheet,
  TrendingUp, Award, Calendar, CheckSquare, Square, RefreshCw
} from 'lucide-react'
import { HeaderGlobal } from '../../componentes/HeaderGlobal'
import { obtenerGraduados, obtenerInvitados, marcarPresente } from '../../servicios/api'

// ─── Colores del sistema (Identical to Version 1) ─────────────────
const DARK   = '#2A3448'
const ACCENT = '#0EA5E9'
const BG     = '#F8FAFC'

export function PanelReportes({ usuario, onVolver, onCerrarSesion, sinHeader }) {
  const [graduados, setGraduados] = useState([])
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [pestanaActiva, setPestanaActiva] = useState('general') // 'general', 'graduados', 'invitados'
  const [procesandoId, setProcesandoId] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setCargando(true)
    setError('')
    try {
      const [listaGrad, listaInv] = await Promise.all([
        obtenerGraduados(),
        obtenerInvitados()
      ])
      setGraduados(listaGrad)
      setInvitados(listaInv)
    } catch (err) {
      console.error(err)
      setError('Error al conectar con el servidor para obtener los reportes.')
    } finally {
      setCargando(false)
    }
  }

  // Cálculos de métricas
  const totalGraduados = graduados.length
  const totalInvitados = invitados.length
  
  const graduadosAceptados = graduados.filter(g => g.estado === 'ACEPTADO').length
  const graduadosPendientes = graduados.filter(g => g.estado === 'PENDIENTE').length
  const graduadosRechazados = graduados.filter(g => g.estado_flujo === 'RECHAZADO').length
  const graduadosSinInvitar = graduados.filter(g => g.estado_flujo === 'SIN_INVITAR').length
  
  const invitadosPresentes = invitados.filter(i => i.presente === 1 || i.presente === true).length
  const invitadosAusentes = totalInvitados - invitadosPresentes

  // Mejor promedio
  const promediosValidos = graduados.map(g => parseFloat(g.promedio)).filter(p => !isNaN(p) && p > 0)
  const maxPromedio = promediosValidos.length > 0 ? Math.max(...promediosValidos) : 0

  // Asignación de butacas
  const graduadosConAsiento = graduados.filter(g => g.fila_anfiteatro && g.columna_anfiteatro).length
  const invitadosConAsiento = invitados.filter(i => i.fila_anfiteatro && i.columna_anfiteatro).length

  // Porcentajes
  const porcentajeAsistencia = totalInvitados > 0 ? Math.round((invitadosPresentes / totalInvitados) * 100) : 0
  const porcentajeAceptacion = totalGraduados > 0 ? Math.round((graduadosAceptados / totalGraduados) * 100) : 0
  const porcentajeAsientosGrad = totalGraduados > 0 ? Math.round((graduadosConAsiento / totalGraduados) * 100) : 0

  // Manejar acreditación manual de invitados
  async function manejarAcreditacionManual(invitadoId, estaPresente) {
    if (estaPresente) return // Ya está presente
    setProcesandoId(invitadoId)
    try {
      await marcarPresente(invitadoId)
      // Recargar datos localmente sin spinner pesado
      const listaInv = await obtenerInvitados()
      setInvitados(listaInv)
    } catch (err) {
      alert(err.message || 'No se pudo registrar la asistencia.')
    } finally {
      setProcesandoId(null)
    }
  }

  // Filtros de búsqueda
  const graduadosFiltrados = graduados.filter(g => 
    g.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    g.dni?.includes(busqueda) ||
    g.carrera?.toLowerCase().includes(busqueda.toLowerCase()) ||
    g.legajo?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const invitadosFiltrados = invitados.filter(i => {
    const coincideBusqueda = i.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      i.dni?.includes(busqueda) ||
      i.tipo?.toLowerCase().includes(busqueda.toLowerCase())
      
    // Encontrar nombre de graduado relacionado
    const gradRelacionado = graduados.find(g => g.id === i.egresadoId || g.id === i.egresado_id)
    const coincideGraduado = gradRelacionado ? gradRelacionado.nombre?.toLowerCase().includes(busqueda.toLowerCase()) : false
    
    return coincideBusqueda || coincideGraduado
  })

  // Funciones de exportación
  function exportarGraduadosCSV() {
    if (graduados.length === 0) return
    const headers = ['ID', 'Nombre', 'DNI', 'Legajo', 'Carrera', 'Estado Flujo', 'Aceptó Invitación', 'Fila Asiento', 'Columna Asiento', 'Promedio']
    const rows = graduados.map(g => [
      g.id,
      `"${g.nombre}"`,
      g.dni,
      g.legajo,
      `"${g.carrera}"`,
      g.estado_flujo,
      g.estado,
      g.fila_anfiteatro || 'No asignada',
      g.columna_anfiteatro || 'No asignada',
      g.promedio || '—'
    ])
    
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
      
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'padron_graduados_sigic.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function exportarInvitadosCSV() {
    if (invitados.length === 0) return
    const headers = ['ID', 'Nombre', 'DNI', 'Tipo', 'Graduado Relacionado', 'Presente', 'Fila Asiento', 'Columna Asiento']
    const rows = invitados.map(i => {
      const grad = graduados.find(g => g.id === i.egresadoId || g.id === i.egresado_id)
      return [
        i.id,
        `"${i.nombre}"`,
        i.dni || '—',
        i.tipo || 'Acompañante',
        `"${grad ? grad.nombre : 'Desconocido'}"`,
        i.presente ? 'SI' : 'NO',
        i.fila_anfiteatro || 'No asignada',
        i.columna_anfiteatro || 'No asignada'
      ]
    })
    
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
      
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'asistencia_invitados_sigic.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={`${sinHeader ? '' : 'min-h-screen'} flex flex-col`} style={{ background: BG }}>
      {!sinHeader && (
        <HeaderGlobal 
          titulo="Reportes y Estadísticas"
          subtitulo="Auditoría General de Ceremonias"
          usuario={usuario}
          onVolver={onVolver}
          onCerrarSesion={onCerrarSesion}
        />
      )}

      <main className={`flex-1 mx-auto w-full ${sinHeader ? 'p-0 py-4 max-w-7xl' : 'px-5 py-8 max-w-7xl'}`}>
        {/* Banner Encabezado */}
        <section className="mb-8 overflow-hidden rounded-[32px] bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/20 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -ml-32 -mb-32" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                <img src="/logo-oficial.png" alt="Logo SiGIC" className="h-12 w-auto object-contain" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-sky-400 tracking-widest block mb-1">Módulo Analítico</span>
                <h1 className="text-3xl font-black tracking-tight leading-none mb-1">Centro de Informes SiGIC</h1>
                <p className="text-xs text-slate-400 font-semibold">Consolidado en tiempo real para la ceremonia activa.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={cargarDatos}
                className="flex items-center gap-2 px-4 py-3 bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/25 active:scale-95 transition-all"
              >
                <RefreshCw size={12} /> Actualizar Datos
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 p-4 border border-red-100 rounded-2xl mb-6">
            <AlertCircle size={18} className="text-red-500" />
            <span className="text-xs font-bold text-red-700">{error}</span>
          </div>
        )}

        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 select-none">
            <div className="relative w-14 h-14 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border-3 border-t-[#0ea5e9] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
              <div className="absolute inset-1 rounded-full border-3 border-b-indigo-500 border-t-transparent border-r-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
              <img 
                src="/logo-oficial.png" 
                alt="SiGIC" 
                className="h-7 w-auto object-contain animate-pulse z-10 filter drop-shadow-[0_0_6px_rgba(14,165,233,0.5)]" 
              />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Calculando indicadores...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-8">
            
            {/* Columna Lateral de Métricas Rápidas */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Card Asistencia Promedio */}
              <div className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Asistencia Acreditada</span>
                    <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center">
                      <TrendingUp size={16} />
                    </div>
                  </div>
                  <p className="text-4xl font-black text-emerald-500 tabular-nums leading-none tracking-tight">
                    {porcentajeAsistencia}%
                  </p>
                  <p className="text-[11px] text-slate-400 font-bold mt-2">
                    {invitadosPresentes} de {totalInvitados} invitados escaneados.
                  </p>
                </div>
                <div className="mt-4 h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${porcentajeAsistencia}%` }} />
                </div>
              </div>

              {/* Card Confirmación Graduados */}
              <div className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Confirmación Graduados</span>
                    <div className="h-8 w-8 rounded-xl bg-sky-50 border border-sky-100 text-sky-500 flex items-center justify-center">
                      <GraduationCap size={16} />
                    </div>
                  </div>
                  <p className="text-4xl font-black text-sky-500 tabular-nums leading-none tracking-tight">
                    {porcentajeAceptacion}%
                  </p>
                  <p className="text-[11px] text-slate-400 font-bold mt-2">
                    {graduadosAceptados} de {totalGraduados} graduados confirmados.
                  </p>
                </div>
                <div className="mt-4 h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: `${porcentajeAceptacion}%` }} />
                </div>
              </div>

              {/* Card Asignación de Butacas */}
              <div className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Asientos Reservados</span>
                    <div className="h-8 w-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center">
                      <Award size={16} />
                    </div>
                  </div>
                  <p className="text-4xl font-black text-amber-500 tabular-nums leading-none tracking-tight">
                    {porcentajeAsientosGrad}%
                  </p>
                  <p className="text-[11px] text-slate-400 font-bold mt-2">
                    {graduadosConAsiento} egresados con butaca física asignada.
                  </p>
                </div>
                <div className="mt-4 h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${porcentajeAsientosGrad}%` }} />
                </div>
              </div>

            </div>

            {/* Columna Principal: Tabulaciones y Listados */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Barra de Pestanas */}
              <div className="flex border-b border-slate-200">
                <button 
                  onClick={() => { setPestanaActiva('general'); setBusqueda(''); }}
                  className={`px-5 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                    pestanaActiva === 'general' ? 'border-[#0EA5E9] text-[#0EA5E9]' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 size={14} /> Resumen Estadístico
                  </div>
                </button>
                <button 
                  onClick={() => { setPestanaActiva('graduados'); setBusqueda(''); }}
                  className={`px-5 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                    pestanaActiva === 'graduados' ? 'border-[#0EA5E9] text-[#0EA5E9]' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap size={14} /> Reporte Graduados ({totalGraduados})
                  </div>
                </button>
                <button 
                  onClick={() => { setPestanaActiva('invitados'); setBusqueda(''); }}
                  className={`px-5 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                    pestanaActiva === 'invitados' ? 'border-[#0EA5E9] text-[#0EA5E9]' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users size={14} /> Reporte Invitados ({totalInvitados})
                  </div>
                </button>
              </div>

              {/* RENDER PESTANA 1: GENERAL */}
              {pestanaActiva === 'general' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Tarjeta Detalle de Estados */}
                    <div className="bg-white border rounded-3xl p-6 shadow-sm" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
                      <h3 className="font-extrabold text-sm mb-4" style={{ color: DARK }}>Desglose de Graduados</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-400">Total en el padrón</span>
                          <span className="font-black" style={{ color: DARK }}>{totalGraduados}</span>
                        </div>
                        <div className="h-px bg-slate-50" />
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-emerald-500">Confirmados (Aceptados)</span>
                          <span className="font-black text-emerald-600">{graduadosAceptados}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-amber-500">Esperando Respuesta (Pendientes)</span>
                          <span className="font-black text-amber-600">{graduadosPendientes}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-400">Sin invitar aún</span>
                          <span className="font-black" style={{ color: DARK }}>{graduadosSinInvitar}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-red-500">Rechazaron invitación</span>
                          <span className="font-black text-red-600">{graduadosRechazados}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta Detalle de Asistencia */}
                    <div className="bg-white border rounded-3xl p-6 shadow-sm" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
                      <h3 className="font-extrabold text-sm mb-4" style={{ color: DARK }}>Desglose de Invitados</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-400">Total invitados registrados</span>
                          <span className="font-black" style={{ color: DARK }}>{totalInvitados}</span>
                        </div>
                        <div className="h-px bg-slate-50" />
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-emerald-500">Acreditados (Presentes)</span>
                          <span className="font-black text-emerald-600">{invitadosPresentes}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-red-500">Ausentes en puerta</span>
                          <span className="font-black text-red-500">{invitadosAusentes}</span>
                        </div>
                        <div className="h-px bg-slate-50" />
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-amber-500">Butacas físicas asignadas</span>
                          <span className="font-black text-amber-600">{invitadosConAsiento}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Excelencia Académica y Clima del Auditorio */}
                  <div className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6 justify-between" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-250 flex items-center justify-center text-amber-500 shrink-0">
                        <Award size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-sm" style={{ color: DARK }}>Excelencia Académica</h4>
                        <p className="text-xs text-slate-400 font-semibold">El promedio general máximo registrado para esta colación es de <span className="text-amber-500 font-bold">{maxPromedio > 0 ? maxPromedio.toFixed(2) : '—'}</span>.</p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Exportación Rápidas */}
                  <div className="bg-white border rounded-3xl p-6 shadow-sm" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
                    <h3 className="font-extrabold text-sm mb-4" style={{ color: DARK }}>Descargas de Auditoría</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <button 
                        onClick={exportarGraduadosCSV}
                        className="flex items-center justify-center gap-3 px-5 py-4 border rounded-2xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition border-slate-200"
                      >
                        <FileSpreadsheet size={16} className="text-emerald-500" />
                        Exportar Padrón de Graduados (CSV)
                      </button>
                      <button 
                        onClick={exportarInvitadosCSV}
                        className="flex items-center justify-center gap-3 px-5 py-4 border rounded-2xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition border-slate-200"
                      >
                        <FileSpreadsheet size={16} className="text-sky-500" />
                        Exportar Listado de Invitados (CSV)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER PESTANA 2: GRADUADOS */}
              {pestanaActiva === 'graduados' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Buscador de Padrón */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      placeholder="Buscar graduado por nombre, DNI, legajo o carrera..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-medium focus:outline-none focus:border-[#0EA5E9]/50 transition-all shadow-sm"
                    />
                  </div>

                  {/* Tabla de Graduados */}
                  <div className="bg-white border rounded-2xl overflow-hidden shadow-sm" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-slate-50 font-bold border-b uppercase text-[8.5px] tracking-wider" style={{ borderBottomColor: '#f1f5f9', color: '#78909c' }}>
                            <th className="p-4 pl-6">ID</th>
                            <th className="p-4">Nombre</th>
                            <th className="p-4">Carrera</th>
                            <th className="p-4">DNI / Legajo</th>
                            <th className="p-4 text-center">Estado Flujo</th>
                            <th className="p-4 text-center">Butaca</th>
                            <th className="p-4 pr-6 text-right">Promedio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {graduadosFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                                No se encontraron registros coincidentes
                              </td>
                            </tr>
                          ) : (
                            graduadosFiltrados.map((g, idx) => {
                              let badgeColor = 'bg-slate-100 text-slate-700'
                              if (g.estado_flujo === 'COMPLETO') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 border'
                              else if (g.estado_flujo === 'PENDIENTE') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200 border'
                              else if (g.estado_flujo === 'RECHAZADO') badgeColor = 'bg-red-50 text-red-700 border-red-200 border'
                              else if (g.estado_flujo === 'CARGA_INCOMPLETA') badgeColor = 'bg-orange-50 text-orange-700 border-orange-200 border'

                              return (
                                <tr key={g.id} className="hover:bg-slate-50/50 transition-all">
                                  <td className="p-4 pl-6 font-mono text-slate-400">{idx + 1}.</td>
                                  <td className="p-4 font-bold" style={{ color: DARK }}>{g.nombre}</td>
                                  <td className="p-4 text-slate-500 font-semibold">{g.carrera}</td>
                                  <td className="p-4 font-mono text-slate-500">DNI: {g.dni} <span className="block text-[9px] text-slate-350">L: {g.legajo}</span></td>
                                  <td className="p-4 text-center">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${badgeColor}`}>
                                      {g.estado_flujo}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center font-mono text-slate-600 font-bold">
                                    {g.fila_anfiteatro && g.columna_anfiteatro ? `${g.fila_anfiteatro}-${g.columna_anfiteatro}` : '—'}
                                  </td>
                                  <td className="p-4 pr-6 text-right font-bold text-slate-700">{g.promedio || '—'}</td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* RENDER PESTANA 3: INVITADOS */}
              {pestanaActiva === 'invitados' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Buscador de Invitados */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      placeholder="Buscar invitado por nombre, DNI o graduado asociado..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-medium focus:outline-none focus:border-[#0EA5E9]/50 transition-all shadow-sm"
                    />
                  </div>

                  {/* Tabla de Invitados */}
                  <div className="bg-white border rounded-2xl overflow-hidden shadow-sm" style={{ borderColor: 'rgba(16,185,129,0.1)' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-slate-50 font-bold border-b uppercase text-[8.5px] tracking-wider" style={{ borderBottomColor: '#f1f5f9', color: '#78909c' }}>
                            <th className="p-4 pl-6">ID</th>
                            <th className="p-4">Nombre / DNI</th>
                            <th className="p-4">Graduado Relacionado</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4 text-center">Butaca</th>
                            <th className="p-4 text-center">Acreditado (Presente)</th>
                            <th className="p-4 pr-6 text-right">Acción Manual</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {invitadosFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                                No se encontraron registros coincidentes
                              </td>
                            </tr>
                          ) : (
                            invitadosFiltrados.map((i, idx) => {
                              const grad = graduados.find(g => g.id === i.egresadoId || g.id === i.egresado_id)
                              const esPresente = i.presente === 1 || i.presente === true

                              return (
                                <tr key={i.id} className="hover:bg-slate-50/50 transition-all">
                                  <td className="p-4 pl-6 font-mono text-slate-400">{idx + 1}.</td>
                                  <td className="p-4 font-bold" style={{ color: DARK }}>
                                    {i.nombre}
                                    <span className="block text-[9px] font-mono text-slate-400">DNI: {i.dni || 'No provisto'}</span>
                                  </td>
                                  <td className="p-4 text-slate-500 font-semibold">{grad ? grad.nombre : '—'}</td>
                                  <td className="p-4 text-slate-400 font-bold uppercase text-[9px]">{i.tipo || 'Acompañante'}</td>
                                  <td className="p-4 text-center font-mono text-slate-600 font-bold">
                                    {i.fila_anfiteatro && i.columna_anfiteatro ? `${i.fila_anfiteatro}-${i.columna_anfiteatro}` : '—'}
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${
                                      esPresente 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                        : 'bg-yellow-50 text-yellow-700 border-yellow-250 shadow-sm'
                                    }`}>
                                      {esPresente ? <CheckSquare size={10} /> : <Square size={10} />}
                                      {esPresente ? 'PRESENTE' : 'AUSENTE'}
                                    </span>
                                  </td>
                                  <td className="p-4 pr-6 text-right">
                                    <button 
                                      onClick={() => manejarAcreditacionManual(i.id, esPresente)}
                                      disabled={esPresente || procesandoId === i.id}
                                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition ${
                                        esPresente 
                                          ? 'bg-slate-50 text-slate-350 cursor-default border border-transparent' 
                                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-transparent active:scale-95'
                                      }`}
                                    >
                                      {procesandoId === i.id ? 'Marcando...' : esPresente ? 'Listo' : 'Acreditar'}
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
                </div>
              )}

            </div>

          </div>
        )}

      </main>
      
      <style>{`
        .orbe {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
        }
        .orbe-1 {
          width: 500px; height: 500px;
          background: ${ACCENT}0a;
          top: -150px; left: -100px;
          animation: orbitar1 20s ease-in-out infinite;
        }
        .orbe-2 {
          width: 350px; height: 350px;
          background: rgba(99, 102, 241, 0.03);
          bottom: -80px; right: -50px;
          animation: orbitar2 22s ease-in-out infinite;
        }
        .orbe-3 {
          width: 250px; height: 250px;
          background: rgba(236, 72, 153, 0.02);
          top: 40%; left: 50%;
          animation: orbitar3 18s ease-in-out infinite;
        }
        @keyframes orbitar1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 60px) scale(1.05); }
        }
        @keyframes orbitar2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -40px) scale(0.95); }
        }
        @keyframes orbitar3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 20px); }
        }
      `}</style>
    </div>
  )
}
