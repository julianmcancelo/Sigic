# Estructura del repositorio

Este documento define los proyectos vigentes y evita que archivos generados vuelvan a mezclarse con el código fuente.

## Proyectos vigentes

| Ruta | Propósito | Tecnología |
|---|---|---|
| `codigo/plataforma` | Panel administrativo, portal de graduados y API | Next.js, React, PostgreSQL |
| `codigo/movil_flutter` | App de portería y acreditación | Flutter, Shorebird |
| `codigo/landing` | Sitio institucional estático | HTML, CSS |

## Proyectos históricos

| Ruta | Estado | Criterio |
|---|---|---|
| `codigo/movil` | Histórico | React Native/Expo. No publicar releases nuevos desde aquí. |
| `codigo/movil-reactnative` | Histórico | Copia anterior de React Native. Conservar solo como referencia. |

## Archivos generados

Los directorios siguientes se generan localmente y no deben agregarse a Git:

- `codigo/plataforma/node_modules`, `.next`, `src-tauri/target` y `src-tauri/gen`.
- `codigo/movil_flutter/build` y `.dart_tool`.
- Dependencias, cachés, instaladores y logs de cada herramienta.

Los instaladores y APK publicados se mantienen solo cuando forman parte de `codigo/plataforma/public/descargas`. Los binarios intermedios de compilación no son fuente ni material de despliegue.

## Convenciones

- El desarrollo web se realiza en `codigo/plataforma`.
- La app móvil oficial se desarrolla en `codigo/movil_flutter`.
- Los cambios de producto deben actualizar el README específico del proyecto cuando alteren instalación, configuración o distribución.
- No mover ni eliminar proyectos históricos sin una migración o una decisión explícita; pueden servir para consulta.
