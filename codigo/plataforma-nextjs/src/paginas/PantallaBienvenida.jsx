import { useEffect, useState, useRef } from 'react'
import { ModalPermisos } from '../componentes/ModalPermisos'
import { ModalConfirmacion } from '../componentes/ModalConfirmacion'
import { ubicacionPorDefecto } from '../datos/ubicacion-por-defecto'
import { consultarClimaActual } from '../utilidades/clima'
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
      className="relative overflow-hidden rounded-[14px] px-5 py-5"
      style={{ background: DARK, border: `1.5px solid rgba(41,171,226,0.1)` }}
    >
      <div className="h-10 w-16 animate-pulse rounded-[6px] mb-3" style={{ background: 'rgba(255,255,255,0.07)' }} />
      <div className="h-3 w-24 animate-pulse rounded-[4px]" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
  )
}

// ─── Stat card individual ──────────────────────────────────────
function StatCard({ icono: Icono, etiqueta, valor, color = ACCENT, sufijo = '', descripcion, barra }) {
  const contado = useContador(typeof valor === 'number' ? valor : 0)

  return (
    <div
      className="relative overflow-hidden rounded-[24px] px-6 py-6 flex flex-col gap-1 transition-all hover:scale-[1.02] duration-300"
      style={{
        background: '#fff',
        border: `1px solid rgba(16,185,129,0.1)`,
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
      }}
    >
      {/* Ícono decorativo fondo */}
      <div className="pointer-events-none absolute top-4 right-4 opacity-[0.1]">
        <Icono size={42} color={color} />
      </div>
      {/* Glow */}
      <div
        className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full blur-[30px]"
        style={{ background: color, opacity: 0.12 }}
      />

      {/* Número */}
      <p
        className="text-[2.6rem] font-black leading-none tabular-nums"
        style={{ color, letterSpacing: '-0.02em' }}
      >
        {contado}{sufijo}
      </p>

      {/* Etiqueta */}
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        {etiqueta}
      </p>

      {/* Descripción opcional */}
      {descripcion && (
        <p className="text-[10px] mt-0.5 font-medium text-slate-300">{descripcion}</p>
      )}

      {/* Barra de progreso opcional */}
      {barra !== undefined && (
        <div className="mt-3 h-2 w-full rounded-full overflow-hidden bg-slate-50">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${barra}%`, background: `linear-gradient(90deg, ${color}, #34d399)` }}
          />
        </div>
      )}
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
      className="group relative overflow-hidden rounded-[14px] border p-5 text-left transition-all duration-200"
      style={{
        borderColor: disponible ? `${ACCENT}22` : 'rgba(255,255,255,0.06)',
        background: disponible ? '#fff' : 'rgba(255,255,255,0.03)',
        boxShadow: disponible ? '0 2px 12px rgba(41,171,226,0.06)' : 'none',
        cursor: disponible ? 'pointer' : 'default',
        opacity: disponible ? 1 : 0.55,
      }}
      onMouseEnter={e => { if (disponible) { e.currentTarget.style.borderColor = `${ACCENT}55`; e.currentTarget.style.boxShadow = `0 6px 24px rgba(41,171,226,0.14)` } }}
      onMouseLeave={e => { if (disponible) { e.currentTarget.style.borderColor = `${ACCENT}22`; e.currentTarget.style.boxShadow = '0 2px 12px rgba(41,171,226,0.06)' } }}
    >
      {/* Glow hover */}
      {disponible && (
        <div
          className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-[32px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: ACCENT }}
        />
      )}

      {/* Ícono */}
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-[10px] transition-colors"
        style={{
          background: disponible ? `${ACCENT}14` : 'rgba(255,255,255,0.05)',
          color: disponible ? ACCENT : 'rgba(255,255,255,0.2)',
          border: `1px solid ${disponible ? `${ACCENT}22` : 'transparent'}`,
        }}
      >
        <Icono size={20} />
      </div>

      {/* Título + badge */}
      <div className="flex items-center gap-2 mb-1">
        <p className="text-[13px] font-bold" style={{ color: disponible ? DARK : 'rgba(255,255,255,0.3)' }}>
          {titulo}
        </p>
        {badge && (
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
            style={{ background: 'rgba(255,165,0,0.12)', color: '#f59e0b', border: '1px solid rgba(255,165,0,0.2)' }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Descripción */}
      <p className="text-[11px]" style={{ color: disponible ? '#78909c' : 'rgba(255,255,255,0.18)' }}>
        {descripcion}
      </p>

      {/* Flecha */}
      {disponible && (
        <ChevronRight
          size={14}
          className="absolute bottom-4 right-4 transition-transform duration-200 group-hover:translate-x-1"
          style={{ color: `${ACCENT}60` }}
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

  // ── Carga de datos unificada ─────────────────
  useEffect(() => {
    cargarDatos()
    const intervalo = setInterval(cargarDatos, 30_000)
    return () => clearInterval(intervalo)
  }, [])

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
  const proximas = ceremonias.filter(c => c.activa === 0).slice(0, 2)

  function actualizarPermiso(nombre, valor) { setPermisos(p => ({ ...p, [nombre]: valor })) }
  function solicitarUbicacion() {
    if (!('geolocation' in navigator)) { actualizarPermiso('ubicacion', 'unsupported'); return }
    navigator.geolocation.getCurrentPosition(
      () => actualizarPermiso('ubicacion', 'granted'),
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
  const textoTemp = temperatura !== null ? `${temperatura}°C` : '--'

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
        <div className="space-y-5">

          {/* ── 1. TARJETA SALUDO con fecha y hora integradas ─── */}
          <section
            className="relative overflow-hidden rounded-[32px] border border-white shadow-2xl shadow-slate-200/60"
            style={{
              background: '#fff',
            }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">Hábitat Activo</span>
                </div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                  <span className="bg-gradient-to-r from-sky-500 to-indigo-700 bg-clip-text text-transparent">
                    {ceremoniaActiva?.nombre || config.nombre_evento || 'Iniciando hábitat...'}
                  </span>
                </h1>
                <p className="mt-2 text-[12px] font-bold text-slate-400 flex items-center gap-2">
                  <Calendar size={14} /> {ceremoniaActiva ? new Date(ceremoniaActiva.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }) : '—'} 
                  <span className="opacity-20">|</span> 
                  <MapPin size={14} /> {ceremoniaActiva?.lugar || 'Sede Beltrán'}
                </p>
              </div>
              
              {/* MINI CRONOGRAMA */}
              {proximas.length > 0 && (
                <div className="hidden lg:flex items-center gap-4 bg-slate-50 p-4 rounded-[24px] border border-slate-100">
                  <div className="text-right border-r border-slate-200 pr-4">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Próximos Eventos</p>
                    <p className="text-[10px] font-bold text-slate-500 italic">Cronograma de Colación</p>
                  </div>
                  <div className="flex gap-4">
                    {proximas.map(p => (
                      <div key={p.id} className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-50">
                        <div className="bg-sky-100 text-sky-600 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black">
                          {new Date(p.fecha).getDate()}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-700 leading-tight truncate max-w-[100px]">{p.nombre}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(p.fecha).toLocaleDateString('es-AR', { month: 'short' })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col items-end gap-2.5">
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 px-5 py-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-[0.1em] text-emerald-700">
                    Sesión activa
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onCambiarVersion}
                  className="flex items-center gap-1.5 bg-[#0d1b2e] hover:bg-slate-800 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-slate-700 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <LayoutGrid size={12} /> Versión 2 (Modo Pro)
                </button>
                <span className="text-[12px] font-bold text-slate-350 uppercase tracking-widest">
                  {diaSemana}, {dia} {mes}
                </span>
              </div>
            </div>
          </section>

          {/* ── 2. STATS REALES ──────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {cargandoStats ? (
              <>
                <SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat />
              </>
            ) : !backendOnline ? (
              <div
                className="col-span-2 md:col-span-4 flex items-center gap-3 rounded-[14px] border px-5 py-4"
                style={{ background: 'rgba(248,113,113,0.06)', borderColor: 'rgba(248,113,113,0.2)' }}
              >
                <WifiOff size={16} className="text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-red-400">Backend desconectado</p>
                  <p className="text-[11px] text-red-400/60">Ejecutá <code className="font-mono">node backend/server.js</code> para ver los datos del evento.</p>
                </div>
              </div>
            ) : (
              <>
                <StatCard
                  icono={GraduationCap}
                  etiqueta="Graduados"
                  valor={stats?.totalEgresados ?? 0}
                  descripcion="Registrados en el sistema"
                />
                <StatCard
                  icono={Users}
                  etiqueta="Invitados totales"
                  valor={stats?.totalInvitados ?? 0}
                  descripcion="Entre todos los graduados"
                />
                <StatCard
                  icono={UserCheck}
                  etiqueta="Ingresados"
                  valor={stats?.presentes ?? 0}
                  color="#4ade80"
                  descripcion="Invitados presentes hoy"
                />
                <StatCard
                  icono={TrendingUp}
                  etiqueta="Ocupación"
                  valor={stats?.porcentajeOcupacion ?? 0}
                  sufijo="%"
                  descripcion="Del aforo total esperado"
                  barra={stats?.porcentajeOcupacion ?? 0}
                />
              </>
            )}
          </div>

          {/* ── 3. ACCESOS RÁPIDOS 2×2 + ACTIVIDAD RECIENTE ─── */}
            {/* Accesos rápidos centrado */}
            <div
              className="lg:col-span-2 overflow-hidden rounded-[16px] border"
              style={{ borderColor: `${ACCENT}18`, boxShadow: '0 4px 16px rgba(41,171,226,0.06)' }}
            >
              <div className="flex items-center gap-2.5 px-5 py-3" style={{ background: DARK }}>
                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full" style={{ background: ACCENT }}>
                  <Users size={11} color="white" />
                </div>
                <span className="text-[12px] font-bold text-white">Accesos rápidos</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-4">
                {accesos.map(a => (
                  <AccesoGrande
                    key={a.titulo}
                    {...a}
                    onClick={onNavegar}
                  />
                ))}
              </div>
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
