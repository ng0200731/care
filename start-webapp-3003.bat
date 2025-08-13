@echo off
echo ========================================
echo   Start Web App on Port 3003
echo ========================================
echo.

cd /d "%~dp0ai-coordinate-viewer"

echo 🚀 Starting React app on port 3003...
set PORT=3003
npm start
