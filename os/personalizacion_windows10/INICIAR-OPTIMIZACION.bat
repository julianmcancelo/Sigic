@echo off
setlocal EnableDelayedExpansion
title SiGIC OS - Iniciando Optimizacion

:: Comprobar privilegios de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Solicitando permisos de Administrador...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo ==============================================================================
echo        SiGIC OS - SUITE DE OPTIMIZACION Y PERSONALIZACION WINDOWS 10
echo                 Instituto Tecnologico Beltran (ITB)
echo ==============================================================================
echo.
echo Ejecutando script maestro en PowerShell con politicas de bypass...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Optimizar-SiGIC-OS.ps1"

pause
