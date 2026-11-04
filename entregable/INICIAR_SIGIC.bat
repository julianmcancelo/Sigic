@echo off
title SiGIC - Centro de Control Docker
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0CentroControl.ps1"
if %ERRORLEVEL% NEQ 0 (
    pause
)