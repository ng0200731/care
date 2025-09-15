@echo off
echo ===============================================
echo FORCE START ON PORT 3002 - BYPASS PORT CHECK
echo ===============================================
echo.

REM Kill any existing processes first
echo Killing existing Node processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.cmd 2>nul
wmic process where "name='node.exe'" delete 2>nul

REM Wait for cleanup
timeout /t 3 /nobreak >nul

REM Set environment variables to force port 3002
set PORT=3002
set BROWSER=none
set SKIP_PREFLIGHT_CHECK=true
set CI=true

echo Starting with forced environment settings...
echo PORT=3002
echo SKIP_PREFLIGHT_CHECK=true
echo CI=true
echo.

REM Use the direct react-scripts command instead of npm start
echo Running: npx react-scripts start
npx react-scripts start

echo.
echo ===============================================
echo FORCE START COMPLETED
echo ===============================================
pause
