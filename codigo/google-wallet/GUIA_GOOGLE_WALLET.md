# Guia de Configuracion de Google Wallet

Esta guia detalla paso a paso como obtener el **Issuer ID** y las **credenciales de Google Cloud** para comenzar a emitir pases digitales sin costo.

---

## Requisitos previos

* Una cuenta de Google (Gmail o Google Workspace).
* Acceso a Google Cloud Console.

---

## Paso 1: Obtener el Issuer ID en Google Pay & Wallet Console

1. Ingresa a [Google Pay & Wallet Console](https://pay.google.com/business/console/).
2. Inicia sesion con tu cuenta de Google.
3. Selecciona la seccion **Google Wallet API** (o completa el registro comercial inicial).
4. Acepta los terminos y condiciones de uso del servicio.
5. En la parte superior de la consola o en la pestana de **Ajustes**, encontraras tu **Issuer ID** (un identificador numerico de aproximadamente 19 digitos, por ejemplo: `3388000000022289454`).
6. Guarda este valor: corresponde a la variable `GOOGLE_WALLET_ISSUER_ID`.

---

## Paso 2: Crear la Cuenta de Servicio (Service Account) en Google Cloud

1. Ingresa a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un nuevo proyecto o selecciona uno existente.
3. En el menu de navegacion, dirijete a **IAM y administracion > Cuentas de servicio**.
4. Haz clic en **Crear cuenta de servicio**:
   * Nombre: `google-wallet-emisor` (o el nombre que prefieras).
   * Haz clic en **Crear y continuar**.
   * En la seccion de Roles puedes dejarlo sin permisos adicionales o asignar `Visualizador`.
   * Haz clic en **Listo**.
5. Copia la direccion de correo generada (por ejemplo: `google-wallet-emisor@tu-proyecto.iam.gserviceaccount.com`).
6. Guarda este valor: corresponde a la variable `GOOGLE_WALLET_CLIENT_EMAIL`.

---

## Paso 3: Generar la Clave Privada (Private Key)

1. En el listado de Cuentas de servicio, haz clic sobre la cuenta recien creada.
2. Dirijete a la pestana **Claves**.
3. Haz clic en **Agregar clave > Crear clave nueva**.
4. Selecciona el tipo de clave **JSON** y haz clic en **Crear**.
5. Se descargara un archivo `.json` en tu equipo.
6. Abre el archivo descargado con un editor de texto:
   * Localiza el campo `"private_key"`, el cual contiene la clave RSA en formato PEM (`-----BEGIN PRIVATE KEY-----\n...`).
7. Guarda este valor: corresponde a la variable `GOOGLE_WALLET_PRIVATE_KEY`.

---

## Paso 4: Vincular la Cuenta de Servicio con la Consola de Wallet

1. Regresa a [Google Pay & Wallet Console](https://pay.google.com/business/console/).
2. En el menu lateral, ingresa a **Google Wallet API > Usuarios**.
3. Haz clic en **Invitar usuario**.
4. Pega la direccion de correo de la cuenta de servicio creada en el Paso 2 (`...iam.gserviceaccount.com`).
5. Asigna el rol de **Desarrollador** o **Administrador**.
6. Guarda los cambios para confirmar la autorizacion.

---

## Paso 5: Configuracion de Variables de Entorno

Agrega las credenciales a tu archivo de configuracion `.env`:

```env
GOOGLE_WALLET_ISSUER_ID="3388000000022289454"
GOOGLE_WALLET_CLIENT_EMAIL="google-wallet-emisor@tu-proyecto.iam.gserviceaccount.com"
GOOGLE_WALLET_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7..."
```

---

## Resolucion de problemas comunes

### 1. Error de clave privada (Invalid Key / RS256)
Si cargas la clave desde un archivo `.env`, asegurate de que los saltos de linea `\n` no se encuentren doblemente escapados. La libreria incluye saneamiento automatico para convertir `\n` literales en saltos de linea reales.

### 2. Error 401 o cuenta no autorizada
Verifica que el correo de la cuenta de servicio haya sido agregado como usuario con permisos en la consola de Google Pay & Wallet (Paso 4).
