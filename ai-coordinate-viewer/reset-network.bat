@echo off
echo ===============================================
echo RESET NETWORK STACK TO CLEAR PORT 3002
===============================================
echo.
echo WARNING: This will reset network connections
echo Press Ctrl+C to cancel, or any key to continue...
pause >nul

echo Resetting network stack...
echo.

REM Reset TCP/IP stack
netsh int ip reset
netsh winsock reset

echo Network stack reset complete.
echo Please restart your computer for full effect.
echo.
echo Or try starting the app now - it might work without restart.
echo.

pause
