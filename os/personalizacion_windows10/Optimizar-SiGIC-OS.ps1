# ==============================================================================
# SiGIC OS Optimizer - Suite de Optimizacion y Personalizacion para Windows 10
# Instituto Tecnologico Beltran · Tecnicatura Superior en Analista de Sistemas
# Inspirado en la arquitectura modular de AtlasOS / Playbooks desatendidos
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$ModoDesatendido = $false,
    [switch]$OmitirProgramas = $false,
    [switch]$MantenerHibernacion = $false
)

$ErrorActionPreference = 'SilentlyContinue'

# ------------------------------------------------------------------------------
# 0. Verificacion de Privilegios de Administrador
# ------------------------------------------------------------------------------
$EsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $EsAdmin) {
    Write-Warning "Este script requiere privilegios elevados de Administrador."
    Write-Host "Reintentando ejecucion con elevacion UAC..."
    Start-Process powershell.exe -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"") -Verb RunAs
    exit
}

$Host.UI.RawUI.WindowTitle = "SiGIC OS - Optimizador y Personalizador de Windows 10"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "        SiGIC OS - OPTIMIZACION Y PERSONALIZACION DE WINDOWS 10               " -ForegroundColor White
Write-Host "                 Instituto Tecnologico Beltran (ITB)                          " -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$DirectorioScript = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $DirectorioScript) { $DirectorioScript = Get-Location }

