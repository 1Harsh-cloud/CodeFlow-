# Run from anywhere - paste in terminal or double-click
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
Set-Location $scriptDir
Write-Host "Starting CodeFlow Frontend..."
Write-Host "Open http://localhost:5173 in your browser"
Write-Host "Press Ctrl+C to stop"
Write-Host ""
npm run dev
