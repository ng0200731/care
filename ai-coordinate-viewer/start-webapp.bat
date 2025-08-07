@echo off
echo ========================================
echo    AI Coordinate Viewer - Web App
echo ========================================
echo.

echo Killing existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo Node.js processes terminated
) else (
    echo No Node.js processes found
)

echo.
echo Killing existing npm processes...
taskkill /f /im npm.cmd >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

echo.
echo Killing processes on port 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002" ^| find "LISTENING"') do (
    echo Found process on port 3002: %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Killing React/Webpack processes...
wmic process where "commandline like '%%react-scripts%%'" delete >nul 2>&1
wmic process where "commandline like '%%webpack%%'" delete >nul 2>&1

echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo Starting AI Coordinate Viewer Web App...
echo Directory: %cd%
echo URL: http://localhost:3002
echo.

echo Installing dependencies...
call npm install

echo.
echo Starting development server...
echo Note: This will open in your default browser automatically
echo Press Ctrl+C to stop the server
echo.

REM Start the development server (React will open browser automatically)
call npm start

echo.
echo Server stopped
pause
