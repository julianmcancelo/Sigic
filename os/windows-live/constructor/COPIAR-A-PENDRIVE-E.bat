@echo off
title Grabar SiGIC OS en Pendrive (E:)
color 0B
cls

echo ==============================================================================
echo              GRABADOR DIRECTO DE SiGIC OS LIVE USB (Pendrive E:)
echo                        Instituto Tecnologico Beltran
echo ==============================================================================
echo.
echo [*] Origen:  D:\Sigic_Live_USB_Payload (486 MB)
echo [*] Destino: Unidad E:\ (Pendrive Removible)
echo.

if not exist "E:\" (
    echo [ERROR] No se detecto la unidad E:\ conectada.
    echo Asegurate de conectar el pendrive y volve a intentarlo.
    pause
    exit /b 1
)

echo [AVISO] Se copiaran los archivos de SiGIC OS a tu pendrive E:\
echo.
pause

echo.
echo [*] Copiando archivos de arranque y sistema en memoria a E:\...
xcopy /E /I /H /Y "D:\Sigic_Live_USB_Payload\*" "E:\"

if %errorlevel% equ 0 (
    echo.
    echo ==============================================================================
    echo  [EXITO] SiGIC OS Live USB grabado correctamente en el pendrive (E:\)!
    echo ==============================================================================
    echo.
    echo Ya podes conectar este pendrive en cualquier computadora, encenderla
    echo eligiendo el arranque por USB (tecla F12, F11 o F9 segun la marca)
    echo y arrancara directamente en SiGIC OS a pantalla completa.
    echo.
) else (
    echo.
    echo [ERROR] Ocurrio un problema al copiar los archivos. Verifica espacio libre en E:\
)

pause
