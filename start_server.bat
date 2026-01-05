@echo off
echo ========================================
echo   Spoustim Kalkulace API Server
echo ========================================
echo.

cd backend
call venv\Scripts\activate.bat
echo Aktivovan virtual environment
echo.

echo Spoustim server na http://localhost:8000
echo Pro zastaveni pouzijte CTRL+C
echo.

uvicorn app.main:app --host 0.0.0.0 --port 8000

pause
