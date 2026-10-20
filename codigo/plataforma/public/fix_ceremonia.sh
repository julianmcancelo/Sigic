sudo -u postgres psql -d sigic << 'EOF'
UPDATE ceremonias SET activa = 0;
INSERT INTO ceremonias (nombre, fecha, lugar, activa)
VALUES ('Colación TSAS - Prácticas Profesionalizantes III.', '2026-10-16', 'Sede Beltrán Avellaneda', 1);
EOF