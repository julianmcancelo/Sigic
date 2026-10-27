# ==============================================================================
# SiGIC OS - Utilidad de Optimizacion y Liberacion de Memoria RAM en Vivo
# Instituto Tecnologico Beltran · Tecnicatura Superior en Analista de Sistemas
# ==============================================================================

[CmdletBinding()]
param()

$EsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $EsAdmin) {
    Write-Warning "Requiere permisos de Administrador para purgar memoria del sistema."
    Start-Process powershell.exe -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"") -Verb RunAs
    exit
}

$Host.UI.RawUI.WindowTitle = "SiGIC OS - Liberador de Memoria RAM"

function Obtener-RamEnUsoMB {
    $os = Get-CimInstance Win32_OperatingSystem
    $total = [math]::Round($os.TotalVisibleMemorySize / 1024, 0)
    $libre = [math]::Round($os.FreePhysicalMemory / 1024, 0)
    return @{
        Total = $total
        EnUso = ($total - $libre)
        Libre = $libre
        Porcentaje = [math]::Round((($total - $libre) / $total) * 100, 1)
    }
}

$antes = Obtener-RamEnUsoMB

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "             SiGIC OS - LIBERADOR DE MEMORIA RAM EN VIVO                      " -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Estado Inicial:" -ForegroundColor Yellow
Write-Host "  RAM Total:    $($antes.Total) MB" -ForegroundColor Gray
Write-Host "  RAM en Uso:   $($antes.EnUso) MB ($($antes.Porcentaje)%)" -ForegroundColor Yellow
Write-Host "  RAM Libre:    $($antes.Libre) MB" -ForegroundColor Gray
Write-Host ""
Write-Host "Purgando conjuntos de trabajo (Working Sets) y Standby List..." -ForegroundColor Cyan

# Definir firma de API Win32 psapi.dll
$firmas = @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

public class LimpiadorMemoria {
    [DllImport("psapi.dll")]
    public static extern int EmptyWorkingSet(IntPtr hwProc);

    public static void PurgarTodo() {
        Process[] procesos = Process.GetProcesses();
        foreach (Process p in procesos) {
            try {
                EmptyWorkingSet(p.Handle);
            } catch {}
        }
    }
}
"@

Add-Type -TypeDefinition $firmas -ErrorAction SilentlyContinue
[LimpiadorMemoria]::PurgarTodo()
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Start-Sleep -Milliseconds 800
$despues = Obtener-RamEnUsoMB
$liberado = [math]::Max(0, ($antes.EnUso - $despues.EnUso))

Write-Host ""
Write-Host "Estado Final:" -ForegroundColor Green
Write-Host "  RAM en Uso:   $($despues.EnUso) MB ($($despues.Porcentaje)%)" -ForegroundColor Green
Write-Host "  RAM Libre:    $($despues.Libre) MB" -ForegroundColor Green
Write-Host "  Memoria Recuperada: $liberado MB" -ForegroundColor White
Write-Host ""
Write-Host "Proceso completado exitosamente." -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 2
