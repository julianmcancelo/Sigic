const path = require('path');
const fs = require('fs');
const sharp = require(path.join(__dirname, '..', 'codigo', 'plataforma', 'node_modules', 'sharp'));

const ROOT = path.resolve(__dirname);
const LOGO_OFICIAL = path.join(ROOT, '..', 'codigo', 'plataforma', 'public', 'logo-oficial.png');
const LOGO_FALLBACK = path.join(ROOT, 'plymouth-theme', 'logo.png');
const LOGO_SRC = fs.existsSync(LOGO_OFICIAL) ? LOGO_OFICIAL : LOGO_FALLBACK;
const OUT_DIR = path.join(ROOT, 'live-build');
const CHROOT_DIR = path.join(ROOT, 'live-build', 'config', 'includes.chroot');
const BG_DIR = path.join(CHROOT_DIR, 'usr', 'share', 'backgrounds', 'sigic');
const PLYMOUTH_DIR = path.join(ROOT, 'plymouth-theme');
const PLYMOUTH_CHROOT = path.join(CHROOT_DIR, 'usr', 'share', 'plymouth', 'themes', 'sigic');

const CREDITOS = 'Práctica Profesionalizante 2026 · Cancelo Julián · Alfonso Alan Alexis · Contreras Villalba Sol Heilin · Frassia Matías · Santillán Luis Gabriel';

