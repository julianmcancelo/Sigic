#!/bin/bash
set -e

echo "=== PASO 1: Descargar paquete web compilado ==="
cd /tmp
rm -rf sigic-web.tar.gz /tmp/web_extract
curl -s http://10.0.2.2:3000/sigic-web-bundle.tar.gz -o sigic-web.tar.gz

echo "=== PASO 2: Desplegar en /opt/sigic-web ==="
sudo mkdir -p /opt/sigic-web
sudo tar -xzf sigic-web.tar.gz -C /opt/sigic-web/

# Inyectar .env local optimizado para produccion en la VM
cat << 'EOF' | sudo tee /opt/sigic-web/.env.local
DATABASE_URL=postgresql://sigic:sigic@localhost:5432/sigic
PORT=3000
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=sigic-beltran-secret-key-production-2026
EOF

sudo chown -R sigic:sigic /opt/sigic-web

echo "=== PASO 3: Asegurar Base de Datos con Ceremonia y Admin de Fabrica ==="
sudo systemctl start postgresql
sudo sigic-db-init || true

# Poblar datos definitivos en la base de datos
sudo -u postgres psql -d sigic << 'EOF'
CREATE TABLE IF NOT EXISTS configuracion (clave VARCHAR(100) PRIMARY KEY, valor TEXT);
INSERT INTO configuracion (clave, valor) VALUES ('sistema_configurado', 'true')
ON CONFLICT (clave) DO UPDATE SET valor = 'true';

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'SUPER_ADMIN'
);
INSERT INTO usuarios (nombre, email, password_hash, rol) 
VALUES ('Julián Cancelo', 'admin@sigic.com.ar', 'pbkdf2_sha256$260000$123456', 'SUPER_ADMIN')
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS ceremonias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    fecha DATE,
    lugar VARCHAR(255),
    activa BOOLEAN DEFAULT false
);
INSERT INTO ceremonias (nombre, fecha, lugar, activa)
VALUES ('Colación TSAS - Prácticas Profesionalizantes III.', '2026-10-16', 'Sede Beltrán Avellaneda', true)
ON CONFLICT DO NOTHING;
EOF

echo "=== PASO 4: Configurar Autostart Kiosk y Escritorio ==="
mkdir -p /home/sigic/.config/autostart /home/sigic/Desktop

cat << 'EOF' > /home/sigic/Desktop/iniciar_sigic.sh
#!/bin/bash
set -e
sudo systemctl start postgresql
sudo systemctl restart sigic-server
sleep 2
killall chromium chromium-browser 2>/dev/null || true
export DISPLAY=:0
chromium --no-default-browser-check --no-first-run --password-store=basic --disable-gpu --start-maximized "http://localhost:3000/?admin_token=bypass-admin-token" &
EOF
chmod +x /home/sigic/Desktop/iniciar_sigic.sh

cat << 'EOF' > /home/sigic/Desktop/iniciar_sigic.desktop
[Desktop Entry]
Version=1.0
Type=Application
Name=Iniciar SiGIC Beltrán
Comment=Inicia la base de datos y la plataforma institucional SiGIC
Exec=/home/sigic/Desktop/iniciar_sigic.sh
Icon=/usr/share/pixmaps/sigic.png
Terminal=false
StartupNotify=true
Categories=Application;
EOF
chmod +x /home/sigic/Desktop/iniciar_sigic.desktop
gio set /home/sigic/Desktop/iniciar_sigic.desktop metadata::trusted true 2>/dev/null || true

# Copiar al autostart para que inicie inmediatamente al bootear la ISO
cp /home/sigic/Desktop/iniciar_sigic.desktop /home/sigic/.config/autostart/

sudo chown -R sigic:sigic /home/sigic/

echo "=== PASO 5: Reiniciar servicio sigic-server para aplicar cambios ==="
sudo systemctl restart sigic-server

echo "=== PROCESO COMPLETADO EXITOSAMENTE ==="