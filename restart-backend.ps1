# PowerShell script to cleanly restart the backend server with VDA fixes

Write-Host "=== Restarting Backend Server ===" -ForegroundColor Cyan
Write-Host ""

# Kill all Python/uvicorn processes
Write-Host "1. Killing all existing backend servers..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*python*" -and $_.CommandLine -like "*uvicorn*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Verify they're dead
$remaining = Get-Process | Where-Object {$_.ProcessName -like "*python*" -and $_.CommandLine -like "*uvicorn*"} | Measure-Object
if ($remaining.Count -gt 0) {
    Write-Host "   WARNING: $($remaining.Count) backend processes still running" -ForegroundColor Red
} else {
    Write-Host "   All backend servers stopped" -ForegroundColor Green
}

Write-Host ""
Write-Host "2. Starting fresh backend server..." -ForegroundColor Yellow
Set-Location "D:\01 - Projects\SALT-Tax-Tool-Clean\backend"

# Start backend in background
$process = Start-Process -FilePath ".\venv\Scripts\python.exe" -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000" -PassThru -WindowStyle Hidden

Write-Host "   Backend started (PID: $($process.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "3. Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if it's running
if (Get-Process -Id $process.Id -ErrorAction SilentlyContinue) {
    Write-Host "   Backend is running" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== Backend Ready ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Server running on: http://localhost:8000" -ForegroundColor White
    Write-Host "API docs: http://localhost:8000/docs" -ForegroundColor White
    Write-Host "Process ID: $($process.Id)" -ForegroundColor White
    Write-Host ""
    Write-Host "VDA fixes applied:" -ForegroundColor Green
    Write-Host "  - Fixed 3 bugs in backend/app/api/v1/vda.py"
    Write-Host "  - Fixed 2 bugs in backend/app/services/vda_calculator.py"
    Write-Host "  - All queries now use .eq('id', analysis_id)"
    Write-Host ""
    Write-Host "To stop backend:" -ForegroundColor Yellow
    Write-Host "  Stop-Process -Id $($process.Id)"
} else {
    Write-Host "   Backend failed to start!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check for errors in the backend directory"
    exit 1
}
