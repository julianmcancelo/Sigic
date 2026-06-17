# MANUAL DE USUARIO Y GUÍA DE USO COTIDIANO DE SiGIC
*Sistema de Gestión Institucional de Colaciones*

---

## 1. ACCESO A LA PLATAFORMA E INICIO DE SESIÓN

El sistema SiGIC cuenta con un portal unificado para el acceso de los diferentes operadores administrativos y los egresados de la colación activa.

> [!TIP]
> **Acceso al Panel de Gestión**
> Para ingresar a las pantallas de inicio de sesión de personal administrativo, haga clic directamente en el botón **"Acceso Personal"** o **"Gestión"** ubicado en la esquina superior derecha del portal web, o acceda mediante la dirección URL correspondiente asignada a la administración (ej. `https://sigic-web.vercel.app/admin`).

### Canales de Autenticación:
*   **Personal Administrativo y de Soporte**: Ingresa a través del formulario de gestión escribiendo su correo electrónico institucional y contraseña asignada.
*   **Graduados**: Acceden sin contraseña desde el portal de alumnos. Escriben su DNI y reciben en su casilla de correo una clave temporal de un solo uso de 6 dígitos (Código OTP) que valida su sesión de forma segura.

---

## 2. OPERACIÓN DIARIA Y ACTIVACIÓN DE LA CEREMONIA

El sistema SiGIC puede contener registros de múltiples ceremonias de colación (por ejemplo: diferentes años, turnos o carreras). Sin embargo, **solo una ceremonia puede estar "Activa" a la vez**.

Es fundamental que al iniciar la jornada de trabajo verifique y active la ceremonia correspondiente, ya que todas las reservas de butacas de los estudiantes y los escaneos del personal de portería se aplicarán automáticamente sobre el evento activo.

### Paso a Paso para Activar la Ceremonia del Día:
1. Ingrese al panel principal y haga clic en la opción **Ceremonias** (en el menú lateral o clásico).
2. Visualizará el listado de ceremonias creadas. Si la del día no existe, presione **"Crear Ceremonia"** y complete los datos de fecha, hora, lugar del evento y el **Límite de Acompañantes por Egresado** (aforo permitido).
3. En la fila de la ceremonia correspondiente, presione el botón de activar. Al hacerlo, se marcará con una estrella y la leyenda **"ACTIVA"**. A partir de este instante, el sistema queda sincronizado para ese evento.

---

## 3. CARGA DEL PADRÓN DE EGRESADOS Y DESPACHO DE INVITACIONES

Para que los graduados puedan elegir sus asientos, el personal administrativo debe cargar previamente el padrón de alumnos habilitados para la ceremonia activa.

### Paso 1: Preparación del archivo Excel
Descargue la plantilla modelo del sistema. La planilla de cálculo debe contener exactamente cuatro columnas:
1.  **Nombre**: Nombre y apellido completo del egresado.
2.  **DNI**: Documento de identidad (sin puntos ni espacios).
3.  **Correo**: Dirección de e-mail donde el alumno recibirá el código de acceso y su credencial.
4.  **Carrera**: Nombre formal de la carrera que finalizó.

### Paso 2: Importar el Padrón
Ingrese a la sección **Gestionar Graduados**, presione el botón **"Cargar desde Excel"** y arrastre el archivo a la zona de carga. El sistema verificará los datos y los guardará en la nube, mostrando un resumen de la cantidad de graduados ingresados exitosamente.

### Paso 3: Envío Masivo de Invitaciones
Una vez subido el padrón, presione el botón **"Enviar Invitaciones por Correo"**. El servidor comenzará a enviar de forma automatizada un correo electrónico personalizado a cada estudiante con el enlace directo para elegir sus asientos.

> [!IMPORTANT]
> **¿Qué hacer si un alumno no recibe el correo de invitación?**
> Si un alumno reporta que no recibió el correo electrónico (por ejemplo, por problemas de spam o casillas llenas):
> 1. Vaya a **Gestionar Graduados** y búscuelo por su nombre o DNI.
> 2. Verá un botón azul de enlace rápido al final de su fila.
> 3. Haga clic para **generar y copiar el enlace directo** (contiene el token de acceso).
> 4. Envíeselo al alumno de manera privada (por WhatsApp o chat institucional). Al hacer clic en ese enlace, el graduado ingresará a su panel de reserva al instante sin requerir código OTP.

---

## 4. DISTRIBUCIÓN DE ASIENTOS Y CONTROL DEL ANFITEATRO

El plano del anfiteatro permite organizar la distribución de los egresados y sus familiares de forma visual e interactiva. Es recomendable revisar el mapa días antes de la ceremonia.

### Código de Colores de las Butacas:
*   **Azul (Egresados)**: Representa las butacas asignadas exclusivamente a los alumnos que reciben diploma.
*   **Verde (Acompañantes)**: Representa los asientos seleccionados por los familiares/invitados de los alumnos.
*   **Rojo (Ocupado)**: Butacas que ya han sido reservadas por otros graduados de la ceremonia.
*   **Gris Claro (Libre)**: Asientos disponibles para ser seleccionados.
*   **Gris Oscuro (Reservado/Bloqueado)**: Asientos reservados por la organización (por ejemplo, primeras filas destinadas a Directivos, Autoridades o Profesores).

