@echo off
echo ========================================
echo   Database Setup Helper
echo ========================================
echo.

echo This script will help you set up the PostgreSQL database
echo.

:: Check if psql is available
psql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: PostgreSQL command line tools not found
    echo.
    echo Please install PostgreSQL from: https://www.postgresql.org/download/
    echo Make sure to include command line tools during installation
    echo.
    pause
    exit /b 1
)

echo ✅ PostgreSQL is installed:
psql --version

echo.
echo 🔧 Creating database 'care_db'...
echo.
echo Please enter your PostgreSQL superuser password when prompted:

:: Create the database
psql -U postgres -h localhost -c "CREATE DATABASE care_db;" 2>nul
if errorlevel 1 (
    echo.
    echo ⚠️  Database might already exist or there was an error
    echo Let's check if the database exists...
    
    psql -U postgres -h localhost -c "\l" | findstr care_db >nul
    if errorlevel 1 (
        echo ❌ Database 'care_db' was not created
        echo Please create it manually using pgAdmin or psql
    ) else (
        echo ✅ Database 'care_db' already exists
    )
) else (
    echo ✅ Database 'care_db' created successfully
)

echo.
echo 📝 Next steps:
echo 1. Update backend\.env file with your database credentials
echo 2. Run: setup-and-start.bat
echo.
echo 💡 Example DATABASE_URL format:
echo    DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/care_db"
echo.
pause
