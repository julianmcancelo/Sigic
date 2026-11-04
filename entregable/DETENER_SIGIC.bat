@echo off
title SiGIC - Detener Sistema
cls
color 0E
echo ============================================================
echo   Deteniendo contenedores de SiGIC...
echo ============================================================
echo.
docker compose down
echo.
color 0A
echo [OK] Servicios detenidos y memoria liberada correctamente.
echo.
pause