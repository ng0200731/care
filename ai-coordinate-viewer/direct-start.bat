@echo off
echo ===============================================
echo DIRECT START ON PORT 3002 - NO PORT CHECK
echo ===============================================
echo.

REM Clean up first
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Set all environment variables
set PORT=3002
set BROWSER=none
set SKIP_PREFLIGHT_CHECK=true
set CI=true
set FORCE_COLOR=1

echo Environment set for port 3002...
echo.

REM Try different approaches
echo Attempt 1: Direct webpack-dev-server...
node node_modules\react-scripts\scripts\start.js

REM If that fails, try the npm approach with auto-response
if %errorlevel% neq 0 (
    echo.
    echo Attempt 2: npm start with auto-response...
    echo n | npm start
)

echo.
echo ===============================================
echo DIRECT START COMPLETED
echo ===============================================
pause
