/**
 * PantallaAceptacion - Pantalla de aceptación/rechazo de la invitación a la ceremonia.
 * Se muestra al graduado cuando su estado es PENDIENTE (primer inicio de sesión).
 * Diseño premium con glassmorphism y círculos decorativos desenfocados.
 */
import { useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, GraduationCap, MapPin, Calendar } from 'lucide-react'

export function PantallaAceptacion({ graduado, onAceptar, onRechazar }) {
  const [cargando, setCargando] = useState(false)
  const [mostrarModalRechazo, setMostrarModalRechazo] = useState(false)

  async function manejarAceptar() {
    setCargando(true)
    try {
      await onAceptar()
    } catch (err) {
      alert(err.message || 'Ocurrió un error al registrar la aceptación')
    } finally {
      setCargando(false)
    }
  }

  async function manejarConfirmarRechazo() {
    setCargando(true)
    try {
      await onRechazar()
    } catch (err) {
      alert(err.message || 'Ocurrió un error al registrar el rechazo')
    } finally {
      setCargando(false)
      setMostrarModalRechazo(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#F8FAFC' }}>
      
      {/* Círculos decorativos desenfocados (fondo premium sutil) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute top-[35%] left-[55%] w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[90px] pointer-events-none" />

      {/* Tarjeta central */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        <div 
          className="rounded-[36px] overflow-hidden border border-white/80 shadow-[0_32px_64px_-12px_rgba(15,23,42,0.06)]"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(30px)' }}
        >
          <div className="p-10 text-center">
            
            {/* Logo Oficial SiGIC */}
            <div className="mx-auto mb-8 flex justify-center">
              <img 
                src="/logo-oficial.png" 
                alt="Instituto Beltrán" 
                className="h-16 w-auto object-contain filter drop-shadow-sm" 
              />
            </div>

            {/* Título principal */}
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
              ¡Felicitaciones, {graduado.nombre?.split(' ')[0] || 'Graduado'}!
            </h1>

            {/* Subtítulo */}
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
              Has sido invitado/a a participar de la ceremonia de colación
            </p>

            {/* Tarjeta de información de la ceremonia */}
            <div className="bg-slate-50/60 rounded-2xl p-6 mb-8 border border-slate-100 text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Detalles de la Ceremonia</p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-sky-500/10 border border-sky-500/10 flex items-center justify-center text-sky-600 flex-shrink-0">
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evento</p>
                    <p className="text-sm font-extrabold text-slate-700">{graduado.ceremonia_nombre || 'Ceremonia de Colación'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/10 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha</p>
                    <p className="text-sm font-extrabold text-slate-700">
                      {graduado.ceremonia_fecha 
                        ? new Date(graduado.ceremonia_fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Fecha por confirmar'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lugar</p>
                    <p className="text-sm font-extrabold text-slate-700">{graduado.ceremonia_lugar || 'Sede Beltrán'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100 mb-8" />

            {/* Botones de acción */}
            <div className="space-y-4">
              {/* Botón Aceptar */}
              <button
                onClick={manejarAceptar}
                disabled={cargando}
                className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white py-3.5 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/15 hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={16} />
                {cargando ? 'Procesando...' : 'Acepto participar'}
              </button>

              {/* Botón Rechazar (Estilizado como acción secundaria outline premium) */}
              <button
                onClick={() => setMostrarModalRechazo(true)}
                disabled={cargando}
                className="w-full flex items-center justify-center gap-3 bg-red-50/30 hover:bg-red-500 text-red-600 hover:text-white py-3.5 px-8 rounded-2xl font-bold text-xs uppercase tracking-widest border border-red-200/40 hover:border-red-500 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle size={16} />
                No voy a participar
              </button>

              {/* Texto de advertencia */}
              <p className="text-[9px] text-slate-400/80 font-bold uppercase tracking-wider mt-3 flex items-center justify-center gap-1.5">
                <AlertTriangle size={12} className="text-amber-500" /> La decisión de rechazo es irreversible
              </p>
            </div>
          </div>
        </div>

        {/* Pie de página */}
        <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-6">
          Instituto Beltrán · SiGIC 2026
        </p>
      </div>

      {/* ══════ MODAL DE CONFIRMACIÓN DE RECHAZO ══════ */}
      {mostrarModalRechazo && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          onClick={() => !cargando && setMostrarModalRechazo(false)}
        >
          {/* Fondo oscuro */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Tarjeta del modal */}
          <div 
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-8 text-center">
              {/* Ícono de advertencia */}
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 border-2 border-red-100">
                <AlertTriangle size={32} className="text-red-500" />
              </div>

              <h2 className="text-xl font-black text-slate-800 mb-2">¿Estás seguro?</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Al rechazar esta invitación, confirmarás tu inasistencia y no participarás de la ceremonia.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setMostrarModalRechazo(false)}
                  disabled={cargando}
                  className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={manejarConfirmarRechazo}
                  disabled={cargando}
                  className="flex-1 bg-red-500 text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {cargando ? 'Procesando...' : 'Confirmar rechazo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
