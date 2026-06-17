# Manual de Operación y Uso Diario de SiGIC
### Guía Práctica de Procedimientos Diarios para el Operador del Sistema

Este manual detalla las tareas, secuencias y procedimientos paso a paso que el operador del sistema debe realizar para gestionar una ceremonia de colación utilizando **SiGIC**. Cubre desde el encendido de la infraestructura hasta la acreditación de invitados en la puerta el día del evento.

---

## 📅 Índice de Flujo Operativo
1. **Fase 1: Preparación del Entorno** (Arranque de servidores y bases de datos).
2. **Fase 2: Planificación de la Ceremonia** (Creación y activación de la colación).
3. **Fase 3: Importación del Padrón y Envío** (Carga del Excel y despacho de invitaciones).
4. **Fase 4: Monitoreo y Soporte Diario** (Asistencia a egresados y reenvíos de enlaces).
5. **Fase 5: Operatividad el Día del Evento** (Acreditación QR y resolución de incidentes en puerta).
6. **Fase 6: Cierre y Nueva Colación** (Reportes de presentismo y reinicio en limpio).

---

## 🔌 Fase 1: Preparación del Entorno y Encendido
Cada día que deba operar la plataforma de gestión, siga este orden de encendido:

1. **Abrir el Centro de Control:**
   * Haga doble clic en el archivo [SiGIC_ControlCenter.exe](file:///d:/Sigic/scripts/SiGIC_ControlCenter.exe) ubicado en la carpeta de herramientas.
2. **Verificar Estado de Conexión:**
   * En el panel superior, observe las luces indicadoras:
     * **Base de Datos (DB):** Debe marcar en **Verde (Conectado)**. Si marca en rojo, verifique la conexión a internet de su computadora (necesaria para conectar con Neon Cloud PostgreSQL).
3. **Encender la Infraestructura:**
   * Haga clic en el botón central **Iniciar Infraestructura**.
   * Las luces de **Backend** y **Frontend** cambiarán a verde en unos segundos.
   * La consola inferior comenzará a mostrar registros de actividad en color azul.
4. **Ingresar a la Web:**
   * Pulse el botón **Abrir en Navegador** o ingrese manualmente a [http://localhost:5173](http://localhost:5173).

---

## 🏛️ Fase 2: Planificación de la Ceremonia
Antes de importar alumnos o enviar correos, debe definir el evento en el sistema:

1. Inicie sesión en la web con su perfil de **Administrador**.
2. Diríjase a la pestaña **Ceremonias** en el panel lateral.
3. Haga clic en **Crear Ceremonia** y complete:
   * **Nombre:** Debe ser claro (ej: `Colación Tecnicaturas Beltrán 2026`).
   * **Fecha y Hora:** El día y hora exactos del acto.
   * **Lugar:** Ej: `Teatro Municipal de Avellaneda`.
   * **Cupo de Invitados:** Defina la cantidad máxima de acompañantes permitidos por egresado (ej: `4`).
4. **Paso Crítico - Activar Ceremonia:**
   * Busque la ceremonia creada en el listado y haga clic en **Marcar como Activa**.
   * > [!WARNING]
   * > Solo puede haber una ceremonia activa a la vez. Toda la carga de alumnos, selección de asientos y lectura de códigos QR de portería se aplicarán automáticamente a la ceremonia activa en este momento.

---

## 📊 Fase 3: Importación del Padrón y Despacho de Invitaciones
Con la ceremonia activa seleccionada, cargue el padrón de alumnos graduados:

### 3.1 Preparación de la Planilla Excel
Cree un archivo de Excel (`.xlsx`) respetando estrictamente estas columnas (en minúsculas y sin acentos ni espacios extra):
*   `nombre`: Nombre completo (ej: *Gomez, Lucía*).
*   `legajo`: Número identificador de alumno.
*   `dni`: Documento único (sin puntos ni espacios, ej: *40123456*).
*   `correo`: Dirección de correo donde recibirá la invitación.
*   `carrera`: Nombre formal del título (ej: *Tecnicatura Superior en Sistemas*).
*   `anio_inscripcion`: Año en formato numérico (ej: *2023*).
*   `promedio`: Promedio académico con punto decimal (ej: *8.75*).

### 3.2 Importación en el Sistema
1. En el Portal Web, ingrese a **Gestión de Graduados**.
2. Haga clic en el área de **Importar Excel (.xlsx)** y seleccione el archivo preparado.
3. El sistema validará los campos y reportará si hay correos mal escritos o DNI duplicados antes de guardarlos.
4. Haga clic en **Guardar Padrón** para confirmar la carga.

### 3.3 Despacho de Correos Electrónicos
1. En la misma pantalla de graduados, pulse el botón **Enviar Invitaciones a Todos**.
2. Si un graduado se incorpora tarde, puede registrarlo manualmente con el formulario de alta y enviarle su invitación de manera individual haciendo clic en el icono del **avión de papel** en su fila correspondiente.

---

## ✉️ Fase 4: Monitoreo y Soporte Diario
En los días posteriores al envío y antes del acto, su labor consiste en monitorear las respuestas y asistir a los alumnos:

*   **Seguimiento del Estado:**
    En el listado de graduados podrá ver el estado de cada uno en tiempo real:
    *   `Enviado`: Se despachó el correo pero el alumno aún no ingresó.
    *   `Pendiente`: El alumno ingresó al enlace pero aún no confirmó su asistencia.
    *   `Confirmado`: El alumno ya seleccionó sus butacas e ingresó los acompañantes.
    *   `Rechazado`: El alumno declaró que no asistirá al acto (su cupo y asientos se liberaron).

*   **Soporte Técnico: "No me llegó el correo de invitación"**
    Si un graduado reclama que no recibió la invitación (ej: por estar en la carpeta de SPAM):
    1. Busque al alumno por DNI o Nombre en **Gestión de Graduados**.
    2. Copie el **Token de Acceso** que figura en su fila (es un código alfanumérico).
    3. Copie y envíe de manera directa por WhatsApp o correo alternativo el enlace de acceso manual:
       `http://localhost:5173/?token=PEGAR_AQUI_EL_TOKEN`
    4. El alumno ingresará de forma inmediata a su autogestión sin pasar por la validación de correo.

*   **Correcciones de Acompañantes o Cambios de Asiento:**
    Si el alumno cometió un error o necesita cambiar los datos de un invitado a último momento:
    1. Diríjase a **Gestión de Graduados** y busque al alumno.
    2. Haga clic en **Ver/Editar Detalles**.
    3. Modifique el nombre o DNI del invitado y haga clic en **Guardar Cambios**. El código QR anterior del invitado seguirá siendo el mismo pero validará los nuevos datos.

---

## 🛡️ Fase 5: Operatividad el Día del Acto (Acreditación)
Es el día de la ceremonia. Debe preparar los accesos y montar una mesa de soporte técnico:

### 5.1 Preparación de los Dispositivos de Portería
1. Asegúrese de que los teléfonos móviles del personal de seguridad tengan instalada la aplicación de acreditación.
2. Inicie sesión en cada celular con el correo del portero y la clave asignada por el administrador.
3. Compruebe que la cámara tenga permisos activos para enfocar códigos QR.

### 5.2 Operación de Portería
*   Los porteros apuntarán la cámara a las credenciales presentadas.
*   **Pantalla Verde (Pase Libre):** El portero lee el asiento en pantalla (ej: *Fila F, Asiento 4*) e indica el camino.
*   **Alerta de Movilidad Reducida:** Si se dispara este aviso en pantalla, el portero solicitará soporte a un asistente de sala para que guíe al invitado de manera prioritaria.
*   **Pantalla Naranja (Duplicado):** Si el QR ya fue escaneado, se deniega el ingreso por sospecha de fraude y se deriva el caso a la mesa de soporte.

### 5.3 Acreditación de Emergencia (Código Alfanumérico)
Si un egresado o invitado pierde su credencial física, se le apaga el teléfono celular o no puede abrir el archivo PDF en el ingreso:

1.  **Acreditación con Celular:** El personal de seguridad en puerta puede digitar el **código alfanumérico único** del egresado directamente en la aplicación móvil de portería para registrar el check-in.
2.  **Soporte Papel:** Si el portero no cuenta con conexión móvil o el dispositivo falla, puede buscar al egresado/invitado en el **listado impreso en soporte papel** de la ceremonia, verificar su código alfanumérico de 8 caracteres y marcarlo de forma manual en la planilla física.
3.  Este código alfanumérico se encuentra detallado en el correo electrónico oficial de confirmación que recibe cada estudiante tras registrar sus asientos, sirviendo como respaldo alternativo de validación de identidad.

### 5.4 Mesa de Ayuda / Soporte de Emergencia (En el ingreso)
El operador del sistema debe estar ubicado en el hall con una computadora conectada a la web de administración para resolver tres incidentes típicos:

1.  **"Olvidé / Perdí mi credencial QR"**
    *   Solicite el DNI del graduado o del invitado.
    *   Búsquelo en el panel del administrador en **Control de Ingreso**.
    *   Si sus datos son válidos y no ha ingresado, haga clic en el botón **Ingresar Manualmente** desde el panel. Su estado cambiará a "Presente" y podrá pasar al salón indicándole su butaca.
2.  **Invitado Reemplazado a Último Minuto**
    *   Si un invitado no puede asistir y traen a un reemplazo sin credencial:
    *   Busque al graduado, edite los datos del invitado anterior colocando el Nombre y DNI del nuevo ingresante, guarde y escanee la credencial original. El sistema registrará los datos del nuevo acompañante.
3.  **Conflicto de Butaca Duplicada**
    *   Si dos personas reclaman el mismo asiento, consulte el plano en tiempo real en la pestaña **Butacas** para verificar a quién le asignó el servidor dicho lugar y reasigne una butaca vacía de cortesía al otro invitado en caso de ser necesario.

---

## 📊 Fase 6: Cierre de Colación y Respaldo
Una vez finalizado el acto y entregados los diplomas:

1.  **Descarga del Reporte de Asistencia:**
    *   En el panel de administración, haga clic en **Exportar Presentismo**.
    *   El sistema descargará un archivo Excel detallando la hora exacta de ingreso de cada graduado e invitado para el archivo institucional de la secretaría académica.
2.  **Limpieza para el Próximo Año:**
    *   Si debe configurar una colación completamente nueva:
    *   Abra el **Centro de Control de Windows (C#)**.
    *   Haga clic en **Forzar Setup Inicial**.
    *   Esto vaciará todas las tablas (graduados, invitados y reservas) de la base de datos de forma segura, quedando listo para comenzar la Fase 1 en la próxima ceremonia.
