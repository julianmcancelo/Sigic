@echo off
setlocal EnableDelayedExpansion
title SiGIC OS - Selector de Fondo Institucional Beltran

cd /d "%~dp0"

echo ==============================================================================
echo        SiGIC OS - SELECTOR DE FONDOS INSTITUCIONALES (10 TEMAS)
echo                 Instituto Tecnologico Beltran (ITB)
echo ==============================================================================
echo.
echo Selecciona el tema visual que deseas aplicar:
echo.
echo [1] Beltran Oficial (Azul Institucional Activo)
echo [2] Original
echo [3] Aurora
echo [4] Carbon
echo [5] Ceremonial
echo [6] Cybergrid
echo [7] Emerald
echo [8] Sapphire
echo [9] Sunset
echo [10] Alabaster
echo [0] Salir
echo.

set /p opcion="Ingresa el numero de opcion (1-10): "

set "tema="
if "%opcion%"=="1" set "tema=beltran.jpg"
if "%opcion%"=="2" set "tema=original.jpg"
if "%opcion%"=="3" set "tema=aurora.jpg"
if "%opcion%"=="4" set "tema=carbon.jpg"
if "%opcion%"=="5" set "tema=ceremonial.jpg"
if "%opcion%"=="6" set "tema=cybergrid.jpg"
if "%opcion%"=="7" set "tema=emerald.jpg"
if "%opcion%"=="8" set "tema=sapphire.jpg"
if "%opcion%"=="9" set "tema=sunset.jpg"
if "%opcion%"=="10" set "tema=alabaster.jpg"
if "%opcion%"=="0" exit /b

if not defined tema (
    echo Opcion invalida.
    pause
    exit /b
)

set "archivo=%~dp0recursos\wallpapers\%tema%"

if not exist "%archivo%" (
    echo [!] No se encontro el archivo: %archivo%
    pause
    exit /b
)

echo.
echo Aplicando fondo: %tema%...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$f = '%archivo%'.Replace('\','\\');" ^
  "Set-ItemProperty -Path 'HKCU:\Control Panel\Desktop' -Name wallpaper -Value '%archivo%';" ^
  "Set-ItemProperty -Path 'HKCU:\Control Panel\Desktop' -Name WallpaperStyle -Value 10;" ^
  "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class W { [DllImport(\"user32.dll\")] public static extern int SystemParametersInfo(int u, int p, string v, int f); }';" ^
  "[W]::SystemParametersInfo(0x0014, 0, '%archivo%', 0x01 -bor 0x02) | Out-Null;"

echo [OK] Fondo actualizado exitosamente.
echo.
pause
