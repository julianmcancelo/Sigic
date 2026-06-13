@echo off
title Publicar SiGIC Control Center - Modo Portable (Autocontenido)
echo ======================================================================
echo   Preparando la compilacion portable de SiGIC Control Center...
echo ======================================================================
echo.
echo Este script compilara la aplicacion en modo AUTOCONTENIDO (Self-Contained).
echo El archivo ejecutable resultante (.exe) incluira el runtime de .NET 8.
echo Podras ejecutarlo en cualquier notebook sin necesidad de instalar nada.
echo.
echo [!] IMPORTANTE: Necesitas conexion a internet para que dotnet descargue
echo     los componentes del runtime por unica vez si no los tienes en cache.
echo.
pause

echo.
echo Compilando y publicando para Windows x64...
dotnet publish SiGIC_ControlCenter\SiGIC_ControlCenter.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:PublishReadyToRun=true -o .\dist_portable

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Hubo un error al compilar la aplicacion.
    echo Asegurate de tener instalado el SDK de .NET 8 y conexion a internet.
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ======================================================================
echo   COMPILACION COMPLETADA CON EXITO
echo ======================================================================
echo.
echo El ejecutable portable se ha generado en:
echo - scripts\dist_portable\SiGIC_ControlCenter.exe
echo.
echo Podes copiar ese archivo .exe a cualquier notebook y funcionara
echo directamente sin pedir instalar ninguna libreria ni framework de .NET.
echo.
pause
