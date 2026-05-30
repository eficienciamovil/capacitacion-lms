@echo off
echo ============================================
echo   LMS - Sistema de Capacitacion
echo ============================================

echo.
echo [1/3] Instalando dependencias del servidor...
cd server
call npm install
if %errorlevel% neq 0 ( echo ERROR: Fallo la instalacion del servidor & pause & exit /b 1 )

echo.
echo [2/3] Instalando dependencias del cliente...
cd ..\client
call npm install
if %errorlevel% neq 0 ( echo ERROR: Fallo la instalacion del cliente & pause & exit /b 1 )

cd ..

echo.
echo [3/3] Iniciando servidor y cliente...
echo.
echo  Servidor: http://localhost:5000
echo  Cliente:  http://localhost:5173
echo  Admin:    admin@lms.com / admin123
echo.

start cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 2 /nobreak >nul
start cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Abriendo navegador en 5 segundos...
timeout /t 5 /nobreak >nul
start http://localhost:5173
