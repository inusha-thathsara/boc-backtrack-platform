# BackTrack Local Offline Demo Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Launching BackTrack Platform Local Demo (Offline Backup)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Feed API (Port 8080)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; `$host.UI.RawUI.WindowTitle = 'BackTrack - Feed API (8080)'; npm --prefix services/feed-api run dev"

# 2. Start WebSocket Gateway (Port 8081)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; `$host.UI.RawUI.WindowTitle = 'BackTrack - WebSocket Gateway (8081)'; npm --prefix services/websocket-gateway run dev"

# 3. Start Frontend Web Client (Port 3000)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; `$host.UI.RawUI.WindowTitle = 'BackTrack - Web Client (3000)'; npm --prefix web run dev"

Start-Sleep -Seconds 3
Write-Host "`n✅ All local services initiated!" -ForegroundColor Green
Write-Host "👉 Web App:           http://localhost:3000" -ForegroundColor Yellow
Write-Host "👉 Feed API Health:   http://localhost:8080/health" -ForegroundColor Yellow
Write-Host "👉 WebSocket Gateway: ws://localhost:8081" -ForegroundColor Yellow
Write-Host "`n💡 Run .\stop-local.ps1 or double-click stop-local.bat to stop all services." -ForegroundColor Cyan
