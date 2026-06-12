# MANUAL DE USUARIO
## Sistema de Gestión Integral de Credenciales y Ceremonias (SiGIC)

**Autor:** Equipo de Prácticas Profesionalizantes  
**Versión:** 5.1.0  
**Fecha:** Junio / 2026  
**Institución:** Instituto Tecnológico Beltrán  

---

## ÍNDICE
1. Introducción  
2. Objetivos del sistema  
3. Alcance del sistema  
4. Requisitos mínimos  
5. Acceso al sistema  
6. Roles de usuario  
7. Funcionalidades del sistema  
   * 7.1 Configuración Inicial del Sistema (Setup)  
   * 7.2 Creación y Gestión de Ceremonias  
   * 7.3 Carga Masiva del Padrón de Egresados (Excel)  
   * 7.4 Envío y Reenvío de Enlaces de Invitación  
   * 7.5 Autogestión del Egresado y Validación OTP  
   * 7.6 Declaración de Asistencia (Aceptación/Rechazo)  
   * 7.7 Carga de Invitados y Declaración de Movilidad Reducida  
   * 7.8 Selección Visual de Asientos en el Anfiteatro  
   * 7.9 Descarga y Uso de Credenciales QR  
   * 7.10 Acreditación y Validación de Seguridad (Portería)  
8. Seguridad del sistema  
9. Problemas frecuentes y soluciones  
10. Buenas prácticas de uso  
11. Conclusión  
12. Soporte técnico e institucional  
*Anexos — Glosario de Términos*  

---

## 1. INTRODUCCIÓN
El **Sistema de Gestión Integral de Credenciales y Ceremonias (SiGIC)** es una plataforma digital unificada desarrollada para agilizar, organizar y asegurar las ceremonias de colación de grados del **Instituto Tecnológico Beltrán**. 

La plataforma automatiza y centraliza actividades complejas que anteriormente se realizaban de forma manual: la importación de padrones de alumnos graduados, el diseño y asignación de butacas protocolares en el salón, la comunicación directa con los egresados, la recopilación de datos de sus acompañantes y la validación en tiempo real en los accesos al evento mediante credenciales con códigos QR encriptados.

---

## 2. OBJETIVOS DEL SISTEMA
### Objetivo general
Proporcionar al Instituto Tecnológico Beltrán una herramienta tecnológica de extremo a extremo que automatice la gestión de invitados, la asignación de asientos y el control de accesos durante los actos de colación, garantizando una experiencia ordenada y ágil para directivos, egresados y familiares.

### Objetivos específicos
*   **Automatizar la comunicación:** Reemplazar las invitaciones físicas por enlaces encriptados individuales y validaciones seguras sin necesidad de contraseñas complejas.
*   **Optimizar la distribución del salón:** Ofrecer un editor interactivo para diseñar la cuadrícula de butacas y permitir a los egresados elegir de forma autónoma sus asientos y los de sus acompañantes.
*   **Asegurar los accesos:** Validar en portería mediante el escaneo ágil de códigos QR, impidiendo la duplicidad de ingresos y controlando el aforo en tiempo real.
*   **Priorizar la accesibilidad:** Identificar a invitados con movilidad reducida desde el registro para coordinar su asistencia personalizada el día del acto.

---

## 3. ALCANCE DEL SISTEMA
La plataforma SiGIC abarca todo el ciclo operativo de la colación de grados, dividiéndose en tres grandes portales interconectados:
1.  **Portal del Administrador (Web):** Gestión interna, configuración del salón y monitoreo de presentismo.
2.  **Portal del Egresado (Web):** Autogestión de invitados, selección de butacas y descarga de credenciales.
3.  **Portal del Acreditador (Móvil):** Visor de control en portería para validación de QR.
4.  **Centro de Control de Escritorio (WPF):** Consola para el arranque, monitoreo y mantenimiento técnico local de la base de datos y servidores de red.

---

## 4. REQUISITOS MÍNIMOS
### Hardware
*   **Para el Administrador / Egresado:** Computadora personal, notebook o dispositivo móvil con conexión estable a Internet.
*   **Para Portería / Acreditación:** Teléfono inteligente o tablet con cámara trasera activa de al menos 8 MP (para lectura rápida de QR) y conectividad Wi-Fi o datos móviles.
*   **Para Servidor Local (Operador):** Computadora con sistema operativo Windows 10/11, procesador x64 de 2 núcleos y puerto USB disponible (si se opera localmente).

