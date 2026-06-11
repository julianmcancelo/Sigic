/**
 * Rutas de Gestión de Profesores (SiGIC)
 * CRUD completo para el catálogo de profesores que entregan diplomas.
 */

const { Router } = require('express');
const db = require('../db');
const { requiereRol, ROLES_GESTION } = require('../middleware/autenticacion');

const router = Router();

/**
 * GET /api/profesores
 * Listo todos los profesores activos ordenados por nombre.
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM profesores WHERE activo = 1 ORDER BY nombre');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener profesores:', error);
    res.status(500).json({ error: 'No se pudieron cargar los profesores' });
  }
});

/**
 * POST /api/profesores
 * Creo un nuevo profesor en el catálogo.
 */
router.post('/', requiereRol(...ROLES_GESTION), async (req, res) => {
  const { nombre, dni, materia } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del profesor es obligatorio' });
  }

  try {
    const result = await db.query(
      'INSERT INTO profesores (nombre, dni, materia) VALUES ($1, $2, $3) RETURNING *',
      [nombre.trim(), dni ? dni.trim() : null, materia ? materia.trim() : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear profesor:', error);
    res.status(500).json({ error: 'No se pudo registrar el profesor' });
  }
});

/**
 * PUT /api/profesores/:id
 * Actualizo los datos de un profesor existente.
 */
router.put('/:id', requiereRol(...ROLES_GESTION), async (req, res) => {
  const { nombre, dni, materia } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del profesor es obligatorio' });
  }

  try {
    const result = await db.query(
      'UPDATE profesores SET nombre = $1, dni = $2, materia = $3 WHERE id = $4 RETURNING *',
      [nombre.trim(), dni ? dni.trim() : null, materia ? materia.trim() : null, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Profesor no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar profesor:', error);
    res.status(500).json({ error: 'No se pudo actualizar el profesor' });
  }
});

/**
 * DELETE /api/profesores/:id
 * Hago un soft delete: marco al profesor como inactivo en vez de borrarlo.
 */
router.delete('/:id', requiereRol(...ROLES_GESTION), async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE profesores SET activo = 0 WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Profesor no encontrado' });
    }

    res.json({ ok: true, mensaje: 'Profesor desactivado correctamente' });
  } catch (error) {
    console.error('Error al desactivar profesor:', error);
    res.status(500).json({ error: 'No se pudo desactivar el profesor' });
  }
});

module.exports = router;
