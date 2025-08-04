@echo off
echo ========================================
echo   Stopping Care Label Layout System
echo ========================================
echo.

echo 🛑 Stopping all Node.js processes...

:: Kill all node processes (this will stop both frontend and backend)
taskkill /f /im node.exe >nul 2>&1
if errorlevel 1 (
    echo ℹ️  No Node.js processes were running
) else (
    echo ✅ All Node.js processes stopped
)

:: Also try to kill npm processes
taskkill /f /im npm.cmd >nul 2>&1

echo.
echo ✅ Application stopped successfully!
echo.
echo 💡 You can now:
echo    - Restart with: setup-and-start.bat
echo    - Or start normally with: start-app.bat
echo.
pause
