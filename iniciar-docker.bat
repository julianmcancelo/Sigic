@echo off
setlocal EnableDelayedExpansion
chcp 65001 > nul
title SiGIC · Centro de Control Docker - Instituto Tecnológico Beltrán
mode con: cols=92 lines=34
color 0B

rem Configurar colores ANSI
set "ESC="
for /F %%a in ('"prompt $E$S & for %%b in (1) do rem"') do set "ESC=%%a"

set "C_RESET=%ESC%[0m"
set "C_BOLD=%ESC%[1m"
set "C_CYAN=%ESC%[38;2;56;189;248m"
set "C_BLUE=%ESC%[38;2;14;165;233m"
set "C_DARKBLUE=%ESC%[38;2;2;132;199m"
set "C_WHITE=%ESC%[38;2;255;255;255m"
set "C_GRAY=%ESC%[38;2;148;163;184m"
set "C_DARKGRAY=%ESC%[38;2;71;85;105m"
set "C_GREEN=%ESC%[38;2;52;211;153m"
set "C_YELLOW=%ESC%[38;2;251;191;36m"
set "C_RED=%ESC%[38;2;248;113;113m"
set "BG_BLUE=%ESC%[48;2;0;32;56m"

rem Agregar Docker al PATH si esta en AppData
set "DOCKER_BIN=C:\Users\Julian\AppData\Local\Programs\DockerDesktop\resources\bin"
if exist "%DOCKER_BIN%\docker.exe" (
    set "PATH=%DOCKER_BIN%;%PATH%"
)

:menuPrincipal
cls
echo %BG_BLUE%%C_WHITE%                                                                                            %C_RESET%
echo %BG_BLUE%%C_CYAN%%C_BOLD%   ███████╗██╗ ██████╗ ██╗ ██████╗     CENTRO DE CONTROL DOCKER                       %C_RESET%
echo %BG_BLUE%%C_CYAN%%C_BOLD%   ██╔════╝██║██╔════╝ ██║██╔════╝     Sistema de Gestión Institucional de Colaciones %C_RESET%
echo %BG_BLUE%%C_BLUE%   ███████╗██║██║  ███╗██║██║          Instituto Tecnológico Beltrán                  %C_RESET%
echo %BG_BLUE%%C_BLUE%   ╚════██║██║██║   ██║██║██║          Tecnicatura Superior en Analista de Sistemas   %C_RESET%
echo %BG_BLUE%%C_DARKBLUE%   ███████║██║╚██████╔╝██║╚██████╗     Promoción 2026 · Entorno Contenerizado         %C_RESET%
echo %BG_BLUE%%C_WHITE%                                                                                            %C_RESET%
echo.

rem Chequeo rapido de estado del daemon
docker info >nul 2>nul
if %errorlevel% equ 0 (
    echo    %C_GRAY%Estado Docker:%C_RESET%  %C_GREEN%● MOTOR ACTIVO Y CONECTADO (WSL2 / Engine 29.9)%C_RESET%
) else (
    echo    %C_GRAY%Estado Docker:%C_RESET%  %C_YELLOW%▲ MOTOR INACTIVO O INICIANDO%C_RESET%
)

rem Chequeo de contenedores activos
for /f %%i in ('docker ps -q --filter "name=sigic" 2^>nul ^| find /c /v ""') do set "CONT_ACTIVOS=%%i"
if "%CONT_ACTIVOS%"=="" set "CONT_ACTIVOS=0"
if %CONT_ACTIVOS% gtr 0 (
    echo    %C_GRAY%Contenedores:%C_RESET%   %C_CYAN%● %CONT_ACTIVOS% servicio(s) en ejecución en http://localhost:3000%C_RESET%
) else (
    echo    %C_GRAY%Contenedores:%C_RESET%   %C_DARKGRAY%○ Ningún contenedor de SiGIC corriendo actualmente%C_RESET%
)

echo %C_DARKGRAY%   ───────────────────────────────────────────────────────────────────────────────────────%C_RESET%
echo.
echo    %C_BOLD%%C_WHITE%DESPLIEGUE Y OPERACIÓN:%C_RESET%
echo.
echo    %C_CYAN%[1]%C_RESET% %C_WHITE%Modo Autónomo Local%C_RESET%   %C_GRAY%Plataforma Web + Base PostgreSQL 16 (100%% Offline)%C_RESET%
echo    %C_CYAN%[2]%C_RESET% %C_WHITE%Modo Híbrido Cloud%C_RESET%    %C_GRAY%Plataforma Web conectada a Neon Cloud (.env.local)%C_RESET%
echo    %C_CYAN%[3]%C_RESET% %C_WHITE%Abrir en Navegador%C_RESET%    %C_GRAY%Ingresar a http://localhost:3000 (Plataforma SiGIC)%C_RESET%
echo.
echo    %C_BOLD%%C_WHITE%MONITOREO Y GESTIÓN:%C_RESET%
echo.
echo    %C_CYAN%[4]%C_RESET% %C_WHITE%Ver Logs en Tiempo Real%C_RESET%  %C_GRAY%Consola interactiva de peticiones y base de datos%C_RESET%
echo    %C_CYAN%[5]%C_RESET% %C_WHITE%Estado de Contenedores%C_RESET%   %C_GRAY%Listar CPU, memoria, puertos y nombres de servicio%C_RESET%
echo    %C_CYAN%[6]%C_RESET% %C_YELLOW%Detener Contenedores%C_RESET%    %C_GRAY%Apagar servicios sin borrar datos almacenados%C_RESET%
echo    %C_CYAN%[7]%C_RESET% %C_RED%Recompilar Todo (Clean)%C_RESET% %C_GRAY%Reconstrucción limpia sin caché de imágenes%C_RESET%
echo    %C_CYAN%[0]%C_RESET% %C_DARKGRAY%Salir%C_RESET%
echo.
echo %C_DARKGRAY%   ───────────────────────────────────────────────────────────────────────────────────────%C_RESET%
set /p opcion="   %C_BOLD%%C_CYAN%Seleccioná una opción [1-7]: %C_RESET%"

