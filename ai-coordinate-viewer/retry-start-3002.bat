@echo off
echo ===============================================
echo RETRY START ON PORT 3002 - MULTIPLE ATTEMPTS
===============================================
echo.

:RETRY
echo Attempt to start on port 3002...
echo.

REM Kill any processes first
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Set environment
set PORT=3002
set BROWSER=none

REM Create response file
echo n > response.txt
echo. >> response.txt

REM Try to start
npm start < response.txt

REM Clean up
del response.txt 2>nul

echo.
echo React exited. Waiting 3 seconds before retry...
timeout /t 3 /nobreak >nul

echo.
echo Trying again...
echo.

REM Second attempt - this time it might work
set PORT=3002
npm start

echo.
echo ===============================================
echo RETRY START COMPLETED
echo ===============================================
pause
