[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "SiGIC - Centro de Control Institucional"
Clear-Host

function Mostrar-Banner {
    Write-Host ""
    Write-Host "  ==========================================================================================" -ForegroundColor DarkCyan
    Write-Host "  ███████╗██╗ ██████╗ ██╗ ██████╗      CENTRO DE CONTROL DOCKER" -ForegroundColor Cyan
    Write-Host "  ██╔════╝██║██╔════╝ ██║██╔════╝      Sistema de Gestión Institucional de Colaciones" -ForegroundColor Cyan
    Write-Host "  ███████╗██║██║  ███╗██║██║           Instituto Tecnológico Beltrán" -ForegroundColor Cyan
    Write-Host "  ╚════██║██║██║   ██║██║██║           Tecnicatura Superior en Analista de Sistemas" -ForegroundColor Cyan
    Write-Host "  ███████║██║╚██████╔╝██║╚██████╗      Promoción 2026 · Entorno Contenerizado" -ForegroundColor Cyan
    Write-Host "  ╚══════╝╚═╝ ╚═════╝ ╚═╝ ╚═════╝" -ForegroundColor Cyan
    Write-Host "  ==========================================================================================" -ForegroundColor DarkCyan
    Write-Host ""
}

# Auto-detectar Docker Desktop en PATH o en ubicaciones estándar
$DockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $DockerCmd) {
    $PosiblesRutas = @(
        "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin\docker.exe",
        "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe"
    )
    foreach ($r in $PosiblesRutas) {
        if (Test-Path $r) {
            $dir = Split-Path $r
            $env:Path = "$dir;$env:Path"
            break
        }
    }
}

function Test-Docker {
    try {
        $out = & docker info 2>&1
        return ($LASTEXITCODE -eq 0)
    } catch {
        return $false
    }
}

do {
    Clear-Host
    Mostrar-Banner

    $DockerActivo = Test-Docker
    if ($DockerActivo) {
        Write-Host "  ● ESTADO MOTOR DOCKER : " -NoNewline -ForegroundColor Gray
        Write-Host "[ACTIVO / ONLINE]" -ForegroundColor Green
    } else {
        Write-Host "  ● ESTADO MOTOR DOCKER : " -NoNewline -ForegroundColor Gray
        Write-Host "[APAGADO - Requiere iniciar Docker Desktop]" -ForegroundColor Red
    }
    
    Write-Host "  ● URL PLATAFORMA WEB  : " -NoNewline -ForegroundColor Gray
    Write-Host "http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  ● BASE DE DATOS LOCAL : " -NoNewline -ForegroundColor Gray
    Write-Host "localhost:5432 (PostgreSQL 16)" -ForegroundColor Cyan
    Write-Host "  ──────────────────────────────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  DESPLIEGUE Y OPERACIÓN:" -ForegroundColor Yellow
    Write-Host "    [1] Iniciar Sistema Completo (Docker Local + Base de Datos)" -ForegroundColor White
    Write-Host "    [2] Abrir Plataforma en Navegador (http://localhost:3000)" -ForegroundColor White
    Write-Host "    [3] Ver Diagrama de Base de Datos Interactivo" -ForegroundColor White
    Write-Host ""
    Write-Host "  MONITOREO Y CONTROL:" -ForegroundColor Yellow
    Write-Host "    [4] Ver Estado de Contenedores (docker compose ps)" -ForegroundColor White
    Write-Host "    [5] Ver Logs en Vivo (Peticiones y eventos)" -ForegroundColor White
    Write-Host "    [6] Detener y Apagar Sistema (docker compose down)" -ForegroundColor White
    Write-Host "    [0] Salir" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  ──────────────────────────────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    
    $opcion = Read-Host "  Seleccione una opción [0-6]"

    switch ($opcion) {
        "1" {
            Write-Host ""
            Write-Host "  Iniciando contenedores Docker..." -ForegroundColor Cyan
            & docker compose up -d
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "  [OK] SiGIC se inició correctamente." -ForegroundColor Green
                Write-Host "  Abriendo http://localhost:3000 en el navegador..." -ForegroundColor Cyan
                Start-Sleep -Seconds 2
                Start-Process "http://localhost:3000"
            } else {
                Write-Host "  [ERROR] No se pudo iniciar. Asegúrese de que Docker Desktop esté abierto." -ForegroundColor Red
            }
            Write-Host ""
            Read-Host "  Presione Enter para volver al menú..."
        }
        "2" {
            Start-Process "http://localhost:3000"
        }
        "3" {
            $html = Join-Path $PSScriptRoot "documentacion\ESQUEMA_INTERACTIVO_BD.html"
            if (Test-Path $html) {
                Start-Process $html
            } else {
                Start-Process "http://localhost:3000"
            }
        }
        "4" {
            Write-Host ""
            & docker compose ps
            Write-Host ""
            Read-Host "  Presione Enter para volver al menú..."
        }
        "5" {
            Write-Host ""
            Write-Host "  Mostrando logs en vivo (Presione Ctrl+C para salir de los logs)..." -ForegroundColor Yellow
            & docker compose logs -f
        }
        "6" {
            Write-Host ""
            Write-Host "  Deteniendo contenedores..." -ForegroundColor Yellow
            & docker compose down
            Write-Host "  [OK] Contenedores detenidos y memoria liberada." -ForegroundColor Green
            Write-Host ""
            Read-Host "  Presione Enter para volver al menú..."
        }
        "0" {
            exit
        }
    }
} while ($true)
