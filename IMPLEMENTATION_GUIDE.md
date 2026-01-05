# Implementační Příručka - Web Bridge Kalkulace

## 🚀 Quick Start Guide

### Prerekvizity
```bash
# Lokální vývoj
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose
```

### 1. Projekt Setup

```bash
# Vytvořit strukturu projektu
mkdir -p kalkulace-web/{backend,frontend,nginx,docs}
cd kalkulace-web

# Inicializace Git
git init
git remote add origin https://github.com/your-org/kalkulace-web.git

# Kopírovat existující libs
cp -r ../Optimalizace-Bridge/libs ./backend/libs

# Vytvořit .gitignore
cat > .gitignore << EOF
__pycache__/
*.pyc
.env
venv/
node_modules/
build/
dist/
.DS_Store
*.log
EOF
```

### 2. Backend Setup

```bash
cd backend

# Python virtual environment
python3.11 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Vytvořit requirements.txt
cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
celery==5.3.4
redis==5.0.1
pandas==2.1.3
numpy==1.26.2
scipy==1.11.4
matplotlib==3.8.2
openpyxl==3.1.2
python-dotenv==1.0.0
aiofiles==23.2.1
watchdog==3.0.0
EOF

pip install -r requirements.txt

# Vytvořit strukturu
mkdir -p app/{api,models,schemas,services,core,utils}
touch app/__init__.py
```

#### Backend Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI aplikace
│   ├── config.py               # Nastavení (env variables)
│   ├── database.py             # SQLAlchemy setup
│   ├── celery_app.py          # Celery instance
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # Autentizace endpoints
│   │   │   ├── users.py        # User management
│   │   │   ├── files.py        # File upload/download
│   │   │   ├── calculations.py # Kalkulace API
│   │   │   ├── configurations.py
│   │   │   ├── external.py     # Externí API
│   │   │   └── admin.py        # Admin endpoints
│   │   └── deps.py             # Dependencies (auth, db)
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── file.py
│   │   ├── calculation.py
│   │   ├── configuration.py
│   │   └── api_key.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py             # Pydantic schemas
│   │   ├── file.py
│   │   ├── calculation.py
│   │   └── configuration.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── file_service.py
│   │   ├── calculation_service.py
│   │   ├── calculation_engine.py  # Bridge k libs/
│   │   └── notification_service.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, password hashing
│   │   └── config.py           # Settings class
│   │
│   └── utils/
│       ├── __init__.py
│       ├── validators.py
│       └── formatters.py
│
├── libs/                        # Zkopírováno z desktop app
│   ├── __init__.py
│   ├── config.py
│   ├── process.py
│   ├── load.py
│   ├── funsCost.py
│   ├── funsData.py
│   ├── funsChart.py
│   ├── funsProcess.py
│   └── funsProcessGEKKO.py
│
├── alembic/                     # Database migrations
│   └── versions/
├── tests/
│   ├── test_auth.py
│   ├── test_files.py
│   └── test_calculations.py
├── uploads/                     # User uploaded files
├── requirements.txt
├── .env.example
├── Dockerfile
└── README.md
```

### 3. Backend Core Files

#### `app/config.py`
```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Kalkulace API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000"]
    
    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # Libs path (pro bridge mechanismus)
    LIBS_PATH: str = "./libs"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

#### `app/database.py`
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### `app/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import auth, users, files, calculations, configurations

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(files.router, prefix=f"{settings.API_V1_STR}/files", tags=["files"])
app.include_router(calculations.router, prefix=f"{settings.API_V1_STR}/calculations", tags=["calculations"])
app.include_router(configurations.router, prefix=f"{settings.API_V1_STR}/configurations", tags=["configurations"])

@app.get("/")
async def root():
    return {"message": "Kalkulace API", "version": settings.VERSION}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

#### `app/models/user.py`
```python
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(String(50), default="user")  # user, admin
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
```

#### `app/core/security.py`
```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
```

