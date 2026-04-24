/**
 * Servidor Principal de SiGIC (Sistema de Gestión Integral de Credenciales)
 * Orquestador principal de la API REST que comunica el Frontend con la base de datos persistente.
 */
require('dotenv').config()
const express = require('express')
const cors = require('cors')

// Importación de enrutadores modulares
const egresadosRouter    = require('./rutas/egresados')
const invitadosRouter    = require('./rutas/invitados')
const statsRouter        = require('./rutas/stats')
const anfiteatroRouter   = require('./rutas/anfiteatro')
const configuracionRouter = require('./rutas/configuracion')
const ceremoniasRouter     = require('./rutas/ceremonias')

// Inicializar Base de Datos (SQLite)
const { init } = require('./db')
try {
  init();
} catch (err) {
  console.error("Falla crítica: No se pudo inicializar la base de datos.");
  process.exit(1);
}

const app = express()
app.use((req, res, next) => {
  res.setHeader('Bypass-Tunnel-Reminder', 'true');
  next();
});
const PUERTO = process.env.PORT || 3001

/**
 * CONFIGURACIÓN DE MIDDLEWARES
 */
const HEADERS = {
  'Content-Type': 'application/json',
  'Bypass-Tunnel-Reminder': 'true'
}
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Reminder']
}))
app.use(express.json())

// Middleware de loggeo para depuración
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`)
  if (req.method === 'POST') {
    console.log('Body:', JSON.stringify(req.body, null, 2))
  }
  next()
})

/**
 * RUTAS DE ACCESO DIRECTO (Navegador)
 */
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 50px; text-align: center;">
      <h1 style="color: #29ABE2; font-weight: 900;">SiGIC Backend Activo</h1>
      <p style="color: #2A3448;">La API del sistema está funcionando correctamente.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0; max-width: 400px; margin-left: auto; margin-right: auto;">
      <p style="font-size: 13px; color: #666;">Para utilizar la interfaz de usuario, visitá: <br><br>
        <a href="http://localhost:5173" style="background: #29ABE2; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          SiGIC Frontend (Vea aquí)
        </a>
      </p>
      <br>
      <a href="/api/health" style="font-size: 11px; color: #999; text-decoration: none;">Ver Estado Técnico (JSON)</a>
    </div>
  `)
})

/**
 * REGISTRO DE RUTAS DE LA API
 */
app.use('/api/egresados',     egresadosRouter)
app.use('/api/invitados',     invitadosRouter)
app.use('/api/stats',         statsRouter)
app.use('/api/anfiteatro',    anfiteatroRouter)
app.use('/api/configuracion', configuracionRouter)
app.use('/api/ceremonias',    ceremoniasRouter)

/**
 * Comprobación de salud del sistema
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    estado: 'saludable', 
    proyecto: 'SiGIC 2026', 
    v: '1.0.0',
    hora_servidor: new Date().toISOString() 
  })
})

/**
 * INICIO DEL SERVIDOR
 */
app.listen(PUERTO, () => {
  console.log('---------------------------------------------------------')
  console.log(`✓ SiGIC Backend iniciado con éxito.`)
  console.log(`➜ Escuchando en: http://localhost:${PUERTO}`)
  console.log('---------------------------------------------------------')
})
