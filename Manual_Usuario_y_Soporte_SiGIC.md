# MANUAL OFICIAL DE USUARIO Y DOCUMENTACIÓN DE INFRAESTRUCTURA DE SiGIC
*Sistema de Gestión Institucional de Colaciones*

---

## 1. INTRODUCCIÓN Y PROPÓSITO DEL SISTEMA

**SiGIC** (Sistema de Gestión Institucional de Colaciones) es un ecosistema de software integral diseñado y desarrollado para automatizar, coordinar y optimizar la organización de los actos de graduación y entrega de diplomas (colaciones) en instituciones académicas. 

El principal objetivo de SiGIC es unificar en una plataforma robusta y en tiempo real tres grandes flujos de trabajo que tradicionalmente se realizan de forma manual y fragmentada:
1. **Administración y Gestión**: Registro y alta de ceremonias independientes, carga del padrón de graduados desde archivos Excel, asignación de butacas especiales para autoridades e invitados, y despacho automático de invitaciones por correo electrónico.
2. **Autogestión de Egresados**: Acceso individual mediante tokens temporales y seguros (OTP), registro y control del aforo de acompañantes, y selección visual interactiva de ubicaciones (butacas) en el anfiteatro de la ceremonia.
3. **Acreditación Móvil el Día del Acto**: Aplicación para smartphones que escanea códigos QR digitales en tiempo real para autorizar ingresos, prevenir accesos duplicados e identificar acompañantes con movilidad reducida.

---

## 2. ARQUITECTURA TÉCNICA E INFRAESTRUCTURA

El sistema está construido sobre un stack tecnológico moderno, escalable y serverless, diseñado para no requerir mantenimiento continuo de hardware local:

*   **Cliente Web (Admin y Egresados)**: Desarrollado en **React** con **Next.js** y optimizado con **TailwindCSS**. Soporta dos experiencias de usuario para el panel de administración: una vista clásica (centrada en el flujo lineal) y una vista profesional (diseñada en cuadrícula Bento con barra lateral y métricas integradas).
*   **Servidor de APIs (Backend)**: Ejecutado mediante funciones serverless en **Vercel Edge Platform**, reduciendo la latencia de respuesta de los servicios a milisegundos.
*   **Base de Datos**: Hospedada en **Neon PostgreSQL Cloud**, una base de datos relacional serverless totalmente gestionada en la nube con conexión segura encriptada (SSL).
*   **Servicio SMTP**: Motor de despacho de correos electrónicos integrado para el envío de códigos de acceso rápido (One-Time Password) y despacho masivo de las invitaciones en PDF con códigos QR adjuntos.
*   **Escáner Móvil (App React Native)**: Aplicación ligera que el personal de seguridad física instala en sus celulares para realizar el check-in digital.

---

## 3. ROLES DE USUARIO Y MATRIZ DE PERMISOS

El sistema protege la integridad de los datos de las colaciones mediante una matriz de permisos estricta. Ningún usuario puede ejecutar acciones ajenas a su ámbito operativo:

| Rol de Usuario | Acceso a Portada | Gestión de Graduados / Docentes | Plano del Anfiteatro | Gestión de Cuentas (Seguridad) | Centro de Control (Reset y Backup) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Graduado / Egresado** | Solo Autogestión | No | Solo su asiento | No | No |
| **Portería / Seguridad** | Solo Escáner Móvil | No | Solo Lectura | No | No |
| **Auditor / Lectura** | Sí | Solo Lectura | Solo Lectura | No | No |
| **Administrativo** | Sí | Edición | Edición | No | No |
| **Administrador / Super Admin** | Sí | Total | Total | Total (Local) | No |
| **Soporte Técnico** | Sí | No | No | Total (Global) | Total (Exclusivo) |

*Nota: La cuenta especial `soporte@sigic.com.ar` actúa como el rol de Soporte Técnico y cuenta con herramientas de mantenimiento a nivel de base de datos e infraestructura que los administradores ordinarios no poseen.*

---

## 4. GUÍA FUNCIONAL DE MÓDULOS (PASO A PASO)

### 4.1. Acceso al Sistema y Backdoor Secreto
Al iniciar la aplicación, se presenta una pantalla de bienvenida limpia diseñada para los graduados. Los operadores administrativos de la institución e ingenieros de soporte técnico acceden al formulario de inicio de sesión mediante un gesto de seguridad:
1. Posicionar el cursor sobre el logo central de **SiGIC**.
2. Al posarse sobre el logotipo, se revela un mensaje emergente dinámico de Marvel (e.g. *"I love you 3000"* o *"Perfectamente equilibrado..."*).
3. **Hacer click 5 veces consecutivas** sobre el logo de SiGIC.
4. Esto desbloqueará la interfaz y lo redirigirá a la pantalla de selección del canal de login (Administradores o Egresados).

### 4.2. Asistente de Configuración Inicial (Setup Inicial)
Si la base de datos se encuentra vacía o recién restablecida, la aplicación se bloquea automáticamente en "Modo Virgen" y despliega el Asistente de Configuración:
1. El usuario debe ingresar el **Nombre de la Institución Académica**.
2. Definir el correo electrónico y la contraseña maestra del primer **Super-Administrador**.
3. Al presionar "Inicializar", el sistema crea las tablas esenciales e inserta la cuenta maestra, dando paso al panel general.

### 4.3. Gestión de Ceremonias y Actos
Desde este módulo se coordinan las colaciones:
*   **Creación**: Permite definir una fecha, hora, lugar del evento y cantidad límite de acompañantes permitidos por egresado (aforo).
*   **Ceremonia Activa**: Solo puede haber **una ceremonia activa a la vez**. Esta bandera indica al portal de graduados a qué ceremonia corresponde la autogestión de asientos.

