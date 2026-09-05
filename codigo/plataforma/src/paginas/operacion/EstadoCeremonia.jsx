import { useEffect, useState } from 'react'
import { Activity, CalendarDays, ChevronRight, CircleAlert, Clock3, GraduationCap, MapPin, Radio, RefreshCw, TrendingUp, UsersRound, UserRoundCheck, UserRoundX, FileText } from 'lucide-react'
import { BASE, cabeceras, obtenerGraduados } from '../../servicios/api'
import { ModalActaCierre } from '../../componentes/ModalActaCierre'

const intervaloActualizacion = 15000

function estadoDeFecha(fecha) {
  if (!fecha) return { etiqueta: 'Sin fecha', clase: 'bg-slate-100 text-slate-600' }
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const fechaCeremonia = new Date(`${String(fecha).slice(0, 10)}T00:00:00`)
  if (fechaCeremonia.getTime() === hoy.getTime()) return { etiqueta: 'En curso hoy', clase: 'bg-emerald-100 text-emerald-700' }
  if (fechaCeremonia > hoy) return { etiqueta: 'Próxima ceremonia', clase: 'bg-sky-100 text-sky-700' }
  return { etiqueta: 'Ceremonia finalizada', clase: 'bg-slate-100 text-slate-600' }
}

function formatearFecha(fecha) {
  if (!fecha) return 'Fecha a definir'
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${String(fecha).slice(0, 10)}T12:00:00`))
}

function TarjetaMetrica({ icono: Icono, etiqueta, valor, detalle, tono }) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">{etiqueta}</p>
          <strong className="mt-0.5 block text-xl font-black tracking-tight text-slate-900 tabular-nums">{valor}</strong>
        </div>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tono}`}>
          <Icono size={15} />
        </span>
      </div>
      <p className="mt-1 text-[10px] font-medium text-slate-500 truncate">{detalle}</p>
    </article>
  )
}

