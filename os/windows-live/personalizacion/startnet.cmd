@echo off
title SiGIC OS - Instituto Tecnologico Beltran
color 0B
cls

echo ==============================================================================
echo           SiGIC OS -- Sistema Integral de Gestion Institucional
echo                    Instituto Tecnologico Beltran
echo ==============================================================================
echo.
echo [*] Inicializando subsistema WinPE...
wpeinit

echo [*] Configurando red y servicios...
wpeutil InitializeNetwork
ipconfig /renew >nul 2>&1

echo [*] Iniciando entorno de aplicacion SiGIC...
if exist "X:\SiGIC\Iniciar-SiGIC-OS.bat" (
    call "X:\SiGIC\Iniciar-SiGIC-OS.bat"
)

:: Mantener la consola abierta permanentemente para que WinPE no se apague
:BUCLE_SISTEMA
echo.
echo [*] Consola administrativa de SiGIC OS activa.
cmd.exe
goto BUCLE_SISTEMA

