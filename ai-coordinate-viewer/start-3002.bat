@echo off
echo ===============================================
echo STARTING AI COORDINATE VIEWER ON PORT 3002
echo ===============================================
echo.

echo Setting environment for port 3002...
set PORT=3002
set BROWSER=none

echo Starting React development server...
echo.

npm start

echo.
echo ===============================================
echo AI COORDINATE VIEWER STOPPED
echo ===============================================
pause
