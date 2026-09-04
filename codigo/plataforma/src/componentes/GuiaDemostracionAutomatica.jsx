import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play, Pause, ChevronRight, ChevronLeft, X, Sparkles,
  Users, Send, ScrollText, GraduationCap, QrCode, Armchair,
  ScanLine, FileText, CheckCircle2, Zap, MousePointer, Video,
  RotateCcw, Trash2, Check, CircleDot, ChevronDown, Minimize2, Maximize2,
  ArrowRight, HardDrive
} from 'lucide-react'
import rutinasOficiales from '../datos/rutinas-demo-oficiales.json'
import { CursorVirtualDemo } from './CursorVirtualDemo'

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
    accionSimulada: 'Creando e inicializando entorno oficial: "Colación de Grado 2026"',
    duracionSegundos: 11,
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
    accionSimulada: 'Importando Excel: 12 graduados validados con DNI, Legajo y Correo',
    duracionSegundos: 12,
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
    accionSimulada: 'Despachando 12 invitaciones con token OTP y enlace de acceso directo',
    duracionSegundos: 12,
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
    accionSimulada: 'Egresado selecciona fórmula: "Por la Patria y los Santos Evangelios"',
    duracionSegundos: 12,
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
    accionSimulada: 'Registrados 2 acompañantes · Padrino asignado: Prof. Gabriel García',
    duracionSegundos: 12,
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
    accionSimulada: 'Pase grupal emitido con código QR seguro listo para portería',
    duracionSegundos: 11,
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
    accionSimulada: 'Algoritmo Auto-Seating: 100% de butacas asignadas automáticamente',
    duracionSegundos: 13,
  },
]

/**
 * Inspector inteligente de elementos DOM para registrar selectores y coordenadas
 */
