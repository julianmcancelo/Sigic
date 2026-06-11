<div align="center">
  <img src="public/logo-oficial.png" alt="SiGIC Logo" width="220" />

  <h2>SiGIC - Portal Móvil</h2>
  <p>Cliente Móvil de Autogestión y Portería — Instituto Tecnológico Beltrán</p>

  ![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)
  ![Estado](https://img.shields.io/badge/Estado-En%20Producción-29ABE2?style=flat)
</div>

---

## 🚀 Descripción

Este es el cliente móvil de autogestión para graduados e invitados de SiGIC. Proporciona una interfaz web móvil fluida, optimizada y responsiva que permite a los egresados confirmar su asistencia, registrar acompañantes, seleccionar sus ubicaciones en el anfiteatro y descargar sus credenciales digitales con código QR.

---

## 🛠️ Módulos Principales

*   **Autogestión de Egresados**: Acceso rápido con código OTP enviado por correo electrónico o link mágico.
*   **Gestión de Acompañantes**: Registro de invitados según el límite de cupos establecido por la administración.
*   **Selección de Asientos**: Mapa de butacas interactivo adaptado a pantallas táctiles para la reserva de ubicaciones.
*   **Credencial Digital**: Generación dinámica y descarga de la credencial de acceso con código QR.

---

## 📂 Estructura del Proyecto

```text
codigo/interfaz/movil/
├── public/              # Recursos estáticos y plantillas del portal móvil
└── src/
    ├── componentes/     # Tarjetas, modales y botones responsivos
    ├── datos/           # Configuraciones y mocks locales de clima y accesos
    ├── layouts/         # Contenedores de pantallas (Autenticación, Panel)
    ├── paginas/         # Vistas del portal (Registro, Selección de Asientos, Bienvenida)
    ├── servicios/       # Conexión con el servidor backend (API)
    └── utilidades/      # Validaciones y funciones de apoyo
```

---

## 💻 Desarrollo

### Requisitos Previos
- Node.js (versión recomendada LTS)
- NPM o Yarn

### Comandos
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar build localmente
npm run preview
```

---

## 🎨 Diseño Móvil
El diseño está pensado desde un enfoque **Mobile First**:
- Estilo moderno basado en desenfoques (Glassmorphism).
- Interacciones fluidas y micro-animaciones optimizadas para gestos táctiles.
- Layouts 100% adaptables a cualquier dispositivo móvil.

---

<div align="center">
  <sub>Desarrollado para el Instituto Tecnológico Beltrán</sub>
</div>