if "%opcion%"=="1" goto :opcionLocal
if "%opcion%"=="2" goto :opcionCloud
if "%opcion%"=="3" goto :opcionNavegador
if "%opcion%"=="4" goto :opcionLogs
if "%opcion%"=="5" goto :opcionEstado
if "%opcion%"=="6" goto :opcionDetener
if "%opcion%"=="7" goto :opcionRebuild
if "%opcion%"=="0" exit /b 0

echo.
echo    %C_RED%Opción no válida. Presioná una tecla para reintentar...%C_RESET%
pause >nul
goto :menuPrincipal

:opcionLocal
cls
echo.
echo    %C_CYAN%========================================================================%C_RESET%
echo    %C_WHITE%%C_BOLD%  INICIANDO SiGIC EN MODO AUTÓNOMO LOCAL (OFFLINE)%C_RESET%
echo    %C_GRAY%  Plataforma Web (Next.js 16) + PostgreSQL 16 con esquema automático%C_RESET%
echo    %C_CYAN%========================================================================%C_RESET%
echo.
docker compose -f docker-compose.yml up --build -d
echo.
if %errorlevel% equ 0 (
    echo    %C_GREEN%[OK] Servicios desplegados correctamente!%C_RESET%
    echo    %C_WHITE%Accedé desde tu navegador en:%C_RESET% %C_CYAN%%C_BOLD%http://localhost:3000%C_RESET%
    echo.
    echo    %C_GRAY%Deseas abrir la plataforma en el navegador ahora mismo? (S/N)%C_RESET%
    set /p abrirNav="   > "
    if /i "!abrirNav!"=="S" start http://localhost:3000
) else (
    echo    %C_RED%[ERROR] Hubo un problema al iniciar los contenedores.%C_RESET%
)
echo.
echo    Presioná una tecla para volver al menú...
pause >nul
goto :menuPrincipal

:opcionCloud
cls
echo.
echo    %C_CYAN%========================================================================%C_RESET%
echo    %C_WHITE%%C_BOLD%  INICIANDO SiGIC EN MODO HÍBRIDO (NEON CLOUD)%C_RESET%
echo    %C_GRAY%  Plataforma Web conectada a la base de datos de producción Neon%C_RESET%
echo    %C_CYAN%========================================================================%C_RESET%
echo.
docker compose -f docker-compose.cloud.yml up --build -d
echo.
if %errorlevel% equ 0 (
    echo    %C_GREEN%[OK] Contenedor Web iniciado y vinculado a Neon Cloud!%C_RESET%
    echo    %C_WHITE%Accedé desde tu navegador en:%C_RESET% %C_CYAN%%C_BOLD%http://localhost:3000%C_RESET%
    echo.
    echo    %C_GRAY%Deseas abrir la plataforma en el navegador ahora mismo? (S/N)%C_RESET%
    set /p abrirNav="   > "
    if /i "!abrirNav!"=="S" start http://localhost:3000
) else (
    echo    %C_RED%[ERROR] Hubo un problema al iniciar el contenedor web.%C_RESET%
)
echo.
echo    Presioná una tecla para volver al menú...
pause >nul
goto :menuPrincipal

:opcionNavegador
start http://localhost:3000
goto :menuPrincipal

:opcionLogs
cls
echo.
echo    %C_CYAN%========================================================================%C_RESET%
echo    %C_WHITE%%C_BOLD%  LOGS EN VIVO DE SiGIC (Presioná Ctrl+C para salir de los logs)%C_RESET%
echo    %C_CYAN%========================================================================%C_RESET%
echo.
docker compose logs -f
goto :menuPrincipal

:opcionEstado
cls
echo.
echo    %C_CYAN%========================================================================%C_RESET%
echo    %C_WHITE%%C_BOLD%  ESTADO ACTUAL DE LOS CONTENEDORES SiGIC%C_RESET%
echo    %C_CYAN%========================================================================%C_RESET%
echo.
docker ps -a --filter "name=sigic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Size}}"
echo.
echo    Presioná una tecla para volver al menú...
pause >nul
goto :menuPrincipal

:opcionDetener
cls
echo.
echo    %C_YELLOW%Deteniendo todos los contenedores de SiGIC...%C_RESET%
docker compose -f docker-compose.yml down
docker compose -f docker-compose.cloud.yml down
echo.
echo    %C_GREEN%[OK] Todos los contenedores fueron detenidos con éxito.%C_RESET%
echo.
echo    Presioná una tecla para volver al menú...
pause >nul
goto :menuPrincipal

:opcionRebuild
cls
echo.
echo    %C_RED%========================================================================%C_RESET%
echo    %C_WHITE%%C_BOLD%  RECOMPILACIÓN TOTAL LIMPIA (NO-CACHE)%C_RESET%
echo    %C_GRAY%  Esto descargará y reconstruirá la imagen desde cero%C_RESET%
echo    %C_RED%========================================================================%C_RESET%
echo.
docker compose -f docker-compose.yml build --no-cache
echo.
echo    %C_GREEN%[OK] Recompilación limpia finalizada.%C_RESET%
echo.
echo    Presioná una tecla para volver al menú...
pause >nul
goto :menuPrincipal
