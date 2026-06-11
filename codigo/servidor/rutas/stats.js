/**
 * Ruta de Estadísticas en Tiempo Real (SiGIC) - Versión PostgreSQL
 */

const { Router } = require('express');
const db = require('../db');
const { requiereRol, ROLES_LECTURA } = require('../middleware/autenticacion');

const router = Router();

/**
 * GET /api/stats
 */
router.get('/', requiereRol(...ROLES_LECTURA), async (req, res) => {
  try {
    // 0. Obtener Ceremonia Activa
    const ceremoniaRes = await db.query('SELECT id FROM ceremonias WHERE activa = 1 LIMIT 1');
    if (ceremoniaRes.rowCount === 0) {
      return res.json({
        totalEgresados: 0, totalInvitados: 0, presentes: 0, ausentes: 0,
        porcentajeAsistencia: 0, ultimosIngresos: [],
        mensaje: 'No hay una ceremonia activa configurada'
      });
    }
    const ceremoniaId = ceremoniaRes.rows[0].id;

    // 1. Estadísticas Generales (Filtradas por Ceremonia)
    const egresadosCount = await db.query('SELECT COUNT(*) as total FROM egresados WHERE ceremonia_id = $1', [ceremoniaId]);
    const invitadosStats = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN i.presente = 1 THEN 1 ELSE 0 END) as presentes
      FROM invitados i
      JOIN egresados e ON i.egresado_id = e.id
      WHERE e.ceremonia_id = $1
    `, [ceremoniaId]);

    const totalEgresados = parseInt(egresadosCount.rows[0].total);
    const totalInvitados = parseInt(invitadosStats.rows[0].total || 0);
    const presentes = parseInt(invitadosStats.rows[0].presentes || 0);
    const ausentes = totalInvitados - presentes;
    const porcentajeAsistencia = totalInvitados > 0 ? Math.round((presentes / totalInvitados) * 100) : 0;

    // 2. Últimos 5 Ingresos (Feed filtrado)
    const ingresosQuery = `
      SELECT i.*, e.nombre as "egresadoNombre"
      FROM invitados i
      JOIN egresados e ON i.egresado_id = e.id
      WHERE i.presente = 1 AND e.ceremonia_id = $1
      ORDER BY i.fecha_presente DESC
      LIMIT 5
    `;
    const ingresosRes = await db.query(ingresosQuery, [ceremoniaId]);
    
    const ultimosIngresos = ingresosRes.rows.map(inv => ({
      id: inv.id,
      nombre: inv.nombre,
      relacion: inv.relacion,
      egresado: inv.egresadoNombre,
      hora: new Date(inv.fecha_presente).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      fechaPresente: inv.fecha_presente,
    }));

    res.json({
      ceremoniaId,
      totalEgresados,
      totalInvitados,
      presentes,
      ausentes,
      porcentajeAsistencia,
      ultimosIngresos,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error en stats:", error);
    res.status(500).json({ error: 'Error al generar estadísticas desde la base de datos' });
  }
});

module.exports = router;
