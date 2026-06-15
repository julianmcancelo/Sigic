/**
 * Rutas de Gestión de Usuarios del Sistema (SiGIC)
 * Solo accesible con un token de sesión de SUPER_ADMIN.
 */
const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requiereRol, ROLES_GESTION } = require('../middleware/autenticacion');
const tokens = require('../servicios/tokens');

const router = Router();

const ROLES_VALIDOS = ['SUPER_ADMIN', 'ADMINISTRATIVO', 'ADMIN', 'PORTERIA', 'AUDITOR'];
const RONDAS_BCRYPT = 12;
const LARGO_MINIMO_PASSWORD = 8;

// Todas las rutas de este módulo requieren roles de gestión autorizados
router.use(requiereRol(...ROLES_GESTION));

/**
 * Evita dejar el sistema sin ningún SUPER_ADMIN activo.
 */
async function esUltimoSuperAdmin(id) {
  const result = await db.query(
    `SELECT COUNT(*) AS total FROM usuarios_sistema
     WHERE rol = 'SUPER_ADMIN' AND activo = 1 AND id <> $1`,
    [id]
  );
  return parseInt(result.rows[0]?.total ?? 0, 10) === 0;
}

router.get('/', async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nombre, email, rol, activo, ultimo_login, creado_en
       FROM usuarios_sistema
       ORDER BY creado_en DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'No se pudieron listar los usuarios' });
  }
});

router.post('/', async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  const rolNormalizado = (rol || '').toString().toUpperCase();

  if (!nombre || !email || !password || !rolNormalizado) {
    return res.status(400).json({ error: 'Nombre, email, password y rol son obligatorios' });
  }
  if (!ROLES_VALIDOS.includes(rolNormalizado)) {
    return res.status(400).json({ error: 'Rol invalido' });
  }
  if (String(password).length < LARGO_MINIMO_PASSWORD) {
    return res.status(400).json({ error: `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres` });
  }

  try {
    const existe = await db.query('SELECT id FROM usuarios_sistema WHERE email = $1', [email.toLowerCase()]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }

    const hash = await bcrypt.hash(password, RONDAS_BCRYPT);
    const id = uuidv4();

    await db.query(
      `INSERT INTO usuarios_sistema (id, nombre, email, password_hash, rol, activo)
       VALUES ($1, $2, $3, $4, $5, 1)`,
      [id, nombre, email.toLowerCase(), hash, rolNormalizado]
    );

    res.json({ ok: true, usuario: { id, nombre, email: email.toLowerCase(), rol: rolNormalizado, activo: 1 } });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'No se pudo crear el usuario' });
  }
});

router.put('/:id/rol', async (req, res) => {
  const { id } = req.params;
  const rol = (req.body?.rol || '').toString().toUpperCase();
  if (!ROLES_VALIDOS.includes(rol)) {
    return res.status(400).json({ error: 'Rol invalido' });
  }
  try {
    if (rol !== 'SUPER_ADMIN' && await esUltimoSuperAdmin(id)) {
      return res.status(409).json({ error: 'No podés quitar el rol al último SUPER_ADMIN activo del sistema' });
    }
    await db.query('UPDATE usuarios_sistema SET rol = $1 WHERE id = $2', [rol, id]);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({ error: 'No se pudo actualizar el rol' });
  }
});

router.put('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const activo = Number(req.body?.activo) === 1 ? 1 : 0;
  try {
    if (activo === 0 && await esUltimoSuperAdmin(id)) {
      const usuario = await db.query('SELECT rol FROM usuarios_sistema WHERE id = $1', [id]);
      if (usuario.rows[0]?.rol === 'SUPER_ADMIN') {
        return res.status(409).json({ error: 'No podés desactivar al último SUPER_ADMIN activo del sistema' });
      }
    }
    await db.query('UPDATE usuarios_sistema SET activo = $1 WHERE id = $2', [activo, id]);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: 'No se pudo actualizar el estado del usuario' });
  }
});

router.get('/:id/token', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM usuarios_sistema WHERE id = $1', [id]);
    const usuario = result.rows[0];
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Generar token de larga duración (30 días) para el personal de seguridad
    const token = tokens.firmar({
      tipo: 'personal',
      id: usuario.id,
      rol: usuario.rol,
      nombre: usuario.nombre,
    }, 30 * 24 * 60 * 60);
    
    res.json({ ok: true, token });
  } catch (error) {
    console.error('Error generando token de usuario:', error);
    res.status(500).json({ error: 'No se pudo generar el token' });
  }
});

module.exports = router;
