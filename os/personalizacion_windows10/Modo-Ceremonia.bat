@echo off
setlocal EnableDelayedExpansion
title SiGIC OS - Modo Ceremonia

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Modo-Ceremonia.ps1" -Accion Alternar

if "%1"=="" (
    pause
)
