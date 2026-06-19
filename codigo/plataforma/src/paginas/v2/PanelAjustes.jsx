import React, { useState, useEffect } from 'react'
import { 
  Settings, Save, RefreshCw, Building2, Users, MapPin, 
  Globe, Shield, ChevronRight, LogOut, LayoutGrid, Monitor, SlidersHorizontal,
  Fingerprint, CheckCircle2
} from 'lucide-react'
import { obtenerAjustes, actualizarAjuste } from '../../servicios/api'

const ACCENT = '#0EA5E9'
const DARK   = '#2A3448'

export function PanelAjustes({ usuario, onVolver, onCerrarSesion, onNavegar, ceremoniaActiva, sinHeader }) {
  const [ajustes, setAjustes]         = useState({})
  const [cargando, setCargando]       = useState(true)
  const [guardando, setGuardando]     = useState(null)
  const [mensaje, setMensaje]         = useState(null)
  const [seccionActiva, setSeccionActiva] = useState('plataforma')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    try {
      const datos = await obtenerAjustes()
      const aplanado = {}
      Object.entries(datos).forEach(([k, v]) => { aplanado[k] = v.valor })
      setAjustes(aplanado)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al conectar con el servidor' })
    } finally {
      setCargando(false)
    }
  }

  async function handleGuardar(clave) {
    setGuardando(clave)
    try {
      await actualizarAjuste(clave, ajustes[clave])
      setMensaje({ tipo: 'exito', texto: 'Cambio guardado correctamente' })
      setTimeout(() => setMensaje(null), 3000)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar el cambio' })
    } finally {
      setGuardando(null)
    }
  }

  async function handleInterruptor(clave) {
    const anterior = ajustes[clave] !== 'false'
    const nuevo = !anterior
    setAjustes(prev => ({ ...prev, [clave]: String(nuevo) }))
    setGuardando(clave)
    try {
      await actualizarAjuste(clave, nuevo)
      localStorage.setItem(clave, String(nuevo))
      if (clave === 'mostrar_presentacion_inicial') {
        window.dispatchEvent(new CustomEvent('sigic-presentacion-cambiada', { detail: { mostrar: nuevo } }))
      }
      setMensaje({ tipo: 'exito', texto: 'Preferencia general actualizada correctamente' })
      setTimeout(() => setMensaje(null), 3000)
    } catch (err) {
      setAjustes(prev => ({ ...prev, [clave]: String(anterior) }))
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar el cambio' })
    } finally {
      setGuardando(null)
    }
  }

  const renderInterruptor = (clave, label, icono, descripcion) => {
    const activo = ajustes[clave] !== 'false'
    const estaGuardando = guardando === clave
    return (
      <div className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-sky-100 hover:shadow-md transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex gap-4">
            <div className={`p-3 rounded-xl shrink-0 h-fit transition-colors ${activo ? 'bg-sky-50 text-sky-500' : 'bg-slate-50 text-slate-400'}`}>
              {icono}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{label}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${activo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {activo ? 'Activado' : 'Desactivado'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-lg">{descripcion}</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={activo}
            disabled={estaGuardando}
            onClick={() => handleInterruptor(clave)}
            className={`relative h-9 w-16 shrink-0 rounded-full p-1 transition-all disabled:opacity-60 ${activo ? 'bg-sky-500 shadow-md shadow-sky-500/20' : 'bg-slate-200'}`}
          >
            <span className={`block h-7 w-7 rounded-full bg-white shadow-sm transition-transform ${activo ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    )
  }

  const secciones = [
    { id: 'plataforma', nombre: 'Plataforma', detalle: 'Acceso y comportamiento general', icono: SlidersHorizontal },
    { id: 'identidad', nombre: 'Identidad', detalle: 'Institución y presentación', icono: Building2 },
    { id: 'ceremonia', nombre: 'Ceremonia', detalle: 'Reglas del evento activo', icono: LayoutGrid },
  ]

  const renderFila = (clave, label, icono, descripcion) => {
    const valor = ajustes[clave]
    const estaGuardando = guardando === clave

    return (
      <div className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow transition duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-4">
            <div className="p-3 bg-slate-50 text-slate-450 group-hover:bg-sky-50 group-hover:text-sky-500 rounded-xl transition-colors shrink-0 h-fit">
              {icono}
            </div>
            <div>
              <h3 className="text-[9px] font-black text-slate-450 uppercase tracking-widest mb-0.5">{label}</h3>
              <p className="text-xs font-semibold text-slate-600 leading-snug max-w-sm">{descripcion}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5">
            <input
              type="text"
              value={valor || ''}
              onChange={e => setAjustes(prev => ({ ...prev, [clave]: e.target.value }))}
              className="w-full sm:w-56 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-2 text-xs font-semibold text-slate-800 outline-none transition-all"
            />
            <button
              onClick={() => handleGuardar(clave)}
              disabled={estaGuardando}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                estaGuardando ? 'bg-slate-100 text-slate-450' : 'bg-slate-900 text-white hover:bg-sky-500 shadow-sm'
              }`}
            >
              {estaGuardando ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              {estaGuardando ? '...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="font-sans">
      <div className="relative overflow-hidden rounded-[28px] bg-slate-900 p-6 sm:p-8 mb-6 text-white">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-sky-300 mb-3">
              <Settings size={11} /> Administración central
            </span>
            <h2 className="text-2xl font-black tracking-tight">Ajustes del sistema</h2>
            <p className="text-xs font-semibold text-slate-400 mt-1">Configuraciones generales y parámetros propios de cada ceremonia.</p>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-emerald-300">
            <CheckCircle2 size={14} /> Configuración sincronizada
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {secciones.map(({ id, nombre, detalle, icono: Icono }) => {
          const activa = seccionActiva === id
          return (
            <button
              key={id}
              onClick={() => setSeccionActiva(id)}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${activa ? 'border-sky-200 bg-sky-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${activa ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'bg-slate-50 text-slate-400'}`}><Icono size={17} /></span>
              <span>
                <span className={`block text-xs font-black ${activa ? 'text-sky-700' : 'text-slate-700'}`}>{nombre}</span>
                <span className="block text-[9px] font-semibold text-slate-400 mt-0.5">{detalle}</span>
              </span>
            </button>
          )
        })}
      </div>

      {seccionActiva === 'ceremonia' && <div className="mb-6 bg-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <span className="text-[8px] font-black uppercase tracking-widest text-sky-400 block">Ceremonia Seleccionada</span>
          <h2 className="text-base font-black tracking-tight">{ceremoniaActiva?.nombre || 'General'}</h2>
          <p className="text-slate-405 text-[10px] font-semibold">Las configuraciones modificadas impactarán en este entorno de colación.</p>
        </div>
        <button 
          onClick={() => onNavegar('ceremonias')}
          className="relative z-10 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-1.5"
        >
          Administrar Ceremonias <ChevronRight size={13} />
        </button>
      </div>}

      {mensaje && (
        <div className={`mb-6 p-4 rounded-xl border text-xs font-bold ${
          mensaje.tipo === 'exito' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          {mensaje.texto}
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
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Cargando Ajustes...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {seccionActiva === 'plataforma' && <section className="space-y-3">
            <div className="flex items-center gap-2 ml-1">
              <div className="w-1 h-3 bg-sky-500 rounded-full" />
              <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Comportamiento general</h2>
            </div>
            <div className="grid gap-3.5">
              {renderInterruptor('mostrar_presentacion_inicial', 'Pantalla de bienvenida', <Monitor size={18} />, 'Al desactivarla, la plataforma omite la portada institucional y abre directamente el acceso administrativo desde la próxima recarga.')}
              {renderInterruptor('modo_mantenimiento', 'Modo mantenimiento', <Shield size={18} />, 'Bloquea temporalmente el acceso público mientras el equipo administrativo realiza tareas internas.')}
              {renderInterruptor('acceso_oculto_egresado', 'Acceso reservado para graduados', <Fingerprint size={18} />, 'Oculta el acceso directo de graduados y conserva el ingreso reservado desde el logotipo.')}
            </div>
          </section>}

          {seccionActiva === 'identidad' && <section className="space-y-3">
            <div className="flex items-center gap-2 ml-1">
              <div className="w-1 h-3 bg-indigo-500 rounded-full" />
              <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identidad institucional</h2>
            </div>
            <div className="grid gap-3.5">
              {renderFila('nombre_institucion', 'Nombre de la institución', <Building2 size={18} />, 'Nombre oficial que se utiliza en la plataforma y en las comunicaciones institucionales.')}
            </div>
          </section>}

          {seccionActiva === 'ceremonia' && <section className="space-y-3">
            <div className="flex items-center gap-2 ml-1">
              <div className="w-1 h-3 bg-amber-500 rounded-full" />
              <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reglas de la ceremonia seleccionada</h2>
            </div>
            <div className="grid gap-3.5">
              {renderFila('nombre_evento', 'Nombre de la ceremonia', <Globe size={18} />, 'Título con el que se identifica el evento activo.')}
              {renderFila('max_invitados', 'Cupo de invitados', <Users size={18} />, 'Cantidad máxima de acompañantes permitidos por graduado.')}
              {renderFila('formato_identificador', 'Formato de Identificador', <Settings size={18} />, 'Patrón para generar el identificador. Usá {CARRERA}, {LEGAJO} y {AÑO} (ej: {CARRERA}-{LEGAJO}-{AÑO}).')}
              {renderFila('campos_identificador', 'Campos Activos', <Users size={18} />, 'Campos obligatorios al registrar graduado (carrera, legajo, anio_inscripcion separados por comas).')}
              <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 p-5">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sky-400/10 blur-2xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
                      <Shield size={19} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs font-black text-slate-800">Personal autorizado</h3>
                        <span className="rounded-full bg-white px-2 py-1 text-[8px] font-black uppercase tracking-wider text-sky-600 shadow-sm">Por ceremonia</span>
                      </div>
                      <p className="mt-1.5 max-w-lg text-[10px] font-semibold leading-relaxed text-slate-500">
                        Elegí qué integrantes de seguridad pueden operar en {ceremoniaActiva?.nombre || 'esta ceremonia'}, activar sus cuentas y generar el acceso para la aplicación móvil.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavegar('seguridad')}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-[9px] font-black uppercase tracking-wider text-white shadow-md transition hover:bg-sky-500 active:scale-95"
                  >
                    Gestionar equipo <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </section>}

          {/* ACCIONES RÁPIDAS */}
          <section className="pt-6 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all">
                <div className="flex gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl shrink-0"><LayoutGrid size={18}/></div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">Anfiteatro</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Diseñar mapa de asientos</p>
                  </div>
                </div>
                <button 
                  onClick={() => onNavegar('butacas')}
                  className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm active:scale-90"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100 flex items-center justify-between group hover:bg-rose-100/50 transition-all">
                <div className="flex gap-3">
                  <div className="p-3 bg-white text-rose-500 rounded-xl shadow-sm shrink-0"><LogOut size={18}/></div>
                  <div>
                    <h3 className="text-xs font-black text-rose-600 uppercase tracking-tight">Cerrar Sesión</h3>
                    <p className="text-[10px] text-rose-450 font-bold">Salir del panel de control</p>
                  </div>
                </div>
                <button 
                  onClick={onCerrarSesion}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-sm active:scale-90"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