# ------------------------------------------------------------------------------
# 1. Punto de Restauracion del Sistema (Seguridad)
# ------------------------------------------------------------------------------
Write-Host "[1/6] Creando punto de restauracion de seguridad..." -ForegroundColor Yellow
try {
    Enable-ComputerRestore -Drive "C:\" -ErrorAction SilentlyContinue
    Checkpoint-Computer -Description "SiGIC_OS_PreOptimizacion" -RestorePointType "MODIFY_SETTINGS" -ErrorAction SilentlyContinue
    Write-Host "      Punto de restauracion generado correctamente." -ForegroundColor Green
} catch {
    Write-Host "      (Punto de restauracion omitido o no disponible en este entorno)." -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# 2. Eliminacion de Bloatware UWP y Aplicaciones Basura de Microsoft
# ------------------------------------------------------------------------------
Write-Host "[2/6] Eliminando aplicaciones UWP innecesarias (Debloat)..." -ForegroundColor Yellow

$AppsParaRemover = @(
    "Microsoft.BingNews",
    "Microsoft.BingWeather",
    "Microsoft.BingFinance",
    "Microsoft.BingSports",
    "Microsoft.GetHelp",
    "Microsoft.Getstarted",
    "Microsoft.MicrosoftOfficeHub",
    "Microsoft.MicrosoftSolitaireCollection",
    "Microsoft.People",
    "Microsoft.SkypeApp",
    "Microsoft.WindowsFeedbackHub",
    "Microsoft.YourPhone",
    "Microsoft.ZuneMusic",
    "Microsoft.ZuneVideo",
    "Microsoft.XboxApp",
    "Microsoft.XboxGameOverlay",
    "Microsoft.XboxGamingOverlay",
    "Microsoft.XboxIdentityProvider",
    "Microsoft.XboxSpeechToTextOverlay",
    "Microsoft.MixedReality.Portal",
    "Microsoft.3DBuilder",
    "Microsoft.Microsoft3DViewer",
    "Microsoft.Print3D",
    "Microsoft.OneConnect",
    "Microsoft.Wallet",
    "Clipchamp.Clipchamp",
    "SpotifyAB.SpotifyMusic",
    "Disney.37853FC22B2CE",
    "ByteDancePte.Ltd.TikTok"
)

foreach ($App in $AppsParaRemover) {
    Write-Host "      Removiendo: $App" -ForegroundColor Gray
    Get-AppxPackage -Name "*$App*" -AllUsers | Remove-AppxPackage -AllUsers -ErrorAction SilentlyContinue
    Get-AppxProvisionedPackage -Online | Where-Object { $_.DisplayName -like "*$App*" } | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
}
Write-Host "      Limpieza de aplicaciones UWP completada." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 3. Privacidad, Desactivacion de Telemetria y Publicidad
# ------------------------------------------------------------------------------
Write-Host "[3/6] Desactivando telemetria, rastreo y publicidad de Microsoft..." -ForegroundColor Yellow

# Desactivar servicios de telemetria
$ServiciosTelemetria = @("DiagTrack", "dmwappushservice", "RetailDemo")
foreach ($Servicio in $ServiciosTelemetria) {
    Stop-Service -Name $Servicio -Force -ErrorAction SilentlyContinue
    Set-Service -Name $Servicio -StartupType Disabled -ErrorAction SilentlyContinue
}

# Desactivar recoleccion de datos y telemetria en Registro
$RutaDataCollection = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection"
if (-not (Test-Path $RutaDataCollection)) { New-Item -Path $RutaDataCollection -Force | Out-Null }
Set-ItemProperty -Path $RutaDataCollection -Name "AllowTelemetry" -Value 0 -Type DWord -Force

# Desactivar Windows Consumer Experience (descarga automatica de apps basura)
$RutaCloudContent = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\CloudContent"
if (-not (Test-Path $RutaCloudContent)) { New-Item -Path $RutaCloudContent -Force | Out-Null }
Set-ItemProperty -Path $RutaCloudContent -Name "DisableWindowsConsumerFeatures" -Value 1 -Type DWord -Force
Set-ItemProperty -Path $RutaCloudContent -Name "DisableSoftLanding" -Value 1 -Type DWord -Force

# Desactivar sugerencias publicitarias en el menu de inicio y explorador
$RutaContentDelivery = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\ContentDeliveryManager"
if (Test-Path $RutaContentDelivery) {
    Set-ItemProperty -Path $RutaContentDelivery -Name "SystemPaneSuggestionsEnabled" -Value 0 -Type DWord -Force
    Set-ItemProperty -Path $RutaContentDelivery -Name "SubscribedContent-338388Enabled" -Value 0 -Type DWord -Force
    Set-ItemProperty -Path $RutaContentDelivery -Name "SubscribedContent-338389Enabled" -Value 0 -Type DWord -Force
    Set-ItemProperty -Path $RutaContentDelivery -Name "SubscribedContent-353696Enabled" -Value 0 -Type DWord -Force
}

# Desactivar Cortana y busqueda web en el menu inicio
$RutaSearch = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Search"
if (-not (Test-Path $RutaSearch)) { New-Item -Path $RutaSearch -Force | Out-Null }
Set-ItemProperty -Path $RutaSearch -Name "AllowCortana" -Value 0 -Type DWord -Force
Set-ItemProperty -Path $RutaSearch -Name "DisableWebSearch" -Value 1 -Type DWord -Force
Set-ItemProperty -Path $RutaSearch -Name "ConnectedSearchUseWeb" -Value 0 -Type DWord -Force

# Desactivar anuncios en el Explorador de Archivos (OneDrive sync ads)
Set-ItemProperty -Path "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "ShowSyncProviderNotifications" -Value 0 -Type DWord -Force

Write-Host "      Telemetria y privacidad configuradas de forma segura." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 4. Optimizacion de Rendimiento, Memoria y Latencia (Estilo AtlasOS)
# ------------------------------------------------------------------------------
Write-Host "[4/6] Aplicando optimizaciones de latencia y rendimiento..." -ForegroundColor Yellow

# Esquema de energia: Maximo / Alto Rendimiento
try {
    powercfg -duplicatescheme 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c 2>$null | Out-Null
    powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c 2>$null
} catch {}

# Deshabilitar estrangulamiento de energia (Power Throttling)
$RutaPowerThrottling = "HKLM:\SYSTEM\CurrentControlSet\Control\Power\PowerThrottling"
if (-not (Test-Path $RutaPowerThrottling)) { New-Item -Path $RutaPowerThrottling -Force | Out-Null }
Set-ItemProperty -Path $RutaPowerThrottling -Name "PowerThrottlingOff" -Value 1 -Type DWord -Force

# Acelerar respuesta de menus (reducir MenuShowDelay de 400ms a 100ms)
Set-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name "MenuShowDelay" -Value "100" -Force

# Desactivar GameDVR / grabacion en segundo plano para menor uso de CPU
$RutaGameConfig = "HKCU:\System\GameConfigStore"
if (Test-Path $RutaGameConfig) {
    Set-ItemProperty -Path $RutaGameConfig -Name "GameDVR_Enabled" -Value 0 -Type DWord -Force
}
$RutaGameDVR = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\GameDVR"
if (-not (Test-Path $RutaGameDVR)) { New-Item -Path $RutaGameDVR -Force | Out-Null }
Set-ItemProperty -Path $RutaGameDVR -Name "AllowGameDVR" -Value 0 -Type DWord -Force

# Desactivar hibernacion si no se requiere (libera archivo hiberfil.sys equivalente al 100% de la RAM)
if (-not $MantenerHibernacion) {
    powercfg -h off 2>$null
    Write-Host "      Hibernacion desactivada para recuperar espacio en disco." -ForegroundColor Gray
}

# Configuracion del Explorador de Windows para profesionales de sistemas
$RutaExplorerAdvanced = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
# Mostrar extensiones de archivo siempre
Set-ItemProperty -Path $RutaExplorerAdvanced -Name "HideFileExt" -Value 0 -Type DWord -Force
# Mostrar archivos ocultos
Set-ItemProperty -Path $RutaExplorerAdvanced -Name "Hidden" -Value 1 -Type DWord -Force
# Abrir Explorador en 'Este Equipo' en lugar de 'Acceso rapido'
Set-ItemProperty -Path $RutaExplorerAdvanced -Name "LaunchTo" -Value 1 -Type DWord -Force

Write-Host "      Optimizaciones de rendimiento aplicadas con exito." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 5. Personalizacion Visual Institucional Beltran / SiGIC
# ------------------------------------------------------------------------------
Write-Host "[5/6] Aplicando personalizacion visual y fondo de pantalla..." -ForegroundColor Yellow

# Activar Tema Oscuro para Aplicaciones y Sistema
$RutaPersonalize = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize"
if (-not (Test-Path $RutaPersonalize)) { New-Item -Path $RutaPersonalize -Force | Out-Null }
Set-ItemProperty -Path $RutaPersonalize -Name "AppsUseLightTheme" -Value 0 -Type DWord -Force
Set-ItemProperty -Path $RutaPersonalize -Name "SystemUsesLightTheme" -Value 0 -Type DWord -Force

# Instalar Fondos de Pantalla Oficiales
$DestinoWallpapers = "C:\Windows\Web\Wallpaper\SiGIC"
if (-not (Test-Path $DestinoWallpapers)) { New-Item -ItemType Directory -Path $DestinoWallpapers -Force | Out-Null }

$OrigenWallpapers = Join-Path $DirectorioScript "recursos\wallpapers"
if (Test-Path $OrigenWallpapers) {
    Copy-Item -Path "$OrigenWallpapers\*" -Destination $DestinoWallpapers -Force -ErrorAction SilentlyContinue
}

# Establecer Fondo Oficial Activo (Beltran Oficial)
$FondoActivo = Join-Path $DirectorioScript "recursos\fondo_default.jpg"
if (-not (Test-Path $FondoActivo)) {
    $FondoActivo = "$DestinoWallpapers\beltran.jpg"
}

if (Test-Path $FondoActivo) {
    Copy-Item -Path $FondoActivo -Destination "$DestinoWallpapers\fondo_activo.jpg" -Force -ErrorAction SilentlyContinue
    
    # Reemplazar fondo default del sistema Windows para que aplique universalmente
    $FondoSistema = "C:\Windows\Web\Wallpaper\Windows\img0.jpg"
    if (Test-Path $FondoSistema) {
        takeown /f $FondoSistema 2>$null | Out-Null
        icacls $FondoSistema /grant administrators:F 2>$null | Out-Null
        Copy-Item -Path $FondoActivo -Destination $FondoSistema -Force -ErrorAction SilentlyContinue
    }

    # Aplicar fondo en Registro para el usuario actual
    Set-ItemProperty -Path 'HKCU:\Control Panel\Desktop' -Name wallpaper -Value "$DestinoWallpapers\fondo_activo.jpg" -Force
    Set-ItemProperty -Path 'HKCU:\Control Panel\Desktop' -Name WallpaperStyle -Value 10 -Force
    Set-ItemProperty -Path 'HKCU:\Control Panel\Desktop' -Name TileWallpaper -Value 0 -Force

    # Invocar API nativa de Windows para actualizar escritorio en vivo
    $Code = @"
using System;
using System.Runtime.InteropServices;
public class Wallpaper {
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
}
"@
    Add-Type -TypeDefinition $Code -ErrorAction SilentlyContinue
    [Wallpaper]::SystemParametersInfo(0x0014, 0, "$DestinoWallpapers\fondo_activo.jpg", 0x01 -bor 0x02) | Out-Null
    Write-Host "      Fondo de pantalla institucional aplicado correctamente." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 6. Despliegue de Runtimes y Software Esencial
# ------------------------------------------------------------------------------
if (-not $OmitirProgramas) {
    Write-Host "[6/6] Verificando instalacion de programas esenciales..." -ForegroundColor Yellow

    $WingetPath = Get-Command winget.exe -ErrorAction SilentlyContinue
    if ($WingetPath) {
        Write-Host "      Instalando dependencias de runtime C++ y herramientas via Winget..." -ForegroundColor Gray
        
        # Visual C++ All-In-One Redistributable (Imprescindible para compatibilidad nativa)
        & winget install --id Microsoft.VCRedist.2015+.x64 --silent --accept-package-agreements --accept-source-agreements --force | Out-Null
        
        # 7-Zip
        & winget install --id 7zip.7zip --silent --accept-package-agreements --accept-source-agreements | Out-Null

        # Google Chrome
        & winget install --id Google.Chrome --silent --accept-package-agreements --accept-source-agreements | Out-Null
        
        Write-Host "      Software y librerias instalados de forma desatendida." -ForegroundColor Green
    } else {
        Write-Host "      (Winget no disponible en este perfil; se omiten paquetes online)." -ForegroundColor Gray
    }

    # Despliegue del Centro de Control SiGIC en el Escritorio
    $OrigenSiGIC = Join-Path $DirectorioScript "..\..\SiGIC.exe"
    if (-not (Test-Path $OrigenSiGIC)) {
        $OrigenSiGIC = "D:\Sigic\SiGIC.exe"
    }

    if (Test-Path $OrigenSiGIC) {
        $DestinoApp = "C:\Program Files\SiGIC"
        if (-not (Test-Path $DestinoApp)) { New-Item -ItemType Directory -Path $DestinoApp -Force | Out-Null }
        Copy-Item -Path $OrigenSiGIC -Destination "$DestinoApp\SiGIC.exe" -Force -ErrorAction SilentlyContinue

        # Crear Acceso Directo en el Escritorio Publico (visible para todos los usuarios)
        $WshShell = New-Object -ComObject WScript.Shell
        $EscritorioPublico = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::CommonDesktopDirectory)
        $AccesoDirecto = $WshShell.CreateShortcut("$EscritorioPublico\SiGIC - Centro de Control.lnk")
        $AccesoDirecto.TargetPath = "$DestinoApp\SiGIC.exe"
        $AccesoDirecto.Description = "Sistema de Gestion Institucional de Colaciones - ITB"
        $AccesoDirecto.WorkingDirectory = $DestinoApp
        $AccesoDirecto.Save()
        Write-Host "      Acceso directo de SiGIC anadido al Escritorio." -ForegroundColor Green
    }
} else {
    Write-Host "[6/6] Instalacion de programas omitida por parametro." -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# Finalizacion
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "          PROCESO DE OPTIMIZACION Y PERSONALIZACION COMPLETADO               " -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "Se recomienda reiniciar el equipo para aplicar todas las politicas de servicios." -ForegroundColor Cyan
Write-Host ""

if (-not $ModoDesatendido) {
    Read-Host "Presione ENTER para salir"
}
