# ==============================================================================
# SiGIC OS - Modo Acto de Colacion / Ceremonia y Presentacion
# Instituto Tecnologico Beltran · Tecnicatura Superior en Analista de Sistemas
# Previene suspension de pantalla, bloquea notificaciones y silencia alertas
# ==============================================================================

[CmdletBinding()]
param(
    [ValidateSet("Alternar", "Activar", "Desactivar")]
    [string]$Accion = "Alternar"
)

$EsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $EsAdmin) {
    Write-Warning "Requiere permisos de Administrador para modificar politicas de energia."
    Start-Process powershell.exe -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Accion $Accion") -Verb RunAs
    exit
}

$Host.UI.RawUI.WindowTitle = "SiGIC OS - Modo Ceremonia y Presentacion"

$RutaEstado = "HKCU:\SOFTWARE\SiGIC\ModoCeremonia"
if (-not (Test-Path $RutaEstado)) { New-Item -Path $RutaEstado -Force | Out-Null }
$EstadoActual = (Get-ItemProperty -Path $RutaEstado -Name "Activo" -ErrorAction SilentlyContinue).Activo

$NuevoEstado = 0
if ($Accion -eq "Activar") {
    $NuevoEstado = 1
} elseif ($Accion -eq "Desactivar") {
    $NuevoEstado = 0
} else {
    if ($EstadoActual -eq 1) { $NuevoEstado = 0 } else { $NuevoEstado = 1 }
}

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "         SiGIC OS - MODO ACTO DE COLACION / PRESENTACION EN VIVO              " -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

if ($NuevoEstado -eq 1) {
    Write-Host "ACTIVANDO MODO CEREMONIA (Proteccion Total para Escenario y Proyeccion)..." -ForegroundColor Yellow
    Write-Host ""

    # 1. Bloquear suspension de monitor y equipo (Tiempo = 0: Nunca apagar)
    powercfg -change -monitor-timeout-ac 0
    powercfg -change -monitor-timeout-dc 0
    powercfg -change -standby-timeout-ac 0
    powercfg -change -standby-timeout-dc 0
    powercfg -change -hibernate-timeout-ac 0
    powercfg -change -hibernate-timeout-dc 0
    Write-Host "  [OK] Suspension de monitor y sistema desactivada (Pantalla activa fija)." -ForegroundColor Green

    # 2. Desactivar protector de pantalla
    Set-ItemProperty -Path 'HKCU:\Control Panel\Desktop' -Name ScreenSaveActive -Value 0 -Force
    Write-Host "  [OK] Protector de pantalla bloqueado." -ForegroundColor Green

    # 3. Asistente de concentracion (No molestar / Focus Assist)
    # 2 = Solo alarmas/prioridad, 0 = Desactivado
    $RutaFocus = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\CloudStore\Store\Cache\DefaultAccount\$$windows.data.notifications.quiethourssettings\Current"
    if (Test-Path $RutaFocus) {
        Set-ItemProperty -Path $RutaFocus -Name "Data" -Value ([byte[]](0x02,0x00,0x00,0x00)) -Force -ErrorAction SilentlyContinue
    }
    # Desactivar globos de notificaciones en Windows
    Set-ItemProperty -Path "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Notifications\Settings" -Name "NOC_GLOBAL_SETTING_TOASTS_ENABLED" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
    Write-Host "  [OK] Notificaciones emergentes y globos de Windows bloqueados." -ForegroundColor Green

    # 4. Silenciar sonidos de alerta del sistema
    Set-ItemProperty -Path "HKCU:\AppEvents\Schemes" -Name "(Default)" -Value ".None" -Force -ErrorAction SilentlyContinue
    Write-Host "  [OK] Sonidos de alerta de Windows silenciados." -ForegroundColor Green

    Set-ItemProperty -Path $RutaEstado -Name "Activo" -Value 1 -Type DWord -Force

    Write-Host ""
    Write-Host "MODO CEREMONIA ACTIVO: El equipo operara sin cortes, sin apagados ni alertas." -ForegroundColor Cyan
} else {
    Write-Host "DESACTIVANDO MODO CEREMONIA (Restaurando Parametros Habituales)..." -ForegroundColor Yellow
    Write-Host ""

    # 1. Restaurar tiempos estandar de monitor (15 min) y suspension (30 min)
    powercfg -change -monitor-timeout-ac 15
    powercfg -change -monitor-timeout-dc 10
    powercfg -change -standby-timeout-ac 30
    powercfg -change -standby-timeout-dc 20
    Write-Host "  [OK] Tiempos estandar de ahorro de energia restablecidos." -ForegroundColor Green

    # 2. Reactivar notificaciones normales
    Set-ItemProperty -Path "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Notifications\Settings" -Name "NOC_GLOBAL_SETTING_TOASTS_ENABLED" -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
    Write-Host "  [OK] Notificaciones de Windows restablecidas." -ForegroundColor Green

    # 3. Reactivar esquema de sonido estandar
    Set-ItemProperty -Path "HKCU:\AppEvents\Schemes" -Name "(Default)" -Value ".Default" -Force -ErrorAction SilentlyContinue
    Write-Host "  [OK] Esquema de sonidos de Windows restablecido." -ForegroundColor Green

    Set-ItemProperty -Path $RutaEstado -Name "Activo" -Value 0 -Type DWord -Force

    Write-Host ""
    Write-Host "MODO CEREMONIA DESACTIVADO: Sistema en modo de operacion habitual." -ForegroundColor Green
}

Write-Host "==============================================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 2
