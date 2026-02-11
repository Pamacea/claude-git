# Git Flow Master - Web Interface Launcher (PowerShell)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Git Flow Master - Web Interface" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed." -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WebDir = Join-Path $ScriptDir "web"

# Check if dependencies are installed
if (-not (Test-Path (Join-Path $WebDir "node_modules"))) {
    Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
    Push-Location $WebDir
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Pop-Location
}

# Start server
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Server starting at http://localhost:3747" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Push-Location $WebDir
npm start
Pop-Location
