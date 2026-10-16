const sharp = require('d:/Sigic/codigo/plataforma/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const LOGO_SRC = 'd:/Sigic/codigo/plataforma/public/logo-oficial.png';

async function generateAssets() {
  console.log('Generating wallpapers and splash images with authentic logo-oficial.png...');
  
  const logoBuf = fs.readFileSync(LOGO_SRC);

  // 1. Prepare resized logos
  // Logo for 1920x1080 wallpaper: height 140px (width will scale proportionally to ~140px)
  const logoWallpaper = await sharp(logoBuf).resize({ height: 140 }).png().toBuffer();
  // Logo for isolinux splash 640x480: height 90px
  const logoSplashBoot = await sharp(logoBuf).resize({ height: 90 }).png().toBuffer();
  // Logo for plymouth splash 600x320: height 90px
  const logoSplashPlymouth = await sharp(logoBuf).resize({ height: 90 }).png().toBuffer();

  const creditos = 'Práctica Profesionalizante 2026 · Cancelo Julián · Alfonso Alan Alexis · Contreras Villalba Sol Heilin · Frassia Matías · Santillán Luis Gabriel';

  // Helper for generating wallpaper
  async function makeWallpaper({ id, bgDark, glowColor, textColor, subColor, instColor, footColor, isLight }) {
    const W = 1920;
    const H = 1080;

    // SVG overlay for background radial glow and text
    const svgOverlay = `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="gradCenter" cx="50%" cy="42%" r="48%" fx="50%" fy="42%">
          <stop offset="0%" stop-color="${glowColor}" stop-opacity="${isLight ? '0.45' : '0.35'}"/>
          <stop offset="50%" stop-color="${glowColor}" stop-opacity="${isLight ? '0.15' : '0.10'}"/>
          <stop offset="100%" stop-color="${bgDark}" stop-opacity="1"/>
        </radialGradient>
      </defs>

      <!-- Radial background glow -->
      <rect width="${W}" height="${H}" fill="${bgDark}"/>
      <rect width="${W}" height="${H}" fill="url(#gradCenter)"/>

      <!-- Center subtle rings -->
      <circle cx="960" cy="380" r="180" fill="none" stroke="${glowColor}" stroke-width="1" opacity="${isLight ? '0.2' : '0.12'}"/>
      <circle cx="960" cy="380" r="260" fill="none" stroke="${glowColor}" stroke-width="1" opacity="${isLight ? '0.12' : '0.07'}"/>

      <!-- Typography -->
      <text x="960" y="525" font-family="DejaVu Sans, Arial, sans-serif" font-weight="900" font-size="46" fill="${textColor}" text-anchor="middle" letter-spacing="8">SiGIC</text>
      <text x="960" y="565" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="14" fill="${subColor}" text-anchor="middle" letter-spacing="3">SISTEMA DE GESTIÓN INSTITUCIONAL DE COLACIONES</text>
      <text x="960" y="595" font-family="DejaVu Sans, Arial, sans-serif" font-weight="600" font-size="12" fill="${instColor}" text-anchor="middle" letter-spacing="4">INSTITUTO TECNOLÓGICO BELTRÁN</text>

      <!-- Footer Credits -->
      <text x="960" y="1030" font-family="DejaVu Sans, Arial, sans-serif" font-weight="500" font-size="12" fill="${footColor}" text-anchor="middle" letter-spacing="1">${creditos}</text>
    </svg>
    `;

    // Composite logo at cx=960, top=310 (so center is ~380)
    // Logo width and height are 140x140
    const baseWithSvg = await sharp(Buffer.from(svgOverlay)).png().toBuffer();
    const finalWp = await sharp(baseWithSvg)
      .composite([
        {
          input: logoWallpaper,
          top: 310,
          left: 960 - 70
        }
      ])
      .png({ quality: 95 })
      .toBuffer();

    return finalWp;
  }

  // 1. Azul Beltrán Oficial (fondo.png)
  const wpBeltran = await makeWallpaper({
    id: 'beltran',
    bgDark: '#02070e',
    glowColor: '#0284c7',
    textColor: '#ffffff',
    subColor: '#00e5ff',
    instColor: '#38bdf8',
    footColor: '#475569',
    isLight: false
  });
  fs.writeFileSync('d:/Sigic/os-appliance/live-build/config/includes.chroot/usr/share/backgrounds/sigic/fondo.png', wpBeltran);

  // 2. Navy Medianoche (fondo-navy.png)
  const wpNavy = await makeWallpaper({
    id: 'navy',
    bgDark: '#030712',
    glowColor: '#1d4ed8',
    textColor: '#ffffff',
    subColor: '#60a5fa',
    instColor: '#93c5fd',
    footColor: '#334155',
    isLight: false
  });
  fs.writeFileSync('d:/Sigic/os-appliance/live-build/config/includes.chroot/usr/share/backgrounds/sigic/fondo-navy.png', wpNavy);

  // 3. Cobalto Ceremonial (fondo-cobalto.png)
  const wpCobalto = await makeWallpaper({
    id: 'cobalto',
    bgDark: '#070719',
    glowColor: '#4338ca',
    textColor: '#ffffff',
    subColor: '#818cf8',
    instColor: '#a5b4fc',
    footColor: '#3730a3',
    isLight: false
  });
  fs.writeFileSync('d:/Sigic/os-appliance/live-build/config/includes.chroot/usr/share/backgrounds/sigic/fondo-cobalto.png', wpCobalto);

  // 4. Claro Pearl (fondo-pearl.png)
  const wpPearl = await makeWallpaper({
    id: 'pearl',
    bgDark: '#f1f5f9',
    glowColor: '#38bdf8',
    textColor: '#0f172a',
    subColor: '#0284c7',
    instColor: '#0369a1',
    footColor: '#64748b',
    isLight: true
  });
  fs.writeFileSync('d:/Sigic/os-appliance/live-build/config/includes.chroot/usr/share/backgrounds/sigic/fondo-pearl.png', wpPearl);

  // 5. isolinux / syslinux boot splash (splash.png 640x480)
  const svgSplashBoot = `
  <svg width="640" height="480" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
    <rect width="640" height="480" fill="#02070e"/>
    <circle cx="320" cy="115" r="90" fill="#0284c7" opacity="0.22"/>
    <text x="320" y="210" font-family="DejaVu Sans, Arial, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle" letter-spacing="5">SiGIC</text>
    <text x="320" y="235" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="11" fill="#00e5ff" text-anchor="middle" letter-spacing="2">INSTITUTO TECNOLÓGICO BELTRÁN</text>
    <line x1="180" y1="248" x2="460" y2="248" stroke="#0284c7" stroke-width="1.5" opacity="0.7"/>
    <text x="320" y="455" font-family="DejaVu Sans, Arial, sans-serif" font-weight="normal" font-size="10" fill="#475569" text-anchor="middle">Práctica Profesionalizante 2026 · Sistema de Colaciones</text>
  </svg>
  `;
  const baseSplashBoot = await sharp(Buffer.from(svgSplashBoot)).png().toBuffer();
  const finalSplashBoot = await sharp(baseSplashBoot)
    .composite([
      {
        input: logoSplashBoot,
        top: 70,
        left: 320 - 45
      }
    ])
    .png()
    .toBuffer();
  fs.writeFileSync('d:/Sigic/os-appliance/live-build/splash.png', finalSplashBoot);

  // 6. Plymouth splash_center.png (600x320)
  const svgSplashCenter = `
  <svg width="600" height="320" viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg">
    <circle cx="300" cy="75" r="60" fill="#38bdf8" opacity="0.18"/>
    <text x="300" y="175" font-family="DejaVu Sans, Arial, sans-serif" font-weight="900" font-size="32" fill="#00e5ff" text-anchor="middle" letter-spacing="4">SiGIC</text>
    <text x="300" y="205" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="12" fill="#38bdf8" text-anchor="middle" letter-spacing="2">INSTITUTO TECNOLÓGICO BELTRÁN</text>
    <text x="300" y="230" font-family="DejaVu Sans, Arial, sans-serif" font-weight="600" font-size="10" fill="#94a3b8" text-anchor="middle" letter-spacing="1">SISTEMA DE GESTIÓN INSTITUCIONAL DE COLACIONES</text>
    <text x="300" y="295" font-family="DejaVu Sans, Arial, sans-serif" font-weight="normal" font-size="10" fill="#64748b" text-anchor="middle">Iniciando plataforma y servicios en memoria RAM...</text>
  </svg>
  `;
  const baseSplashCenter = await sharp(Buffer.from(svgSplashCenter)).png().toBuffer();
  const finalSplashCenter = await sharp(baseSplashCenter)
    .composite([
      {
        input: logoSplashPlymouth,
        top: 30,
        left: 300 - 45
      }
    ])
    .png()
    .toBuffer();

  fs.writeFileSync('d:/Sigic/os-appliance/live-build/config/includes.chroot/usr/share/plymouth/themes/sigic/splash_center.png', finalSplashCenter);
  fs.writeFileSync('d:/Sigic/os-appliance/plymouth-theme/splash_center.png', finalSplashCenter);

  // Also update logo-master.png and logo.png in themes
  fs.copyFileSync(LOGO_SRC, 'd:/Sigic/os-appliance/live-build/config/includes.chroot/opt/sigic/logo.png');
  fs.copyFileSync(LOGO_SRC, 'd:/Sigic/os-appliance/live-build/config/includes.chroot/usr/share/pixmaps/sigic-logo.png');
  fs.copyFileSync(LOGO_SRC, 'd:/Sigic/os-appliance/live-build/config/includes.chroot/usr/share/plymouth/themes/sigic/logo-master.png');
  fs.copyFileSync(LOGO_SRC, 'd:/Sigic/os-appliance/live-build/config/includes.chroot/usr/share/plymouth/themes/sigic/logo.png');
  fs.copyFileSync(LOGO_SRC, 'd:/Sigic/os-appliance/plymouth-theme/logo-master.png');
  fs.copyFileSync(LOGO_SRC, 'd:/Sigic/os-appliance/plymouth-theme/logo.png');

  console.log('All 4 official wallpapers, splash, and Plymouth assets successfully generated with authentic logo!');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
