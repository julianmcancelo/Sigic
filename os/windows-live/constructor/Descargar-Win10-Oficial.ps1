<#
.SYNOPSIS
    Descargador Oficial de Windows 10 x64 ISO para SiGIC OS
    Instituto Tecnologico Beltran

.DESCRIPTION
    Descarga la herramienta oficial MediaCreationTool de Microsoft o
    asiste en la obtencion directa de la ISO de Windows 10 22H2 x64 (es-ES / es-MX).
#>

param(
    [string]$DestinoIso = "D:\Win10_22H2_Spanish_x64.iso"
)

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "         Descarga Oficial de Windows 10 x64 -- SiGIC Live USB OS              " -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$carpetaDescargas = "D:\Sigic_Descargas"
if (-not (Test-Path $carpetaDescargas)) { New-Item -ItemType Directory -Force -Path $carpetaDescargas | Out-Null }

$mctExe = Join-Path $carpetaDescargas "MediaCreationTool22H2.exe"

Write-Host "[1/3] Descargando la herramienta oficial MediaCreationTool de Microsoft..." -ForegroundColor Green
$mctUrl = "https://go.microsoft.com/fwlink/?LinkId=691209"

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $mctUrl -OutFile $mctExe -UseBasicParsing
    Write-Host "      Herramienta oficial descargada en: $mctExe" -ForegroundColor Gray
} catch {
    Write-Warning "[!] No se pudo descargar automaticamente. Podes acceder a:"
    Write-Host "    https://www.microsoft.com/es-es/software-download/windows10" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[2/3] Opciones para generar la ISO de Windows 10:" -ForegroundColor Green
Write-Host "  Opcion A (Recomendada Oficial):" -ForegroundColor White
Write-Host "    Ejecuta el archivo descargado: $mctExe" -ForegroundColor Yellow
Write-Host "    Elige 'Crear medios de instalacion' > 'Archivo ISO' y guardalo en: $DestinoIso" -ForegroundColor White
Write-Host ""
Write-Host "  Opcion B (Descarga directa desde navegador):" -ForegroundColor White
Write-Host "    Entra a: https://www.microsoft.com/es-es/software-download/windows10ISO" -ForegroundColor Cyan
Write-Host "    (Cambiando el User-Agent a movil o usando F12, Microsoft permite descarga directa sin MCT)." -ForegroundColor Gray
Write-Host ""
Write-Host "[3/3] Una vez que tengas 'Win10_22H2_Spanish_x64.iso' en D:\, ejecuta:" -ForegroundColor Green
Write-Host "    powershell -ExecutionPolicy Bypass -File `"d:\Sigic\os\windows-live\constructor\Construir-SiGIC-Live.ps1`" -IsoOrigen `"$DestinoIso`"" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
