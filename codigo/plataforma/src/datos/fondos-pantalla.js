/**
 * Catálogo de fondos de pantalla y temas oficiales para SiGIC.
 * Cada estilo define sus gradientes, acentos visuales y personalidad institucional.
 */
export const FONDOS_DISPONIBLES = [
  {
    id: 'beltran',
    nombre: 'Azul Beltrán (Oficial)',
    descripcion: 'Identidad institucional profunda con resplandor cian y estética aeroespacial.',
    tipo: 'oscuro',
    colores: ['#081624', '#0d2b45', '#00b7d3'],
    colorPrincipal: '#0ea5e9',
    colorAcentoLight: '#e0f2fe',
    colorAcentoBorder: '#7dd3fc',
    badge: 'Predeterminado'
  },
  {
    id: 'aurora',
    nombre: 'Medianoche Aurora',
    descripcion: 'Gradiente nórdico con tonalidades esmeralda, turquesa y azul noche.',
    tipo: 'oscuro',
    colores: ['#041c24', '#083332', '#10b981'],
    colorPrincipal: '#10b981',
    colorAcentoLight: '#d1fae5',
    colorAcentoBorder: '#6ee7b7',
    badge: 'Relajante'
  },
  {
    id: 'carbon',
    nombre: 'Obsidiana & Carbón',
    descripcion: 'Acabado mate sobrio y minimalista, ideal para proyectores y salas de control.',
    tipo: 'oscuro',
    colores: ['#0b0f17', '#181f2a', '#475569'],
    colorPrincipal: '#64748b',
    colorAcentoLight: '#f1f5f9',
    colorAcentoBorder: '#94a3b8',
    badge: 'Minimalista'
  },
  {
    id: 'ceremonial',
    nombre: 'Índigo Ceremonial',
    descripcion: 'Azul terciopelo profundo con destellos ámbar y dorados para actos de grado.',
    tipo: 'oscuro',
    colores: ['#0f172a', '#1e1b4b', '#f59e0b'],
    colorPrincipal: '#f59e0b',
    colorAcentoLight: '#fef3c7',
    colorAcentoBorder: '#fcd34d',
    badge: 'Solemne'
  },
  {
    id: 'cybergrid',
    nombre: 'Malla Tecnológica',
    descripcion: 'Trama geométrica de rejilla tecnológica con cuadrícula de alta precisión.',
    tipo: 'oscuro',
    colores: ['#051329', '#082540', '#38bdf8'],
    colorPrincipal: '#38bdf8',
    colorAcentoLight: '#e0f2fe',
    colorAcentoBorder: '#7dd3fc',
    badge: 'Futurista'
  },
  {
    id: 'sunset',
    nombre: 'Ocaso & Cobre',
    descripcion: 'Tonalidades violeta crepúsculo con acentos cálidos en bronce y coral.',
    tipo: 'oscuro',
    colores: ['#1a0f2e', '#2a1245', '#f97316'],
    colorPrincipal: '#f97316',
    colorAcentoLight: '#ffedd5',
    colorAcentoBorder: '#fdba74',
    badge: 'Cálido'
  },
  {
    id: 'emerald',
    nombre: 'Esmeralda Académica',
    descripcion: 'Verde bosque imperial con delicados toques dorados de distinción.',
    tipo: 'oscuro',
    colores: ['#041f17', '#083828', '#eab308'],
    colorPrincipal: '#10b981',
    colorAcentoLight: '#ecfdf5',
    colorAcentoBorder: '#a7f3d0',
    badge: 'Prestigio'
  },
  {
    id: 'sapphire',
    nombre: 'Zafiro Cósmico',
    descripcion: 'Azul cobalto profundo y titanio con resplandor electromagnético.',
    tipo: 'oscuro',
    colores: ['#0a1128', '#001f54', '#60a5fa'],
    colorPrincipal: '#3b82f6',
    colorAcentoLight: '#eff6ff',
    colorAcentoBorder: '#93c5fd',
    badge: 'Profundo'
  },
  {
    id: 'alabaster',
    nombre: 'Alabastro Ejecutivo',
    descripcion: 'Blanco perla y celeste hielo, optimizado para entornos con mucha luz ambiental.',
    tipo: 'claro',
    colores: ['#e2e8f0', '#f1f5f9', '#0284c7'],
    colorPrincipal: '#0284c7',
    colorAcentoLight: '#f0f9ff',
    colorAcentoBorder: '#bae6fd',
    badge: 'Modo Claro'
  }
]

export function obtenerTemaActual(id = 'beltran') {
  return FONDOS_DISPONIBLES.find(f => f.id === id) || FONDOS_DISPONIBLES[0]
}

/**
 * Inyecta las variables CSS del tema directamente en el elemento documentElement (HTML).
 * Esto permite que cualquier pantalla, botón, badge o componente herede el tema instantáneamente.
 */
export function aplicarTemaGlobal(id = 'beltran') {
  if (typeof window === 'undefined' || !document.documentElement) return
  const tema = obtenerTemaActual(id)

  const root = document.documentElement
  root.setAttribute('data-sigic-theme', tema.id)
  root.setAttribute('data-sigic-type', tema.tipo)
  
  root.style.setProperty('--sigic-theme-id', tema.id)
  root.style.setProperty('--sigic-theme-type', tema.tipo)
  root.style.setProperty('--sigic-theme-accent', tema.colorPrincipal)
  root.style.setProperty('--sigic-theme-accent-light', tema.colorAcentoLight)
  root.style.setProperty('--sigic-theme-accent-border', tema.colorAcentoBorder)
  root.style.setProperty('--sigic-theme-bg-0', tema.colores[0])
  root.style.setProperty('--sigic-theme-bg-1', tema.colores[1])
  root.style.setProperty('--sigic-theme-bg-2', tema.colores[2])

  // Si es tipo claro, agregar o remover clases globales correspondientes
  if (tema.tipo === 'claro') {
    document.body.classList.add('sigic-mode-light')
    document.body.classList.remove('sigic-mode-dark')
  } else {
    document.body.classList.add('sigic-mode-dark')
    document.body.classList.remove('sigic-mode-light')
  }
}
