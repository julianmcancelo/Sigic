@echo off
setlocal EnableDelayedExpansion
title SiGIC OS - Liberar Memoria RAM

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Liberar-RAM.ps1"

if "%1"=="" (
    pause
)
