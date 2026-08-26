/**
 * @file constructor-evento.ts
 * @description Constructor agnóstico de clases y objetos de Eventos (EventTicket).
 */

import { ClaseEvento, PaseEvento } from '../tipos.js';
import { 
  formatearIdCompleto, 
  normalizarCodigoBarras, 
  normalizarFechaIso 
} from '../utilidades/normalizadores.js';

export function construirClaseEvento(emisorId: string, datos: ClaseEvento, idioma = 'es-419') {
  const idCompleto = formatearIdCompleto(emisorId, datos.id);

  const clase: Record<string, any> = {
    id: idCompleto,
    issuerName: datos.nombreOrganizador || 'Organizador',
    eventName: {
      defaultValue: {
        language: idioma,
        value: datos.nombreEvento
      }
    },
    reviewStatus: 'UNDER_REVIEW'
  };

  if (datos.logoUrl) {
    clase.logo = {
      sourceUri: { uri: datos.logoUrl },
      contentDescription: { defaultValue: { language: idioma, value: 'Logo' } }
    };
  }

  if (datos.bannerUrl) {
    clase.heroImage = {
      sourceUri: { uri: datos.bannerUrl },
      contentDescription: { defaultValue: { language: idioma, value: 'Banner' } }
    };
  }

  if (datos.colorFondoHex) {
    clase.hexBackgroundColor = datos.colorFondoHex;
  }

  if (datos.fechaInicio) {
    clase.dateTime = {
      start: normalizarFechaIso(datos.fechaInicio),
      ...(datos.fechaFin ? { end: normalizarFechaIso(datos.fechaFin) } : {})
    };
  }

  if (datos.nombreLugar || datos.direccionLugar) {
    clase.venue = {
      name: { defaultValue: { language: idioma, value: datos.nombreLugar || 'Lugar del Evento' } },
      address: { defaultValue: { language: idioma, value: datos.direccionLugar || '' } }
    };
  }

  return clase;
}

export function construirObjetoEvento(emisorId: string, datos: PaseEvento, idioma = 'es-419') {
  const idClaseCompleto = formatearIdCompleto(emisorId, datos.claseId);
  const idObjetoCompleto = formatearIdCompleto(emisorId, datos.idObjeto);

  const objeto: Record<string, any> = {
    id: idObjetoCompleto,
    classId: idClaseCompleto,
    state: datos.estado || 'ACTIVE',
    ticketHolderName: datos.nombreTitular,
    barcode: normalizarCodigoBarras(datos.codigoBarras)
  };

  // Asignación de asiento / ubicación
  if (datos.ubicacion) {
    objeto.seatInfo = {
      ...(datos.ubicacion.sector ? { section: { defaultValue: { language: idioma, value: String(datos.ubicacion.sector) } } } : {}),
      ...(datos.ubicacion.fila ? { row: { defaultValue: { language: idioma, value: String(datos.ubicacion.fila) } } } : {}),
      ...(datos.ubicacion.asiento ? { seat: { defaultValue: { language: idioma, value: String(datos.ubicacion.asiento) } } } : {}),
      ...(datos.ubicacion.puertaAcceso ? { gate: { defaultValue: { language: idioma, value: String(datos.ubicacion.puertaAcceso) } } } : {})
    };
  }

  // Campos de texto adicionales
  if (datos.campos && datos.campos.length > 0) {
    objeto.textModulesData = datos.campos.map((c, idx) => ({
      id: c.clave || `campo_${idx}`,
      header: c.etiqueta,
      body: c.valor
    }));
  }

  // Enlaces o botones
  if (datos.enlaces && datos.enlaces.length > 0) {
    objeto.linksModuleData = {
      uris: datos.enlaces.map(e => ({
        uri: e.url,
        description: e.texto
      }))
    };
  }

  return objeto;
}
