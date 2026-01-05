# Spuštění backendu i frontendu najednou

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPOUŠTĚNÍ KALKULACE API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Backend
Write-Host "Spouštím backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\venv\Scripts\Activate.ps1; Write-Host 'Backend Server - http://localhost:8000' -ForegroundColor Green; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

Start-Sleep -Seconds 3

# Frontend
Write-Host "Spouštím frontend app..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host 'Frontend App - http://localhost:3000' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  APLIKACE SPUŠTĚNA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend API:  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:     http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Frontend:     http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  Demo přihlášení:" -ForegroundColor Yellow
Write-Host "    Username: admin" -ForegroundColor Gray
Write-Host "    Password: Admin123" -ForegroundColor Gray
Write-Host ""

Start-Sleep -Seconds 2

# Otevření browseru
Start-Process "http://localhost:3000"

Write-Host "Pro zastavení aplikace zavřete otevřená PowerShell okna." -ForegroundColor Gray
Write-Host ""
