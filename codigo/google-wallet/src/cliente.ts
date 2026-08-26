/**
 * @file cliente.ts
 * @description Clase principal BilleteraGoogle agnóstica para emitir pases de Google Wallet.
 * @author Julian Cancelo
 */

import { 
  OpcionesBilletera, 
  ClaseEvento, 
  PaseEvento, 
  ClaseGenerica, 
  PaseGenerico, 
  ClaseFidelidad, 
  PaseFidelidad, 
  ResultadoPase 
} from './tipos.js';
import { firmarTokenGoogleWallet, generarUrlGuardarWallet } from './jwt/firmador.js';
import { construirClaseEvento, construirObjetoEvento } from './constructores/constructor-evento.js';
import { construirClaseGenerica, construirObjetoGenerico } from './constructores/constructor-generico.js';
import { construirClaseFidelidad, construirObjetoFidelidad } from './constructores/constructor-fidelidad.js';
import { formatearIdCompleto } from './utilidades/normalizadores.js';
import { decodificarCodigoGoogleWallet } from './utilidades/decodificador.js';

export class BilleteraGoogle {
  private emisorId: string;
  private correoCliente: string;
  private clavePrivada: string;
  private origenesPermitidos?: string[];
  private idioma: string;

  constructor(opciones: OpcionesBilletera) {
    if (!opciones.emisorId) throw new Error('El "emisorId" (Issuer ID) es obligatorio.');
    if (!opciones.correoCliente) throw new Error('El "correoCliente" (client_email) es obligatorio.');
    if (!opciones.clavePrivada) throw new Error('La "clavePrivada" (private_key) es obligatoria.');

    this.emisorId = opciones.emisorId.trim();
    this.correoCliente = opciones.correoCliente.trim();
    this.clavePrivada = opciones.clavePrivada.trim();
    this.origenesPermitidos = opciones.origenesPermitidos;
    this.idioma = opciones.idioma || 'es-419';
  }

  /**
   * Genera un enlace directo oficial de Google Wallet para una Entrada / Evento.
   * Si se incluye `datosClase`, empaqueta la definición de la clase en el mismo JWT
   * para que no sea necesario llamar a la REST API de Google antes.
   */
  crearPaseEvento(opciones: {
    clase: ClaseEvento | string;
    pase: Omit<PaseEvento, 'claseId'>;
  }): ResultadoPase {
    const claseId = typeof opciones.clase === 'string' ? opciones.clase : opciones.clase.id;
    const objetoPayload = construirObjetoEvento(this.emisorId, {
      ...opciones.pase,
      claseId
    }, this.idioma);

    const payload: Record<string, any> = {
      eventTicketObjects: [objetoPayload]
    };

    if (typeof opciones.clase === 'object') {
      const clasePayload = construirClaseEvento(this.emisorId, opciones.clase, this.idioma);
      payload.eventTicketClasses = [clasePayload];
    }

    const tokenJwt = firmarTokenGoogleWallet({
      correoCliente: this.correoCliente,
      clavePrivada: this.clavePrivada,
      payload,
      origenesPermitidos: this.origenesPermitidos
    });

    const idObjetoCompleto = formatearIdCompleto(this.emisorId, opciones.pase.idObjeto);
    const urlGuardar = generarUrlGuardarWallet(tokenJwt);

    return {
      urlGuardar,
      tokenJwt,
      idObjetoCompleto
    };
  }

  /**
   * Genera un enlace directo para una Credencial o Pase Genérico (socios, membresías, carnets).
   */
  crearPaseGenerico(opciones: {
    clase: ClaseGenerica | string;
    pase: Omit<PaseGenerico, 'claseId'>;
  }): ResultadoPase {
    const claseId = typeof opciones.clase === 'string' ? opciones.clase : opciones.clase.id;
    const objetoPayload = construirObjetoGenerico(this.emisorId, {
      ...opciones.pase,
      claseId
    }, this.idioma);

    const payload: Record<string, any> = {
      genericObjects: [objetoPayload]
    };

    if (typeof opciones.clase === 'object') {
      const clasePayload = construirClaseGenerica(this.emisorId, opciones.clase, this.idioma);
      payload.genericClasses = [clasePayload];
    }

    const tokenJwt = firmarTokenGoogleWallet({
      correoCliente: this.correoCliente,
      clavePrivada: this.clavePrivada,
      payload,
      origenesPermitidos: this.origenesPermitidos
    });

    const idObjetoCompleto = formatearIdCompleto(this.emisorId, opciones.pase.idObjeto);
    const urlGuardar = generarUrlGuardarWallet(tokenJwt);

    return {
      urlGuardar,
      tokenJwt,
      idObjetoCompleto
    };
  }

  /**
   * Genera un enlace directo para una Tarjeta de Fidelidad / Puntos (comercios, restaurantes, clubes).
   */
  crearPaseFidelidad(opciones: {
    clase: ClaseFidelidad | string;
    pase: Omit<PaseFidelidad, 'claseId'>;
  }): ResultadoPase {
    const claseId = typeof opciones.clase === 'string' ? opciones.clase : opciones.clase.id;
    const objetoPayload = construirObjetoFidelidad(this.emisorId, {
      ...opciones.pase,
      claseId
    }, this.idioma);

    const payload: Record<string, any> = {
      loyaltyObjects: [objetoPayload]
    };

    if (typeof opciones.clase === 'object') {
      const clasePayload = construirClaseFidelidad(this.emisorId, opciones.clase, this.idioma);
      payload.loyaltyClasses = [clasePayload];
    }

    const tokenJwt = firmarTokenGoogleWallet({
      correoCliente: this.correoCliente,
      clavePrivada: this.clavePrivada,
      payload,
      origenesPermitidos: this.origenesPermitidos
    });

    const idObjetoCompleto = formatearIdCompleto(this.emisorId, opciones.pase.idObjeto);
    const urlGuardar = generarUrlGuardarWallet(tokenJwt);

    return {
      urlGuardar,
      tokenJwt,
      idObjetoCompleto
    };
  }

  /**
   * Decodifica un código escaneado (URL, JWT, o valor de código de barras).
   */
  decodificarCodigo(codigoEscaneado: string) {
    return decodificarCodigoGoogleWallet(codigoEscaneado);
  }
}

/** Alias en inglés para compatibilidad internacional */
export const GoogleWallet = BilleteraGoogle;
