const { Router } = require('express');
const db = require('../db');
const { requiereRol, ROLES_GESTION } = require('../middleware/autenticacion');

const router = Router();

/**
 * GET /api/ceremonias
 * Lista todas las ceremonias registradas.
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ceremonias ORDER BY fecha DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener ceremonias:', error);
    res.status(500).json({ error: 'No se pudieron cargar las ceremonias' });
  }
});

/**
 * GET /api/ceremonias/activa
 * Retorna la ceremonia que está marcada como activa.
 */
router.get('/activa', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ceremonias WHERE activa = 1 LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No hay ninguna ceremonia activa' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener ceremonia activa:', error);
    res.status(500).json({ error: 'Error al consultar la ceremonia activa' });
  }
});

/**
 * POST /api/ceremonias
 * Crea una nueva ceremonia (un nuevo "hábitat").
 */
router.post('/', requiereRol(...ROLES_GESTION), async (req, res) => {
  const { nombre, fecha, lugar, max_invitados, max_entregadores } = req.body;

  if (!nombre || !fecha) {
    return res.status(400).json({ error: 'El nombre y la fecha son obligatorios' });
  }

  try {
    const id = `cer-${Date.now()}`;
    await db.query(
      'INSERT INTO ceremonias (id, nombre, fecha, lugar, max_invitados, max_entregadores, activa) VALUES ($1, $2, $3, $4, $5, $6, 0)',
      [id, nombre, fecha, lugar || 'Sede Beltrán', max_invitados || 4, max_entregadores || 3]
    );

    res.status(201).json({ ok: true, mensaje: 'Ceremonia creada con éxito', id });
  } catch (error) {
    console.error('Error al crear ceremonia:', error);
    res.status(500).json({ error: 'No se pudo crear la ceremonia' });
  }
});

/**
 * PUT /api/ceremonias/:id/activar
 * Marca una ceremonia como activa y desactiva las demás.
 */
router.put('/:id/activar', requiereRol(...ROLES_GESTION), async (req, res) => {
  const { id } = req.params;

  try {
    // Desactivar todas
    await db.query('UPDATE ceremonias SET activa = 0');
    // Activar la seleccionada
    const result = await db.query('UPDATE ceremonias SET activa = 1 WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ceremonia no encontrada' });
    }

    res.json({ ok: true, mensaje: 'Ceremonia activada correctamente' });
  } catch (error) {
    console.error('Error al activar ceremonia:', error);
    res.status(500).json({ error: 'No se pudo activar la ceremonia' });
  }
});

/**
 * PUT /api/ceremonias/:id
 * Edito los datos de una ceremonia existente.
 */
router.put('/:id', requiereRol(...ROLES_GESTION), async (req, res) => {
  const { id } = req.params;
  const { nombre, fecha, lugar, max_invitados, max_entregadores } = req.body;

  try {
    const result = await db.query(
      'UPDATE ceremonias SET nombre = $1, fecha = $2, lugar = $3, max_invitados = $4, max_entregadores = $5 WHERE id = $6 RETURNING *',
      [nombre, fecha, lugar, max_invitados || 4, max_entregadores || 3, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ceremonia no encontrada' });
    }

    res.json({ ok: true, mensaje: 'Ceremonia actualizada correctamente', ceremonia: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar ceremonia:', error);
    res.status(500).json({ error: 'No se pudo actualizar la ceremonia' });
  }
});

/**
 * DELETE /api/ceremonias/:id
 * Elimina una ceremonia y todos sus datos asociados (Cascada).
 */
router.delete('/:id', requiereRol(...ROLES_GESTION), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM ceremonias WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ceremonia no encontrada' });
    }
    res.json({ ok: true, mensaje: 'Ceremonia eliminada con éxito' });
  } catch (error) {
    console.error('Error al eliminar ceremonia:', error);
    res.status(500).json({ error: 'No se pudo eliminar la ceremonia' });
  }
});

module.exports = router;
