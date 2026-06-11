const db = require('../db');

async function resetearDatos() {
  try {
    await db.init();

    await db.query('BEGIN');
    await db.query('DELETE FROM entregadores');
    await db.query('DELETE FROM profesores');
    await db.query('DELETE FROM invitados');
    await db.query('DELETE FROM otp_historial');
    await db.query('DELETE FROM egresados');
    await db.query('DELETE FROM configuracion_anfiteatro');
    await db.query('DELETE FROM logs_auditoria');
    await db.query('DELETE FROM ceremonias');
    await db.query('DELETE FROM usuarios_sistema');
    await db.query("DELETE FROM configuracion_sistema WHERE clave = 'setup_inicial_completado'");

    await db.query(
      `INSERT INTO configuracion_sistema (clave, valor, descripcion, actualizado_en)
       VALUES ('setup_inicial_completado', '0', 'Indica si el asistente inicial ya fue completado', CURRENT_TIMESTAMP)
       ON CONFLICT (clave)
       DO UPDATE SET valor = '0', descripcion = EXCLUDED.descripcion, actualizado_en = CURRENT_TIMESTAMP`
    );
    await db.query('COMMIT');

    console.log('Base de datos limpia: datos operativos en cero.');
    process.exit(0);
  } catch (error) {
    try {
      await db.query('ROLLBACK');
    } catch (_) {}
    console.error('Error al resetear datos:', error);
    process.exit(1);
  }
}

resetearDatos();
