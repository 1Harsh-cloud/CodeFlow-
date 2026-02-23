# Run from backend folder - double-click or: powershell -ExecutionPolicy Bypass -File run.ps1
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
Write-Host "Starting CodeFlow Backend..."
Write-Host "Press Ctrl+C to stop"
Write-Host ""
python app.py
