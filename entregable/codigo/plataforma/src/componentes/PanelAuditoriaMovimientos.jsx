import React, { useState, useEffect, useMemo } from 'react'
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Download,
  ShieldCheck,
  ShieldAlert,
  Clock,
  User,
  Globe,
  Database,
  Key,
  LogIn,
  Users,
  QrCode,
  FileSpreadsheet,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Hash,
  CheckCircle2,
} from 'lucide-react'
import { obtenerRegistrosAuditoria, obtenerIntegridadAuditoriaYAlertas } from '../servicios/api'

const FILTROS_ACCION = [
  { id: 'TODAS', label: 'Todas las acciones' },
  { id: 'LOGIN', label: 'Inicios de Sesión (Auth)' },
  { id: 'IMPORTAR_EXCEL', label: 'Importación Excel' },
  { id: 'ASIGNAR_ASIENTO', label: 'Asignación Butacas' },
  { id: 'ENVIAR_INVITACIONES', label: 'Despacho Credenciales' },
  { id: 'INGRESAR_INVITADO', label: 'Acreditación Portería' },
  { id: 'ACTIVAR_BLOQUEO_SEGURIDAD', label: 'Ciberseguridad & Bloqueo' },
  { id: 'CREAR_CEREMONIA', label: 'Gestión Ceremonias' },
]

const FILTROS_ENTIDAD = [
  { id: 'TODAS', label: 'Todas las entidades' },
  { id: 'autenticacion', label: 'Autenticación' },
  { id: 'egresados', label: 'Egresados' },
  { id: 'invitados', label: 'Invitados / Portería' },
  { id: 'butacas', label: 'Butacas / Anfiteatro' },
  { id: 'ceremonias', label: 'Ceremonias' },
  { id: 'seguridad_licencia', label: 'Seguridad & Licencia' },
  { id: 'sistema', label: 'Sistema' },
]

