@echo off
title SiGIC OS - Entorno Institucional
color 0B

echo ==============================================================================
echo             INICIANDO SiGIC OS - INSTITUTO TECNOLOGICO BELTRAN
echo ==============================================================================
echo.
echo [*] Verificando resolucion de pantalla y aceleracion grafica...
echo [*] Conectando a red institucional...

:: Comprobar conectividad
set SIGIC_TARGET_URL=http://localhost:3000

echo [*] Esperando obtencion de direccion IP por DHCP...
ping 127.0.0.1 -n 3 >nul

echo [*] Verificando conectividad externa...
ping -n 1 -w 1000 8.8.8.8 >nul 2>&1
if "%errorlevel%"=="0" (
    echo [*] Red externa detectada con acceso a Internet.
    set "SIGIC_TARGET_URL=https://app.sigic.com.ar"
    goto CONEXION_LISTA
)

echo [!] Red externa no alcanzada. Comprobando pasarela del host (10.0.2.2)...
ping -n 1 -w 1000 10.0.2.2 >nul 2>&1
if "%errorlevel%"=="0" (
    echo [*] Conectado al Host VirtualBox. Enrutando a SiGIC local...
    set "SIGIC_TARGET_URL=http://10.0.2.2:3000"
    goto CONEXION_LISTA
)

echo [!] Probando servidor LAN (192.168.0.90)...
ping -n 1 -w 1000 192.168.0.90 >nul 2>&1
if "%errorlevel%"=="0" (
    echo [*] Conectado a la LAN institucional. Enrutando a 192.168.0.90:3000...
    set "SIGIC_TARGET_URL=http://192.168.0.90:3000"
    goto CONEXION_LISTA
)

:CONEXION_LISTA
echo.
echo [*] URL de operacion establecida: %SIGIC_TARGET_URL%
echo [*] Localizando navegador Edge o Chrome Kiosk en los medios de arranque...

:: Buscar navegador Edge / Chrome Kiosk en todas las unidades disponibles
set "BROWSER_EXE="
for %%D in (X C D E F G H Y Z) do (
    if not defined BROWSER_EXE (
        if exist "%%D:\SiGIC\browser\msedge.exe" set "BROWSER_EXE=%%D:\SiGIC\browser\msedge.exe"
    )
    if not defined BROWSER_EXE (
        if exist "%%D:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" set "BROWSER_EXE=%%D:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    )
    if not defined BROWSER_EXE (
        if exist "%%D:\SiGIC\browser\chrome.exe" set "BROWSER_EXE=%%D:\SiGIC\browser\chrome.exe"
    )
    if not defined BROWSER_EXE (
        if exist "%%D:\Program Files\Google\Chrome\Application\chrome.exe" set "BROWSER_EXE=%%D:\Program Files\Google\Chrome\Application\chrome.exe"
    )
)

:: Si se dispone de la aplicacion nativa SiGIC Escritorio
if exist "X:\SiGIC\bin\sigic_escritorio.exe" (
    echo [*] Iniciando SiGIC Escritorio Nativo...
    :BUCLE_NATIVO
    "X:\SiGIC\bin\sigic_escritorio.exe"
    echo [!] SiGIC se cerro inesperadamente. Relanzando en 2 segundos...
    ping 127.0.0.1 -n 3 >nul
    goto BUCLE_NATIVO
)

:: Modo Navegador Kiosk Aislado (Pantalla completa sin bordes ni barra de navegacion)
if defined BROWSER_EXE (
    echo [*] Iniciando SiGIC Kiosk Shell con: %BROWSER_EXE%
    :BUCLE_BROWSER
    "%BROWSER_EXE%" --kiosk "%SIGIC_TARGET_URL%" --no-sandbox --disable-gpu --disable-software-rasterizer --test-type --no-first-run --no-default-browser-check --disable-translate --disable-features=TranslateUI --overscroll-history-navigation=0 --check-for-update-interval=0 --user-data-dir="X:\SiGIC\BrowserProfile"
    echo [!] Sesion finalizada. Relanzando SiGIC en 2 segundos...
    ping 127.0.0.1 -n 3 >nul
    goto BUCLE_BROWSER
)

echo.
echo [!] ADVERTENCIA: No se encontro binario de navegador en las unidades.
echo [*] Conecte un pendrive con la carpeta \SiGIC\browser\ o configure la red.
pause
