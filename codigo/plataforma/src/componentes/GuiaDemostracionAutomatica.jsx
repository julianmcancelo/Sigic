import React, { useState, useEffect, useRef } from 'react'
import {
  Play, Pause, ChevronRight, ChevronLeft, X, Sparkles,
  Users, Send, ScrollText, GraduationCap, QrCode, Armchair,
  ScanLine, FileText, CheckCircle2, Zap
} from 'lucide-react'

export const PASOS_DEMO = [
  {
    id: 'fase-1-ceremonia',
    fase: 1,
    rol: 'ADMINISTRACIÓN',
    colorRol: 'bg-indigo-600 text-white',
    icono: Sparkles,
    vistaAdmin: 'gestion-ceremonias',
    tipoUsuario: 'admin',
    titulo: '1. Creación e Inicialización del Acto',
    descripcion: 'Se define la fecha, sede (Auditorio Beltrán), aforo y cupos. La ceremonia se activa como entorno oficial de trabajo.',
    accionSimulada: '⚡ Creando e inicializando entorno oficial: "Colación de Grado 2026"',
    duracionSegundos: 8,
  },
  {
    id: 'fase-2-graduados',
    fase: 2,
    rol: 'ADMINISTRACIÓN',
    colorRol: 'bg-emerald-600 text-white',
    icono: Users,
    vistaAdmin: 'gestion-graduados',
    tipoUsuario: 'admin',
    titulo: '2. Carga Masiva e Importación de Graduados',
    descripcion: 'Se importa la planilla oficial de graduados (.xlsx). El sistema procesa y valida automáticamente el padrón por carrera.',
    accionSimulada: '📊 Importando Excel: 12 graduados validados con DNI, Legajo y Correo',
    duracionSegundos: 8,
  },
  {
    id: 'fase-3-convocatoria',
    fase: 3,
    rol: 'ADMINISTRACIÓN',
    colorRol: 'bg-blue-600 text-white',
    icono: Send,
    vistaAdmin: 'convocatoria',
    tipoUsuario: 'admin',
    titulo: '3. Convocatoria Masiva & Tokens OTP',
    descripcion: 'Con 1 clic se envían las invitaciones por email con tokens criptográficos de un solo uso para que cada egresado confirme su asistencia.',
    accionSimulada: '✉️ Despachando 12 invitaciones con token OTP y enlace de acceso directo',
    duracionSegundos: 8,
  },
  {
    id: 'fase-4-juramento',
    fase: 4,
    rol: 'PORTAL DEL GRADUADO',
    colorRol: 'bg-sky-600 text-white',
    icono: ScrollText,
    tipoUsuario: 'graduado',
    pestanaGraduado: 'juramento',
    titulo: '4. Autogestión del Egresado: Juramento',
    descripcion: 'El egresado ingresa de forma segura con su token y elige la fórmula de juramento protocolar que prestará en el estrado.',
    accionSimulada: '📜 Egresado selecciona fórmula: "Por la Patria y los Santos Evangelios"',
    duracionSegundos: 8,
  },
  {
    id: 'fase-5-padrinos',
    fase: 5,
    rol: 'PORTAL DEL GRADUADO',
    colorRol: 'bg-purple-600 text-white',
    icono: GraduationCap,
    tipoUsuario: 'graduado',
    pestanaGraduado: 'entregadores',
    titulo: '5. Registro de Familiares y Padrinos de Título',
    descripcion: 'Registra a sus acompañantes con DNI para el pase grupal y elige a los profesores o familiares para la entrega de diploma.',
    accionSimulada: '👥 Registrados 2 acompañantes · 🎓 Padrino asignado: Prof. Gabriel García',
    duracionSegundos: 8,
  },
  {
    id: 'fase-6-credencial',
    fase: 6,
    rol: 'PORTAL DEL GRADUADO',
    colorRol: 'bg-teal-600 text-white',
    icono: QrCode,
    tipoUsuario: 'graduado',
    pestanaGraduado: 'credencial',
    titulo: '6. Credencial Digital QR y Pase Google Wallet',
    descripcion: 'El sistema genera la credencial digital con QR criptográfico como pase de acceso grupal, exportable a PDF y Google Wallet.',
    accionSimulada: '📱 Pase grupal emitido con código QR seguro listo para portería',
    duracionSegundos: 8,
  },
  {
    id: 'fase-7-butacas',
    fase: 7,
    rol: 'ADMINISTRACIÓN',
    colorRol: 'bg-cyan-600 text-white',
    icono: Armchair,
    vistaAdmin: 'preparacion-ceremonia',
    tipoUsuario: 'admin',
    titulo: '7. Distribución Inteligente de Butacas (Auto-Seating)',
    descripcion: 'El algoritmo ubica a los egresados en Platea Baja ordenados por carrera y apellido, y sienta a los familiares en bloques contiguos.',
    accionSimulada: '🪑 Algoritmo Auto-Seating: 100% de butacas asignadas automáticamente',
    duracionSegundos: 9,
  },
  {
    id: 'fase-8-porteria',
    fase: 8,
    rol: 'PORTERÍA & SEGURIDAD',
    colorRol: 'bg-amber-600 text-white',
    icono: ScanLine,
    vistaAdmin: 'control-ingreso',
    tipoUsuario: 'admin',
    titulo: '8. Acreditación de Ingreso y Control de Aforo',
    descripcion: 'En los accesos, la app escanea el QR de la credencial, valida la entrada del grupo familiar y computa el aforo en tiempo real.',
    accionSimulada: '🛡️ Escaneo QR exitoso · Acreditadas 3 personas · Aforo en sala: 85%',
    duracionSegundos: 8,
  },
  {
    id: 'fase-9-cierre',
    fase: 9,
    rol: 'AUDITORÍA & CIERRE',
    colorRol: 'bg-slate-900 text-white',
    icono: FileText,
    vistaAdmin: 'estado-ceremonia',
    tipoUsuario: 'admin',
    titulo: '9. Cierre Legal, Acta Oficial en PDF y Métricas',
    descripcion: 'Al finalizar el acto, el sistema genera automáticamente el Acta Oficial de Cierre en PDF con firmas y archiva las métricas.',
    accionSimulada: '📜 Generando Acta Oficial de Colación en PDF con nómina certificada',
    duracionSegundos: 9,
  },
]

