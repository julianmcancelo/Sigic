@echo off
setlocal
chcp 65001 > nul
title SiGIC - Centro de Control Docker (Instituto Tecnologico Beltran)
mode con: cols=92 lines=34
color 0B

rem Agregar Docker al PATH si esta en AppData
set "DOCKER_BIN=C:\Users\Julian\AppData\Local\Programs\DockerDesktop\resources\bin"
if exist "%DOCKER_BIN%\docker.exe" (
    set "PATH=%DOCKER_BIN%;%PATH%"
)

:menuPrincipal
cls
echo ============================================================================================
echo   SiGIC  ^|  CENTRO DE CONTROL DOCKER
echo   Sistema de Gestion Institucional de Colaciones  -  Instituto Tecnologico Beltran
echo   Tecnicatura Superior en Analista de Sistemas   -  Promocion 2026
echo ============================================================================================
echo.

rem Chequeo rapido de estado del daemon
docker info >nul 2>nul
if %errorlevel% equ 0 (
    echo    Estado Docker:   [ACTIVO] Motor de Docker Desktop conectado correctamente
) else (
    echo    Estado Docker:   [AVISO] Motor de Docker Desktop apagado o iniciando
)

echo    URL Plataforma:  http://localhost:3000
echo    -----------------------------------------------------------------------------------------
echo.
echo    DESPLIEGUE Y OPERACION:
echo.
echo    [1] Modo Autonomo Local   (Plataforma Web + Base PostgreSQL 16 - 100%% Offline)
echo    [2] Modo Hibrido Cloud    (Plataforma Web conectada a Neon Cloud .env.local)
echo    [3] Abrir en Navegador    (http://localhost:3000)
echo.
echo    MONITOREO Y GESTION:
echo.
echo    [4] Ver Logs en Vivo      (Peticiones web y base de datos)
echo    [5] Estado de Servicios   (Listar contenedores activos)
echo    [6] Detener Contenedores  (Apagar servicios sin borrar datos)
echo    [7] Recompilar Imagen     (Reconstruccion limpia)
echo    [0] Salir
echo.
echo    -----------------------------------------------------------------------------------------
set /p opcion="   Selecciona una opcion [1-7]: "

if "%opcion%"=="1" goto :opcionLocal
if "%opcion%"=="2" goto :opcionCloud
if "%opcion%"=="3" goto :opcionNavegador
if "%opcion%"=="4" goto :opcionLogs
if "%opcion%"=="5" goto :opcionEstado
if "%opcion%"=="6" goto :opcionDetener
if "%opcion%"=="7" goto :opcionRebuild
if "%opcion%"=="0" exit /b 0

echo.
echo    Opcion no valida. Presiona una tecla para reintentar...
pause >nul
goto :menuPrincipal

:opcionLocal
cls
echo.
echo    ========================================================================
echo      INICIANDO SiGIC EN MODO AUTONOMO LOCAL (OFFLINE)
echo      Plataforma Web (Next.js 16) + PostgreSQL 16 con esquema oficial
echo    ========================================================================
echo.
docker compose -f docker-compose.yml up --build -d
echo.
if %errorlevel% equ 0 (
    echo    [OK] Servicios desplegados correctamente!
    echo    Accede desde tu navegador en: http://localhost:3000
    echo.
    echo    Deseas abrir la plataforma en el navegador ahora mismo? (S/N)
    set /p abrirNav="   > "
    if /i "%abrirNav%"=="S" start http://localhost:3000
) else (
    echo    [ERROR] Hubo un problema al iniciar los contenedores.
)
echo.
echo    Presiona una tecla para volver al menu...
pause >nul
goto :menuPrincipal

:opcionCloud
cls
echo.
echo    ========================================================================
echo      INICIANDO SiGIC EN MODO HIBRIDO (NEON CLOUD)
echo      Plataforma Web conectada a la base de datos de produccion Neon
echo    ========================================================================
echo.
docker compose -f docker-compose.cloud.yml up --build -d
echo.
if %errorlevel% equ 0 (
    echo    [OK] Contenedor Web iniciado y vinculado a Neon Cloud!
    echo    Accede desde tu navegador en: http://localhost:3000
    echo.
    echo    Deseas abrir la plataforma en el navegador ahora mismo? (S/N)
    set /p abrirNav="   > "
    if /i "%abrirNav%"=="S" start http://localhost:3000
) else (
    echo    [ERROR] Hubo un problema al iniciar el contenedor web.
)
echo.
echo    Presiona una tecla para volver al menu...
pause >nul
goto :menuPrincipal

:opcionNavegador
start http://localhost:3000
goto :menuPrincipal

:opcionLogs
cls
echo.
echo    ========================================================================
echo      LOGS EN VIVO DE SiGIC (Presiona Ctrl+C para salir de los logs)
echo    ========================================================================
echo.
docker compose logs -f
goto :menuPrincipal

:opcionEstado
cls
echo.
echo    ========================================================================
echo      ESTADO ACTUAL DE LOS CONTENEDORES SiGIC
echo    ========================================================================
echo.
docker ps -a --filter "name=sigic"
echo.
echo    Presiona una tecla para volver al menu...
pause >nul
goto :menuPrincipal

:opcionDetener
cls
echo.
echo    Deteniendo todos los contenedores de SiGIC...
docker compose -f docker-compose.yml down
docker compose -f docker-compose.cloud.yml down
echo.
echo    [OK] Todos los contenedores fueron detenidos con exito.
echo.
echo    Presiona una tecla para volver al menu...
pause >nul
goto :menuPrincipal

:opcionRebuild
cls
echo.
echo    ========================================================================
echo      RECOMPILACION TOTAL LIMPIA (NO-CACHE)
echo    ========================================================================
echo.
docker compose -f docker-compose.yml build --no-cache
echo.
echo    [OK] Recompilacion finalizada.
echo.
echo    Presiona una tecla para volver al menu...
pause >nul
goto :menuPrincipal
