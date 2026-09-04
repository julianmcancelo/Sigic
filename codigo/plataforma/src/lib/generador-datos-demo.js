/**
 * generador-datos-demo.js
 * Genera datasets academicos aleatorios, coherentes y realistas para la demostracion institucional.
 * Evita la repeticion de valores estaticos (nombres, DNIs, legajos, fechas, ceremonias)
 * y garantiza una narrativa unificada desde la Fase 1 hasta la Fase 7.
 */

const NOMBRES_ARGENTINOS = [
  'Valentina', 'Santiago', 'Camila', 'Mateo', 'Lucia',
  'Agustin', 'Sofia', 'Lucas', 'Florencia', 'Nicolas',
  'Julieta', 'Martin', 'Micaela', 'Facundo', 'Mariana',
  'Gonzalo', 'Antonella', 'Tomas', 'Carolina', 'Franco',
  'Delfina', 'Ignacio', 'Abril', 'Joaquin', 'Rocio'
]

const APELLIDOS_ARGENTINOS = [
  'Gomez', 'Rodriguez', 'Fernandez', 'Lopez', 'Diaz',
  'Martinez', 'Romero', 'Sosa', 'Alvarez', 'Torres',
  'Ruiz', 'Ramirez', 'Flores', 'Benitez', 'Acosta',
  'Medina', 'Herrera', 'Aguirre', 'Castro', 'Pereyra',
  'Gimenez', 'Rios', 'Molina', 'Blanco', 'Morales'
]

const CARRERAS_OFICIALES = [
  { id: 'Analista de Sistemas', nombre: 'Analista de Sistemas', codigo: 'AS' },
  { id: 'Desarrollo de Software', nombre: 'Desarrollo de Software', codigo: 'DS' },
  { id: 'Redes e Infraestructura', nombre: 'Redes e Infraestructura', codigo: 'RI' },
  { id: 'Automatizacion y Robotica', nombre: 'Automatizacion y Robotica', codigo: 'AR' },
  { id: 'Diseno y Desarrollo Web', nombre: 'Diseno y Desarrollo Web', codigo: 'DW' },
  { id: 'Higiene y Seguridad en el Trabajo', nombre: 'Higiene y Seguridad en el Trabajo', codigo: 'ST' }
]

const PLANTILLAS_CEREMONIA = [
  'Acto de Colacion Promocion {ANIO} — Cohorte Primavera',
  'LXIV Ceremonia Solemne de Grado Beltran',
  'Acto Academico de Entrega de Diplomas — Promocion {ANIO}',
  'Colacion Solemne de Grado y Posgrado Beltran {ANIO}',
  'Ceremonia Institucional de Graduados Tecnologicos {ANIO}',
  'Acto Central de Colacion de Carreras Tecnicas {ANIO}'
]

const SEDES_BELTRAN = [
  'Auditorio Mayor Instituto Beltran',
  'Salon de Actos Manuel Beltran',
  'Campus Tecnologico Avellaneda',
  'Anfiteatro Central de Grado Beltran'
]

const COMENTARIOS_JURAMENTO = [
  'Asistire puntual junto a mi familia para el acto protocolar.',
  'Es un inmenso honor recibir mi diploma de grado en el auditorio.',
  'Agradezco profundamente a todo el cuerpo docente y directivo.',
  'Confirmada mi asistencia y la de mis acompanantes para la colacion.',
  'Presente con gran orgullo institucional para este hito academico.'
]

const PROFESORES_ENTREGADORES = [
  { id: 'prof-demo-1', nombre: 'Prof. Gabriel Garcia', materia: 'Sistemas Operativos y Redes' },
  { id: 'prof-demo-2', nombre: 'Ing. Mariana Rossi', materia: 'Arquitectura de Software' },
  { id: 'prof-demo-3', nombre: 'Lic. Martin Fernandez', materia: 'Bases de Datos Avanzadas' },
  { id: 'prof-demo-4', nombre: 'Ing. Carlos Gutierrez', materia: 'Automatizacion Industrial' }
]

function elementoAleatorio(lista) {
  return lista[Math.floor(Math.random() * lista.length)]
}