#### `app/services/calculation_engine.py` (Bridge!)
```python
import importlib
import sys
from pathlib import Path
from typing import Dict, Any
from app.config import settings

class CalculationEngine:
    """
    Bridge k existujícímu Python výpočetnímu enginu.
    Umožňuje hot-reload změn v libs/ bez restartu aplikace.
    """
    
    def __init__(self):
        self.libs_path = Path(settings.LIBS_PATH)
        self.loaded_modules = {}
        self.last_modified = {}
        
    def _check_updates(self):
        """Kontrola a reload změněných modulů"""
        for py_file in self.libs_path.glob("*.py"):
            if py_file.name == "__init__.py":
                continue
                
            mtime = py_file.stat().st_mtime
            module_name = py_file.stem
            
            if module_name not in self.last_modified or \
               self.last_modified[module_name] < mtime:
                self._reload_module(module_name)
                self.last_modified[module_name] = mtime
                
    def _reload_module(self, module_name: str):
        """Hot reload Python modulu"""
        module_path = self.libs_path / f"{module_name}.py"
        
        # Odstranit starý modul ze sys.modules
        full_name = f"libs.{module_name}"
        if full_name in sys.modules:
            del sys.modules[full_name]
        
        # Přidat libs do sys.path pokud tam není
        libs_parent = str(self.libs_path.parent)
        if libs_parent not in sys.path:
            sys.path.insert(0, libs_parent)
        
        # Import nového modulu
        spec = importlib.util.spec_from_file_location(full_name, module_path)
        module = importlib.util.module_from_spec(spec)
        sys.modules[full_name] = module
        spec.loader.exec_module(module)
        
        self.loaded_modules[module_name] = module
        print(f"✓ Reloaded module: {module_name}")
        
    def calculate(self, config: Dict[str, Any], progress_callback=None):
        """
        Hlavní výpočetní funkce - bridge k libs/process.py
        
        Args:
            config: Dictionary s konfigurací (stejný formát jako INI)
            progress_callback: Funkce pro aktualizaci progressu
            
        Returns:
            Dictionary s výsledky kalkulace
        """
        # Kontrola updates před výpočtem
        self._check_updates()
        
        # Import process modulu
        process = self.loaded_modules.get("process")
        if not process:
            # První načtení
            self._reload_module("process")
            process = self.loaded_modules["process"]
        
        # Mock progress bar a label (původně PySide6 widgety)
        class MockProgressBar:
            def __init__(self, callback=None):
                self.callback = callback
                self._value = 0
                
            def setValue(self, value):
                self._value = value
                if self.callback:
                    self.callback(value)
                    
            def value(self):
                return self._value
        
        class MockLabel:
            def __init__(self):
                self._text = ""
                
            def setText(self, text):
                self._text = text
                
            def setStyleSheet(self, style):
                pass
        
        class MockConsole:
            def __init__(self):
                self.logs = []
                
            def insertPlainText(self, text):
                self.logs.append(text)
        
        # Vytvořit mock objekty
        progress_bar = MockProgressBar(progress_callback)
        label = MockLabel()
        console = MockConsole()
        
        # Spustit výpočet
        try:
            results = process.calculate(config, progress_bar, label, console)
            
            # Přidat logy do výsledků
            results["logs"] = console.logs
            
            return results
            
        except Exception as e:
            print(f"Calculation error: {e}")
            raise

# Singleton instance
calculation_engine = CalculationEngine()
```

#### `app/api/v1/calculations.py` (Ukázka)
```python
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.calculation import CalculationCreate, CalculationResponse
from app.services.calculation_service import CalculationService

router = APIRouter()

@router.post("", response_model=CalculationResponse, status_code=202)
async def create_calculation(
    calculation: CalculationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Vytvoří novou kalkulaci a spustí výpočet v pozadí
    """
    service = CalculationService(db)
    calc = service.create_calculation(calculation, current_user.id)
    
    # Spustit výpočet asynchronně (Celery nebo BackgroundTasks)
    background_tasks.add_task(service.run_calculation, calc.id)
    
    return calc

@router.get("/{calc_id}", response_model=CalculationResponse)
async def get_calculation(
    calc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Získat detail kalkulace včetně výsledků
    """
    service = CalculationService(db)
    calc = service.get_calculation(calc_id, current_user.id)
    
    if not calc:
        raise HTTPException(status_code=404, detail="Calculation not found")
    
    return calc

@router.get("", response_model=List[CalculationResponse])
async def list_calculations(
    skip: int = 0,
    limit: int = 20,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Seznam všech kalkulací uživatele
    """
    service = CalculationService(db)
    calculations = service.list_calculations(
        current_user.id, 
        skip=skip, 
        limit=limit, 
        status=status
    )
    return calculations
```

### 4. Frontend Setup

```bash
cd ../frontend

# Create React app s TypeScript
npx create-react-app . --template typescript

# Install dependencies
npm install axios @tanstack/react-query react-router-dom
npm install tailwindcss @headlessui/react @heroicons/react
npm install chart.js react-chartjs-2
npm install react-dropzone date-fns zustand

# Tailwind setup
npx tailwindcss init -p
```

#### Frontend Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── PrivateRoute.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── calculations/
│   │   │   ├── CalculationForm.tsx
│   │   │   ├── ParametersPanel.tsx
│   │   │   ├── ResultsTable.tsx
│   │   │   ├── ResultsCharts.tsx
│   │   │   └── ProgressMonitor.tsx
│   │   ├── files/
│   │   │   ├── FileUpload.tsx
│   │   │   └── FileList.tsx
│   │   └── shared/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── FilesPage.tsx
│   │   ├── NewCalculationPage.tsx
│   │   ├── CalculationDetailPage.tsx
│   │   └── HistoryPage.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── calculations.service.ts
│   │   └── files.service.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useCalculations.ts
│   ├── store/
│   │   └── authStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── formatters.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

#### `src/services/api.ts`
```typescript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - přidat JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

#### `src/services/calculations.service.ts`
```typescript
import api from './api';
import { Calculation, CalculationCreate, CalculationResults } from '../types';

