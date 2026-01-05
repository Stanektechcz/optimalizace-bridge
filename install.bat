@echo off
echo ========================================
echo   Kalkulace Web - Quick Installation
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.11+ from https://www.python.org/
    pause
    exit /b 1
)

echo [1/5] Checking Python version...
python --version

echo.
echo [2/5] Creating virtual environment...
cd backend
if exist venv (
    echo Virtual environment already exists. Skipping...
) else (
    python -m venv venv
    echo Virtual environment created.
)

echo.
echo [3/5] Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo [4/5] Installing Python dependencies...
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo [5/5] Setting up environment file...
cd ..
if exist .env (
    echo .env file already exists. Skipping...
) else (
    copy .env.example .env
    echo .env file created. Please edit it with your settings!
)

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Edit .env file with your database credentials
echo   2. Start PostgreSQL and Redis:
echo      docker-compose up -d postgres redis
echo   3. Run migrations:
echo      cd backend
echo      alembic upgrade head
echo   4. Start the server:
echo      uvicorn app.main:app --reload
echo.
echo Server will be available at:
echo   - API: http://localhost:8000
echo   - Docs: http://localhost:8000/docs
echo.
pause
