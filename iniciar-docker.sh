#!/usr/bin/env bash
# ==============================================================================
# Script de despliegue Docker para SiGIC (Linux / macOS / WSL)
# Instituto Tecnológico Beltrán
# ==============================================================================

set -e

if ! command -v docker &> /dev/null; then
    echo "Error: Docker no está instalado en este equipo."
    exit 1
fi

echo "====================================================================="
echo " SiGIC · Sistema de Gestión Institucional de Colaciones"
echo " Instituto Tecnológico Beltrán - Analista de Sistemas"
echo "====================================================================="
echo ""
echo "Seleccioná el modo de inicio:"
echo "1) Iniciar TODO LOCAL (Web + PostgreSQL 16 con esquema automático)"
echo "2) Iniciar SOLO WEB conectado a Neon Cloud"
echo "3) Detener contenedores"
echo "4) Ver logs en vivo"
echo ""
read -p "Opción [1-4]: " op

case "$op" in
  1)
    echo "Levantando SiGIC en modo local..."
    docker compose -f docker-compose.yml up --build -d
    echo "Listo! Ingresá en http://localhost:3000"
    ;;
  2)
    echo "Levantando SiGIC conectado a Neon Cloud..."
    docker compose -f docker-compose.cloud.yml up --build -d
    echo "Listo! Ingresá en http://localhost:3000"
    ;;
  3)
    echo "Deteniendo contenedores..."
    docker compose -f docker-compose.yml down
    docker compose -f docker-compose.cloud.yml down
    ;;
  4)
    docker compose logs -f
    ;;
  *)
    echo "Opción inválida."
    ;;
esac
