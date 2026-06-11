const express = require('express');
const router = express.Router();
const db = require('../db');
const { requiereRol, ROLES_GESTION } = require('../middleware/autenticacion');

// Obtener la configuración actual (última versión guardada)
router.get('/config', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT estructura, mapa_roles FROM configuracion_anfiteatro ORDER BY actualizado_en DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      // Si no hay datos en la DB, devolvemos una estructura vacía por defecto
      return res.json({
        estructura: { baja: { filas: 8, asientos: 16 }, alta: { filas: 6, asientos: 20 } },
        mapaRoles: {}
      });
    }

    const { estructura, mapa_roles } = result.rows[0];
    res.json({ estructura, mapaRoles: mapa_roles });
  } catch (error) {
    console.error("Error leyendo configuración del anfiteatro desde DB:", error);
    res.status(500).json({ error: "No se pudo leer la configuración de la base de datos" });
  }
});

// Guardar nueva configuración
router.post('/config', requiereRol(...ROLES_GESTION), async (req, res) => {
  try {
    const { estructura, mapaRoles } = req.body;
    
    if (!estructura || !mapaRoles) {
      return res.status(400).json({ error: "Formato de configuración inválido" });
    }

    // Insertamos una nueva versión de la configuración
    await db.query(
      'INSERT INTO configuracion_anfiteatro (estructura, mapa_roles, actualizado_en) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [estructura, mapaRoles]
    );

    res.json({ mensaje: "Configuración guardada con éxito en la base de datos" });
  } catch (error) {
    console.error("Error guardando configuración del anfiteatro en DB:", error);
    res.status(500).json({ error: "No se pudo guardar la configuración en la base de datos" });
  }
});

module.exports = router;
