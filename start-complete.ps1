#!/usr/bin/env pwsh
# Complete Application Startup and Test Script
# Spustí backend, frontend a provede základní testy

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  OPTIMALIZACE BRIDGE - START" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Nastavení error action
$ErrorActionPreference = "Continue"

# Kontrola Python
Write-Host "[1/6] Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  ✓ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Kontrola Node.js
Write-Host "[2/6] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found! Please install Node.js 16+" -ForegroundColor Red
    exit 1
}

# Kontrola npm packages
Write-Host "[3/6] Checking frontend dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ! Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install | Out-Null
    Set-Location ..
    Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green
}

# Kontrola Python venv
Write-Host "[4/6] Checking Python virtual environment..." -ForegroundColor Yellow
if (Test-Path "backend\venv\Scripts\activate") {
    Write-Host "  ✓ Virtual environment exists" -ForegroundColor Green
} else {
    Write-Host "  ! Creating virtual environment..." -ForegroundColor Yellow
    Set-Location backend
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt | Out-Null
    Set-Location ..
    Write-Host "  ✓ Virtual environment created" -ForegroundColor Green
}

# Spuštění Backend serveru
Write-Host "[5/6] Starting Backend Server..." -ForegroundColor Yellow
Set-Location backend

# Ukončit existující Python procesy na portu 8000
$existingProcess = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "  ! Killing existing process on port 8000..." -ForegroundColor Yellow
    Stop-Process -Id $existingProcess.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Spustit backend v samostatném okně (minimalizované)
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -WindowStyle Minimized -PassThru
Write-Host "  ✓ Backend started (PID: $($backendProcess.Id))" -ForegroundColor Green
Write-Host "  → http://localhost:8000" -ForegroundColor Cyan
Write-Host "  → http://localhost:8000/docs (API dokumentace)" -ForegroundColor Cyan

Set-Location ..

# Počkat na backend
Write-Host "  Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test backend health
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
    Write-Host "  ✓ Backend health check passed" -ForegroundColor Green
} catch {
    Write-Host "  ! Backend health check failed (may still be starting)" -ForegroundColor Yellow
}

# Spuštění Frontend serveru
Write-Host "[6/6] Starting Frontend Server..." -ForegroundColor Yellow
Set-Location frontend

# Ukončit existující procesy na portu 3000
$existingFrontend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($existingFrontend) {
    Write-Host "  ! Killing existing process on port 3000..." -ForegroundColor Yellow
    Stop-Process -Id $existingFrontend.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Spustit frontend v samostatném okně
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal -PassThru
Write-Host "  ✓ Frontend started (PID: $($frontendProcess.Id))" -ForegroundColor Green
Write-Host "  → http://localhost:3000" -ForegroundColor Cyan

Set-Location ..

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "  ✓ APPLICATION STARTED" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "  • Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  • Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  • API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Demo credentials:" -ForegroundColor Cyan
Write-Host "  • Admin:    admin / Admin123" -ForegroundColor White
Write-Host ""
Write-Host "Process IDs:" -ForegroundColor Cyan
Write-Host "  • Backend:  $($backendProcess.Id)" -ForegroundColor White
Write-Host "  • Frontend: $($frontendProcess.Id)" -ForegroundColor White
Write-Host ""
Write-Host "To stop servers:" -ForegroundColor Yellow
Write-Host "  Close the PowerShell windows or press Ctrl+C in each window" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Press any key to exit this window (servers will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
