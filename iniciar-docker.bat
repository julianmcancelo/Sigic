@echo off
chcp 65001 > nul
title SiGIC - Despliegue con Docker

echo =====================================================================
echo  SiGIC · Sistema de Gestión Institucional de Colaciones
echo  Instituto Tecnológico Beltrán - Analista de Sistemas
echo =====================================================================
echo.

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker no se encuentra instalado o no está en el PATH de Windows.
    echo Por favor, instalá Docker Desktop desde: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

echo Seleccioná el modo de inicio de SiGIC:
echo.
echo [1] Iniciar TODO LOCAL (Plataforma Web + Base de Datos PostgreSQL local aislada)
echo [2] Iniciar SOLO WEB conectado a Neon Cloud (.env.local existente)
echo [3] Detener todos los contenedores de SiGIC
echo [4] Ver logs en vivo
echo.
set /p opcion="Opción (1/2/3/4): "

if "%opcion%"=="1" (
    echo.
    echo Levantando SiGIC en modo autónomo local...
    docker compose -f docker-compose.yml up --build -d
    echo.
    echo =====================================================================
    echo  SiGIC iniciado con éxito!
    echo  Abrí tu navegador en: http://localhost:3000
    echo =====================================================================
    echo.
    pause
    exit /b 0
)

if "%opcion%"=="2" (
    echo.
    echo Levantando SiGIC conectado a la nube Neon...
    docker compose -f docker-compose.cloud.yml up --build -d
    echo.
    echo =====================================================================
    echo  SiGIC iniciado con éxito en la nube!
    echo  Abrí tu navegador en: http://localhost:3000
    echo =====================================================================
    echo.
    pause
    exit /b 0
)

if "%opcion%"=="3" (
    echo.
    echo Deteniendo contenedores de SiGIC...
    docker compose -f docker-compose.yml down
    docker compose -f docker-compose.cloud.yml down
    echo Contenedores detenidos.
    pause
    exit /b 0
)

if "%opcion%"=="4" (
    docker compose logs -f
    exit /b 0
)

echo Opción no válida.
pause
