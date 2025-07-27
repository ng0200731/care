Write-Host "Checking Node.js and npm versions..." -ForegroundColor Green
Write-Host ""

Write-Host "Node.js version:" -ForegroundColor Yellow
node --version

Write-Host "npm version:" -ForegroundColor Yellow  
npm --version

Write-Host "npx version:" -ForegroundColor Yellow
npx --version

Read-Host "Press Enter to continue"