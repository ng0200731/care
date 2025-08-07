# AI Coordinate Viewer - Web App Startup Script (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AI Coordinate Viewer - Web App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔄 Killing existing Node.js processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Node.js processes terminated" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No Node.js processes found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🔄 Killing existing npm processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ npm processes terminated" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No npm processes found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🔄 Killing processes on port 3002..." -ForegroundColor Yellow
try {
    $processes = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    foreach ($processId in $processes) {
        Write-Host "🔍 Found process on port 3002: $processId" -ForegroundColor Cyan
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Process $processId terminated" -ForegroundColor Green
    }
    if (-not $processes) {
        Write-Host "ℹ️  No processes found on port 3002" -ForegroundColor Gray
    }
} catch {
    Write-Host "ℹ️  No processes found on port 3002" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🔄 Killing React/Webpack processes..." -ForegroundColor Yellow
try {
    Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like "*react-scripts*" -or $_.CommandLine -like "*webpack*" } | ForEach-Object { 
        Write-Host "🔍 Killing React/Webpack process: $($_.ProcessId)" -ForegroundColor Cyan
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue 
    }
    Write-Host "✅ React/Webpack processes cleaned" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No React/Webpack processes found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "⏳ Waiting 3 seconds for processes to fully terminate..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "🚀 Starting AI Coordinate Viewer Web App..." -ForegroundColor Green
Write-Host "📂 Directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "🌐 URL: http://localhost:3002" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Installing dependencies (if needed)..." -ForegroundColor Yellow
try {
    & npm install
    Write-Host "✅ Dependencies checked/installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Error installing dependencies: $_" -ForegroundColor Red
    Read-Host "Press Enter to continue anyway..."
}

Write-Host ""
Write-Host "🎯 Starting development server..." -ForegroundColor Green
Write-Host "⚠️  Note: This will open in your default browser" -ForegroundColor Yellow
Write-Host "🛑 Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

# Start the development server (React will open browser automatically)
try {
    & npm start
} catch {
    Write-Host "❌ Error starting server: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔴 Server stopped" -ForegroundColor Red
Read-Host "Press Enter to exit..."
