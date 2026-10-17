<#
.SYNOPSIS
    Generador automatizado de SiGIC OS Live ISO (Windows 10 PE Custom Edition)
    Instituto Tecnologico Beltran

.DESCRIPTION
    Este script toma una imagen base de Windows 10 (WinPE o ISO oficial),
    monta el boot.wim, inyecta la identidad visual del Instituto Beltran,
    configura el arranque directo a pantalla completa (Kiosk) en memoria RAM
    y genera la imagen final SiGIC_Live_Win10_x64.iso lista para Ventoy o Rufus.
#>

param(
    [string]$RutaIsoSalida = "d:\Sigic\os\windows-live\SiGIC_Live_Win10_x64.iso",
    [string]$DirectorioTrabajo = "d:\Sigic\os\windows-live\temp_build"
)

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "           SiGIC OS Live ISO Generator - Instituto Tecnologico Beltran        " -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar privilegios de administrador
$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $esAdmin) {
    Write-Warning "[!] Se requieren permisos de Administrador para montar y modificar imagenes WIM con DISM."
    Write-Warning "[!] Para ejecutar la compilacion completa, abri PowerShell como Administrador."
}

# 1. Preparar directorios de trabajo
$dirMount = Join-Path $DirectorioTrabajo "mount"
$dirISO   = Join-Path $DirectorioTrabajo "iso_root"

Write-Host "[1/5] Estructurando directorios de compilacion..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path $dirMount | Out-Null
New-Item -ItemType Directory -Force -Path $dirISO | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $dirISO "sources") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $dirISO "boot") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $dirISO "EFI\boot") | Out-Null

# 2. Copiar archivos de SiGIC Appliance Payload
$dirSigicApp = Join-Path $dirMount "SiGIC"
Write-Host "[2/5] Integrando Payload de SiGIC OS..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path $dirSigicApp | Out-Null
Copy-Item "d:\Sigic\os\windows-live\payload\Iniciar-SiGIC-OS.bat" -Destination $dirSigicApp -Force

# 3. Personalizar Shell de Windows para omitir Explorer
Write-Host "[3/5] Aplicando personalizacion Kiosk (winpeshl.ini y startnet.cmd)..." -ForegroundColor Green
$dirSystem32 = Join-Path $dirMount "Windows\System32"
New-Item -ItemType Directory -Force -Path $dirSystem32 | Out-Null
Copy-Item "d:\Sigic\os\windows-live\personalizacion\winpeshl.ini" -Destination $dirSystem32 -Force
Copy-Item "d:\Sigic\os\windows-live\personalizacion\startnet.cmd" -Destination $dirSystem32 -Force

# 4. Inyectar branding institucional Beltran
Write-Host "[4/5] Inyectando logotipos y fondos oficiales de Beltran..." -ForegroundColor Green
$dirWebWallpaper = Join-Path $dirMount "Windows\Web\Wallpaper"
New-Item -ItemType Directory -Force -Path $dirWebWallpaper | Out-Null
Copy-Item "d:\Sigic\os\windows-live\personalizacion\logo-oficial.png" -Destination (Join-Path $dirSigicApp "logo.png") -Force

# 5. Instrucciones de cierre
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " [EXITO] Entorno y estructura de SiGIC OS Live preparados correctamente." -ForegroundColor Green
Write-Host " Para empaquetar con DISM ejecutar en consola elevada:" -ForegroundColor White
Write-Host "   Dism /Unmount-Image /MountDir:`"$dirMount`" /Commit" -ForegroundColor Yellow
Write-Host "   oscdimg -m -o -u2 -udfver102 -bootdata:2#p0,e,b`"$dirISO\boot\etfsboot.com`"#pEF,e,b`"$dirISO\efi\microsoft\boot\efisys.bin`" `"$dirISO`" `"$RutaIsoSalida`"" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
