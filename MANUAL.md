# Manual de Usuario de SiGIC
## Sistema de Gestión Integral de Colación y Ceremonias

Este manual está diseñado para instruir a los usuarios finales de la plataforma **SiGIC** sobre cómo operar y aprovechar al máximo sus funciones. La plataforma cuenta con tres perfiles de usuario bien definidos:
1. **Administradores:** Personal institucional responsable de la planificación, configuración del anfiteatro, importación del padrón y control del evento.
2. **Egresados:** Graduados que confirman su asistencia, registran a sus invitados, eligen sus asientos y obtienen sus credenciales de acceso.
3. **Personal de Portería:** Encargados del control de accesos en el ingreso al anfiteatro mediante el escaneo de códigos QR.

---

## 1. Módulo del Administrador (Portal Web)

El portal de administración es el cerebro del sistema. Permite configurar y supervisar las ceremonias de colación de forma centralizada.

### 1.1 Asistente de Configuración Inicial (Setup)
Al instalar por primera vez el sistema o al forzar un reinicio de datos, se abrirá automáticamente el **Asistente de Setup**.
1. **Registro del Super-Usuario:** Ingrese su Nombre, Correo Electrónico institucional y elija una contraseña segura.
2. **Configuración de la Institución:** Ingrese el Nombre de la Institución (ej. *Instituto Tecnológico Beltrán*), la fecha y el lugar previsto para el evento.
3. **Confirmación:** Una vez completado, el asistente creará las tablas y base de datos iniciales. Ya puede iniciar sesión con el correo y contraseña registrados.

### 1.2 Gestión de Ceremonias
Dentro del panel, los administradores con rol `SUPER_ADMIN` o `ADMIN` pueden gestionar ceremonias:
* **Crear Ceremonia:** Defina un nombre identificador (ej. *Colación de Ingeniería 2026*), la fecha, el lugar y el cupo máximo de invitados permitidos por graduado (ej. *4 invitados*).
* **Activar Ceremonia:** El sistema solo admite **una ceremonia activa a la vez**. Asegúrese de marcar como activa la ceremonia actual para que las importaciones y la autogestión de egresados se vinculen a ella.

### 1.3 Carga del Padrón de Egresados
Para poblar el listado de graduados habilitados en la ceremonia activa, diríjase a **Gestión de Graduados**:
* **Carga Masiva (Excel / Archivo de cálculo):**
  1. Descargue o cree una planilla de Excel con las siguientes columnas: `nombre`, `legajo`, `dni`, `correo`, `carrera`, `anio_inscripcion`, `promedio`.
  2. Haga clic en **Importar Padrón (.xlsx)** y arrastre su archivo.
  3. El sistema verificará de forma automática duplicados, formatos de DNI y correos, cargando la lista completa en segundos.
* **Alta Individual:** Si falta algún alumno, complete el formulario en pantalla ingresando sus datos principales (DNI, Nombre Completo, Legajo y Carrera).

### 1.4 Envío de Invitaciones por Correo Electrónico
Una vez que el padrón esté cargado:
1. Haga clic en **Enviar Invitaciones**.
2. Puede realizar un envío masivo o individual (haciendo clic sobre el avión de papel al lado de cada egresado).
3. Cada egresado recibirá un correo formal con un **enlace único de autogestión** que contiene su token de seguridad personal.

### 1.5 Editor Visual de Anfiteatro
El sistema incluye un editor en tiempo real para organizar los asientos del evento:
1. Diríjase a **Editor de Anfiteatro**.
2. **Diseño de Sectores:** Defina la cantidad de filas y columnas del salón (ej. 15 filas por 20 columnas).
3. **Distribución de Roles:** Pinte las butacas asignándoles un rol específico:
   * **Graduados (Azul):** Reservado exclusivamente para la ubicación de los egresados en el frente.
   * **Acompañantes / Invitados (Verde):** Asientos destinados a los familiares del graduado.
   * **Docentes / Autoridades (Amarillo):** Asientos preferenciales para los profesores y directivos.
   * **Pasillos / Obstáculos (Gris oscuro):** Define las áreas de tránsito donde no hay butacas físicas.
4. **Guardar Mapa:** Guarde el diseño. Este mapa interactivo será el que vean los egresados al elegir su butaca.

### 1.6 Panel de Monitoreo y Presentismo
Durante el día del evento, el panel muestra estadísticas en vivo:
* **Indicadores Clave:** Total de egresados presentes, porcentaje de invitados acreditados y butacas libres/ocupadas.
* **Logs de Auditoría:** Registro de accesos autorizados y denegados con hora exacta del escaneo.

---

## 2. Módulo del Egresado (Portal de Autogestión)

El egresado realiza su flujo de forma autónoma desde un celular o computadora al hacer clic en su enlace de invitación.

### 2.1 Autenticación Segura (OTP)
Si el egresado ingresa de forma manual a la web:
1. Deberá colocar su correo registrado.
2. El sistema le enviará por email un **código de acceso temporal (OTP)** de 6 dígitos con 10 minutos de validez.
3. Ingrese el código en pantalla para ingresar al portal seguro.

