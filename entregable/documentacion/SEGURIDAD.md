# Seguridad y migración de roles

Actualizado: 5 de septiembre de 2026.

## Accesos vigentes

| Acceso | Alcance |
|---|---|
| `ADMINISTRATIVO` | Gestión de ceremonias, graduados, personal, configuración y control. |
| `PORTERIA` | Operación de acreditación con autorización explícita por ceremonia. |
| `egresado` | Identidad de graduado, separada del personal; autogestión de su inscripción. |

Los roles `SUPER_ADMIN`, `ADMIN` y `AUDITOR` ya no son seleccionables ni válidos para cuentas nuevas.
La inicialización del esquema migra `SUPER_ADMIN` y `ADMIN` a `ADMINISTRATIVO`. Los demás roles antiguos pasan a `PORTERIA` desactivados, sin concederles acceso automáticamente. La migración es transaccional y se puede repetir. No elimina cuentas ni inscripciones.

## Correcciones incluidas

- El servidor rechaza todos los tokens `bypass-*`, incluso con `DEMO_MODE=true`. La simulación del expositor se resuelve en el navegador.
- Las sesiones de personal incluyen `sessionVersion`. Cada petición autenticada consulta el rol, estado y versión actuales en la base. Los JWT anteriores, sin versión, dejan de funcionar.
- Cambiar rol o estado, restablecer contraseña, cerrar sesión o desvincular remotamente una cuenta revoca sus sesiones. La revocación es por cuenta, por lo que afecta a todos sus dispositivos.
- No se puede eliminar, bloquear ni degradar al último administrativo activo. Las operaciones se serializan mediante una transacción y un bloqueo en PostgreSQL.
- Login y consulta de sesión no crean autorizaciones de portería. Sin asignaciones, la lista de ceremonias autorizadas queda vacía.
- Los QR de login solo se emiten para cuentas activas de portería y vencen a las ocho horas. Las cuentas administrativas usan su contraseña.
- OTP generado con `crypto.randomInt`; consumo condicional en base para impedir reutilización concurrente.
- Límites de intentos de login, recuperación y OTP compartidos en PostgreSQL, mediante incrementos atómicos. No dependen de la memoria de una instancia serverless.
- Restricción de orígenes para la API y CORS con lista explícita. Clientes nativos sin `Origin` siguen necesitando su token.
- Primera instalación en producción protegida con `SIGIC_SETUP_KEY`, con transacción para impedir instalaciones simultáneas.
- Escritura de rutinas demo deshabilitada en producción y autenticada en desarrollo.
- SheetJS actualizado a 0.20.3 desde su [distribución oficial](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/).
- Flutter guarda tokens en almacenamiento seguro; descarta los tokens antiguos guardados en preferencias. Cambiar de servidor borra la sesión y se exige HTTPS. Android deshabilita copias de seguridad del almacenamiento de la aplicación.

## Aplicación del cambio

Los cambios del repositorio no actualizan por sí mismos Vercel, Neon ni las aplicaciones instaladas.

1. Mantener una copia de respaldo antes de actualizar el servidor.
2. Configurar `JWT_SECRET` aleatorio, de al menos 32 caracteres. La aplicación falla en producción si falta o es corto.
3. Usar `DEMO_MODE=false` para datos reales; una demo con datos sembrados debe tener base y secretos propios.
4. Configurar `SIGIC_ALLOWED_ORIGINS` solo si se necesitan otros orígenes de navegador. Se usan orígenes exactos separados por comas, sin comodines.
5. `SIGIC_SETUP_KEY`, de al menos 32 caracteres, solo es necesario al crear la primera cuenta en una base nueva. Puede retirarse después. No es necesario para migrar cuentas existentes.
6. Al actualizar, todos los usuarios de personal deben iniciar sesión otra vez. Revisar cuentas antiguas de auditoría y asignar manualmente las ceremonias de portería.
7. Publicar una nueva versión nativa del móvil: el cambio incorpora un plugin nativo y no debe enviarse solo como parche OTA de Dart.

## Validación y límites

- `npm run test:security`: JWT, OTP, orígenes, migración de roles, permisos y revocación sobre PostgreSQL aislado con PGlite, protección del último administrativo, login sin asignaciones, límites compartidos e intercambio de Excel.
- `node node_modules/typescript/bin/tsc --noEmit` y `npm run build` en la plataforma.
- `flutter analyze`, `flutter test test/seguridad_test.dart` y `flutter build apk --debug` en el móvil.

La compilación de prueba no certifica la configuración de producción. Queda verificar los secretos y permisos efectivos de Vercel/Neon, TLS de la base, respaldos y restauración, y comportamiento en dispositivos físicos. iOS requiere compilación y prueba en macOS.

El proyecto Android todavía configura la firma de release con la clave debug. Antes de distribuir un APK productivo se debe definir la firma de publicación y resolver la compatibilidad de actualización con los APK ya instalados. No se cambiaron claves ni se publicó un APK en esta revisión.

Esta revisión corrige los hallazgos tratados; no constituye una auditoría exhaustiva de todas las rutas, privacidad, acreditación offline o infraestructura. Una siguiente revisión debe verificar el alcance por ceremonia de cada operación y la retención de datos y registros de seguridad.
