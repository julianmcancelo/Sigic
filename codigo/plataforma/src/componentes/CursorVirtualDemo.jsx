import React, { useState, useEffect, useRef, useCallback } from 'react'
import rutinasOficiales from '../datos/rutinas-demo-oficiales.json'
import { obtenerDatosDemoActuales } from '../lib/generador-datos-demo'

/**
 * Adapta dinamicamente las acciones de tipeo, botones y etiquetas con los datos aleatorios
 * del dataset activo de la demostracion para garantizar realismo y diversidad.
 */
function dinamizarSecuenciaConDatosAleatorios(acciones, fase) {
  if (!Array.isArray(acciones) || acciones.length === 0) return acciones
  const datos = obtenerDatosDemoActuales()
  if (!datos || !datos.ceremonia || !datos.graduado) return acciones

  return acciones.map(accion => {
    if (accion.tipo !== 'tipear') {
      // Si busca por texto al egresado anterior
      if (accion.textoBoton === 'Julian Prueba' || accion.textoBoton === 'Julieta') {
        return {
          ...accion,
          textoBoton: datos.graduado.nombre_pila || datos.graduado.nombre
        }
      }
      return accion
    }

    const sel = (accion.selector || '').toLowerCase()

    // FASE 1: Datos de Ceremonia
    if (sel.includes('input-nombre-ceremonia')) {
      return {
        ...accion,
        texto: datos.ceremonia.nombre,
        etiqueta: `Escribir: "${datos.ceremonia.nombre}"`
      }
    }
    if (sel.includes('input-fecha-ceremonia')) {
      return {
        ...accion,
        texto: datos.ceremonia.fecha,
        etiqueta: `Escribir: "${datos.ceremonia.fecha}"`
      }
    }
    if (sel.includes('input-max-invitados-ceremonia')) {
      return {
        ...accion,
        texto: String(datos.ceremonia.max_invitados),
        etiqueta: `Escribir: "${datos.ceremonia.max_invitados}"`
      }
    }
    if (sel.includes('input-lugar-ceremonia')) {
      return {
        ...accion,
        texto: datos.ceremonia.lugar,
        etiqueta: `Escribir: "${datos.ceremonia.lugar}"`
      }
    }
    if (sel.includes('input-limite-ceremonia')) {
      return {
        ...accion,
        texto: datos.ceremonia.fecha_limite_confirmacion,
        etiqueta: `Escribir: "${datos.ceremonia.fecha_limite_confirmacion}"`
      }
    }

    // FASE 2: Datos del Graduado
    if (sel.includes('35230531') || sel.includes('dni')) {
      return {
        ...accion,
        texto: datos.graduado.dni,
        etiqueta: `Escribir: "${datos.graduado.dni}"`
      }
    }
    if (sel.includes('cancelo') || sel.includes('nombre')) {
      return {
        ...accion,
        texto: datos.graduado.nombre,
        etiqueta: `Escribir: "${datos.graduado.nombre}"`
      }
    }
    if (sel.includes('227067') || sel.includes('legajo')) {
      return {
        ...accion,
        texto: datos.graduado.legajo,
        etiqueta: `Escribir: "${datos.graduado.legajo}"`
      }
    }
    if (sel.includes('select') || sel.includes('carrera')) {
      return {
        ...accion,
        texto: datos.graduado.carrera,
        etiqueta: `Escribir: "${datos.graduado.carrera}"`
      }
    }
    if (sel.includes('2022') || sel.includes('anio')) {
      return {
        ...accion,
        texto: String(datos.graduado.anio_inscripcion),
        etiqueta: `Escribir: "${datos.graduado.anio_inscripcion}"`
      }
    }
    if (sel.includes('buscador-graduados') || sel.includes('buscar')) {
      const termino = datos.graduado.nombre_pila || datos.graduado.nombre.split(' ')[0]
      return {
        ...accion,
        texto: termino,
        etiqueta: `Filtrando egresado por: "${termino}"`
      }
    }

    // FASE 4: Juramento
    if (sel.includes('juramento') || sel.includes('textarea')) {
      return {
        ...accion,
        texto: datos.juramento.comentarios,
        etiqueta: `Escribir: "${datos.juramento.comentarios}"`
      }
    }

    return accion
  })
}

/**
 * Puntero virtual animado y simulador de acciones guiadas para las fases de la demostración.
 * Mueve un cursor de mouse realista por la pantalla, tipea texto en campos de búsqueda/formularios
 * y genera ondas de clic sobre los botones clave de cada etapa.
 */
