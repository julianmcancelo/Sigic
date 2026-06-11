import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Zap,
} from 'lucide-react'

export function obtenerDetalleClima(codigoClima) {
  // Mapeamos los codigos de Open-Meteo a un icono y una descripcion simple.
  if (codigoClima === 0) {
    return { icono: Sun, descripcion: 'Cielo despejado' }
  }

  if ([1, 2].includes(codigoClima)) {
    return { icono: CloudSun, descripcion: 'Parcialmente nublado' }
  }

  if (codigoClima === 3) {
    return { icono: Cloud, descripcion: 'Nublado' }
  }

  if ([45, 48].includes(codigoClima)) {
    return { icono: CloudFog, descripcion: 'Neblina' }
  }

  if ([51, 53, 55, 56, 57].includes(codigoClima)) {
    return { icono: CloudDrizzle, descripcion: 'Llovizna' }
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(codigoClima)) {
    return { icono: CloudRain, descripcion: 'Lluvia' }
  }

  if ([71, 73, 75, 77, 85, 86].includes(codigoClima)) {
    return { icono: CloudSnow, descripcion: 'Nieve' }
  }

  if ([95, 96, 99].includes(codigoClima)) {
    return { icono: Zap, descripcion: 'Tormenta' }
  }

  return { icono: CloudSun, descripcion: 'Clima actual' }
}

export async function consultarClimaActual(latitud, longitud) {
  // Open-Meteo permite consultar el clima actual sin autenticacion para esta demo.
  const respuesta = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitud}&longitude=${longitud}&current=temperature_2m,weather_code&timezone=auto`,
  )

  if (!respuesta.ok) {
    throw new Error('No fue posible consultar la temperatura actual.')
  }

  const datos = await respuesta.json()

  return {
    temperatura: datos.current?.temperature_2m ?? null,
    codigoClima: datos.current?.weather_code ?? null,
  }
}
