// Esta funcion valida si el correo tiene una forma general aceptable.
function validarCorreo(correo) {
  const expresionCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return expresionCorreo.test(correo)
}

export function validarFormularioLogin({ correo, clave }) {
  // Aqui acumulamos errores separados por campo.
  const errores = {}

  // Primero validamos que el correo exista.
  // Luego revisamos si tiene un formato similar al de un email real.
  if (!correo.trim()) {
    errores.correo = 'El correo es obligatorio.'
  } else if (!validarCorreo(correo)) {
    errores.correo = 'Ingresa un correo con formato válido.'
  }

  // La contraseña tambien es obligatoria.
  // Ademas exigimos una longitud mínima para esta demo.
  if (!clave.trim()) {
    errores.clave = 'La contraseña es obligatoria.'
  } else if (clave.trim().length < 6) {
    // Esta regla mínima es suficiente para mostrar una validacion simple.
    errores.clave = 'La contraseña debe tener al menos 6 caracteres.'
  }

  // Si el objeto queda vacío, significa que no hubo errores basicos.
  return errores
}
