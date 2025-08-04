# Care Label Layout System Setup and Start Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Care Label Layout System Setup" -ForegroundColor Cyan
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

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm is available: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: npm is not available" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Setup Backend
Write-Host ""
Write-Host "🔧 Setting up Backend..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\backend"

# Check if .env file exists
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "⚠️  IMPORTANT: Please edit backend\.env file and update your database settings!" -ForegroundColor Yellow
        Write-Host "   Especially the DATABASE_URL with your PostgreSQL credentials" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter after you've updated the .env file"
    } else {
        Write-Host "❌ ERROR: .env.example file not found" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Install backend dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Failed to install backend dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
}

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Failed to generate Prisma client" -ForegroundColor Red
    Write-Host "Make sure your DATABASE_URL in .env is correct" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✅ Prisma client generated" -ForegroundColor Green

# Run database migrations
Write-Host "🗄️  Setting up database..." -ForegroundColor Yellow
npx prisma migrate dev --name init
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Database migration failed" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL is running" -ForegroundColor Yellow
    Write-Host "  2. Database 'care_db' exists" -ForegroundColor Yellow
    Write-Host "  3. DATABASE_URL in .env is correct" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✅ Database setup complete" -ForegroundColor Green

# Setup Frontend
Write-Host ""
Write-Host "🔧 Setting up Frontend..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\ai-coordinate-viewer"

# Install frontend dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Failed to install frontend dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   🎉 Setup Complete! Starting Servers..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start backend server
Write-Host "🚀 Starting Backend API Server..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Backend API Server' -ForegroundColor Green; Write-Host '=====================' -ForegroundColor Green; npm run dev"

# Wait for backend to start
Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend server
Write-Host "🚀 Starting Frontend React App..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\ai-coordinate-viewer"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Frontend React App' -ForegroundColor Green; Write-Host '===================' -ForegroundColor Green; npm start"

# Wait a moment
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   🎉 Application Started Successfully!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Frontend (React):  http://localhost:3000" -ForegroundColor Green
Write-Host "🔧 Backend API:       http://localhost:3001" -ForegroundColor Green
Write-Host "📊 API Health Check:  http://localhost:3001/health" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Useful Commands:" -ForegroundColor Yellow
Write-Host "   - Database Admin:   cd backend && npx prisma studio" -ForegroundColor White
Write-Host "   - View Logs:        Check the opened PowerShell windows" -ForegroundColor White
Write-Host "   - Stop Servers:     Close both PowerShell windows or Ctrl+C" -ForegroundColor White
Write-Host ""
Write-Host "🔍 If you encounter issues:" -ForegroundColor Yellow
Write-Host "   1. Check both PowerShell windows for error messages" -ForegroundColor White
Write-Host "   2. Verify PostgreSQL is running" -ForegroundColor White
Write-Host "   3. Check backend\.env file has correct database settings" -ForegroundColor White
Write-Host ""

# Try to open the health check in browser
Write-Host "🌐 Opening health check in browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:3001/health"

Write-Host ""
Read-Host "Press Enter to exit this setup window"