### 2.2 Confirmación de Asistencia
Al ingresar por primera vez, el portal solicita confirmar su asistencia:
* **Asistiré (Aceptado):** Habilita al graduado a completar el formulario, registrar acompañantes y elegir asientos.
* **No asistiré (Rechazado):** Esta acción es **irreversible**. Al rechazar, el cupo de butacas del graduado se libera inmediatamente y sus credenciales quedan inhabilitadas en el sistema de portería.

### 2.3 Registro de Acompañantes / Invitados
Una vez confirmada la asistencia:
1. Complete los datos de sus acompañantes (hasta el cupo máximo definido por el administrador).
2. Deberá ingresar: **Nombre Completo, DNI, Teléfono y Relación** (familiar, amigo, etc.).
3. **Discapacidad / Movilidad Reducida:** Si un invitado requiere asistencia de movilidad, marque la casilla correspondiente. El sistema lo indicará en las planillas del administrador y alertará en portería para priorizar su ingreso.

### 2.4 Selección Interactiva de Asientos
1. Haga clic en **Seleccionar Asientos**.
2. Se desplegará el anfiteatro configurado por la institución.
3. El egresado debe elegir su propia butaca (dentro del sector azul de graduados) y las de sus acompañantes (dentro del sector verde).
4. El sistema bloquea en tiempo real los asientos reservados por otros alumnos para evitar solapamientos.

### 2.5 Obtención de Credenciales Digitales (Código QR)
Una vez completados los pasos anteriores:
1. El portal generará la **Credencial Oficial de SiGIC** para el graduado y para cada uno de sus invitados registrados.
2. Cada credencial incluye el Nombre, DNI, el Asiento Asignado (ej. *Fila 3, Butaca 12*) y un **Código QR único**.
3. Guarde la credencial en PDF o haga una captura de pantalla en el celular. Este código QR será requerido obligatoriamente para ingresar al salón.

---

## 3. Módulo de Portería (Aplicación Móvil / Flutter)

Destinado al personal de seguridad y acreditación en la entrada del evento. La aplicación corre en dispositivos móviles (Android / iOS) y utiliza la cámara para escanear.

### 3.1 Inicio de Sesión de Portería
El personal de portería ingresa a la aplicación móvil utilizando las credenciales asignadas por el administrador con rol `PORTERIA`.

### 3.2 Escaneo de Credenciales QR
1. Presione el botón **Escanear** para activar la cámara del celular.
2. Apunte al código QR de la credencial digital (presentada en papel o pantalla móvil por el egresado o invitado).
3. **Respuesta Visual Inmediata:** La aplicación mostrará una pantalla de color según el resultado:
   * **Verde (Acceso Autorizado):** La credencial es válida, corresponde a la ceremonia activa y el asiento está verificado. Muestra el Nombre y la Butaca asignada.
   * **Naranja (Acceso Ya Registrado):** El código QR es válido, pero esa persona **ya ingresó previamente** al anfiteatro. Alerta ante posibles copias o duplicados de credenciales.
   * **Rojo (Acceso Denegado):** El código no existe en el sistema, corresponde a otra ceremonia, pertenece a un graduado que marcó "No asistiré", o no tiene asientos asignados.
4. **Alerta de Movilidad Reducida:** Si el invitado posee movilidad reducida, la pantalla verde emitirá un aviso visual destacado para coordinar la asistencia física hasta su butaca.

---

## 4. Resolución de Problemas Comunes (FAQ)

### 4.1 ¿Qué pasa si un egresado no recibió el enlace de autogestión?
1. El administrador debe buscar al egresado en el padrón del Portal Web.
2. Verifique que el correo electrónico esté escrito correctamente.
3. Haga clic en el botón de reenvío individual para forzar el envío del correo electrónico.
4. Si el servidor de correos falla, el administrador puede copiar el token del egresado directamente de la tabla y armarle el link manual: `http://localhost:5173/?token=TOKEN_DEL_EGRESADO`.

### 4.2 El Centro de Control muestra "Sin conexión" en el Backend.
* **Causa 1:** El puerto `3001` está ocupado por otra aplicación.
* **Causa 2:** El archivo `.env` del backend no contiene la variable `DATABASE_URL` o esta tiene credenciales incorrectas.
* **Solución:** Revise la consola de registros en la parte inferior del Centro de Control; allí se indicará el error exacto arrojado por el proceso de Node.js.

### 4.3 ¿Cómo se limpia la base de datos para una nueva colación?
* **Paso seguro:** En el Centro de Control de Windows, haga clic en **Forzar setup inicial**. Esta opción le pedirá confirmación y limpiará de forma segura todas las tablas locales (SQLite) o remotas (PostgreSQL en Neon Cloud), dejándolo listo para registrar una nueva ceremonia y un nuevo padrón de egresados.
