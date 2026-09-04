import React, { useState, useEffect, useRef, useCallback } from 'react'
import rutinasOficiales from '../datos/rutinas-demo-oficiales.json'
import { obtenerDatosDemoActuales } from '../lib/generador-datos-demo'

/**
 * Normaliza una cadena removiendo tildes, caracteres especiales,
 * espacios redundantes y convirtiendo a minusculas para busqueda difusa.
 */
function normalizarCadena(str) {
  if (!str) return ''
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

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
      if (accion.textoBoton === 'Julian Prueba' || accion.textoBoton === 'Julieta' || accion.textoBoton === 'Julian') {
        return {
          ...accion,
          textoBoton: datos.graduado.nombre_pila || datos.graduado.nombre
        }
      }
      return accion
    }

    const sel = (accion.selector || '').toLowerCase()
    const txtOriginal = (accion.texto || '').toLowerCase()

    if (txtOriginal === 'julian' || txtOriginal === 'julieta' || txtOriginal === 'julian prueba') {
      const termino = datos.graduado.nombre_pila || datos.graduado.nombre.split(' ')[0]
      return {
        ...accion,
        texto: termino,
        etiqueta: `Filtrando egresado por: "${termino}"`
      }
    }

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

  // Helper ultra-inteligente para buscar elementos interactivos en el DOM con prioridad contextual, semántica y rescate dinámico
  const buscarElementoDOM = useCallback((config) => {
    if (typeof document === 'undefined' || !config) return null

    // 0. Detectar contenedor activo prioritario (modal abierto, diálogo o ventana superior)
    const modalActivo = document.querySelector(
      '[role="dialog"], .modal, div[class*="fixed"][class*="z-50"], div[class*="backdrop-blur"][class*="z-"]'
    )
    const contenedores = modalActivo ? [modalActivo, document.body] : [document.body]

    const esVisible = (el) => {
      if (!el) return false
      if (el.closest('.z-\\[99999\\]') || el.closest('.z-\\[10000\\]')) return false
      const rect = el.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    }

    // 1. Prioridad Máxima: Buscar por ID directo (#id)
    if (config.selector) {
      const selectores = config.selector.split(',').map((s) => s.trim())
      for (const sel of selectores) {
        if (sel.startsWith('#')) {
          try {
            const el = document.querySelector(sel)
            if (el && esVisible(el)) return el
          } catch {}
        }
      }
    }

    // 2. Prioridad: Coincidencia Semántica de Texto Normalizado
    if (config.textoBoton) {
      const textoBuscado = normalizarCadena(config.textoBoton)
      for (const contenedor of contenedores) {
        const candidatos = Array.from(
          contenedor.querySelectorAll(
            'button, a, [role="button"], [role="tab"], [role="radio"], label, ' +
            'input[type="submit"], input[type="button"], select, textarea, div[class*="cursor-pointer"], ' +
            'h2, h3, article, td, tr, span, p'
          )
        )

        const encontrado = candidatos.find((el) => {
          if (!esVisible(el)) return false
          const t = normalizarCadena(el.textContent || el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || '')
          return t === textoBuscado || t.includes(textoBuscado) || (textoBuscado.length > 5 && textoBuscado.includes(t))
        })

        if (encontrado) {
          // Si el elemento encontrado es una etiqueta label, buscar su campo input
          if (encontrado.tagName === 'LABEL') {
            const inputAsociado = (encontrado.htmlFor ? document.getElementById(encontrado.htmlFor) : null) ||
              encontrado.querySelector('input, select, textarea') ||
              encontrado.parentElement?.querySelector('input, select, textarea')
            if (inputAsociado && esVisible(inputAsociado)) return inputAsociado
          }

          const interactivo = encontrado.closest('button, a, [role="button"], [role="tab"], input, select, textarea, label') ||
            encontrado.querySelector('button, a, [role="button"], [role="tab"], input, select, textarea, label') ||
            encontrado
          if (esVisible(interactivo)) return interactivo
        }
      }
    }

    // 3. Prioridad: Selectores CSS generales (con soporte de :has-text simulado)
    if (config.selector) {
      const selectores = config.selector.split(',').map((s) => s.trim())
      for (const sel of selectores) {
        if (!sel.startsWith('#')) {
          const matchHasText = sel.match(/^([a-z0-9_-]+)?:has-text\("([^"]+)"\)$/i)
          if (matchHasText) {
            const tag = matchHasText[1] || '*'
            const txt = normalizarCadena(matchHasText[2])
            for (const contenedor of contenedores) {
              const els = Array.from(contenedor.querySelectorAll(tag))
              const match = els.find((el) => esVisible(el) && normalizarCadena(el.textContent).includes(txt))
              if (match) return match
            }
            continue
          }

          // Si el selector es puramente un tag HTML generico sin clases ni atributos, no capturar a ciegas
          const esTagGenerico = /^(button|div|span|p|a|input|select|textarea|header|main|form|tr|td)$/i.test(sel)
          if (esTagGenerico && !config.textoBoton) {
            continue
          }

          for (const contenedor of contenedores) {
            try {
              const elementos = Array.from(contenedor.querySelectorAll(sel))
              const valido = elementos.find((el) => {
                if (!esVisible(el)) return false
                if (config.textoBoton) {
                  const t = normalizarCadena(el.textContent || el.value || '')
                  const b = normalizarCadena(config.textoBoton)
                  return t.includes(b) || b.includes(t)
                }
                return true
              })
              if (valido) return valido
            } catch {}
          }
        }
      }
    }

    // 4. Prioridad: Heurística Inteligente para Campos de Formulario (Tipeo y selección)
    if (config.tipo === 'tipear' || (config.selector && (config.selector.includes('input') || config.selector.includes('select') || config.selector.includes('textarea')))) {
      const selNorm = normalizarCadena(`${config.selector || ''} ${config.etiqueta || ''}`)
      const textoNorm = normalizarCadena(config.texto || '')

      for (const contenedor of contenedores) {
        // Campo Fecha
        if (selNorm.includes('fecha') || selNorm.includes('date') || /^\d{4}-\d{2}-\d{2}/.test(config.texto || '')) {
          const elDate = contenedor.querySelector('input[type="date"], input[type="datetime-local"], input[name*="fecha" i]')
          if (elDate && esVisible(elDate)) return elDate
        }

        // Campo Cupo / Número
        if (selNorm.includes('invitado') || selNorm.includes('max') || selNorm.includes('cupo') || selNorm.includes('number')) {
          const elNum = contenedor.querySelector('input[type="number"], input[name*="invitado" i], input[id*="invitado" i]')
          if (elNum && esVisible(elNum)) return elNum
        }

        // Campo DNI / Numérico
        if (selNorm.includes('dni') || selNorm.includes('35230531') || /^\d{7,8}$/.test(config.texto || '')) {
          const elDni = contenedor.querySelector('input[placeholder*="35230531"], input[name*="dni" i], input[inputmode="numeric"]')
          if (elDni && esVisible(elDni)) return elDni
        }

        // Campo Nombre
        if (selNorm.includes('nombre') || selNorm.includes('cancelo') || selNorm.includes('ceremonia')) {
          const elNom = contenedor.querySelector('input[id*="nombre" i], input[name="nombre"], input[placeholder*="nombre" i], input[placeholder*="Cancelo" i], input[placeholder*="Colación" i]')
          if (elNom && esVisible(elNom)) return elNom
        }

        // Campo Sede / Lugar
        if (selNorm.includes('lugar') || selNorm.includes('sede') || textoNorm.includes('beltran') || textoNorm.includes('avellaneda')) {
          const elLugar = contenedor.querySelector('input[id*="lugar" i], input[name="lugar"], input[placeholder*="sede" i], input[placeholder*="lugar" i]')
          if (elLugar && esVisible(elLugar)) return elLugar
        }

        // Select de Carreras
        if (selNorm.includes('carrera') || selNorm.includes('select')) {
          const elSelect = contenedor.querySelector('select')
          if (elSelect && esVisible(elSelect)) return elSelect
        }

        // Textarea de Juramento / Comentarios
        if (selNorm.includes('juramento') || selNorm.includes('comentario') || selNorm.includes('textarea')) {
          const elTextarea = contenedor.querySelector('textarea')
          if (elTextarea && esVisible(elTextarea)) return elTextarea
        }

        // Buscador
        if (selNorm.includes('buscar') || selNorm.includes('buscador')) {
          const elSearch = contenedor.querySelector('input[placeholder*="buscar" i], input[type="search"], #buscador-graduados')
          if (elSearch && esVisible(elSearch)) return elSearch
        }

        // Si es tipear y hay formulario en modal activo, buscar el primer campo visible
        if (modalActivo) {
          const inputs = Array.from(modalActivo.querySelectorAll('input:not([type="hidden"]), select, textarea'))
          const primerInput = inputs.find(i => esVisible(i))
          if (primerInput) return primerInput
        }
      }
    }

    // 5. Rescate Inteligente (Smart Recovery) para Clics
    if (config.tipo === 'click') {
      const txtNorm = normalizarCadena(`${config.textoBoton || ''} ${config.etiqueta || ''}`)
      for (const contenedor of contenedores) {
        if (txtNorm.includes('crear') || txtNorm.includes('guardar') || txtNorm.includes('confirmar') || txtNorm.includes('aceptar')) {
          const btnSubmit = contenedor.querySelector('button[type="submit"], button.bg-sky-500, button.bg-slate-900, button.bg-emerald-600')
          if (btnSubmit && esVisible(btnSubmit)) return btnSubmit
        }
        if (txtNorm.includes('cerrar') || txtNorm.includes('cancelar')) {
          const btnCerrar = contenedor.querySelector('button:has(svg), header button, button[aria-label*="cerrar" i]')
          if (btnCerrar && esVisible(btnCerrar)) return btnCerrar
        }
        if (txtNorm.includes('paso 3') || txtNorm.includes('convocatoria') || txtNorm.includes('siguiente') || txtNorm.includes('continuar')) {
          const btnPaso = document.querySelector('#btn-paso3-convocatoria, button[class*="bg-sky"]')
          if (btnPaso && esVisible(btnPaso)) return btnPaso
        }
      }
    }

    return null
  }, [])

  // Esperar activamente a que un elemento aparezca en el DOM (para modales o vistas que cargan)
  const esperarElemento = useCallback(async (config, maxEsperaMs = 3500) => {
    const inicio = Date.now()
    while (Date.now() - inicio < maxEsperaMs) {
      if (canceladoRef.current) return null
      const el = buscarElementoDOM(config)
      if (el) return el
      await esperarMs(50)
    }
    return null
  }, [buscarElementoDOM, esperarMs])

  // Buscar coordenadas exactas con centrado instantáneo si el elemento está fuera de pantalla
  const obtenerCoordenadas = useCallback((config) => {
    if (typeof window === 'undefined') return { x: 0, y: 0, elemento: null }

    const w = window.innerWidth
    const h = window.innerHeight

    const el = buscarElementoDOM(config)
    if (el) {
      try {
        const r = el.getBoundingClientRect()
        if (r.top < 70 || r.bottom > h - 70 || r.left < 50 || r.right > w - 50) {
          el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' })
        }
      } catch {}

      const rect = el.getBoundingClientRect()
      const esInput = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'

      return {
        x: Math.round(esInput ? Math.max(rect.left + 16, rect.left + Math.min(32, rect.width * 0.15)) : rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
        elemento: el,
      }
    }

    // Fallback calibrado a coordenadas porcentuales del viewport SOLO si no se encuentra ningún elemento interactivo
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
      setTextoTipeado('')

      const targetInput = elemento?.tagName === 'INPUT' || elemento?.tagName === 'TEXTAREA' || elemento?.tagName === 'SELECT'
        ? elemento
        : elemento?.querySelector?.('input, textarea, select') || elemento?.parentElement?.querySelector?.('input, textarea, select') || elemento

      // Campo Select
      if (targetInput && targetInput.tagName === 'SELECT') {
        try {
          targetInput.focus()
          const options = Array.from(targetInput.options)
          const normTexto = normalizarCadena(texto)
          const matchedOption = options.find((opt) => {
            const optVal = normalizarCadena(opt.value)
            const optText = normalizarCadena(opt.text)
            return (
              optVal === normTexto ||
              optText.includes(normTexto) ||
              normTexto.includes(optText) ||
              (normTexto.length > 4 && optText.startsWith(normTexto.slice(0, 4)))
            )
          })
          if (matchedOption) {
            targetInput.value = matchedOption.value
          } else if (options.length > 1) {
            targetInput.value = options[1].value
          }
          targetInput.dispatchEvent(new Event('input', { bubbles: true }))
          targetInput.dispatchEvent(new Event('change', { bubbles: true }))
          setTextoTipeado(matchedOption ? matchedOption.text : texto)
        } catch {}
        const tSel = setTimeout(resolve, Math.max(150, 400 / velocidad))
        timeoutsRef.current.push(tSel)
        return
      }

      // Campo Fecha / Datetime
      if (targetInput && (targetInput.type === 'date' || targetInput.type === 'datetime-local')) {
        try {
          targetInput.focus()
          let valorFormateado = texto
          if (targetInput.type === 'datetime-local' && !valorFormateado.includes('T')) {
            valorFormateado = `${valorFormateado}T10:00`
          } else if (targetInput.type === 'date' && valorFormateado.includes('T')) {
            valorFormateado = valorFormateado.split('T')[0]
          }
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
          if (nativeSetter) {
            nativeSetter.call(targetInput, valorFormateado)
          } else {
            targetInput.value = valorFormateado
          }
          targetInput.dispatchEvent(new Event('input', { bubbles: true }))
          targetInput.dispatchEvent(new Event('change', { bubbles: true }))
          setTextoTipeado(valorFormateado)
        } catch {}
        const tDate = setTimeout(resolve, Math.max(150, 400 / velocidad))
        timeoutsRef.current.push(tDate)
        return
      }

      // Texto estándar / Números / Textarea con cadencia humana orgánica
      let idx = 0
      const tipearSiguiente = () => {
        if (canceladoRef.current) {
          resolve()
          return
        }

        idx += 1
        const sub = texto.slice(0, idx)
        setTextoTipeado(sub)

        if (targetInput) {
          try {
            targetInput.focus()
            const proto = targetInput.tagName === 'TEXTAREA'
              ? window.HTMLTextAreaElement.prototype
              : window.HTMLInputElement.prototype
            const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
            if (nativeSetter) {
              nativeSetter.call(targetInput, sub)
            } else {
              targetInput.value = sub
            }
            targetInput.dispatchEvent(new Event('input', { bubbles: true }))
            targetInput.dispatchEvent(new Event('change', { bubbles: true }))
          } catch {}
        }

        if (idx >= texto.length) {
          if (targetInput) {
            try {
              targetInput.dispatchEvent(new Event('change', { bubbles: true }))
              targetInput.dispatchEvent(new Event('blur', { bubbles: true }))
            } catch {}
          }
          resolve()
          return
        }

        // Variacion de cadencia natural humana
        const charActual = texto[idx] || ''
        const esEspacio = charActual === ' '
        const jitter = Math.floor(Math.random() * 35)
        const baseMs = esEspacio ? 130 : 65
        const delay = Math.max(25, (baseMs + jitter) / velocidad)

        const timerId = setTimeout(tipearSiguiente, delay)
        timeoutsRef.current.push(timerId)
      }

      tipearSiguiente()
    })
  }, [velocidad])

  // Disparar animación de clic y ejecución de evento real o visual
  const ejecutarClic = useCallback((x, y, elemento, soloVisual = false) => {
    setHaciendoClic(true)
    setOndaClic({ activa: true, x, y })

    if (elemento) {
      try {
        const interactivo = elemento.closest('button, a, [role="button"], [role="tab"], [role="radio"], input, select, textarea, label') || elemento
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
          const esInvalida = !Array.isArray(parsed) || parsed.length === 0 || parsed.some(p =>
            p.textoBoton === 'Inicializar' ||
            p.textoBoton === 'NUEVO ENTORNO' ||
            p.selector === 'form' ||
            p.selector === 'main'
          )
          if (!esInvalida) {
            return parsed
          } else {
            localStorage.removeItem(`sigic_demo_secuencia_${fase}`)
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
            selector: '#btn-nueva-ceremonia',
            textoBoton: 'Nueva Ceremonia',
            rx: 0.88, ry: 0.12,
            etiqueta: 'Configurando acto oficial de colación...',
            pausaDespues: 600,
            esperarElemento: true
          },
          {
            tipo: 'click',
            selector: '#btn-nueva-ceremonia',
            textoBoton: 'Nueva Ceremonia',
            rx: 0.88, ry: 0.12,
            etiqueta: 'Abriendo inicializador de hábitat de grado...',
            pausaDespues: 600,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: '#input-nombre-ceremonia',
            rx: 0.50, ry: 0.28,
            etiqueta: 'Ingresando denominación institucional...',
            pausaDespues: 350,
            esperarElemento: true
          },
          {
            tipo: 'click',
            selector: '#input-nombre-ceremonia',
            rx: 0.50, ry: 0.28,
            etiqueta: 'Campo de denominación enfocado',
            pausaDespues: 300,
            esperarElemento: true
          },
          {
            tipo: 'tipear',
            selector: '#input-nombre-ceremonia',
            texto: 'LXIV Ceremonia Solemne Beltrán 2026',
            etiqueta: 'Nombre: "LXIV Ceremonia Solemne Beltrán 2026"',
            pausaDespues: 650,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: '#input-fecha-ceremonia',
            rx: 0.35, ry: 0.42,
            etiqueta: 'Programando fecha oficial del acto...',
            pausaDespues: 350,
            esperarElemento: true
          },
          {
            tipo: 'click',
            selector: '#input-fecha-ceremonia',
            rx: 0.35, ry: 0.42,
            etiqueta: 'Campo de fecha enfocado',
            pausaDespues: 300,
            esperarElemento: true
          },
          {
            tipo: 'tipear',
            selector: '#input-fecha-ceremonia',
            texto: '2026-11-20',
            etiqueta: 'Fecha: 20/11/2026',
            pausaDespues: 550,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: '#input-max-invitados-ceremonia',
            rx: 0.65, ry: 0.42,
            etiqueta: 'Configurando cupo de invitados por graduado...',
            pausaDespues: 300,
            esperarElemento: true
          },
          {
            tipo: 'click',
            selector: '#input-max-invitados-ceremonia',
            rx: 0.65, ry: 0.42,
            etiqueta: 'Campo cupo de invitados enfocado',
            pausaDespues: 300,
            esperarElemento: true
          },
          {
            tipo: 'tipear',
            selector: '#input-max-invitados-ceremonia',
            texto: '4',
            etiqueta: 'Máximo invitados: 4 por egresado',
            pausaDespues: 450,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: '#input-lugar-ceremonia',
            rx: 0.50, ry: 0.55,
            etiqueta: 'Validando sede y auditorio...',
            pausaDespues: 350,
            esperarElemento: true
          },
          {
            tipo: 'click',
            selector: '#input-lugar-ceremonia',
            rx: 0.50, ry: 0.55,
            etiqueta: 'Campo de sede enfocado',
            pausaDespues: 300,
            esperarElemento: true
          },
          {
            tipo: 'tipear',
            selector: '#input-lugar-ceremonia',
            texto: 'Sede Beltrán Avellaneda',
            etiqueta: 'Sede: Sede Beltrán Avellaneda',
            pausaDespues: 550,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: '#btn-crear-submit-ceremonia',
            textoBoton: 'Crear',
            rx: 0.70, ry: 0.90,
            etiqueta: 'Confirmando e inicializando hábitat...',
            pausaDespues: 450,
            esperarElemento: true
          },
          {
            tipo: 'click',
            selector: '#btn-crear-submit-ceremonia',
            textoBoton: 'Crear',
            rx: 0.70, ry: 0.90,
            etiqueta: 'Ceremonia creada y activada con éxito',
            pausaDespues: 850,
            esperarElemento: true
          }
        ]

      case 2: // Carga Masiva e Importación de Graduados (GestionGraduados)
        return [
          {
            tipo: 'mover',
            selector: '#btn-importar-excel, button',
            textoBoton: 'Importar Excel / CSV',
            rx: 0.68, ry: 0.14,
            etiqueta: 'Abriendo módulo de importación masiva...',
            pausaDespues: 600,
            esperarElemento: true
          },
          {
            tipo: 'click',
            selector: '#btn-importar-excel, button',
            textoBoton: 'Importar Excel / CSV',
            rx: 0.68, ry: 0.14,
            etiqueta: 'Abriendo asistente de padrón institucional...',
            pausaDespues: 800,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: '#btn-cargar-planilla-modelo, button',
            textoBoton: 'Cargar Padrón Modelo',
            rx: 0.62, ry: 0.22,
            etiqueta: 'Cargando cohorte oficial: 12 graduados en 6 carreras...',
            pausaDespues: 700,
            esperarElemento: true
          },
          {
            tipo: 'click',
            selector: '#btn-cargar-planilla-modelo, button',
            textoBoton: 'Cargar Padrón Modelo',
            rx: 0.62, ry: 0.22,
            etiqueta: '12 egresados previsualizados con DNI, Legajo y Correo',
            pausaDespues: 900,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: '#btn-confirmar-importacion-masiva, button',
            textoBoton: 'Comenzar Importación',
            rx: 0.85, ry: 0.90,
            etiqueta: 'Procesando importación masiva de la cohorte...',
            pausaDespues: 600,
            esperarElemento: true
          },
          {
            tipo: 'click',
            selector: '#btn-confirmar-importacion-masiva, button',
            textoBoton: 'Comenzar Importación',
            rx: 0.85, ry: 0.90,
            etiqueta: 'Importación completada: 12 graduados registrados',
            pausaDespues: 1000,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: '#btn-finalizar-importacion, button',
            textoBoton: 'Finalizar y Ver Padrón',
            rx: 0.88, ry: 0.90,
            etiqueta: 'Cerrando asistente e ingresando a nómina oficial...',
            pausaDespues: 600,
            esperarElemento: true
          },
          {
            tipo: 'click',
            selector: '#btn-finalizar-importacion, button',
            textoBoton: 'Finalizar y Ver Padrón',
            rx: 0.88, ry: 0.90,
            etiqueta: 'Padrón institucional actualizado en tiempo real',
            pausaDespues: 900,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: '#buscador-graduados, input[placeholder*="Buscar" i], input',
            rx: 0.38, ry: 0.22,
            etiqueta: 'Buscando en nómina oficial...',
            pausaDespues: 500,
            esperarElemento: true
          },
          {
            tipo: 'tipear',
            selector: '#buscador-graduados, input[placeholder*="Buscar" i], input',
            texto: 'Julian',
            etiqueta: 'Filtrando egresado por nombre y DNI...',
            pausaDespues: 950,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: 'tr:has(td), div[class*="rounded"]:has(td), tr, td',
            rx: 0.38, ry: 0.42,
            etiqueta: 'Egresado verificado: DNI, Legajo y Correo validados',
            pausaDespues: 1100,
            esperarElemento: true
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
            selector: 'header, h2, div',
            textoBoton: 'Distribución y Asignación',
            rx: 0.35, ry: 0.12,
            etiqueta: 'Analizando plano del auditorio: Platea Baja y Pullman...',
            pausaDespues: 700,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: '#btn-auto-asignar-butacas, button',
            textoBoton: 'Auto-Asignar Butacas',
            rx: 0.76, ry: 0.12,
            etiqueta: 'Ejecutando algoritmo Auto-Seating por carrera...',
            pausaDespues: 650,
            esperarElemento: true
          },
          {
            tipo: 'click',
            selector: '#btn-auto-asignar-butacas, button',
            textoBoton: 'Auto-Asignar Butacas',
            rx: 0.76, ry: 0.12,
            soloVisual: false,
            etiqueta: 'Calculando orden alfabético y bloques contiguos...',
            pausaDespues: 1000,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: 'button',
            textoBoton: 'Platea Baja',
            rx: 0.78, ry: 0.28,
            etiqueta: 'Graduados ubicados en Platea Baja por orden alfabético',
            pausaDespues: 850,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: 'button',
            textoBoton: 'Pullman',
            rx: 0.88, ry: 0.28,
            etiqueta: 'Familiares y acompañantes ubicados en sectores contiguos',
            pausaDespues: 850,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: '#btn-finalizar-preparacion, button',
            textoBoton: 'Finalizar Preparación',
            rx: 0.72, ry: 0.17,
            etiqueta: 'Finalizando preparación oficial de colación...',
            pausaDespues: 700,
            esperarElemento: true
          },
          {
            tipo: 'click',
            selector: '#btn-finalizar-preparacion, button',
            textoBoton: 'Finalizar Preparación',
            rx: 0.72, ry: 0.17,
            etiqueta: 'Generando balance y resumen ejecutivo del acto...',
            pausaDespues: 1100,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: '#btn-cerrar-modal-resumen-x, div[class*="bg-gradient-to-r"]',
            textoBoton: 'Ciclo de Colación Concluido',
            rx: 0.50, ry: 0.25,
            etiqueta: 'Resumen ejecutivo: 12 graduados, 100% butacas asignadas',
            pausaDespues: 1200,
            esperarElemento: true
          },
          {
            tipo: 'mover',
            selector: '#btn-cerrar-resumen-demo, button',
            textoBoton: 'Finalizar Demostración',
            rx: 0.88, ry: 0.92,
            etiqueta: 'Agradecimiento del equipo al Instituto Tecnológico Beltrán',
            pausaDespues: 900,
            esperarElemento: true
          },
          {
            tipo: 'click',
            selector: '#btn-cerrar-resumen-demo, button',
            textoBoton: 'Finalizar Demostración',
            rx: 0.88, ry: 0.92,
            etiqueta: 'Demostración finalizada · Muchas gracias',
            pausaDespues: 1200,
            esperarElemento: true
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

        // 2. Si el paso requiere esperar a que el elemento monte en el DOM (o sondeo adaptativo rápido)
        let elemento = null
        if (paso.esperarElemento) {
          elemento = await esperarElemento(paso, 3500)
        } else {
          elemento = await esperarElemento(paso, 800)
        }
        if (canceladoRef.current || secuenciaIdRef.current !== secId) break

        // 3. Localizar coordenadas reales del elemento o fallback
        const coords = obtenerCoordenadas(paso)
        elemento = coords.elemento || elemento

        // 4. Mover el cursor a la posición calculada con velocidad pausada
        setPosicion({ x: coords.x, y: coords.y })
        await esperarMs(920) // Tiempo de vuelo pausado y natural
        if (canceladoRef.current || secuenciaIdRef.current !== secId) break

        // Pausa de fijación visual previa (mirar y apuntar antes de interactuar)
        await esperarMs(320)
        if (canceladoRef.current || secuenciaIdRef.current !== secId) break

        // 5. Ejecutar la acción
        if (paso.tipo === 'click') {
          const recheck = obtenerCoordenadas(paso)
          const targetElem = recheck.elemento || elemento
          const targetX = recheck.elemento ? recheck.x : coords.x
          const targetY = recheck.elemento ? recheck.y : coords.y
          setPosicion({ x: targetX, y: targetY })
          ejecutarClic(targetX, targetY, targetElem, Boolean(paso.soloVisual))
          await esperarMs(paso.pausaDespues || 950)
        } else if (paso.tipo === 'tipear') {
          const recheck = obtenerCoordenadas(paso)
          const targetElem = recheck.elemento || elemento
          const targetX = recheck.elemento ? recheck.x : coords.x
          const targetY = recheck.elemento ? recheck.y : coords.y
          setPosicion({ x: targetX, y: targetY })
          await simularEscritura(targetElem, paso.texto || '')
          await esperarMs(paso.pausaDespues || 1000)
        } else if (paso.tipo === 'mover') {
          await esperarMs(paso.pausaDespues || 850)
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
        className="absolute top-0 left-0 transition-transform will-change-transform flex items-start gap-2"
        style={{
          transform: `translate3d(${posicion.x - 3}px, ${posicion.y - 2}px, 0)`,
          transitionDuration: haciendoClic ? '80ms' : '920ms',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
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

        {/* BURBUJA CONTEXTUAL DE ACCIÓN FLOTANTE ADAPTATIVA */}
        {textoAccion && (() => {
          const flipX = typeof window !== 'undefined' && posicion.x > window.innerWidth - 340
          const flipY = typeof window !== 'undefined' && posicion.y > window.innerHeight - 80
          return (
            <div
              className={`absolute pointer-events-none animate-in fade-in zoom-in-95 duration-200 ${
                flipX ? 'right-full mr-2' : 'left-full ml-2'
              } ${
                flipY ? 'bottom-full mb-2' : '-top-1'
              }`}
            >
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
          )
        })()}
      </div>
    </div>
  )
}