export const calculationsService = {
  // Vytvořit kalkulaci
  create: async (data: CalculationCreate): Promise<Calculation> => {
    const response = await api.post('/calculations', data);
    return response.data;
  },

  // Seznam kalkulací
  list: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/calculations', { params });
    return response.data;
  },

  // Detail kalkulace
  get: async (id: string): Promise<Calculation> => {
    const response = await api.get(`/calculations/${id}`);
    return response.data;
  },

  // Výsledky
  getResults: async (id: string): Promise<CalculationResults> => {
    const response = await api.get(`/calculations/${id}/results`);
    return response.data;
  },

  // Logy
  getLogs: async (id: string) => {
    const response = await api.get(`/calculations/${id}/logs`);
    return response.data;
  },

  // Smazat
  delete: async (id: string): Promise<void> => {
    await api.delete(`/calculations/${id}`);
  },
};
```

#### `src/pages/NewCalculationPage.tsx` (Ukázka)
```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { calculationsService } from '../services/calculations.service';
import ParametersPanel from '../components/calculations/ParametersPanel';
import FileSelector from '../components/files/FileSelector';

const NewCalculationPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [parameters, setParameters] = useState({
    optimizationType: 0,
    battery: {
      capacity: 3000,
      efficiencyCharge: 0.98,
      efficiencyDischarge: 0.88,
      // ... další parametry
    },
    // ... FVE, Pmax, Ceny
  });

  const createMutation = useMutation({
    mutationFn: calculationsService.create,
    onSuccess: (data) => {
      navigate(`/calculations/${data.id}`);
    },
  });

  const handleSubmit = () => {
    createMutation.mutate({
      name,
      file_ids: selectedFiles,
      input_params: parameters,
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Nová kalkulace</h1>

      <div className="space-y-6">
        {/* Název */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Název kalkulace
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="např. Optimalizace leden 2024"
          />
        </div>

        {/* Výběr souborů */}
        <FileSelector
          selectedFiles={selectedFiles}
          onChange={setSelectedFiles}
        />

        {/* Parametry */}
        <ParametersPanel
          parameters={parameters}
          onChange={setParameters}
        />

        {/* Tlačítka */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Spouštím...' : 'Spustit výpočet'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border rounded-lg hover:bg-gray-50"
          >
            Zrušit
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewCalculationPage;
```

### 5. Database Migrations

```bash
cd backend

# Inicializace Alembic
alembic init alembic

# Vytvořit první migraci
alembic revision --autogenerate -m "Initial schema"

# Spustit migrace
alembic upgrade head
```

### 6. Docker Setup

#### `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Start server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### `frontend/Dockerfile`
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 7. Environment Variables

#### `.env.example`
```bash
# Database
DATABASE_URL=postgresql://kalkulace_user:password@localhost:5432/kalkulace_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000","https://kalkulace.electree.cz"]

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Libs
LIBS_PATH=./libs
```

### 8. Testing

#### Backend Test
```python
# backend/tests/test_calculations.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_calculation():
    # Login first
    response = client.post("/api/v1/auth/login", json={
        "username": "test_user",
        "password": "test_pass"
    })
    token = response.json()["access_token"]
    
    # Create calculation
    response = client.post(
        "/api/v1/calculations",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Test Calculation",
            "file_ids": ["uuid1", "uuid2"],
            "input_params": {...}
        }
    )
    
    assert response.status_code == 202
    assert "id" in response.json()
```

### 9. Spuštění aplikace

#### Development
```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Celery worker (nový terminál)
celery -A app.celery_app worker --loglevel=info

# Frontend (nový terminál)
cd frontend
npm start  # běží na http://localhost:3000
```

#### Production (Docker Compose)
```bash
# Build a spuštění
docker-compose up -d

# Migrace
docker-compose exec backend alembic upgrade head

# Logy
docker-compose logs -f backend
```

---

## 📊 Performance Checklist

- [ ] Database indexy na často dotazované sloupce
- [ ] Connection pooling (SQLAlchemy)
- [ ] Redis cache pro výsledky kalkulací
- [ ] Lazy loading pro frontend komponenty
- [ ] Image/asset compression
- [ ] CDN pro static files
- [ ] Gzip compression (Nginx)
- [ ] Rate limiting na API endpoints
- [ ] Async file uploads (chunks)
- [ ] WebSocket pro real-time updates

---

## 🔒 Security Checklist

- [ ] HTTPS (Let's Encrypt)
- [ ] JWT token rotation
- [ ] Password strength validation
- [ ] SQL injection protection (SQLAlchemy)
- [ ] XSS protection (React)
- [ ] CSRF tokens
- [ ] Rate limiting
- [ ] API key rotation
- [ ] Input validation (Pydantic)
- [ ] File upload validation (magic numbers)
- [ ] Audit logging
- [ ] Regular security updates

---

## 📈 Monitoring & Observability

### Doporučené nástroje:
- **Sentry** - Error tracking
- **Prometheus + Grafana** - Metrics
- **ELK Stack** - Log aggregation
- **Uptime Robot** - Uptime monitoring

### Metriky k sledování:
- API response times
- Calculation execution times
- Database query performance
- Celery queue length
- Error rates
- User activity

---

Tato implementační příručka poskytuje konkrétní kód a strukturu pro rychlý start vývoje. Všechny komponenty jsou navrženy tak, aby byly modulární a snadno rozšiřitelné.
