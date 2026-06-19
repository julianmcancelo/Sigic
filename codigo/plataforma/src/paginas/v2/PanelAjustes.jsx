import React, { useState, useEffect } from 'react'
import { 
  Settings, Save, RefreshCw, Building2, Users, MapPin, 
  Globe, Shield, ChevronRight, LogOut, LayoutGrid
} from 'lucide-react'
import { obtenerAjustes, actualizarAjuste } from '../../servicios/api'

const ACCENT = '#0EA5E9'
const DARK   = '#2A3448'

export function PanelAjustes({ usuario, onVolver, onCerrarSesion, onNavegar, ceremoniaActiva, sinHeader }) {
  const [ajustes, setAjustes]         = useState({})
  const [cargando, setCargando]       = useState(true)
  const [guardando, setGuardando]     = useState(null)
  const [mensaje, setMensaje]         = useState(null)

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
      {/* HEADER INTEGRADO PRO */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: DARK }}>Configuración del Sistema</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ajustes & Parámetros Operativos del Hábitat</p>
        </div>
      </div>

      {/* HÁBITAT SELECCIONADO */}
      <div className="mb-6 bg-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
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
      </div>

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
          {/* SECCIÓN 1: IDENTIDAD */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 ml-1">
              <div className="w-1 h-3 bg-sky-500 rounded-full" />
              <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identidad y Marca</h2>
            </div>
            <div className="grid gap-3.5">
              {renderFila('nombre_institucion', 'Institución', <Building2 size={18} />, 'Nombre oficial de la institución que organiza el evento.')}
              {renderFila('nombre_evento', 'Evento', <Globe size={18} />, 'Título descriptivo de la ceremonia de colación.')}
            </div>
          </section>

          {/* SECCIÓN 2: OPERACIÓN */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 ml-1">
              <div className="w-1 h-3 bg-amber-500 rounded-full" />
              <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reglas del Hábitat</h2>
            </div>
            <div className="grid gap-3.5">
              {renderFila('max_invitados', 'Cupo de Invitados', <Users size={18} />, 'Cantidad de acompañantes permitidos por cada egresado.')}
              {renderFila('modo_mantenimiento', 'Mantenimiento', <Shield size={18} />, 'Activa "true" para bloquear el acceso público al sistema.')}
              {renderFila('acceso_oculto_egresado', 'Acceso Oculto Egresados', <Shield size={18} />, 'Activa "true" para requerir 5 clicks en el logo para entrar al portal.')}
            </div>
          </section>

          {/* SECCIÓN 3: IDENTIFICACIÓN */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 ml-1">
              <div className="w-1 h-3 bg-indigo-500 rounded-full" />
              <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificación de Graduados</h2>
            </div>
            <div className="grid gap-3.5">
              {renderFila('formato_identificador', 'Formato de Identificador', <Settings size={18} />, 'Patrón para generar el identificador. Usá {CARRERA}, {LEGAJO} y {AÑO} (ej: {CARRERA}-{LEGAJO}-{AÑO}).')}
              {renderFila('campos_identificador', 'Campos Activos', <Users size={18} />, 'Campos obligatorios al registrar graduado (carrera, legajo, anio_inscripcion separados por comas).')}
            </div>
          </section>

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