function GraficoIngresos({ datos = [] }) {
  const maximo = Math.max(1, ...datos.map(item => Number(item.total) || 0))
  const puntos = datos.map((item, indice) => `${(indice / 23) * 100},${92 - ((Number(item.total) || 0) / maximo) * 72}`).join(' ')
  const total = datos.reduce((acumulado, item) => acumulado + (Number(item.total) || 0), 0)
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-black text-slate-900">Tendencia de acreditaciones</h3>
          <p className="text-[10px] text-slate-500">Ingresos registrados por hora</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-cyan-700">
          <TrendingUp size={11} /> {total} hoy
        </span>
      </div>
      <div className="mt-3 h-28">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible" role="img" aria-label="Tendencia horaria de ingresos">
          <defs>
            <linearGradient id="areaIngresos" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity=".25" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M 0,92 L ${puntos} L 100,92 Z`} fill="url(#areaIngresos)" />
          <line x1="0" x2="100" y1="92" y2="92" stroke="#e2e8f0" strokeWidth=".7" />
          <line x1="0" x2="100" y1="56" y2="56" stroke="#f1f5f9" strokeWidth=".5" strokeDasharray="2 2" />
          <line x1="0" x2="100" y1="20" y2="20" stroke="#f1f5f9" strokeWidth=".5" strokeDasharray="2 2" />
          <polyline points={puntos} fill="none" stroke="#0284c7" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-1">
        <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span>
      </div>
    </article>
  )
}

export function EstadoCeremonia({ onVolver, onNavegar }) {
  const [estado, setEstado] = useState(null)
  const [graduados, setGraduados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [actualizando, setActualizando] = useState(false)
  const [mostrarActa, setMostrarActa] = useState(false)

  async function cargar({ silencioso = false } = {}) {
    if (!silencioso) setCargando(true)
    setActualizando(true)
    try {
      const [respuestaStats, datosGraduados] = await Promise.all([
        fetch(`${BASE}/stats`, { headers: cabeceras() }),
        obtenerGraduados().catch(() => [])
      ])
      const datos = await respuestaStats.json()
      if (!respuestaStats.ok) throw new Error(datos.error || 'No se pudo consultar el estado de la ceremonia.')
      setEstado(datos)
      setGraduados(datosGraduados)
      setError('')
    } catch (err) { setError(err.message || 'No se pudo actualizar el tablero.') }
    finally { setCargando(false); setActualizando(false) }
  }

  useEffect(() => {
    cargar()
    const timer = window.setInterval(() => cargar({ silencioso: true }), intervaloActualizacion)
    return () => window.clearInterval(timer)
  }, [])

  const ceremonia = estado?.ceremonia
  const fase = estadoDeFecha(ceremonia?.fecha)
  const asistentesEsperados = (estado?.totalEgresados || 0) + (estado?.totalInvitados || 0)
  const asistenciaConfirmada = estado?.presentes || 0

  return (
    <div className="mx-auto w-full max-w-6xl p-3 sm:p-5 font-sans">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sky-400 shadow-sm">
            <Activity size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900">Estado de la ceremonia</h1>
              <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                <Radio size={9} className="animate-pulse" /> En vivo
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Monitoreo y telemetría de accesos en tiempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            id="btn-abrir-acta-oficial" 
            onClick={() => setMostrarActa(true)} 
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-wider text-white shadow-xs transition cursor-pointer"
          >
            <FileText size={12} /> Acta Oficial (PDF)
          </button>
          <button 
            onClick={() => cargar()} 
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-600 transition hover:border-sky-300 hover:text-sky-700 cursor-pointer"
          >
            <RefreshCw size={11} className={actualizando ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button 
            onClick={onVolver} 
            className="rounded-lg bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-wider text-white cursor-pointer"
          >
            Volver
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          <CircleAlert size={14} />{error}
        </div>
      )}

      {cargando ? (
        <div className="grid min-h-[280px] place-items-center rounded-2xl border border-slate-100 bg-white">
          <RefreshCw className="animate-spin text-sky-500" size={22} />
        </div>
      ) : !ceremonia ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <CalendarDays className="mx-auto text-slate-300" size={26} />
          <h2 className="mt-2 text-sm font-black text-slate-800">No hay una ceremonia activa</h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">Activá una ceremonia desde el módulo para comenzar a medir la operación.</p>
          <button onClick={() => onNavegar('gestion-ceremonias')} className="mt-4 rounded-lg bg-sky-500 hover:bg-sky-600 px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-wider text-white cursor-pointer">
            Gestionar ceremonias
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Banner compacto de ceremonia activa */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#07162a] via-[#092f4c] to-[#0a4869] p-4 text-white shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${fase.clase}`}>
                    {fase.etiqueta}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-sky-300">Entorno en curso</span>
                </div>
                <h2 className="mt-1 text-xl sm:text-2xl font-black tracking-tight truncate">{ceremonia.nombre}</h2>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={12} className="text-sky-300" />
                    {formatearFecha(ceremonia.fecha)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} className="text-sky-300" />
                    {ceremonia.lugar || 'Lugar a definir'}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-sky-300/20 bg-white/10 px-4 py-2 text-right backdrop-blur shrink-0">
                <p className="text-[8.5px] font-black uppercase tracking-wider text-sky-200">Acreditaciones</p>
                <strong className="block text-2xl font-black text-sky-100 tabular-nums">{asistenciaConfirmada}</strong>
                <span className="text-[9.5px] font-bold text-slate-300">{estado.porcentajeAsistencia}% del total</span>
              </div>
            </div>
          </section>

          {/* 4 Métricas compactas */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <TarjetaMetrica 
              icono={GraduationCap} 
              etiqueta="Egresados" 
              valor={estado.totalEgresados} 
              detalle={`${estado.egresadosConfirmados} confirmados · ${estado.egresadosPendientes} pend.`} 
              tono="bg-sky-50 text-sky-600" 
            />
            <TarjetaMetrica 
              icono={UsersRound} 
              etiqueta="Acompañantes" 
              valor={estado.totalInvitados} 
              detalle={`${estado.ausentes} sin acreditar`} 
              tono="bg-violet-50 text-violet-600" 
            />
            <TarjetaMetrica 
              icono={UserRoundCheck} 
              etiqueta="Grupos Ingresados" 
              valor={estado.gruposConIngreso} 
              detalle={`${estado.presentes} acreditados en sala`} 
              tono="bg-emerald-50 text-emerald-600" 
            />
            <TarjetaMetrica 
              icono={UserRoundX} 
              etiqueta="Total Pendientes" 
              valor={estado.ausentes} 
              detalle={`${asistentesEsperados} total padrón`} 
              tono="bg-amber-50 text-amber-600" 
            />
          </section>

          {/* Fila central: Métricas de Operación + Tendencia Horaria + Ingresos por Vínculo */}
          <section className="grid gap-3 lg:grid-cols-12">
            <article className="lg:col-span-3 rounded-xl border border-slate-200/80 bg-white shadow-xs p-3.5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900">Métricas de operación</h3>
                <p className="text-[10px] text-slate-500">Resumen porcentual de sala</p>
              </div>
              <div className="grid grid-cols-2 gap-2 my-2">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[8.5px] font-bold uppercase text-slate-400">Confirmación</span>
                  <strong className="mt-0.5 block text-lg font-black text-slate-900">
                    {estado.totalEgresados ? Math.round((estado.egresadosConfirmados / estado.totalEgresados) * 100) : 0}%
                  </strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[8.5px] font-bold uppercase text-slate-400">Asistencia</span>
                  <strong className="mt-0.5 block text-lg font-black text-sky-600">
                    {estado.porcentajeAsistencia}%
                  </strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[8.5px] font-bold uppercase text-slate-400">Sin ingreso</span>
                  <strong className="mt-0.5 block text-lg font-black text-slate-900">
                    {estado.ausentes}
                  </strong>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[8.5px] font-bold uppercase text-emerald-600">Actualización</span>
                  <strong className="mt-0.5 block text-xs font-black text-emerald-700">En línea</strong>
                </div>
              </div>
              <div className="text-[9px] text-slate-400 text-center">Frecuencia de refresco: 15s</div>
            </article>

            <div className="lg:col-span-5">
              <GraficoIngresos datos={estado.ingresosPorHora} />
            </div>

            <article className="lg:col-span-4 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900">Ingresos por vínculo</h3>
                <p className="text-[10px] text-slate-500">Distribución de acompañantes</p>
              </div>
              <div className="my-2 space-y-2 max-h-36 overflow-y-auto pr-1">
                {estado.ingresosPorRelacion?.length ? (
                  estado.ingresosPorRelacion.map(item => (
                    <div key={item.relacion}>
                      <div className="flex justify-between text-[9.5px] font-semibold text-slate-600 mb-0.5">
                        <span className="truncate">{item.relacion}</span>
                        <span className="font-bold text-slate-800">{item.total}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div 
                          className="h-full rounded-full bg-sky-500" 
                          style={{ width: `${Math.max(8, (item.total / Math.max(1, estado.presentes)) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-[11px] font-medium text-slate-400">Sin ingresos registrados aún.</p>
                )}
              </div>
              <span className="text-[9px] text-slate-400">Total ingresos: {estado.presentes}</span>
            </article>
          </section>

          {/* Fila inferior: Actividad Reciente + Siguiente Ceremonia */}
          <section className="grid gap-3 lg:grid-cols-12">
            <article className="lg:col-span-8 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-black text-slate-900">Actividad reciente</h3>
                  <p className="text-[10px] text-slate-500">Últimos pases validados por portería</p>
                </div>
                <button 
                  onClick={() => onNavegar('panel-reportes')} 
                  className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-600 hover:text-sky-700 cursor-pointer"
                >
                  Ver reportes <ChevronRight size={11} />
                </button>
              </div>
              <div className="mt-2 divide-y divide-slate-100 max-h-40 overflow-y-auto">
                {estado.ultimosIngresos?.length ? (
                  estado.ultimosIngresos.map(ingreso => (
                    <div key={ingreso.id} className="flex items-center justify-between gap-3 py-1.5">
                      <div className="min-w-0">
                        <strong className="block truncate text-[11px] text-slate-800">{ingreso.nombre}</strong>
                        <span className="text-[9.5px] text-slate-500 truncate block">
                          {ingreso.relacion || 'Acompañante'} de {ingreso.egresado}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        {ingreso.hora}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-[11px] font-medium text-slate-400">Sin ingresos en este momento.</p>
                )}
              </div>
            </article>

            <article className="lg:col-span-4 rounded-xl border border-slate-200/80 bg-sky-50/50 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-sky-700 mb-1">
                  <Clock3 size={13} />
                  <h3 className="text-[9.5px] font-black uppercase tracking-wider">Siguiente ceremonia</h3>
                </div>
                {estado.proximaCeremonia ? (
                  <div className="mt-2">
                    <strong className="block text-xs font-extrabold text-slate-900 truncate">{estado.proximaCeremonia.nombre}</strong>
                    <p className="mt-0.5 text-[10.5px] text-slate-600">{formatearFecha(estado.proximaCeremonia.fecha)}</p>
                    <p className="text-[10px] text-slate-500">{estado.proximaCeremonia.lugar || 'Lugar a definir'}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">No hay otra ceremonia programada.</p>
                )}
              </div>
              {estado.proximaCeremonia && (
                <button 
                  onClick={() => onNavegar('gestion-ceremonias')} 
                  className="mt-3 text-[9px] font-black uppercase tracking-wider text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                >
                  Preparar ceremonia <ChevronRight size={10} />
                </button>
              )}
            </article>
          </section>
        </div>
      )}

      {mostrarActa && (
        <ModalActaCierre
          ceremonia={ceremonia}
          graduados={graduados}
          onCerrar={() => setMostrarActa(false)}
        />
      )}
    </div>
  )
}
