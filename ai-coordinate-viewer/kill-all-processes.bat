@echo off
echo ===============================================
echo KILLING ALL AI LAYOUT PROCESSES
echo ===============================================
echo.

echo Killing processes on port 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002"') do (
    echo Killing PID %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo Killing processes on port 3003...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3003"') do (
    echo Killing PID %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo Killing processes on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000"') do (
    echo Killing PID %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo Killing Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo Killing React Scripts processes...
taskkill /f /im react-scripts.cmd >nul 2>&1

echo Killing npm processes...
taskkill /f /im npm.cmd >nul 2>&1

echo.
echo All processes killed!
echo.
echo Port Status Check:
netstat -aon | find ":3002"
netstat -aon | find ":3003"
netstat -aon | find ":5000"
echo.
echo Ready to start fresh!
echo ===============================================
echo.
echo Starting npm...
echo ===============================================
npm start
