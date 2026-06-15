import { useEffect, useState, useRef } from 'react'
import { ModalPermisos } from '../componentes/ModalPermisos'
import { ModalConfirmacion } from '../componentes/ModalConfirmacion'
import { ubicacionPorDefecto } from '../datos/ubicacion-por-defecto'
import { consultarClimaActual, obtenerDetalleClima } from '../utilidades/clima'
import { obtenerTextoMes } from '../utilidades/formatear-fecha'
import dayjs from 'dayjs'
import {
  CloudSun, LogOut, Users, MapPin, QrCode, ScanLine,
  GraduationCap, UserCheck, Clock, TrendingUp, Activity,
  ChevronRight, Wifi, WifiOff, FileImage, Settings, LayoutGrid,
  Calendar,
} from 'lucide-react'

import { BASE, cabeceras } from '../servicios/api'
import { HeaderGlobal } from '../componentes/HeaderGlobal'

// ─── Colores del sistema ───────────────────────────────────────
const DARK   = '#2A3448'
const ACCENT = '#0EA5E9'
const BG     = '#F8FAFC'

// ─── Animación de número contando hacia arriba ─────────────────
function useContador(destino, duracion = 800) {
  const [valor, setValor] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (destino === 0) { setValor(0); return }
    const inicio = performance.now()
    function animar(ahora) {
      const progreso = Math.min((ahora - inicio) / duracion, 1)
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progreso, 3)
      setValor(Math.round(ease * destino))
      if (progreso < 1) rafRef.current = requestAnimationFrame(animar)
    }
    rafRef.current = requestAnimationFrame(animar)
    return () => cancelAnimationFrame(rafRef.current)
  }, [destino, duracion])

  return valor
}

// ─── Skeleton de carga para las stat cards ─────────────────────
function SkeletonStat() {
  return (
    <div
      className="relative overflow-hidden rounded-[28px] p-6 h-28 bg-white border border-slate-100 shadow-sm"
    >
      <div className="h-6 w-6 animate-pulse rounded-lg bg-slate-100 mb-3" />
      <div className="h-5 w-16 animate-pulse rounded-md bg-slate-100 mb-1" />
      <div className="h-3.5 w-24 animate-pulse rounded-md bg-slate-50" />
    </div>
  )
}

// ─── Anillo de Progreso Circular para Aforo ─────────────────────
function CircularProgress({ valor, color = ACCENT, size = 80, strokeWidth = 8 }) {
  const contado = useContador(typeof valor === 'number' ? valor : 0)
  const radio = (size - strokeWidth) / 2
  const circunferencia = 2 * Math.PI * radio
  const offset = circunferencia - (Math.min(contado, 100) / 100) * circunferencia

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Círculo de fondo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Círculo de progreso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Porcentaje en el centro */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-[15px] font-black text-slate-800 leading-none tabular-nums">
          {contado}%
        </span>
        <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
          aforo
        </span>
      </div>
    </div>
  )
}

