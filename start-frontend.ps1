# Spuštění pouze frontendu

Write-Host "Spouštím Frontend App..." -ForegroundColor Cyan
Write-Host ""

Set-Location frontend

Write-Host "Frontend App: http://localhost:3000" -ForegroundColor Green
Write-Host ""

npm run dev
