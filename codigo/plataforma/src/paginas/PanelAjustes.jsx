import React, { useState, useEffect } from 'react'
import { 
  Settings, ArrowLeft, LogOut, Save, RefreshCw,
  Users, Calendar, MapPin, 
  Building2, AlertTriangle, CheckCircle2,
  LayoutGrid, ChevronRight, Globe, Shield, Monitor
} from 'lucide-react'
import { obtenerAjustes, actualizarAjuste } from '../servicios/api'
import { HeaderGlobal } from '../componentes/HeaderGlobal'

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

  async function handleInterruptor(clave) {
    const anterior = ajustes[clave] !== 'false'
    const nuevo = !anterior
    setAjustes(prev => ({ ...prev, [clave]: String(nuevo) }))
    setGuardando(clave)

    try {
      await actualizarAjuste(clave, nuevo)
      localStorage.setItem(clave, String(nuevo))
      window.dispatchEvent(new CustomEvent('sigic-presentacion-cambiada', { detail: { mostrar: nuevo } }))
      setMensaje({
        tipo: 'exito',
        texto: nuevo
          ? 'La presentación inicial quedó activada'
          : 'La presentación inicial quedó desactivada desde el próximo acceso'
      })
      setTimeout(() => setMensaje(null), 3500)
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
      <div className="group bg-white rounded-[32px] p-8 border-2 border-transparent hover:border-sky-100 hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex gap-5">
            <div className="p-4 bg-slate-50 text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-500 rounded-2xl transition-colors shrink-0 h-fit">
              {icono}
            </div>
            <div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</h3>
              <p className="text-sm font-bold text-slate-700 leading-snug max-w-lg">{descripcion}</p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={activo}
            disabled={estaGuardando}
            onClick={() => handleInterruptor(clave)}
            className={`relative flex h-14 w-40 shrink-0 items-center rounded-2xl p-1.5 transition-all duration-300 disabled:opacity-60 ${
              activo
                ? 'justify-end bg-sky-500 shadow-lg shadow-sky-500/20'
                : 'justify-start bg-slate-200'
            }`}
          >
            <span className={`absolute text-[9px] font-black uppercase tracking-widest ${activo ? 'left-4 text-white' : 'right-4 text-slate-500'}`}>
              {estaGuardando ? 'Guardando' : activo ? 'Activada' : 'Desactivada'}
            </span>
            <span className="relative z-10 h-11 w-11 rounded-xl bg-white shadow-md" />
          </button>
        </div>
      </div>
    )
  }

  const renderFila = (clave, label, icono, descripcion) => {
    const valor = ajustes[clave]
    const estaGuardando = guardando === clave

    return (
      <div className="group bg-white rounded-[32px] p-8 border-2 border-transparent hover:border-sky-100 hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-5">
            <div className="p-4 bg-slate-50 text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-500 rounded-2xl transition-colors shrink-0 h-fit">
              {icono}
            </div>
            <div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</h3>
              <p className="text-sm font-bold text-slate-700 leading-snug max-w-sm">{descripcion}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <input
              type="text"
              value={valor || ''}
              onChange={e => setAjustes(prev => ({ ...prev, [clave]: e.target.value }))}
              className="w-full sm:w-64 bg-slate-50 border-2 border-slate-50 focus:border-sky-400 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 outline-none transition-all"
            />
            <button
              onClick={() => handleGuardar(clave)}
              disabled={estaGuardando}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                estaGuardando ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-sky-600 shadow-lg'
              }`}
            >
              {estaGuardando ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {estaGuardando ? '...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${sinHeader ? '' : 'bg-[#f1f5f9] min-h-screen'} font-sans selection:bg-sky-100`}>
      {!sinHeader && (
        <HeaderGlobal 
          titulo="Panel de Ajustes"
          subtitulo="Configuración del Hábitat"
          onVolver={onVolver}
          onCerrarSesion={onCerrarSesion}
        />
      )}

      <main className={`max-w-6xl mx-auto ${sinHeader ? 'p-0 py-4 pb-16' : 'p-10 pb-32'}`}>
        {/* HÁBITAT SELECCIONADO */}
        <div className="mb-12 bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl shadow-slate-900/20 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-400 mb-2 block">Hábitat Activo</span>
            <h2 className="text-4xl font-black mb-2">{ceremoniaActiva?.nombre || 'General'}</h2>
            <p className="text-slate-400 text-sm font-medium">Los cambios realizados aquí se aplicarán a este entorno de trabajo.</p>
          </div>
          <button 
            onClick={() => onNavegar('gestion-ceremonias')}
            className="relative z-10 bg-white/10 hover:bg-white/20 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-3"
          >
            Cambiar Hábitat <ChevronRight size={16} />
          </button>
        </div>

        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-xs font-black uppercase tracking-[0.4em]">Cargando Ajustes...</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* SECCIÓN 1: IDENTIDAD */}
            <section>
              <div className="flex items-center gap-4 mb-8 ml-4">
                <div className="w-1.5 h-6 bg-sky-500 rounded-full" />
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Identidad y Marca</h2>
              </div>
              <div className="grid gap-6">
                {renderFila('nombre_institucion', 'Institución', <Building2 size={22} />, 'Nombre oficial de la institución que organiza el evento.')}
                {renderFila('nombre_evento', 'Evento', <Globe size={22} />, 'Título descriptivo de la ceremonia de colación.')}
              </div>
            </section>

            {/* SECCIÓN 2: OPERACIÓN */}
            <section>
              <div className="flex items-center gap-4 mb-8 ml-4">
                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Reglas del Hábitat</h2>
              </div>
              <div className="grid gap-6">
                {renderInterruptor(
                  'mostrar_presentacion_inicial',
                  'Pantalla de bienvenida',
                  <Monitor size={22} />,
                  'Al activarla se muestra la portada institucional. Al desactivarla, la plataforma abre directamente el acceso administrativo.'
                )}
                {renderFila('max_invitados', 'Cupo de Invitados', <Users size={22} />, 'Cantidad de acompañantes permitidos por cada egresado.')}
                {renderFila('modo_mantenimiento', 'Mantenimiento', <Shield size={22} />, 'Activa "true" para bloquear el acceso público al sistema.')}
                {renderFila('acceso_oculto_egresado', 'Acceso Oculto Egresados', <Shield size={22} />, 'Activa "true" para requerir 5 clicks en el logo para entrar al portal.')}
              </div>
            </section>

            {/* SECCIÓN 3: IDENTIFICACIÓN DE GRADUADOS */}
            <section>
              <div className="flex items-center gap-4 mb-8 ml-4">
                <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Identificación de Graduados</h2>
              </div>
              <div className="grid gap-6">
                {renderFila('formato_identificador', 'Formato de Identificador', <Settings size={22} />, 'Patrón para generar el identificador visual del graduado. Usá {CARRERA}, {LEGAJO} y {AÑO} (ej: {CARRERA}-{LEGAJO}-{AÑO}).')}
                {renderFila('campos_identificador', 'Campos Activos', <Users size={22} />, 'Campos requeridos al registrar un graduado (valores válidos: carrera, legajo, anio_inscripcion separados por comas).')}
              </div>
            </section>


            {/* SECCIÓN 3: ACCIONES RÁPIDAS */}
            <section className="pt-10 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[32px] p-8 border-2 border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all">
                  <div className="flex gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl"><LayoutGrid size={24}/></div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Anfiteatro</h3>
                      <p className="text-xs text-slate-400 font-bold">Diseñar mapa de asientos</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onNavegar('seleccion-asientos')}
                    className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-90"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="bg-red-50 rounded-[32px] p-8 border-2 border-red-100 flex items-center justify-between group hover:bg-red-100/50 transition-all">
                  <div className="flex gap-4">
                    <div className="p-4 bg-white text-red-500 rounded-2xl shadow-sm"><LogOut size={24}/></div>
                    <div>
                      <h3 className="text-sm font-black text-red-600 uppercase tracking-tight">Finalizar</h3>
                      <p className="text-xs text-red-400 font-bold">Cerrar sesión de control</p>
                    </div>
                  </div>
                  <button 
                    onClick={onCerrarSesion}
                    className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-90"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}


