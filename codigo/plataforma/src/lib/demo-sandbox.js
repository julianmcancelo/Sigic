/**
 * demo-sandbox.js
 * Sandbox en memoria y almacenamiento de sesion para la ejecucion de demostraciones.
 * Intercepta las llamadas a la API durante el modo demo / piloto automatico,
 * simulando respuestas exitosas con datos coherentes sin interactuar con PostgreSQL.
 */

import { obtenerDatosDemoActuales } from './generador-datos-demo'

class DemoSandbox {
  constructor() {
    this.activo = false
    this.ceremonias = []
    this.egresados = []
    this.invitados = []
    this.entregadores = []
    this.estructuraAnfiteatro = null
    this.mapaRoles = null
  }

  /**
   * Inicializa el sandbox con el dataset aleatorio activo
   */
  iniciar(dataset) {
    this.activo = true
    const datos = dataset || obtenerDatosDemoActuales()
    
    // Ceremonia inicial simulada
    this.ceremonias = [
      {
        ...datos.ceremonia,
        activa: 1
      }
    ]

    // Padrón de egresados completo simulado
    if (Array.isArray(datos.graduados) && datos.graduados.length > 0) {
      this.egresados = datos.graduados.map(g => ({
        ...g,
        invitados: g.id === datos.graduado.id ? (datos.invitados || []) : []
      }))
    } else {
      this.egresados = [
        {
          ...datos.graduado,
          invitados: datos.invitados || []
        }
      ]
    }

    this.invitados = [...(datos.invitados || [])]
    this.entregadores = []

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('sigic_demo_sandbox_activo', 'true')
        sessionStorage.setItem('sigic_demo_sandbox_ceremonias', JSON.stringify(this.ceremonias))
        sessionStorage.setItem('sigic_demo_sandbox_egresados', JSON.stringify(this.egresados))
      } catch {}
    }
  }

  /**
   * Determina si una llamada HTTP debe ser manejada por el sandbox de demostracion
   */
  esPeticionDemo(url, opciones = {}) {
    if (typeof window === 'undefined') return false

    const esDemoActiva = 
      sessionStorage.getItem('sigic_demo_sandbox_activo') === 'true' ||
      sessionStorage.getItem('sigic_demo_activa') === 'true' ||
      localStorage.getItem('sigic_modo_demo') === 'true'

    const token = sessionStorage.getItem('sigic_token') || ''
    const esBypass = token.startsWith('bypass-')

    const cabeceras = opciones?.headers || {}
    let authHeader = ''
    if (typeof cabeceras.get === 'function') {
      authHeader = cabeceras.get('authorization') || ''
    } else if (cabeceras && typeof cabeceras === 'object') {
      authHeader = cabeceras['Authorization'] || cabeceras['authorization'] || ''
    }
    const tieneTokenBypass = authHeader.includes('bypass-')

    if (!esDemoActiva && !esBypass && !tieneTokenBypass) {
      return false
    }

    const urlStr = typeof url === 'string' ? url : (url?.url || '')
    return urlStr.includes('/api/')
  }

  /**
   * Resuelve la peticion de forma simulada y devuelve una instancia Response
   */
  async manejarPeticion(url, opciones = {}) {
    const urlStr = typeof url === 'string' ? url : (url?.url || '')
    const metodo = (opciones?.method || 'GET').toUpperCase()

    let body = null
    if (opciones?.body) {
      try {
        body = typeof opciones.body === 'string' ? JSON.parse(opciones.body) : opciones.body
      } catch {
        body = {}
      }
    }

    const datosDemo = obtenerDatosDemoActuales()

    // 1. CREACION DE CEREMONIA (POST /api/ceremonias)
    if (metodo === 'POST' && urlStr.match(/\/api\/ceremonias(\?|$)/)) {
      const nuevaId = `demo-cer-${Date.now()}`
      const nuevaCeremonia = {
        id: nuevaId,
        nombre: body?.nombre || datosDemo.ceremonia.nombre,
        fecha: body?.fecha || datosDemo.ceremonia.fecha,
        lugar: body?.lugar || datosDemo.ceremonia.lugar,
        max_invitados: body?.max_invitados || datosDemo.ceremonia.max_invitados || 4,
        max_entregadores: 3,
        fecha_limite_confirmacion: body?.fecha_limite_confirmacion || datosDemo.ceremonia.fecha_limite_confirmacion,
        activa: 1,
        creado_en: new Date().toISOString()
      }
      this.ceremonias = [nuevaCeremonia, ...this.ceremonias]
      return this._crearRespuesta({ ok: true, mensaje: 'Ceremonia creada con exito (Modo Demo)', id: nuevaId }, 201)
    }

    // 2. ACTIVAR CEREMONIA (PUT /api/ceremonias/:id/activar)
    if (metodo === 'PUT' && urlStr.includes('/api/ceremonias/') && urlStr.endsWith('/activar')) {
      const match = urlStr.match(/\/api\/ceremonias\/([^/]+)\/activar/)
      const id = match ? match[1] : ''
      this.ceremonias = this.ceremonias.map(c => ({
        ...c,
        activa: c.id === id ? 1 : 0
      }))
      return this._crearRespuesta({ ok: true, mensaje: 'Ceremonia activada con exito (Modo Demo)' }, 200)
    }

    // 3. CONSULTAR CEREMONIA ACTIVA (GET /api/ceremonias/activa)
    if (metodo === 'GET' && urlStr.includes('/api/ceremonias/activa')) {
      const activa = this.ceremonias.find(c => c.activa === 1) || this.ceremonias[0] || datosDemo.ceremonia
      return this._crearRespuesta(activa, 200)
    }

    // 4. LISTAR CEREMONIAS (GET /api/ceremonias)
    if (metodo === 'GET' && urlStr.match(/\/api\/ceremonias(\?|$)/)) {
      if (this.ceremonias.length === 0) {
        this.ceremonias = [{ ...datosDemo.ceremonia, activa: 1 }]
      }
      return this._crearRespuesta(this.ceremonias, 200)
    }

    // 5. REGISTRAR EGRESADO (POST /api/egresados)
    if (metodo === 'POST' && urlStr.match(/\/api\/egresados(\?|$)/)) {
      const nuevoId = `demo-egr-${Date.now()}`
      const nuevoEgresado = {
        id: nuevoId,
        nombre: body?.nombre || datosDemo.graduado.nombre,
        legajo: body?.legajo || datosDemo.graduado.legajo,
        dni: body?.dni || datosDemo.graduado.dni,
        correo: body?.correo || datosDemo.graduado.correo,
        carrera: body?.carrera || datosDemo.graduado.carrera,
        anio_inscripcion: body?.anio_inscripcion || datosDemo.graduado.anio_inscripcion,
        ceremonia_id: body?.ceremonia_id || datosDemo.ceremonia.id,
        estado: 'PENDIENTE',
        promedio: body?.promedio || datosDemo.graduado.promedio || 9.0,
        asiento_id: null,
        creado_en: new Date().toISOString(),
        invitados: []
      }
      this.egresados = [nuevoEgresado, ...this.egresados.filter(e => e.dni !== nuevoEgresado.dni)]
      return this._crearRespuesta({ ok: true, mensaje: 'Graduado creado con exito (Modo Demo)', egresado: nuevoEgresado, id: nuevoId }, 201)
    }

    // 5.1 IMPORTAR EGRESADOS MASIVO (POST /api/egresados/importar o /api/egresados/bulk)
    if (metodo === 'POST' && (urlStr.includes('/api/egresados/importar') || urlStr.includes('/api/egresados/bulk'))) {
      const lista = Array.isArray(body?.egresados)
        ? body.egresados
        : (Array.isArray(body?.graduados) ? body.graduados : (Array.isArray(body) ? body : []))

      const dnisActuales = new Set(this.egresados.map(e => String(e.dni || '').replace(/\D/g, '')).filter(Boolean))
      const legajosActuales = new Set(this.egresados.map(e => String(e.legajo || '').trim().toUpperCase()).filter(Boolean))

      const exitosos = []
      const conflictos = []

      for (let idx = 0; idx < lista.length; idx++) {
        const item = lista[idx]
        const dniLimpio = String(item.dni || '').replace(/\D/g, '')
        const legajoLimpio = String(item.legajo || '').trim().toUpperCase()
        const nombreLimpio = String(item.nombre || `Graduado ${idx + 1}`).trim()

        if (!nombreLimpio || (!dniLimpio && !legajoLimpio)) {
          conflictos.push({
            egresado: nombreLimpio || 'Sin nombre',
            dni: item.dni || '-',
            legajo: item.legajo || '-',
            motivo: 'Registro incompleto: se requiere nombre y DNI o Legajo'
          })
          continue
        }

        const yaExistePorDni = Boolean(dniLimpio && dnisActuales.has(dniLimpio))
        const yaExistePorLegajo = Boolean(legajoLimpio && legajosActuales.has(legajoLimpio))

        if (yaExistePorDni || yaExistePorLegajo) {
          conflictos.push({
            egresado: nombreLimpio,
            dni: item.dni,
            legajo: item.legajo,
            motivo: yaExistePorDni
              ? 'El alumno ya se encuentra registrado previamente en esta ceremonia (DNI duplicado)'
              : 'El alumno ya se encuentra registrado previamente en esta ceremonia (Legajo duplicado)'
          })
          continue
        }

        const nuevo = {
          id: item.id || `demo-egr-imp-${Date.now()}-${idx}`,
          nombre: nombreLimpio,
          dni: item.dni || dniLimpio,
          legajo: item.legajo || legajoLimpio,
          correo: String(item.correo || '').trim(),
          carrera: item.carrera || 'Tecnicatura Superior en Desarrollo de Software',
          anio_inscripcion: item.anio_inscripcion || 2024,
          ceremonia_id: datosDemo?.ceremonia?.id || 'demo-cer-1',
          estado: 'PENDIENTE',
          estado_flujo: 'SIN_INVITAR',
          promedio: item.promedio || 8.5,
          asiento_id: null,
          invitados: []
        }

        exitosos.push(nuevo)
        if (dniLimpio) dnisActuales.add(dniLimpio)
        if (legajoLimpio) legajosActuales.add(legajoLimpio)
      }

      this.egresados = [...this.egresados, ...exitosos]

      return this._crearRespuesta({
        ok: true,
        mensaje: `Importación completada: ${exitosos.length} registrados con éxito (Modo Demo)${conflictos.length > 0 ? `, ${conflictos.length} alumnos ya existían previamente.` : '.'}`,
        importados: exitosos.length,
        exitosos,
        conflictos,
        fallidos: [],
        errores: 0,
        total: lista.length
      }, 200)
    }

    // 6. BUSCAR DNI (GET /api/egresados/dni/:dni)
    if (metodo === 'GET' && urlStr.includes('/api/egresados/dni/')) {
      const match = urlStr.match(/\/api\/egresados\/dni\/([^/?]+)/)
      const dniBuscado = match ? match[1].replace(/\D/g, '') : ''
      const encontrado = this.egresados.find(e => String(e.dni).replace(/\D/g, '') === dniBuscado)
      return this._crearRespuesta(encontrado ? [encontrado] : [], 200)
    }

    // 7. LISTAR EGRESADOS (GET /api/egresados)
    if (metodo === 'GET' && urlStr.includes('/api/egresados')) {
      if (this.egresados.length === 0) {
        this.egresados = Array.isArray(datosDemo?.graduados) && datosDemo.graduados.length > 0
          ? datosDemo.graduados
          : [{ ...datosDemo.graduado, invitados: datosDemo.invitados || [] }]
      }
      return this._crearRespuesta(this.egresados, 200)
    }

    // 8. ENVIAR INVITACIONES (POST /api/egresados/enviar-invitaciones)
    if (metodo === 'POST' && urlStr.includes('/api/egresados/enviar-invitaciones')) {
      this.egresados = this.egresados.map(e => ({
        ...e,
        estado: e.estado === 'PENDIENTE' ? 'INVITADO' : e.estado,
        invitacion_enviada: true
      }))
      return this._crearRespuesta({ ok: true, count: this.egresados.length, mensaje: 'Invitaciones despachadas exitosamente (Modo Demo)' }, 200)
    }

    // 9. ACTUALIZAR EGRESADO (PUT /api/egresados/:id)
    if (metodo === 'PUT' && urlStr.includes('/api/egresados/')) {
      const match = urlStr.match(/\/api\/egresados\/([^/?]+)/)
      const id = match ? match[1] : ''
      this.egresados = this.egresados.map(e => {
        if (e.id === id || String(e.id) === String(id)) {
          return { ...e, ...(body || {}) }
        }
        return e
      })
      const egresadoActualizado = this.egresados.find(e => e.id === id) || { id, ...(body || {}) }
      return this._crearRespuesta({ ok: true, egresado: egresadoActualizado, mensaje: 'Datos actualizados con exito (Modo Demo)' }, 200)
    }

    // 10. ENTREGADORES (POST y GET /api/entregadores)
    if (metodo === 'POST' && urlStr.includes('/api/entregadores')) {
      const nuevoEntregador = {
        id: `demo-ent-${Date.now()}`,
        egresado_id: body?.egresado_id || datosDemo.graduado.id,
        nombre: body?.nombre || datosDemo.padrino.nombre,
        tipo: body?.tipo || 'PROFESOR',
        profesor_id: body?.profesor_id || datosDemo.padrino.id,
        orden: body?.orden || 1
      }
      this.entregadores = [...this.entregadores, nuevoEntregador]
      return this._crearRespuesta({ ok: true, mensaje: 'Padrino asignado con exito (Modo Demo)', entregador: nuevoEntregador }, 201)
    }

    if (metodo === 'GET' && urlStr.includes('/api/entregadores')) {
      return this._crearRespuesta(this.entregadores.length > 0 ? this.entregadores : [
        {
          id: 'demo-ent-1',
          egresado_id: datosDemo.graduado.id,
          nombre: datosDemo.padrino.nombre,
          tipo: 'PROFESOR',
          profesor_id: datosDemo.padrino.id,
          orden: 1
        }
      ], 200)
    }

    // 11. INVITADOS (GET y POST /api/invitados)
    if (metodo === 'GET' && urlStr.includes('/api/invitados')) {
      return this._crearRespuesta(this.invitados.length > 0 ? this.invitados : datosDemo.invitados, 200)
    }

    if (metodo === 'POST' && urlStr.includes('/api/invitados')) {
      const nuevoInv = {
        id: `demo-inv-${Date.now()}`,
        egresado_id: body?.egresado_id || datosDemo.graduado.id,
        nombre: body?.nombre || 'Familiar Invitado',
        dni: body?.dni || '20111222',
        relacion: body?.relacion || 'Familiar'
      }
      this.invitados.push(nuevoInv)
      return this._crearRespuesta({ ok: true, invitado: nuevoInv }, 201)
    }

    // 12. AUTO-SEATING / BUTACAS (POST /api/butacas/auto-asignar)
    if (metodo === 'POST' && urlStr.includes('/api/butacas/auto-asignar')) {
      return this._crearRespuesta({
        ok: true,
        mensaje: 'Distribucion inteligente completada con exito (Modo Demo). Todos los egresados y familiares fueron ubicados.',
        asignados: this.egresados.length
      }, 200)
    }

    // Fallback: Si no coincide con ninguno, dejar pasar a fetch real
    return null
  }

  _crearRespuesta(data, status = 200) {
    const jsonStr = JSON.stringify(data)
    return new Response(jsonStr, {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Sigic-Demo-Sandbox': '1'
      }
    })
  }

  limpiar() {
    this.activo = false
    this.ceremonias = []
    this.egresados = []
    this.invitados = []
    this.entregadores = []
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('sigic_demo_sandbox_activo')
        sessionStorage.removeItem('sigic_demo_sandbox_ceremonias')
        sessionStorage.removeItem('sigic_demo_sandbox_egresados')
      } catch {}
    }
  }
}

export const demoSandbox = new DemoSandbox()
