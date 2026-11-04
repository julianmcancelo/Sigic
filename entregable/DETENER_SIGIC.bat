@echo off
chcp 65001 > nul
title SiGIC — Detener Sistema

echo Deteniendo contenedores SiGIC...
docker compose down
echo [OK] Contenedores detenidos.
pause