### Software
*   **Navegador Web:** Google Chrome, Microsoft Edge, Mozilla Firefox o Safari actualizado a su última versión.
*   **Entorno de Ejecución (Solo Operador Técnico):** SDK de .NET 8 y Node.js v22 LTS instalados (gestionados automáticamente por el Centro de Control WPF).

---

## 5. ACCESO AL SISTEMA
### URL de Acceso General
La plataforma web del sistema opera localmente en la dirección de red de desarrollo:
`http://localhost:5173`

### Acceso a la Autogestión del Graduado
El graduado tiene dos vías de ingreso seguro:
1.  **Enlace Directo:** Haciendo clic en el botón de la invitación enviada por correo electrónico, el cual contiene una firma digital única en la URL (`?token=...`).
2.  **Validación por Correo:** Ingresando manualmente a la web, digitando su correo institucional y completando el código OTP de 6 dígitos que el sistema le envía de forma inmediata a su bandeja de entrada.

---

## 6. ROLES DE USUARIO
El sistema cuenta con tres niveles de permisos y accesos diferenciados para garantizar la integridad de los datos:

### 6.1 Administrador (Admin / Super Admin)
Posee el control de la planificación institucional de la ceremonia. Sus funciones principales son:
*   Inicializar y vaciar las bases de datos de colaciones.
*   Crear eventos de graduación y definir la ceremonia activa.
*   Subir el padrón de alumnos graduados mediante planillas Excel.
*   Editar y distribuir el plano de butacas protocolares en el anfiteatro.
*   Despachar correos masivos y gestionar la asistencia manual de accesos.

### 6.2 Egresado / Graduado
Representa al destinatario del evento. Tiene permisos para:
*   Declarar si asistirá o declinará la invitación.
*   Registrar a sus invitados acompañantes (nombre, DNI y teléfono).
*   Seleccionar su butaca en el sector azul y las de sus acompañantes en el sector verde.
*   Exportar e imprimir las credenciales de ingreso.

### 6.3 Portero (Seguridad / Acreditador)
Personal de campo encargado de la validación física el día de la ceremonia. Sus funciones son:
*   Escanear los códigos QR presentados por los asistentes.
*   Visualizar la confirmación de acceso y el asiento asignado en pantalla.
*   Detectar intentos de fraude (credenciales duplicadas o alteradas).
*   Identificar alertas de movilidad reducida para activar protocolos de asistencia en sala.

---

## 7. FUNCIONALIDADES DEL SISTEMA (PASO A PASO)

### 7.1 Configuración Inicial del Sistema (Setup)
Al instalar por primera vez o reestablecer la base de datos, el sistema se bloquea en modo **Asistente de Setup**:
1.  Complete los campos del Super-Administrador (Nombre, Correo y Contraseña).
2.  Defina el nombre oficial de la institución (ej: *Instituto Tecnológico Beltrán*) y el lugar inicial del evento.
3.  Haga clic en **Inicializar Sistema**. El asistente creará automáticamente las tablas y la estructura de datos requerida y habilitará la pantalla de inicio de sesión.

### 7.2 Creación y Gestión de Ceremonias
1.  Diríjase a la pestaña **Ceremonias** en el panel del Administrador.
2.  Haga clic en **Nueva Ceremonia** e ingrese el Nombre de la colación, Fecha, Ubicación del salón y el Límite de invitados por egresado.
3.  **Acción Clave:** Localice la ceremonia en la lista y presione **Activar**. Esto le indica al servidor que toda la carga posterior de alumnos y acreditaciones QR se asociarán exclusivamente a esta ceremonia activa.

### 7.3 Carga Masiva del Padrón de Egresados (Excel)
1.  En la sección **Gestión de Graduados**, haga clic en **Importar Padrón (.xlsx)**.
2.  Prepare una planilla de cálculo con las columnas obligatorias: `nombre`, `legajo`, `dni`, `correo`, `carrera`, `anio_inscripcion` y `promedio`.
3.  Arrastre el archivo a la zona de carga. El sistema leerá el archivo, validará formatos de correo y DNI duplicados, y mostrará un resumen del padrón listo para importar.
4.  Haga clic en **Confirmar Importación** para guardar los datos en la base.

