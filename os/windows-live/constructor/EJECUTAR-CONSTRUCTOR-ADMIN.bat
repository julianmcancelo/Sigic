@echo off
set "SCRIPT_PS1=D:\Sigic\os\windows-live\constructor\Construir-SiGIC-Live.ps1"
set "ISO_PATH=D:\Sigic_Descargas\Windows.iso"

echo ==============================================================================
echo       CONSTRUCTOR AUTOMATICO DE SiGIC OS LIVE USB (Windows 10)
echo                  Instituto Tecnologico Beltran
echo ==============================================================================
echo.
echo [*] Solicitando permisos de Administrador para DISM...
echo.

powershell -Command "Start-Process powershell -ArgumentList '-NoExit -ExecutionPolicy Bypass -File \"%SCRIPT_PS1%\" -IsoOrigen \"%ISO_PATH%\"' -Verb RunAs"

echo [*] Ventana de construccion lanzada como Administrador.
echo.
pause
