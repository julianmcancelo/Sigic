# SiGIC — Contexto Maestro de Demostración Automatizada y Grabación por Fases

> **Documento de Continuidad Operativa**
> **Fecha de Actualización**: 3 de Septiembre de 2026
> **Repositorio**: `julianmcancelo/Sigic` · **Rama**: `master`

---

## 1. Resumen Ejecutivo del Estado Actual

El sistema SiGIC cuenta con un motor completo de demostración en vivo ("Piloto Automático") compuesto por un cursor virtual cinemático, un grabador de macros por eventos de usuario y un grabador de video Full HD en formato WebM.

Se ha completado la refactorización arquitectónica para permitir la **grabación modular e independiente fase por fase (de la Fase 1 a la Fase 9)**. Cada fase puede grabarse de forma aislada, guardarse, probarse inmediatamente con el cursor virtual y transicionarse automáticamente a la siguiente fase sin interrumpir el flujo.

La compilación de producción (`npm run build`) ha sido verificada y ejecutada con éxito (cero errores en Turbopack). El servidor de desarrollo local se encuentra configurado para ejecutarse en el puerto 3001.

---

## 2. Arquitectura del Sistema de Demostración

El subsistema de demostración se orquesta mediante la interacción de tres componentes principales ubicados en `codigo/plataforma/src/componentes/`:

### 2.1. `GuiaDemostracionAutomatica.jsx` (Orquestador Central)
- **Barra Inferior de Spotlight**:
  - Muestra la fase actual (1/9), rol institucional, acción simulada, descripción y barra de progreso calculada dinámicamente.
  - Botonera de control: Anterior, Pausa/Reanudar, Siguiente, Interruptor del Cursor Guiado (ON/OFF), Grabar/Editar Pasos, Selector de Velocidad (1x, 1.5x, 2x), Grabador WebM y Menú desplegable de Fases.
  - Durante la grabación interactiva, la barra inferior se oculta automáticamente para evitar superponerse a botones de modales y formularios (como los botones "CANCELAR" y "CREAR").
- **Panel Grabador Flotante (Esquina Superior Derecha)**:
  - Anclado en `top-3 right-3` con ancho compacto (320px a 384px) y desenfoque de fondo (`backdrop-blur-2xl`) para no interferir con la pantalla central.
  - **Selector Horizontal de Fases (`F1` a `F9`)**: Permite saltar inmediatamente a cualquier fase con un solo clic. Los chips identifican visualmente si la fase está activa (celeste brillante), si posee una macro propia grabada (ámbar con indicador esmeralda) o si utiliza la secuencia de fábrica (pizarra oscura).
  - **Monitor de Acciones en Vivo**: Lista en tiempo real cada clic (`click`), movimiento (`mover`) o texto tipeado (`tipear`) capturado en el DOM.
  - **Botonera Operativa**:
    - **Deshacer**: Elimina el último paso registrado en caso de equivocación.
    - **Restablecer**: Elimina la rutina personalizada de esa fase y retorna a los valores predeterminados de fábrica.
    - **Probar**: Guarda la rutina de la fase y ejecuta de inmediato la reproducción visual del cursor sobre la pantalla activa.
    - **Finalizar**: Guarda la rutina de la fase en `localStorage` y cierra el grabador, dejando la demostración lista.
    - **Siguiente**: Guarda la rutina de la fase actual y avanza de forma inmediata a la siguiente fase, sincronizando la pantalla de la plataforma y manteniendo el grabador abierto para registrarla sin pausas.
- **Sincronización Bidireccional con la Plataforma**:
  - Cada cambio de fase dispara automáticamente `onAplicarPaso(pasoActual)`, forzando a `App.jsx` a alternar la vista administrativa o la pestaña del portal de graduado correspondiente.

