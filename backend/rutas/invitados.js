/**
 * Rutas de Gestión de Invitados (SiGIC) - Versión PostgreSQL
 */

const { Router } = require('express');
const db = require('../db');

const router = Router();

/**
 * GET /api/invitados (Filtrado por Hábitat Activo)
 */
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT i.*, e.nombre as "egresadoNombre", e.legajo as "egresadoLegajo"
      FROM invitados i
      JOIN egresados e ON i.egresado_id = e.id
      JOIN ceremonias c ON e.ceremonia_id = c.id
      WHERE c.activa = 1
      ORDER BY i.creado_en DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar invitados del hábitat activo' });
  }
});

/**
 * GET /api/invitados/buscar/:codigo (Validación de QR/Código en Hábitat)
 */
router.get('/buscar/:codigo', async (req, res) => {
  const { codigo } = req.params;
  try {
    // 1. Intentar como ID de invitado individual (Validando que el egresado sea de la ceremonia activa)
    const invRes = await db.query(`
      SELECT i.*, e.nombre as "egresadoNombre" 
      FROM invitados i 
      JOIN egresados e ON i.egresado_id = e.id 
      JOIN ceremonias c ON e.ceremonia_id = c.id
      WHERE i.id = $1 AND c.activa = 1
    `, [codigo]);

    if (invRes.rows.length > 0) {
      return res.json({ tipo: 'individual', datos: invRes.rows[0] });
    }

    // 2. Intentar como Token de egresado (Validando ceremonia activa)
    const egrRes = await db.query(`
      SELECT e.* 
      FROM egresados e 
      JOIN ceremonias c ON e.ceremonia_id = c.id
      WHERE UPPER(e.token) = UPPER($1) AND c.activa = 1
    `, [codigo]);

    if (egrRes.rows.length > 0) {
      const egr = egrRes.rows[0];
      const invs = await db.query('SELECT * FROM invitados WHERE egresado_id = $1', [egr.id]);
      return res.json({ tipo: 'grupo', egresado: egr, invitados: invs.rows });
    }

    res.status(404).json({ error: 'Código no válido para esta ceremonia' });
  } catch (error) {
    res.status(500).json({ error: 'Error en la búsqueda del hábitat' });
  }
});

/**
 * GET /api/invitados/egresado/:egresadoId
 */
router.get('/egresado/:egresadoId', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM invitados WHERE egresado_id = $1', [req.params.egresadoId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar tus invitados' });
  }
});

/**
 * POST /api/invitados
 * Registro masivo con reemplazo (transaccional).
 */
router.post('/', async (req, res) => {
  const { token, egresadoId, invitados: nuevos } = req.body;

  if ((!token && !egresadoId) || !Array.isArray(nuevos) || nuevos.length === 0) {
    return res.status(400).json({ error: 'Datos obligatorios faltantes' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Buscar egresado
    const egrRes = token 
      ? await client.query('SELECT * FROM egresados WHERE UPPER(token) = UPPER($1)', [token])
      : await client.query('SELECT * FROM egresados WHERE id = $1', [egresadoId]);
    
    const egresado = egrRes.rows[0];
    if (!egresado) {
      throw new Error(`Autorización fallida: No se encontró egresado`);
    }

    // 1. Verificar cupos actuales
    const actualesRes = await client.query('SELECT COUNT(*) as total FROM invitados WHERE egresado_id = $1', [egresado.id]);
    const totalActual = parseInt(actualesRes.rows[0].total || 0);

    // 2. Leer el límite dinámico desde configuracion_sistema
    const configResult = await client.query(
      "SELECT valor FROM configuracion_sistema WHERE clave = 'max_invitados_por_egresado'"
    );
    const maxInvitados = configResult.rows.length > 0 ? parseInt(configResult.rows[0].valor) : 4;

    // 3. Validar si los nuevos superan el límite
    if (totalActual + nuevos.length > maxInvitados) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({
        error: `Cupos insuficientes. Ya tienes ${totalActual} registrados y quieres añadir ${nuevos.length}. El máximo es ${maxInvitados}.`
      });
    }

    // 4. Verificar duplicados de DNI en los nuevos vs existentes
    for (const inv of nuevos) {
      const existRes = await client.query('SELECT id FROM invitados WHERE dni = $1', [inv.dni]);
      if (existRes.rows.length > 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ error: `El DNI ${inv.dni} ya está registrado en el sistema.` });
      }
    }

    // 5. Insertar los nuevos invitados
    const registrosFinales = [];
    for (const inv of nuevos) {
      const dniLimpio = inv.dni.replace(/\s/g, '');
      const insRes = await client.query(
        `INSERT INTO invitados (egresado_id, nombre, dni, telefono, correo, relacion)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [egresado.id, inv.nombre.trim(), dniLimpio, inv.telefono.trim(), (inv.correo || '').trim(), inv.relacion]
      );
      registrosFinales.push(insRes.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json(registrosFinales);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error en POST invitados:", error);
    res.status(error.message.includes('Autorización') ? 403 : 500).json({ error: error.message });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/invitados/:id/presente
 */
router.put('/:id/presente', async (req, res) => {
  try {
    const result = await db.query(
      "UPDATE invitados SET presente = TRUE, fecha_presente = CURRENT_TIMESTAMP WHERE id = $1 AND presente = FALSE RETURNING *",
      [req.params.id]
    );
    if (result.rowCount === 0) return res.status(400).json({ error: 'Invitado no encontrado o ya ingresó' });
    res.json({ ok: true, mensaje: 'Ingreso confirmado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar presente' });
  }
});

/**
 * PUT /api/invitados/presente-masivo
 */
router.put('/presente-masivo', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'IDs requeridos' });

  try {
    const placeholders = ids.map(() => '?').join(',');
    const result = await db.query(
      `UPDATE invitados SET presente = TRUE, fecha_presente = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) AND presente = FALSE`,
      ids
    );
    res.json({ ok: true, cantidad_ingresos: result.rowCount });
  } catch (error) {
    res.status(500).json({ error: 'Error en ingreso masivo' });
  }
});

/**
 * DELETE /api/invitados/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM invitados WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Invitado no encontrado' });
    res.json({ ok: true, mensaje: 'Invitado eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar invitado' });
  }
});

/**
 * PUT /api/invitados/:id
 */
router.put('/:id', async (req, res) => {
  const { nombre, dni, telefono, correo, relacion } = req.body;
  try {
    const result = await db.query(
      `UPDATE invitados 
       SET nombre = $1, dni = $2, telefono = $3, correo = $4, relacion = $5 
       WHERE id = $6 RETURNING *`,
      [nombre, dni, telefono, correo, relacion, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Invitado no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar invitado' });
  }
});

module.exports = router;
