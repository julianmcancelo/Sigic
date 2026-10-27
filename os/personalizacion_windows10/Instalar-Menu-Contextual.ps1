# ==============================================================================
# SiGIC OS - Instalador de Menu Contextual en Escritorio (Clic Derecho)
# Instituto Tecnologico Beltran · Tecnicatura Superior en Analista de Sistemas
# ==============================================================================

[CmdletBinding()]
param()

$EsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $EsAdmin) {
    Write-Warning "Requiere permisos de Administrador para registrar el menu en el sistema."
    Start-Process powershell.exe -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"") -Verb RunAs
    exit
}

$Host.UI.RawUI.WindowTitle = "SiGIC OS - Instalador de Menu Contextual"

$DirectorioSuite = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $DirectorioSuite) { $DirectorioSuite = Get-Location }

# Ruta destino persistente para scripts de menu
$DestinoSistema = "C:\Program Files\SiGIC\Herramientas"
if (-not (Test-Path $DestinoSistema)) { New-Item -ItemType Directory -Path $DestinoSistema -Force | Out-Null }

# Copiar scripts necesarios al destino de sistema
Copy-Item -Path "$DirectorioSuite\CAMBIAR-FONDO.bat" -Destination $DestinoSistema -Force -ErrorAction SilentlyContinue
Copy-Item -Path "$DirectorioSuite\Modo-Ceremonia.bat" -Destination $DestinoSistema -Force -ErrorAction SilentlyContinue
Copy-Item -Path "$DirectorioSuite\Modo-Ceremonia.ps1" -Destination $DestinoSistema -Force -ErrorAction SilentlyContinue
Copy-Item -Path "$DirectorioSuite\Liberar-RAM.bat" -Destination $DestinoSistema -Force -ErrorAction SilentlyContinue
Copy-Item -Path "$DirectorioSuite\Liberar-RAM.ps1" -Destination $DestinoSistema -Force -ErrorAction SilentlyContinue
Copy-Item -Path "$DirectorioSuite\recursos" -Destination "$DestinoSistema\recursos" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "        SiGIC OS - INSTALADOR DE MENU CONTEXTUAL EN ESCRITORIO               " -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Registrando opciones institucionales en el menu de clic derecho..." -ForegroundColor Yellow

$RutaBase = "Registry::HKEY_CLASSES_ROOT\DesktopBackground\Shell\SiGIC"

# Clave Principal
New-Item -Path $RutaBase -Force | Out-Null
Set-ItemProperty -Path $RutaBase -Name "MUIVerb" -Value "Herramientas SiGIC" -Force
Set-ItemProperty -Path $RutaBase -Name "Icon" -Value "imageres.dll,-5314" -Force
Set-ItemProperty -Path $RutaBase -Name "SubCommands" -Value "" -Force

$RutaSub = "$RutaBase\Shell"

# 1. Cambiar Fondo Beltran
$SubFondo = "$RutaSub\01_Fondo"
New-Item -Path $SubFondo -Force | Out-Null
Set-ItemProperty -Path $SubFondo -Name "MUIVerb" -Value "Cambiar Fondo Institucional Beltran" -Force
Set-ItemProperty -Path $SubFondo -Name "Icon" -Value "themecpl.dll,0" -Force
New-Item -Path "$SubFondo\command" -Force | Out-Null
Set-ItemProperty -Path "$SubFondo\command" -Name "(Default)" -Value "`"$DestinoSistema\CAMBIAR-FONDO.bat`"" -Force

# 2. Centro de Control SiGIC
$SubControl = "$RutaSub\02_Control"
New-Item -Path $SubControl -Force | Out-Null
Set-ItemProperty -Path $SubControl -Name "MUIVerb" -Value "Abrir Centro de Control SiGIC" -Force
Set-ItemProperty -Path $SubControl -Name "Icon" -Value "shell32.dll,277" -Force
New-Item -Path "$SubControl\command" -Force | Out-Null
Set-ItemProperty -Path "$SubControl\command" -Name "(Default)" -Value "`"C:\Program Files\SiGIC\SiGIC.exe`"" -Force

# 3. Modo Ceremonia / Presentacion
$SubCeremonia = "$RutaSub\03_Ceremonia"
New-Item -Path $SubCeremonia -Force | Out-Null
Set-ItemProperty -Path $SubCeremonia -Name "MUIVerb" -Value "Modo Acto de Colacion / Presentacion" -Force
Set-ItemProperty -Path $SubCeremonia -Name "Icon" -Value "powercpl.dll,512" -Force
New-Item -Path "$SubCeremonia\command" -Force | Out-Null
Set-ItemProperty -Path "$SubCeremonia\command" -Name "(Default)" -Value "`"$DestinoSistema\Modo-Ceremonia.bat`"" -Force

# 4. Liberar Memoria RAM
$SubRAM = "$RutaSub\04_RAM"
New-Item -Path $SubRAM -Force | Out-Null
Set-ItemProperty -Path $SubRAM -Name "MUIVerb" -Value "Liberar Memoria RAM en Vivo" -Force
Set-ItemProperty -Path $SubRAM -Name "Icon" -Value "taskmgr.exe,0" -Force
New-Item -Path "$SubRAM\command" -Force | Out-Null
Set-ItemProperty -Path "$SubRAM\command" -Name "(Default)" -Value "`"$DestinoSistema\Liberar-RAM.bat`"" -Force

# 5. Reiniciar Explorador de Windows
$SubExplorer = "$RutaSub\05_Explorer"
New-Item -Path $SubExplorer -Force | Out-Null
Set-ItemProperty -Path $SubExplorer -Name "MUIVerb" -Value "Reiniciar Explorador de Windows" -Force
Set-ItemProperty -Path $SubExplorer -Name "Icon" -Value "explorer.exe,0" -Force
New-Item -Path "$SubExplorer\command" -Force | Out-Null
Set-ItemProperty -Path "$SubExplorer\command" -Name "(Default)" -Value "cmd.exe /c taskkill /f /im explorer.exe & start explorer.exe" -Force

Write-Host "  [OK] Menu 'Herramientas SiGIC' registrado en el clic derecho del escritorio." -ForegroundColor Green
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 2
