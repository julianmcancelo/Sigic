const { Router } = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = Router();

/**
 * POST /api/auth/login
 * Autentica un usuario del sistema (Admin/Porteria)
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    // 1. Buscar usuario por email
    const result = await db.query('SELECT * FROM usuarios_sistema WHERE email = $1 AND activo = 1', [email]);
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario desactivado' });
    }

    // 2. Validar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Actualizar último login
    await db.query('UPDATE usuarios_sistema SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1', [usuario.id]);

    // 4. Responder con datos del usuario (sin el hash)
    res.json({
      ok: true,
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

module.exports = router;
