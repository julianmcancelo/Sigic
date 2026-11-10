import React, { useState, useEffect, useMemo } from 'react'
import {
  Activity,
  Search,
  RefreshCw,
  Download,
  ShieldCheck,
  ShieldAlert,
  Clock,
  User,
  Globe,
  Database,
  Hash,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  LogIn,
  LogOut,
  FileSpreadsheet,
  QrCode,
  AlertTriangle,
  Lock,
  Calendar,
  Sparkles,
  Terminal,
  Layers,
  ListFilter,
  Eye,
  SlidersHorizontal,
  Server,
  KeyRound,
  UserCheck,
  Armchair,
  MailCheck,
  Send,
  HelpCircle,
  ExternalLink,
  Minimize2,
  Maximize2,
  X,
} from 'lucide-react'
import { obtenerRegistrosAuditoria, obtenerIntegridadAuditoriaYAlertas } from '../servicios/api'

// Filtros predefinidos para acciones y entidades
const FILTROS_ACCION = [
  { id: 'TODAS', label: 'Todas las acciones' },
  { id: 'REINICIO_SISTEMA_FORMATEO', label: 'Formateo / Reinicio de Sistema' },
  { id: 'INICIALIZAR_SISTEMA_SETUP', label: 'Inicialización Asistente Setup' },
  { id: 'CREAR_EGRESADO', label: 'Alta Individual de Egresado' },
  { id: 'IMPORTAR_EXCEL', label: 'Importación Masiva (Excel)' },
  { id: 'ACTUALIZAR_DATOS_EGRESADO', label: 'Edición de Egresado' },
  { id: 'ELIMINAR_EGRESADO', label: 'Baja de Egresado' },
  { id: 'REGISTRAR_INVITADOS', label: 'Registro de Acompañantes' },
  { id: 'ASIGNAR_ASIENTO', label: 'Asignación Butacas' },
  { id: 'ENVIAR_INVITACIONES', label: 'Despacho de Credenciales' },
  { id: 'INGRESAR_INVITADO', label: 'Acreditación Portería' },
  { id: 'LOGIN', label: 'Inicios de Sesión (Auth)' },
  { id: 'CREAR_USUARIO', label: 'Gestión de Operadores / Cuentas' },
  { id: 'PROFESORES', label: 'Docentes / Cuerpo Académico' },
  { id: 'ENTREGADORES', label: 'Entregadores de Título' },
  { id: 'ACTIVAR_BLOQUEO_SEGURIDAD', label: 'Ciberseguridad & Bloqueo' },
  { id: 'CREAR_CEREMONIA', label: 'Gestión Ceremonias' },
  { id: 'MODIFICAR_CONFIGURACION_SISTEMA', label: 'Configuración de Sistema' },
]

const FILTROS_ENTIDAD = [
  { id: 'TODAS', label: 'Todas las entidades' },
  { id: 'autenticacion', label: 'Autenticación & Sesiones' },
  { id: 'usuarios_sistema', label: 'Cuentas & Usuarios' },
  { id: 'egresados', label: 'Egresados' },
  { id: 'invitados', label: 'Invitados / Portería' },
  { id: 'butacas', label: 'Butacas / Anfiteatro' },
  { id: 'ceremonias', label: 'Ceremonias' },
  { id: 'profesores', label: 'Docentes' },
  { id: 'entregadores', label: 'Entregadores' },
  { id: 'seguridad_licencia', label: 'Seguridad & Licencia' },
  { id: 'sistema', label: 'Sistema & Ajustes' },
]

/**
 * Helper de traducción a lenguaje natural en español (Modo Resumen Inteligente)
 */
