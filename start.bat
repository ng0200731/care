@echo off
echo ========================================
echo  Care Label Layout System - Startup
echo ========================================
echo.

echo [1/4] Killing existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo [2/4] Killing npm processes...
taskkill /F /IM npm.cmd >nul 2>&1
taskkill /F /IM npm >nul 2>&1

echo.
echo [3/4] Waiting for cleanup...
timeout /t 2 /nobreak >nul

echo.
echo [4/4] Starting React development server...
echo ----------------------------------------
cd ai-coordinate-viewer
npm start

echo.
echo ========================================
echo  Server stopped
echo ========================================
pause