### 4.4. Carga de Padrón e Invitaciones
*   **Importación desde Excel**: Los operadores administrativos pueden descargar una plantilla Excel modelo, cargar los graduados con sus nombres, DNI, correos y carreras, y subirla al sistema. El importador realiza una validación sintáctica de los campos para evitar registros corruptos.
*   **Despacho Masivo de Correos**: Una vez cargado el padrón, el botón de despacho envía a cada graduado un correo con su enlace de autogestión personalizado que contiene un token único para que no requieran recordar contraseñas.

### 4.5. Plano del Anfiteatro (Editor de Asientos)
Este módulo permite modelar y asignar butacas interactivamente:
*   **Zonificación**: El anfiteatro se divide visualmente en sectores de Egresados (azul), Acompañantes (verde), Docentes/Autoridades (rojo) y Asientos Reservados/Bloqueados (gris).
*   **Estadísticas de Ocupación**: Muestra en tiempo real cuántas butacas del aforo total están asignadas y ocupadas.
*   **Movilidad Reducida**: Si un alumno indica que un acompañante tiene problemas de movilidad, la butaca se marca automáticamente en el plano con un indicador especial para facilitar su asistencia física.

### 4.6. Gestión de Cuentas de Seguridad (Módulo de Seguridad)
Exclusivo para la cuenta de soporte y administradores autorizados. Permite crear y administrar operadores:
1. **Creación**: Se definen nombre, email, contraseña y el rol correspondiente.
2. **Generación de Token QR**: Para los usuarios con rol `PORTERIA` (personal de seguridad física), el sistema genera un código QR de configuración de red (IP de conexión) y otro código QR de inicio de sesión seguro y rápido. El portero escanea estos QRs desde la app móvil para loguearse de forma automática sin digitar credenciales.
3. **Autorización Específica**: Permite asignar permisos a cada portero para ceremonias específicas.

### 4.7. Aplicación Móvil de Portería (Acreditación QR)
Es la herramienta del personal de portería el día de la colación:
*   **Escaneo**: Se apunta con la cámara al código QR impreso o digital de la credencial del graduado/invitado.
*   **Estados de Validación**:
    *   **Verde / Permitido**: QR válido y sin uso previo. Emite un tono agudo, vibra el celular y muestra en pantalla la butaca del portador.
    *   **Naranja / Duplicado**: QR legítimo pero ya escaneado previamente. Muestra la hora del primer ingreso y emite una alerta auditiva para evitar accesos repetidos.
    *   **Rojo / Denegado**: Código QR falsificado, alterado o no perteneciente a la ceremonia activa. Deniega el ingreso inmediatamente.

### 4.8. Centro de Control (Mantenimiento)
Área exclusiva para la cuenta de soporte técnico autorizada (`soporte@sigic.com.ar`):
*   **Diagnóstico de Red**: Monitoreo y cálculo de latencia en milisegundos con las APIs del servidor e infraestructura Neon PostgreSQL.
*   **Respaldo de Datos (Backup JSON)**: Permite descargar un archivo JSON con todo el estado actual del sistema (egresados, invitados, ceremonias e infraestructura) para resguardo local de la institución.
*   **Restablecimiento de Fábrica**: Permite formatear por completo el sistema y retornar al Asistente de Configuración Inicial (requiere escribir la palabra clave "RESET" de forma explícita).

---

## 5. RESOLUCIÓN DE INCIDENTES Y PREGUNTAS FRECUENTES (FAQ)

#### ¿Qué hago si un graduado no recibe el correo de invitación?
1. Ingrese a **Gestionar Graduados**.
2. Busque al alumno por su nombre o DNI.
3. Al lado de su registro, verá un botón para **Generar Código OTP / Enlace Directo**.
4. Copie el enlace personalizado y envíeselo por otro canal de comunicación alternativo (e.g. WhatsApp, Slack). Este enlace le dará acceso directo a su panel de autogestión de butacas sin pasar por la validación de correo electrónico.

#### ¿Cómo restablecer la contraseña de una cuenta de Portería?
1. Ingrese a la vista de **Seguridad**.
2. Localice la cuenta del portero correspondiente en la tabla.
3. Si el dispositivo del portero perdió la configuración de acceso, pulse el botón **"Mostrar Acceso QR"**.
4. Solicite al operador de puerta que abra la aplicación de SiGIC en su teléfono y escanee primero el QR del Paso 1 (para configurar la API) y luego el QR del Paso 2 (para iniciar sesión de forma automática).

#### El servidor móvil indica "Error al conectar con la API". ¿Cómo se soluciona?
Este error sucede cuando el puerto o la dirección del servidor web cambió o el teléfono del personal de seguridad no cuenta con acceso a internet.
1. Confirme que el dispositivo móvil tenga conexión Wi-Fi o datos móviles activos.
2. Ingrese al módulo de **Seguridad** en el panel web, abra el código QR de acceso del usuario y revise que el campo "IP API" apunte a la URL correcta del servidor en producción (e.g. `https://sigic-web.vercel.app/api`).
3. Re-escanee el QR de configuración (Paso 1) desde el teléfono móvil para actualizar la ruta de peticiones.

#### ¿Cómo se realiza el traspaso de datos para iniciar una ceremonia al año siguiente?
Para comenzar un ciclo lectivo limpio:
1. Ingrese al **Centro de Control** con la cuenta de soporte técnico (`soporte@sigic.com.ar`).
2. Descargue un respaldo en archivo JSON de la colación concluida.
3. Pulse sobre el botón **"Formatear & Resetear"**. La base de datos quedará en blanco, la plataforma ingresará en modo de instalación inicial y estará lista para configurar los datos del nuevo período académico.
