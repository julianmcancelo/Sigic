/**
 * Rutas de Configuración del Sistema (SiGIC)
 * Solo accesible para administradores.
 * Gestiona la tabla configuracion_sistema de PostgreSQL.
 */

const { Router } = require('express');
const db = require('../db');

const router = Router();

/**
 * GET /api/configuracion
 * Mezcla ajustes globales con datos de la ceremonia activa para evitar redundancia.
 */
router.get('/', async (req, res) => {
  try {
    // 1. Obtener ajustes globales
    const resGlobal = await db.query(
      'SELECT clave, valor, descripcion, actualizado_en FROM configuracion_sistema ORDER BY clave'
    );

    const ajustes = {};
    resGlobal.rows.forEach(row => {
      ajustes[row.clave] = {
        valor: row.valor,
        descripcion: row.descripcion,
        actualizado_en: row.actualizado_en,
      };
    });

    // 2. Sobre-escribir con datos de la ceremonia activa si existe
    const resActiva = await db.query('SELECT * FROM ceremonias WHERE activa = 1 LIMIT 1');
    if (resActiva.rowCount > 0) {
      const c = resActiva.rows[0];
      ajustes['nombre_evento'] = { valor: c.nombre, descripcion: 'Nombre de la ceremonia actual' };
      ajustes['max_invitados'] = { valor: String(c.max_invitados), descripcion: 'Cupo de invitados por egresado' };
      ajustes['fecha_evento']  = { valor: c.fecha, descripcion: 'Fecha de la ceremonia actual' };
      ajustes['lugar_evento']  = { valor: c.lugar, descripcion: 'Ubicación física del evento' };
    }

    res.json(ajustes);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'No se pudo cargar la configuración' });
  }
});

/**
 * PUT /api/configuracion/:clave
 * Redirecciona la actualización a la tabla ceremonias si corresponde.
 */
router.put('/:clave', async (req, res) => {
  const { clave } = req.params;
  const { valor } = req.body;

  if (valor === undefined || valor === null) {
    return res.status(400).json({ error: 'El campo "valor" es obligatorio' });
  }

  try {
    const CLAVES_CEREMONIA = ['nombre_evento', 'max_invitados', 'fecha_evento', 'lugar_evento'];
    
    if (CLAVES_CEREMONIA.includes(clave)) {
      // Actualizar en la tabla ceremonias para el hábitat activo
      const mapeo = { 
        'nombre_evento': 'nombre', 
        'max_invitados': 'max_invitados', 
        'fecha_evento': 'fecha', 
        'lugar_evento': 'lugar' 
      };
      
      const sql = `UPDATE ceremonias SET ${mapeo[clave]} = $1 WHERE activa = 1`;
      await db.query(sql, [valor]);
      
      return res.json({ ok: true, mensaje: `Hábitat actualizado (${clave})` });
    }

    // Si no es de ceremonia, actualizar en configuración global
    const result = await db.query(
      `UPDATE configuracion_sistema
       SET valor = $1, actualizado_en = CURRENT_TIMESTAMP
       WHERE clave = $2
       RETURNING *`,
      [String(valor), clave]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: `La clave "${clave}" no existe` });
    }

    res.json({ ok: true, ajuste: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar:', error);
    res.status(500).json({ error: 'Fallo al sincronizar el ajuste' });
  }
});

/**
 * GET /api/configuracion/anfiteatro/:ceremoniaId
 * Obtiene la estructura y roles del anfiteatro.
 */
router.get('/anfiteatro/estructura/:ceremoniaId', async (req, res) => {
  const { ceremoniaId } = req.params;
  try {
    const result = await db.query('SELECT * FROM configuracion_anfiteatro WHERE ceremonia_id = $1 ORDER BY actualizado_en DESC LIMIT 1', [ceremoniaId]);
    if (result.rows.length === 0) {
      // Devolver estructura por defecto si no existe
      return res.json({
        estructura: { 
          baja: { filas: 8, asientos: 16 },
          alta: { filas: 6, asientos: 20 }
        },
        mapaRoles: {}
      });
    }
    const data = result.rows[0];
    res.json({
      estructura: JSON.parse(data.estructura),
      mapaRoles: JSON.parse(data.mapa_roles)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la estructura del anfiteatro' });
  }
});

/**
 * POST /api/configuracion/anfiteatro/:ceremoniaId
 * Guarda la estructura y roles.
 */
router.post('/anfiteatro/estructura/:ceremoniaId', async (req, res) => {
  const { ceremoniaId } = req.params;
  const { estructura, mapaRoles, usuarioId } = req.body;
  try {
    await db.query(
      'INSERT INTO configuracion_anfiteatro (ceremonia_id, estructura, mapa_roles, modificado_por) VALUES ($1, $2, $3, $4)',
      [ceremoniaId, JSON.stringify(estructura), JSON.stringify(mapaRoles), usuarioId]
    );
    res.json({ ok: true, mensaje: 'Estructura del anfiteatro actualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar la estructura' });
  }
});

module.exports = router;