export function generarNarrativaHumana(accion, entidad, detalles = {}, r = {}) {
  const acc = String(accion || '').toUpperCase()
  const ent = String(entidad || '').toLowerCase()
  const det = typeof detalles === 'object' && detalles !== null ? detalles : {}
  const usuario = r.usuario_correo ? String(r.usuario_correo).split('@')[0] : 'Operador'

  // Auth / Sesión
  if (acc.includes('LOGIN') || acc.includes('INICIO_SESION')) {
    if (det.metodo === 'otp' || det.otp) return `Inicio de sesión verificado vía código OTP para ${r.usuario_correo || 'egresado'}`
    if (det.bypass) return `Acceso de demostración otorgado con credencial bypass`
    if (acc.includes('FALLIDO') || det.error) return `Intento fallido de autenticación administrativa`
    return `Inicio de sesión administrativo exitoso en SiGIC`
  }

  if (acc.includes('LOGOUT') || acc.includes('CIERRE_SESION')) {
    return `Cierre de sesión seguro y revocación de token temporal`
  }

  // Importación Excel
  if (acc.includes('IMPORTAR') || acc.includes('EXCEL') || (ent === 'egresados' && acc.includes('MASIV'))) {
    const total = det.totalImportados ?? det.total ?? det.cantidad ?? det.procesados ?? null
    if (total !== null) {
      return `Se importaron masivamente ${total} egresados al padrón oficial`
    }
    return `Importación de nómina de egresados procesada mediante planilla Excel`
  }

  // Usuarios y Operadores
  if (ent === 'usuarios' || ent === 'usuarios_sistema' || acc.includes('USUARIO')) {
    const correoUser = det.email || det.correo || (r.entidad_id ? `Usuario #${r.entidad_id}` : '')
    if (acc.includes('CREAR')) return `Alta de nuevo usuario del sistema: ${correoUser} (${det.rol || 'OPERADOR'})`
    if (acc.includes('ROL')) return `Cambio de permisos/rol asignado a ${correoUser} -> ${det.nuevoRol || ''}`
    if (acc.includes('ESTADO') || acc.includes('SUSPENDER') || acc.includes('ACTIVAR')) {
      return `Modificación de estado operativo de ${correoUser} -> ${det.activo ? 'Activo' : 'Suspendido'}`
    }
    if (acc.includes('ELIMINAR')) return `Baja definitiva de cuenta de usuario: ${correoUser}`
  }

  // Profesores / Docentes
  if (ent === 'profesores' || acc.includes('PROFESOR') || acc.includes('DOCENTE')) {
    if (acc.includes('IMPORTAR')) return `Importación de ${det.total || det.agregados || ''} profesores al claustro docente`
    if (acc.includes('CREAR')) return `Alta de docente: ${det.nombre || ''} (${det.materia || 'Cátedra'})`
    if (acc.includes('EDITAR')) return `Modificación de datos del docente #${r.entidad_id || ''}`
    if (acc.includes('DESACTIVAR') || acc.includes('ELIMINAR')) return `Baja lógica de docente del cuerpo académico`
  }

  // Entregadores de Título
  if (ent === 'entregadores' || acc.includes('ENTREGADOR')) {
    if (acc.includes('ASIGNAR')) return `Asignación de persona para entrega de título: ${det.nombrePersona || det.tipo || ''}`
    if (acc.includes('REMOVER')) return `Remoción de persona asignada a entrega de diploma`
  }

  // Asignación de Butacas / Anfiteatro
  if (acc.includes('ASIENTO') || acc.includes('BUTACA') || ent === 'butacas' || ent === 'configuracion_anfiteatro') {
    if (acc.includes('ESTRUCTURA') || acc.includes('CONFIG_ANFITEATRO')) {
      return `Guardado del plano interactivo y distribución del anfiteatro (${det.totalFilas ?? det.filas ?? ''} filas)`
    }
    if (acc.includes('SOLICITAR_ASIENTOS')) {
      return `Selección de butacas realizada por el graduado ${usuario}`
    }
    if (acc.includes('CONFIRMAR_ASIENTOS')) {
      return `Confirmación y asignación de butacas emitida por administración`
    }
    const fila = det.fila ?? det.fila_nombre ?? det.row ?? null
    const numero = det.numero ?? det.asiento ?? det.columna ?? null
    const graduado = det.graduadoNombre || det.egresado || det.alumno || null
    if (fila && numero) {
      return `Asignación de butaca fila ${fila} asiento ${numero}${graduado ? ` a ${graduado}` : ''}`
    }
    if (acc.includes('LIBERAR') || acc.includes('DESASIGNAR')) {
      return `Liberación de butaca reservada en anfiteatro principal`
    }
    return `Actualización del mapa interactivo de butacas y aforo`
  }

  // Despacho de Invitaciones / Emails
  if (acc.includes('INVITACION') || acc.includes('EMAIL') || acc.includes('CORREO') || acc.includes('NOTIFICACION')) {
    const cant = det.enviados ?? det.total ?? det.destinatarios ?? null
    if (cant !== null) {
      return `Despacho masivo completado: ${cant} invitaciones digitales enviadas por email`
    }
    return `Envío de credenciales digitales y accesos seguros por correo electrónico`
  }

  // Acreditación de Ingreso / Portería
  if (acc.includes('INGRESO') || acc.includes('ACREDIT') || acc.includes('PORTERIA') || acc.includes('CHECKIN')) {
    const nombre = det.invitadoNombre ?? det.nombre ?? det.egresadoNombre ?? null
    const tipo = det.tipo === 'egresado' ? 'egresado' : 'invitado'
    if (nombre) {
      return `Acreditación de ingreso de ${tipo} validada: ${nombre}`
    }
    return `Acreditación y validación de credencial QR en portería`
  }

  // Ciberseguridad / Bloqueos / Ed25519
  if (acc.includes('BLOQUEO') || acc.includes('SECURITY') || acc.includes('INCIDENTE') || ent === 'seguridad_licencia') {
    if (acc.includes('ACTIVAR_BLOQUEO')) {
      return `Bloqueo preventivo de seguridad activado por sospecha o comando de control`
    }
    if (acc.includes('DESACTIVAR_BLOQUEO')) {
      return `Desbloqueo de seguridad aplicado y normalización del servicio`
    }
    if (acc.includes('SERIAL') || acc.includes('LICENCIA')) {
      return `Activación de licencia criptográfica Ed25519 registrada`
    }
    return `Evento crítico de seguridad auditado en la infraestructura`
  }

  // Ceremonias
  if (ent === 'ceremonias' || acc.includes('CEREMONIA')) {
    const nombreCeremonia = det.nombre || det.titulo || (r.entidad_id ? `Ceremonia #${r.entidad_id}` : null)
    if (acc.includes('CREAR')) return `Creación de nueva ceremonia de colación: ${nombreCeremonia || 'Acto oficial'}`
    if (acc.includes('ACTIVAR')) return `Ceremonia marcada como activa para gestión y acreditaciones`
    if (acc.includes('EDITAR') || acc.includes('MODIFICAR')) return `Modificación de parámetros y fecha de ceremonia: ${nombreCeremonia || ''}`
    return `Operación registrada sobre la ceremonia de graduación`
  }

  // Configuración / Sistema / Reinicio y Formateo
  if (ent === 'sistema' || ent === 'configuracion' || ent === 'configuracion_sistema' || acc.includes('CONFIG') || acc.includes('AJUSTE') || acc.includes('REINICIO') || acc.includes('FORMATEO') || acc.includes('RESET')) {
    if (acc.includes('REINICIO') || acc.includes('FORMATEO') || acc.includes('RESET')) {
      const tablas = Array.isArray(det.tablasLimpiadas) ? det.tablasLimpiadas.length : null
      return `Reinicio y formateo general del sistema ejecutado${tablas ? ` (${tablas} tablas depuradas)` : ''}. Cadena de auditoría preservada.`
    }
    const clave = det.clave || det.parametro || det.key || null
    if (clave) return `Parámetro de sistema modificado: '${clave}' (nuevo valor: ${det.nuevoValor ?? '-'})`
    return `Ajuste global de configuración actualizado por ${usuario}`
  }

  // Padrón de Egresados genérico
  if (ent === 'egresados') {
    if (acc.includes('CREAR_EGRESADO') || acc.includes('ALTA')) {
      const nombre = det.nombre || (r.entidad_id ? `Egresado #${r.entidad_id}` : 'Nuevo graduado')
      return `Alta individual de egresado registrada: ${nombre}${det.dni ? ` (DNI ${det.dni})` : ''}`
    }
    if (acc.includes('ACTUALIZAR_DATOS') || acc.includes('EDITAR')) {
      return `Modificación de legajo/datos personales de egresado #${r.entidad_id || ''}`
    }
    if (acc.includes('ELIMINAR_EGRESADO') || acc.includes('BAJA')) {
      return `Eliminación de egresado del padrón: ${det.nombre || `#${r.entidad_id || ''}`}`
    }
    if (acc.includes('VACIAR')) {
      return `Vaciado masivo de egresados de la ceremonia activa`
    }
    if (acc.includes('ESTADO')) return `Cambio de estado administrativo del egresado (${det.nuevoEstado || det.estado || 'actualizado'})`
  }

  // Invitados / Acompañantes
  if (ent === 'invitados' || acc.includes('INVITADO')) {
    if (acc.includes('REGISTRAR')) {
      const cant = det.cantidad || (Array.isArray(det.invitados) ? det.invitados.length : null)
      return `Registro de ${cant ? `${cant} acompañante(s)` : 'acompañantes'} para egresado ${det.egresado || `#${r.entidad_id || ''}`}`
    }
    if (acc.includes('ELIMINAR')) return `Baja de invitado/acompañante registrado`
  }

  // Fallback con formato amigable
  const accionLegible = acc.replace(/_/g, ' ').toLowerCase()
  return `${accionLegible.charAt(0).toUpperCase() + accionLegible.slice(1)} sobre ${ent || 'recurso del sistema'}`
}

