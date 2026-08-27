import React, { useState, useEffect, useRef } from 'react'
import {
  Play, Pause, ChevronRight, ChevronLeft, X, Sparkles,
  Users, Send, ScrollText, GraduationCap, QrCode, Armchair,
  Mic, ScanLine, FileText, BarChart3, CheckCircle2, FastForward
} from 'lucide-react'

export const PASOS_DEMO = [
  {
    id: 'fase-1-ceremonia',
    fase: 1,
    rol: 'ADMINISTRACIÓN',
    colorRol: 'bg-indigo-500 text-white',
    icono: Sparkles,
    vistaAdmin: 'gestion-ceremonias',
    tipoUsuario: 'admin',
    titulo: '1. Creación e Inicialización del Acto',
    descripcion: 'La institución crea el evento formal, define la fecha, sede (Auditorio Beltrán), aforo y cupo de acompañantes, activándolo como el entorno operativo oficial.',
    duracionSegundos: 10,
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
    descripcion: 'Se importa la planilla oficial de graduados (.xlsx). El sistema procesa y valida automáticamente nombres, DNI, legajos, correos y carreras en el padrón.',
    duracionSegundos: 10,
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
    descripcion: 'Con 1 solo clic se despachan las invitaciones por email con tokens seguros (OTP). El sistema permite seguir respuestas en vivo y reenviar recordatorios o links de WhatsApp.',
    duracionSegundos: 10,
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
    descripcion: 'El egresado accede con su token seguro y elige la fórmula de juramento protocolar (ej. "Por Dios, la Patria y los Santos Evangelios" o "Por la Patria").',
    duracionSegundos: 10,
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
    descripcion: 'El estudiante registra a sus acompañantes con DNI para el pase grupal y selecciona a sus profesores o familiares que subirán al estrado a entregarle el diploma.',
    duracionSegundos: 10,
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
    descripcion: 'El sistema genera la credencial digital con QR criptográfico como pase de acceso grupal, descargable en PDF o exportable directamente a Google Wallet.',
    duracionSegundos: 10,
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
    descripcion: 'La administración ejecuta el algoritmo de Auto-Seating: ubica a los egresados en Platea Baja ordenados por carrera y apellido, y sienta a los acompañantes en bloques contiguos.',
    duracionSegundos: 11,
  },
  {
    id: 'fase-8-locucion',
    fase: 8,
    rol: 'ESTRADO & LOCUCIÓN',
    colorRol: 'bg-rose-600 text-white',
    icono: Mic,
    vistaAdmin: 'locucion',
    tipoUsuario: 'admin',
    titulo: '8. Teleprompter y Asistencia al Locutor en Vivo',
    descripcion: 'En la pantalla del estrado, el locutor visualiza en tiempo real la secuencia ordenada de diplomas, juramento individual y qué padrino sube en cada momento.',
    duracionSegundos: 10,
  },
  {
    id: 'fase-9-porteria',
    fase: 9,
    rol: 'PORTERÍA & SEGURIDAD',
    colorRol: 'bg-amber-600 text-white',
    icono: ScanLine,
    vistaAdmin: 'control-ingreso',
    tipoUsuario: 'admin',
    titulo: '9. Acreditación de Ingreso y Control de Aforo',
    descripcion: 'En los accesos, el personal escanea el QR de la credencial, valida la entrada del egresado y su número de acompañantes y computa el aforo en tiempo real.',
    duracionSegundos: 10,
  },
  {
    id: 'fase-10-cierre',
    fase: 10,
    rol: 'AUDITORÍA & CIERRE',
    colorRol: 'bg-slate-900 text-white',
    icono: FileText,
    vistaAdmin: 'estado-ceremonia',
    tipoUsuario: 'admin',
    titulo: '10. Cierre Legal, Acta Oficial en PDF y Métricas',
    descripcion: 'Al finalizar el acto, el sistema genera automáticamente el Acta Oficial de Cierre en PDF con firmas y certificaciones, archivando las estadísticas institucionales.',
    duracionSegundos: 11,
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

    // Actualizar barra de progreso continua (cada 50ms)
    progresoRef.current = setInterval(() => {
      const transcurrido = Date.now() - tiempoInicioRef.current
      const pct = Math.min(100, (transcurrido / duracionMs) * 100)
      setProgreso(pct)
    }, 50)

    // Avanzar de paso al cumplirse el tiempo
    timerRef.current = setTimeout(() => {
      if (pasoIndex < PASOS_DEMO.length - 1) {
        setPasoIndex(prev => prev + 1)
      } else {
        // Fin de la demo
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
    <div className="fixed inset-x-0 bottom-0 z-[10000] p-3 sm:p-5 pointer-events-none flex flex-col items-center justify-end font-sans">
      
      {/* TARJETA PRINCIPAL SPOTLIGHT EXPOSITOR */}
      <div className="w-full max-w-4xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/70 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto transition-all animate-in slide-in-from-bottom duration-300">
        
        {/* BARRA DE PROGRESO ANIMADA SUPERIOR */}
        <div className="w-full bg-slate-800/80 h-1.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-500 transition-all duration-75"
            style={{ width: `${progreso}%` }}
          />
        </div>

        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* INFORMACIÓN EXPLICATIVA DEL PASO */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${pasoActual.colorRol}`}>
                {pasoActual.rol}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-md">
                Paso {pasoActual.fase} de {PASOS_DEMO.length}
              </span>
              {pausado && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-md animate-pulse">
                  ⏸ Pausado para explicación
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <IconoPaso className="text-cyan-400 shrink-0" size={18} />
              <span className="truncate">{pasoActual.titulo}</span>
            </h3>

            <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-2xl">
              {pasoActual.descripcion}
            </p>
          </div>

          {/* BOTONERA DE CONTROL PARA EL EXPOSITOR */}
          <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
            
            {/* Paso anterior */}
            <button
              type="button"
              onClick={anteriorPaso}
              disabled={pasoIndex === 0}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 border border-slate-800 transition active:scale-95 cursor-pointer"
              title="Paso anterior (←)"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Play / Pausa */}
            <button
              type="button"
              onClick={() => setPausado(p => !p)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white text-xs font-black shadow-lg shadow-sky-500/25 transition active:scale-95 cursor-pointer"
              title="Pausar / Reanudar (Espacio)"
            >
              {pausado ? <Play size={15} fill="currentColor" /> : <Pause size={15} fill="currentColor" />}
              <span>{pausado ? 'Reanudar' : 'Pausar'}</span>
            </button>

            {/* Siguiente paso */}
            <button
              type="button"
              onClick={siguientePaso}
              disabled={pasoIndex === PASOS_DEMO.length - 1}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 border border-slate-800 transition active:scale-95 cursor-pointer"
              title="Siguiente paso (→)"
            >
              <ChevronRight size={16} />
            </button>

            {/* Selector de velocidad */}
            <button
              type="button"
              onClick={cambiarVelocidad}
              className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-black uppercase transition active:scale-95 cursor-pointer"
              title="Cambiar velocidad"
            >
              {velocidad}x
            </button>

            {/* Menú de saltar a paso */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMostrarMenuPasos(m => !m)}
                className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-black uppercase transition cursor-pointer"
                title="Lista de fases"
              >
                Fases ▾
              </button>

              {mostrarMenuPasos && (
                <div className="absolute right-0 bottom-full mb-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl p-1.5 shadow-2xl space-y-1 max-h-80 overflow-y-auto z-50">
                  <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Saltar a cualquier fase:
                  </p>
                  {PASOS_DEMO.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => saltarAPaso(idx)}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        pasoIndex === idx
                          ? 'bg-sky-500 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{p.titulo}</span>
                      <span className="text-[9px] opacity-75 font-mono ml-2">Fase {p.fase}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Salir de la Demo */}
            <button
              type="button"
              onClick={onFinalizarDemo}
              className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition active:scale-95 cursor-pointer"
              title="Salir de la demostración (Esc)"
            >
              <X size={16} />
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}
