# BackTrack Local Process Stopper
Write-Host "Stopping all local BackTrack services (ports 3000, 8080, 8081)..." -ForegroundColor Yellow

$ports = @(3000, 8080, 8081)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pidToKill in $pids) {
            if ($pidToKill -and $pidToKill -ne 0) {
                try {
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                    Write-Host "Stopped process ID $pidToKill on port $port" -ForegroundColor Green
                } catch {}
            }
        }
    }
}

Write-Host "✅ All local BackTrack demo processes have been stopped." -ForegroundColor Green
