import os
import psycopg2

try:
    conn = psycopg2.connect("postgresql://sigic:sigic@localhost:5432/sigic")
    cur = conn.cursor()
    cur.execute("""
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
        VALUES ('Julián Cancelo', 'admin@sigic.com.ar', '123456', 'SUPER_ADMIN')
        ON CONFLICT (email) DO NOTHING;

        CREATE TABLE IF NOT EXISTS ceremonias (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            fecha DATE,
            lugar VARCHAR(255),
            activa BOOLEAN DEFAULT false
        );
        INSERT INTO ceremonias (nombre, fecha, lugar, activa)
        VALUES ('Colación TSAS - Prácticas Profesionalizantes III.', '2026-10-16', 'Sede Beltrán Avellaneda', true);
    """)
    conn.commit()
    conn.close()
    print("DB_CONFIGURADA_OK")
except Exception as e:
    print("ERROR:", e)