/**
 * Limitador de peticiones en memoria (SiGIC)
 * Protege endpoints sensibles (login, OTP, setup) contra fuerza bruta y
 * abuso, sin dependencias externas. Para despliegues con múltiples
 * instancias conviene reemplazarlo por un almacén compartido (Redis).
 */

/**
 * Crea un middleware que limita la cantidad de peticiones por clave
 * (IP por defecto) dentro de una ventana de tiempo.
 *
 * @param {object} opciones
 * @param {number} opciones.ventanaMs - Duración de la ventana en ms.
 * @param {number} opciones.maximo - Máximo de peticiones por ventana.
 * @param {string} opciones.mensaje - Mensaje de error al superar el límite.
 * @param {function} [opciones.clave] - Extrae la clave de agrupación del request.
 */
function crearLimitador({ ventanaMs, maximo, mensaje, clave }) {
  const registros = new Map()

  // Limpieza periódica para no acumular memoria
  const limpieza = setInterval(() => {
    const ahora = Date.now()
    for (const [k, registro] of registros) {
      if (ahora > registro.reinicio) registros.delete(k)
    }
  }, ventanaMs)
  limpieza.unref()

  return (req, res, next) => {
    const k = clave ? clave(req) : (req.ip || req.socket.remoteAddress || 'desconocido')
    const ahora = Date.now()
    let registro = registros.get(k)

    if (!registro || ahora > registro.reinicio) {
      registro = { contador: 0, reinicio: ahora + ventanaMs }
      registros.set(k, registro)
    }

    registro.contador++
    if (registro.contador > maximo) {
      const segundosRestantes = Math.ceil((registro.reinicio - ahora) / 1000)
      res.setHeader('Retry-After', segundosRestantes)
      return res.status(429).json({
        error: mensaje || 'Demasiadas peticiones. Probá de nuevo en unos minutos.',
        segundosRestantes,
      })
    }

    next()
  }
}

module.exports = { crearLimitador }
