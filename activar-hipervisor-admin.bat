@echo off
setlocal
chcp 65001 > nul
title Activar Hipervisor de Windows para Docker (Administrador)

echo =====================================================================
echo  Activando Hipervisor de Windows para Docker Desktop
echo =====================================================================
echo.

rem Solicitar elevacion de administrador si no la tiene
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ELEVACION] Solicitando permisos de Administrador...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~dpnx0\"' -Verb RunAs"
    exit /b
)

echo 1. Habilitando lanzamiento automatico del Hipervisor...
bcdedit /set hypervisorlaunchtype auto

echo 2. Habilitando Plataforma de Maquina Virtual en Windows...
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart >nul

echo 3. Habilitando Subsistema de Windows para Linux (WSL)...
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart >nul

echo.
echo =====================================================================
echo  Listo! La configuracion del Hipervisor quedo activada.
echo.
echo  ATENCION: Windows requiere REINICIAR el equipo para encender
echo  el hipervisor y que Docker Desktop funcione.
echo =====================================================================
echo.
pause
