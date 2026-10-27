# ==============================================================================
# SiGIC OS - Desinstalador de Menu Contextual de Escritorio
# Instituto Tecnologico Beltran · Tecnicatura Superior en Analista de Sistemas
# ==============================================================================

[CmdletBinding()]
param()

$EsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $EsAdmin) {
    Write-Warning "Requiere permisos de Administrador para remover el menu del sistema."
    Start-Process powershell.exe -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"") -Verb RunAs
    exit
}

$RutaBase = "Registry::HKEY_CLASSES_ROOT\DesktopBackground\Shell\SiGIC"
if (Test-Path $RutaBase) {
    Remove-Item -Path $RutaBase -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Menu contextual 'Herramientas SiGIC' removido correctamente." -ForegroundColor Green
} else {
    Write-Host "El menu contextual no se encontraba registrado." -ForegroundColor Yellow
}
Start-Sleep -Seconds 2