export function GuiaDemostracionAutomatica({
  onCambiarPaso,
  onFinalizarDemo,
  onAplicarPaso,
}) {
  const [pasoIndex, setPasoIndex] = useState(0)
  const [pausado, setPausado] = useState(false)
  const [velocidad, setVelocidad] = useState(1) // 1x, 1.5x, 2x
  const [progreso, setProgreso] = useState(0) // 0 a 100%
  const [mostrarMenuPasos, setMostrarMenuPasos] = useState(false)

  const pasoActual = PASOS_DEMO[pasoIndex] || PASOS_DEMO[0]
  const duracionMs = (pasoActual.duracionSegundos * 1000) / velocidad

  const timerRef = useRef(null)
  const progresoRef = useRef(null)
  const tiempoInicioRef = useRef(Date.now())

  // Aplicar el estado del paso al montar o cambiar de paso
  useEffect(() => {
    if (onAplicarPaso) {
      onAplicarPaso(pasoActual)
    }
  }, [pasoIndex])

  // Lógica del temporizador de avance automático
  useEffect(() => {
    if (pausado) {
      clearInterval(progresoRef.current)
      clearTimeout(timerRef.current)
      return
    }

    setProgreso(0)
    tiempoInicioRef.current = Date.now()

    progresoRef.current = setInterval(() => {
      const transcurrido = Date.now() - tiempoInicioRef.current
      const pct = Math.min(100, (transcurrido / duracionMs) * 100)
      setProgreso(pct)
    }, 50)

    timerRef.current = setTimeout(() => {
      if (pasoIndex < PASOS_DEMO.length - 1) {
        setPasoIndex(prev => prev + 1)
      } else {
        setPausado(true)
      }
    }, duracionMs)

    return () => {
      clearInterval(progresoRef.current)
      clearTimeout(timerRef.current)
    }
  }, [pasoIndex, pausado, velocidad, duracionMs])

  // Atajos de teclado para el expositor
  useEffect(() => {
    const manejarTeclado = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        setPausado(p => !p)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        siguientePaso()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        anteriorPaso()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onFinalizarDemo()
      }
    }

    window.addEventListener('keydown', manejarTeclado)
    return () => window.removeEventListener('keydown', manejarTeclado)
  }, [pasoIndex])

  const siguientePaso = () => {
    if (pasoIndex < PASOS_DEMO.length - 1) {
      setPasoIndex(prev => prev + 1)
    }
  }

  const anteriorPaso = () => {
    if (pasoIndex > 0) {
      setPasoIndex(prev => prev - 1)
    }
  }

  const saltarAPaso = (indice) => {
    setPasoIndex(indice)
    setMostrarMenuPasos(false)
  }

  const cambiarVelocidad = () => {
    setVelocidad(v => (v === 1 ? 1.5 : v === 1.5 ? 2 : 1))
  }

  const IconoPaso = pasoActual.icono

  return (
    <div className="fixed inset-x-0 bottom-0 z-[10000] p-2.5 sm:p-4 pointer-events-none flex flex-col items-center justify-end font-sans">
      
      {/* TARJETA COMPACTA SPOTLIGHT EXPOSITOR */}
      <div className="w-full max-w-3xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto transition-all animate-in slide-in-from-bottom duration-200">
        
        {/* BARRA DE PROGRESO ANIMADA */}
        <div className="w-full bg-slate-800/80 h-1 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-400 transition-all duration-75"
            style={{ width: `${progreso}%` }}
          />
        </div>

        <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* INFORMACIÓN EXPLICATIVA COMPACTA */}
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${pasoActual.colorRol}`}>
                {pasoActual.rol}
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded-md">
                Fase {pasoActual.fase}/{PASOS_DEMO.length}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Zap size={11} className="text-emerald-400" />
                {pasoActual.accionSimulada}
              </span>
              {pausado && (
                <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/50 px-1.5 py-0.5 rounded-md animate-pulse">
                  ⏸ Pausado
                </span>
              )}
            </div>

            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <IconoPaso className="text-cyan-400 shrink-0" size={15} />
              <span className="truncate">{pasoActual.titulo}</span>
            </h3>

            <p className="text-[11px] text-slate-300 font-medium leading-relaxed max-w-xl line-clamp-2">
              {pasoActual.descripcion}
            </p>
          </div>

          {/* BOTONERA DE CONTROL COMPACTA */}
          <div className="flex items-center gap-1.5 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3">
            
            {/* Paso anterior */}
            <button
              type="button"
              onClick={anteriorPaso}
              disabled={pasoIndex === 0}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-25 border border-slate-800 transition active:scale-95 cursor-pointer"
              title="Paso anterior (←)"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Play / Pausa */}
            <button
              type="button"
              onClick={() => setPausado(p => !p)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white text-[11px] font-black shadow-md transition active:scale-95 cursor-pointer"
              title="Pausar / Reanudar (Espacio)"
            >
              {pausado ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
              <span>{pausado ? 'Reanudar' : 'Pausar'}</span>
            </button>

            {/* Siguiente paso */}
            <button
              type="button"
              onClick={siguientePaso}
              disabled={pasoIndex === PASOS_DEMO.length - 1}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-25 border border-slate-800 transition active:scale-95 cursor-pointer"
              title="Siguiente paso (→)"
            >
              <ChevronRight size={14} />
            </button>

            {/* Selector de velocidad */}
            <button
              type="button"
              onClick={cambiarVelocidad}
              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[9px] font-black uppercase transition active:scale-95 cursor-pointer"
              title="Cambiar velocidad"
            >
              {velocidad}x
            </button>

            {/* Menú de saltar a paso */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMostrarMenuPasos(m => !m)}
                className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[9px] font-black uppercase transition cursor-pointer"
                title="Lista de fases"
              >
                Fases ▾
              </button>

              {mostrarMenuPasos && (
                <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-2xl space-y-0.5 max-h-72 overflow-y-auto z-50">
                  <p className="px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Saltar a fase:
                  </p>
                  {PASOS_DEMO.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => saltarAPaso(idx)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-between cursor-pointer ${
                        pasoIndex === idx
                          ? 'bg-sky-500 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{p.titulo}</span>
                      <span className="text-[8px] opacity-75 font-mono ml-1.5">{p.fase}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Salir de la Demo */}
            <button
              type="button"
              onClick={onFinalizarDemo}
              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition active:scale-95 cursor-pointer"
              title="Salir de la demostración (Esc)"
            >
              <X size={14} />
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}
