# GUÍA DE USO DIARIO Y MANUAL OPERATIVO
## SiGIC — Sistema de Gestión Institucional de Colaciones

**Institución:** Instituto Tecnológico Beltrán  
**Carrera:** Tecnicatura Superior en Analista de Sistemas  
**Versión del Sistema:** 5.2.0  
**Fecha de Actualización:** Octubre / 2026  

---

## ÍNDICE GENERAL
1. [Introducción y Objetivos del Sistema](#1-introducción-y-objetivos-del-sistema)
2. [Acceso a la Plataforma e Inicio de Sesión](#2-acceso-a-la-plataforma-e-inicio-de-sesión)
3. [Operación Diaria y Activación de la Ceremonia](#3-operación-diaria-y-activación-de-la-ceremonia)
4. [Carga del Padrón de Egresados y Despacho de Invitaciones](#4-carga-del-padrón-de-egresados-y-despacho-de-invitaciones)
5. [Autogestión del Egresado y Circuito de Confirmación](#5-autogestión-del-egresado-y-circuito-de-confirmación)
6. [Distribución de Asientos y Control del Anfiteatro](#6-distribución-de-asientos-y-control-del-anfiteatro)
7. [Operatoria de Acreditación el Día de la Ceremonia (Portería)](#7-operatoria-de-acreditación-el-día-de-la-ceremonia-portería)
8. [Reportes y Cierre de la Ceremonia](#8-reportes-y-cierre-de-la-ceremonia)
9. [Seguridad Informática, Respaldo y Modo Mantenimiento](#9-seguridad-informática-respaldo-y-modo-mantenimiento)
10. [Resolución de Problemas Frecuentes](#10-resolución-de-problemas-frecuentes)

---

## 1. INTRODUCCIÓN Y OBJETIVOS DEL SISTEMA

El **Sistema de Gestión Institucional de Colaciones (SiGIC)** es una plataforma digital unificada desarrollada para agilizar, organizar y asegurar las ceremonias de colación de grados del **Instituto Tecnológico Beltrán**.

La plataforma automatiza y centraliza las tareas complejas de la organización:
*   Importación de padrones de egresados desde planillas Excel oficiales.
*   Diseño interactivo de butacas y modelado de platea/pullman del anfiteatro.
*   Comunicación y despacho automatizado de invitaciones por correo electrónico.
*   Autogestión del graduado con claves temporales de un solo uso (OTP).
*   Registro y alerta temprana de acompañantes con movilidad reducida.
*   Emisión de credenciales con código QR criptográfico (pase grupal e individual).
*   Acreditación en tiempo real en puertas de acceso con la aplicación móvil oficial (Flutter).

---

## 2. ACCESO A LA PLATAFORMA E INICIO DE SESIÓN

El sistema SiGIC cuenta con un portal unificado para el acceso de los diferentes operadores administrativos, personal de portería y los egresados de la colación activa.

### Acceso al Panel de Gestión
Para ingresar al inicio de sesión del personal administrativo:
- Haga clic en el botón **"Acceso Personal"** o **"Gestión"** ubicado en el encabezado del portal, o acceda directamente mediante la URL `/admin`.
- **Acceso rápido institucional**: En la pantalla de bienvenida pública, hacer 5 clics seguidos sobre el logo central de SiGIC desbloquea el selector de inicio de sesión administrativo de manera discreta.

### Canales de Autenticación:
1. **Personal Administrativo, Auditor y Soporte:** Ingresan escribiendo su correo electrónico institucional y contraseña asignada con firma de tokens JWT.
2. **Graduados:** Acceden sin necesidad de recordar contraseñas permanentes. Escriben su DNI y reciben en su correo registrado un código temporal de 6 dígitos (**Código OTP**), o bien ingresan mediante el enlace directo provisto en el correo de invitación.
3. **Personal de Portería:** Inicia sesión en la App Móvil oficial escaneando el código QR generado por el administrador desde el panel de seguridad.

---

## 3. OPERACIÓN DIARIA Y ACTIVACIÓN DE LA CEREMONIA

El sistema SiGIC permite administrar múltiples ceremonias (por cohorte, carrera o turno). Sin embargo, **solo una ceremonia puede estar "ACTIVA" a la vez**, sincronizando en tiempo real las reservas de butacas, los códigos OTP y el escáner de portería.

### Paso a Paso para Activar la Ceremonia del Día:
1. Ingrese al panel principal y seleccione **Ceremonias** (desde el menú lateral o clásico).
2. Se listará el historial de ceremonias. Si la del día no existe, presione **"Crear Ceremonia"** e indique:
   - Nombre oficial de la colación.
   - Fecha y horario de inicio.
   - Sede / Lugar del evento (ej. *Anfiteatro Beltrán*).
   - **Límite de Acompañantes por Egresado** (aforo permitido, ej. 2 o 4 personas).
3. En la fila de la ceremonia correspondiente, presione el botón de activación. Se marcará con la estrella y la etiqueta **"ACTIVA"**. A partir de este instante, todo el sistema queda sincronizado para ese evento.

---

## 4. CARGA DEL PADRÓN DE EGRESADOS Y DESPACHO DE INVITACIONES

Para habilitar a los egresados en la ceremonia activa, el personal administrativo realiza la importación del padrón oficial.

### Paso 1: Preparación del archivo Excel (.xlsx / .csv)
La planilla de cálculo debe contener las siguientes cuatro columnas requeridas:
1. **Nombre:** Nombre y apellido completo del egresado.
2. **DNI:** Número de documento de identidad (sin puntos ni espacios).
3. **Correo:** Dirección de e-mail institucional o personal donde recibirá su clave OTP y su credencial.
4. **Carrera:** Denominación formal (ej. *Tecnicatura Superior en Analista de Sistemas*).

### Paso 2: Importar el Padrón
1. Ingrese a **Gestionar Graduados**.
2. Presione el botón **"Cargar desde Excel"** y arrastre el archivo a la ventana de importación.
3. El sistema verificará los datos, validará duplicados e ingresará a los egresados en estado inicial **PENDIENTE** o **INVITADO**.

### Paso 3: Envío Masivo de Invitaciones
1. Presione el botón **"Enviar Invitaciones por Correo"**.
2. El servidor comenzará a enviar de forma automatizada un correo electrónico personalizado a cada estudiante con el enlace directo para confirmar su participación.

### ¿Qué hacer si un alumno no recibe el correo de invitación?
1. Vaya a **Gestionar Graduados** y búsquelo por su nombre o DNI.
2. En las acciones al final de su fila, presione el botón **"Copiar Enlace Directo"** (ícono de enlace azul).
3. Envíe el enlace al alumno de manera privada (WhatsApp o chat institucional). Al hacer clic en ese enlace con token firmado, el graduado ingresará a su panel al instante sin requerir código OTP.

---

## 5. AUTOGESTIÓN DEL EGRESADO Y CIRCUITO DE CONFIRMACIÓN

El flujo del graduado se compone de cuatro pasos guiados:
1. **Confirmación de Asistencia:** El egresado declara si asistirá o no al acto de colación. Si marca inasistencia, el sistema libera sus cupos y finaliza el circuito sin ocupar butacas.
2. **Carga de Acompañantes:** Ingresa los datos de los familiares que asistirán (respetando el tope de la ceremonia) e indica si alguno posee **movilidad reducida**.
3. **Elección de Entregador:** Puede seleccionar si desea que un docente o un acompañante especial participe de la entrega del título en el escenario.
4. **Emisión de Credencial QR:** Genera y descarga su credencial oficial en PDF con código QR y código alfanumérico de respaldo para el ingreso grupal.

---

## 6. DISTRIBUCIÓN DE ASIENTOS Y CONTROL DEL ANFITEATRO

El plano interactivo del anfiteatro permite organizar la distribución de los egresados y sus familiares de forma visual e intuitiva.

### Código de Colores de las Butacas:
- **Azul (Egresados):** Butacas asignadas exclusivamente a los alumnos que reciben diploma.
- **Verde (Acompañantes):** Asientos seleccionados para los familiares e invitados.
- **Rojo (Ocupado):** Butacas que ya han sido reservadas por otros asistentes.
- **Gris Claro (Libre):** Asientos disponibles para ser seleccionados.
- **Gris Oscuro (Bloqueado / Protocolo):** Asientos reservados por la organización (Directivos, Autoridades o Profesores).
- **Violeta (Asiento Preferencial):** Asientos reservados para personas con movilidad reducida o discapacidad.

### Asignación de Butacas Protocolares y Casos Especiales:
1. Ingrese a **Plano Anfiteatro** (o "Editor de Anfiteatro").
2. Haga clic sobre las butacas de las primeras filas correspondientes a autoridades o docentes y seleccione **"Bloquear Asiento / Protocolo"**.
3. **Alerta de Movilidad Reducida:** Cuando un graduado registra que uno de sus acompañantes posee movilidad reducida, su registro se resalta con el **ícono de silla de ruedas** y se le asigna butaca preferencial (violeta) cercana a rampas y pasillos de fácil egreso.
4. Una vez completada la distribución, el alumno recibe en su correo la confirmación final de sus butacas numeradas.

---

## 7. OPERATORIA DE ACREDITACIÓN EL DÍA DE LA CEREMONIA (PORTERÍA)

El día del acto, el control en las puertas de ingreso del anfiteatro se realiza mediante la **App Móvil Oficial de SiGIC** (Flutter) o mediante el módulo web de **Control de Ingreso**.

### 7.1. Vinculación Rápida de Dispositivos de Portería
Para que el personal de seguridad pueda utilizar la cámara de sus celulares sin teclear credenciales:
1. En el panel web, ingrese a **Seguridad** (Personal de Portería).
2. Presione **"Registrar Personal"** o seleccione una cuenta existente y haga clic en **"Mostrar Acceso QR"**.
3. Pida al portero que abra la app móvil de SiGIC en su teléfono:
   - **QR 1 (Configuración):** Ajusta la dirección IP y parámetros de red del servidor.
   - **QR 2 (Acceso):** Inicia la sesión de seguridad de forma instantánea.

### 7.2. Protocolo de Escaneo de Códigos QR
El portero apunta la cámara del teléfono hacia la credencial física o digital del invitado:

| Respuesta Visual | Estado de Ingreso | Significado y Acción Requerida |
| :--- | :--- | :--- |
| **VERDE** | **Acceso Autorizado** | QR legítimo y válido. El teléfono emite un pitido agudo y vibra. Muestra el nombre y número de butaca asignada para indicarle hacia dónde dirigirse. |
| **NARANJA** | **Acceso Duplicado** | QR legítimo pero que ya ingresó al salón anteriormente. La app emite alerta y muestra la hora del primer ingreso. **Acción:** Solicitar DNI físico para verificar identidad o prevenir fotocopias. |
| **ROJO** | **Acceso Denegado** | QR inválido, corrupto o correspondiente a otra ceremonia. El teléfono emite alerta sonora y no permite el ingreso del portador. |

### 7.3. Acreditación de Emergencia (Respaldo sin Cámara / Desconexión)
Si un invitado pierde su credencial, no tiene batería o el dispositivo no responde:
1. **Acreditación por Código Alfanumérico:** El personal de seguridad digita directamente en la app el código único de 8 caracteres que figura en el comprobante del graduado.
2. **Soporte en Papel (Plan de Contingencia):** Si ocurre una falla eléctrica o de red total, el portero utiliza la planilla impresa de la ceremonia, busca el código alfanumérico o DNI del asistente y tilda el ingreso manualmente.

---

## 8. REPORTES Y CIERRE DE LA CEREMONIA

Concluida la ceremonia, el sistema permite generar los informes oficiales de auditoría y presentismo:
1. Ingrese a la sección **Reportes** en el panel principal.
2. Visualizará las métricas consolidadas: porcentaje de ocupación, presentes, ausencias y curva de ingresos por horario.
3. Presione el botón **"Exportar Listado de Asistencia (Excel)"** para descargar la planilla estructurada con fecha, hora exacta de acreditación y butaca física ocupada por cada graduado e invitado para el legajo de Secretaría Académica.

---

## 9. SEGURIDAD INFORMÁTICA, RESPALDO Y MODO MANTENIMIENTO

*   **Firmas Criptográficas JWT:** Sesiones autenticadas y protegidas contra manipulación.
*   **Códigos OTP Hasheados:** Los códigos de 6 dígitos se validan con expiración a los 10 minutos.
*   **Persistencia Cloud Segura:** Base de datos relacional PostgreSQL con cifrado SSL obligatorio y pooling transaccional.
*   **Backups Institucionales:** La cuenta de soporte técnico puede descargar volcados completos en formato JSON/SQL antes de cada cierre de ciclo lectivo.

### 9.1. Modo Mantenimiento del Sistema
El **Modo Mantenimiento** es un protocolo de protección preventiva que suspende temporalmente el acceso público al portal de graduados e invitados:
*   **Objetivo:** Evitar que los alumnos seleccionen butacas, confirmen asistencia o soliciten códigos OTP mientras se ejecutan tareas técnicas críticas (actualizaciones de base de datos, resguardo de padrones o mantenimiento de infraestructura).
*   **Pantalla de Resguardo:** Al estar activo, la pantalla de inicio presenta el banner institucional con el engranaje animado informando las mejoras técnicas en curso.
*   **Acceso Técnico Reservado:** El personal administrativo y de soporte técnico conserva el acceso operativo realizando 5 clics seguidos sobre el ícono de ajustes o ingresando por las rutas directas de gestión.
*   **Activación y Desactivación:**
    1. **Desde el Manual de Usuario:** En la página 11 (*Contingencia y Modo Mantenimiento*) mediante el interruptor interactivo en vivo.
    2. **Desde Panel de Ajustes:** En la sección *Comportamiento del Sistema* -> interruptor *Modo mantenimiento*.
    3. **Desde Base de Datos:** Actualizando la clave `modo_mantenimiento` a `'true'` o `'false'` en la tabla `configuracion`.
    4. **Persistencia Dual:** Se sincroniza inmediatamente en PostgreSQL y en el almacenamiento local (`localStorage`) del navegador para una respuesta instantánea sin latencia.

---

## 10. RESOLUCIÓN DE PROBLEMAS FRECUENTES

| Situación | Causa | Solución Operativa |
| :--- | :--- | :--- |
| El alumno no recibió el correo. | Casilla llena o filtro de Spam. | Buscar al alumno en *Gestionar Graduados* y pulsar **"Copiar Enlace Directo"** para enviárselo por mensajería privada. |
| El graduado rechazó por error. | Completó el flujo de inasistencia. | El administrador puede editar su estado en el panel de graduados para rehabilitar su circuito de inscripción. |
| La app móvil dice "Servidor no alcanzable". | Celular en red diferente a la de la plataforma. | Conectar el celular a la red Wi-Fi del evento y re-escanear el QR de configuración del servidor. |
| El QR escaneado da "Denegado". | Credencial de ceremonia anterior o inválida. | Verificar el DNI en el padrón de la ceremonia activa desde el buscador de emergencia. |
| Un invitado requiere movilidad reducida pero no avisó antes. | Carga tardía del egresado. | Reasignar al invitado en el mapa del anfiteatro a una butaca preferencial (violeta) contigua a las rampas. |

---

## 11. GLOSARIO EN PALABRAS COTIDIANAS

Términos del sistema explicados en lenguaje directo y sencillo, tal como se usan en la operatoria cotidiana del instituto:

*   **Ceremonia Activa:** Es el acto de colación que se realiza hoy. Aunque en el sistema existan actos de años anteriores guardados, el sistema solo procesa las reservas y escaneos de la ceremonia marcada con la estrella de activa.
*   **Padrón:** La nómina oficial de estudiantes que terminaron la carrera y están habilitados para recibir el diploma, cargada desde una planilla Excel.
*   **Aforo:** Cantidad máxima de personas permitidas en la sala. Determina cuántos acompañantes puede llevar cada egresado (ejemplo: 2 por graduado).
*   **Código OTP:** Clave de 6 números enviada al correo del egresado. Sirve para entrar a elegir asientos sin tener que recordar una contraseña fija. Vence a los 10 minutos.
*   **Token de Acceso:** Enlace privado y único que se envía al alumno. Al hacer clic, ingresa directo a su panel sin pedirle códigos ni claves.
*   **Credencial QR:** Tarjeta digital con código cuadrado que el graduado muestra desde la pantalla de su teléfono o impresa en papel para acreditarse en la entrada.
*   **Pase Grupal:** Modalidad que permite que con el mismo código QR del egresado ingresen él y todos sus acompañantes registrados en conjunto.
*   **Código Alfanumérico:** Código de 8 letras y números (ejemplo: `BM4600F4`) del comprobante. Si el celular se descarga o la pantalla está rota, el portero lo busca con ese código.
*   **Butaca Protocolar:** Asientos de las primeras filas pintados de gris oscuro y reservados para autoridades, directivos y docentes.
*   **Butaca Accesible (Violeta):** Asientos reservados contiguos a rampas y pasillos para personas con movilidad reducida o en silla de ruedas.
*   **Entregador de Título:** Persona que sube al escenario a entregar el diploma. Puede ser un familiar elegido por el egresado o un docente del instituto.
*   **Check-in / Acreditación:** Momento en que la persona llega a la puerta del anfiteatro, el portero valida su credencial y el sistema la marca como presente en sala.

---

## 12. BIBLIOGRAFÍA Y MARCO TÉCNICO DE REFERENCIA

*   **ISO/IEC 18004:2015:** Estándar internacional para generación y decodificación de códigos bidimensionales de barras de matriz QR (Quick Response Code).
*   **RFC 7519 (JSON Web Tokens):** Especificación del IETF para autenticación stateless de sesiones seguras mediante firma criptográfica HMAC SHA-256.
*   **W3C Web Content Accessibility Guidelines (WCAG 2.1 - Nivel AA):** Criterios de contraste, tamaño de tipografía y accesibilidad universal aplicados a las pantallas de egresados y butacas.
*   **PostgreSQL Global Development Group (v16):** Manual oficial de administración de base de datos relacional ACID, indexación B-Tree y arquitectura de persistencia segura con cifrado SSL.
*   **Next.js 16 App Router & Turbopack Documentation:** Arquitectura moderna de renderizado híbrido en Vercel Edge Network.
*   **Flutter & Dart Engineering Guidelines (Google):** Arquitectura de aplicaciones móviles compiladas nativamente en Android con aceleración por hardware.

---

## 13. FICHA TÉCNICA INSTITUCIONAL Y CRÉDITOS DE PROYECTO

*   **Institución Académica:** Instituto Tecnológico Beltrán (ITB)
*   **Carrera Oficial:** Tecnicatura Superior en Analista de Sistemas
*   **Asignatura / Espacio:** Práctica Profesionalizante · Proyecto Final Integrador de Grado
*   **Sistema Oficial:** SiGIC — Sistema de Gestión Institucional de Colaciones
*   **Versión de Plataforma:** v5.2.0 (Web) · v1.0.9+10 (Móvil Android)
*   **Ciclo Lectivo:** 2026
*   **Ubicación:** Avellaneda, Provincia de Buenos Aires, Argentina
*   **Acceso Web:** `https://app.sigic.com.ar`
*   **Manual Digital Interactivo:** `https://app.sigic.com.ar/manual`
*   **Mesa de Ayuda Técnica:** `soporte@ibeltran.com.ar`

### Equipo de Análisis y Desarrollo del Proyecto
| Integrante | Rol y Especialidad | Carrera y Sede |
| :--- | :--- | :--- |
| **Cancelo Julian** | Analista de Sistemas & Desarrollador Fullstack | Analista de Sistemas · ITB Avellaneda |
| **Alfonso Alan Alexis** | Analista de Sistemas & Documentación Técnica | Analista de Sistemas · ITB Avellaneda |
| **Contreras Villalba Sol Heilin** | Analista de Sistemas & Relevamiento de Procesos | Analista de Sistemas · ITB Avellaneda |
| **Frassia Matias** | Analista de Sistemas & Control Operativo de Ceremonia | Analista de Sistemas · ITB Avellaneda |
| **Santillan Luis Gabriel** | Analista de Sistemas & Auditoría de Calidad y Seguridad | Analista de Sistemas · ITB Avellaneda |

### Stack Tecnológico Integral
*   **Frontend Web:** React 19 + Next.js 16 (App Router con Turbopack) + TailwindCSS 4 + Lucide React.
*   **Backend Serverless:** Node.js REST API modular (Route Handlers en Next.js).
*   **Motor de Base de Datos:** PostgreSQL (Relacional ACID, conexión segura SSL TLS 1.3 con pool de conexiones nativo `pg`).
*   **Aplicación Móvil de Portería:** Flutter 3 & Dart nativo para Android (validación óptica rápida < 500 ms, feedback táctil y acústico).
*   **Servicio de Mensajería:** Nodemailer con protocolo transaccional SMTP TLS y plantillas HTML enriquecidas.
*   **Infraestructura Cloud:** Vercel Edge Network (Web) y canal de parches Shorebird CodePush OTA (Móvil).
*   **Criptografía y Seguridad:** Tokens JWT firmados con HMAC SHA-256, códigos OTP de 6 dígitos, sesiones de portería sincronizadas por QR bidireccional y plan de contingencia offline con códigos alfanuméricos de 8 caracteres.

---

*Manual operativo oficial elaborado para el Instituto Tecnológico Beltrán — Avellaneda, Buenos Aires.*
