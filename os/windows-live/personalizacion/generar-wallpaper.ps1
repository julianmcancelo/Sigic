Add-Type -AssemblyName System.Drawing

$ancho = 1920
$alto = 1080
$bitmap = New-Object System.Drawing.Bitmap $ancho, $alto
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# 1. Fondo Gradiente Navy Profundo Institucional (#081624 a #0d2b45)
$puntoInicio = New-Object System.Drawing.PointF 0, 0
$puntoFin = New-Object System.Drawing.PointF $ancho, $alto
$color1 = [System.Drawing.ColorTranslator]::FromHtml("#081624")
$color2 = [System.Drawing.ColorTranslator]::FromHtml("#0d2b45")
$brushGradiente = New-Object System.Drawing.Drawing2D.LinearGradientBrush $puntoInicio, $puntoFin, $color1, $color2
$graphics.FillRectangle($brushGradiente, 0, 0, $ancho, $alto)

# 2. Resplandor tecnológico cian/aeroespacial
$colorCian = [System.Drawing.ColorTranslator]::FromHtml("#00b7d3")
$brushLuz = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(25, $colorCian))
$graphics.FillEllipse($brushLuz, 1200, -200, 900, 900)

# 3. Dibujar Logo Oficial de SiGIC centrado
$rutaLogo = "d:\Sigic\os\windows-live\personalizacion\logo-oficial.png"
if (Test-Path $rutaLogo) {
    $logoImg = [System.Drawing.Image]::FromFile($rutaLogo)
    $logoAncho = 260
    $logoAlto = [int](($logoImg.Height / $logoImg.Width) * $logoAncho)
    $logoX = [int](($ancho - $logoAncho) / 2)
    $logoY = [int](($alto / 2) - 180)
    $graphics.DrawImage($logoImg, $logoX, $logoY, $logoAncho, $logoAlto)
    $logoImg.Dispose()
}

# 4. Textos Institucionales
$fontTitulo = New-Object System.Drawing.Font ("Segoe UI", [float]40.0, [System.Drawing.FontStyle]::Bold)
$fontSub = New-Object System.Drawing.Font ("Segoe UI", [float]15.0, [System.Drawing.FontStyle]::Bold)
$fontFooter = New-Object System.Drawing.Font ("Segoe UI", [float]11.0, [System.Drawing.FontStyle]::Regular)

$brushBlanco = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$brushCeleste = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#38bdf8"))
$brushMuted = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#94a3b8"))

$formatCentro = New-Object System.Drawing.StringFormat
$formatCentro.Alignment = [System.Drawing.StringAlignment]::Center

$graphics.DrawString("SiGIC OS", $fontTitulo, $brushBlanco, ($ancho / 2), (($alto / 2) + 60), $formatCentro)
$graphics.DrawString("SISTEMA INTEGRAL DE GESTION INSTITUCIONAL", $fontSub, $brushCeleste, ($ancho / 2), (($alto / 2) + 125), $formatCentro)
$graphics.DrawString("Instituto Tecnologico Beltran - Entorno Seguro de Ceremonias y Acreditacion", $fontFooter, $brushMuted, ($ancho / 2), ($alto - 50), $formatCentro)

# 5. Guardar como BMP (estándar de Windows Boot / WinPE) y PNG
$destinoBmp = "d:\Sigic\os\windows-live\personalizacion\winpe_wallpaper.bmp"
$destinoJpg = "d:\Sigic\os\windows-live\personalizacion\winpe_wallpaper.jpg"
$bitmap.Save($destinoBmp, [System.Drawing.Imaging.ImageFormat]::Bmp)
$bitmap.Save($destinoJpg, [System.Drawing.Imaging.ImageFormat]::Jpeg)

$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Fondos de arranque de SiGIC OS generados con exito en:" -ForegroundColor Green
Write-Host "  - $destinoBmp" -ForegroundColor Yellow
Write-Host "  - $destinoJpg" -ForegroundColor Yellow
