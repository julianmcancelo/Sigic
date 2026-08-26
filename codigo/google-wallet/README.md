# Google Wallet para Node.js, Next.js y React

Librería de código abierto para crear, firmar criptográficamente y emitir pases de Google Wallet (Billetera de Google) de forma dinámica en aplicaciones JavaScript y TypeScript.

Permite generar pases de eventos y entradas (`EventTicket`), credenciales y membresías (`GenericPass`), y tarjetas de puntos o fidelidad (`LoyaltyCard`) sin necesidad de configurar llamadas manuales a la API REST de Google ni lidiar con la firma manual de tokens JWT RS256.

---

## Características principales

* **Totalmente en español**: Métodos, tipos de TypeScript, parámetros y mensajes estructurados en español.
* **Agnóstica y dinámica**: Sirve para cualquier tipo de proyecto (recitales, clubes, universidades, gimnasios, cines, empresas de software o comercios).
* **Firma local sin latencia**: Construye y firma el JWT localmente con la clave privada de Google Cloud, generando el enlace directo de guardado al instante.
* **3 tipos de pases soportados**:
  * Entradas y Eventos (con fecha, recinto, puerta, fila y butaca).
  * Credenciales y Carnets (con foto, datos del titular, categoría y vigencia).
  * Tarjetas de Fidelidad y Puntos (con saldo, nivel de socio y promociones).
* **Componente React integrado**: Incluye el botón oficial de guardado con soporte para modo claro y oscuro.
* **Asistente por terminal**: Asistente interactivo por línea de comandos para generar la configuración inicial de tu proyecto.
* **Decodificador de escáner**: Función para extraer el código limpio a partir de URLs o strings escaneados desde la billetera.

---

## Instalación

```bash
npm install @jcancelo/google-wallet
```

O utilizando otros gestores de paquetes:

```bash
pnpm add @jcancelo/google-wallet
# o
yarn add @jcancelo/google-wallet
```

---

## Uso básico

### 1. Inicialización

Configurá la instancia con las credenciales de tu cuenta de servicio de Google Cloud:

```typescript
import { BilleteraGoogle } from '@jcancelo/google-wallet';

const wallet = new BilleteraGoogle({
  emisorId: process.env.GOOGLE_WALLET_ISSUER_ID!,
  correoCliente: process.env.GOOGLE_WALLET_CLIENT_EMAIL!,
  clavePrivada: process.env.GOOGLE_WALLET_PRIVATE_KEY!
});
```

---

### 2. Entradas y Eventos (EventTicket)

Ideal para recitales, conferencias, eventos deportivos, actos o funciones de teatro:

```typescript
const pase = wallet.crearPaseEvento({
  clase: {
    id: 'evento_2026',
    nombreEvento: 'Festival de Música 2026',
    nombreOrganizador: 'Productora Norte',
    logoUrl: 'https://tu-dominio.com/logo.png',
    bannerUrl: 'https://tu-dominio.com/banner.png',
    colorFondoHex: '#1E293B',
    fechaInicio: '2026-11-20T21:00:00Z',
    nombreLugar: 'Estadio Principal',
    direccionLugar: 'Av. Libertador 1234, Buenos Aires'
  },
  pase: {
    idObjeto: 'ticket_usr_1044',
    nombreTitular: 'Martina Rodríguez',
    codigoBarras: 'TICKET-104492',
    ubicacion: {
      sector: 'Platea Baja',
      fila: 'Fila 4',
      asiento: '12',
      puertaAcceso: 'Puerta 2'
    },
    campos: [
      { etiqueta: 'Tipo de Entrada', valor: 'Acceso General' },
      { etiqueta: 'N° de Orden', valor: '#104492' }
    ],
    enlaces: [
      { url: 'https://tu-dominio.com/lineup', texto: 'Ver Cronograma' }
    ]
  }
});

console.log(pase.urlGuardar);
// Resultado: https://pay.google.com/gp/v/save/eyJhbGciOiJSUzI1NiIs...
```

---

### 3. Credenciales y Carnets (GenericPass)

Ideal para universidades, colegios, gimnasios, clubes de socios o identificaciones de empleados:

