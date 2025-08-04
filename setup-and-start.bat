@echo off
echo ========================================
echo   Care Label Layout System Setup
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed: 
node --version

:: Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: npm is not available
    pause
    exit /b 1
)

echo ✅ npm is available: 
npm --version

:: Navigate to backend directory for setup
echo.
echo 🔧 Setting up Backend...
cd /d "%~dp0backend"

:: Check if .env file exists, if not copy from example
if not exist ".env" (
    if exist ".env.example" (
        echo 📝 Creating .env file from .env.example...
        copy ".env.example" ".env" >nul
        echo ⚠️  IMPORTANT: Please edit backend\.env file and update your database settings!
        echo    Especially the DATABASE_URL with your PostgreSQL credentials
        echo.
        pause
    ) else (
        echo ❌ ERROR: .env.example file not found
        pause
        exit /b 1
    )
)

:: Install backend dependencies
if not exist "node_modules" (
    echo 📦 Installing backend dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo ✅ Backend dependencies installed
)

:: Generate Prisma client
echo 🔧 Generating Prisma client...
npx prisma generate
if errorlevel 1 (
    echo ❌ ERROR: Failed to generate Prisma client
    echo Make sure your DATABASE_URL in .env is correct
    pause
    exit /b 1
)
echo ✅ Prisma client generated

:: Run database migrations
echo 🗄️  Setting up database...
npx prisma migrate dev --name init
if errorlevel 1 (
    echo ❌ ERROR: Database migration failed
    echo Please check:
    echo   1. PostgreSQL is running
    echo   2. Database 'care_db' exists
    echo   3. DATABASE_URL in .env is correct
    pause
    exit /b 1
)
echo ✅ Database setup complete

:: Navigate to frontend directory
echo.
echo 🔧 Setting up Frontend...
cd /d "%~dp0ai-coordinate-viewer"

:: Install frontend dependencies
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo ✅ Frontend dependencies installed
)

echo.
echo ========================================
echo   🎉 Setup Complete! Starting Servers...
echo ========================================
echo.

:: Start backend server
echo 🚀 Starting Backend API Server...
cd /d "%~dp0backend"
start "Backend API Server" cmd /k "echo Backend API Server && echo ===================== && npm run dev"

:: Wait for backend to start
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

:: Start frontend server
echo 🚀 Starting Frontend React App...
cd /d "%~dp0ai-coordinate-viewer"
start "Frontend React App" cmd /k "echo Frontend React App && echo =================== && npm start"

:: Wait a moment
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   🎉 Application Started Successfully!
echo ========================================
echo.
echo 🌐 Frontend (React):  http://localhost:3000
echo 🔧 Backend API:       http://localhost:3001
echo 📊 API Health Check:  http://localhost:3001/health
echo.
echo 💡 Useful Commands:
echo    - Database Admin:   cd backend && npx prisma studio
echo    - View Logs:        Check the opened command windows
echo    - Stop Servers:     Close both command windows or Ctrl+C
echo.
echo 🔍 If you encounter issues:
echo    1. Check both command windows for error messages
echo    2. Verify PostgreSQL is running
echo    3. Check backend\.env file has correct database settings
echo.

:: Try to open the health check in browser
echo 🌐 Opening health check in browser...
timeout /t 2 /nobreak >nul
start http://localhost:3001/health

echo.
echo Press any key to exit this setup window...
pause >nul
