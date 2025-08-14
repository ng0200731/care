Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "    🔥 KILLING ALL AI LAYOUT PROCESSES 🔥" -ForegroundColor Red
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "🎯 Killing processes on port 3002 (React App)..." -ForegroundColor Cyan
$processes3002 = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
if ($processes3002) {
    foreach ($proc in $processes3002) {
        Write-Host "Killing PID $($proc.OwningProcess)" -ForegroundColor Yellow
        Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "No processes found on port 3002" -ForegroundColor Gray
}

Write-Host "🎯 Killing processes on port 3003 (Backend)..." -ForegroundColor Cyan
$processes3003 = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
if ($processes3003) {
    foreach ($proc in $processes3003) {
        Write-Host "Killing PID $($proc.OwningProcess)" -ForegroundColor Yellow
        Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "No processes found on port 3003" -ForegroundColor Gray
}

Write-Host "🎯 Killing processes on port 5000 (API)..." -ForegroundColor Cyan
$processes5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($processes5000) {
    foreach ($proc in $processes5000) {
        Write-Host "Killing PID $($proc.OwningProcess)" -ForegroundColor Yellow
        Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "No processes found on port 5000" -ForegroundColor Gray
}

Write-Host "🎯 Killing Node.js processes..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Killed $($nodeProcesses.Count) Node.js processes" -ForegroundColor Yellow
} else {
    Write-Host "No Node.js processes found" -ForegroundColor Gray
}

Write-Host "🎯 Killing npm processes..." -ForegroundColor Cyan
$npmProcesses = Get-Process -Name "npm" -ErrorAction SilentlyContinue
if ($npmProcesses) {
    $npmProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Killed $($npmProcesses.Count) npm processes" -ForegroundColor Yellow
} else {
    Write-Host "No npm processes found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ All processes killed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Port Status Check:" -ForegroundColor Cyan
Write-Host "Port 3002:" -ForegroundColor White
Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue | Format-Table -AutoSize
Write-Host "Port 3003:" -ForegroundColor White  
Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue | Format-Table -AutoSize
Write-Host "Port 5000:" -ForegroundColor White
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Format-Table -AutoSize

Write-Host ""
Write-Host "🚀 Ready to start fresh!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting npm..." -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Yellow
npm start
