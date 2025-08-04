@echo off
echo ========================================
echo   Care Label Layout System Startup
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

echo ✅ Node.js is installed
node --version

:: Check if PostgreSQL is running
echo.
echo 🔍 Checking PostgreSQL connection...
pg_isready -h localhost -p 5432 >nul 2>&1
if errorlevel 1 (
    echo ⚠️  WARNING: PostgreSQL might not be running
    echo Please make sure PostgreSQL is started
    echo.
)

:: Navigate to backend directory
echo.
echo 🚀 Starting Backend API Server...
cd /d "%~dp0backend"

:: Check if .env file exists
if not exist ".env" (
    echo ❌ ERROR: .env file not found in backend directory
    echo Please copy .env.example to .env and configure your database settings
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing backend dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
)

:: Check if Prisma client is generated
if not exist "src\generated" (
    echo 🔧 Generating Prisma client...
    npx prisma generate
    if errorlevel 1 (
        echo ❌ ERROR: Failed to generate Prisma client
        pause
        exit /b 1
    )
)

:: Start backend server in a new window
echo ✅ Starting backend server on port 3001...
start "Backend API Server" cmd /k "npm run dev"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Navigate to frontend directory
cd /d "%~dp0ai-coordinate-viewer"

:: Check if frontend node_modules exists
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

:: Start frontend server in a new window
echo ✅ Starting frontend server on port 3000...
start "Frontend React App" cmd /k "npm start"

:: Wait a moment
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   🎉 Application Started Successfully!
echo ========================================
echo.
echo 🌐 Frontend (React):  http://localhost:3000
echo 🔧 Backend API:       http://localhost:3001
echo 📊 API Health Check:  http://localhost:3001/health
echo 💾 Database Admin:    npx prisma studio (run in backend folder)
echo.
echo 📝 Note: Two command windows will open:
echo    - Backend API Server (port 3001)
echo    - Frontend React App (port 3000)
echo.
echo ⚠️  To stop the servers, close both command windows
echo    or press Ctrl+C in each window
echo.
echo 🔍 If you see any errors, check the command windows for details
echo.
pause
