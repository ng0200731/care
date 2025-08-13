@echo off
echo ========================================
echo   Start Web App (Kill Existing)
echo ========================================
echo.

cd /d "%~dp0ai-coordinate-viewer"

:: Kill any existing process on port 3002
echo 🔍 Checking for existing processes on port 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002" ^| find "LISTENING"') do (
    echo 🛑 Killing process %%a on port 3002...
    taskkill /f /pid %%a >nul 2>&1
)

:: Wait a moment for process to fully terminate
timeout /t 2 /nobreak >nul

echo ✅ Port 3002 is now available
echo 🚀 Starting React app on port 3002...
set PORT=3002
npm start
