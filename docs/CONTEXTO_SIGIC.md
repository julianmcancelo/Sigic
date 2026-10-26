# CONTEXTO PERMANENTE — SiGIC BELTRÁN

Este archivo condensa los lineamientos y reglas de negocio obligatorias del proyecto **SiGIC** para mantener siempre presentes en cada respuesta, desarrollo y ajuste.

---

## 1. Identidad Institucional y Carrera
- **Institución**: Instituto Tecnológico Beltrán (Avellaneda, Buenos Aires).
- **Carrera Oficial Obligatoria**: **Tecnicatura Superior en Analista de Sistemas**.
  - *Bajo ninguna circunstancia colocar "Desarrollo de Software"*.
- **Marco Académico**: Práctica Profesionalizante 2026.
- **Equipo de Alumnos**:
  1. Cancelo Julián (Arquitectura & Fullstack)
  2. Alfonso Alan Alexis (Lógica & Backend)
  3. Contreras Villalba Sol Heilin (Diseño UX/UI & Documentación)
  4. Frassia Matías (Infraestructura & Base de Datos)
  5. Santillán Luis Gabriel (Control de Calidad & Testing)

---

## 2. Nomenclatura del Sistema
- **Nombre Oficial**: **SiGIC** (Sistema de Gestión Institucional de Colaciones).
- **Regla Estricta**: **Quitar la palabra "OS" de todo el sistema**. No usar "SiGIC OS", únicamente **SiGIC**.

---

## 3. Fondos de Pantalla Institucionales Beltrán
Los 10 fondos institucionales están generados y disponibles:
- **En la plataforma**: `codigo/plataforma/public/wallpapers/`
- **En el sistema / ISO en vivo**: `/usr/share/backgrounds/sigic/`
- **Temas**:
  1. `beltran.jpg` (Oficial activo)
  2. `original.jpg`
  3. `aurora.jpg`
  4. `carbon.jpg`
  5. `ceremonial.jpg`
  6. `cybergrid.jpg`
  7. `sunset.jpg`
  8. `emerald.jpg`
  9. `sapphire.jpg`
  10. `alabaster.jpg`
- **Acceso rápido en escritorio**: `FONDOS-BELTRAN.desktop` permite abrir el selector de fondos directamente.

---

## 4. Actualización Dinámica en Caliente
Para aplicar cambios a la plataforma y base de datos sin recompilar la imagen ISO:
- **Script**: `/usr/local/bin/sigic-actualizar` (`codigo/plataforma/public/sigic-actualizar.sh`)
- **Acceso de Escritorio**: `ACTUALIZAR-SIGIC.desktop`
- **Funcionamiento**:
  - **Vía Pendrive**: Detecta automáticamente `sigic-web-bundle.tar.gz` en partición `SIGIC_UPDATE`.
  - **Vía Red**: Descarga la última versión desde el repositorio oficial si hay conexión a Internet.
  - Detiene el servicio web, extrae el bundle en `/opt/sigic-web/`, corre migraciones de PostgreSQL (`sigic-db-init`) y reinicia `sigic-server`.

---

## 5. Reglas Técnicas y de Código
- Todo el código y comentarios deben estar en **español**.
- Los endpoints de la API se concentran en el catch-all `src/app/api/[...slug]/route.ts`.
- Verificar siempre que compila con `npm run build` en `codigo/plataforma` antes de dar por finalizado un cambio.
- Comandos en Windows PowerShell concatenar con `;` (no usar `&&`).