```typescript
const credencial = wallet.crearPaseGenerico({
  clase: {
    id: 'carnet_socio_2026',
    nombreEmisor: 'Club Deportivo Central',
    colorFondoHex: '#047857',
    logoUrl: 'https://tu-dominio.com/club-logo.png'
  },
  pase: {
    idObjeto: 'socio_4812',
    tituloTarjeta: 'Carnet de Socio',
    encabezado: 'Santiago Méndez',
    subencabezado: 'Socio Pleno',
    codigoBarras: 'SOCIO:4812',
    campos: [
      { etiqueta: 'N° de Socio', valor: '4812' },
      { etiqueta: 'Vigencia', valor: 'Diciembre 2026' }
    ]
  }
});

console.log(credencial.urlGuardar);
```

---

### 4. Tarjetas de Fidelidad y Puntos (LoyaltyCard)

Para programas de beneficios, cafeterías, comercios o supermercados:

```typescript
const tarjetaPuntos = wallet.crearPaseFidelidad({
  clase: {
    id: 'club_beneficios',
    nombrePrograma: 'Club de Beneficios',
    nombreEmisor: 'Café Roma',
    colorFondoHex: '#78350F',
    logoUrl: 'https://tu-dominio.com/logo.png'
  },
  pase: {
    idObjeto: 'cliente_9912',
    nombreTitular: 'Camila Torres',
    categoriaSocio: 'Miembro Gold',
    puntosTexto: '350 Puntos',
    numeroCuenta: 'CR-9912',
    codigoBarras: 'PUNTOS:CR-9912',
    campos: [
      { etiqueta: 'Beneficio actual', valor: '15% de descuento en barra' }
    ]
  }
});

console.log(tarjetaPuntos.urlGuardar);
```

---

## Componente React

Incluye un componente de botón listo para usar en aplicaciones React, Next.js, Vite o Remix:

```tsx
import { BotonGoogleWallet } from '@jcancelo/google-wallet/react';

export function MiComponente() {
  return (
    <BotonGoogleWallet 
      url={urlGenerada}
      tema="oscuro" // 'oscuro' | 'claro'
      texto="Guardar en Google Wallet"
    />
  );
}
```

---

## Integración con Next.js (App Router)

Ejemplo de endpoint en `app/api/wallet/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { BilleteraGoogle } from '@jcancelo/google-wallet';

const wallet = new BilleteraGoogle({
  emisorId: process.env.GOOGLE_WALLET_ISSUER_ID!,
  correoCliente: process.env.GOOGLE_WALLET_CLIENT_EMAIL!,
  clavePrivada: process.env.GOOGLE_WALLET_PRIVATE_KEY!
});

export async function POST(req: Request) {
  try {
    const { usuarioId, nombre, email, ticketId } = await req.json();

    const resultado = wallet.crearPaseEvento({
      clase: {
        id: 'evento_principal',
        nombreEvento: 'Conferencia Anual 2026',
        nombreOrganizador: 'Mi Organización',
        colorFondoHex: '#0F172A'
      },
      pase: {
        idObjeto: `ticket_${ticketId}`,
        nombreTitular: nombre,
        codigoBarras: `TICKET:${ticketId}`,
        campos: [
          { etiqueta: 'Titular', valor: nombre },
          { etiqueta: 'Email', valor: email }
        ]
      }
    });

    return NextResponse.json({
      ok: true,
      url: resultado.urlGuardar
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## Decodificador de Escáner

Si tu aplicación móvil o lector web escanea los códigos de las credenciales de Google Wallet, podés limpiar y extraer el token original directamente:

```typescript
import { decodificarCodigoGoogleWallet } from '@jcancelo/google-wallet';

const info = decodificarCodigoGoogleWallet(codigoEscaneado);

console.log(info.codigoLimpio); // 'TICKET-104492'
console.log(info.formato);      // 'jwt_wallet' | 'objeto_wallet' | 'directo'
```

---

## Asistente por Terminal

Podés inicializar la configuración en tu proyecto ejecutando:

```bash
npx @jcancelo/google-wallet init
```

El asistente te solicitará tu Issuer ID, correo de la Service Account y generará automáticamente un archivo `.env.wallet` y un script de ejemplo funcional adaptado a tu proyecto.

---

## Documentación de Configuración

Para consultar los pasos detallados sobre cómo crear la cuenta en Google Cloud Console y obtener tus credenciales sin costo, revisá la [Guía de Configuración](./GUIA_GOOGLE_WALLET.md).

---

## Licencia

MIT © [Julian Cancelo](https://github.com/julianmcancelo)