### 2.2. `CursorVirtualDemo.jsx` (Puntero Cinemático y Ejecutor)
- Renderiza un puntero de mouse vectorial de alta definición sobre un contenedor `fixed z-[99999]`.
- **Efectos Cinemáticos**: Vuelo suave entre coordenadas, escala de clic (85%), onda expansiva semitransparente (`ring` y `ripple`), y halo brillante en la punta.
- **Burbuja de Acción Contextual**: Notificación flotante adyacente al cursor que describe la acción técnica en curso y muestra en tiempo real las cadenas de caracteres siendo redactadas.
- **Ejecución Asíncrona Robusta**:
  - `esperarElemento`: Sondeo activo de elementos en el DOM con soporte para elementos renderizados dinámicamente y modales.
  - `simularEscritura`: Disparo de eventos sintéticos nativos (`input`, `change`) sobre los prototipos de `HTMLInputElement` y `HTMLTextAreaElement` de React. Soporte específico para campos `date` y `datetime-local`.
  - `ejecutarClic`: Activación de `focus()` y `click()` con resaltado perimetral (`ring-2 ring-sky-400`).

### 2.3. Grabador de Pantalla Full HD Integrado (WebM)
- Utiliza la API nativa `navigator.mediaDevices.getDisplayMedia` y `MediaRecorder`.
- Permite capturar la pestaña del navegador a 30/60 fps y exportar automáticamente un archivo WebM descargable al finalizar el recorrido de las 9 fases.

---

## 3. Desglose de las 9 Fases del Flujo

| Fase | Título | Rol Institucional | Vista en Plataforma | Clave en LocalStorage |
|---|---|---|---|---|
| **1** | Creación e Inicialización del Acto | ADMINISTRACIÓN | `gestion-ceremonias` | `sigic_demo_secuencia_1` |
| **2** | Carga Masiva e Importación de Graduados | ADMINISTRACIÓN | `gestion-graduados` | `sigic_demo_secuencia_2` |
| **3** | Convocatoria Masiva & Tokens OTP | ADMINISTRACIÓN | `convocatoria` | `sigic_demo_secuencia_3` |
| **4** | Autogestión del Egresado: Juramento | PORTAL DEL GRADUADO | Pestaña `juramento` | `sigic_demo_secuencia_4` |
| **5** | Registro de Familiares y Padrinos | PORTAL DEL GRADUADO | Pestaña `entregadores` | `sigic_demo_secuencia_5` |
| **6** | Credencial Digital QR & Google Wallet | PORTAL DEL GRADUADO | Pestaña `credencial` | `sigic_demo_secuencia_6` |
| **7** | Distribución Inteligente de Butacas | ADMINISTRACIÓN | `preparacion-ceremonia` | `sigic_demo_secuencia_7` |
| **8** | Acreditación de Ingreso y Aforo | PORTERÍA & SEGURIDAD | `control-ingreso` | `sigic_demo_secuencia_8` |
| **9** | Cierre Legal, Acta Oficial PDF & Métricas | AUDITORÍA & CIERRE | `estado-ceremonia` | `sigic_demo_secuencia_9` |

---

## 4. Esquema de Datos de las Acciones Grabadas

Cada macro personalizada se almacena en `localStorage` bajo formato JSON como un arreglo de objetos de acción. Cada objeto sigue la siguiente estructura:

### Acción de Movimiento (`mover`)
```json
{
  "tipo": "mover",
  "selector": "#btn-nueva-ceremonia",
  "textoBoton": "Nueva Ceremonia",
  "rx": 0.88,
  "ry": 0.12,
  "etiqueta": "Mover hacia: Nueva Ceremonia",
  "pausaDespues": 500,
  "esperarElemento": true
}
```

### Acción de Clic (`click`)
```json
{
  "tipo": "click",
  "selector": "#btn-nueva-ceremonia",
  "textoBoton": "Nueva Ceremonia",
  "rx": 0.88,
  "ry": 0.12,
  "etiqueta": "Clic en: Nueva Ceremonia",
  "pausaDespues": 700,
  "esperarElemento": true
}
```

