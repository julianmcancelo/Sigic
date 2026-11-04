# PAQUETE DE ENTREGA OFICIAL — SiGIC (PENDRIVE)

> **Sistema de Gestión Institucional de Colaciones**  
> **Institución:** Instituto Tecnológico Beltrán  
> **Carrera:** Tecnicatura Superior en Analista de Sistemas  
> **Autores:** Alan Alfonso, Julián Cancelo, Sol Contreras, Matías Frassia, Luis Santillán  

---

## 1. ¿Qué contiene este Pendrive / Carpeta?

Este paquete reúne la solución integral completa lista para ser evaluada, auditada y ejecutada en cualquier computadora:

```text
entregable/
├── INICIAR_SIGIC.bat           # Ejecutable de 1 clic: levanta todo el sistema en Docker
├── DETENER_SIGIC.bat           # Detiene y apaga los servicios de forma limpia
├── docker-compose.yml          # Orquestador Docker (Next.js 16 + PostgreSQL 16)
├── init.sql                    # Base de datos pre-configurada (esquema + datos iniciales)
│
├── app_movil_apk/              # Aplicación móvil para portería y control de accesos
│   └── SiGIC-Porteria.apk      # APK lista para instalar en teléfonos Android
│
├── padrones_ejemplo/           # Planillas para pruebas de carga masiva
│   ├── padron_TSAS_Practicas_III_2025.xlsx  (Excel con egresados de prueba)
│   └── padron_TSAS_Practicas_III_2025.csv   (CSV alternativo)
│
└── documentacion/              # Manuales técnicos, de usuario y diagramas
    ├── MANUAL.md               # Manual de usuario completo y arquitectura
    ├── ESQUEMA_BASE_DE_DATOS.md# Diccionario de datos y relaciones
    ├── ESQUEMA_INTERACTIVO_BD.html # Visualizador interactivo de base de datos
    ├── SEGURIDAD.md            # Modelo de autenticación, OTP y auditoría
    └── protocolo_acreditacion_y_seguridad.md # Procedimiento operativo en puerta
```

---

## 2. Puesta en Marcha Rápida (1 Clic)

### Requisito previo:
Tener instalado y abierto **Docker Desktop** (en Windows o macOS) o **Docker Engine** (en Linux).

### Pasos:
1. Haga doble clic en el archivo **`INICIAR_SIGIC.bat`**.
2. El script iniciará los contenedores de Docker (Base de Datos PostgreSQL y Plataforma Web Next.js).
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

*(También se puede utilizar el **Panel del Expositor** ubicado en la esquina inferior derecha para alternar roles con 1 clic en modo demostración).*

---

## 4. App Móvil de Portería (Acreditación QR)

- Ubicación del instalador: `app_movil_apk/SiGIC-Porteria.apk`
- Permite a los guardias de portería escanear los códigos QR de las credenciales de egresados y acompañantes en tiempo real para autorizar o rechazar ingresos al auditorio.

---

## 5. Finalizar la Ejecución

Para apagar el sistema y liberar la memoria RAM:
- Haga doble clic en **`DETENER_SIGIC.bat`** (o ejecute `docker compose down` en la terminal).