export function PanelAuditoriaMovimientos({ acento = '#0ea5e9' }) {
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('TODAS')
  const [filtroEntidad, setFiltroEntidad] = useState('TODAS')
  const [filaExpandida, setFilaExpandida] = useState(null)
  const [integridad, setIntegridad] = useState(null)
  const [autoActualizar, setAutoActualizar] = useState(true)

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError(null)
      const [resAuditoria, resIntegridad] = await Promise.all([
        obtenerRegistrosAuditoria({
          entidad: filtroEntidad !== 'TODAS' ? filtroEntidad : undefined,
          accion: filtroAccion !== 'TODAS' ? filtroAccion : undefined,
          limite: 200,
        }),
        obtenerIntegridadAuditoriaYAlertas().catch(() => null),
      ])

      setRegistros(Array.isArray(resAuditoria) ? resAuditoria : [])
      if (resIntegridad?.cadenaAuditoria) {
        setIntegridad(resIntegridad.cadenaAuditoria)
      }
    } catch (err) {
      setError(err?.message || 'No se pudieron recuperar los eventos de auditoría.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [filtroAccion, filtroEntidad])

  useEffect(() => {
    if (!autoActualizar) return
    const intervalo = setInterval(() => {
      cargarDatos()
    }, 15000)
    return () => clearInterval(intervalo)
  }, [autoActualizar, filtroAccion, filtroEntidad])

  // Filtrado reactivo en cliente (búsqueda de texto)
  const registrosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return registros
    const q = busqueda.toLowerCase().trim()
    return registros.filter((r) => {
      const correo = String(r.usuario_correo || '').toLowerCase()
      const accion = String(r.accion || '').toLowerCase()
      const entidad = String(r.entidad || '').toLowerCase()
      const entidadId = String(r.entidad_id || '').toLowerCase()
      const ip = String(r.ip || '').toLowerCase()
      const detalles = typeof r.detalles === 'object' ? JSON.stringify(r.detalles).toLowerCase() : String(r.detalles || '').toLowerCase()
      return (
        correo.includes(q) ||
        accion.includes(q) ||
        entidad.includes(q) ||
        entidadId.includes(q) ||
        ip.includes(q) ||
        detalles.includes(q)
      )
    })
  }, [registros, busqueda])

  const exportarCSV = () => {
    if (registrosFiltrados.length === 0) return
    const encabezados = ['ID', 'Fecha_Hora', 'Usuario_Operador', 'Rol', 'Accion', 'Entidad', 'Entidad_ID', 'IP', 'Hash_Integridad', 'Detalles_JSON']
    const filas = registrosFiltrados.map((r) => [
      `"${r.id || ''}"`,
      `"${r.creado_en || ''}"`,
      `"${r.usuario_correo || 'Anónimo/Sistema'}"`,
      `"${r.rol || '-'}"`,
      `"${r.accion || ''}"`,
      `"${r.entidad || ''}"`,
      `"${r.entidad_id || ''}"`,
      `"${r.ip || ''}"`,
      `"${r.hash_integridad || ''}"`,
      `"${(typeof r.detalles === 'object' ? JSON.stringify(r.detalles) : (r.detalles || '')).replace(/"/g, '""')}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [encabezados.join(','), ...filas.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `auditoria_sigic_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderBadgeAccion = (accion) => {
    const acc = String(accion).toUpperCase()
    if (acc.includes('LOGIN') || acc.includes('AUTORIZAR')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
          <LogIn size={11} /> {accion}
        </span>
      )
    }
    if (acc.includes('SEGURIDAD') || acc.includes('BLOQUEO') || acc.includes('REVOCAR')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle size={11} /> {accion}
        </span>
      )
    }
    if (acc.includes('IMPORTAR') || acc.includes('EXCEL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <FileSpreadsheet size={11} /> {accion}
        </span>
      )
    }
    if (acc.includes('INGRESO') || acc.includes('PORTERIA') || acc.includes('CREDENTIAL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <QrCode size={11} /> {accion}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
        <Activity size={11} /> {accion}
      </span>
    )
  }

  return (
    <div className="space-y-4 font-sans animate-in fade-in duration-150">
      {/* Barra superior de custodia e indicadores criptográficos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cadena SHA-256</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-800">
                {integridad?.integra !== false ? 'Eslabones Verificados' : 'Cadena Alterada'}
              </span>
              {integridad?.integra !== false ? (
                <ShieldCheck size={14} className="text-emerald-600" />
              ) : (
                <ShieldAlert size={14} className="text-rose-600" />
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Total analizados: <strong className="text-slate-700">{integridad?.totalAnalizados ?? registros.length}</strong>
            </p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-mono font-bold text-xs">
            256b
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Eventos en Registro</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-800">{registrosFiltrados.length}</span>
              <span className="text-[10px] text-slate-400 font-bold">de {registros.length}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Registrados inmutablemente en PostgreSQL</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
            <Activity size={18} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Monitoreo en Vivo</span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-700">
                {autoActualizar ? 'Actualización cada 15s' : 'En pausa'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Exclusivo: Julián Cancelo</p>
          </div>
          <button
            type="button"
            onClick={() => setAutoActualizar(!autoActualizar)}
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            {autoActualizar ? 'Pausar' : 'Reanudar'}
          </button>
        </div>
      </div>

      {/* Barra de Filtros, Búsqueda y Exportación */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por usuario, IP, DNI, acción o detalles JSON..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:bg-white outline-none cursor-pointer"
            >
              {FILTROS_ACCION.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>

            <select
              value={filtroEntidad}
              onChange={(e) => setFiltroEntidad(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:bg-white outline-none cursor-pointer"
            >
              {FILTROS_ENTIDAD.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={cargarDatos}
              disabled={cargando}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              title="Refrescar auditoría"
            >
              <RefreshCw size={12} className={cargando ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>

            <button
              type="button"
              onClick={exportarCSV}
              disabled={registrosFiltrados.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
              title="Descargar reporte en formato CSV"
            >
              <Download size={12} />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {cargando && registros.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <RefreshCw size={24} className="animate-spin text-sky-500 mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Cargando bitácora de auditoría inmutable...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2">
            <AlertTriangle size={24} className="text-rose-500 mx-auto" />
            <p className="text-xs text-rose-600 font-bold">{error}</p>
            <button
              type="button"
              onClick={cargarDatos}
              className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="p-10 text-center space-y-1">
            <Activity size={24} className="text-slate-300 mx-auto" />
            <p className="text-xs text-slate-600 font-bold">No se encontraron movimientos con los filtros aplicados</p>
            <p className="text-[11px] text-slate-400">Probá modificando el criterio de búsqueda o seleccionando todas las acciones.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10.5px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-3.5 w-8"></th>
                  <th className="py-3 px-3">Fecha y Hora</th>
                  <th className="py-3 px-3">Operador / Usuario</th>
                  <th className="py-3 px-3">Acción</th>
                  <th className="py-3 px-3">Entidad</th>
                  <th className="py-3 px-3">IP / Origen</th>
                  <th className="py-3 px-3 text-right">Cadena SHA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {registrosFiltrados.map((r) => {
                  const expandido = filaExpandida === r.id
                  const fecha = new Date(r.creado_en)
                  const fechaStr = isNaN(fecha.getTime())
                    ? String(r.creado_en || '-')
                    : fecha.toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })

                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        onClick={() => setFilaExpandida(expandido ? null : r.id)}
                        className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                          expandido ? 'bg-sky-50/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3.5 text-slate-400">
                          {expandido ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {fechaStr}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 leading-tight">
                              {r.usuario_correo || 'Sistema / Tarea'}
                            </span>
                            {r.rol && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {r.rol}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">{renderBadgeAccion(r.accion)}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[11px] text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                            {r.entidad}
                            {r.entidad_id ? ` #${r.entidad_id}` : ''}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {r.ip || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {r.hash_integridad ? (
                            <span
                              className="font-mono text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.5 rounded font-bold"
                              title={`SHA-256: ${r.hash_integridad}`}
                            >
                              {r.hash_integridad.slice(0, 8)}…
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-mono">legacy</span>
                          )}
                        </td>
                      </tr>

                      {/* Detalles desplegables en acordeón */}
                      {expandido && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={7} className="p-4 space-y-2 border-t border-slate-200/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                  <Hash size={11} /> Identificador y Eslabón Criptográfico
                                </span>
                                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] font-mono space-y-1">
                                  <div>
                                    <span className="text-slate-400">UUID: </span>
                                    <span className="text-slate-800 font-bold">{r.id}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Hash Previo: </span>
                                    <span className="text-slate-600">{r.hash_previo || 'GENESIS'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Hash Integridad: </span>
                                    <span className="text-emerald-700 font-bold">{r.hash_integridad || 'Sin hash'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                  <Database size={11} /> Carga de Datos (Detalles JSON)
                                </span>
                                <pre className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 max-h-40 overflow-auto whitespace-pre-wrap">
                                  {r.detalles
                                    ? typeof r.detalles === 'object'
                                      ? JSON.stringify(r.detalles, null, 2)
                                      : r.detalles
                                    : 'Sin datos adicionales registrados'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pie informativo */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-2">
        <span>Sistema de Auditoría Forense · SiGIC</span>
        <span>Tecnicatura Superior en Analista de Sistemas</span>
      </div>
    </div>
  )
}
