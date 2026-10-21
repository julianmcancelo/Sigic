import { useEffect, useState, useRef } from 'react'
import { ModalPermisos } from '../componentes/ModalPermisos'
import { ModalConfirmacion } from '../componentes/ModalConfirmacion'
import { ModalCrearCircuito } from '../componentes/ModalCrearCircuito'
import { ubicacionPorDefecto } from '../datos/ubicacion-por-defecto'
import { consultarClimaActual, obtenerDetalleClima } from '../utilidades/clima'
import { obtenerTextoMes } from '../utilidades/formatear-fecha'
import dayjs from 'dayjs'
import {
  CloudSun, LogOut, Users, MapPin, QrCode, ScanLine, CalendarPlus, Armchair, CheckCircle2, ArrowRight, Sparkles,
  GraduationCap, UserCheck, Clock, TrendingUp, Activity,
  ChevronRight, Wifi, WifiOff, FileImage, Settings, LayoutGrid,
  Calendar, Server, Shield, Send, ListChecks, BarChart3,
  Eye, EyeOff, ChevronDown, ChevronUp, Maximize2, Minimize2,
  List, Grid3X3, StretchHorizontal
} from 'lucide-react'


import { BASE, cabeceras } from '../servicios/api'
import { HeaderGlobal } from '../componentes/HeaderGlobal'
import { FONDOS_DISPONIBLES, obtenerTemaActual } from '../datos/fondos-pantalla'

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

