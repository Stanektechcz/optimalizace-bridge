# Spuštění pouze backendu

Write-Host "Spouštím Backend Server..." -ForegroundColor Cyan
Write-Host ""

Set-Location backend
.\venv\Scripts\Activate.ps1

Write-Host "Backend Server: http://localhost:8000" -ForegroundColor Green
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
