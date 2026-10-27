@echo off
setlocal EnableDelayedExpansion
title SiGIC OS - Centro de Control y Optimizacion

:: Comprobar elevacion
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Solicitando privilegios de Administrador...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

:MENU
cls
echo ==============================================================================
echo             SiGIC OS - CENTRO DE CONTROL Y OPTIMIZACION (ATLAS EDITION)
echo                   Instituto Tecnologico Beltran - TSAS
echo ==============================================================================
echo.
echo  PERFILES DE OPTIMIZACION:
echo    [1] Perfil AtlasOS Extremo       (Maximo rendimiento, cero telemetria, debloat)
echo    [2] Perfil Estacion de Oficina   (Optimizado manteniendo Impresion y Bluetooth)
echo.
echo  HERRAMIENTAS OPERATIVAS Y VISUALES:
echo    [3] Modo Acto de Colacion / Presentacion (Bloquear suspension y notificaciones)
echo    [4] Cambiar Fondo Institucional Beltran   (10 Temas en Alta Resolucion)
echo    [5] Liberar Memoria RAM en Vivo          (Purgar Working Sets y Standby List)
echo    [6] Instalar Menu en Clic Derecho        (Submenu corporativo en Escritorio)
echo    [7] Desinstalar Menu en Clic Derecho
echo.
echo  DIAGNOSTICO Y RESTAURACION:
echo    [8] Diagnostico del Sistema en Vivo      (RAM, CPU, Procesos y Latencia)
echo    [9] Restaurar Valores Originales Windows (Revertir cambios a estado base)
echo.
echo    [0] Salir
echo ==============================================================================
echo.

set /p opc="Seleccione una opcion [0-9]: "

if "%opc%"=="1" goto PERFIL_EXTREMO
if "%opc%"=="2" goto PERFIL_OFICINA
if "%opc%"=="3" goto MODO_CEREMONIA
if "%opc%"=="4" goto CAMBIAR_FONDO
if "%opc%"=="5" goto LIBERAR_RAM
if "%opc%"=="6" goto INSTALAR_MENU
if "%opc%"=="7" goto DESINSTALAR_MENU
if "%opc%"=="8" goto DIAGNOSTICO
if "%opc%"=="9" goto RESTAURAR
if "%opc%"=="0" exit /b

echo [!] Opcion invalida.
timeout /t 2 >nul
goto MENU

:PERFIL_EXTREMO
cls
echo [SiGIC OS] Aplicando Perfil de Maximo Rendimiento (AtlasOS Extremo)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Optimizar-SiGIC-OS.ps1" -Perfil "Extremo"
pause
goto MENU

:PERFIL_OFICINA
cls
echo [SiGIC OS] Aplicando Perfil Estacion de Oficina...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Optimizar-SiGIC-OS.ps1" -Perfil "Oficina"
pause
goto MENU

:MODO_CEREMONIA
cls
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Modo-Ceremonia.ps1" -Accion Alternar
pause
goto MENU

:CAMBIAR_FONDO
call "%~dp0CAMBIAR-FONDO.bat"
goto MENU

:LIBERAR_RAM
cls
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Liberar-RAM.ps1"
pause
goto MENU

:INSTALAR_MENU
cls
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Instalar-Menu-Contextual.ps1"
pause
goto MENU

:DESINSTALAR_MENU
cls
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Desinstalar-Menu-Contextual.ps1"
pause
goto MENU

:DIAGNOSTICO
cls
echo ==============================================================================
echo             DIAGNOSTICO DE RENDIMIENTO DEL SISTEMA EN TIEMPO REAL
echo ==============================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$os = Get-CimInstance Win32_OperatingSystem;" ^
  "$cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average;" ^
  "$total = [math]::Round($os.TotalVisibleMemorySize / 1024, 0);" ^
  "$libre = [math]::Round($os.FreePhysicalMemory / 1024, 0);" ^
  "$enUso = $total - $libre;" ^
  "$porc = [math]::Round(($enUso / $total) * 100, 1);" ^
  "$procCount = (Get-Process).Count;" ^
  "Write-Host '  Carga de CPU:          ' -NoNewline; Write-Host ($cpu.ToString() + '%%') -ForegroundColor Cyan;" ^
  "Write-Host '  Procesos Activos:      ' -NoNewline; Write-Host $procCount -ForegroundColor Cyan;" ^
  "Write-Host '  Memoria RAM Total:     ' -NoNewline; Write-Host ($total.ToString() + ' MB') -ForegroundColor Gray;" ^
  "Write-Host '  Memoria RAM en Uso:    ' -NoNewline; Write-Host ($enUso.ToString() + ' MB (' + $porc.ToString() + '%%)') -ForegroundColor Yellow;" ^
  "Write-Host '  Memoria RAM Libre:     ' -NoNewline; Write-Host ($libre.ToString() + ' MB') -ForegroundColor Green;"
echo.
echo ==============================================================================
pause
goto MENU

:RESTAURAR
cls
echo [SiGIC OS] Restaurando parametros por defecto de Windows...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Restaurar-Defaults.ps1"
pause
goto MENU
