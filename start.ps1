Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Care Label Layout System - Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Killing existing Node.js processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✓ Node.js processes terminated" -ForegroundColor Green
} catch {
    Write-Host "✓ No Node.js processes found" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/4] Killing npm processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "npm*" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✓ npm processes terminated" -ForegroundColor Green
} catch {
    Write-Host "✓ No npm processes found" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/4] Killing processes using port 3002..." -ForegroundColor Yellow
try {
    $processes = netstat -ano | Select-String ":3002" | ForEach-Object {
        $fields = $_ -split '\s+'
        $pid = $fields[-1]
        if ($pid -ne "0") {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "✓ Process $pid terminated" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "✓ No processes found on port 3002" -ForegroundColor Green
}

Write-Host ""
Write-Host "[4/4] Starting React development server..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

if (-not (Test-Path "ai-coordinate-viewer")) {
    Write-Host "❌ Error: ai-coordinate-viewer folder not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this from the correct directory." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location "ai-coordinate-viewer"

if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "Make sure the ai-coordinate-viewer folder contains a React project." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Starting server on http://localhost:3002" -ForegroundColor Green
Write-Host ""

# Start npm
npm start

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Server stopped" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Read-Host "Press Enter to exit"
