#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Constructor Integral de SiGIC OS Live USB / ISO
    Instituto Tecnologico Beltran

.DESCRIPTION
    Extrae el boot.wim oficial (Windows PE 64-bit), monta la imagen en RAM,
    inyecta el Shell Kiosk de SiGIC, configura el arranque directo sin ventanas genéricas
    y genera la estructura lista para copiar al pendrive o crear la ISO final.
#>

param(
    [string]$IsoOrigen = "D:\Win11_25H2_Spanish_Mexico_x64_v2.iso",
    [string]$CarpetaDestino = "D:\Sigic_Live_USB_Payload",
    [string]$DirectorioMontaje = "D:\Sigic_Live_Mount"
)

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "         SiGIC OS Live USB Builder -- Instituto Tecnologico Beltran           " -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Comprobar ISO de Windows existente
if (-not (Test-Path $IsoOrigen)) {
    Write-Error "[!] No se encontro la imagen ISO base en $IsoOrigen"
    exit 1
}

Write-Host "[1/6] Montando imagen ISO de Windows: $IsoOrigen..." -ForegroundColor Green
$disco = Mount-DiskImage -ImagePath $IsoOrigen -PassThru
$letraIso = (Get-Volume -DiskImage $disco).DriveLetter + ":"
Write-Host "      ISO montada en unidad virtual: $letraIso" -ForegroundColor Gray

# 2. Preparar directorios de destino
Write-Host "[2/6] Preparando estructura de arranque UEFI en $CarpetaDestino..." -ForegroundColor Green
if (Test-Path $CarpetaDestino) { Remove-Item $CarpetaDestino -Recurse -Force }
New-Item -ItemType Directory -Force -Path $CarpetaDestino | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $CarpetaDestino "boot") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $CarpetaDestino "efi\boot") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $CarpetaDestino "sources") | Out-Null

# Copiar archivos esenciales de arranque desde la ISO
Copy-Item "$letraIso\boot\*" -Destination (Join-Path $CarpetaDestino "boot") -Recurse -Force
Copy-Item "$letraIso\efi\*" -Destination (Join-Path $CarpetaDestino "efi") -Recurse -Force
Copy-Item "$letraIso\bootmgr" -Destination $CarpetaDestino -Force
Copy-Item "$letraIso\bootmgr.efi" -Destination $CarpetaDestino -Force -ErrorAction SilentlyContinue

# 3. Copiar boot.wim (WinPE)
Write-Host "[3/6] Extrayendo imagen de recuperacion y entorno en memoria (boot.wim)..." -ForegroundColor Green
$rutaBootWim = Join-Path $CarpetaDestino "sources\boot.wim"
Copy-Item "$letraIso\sources\boot.wim" -Destination $rutaBootWim -Force

# Desmontar ISO de Windows
Dismount-DiskImage -ImagePath $IsoOrigen | Out-Null
Write-Host "      ISO desmontada con exito." -ForegroundColor Gray

# Quitar atributo Read-Only heredado de la ISO (CAUSA DEL ERROR 0xc1510111)
Set-ItemProperty -Path $rutaBootWim -Name IsReadOnly -Value $false
attrib -r -s -h "$rutaBootWim"

# Limpieza preventiva de montajes residuales de DISM
dism /Cleanup-Wim | Out-Null

# 4. Modificar boot.wim con DISM para inyectar SiGIC OS
Write-Host "[4/6] Montando boot.wim con DISM..." -ForegroundColor Green
if (Test-Path $DirectorioMontaje) { 
    dism /Unmount-Image /MountDir:"$DirectorioMontaje" /Discard 2>$null | Out-Null
    Remove-Item $DirectorioMontaje -Recurse -Force -ErrorAction SilentlyContinue 
}
New-Item -ItemType Directory -Force -Path $DirectorioMontaje | Out-Null

# El índice 2 suele ser el Setup/WinPE interactivo
dism /Mount-Image /ImageFile:"$CarpetaDestino\sources\boot.wim" /Index:2 /MountDir:"$DirectorioMontaje"

# 5. Inyectar personalizacion y Kiosk de SiGIC
Write-Host "[5/6] Inyectando configuracion Kiosk y branding de SiGIC..." -ForegroundColor Green

# Carpeta de aplicacion SiGIC
$dirSiGIC = Join-Path $DirectorioMontaje "SiGIC"
New-Item -ItemType Directory -Force -Path $dirSiGIC | Out-Null
Copy-Item "d:\Sigic\os\windows-live\payload\Iniciar-SiGIC-OS.bat" -Destination $dirSiGIC -Force
Copy-Item "d:\Sigic\os\windows-live\personalizacion\logo-oficial.png" -Destination (Join-Path $dirSiGIC "logo.png") -Force

# Inyectar winpeshl.ini y startnet.cmd
$dirSys32 = Join-Path $DirectorioMontaje "Windows\System32"
Copy-Item "d:\Sigic\os\windows-live\personalizacion\winpeshl.ini" -Destination $dirSys32 -Force
Copy-Item "d:\Sigic\os\windows-live\personalizacion\startnet.cmd" -Destination $dirSys32 -Force

# Inyectar Fondo de pantalla oficial de SiGIC OS (reemplazo de winpe.bmp)
$rutaBmp = "d:\Sigic\os\windows-live\personalizacion\winpe_wallpaper.bmp"
if (Test-Path $rutaBmp) {
    Copy-Item $rutaBmp -Destination (Join-Path $dirSys32 "winpe.bmp") -Force
}

# 6. Desmontar y guardar cambios
Write-Host "[6/6] Guardando imagen optimizada en memoria RAM (boot.wim)..." -ForegroundColor Green
dism /Unmount-Image /MountDir:"$DirectorioMontaje" /Commit

Remove-Item $DirectorioMontaje -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host " [EXITO] SiGIC OS Live USB Payload generado en: $CarpetaDestino" -ForegroundColor Yellow
Write-Host " Contenido listo para copiar directamente a la raiz de tu pendrive USB (FAT32)" -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Green