// ─── Tarjeta Bento Stat ──────────────────────────────────────────
function BentoStatCard({ icono: Icono, etiqueta, valor, color = ACCENT, descripcion, circularValue }) {
  const contado = useContador(typeof valor === 'number' ? valor : 0)

  return (
    <div
      className="relative overflow-hidden rounded-[28px] p-6 flex items-center justify-between transition-all hover:scale-[1.02] duration-300 bg-white border border-slate-100 shadow-md shadow-slate-100/50"
    >
      {/* Contenido izquierdo */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-150" style={{ color }}>
            <Icono size={16} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-450 truncate">
            {etiqueta}
          </p>
        </div>
        <p className="text-[2.1rem] font-black leading-none tracking-tight text-slate-800 tabular-nums my-1">
          {circularValue !== undefined ? `${contado}%` : contado}
        </p>
        <p className="text-[11px] font-semibold text-slate-400 truncate">
          {descripcion}
        </p>
      </div>

      {/* Gráfico circular o elemento visual a la derecha */}
      {circularValue !== undefined ? (
        <CircularProgress valor={valor} color={color} size={80} strokeWidth={8} />
      ) : (
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100">
          <Icono size={26} style={{ color, opacity: 0.8 }} />
          {/* Sutil resplandor de fondo */}
          <div className="absolute inset-0 rounded-2xl opacity-[0.08] blur-md" style={{ background: color }} />
        </div>
      )}
    </div>
  )
}

// ─── Bento Tarjeta Reloj y Clima ────────────────────────────────
function TarjetaRelojClima({ climaInfo, fechaActual, textoTemp }) {
  const diaSemana = fechaActual.toLocaleDateString('es-AR', { weekday: 'long' })
  const dia = fechaActual.getDate()
  const mes = fechaActual.toLocaleDateString('es-AR', { month: 'long' })
  
  const horaHHmm = dayjs(fechaActual).format('HH:mm')
  const horaSS = dayjs(fechaActual).format('ss')

  const detalleClima = climaInfo ? obtenerDetalleClima(climaInfo.codigoClima) : { icono: CloudSun, descripcion: 'Cargando clima...' }
  const IconoClima = detalleClima.icono

  return (
    <div
      className="relative overflow-hidden rounded-[32px] p-6 flex flex-col justify-between text-white shadow-xl shadow-slate-900/10 min-h-[190px]"
      style={{
        background: 'linear-gradient(135deg, #0d1b2e 0%, #1a2d45 50%, #2A3448 100%)',
      }}
    >
      {/* Efectos de luz decorativos de fondo */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-sky-400 via-transparent to-transparent blur-xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none bg-sky-500/10 blur-2xl" />

      {/* Cabecera: Reloj */}
      <div className="relative flex items-baseline justify-between">
        <div>
          <span className="text-4xl font-black tracking-tight tabular-nums">
            {horaHHmm}
          </span>
          <span className="text-md font-bold text-sky-450/85 ml-1 tabular-nums animate-pulse">
            :{horaSS}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
          </span>
          <span className="text-[9px] font-black uppercase tracking-wider text-sky-300">En Vivo</span>
        </div>
      </div>

      {/* Pie: Fecha y Clima */}
      <div className="relative mt-4">
        <p className="text-[12px] font-black uppercase tracking-widest text-white/50 leading-none mb-1">
          {diaSemana}
        </p>
        <p className="text-[16px] font-black leading-tight text-white/90">
          {dia} de {mes}
        </p>
        
        {/* Info del Clima */}
        <div className="mt-3 flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-2">
          <div className="p-1 rounded-lg bg-sky-500/20 text-sky-350">
            <IconoClima size={16} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black leading-none text-white truncate">
              {textoTemp}
            </p>
            <p className="text-[8px] font-bold text-white/40 uppercase tracking-wider truncate mt-0.5">
              {detalleClima.descripcion}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Bento Tarjeta Cronograma / Agenda ──────────────────────────
function TarjetaCronograma({ proximas, backendOnline }) {
  return (
    <div className="bg-white border border-slate-100 shadow-md shadow-slate-100/50 rounded-[32px] p-6 flex flex-col justify-between h-full min-h-[350px]">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
            <Clock size={16} className="animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-450">Agenda</span>
        </div>
        
        <p className="text-[14px] font-black text-slate-800 mb-3.5">Próximas Ceremonias</p>

        {!backendOnline ? (
          <p className="text-[11px] text-slate-400 italic">Sin conexión para sincronizar</p>
        ) : proximas.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic">No hay más eventos programados</p>
        ) : (
          <div className="space-y-3">
            {proximas.map(p => (
              <div key={p.id} className="group flex items-center gap-3 bg-slate-50/70 hover:bg-sky-50/50 border border-slate-100 hover:border-sky-100 p-2.5 rounded-2xl transition-all duration-200">
                <div className="bg-white text-sky-600 border border-slate-100 group-hover:border-sky-100 w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-black leading-tight flex-shrink-0">
                  <span className="text-[12px]">{new Date(p.fecha).getDate()}</span>
                  <span className="text-[8px] uppercase tracking-tighter text-slate-400">{new Date(p.fecha).toLocaleDateString('es-AR', { month: 'short' })}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-black text-slate-700 leading-snug truncate">{p.nombre}</p>
                  <p className="text-[9px] font-bold text-slate-400 truncate mt-0.5">{p.lugar || 'Sede Beltrán'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
        <span className="font-bold">Auditoría del Sistema</span>
        <span className="flex items-center gap-1 font-bold text-emerald-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          Conectado
        </span>
      </div>
    </div>
  )
}

// ─── Botón de acceso rápido grande ─────────────────────────────
function AccesoGrande({ icono: Icono, titulo, descripcion, pantalla, badge, onClick }) {
  const disponible = !!pantalla
  return (
    <button
      type="button"
      onClick={() => disponible && onClick(pantalla)}
      className={`group relative overflow-hidden rounded-[24px] border p-5 text-left transition-all duration-300 ${
        disponible
          ? 'bg-white border-slate-100 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100/60 hover:-translate-y-0.5 cursor-pointer'
          : 'bg-slate-50/50 border-slate-100 opacity-55 cursor-default'
      }`}
    >
      {/* Destello de fondo en hover */}
      {disponible && (
        <div
          className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-[32px] opacity-0 transition-opacity duration-500 group-hover:opacity-20"
          style={{ background: ACCENT }}
        />
      )}

      {/* Ícono */}
      <div
        className={`mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-350 ${
          disponible
            ? 'bg-sky-50 text-sky-500 border border-sky-100 group-hover:bg-sky-500 group-hover:text-white group-hover:scale-110'
            : 'bg-slate-100 text-slate-400 border border-slate-200'
        }`}
      >
        <Icono size={20} />
      </div>

      {/* Título + badge */}
      <div className="flex items-center gap-2 mb-1">
        <p className={`text-[13px] font-black ${disponible ? 'text-slate-800' : 'text-slate-400'}`}>
          {titulo}
        </p>
        {badge && (
          <span
            className="rounded-full px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider bg-sky-50 border border-sky-100 text-sky-600"
          >
            {badge}
          </span>
        )}
      </div>

      {/* Descripción */}
      <p className={`text-[11px] font-semibold leading-normal ${disponible ? 'text-slate-400' : 'text-slate-300'}`}>
        {descripcion}
      </p>

      {/* Flecha */}
      {disponible && (
        <ChevronRight
          size={14}
          className="absolute bottom-4 right-4 text-sky-400/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-sky-500"
        />
      )}
    </button>
  )
}

// ════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ════════════════════════════════════════════════════════════════
export function PantallaBienvenida({ usuario, onCerrarSesion, onNavegar, onCambiarVersion }) {
  const [fechaActual, setFechaActual]       = useState(() => new Date())
  const [temperatura, setTemperatura]       = useState(null)
  const [modalPermisos, setModalPermisos]   = useState(false)
  const [modalSesion, setModalSesion]       = useState(false)
  const [permisos, setPermisos]             = useState({ ubicacion: 'prompt', notificaciones: 'prompt' })

  // Stats, Config y Ceremonias
  const [stats, setStats]                   = useState(null)
  const [config, setConfig]                 = useState({})
  const [ceremonias, setCeremonias]         = useState([])
  const [cargandoStats, setCargandoStats]   = useState(true)
  const [backendOnline, setBackendOnline]   = useState(true)

  const logoInstitucional = '/footer.png'

  const [climaInfo, setClimaInfo] = useState(null)

  // ── Reloj en tiempo real (segundero activo) ──
  useEffect(() => {
    const t = setInterval(() => setFechaActual(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Carga de datos unificada ──
  useEffect(() => {
    cargarDatos()
    const intervalo = setInterval(cargarDatos, 30_000)
    return () => clearInterval(intervalo)
  }, [])

  // ── Geolocalización de clima ──
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          actualizarPermiso('ubicacion', 'granted')
          cargarClima(pos.coords.latitude, pos.coords.longitude)
        },
        () => {
          cargarClima(ubicacionPorDefecto.latitud, ubicacionPorDefecto.longitud)
        }
      )
    } else {
      cargarClima(ubicacionPorDefecto.latitud, ubicacionPorDefecto.longitud)
    }
  }, [])

  async function cargarClima(lat, lon) {
    try {
      const resClima = await consultarClimaActual(lat, lon)
      setClimaInfo(resClima)
    } catch (err) {
      console.error('Error al cargar clima en PantallaBienvenida:', err)
    }
  }

  async function cargarDatos() {
    try {
      // 1. Stats (requiere sesión de personal)
      const resStats = await fetch(`${BASE}/stats`, { headers: cabeceras() })
      if (resStats.ok) setStats(await resStats.json())

      // 2. Configuración
      const resConfig = await fetch(`${BASE}/configuracion`)
      if (resConfig.ok) {
        const d = await resConfig.json()
        const aplanado = {}
        Object.entries(d).forEach(([k, v]) => { aplanado[k] = v.valor })
        setConfig(aplanado)
      }

      // 3. Listado de Ceremonias
      const resCer = await fetch(`${BASE}/ceremonias`)
      if (resCer.ok) setCeremonias(await resCer.json())

      setBackendOnline(true)
    } catch {
      setBackendOnline(false)
    } finally {
      setCargandoStats(false)
    }
  }

  const ceremoniaActiva = ceremonias.find(c => c.activa === 1) || ceremonias[0]
  const proximas = ceremonias.filter(c => c.activa === 0).slice(0, 3)

  function actualizarPermiso(nombre, valor) { setPermisos(p => ({ ...p, [nombre]: valor })) }
  function solicitarUbicacion() {
    if (!('geolocation' in navigator)) { actualizarPermiso('ubicacion', 'unsupported'); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        actualizarPermiso('ubicacion', 'granted')
        cargarClima(pos.coords.latitude, pos.coords.longitude)
      },
      () => actualizarPermiso('ubicacion', 'denied'),
    )
  }
  async function solicitarNotificaciones() {
    if (!('Notification' in window)) { actualizarPermiso('notificaciones', 'unsupported'); return }
    const r = await Notification.requestPermission()
    actualizarPermiso('notificaciones', r === 'default' ? 'prompt' : r)
  }

  // Formato de fecha/hora
  const dia       = fechaActual.getDate()
  const mes       = obtenerTextoMes(fechaActual)
  const anio      = fechaActual.getFullYear()
  const diaSemana = fechaActual.toLocaleDateString('es-AR', { weekday: 'long' })
  const horaHHmm  = dayjs(fechaActual).format('HH:mm')
  const horaSS    = dayjs(fechaActual).format('ss')
  const textoTemp = climaInfo?.temperatura !== undefined && climaInfo.temperatura !== null ? `${Math.round(climaInfo.temperatura)}°C` : '--'


  // Accesos rápidos del panel
  const accesos = [
    {
      icono: ScanLine,
      titulo: 'Control de Ingreso',
      descripcion: 'Módulo de portería: escaneo de QRs y check-in de invitados',
      pantalla: 'control-ingreso',
      badge: 'Escáner',
    },
    {
      icono: Users,
      titulo: 'Gestionar Graduados',
      descripcion: 'Alta de graduados, flujo de trabajo y listado general',
      pantalla: 'gestion-graduados',
    },
    {
      icono: GraduationCap,
      titulo: 'Gestionar Profesores',
      descripcion: 'Administrar el plantel docente de la institución',
      pantalla: 'gestion-profesores',
    },
    {
      icono: MapPin,
      titulo: 'Plano Anfiteatro',
      descripcion: 'Visualización y asignación de ubicaciones en el plano',
      pantalla: 'seleccion-asientos',
      badge: 'Nuevo',
    },
    {
      icono: Settings,
      titulo: 'Ajustes del Sistema',
      descripcion: 'Límites de invitados, datos del evento y control del portal',
      pantalla: 'ajustes',
      badge: 'Admin',
    },
    {
      icono: LayoutGrid,
      titulo: 'Gestión de Ceremonias',
      descripcion: 'Crear y administrar múltiples eventos independientes',
      pantalla: 'gestion-ceremonias',
      badge: 'Hábitats',
    },
  ]

  return (
    <div className="min-h-screen" style={{ background: BG }}>

      <HeaderGlobal 
        titulo="Panel de Administración"
        usuario={usuario}
        onCerrarSesion={onCerrarSesion}
      />

      {/* ══ CONTENIDO ════════════════════════════════════════════ */}
      <main className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <div className="flex flex-col gap-6">

          {/* PRIMERA FILA BENTO: Saludo (3/4) + Clima y Reloj (1/4) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Saludo y Hábitat Activo */}
            <section
              className="lg:col-span-3 bg-white border border-slate-100 shadow-md shadow-slate-100/50 rounded-[32px] overflow-hidden"
            >
              <div className="relative p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 h-full min-h-[190px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/[0.02] rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50/50 border border-sky-100/60 text-sky-600 mb-3.5">
                    <Activity size={12} className="animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em]">Hábitat Activo</span>
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">
                    <span className="bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-700 bg-clip-text text-transparent">
                      {ceremoniaActiva?.nombre || config.nombre_evento || 'Iniciando hábitat...'}
                    </span>
                  </h1>

                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
                      <Calendar size={13} className="text-sky-500" />
                      {ceremoniaActiva ? new Date(ceremoniaActiva.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
                      <MapPin size={13} className="text-sky-500" />
                      {ceremoniaActiva?.lugar || 'Sede Beltrán'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end justify-center gap-3">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 px-4.5 py-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      Operador Activo
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onCambiarVersion}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[9.5px] font-black uppercase tracking-wider px-4 py-2 rounded-full border border-slate-700 active:scale-95 transition-all shadow-md shadow-slate-950/10 cursor-pointer"
                  >
                    <LayoutGrid size={12} className="text-sky-450" /> Versión 2 (Modo Pro)
                  </button>
                </div>
              </div>
            </section>

            {/* Reloj y Clima */}
            <TarjetaRelojClima
              climaInfo={climaInfo}
              fechaActual={fechaActual}
              textoTemp={textoTemp}
            />

          </div>

          {/* SEGUNDA FILA BENTO: Tarjetas de estadísticas (4 columnas uniformes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cargandoStats ? (
              <>
                <SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat />
              </>
            ) : !backendOnline ? (
              <div
                className="col-span-1 sm:col-span-2 lg:col-span-4 flex items-center gap-3.5 rounded-[28px] border px-6 py-5 bg-red-50 border-red-150 text-red-500"
              >
                <WifiOff size={20} className="animate-bounce" />
                <div>
                  <p className="text-[13px] font-black uppercase tracking-wide">Servidor Desconectado</p>
                  <p className="text-[11px] font-semibold text-red-400 mt-0.5">Por favor, ejecutá el comando de backend para obtener métricas reales.</p>
                </div>
              </div>
            ) : (
              <>
                <BentoStatCard
                  icono={GraduationCap}
                  etiqueta="Graduados"
                  valor={stats?.totalEgresados ?? 0}
                  color="#3b82f6"
                  descripcion="Padrones en hábitat"
                />
                <BentoStatCard
                  icono={Users}
                  etiqueta="Invitados totales"
                  valor={stats?.totalInvitados ?? 0}
                  color="#6366f1"
                  descripcion="Acompañantes asignados"
                />
                <BentoStatCard
                  icono={UserCheck}
                  etiqueta="Ingresados"
                  valor={stats?.presentes ?? 0}
                  color="#10b981"
                  descripcion="Check-in completados"
                />
                <BentoStatCard
                  icono={TrendingUp}
                  etiqueta="Ocupación"
                  valor={stats?.porcentajeOcupacion ?? 0}
                  color="#0ea5e9"
                  descripcion="Porcentaje de asistencia"
                  circularValue={stats?.porcentajeOcupacion ?? 0}
                />
              </>
            )}
          </div>

          {/* TERCERA FILA BENTO: Accesos Rápidos (3/4) + Agenda / Timeline (1/4) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Contenedor de Accesos rápidos */}
            <div
              className="lg:col-span-3 bg-white border border-slate-100 shadow-md shadow-slate-100/50 rounded-[32px] overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 px-6 py-4.5 border-b border-slate-50 bg-slate-50/20">
                  <div className="flex h-[24px] w-[24px] items-center justify-center rounded-lg bg-sky-50 text-sky-500 border border-sky-100">
                    <LayoutGrid size={13} />
                  </div>
                  <span className="text-[12px] font-black uppercase tracking-wider text-slate-655">Consola de Control</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {accesos.map(a => (
                    <AccesoGrande
                      key={a.titulo}
                      {...a}
                      onClick={onNavegar}
                    />
                  ))}
                </div>
              </div>

              {/* Pie de accesos */}
              <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/10 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                <span>SiGIC V1 - Plataforma de Gestión Institucional de Colaciones</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                  Terminal Activa
                </span>
              </div>
            </div>

            {/* Agenda del Evento */}
            <TarjetaCronograma
              proximas={proximas}
              backendOnline={backendOnline}
            />

          </div>

        </div>
      </main>

      {/* ── Modales ── */}
      <ModalPermisos
        abierto={modalPermisos}
        permisos={permisos}
        onSolicitarUbicacion={solicitarUbicacion}
        onSolicitarNotificaciones={solicitarNotificaciones}
        onContinuar={() => setModalPermisos(false)}
      />
      <ModalConfirmacion
        abierto={modalSesion}
        onConfirmar={onCerrarSesion}
        onCancelar={() => setModalSesion(false)}
        titulo="Cerrar sesión"
        descripcion="Vas a salir del sistema. Podés volver a ingresar cuando quieras."
        textoConfirmar="Sí, cerrar sesión"
      />
    </div>
  )
}