### 7.4 Envío y Reenvío de Enlaces de Invitación
1.  Con el padrón cargado, haga clic en el botón **Enviar Invitaciones a Todos** para realizar el despacho automático de correos con firma de token única.
2.  Si un correo rebota o se escribe mal, edite la dirección del graduado en la lista y presione el botón de **Reenvío Individual** (icono de avión de papel) para volver a despachar la invitación.

### 7.5 Autogestión del Egresado y Validación OTP
1.  Si el egresado ingresa de manera manual, la pantalla le solicitará su correo electrónico registrado.
2.  El backend validará la dirección y despachará un código temporal de 6 dígitos.
3.  El egresado digita el código en la pantalla de verificación y, al coincidir, el sistema le concede un token de sesión seguro para operar en su portal.

### 7.6 Declaración de Asistencia (Aceptación/Rechazo)
1.  Al entrar por primera vez, el portal solicita al graduado declarar si asistirá al acto.
2.  **Aceptar:** Habilita el formulario de acompañantes y la selección de butacas.
3.  **Rechazar:** El sistema registra la inasistencia. Esta acción es **irreversible** en el servidor; libera inmediatamente sus butacas y anula su token de seguridad.

### 7.7 Carga de Invitados y Declaración de Movilidad Reducida
1.  En el portal del graduado, ingrese los datos de sus acompañantes (Nombre, DNI, Teléfono y Parentesco).
2.  Si alguno de sus invitados posee dificultades físicas, marque la casilla **Posee Movilidad Reducida**.
3.  Esta acción guardará una bandera de alerta que aparecerá en el panel del administrador y emitirá una advertencia visual al portero al momento de escanear su credencial.

### 7.8 Selección Visual de Asientos en el Anfiteatro
1.  El graduado presiona **Seleccionar Asientos** para abrir el plano interactivo.
2.  El graduado debe hacer clic sobre su asiento preferido en el sector de egresados (círculos azules) y en los asientos contiguos para sus invitados (círculos verdes).
3.  Los asientos ya reservados por otros alumnos se muestran en color rojo (bloqueados), impidiendo la superposición.
4.  Presione **Confirmar Reserva** para guardar el mapa en el servidor.

### 7.9 Descarga y Uso de Credenciales QR
1.  El sistema genera automáticamente un archivo PDF descargable con las credenciales oficiales de la ceremonia.
2.  Cada credencial posee un diseño formal de la institución, detallando el Nombre, DNI, Fila y Asiento exactos, junto con un **Código QR único** encriptado.
3.  El graduado debe guardar el PDF en su dispositivo móvil o imprimirlo para presentarlo en la entrada del salón el día de la colación.

### 7.10 Acreditación y Validación de Seguridad (Portería)
1.  El personal de seguridad abre la aplicación móvil e inicia el lector de cámara.
2.  Apunta al código QR impreso o en pantalla del ingresante.
3.  La aplicación procesa el token y devuelve:
    *   **Verde (Acceso Autorizado):** Credencial válida y asiento verificado. Muestra los datos en pantalla.
    *   **Naranja (Duplicado):** Código válido pero la persona ya ingresó anteriormente (alerta de fraude/copia).
    *   **Rojo (Denegado):** QR inválido o egresado inasistente.

---

## 8. SEGURIDAD DEL SISTEMA
SiGIC cuenta con rigurosos mecanismos de seguridad informática:
*   **Tokens de Invitación Firmados:** Las URLs de acceso contienen firmas hash que previenen la alteración o falsificación de enlaces.
*   **Autenticación OTP Cifrada:** Las claves numéricas temporales se hashean en base de datos usando SHA-256 y expiran automáticamente tras 10 minutos.
*   **Acceso por Roles:** Las APIs REST bloquean y validan los encabezados HTTP `Authorization` con tokens JWT para impedir que un usuario con rol de egresado intente modificar las butacas o el padrón institucional.
*   **Conexiones Seguras (SSL):** La comunicación entre el servidor API y la base de datos PostgreSQL de Neon Cloud exige de forma obligatoria certificados SSL activos.

