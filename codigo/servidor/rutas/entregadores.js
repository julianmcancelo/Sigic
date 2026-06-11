/**
 * Rutas de Gestión de Entregadores (SiGIC)
 * Manejo la asignación de personas que entregan diplomas a cada graduado.
 */

const { Router } = require('express');
const db = require('../db');
const { requierePersonalOEgresado, ROLES_LECTURA } = require('../middleware/autenticacion');

const router = Router();

/**
 * Devuelve el egresado dueño de un entregador (para validar permisos).
 */
async function duenoDeEntregador(req) {
  const result = await db.query('SELECT egresado_id FROM entregadores WHERE id = $1', [req.params.id]);
  return result.rows[0]?.egresado_id ?? null;
}

/**
 * GET /api/entregadores/graduado/:id
 * Listo los entregadores asignados a un graduado, ordenados por su orden de participación.
 */
router.get('/graduado/:id', requierePersonalOEgresado((req) => req.params.id, ROLES_LECTURA), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM entregadores WHERE egresado_id = $1 ORDER BY orden',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener entregadores:', error);
    res.status(500).json({ error: 'No se pudieron cargar los entregadores' });
  }
});

/**
 * POST /api/entregadores
 * Asigno un entregador a un graduado. Antes verifico que no supere el máximo permitido por la ceremonia.
 */
router.post('/', requierePersonalOEgresado((req) => req.body?.egresado_id ?? null), async (req, res) => {
  const { egresado_id, tipo, profesor_id, invitado_id, nombre, orden } = req.body;

  if (!egresado_id || !tipo || !nombre) {
    return res.status(400).json({ error: 'egresado_id, tipo y nombre son obligatorios' });
  }

  if (!['PROFESOR', 'FAMILIAR'].includes(tipo)) {
    return res.status(400).json({ error: 'El tipo debe ser PROFESOR o FAMILIAR' });
  }

  try {
    // Verifico el máximo de entregadores permitidos en la ceremonia del graduado
    const limiteRes = await db.query(
      `SELECT c.max_entregadores 
       FROM ceremonias c 
       JOIN egresados e ON e.ceremonia_id = c.id 
       WHERE e.id = $1`,
      [egresado_id]
    );

    if (limiteRes.rowCount === 0) {
      return res.status(404).json({ error: 'No se encontró la ceremonia del graduado' });
    }

    const maxEntregadores = limiteRes.rows[0].max_entregadores || 3;

    // Cuento cuántos entregadores ya tiene asignados
    const conteoRes = await db.query(
      'SELECT COUNT(*) as total FROM entregadores WHERE egresado_id = $1',
      [egresado_id]
    );
    const totalActual = parseInt(conteoRes.rows[0].total, 10);

    if (totalActual >= maxEntregadores) {
      return res.status(400).json({ 
        error: `El graduado ya tiene el máximo de entregadores permitidos (${maxEntregadores})` 
      });
    }

    // Inserto el nuevo entregador
    const result = await db.query(
      `INSERT INTO entregadores (egresado_id, tipo, profesor_id, invitado_id, nombre, orden) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [egresado_id, tipo, profesor_id || null, invitado_id || null, nombre.trim(), orden || (totalActual + 1)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al asignar entregador:', error);
    // Detecto violación de constraint UNIQUE(egresado_id, orden)
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Ya existe un entregador con ese orden para este graduado' });
    }
    res.status(500).json({ error: 'No se pudo asignar el entregador' });
  }
});

/**
 * DELETE /api/entregadores/:id
 * Quito un entregador de la asignación.
 */
router.delete('/:id', requierePersonalOEgresado(duenoDeEntregador), async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM entregadores WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Entregador no encontrado' });
    }

    res.json({ ok: true, mensaje: 'Entregador removido correctamente' });
  } catch (error) {
    console.error('Error al eliminar entregador:', error);
    res.status(500).json({ error: 'No se pudo eliminar el entregador' });
  }
});

module.exports = router;
