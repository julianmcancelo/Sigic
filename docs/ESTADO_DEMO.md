# Estado Operativo de SiGIC Demo

Última actualización: 24 de agosto de 2026.

## Entornos

- Demo web: `https://demo.sigic.com.ar`
- Descargas: `https://descargas.sigic.com.ar`
- Rama de trabajo: `demo`
- Aplicación móvil: Flutter, proyecto `codigo/movil_flutter`
- Plataforma web y API: Next.js, proyecto `codigo/plataforma`

La demo usa datos ficticios. Los cambios funcionales se desarrollan y validan sobre esta rama antes de trasladarlos a producción.

## Flujo Operativo

1. El administrativo crea y configura una ceremonia.
2. Carga o importa graduados, envía invitaciones y cada graduado completa sus datos e invitados.
3. Se asignan butacas respetando las exclusividades del graduado y sus acompañantes.
4. Se envía la credencial con QR e información de la ceremonia.
5. En portería, el personal inicia sesión en SiGIC Accesos, selecciona la ceremonia autorizada y escanea el QR.
6. Un QR individual acredita a un invitado. Un QR de grupo abre la ficha del graduado, permite acreditarlo y registrar sus invitados de forma individual o masiva.
7. La pestaña Asistencia reúne la vista operativa por graduado, con sus invitados, búsqueda, filtros y acciones de acreditación.

## Aplicación Móvil

La release base actual es `1.0.5+6` y usa Shorebird para actualizaciones OTA en Android.

- Patch 1: renovación de la experiencia visual.
- Patch 2: logo institucional en la cabecera.
- Patch 3: lista compacta de invitados de grupo.
- Patch 4: nueva pestaña Asistencia y acreditación de graduados.
- Patch 5: evita ofrecer por error una APK de versión anterior.

Las actualizaciones se descargan al abrir la app y se aplican al reiniciarla. La versión base no cambia con un patch; para cambiar de `1.0.5+6` a una release posterior se debe publicar una nueva APK/AAB con Shorebird.

## Asistencia de Graduados

La API incorpora los campos `presente` y `fecha_presente` en `egresados`. La migración es idempotente y se ejecuta durante la inicialización del esquema.

- `PUT /api/egresados/:id/presente`: acredita un graduado.
- `GET /api/asistencia`: devuelve los graduados de la ceremonia activa, sus invitados y el estado de llegada.
- `PUT /api/invitados/:id/presente`: acredita un invitado.
- `PUT /api/invitados/presente-masivo`: acredita varios invitados de un grupo.

## Estado De Despliegue

El código de Asistencia está publicado en GitHub dentro de la rama `demo`. La API de demo necesita un despliegue de Vercel para exponer los endpoints nuevos. Al momento de esta actualización, Vercel rechazó nuevos deploys por el límite diario del plan gratuito (`api-deployments-free-per-day`).

Cuando el límite se restablezca, desplegar desde `codigo/plataforma`:

```powershell
npx vercel --prod --yes
```

El archivo `codigo/plataforma/.vercelignore` evita incluir los artefactos pesados de Tauri en ese despliegue.

## Verificación Recomendada

```powershell
# Flutter
cd codigo/movil_flutter
flutter analyze

# Plataforma web
cd ../plataforma
npm run build
```

Después del deploy web, validar que `GET https://demo.sigic.com.ar/api/asistencia` responda `401` sin sesión y devuelva el listado con una sesión de portería autorizada.

## Archivos Locales No Versionados

No se deben subir `codigo/plataforma/src-tauri/target/` ni otros binarios generados. Las APK, AAB e instaladores se distribuyen por el sitio de descargas o mediante los canales de release, no dentro del repositorio Git.
