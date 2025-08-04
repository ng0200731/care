# Stop Care Label Layout System
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Stopping Care Label Layout System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🛑 Stopping all Node.js processes..." -ForegroundColor Yellow

# Kill all node processes (this will stop both frontend and backend)
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ All Node.js processes stopped" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No Node.js processes were running" -ForegroundColor Blue
}

# Also try to kill npm processes
try {
    Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force
} catch {
    # npm processes might not exist, that's fine
}

Write-Host ""
Write-Host "✅ Application stopped successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 You can now:" -ForegroundColor Yellow
Write-Host "   - Restart with: .\setup-and-start.ps1" -ForegroundColor White
Write-Host "   - Or start normally with: .\start-app.ps1" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