async function main() {
  console.log('>> Generando sistema visual integral para SiGIC (100% Nativo - Logo Beltrán Auténtico)...');

  if (!fs.existsSync(LOGO_SRC)) {
    throw new Error('No se encontró el logo en: ' + LOGO_SRC);
  }

  const dirs = [
    OUT_DIR,
    BG_DIR,
    PLYMOUTH_DIR,
    PLYMOUTH_CHROOT,
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

  // Copiar logo oficial transparente puro a todos los destinos
  fs.copyFileSync(LOGO_SRC, path.join(PLYMOUTH_DIR, 'logo.png'));
  fs.copyFileSync(LOGO_SRC, path.join(PLYMOUTH_CHROOT, 'logo.png'));
  fs.copyFileSync(LOGO_SRC, path.join(CHROOT_DIR, 'opt', 'sigic', 'logo.png'));
  fs.copyFileSync(LOGO_SRC, path.join(CHROOT_DIR, 'usr', 'share', 'pixmaps', 'sigic-logo.png'));

  // =========================================================================
  // 1. BOOTLOADER SPLASH.PNG (640x480, PNG8 ColorType 3 - Sin palabra OS)
  // =========================================================================
  const logoBoot = await sharp(LOGO_SRC)
    .resize(90, 90, { fit: 'contain', background: { r: 3, g: 8, b: 14, alpha: 0 } })
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
      <text x="320" y="142" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="4">SiGIC</text>
      <text x="320" y="160" font-family="DejaVu Sans, Arial, sans-serif" font-size="9.5" font-weight="bold" fill="#38bdf8" text-anchor="middle" letter-spacing="1.5">INSTITUTO TECNOLÓGICO BELTRÁN</text>
      <line x1="180" y1="170" x2="460" y2="170" stroke="#154b66" stroke-width="1"/>
      <text x="320" y="465" font-family="DejaVu Sans, Arial, sans-serif" font-size="8.5" fill="#475569" text-anchor="middle">Práctica Profesionalizante 2026 · Sistema Institucional de Colaciones</text>
    </svg>
  `);

  const splashOut = path.join(OUT_DIR, 'splash.png');
  await sharp(svgBoot)
    .composite([{ input: logoBoot, top: 24, left: Math.round((640 - 90) / 2) }])
    .png({ palette: true, colours: 256, compressionLevel: 9 })
    .toFile(splashOut);

  // =========================================================================
  // 2. LOS 4 FONDOS DE PANTALLA OFICIALES (1920x1080 Full HD - Sin palabra OS)
  // =========================================================================
  const logoWall = await sharp(LOGO_SRC)
    .resize(136, 136, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  async function crearFondo(archivo, bgOuter, bgMid, bgInner, titleColor, subColor, instColor, footColor) {
    const svgWall = Buffer.from(`
      <svg width="1920" height="1080">
        <defs>
          <radialGradient id="wallGlow" cx="50%" cy="44%" r="52%">
            <stop offset="0%" stop-color="${bgInner}" stop-opacity="1"/>
            <stop offset="50%" stop-color="${bgMid}" stop-opacity="1"/>
            <stop offset="100%" stop-color="${bgOuter}" stop-opacity="1"/>
          </radialGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#wallGlow)"/>
        <circle cx="960" cy="405" r="185" fill="none" stroke="${subColor}" stroke-opacity="0.10" stroke-width="1.2"/>
        <circle cx="960" cy="405" r="260" fill="none" stroke="${subColor}" stroke-opacity="0.06" stroke-width="1"/>
        <text x="960" y="528" font-family="DejaVu Sans, Arial, sans-serif" font-size="44" font-weight="900" fill="${titleColor}" text-anchor="middle" letter-spacing="8">SiGIC</text>
        <text x="960" y="566" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" font-weight="bold" fill="${subColor}" text-anchor="middle" letter-spacing="3.5">SISTEMA DE GESTIÓN INSTITUCIONAL DE COLACIONES</text>
        <text x="960" y="596" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" font-weight="bold" fill="${instColor}" text-anchor="middle" letter-spacing="3">INSTITUTO TECNOLÓGICO BELTRÁN</text>
        <text x="960" y="1032" font-family="DejaVu Sans, Arial, sans-serif" font-size="12" font-weight="500" fill="${footColor}" text-anchor="middle">${CREDITOS}</text>
      </svg>
    `);

    const destino = path.join(BG_DIR, archivo);
    await sharp(svgWall)
      .composite([{ input: logoWall, top: 332, left: Math.round((1920 - 136) / 2) }])
      .png({ compressionLevel: 9 })
      .toFile(destino);
    console.log(`✓ Fondo ${archivo} generado`);
  }

  await crearFondo('fondo.png', '#020710', '#061527', '#0c2b4b', '#ffffff', '#38bdf8', '#7dd3fc', '#475569');
  await crearFondo('fondo-navy.png', '#020409', '#060d1a', '#0c1930', '#f8fafc', '#60a5fa', '#94a3b8', '#475569');
  await crearFondo('fondo-cobalto.png', '#04091a', '#0c1c44', '#17337a', '#ffffff', '#38bdf8', '#93c5fd', '#64748b');
  await crearFondo('fondo-pearl.png', '#cbd5e1', '#e2e8f0', '#f8fafc', '#0f172a', '#0284c7', '#334155', '#64748b');

  // =========================================================================
  // 3. ICONOS Y LANZADORES 100% NATIVOS (SIN CHROMIUM)
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

    fs.writeFileSync(path.join(CHROOT_DIR, 'usr', 'share', 'pixmaps', filename), icon128);
    const icon48 = await sharp(icon128).resize(48, 48).png().toBuffer();
    fs.writeFileSync(path.join(CHROOT_DIR, 'usr', 'share', 'icons', 'hicolor', '48x48', 'apps', filename), icon48);
    fs.writeFileSync(path.join(CHROOT_DIR, 'usr', 'share', 'icons', 'hicolor', '128x128', 'apps', filename), icon128);
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
StartupNotify=false
`;
    fs.writeFileSync(path.join(CHROOT_DIR, 'etc', 'skel', 'Desktop', desktopFilename), content, 'utf8');
    fs.writeFileSync(path.join(CHROOT_DIR, 'usr', 'share', 'applications', desktopFilename), content, 'utf8');
  }

  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 2v4"/><path d="M16 2v4"/>
      <rect width="18" height="18" x="3" y="4" rx="2"/>
      <path d="M3 10h18"/><path d="M10 16h4"/><path d="M12 14v4"/>
    </svg>
  `, 'sigic-ceremonias.png', '#818cf8');
  createDesktopLauncher('Ceremonias', 'Gestión de actos y eventos académicos', '/usr/local/bin/sigic-ceremonias', 'sigic-ceremonias.png', '1-Ceremonias.desktop');

  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
      <path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
    </svg>
  `, 'sigic-graduados.png', '#34d399');
  createDesktopLauncher('Graduados', 'Padrón de egresados e importación masiva', '/usr/local/bin/sigic-graduados', 'sigic-graduados.png', '2-Graduados.desktop');

  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
    </svg>
  `, 'sigic-convocatoria.png', '#60a5fa');
  createDesktopLauncher('Convocatoria', 'Despacho de invitaciones y accesos OTP', '/usr/local/bin/sigic-convocatoria', 'sigic-convocatoria.png', '3-Convocatoria.desktop');

  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/>
      <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"/>
      <path d="M5 18v2"/><path d="M19 18v2"/>
    </svg>
  `, 'sigic-preparacion.png', '#22d3ee');
  createDesktopLauncher('Preparación', 'Mapeo y asignación de butacas del anfiteatro', '/usr/local/bin/sigic-preparacion', 'sigic-preparacion.png', '4-Preparacion.desktop');

  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <line x1="7" x2="17" y1="12" y2="12"/>
    </svg>
  `, 'sigic-acreditacion.png', '#fbbf24');
  createDesktopLauncher('Acreditación', 'Control de ingreso y escaneo de credenciales QR', '/usr/local/bin/sigic-acreditacion', 'sigic-acreditacion.png', '5-Acreditacion.desktop');

  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  `, 'sigic-envivo.png', '#2dd4bf');
  createDesktopLauncher('En vivo', 'Monitor operativo en tiempo real del evento', '/usr/local/bin/sigic-envivo', 'sigic-envivo.png', '6-EnVivo.desktop');

  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
    </svg>
  `, 'sigic-reportes.png', '#c084fc');
  createDesktopLauncher('Reportes', 'Métricas, asistencia y exportación de datos', '/usr/local/bin/sigic-reportes', 'sigic-reportes.png', '7-Reportes.desktop');

  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `, 'sigic-ajustes.png', '#94a3b8');
  createDesktopLauncher('Ajustes', 'Configuración de fondos oficiales, mantenimiento y sistema', '/usr/local/bin/sigic-ajustes', 'sigic-ajustes.png', '8-Ajustes.desktop');

  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  `, 'sigic-manual.png', '#38bdf8');
  createDesktopLauncher('Manual de Usuario', 'Guía oficial de uso y soporte técnico', '/usr/local/bin/sigic-manual', 'sigic-manual.png', 'Manual de Usuario.desktop');

  await createModuleIcon(`
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  `, 'sigic-equipo.png', '#00e5ff');
  createDesktopLauncher('Acerca del Equipo', 'Práctica Profesionalizante 2026 — Instituto Beltrán', '/usr/local/bin/sigic-acerca-de', 'sigic-equipo.png', 'Acerca del Equipo.desktop');

  const logoP = await sharp(LOGO_SRC).resize(86, 86, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
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
    { input: logoP, top: 21, left: 21 }
  ])
  .png()
  .toBuffer();

  fs.writeFileSync(path.join(CHROOT_DIR, 'usr', 'share', 'pixmaps', 'sigic.png'), iconGen);
  createDesktopLauncher('SiGIC Portal', 'Centro de Control Institucional de SiGIC', '/usr/local/bin/sigic-inicio', 'sigic.png', 'SiGIC.desktop');

  // =========================================================================
  // 4. PLYMOUTH BOOT SPLASH (Sin palabra OS)
  // =========================================================================
  const logoPlymouthCenter = await sharp(LOGO_SRC)
    .resize(110, 110, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const svgSplashCenter = Buffer.from(`
    <svg width="600" height="320">
      <defs>
        <radialGradient id="glowCenter" cx="50%" cy="30%" r="45%">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.32"/>
          <stop offset="60%" stop-color="#0284c7" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="dividerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00e5ff" stop-opacity="0"/>
          <stop offset="50%" stop-color="#00e5ff" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#00e5ff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <circle cx="300" cy="85" r="140" fill="url(#glowCenter)"/>
      <text x="300" y="192" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="6">SiGIC</text>
      <text x="300" y="220" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" font-weight="bold" fill="#38bdf8" text-anchor="middle" letter-spacing="2.2">INSTITUTO TECNOLÓGICO BELTRÁN</text>
      <line x1="160" y1="234" x2="440" y2="234" stroke="url(#dividerGrad)" stroke-width="1.2"/>
      <text x="300" y="254" font-family="DejaVu Sans, Arial, sans-serif" font-size="9.5" font-weight="bold" fill="#7dd3fc" text-anchor="middle" letter-spacing="1.5">SISTEMA DE GESTIÓN INSTITUCIONAL DE COLACIONES</text>
      <text x="300" y="295" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" font-weight="500" fill="#94a3b8" text-anchor="middle">Iniciando plataforma institucional y servicios locales...</text>
    </svg>
  `);

  const splashCenterBuf = await sharp(svgSplashCenter)
    .composite([{ input: logoPlymouthCenter, top: 24, left: Math.round((600 - 110) / 2) }])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(PLYMOUTH_DIR, 'splash_center.png'), splashCenterBuf);

  for (const archivo of fs.readdirSync(PLYMOUTH_DIR)) {
    if (archivo.endsWith('.png') || archivo.endsWith('.plymouth') || archivo.endsWith('.script')) {
      fs.copyFileSync(path.join(PLYMOUTH_DIR, archivo), path.join(PLYMOUTH_CHROOT, archivo));
    }
  }

  console.log('>> ¡Sistema visual integral de SiGIC generado exitosamente!');
}

main().catch(err => {
  console.error('ERROR al generar assets:', err);
  process.exit(1);
});
