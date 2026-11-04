/**
 * Regla de visibilidad estricta de Autoridad Criptográfica y Licenciamiento:
 * El panel de Ciberseguridad & Control (NFC, FIDO2, TOTP, respaldos PostgreSQL y licencias Ed25519)
 * es de acceso EXCLUSIVO para Cancelo Julian (creador/autoridad del sistema).
 * Ningún otro rol administrativo, directivo o docente puede visualizar ni acceder a este módulo.
 */
export function esAutoridadCancelo(usuario?: { email?: string; correo?: string; nombre?: string } | null): boolean {
  if (!usuario) return false;
  const correo = String(usuario.email || usuario.correo || '').toLowerCase().trim();
  const nombre = String(usuario.nombre || '').toLowerCase().trim();

  const correosAutorizados = [
    'juliancancelo@gmail.com',
    'jcancelo.dev@gmail.com',
    'julianmcancelo@gmail.com',
  ];

  if (correosAutorizados.includes(correo)) return true;
  if (nombre.includes('cancelo') && nombre.includes('julian')) return true;

  return false;
}
