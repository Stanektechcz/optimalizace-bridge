# Instalační a spouštěcí skript pro kompletní aplikaci
# Spouští backend i frontend najednou

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KALKULACE API - KOMPLETNÍ SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kontrola Python
Write-Host "1. Kontrola Python..." -ForegroundColor Yellow
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "   [!] Python není nainstalován!" -ForegroundColor Red
    exit 1
}
$pythonVersion = python --version
Write-Host "   [✓] $pythonVersion" -ForegroundColor Green

# Kontrola Node.js
Write-Host "2. Kontrola Node.js..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "   [!] Node.js není nainstalován!" -ForegroundColor Red
    Write-Host "   Stáhněte z: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
$nodeVersion = node --version
Write-Host "   [✓] Node.js $nodeVersion" -ForegroundColor Green

# Instalace backendu
Write-Host ""
Write-Host "3. Instalace backendu..." -ForegroundColor Yellow
Write-Host "   Vytvářím Python virtual environment..." -ForegroundColor Gray
Set-Location backend

if (-not (Test-Path "venv")) {
    python -m venv venv
}

Write-Host "   Aktivuji venv a instaluji závislosti..." -ForegroundColor Gray
.\venv\Scripts\Activate.ps1
pip install -q -r requirements.txt
Write-Host "   [✓] Backend dependencies nainstalovány" -ForegroundColor Green

Set-Location ..

# Instalace frontendu
Write-Host ""
Write-Host "4. Instalace frontendu..." -ForegroundColor Yellow
Set-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "   Instaluji NPM packages..." -ForegroundColor Gray
    npm install --silent
    Write-Host "   [✓] Frontend dependencies nainstalovány" -ForegroundColor Green
} else {
    Write-Host "   [✓] Frontend dependencies již nainstalovány" -ForegroundColor Green
}

Set-Location ..

# Vytvoření admin uživatele
Write-Host ""
Write-Host "5. Vytvoření admin uživatele..." -ForegroundColor Yellow
python create_admin.py
Write-Host ""

# Dotaz na spuštění
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALACE DOKONČENA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Chcete nyní spustit aplikaci? (Y/N): " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "Spouštím aplikaci..." -ForegroundColor Cyan
    Write-Host ""
    
    # Spuštění backendu v novém okně
    Write-Host "   • Backend server: http://localhost:8000" -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    
    Start-Sleep -Seconds 3
    
    # Spuštění frontendu v novém okně
    Write-Host "   • Frontend app: http://localhost:3000" -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  APLIKACE SPUŠTĚNA!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Backend:  http://localhost:8000/docs" -ForegroundColor White
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "  Demo přihlášení:" -ForegroundColor Yellow
    Write-Host "    Username: admin" -ForegroundColor Gray
    Write-Host "    Password: Admin123" -ForegroundColor Gray
    Write-Host ""
    
    Start-Sleep -Seconds 2
    
    # Otevření browseru
    Start-Process "http://localhost:3000"
} else {
    Write-Host ""
    Write-Host "Pro manuální spuštění použijte:" -ForegroundColor Yellow
    Write-Host "  Backend:  .\start-backend.ps1" -ForegroundColor Gray
    Write-Host "  Frontend: .\start-frontend.ps1" -ForegroundColor Gray
    Write-Host "  Nebo obojí: .\start-all.ps1" -ForegroundColor Gray
    Write-Host ""
}