export function CursorVirtualDemo({ pasoActual, pausado, velocidad = 1, activo = true }) {
  const [posicion, setPosicion] = useState({ x: -100, y: -100 })
  const [haciendoClic, setHaciendoClic] = useState(false)
  const [ondaClic, setOndaClic] = useState({ activa: false, x: 0, y: 0 })
  const [textoAccion, setTextoAccion] = useState('')
  const [textoTipeado, setTextoTipeado] = useState('')
  const [visible, setVisible] = useState(false)

  const timeoutsRef = useRef([])
  const intervaloTipeoRef = useRef(null)
  const canceladoRef = useRef(false)
  const secuenciaIdRef = useRef(0)

  // Limpiar todos los temporizadores e interrumpir cualquier secuencia activa
  const limpiarTimers = useCallback(() => {
    canceladoRef.current = true
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    if (intervaloTipeoRef.current) {
      clearInterval(intervaloTipeoRef.current)
      intervaloTipeoRef.current = null
    }
  }, [])

  // Helper para esperar milisegundos respetando la velocidad y la cancelación
  const esperarMs = useCallback((ms) => {
    return new Promise((resolve) => {
      const id = setTimeout(() => {
        resolve()
      }, Math.max(10, ms / velocidad))
      timeoutsRef.current.push(id)
    })
  }, [velocidad])

  // Helper para buscar elementos interactivos en el DOM con prioridad semántica y de ID
  const buscarElementoDOM = useCallback((config) => {
    if (typeof document === 'undefined') return null

    // 1. Prioridad Máxima: Buscar por ID directo (#id) si está especificado
    if (config.selector) {
      const selectores = config.selector.split(',').map((s) => s.trim())
      for (const sel of selectores) {
        if (sel.startsWith('#')) {
          try {
            const el = document.querySelector(sel)
            if (el) {
              if (el.closest('.z-\\[99999\\]') || el.closest('.z-\\[10000\\]')) continue
              const rect = el.getBoundingClientRect()
              if (rect.width > 0 && rect.height > 0) return el
            }
          } catch {}
        }
      }
    }

    // 2. Prioridad: Buscar por coincidencia de texto visible en elementos interactivos
    if (config.textoBoton) {
      const textoBuscado = config.textoBoton.toLowerCase().trim()
      const candidatos = Array.from(
        document.querySelectorAll(
          'button, a, [role="button"], [role="tab"], [role="radio"], label, ' +
          'input[type="submit"], input[type="button"], div[class*="cursor-pointer"], ' +
          'h2, h3, article, .stat, tr, span'
        )
      )

      const encontrado = candidatos.find((el) => {
        if (el.closest('.z-\\[99999\\]') || el.closest('.z-\\[10000\\]')) return false
        const t = (el.textContent || el.innerText || el.value || '').toLowerCase()
        if (!t.includes(textoBuscado)) return false
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })

      if (encontrado) {
        const interactivo = encontrado.closest('button, a, [role="button"], [role="tab"], input, label') ||
          encontrado.querySelector('button, a, [role="button"], [role="tab"], input, label') ||
          encontrado
        return interactivo
      }
    }

    // 3. Buscar por selectores CSS generales
    if (config.selector) {
      const selectores = config.selector.split(',').map((s) => s.trim())
      for (const sel of selectores) {
        if (!sel.startsWith('#')) {
          try {
            const elementos = Array.from(document.querySelectorAll(sel))
            const valido = elementos.find((el) => {
              if (el.closest('.z-\\[99999\\]') || el.closest('.z-\\[10000\\]')) return false
              const rect = el.getBoundingClientRect()
              return rect.width > 0 && rect.height > 0
            })
            if (valido) return valido
          } catch {}
        }
      }
    }

    return null
  }, [])

  // Esperar activamente a que un elemento aparezca en el DOM (para modales o vistas que cargan)
  const esperarElemento = useCallback(async (config, maxEsperaMs = 2500) => {
    const inicio = Date.now()
    while (Date.now() - inicio < maxEsperaMs) {
      if (canceladoRef.current) return null
      const el = buscarElementoDOM(config)
      if (el) return el
      await esperarMs(70)
    }
    return null
  }, [buscarElementoDOM, esperarMs])

  // Buscar coordenadas exactas con scroll suave automático si el elemento está fuera de pantalla
  const obtenerCoordenadas = useCallback((config) => {
    if (typeof window === 'undefined') return { x: 0, y: 0, elemento: null }

    const w = window.innerWidth
    const h = window.innerHeight

    const el = buscarElementoDOM(config)
    if (el) {
      try {
        const r = el.getBoundingClientRect()
        if (r.top < 60 || r.bottom > h - 60) {
          el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' })
        }
      } catch {}

      const rect = el.getBoundingClientRect()
      const esInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'

      return {
        x: Math.round(esInput ? rect.left + Math.min(28, rect.width * 0.15) : rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
        elemento: el,
      }
    }

    // Fallback calibrado a coordenadas porcentuales del viewport
    const rx = config.rx ?? 0.5
    const ry = config.ry ?? 0.4
    return {
      x: Math.round(w * rx),
      y: Math.round(h * ry),
      elemento: null,
    }
  }, [buscarElementoDOM])

  // Simular tipeo real en un elemento input disparando eventos nativos de React (devuelve Promise)
  const simularEscritura = useCallback((elemento, texto) => {
    return new Promise((resolve) => {
      if (intervaloTipeoRef.current) clearInterval(intervaloTipeoRef.current)
      let idx = 0
      setTextoTipeado('')

      // Si es un campo select, seleccionar la opción correspondiente y disparar eventos
      if (elemento && elemento.tagName === 'SELECT') {
        try {
          elemento.focus()
          const options = Array.from(elemento.options)
          const matchedOption = options.find(opt => 
            opt.value === texto || 
            opt.text.toLowerCase().includes(texto.toLowerCase()) ||
            texto.toLowerCase().includes(opt.text.toLowerCase())
          )
          if (matchedOption) {
            elemento.value = matchedOption.value
          }
          elemento.dispatchEvent(new Event('input', { bubbles: true }))
          elemento.dispatchEvent(new Event('change', { bubbles: true }))
          setTextoTipeado(matchedOption ? matchedOption.text : texto)
        } catch {}
        const tSel = setTimeout(resolve, Math.max(150, 400 / velocidad))
        timeoutsRef.current.push(tSel)
        return
      }

      // Si es un campo date o datetime-local, inyectar el valor valido de forma directa
      if (elemento && (elemento.type === 'date' || elemento.type === 'datetime-local')) {
        try {
          elemento.focus()
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
          if (nativeSetter) {
            nativeSetter.call(elemento, texto)
          } else {
            elemento.value = texto
          }
          elemento.dispatchEvent(new Event('input', { bubbles: true }))
          elemento.dispatchEvent(new Event('change', { bubbles: true }))
          setTextoTipeado(texto)
        } catch {}
        const tDate = setTimeout(resolve, Math.max(150, 400 / velocidad))
        timeoutsRef.current.push(tDate)
        return
      }

      intervaloTipeoRef.current = setInterval(() => {
        if (canceladoRef.current) {
          clearInterval(intervaloTipeoRef.current)
          intervaloTipeoRef.current = null
          resolve()
          return
        }

        idx += 1
        const sub = texto.slice(0, idx)
        setTextoTipeado(sub)

        if (elemento) {
          try {
            elemento.focus()
            const nativeSetter =
              Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
              Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
            if (nativeSetter) {
              nativeSetter.call(elemento, sub)
            } else {
              elemento.value = sub
            }
            elemento.dispatchEvent(new Event('input', { bubbles: true }))
            elemento.dispatchEvent(new Event('change', { bubbles: true }))
          } catch {}
        }

        if (idx >= texto.length) {
          clearInterval(intervaloTipeoRef.current)
          intervaloTipeoRef.current = null
          resolve()
        }
      }, Math.max(20, 50 / velocidad))
    })
  }, [velocidad])

  // Disparar animación de clic y ejecución de evento real o visual
  const ejecutarClic = useCallback((x, y, elemento, soloVisual = false) => {
    setHaciendoClic(true)
    setOndaClic({ activa: true, x, y })

    if (elemento) {
      try {
        const interactivo = elemento.closest('button, a, [role="button"], [role="tab"], input, label') || elemento
        interactivo.classList.add('ring-2', 'ring-sky-400', 'ring-offset-2')
        const tRing = setTimeout(() => {
          interactivo.classList.remove('ring-2', 'ring-sky-400', 'ring-offset-2')
        }, 500)
        timeoutsRef.current.push(tRing)

        // Ejecutar click y focus real en el elemento del DOM si no es solo visual
        if (!soloVisual) {
          if (typeof interactivo.focus === 'function') {
            interactivo.focus()
          }

          const eventoProps = { bubbles: true, cancelable: true, view: window }
          try {
            interactivo.dispatchEvent(new PointerEvent('pointerdown', eventoProps))
            interactivo.dispatchEvent(new MouseEvent('mousedown', eventoProps))
            interactivo.dispatchEvent(new PointerEvent('pointerup', eventoProps))
            interactivo.dispatchEvent(new MouseEvent('mouseup', eventoProps))
          } catch {}

          if (typeof interactivo.click === 'function') {
            interactivo.click()
          } else {
            try {
              interactivo.dispatchEvent(new MouseEvent('click', eventoProps))
            } catch {}
          }
        }
      } catch {}
    }

    const tClic = setTimeout(() => {
      setHaciendoClic(false)
    }, 160)
    timeoutsRef.current.push(tClic)

    const tOnda = setTimeout(() => {
      setOndaClic({ activa: false, x: 0, y: 0 })
    }, 650)
    timeoutsRef.current.push(tOnda)
  }, [])

  const [rutinaVersion, setRutinaVersion] = useState(0)

  useEffect(() => {
    const onActualizar = () => {
      setTimeout(() => {
        setRutinaVersion((v) => v + 1)
      }, 0)
    }
    window.addEventListener('sigic-rutina-actualizada', onActualizar)
    return () => window.removeEventListener('sigic-rutina-actualizada', onActualizar)
  }, [])

  // Secuencias de acciones ordenadas cronológicamente para cada una de las 9 fases
  const obtenerSecuenciaFase = useCallback((fase) => {
    // 1. Prioridad: Verificar si el usuario grabó una rutina personalizada para esta fase en este navegador
    if (typeof window !== 'undefined') {
      try {
        const personalizada = localStorage.getItem(`sigic_demo_secuencia_${fase}`)
        if (personalizada) {
          const parsed = JSON.parse(personalizada)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
          }
        }
      } catch {}
    }

    // 2. Prioridad: Rutinas oficiales persistidas en el proyecto para el futuro
    if (rutinasOficiales && Array.isArray(rutinasOficiales[String(fase)]) && rutinasOficiales[String(fase)].length > 0) {
      return rutinasOficiales[String(fase)]
    }

    switch (fase) {
      case 1: // Creación e Inicialización del Acto (GestionCeremonias)
        return [
          {
            tipo: 'mover',
            selector: '#btn-nueva-ceremonia, button.bg-sky-500, button',
            textoBoton: 'Nueva Ceremonia',
            rx: 0.88, ry: 0.12,
            etiqueta: 'Configurando acto oficial de colación...',
            pausaDespues: 600
          },
          {
            tipo: 'click',
            selector: '#btn-nueva-ceremonia, button.bg-sky-500, button',
            textoBoton: 'Nueva Ceremonia',
            etiqueta: 'Abriendo inicializador de hábitat de grado...',
            pausaDespues: 500
          },
          {
            tipo: 'mover',
            selector: '#input-nombre-ceremonia, input[name="nombre"], input',
            esperarElemento: true,
            rx: 0.50, ry: 0.28,
            etiqueta: 'Ingresando denominación institucional...',
            pausaDespues: 350
          },
          {
            tipo: 'tipear',
            selector: '#input-nombre-ceremonia, input[name="nombre"], input',
            texto: 'Colación Oficial Beltrán 2026',
            etiqueta: 'Nombre: "Colación Oficial Beltrán 2026"',
            pausaDespues: 650
          },
          {
            tipo: 'mover',
            selector: '#input-fecha-ceremonia, input[type="date"]',
            esperarElemento: true,
            rx: 0.35, ry: 0.42,
            etiqueta: 'Programando fecha oficial del acto...',
            pausaDespues: 350
          },
          {
            tipo: 'tipear',
            selector: '#input-fecha-ceremonia, input[type="date"]',
            texto: '2026-11-20',
            etiqueta: 'Fecha: 20/11/2026',
            pausaDespues: 550
          },
          {
            tipo: 'mover',
            selector: '#input-max-invitados-ceremonia, input[type="number"]',
            esperarElemento: true,
            rx: 0.65, ry: 0.42,
            etiqueta: 'Configurando cupo de invitados por graduado...',
            pausaDespues: 300
          },
          {
            tipo: 'tipear',
            selector: '#input-max-invitados-ceremonia, input[type="number"]',
            texto: '4',
            etiqueta: 'Máximo invitados: 4 por egresado',
            pausaDespues: 450
          },
          {
            tipo: 'mover',
            selector: '#input-lugar-ceremonia, input[value*="Beltrán" i]',
            esperarElemento: true,
            rx: 0.50, ry: 0.55,
            etiqueta: 'Validando sede y auditorio...',
            pausaDespues: 350
          },
          {
            tipo: 'tipear',
            selector: '#input-lugar-ceremonia, input[value*="Beltrán" i]',
            texto: 'Sede Beltrán Avellaneda',
            etiqueta: 'Sede: Sede Beltrán Avellaneda',
            pausaDespues: 550
          },
          {
            tipo: 'mover',
            selector: '#btn-crear-submit-ceremonia, button[type="submit"]',
            textoBoton: 'Crear',
            rx: 0.70, ry: 0.90,
            etiqueta: 'Confirmando e inicializando hábitat...',
            pausaDespues: 450
          },
          {
            tipo: 'click',
            selector: '#btn-crear-submit-ceremonia, button[type="submit"]',
            textoBoton: 'Crear',
            etiqueta: 'Ceremonia creada y activada con éxito',
            pausaDespues: 850
          },
          {
            tipo: 'mover',
            selector: '[class*="border-sky-500"], h3',
            textoBoton: 'Entorno Activo',
            rx: 0.28, ry: 0.36,
            etiqueta: 'Ceremonia activa confirmada: Auditorio Beltrán',
            pausaDespues: 900
          }
        ]

      case 2: // Carga Masiva e Importación de Graduados (GestionGraduados)
        return [
          {
            tipo: 'mover',
            selector: '#btn-importar-excel, button.bg-emerald-600, button',
            textoBoton: 'Importar Excel',
            rx: 0.68, ry: 0.14,
            etiqueta: 'Validando planilla oficial .xlsx y padrón...',
            pausaDespues: 600
          },
          {
            tipo: 'click',
            selector: '#btn-importar-excel, button.bg-emerald-600, button',
            textoBoton: 'Importar Excel',
            soloVisual: true,
            etiqueta: 'Padrón verificado: 12 egresados listos',
            pausaDespues: 650
          },
          {
            tipo: 'mover',
            selector: '#buscador-graduados, input[placeholder*="Buscar" i], input[type="text"]',
            esperarElemento: true,
            rx: 0.38, ry: 0.22,
            etiqueta: 'Buscando en nómina oficial...',
            pausaDespues: 450
          },
          {
            tipo: 'tipear',
            selector: '#buscador-graduados, input[placeholder*="Buscar" i], input[type="text"]',
            texto: 'Julieta',
            etiqueta: 'Filtrando egresada por nombre y DNI...',
            pausaDespues: 1000
          },
          {
            tipo: 'mover',
            selector: 'tr:has(td), td, div[class*="rounded"]',
            textoBoton: 'Julieta',
            rx: 0.38, ry: 0.42,
            etiqueta: 'Egresada verificada: DNI, Legajo y Correo validados',
            pausaDespues: 1000
          },
          {
            tipo: 'mover',
            selector: '#btn-paso3-convocatoria, button.bg-sky-600, button',
            textoBoton: 'Paso 3',
            rx: 0.88, ry: 0.18,
            etiqueta: 'Continuando a convocatoria y despacho de tokens...',
            pausaDespues: 1200
          }
        ]

      case 3: // Convocatoria Masiva & Tokens OTP (GestionConvocatoria)
        return [
          {
            tipo: 'mover',
            selector: '#tab-convocatoria-pendientes, button:has(strong), button',
            textoBoton: 'Por Invitar',
            rx: 0.24, ry: 0.28,
            etiqueta: 'Segmentando egresados por convocar...',
            pausaDespues: 600
          },
          {
            tipo: 'click',
            selector: '#tab-convocatoria-pendientes, button:has(strong), button',
            textoBoton: 'Por Invitar',
            etiqueta: 'Filtro activo: egresados pendientes de invitación',
            pausaDespues: 650
          },
          {
            tipo: 'mover',
            selector: '#btn-template-studio, button.bg-slate-100, button',
            textoBoton: 'Template Studio',
            rx: 0.72, ry: 0.14,
            etiqueta: 'Previsualizando plantilla oficial de invitación...',
            pausaDespues: 500
          },
          {
            tipo: 'click',
            selector: '#btn-template-studio, button.bg-slate-100, button',
            textoBoton: 'Template Studio',
            etiqueta: 'Abriendo Template Studio con branding Beltrán...',
            pausaDespues: 850
          },
          {
            tipo: 'mover',
            selector: '#btn-cerrar-preview-correo, header button:has(svg), header button',
            esperarElemento: true,
            rx: 0.78, ry: 0.12,
            etiqueta: 'Plantilla aprobada: enlace seguro y token criptográfico',
            pausaDespues: 650
          },
          {
            tipo: 'click',
            selector: '#btn-cerrar-preview-correo, header button:has(svg), header button',
            etiqueta: 'Cerrando previsualización...',
            pausaDespues: 600
          },
          {
            tipo: 'mover',
            selector: 'button.bg-sky-500, button',
            textoBoton: 'Enviar Invitación',
            rx: 0.82, ry: 0.42,
            etiqueta: 'Invitaciones y tokens OTP emitidos con éxito',
            pausaDespues: 1200
          }
        ]

      case 4: // Autogestión del Egresado: Juramento (PanelGraduado)
        return [
          {
            tipo: 'mover',
            selector: '#tarjeta-formula-dios-patria, div[class*="cursor-pointer"]:has(h3)',
            textoBoton: 'Por Dios y por La Patria',
            rx: 0.32, ry: 0.52,
            etiqueta: 'Explorando fórmulas solemnes de juramento...',
            pausaDespues: 600
          },
          {
            tipo: 'click',
            selector: '#tarjeta-formula-dios-patria, div[class*="cursor-pointer"]:has(h3)',
            textoBoton: 'Por Dios y por La Patria',
            etiqueta: 'Seleccionando: Fórmula I (Por Dios y por La Patria)',
            pausaDespues: 800
          },
          {
            tipo: 'mover',
            selector: '#tarjeta-formula-patria, div[class*="cursor-pointer"]:has(h3)',
            textoBoton: 'Por La Patria',
            rx: 0.68, ry: 0.52,
            etiqueta: 'Comparando con Fórmula II (Cívica institucional)...',
            pausaDespues: 600
          },
          {
            tipo: 'click',
            selector: '#tarjeta-formula-patria, div[class*="cursor-pointer"]:has(h3)',
            textoBoton: 'Por La Patria',
            etiqueta: 'Seleccionando: Fórmula II (Por La Patria)',
            pausaDespues: 800
          },
          {
            tipo: 'mover',
            selector: '#textarea-juramento-comentarios, textarea',
            rx: 0.50, ry: 0.76,
            etiqueta: 'Registrando comentarios para el estrado oficial...',
            pausaDespues: 450
          },
          {
            tipo: 'tipear',
            selector: '#textarea-juramento-comentarios, textarea',
            texto: 'Asistiré puntual junto a mi familia',
            etiqueta: 'Escribiendo nota institucional...',
            pausaDespues: 850
          },
          {
            tipo: 'mover',
            selector: '#btn-guardar-juramento, button.bg-slate-900, button',
            textoBoton: 'Guardar comentarios',
            rx: 0.66, ry: 0.86,
            etiqueta: 'Fórmula protocolar registrada exitosamente',
            pausaDespues: 500
          },
          {
            tipo: 'click',
            selector: '#btn-guardar-juramento, button.bg-slate-900, button',
            textoBoton: 'Guardar comentarios',
            etiqueta: 'Fórmula guardada en legajo de grado',
            pausaDespues: 1000
          }
        ]

      case 5: // Registro de Familiares y Padrinos (PanelGraduado)
        return [
          {
            tipo: 'mover',
            selector: '#btn-agregar-padrino, button:has(svg), button',
            textoBoton: 'Agregar padrino',
            rx: 0.28, ry: 0.46,
            etiqueta: 'Asignando docente para la entrega de diploma...',
            pausaDespues: 600
          },
          {
            tipo: 'click',
            selector: '#btn-agregar-padrino, button:has(svg), button',
            textoBoton: 'Agregar padrino',
            etiqueta: 'Abriendo selector de padrinos de la institución...',
            pausaDespues: 750
          },
          {
            tipo: 'mover',
            selector: '#btn-elegir-primer-profesor, button.bg-indigo-600, button',
            esperarElemento: true,
            textoBoton: 'Elegir',
            rx: 0.68, ry: 0.56,
            etiqueta: 'Docente de carrera seleccionado...',
            pausaDespues: 550
          },
          {
            tipo: 'click',
            selector: '#btn-elegir-primer-profesor, button.bg-indigo-600, button',
            textoBoton: 'Elegir',
            etiqueta: 'Padrino de colación confirmado',
            pausaDespues: 850
          },
          {
            tipo: 'mover',
            selector: '#tab-graduado-acompanantes, nav button',
            textoBoton: 'Acompañantes',
            rx: 0.38, ry: 0.38,
            etiqueta: 'Verificando grupo familiar para el pase grupal...',
            pausaDespues: 600
          },
          {
            tipo: 'click',
            selector: '#tab-graduado-acompanantes, nav button',
            textoBoton: 'Acompañantes',
            etiqueta: 'Mostrando familiares registrados con DNI...',
            pausaDespues: 750
          },
          {
            tipo: 'mover',
            selector: 'article, div[class*="rounded-2xl"], h3',
            textoBoton: 'Acompañante',
            rx: 0.50, ry: 0.58,
            etiqueta: 'Pase grupal habilitado: 2 acompañantes vinculados',
            pausaDespues: 1200
          }
        ]

      case 6: // Credencial Digital QR y Google Wallet (ModalCredencial)
        return [
          {
            tipo: 'mover',
            selector: 'svg[title*="QR" i], aside svg, .credencial-graduado svg',
            rx: 0.68, ry: 0.44,
            etiqueta: 'Generando credencial digital QR criptográfica...',
            pausaDespues: 700
          },
          {
            tipo: 'mover',
            selector: 'div[class*="from-sky-50"], section',
            textoBoton: 'Ubicaciones Asignadas',
            rx: 0.42, ry: 0.54,
            etiqueta: 'Pase grupal: egresado + familiares vinculados',
            pausaDespues: 700
          },
          {
            tipo: 'mover',
            selector: '#btn-credencial-google-wallet, button:has(svg), button',
            textoBoton: 'Google Wallet',
            rx: 0.22, ry: 0.90,
            etiqueta: 'Pase oficial listo para Google Wallet (v1.1.0)',
            pausaDespues: 600
          },
          {
            tipo: 'click',
            selector: '#btn-credencial-google-wallet, button:has(svg), button',
            soloVisual: true,
            etiqueta: 'Guardando pase en Google Wallet...',
            pausaDespues: 850
          },
          {
            tipo: 'mover',
            selector: '#btn-credencial-exportar-pdf, button.bg-sky-600, button',
            textoBoton: 'Exportar PDF',
            rx: 0.48, ry: 0.90,
            etiqueta: 'Exportación a PDF con código QR de alta resolución',
            pausaDespues: 600
          },
          {
            tipo: 'click',
            selector: '#btn-credencial-exportar-pdf, button.bg-sky-600, button',
            soloVisual: true,
            etiqueta: 'Credencial lista para validación en portería',
            pausaDespues: 1200
          }
        ]

      case 7: // Distribución Inteligente de Butacas (PreparacionCeremonia)
        return [
          {
            tipo: 'mover',
            selector: 'header, h2',
            textoBoton: 'Distribución y Asignación',
            rx: 0.35, ry: 0.12,
            etiqueta: 'Analizando plano del auditorio: Platea Baja y Balcón...',
            pausaDespues: 700
          },
          {
            tipo: 'mover',
            selector: '#btn-auto-asignar-butacas, button.bg-gradient-to-r, button:has(svg)',
            textoBoton: 'Auto-Asignar Butacas',
            rx: 0.76, ry: 0.12,
            etiqueta: 'Ejecutando algoritmo Auto-Seating por carrera...',
            pausaDespues: 650
          },
          {
            tipo: 'click',
            selector: '#btn-auto-asignar-butacas, button.bg-gradient-to-r, button:has(svg)',
            soloVisual: true,
            etiqueta: 'Calculando orden alfabético y bloques contiguos...',
            pausaDespues: 900
          },
          {
            tipo: 'mover',
            selector: 'button.bg-slate-900, button',
            textoBoton: 'Platea Baja',
            rx: 0.78, ry: 0.28,
            etiqueta: 'Graduados ubicados en Platea Baja por orden alfabético',
            pausaDespues: 850
          },
          {
            tipo: 'mover',
            selector: 'button',
            textoBoton: 'Pullman',
            rx: 0.88, ry: 0.28,
            etiqueta: 'Familiares y acompañantes ubicados en sectores contiguos',
            pausaDespues: 850
          },
          {
            tipo: 'mover',
            selector: 'header',
            rx: 0.50, ry: 0.22,
            etiqueta: '100% de butacas del auditorio asignadas automáticamente',
            pausaDespues: 1200
          }
        ]

      case 8: // Acreditación de Ingreso y Control de Aforo (ControlIngreso)
        return [
          {
            tipo: 'mover',
            selector: '#btn-abrir-escaner-respaldo, button.underline, button',
            textoBoton: 'escáner web',
            rx: 0.25, ry: 0.78,
            etiqueta: 'Iniciando terminal de acreditación de portería...',
            pausaDespues: 600
          },
          {
            tipo: 'click',
            selector: '#btn-abrir-escaner-respaldo, button.underline, button',
            textoBoton: 'escáner web',
            etiqueta: 'Abriendo escáner de alta velocidad en vivo...',
            pausaDespues: 850
          },
          {
            tipo: 'mover',
            selector: '#input-porteria-busqueda, input[placeholder*="DNI" i], input[type="text"]',
            esperarElemento: true,
            rx: 0.25, ry: 0.24,
            etiqueta: 'Lector láser QR capturando credencial digital...',
            pausaDespues: 450
          },
          {
            tipo: 'tipear',
            selector: '#input-porteria-busqueda, input[placeholder*="DNI" i], input[type="text"]',
            texto: '40111222',
            etiqueta: 'Decodificando DNI de egresada...',
            pausaDespues: 750
          },
          {
            tipo: 'mover',
            selector: '#btn-porteria-buscar, button.bg-sky-500, button[type="submit"]',
            textoBoton: 'Buscar',
            rx: 0.42, ry: 0.24,
            etiqueta: 'Consultando credencial en base de datos oficial...',
            pausaDespues: 500
          },
          {
            tipo: 'click',
            selector: '#btn-porteria-buscar, button.bg-sky-500, button[type="submit"]',
            textoBoton: 'Buscar',
            etiqueta: 'Credencial encontrada: Julieta Pérez (Butaca baja-A-1)',
            pausaDespues: 950
          },
          {
            tipo: 'mover',
            selector: '#btn-porteria-acreditar-grupo, button.bg-emerald-500, button',
            textoBoton: 'Acreditar',
            rx: 0.72, ry: 0.54,
            etiqueta: 'Validando ingreso formal de egresado y familiares...',
            pausaDespues: 650
          },
          {
            tipo: 'click',
            selector: '#btn-porteria-acreditar-grupo, button.bg-emerald-500, button',
            soloVisual: true,
            etiqueta: 'Ingreso confirmado: 3 personas · Aforo en sala: 85%',
            pausaDespues: 1200
          }
        ]

      case 9: // Cierre Legal y Acta Oficial (EstadoCeremonia)
        return [
          {
            tipo: 'mover',
            selector: 'header h1, .stat',
            textoBoton: 'Estado de la ceremonia',
            rx: 0.32, ry: 0.08,
            etiqueta: 'Auditando métricas finales y quórum protocolar...',
            pausaDespues: 700
          },
          {
            tipo: 'mover',
            selector: '#btn-abrir-acta-oficial, button.bg-emerald-600, button',
            textoBoton: 'Acta Oficial',
            rx: 0.74, ry: 0.08,
            etiqueta: 'Generando Acta Notarial Oficial de Colación...',
            pausaDespues: 600
          },
          {
            tipo: 'click',
            selector: '#btn-abrir-acta-oficial, button.bg-emerald-600, button',
            textoBoton: 'Acta Oficial',
            etiqueta: 'Abriendo Acta Oficial con firmas rectorales...',
            pausaDespues: 850
          },
          {
            tipo: 'mover',
            selector: '#btn-acta-libro-matriz, button.bg-slate-800, button',
            esperarElemento: true,
            textoBoton: 'Libro Matriz',
            rx: 0.62, ry: 0.14,
            etiqueta: 'Libro matriz certificado para archivo ministerial...',
            pausaDespues: 800
          },
          {
            tipo: 'mover',
            selector: '#btn-acta-imprimir, button.bg-emerald-600, button',
            textoBoton: 'Imprimir',
            rx: 0.76, ry: 0.14,
            etiqueta: 'Certificación notarial y archivo académico completo',
            pausaDespues: 600
          },
          {
            tipo: 'click',
            selector: '#btn-acta-imprimir, button.bg-emerald-600, button',
            soloVisual: true,
            etiqueta: 'Documento legal de colación finalizado',
            pausaDespues: 800
          },
          {
            tipo: 'mover',
            selector: '#btn-cerrar-acta-modal, header button:has(svg), header button',
            rx: 0.86, ry: 0.14,
            etiqueta: 'Ciclo completo de graduación finalizado con éxito',
            pausaDespues: 500
          },
          {
            tipo: 'click',
            selector: '#btn-cerrar-acta-modal, header button:has(svg), header button',
            etiqueta: 'Demostración de ciclo completo finalizada con éxito',
            pausaDespues: 1200
          }
        ]

      default:
        return []
    }
  }, [rutinaVersion])

  // Ejecutor secuencial asíncrono para la fase actual
  useEffect(() => {
    if (!activo || pausado || !pasoActual) {
      limpiarTimers()
      return undefined
    }

    limpiarTimers()
    canceladoRef.current = false
    secuenciaIdRef.current += 1
    const secId = secuenciaIdRef.current

    setVisible(true)

    const fase = pasoActual.fase || 1
    const acciones = dinamizarSecuenciaConDatosAleatorios(obtenerSecuenciaFase(fase), fase)

    const correrSecuencia = async () => {
      // Pequeña pausa inicial de 250ms para permitir que la vista monte sus componentes
      await esperarMs(250)
      if (canceladoRef.current || secuenciaIdRef.current !== secId) return

      for (const paso of acciones) {
        if (canceladoRef.current || secuenciaIdRef.current !== secId) break

        // 1. Notificar etiqueta contextual
        if (paso.etiqueta) {
          setTextoAccion(paso.etiqueta)
        }

        // 2. Si el paso requiere esperar a que el elemento monte en el DOM
        let elemento = null
        if (paso.esperarElemento) {
          elemento = await esperarElemento(paso, 2000)
          if (canceladoRef.current || secuenciaIdRef.current !== secId) break
        }

        // 3. Localizar coordenadas reales del elemento o fallback
        const coords = obtenerCoordenadas(paso)
        elemento = coords.elemento || elemento

        // 4. Mover el cursor a la posición calculada
        setPosicion({ x: coords.x, y: coords.y })
        await esperarMs(580) // Tiempo de vuelo del cursor
        if (canceladoRef.current || secuenciaIdRef.current !== secId) break

        // 5. Ejecutar la acción
        if (paso.tipo === 'click') {
          await esperarMs(120)
          if (canceladoRef.current || secuenciaIdRef.current !== secId) break
          ejecutarClic(coords.x, coords.y, elemento, Boolean(paso.soloVisual))
          await esperarMs(paso.pausaDespues || 600)
        } else if (paso.tipo === 'tipear') {
          await esperarMs(150)
          if (canceladoRef.current || secuenciaIdRef.current !== secId) break
          await simularEscritura(elemento, paso.texto || '')
          await esperarMs(paso.pausaDespues || 800)
        } else if (paso.tipo === 'mover') {
          await esperarMs(paso.pausaDespues || 650)
        }
      }
    }

    correrSecuencia()

    return () => {
      limpiarTimers()
    }
  }, [pasoActual, pausado, velocidad, activo, rutinaVersion, limpiarTimers, obtenerSecuenciaFase, esperarMs, esperarElemento, obtenerCoordenadas, simularEscritura, ejecutarClic])

  if (!activo || !visible || posicion.x < 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {/* ONDA EXPANSIVA DE CLIC (RIPPLE) */}
      {ondaClic.activa && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-400/80 bg-sky-400/20 animate-ping pointer-events-none"
          style={{
            left: ondaClic.x,
            top: ondaClic.y,
            width: '44px',
            height: '44px',
          }}
        />
      )}

      {/* CONTENEDOR DEL PUNTERO VIRTUAL Y BURBUJA DE ACCIÓN */}
      <div
        className="absolute top-0 left-0 transition-transform ease-out will-change-transform flex items-start gap-2"
        style={{
          transform: `translate3d(${posicion.x - 3}px, ${posicion.y - 2}px, 0)`,
          transitionDuration: haciendoClic ? '75ms' : '580ms',
        }}
      >
        {/* ICONO DEL CURSOR DE MOUSE PROFESIONAL */}
        <div
          className={`relative transition-transform duration-100 ${
            haciendoClic ? 'scale-85 translate-y-0.5' : 'scale-100'
          }`}
        >
          {/* Halo brillante en la punta del cursor */}
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-sky-400/40 blur-sm rounded-full pointer-events-none" />

          {/* Cursor SVG estilo macOS / Windows de alta visibilidad */}
          <svg
            className="w-7 h-7 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Sombra de contorno oscura */}
            <path
              d="M3 2L11.5 22.5L15.5 15.5L23 13.5L3 2Z"
              fill="#0F172A"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Relleno interior con gradiente sutil */}
            <path
              d="M4.8 4.2L11.2 19.5L14.6 13.6L20.8 12L4.8 4.2Z"
              fill="#1E293B"
            />
            {/* Punto de luz en la punta */}
            <circle cx="5" cy="4" r="1.2" fill="#38BDF8" />
          </svg>
        </div>

        {/* BURBUJA CONTEXTUAL DE ACCIÓN FLOTANTE */}
        {textoAccion && (
          <div className="ml-1 -mt-1 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 bg-slate-950/95 text-slate-100 border border-sky-500/40 rounded-full px-3 py-1 shadow-2xl backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
              <span className="text-[11px] font-semibold tracking-wide whitespace-nowrap">
                {textoAccion}
              </span>
              {textoTipeado && (
                <span className="text-[11px] font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  "{textoTipeado}"
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

