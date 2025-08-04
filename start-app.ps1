# Care Label Layout System Start Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Care Label Layout System Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if PostgreSQL is running
Write-Host ""
Write-Host "🔍 Checking PostgreSQL connection..." -ForegroundColor Yellow
try {
    pg_isready -h localhost -p 5432 | Out-Null
    Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  WARNING: PostgreSQL might not be running" -ForegroundColor Yellow
    Write-Host "Please make sure PostgreSQL is started" -ForegroundColor Yellow
    Write-Host ""
}

# Check backend setup
Write-Host ""
Write-Host "🚀 Starting Backend API Server..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\backend"

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ ERROR: .env file not found in backend directory" -ForegroundColor Red
    Write-Host "Please run setup-and-start.ps1 first or copy .env.example to .env" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Failed to install backend dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check if Prisma client is generated
if (-not (Test-Path "src\generated")) {
    Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Failed to generate Prisma client" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Start backend server in a new PowerShell window
Write-Host "✅ Starting backend server on port 3001..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; Write-Host 'Backend API Server' -ForegroundColor Green; Write-Host '=====================' -ForegroundColor Green; npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Check frontend setup
Set-Location -Path "$PSScriptRoot\ai-coordinate-viewer"

# Check if frontend node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Failed to install frontend dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Start frontend server in a new PowerShell window
Write-Host "✅ Starting frontend server on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\ai-coordinate-viewer'; Write-Host 'Frontend React App' -ForegroundColor Green; Write-Host '===================' -ForegroundColor Green; npm start"

# Wait a moment
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   🎉 Application Started Successfully!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Frontend (React):  http://localhost:3000" -ForegroundColor Green
Write-Host "🔧 Backend API:       http://localhost:3001" -ForegroundColor Green
Write-Host "📊 API Health Check:  http://localhost:3001/health" -ForegroundColor Green
Write-Host "💾 Database Admin:    npx prisma studio (run in backend folder)" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Note: Two PowerShell windows will open:" -ForegroundColor Yellow
Write-Host "   - Backend API Server (port 3001)" -ForegroundColor White
Write-Host "   - Frontend React App (port 3000)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  To stop the servers, close both PowerShell windows" -ForegroundColor Yellow
Write-Host "   or press Ctrl+C in each window" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 If you see any errors, check the PowerShell windows for details" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit this startup window"