/**
 * Formatea fechas a formato relativo en español ("hace 5 min", "ayer a las 14:20")
 */
function formatearTiempoRelativo(fechaIso) {
  if (!fechaIso) return { relativo: '-', exacto: '-' }
  const fecha = new Date(fechaIso)
  if (isNaN(fecha.getTime())) return { relativo: String(fechaIso), exacto: String(fechaIso) }

  const ahora = new Date()
  const diffSegundos = Math.floor((ahora.getTime() - fecha.getTime()) / 1000)
  const exacto = fecha.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const iso = fecha.toISOString()

  if (diffSegundos < 5) return { relativo: 'justo ahora', exacto, iso }
  if (diffSegundos < 60) return { relativo: `hace ${diffSegundos} seg`, exacto, iso }

  const diffMinutos = Math.floor(diffSegundos / 60)
  if (diffMinutos < 60) return { relativo: `hace ${diffMinutos} min`, exacto, iso }

  const diffHoras = Math.floor(diffMinutos / 60)
  if (diffHoras < 24) {
    return { relativo: `hace ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`, exacto, iso }
  }

  const diffDias = Math.floor(diffHoras / 24)
  if (diffDias === 1) {
    const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    return { relativo: `ayer a las ${hora}`, exacto, iso }
  }
  if (diffDias < 7) {
    return { relativo: `hace ${diffDias} días`, exacto, iso }
  }

  return {
    relativo: fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
    exacto,
    iso,
  }
}

/**
 * Inspector JSON con resaltado de sintaxis ordenado
 */
function InspectorJson({ datos }) {
  if (!datos || (typeof datos === 'object' && Object.keys(datos).length === 0)) {
    return (
      <div className="text-[11px] font-mono text-slate-400 italic p-3 bg-slate-900/90 rounded-xl border border-slate-800">
        Sin metadatos o parámetros adicionales en este evento
      </div>
    )
  }

  let contenido = ''
  try {
    contenido = typeof datos === 'string' ? JSON.stringify(JSON.parse(datos), null, 2) : JSON.stringify(datos, null, 2)
  } catch {
    contenido = String(datos)
  }

  // Resaltado de sintaxis con regex seguro para JSON
  const renderTokens = (jsonStr) => {
    return jsonStr.split('\n').map((linea, idx) => {
      // Reemplazo de claves, cadenas, números y booleanos
      const formateada = linea
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(
          /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
          (match) => {
            let cls = 'text-sky-300' // número
            if (/^"/.test(match)) {
              if (/:$/.test(match)) {
                cls = 'text-slate-300 font-semibold' // clave
              } else {
                cls = 'text-emerald-300' // cadena
              }
            } else if (/true|false/.test(match)) {
              cls = 'text-purple-300 font-bold' // booleano
            } else if (/null/.test(match)) {
              cls = 'text-rose-400 italic' // null
            }
            return `<span class="${cls}">${match}</span>`
          }
        )

      return (
        <div key={idx} className="table-row leading-relaxed">
          <span className="table-cell pr-3 text-right select-none text-slate-600 text-[10px] font-mono w-6">
            {idx + 1}
          </span>
          <span
            className="table-cell whitespace-pre font-mono text-[11px]"
            dangerouslySetInnerHTML={{ __html: formateada }}
          />
        </div>
      )
    })
  }

  return (
    <div className="bg-slate-950 text-slate-100 rounded-xl p-3 border border-slate-800/80 font-mono text-xs overflow-x-auto shadow-inner max-h-60 overflow-y-auto">
      <div className="table w-full">{renderTokens(contenido)}</div>
    </div>
  )
}

/**
 * Botón con feedback al copiar al portapapeles
 */
