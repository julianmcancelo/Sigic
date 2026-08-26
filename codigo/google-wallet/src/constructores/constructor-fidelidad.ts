/**
 * @file constructor-fidelidad.ts
 * @description Constructor agnóstico de clases y objetos de Fidelización y Puntos (LoyaltyCard).
 */

import { ClaseFidelidad, PaseFidelidad } from '../tipos.js';
import { formatearIdCompleto, normalizarCodigoBarras } from '../utilidades/normalizadores.js';

export function construirClaseFidelidad(emisorId: string, datos: ClaseFidelidad, idioma = 'es-419') {
  const idCompleto = formatearIdCompleto(emisorId, datos.id);

  const clase: Record<string, any> = {
    id: idCompleto,
    programName: {
      defaultValue: { language: idioma, value: datos.nombrePrograma }
    },
    reviewStatus: 'UNDER_REVIEW'
  };

  if (datos.nombreEmisor) {
    clase.issuerName = datos.nombreEmisor;
  }

  if (datos.logoUrl) {
    clase.programLogo = {
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

  return clase;
}

export function construirObjetoFidelidad(emisorId: string, datos: PaseFidelidad, idioma = 'es-419') {
  const idClaseCompleto = formatearIdCompleto(emisorId, datos.claseId);
  const idObjetoCompleto = formatearIdCompleto(emisorId, datos.idObjeto);

  const objeto: Record<string, any> = {
    id: idObjetoCompleto,
    classId: idClaseCompleto,
    state: datos.estado || 'ACTIVE',
    accountHolderName: datos.nombreTitular,
    barcode: normalizarCodigoBarras(datos.codigoBarras)
  };

  if (datos.numeroCuenta) {
    objeto.accountId = datos.numeroCuenta;
  }

  if (datos.categoriaSocio) {
    objeto.tier = { defaultValue: { language: idioma, value: datos.categoriaSocio } };
  }

  if (datos.puntosTexto) {
    objeto.loyaltyPoints = {
      label: { defaultValue: { language: idioma, value: 'Puntos' } },
      balance: { string: datos.puntosTexto }
    };
  }

  if (datos.campos && datos.campos.length > 0) {
    objeto.textModulesData = datos.campos.map((c, idx) => ({
      id: c.clave || `campo_${idx}`,
      header: c.etiqueta,
      body: c.valor
    }));
  }

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
