const { Router } = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const tokens = require('../servicios/tokens');
const { crearLimitador } = require('../middleware/limitador');
const { requiereRol, ROLES_LECTURA } = require('../middleware/autenticacion');

const router = Router();

// Máximo 8 intentos de login por IP cada 10 minutos (anti fuerza bruta)
const limitadorLogin = crearLimitador({
  ventanaMs: 10 * 60 * 1000,
  maximo: 8,
  mensaje: 'Demasiados intentos de inicio de sesión. Esperá unos minutos y volvé a intentar.',
});

/**
 * POST /api/auth/login
 * Autentica un usuario del sistema (Admin/Porteria) y emite un token de
 * sesión firmado. El rol viaja dentro del token: el cliente no puede
 * modificarlo sin invalidar la firma.
 */
router.post('/login', limitadorLogin, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    // 1. Buscar usuario por email
    const result = await db.query('SELECT * FROM usuarios_sistema WHERE email = $1 AND activo = 1', [String(email).toLowerCase()]);
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 2. Validar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Actualizar último login
    await db.query('UPDATE usuarios_sistema SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1', [usuario.id]);

    // 4. Emitir token de sesión (8 horas) y responder sin el hash
    const token = tokens.firmar({
      tipo: 'personal',
      id: usuario.id,
      rol: usuario.rol,
      nombre: usuario.nombre,
    });

    res.json({
      ok: true,
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error en Login:', error);
    res.status(500).json({ error: 'Error interno del servidor durante la autenticación' });
  }
});

/**
 * GET /api/auth/sesion
 * Permite al cliente validar si su token sigue vigente y conocer su identidad.
 */
router.get('/sesion', requiereRol(...ROLES_LECTURA), (req, res) => {
  res.json({
    ok: true,
    usuario: {
      id: req.auth.id,
      nombre: req.auth.nombre,
      rol: req.auth.rol,
      expira: req.auth.exp,
    },
  });
});

module.exports = router;
