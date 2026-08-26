/**
 * @file tipos.ts
 * @description Definiciones de tipos 100% agnósticas y en español para Google Wallet.
 * @author Julian Cancelo
 */

/** Configuración inicial de la Billetera de Google */
export interface OpcionesBilletera {
  /** ID de Emisor (Issuer ID) obtenido en Google Pay & Wallet Console */
  emisorId: string;
  /** Correo de la cuenta de servicio de Google Cloud (client_email) */
  correoCliente: string;
  /** Clave privada RSA de la cuenta de servicio (private_key en formato PEM) */
  clavePrivada: string;
  /** Orígenes web permitidos para llamadas desde el navegador (CORS) */
  origenesPermitidos?: string[];
  /** Idioma por defecto de los textos del pase. Por defecto: "es-419" (Español) */
  idioma?: string;
}

/** Formatos de códigos de barras y QR soportados por Google Wallet */
export type TipoCodigoBarras = 
  | 'QR_CODE' 
  | 'AZTEC' 
  | 'BARCODE_128' 
  | 'PDF_417' 
  | 'DATA_MATRIX' 
  | 'UPC_A' 
  | 'EAN_13';

/** Opciones de código de barras o QR */
export interface OpcionesCodigoBarras {
  /** Valor codificado (string, ID, token o URL) */
  valor: string;
  /** Tipo de código. Por defecto: "QR_CODE" */
  tipo?: TipoCodigoBarras;
  /** Texto que aparece debajo del código. Si no se indica, se muestra el valor */
  textoAlternativo?: string;
}

/** Campo de información en el pase */
export interface CampoTexto {
  /** Clave única del campo */
  clave?: string;
  /** Título o etiqueta visible (ej: "Categoría", "Sector", "Vencimiento") */
  etiqueta: string;
  /** Valor visible (ej: "VIP", "Platea A", "31/12/2026") */
  valor: string;
}

/** Botón o enlace web dentro del pase */
export interface EnlaceAccion {
  /** Dirección web (https://...) */
  url: string;
  /** Texto del botón o enlace */
  texto: string;
}

/** Tipo de estado de una tarjeta */
export type EstadoTarjeta = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'INACTIVE';

// ─── 1. ENTRADAS Y EVENTOS (EventTicket) ──────────────────────────

export interface ClaseEvento {
  /** Identificador único de la plantilla (ej: "concierto_2026", "conferencia_tech") */
  id: string;
  /** Nombre del evento (ej: "Festival de Música 2026", "Colación Anual") */
  nombreEvento: string;
  /** Nombre del organizador, empresa o institución */
  nombreOrganizador?: string;
  /** URL pública del logotipo */
  logoUrl?: string;
  /** URL pública de la imagen de cabecera/banner (1032x336 px recomendado) */
  bannerUrl?: string;
  /** Color de fondo en formato Hexadecimal (ej: "#1E293B", "#4338CA") */
  colorFondoHex?: string;
  /** Fecha y hora de inicio (ISO 8601 o string de fecha) */
  fechaInicio?: string;
  /** Fecha y hora de finalización */
  fechaFin?: string;
  /** Nombre del recinto o lugar (ej: "Estadio Central", "Auditorio Principal") */
  nombreLugar?: string;
  /** Dirección física del lugar */
  direccionLugar?: string;
}

export interface PaseEvento {
  /** ID de la clase o plantilla asociada */
  claseId: string;
  /** Identificador único de este pase individual (ej: "ticket_1024", "usuario_55") */
  idObjeto: string;
  /** Nombre del titular o asistente */
  nombreTitular: string;
  /** Código QR o de barras a mostrar */
  codigoBarras: string | OpcionesCodigoBarras;
  /** Ubicación o asiento asignado */
  ubicacion?: {
    sector?: string;
    fila?: string;
    asiento?: string | number;
    puertaAcceso?: string;
  };
  /** Campos de texto personalizados */
  campos?: CampoTexto[];
  /** Enlaces web o botones interactivos */
  enlaces?: EnlaceAccion[];
  /** Estado del pase */
  estado?: EstadoTarjeta;
}

// ─── 2. CREDENCIALES Y PASES GENÉRICOS (GenericPass) ─────────────

export interface ClaseGenerica {
  /** Identificador único de la clase (ej: "credencial_socio", "pase_gimnasio") */
  id: string;
  /** Nombre del emisor o empresa */
  nombreEmisor?: string;
  /** URL pública del logo */
  logoUrl?: string;
  /** URL pública de imagen de cabecera */
  bannerUrl?: string;
  /** Color de fondo Hexadecimal */
  colorFondoHex?: string;
}

export interface PaseGenerico {
  /** ID de la clase genérica */
  claseId: string;
  /** ID único de este pase */
  idObjeto: string;
  /** Título principal de la tarjeta (ej: "Membresía Premium", "Carnet de Socio") */
  tituloTarjeta: string;
  /** Encabezado destacado (ej: "Nombre del Usuario") */
  encabezado: string;
  /** Subtítulo (ej: "Socio N° 4582", "Plan Anual") */
  subencabezado?: string;
  /** Código QR o de barras */
  codigoBarras: string | OpcionesCodigoBarras;
  /** Campos de información adicional */
  campos?: CampoTexto[];
  /** Enlaces o botones */
  enlaces?: EnlaceAccion[];
  /** Estado del pase */
  estado?: EstadoTarjeta;
}

// ─── 3. TARJETAS DE PUNTOS Y FIDELIDAD (LoyaltyCard) ──────────────

export interface ClaseFidelidad {
  /** ID único de la clase (ej: "club_beneficios", "puntos_cafe") */
  id: string;
  /** Nombre del programa de puntos o comercio (ej: "Club de Café", "Puntos Viajeros") */
  nombrePrograma: string;
  /** Nombre del emisor o comercio */
  nombreEmisor?: string;
  /** URL pública del logo */
  logoUrl?: string;
  /** URL pública de imagen de cabecera */
  bannerUrl?: string;
  /** Color de fondo Hexadecimal */
  colorFondoHex?: string;
}

export interface PaseFidelidad {
  /** ID de la clase de fidelidad */
  claseId: string;
  /** ID único de la tarjeta del cliente */
  idObjeto: string;
  /** Nombre del titular */
  nombreTitular: string;
  /** Nivel o categoría del socio (ej: "Gold", "Plata", "Nivel 3") */
  categoriaSocio?: string;
  /** Puntos o saldo acumulado (ej: "1.250 pts", "$4.500") */
  puntosTexto?: string;
  /** Número de cuenta o membresía */
  numeroCuenta?: string;
  /** Código QR o de barras */
  codigoBarras: string | OpcionesCodigoBarras;
  /** Campos adicionales */
  campos?: CampoTexto[];
  /** Enlaces o promociones */
  enlaces?: EnlaceAccion[];
  /** Estado de la tarjeta */
  estado?: EstadoTarjeta;
}

/** Resultado de emitir cualquier pase en Google Wallet */
export interface ResultadoPase {
  /** URL universal para guardar el pase en la app Google Wallet con un clic */
  urlGuardar: string;
  /** Token JWT firmado criptográficamente que contiene los datos del pase */
  tokenJwt: string;
  /** ID de objeto compuesto generado (emisorId.idObjeto) */
  idObjetoCompleto: string;
}