### Acción de Tipeo (`tipear`)
```json
{
  "tipo": "tipear",
  "selector": "#input-nombre-ceremonia",
  "texto": "Colación Beltrán 2026",
  "etiqueta": "Escribir: \"Colación Beltrán 2026\"",
  "pausaDespues": 800,
  "esperarElemento": true
}
```

---

## 5. Protocolo de Trabajo para Mañana: Cómo Grabar Cada Fase

Para continuar con la grabación y calibración de las fases en la próxima sesión, seguir este procedimiento exacto:

### Paso 1: Iniciar el Entorno de Trabajo
1. Abrir una terminal en `d:\Sigic\codigo\plataforma`.
2. Verificar o levantar el servidor de desarrollo:
   ```cmd
   cmd.exe /c "npx next dev -p 3001"
   ```
3. Acceder en el navegador a: `http://localhost:3001`.

### Paso 2: Abrir la Demostración
1. En la esquina inferior derecha, hacer clic sobre el widget **Control del Expositor**.
2. Presionar el botón **Demostración**.
3. El sistema configurará la sesión administrativa y desplegará la barra de spotlight inferior.

### Paso 3: Grabar una Fase Específica
1. En la barra inferior, presionar el botón **Grabar Pasos** (o **Editar Pasos** si ya tiene grabación).
2. Se abrirá el panel grabador en la esquina superior derecha (`top-3 right-3`).
3. Si se desea grabar una fase distinta a la actual, hacer clic sobre cualquiera de los botones de fase (`F1` a `F9`) en la franja superior del panel grabador. La pantalla cambiará automáticamente a la vista respectiva.
4. Interactuar con la interfaz del sistema de la forma exacta en que se desea que el cursor lo repita:
   - Hacer clic en los botones correspondientes.
   - Escribir en los campos de texto o fechas requeridos.
   - Cada interacción aparecerá listada en el panel.
   - Si se cometió un error en un clic o campo, pulsar el botón **Deshacer**.
5. Al concluir las acciones de esa fase, seleccionar una de las opciones:
   - **Probar**: Guarda la fase y ejecuta inmediatamente el cursor virtual para ver cómo se reproduce.
   - **Finalizar**: Guarda la fase en `localStorage` y cierra el grabador.
   - **Siguiente**: Guarda la fase actual y transiciona directamente a la siguiente fase, cambiando la vista y manteniendo el panel grabador abierto para continuar con el padrón.

### Paso 4: Respaldar las Secuencias Grabadas
Si se desea exportar las rutinas grabadas a un archivo estático para persistirlas en el repositorio de código, se puede extraer el contenido de `localStorage` desde la consola del navegador:
```javascript
const demoExport = {};
for (let i = 1; i <= 9; i++) {
  demoExport[`fase_${i}`] = JSON.parse(localStorage.getItem(`sigic_demo_secuencia_${i}`) || '[]');
}
console.log(JSON.stringify(demoExport, null, 2));
```

---

## 6. Convenciones y Reglas Estrictas

1. **Prohibición Total de Emojis**:
   - Queda estrictamente prohibido el uso de cualquier emoji o caracter pictorial en el código fuente, etiquetas de usuario, comentarios, nombres de variables y respuestas de texto.
   - Toda la simbología visual debe resolverse exclusivamente mediante componentes de `lucide-react`.
2. **Idioma**:
   - Todo el desarrollo, documentación y mensajes deben mantenerse en español técnico.
3. **Consistencia de Ejecución en Windows**:
   - Los comandos en la terminal deben invocarse mediante `cmd.exe /c "..."` para evitar restricciones de políticas de ejecución de scripts en PowerShell.
4. **Verificación de Compilación**:
   - Siempre verificar mediante `cmd.exe /c "npm run build"` antes de concluir cualquier sesión de cambios.
