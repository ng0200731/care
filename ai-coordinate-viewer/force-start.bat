@echo off
echo ===============================================
echo FORCE STARTING AI COORDINATE VIEWER ON PORT 3002
echo ===============================================
echo.

echo Step 1: Killing ALL Node.js processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.cmd 2>nul
taskkill /f /im npm 2>nul

echo Step 2: Killing processes by name pattern...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" ^| find "node.exe"') do taskkill /f /pid %%i 2>nul

echo Step 3: Using WMIC to kill stubborn processes...
wmic process where "name='node.exe'" delete 2>nul
wmic process where "CommandLine like '%%react-scripts%%'" delete 2>nul

echo Step 4: Waiting for cleanup...
timeout /t 5 /nobreak >nul

echo Step 5: Starting on port 3002 with force...
set PORT=3002
set BROWSER=none
set SKIP_PREFLIGHT_CHECK=true

echo Starting React development server...
echo If prompted about port conflict, the batch will exit and you can manually choose 'n'
echo.

npm start

echo.
echo ===============================================
echo AI COORDINATE VIEWER STOPPED
echo ===============================================
pause
