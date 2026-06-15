<p align="center">
  <img src="https://sigic-one.vercel.app/logo-oficial.png" alt="Logo SiGIC" width="180" />
</p>

<h1 align="center">SiGIC — App Móvil de Acreditación</h1>
<p align="center">
  <strong>Escáner QR de Control de Accesos para Personal de Portería</strong><br>
  <em>Instituto Tecnológico Beltrán — Proyecto Final 2026</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-Expo-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK_52-000000?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK" />
  <img src="https://img.shields.io/badge/Android-✓-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/iOS-✓-000000?style=for-the-badge&logo=apple&logoColor=white" alt="iOS" />
</p>

---

## Descripción

Esta aplicación es el **sistema de acreditación en campo** de SiGIC. Permite al personal de portería escanear los códigos QR de los graduados e invitados para validar su acceso a la ceremonia de colación en tiempo real.

La app se conecta directamente a la **API Serverless de la Plataforma Web** (Next.js en Vercel) mediante JWT, validando la identidad de cada credencial escaneada contra la base de datos PostgreSQL en Neon Cloud.

---

## Funcionalidades

- **Escáner QR en tiempo real** — Lectura fluida de credenciales digitales de graduados e invitados
- **Login seguro con JWT** — Autenticación del personal de portería con token de sesión persistente
- **Validación de acceso instantánea** — Respuesta visual inmediata (verde/rojo) al escanear cada credencial
- **Autorización por ceremonia** — El acceso a la API se bloquea si el portero no está habilitado para el evento activo
- **Estado de conectividad** — Indicador en vivo del estado de conexión con el servidor

---

## Estructura del Proyecto

```text
movil/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx         # Pantalla principal del escáner QR
│   │   └── dashboard.tsx     # Dashboard de estadísticas de ingresos
│   ├── login.tsx             # Pantalla de inicio de sesión (portería)
│   └── _layout.tsx           # Layout global de la app
├── components/               # Componentes reutilizables de la interfaz
├── constants/                # Colores, URLs base y configuración
├── hooks/                    # Custom hooks (useAuth, useSesion)
├── assets/                   # Imágenes, íconos y fuentes
├── app.json                  # Configuración de Expo (nombre, ícono, permisos)
└── package.json              # Dependencias del proyecto
```

---

## Puesta en Marcha Local

### Requisitos Previos

- **Node.js** v20 o v22 (LTS)
- **NPM** (o Yarn/Bun)
- **Expo Go** instalado en el dispositivo móvil ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

> [!IMPORTANT]
> La app necesita que la Plataforma Web (`codigo/plataforma`) esté activa y accesible en red. En producción apunta a `https://sigic-one.vercel.app`. Para desarrollo local, actualiza la URL base en `constants/` para que apunte a tu IP local.

### Instalación e Inicio

```bash
# 1. Ingresar al directorio
cd codigo/movil

# 2. Instalar dependencias
npm install

# 3. Iniciar el bundler de Expo
npx expo start
```

Escanea el código QR que aparece en la terminal con la cámara (iOS) o con Expo Go (Android) para cargar la app en tu dispositivo.

### Opciones de Ejecución

| Plataforma | Comando |
|---|---|
| Dispositivo físico (Expo Go) | `npx expo start` |
| Emulador Android | `npx expo start --android` |
| Simulador iOS | `npx expo start --ios` |
| Navegador web | `npx expo start --web` |

---

## Seguridad

- **Tokens JWT persistentes:** El token de sesión del portero se almacena en el dispositivo y se envía en cada petición a la API.
- **Autorización por ceremonia:** El backend valida si el portero está habilitado para la ceremonia actualmente activa. Si no lo está, la app muestra un error de acceso.
- **Comunicación TLS:** Todas las llamadas a la API de Vercel viajan bajo HTTPS con cifrado TLS.

---

## Equipo de Desarrollo

- **Alfonso Alan Alexis**
- **Cancelo Julian**
- **Contreras Villalba Sol Heilin**
- **Frassia Matias**
- **Santillan Luis Gabriel**

**Instituto Tecnológico Beltrán — 2026**
