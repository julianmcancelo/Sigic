@echo off
chcp 65001 > nul
title SiGIC — Iniciar Sistema Dockerizado

echo =======================================================
echo     SiGIC — Sistema de Gestión Institucional de Colaciones
echo     Instituto Tecnológico Beltrán
echo =======================================================
echo.
echo Iniciando contenedores Docker (Base de Datos + Plataforma Web)...
echo.

docker compose up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =======================================================
    echo  [OK] SiGIC está ejecutándose correctamente
    echo  - Web SiGIC: http://localhost:3000
    echo  - Base de Datos (PostgreSQL): localhost:5432
    echo =======================================================
    echo.
    start http://localhost:3000
) else (
    echo.
    echo [ERROR] Hubo un problema al iniciar los contenedores.
    echo Verifique que Docker Desktop esté abierto y funcionando.
)

pause