### Asignación de Butacas para Autoridades y Protocolo:
Antes de abrir las reservas a los egresados, el administrador debe bloquear los asientos de protocolo:
1. Ingrese a **Plano Anfiteatro** (o "Butacas" en el menú).
2. Haga clic sobre los asientos de las primeras filas correspondientes a las autoridades o docentes de la colación.
3. Seleccione la opción **"Bloquear Asiento / Protocolo"**. Estas butacas cambiarán a gris oscuro y quedarán inhabilitadas para la reserva de los estudiantes.

> [!NOTE]
> **Alerta de Movilidad Reducida**
> Cuando un graduado registra que uno de sus acompañantes posee movilidad reducida, su butaca aparecerá en el mapa del anfiteatro con un **icono de silla de ruedas** y un borde diferenciado. Esto le permite a los coordinadores del salón saber con anticipación dónde ubicar rampas o asistir físicamente a los familiares al ingresar al anfiteatro.

---

## 5. OPERATORIA DE ACREDITACIÓN EL DÍA DE LA CEREMONIA (PORTERÍA)

El día del acto, el control en las puertas de ingreso del anfiteatro se realiza mediante la aplicación móvil de SiGIC o mediante el panel de control administrativo.

### 5.1. Vinculación y Login de los Celulares de Portería
Para que el personal de seguridad pueda utilizar la cámara de sus celulares para escanear, deben tener una cuenta autorizada:
1. En el panel web, ingrese a **Seguridad** (Personal de Seguridad / Portería).
2. Presione "Registrar Personal" para crear una cuenta con rol `PORTERIA`.
3. En la fila de la cuenta del portero, haga clic en **"Mostrar Acceso QR"**.
4. Pida al personal de seguridad que abra la aplicación de SiGIC en su teléfono celular:
    *   **Paso 1**: Escanear el primer código QR en pantalla para conectar la red del teléfono con la plataforma.
    *   **Paso 2**: Escanear el segundo código QR para iniciar sesión de forma automática y segura sin teclear datos.

### 5.2. Protocolo de Escaneo de Códigos QR
El portero apuntará la cámara del teléfono hacia la credencial del graduado o acompañante (ya sea impresa en papel o mostrada en la pantalla de su celular). La aplicación emitirá una respuesta sonora, táctil y visual según el estado del ingreso:

| Pantalla del Celular | Estado de Ingreso | Significado y Acción Requerida |
| :--- | :--- | :--- |
| **VERDE** | **Acceso Autorizado** | QR legítimo y válido. El teléfono emite un pitido agudo y vibra. Muestra el nombre y el número de butaca asignada para indicarle al invitado hacia dónde dirigirse. |
| **NARANJA** | **Acceso Duplicado** | QR legítimo pero que ya ingresó al salón anteriormente. La app emite una alerta y muestra la hora del primer ingreso. **Acción**: Revise el DNI del portador; podría tratarse de una copia de la credencial. |
| **ROJO** | **Acceso Denegado** | QR inválido, corrupto o correspondiente a otra ceremonia. El teléfono vibra fuertemente y no permite el ingreso del portador al anfiteatro. |

### 5.3. Acreditación de Emergencia (Mediante Código Alfanumérico)
Si un egresado o invitado pierde su credencial física, se le apaga el teléfono celular o no puede abrir el archivo PDF en el ingreso:
1.  **Acreditación con Celular**: El personal de seguridad en puerta puede digitar el **código alfanumérico único** del egresado directamente en la aplicación móvil de portería para registrar el check-in.
2.  **Soporte Papel**: Si el portero no cuenta con conexión móvil o el dispositivo falla, puede buscar al egresado/invitado en el **listado impreso en soporte papel** de la ceremonia, verificar su código alfanumérico de 8 caracteres y marcarlo de forma manual en la planilla física.
3.  Este código alfanumérico se encuentra detallado en el correo electrónico oficial de confirmación que recibe cada estudiante tras registrar sus asientos, sirviendo como respaldo alternativo de validación de identidad.

---

## 6. REPORTES Y DESCARGAS AL FINALIZAR LA CEREMONIA

Una vez concluida la ceremonia, el sistema permite generar informes de asistencia para el archivo institucional de la secretaría académica:
1. Ingrese a la sección **Reportes** (o "Panel de Reportes" en el menú).
2. Visualizará las métricas generales de asistencia: porcentaje final de ocupación, total de presentes, total de ausencias y listado de ingresos.
3. Haga clic en el botón **"Exportar Listado de Asistencia (Excel)"** para descargar una planilla estructurada con los datos de todos los acreditados en puerta, incluyendo la hora exacta de su ingreso y número de butaca física utilizada.