function obtenerInfoElemento(el) {
  if (!el) return { selector: '', textoBoton: undefined, rx: 0.5, ry: 0.5, etiqueta: 'Elemento', esInput: false }

  let selector = ''
  if (el.id && typeof el.id === 'string' && el.id.trim() && !el.id.startsWith(':r')) {
    selector = `#${el.id.trim()}`
  }

  const textoRaw = (el.innerText || el.textContent || el.value || '').trim()
  const textoLimpio = textoRaw.replace(/\s+/g, ' ').slice(0, 35)

  const tagName = (el.tagName || '').toLowerCase()
  const placeholder = el.getAttribute?.('placeholder')?.trim() || ''
  const name = el.getAttribute?.('name')?.trim() || ''
  const role = el.getAttribute?.('role')?.trim() || ''
  const title = el.getAttribute?.('title')?.trim() || ''
  const ariaLabel = el.getAttribute?.('aria-label')?.trim() || ''

  if (!selector) {
    if (placeholder) {
      selector = `${tagName}[placeholder*="${placeholder.slice(0, 20)}"]`
    } else if (name) {
      selector = `${tagName}[name="${name}"]`
    } else if (ariaLabel) {
      selector = `${tagName}[aria-label*="${ariaLabel.slice(0, 20)}"]`
    } else if (role) {
      selector = `[role="${role}"]`
    } else if (tagName === 'button') {
      selector = 'button'
    } else if (tagName === 'a') {
      selector = 'a'
    } else {
      selector = tagName || 'div'
    }
  }

  let rx = 0.5
  let ry = 0.5
  try {
    const rect = el.getBoundingClientRect()
    const w = window.innerWidth || 1
    const h = window.innerHeight || 1
    rx = Math.round(((rect.left + rect.width / 2) / w) * 100) / 100
    ry = Math.round(((rect.top + rect.height / 2) / h) * 100) / 100
  } catch {}

  const esInput = tagName === 'input' || tagName === 'textarea'
  let etiqueta = ''
  if (esInput) {
    etiqueta = `Campo: ${placeholder || name || el.id || 'Texto'}`
  } else {
    etiqueta = textoLimpio || title || ariaLabel || el.id || tagName
  }

  return {
    selector,
    textoBoton: (!esInput && textoLimpio) ? textoLimpio : undefined,
    rx: isNaN(rx) ? 0.5 : rx,
    ry: isNaN(ry) ? 0.5 : ry,
    etiqueta,
    esInput,
  }
}

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
  const [cursorActivo, setCursorActivo] = useState(true)

  // Grabador de pantalla en video Full HD integrado (WebM)
  const [grabando, setGrabando] = useState(false)
  const [segundosGrabacion, setSegundosGrabacion] = useState(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerGrabacionRef = useRef(null)

  // Grabador interactivo de macro / secuencia de acciones paso a paso
  const [modoGrabacion, setModoGrabacion] = useState(false)
  const [accionesGrabadas, setAccionesGrabadas] = useState([])
  const [tieneRutinaGuardada, setTieneRutinaGuardada] = useState(false)
  const [fasesGrabadas, setFasesGrabadas] = useState({})
  const [mensajeGuardado, setMensajeGuardado] = useState('')
  const bufferTipeoRef = useRef(null)
  const timerDebounceTipeoRef = useRef(null)
  const accionesGrabadasRef = useRef([])
  const [panelGrabadorMinimizado, setPanelGrabadorMinimizado] = useState(false)
  const [spotlightMinimizado, setSpotlightMinimizado] = useState(false)

  useEffect(() => {
    accionesGrabadasRef.current = accionesGrabadas
  }, [accionesGrabadas])

  const ultimoPasoEjecutadoRef = useRef(null)
  const onAplicarPasoRef = useRef(onAplicarPaso)
  const onCambiarPasoRef = useRef(onCambiarPaso)

  useEffect(() => {
    onAplicarPasoRef.current = onAplicarPaso
    onCambiarPasoRef.current = onCambiarPaso
  })

  // Sincronizar la vista y el entorno de la plataforma cada vez que cambia la fase activa
  useEffect(() => {
    if (ultimoPasoEjecutadoRef.current === pasoIndex) return
    ultimoPasoEjecutadoRef.current = pasoIndex

    if (typeof onAplicarPasoRef.current === 'function' && pasoActual) {
      onAplicarPasoRef.current(pasoActual)
    }
    if (typeof onCambiarPasoRef.current === 'function' && pasoActual) {
      onCambiarPasoRef.current(pasoActual)
    }
  }, [pasoIndex, pasoActual])

  // Cargar el mapa de fases con rutina personalizada grabada u oficial
  const actualizarMapaFasesGrabadas = useCallback(() => {
    const mapa = {}
    PASOS_DEMO.forEach((p) => {
      let grabada = false
      if (typeof window !== 'undefined') {
        try {
          const item = localStorage.getItem(`sigic_demo_secuencia_${p.fase}`)
          if (item) {
            const parsed = JSON.parse(item)
            if (Array.isArray(parsed) && parsed.length > 0) {
              grabada = true
            }
          }
        } catch {}
      }
      if (!grabada && rutinasOficiales && Array.isArray(rutinasOficiales[String(p.fase)]) && rutinasOficiales[String(p.fase)].length > 0) {
        grabada = true
      }
      if (grabada) {
        mapa[p.fase] = true
      }
    })
    setFasesGrabadas(mapa)
  }, [])

  useEffect(() => {
    actualizarMapaFasesGrabadas()
    const onActualizar = () => actualizarMapaFasesGrabadas()
    window.addEventListener('sigic-rutina-actualizada', onActualizar)
    return () => window.removeEventListener('sigic-rutina-actualizada', onActualizar)
  }, [actualizarMapaFasesGrabadas])

  // Obtener las acciones guardadas previamente de una fase (local o persistida oficial)
  const cargarPasosDeFase = useCallback((fase) => {
    if (typeof window !== 'undefined') {
      try {
        const item = localStorage.getItem(`sigic_demo_secuencia_${fase}`)
        if (item) {
          const parsed = JSON.parse(item)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch {}
    }
    if (rutinasOficiales && Array.isArray(rutinasOficiales[String(fase)]) && rutinasOficiales[String(fase)].length > 0) {
      return rutinasOficiales[String(fase)]
    }
    return []
  }, [])

  // Verificar si la fase actual tiene rutina guardada (en localStorage o persistida oficial)
  const verificarRutinaGuardada = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const guardada = localStorage.getItem(`sigic_demo_secuencia_${pasoActual.fase}`)
        if (guardada) {
          const parsed = JSON.parse(guardada)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTieneRutinaGuardada(true)
            return
          }
        }
      } catch {}
    }
    if (rutinasOficiales && Array.isArray(rutinasOficiales[String(pasoActual.fase)]) && rutinasOficiales[String(pasoActual.fase)].length > 0) {
      setTieneRutinaGuardada(true)
      return
    }
    setTieneRutinaGuardada(false)
  }, [pasoActual.fase])

  useEffect(() => {
    verificarRutinaGuardada()
  }, [verificarRutinaGuardada])

  // Calcular duración estimada de la fase respetando si hay una macro grabada u oficial
  const calcularDuracionMs = useCallback(() => {
    let pasos = []
    if (typeof window !== 'undefined') {
      try {
        const guardada = localStorage.getItem(`sigic_demo_secuencia_${pasoActual.fase}`)
        if (guardada) {
          const parsed = JSON.parse(guardada)
          if (Array.isArray(parsed) && parsed.length > 0) pasos = parsed
        }
      } catch {}
    }
    if (pasos.length === 0 && rutinasOficiales && Array.isArray(rutinasOficiales[String(pasoActual.fase)])) {
      pasos = rutinasOficiales[String(pasoActual.fase)]
    }
    if (pasos.length > 0) {
      const tiempoEstimado = pasos.reduce((acc, p) => acc + (p.pausaDespues || 600) + 600, 1200)
      return Math.max(pasoActual.duracionSegundos * 1000, tiempoEstimado)
    }
    return pasoActual.duracionSegundos * 1000
  }, [pasoActual])

  const [duracionPasoMs, setDuracionPasoMs] = useState(pasoActual.duracionSegundos * 1000)

  useEffect(() => {
    setDuracionPasoMs(calcularDuracionMs())
  }, [pasoIndex, tieneRutinaGuardada, calcularDuracionMs])

  const duracionMs = duracionPasoMs / velocidad

  const timerRef = useRef(null)
  const progresoRef = useRef(null)
  const tiempoInicioRef = useRef(Date.now())

  // Control de avance automático entre fases de la demostración
  useEffect(() => {
    if (pausado || modoGrabacion) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return undefined
    }

    timerRef.current = setTimeout(() => {
      if (pasoIndex < PASOS_DEMO.length - 1) {
        setPasoIndex((prev) => prev + 1)
      } else {
        setPausado(true)
      }
    }, duracionMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pasoIndex, pausado, modoGrabacion, duracionMs])

  const formatearTiempo = (seg) => {
    const m = Math.floor(seg / 60).toString().padStart(2, '0')
    const s = (seg % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Grabador de video WebM
  const iniciarGrabacion = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert('Tu navegador no soporta la grabación directa de pantalla. Te recomendamos usar Win + Alt + R de Windows o Chrome/Edge actualizado.')
        return
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      })

      chunksRef.current = []

      let mimeType = 'video/webm;codecs=vp9'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `Demostracion_SiGIC_Colacion_2026_${new Date().toISOString().slice(0, 10)}.webm`
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        }, 1000)

        stream.getTracks().forEach((track) => track.stop())
        setGrabando(false)
        if (timerGrabacionRef.current) clearInterval(timerGrabacionRef.current)
      }

      stream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') {
          recorder.stop()
        }
      }

      recorder.start(500)
      setGrabando(true)
      setSegundosGrabacion(0)

      timerGrabacionRef.current = setInterval(() => {
        setSegundosGrabacion((prev) => prev + 1)
      }, 1000)

      setPasoIndex(0)
      setPausado(false)
    } catch (err) {
      console.warn('Grabación cancelada o no permitida:', err)
    }
  }

  const detenerGrabacion = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  useEffect(() => {
    if (pasoIndex === PASOS_DEMO.length - 1 && pausado && grabando) {
      const t = setTimeout(() => {
        detenerGrabacion()
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [pasoIndex, pausado, grabando])

  useEffect(() => {
    return () => {
      if (timerGrabacionRef.current) clearInterval(timerGrabacionRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  // Consolidar tipeo pendiente en la macro
  const consolidarBufferTipeo = useCallback(() => {
    if (timerDebounceTipeoRef.current) {
      clearTimeout(timerDebounceTipeoRef.current)
      timerDebounceTipeoRef.current = null
    }
    if (bufferTipeoRef.current && bufferTipeoRef.current.texto) {
      const { selector, texto } = bufferTipeoRef.current
      const nuevoPaso = {
        tipo: 'tipear',
        selector,
        texto,
        etiqueta: `Escribir: "${texto.slice(0, 30)}"`,
        pausaDespues: 800,
        esperarElemento: true,
      }
      setAccionesGrabadas((prev) => {
        if (
          prev.length > 0 &&
          prev[prev.length - 1].tipo === 'tipear' &&
          prev[prev.length - 1].selector === selector
        ) {
          const copia = [...prev]
          copia[copia.length - 1] = nuevoPaso
          return copia
        }
        return [...prev, nuevoPaso]
      })
      bufferTipeoRef.current = null
    }
  }, [])

  // Iniciar modo de grabación cargando los pasos existentes si ya fue grabada
  const iniciarModoGrabacion = () => {
    setPausado(true)
    const pasosExistentes = cargarPasosDeFase(pasoActual.fase)
    setAccionesGrabadas(pasosExistentes)
    bufferTipeoRef.current = null
    setModoGrabacion(true)
  }

  // Cancelar modo de grabación
  const cancelarModoGrabacion = () => {
    setModoGrabacion(false)
    setAccionesGrabadas([])
    bufferTipeoRef.current = null
  }

  // Cambiar directamente a otra fase desde el panel grabador
  const cambiarFaseDesdeGrabador = (nuevoIndice) => {
    if (nuevoIndice === pasoIndex) return
    consolidarBufferTipeo()
    setPasoIndex(nuevoIndice)
    const pasosExistentes = cargarPasosDeFase(PASOS_DEMO[nuevoIndice]?.fase || 1)
    setAccionesGrabadas(pasosExistentes)
    setModoGrabacion(true)
    setPausado(true)
  }

  // Deshacer el último paso registrado
  const deshacerUltimoPaso = () => {
    setAccionesGrabadas((prev) => {
      if (prev.length === 0) return prev
      if (
        prev.length >= 2 &&
        prev[prev.length - 1].tipo === 'click' &&
        prev[prev.length - 2].tipo === 'mover'
      ) {
        return prev.slice(0, -2)
      }
      return prev.slice(0, -1)
    })
  }

  // Restablecer rutina de fábrica eliminando la rutina personalizada de esta fase
  const vaciarRutinaFabrica = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`sigic_demo_secuencia_${pasoActual.fase}`)
      setTieneRutinaGuardada(false)
      setAccionesGrabadas([])
      accionesGrabadasRef.current = []
      actualizarMapaFasesGrabadas()
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('sigic-rutina-actualizada', { detail: { fase: pasoActual.fase } }))
      }, 10)
      setMensajeGuardado(`Fase ${pasoActual.fase} restablecida a valores de fábrica`)
      setTimeout(() => setMensajeGuardado(''), 2500)
    }
  }

  // Guardar la rutina actual en localStorage y persistirla permanentemente en el archivo del proyecto
  const guardarRutinaActual = useCallback((alTerminar) => {
    consolidarBufferTipeo()
    setTimeout(() => {
      const lista = accionesGrabadasRef.current || []
      if (lista.length === 0) {
        alert(`No se han registrado acciones para la Fase ${pasoActual.fase}. Haz clic en los botones o escribe en los campos para registrar pasos.`)
        return
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(`sigic_demo_secuencia_${pasoActual.fase}`, JSON.stringify(lista))
        setTieneRutinaGuardada(true)
        actualizarMapaFasesGrabadas()
        setMensajeGuardado(`Fase ${pasoActual.fase} guardada y persistida`)

        // Persistencia permanente en el archivo oficial del proyecto
        fetch('/api/demo/guardar-rutinas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fase: pasoActual.fase, secuencia: lista })
        }).catch(() => {})

        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('sigic-rutina-actualizada', { detail: { fase: pasoActual.fase } }))
        }, 10)
        setTimeout(() => setMensajeGuardado(''), 2500)
        if (alTerminar) {
          alTerminar(lista)
        }
      }
    }, 80)
  }, [consolidarBufferTipeo, pasoActual.fase, actualizarMapaFasesGrabadas])

  // Persistir todas las fases grabadas en el repositorio para que sobrevivan permanentemente
  const persistirTodasLasFases = async () => {
    if (typeof window === 'undefined') return
    const todas = {}
    PASOS_DEMO.forEach((p) => {
      let lista = null
      try {
        const item = localStorage.getItem(`sigic_demo_secuencia_${p.fase}`)
        if (item) {
          const parsed = JSON.parse(item)
          if (Array.isArray(parsed) && parsed.length > 0) lista = parsed
        }
      } catch {}
      if (!lista && rutinasOficiales && Array.isArray(rutinasOficiales[String(p.fase)])) {
        lista = rutinasOficiales[String(p.fase)]
      }
      if (lista && lista.length > 0) {
        todas[String(p.fase)] = lista
      }
    })

    if (accionesGrabadasRef.current && accionesGrabadasRef.current.length > 0) {
      todas[String(pasoActual.fase)] = accionesGrabadasRef.current
    }

    try {
      const res = await fetch('/api/demo/guardar-rutinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todasLasFases: todas })
      })
      const data = await res.json()
      if (data.ok) {
        setMensajeGuardado('Demostración guardada en el proyecto para el futuro')
        setTimeout(() => setMensajeGuardado(''), 3000)
      }
    } catch {
      setMensajeGuardado('Demostración respaldada localmente')
      setTimeout(() => setMensajeGuardado(''), 2500)
    }
  }

  // Finalizar la grabación de la fase actual y salir del grabador
  const finalizarYGuardarFase = () => {
    guardarRutinaActual(() => {
      setModoGrabacion(false)
      setPausado(true)
    })
  }

  // Guardar la fase actual y avanzar automáticamente a la siguiente fase para continuar grabando
  const guardarYPasarSiguiente = () => {
    guardarRutinaActual(() => {
      if (pasoIndex < PASOS_DEMO.length - 1) {
        const siguienteIndice = pasoIndex + 1
        setPasoIndex(siguienteIndice)
        const pasosSiguiente = cargarPasosDeFase(PASOS_DEMO[siguienteIndice]?.fase || 1)
        setAccionesGrabadas(pasosSiguiente)
        setModoGrabacion(true)
        setPausado(true)
      } else {
        alert(`Has completado y guardado la última fase (Fase ${PASOS_DEMO.length}). Demostración completa configurada.`)
        setModoGrabacion(false)
        setPasoIndex(0)
        setPausado(false)
      }
    })
  }

  // Guardar la fase y probarla de inmediato con el cursor virtual
  const probarFaseActual = () => {
    guardarRutinaActual(() => {
      setModoGrabacion(false)
      setPausado(false)
      setCursorActivo(true)
    })
  }

  // Event Listeners para capturar en vivo los clics y el tipeo del usuario
  useEffect(() => {
    if (!modoGrabacion) return undefined

    const manejarClickGrabacion = (e) => {
      if (
        e.target.closest('#panel-grabador-rutina') ||
        e.target.closest('.z-\\[10000\\]') ||
        e.target.closest('.z-\\[99999\\]')
      ) {
        return
      }

      consolidarBufferTipeo()

      const target = e.target
      const el =
        target.closest(
          'button, a, input, select, textarea, [role="button"], [role="tab"], [role="radio"], tr, label, .cursor-pointer'
        ) || target

      const info = obtenerInfoElemento(el)

      const pasoMover = {
        tipo: 'mover',
        selector: info.selector || undefined,
        textoBoton: info.textoBoton,
        rx: info.rx,
        ry: info.ry,
        etiqueta: `Mover hacia: ${info.etiqueta}`,
        pausaDespues: 500,
        esperarElemento: true,
      }

      const pasoClick = {
        tipo: 'click',
        selector: info.selector || undefined,
        textoBoton: info.textoBoton,
        rx: info.rx,
        ry: info.ry,
        etiqueta: `Clic en: ${info.etiqueta}`,
        pausaDespues: 700,
        esperarElemento: true,
      }

      setAccionesGrabadas((prev) => [...prev, pasoMover, pasoClick])
    }

    const manejarInputGrabacion = (e) => {
      if (
        e.target.closest('#panel-grabador-rutina') ||
        e.target.closest('.z-\\[10000\\]')
      ) {
        return
      }

      const el = e.target
      const val = el.value || ''
      const info = obtenerInfoElemento(el)

      bufferTipeoRef.current = {
        selector: info.selector,
        texto: val,
      }

      if (timerDebounceTipeoRef.current) {
        clearTimeout(timerDebounceTipeoRef.current)
      }

      timerDebounceTipeoRef.current = setTimeout(() => {
        consolidarBufferTipeo()
      }, 750)
    }

    window.addEventListener('click', manejarClickGrabacion, { capture: true })
    window.addEventListener('input', manejarInputGrabacion, { capture: true })

    return () => {
      window.removeEventListener('click', manejarClickGrabacion, { capture: true })
      window.removeEventListener('input', manejarInputGrabacion, { capture: true })
      if (timerDebounceTipeoRef.current) {
        clearTimeout(timerDebounceTipeoRef.current)
      }
    }
  }, [modoGrabacion, consolidarBufferTipeo])

  // Sincronizar acciones grabadas al cambiar de fase
  useEffect(() => {
    bufferTipeoRef.current = null
    if (modoGrabacion) {
      const guardados = cargarPasosDeFase(pasoActual.fase)
      setAccionesGrabadas(guardados)
    }
  }, [pasoIndex, modoGrabacion, cargarPasosDeFase, pasoActual.fase])

  const siguientePaso = () => {
    if (pasoIndex < PASOS_DEMO.length - 1) {
      setPasoIndex((prev) => prev + 1)
    }
  }

  const anteriorPaso = () => {
    if (pasoIndex > 0) {
      setPasoIndex((prev) => prev - 1)
    }
  }

  const saltarAPaso = (indice) => {
    setPasoIndex(indice)
    setMostrarMenuPasos(false)
  }

  const cambiarVelocidad = () => {
    setVelocidad((v) => (v === 1 ? 1.5 : v === 1.5 ? 2 : 1))
  }

  useEffect(() => {
    const manejarTeclado = (e) => {
      if (modoGrabacion) return
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        setPausado((p) => !p)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        siguientePaso()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        anteriorPaso()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        if (typeof onFinalizarDemo === 'function') onFinalizarDemo()
      }
    }

    window.addEventListener('keydown', manejarTeclado)
    return () => window.removeEventListener('keydown', manejarTeclado)
  }, [pasoIndex, modoGrabacion, onFinalizarDemo])

  const menuRef = useRef(null)

  useEffect(() => {
    if (!mostrarMenuPasos) return undefined
    const manejarClickAfuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMostrarMenuPasos(false)
      }
    }
    document.addEventListener('mousedown', manejarClickAfuera)
    return () => document.removeEventListener('mousedown', manejarClickAfuera)
  }, [mostrarMenuPasos])

  const IconoPaso = pasoActual.icono

  return (
    <>
      {/* PANEL FLOTANTE LATERAL DERECHO: MODO GRABACIÓN DE RUTINA PASO A PASO (ULTRA COMPACTO) */}
      {modoGrabacion && (
        panelGrabadorMinimizado ? (
          <div
            id="panel-grabador-rutina"
            className="fixed top-3 right-3 z-[10001] bg-slate-950/95 backdrop-blur-2xl border-2 border-amber-500/80 rounded-xl shadow-2xl px-2.5 py-1.5 flex items-center gap-2 pointer-events-auto font-sans animate-in slide-in-from-top-right duration-150"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute" />
              <div className="w-2 h-2 rounded-full bg-rose-500 relative" />
            </div>
            <span className="text-[10px] font-black uppercase text-amber-400">
              REC F{pasoActual.fase} ({accionesGrabadas.length})
            </span>
            <button
              type="button"
              onClick={deshacerUltimoPaso}
              disabled={accionesGrabadas.length === 0}
              className="p-1 rounded bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 border border-slate-800"
              title="Deshacer último paso"
            >
              <RotateCcw size={11} />
            </button>
            <button
              type="button"
              onClick={finalizarYGuardarFase}
              disabled={accionesGrabadas.length === 0}
              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[9.5px] font-bold disabled:opacity-30 shadow cursor-pointer"
              title="Finalizar y guardar esta fase"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setPanelGrabadorMinimizado(false)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Expandir panel completo"
            >
              <Maximize2 size={11} />
            </button>
          </div>
        ) : (
          <div
            id="panel-grabador-rutina"
            className="fixed top-3 right-3 z-[10001] w-88 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-slate-950/95 backdrop-blur-2xl border-2 border-amber-500/80 rounded-2xl shadow-2xl p-2.5 pointer-events-auto font-sans animate-in slide-in-from-top-right duration-150"
          >
            {/* ENCABEZADO DEL GRABADOR */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute" />
                  <div className="w-2 h-2 rounded-full bg-rose-500 relative" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-400 block truncate">
                    Grabando Fase {pasoActual.fase} de {PASOS_DEMO.length}
                  </span>
                  <span className="text-[10.5px] font-bold text-white block truncate">
                    {pasoActual.titulo}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  {accionesGrabadas.length} pasos
                </span>
                <button
                  type="button"
                  onClick={() => setPanelGrabadorMinimizado(true)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                  title="Minimizar panel a la esquina"
                >
                  <Minimize2 size={11} />
                </button>
                <button
                  type="button"
                  onClick={cancelarModoGrabacion}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition cursor-pointer"
                  title="Cerrar grabador"
                >
                  <X size={11} />
                </button>
              </div>
            </div>

            {/* SELECTOR RÁPIDO DE FASES (1 A 9) */}
            <div className="my-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between gap-1 overflow-x-auto">
              {PASOS_DEMO.map((p, idx) => {
                const estaGrabada = Boolean(fasesGrabadas[p.fase])
                const esActual = pasoIndex === idx
                return (
                  <button
                    key={p.fase}
                    type="button"
                    onClick={() => cambiarFaseDesdeGrabador(idx)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-black transition cursor-pointer shrink-0 flex items-center gap-1 ${
                      esActual
                        ? 'bg-sky-500 text-white shadow-md'
                        : estaGrabada
                        ? 'bg-amber-950/70 border border-amber-600/60 text-amber-300 hover:bg-amber-900'
                        : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                    title={`Fase ${p.fase}: ${p.titulo} (${estaGrabada ? 'Rutina propia grabada' : 'Secuencia de fábrica'})`}
                  >
                    <span>F{p.fase}</span>
                    {estaGrabada && (
                      <span className={`w-1.5 h-1.5 rounded-full ${esActual ? 'bg-white' : 'bg-emerald-400'}`} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* MENSAJE DE CONFIRMACIÓN */}
            {mensajeGuardado && (
              <div className="mb-1 px-2 py-1 bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 rounded-lg text-[9.5px] font-bold flex items-center gap-1.5 animate-in fade-in">
                <Check size={11} className="shrink-0 text-emerald-400" />
                <span className="truncate">{mensajeGuardado}</span>
              </div>
            )}

            {/* LISTA COMPACTA DE ACCIONES */}
            <div className="my-1 max-h-24 overflow-y-auto space-y-1 pr-0.5 text-[10px]">
              {accionesGrabadas.length === 0 ? (
                <div className="py-2 text-center text-slate-500 text-[9.5px] italic">
                  Haz clic o escribe en la pantalla para registrar acciones de esta fase.
                </div>
              ) : (
                accionesGrabadas.map((acc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-1 px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800/80"
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[8.5px] font-mono text-slate-500 w-3 shrink-0">{idx + 1}.</span>
                      <span
                        className={`text-[7.5px] font-black px-1 py-0.2 rounded uppercase shrink-0 ${
                          acc.tipo === 'click'
                            ? 'bg-sky-950 text-sky-400 border border-sky-800/60'
                            : acc.tipo === 'tipear'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {acc.tipo}
                      </span>
                      <span className="truncate text-slate-200 text-[9.5px]">{acc.etiqueta}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* CONTROLES COMPACTOS FASE POR FASE */}
            <div className="flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-slate-800 text-[10px]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={deshacerUltimoPaso}
                  disabled={accionesGrabadas.length === 0}
                  className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-25 text-slate-300 font-bold border border-slate-800 transition cursor-pointer"
                  title="Deshacer último paso"
                >
                  <RotateCcw size={10} />
                  <span>Deshacer</span>
                </button>

                {tieneRutinaGuardada && (
                  <button
                    type="button"
                    onClick={vaciarRutinaFabrica}
                    className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition cursor-pointer"
                    title="Restablecer fase a valores de fábrica"
                  >
                    <Trash2 size={11} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={persistirTodasLasFases}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-950/70 hover:bg-sky-900/80 text-sky-300 font-bold border border-sky-700/60 transition cursor-pointer text-[9px]"
                  title="Persistir todas las fases grabadas permanentemente en el proyecto"
                >
                  <HardDrive size={10} className="text-sky-400" />
                  <span>Persistir Todo</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={probarFaseActual}
                  disabled={accionesGrabadas.length === 0}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/70 text-[9px] font-black uppercase transition cursor-pointer disabled:opacity-25"
                  title="Guardar y reproducir esta fase con el cursor virtual"
                >
                  <Play size={10} fill="currentColor" />
                  <span>Probar</span>
                </button>

                <button
                  type="button"
                  onClick={finalizarYGuardarFase}
                  disabled={accionesGrabadas.length === 0}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-black text-[9px] uppercase shadow-md transition cursor-pointer"
                  title="Finalizar y guardar la rutina de esta fase"
                >
                  <Check size={11} />
                  <span>Finalizar</span>
                </button>

                {pasoIndex < PASOS_DEMO.length - 1 && (
                  <button
                    type="button"
                    onClick={guardarYPasarSiguiente}
                    disabled={accionesGrabadas.length === 0}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-black text-[9px] uppercase shadow-md transition cursor-pointer"
                    title="Guardar esta fase y pasar inmediatamente a grabar la siguiente"
                  >
                    <span>Siguiente</span>
                    <ArrowRight size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* BARRA INFERIOR DE SPOTLIGHT (OCULTA DURANTE LA GRABACIÓN PARA NO TAPAR BOTONES) */}
      {!modoGrabacion && (
        spotlightMinimizado ? (
          <div className="fixed inset-x-0 bottom-2 z-[10000] p-1 pointer-events-none flex justify-center font-sans animate-in slide-in-from-bottom duration-150">
            <div className="pointer-events-auto bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-full px-3 py-1 shadow-2xl flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded-full">
                Fase {pasoActual.fase}/9
              </span>
              <span className="text-[11px] font-bold text-white truncate max-w-[160px] sm:max-w-[240px]">
                {pasoActual.titulo}
              </span>
              <button
                type="button"
                onClick={() => setPausado((p) => !p)}
                className="p-1 rounded-full bg-sky-500 hover:bg-sky-400 text-white transition active:scale-95 cursor-pointer"
                title={pausado ? 'Reanudar' : 'Pausar'}
              >
                {pausado ? <Play size={10} fill="currentColor" /> : <Pause size={10} fill="currentColor" />}
              </button>
              <button
                type="button"
                onClick={iniciarModoGrabacion}
                className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-amber-950/80 hover:bg-amber-900 border border-amber-600/70 text-amber-300 transition active:scale-95 cursor-pointer"
                title="Grabar pasos interactivos"
              >
                Grabar Pasos
              </button>
              <button
                type="button"
                onClick={() => setSpotlightMinimizado(false)}
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                title="Expandir barra completa"
              >
                <Maximize2 size={12} />
              </button>
              <button
                type="button"
                onClick={onFinalizarDemo}
                className="p-1 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                title="Salir de la demostración"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ) : (
          <div className="fixed inset-x-0 bottom-0 z-[10000] p-2 sm:p-2.5 pointer-events-none flex flex-col items-center justify-end font-sans animate-in slide-in-from-bottom duration-150">
            <div className="relative w-full max-w-2xl sm:max-w-3xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl pointer-events-auto transition-all">
              {/* BARRA DE PROGRESO ANIMADA */}
              <div className="w-full bg-slate-800/80 h-1 overflow-hidden rounded-t-2xl">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-400 transition-all duration-300"
                  style={{ width: `${((pasoIndex + 1) / PASOS_DEMO.length) * 100}%` }}
                />
              </div>

              <div className="p-2 sm:p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* INFORMACIÓN EXPLICATIVA COMPACTA */}
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase tracking-wider ${pasoActual.colorRol}`}>
                      {pasoActual.rol}
                    </span>
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                      Fase {pasoActual.fase}/{PASOS_DEMO.length}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.2 rounded flex items-center gap-1">
                      <Zap size={10} className="text-emerald-400" />
                      {pasoActual.accionSimulada}
                    </span>
                    {tieneRutinaGuardada && (
                      <span className="text-[8.5px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/70 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <CircleDot size={8} className="text-amber-400" />
                        Rutina Propia
                      </span>
                    )}
                    {pasoIndex === PASOS_DEMO.length - 1 && pausado && !modoGrabacion ? (
                      <span className="text-[8.5px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.2 rounded flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-emerald-400" /> Demostración finalizada con éxito
                      </span>
                    ) : pausado && !modoGrabacion ? (
                      <span className="text-[8.5px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/50 px-1.5 py-0.2 rounded animate-pulse flex items-center gap-1">
                        <Pause size={9} fill="currentColor" /> Pausado
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-xs font-black text-white flex items-center gap-1">
                    <IconoPaso className="text-cyan-400 shrink-0" size={13} />
                    <span className="truncate">{pasoActual.titulo}</span>
                  </h3>

                  <p className="text-[10px] text-slate-300 font-medium leading-tight max-w-lg line-clamp-1">
                    {pasoActual.descripcion}
                  </p>
                </div>

                {/* BOTONERA DE CONTROL COMPACTA */}
                <div className="flex items-center gap-1 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-800 pt-1.5 sm:pt-0 sm:pl-2">
                  {/* Paso anterior */}
                  <button
                    type="button"
                    onClick={anteriorPaso}
                    disabled={pasoIndex === 0}
                    className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-25 border border-slate-800 transition active:scale-95 cursor-pointer"
                    title="Paso anterior (flecha izquierda)"
                  >
                    <ChevronLeft size={13} />
                  </button>

                  {/* Play / Pausa */}
                  <button
                    type="button"
                    onClick={() => setPausado((p) => !p)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white text-[10px] font-black shadow transition active:scale-95 cursor-pointer"
                    title="Pausar / Reanudar (Espacio)"
                  >
                    {pausado ? <Play size={11} fill="currentColor" /> : <Pause size={11} fill="currentColor" />}
                    <span>{pausado ? 'Reanudar' : 'Pausar'}</span>
                  </button>

                  {/* Siguiente paso */}
                  <button
                    type="button"
                    onClick={siguientePaso}
                    disabled={pasoIndex === PASOS_DEMO.length - 1}
                    className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-25 border border-slate-800 transition active:scale-95 cursor-pointer"
                    title="Siguiente paso (flecha derecha)"
                  >
                    <ChevronRight size={13} />
                  </button>

                  {/* Toggle de Cursor Guiado */}
                  <button
                    type="button"
                    onClick={() => setCursorActivo((c) => !c)}
                    className={`px-1.5 py-1 rounded-lg border text-[8.5px] font-black uppercase transition active:scale-95 cursor-pointer flex items-center gap-1 ${
                      cursorActivo
                        ? 'bg-sky-950/80 border-sky-500/80 text-sky-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
                    }`}
                    title={cursorActivo ? 'Cursor guiado: ON' : 'Cursor guiado: OFF'}
                  >
                    <MousePointer size={10} className={cursorActivo ? 'text-sky-400' : 'text-slate-500'} />
                    <span className="hidden sm:inline">{cursorActivo ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Botón Grabador de Macro / Rutina Paso a Paso */}
                  <button
                    type="button"
                    onClick={modoGrabacion ? cancelarModoGrabacion : iniciarModoGrabacion}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-black uppercase transition active:scale-95 cursor-pointer ${
                      tieneRutinaGuardada
                        ? 'bg-amber-950/70 hover:bg-amber-900/80 border-amber-600/70 text-amber-300'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                    title="Grabar pasos interactivos con el cursor y teclado"
                  >
                    <CircleDot size={10} className={tieneRutinaGuardada ? 'text-amber-400' : 'text-slate-400'} />
                    <span>{tieneRutinaGuardada ? 'Editar' : 'Grabar'}</span>
                  </button>

                  {/* Selector de velocidad */}
                  <button
                    type="button"
                    onClick={cambiarVelocidad}
                    className="px-1.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[8.5px] font-black uppercase transition active:scale-95 cursor-pointer"
                    title="Cambiar velocidad"
                  >
                    {velocidad}x
                  </button>

                  {/* Grabador de video Full HD (WebM) */}
                  <button
                    type="button"
                    onClick={grabando ? detenerGrabacion : iniciarGrabacion}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[8.5px] font-black uppercase transition active:scale-95 cursor-pointer ${
                      grabando
                        ? 'bg-rose-600 hover:bg-rose-500 border-rose-400 text-white shadow-lg animate-pulse'
                        : 'bg-rose-950/50 hover:bg-rose-900/80 border-rose-800/60 text-rose-300'
                    }`}
                    title={grabando ? 'Detener grabación y descargar video' : 'Grabar demostración en archivo WebM'}
                  >
                    <Video size={10} className={grabando ? 'text-white' : 'text-rose-400'} />
                    <span>{grabando ? `REC ${formatearTiempo(segundosGrabacion)}` : 'Video'}</span>
                  </button>

                  {/* Menú de saltar a paso */}
                  <div className="relative" ref={menuRef}>
                    <button
                      type="button"
                      onClick={() => setMostrarMenuPasos((m) => !m)}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-[9px] font-black uppercase transition active:scale-95 cursor-pointer shadow-sm flex items-center gap-1"
                      title="Lista de fases"
                    >
                      <span>Fases</span>
                      <ChevronDown size={10} className="text-cyan-400" />
                    </button>

                    {mostrarMenuPasos && (
                      <div className="absolute right-0 bottom-full mb-2 w-80 bg-slate-950/98 backdrop-blur-2xl border border-slate-700/90 rounded-2xl p-2 shadow-2xl space-y-1 max-h-72 overflow-y-auto z-[9999] font-sans">
                        <div className="flex items-center justify-between px-2 py-1 text-[8.5px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 mb-1">
                          <span>Fases de Demostración</span>
                          <span className="text-cyan-400 font-mono">9 pasos</span>
                        </div>
                        {PASOS_DEMO.map((p, idx) => {
                          const tieneMacro =
                            (typeof window !== 'undefined' &&
                              Boolean(localStorage.getItem(`sigic_demo_secuencia_${p.fase}`))) ||
                            Boolean(rutinasOficiales && rutinasOficiales[String(p.fase)]?.length > 0)

                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => saltarAPaso(idx)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                pasoIndex === idx
                                  ? 'bg-sky-500 text-white shadow-md'
                                  : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="truncate">{p.titulo}</span>
                                {tieneMacro && (
                                  <span className="text-[7px] font-black uppercase px-1 py-0.2 rounded bg-amber-950 border border-amber-700 text-amber-300 shrink-0">
                                    Grabada
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-[7.5px] px-1 py-0.2 rounded font-mono ml-2 shrink-0 ${
                                  pasoIndex === idx ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {p.rol}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Minimizar barra */}
                  <button
                    type="button"
                    onClick={() => setSpotlightMinimizado(true)}
                    className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition active:scale-95 cursor-pointer"
                    title="Minimizar barra"
                  >
                    <Minimize2 size={12} />
                  </button>

                  {/* Salir de la Demo */}
                  <button
                    type="button"
                    onClick={onFinalizarDemo}
                    className="p-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition active:scale-95 cursor-pointer"
                    title="Salir de la demostración (Esc)"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* CURSOR VIRTUAL Y SIMULADOR GUIADO EN PANTALLA COMPLETA */}
      <CursorVirtualDemo
        pasoActual={pasoActual}
        pausado={pausado}
        velocidad={velocidad}
        activo={cursorActivo && !modoGrabacion}
      />
    </>
  )
}