---

## 9. PROBLEMAS FRECUENTES Y SOLUCIONES

| Problema | Causa Posible | Solución del Operador / Administrador |
| :--- | :--- | :--- |
| **El graduado no recibió el correo de invitación.** | Dirección de correo mal escrita o filtrada por SPAM institucional. | Busque al graduado en el padrón, verifique el correo y reenvíe. Si persiste, copie su **Token de Acceso** y entrégueselo de forma directa. |
| **El graduado marcó "No Asistiré" por error.** | El flujo de rechazo fue completado de forma irreversible. | Registre nuevamente al graduado desde el panel de administración con sus datos correspondientes y vuelva a emitir su invitación. |
| **El Centro de Control WPF muestra error en Backend.** | El puerto `3001` de red local está ocupado por otro servicio. | Cierre aplicaciones que utilicen el puerto 3001 o reinicie los servicios de infraestructura desde el Centro de Control WPF. |
| **La importación de Excel da error de formato.** | Las columnas del archivo Excel no coinciden con la estructura requerida. | Asegúrese de que el archivo tenga exactamente las columnas: `nombre`, `legajo`, `dni`, `correo`, `carrera`, `anio_inscripcion` y `promedio`. |
| **La app de portería marca acceso "Duplicado".** | Se presentó una fotocopia de credencial o el invitado reingresó. | Derive el caso a la Mesa de Ayuda técnica en el ingreso para verificar los datos de la persona física con su DNI. |

---

## 10. BUENAS PRÁCTICAS DE USO
*   **Cerrar Sesión:** Siempre cierre la sesión del panel del administrador al ausentarse de la computadora para evitar modificaciones accidentales en el padrón.
*   **Brillo de Pantalla:** Solicite a los invitados presentar sus códigos QR con el brillo de la pantalla del celular al máximo nivel para agilizar el escaneo en las filas de acceso.
*   **Validación del Padrón:** Revise la planilla Excel de alumnos antes de subirla para asegurar que los promedios y carreras estén formateados correctamente.
*   **Monitoreo Temprano:** Realice el envío de invitaciones al menos dos semanas antes de la colación para dar tiempo a los alumnos de declarar asistencia y elegir asientos con tranquilidad.

---

## 11. CONCLUSIÓN
El Sistema de Gestión Integral de Credenciales y Ceremonias (SiGIC) representa una evolución en la organización de eventos formales del **Instituto Tecnológico Beltrán**. Al descentralizar la carga de datos y automatizar la asignación de asientos y el control por códigos QR, el sistema no solo reduce a cero los errores operativos, sino que otorga al usuario final y al personal organizador una plataforma ágil, segura y de alto estándar profesional.

---

## 12. SOPORTE TÉCNICO E INSTITUCIONAL
Ante cualquier duda técnica o falla operativa de la infraestructura local o en la nube, comuníquese con el equipo técnico del Instituto Tecnológico Beltrán:

*   **Bandeja de Correo Oficial:** `soporte.sigic@beltran.edu.ar`
*   **Mesa de Ayuda de Sistemas:** Lunes a Viernes de 09:00 a 21:00 hs.
*   **Soporte de Guardia (Día del Acto):** Mesa de ayuda técnica física en el hall principal del evento.

---

## ANEXOS — GLOSARIO DE TÉRMINOS
*   **OTP (One-Time Password):** Clave numérica de un solo uso que se envía por correo para validar la identidad de un graduado sin requerir contraseña.
*   **Butaca Protocolar:** Asiento asignado por rol en el anfiteatro (Graduados, Acompañantes, Profesores, Directivos).
*   **Token de Acceso:** Clave única alfanumérica firmada por el servidor que viaja en la URL para abrir el portal del graduado de forma directa.
*   **Neon Cloud DB:** Servidor de base de datos relacional PostgreSQL hospedado en la nube que centraliza la persistencia de datos.
*   **SQLite:** Base de datos relacional local utilizada para almacenamiento de pruebas y configuraciones de desarrollo.
*   **Acreditación:** Proceso de lectura de QR y registro de asistencia en portería el día de la ceremonia.
