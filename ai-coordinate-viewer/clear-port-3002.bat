@echo off
echo ===============================================
echo CLEARING PORT 3002 COMPLETELY
echo ===============================================
echo.

echo Killing all processes using port 3002...

REM Method 1: PowerShell approach
powershell -Command "Get-Process | Where-Object {$_.ProcessName -eq 'node'} | Stop-Process -Force" 2>nul

REM Method 2: Find and kill by port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do (
    echo Found process %%a on port 3002, killing...
    taskkill /f /pid %%a 2>nul
)

REM Method 3: Kill all Node and npm processes
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.cmd 2>nul
taskkill /f /im npm 2>nul

REM Method 4: WMIC kill
wmic process where "name='node.exe'" delete 2>nul

REM Method 5: Kill any React processes
taskkill /f /fi "WINDOWTITLE eq *react-scripts*" 2>nul

echo Waiting 10 seconds for complete port release...
timeout /t 10 /nobreak >nul

echo Checking if port 3002 is now free...
netstat -ano | findstr :3002
if %errorlevel% equ 0 (
    echo WARNING: Port 3002 still in use!
    echo Trying one more aggressive kill...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do taskkill /f /pid %%a
    timeout /t 5 /nobreak >nul
) else (
    echo SUCCESS: Port 3002 is now free!
)

echo ===============================================
echo PORT 3002 CLEARING COMPLETE
echo ===============================================
pause
