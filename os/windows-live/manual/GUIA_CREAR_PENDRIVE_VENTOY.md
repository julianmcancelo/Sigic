# Guía Oficial: Cómo Crear tu Pendrive Live USB de SiGIC OS

Esta guía te muestra cómo tener un **pendrive booteable de SiGIC OS** que arranca en cualquier PC (notebook o de escritorio) directamente en memoria RAM sin instalar nada en el disco rígido de la máquina.

---

## Opción 1: El Método Más Rápido y Moderno (Ventoy Plug & Play)

Ventoy es la herramienta estándar de la industria. Permite formatear el pendrive una sola vez y luego simplemente copiar y pegar archivos `.iso` como si fueran archivos comunes.

### Pasos:
1. **Descargar Ventoy**:
   - Descargá `ventoy-windows.zip` desde su web oficial ([ventoy.net](https://www.ventoy.net)).
2. **Instalar en el Pendrive**:
   - Conectá tu pendrive USB (mínimo 4 GB o superior).
   - Abrí `Ventoy2Disk.exe`, seleccioná tu pendrive y hacé clic en **Install** (esto formateará el pendrive en dos particiones seguras).
3. **Copiar la ISO de SiGIC OS**:
   - Copiá el archivo `SiGIC_Live_Win10_x64.iso` directamente a la unidad USB de Ventoy.
4. **Listo para Usar**:
   - Conectá el pendrive en la máquina del evento/anfiteatro, encendé la PC presionando la tecla de arranque (`F12`, `F11`, `F9` o `Esc` según la marca) y elegí arrancar desde el USB.
   - En segundos se levantará Windows en memoria RAM y abrirá **SiGIC** en pantalla completa.

---

## Opción 2: Creación Directa con Rufus

Si preferís quemar la ISO directamente en el pendrive:

1. Descargá **Rufus** ([rufus.ie](https://rufus.ie)).
2. Conectá el pendrive USB.
3. En **Elección de arranque**, seleccioná `SiGIC_Live_Win10_x64.iso`.
4. En **Esquema de partición**, seleccioná `GPT` (o `MBR` si el equipo es muy antiguo).
5. Sistema de destino: `UEFI (no CSM)`.
6. Hacé clic en **Empezar**.

---

## ¿Qué pasa al encender la PC con el Pendrive?

1. **Pantalla de Carga Beltrán**:
   - Se muestra el logotipo oficial del Instituto Tecnológico Beltrán.
2. **Carga Directa a Memoria RAM (Unidad X:)**:
   - El sistema opera en la memoria de la máquina; los discos internos de la máquina no se tocan ni se alteran.
3. **Inicialización de Red**:
   - Obtiene IP por cable Ethernet o permite conectar a Wi-Fi.
4. **Lanzamiento Inmediato de SiGIC**:
   - Se inicia SiGIC a pantalla completa (Kiosk) sin barra de inicio ni ventanas genéricas de Windows.
   - Si un usuario intentara cerrar la app, el supervisor del sistema la relanza automáticamente en 2 segundos.
5. **Apagado Limpio**:
   - Al terminar el acto o ceremonia, simplemente se apaga la PC y se retira el pendrive. La máquina vuelve a su sistema original como si nada hubiera pasado.
