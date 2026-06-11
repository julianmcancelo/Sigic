# SiGIC - Portería (App Móvil)

**Instituto Tecnológico Beltrán — 2026**

---

## Descripción
Esta es la aplicación móvil para el control de acceso en portería desarrollada en **Flutter**. Su función principal es escanear las credenciales con código QR de los egresados e invitados en la entrada del evento, validar sus permisos en tiempo real contra el servidor backend y registrar su ingreso.

## Características
- Escaneo rápido mediante cámara integrada de códigos QR.
- Conexión segura con la API del servidor usando tokens JWT.
- Validación inmediata de estado (Presente/Ausente) y detalles de la ceremonia.
- Interfaz fluida y optimizada para dispositivos móviles (Android / iOS).

## Configuración y Ejecución
Para iniciar el proyecto en tu entorno de desarrollo local:

1. **Instalar dependencias:**
   ```bash
   flutter pub get
   ```

2. **Ejecutar la aplicación:**
   ```bash
   flutter run
   ```

3. **Compilar para producción (Android APK):**
   ```bash
   flutter build apk --split-per-abi
   ```
