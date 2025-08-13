@echo off
echo ========================================
echo   Auto-Start Web App (Port Auto-Find)
echo ========================================
echo.

cd /d "%~dp0ai-coordinate-viewer"

:: Find available port starting from 3002
set "port=3002"

:check_port
echo 🔍 Checking port %port%...
netstat -an | find ":%port% " >nul
if %errorlevel% equ 0 (
    echo ⚠️ Port %port% is busy, trying next port...
    set /a "port+=1"
    goto check_port
) else (
    echo ✅ Port %port% is available
    goto start_app
)

:start_app
echo 🚀 Starting React app on port %port%...
set PORT=%port%
npm start
