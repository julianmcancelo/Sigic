# ==============================================================================
# SiGIC OS - Restaurar Configuraciones Predeterminadas de Windows
# Instituto Tecnologico Beltran · Tecnicatura Superior en Analista de Sistemas
# ==============================================================================

[CmdletBinding()]
param()

$EsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $EsAdmin) {
    Write-Warning "Requiere permisos de Administrador para restaurar configuraciones del sistema."
    Start-Process powershell.exe -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"") -Verb RunAs
    exit
}

$Host.UI.RawUI.WindowTitle = "SiGIC OS - Restaurar Valores Predeterminados"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "       SiGIC OS - RESTAURAR VALORES PREDETERMINADOS DE WINDOWS               " -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Restaurando parametros originales de Microsoft Windows..." -ForegroundColor Yellow

# 1. Esquema de energia Equilibrado
try {
    powercfg -setactive 381b4222-f694-41f0-9685-ff5bb560df22 2>$null
    Write-Host "  [OK] Esquema de energia Equilibrado restaurado." -ForegroundColor Green
} catch {}

# 2. Restaurar retraso de menu estandar (400ms)
Set-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name "MenuShowDelay" -Value "400" -Force
Write-Host "  [OK] Retraso de animacion de menus restablecido (400 ms)." -ForegroundColor Green

# 3. Restaurar telemetria estandar de Windows
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection" -Name "AllowTelemetry" -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
Set-Service -Name "DiagTrack" -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name "DiagTrack" -ErrorAction SilentlyContinue
Write-Host "  [OK] Servicio de diagnostico estandar restaurado." -ForegroundColor Green

# 4. Restaurar tema claro / valores predeterminados de Windows
$RutaPersonalize = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize"
if (Test-Path $RutaPersonalize) {
    Set-ItemProperty -Path $RutaPersonalize -Name "AppsUseLightTheme" -Value 1 -Type DWord -Force
    Set-ItemProperty -Path $RutaPersonalize -Name "SystemUsesLightTheme" -Value 1 -Type DWord -Force
}
Write-Host "  [OK] Tema visual estandar de Windows restablecido." -ForegroundColor Green

Write-Host ""
Write-Host "Valores originales de Windows restaurados exitosamente." -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 2
