const path = require('path');
const fs = require('fs');
const sharp = require(path.join(__dirname, '..', 'codigo', 'plataforma', 'node_modules', 'sharp'));

const ROOT = path.resolve(__dirname);
const LOGO_SRC = path.join(ROOT, 'plymouth-theme', 'logo.png');
const OUT_DIR = path.join(ROOT, 'live-build');
const CHROOT_DIR = path.join(ROOT, 'live-build', 'config', 'includes.chroot');

async function main() {
  console.log('>> Generando sistema visual integral para SiGIC OS...');

  if (!fs.existsSync(LOGO_SRC)) {
    throw new Error('No se encontró el logo en: ' + LOGO_SRC);
  }

  // Asegurar directorios de destino
  const dirs = [
    OUT_DIR,
    path.join(CHROOT_DIR, 'usr', 'share', 'backgrounds', 'sigic'),
    path.join(CHROOT_DIR, 'usr', 'share', 'pixmaps'),
    path.join(CHROOT_DIR, 'usr', 'share', 'icons', 'hicolor', '48x48', 'apps'),
    path.join(CHROOT_DIR, 'usr', 'share', 'icons', 'hicolor', '128x128', 'apps'),
    path.join(CHROOT_DIR, 'usr', 'share', 'applications'),
    path.join(CHROOT_DIR, 'etc', 'skel', 'Desktop'),
    path.join(CHROOT_DIR, 'opt', 'sigic')
  ];
  for (const d of dirs) {
    fs.mkdirSync(d, { recursive: true });
  }

  // =========================================================================
  // 1. BOOTLOADER SPLASH.PNG (640x480, PNG8 ColorType 3 - Requisito de vesamenu)
  // =========================================================================
  const logoBoot = await sharp(LOGO_SRC)
    .resize(95, 95, { fit: 'contain', background: { r: 3, g: 8, b: 14, alpha: 0 } })
    .toBuffer();

  const svgBoot = Buffer.from(`
    <svg width="640" height="480">
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="20%" r="40%">
          <stop offset="0%" stop-color="#0f344d" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#03080e" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="640" height="480" fill="#03080e"/>
      <circle cx="320" cy="80" r="140" fill="url(#bgGlow)"/>
      <text x="320" y="145" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="bold" fill="#00e5ff" text-anchor="middle" letter-spacing="3">SiGIC OS</text>
      <text x="320" y="163" font-family="DejaVu Sans, Arial, sans-serif" font-size="10" font-weight="600" fill="#80deea" text-anchor="middle" letter-spacing="1">INSTITUTO TECNOLÓGICO BELTRÁN</text>
      <line x1="180" y1="172" x2="460" y2="172" stroke="#154b66" stroke-width="1"/>
      <text x="320" y="465" font-family="DejaVu Sans, Arial, sans-serif" font-size="9" fill="#3b6875" text-anchor="middle">Práctica Profesionalizante 2026 · Sistema de Colaciones</text>
    </svg>
  `);

  const splashOut = path.join(OUT_DIR, 'splash.png');
  await sharp(svgBoot)
    .composite([
      { input: logoBoot, top: 22, left: Math.round((640 - 95) / 2) }
    ])
    .png({
      palette: true,
      colours: 256,
      compressionLevel: 9
    })
    .toFile(splashOut);

  const splashBytes = fs.readFileSync(splashOut);
  console.log(`✓ splash.png generado: ${splashBytes.length} bytes (ColorType: ${splashBytes[25]}, BitDepth: ${splashBytes[24]})`);

  // =========================================================================
  // 2. FONDO DE PANTALLA OFICIAL (1920x1080 Full HD - Azul Beltrán Premium)
  // =========================================================================
  const logoWall = await sharp(LOGO_SRC)
    .resize(220, 220, { fit: 'contain', background: { r: 3, g: 8, b: 14, alpha: 0 } })
    .toBuffer();

  const svgWall = Buffer.from(`
    <svg width="1920" height="1080">
      <defs>
        <radialGradient id="wallGlow" cx="50%" cy="42%" r="45%">
          <stop offset="0%" stop-color="#0e3752" stop-opacity="0.9"/>
          <stop offset="45%" stop-color="#082030" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#02060a" stop-opacity="1"/>
        </radialGradient>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00e5ff" stop-opacity="0"/>
          <stop offset="50%" stop-color="#00e5ff" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#00e5ff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#wallGlow)"/>
      <circle cx="960" cy="400" r="280" fill="#00e5ff" fill-opacity="0.03"/>
      <circle cx="960" cy="400" r="180" fill="#00e5ff" fill-opacity="0.05"/>
      <text x="960" y="580" font-family="DejaVu Sans, Arial, sans-serif" font-size="44" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="6">SiGIC <tspan fill="#00e5ff">OS</tspan></text>
      <text x="960" y="625" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="500" fill="#b2ebf2" text-anchor="middle" letter-spacing="2">Sistema de Gestión Institucional de Colaciones</text>
      <rect x="710" y="650" width="500" height="1" fill="url(#lineGrad)"/>
      <text x="960" y="685" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" font-weight="600" fill="#4dd0e1" text-anchor="middle" letter-spacing="3">INSTITUTO TECNOLÓGICO BELTRÁN</text>
      <text x="960" y="1030" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" fill="#2c5263" text-anchor="middle">Práctica Profesionalizante 2026 · Cancelo · Alfonso · Contreras · Frassia · Santillán</text>
    </svg>
  `);

  const fondoPath = path.join(CHROOT_DIR, 'usr', 'share', 'backgrounds', 'sigic', 'fondo.png');
  await sharp(svgWall)
    .composite([
      { input: logoWall, top: 290, left: Math.round((1920 - 220) / 2) }
    ])
    .png({ quality: 95 })
    .toFile(fondoPath);

  console.log(`✓ fondo.png generado: ${fs.statSync(fondoPath).size} bytes (1920x1080)`);

  // =========================================================================
  // 3. GENERADOR DE ICONOS Y LANZADORES DE MÓDULOS DE SIGIC OS
  // =========================================================================
  async function createModuleIcon(badgeSvg, filename, baseColor = '#00e5ff') {
    const icon128 = await sharp({
      create: { width: 128, height: 128, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
    .composite([
      { input: Buffer.from(`
        <svg width="128" height="128">
          <defs>
            <radialGradient id="bg" cx="50%" cy="35%" r="60%">
              <stop offset="0%" stop-color="#0f3047"/>
              <stop offset="100%" stop-color="#03080e"/>
            </radialGradient>
          </defs>
          <rect x="8" y="8" width="112" height="112" rx="26" fill="url(#bg)" stroke="${baseColor}" stroke-width="2.5" stroke-opacity="0.85"/>
        </svg>
      `), top: 0, left: 0 },
      { input: Buffer.from(badgeSvg), top: 24, left: 24 }
    ])
    .png()
    .toBuffer();

    const destPix = path.join(CHROOT_DIR, 'usr', 'share', 'pixmaps', filename);
    fs.writeFileSync(destPix, icon128);

    const icon48 = await sharp(icon128).resize(48, 48).png().toBuffer();
    fs.writeFileSync(path.join(CHROOT_DIR, 'usr', 'share', 'icons', 'hicolor', '48x48', 'apps', filename), icon48);
    fs.writeFileSync(path.join(CHROOT_DIR, 'usr', 'share', 'icons', 'hicolor', '128x128', 'apps', filename), icon128);
    console.log(`✓ Icono ${filename} generado`);
  }

  function createDesktopLauncher(nombre, comentario, execCmd, iconFile, desktopFilename) {
    const content = `[Desktop Entry]
Version=1.0
Type=Application
Name=${nombre}
Comment=${comentario}
Exec=${execCmd}
Icon=/usr/share/pixmaps/${iconFile}
Terminal=false
Categories=Office;Education;System;
StartupNotify=true
`;
    // En el escritorio del usuario
    fs.writeFileSync(path.join(CHROOT_DIR, 'etc', 'skel', 'Desktop', desktopFilename), content, 'utf8');
    // En las aplicaciones del sistema
    fs.writeFileSync(path.join(CHROOT_DIR, 'usr', 'share', 'applications', desktopFilename), content, 'utf8');
  }

  // --- MÓDULOS INSTITUCIONALES DE SIGIC ---

  // 1. Ceremonias
  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 2v4"/><path d="M16 2v4"/>
      <rect width="18" height="18" x="3" y="4" rx="2"/>
      <path d="M3 10h18"/><path d="M10 16h4"/><path d="M12 14v4"/>
    </svg>
  `, 'sigic-ceremonias.png', '#818cf8');
  createDesktopLauncher('Ceremonias', 'Gestión de actos y eventos académicos', 'chromium --lang=es-AR --app="http://localhost:3000/?modulo=gestion-ceremonias"', 'sigic-ceremonias.png', '1-Ceremonias.desktop');

  // 2. Graduados
  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
      <path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
    </svg>
  `, 'sigic-graduados.png', '#34d399');
  createDesktopLauncher('Graduados', 'Padrón de egresados e importación masiva', 'chromium --lang=es-AR --app="http://localhost:3000/?modulo=gestion-graduados"', 'sigic-graduados.png', '2-Graduados.desktop');

  // 3. Convocatoria
  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
    </svg>
  `, 'sigic-convocatoria.png', '#60a5fa');
  createDesktopLauncher('Convocatoria', 'Despacho de invitaciones y accesos OTP', 'chromium --lang=es-AR --app="http://localhost:3000/?modulo=convocatoria"', 'sigic-convocatoria.png', '3-Convocatoria.desktop');

  // 4. Preparación (Anfiteatro)
  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/>
      <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"/>
      <path d="M5 18v2"/><path d="M19 18v2"/>
    </svg>
  `, 'sigic-preparacion.png', '#22d3ee');
  createDesktopLauncher('Preparación', 'Mapeo y asignación de butacas del anfiteatro', 'chromium --lang=es-AR --app="http://localhost:3000/?modulo=preparacion-ceremonia"', 'sigic-preparacion.png', '4-Preparacion.desktop');

  // 5. Acreditación
  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <line x1="7" x2="17" y1="12" y2="12"/>
    </svg>
  `, 'sigic-acreditacion.png', '#fbbf24');
  createDesktopLauncher('Acreditación', 'Control de ingreso y escaneo de credenciales QR', 'chromium --lang=es-AR --app="http://localhost:3000/?modulo=control-ingreso"', 'sigic-acreditacion.png', '5-Acreditacion.desktop');

  // 6. En vivo
  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  `, 'sigic-envivo.png', '#2dd4bf');
  createDesktopLauncher('En vivo', 'Monitor operativo en tiempo real del evento', 'chromium --lang=es-AR --app="http://localhost:3000/?modulo=estado-ceremonia"', 'sigic-envivo.png', '6-EnVivo.desktop');

  // 7. Reportes
  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
    </svg>
  `, 'sigic-reportes.png', '#c084fc');
  createDesktopLauncher('Reportes', 'Métricas, asistencia y exportación de datos', 'chromium --lang=es-AR --app="http://localhost:3000/?modulo=panel-reportes"', 'sigic-reportes.png', '7-Reportes.desktop');

  // 8. Ajustes
  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `, 'sigic-ajustes.png', '#94a3b8');
  createDesktopLauncher('Ajustes', 'Configuración de red, modo mantenimiento y sistema', 'chromium --lang=es-AR --app="http://localhost:3000/?modulo=ajustes"', 'sigic-ajustes.png', '8-Ajustes.desktop');

  // 9. Manual de Usuario
  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  `, 'sigic-manual.png', '#38bdf8');
  createDesktopLauncher('Manual de Usuario', 'Guía oficial de uso y soporte técnico', 'chromium --lang=es-AR --app="http://localhost:3000/manual"', 'sigic-manual.png', 'Manual de Usuario.desktop');

  // 10. Acerca del Equipo
  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  `, 'sigic-equipo.png', '#00e5ff');
  createDesktopLauncher('Acerca del Equipo', 'Práctica Profesionalizante 2026 — Instituto Beltrán', '/usr/local/bin/sigic-acerca-de', 'sigic-equipo.png', 'Acerca del Equipo.desktop');

  // 11. Portal General SiGIC
  const logoP = await sharp(LOGO_SRC).resize(90, 90).toBuffer();
  const iconGen = await sharp({
    create: { width: 128, height: 128, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
  .composite([
    { input: Buffer.from(`
      <svg width="128" height="128">
        <defs>
          <radialGradient id="bg" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stop-color="#0f3047"/>
            <stop offset="100%" stop-color="#03080e"/>
          </radialGradient>
        </defs>
        <rect x="8" y="8" width="112" height="112" rx="26" fill="url(#bg)" stroke="#00e5ff" stroke-width="2.5" stroke-opacity="0.9"/>
      </svg>
    `), top: 0, left: 0 },
    { input: logoP, top: 19, left: 19 }
  ])
  .png()
  .toBuffer();

  fs.writeFileSync(path.join(CHROOT_DIR, 'usr', 'share', 'pixmaps', 'sigic.png'), iconGen);
  fs.writeFileSync(path.join(CHROOT_DIR, 'usr', 'share', 'pixmaps', 'sigic-logo.png'), iconGen);
  fs.writeFileSync(path.join(CHROOT_DIR, 'opt', 'sigic', 'logo.png'), iconGen);
  createDesktopLauncher('SiGIC Portal', 'Acceso directo a la plataforma institucional', 'chromium --lang=es-AR --start-maximized http://localhost:3000/', 'sigic.png', 'SiGIC.desktop');

  console.log('>> ¡Sistema visual integral de SiGIC OS generado exitosamente!');
}

main().catch(err => {
  console.error('ERROR al generar assets:', err);
  process.exit(1);
});
