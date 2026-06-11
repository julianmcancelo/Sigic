const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { crearLimitador } = require('../middleware/limitador');

const router = Router();

// El asistente inicial solo corre con la base vacía, pero igual limitamos
// los intentos para frenar abusos automatizados.
const limitadorSetup = crearLimitador({
  ventanaMs: 10 * 60 * 1000,
  maximo: 5,
  mensaje: 'Demasiados intentos de inicialización. Esperá unos minutos.',
});

router.get('/status', async (_req, res) => {
  try {
    const usuarios = await db.query('SELECT COUNT(*)::int AS total FROM usuarios_sistema');
    const ceremonias = await db.query('SELECT COUNT(*)::int AS total FROM ceremonias');
    const egresados = await db.query('SELECT COUNT(*)::int AS total FROM egresados');
    const invitados = await db.query('SELECT COUNT(*)::int AS total FROM invitados');

    const totalUsuarios = usuarios.rows[0]?.total ?? 0;
    const flagSetup = await db.query(
      "SELECT valor FROM configuracion_sistema WHERE clave = 'setup_inicial_completado' LIMIT 1"
    );
    const setupCompleto = flagSetup.rows[0]?.valor === '1';

    res.json({
      requiereConfiguracionInicial: totalUsuarios === 0 || !setupCompleto,
      metricas: {
        usuarios: totalUsuarios,
        ceremonias: ceremonias.rows[0]?.total ?? 0,
        egresados: egresados.rows[0]?.total ?? 0,
        invitados: invitados.rows[0]?.total ?? 0,
      },
      setupCompleto,
    });
  } catch (error) {
    console.error('Error al consultar estado de setup:', error);
    res.status(500).json({ error: 'No se pudo consultar el estado inicial del sistema' });
  }
});

router.post('/initialize', limitadorSetup, async (req, res) => {
  const {
    nombre,
    email,
    password,
    nombreEvento = 'Ceremonia de Colacion',
    fechaEvento = '2026-12-01',
    lugarEvento = 'Sede Beltran',
  } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contrasena son obligatorios' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const usuarios = await db.query('SELECT COUNT(*)::int AS total FROM usuarios_sistema');
    if (parseInt(usuarios.rows[0]?.total ?? 0, 10) > 0) {
      return res.status(409).json({ error: 'El sistema ya fue inicializado' });
    }

    const hash = await bcrypt.hash(password, 12);
    const usuarioId = uuidv4();
    const ceremoniaId = uuidv4();

    await db.query(
      `INSERT INTO usuarios_sistema (id, nombre, email, password_hash, rol, activo)
       VALUES ($1, $2, $3, $4, 'SUPER_ADMIN', 1)`,
      [usuarioId, nombre, email.toLowerCase(), hash]
    );

    await db.query(
      `INSERT INTO ceremonias (id, nombre, fecha, lugar, max_invitados, max_entregadores, activa)
       VALUES ($1, $2, $3, $4, 4, 3, 1)`,
      [ceremoniaId, nombreEvento, fechaEvento, lugarEvento]
    );

    await db.query(
      `INSERT INTO configuracion_sistema (clave, valor, descripcion, actualizado_en)
       VALUES ('setup_inicial_completado', '1', 'Indica si el asistente inicial ya fue completado', CURRENT_TIMESTAMP)
       ON CONFLICT (clave)
       DO UPDATE SET valor = '1', descripcion = EXCLUDED.descripcion, actualizado_en = CURRENT_TIMESTAMP`
    );

    res.json({
      ok: true,
      mensaje: 'Configuracion inicial creada correctamente',
      usuario: { id: usuarioId, nombre, email: email.toLowerCase(), rol: 'SUPER_ADMIN' },
      ceremonia: { id: ceremoniaId, nombre: nombreEvento, fecha: fechaEvento, lugar: lugarEvento },
    });
  } catch (error) {
    console.error('Error en inicializacion del sistema:', error);
    res.status(500).json({ error: 'No se pudo completar la configuracion inicial' });
  }
});

module.exports = router;
