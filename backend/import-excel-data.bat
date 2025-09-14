@echo off
echo ========================================
echo Excel to Database Import Script
echo ========================================

REM Check if Python is installed
py --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

echo Installing required Python packages...
py -m pip install pandas openpyxl

echo.
echo Creating database tables...
py create_tables.py

echo.
echo Starting Excel import process...
py import_excel_data.py

echo.
echo Displaying sample data...
py query_data.py

echo.
echo Process completed!
pause
