@echo off
setlocal EnableDelayedExpansion
chcp 65001 > nul
title SiGIC - Despliegue con Docker

echo =====================================================================
echo  SiGIC · Sistema de Gestión Institucional de Colaciones
echo  Instituto Tecnológico Beltrán - Analista de Sistemas
echo =====================================================================
echo.

rem 1. Asegurar Docker en PATH (ruta de usuario o del sistema)
set "DOCKER_BIN=C:\Users\Julian\AppData\Local\Programs\DockerDesktop\resources\bin"
if exist "%DOCKER_BIN%\docker.exe" (
    set "PATH=%DOCKER_BIN%;%PATH%"
)

rem 2. Verificar comando docker
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo encontrar docker.exe en tu sistema.
    echo Asegurate de que Docker Desktop este instalado.
    echo.
    pause
    exit /b 1
)

rem 3. Verificar si el motor (daemon) de Docker Desktop esta encendido
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [AVISO] El motor de Docker Desktop no esta respondiendo o esta apagado.
    echo Intentando abrir Docker Desktop automaticamente...
    start "" "C:\Users\Julian\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
    echo.
    echo Esperando a que el motor de Docker termine de iniciar (puede tardar 15-30 seg)...
    :esperarDocker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>nul
    if %errorlevel% neq 0 (
        echo  ^> Todavia iniciando Docker Desktop...
        goto esperarDocker
    )
    echo [OK] Motor de Docker Desktop conectado correctamente!
    echo.
)

echo Selecciona el modo de inicio de SiGIC:
echo.
echo [1] Iniciar TODO LOCAL (Plataforma Web + Base de Datos PostgreSQL local aislada)
echo [2] Iniciar SOLO WEB conectado a Neon Cloud (.env.local existente)
echo [3] Detener todos los contenedores de SiGIC
echo [4] Ver logs en vivo
echo.
set /p opcion="Opcion (1/2/3/4): "

if "%opcion%"=="1" (
    echo.
    echo Levantando SiGIC en modo autonomo local...
    docker compose -f docker-compose.yml up --build -d
    echo.
    echo =====================================================================
    echo  SiGIC iniciado con exito!
    echo  Abri tu navegador en: http://localhost:3000
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
    echo  SiGIC iniciado con exito en la nube!
    echo  Abri tu navegador en: http://localhost:3000
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

echo Opcion no valida.
pause