function numeroAleatorio(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

function normalizarParaCorreo(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function generarCohorteGraduados(egresadoPrincipal, ceremoniaId, anioCeremonia) {
  const nombresDisponibles = [...NOMBRES_ARGENTINOS].sort(() => Math.random() - 0.5)
  const apellidosDisponibles = [...APELLIDOS_ARGENTINOS].sort(() => Math.random() - 0.5)

  const lista = [egresadoPrincipal]
  const cantidadTotal = 12

  for (let i = 1; i < cantidadTotal; i++) {
    const nombrePila = nombresDisponibles[i % nombresDisponibles.length]
    const apellido = apellidosDisponibles[i % apellidosDisponibles.length]
    const carreraObj = CARRERAS_OFICIALES[i % CARRERAS_OFICIALES.length]
    const dni = String(numeroAleatorio(40100000 + i * 50000, 45900000 + i * 50000))
    const legajo = `BEL-${22000 + i * 115}`
    const anioInscripcion = anioCeremonia - (2 + (i % 3))
    const promedio = Number((7.8 + ((i * 1.7) % 2.1)).toFixed(1))
    const correo = `${normalizarParaCorreo(nombrePila)}.${normalizarParaCorreo(apellido)}@sigic.demo.ar`
    const id = `demo-egr-${Date.now()}-${i}`

    // Variacion equilibrada de estados para reflejar una cohorte real
    const estados = ['COMPLETO', 'PENDIENTE', 'SIN_INVITAR', 'COMPLETO', 'PENDIENTE']
    const estadoFlujo = estados[i % estados.length]
    const estadoAsistencia = estadoFlujo === 'COMPLETO' ? 'ACEPTADO' : (estadoFlujo === 'PENDIENTE' ? 'INVITADO' : 'PENDIENTE')

    lista.push({
      id,
      ceremonia_id: ceremoniaId,
      ceremonia_activa: true,
      nombre: `${nombrePila} ${apellido}`,
      nombre_pila: nombrePila,
      apellido: apellido,
      legajo: legajo,
      dni: dni,
      correo: correo,
      carrera: carreraObj.nombre,
      carrera_codigo: carreraObj.codigo,
      anio_inscripcion: anioInscripcion,
      estado: estadoAsistencia,
      estado_flujo: estadoFlujo,
      promedio: promedio,
      asiento_id: null,
      invitados: []
    })
  }

  return lista
}

/**
 * Genera un conjunto completo de datos coordinados para una corrida de demostracion.
 */
export function generarDatosDemoAleatorios() {
  const anioActual = new Date().getFullYear()
  const anioCeremonia = anioActual >= 2026 ? anioActual : 2026

  // 1. Ceremonia aleatoria
  const nombreCeremonia = elementoAleatorio(PLANTILLAS_CEREMONIA).replace('{ANIO}', String(anioCeremonia))
  const mesAleatorio = numeroAleatorio(10, 12)
  const diaAleatorio = numeroAleatorio(12, 28)
  const fechaCeremonia = `${anioCeremonia}-${String(mesAleatorio).padStart(2, '0')}-${String(diaAleatorio).padStart(2, '0')}`
  const fechaLimite = `${anioCeremonia}-${String(mesAleatorio - 1).padStart(2, '0')}-20T18:00`
  const lugarCeremonia = elementoAleatorio(SEDES_BELTRAN)
  const maxInvitados = numeroAleatorio(2, 4)
  const ceremoniaId = `demo-cer-${Date.now()}`

  // 2. Graduado aleatorio
  const nombrePila = elementoAleatorio(NOMBRES_ARGENTINOS)
  const apellido = elementoAleatorio(APELLIDOS_ARGENTINOS)
  const nombreCompleto = `${nombrePila} ${apellido}`
  const dni = String(numeroAleatorio(41100000, 46890000))
  const carreraObj = elementoAleatorio(CARRERAS_OFICIALES)
  const carrera = carreraObj.nombre
  const legajo = `BEL-${numeroAleatorio(10000, 89999)}`
  const anioInscripcion = anioCeremonia - numeroAleatorio(2, 4)
  const promedio = Number((numeroAleatorio(82, 98) / 10).toFixed(1))
  const correo = `${normalizarParaCorreo(nombrePila)}.${normalizarParaCorreo(apellido)}@sigic.demo.ar`
  const graduadoId = `demo-egr-${Date.now()}`

  // 3. Acompanantes coordinados con el apellido
  const nombreFamiliar1 = `${elementoAleatorio(NOMBRES_ARGENTINOS)} ${apellido}`
  const nombreFamiliar2 = `${elementoAleatorio(NOMBRES_ARGENTINOS)} ${elementoAleatorio(APELLIDOS_ARGENTINOS)}`
  const dniFamiliar1 = String(numeroAleatorio(17000000, 24000000))
  const dniFamiliar2 = String(numeroAleatorio(39000000, 45000000))

  // 4. Padrino / Docente
  const profesorSeleccionado = elementoAleatorio(PROFESORES_ENTREGADORES)

  // 5. Butacas asignadas
  const filasDisponibles = ['A', 'B', 'C', 'D']
  const filaElegida = elementoAleatorio(filasDisponibles)
  const butacaNumero = numeroAleatorio(3, 14)
  const butacaEgresadoId = `baja-${filaElegida}-${butacaNumero}`
  const butacaFamiliar1Id = `baja-${filaElegida}-${butacaNumero + 1}`
  const butacaFamiliar2Id = `baja-${filaElegida}-${butacaNumero + 2}`

  const egresadoPrincipal = {
    id: graduadoId,
    ceremonia_id: ceremoniaId,
    ceremonia_activa: true,
    nombre: nombreCompleto,
    nombre_pila: nombrePila,
    apellido: apellido,
    legajo: legajo,
    dni: dni,
    correo: correo,
    carrera: carrera,
    carrera_codigo: carreraObj.codigo,
    anio_inscripcion: anioInscripcion,
    estado: 'ACEPTADO',
    estado_flujo: 'COMPLETO',
    promedio: promedio,
    asiento_id: butacaEgresadoId,
    formula_juramento: 'Por la Patria y los Santos Evangelios'
  }

  // Generar cohorte de 12 graduados diversos para representar el padron institucional
  const cohorteGraduados = generarCohorteGraduados(egresadoPrincipal, ceremoniaId, anioCeremonia)

  const instancia = {
    generadoEn: Date.now(),
    ceremonia: {
      id: ceremoniaId,
      nombre: nombreCeremonia,
      fecha: fechaCeremonia,
      lugar: lugarCeremonia,
      max_invitados: maxInvitados,
      max_entregadores: 3,
      fecha_limite_confirmacion: fechaLimite,
      activa: 1
    },
    graduado: egresadoPrincipal,
    graduados: cohorteGraduados,
    juramento: {
      formula: 'Por la Patria y los Santos Evangelios',
      comentarios: elementoAleatorio(COMENTARIOS_JURAMENTO)
    },
    invitados: [
      { id: `demo-inv-1-${Date.now()}`, egresado_id: graduadoId, nombre: nombreFamiliar1, dni: dniFamiliar1, relacion: 'Padre/Madre', asiento_id: butacaFamiliar1Id },
      { id: `demo-inv-2-${Date.now()}`, egresado_id: graduadoId, nombre: nombreFamiliar2, dni: dniFamiliar2, relacion: 'Familiar', asiento_id: butacaFamiliar2Id }
    ],
    padrino: profesorSeleccionado,
    butacas: {
      egresado: butacaEgresadoId,
      invitados: [butacaFamiliar1Id, butacaFamiliar2Id]
    }
  }

  // Guardar en sessionStorage para sincronizacion dentro de la misma pestana
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('sigic_demo_dataset_activo', JSON.stringify(instancia))
    } catch {}
  }

  return instancia
}

/**
 * Obtiene el dataset activo de la demostracion, o genera uno nuevo si no existe.
 */
export function obtenerDatosDemoActuales() {
  if (typeof window !== 'undefined') {
    try {
      const guardado = sessionStorage.getItem('sigic_demo_dataset_activo')
      if (guardado) {
        const parsed = JSON.parse(guardado)
        if (parsed?.ceremonia?.nombre && parsed?.graduado?.nombre) {
          return parsed
        }
      }
    } catch {}
  }
  return generarDatosDemoAleatorios()
}

/**
 * Limpia el dataset activo de demostracion.
 */
export function limpiarDatosDemo() {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('sigic_demo_dataset_activo')
    } catch {}
  }
}
