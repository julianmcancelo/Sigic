@echo off
setlocal EnableDelayedExpansion
title SiGIC OS - Restaurar Valores Predeterminados

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Restaurar-Defaults.ps1"

pause
