@echo off
setlocal
title SiGIC - Formateo y Reset de Fabrica
cls
color 0C

echo =========================================================================
echo   SiGIC - RESTABLECIMIENTO DE FABRICA Y FORMATEO DE BASE DE DATOS
echo   Instituto Tecnologico Beltran - Entorno Docker
echo =========================================================================
echo.
echo   ADVERTENCIA: Esta operacion borrara por completo los datos cargados
echo   en PostgreSQL (egresados, ceremonias, invitados y cuentas creadas)
echo   y restaurara el esquema virgen original desde init.sql.
echo.
echo   El sistema volvera al estado inicial (Asistente de Primer Inicio).
echo.
set /p confirmar="   Estas seguro de formatear la base de datos? (Escribi SI para confirmar): "

if /i not "%confirmar%"=="SI" (
    echo.
    echo   Operacion cancelada por el usuario.
    echo.
    pause
    exit /b 0
)

echo.
echo   [1/3] Deteniendo y eliminando contenedores actuales...
docker compose down -v 2>nul
docker rm -f sigic-plataforma sigic-postgres 2>nul

echo   [2/3] Eliminando volumenes persistentes de base de datos...
docker volume rm -f entregable_sigic_pgdata 2>nul
docker volume rm -f sigic_sigic_pgdata 2>nul

echo   [3/3] Re-desplegando contenedores limpios con esquema inicial init.sql...
docker compose up -d

echo.
color 0A
echo =========================================================================
echo   [OK] FORMATEO COMPLETADO CON EXITO
echo   La base de datos fue restablecida a su estado de fabrica.
echo   Acceso: http://localhost:3000
echo =========================================================================
echo.
timeout /t 2 /nobreak >nul
start http://localhost:3000
pause
