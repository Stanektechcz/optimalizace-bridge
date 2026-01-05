#!/bin/bash
# Install and start script for complete application

echo "========================================"
echo "  KALKULACE API - COMPLETE SETUP"
echo "========================================"
echo ""

# Check Python
echo "1. Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "   [!] Python is not installed!"
    exit 1
fi
python3 --version
echo "   [✓] Python installed"

# Check Node.js
echo "2. Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "   [!] Node.js is not installed!"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi
node --version
echo "   [✓] Node.js installed"

# Install backend
echo ""
echo "3. Installing backend..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt
echo "   [✓] Backend dependencies installed"

cd ..

# Install frontend
echo ""
echo "4. Installing frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    npm install --silent
    echo "   [✓] Frontend dependencies installed"
else
    echo "   [✓] Frontend dependencies already installed"
fi

cd ..

# Create admin user
echo ""
echo "5. Creating admin user..."
python3 create_admin.py
echo ""

# Ask to start
echo ""
echo "========================================"
echo "  INSTALLATION COMPLETE!"
echo "========================================"
echo ""
echo -n "Start application now? (Y/N): "
read response

if [ "$response" = "Y" ] || [ "$response" = "y" ]; then
    echo ""
    echo "Starting application..."
    echo ""
    
    # Start backend
    echo "   • Backend server: http://localhost:8000"
    cd backend
    source venv/bin/activate
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    cd ..
    
    sleep 3
    
    # Start frontend
    echo "   • Frontend app: http://localhost:3000"
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo ""
    echo "========================================"
    echo "  APPLICATION STARTED!"
    echo "========================================"
    echo ""
    echo "  Backend:  http://localhost:8000/docs"
    echo "  Frontend: http://localhost:3000"
    echo ""
    echo "  Demo login:"
    echo "    Username: admin"
    echo "    Password: Admin123"
    echo ""
    echo "Press Ctrl+C to stop"
    
    # Wait for processes
    wait $BACKEND_PID $FRONTEND_PID
else
    echo ""
    echo "To start manually:"
    echo "  Backend:  ./start-backend.sh"
    echo "  Frontend: ./start-frontend.sh"
    echo "  Or both:  ./start-all.sh"
    echo ""
fi
