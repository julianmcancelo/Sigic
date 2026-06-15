/**
 * Servidor Principal de SiGIC (Sistema de Gestión Integral de Credenciales)
 * Orquestador principal de la API REST que comunica el Frontend con la base de datos persistente.
 */
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

// Importación de enrutadores modulares
const egresadosRouter = require('./rutas/egresados')
const invitadosRouter = require('./rutas/invitados')
const statsRouter = require('./rutas/stats')
const anfiteatroRouter = require('./rutas/anfiteatro')
const configuracionRouter = require('./rutas/configuracion')
const ceremoniasRouter = require('./rutas/ceremonias')
const authRouter = require('./rutas/auth')
const profesoresRutas = require('./rutas/profesores')
const entregadoresRutas = require('./rutas/entregadores')
const setupRutas = require('./rutas/setup')
const usuariosRutas = require('./rutas/usuarios')

// Inicializar Base de Datos (SQLite o Postgres)
const { init } = require('./db')
const { identificar } = require('./middleware/autenticacion')

const app = express()
const PUERTO = process.env.PORT || 3001

/**
 * CONFIGURACIÓN DE MIDDLEWARES
 */

const enProduccion = process.env.NODE_ENV === 'production'

// 1. Redirección forzada a HTTPS en producción (detrás de proxies como Render, Heroku o Nginx)
if (enProduccion) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && !req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`)
    }
    next()
  })
}

// 2. Helmet para inyectar cabeceras de seguridad automáticamente (desactivando CSP temporalmente para no romper CSS inline de /)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))

// Cabecera utilitaria personalizada
app.use((req, res, next) => {
  res.setHeader('Bypass-Tunnel-Reminder', 'true')
  next()
})

// 3. CORS: en producción definí CORS_ORIGINS en .env (lista separada por comas).
// Si no se define en producción, bloquea por defecto por seguridad.
const origenesPermitidos = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origen) => origen.trim())
  .filter(Boolean)

app.use(cors({
  origin: origenesPermitidos.length > 0 ? origenesPermitidos : (enProduccion ? false : true),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Reminder'],
}))

// Límite de tamaño del cuerpo JSON para evitar abusos
app.use(express.json({ limit: '1mb' }))

// Identificación por token (no rechaza: cada ruta decide sus permisos)
app.use(identificar)

// Log de peticiones (sin cuerpos: pueden contener contraseñas o códigos OTP)
app.use((req, res, next) => {
  const quien = req.auth ? `${req.auth.tipo}:${req.auth.rol || 'egresado'}` : 'anónimo'
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} (${quien})`)
  next()
})

/**
 * RUTAS DE ACCESO DIRECTO (Navegador)
 */
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SiGIC · Backend</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 60%, #2a3448 100%);
      color: #e8eef5;
      padding: 24px;
    }
    .tarjeta {
      max-width: 460px;
      width: 100%;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.10);
      border-radius: 16px;
      padding: 40px 36px;
      text-align: center;
      backdrop-filter: blur(6px);
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
    }
    .estado {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #7ee2a8;
      background: rgba(46, 204, 113, 0.12);
      border: 1px solid rgba(46, 204, 113, 0.35);
      padding: 6px 14px;
      border-radius: 999px;
      margin-bottom: 22px;
    }
    .punto {
      width: 8px; height: 8px; border-radius: 50%;
      background: #2ecc71;
      box-shadow: 0 0 8px #2ecc71;
    }
    h1 { font-size: 26px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }
    h1 span { color: #29ABE2; }
    p { font-size: 14px; color: #aebacb; line-height: 1.6; }
    .acciones { margin-top: 28px; display: flex; flex-direction: column; gap: 10px; }
    .boton {
      display: block;
      background: #29ABE2;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      transition: background 0.2s ease;
    }
    .boton:hover { background: #1f8fc0; }
    .enlace-tenue { font-size: 12px; color: #6d7a8c; text-decoration: none; }
    .enlace-tenue:hover { color: #aebacb; }
    .pie { margin-top: 26px; font-size: 11px; color: #5a6678; }
  </style>
</head>
<body>
  <main class="tarjeta">
    <div class="estado"><span class="punto"></span> Servicio activo</div>
    <h1>Si<span>GIC</span> Backend</h1>
    <p>La API del Sistema de Gestión Integral de Credenciales está funcionando correctamente.</p>
    <div class="acciones">
      <a class="boton" href="http://localhost:5173">Abrir interfaz de usuario</a>
      <a class="enlace-tenue" href="/api/health">Ver estado técnico (JSON)</a>
    </div>
    <div class="pie">Instituto Tecnológico Beltrán · Ceremonia de Colación</div>
  </main>
</body>
</html>`)
})

/**
 * REGISTRO DE RUTAS DE LA API
 */
app.use('/api/egresados', egresadosRouter)
app.use('/api/invitados', invitadosRouter)
app.use('/api/stats', statsRouter)
app.use('/api/anfiteatro', anfiteatroRouter)
app.use('/api/configuracion', configuracionRouter)
app.use('/api/ceremonias', ceremoniasRouter)
app.use('/api/auth', authRouter)
app.use('/api/profesores', profesoresRutas)
app.use('/api/entregadores', entregadoresRutas)
app.use('/api/setup', setupRutas)
app.use('/api/usuarios', usuariosRutas)

/**
 * Comprobación de salud del sistema
 */
app.get('/api/health', (req, res) => {
  res.json({
    estado: 'saludable',
    proyecto: 'SiGIC 2026',
    v: '1.0.0',
    hora_servidor: new Date().toISOString(),
  })
})

/**
 * INICIO DEL SERVIDOR (ARRANQUE CONTROLADO)
 */
async function iniciarServidor() {
  try {
    await init()

    app.listen(PUERTO, () => {
      console.log('┌─────────────────────────────────────────────────────┐')
      console.log('│  SiGIC Backend iniciado con éxito                   │')
      console.log('└─────────────────────────────────────────────────────┘')
      console.log(`  ➜ Escuchando en:  http://localhost:${PUERTO}`)
      console.log(`  ➜ Estado:         http://localhost:${PUERTO}/api/health`)
      if (origenesPermitidos.length > 0) {
        console.log(`  ➜ CORS:           ${origenesPermitidos.join(', ')}`)
      } else {
        console.log('  ⚠ CORS:           abierto a todos los orígenes (definí CORS_ORIGINS en .env para producción)')
      }
      console.log('')
    })
  } catch (err) {
    console.error('Falla crítica: No se pudo inicializar la base de datos.')
    console.error(err)
    process.exit(1)
  }
}

iniciarServidor()
