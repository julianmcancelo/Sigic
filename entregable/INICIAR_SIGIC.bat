@echo off
setlocal enabledelayedexpansion
title SiGIC - Instituto Tecnologico Beltran
cls
color 0B

echo ============================================================
echo   SiGIC - Sistema de Gestion Institucional de Colaciones
echo   Instituto Tecnologico Beltran
echo ============================================================
echo.

where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] No se encontro el comando docker en el sistema.
    echo Asegurese de tener Docker Desktop instalado.
    echo.
    pause
    exit /b 1
)

echo [1/2] Verificando estado de Docker Desktop...
docker info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Docker Desktop no esta abierto.
    echo Abra la aplicacion Docker Desktop y vuelva a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)

echo [2/2] Iniciando contenedores de SiGIC (Base de Datos + Web)...
echo.
docker compose up -d

if %ERRORLEVEL% EQU 0 (
    color 0A
    echo.
    echo ============================================================
    echo   [OK] SiGIC se inicio correctamente
    echo   - Plataforma Web : http://localhost:3000
    echo   - Base de Datos  : localhost:5432 (PostgreSQL)
    echo ============================================================
    echo.
    echo Abriendo SiGIC en el navegador...
    timeout /t 2 /nobreak >nul
    start http://localhost:3000
) else (
    color 0C
    echo.
    echo ============================================================
    echo   [ERROR] Ocurrio un fallo al levantar los contenedores.
    echo ============================================================
)

echo.
pause