function BotonCopiar({ texto, label = 'Copiar', size = 11, className = '' }) {
  const [copiado, setCopiado] = useState(false)

  const manejarCopia = async (e) => {
    e.stopPropagation()
    if (!texto) return
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <button
      type="button"
      onClick={manejarCopia}
      title={`Copiar ${label}`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition cursor-pointer select-none ${
        copiado
          ? 'bg-emerald-500 text-white'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
      } ${className}`}
    >
      {copiado ? <Check size={size} className="stroke-[2.5]" /> : <Copy size={size} />}
      <span>{copiado ? '¡Copiado!' : label}</span>
    </button>
  )
}

/**
 * Componente Principal: PanelAuditoriaMovimientos
 */
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

  // Nuevos controles de UX / IMPECCABLE
  const [modoVisualizacion, setModoVisualizacion] = useState('resumen') // 'resumen' (Humano) | 'forense' (Técnico)
  const [densidad, setDensidad] = useState('comoda') // 'comoda' | 'compacta'
  const [tipoVista, setTipoVista] = useState('tabla') // 'tabla' | 'timeline'

  // Modo Minimalista (Zen / Linear feed)
  const [modoMinimalista, setModoMinimalista] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sigic_auditoria_minimalista') === 'true'
    }
    return false
  })

  // Guardar preferencia de modo minimalista
  const toggleModoMinimalista = (valor) => {
    const nuevoValor = typeof valor === 'boolean' ? valor : !modoMinimalista
    setModoMinimalista(nuevoValor)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sigic_auditoria_minimalista', String(nuevoValor))
    }
  }

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [eventosPorPagina, setEventosPorPagina] = useState(20) // 20 | 50 | 100

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError(null)
      const [resAuditoria, resIntegridad] = await Promise.all([
        obtenerRegistrosAuditoria({
          entidad: filtroEntidad !== 'TODAS' ? filtroEntidad : undefined,
          accion: filtroAccion !== 'TODAS' ? filtroAccion : undefined,
          limite: 300,
        }),
        obtenerIntegridadAuditoriaYAlertas().catch(() => null),
      ])

      setRegistros(Array.isArray(resAuditoria) ? resAuditoria : [])
      if (resIntegridad?.cadenaAuditoria) {
        setIntegridad(resIntegridad.cadenaAuditoria)
      }
    } catch (err) {
      setError(err?.message || 'No se pudieron recuperar los eventos de auditoría inmutable.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
    setPaginaActual(1)
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
      const hash = String(r.hash_integridad || '').toLowerCase()
      const narrativa = generarNarrativaHumana(r.accion, r.entidad, r.detalles, r).toLowerCase()
      const detalles =
        typeof r.detalles === 'object'
          ? JSON.stringify(r.detalles).toLowerCase()
          : String(r.detalles || '').toLowerCase()

      return (
        correo.includes(q) ||
        accion.includes(q) ||
        entidad.includes(q) ||
        entidadId.includes(q) ||
        ip.includes(q) ||
        hash.includes(q) ||
        narrativa.includes(q) ||
        detalles.includes(q)
      )
    })
  }, [registros, busqueda])

  // Reset de página al buscar
  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, eventosPorPagina])

  // Cálculos de Paginación
  const totalPaginas = Math.ceil(registrosFiltrados.length / eventosPorPagina) || 1
  const indiceInicio = (paginaActual - 1) * eventosPorPagina
  const registrosPaginados = useMemo(() => {
    return registrosFiltrados.slice(indiceInicio, indiceInicio + eventosPorPagina)
  }, [registrosFiltrados, indiceInicio, eventosPorPagina])

  // Exportar a CSV limpio con codificación UTF-8 BOM
  const exportarCSV = () => {
    if (registrosFiltrados.length === 0) return
    const encabezados = [
      'ID',
      'Fecha_Hora_ISO',
      'Tiempo_Relativo',
      'Resumen_Humano',
      'Operador_Usuario',
      'Rol',
      'Accion_Codigo',
      'Entidad',
      'Entidad_ID',
      'IP_Origen',
      'Hash_Integridad_SHA256',
      'Hash_Previo',
      'Detalles_JSON',
    ]

    const filas = registrosFiltrados.map((r) => {
      const t = formatearTiempoRelativo(r.creado_en)
      const narrativa = generarNarrativaHumana(r.accion, r.entidad, r.detalles, r)
      const detStr = typeof r.detalles === 'object' ? JSON.stringify(r.detalles) : r.detalles || ''

      return [
        `"${r.id || ''}"`,
        `"${r.creado_en || ''}"`,
        `"${t.relativo || ''}"`,
        `"${narrativa.replace(/"/g, '""')}"`,
        `"${r.usuario_correo || 'Anónimo / Sistema'}"`,
        `"${r.rol || '-'}"`,
        `"${r.accion || ''}"`,
        `"${r.entidad || ''}"`,
        `"${r.entidad_id || ''}"`,
        `"${r.ip || ''}"`,
        `"${r.hash_integridad || ''}"`,
        `"${r.hash_previo || ''}"`,
        `"${detStr.replace(/"/g, '""')}"`,
      ]
    })

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [encabezados.join(','), ...filas.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `auditoria_sigic_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Configuración cromática y de icono por categoría
  const obtenerConfigCategoria = (accion, entidad) => {
    const acc = String(accion || '').toUpperCase()
    const ent = String(entidad || '').toLowerCase()

    // 1. Auth (Azul)
    if (acc.includes('LOGIN') || acc.includes('AUTORIZAR') || acc.includes('SESION') || ent === 'autenticacion') {
      return {
        colorBadge: 'bg-blue-50 text-blue-700 border-blue-200/80',
        colorPunto: 'bg-blue-500 shadow-blue-500/50',
        colorBorde: 'border-blue-400',
        icono: LogIn,
        categoria: 'Autenticación',
      }
    }
    // 2. Seguridad / Bloqueo (Ámbar / Naranja)
    if (acc.includes('SEGURIDAD') || acc.includes('BLOQUEO') || acc.includes('REVOCAR') || ent === 'seguridad_licencia') {
      return {
        colorBadge: 'bg-amber-50 text-amber-800 border-amber-200',
        colorPunto: 'bg-amber-500 shadow-amber-500/50',
        colorBorde: 'border-amber-400',
        icono: AlertTriangle,
        categoria: 'Ciberseguridad',
      }
    }
    // 3. Egresados / Excel (Verde Esmeralda)
    if (acc.includes('IMPORTAR') || acc.includes('EXCEL') || ent === 'egresados') {
      return {
        colorBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        colorPunto: 'bg-emerald-500 shadow-emerald-500/50',
        colorBorde: 'border-emerald-400',
        icono: acc.includes('EXCEL') ? FileSpreadsheet : UserCheck,
        categoria: 'Egresados',
      }
    }
    // 4. Ingreso / Acreditación / Portería (Púrpura / Violeta)
    if (acc.includes('INGRESO') || acc.includes('PORTERIA') || acc.includes('CREDENTIAL') || ent === 'invitados') {
      return {
        colorBadge: 'bg-purple-50 text-purple-700 border-purple-200',
        colorPunto: 'bg-purple-500 shadow-purple-500/50',
        colorBorde: 'border-purple-400',
        icono: QrCode,
        categoria: 'Portería & Acreditación',
      }
    }
    // 5. Butacas / Anfiteatro (Cian / Sky)
    if (acc.includes('ASIENTO') || acc.includes('BUTACA') || ent === 'butacas') {
      return {
        colorBadge: 'bg-sky-50 text-sky-800 border-sky-200',
        colorPunto: 'bg-sky-500 shadow-sky-500/50',
        colorBorde: 'border-sky-400',
        icono: Armchair,
        categoria: 'Anfiteatro',
      }
    }
    // 6. Notificaciones / Emails (Índigo)
    if (acc.includes('INVITACION') || acc.includes('EMAIL') || acc.includes('CORREO')) {
      return {
        colorBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        colorPunto: 'bg-indigo-500 shadow-indigo-500/50',
        colorBorde: 'border-indigo-400',
        icono: MailCheck,
        categoria: 'Comunicaciones',
      }
    }
    // 7. Ceremonias (Fucsia / Rose)
    if (ent === 'ceremonias' || acc.includes('CEREMONIA')) {
      return {
        colorBadge: 'bg-rose-50 text-rose-700 border-rose-200',
        colorPunto: 'bg-rose-500 shadow-rose-500/50',
        colorBorde: 'border-rose-400',
        icono: Calendar,
        categoria: 'Ceremonias',
      }
    }
    // 8. Sistema / Ajustes (Slate)
    return {
      colorBadge: 'bg-slate-100 text-slate-700 border-slate-200',
      colorPunto: 'bg-slate-500 shadow-slate-500/50',
      colorBorde: 'border-slate-400',
      icono: Activity,
      categoria: 'Sistema',
    }
  }

  const renderBadgeAccion = (accion, entidad) => {
    const config = obtenerConfigCategoria(accion, entidad)
    const Icono = config.icono
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${config.colorBadge} transition-all`}
      >
        <Icono size={12} className="shrink-0" />
        <span className="truncate max-w-[150px]">{accion}</span>
      </span>
    )
  }

  return (
    <div className="space-y-4 font-sans text-slate-800 animate-in fade-in duration-150">
      {/* ======================================================== */}
      {/* 1. MODO MINIMALISTA (ZEN / LINEAR FEED)                  */}
      {/* ======================================================== */}
      {modoMinimalista ? (
        <div className="space-y-3">
          {/* Header Minimalista: Micro-Pill de Integridad + Controles limpios */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
            {/* Micro-Pill sutil de Estado */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium text-[11px]">
                <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  {integridad?.integra !== false ? 'Cadena íntegra SHA-256' : 'Alerta de integridad'}
                </span>
                <span className="text-emerald-400">·</span>
                <span>{registrosFiltrados.length} eventos</span>
                <span className="text-emerald-400">·</span>
                <span className="inline-flex items-center gap-1">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      autoActualizar ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  {autoActualizar ? 'en vivo' : 'pausado'}
                </span>
              </div>

              {cargando && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <RefreshCw size={11} className="animate-spin text-sky-500" />
                  Sincronizando...
                </span>
              )}
            </div>

            {/* Acciones de la barra minimalista */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={cargarDatos}
                disabled={cargando}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
                title="Refrescar auditoría"
              >
                <RefreshCw size={14} className={cargando ? 'animate-spin text-sky-500' : ''} />
              </button>

              <button
                type="button"
                onClick={exportarCSV}
                disabled={registrosFiltrados.length === 0}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
                title="Descargar reporte forense CSV"
              >
                <Download size={14} />
              </button>

              <div className="h-4 w-px bg-slate-200" />

              {/* Botón para volver a vista Forense Completa */}
              <button
                type="button"
                onClick={() => toggleModoMinimalista(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer active:scale-95 shadow-2xs"
                title="Cambiar a la vista analítica detallada con tablas, métricas y timeline"
              >
                <Maximize2 size={12} className="text-slate-600" />
                <span>Vista Forense Completa</span>
              </button>
            </div>
          </div>

          {/* Barra de Filtros Minimalista: Search bar fluida + Select discreto de acción */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Filtrar movimientos (ej: egresado, IP, login, butaca, #hash)..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 shadow-2xs transition"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer hover:border-slate-300 shadow-2xs transition max-w-[200px] truncate"
            >
              {FILTROS_ACCION.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Feed Minimalista estilo Linear / GitHub Activity */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {cargando && registros.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <RefreshCw size={22} className="animate-spin text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Cargando eventos de auditoría...</p>
              </div>
            ) : error ? (
              <div className="py-10 text-center space-y-2">
                <AlertTriangle size={22} className="text-rose-500 mx-auto" />
                <p className="text-xs text-rose-600 font-medium">{error}</p>
                <button
                  type="button"
                  onClick={cargarDatos}
                  className="text-xs font-semibold text-sky-600 hover:underline"
                >
                  Reintentar
                </button>
              </div>
            ) : registrosFiltrados.length === 0 ? (
              <div className="py-14 text-center space-y-1.5">
                <Activity size={24} className="text-slate-300 mx-auto" />
                <p className="text-xs text-slate-700 font-semibold">Sin eventos coincidentes</p>
                <p className="text-[11px] text-slate-400">Modificá el término de búsqueda o el filtro de acción.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {registrosPaginados.map((r) => {
                  const expandido = filaExpandida === r.id
                  const tiempo = formatearTiempoRelativo(r.creado_en)
                  const narrativa = generarNarrativaHumana(r.accion, r.entidad, r.detalles, r)
                  const config = obtenerConfigCategoria(r.accion, r.entidad)
                  const IconoCat = config.icono
                  const usuarioNombre = r.usuario_correo ? r.usuario_correo.split('@')[0] : 'Sistema'

                  return (
                    <div
                      key={r.id}
                      className={`transition-colors duration-150 ${
                        expandido ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Línea Principal del Evento */}
                      <div
                        onClick={() => setFilaExpandida(expandido ? null : r.id)}
                        className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Icono Plano Sutil */}
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-150 group-hover:scale-105 ${config.colorBadge}`}
                          >
                            <IconoCat size={13} />
                          </div>

                          {/* Contenido Narrativo: Qué pasó + Quién lo hizo */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-xs text-slate-800 font-medium leading-relaxed">
                                {narrativa}
                              </span>
                              <span className="text-[11px] text-slate-400 font-normal">
                                por{' '}
                                <span className="text-slate-600 font-medium" title={r.usuario_correo || 'Sistema'}>
                                  {usuarioNombre}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Metadatos alineados a la derecha: Micro-píldora y Tiempo relativo */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Micro-píldora con hash o acción */}
                          {r.hash_integridad ? (
                            <span
                              className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-slate-500 bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded-md transition"
                              title={`SHA-256: ${r.hash_integridad}`}
                            >
                              <Hash size={9} className="text-slate-400" />
                              {r.hash_integridad.slice(0, 7)}
                            </span>
                          ) : (
                            <span className="hidden sm:inline-block font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {r.accion.slice(0, 12)}
                            </span>
                          )}

                          {/* Tiempo Relativo */}
                          <span
                            className="text-[11px] font-mono text-slate-400 whitespace-nowrap min-w-[75px] text-right"
                            title={tiempo.exacto}
                          >
                            {tiempo.relativo}
                          </span>

                          <div className="text-slate-300 group-hover:text-slate-600 transition-colors">
                            {expandido ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                        </div>
                      </div>

                      {/* Panel Desplegable Sutil con Detalle Técnico */}
                      {expandido && (
                        <div className="px-4 pb-4 pt-1">
                          <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                  {r.accion}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Entidad: <strong className="text-slate-700">{r.entidad}</strong>
                                  {r.entidad_id ? ` #${r.entidad_id}` : ''}
                                </span>
                                {r.ip && (
                                  <span className="text-[11px] text-slate-400 font-mono">· IP {r.ip}</span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {r.hash_integridad && (
                                  <BotonCopiar texto={r.hash_integridad} label="Copiar Hash" size={10} />
                                )}
                                <BotonCopiar
                                  texto={
                                    typeof r.detalles === 'object'
                                      ? JSON.stringify(r.detalles, null, 2)
                                      : String(r.detalles || '')
                                  }
                                  label="Copiar JSON"
                                  size={10}
                                />
                              </div>
                            </div>

                            {/* Inspector JSON compacto */}
                            <InspectorJson datos={r.detalles} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Paginación Sutil en Modo Minimalista */}
            {!cargando && registrosFiltrados.length > 0 && (
              <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px]">
                  Mostrando {indiceInicio + 1}–{Math.min(indiceInicio + eventosPorPagina, registrosFiltrados.length)} de{' '}
                  {registrosFiltrados.length}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                    disabled={paginaActual === 1}
                    className="p-1 rounded-md hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 text-[11px] font-mono font-medium text-slate-700">
                    {paginaActual} / {totalPaginas}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                    disabled={paginaActual === totalPaginas}
                    className="p-1 rounded-md hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="Página siguiente"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pie Institucional Minimalista */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
            <span>SiGIC · Custodia Inmutable</span>
            <span>Tecnicatura Superior en Analista de Sistemas</span>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* 2. MODO DETALLADO / FORENSE COMPLETO (VISTA ORIGINAL)   */
        /* ======================================================== */
        <>
          {/* Barra Superior de Custodia Criptográfica SHA-256 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Eslabones Verificados */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between relative overflow-hidden">
              <div className="space-y-0.5 z-10">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Cadena Criptográfica Inmutable
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-800">
                    {integridad?.integra !== false ? 'Eslabones Verificados' : 'Alerta: Cadena Alterada'}
                  </span>
                  {integridad?.integra !== false ? (
                    <ShieldCheck size={16} className="text-emerald-600" />
                  ) : (
                    <ShieldAlert size={16} className="text-rose-600" />
                  )}
                </div>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  Eventos en bloque:{' '}
                  <strong className="text-slate-800">{integridad?.totalAnalizados ?? registros.length}</strong>
                  <span className="text-slate-400 ml-1">· Hash SHA-256</span>
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex flex-col items-center justify-center font-mono font-bold text-xs shadow-xs z-10">
                <Hash size={13} className="text-emerald-600 mb-0.5" />
                <span className="text-[9px] leading-none">256b</span>
              </div>
              <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none">
                <ShieldCheck size={80} />
              </div>
            </div>

            {/* Total Eventos */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Eventos en Bitácora</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black text-slate-800">{registrosFiltrados.length}</span>
                  <span className="text-xs text-slate-400 font-bold">de {registros.length} recuperados</span>
                </div>
                <p className="text-[10.5px] text-slate-500 font-medium">Registrados inmutablemente en Neon PostgreSQL</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/80 flex items-center justify-center shadow-xs">
                <Activity size={20} />
              </div>
            </div>

            {/* Monitoreo en Vivo */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Custodia en Vivo</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        autoActualizar ? 'bg-emerald-400' : 'bg-slate-300'
                      }`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        autoActualizar ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    ></span>
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {autoActualizar ? 'Actualización cada 15s' : 'Monitoreo en Pausa'}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 font-medium">Autoridad Forense: Julián Cancelo</p>
              </div>
              <button
                type="button"
            onClick={() => setAutoActualizar(!autoActualizar)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs active:scale-95"
          >
            {autoActualizar ? 'Pausar' : 'Reanudar'}
          </button>
        </div>
      </div>

      {/* 2. Barra de Herramientas y Controles Visuales (Estándar Impeccable) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        {/* Fila 1: Búsqueda y Filtros Principales */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Buscador reactivo */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por usuario, IP, DNI, narrativa en español o detalles..."
              className="w-full pl-9 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 font-bold bg-slate-200/60 hover:bg-slate-200 px-1.5 py-0.5 rounded cursor-pointer transition"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Selectores de Categoría y Acción */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:bg-white outline-none cursor-pointer hover:bg-slate-100/70 transition"
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
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:bg-white outline-none cursor-pointer hover:bg-slate-100/70 transition"
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              title="Refrescar auditoría ahora"
            >
              <RefreshCw size={12} className={cargando ? 'animate-spin text-sky-500' : ''} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>

            <button
              type="button"
              onClick={exportarCSV}
              disabled={registrosFiltrados.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              title="Descargar reporte forense en CSV con UTF-8 BOM"
            >
              <Download size={12} />
              <span>Exportar CSV</span>
            </button>

            {/* Switch a Modo Minimalista */}
            <button
              type="button"
              onClick={() => toggleModoMinimalista(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs"
              title="Cambiar a la vista minimalista limpia y libre de ruido visual"
            >
              <Minimize2 size={13} className="text-sky-600" />
              <span>Vista Minimalista</span>
            </button>
          </div>
        </div>

        {/* Fila 2: Selectores Ergonómicos (Narrativa, Densidad, Tipo de Vista) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-3 flex-wrap">
            {/* 1. Selector de Modo: Resumen Inteligente vs Forense Técnico */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setModoVisualizacion('resumen')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  modoVisualizacion === 'resumen'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Narrativa en lenguaje natural claro y conciso"
              >
                <Sparkles size={12} className={modoVisualizacion === 'resumen' ? 'text-sky-500' : 'text-slate-400'} />
                <span>Resumen Inteligente</span>
              </button>
              <button
                type="button"
                onClick={() => setModoVisualizacion('forense')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  modoVisualizacion === 'forense'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Modo técnico con códigos de acción en mayúsculas y entidades"
              >
                <Terminal size={12} className={modoVisualizacion === 'forense' ? 'text-slate-900' : 'text-slate-400'} />
                <span>Forense Técnico</span>
              </button>
            </div>

            {/* 2. Selector de Vista: Tabla Detallada vs Timeline */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setTipoVista('tabla')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  tipoVista === 'tabla' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter size={12} />
                <span>Tabla Detallada</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoVista('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  tipoVista === 'timeline'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock size={12} />
                <span>Línea de Tiempo</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 3. Selector de Densidad: Cómoda vs Compacta */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <span>Densidad:</span>
              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setDensidad('comoda')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                    densidad === 'comoda' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Cómoda
                </button>
                <button
                  type="button"
                  onClick={() => setDensidad('compacta')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                    densidad === 'compacta' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Compacta
                </button>
              </div>
            </div>

            {/* Selector de Eventos por página */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <span>Mostrar:</span>
              <select
                value={eventosPorPagina}
                onChange={(e) => setEventosPorPagina(Number(e.target.value))}
                className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-700 font-bold outline-none cursor-pointer"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Contenedor Principal: Tabla o Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {cargando && registros.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <RefreshCw size={26} className="animate-spin text-sky-500 mx-auto" />
            <p className="text-xs text-slate-600 font-bold">Cargando bitácora de auditoría inmutable...</p>
            <p className="text-[11px] text-slate-400">Verificando firmas SHA-256 en cadena con PostgreSQL</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-2">
            <AlertTriangle size={26} className="text-rose-500 mx-auto" />
            <p className="text-xs text-rose-600 font-bold">{error}</p>
            <button
              type="button"
              onClick={cargarDatos}
              className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
            >
              Reintentar carga
            </button>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Activity size={28} className="text-slate-300 mx-auto" />
            <p className="text-xs text-slate-700 font-bold">No se encontraron movimientos con los filtros aplicados</p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Probá modificando el criterio de búsqueda o seleccionando "Todas las acciones" para auditar eventos
              anteriores.
            </p>
          </div>
        ) : tipoVista === 'tabla' ? (
          /* ======================================================== */
          /* VISTA A: TABLA DETALLADA CON ACORDEÓN EXPANDIBLE         */
          /* ======================================================== */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[10.5px] font-black uppercase tracking-wider text-slate-500 select-none">
                  <th className="py-3 px-3 w-8"></th>
                  <th className="py-3 px-3">Momento / Fecha</th>
                  <th className="py-3 px-3">Operador / Usuario</th>
                  <th className="py-3 px-3">
                    {modoVisualizacion === 'resumen' ? 'Descripción del Movimiento' : 'Acción Forense'}
                  </th>
                  {modoVisualizacion === 'forense' && <th className="py-3 px-3">Entidad</th>}
                  <th className="py-3 px-3">IP Origen</th>
                  <th className="py-3 px-3 text-right">Eslabón SHA-256</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {registrosPaginados.map((r) => {
                  const expandido = filaExpandida === r.id
                  const tiempo = formatearTiempoRelativo(r.creado_en)
                  const narrativa = generarNarrativaHumana(r.accion, r.entidad, r.detalles, r)
                  const config = obtenerConfigCategoria(r.accion, r.entidad)
                  const IconoCat = config.icono
                  const paddingY = densidad === 'compacta' ? 'py-1.5' : 'py-3'

                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        onClick={() => setFilaExpandida(expandido ? null : r.id)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                          expandido ? 'bg-sky-50/30' : ''
                        }`}
                      >
                        {/* Flecha Acordeón */}
                        <td className={`${paddingY} px-3 text-slate-400 group-hover:text-slate-700`}>
                          {expandido ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </td>

                        {/* Fecha & Tiempo Relativo */}
                        <td className={`${paddingY} px-3 whitespace-nowrap`}>
                          <div className="flex flex-col" title={`Exacto: ${tiempo.exacto}\nISO: ${tiempo.iso || '-'}`}>
                            <span className="font-bold text-slate-700 text-xs flex items-center gap-1">
                              <Clock size={11} className="text-slate-400" />
                              {tiempo.relativo}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{tiempo.exacto}</span>
                          </div>
                        </td>

                        {/* Operador / Usuario */}
                        <td className={`${paddingY} px-3`}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                              <User size={12} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-800 leading-tight truncate max-w-[170px]">
                                {r.usuario_correo || 'Sistema / Tarea Automática'}
                              </span>
                              {r.rol && (
                                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                                  {r.rol}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Acción / Narrativa Humana */}
                        <td className={`${paddingY} px-3`}>
                          {modoVisualizacion === 'resumen' ? (
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${config.colorBadge}`}
                              >
                                <IconoCat size={13} />
                              </div>
                              <span className="font-medium text-slate-800 text-xs">{narrativa}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">{renderBadgeAccion(r.accion, r.entidad)}</div>
                          )}
                        </td>

                        {/* Entidad (solo visible en modo forense) */}
                        {modoVisualizacion === 'forense' && (
                          <td className={`${paddingY} px-3 whitespace-nowrap`}>
                            <span className="font-mono text-[11px] text-slate-600 font-semibold bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
                              {r.entidad}
                              {r.entidad_id ? ` #${r.entidad_id}` : ''}
                            </span>
                          </td>
                        )}

                        {/* IP Origen */}
                        <td className={`${paddingY} px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap`}>
                          <span className="flex items-center gap-1">
                            <Globe size={11} className="text-slate-400" />
                            {r.ip || '-'}
                          </span>
                        </td>

                        {/* Hash SHA-256 */}
                        <td className={`${paddingY} px-3 text-right whitespace-nowrap`}>
                          {r.hash_integridad ? (
                            <span
                              className="font-mono text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1"
                              title={`SHA-256 Completo: ${r.hash_integridad}`}
                            >
                              <Hash size={10} className="text-emerald-600" />
                              {r.hash_integridad.slice(0, 8)}…
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-mono italic">legacy</span>
                          )}
                        </td>
                      </tr>

                      {/* Acordeón Expandido con Inspector JSON y Copiado Rápido */}
                      {expandido && (
                        <tr className="bg-slate-50/70 border-b border-slate-200/80">
                          <td colSpan={modoVisualizacion === 'forense' ? 7 : 6} className="p-4 sm:p-5">
                            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                              {/* Fila de Encabezado del Detalle */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center border ${config.colorBadge}`}
                                  >
                                    <IconoCat size={14} />
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                      <span>{narrativa}</span>
                                      <span className="text-[10.5px] font-mono text-slate-400 font-normal">
                                        ({r.accion})
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      Entidad: <span className="font-semibold text-slate-600">{r.entidad}</span>
                                      {r.entidad_id && (
                                        <>
                                          {' '}
                                          · ID: <span className="font-mono text-slate-600">{r.entidad_id}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <BotonCopiar
                                    texto={
                                      typeof r.detalles === 'object'
                                        ? JSON.stringify(r.detalles, null, 2)
                                        : String(r.detalles || '')
                                    }
                                    label="Copiar JSON"
                                  />
                                </div>
                              </div>

                              {/* Grilla: Criptografía a la izquierda, Inspector JSON a la derecha */}
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                                {/* Columna Izquierda: Eslabones y Metadatos */}
                                <div className="lg:col-span-5 space-y-2.5">
                                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                        <Hash size={11} /> Identificador Único (UUID)
                                      </span>
                                      <BotonCopiar texto={r.id} label="Copiar" size={10} />
                                    </div>
                                    <div className="font-mono text-[11px] text-slate-800 break-all select-all font-bold">
                                      {r.id}
                                    </div>
                                  </div>

                                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                        <ShieldCheck size={11} className="text-emerald-600" /> Hash Custodia SHA-256
                                      </span>
                                      {r.hash_integridad && (
                                        <BotonCopiar texto={r.hash_integridad} label="Copiar Hash" size={10} />
                                      )}
                                    </div>
                                    <div className="font-mono text-[10.5px] text-emerald-800 break-all select-all font-bold bg-emerald-50/60 p-1.5 rounded border border-emerald-200/60">
                                      {r.hash_integridad || 'Sin hash criptográfico'}
                                    </div>
                                  </div>

                                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs font-mono text-[11px]">
                                    <div className="flex justify-between items-center text-slate-600">
                                      <span className="text-slate-400">Hash Previo:</span>
                                      <span className="text-[10px] truncate max-w-[140px] font-semibold">
                                        {r.hash_previo || 'GENESIS_SIGIC'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600">
                                      <span className="text-slate-400">IP de Origen:</span>
                                      <div className="flex items-center gap-1">
                                        <span className="font-bold text-slate-700">{r.ip || '-'}</span>
                                        {r.ip && <BotonCopiar texto={r.ip} label="Copiar" size={9} />}
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600">
                                      <span className="text-slate-400">Marca Temporal ISO:</span>
                                      <span className="text-[10px] text-slate-500">{tiempo.iso}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Columna Derecha: Inspector JSON */}
                                <div className="lg:col-span-7 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                      <Database size={11} /> Carga Útil del Movimiento (Payload JSON)
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {typeof r.detalles === 'object' && r.detalles !== null
                                        ? `${Object.keys(r.detalles).length} atributos`
                                        : 'raw'}
                                    </span>
                                  </div>
                                  <InspectorJson datos={r.detalles} />
                                </div>
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
        ) : (
          /* ======================================================== */
          /* VISTA B: LÍNEA DE TIEMPO VERTICAL (TIMELINE FORENSE)     */
          /* ======================================================== */
          <div className="p-5 md:p-6 space-y-6">
            <div className="relative pl-6 md:pl-8 space-y-6 before:absolute before:left-2.5 md:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {registrosPaginados.map((r) => {
                const expandido = filaExpandida === r.id
                const tiempo = formatearTiempoRelativo(r.creado_en)
                const narrativa = generarNarrativaHumana(r.accion, r.entidad, r.detalles, r)
                const config = obtenerConfigCategoria(r.accion, r.entidad)
                const IconoCat = config.icono

                return (
                  <div key={r.id} className="relative group">
                    {/* Nodo iluminado por color de categoría */}
                    <div
                      className={`absolute -left-6 md:-left-8 top-1.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm transition-transform duration-150 group-hover:scale-110 ${config.colorPunto}`}
                    >
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    </div>

                    {/* Tarjeta de Evento */}
                    <div
                      onClick={() => setFilaExpandida(expandido ? null : r.id)}
                      className={`p-3.5 md:p-4 rounded-xl border transition-all cursor-pointer ${
                        expandido
                          ? 'bg-sky-50/40 border-sky-300 shadow-xs ring-1 ring-sky-400/20'
                          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${config.colorBadge}`}
                          >
                            <IconoCat size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">
                              {modoVisualizacion === 'resumen' ? narrativa : r.accion}
                            </p>
                            <p className="text-[10.5px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>
                                Por: <strong className="text-slate-600">{r.usuario_correo || 'Sistema'}</strong>
                              </span>
                              <span>·</span>
                              <span>IP: {r.ip || '-'}</span>
                              <span>·</span>
                              <span className="font-mono text-slate-500">{r.entidad}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start md:self-center">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 font-mono">
                            <Clock size={11} className="text-slate-400" />
                            {tiempo.relativo}
                          </span>
                          {r.hash_integridad && (
                            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                              #{r.hash_integridad.slice(0, 6)}
                            </span>
                          )}
                          <div className="text-slate-400">
                            {expandido ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                        </div>
                      </div>

                      {/* Detalles en acordeón dentro del timeline */}
                      {expandido && (
                        <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Identificadores Criptográficos
                              </span>
                              <div className="space-y-1 font-mono text-[11px]">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400">UUID:</span>
                                  <div className="flex items-center gap-1">
                                    <span className="font-bold text-slate-800 truncate max-w-[160px]">{r.id}</span>
                                    <BotonCopiar texto={r.id} label="Copiar" size={9} />
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400">SHA-256:</span>
                                  <div className="flex items-center gap-1">
                                    <span className="font-bold text-emerald-700 truncate max-w-[160px]">
                                      {r.hash_integridad || 'Sin hash'}
                                    </span>
                                    {r.hash_integridad && (
                                      <BotonCopiar texto={r.hash_integridad} label="Copiar" size={9} />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Detalles JSON
                                </span>
                                <BotonCopiar
                                  texto={
                                    typeof r.detalles === 'object'
                                      ? JSON.stringify(r.detalles, null, 2)
                                      : String(r.detalles || '')
                                  }
                                  label="Copiar JSON"
                                  size={9}
                                />
                              </div>
                              <InspectorJson datos={r.detalles} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 4. Barra de Paginación Fluida */}
        {!cargando && registrosFiltrados.length > 0 && (
          <div className="bg-slate-50/90 border-t border-slate-200/80 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium text-[11px]">
              Mostrando eventos <strong className="text-slate-800">{indiceInicio + 1}</strong> a{' '}
              <strong className="text-slate-800">
                {Math.min(indiceInicio + eventosPorPagina, registrosFiltrados.length)}
              </strong>{' '}
              de <strong className="text-slate-800">{registrosFiltrados.length}</strong> filtrados (Página{' '}
              <strong className="text-slate-800">{paginaActual}</strong> de{' '}
              <strong className="text-slate-800">{totalPaginas}</strong>)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaginaActual(1)}
                disabled={paginaActual === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Primera página"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                disabled={paginaActual === 1}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft size={14} />
                <span>Anterior</span>
              </button>

              <span className="px-3 py-1 font-mono font-bold text-slate-700 bg-white border border-slate-200 rounded-lg">
                {paginaActual} / {totalPaginas}
              </span>

              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Página siguiente"
              >
                <span>Siguiente</span>
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPaginaActual(totalPaginas)}
                disabled={paginaActual === totalPaginas}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Última página"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Pie Institucional de Custodia */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-medium px-2 py-1 gap-2 border-t border-slate-100">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>Sistema de Auditoría Forense Criptográfica · SiGIC</span>
        </span>
        <span className="font-semibold text-slate-500">Tecnicatura Superior en Analista de Sistemas</span>
      </div>
    </>
  )}
</div>
  )
}
