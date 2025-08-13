# Auto-Start Web App with Port Auto-Detection
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Auto-Start Web App (Port Auto-Find)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "$PSScriptRoot\ai-coordinate-viewer"

# Function to check if port is available
function Test-Port {
    param([int]$Port)
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    } catch {
        return $false
    }
}

# Find available port starting from 3002
$port = 3002
while (-not (Test-Port $port)) {
    Write-Host "⚠️ Port $port is busy, trying next port..." -ForegroundColor Yellow
    $port++
    if ($port -gt 3010) {
        Write-Host "❌ No available ports found between 3002-3010" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "✅ Port $port is available" -ForegroundColor Green
Write-Host "🚀 Starting React app on port $port..." -ForegroundColor Green

# Set environment variable and start with custom port
$env:PORT = $port
Write-Host "🔧 Using PORT=$port for React app..." -ForegroundColor Cyan

# Start React app with custom port (bypass package.json script)
& npx react-scripts start
