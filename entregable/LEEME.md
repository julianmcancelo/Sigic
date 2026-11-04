# PAQUETE DE ENTREGA OFICIAL — SiGIC (PENDRIVE)

> **Sistema de Gestión Institucional de Colaciones**  
> **Institución:** Instituto Tecnológico Beltrán  
> **Carrera:** Tecnicatura Superior en Analista de Sistemas  
> **Autores:** Alan Alfonso, Julián Cancelo, Sol Contreras, Matías Frassia, Luis Santillán  

---

## 1. ¿Qué contiene este Pendrive / Carpeta?

Esta carpeta es **100% autónoma y autocontenida**. Contiene el código fuente completo, los servicios dockerizados, la base de datos pre-sembrada, el instalador móvil y toda la documentación técnica:

```text
entregable/
│
├── 🚀 INICIAR_SIGIC.bat           # 1 Clic en Windows: Levanta Docker y abre el navegador
├── 🛑 DETENER_SIGIC.bat           # 1 Clic en Windows: Detiene y libera los contenedores
├── 🐳 docker-compose.yml          # Orquestador Docker (Next.js 16 + PostgreSQL 16)
├── 🗄️ init.sql                   # Estructura y datos preconfigurados de la base de datos
├── 📖 LEEME.md                    # Este instructivo con accesos y verificación
│
├── 💻 codigo/
│   └── plataforma/                # Código fuente completo (Next.js 16 + React 19 + Tailwind)
│
├── 📱 app_movil_apk/
│   └── SiGIC-Porteria.apk         # APK lista para instalar en teléfonos Android (Portería)
│
├── 📊 padrones_ejemplo/
│   ├── padron_TSAS_Practicas_III_2025.xlsx  # Excel de prueba para importación masiva
│   └── padron_TSAS_Practicas_III_2025.csv   # Formato CSV alternativo
│
└── 📚 documentacion/
    ├── MANUAL.md                  # Manual completo de usuario y soporte
    ├── ESQUEMA_BASE_DE_DATOS.md   # Diccionario de datos y relaciones SQL
    ├── ESQUEMA_INTERACTIVO_BD.html# Diagrama visual interactivo de base de datos
    ├── SEGURIDAD.md               # Modelo criptográfico, OTP y auditoría
    └── protocolo_acreditacion_y_seguridad.md # Procedimiento operativo en puerta
```

---

## 2. Puesta en Marcha Rápida (1 Clic)

### Requisito previo:
Tener instalado y en ejecución **Docker Desktop** (en Windows o macOS) o **Docker Engine** (en Linux).

### Pasos:
1. Haga doble clic en el archivo **`INICIAR_SIGIC.bat`**.
2. El script construirá los contenedores locales (PostgreSQL 16 + Plataforma Web) y levantará los servicios.
3. Se abrirá automáticamente el navegador en:
   👉 **[http://localhost:3000](http://localhost:3000)**

---

## 3. Credenciales y Cuentas de Acceso

El sistema viene preconfigurado con las siguientes cuentas de prueba:

| Rol | Correo Electrónico | Contraseña | Propósito |
|---|---|---|---|
| **Administrador** | `admin@sigic.com.ar` | `Admin2026!` | Gestión total: egresados, ceremonias, auditorio y reportes |
| **Soporte Técnico** | `soporte@sigic.com.ar` | `Soporte2026!` | Centro de control, logs y auditoría |
| **Auditor** | `auditor@sigic.com.ar` | `Auditor2026!` | Solo lectura y trazabilidad de operaciones |

*(También se puede utilizar el **Panel del Expositor** en la esquina inferior derecha para alternar roles con 1 clic en modo demostración).*

---

## 4. App Móvil de Portería (Acreditación QR)

- Ubicación del instalador: `app_movil_apk/SiGIC-Porteria.apk`
- Permite a los guardias de portería escanear los códigos QR de las credenciales de egresados y acompañantes en tiempo real para autorizar o rechazar ingresos al auditorio.

---

## 5. Finalizar la Ejecución

Para apagar el sistema y liberar la memoria RAM:
- Haga doble clic en **`DETENER_SIGIC.bat`** (o ejecute `docker compose down` en la terminal).
