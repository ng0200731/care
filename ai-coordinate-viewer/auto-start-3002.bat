@echo off
echo ===============================================
echo AUTO START ON PORT 3002 - AUTO ANSWER NO
===============================================
echo.

REM Clean up first
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Set environment variables
set PORT=3002
set BROWSER=none

echo Starting with automatic 'n' response to port conflict...
echo.

REM Create a response file that answers 'n' to the port question
echo n > response.txt
echo. >> response.txt

REM Start with the response file
npm start < response.txt

REM Clean up the response file
del response.txt 2>nul

echo.
echo ===============================================
echo AUTO START COMPLETED
echo ===============================================
pause
