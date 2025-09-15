@echo off
echo ===============================================
echo STARTING AI COORDINATE VIEWER
echo ===============================================
echo.

echo Killing any existing processes on port 3002...
echo.

REM Method 1: Kill processes on port 3002 using PowerShell
echo Using PowerShell to kill port 3002 processes...
powershell -Command "try { Get-NetTCPConnection -LocalPort 3002 -ErrorAction Stop | ForEach-Object { Write-Host 'Killing PID:' $_.OwningProcess; Stop-Process -Id $_.OwningProcess -Force } } catch { Write-Host 'No processes found on port 3002' }"

REM Method 2: Kill using netstat and taskkill with better parsing
echo Using netstat method...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002"') do (
    if not "%%a"=="" (
        echo Killing PID %%a
        taskkill /f /pid %%a >nul 2>&1
    )
)

REM Method 3: Kill all Node.js processes aggressively
echo Killing all Node.js and npm processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.cmd 2>nul
taskkill /f /im npm 2>nul
wmic process where "name='node.exe'" delete 2>nul

REM Method 4: Kill React scripts specifically
taskkill /f /im "react-scripts" 2>nul

REM Wait longer for processes to fully terminate
echo Waiting for processes to terminate...
timeout /t 3 /nobreak >nul

echo Port clearing completed!
echo.

echo Starting React development server on port 3002...
echo.

REM Try to start with automatic "no" response to port conflict
set PORT=3002
set SKIP_PREFLIGHT_CHECK=true

REM Create a temporary response file
echo n > temp_response.txt

REM Start npm with the response file
npm start < temp_response.txt

REM Clean up
del temp_response.txt 2>nul

echo.
echo ===============================================
echo AI COORDINATE VIEWER STOPPED
echo ===============================================
pause
