<div align="center">
  <img src="https://ibeltran.com.ar/img/logo/footer.png" alt="Instituto Tecnológico Beltrán" width="180" />

  <h2>Módulo Login</h2>
  <p>Sistema de acceso institucional — Instituto Tecnológico Beltrán</p>

  ![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
  ![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-29ABE2?style=flat)
</div>

---

## Descripción

Módulo frontend de autenticación institucional. Incluye pantalla de login con validación, panel de bienvenida con información en tiempo real y accesos rápidos.

---

## Estructura

```text
Modulos/Login/
├── public/
└── src/
    ├── componentes/
    │   ├── panel/              # Tarjetas del panel de bienvenida
    │   ├── CampoFormulario.jsx # Input reutilizable con toggle de contraseña
    │   └── FormularioInicioSesion.jsx
    ├── datos/                  # Credenciales demo y datos estáticos
    ├── layouts/                # LayoutAutenticacion (split-screen)
    ├── paginas/                # PaginaInicioSesion · PantallaBienvenida
    └── utilidades/             # Validaciones, clima y formateo de fechas
```

---

## Flujo de la aplicación

```
[ Pantalla de Login ]
        |
  Credenciales OK?
        |
        └── Si  →  [ Panel de Bienvenida ]
                        ├── Saludo personalizado
                        ├── Fecha y hora en tiempo real
                        ├── Clima actual (Open-Meteo API)
                        └── Accesos rápidos
```

---

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build de producción
npm run build

# Lint
npm run lint

# Preview del build
npm run preview
```

---

## Arquitectura

| Carpeta | Responsabilidad |
|---|---|
| `componentes/` | Piezas visuales reutilizables e independientes |
| `paginas/` | Orquestadoras de estado y composición |
| `layouts/` | Estructura visual de pantallas completas |
| `datos/` | Datos estáticos centralizados |
| `utilidades/` | Funciones puras sin efectos secundarios |

---

> Todos los comandos deben ejecutarse desde `Modulos/Login`
