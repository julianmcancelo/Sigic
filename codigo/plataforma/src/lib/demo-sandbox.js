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

    const urlStr = typeof url === 'string' ? url : (url?.url || '')
    // Las operaciones de ceremonias, egresados, invitados y entregadores SIEMPRE viajan a la base de datos real
    if (
      urlStr.includes('/api/ceremonias') ||
      urlStr.includes('/api/egresados') ||
      urlStr.includes('/api/invitados') ||
      urlStr.includes('/api/entregadores')
    ) {
      return false
    }

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