function BienvenidaInstitucional({ usuario, onNavegar, onCerrarSesion }) {
  const accesos = [
    { id: 'gestion-ceremonias', icono: Sparkles, titulo: 'Inicializar Ceremonia', texto: 'Comenzá desde 0, configurá fecha, sede y cupos.' },
    { id: 'gestion-graduados', icono: Users, titulo: 'Padrón de Graduados', texto: 'Cargá alumnos por Excel, juramentos y docentes.' },
    { id: 'convocatoria', icono: Send, titulo: 'Convocatoria Masiva', texto: 'Enviá invitaciones seguras por correo con OTP.' },
    { id: 'preparacion-ceremonia', icono: ListChecks, titulo: 'Preparación & Asientos', texto: 'Auto-Seating inteligente en 1 clic y distribución.' },
    { id: 'control-ingreso', icono: ScanLine, titulo: 'Acreditación / Puerta', texto: 'Escaneo rápido de QRs y check-in con app móvil.' },
    { id: 'estado-ceremonia', icono: Activity, titulo: 'Tablero en Vivo & Actas', texto: 'Métricas de presencia y generación de Acta Oficial PDF.' },
    { id: 'panel-reportes', icono: BarChart3, titulo: 'Reportes & Libro Matriz', texto: 'Auditoría institucional y exportación a Excel.' },
  ]
  return (
    <div className="min-h-full bg-[#f5f8fa] text-slate-800">
      <div className="border-b border-slate-200 bg-white px-6 py-4 sm:px-8"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><img src="/logo-oficial.png" alt="Logo de SIGIC" className="h-10 w-10 rounded-xl object-cover" /><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-sky-600">Espacio de trabajo</p><h1 className="text-lg font-black text-slate-800">Bienvenido a SIGIC</h1></div></div><button onClick={onCerrarSesion} className="rounded-lg px-3 py-2 text-[10px] font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700">Cerrar sesión</button></div></div>
      <main className="mx-auto max-w-5xl px-6 py-8 sm:px-10">
        <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#0d1b2e] via-[#17415f] to-[#0c273c] p-7 text-white shadow-xl shadow-slate-900/10 sm:p-10"><div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" /><div className="relative max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[.25em] text-cyan-300">Sistema Integral de Gestión Institucional</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Todo lo importante de una ceremonia, en un solo lugar.</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-white/70">SIGIC fue pensado para acompañar a las instituciones antes, durante y después de cada ceremonia de colación. Centraliza la información, ordena las tareas y ayuda a que cada persona encuentre lo que necesita en el momento correcto.</p><div className="mt-7 flex flex-wrap gap-2 text-[10px] font-bold"><span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-cyan-100">Información ordenada</span><span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-cyan-100">Accesos seguros</span><span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-cyan-100">Trabajo colaborativo</span></div></div></section>
        <section className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><span className="text-2xl font-black text-sky-500">01</span><h3 className="mt-3 font-black text-slate-800">Prepará</h3><p className="mt-2 text-xs leading-5 text-slate-500">Cargá la ceremonia, su fecha, sede, graduados e invitados.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><span className="text-2xl font-black text-emerald-500">02</span><h3 className="mt-3 font-black text-slate-800">Coordiná</h3><p className="mt-2 text-xs leading-5 text-slate-500">Organizá butacas, equipos, accesos y responsabilidades.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><span className="text-2xl font-black text-amber-500">03</span><h3 className="mt-3 font-black text-slate-800">Acompañá</h3><p className="mt-2 text-xs leading-5 text-slate-500">Controlá el ingreso y seguí el desarrollo del evento en vivo.</p></div></section>
        <div className="mt-9 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-sky-600">Comenzá por acá</p><h3 className="mt-1 text-xl font-black text-slate-800">Herramientas de SIGIC</h3></div><span className="text-[10px] font-semibold text-slate-400">Sesión de {usuario?.nombre?.split(' ')?.[0] || 'administración'}</span></div>
        <section className="mt-4 grid gap-3 sm:grid-cols-2">{accesos.map(({ id, icono: Icono, titulo, texto }) => <button key={id} onClick={() => onNavegar(id)} className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100"><span className="rounded-xl bg-sky-50 p-3 text-sky-600 group-hover:bg-sky-500 group-hover:text-white"><Icono size={20} /></span><span><strong className="block text-sm font-black text-slate-800">{titulo}</strong><small className="mt-1 block text-xs leading-5 text-slate-500">{texto}</small></span><ChevronRight size={16} className="ml-auto mt-1 text-slate-300 group-hover:text-sky-500" /></button>)}</section>
        <p className="mt-9 text-center text-[10px] font-semibold text-slate-400">Desarrollado para el Instituto Tecnológico Beltrán · SIGIC 2026</p>
      </main>
    </div>
  )
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
      className="relative overflow-hidden rounded-2xl p-4 sm:p-4.5 flex items-center justify-between transition-all hover:scale-[1.01] duration-300 bg-white border border-slate-200/90 shadow-sm shadow-slate-200/50 hover:shadow-md hover:shadow-slate-300/40"
    >
      {/* Contenido izquierdo */}
      <div className="flex-1 min-w-0 pr-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="p-1.5 rounded-lg bg-slate-100/90 border border-slate-200 shadow-2xs" style={{ color }}>
            <Icono size={15} strokeWidth={2.5} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 truncate">
            {etiqueta}
          </p>
        </div>
        <p className="text-2xl sm:text-3xl font-black leading-none tracking-tight text-slate-900 tabular-nums my-1">
          {circularValue !== undefined ? `${contado}%` : contado}
        </p>
        <p className="text-[11px] font-semibold text-slate-500 truncate mt-0.5" title={descripcion}>
          {descripcion}
        </p>
      </div>

      {/* Gráfico circular o elemento visual a la derecha */}
      {circularValue !== undefined ? (
        <CircularProgress valor={valor} color={color} size={64} strokeWidth={6} />
      ) : (
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 shadow-inner shrink-0">
          <Icono size={22} style={{ color }} strokeWidth={2.2} />
          <div className="absolute inset-0 rounded-xl opacity-10 blur-xs" style={{ background: color }} />
        </div>
      )}
    </div>
  )
}

// ─── Bento Tarjeta Reloj y Clima ────────────────────────────────
function TarjetaRelojClima({ climaInfo, fechaActual, textoTemp, fondoConfig }) {
  const diaSemana = fechaActual.toLocaleDateString('es-AR', { weekday: 'long' })
  const dia = fechaActual.getDate()
  const mes = fechaActual.toLocaleDateString('es-AR', { month: 'long' })
  
  const horaHHmm = dayjs(fechaActual).format('HH:mm')
  const horaSS = dayjs(fechaActual).format('ss')

  const detalleClima = climaInfo ? obtenerDetalleClima(climaInfo.codigoClima) : { icono: CloudSun, descripcion: 'Cargando clima...' }
  const IconoClima = detalleClima.icono

  const colorPrincipal = fondoConfig?.colorPrincipal || ACCENT

  return (
    <div
      className="relative overflow-hidden rounded-[32px] p-6 flex flex-col justify-between text-white shadow-xl shadow-slate-950/20 min-h-[190px] border border-slate-800 bg-[#091524] transition-all duration-500"
    >
      {/* Efectos de luz decorativos de fondo */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 blur-xl transition-all duration-500" 
        style={{
          background: `radial-gradient(circle at top right, ${colorPrincipal}, transparent 70%)`
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none blur-2xl opacity-25" 
        style={{ background: '#0ea5e9' }}
      />

      {/* Cabecera: Reloj */}
      <div className="relative flex items-baseline justify-between">
        <div>
          <span className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums text-white drop-shadow-md">
            {horaHHmm}
          </span>
          <span 
            className="text-lg sm:text-xl font-bold ml-1.5 tabular-nums text-cyan-400 drop-shadow-sm"
          >
            :{horaSS}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 backdrop-blur-md shadow-xs">
          <span className="relative flex h-2 w-2">
            <span 
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-cyan-400"
            />
            <span 
              className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400"
            />
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-200">En Vivo</span>
        </div>
      </div>

      {/* Pie: Fecha y Clima */}
      <div className="relative mt-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-cyan-300 leading-none mb-1">
          {diaSemana}
        </p>
        <p className="text-lg font-black leading-tight text-white capitalize">
          {dia} de {mes}
        </p>
        
        {/* Info del Clima */}
        <div className="mt-3 flex items-center gap-2.5 bg-white/10 border border-white/15 rounded-2xl p-2.5 backdrop-blur-md">
          <div 
            className="p-1.5 rounded-xl flex items-center justify-center bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
          >
            <IconoClima size={18} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black leading-none text-white truncate">
              {textoTemp}
            </p>
            <p className="text-[9px] font-bold text-cyan-200/80 uppercase tracking-wider truncate mt-0.5">
              {detalleClima.descripcion}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Bento Tarjeta Cronograma / Agenda ──────────────────────────
function TarjetaCronograma({ proximas, backendOnline, colorPrincipal = ACCENT }) {
  return (
    <div className="bg-white border border-slate-100 shadow-md shadow-slate-100/50 rounded-[32px] p-6 flex flex-col justify-between h-full min-h-[350px]">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div 
            className="p-1.5 rounded-lg border"
            style={{ 
              backgroundColor: `${colorPrincipal}15`, 
              color: colorPrincipal,
              borderColor: `${colorPrincipal}30`
            }}
          >
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
              <div key={p.id} className="group flex items-center gap-3 bg-slate-50/70 hover:bg-slate-100/70 border border-slate-100 hover:border-slate-200 p-2.5 rounded-2xl transition-all duration-200">
                <div 
                  className="bg-white border border-slate-150 w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-black leading-tight flex-shrink-0"
                  style={{ color: colorPrincipal }}
                >
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

// ─── Botón de acceso rápido grande (adaptable a vistas: 'comoda', 'compacta', 'lista') ─────
function AccesoGrande({ icono: Icono, titulo, descripcion, pantalla, badge, destacado, onClick, colorPrincipal = ACCENT, modoVista = 'comoda' }) {
  const disponible = !pantalla ? false : true;

  // 1. MODO LISTA COMPRIMIDO
  if (modoVista === 'lista') {
    return (
      <button
        type="button"
        onClick={() => disponible && onClick(pantalla)}
        className={`group relative flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer text-left ${
          destacado
            ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-700 text-white shadow-sm'
            : 'bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-slate-300 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105"
            style={{
              backgroundColor: destacado ? 'rgba(255,255,255,0.1)' : `${colorPrincipal}15`,
              color: destacado ? '#ffffff' : colorPrincipal,
              borderColor: destacado ? 'rgba(255,255,255,0.15)' : `${colorPrincipal}30`
            }}
          >
            <Icono size={17} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black truncate ${destacado ? 'text-white' : 'text-slate-800'}`}>
                {titulo}
              </span>
              {badge && (
                <span
                  className="rounded-full px-2 py-0.2 text-[8px] font-black uppercase tracking-wider border shrink-0"
                  style={{
                    backgroundColor: destacado ? 'rgba(255,255,255,0.12)' : `${colorPrincipal}15`,
                    borderColor: destacado ? 'rgba(255,255,255,0.2)' : `${colorPrincipal}30`,
                    color: destacado ? '#ffffff' : colorPrincipal
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
            <p className={`text-[10.5px] truncate font-medium ${destacado ? 'text-slate-300' : 'text-slate-400'}`}>
              {descripcion}
            </p>
          </div>
        </div>

        <div className="shrink-0 pl-2">
          <ChevronRight
            size={14}
            className={`transition-transform duration-200 group-hover:translate-x-1 ${destacado ? 'text-slate-300' : 'text-slate-400'}`}
          />
        </div>
      </button>
    );
  }

  // 2. MODO COMPACTO (cuadros medianos muy estéticos)
  if (modoVista === 'compacta') {
    return (
      <button
        type="button"
        onClick={() => disponible && onClick(pantalla)}
        className={`group relative overflow-hidden rounded-2xl border p-3.5 sm:p-4 text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between ${
          destacado
            ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white shadow-md'
            : 'bg-white hover:bg-slate-50/70 border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-all group-hover:scale-105"
              style={{
                backgroundColor: destacado ? 'rgba(255,255,255,0.1)' : `${colorPrincipal}15`,
                color: destacado ? '#ffffff' : colorPrincipal,
                borderColor: destacado ? 'rgba(255,255,255,0.15)' : `${colorPrincipal}30`
              }}
            >
              <Icono size={17} />
            </div>

            {badge && (
              <span
                className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border"
                style={{
                  backgroundColor: destacado ? 'rgba(255,255,255,0.12)' : `${colorPrincipal}15`,
                  borderColor: destacado ? 'rgba(255,255,255,0.2)' : `${colorPrincipal}30`,
                  color: destacado ? '#ffffff' : colorPrincipal
                }}
              >
                {badge}
              </span>
            )}
          </div>

          <h4 className={`text-[12.5px] font-black leading-snug truncate ${destacado ? 'text-white' : 'text-slate-800'}`}>
            {titulo}
          </h4>
          <p className={`text-[10.5px] font-medium mt-1 leading-snug line-clamp-2 ${destacado ? 'text-slate-300' : 'text-slate-400'}`}>
            {descripcion}
          </p>
        </div>

        <div className={`mt-3 flex items-center justify-between pt-1.5 border-t border-slate-100/60 text-[9.5px] font-bold ${
          destacado ? 'text-slate-400' : 'text-slate-400'
        }`}>
          <span>Abrir módulo</span>
          <ChevronRight size={12} className="transition-transform group-hover:translate-x-1" />
        </div>
      </button>
    );
  }

  // 3. MODO CÓMODO / EXPANDIDO (Original pulido)
  return (
    <button
      type="button"
      onClick={() => disponible && onClick(pantalla)}
      className={`group relative overflow-hidden rounded-[24px] border p-5 text-left transition-all duration-300 ${
        disponible
          ? destacado
            ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white hover:shadow-xl hover:-translate-y-0.5 cursor-pointer'
            : 'bg-white border-slate-200/90 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
          : 'bg-slate-50/50 border-slate-100 opacity-55 cursor-default'
      }`}
    >
      {/* Destello de fondo en hover */}
      {disponible && (
        <div
          className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-[32px] opacity-0 transition-opacity duration-500 group-hover:opacity-25"
          style={{ background: colorPrincipal }}
        />
      )}

      {/* Ícono */}
      <div
        className={`mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-350 ${
          disponible
            ? destacado
              ? 'border border-white/10 group-hover:text-white group-hover:scale-110'
              : 'border group-hover:text-white group-hover:scale-110'
            : 'bg-slate-100 text-slate-400 border border-slate-200'
        }`}
        style={disponible ? {
          backgroundColor: destacado ? 'rgba(255,255,255,0.08)' : `${colorPrincipal}15`,
          color: colorPrincipal,
          borderColor: destacado ? 'rgba(255,255,255,0.1)' : `${colorPrincipal}30`
        } : undefined}
      >
        <Icono size={20} />
      </div>

      {/* Título + badge */}
      <div className="flex items-center gap-2 mb-1">
        <p className={`text-[13px] font-black ${disponible ? destacado ? 'text-white' : 'text-slate-800' : 'text-slate-400'}`}>
          {titulo}
        </p>
        {badge && (
          <span
            className="rounded-full px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider border"
            style={{
              backgroundColor: `${colorPrincipal}18`,
              borderColor: `${colorPrincipal}35`,
              color: colorPrincipal
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Descripción */}
      <p className={`text-[11px] font-semibold leading-normal ${disponible ? destacado ? 'text-slate-300' : 'text-slate-400' : 'text-slate-300'}`}>
        {descripcion}
      </p>

      {/* Flecha */}
      {disponible && (
        <ChevronRight
          size={14}
          className="absolute bottom-4 right-4 transition-all duration-300 group-hover:translate-x-1"
          style={{ color: colorPrincipal }}
        />
      )}
    </button>
  )
}

// ════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ════════════════════════════════════════════════════════════════
function BienvenidaBasica({ usuario, onCerrarSesion }) {
  return (
    <div className="min-h-full bg-[#f5f8fa] text-slate-800">
      <header className="border-b border-slate-200 bg-white px-6 py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><img src="/logo-oficial.png" alt="Logo SIGIC" className="h-9 w-9 rounded-xl object-cover" /><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-sky-600">Sistema Integral de Gestión Institucional</p><h1 className="text-lg font-black">Bienvenido a SIGIC</h1></div></div><span className="text-[10px] text-slate-400">{usuario?.nombre || 'Equipo de trabajo'}</span></div></header>
      <main className="mx-auto max-w-4xl px-6 py-8 sm:px-10"><section className="rounded-[28px] bg-gradient-to-br from-[#0d1b2e] to-[#1b5471] p-8 text-white shadow-xl"><p className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-300">Un lugar para trabajar mejor</p><h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">Organizar una ceremonia puede ser más simple.</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">SIGIC reúne en un mismo espacio la información y las tareas que el equipo necesita para preparar, acompañar y cerrar cada ceremonia.</p></section><section className="mt-6 grid gap-3 sm:grid-cols-3"><article className="rounded-2xl border border-slate-200 bg-white p-5"><span className="text-2xl font-black text-sky-500">01</span><h3 className="mt-3 font-black">Preparar</h3><p className="mt-2 text-xs leading-5 text-slate-500">Cargar la ceremonia y dejar todo listo.</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5"><span className="text-2xl font-black text-emerald-500">02</span><h3 className="mt-3 font-black">Acompañar</h3><p className="mt-2 text-xs leading-5 text-slate-500">Trabajar en equipo durante el evento.</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5"><span className="text-2xl font-black text-amber-500">03</span><h3 className="mt-3 font-black">Resolver</h3><p className="mt-2 text-xs leading-5 text-slate-500">Tener la información a mano cuando hace falta.</p></article></section><p className="mt-8 text-center text-[10px] text-slate-400">Las herramientas están disponibles en los iconos del escritorio.</p><div className="mt-3 text-center"><button onClick={onCerrarSesion} className="text-[10px] font-bold text-slate-400 hover:text-sky-600">Cerrar sesión</button></div></main>
    </div>
  )
}


// ─── Circuito Operativo Guiado (Paso a Paso Cronológico) ────────
function CircuitoOperativoPasos({ ceremonia, onNavegar, onAbrirCrearCircuito, onIniciarModoPrueba, colorPrincipal }) {
  const [expandido, setExpandido] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_circuito_expandido') !== 'false' : true));

  const totalEgresados = Number(ceremonia?.total_egresados || 0);
  const invitacionesEnviadas = Number(ceremonia?.invitaciones_enviadas || 0);
  const egresadosConfirmados = Number(ceremonia?.egresados_confirmados || 0);
  const respuestasPendientes = Number(ceremonia?.respuestas_pendientes || 0);
  const planoConfigurado = Boolean(ceremonia?.plano_configurado || ceremonia?.egresados_con_butaca);
  const estadoOperativo = ceremonia?.estado_operativo;

  // Evaluación de estado de cada paso
  const paso1Completado = Boolean(ceremonia?.id);
  const paso2Completado = totalEgresados > 0;
  const paso3Completado = totalEgresados > 0 && invitacionesEnviadas >= totalEgresados;
  const paso4Completado = planoConfigurado;
  const paso5Completado = estadoOperativo === 'FINALIZADA';

  // Determinación de paso activo sugerido
  let pasoActivo = 1;
  if (!paso1Completado) pasoActivo = 1;
  else if (!paso2Completado) pasoActivo = 2;
  else if (!paso3Completado) pasoActivo = 3;
  else if (!paso4Completado) pasoActivo = 4;
  else pasoActivo = 5;

  const pasos = [
    {
      numero: '01',
      etiqueta: 'INICIAR',
      titulo: 'Ceremonia',
      detalle: ceremonia?.nombre ? (ceremonia.nombre.length > 24 ? ceremonia.nombre.slice(0, 24) + '...' : ceremonia.nombre) : 'Fecha, lugar y cupos',
      destino: 'gestion-ceremonias',
      icono: CalendarPlus,
      color: 'indigo',
      completado: paso1Completado,
      activo: pasoActivo === 1
    },
    {
      numero: '02',
      etiqueta: 'PADRÓN',
      titulo: 'Graduados',
      detalle: totalEgresados > 0 ? `${totalEgresados} graduados cargados` : 'Importar nómina Excel',
      destino: 'gestion-graduados',
      icono: GraduationCap,
      color: 'emerald',
      completado: paso2Completado,
      activo: pasoActivo === 2
    },
    {
      numero: '03',
      etiqueta: 'CONVOCAR',
      titulo: 'Invitaciones',
      detalle: invitacionesEnviadas > 0 ? `${invitacionesEnviadas} enviadas (${egresadosConfirmados} confirmados)` : 'Despachar correos OTP',
      destino: 'convocatoria',
      icono: Send,
      color: 'blue',
      completado: paso3Completado,
      activo: pasoActivo === 3
    },
    {
      numero: '04',
      etiqueta: 'BUTACAS',
      titulo: 'Anfiteatro',
      detalle: planoConfigurado ? 'Distribución asignada' : 'Auto-Seating en 1 clic',
      destino: 'seleccion-asientos',
      icono: Armchair,
      color: 'cyan',
      completado: paso4Completado,
      activo: pasoActivo === 4
    },
    {
      numero: '05',
      etiqueta: 'EN VIVO',
      titulo: 'Acreditación',
      detalle: estadoOperativo === 'FINALIZADA' ? 'Ceremonia concluida' : 'Escáner QR y portería',
      destino: 'control-ingreso',
      icono: ScanLine,
      color: 'amber',
      completado: paso5Completado,
      activo: pasoActivo === 5
    }
  ];

  return (
    <div className={`bg-white border border-slate-200/90 rounded-[28px] sm:rounded-[32px] shadow-md shadow-slate-200/30 transition-all duration-300 ${
      expandido ? 'p-5 sm:p-6' : 'p-4 sm:p-5'
    }`}>
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
        expandido ? 'pb-4 mb-5 border-b border-slate-100' : 'pb-0 mb-0'
      }`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
            <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-slate-800">
              Circuito Operativo de Colación
            </h3>
            <span className="text-[9.5px] px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-200">
              Paso a Paso Oficial
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-500 mt-1">
            Seguí el orden cronológico institucional para completar la organización de la ceremonia de principio a fin.
          </p>
        </div>

        {/* Acciones Rápidas: Tamaño, Modo Prueba y Nuevo Circuito */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Botón para Agrandar / Achicar con animación estilo interruptor */}
          <button
            type="button"
            onClick={() => {
              const nuevo = !expandido;
              setExpandido(nuevo);
              if (typeof window !== 'undefined') {
                localStorage.setItem('sigic_circuito_expandido', String(nuevo));
              }
            }}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            title={expandido ? "Achicar vista del circuito" : "Agrandar vista del circuito"}
          >
            {/* Indicador animado */}
            <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors duration-300 ${
              expandido ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {expandido ? (
                <Minimize2 size={12} className="transition-transform duration-300 group-hover:scale-110" />
              ) : (
                <Maximize2 size={12} className="transition-transform duration-300 group-hover:scale-110" />
              )}
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
              {expandido ? 'Achicar' : 'Agrandar'}
            </span>
          </button>

          {onIniciarModoPrueba && (
            <button
              type="button"
              onClick={onIniciarModoPrueba}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Cargar circuito simulado con datos de prueba realistas"
            >
              <Sparkles size={13} className="text-indigo-600" />
              <span>Modo Prueba</span>
            </button>
          )}

          <button
            type="button"
            onClick={onAbrirCrearCircuito}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-sky-600 text-white text-xs font-black shadow-md shadow-slate-900/10 transition-all active:scale-95 cursor-pointer"
            title="Crear y activar un nuevo circuito de colación"
          >
            <CalendarPlus size={13} />
            <span>+ Nuevo Circuito</span>
          </button>
        </div>
      </div>

      {/* Grid de Pasos con transición fluida al agrandar / achicar */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
        expandido ? 'opacity-100 max-h-[1000px] mt-0' : 'opacity-100 max-h-[800px] mt-4'
      }`}>
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 transition-all duration-300 ${
          expandido ? 'gap-3.5' : 'gap-2'
        }`}>
          {pasos.map((paso, idx) => {
            const Icono = paso.icono;
            return (
              <button
                key={paso.numero}
                type="button"
                onClick={() => onNavegar(paso.destino)}
                className={`group relative text-left rounded-2xl border transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                  expandido ? 'p-4' : 'p-2.5 sm:p-3'
                } ${
                  paso.activo
                    ? 'bg-gradient-to-b from-sky-50/80 to-white border-sky-300 shadow-md ring-2 ring-sky-500/20'
                    : paso.completado
                    ? 'bg-slate-50/80 hover:bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                    : 'bg-white hover:bg-slate-50/60 border-slate-200/60 hover:border-slate-300'
                }`}
              >
                {/* Badge superior */}
                <div className={`flex items-center justify-between ${expandido ? 'mb-2.5' : 'mb-1.5'}`}>
                  <span className={`text-[10px] font-black font-mono tracking-wider ${
                    paso.activo ? 'text-sky-600' : paso.completado ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {paso.numero}. {paso.etiqueta}
                  </span>
                  
                  {paso.completado ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-2xs">
                      <CheckCircle2 size={13} strokeWidth={2.5} />
                    </span>
                  ) : paso.activo ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600 shadow-2xs animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                    </span>
                  ) : (
                    <Icono size={15} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  )}
                </div>

                {/* Título */}
                <h4 className={`font-black text-slate-800 tracking-tight group-hover:text-sky-600 transition-colors ${
                  expandido ? 'text-[13px]' : 'text-xs'
                }`}>
                  {paso.titulo}
                </h4>

                {/* Detalle (en modo achicado se muestra resumido o en 1 línea) */}
                <p className={`font-medium text-slate-500 leading-snug ${
                  expandido ? 'text-[10.5px] mt-1 line-clamp-2' : 'text-[10px] mt-0.5 truncate'
                }`}>
                  {paso.detalle}
                </p>

                {/* Flecha indicadora */}
                <div className={`flex items-center justify-between border-t border-slate-100/80 text-[10px] font-bold text-slate-400 group-hover:text-sky-600 ${
                  expandido ? 'mt-3 pt-2' : 'mt-2 pt-1.5'
                }`}>
                  <span>{paso.activo ? 'Ir al paso' : paso.completado ? 'Revisar' : 'Configurar'}</span>
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PantallaBienvenida({ usuario, onCerrarSesion, onNavegar, onCambiarVersion, onCambiarEstiloInterfaz }) {
  const [fechaActual, setFechaActual]       = useState(() => new Date())
  const [temperatura, setTemperatura]       = useState(null)
  const [modalPermisos, setModalPermisos]   = useState(false)
  const [modalSesion, setModalSesion]       = useState(false)
  const [modalCrearCircuito, setModalCrearCircuito] = useState(false)
  const [permisos, setPermisos]             = useState({ ubicacion: 'prompt', notificaciones: 'prompt' })

  // Stats, Config y Ceremonias
  const [stats, setStats]                   = useState(null)
  const [config, setConfig]                 = useState({})
  const [ceremonias, setCeremonias]         = useState([])
  const [cargandoStats, setCargandoStats]   = useState(true)
  const [backendOnline, setBackendOnline]   = useState(true)
  const [mostrarMetricas, setMostrarMetricas] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_mostrar_metricas') !== 'false' : true))
  const [modoVistaAccesos, setModoVistaAccesos] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_vista_accesos') || 'comoda' : 'comoda'))

  const logoInstitucional = '/footer.png'

  const [climaInfo, setClimaInfo] = useState(null)

  // ── Gestión dinámica de temas y fondos para la Versión 1 ──
  const [fondoId, setFondoId] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_fondo') || 'beltran' : 'beltran'))
  const [cuadriculaActiva, setCuadriculaActiva] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_cuadricula') !== 'false' : true))
  const [marcaAguaActiva, setMarcaAguaActiva] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sigic_marca_agua') !== 'false' : true))

  const fondoConfig = FONDOS_DISPONIBLES.find(f => f.id === fondoId) || FONDOS_DISPONIBLES[0]

  useEffect(() => {
    const handleFondo = (e) => {
      if (e.detail) setFondoId(e.detail)
    }
    const handleCuadricula = (e) => {
      if (typeof e.detail === 'boolean') setCuadriculaActiva(e.detail)
    }
    const handleMarcaAgua = (e) => {
      if (typeof e.detail === 'boolean') setMarcaAguaActiva(e.detail)
    }
    window.addEventListener('sigic-fondo-cambiado', handleFondo)
    window.addEventListener('sigic-cuadricula-cambiada', handleCuadricula)
    window.addEventListener('sigic-marca-agua-cambiada', handleMarcaAgua)
    return () => {
      window.removeEventListener('sigic-fondo-cambiado', handleFondo)
      window.removeEventListener('sigic-cuadricula-cambiada', handleCuadricula)
      window.removeEventListener('sigic-marca-agua-cambiada', handleMarcaAgua)
    }
  }, [])

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

  // ── Geolocalización de clima (con detección segura de permisos) ──
  useEffect(() => {
    let montado = true

    async function obtenerUbicacionSegura() {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        if (montado) cargarClima(ubicacionPorDefecto.latitud, ubicacionPorDefecto.longitud)
        return
      }

      try {
        // Verificar Permissions-Policy o estado de permisos antes de llamar para evitar violación de política
        if ('permissions' in navigator && navigator.permissions.query) {
          try {
            const estado = await navigator.permissions.query({ name: 'geolocation' })
            if (estado.state === 'denied') {
              if (montado) {
                actualizarPermiso('ubicacion', 'denied')
                cargarClima(ubicacionPorDefecto.latitud, ubicacionPorDefecto.longitud)
              }
              return
            }
          } catch {
            // Si la consulta falla (e.g. política restrictiva), continuar de forma segura
          }
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!montado) return
            actualizarPermiso('ubicacion', 'granted')
            cargarClima(pos.coords.latitude, pos.coords.longitude)
          },
          () => {
            if (!montado) return
            cargarClima(ubicacionPorDefecto.latitud, ubicacionPorDefecto.longitud)
          },
          { timeout: 4000, maximumAge: 600000 }
        )
      } catch {
        if (montado) cargarClima(ubicacionPorDefecto.latitud, ubicacionPorDefecto.longitud)
      }
    }

    obtenerUbicacionSegura()
    return () => { montado = false }
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


  const esSoporte = usuario?.correo && usuario.correo.toLowerCase() === 'soporte@ibeltran.com.ar'

  // Accesos rápidos del panel
  const accesos = [
    {
      icono: ScanLine,
      titulo: 'Control de Ingreso',
      descripcion: 'Módulo de portería: escaneo de QRs y check-in de invitados',
      pantalla: 'control-ingreso',
      badge: 'Abrir escáner',
      destacado: true,
    },
    {
      icono: Users,
      titulo: 'Gestionar Graduados',
      descripcion: 'Alta de graduados, flujo de trabajo y listado general',
      pantalla: 'gestion-graduados',
      badge: 'Uso frecuente',
      destacado: true,
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
      icono: Shield,
      titulo: 'Personal de Seguridad',
      descripcion: 'Crear cuentas y autorizar quién trabaja en cada ceremonia',
      pantalla: 'gestion-porteria',
      badge: 'Cuentas',
    },
    {
      icono: Settings,
      titulo: 'Ajustes del Sistema',
      descripcion: 'Preferencias generales, identidad y reglas de la ceremonia',
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
    {
      icono: Server,
      titulo: 'Centro de Control',
      descripcion: 'Estado del servidor cloud, latencias, base de datos Neon y backups',
      pantalla: 'centro-control',
      badge: 'Nube',
    },
  ]


  if (cargandoStats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] select-none">
        <div className="text-center space-y-5 p-10 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-100/50">
          {/* Double ring orbit spinner */}
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-t-[#0ea5e9] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
            <div className="absolute inset-1.5 rounded-full border-4 border-b-indigo-500 border-t-transparent border-r-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />
            <img 
              src="/logo-oficial.png" 
              alt="SiGIC" 
              className="h-8 w-auto object-contain animate-pulse z-10 filter drop-shadow-[0_0_8px_rgba(14,165,233,0.4)]" 
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-700">Iniciando Centro de Control</p>
            <p className="text-[8px] font-bold text-sky-500 uppercase tracking-widest animate-pulse">Sincronizando Entornos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="relative min-h-screen font-sans transition-colors duration-500 overflow-x-hidden" 
      style={{ 
        backgroundColor: fondoConfig.tipo === 'claro' ? '#F8FAFC' : '#0B1320' 
      }}
    >
      {/* Gradiente dinámico reactivo al tema elegido */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-700" 
        style={{
          background: fondoConfig.tipo === 'claro'
            ? `radial-gradient(ellipse at top, ${fondoConfig.colores[0]}40, #F8FAFC 70%)`
            : `radial-gradient(ellipse at top, ${fondoConfig.colores[1]}55, ${fondoConfig.colores[0]} 70%)`,
          opacity: 0.95
        }}
      />

      {/* Cuadrícula Tecnológica configurable */}
      {cuadriculaActiva && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
          style={{
            backgroundImage: `linear-gradient(${fondoConfig.colorPrincipal}18 1px, transparent 1px), linear-gradient(90deg, ${fondoConfig.colorPrincipal}18 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
            maskImage: 'linear-gradient(to bottom, black, transparent 90%)'
          }}
        />
      )}

      {/* Marca de Agua Beltrán configurable */}
      {marcaAguaActiva && (
        <div className="sigic-watermark" aria-hidden="true" style={{ opacity: 0.05 }}>
          <img src="/logo-oficial.png" alt="" />
          <span>SIGIC</span>
          <small>Sistema Integral de Gestión Institucional</small>
        </div>
      )}

      <div className="relative z-10">
        <HeaderGlobal 
          titulo="Inicio administrativo"
          subtitulo="Panel Clásico SiGIC"
          usuario={usuario}
          onCerrarSesion={onCerrarSesion}
          onCambiarVersion={onCambiarVersion}
          onCambiarEstiloInterfaz={onCambiarEstiloInterfaz}
        />

      {/* ══ CONTENIDO ════════════════════════════════════════════ */}
      <main className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24">
        <div className="flex flex-col gap-4 sm:gap-6">

          {/* CIRCUITO OPERATIVO GUIADO PASO A PASO (Reemplaza el banner estático) */}
          <CircuitoOperativoPasos
            ceremonia={ceremoniaActiva}
            onNavegar={onNavegar}
            onAbrirCrearCircuito={() => setModalCrearCircuito(true)}
            onIniciarModoPrueba={() => {
              window.dispatchEvent(new CustomEvent('sigic-iniciar-demo'));
            }}
            colorPrincipal={fondoConfig.colorPrincipal}
          />

          {/* PRIMERA FILA BENTO: Saludo (3/4) + Clima y Reloj (1/4) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Bienvenida y ceremonia activa */}
            <section className="lg:col-span-3 bg-white border border-slate-200/90 shadow-md shadow-slate-200/40 rounded-[28px] sm:rounded-[32px] overflow-hidden"
            >
              <div className="relative p-5 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 h-full min-h-[190px]">
                <div 
                  className="absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none opacity-20"
                  style={{ background: fondoConfig.colorPrincipal }}
                />
                
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 sm:mb-2"
                    style={{ color: fondoConfig.colorPrincipal }}
                  >
                    Todo listo para comenzar
                  </p>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">
                    Hola, {usuario?.nombre?.split(' ')?.[0] || 'Administrador'}
                  </h1>
                  <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-semibold text-slate-600">Estás trabajando en <strong className="text-slate-900">{ceremoniaActiva?.nombre || config.nombre_evento || 'la ceremonia principal'}</strong>.</p>

                  <div className="mt-3.5 sm:mt-4 flex flex-wrap gap-2 text-[10.5px] sm:text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-slate-700">
                      <Calendar size={13} style={{ color: fondoConfig.colorPrincipal }} className="shrink-0" />
                      {ceremoniaActiva ? new Date(ceremoniaActiva.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-slate-700">
                      <MapPin size={13} style={{ color: fondoConfig.colorPrincipal }} className="shrink-0" />
                      {ceremoniaActiva?.lugar || 'Sede Beltrán'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-stretch md:items-end justify-center gap-3 shrink-0">
                  <div className="inline-flex self-start md:self-end items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 px-3.5 sm:px-4.5 py-1.5 sm:py-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      Sesión protegida
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <button 
                      onClick={() => onNavegar('control-ingreso')} 
                      className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md transition active:scale-95 cursor-pointer hover:opacity-90"
                      style={{ 
                        backgroundColor: fondoConfig.colorPrincipal,
                        boxShadow: `0 4px 14px ${fondoConfig.colorPrincipal}40`
                      }}
                    >
                      <ScanLine size={14} /> Controlar ingresos
                    </button>
                    <button onClick={() => onNavegar('gestion-graduados')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-600 transition hover:border-slate-300 hover:text-slate-800 active:scale-95 cursor-pointer">
                      <Users size={14} /> Ver graduados
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Reloj y Clima */}
            <TarjetaRelojClima
              climaInfo={climaInfo}
              fechaActual={fechaActual}
              textoTemp={textoTemp}
              fondoConfig={fondoConfig}
            />

          </div>

          {/* BARRA DE CONTROL DE MÉTRICAS (TOGGLE VISIBILIDAD) */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Indicadores en Tiempo Real
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <button
              type="button"
              onClick={() => {
                const nuevo = !mostrarMetricas;
                setMostrarMetricas(nuevo);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('sigic_mostrar_metricas', String(nuevo));
                }
              }}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all duration-300 text-slate-600 hover:text-slate-900 cursor-pointer backdrop-blur-md active:scale-95"
              title={mostrarMetricas ? "Ocultar panel de métricas" : "Mostrar panel de métricas"}
            >
              {/* Interruptor animado estilo slider similar al Theme Toggler */}
              <div 
                className={`relative w-8 h-4.5 rounded-full transition-colors duration-300 flex items-center p-0.5 ${
                  mostrarMetricas ? 'bg-sky-500' : 'bg-slate-300'
                }`}
              >
                <div 
                  className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform duration-300 flex items-center justify-center ${
                    mostrarMetricas ? 'translate-x-3.5' : 'translate-x-0'
                  }`}
                >
                  {mostrarMetricas ? (
                    <Eye size={9} className="text-sky-600" />
                  ) : (
                    <EyeOff size={9} className="text-slate-400" />
                  )}
                </div>
              </div>

              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                {mostrarMetricas ? 'Ocultar Cuadros' : 'Mostrar Cuadros'}
              </span>

              <ChevronDown 
                size={13} 
                className={`text-slate-400 transition-transform duration-300 ${mostrarMetricas ? 'rotate-180' : 'rotate-0'}`} 
              />
            </button>
          </div>

          {/* SEGUNDA FILA BENTO: Tarjetas de estadísticas (4 columnas uniformes y comprimidas) */}
          <div 
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              mostrarMetricas 
                ? 'opacity-100 max-h-[600px] transform translate-y-0' 
                : 'opacity-0 max-h-0 pointer-events-none transform -translate-y-3'
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 pt-1">
              {!backendOnline ? (
                <div
                  className="col-span-1 sm:col-span-2 lg:col-span-4 flex items-center gap-3.5 rounded-2xl border px-5 py-4 bg-red-50 border-red-150 text-red-500"
                >
                  <WifiOff size={18} className="animate-bounce" />
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-wide">Servidor Desconectado</p>
                    <p className="text-[10.5px] font-semibold text-red-400 mt-0.5">Por favor, ejecutá el comando de backend para obtener métricas reales.</p>
                  </div>
                </div>
              ) : (
                <>
                  <BentoStatCard
                    icono={GraduationCap}
                    etiqueta="Graduados"
                    valor={stats?.totalEgresados ?? 0}
                    color={fondoConfig.colorPrincipal}
                    descripcion="Registrados en ceremonia"
                  />
                  <BentoStatCard
                    icono={Users}
                    etiqueta="Invitados totales"
                    valor={stats?.totalInvitados ?? 0}
                    color={fondoConfig.colores[1] || '#6366f1'}
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
                    color={fondoConfig.colorPrincipal}
                    descripcion="Porcentaje de asistencia"
                    circularValue={stats?.porcentajeOcupacion ?? 0}
                  />
                </>
              )}
            </div>
          </div>

          {/* TERCERA FILA BENTO: Accesos Rápidos (3/4) + Agenda / Timeline (1/4) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Contenedor de Accesos rápidos */}
            <div
              className="lg:col-span-3 bg-white border border-slate-100 shadow-md shadow-slate-100/50 rounded-[32px] overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-lg border"
                      style={{ 
                        backgroundColor: `${fondoConfig.colorPrincipal}15`, 
                        color: fondoConfig.colorPrincipal,
                        borderColor: `${fondoConfig.colorPrincipal}30`
                      }}
                    >
                      <LayoutGrid size={14} />
                    </div>
                    <div>
                      <span className="block text-[12px] font-black text-slate-800">¿Qué necesitás hacer?</span>
                      <span className="block text-[9.5px] font-semibold text-slate-400 mt-0.5">Elegí una opción para continuar</span>
                    </div>
                  </div>

                  {/* Selector Animado de Formas de Vista (Cómoda, Compacta, Lista) */}
                  <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-200 shadow-2xs gap-1 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setModoVistaAccesos('comoda');
                        if (typeof window !== 'undefined') localStorage.setItem('sigic_vista_accesos', 'comoda');
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        modoVistaAccesos === 'comoda'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Vista Cómoda (Tarjetas Grandes)"
                    >
                      <Grid3X3 size={12} />
                      <span className="hidden sm:inline">Cómoda</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModoVistaAccesos('compacta');
                        if (typeof window !== 'undefined') localStorage.setItem('sigic_vista_accesos', 'compacta');
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        modoVistaAccesos === 'compacta'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Vista Compacta (Tarjetas Medianas)"
                    >
                      <LayoutGrid size={12} />
                      <span className="hidden sm:inline">Compacta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModoVistaAccesos('lista');
                        if (typeof window !== 'undefined') localStorage.setItem('sigic_vista_accesos', 'lista');
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        modoVistaAccesos === 'lista'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Vista de Lista Comprimida (Filas Elegantes)"
                    >
                      <List size={12} />
                      <span className="hidden sm:inline">Lista</span>
                    </button>
                  </div>
                </div>
                
                <div className={`transition-all duration-300 ${
                  modoVistaAccesos === 'lista'
                    ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 sm:p-5'
                    : modoVistaAccesos === 'compacta'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 sm:p-5'
                    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6'
                }`}>
                  {accesos
                    .filter(a => {
                      if (esSoporte) {
                        return ['gestion-porteria', 'gestion-ceremonias', 'centro-control'].includes(a.pantalla)
                      }
                      return a.pantalla !== 'centro-control'
                    })
                    .map(a => (
                      <AccesoGrande
                        key={a.titulo}
                        {...a}
                        onClick={onNavegar}
                        colorPrincipal={fondoConfig.colorPrincipal}
                        modoVista={modoVistaAccesos}
                      />
                    ))}
                </div>
              </div>

              {/* Pie de accesos */}
              <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/10 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                <span>SiGIC · Administración de ceremonias</span>
                <span className="flex items-center gap-1.5">
                  <span 
                    className="h-1.5 w-1.5 rounded-full animate-pulse" 
                    style={{ backgroundColor: fondoConfig.colorPrincipal }}
                  />
                  Sistema disponible
                </span>
              </div>
            </div>

            {/* Agenda del Evento */}
            <TarjetaCronograma
              proximas={proximas}
              backendOnline={backendOnline}
              colorPrincipal={fondoConfig.colorPrincipal}
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
      <ModalCrearCircuito
        abierto={modalCrearCircuito}
        onCerrar={() => setModalCrearCircuito(false)}
        onCircuitoCreado={(nueva) => {
          cargarDatos();
          if (nueva) {
            window.dispatchEvent(new CustomEvent('sigic-ceremonia-cambiada', { detail: nueva }));
          }
        }}
        onIniciarModoPrueba={() => {
          window.dispatchEvent(new CustomEvent('sigic-iniciar-demo'));
        }}
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
    </div>
  )
}

