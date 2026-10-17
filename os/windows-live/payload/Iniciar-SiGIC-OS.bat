@echo off
setlocal enabledelayedexpansion
title SiGIC OS - Entorno Institucional
color 0B

echo ==============================================================================
echo             INICIANDO SiGIC OS - INSTITUTO TECNOLOGICO BELTRAN
echo ==============================================================================
echo.
echo [*] Verificando resolucion de pantalla y aceleracion grafica...
echo [*] Conectando a red institucional...

:: Comprobar si hay conexion a Internet o si se usa el servidor local
set SIGIC_TARGET_URL=https://app.sigic.com.ar
ping -n 1 8.8.8.8 >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Red externa no detectada. Verificando red local...
    ping -n 1 127.0.0.1 >nul 2>&1
    set SIGIC_TARGET_URL=http://localhost:3000
)

echo [*] URL de operacion establecida: %SIGIC_TARGET_URL%
echo [*] Levantando interfaz institucional en modo pantalla completa...

:: Buscar WebView2 / MS Edge Kiosk
set EDGE_PATH=""
if exist "X:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set EDGE_PATH="X:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set EDGE_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "X:\SiGIC\bin\msedge.exe" (
    set EDGE_PATH="X:\SiGIC\bin\msedge.exe"
)

:: Si se dispone de la aplicacion nativa SiGIC Escritorio
if exist "X:\SiGIC\bin\sigic_escritorio.exe" (
    echo [*] Iniciando SiGIC Escritorio Nativo...
    :BUCLE_NATIVO
    "X:\SiGIC\bin\sigic_escritorio.exe"
    echo [!] SiGIC se cerro inesperadamente. Relanzando en 2 segundos...
    timeout /t 2 >nul
    goto BUCLE_NATIVO
)

:: Modo Navegador Kiosk Aislado (Pantalla completa sin bordes ni barra de navegacion)
if not %EDGE_PATH%=="" (
    echo [*] Iniciando SiGIC Kiosk Shell...
    :BUCLE_EDGE
    %EDGE_PATH% --kiosk "%SIGIC_TARGET_URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch --disable-features=TranslateUI --overscroll-history-navigation=0 --check-for-update-interval=0
    echo [!] Sesion finalizada. Relanzando SiGIC...
    timeout /t 2 >nul
    goto BUCLE_EDGE
)

echo [!] No se encontro Edge Kiosk. Lanzando navegador por defecto...
start "" "%SIGIC_TARGET_URL%"
pause
