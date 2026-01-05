# Komplexní řešení: Bridge Python Desktop → Moderní Webová Aplikace
## Optimalizace energetické bilance (FVE, Baterie, Spotřeba)

---

## 📋 Obsah
1. [Shrnutí analýzy existující aplikace](#analýza-existující-aplikace)
2. [Architektura webového řešení](#architektura-webového-řešení)
3. [Technologický stack](#technologický-stack)
4. [Databázový model](#databázový-model)
5. [Backend API specifikace](#backend-api-specifikace)
6. [Frontend design](#frontend-design)
7. [Bridge mechanismus](#bridge-mechanismus)
8. [Deployment na Ubuntu 24.04 + ISPconfig](#deployment)
9. [Externí API pro automatizaci](#externí-api)
10. [Roadmap implementace](#roadmap)

---

## 🔍 Analýza existující aplikace

### Hlavní komponenty desktop aplikace (PySide6)
- **OptimalizaceUI.pyw**: Hlavní GUI aplikace s formuláři pro nastavení parametrů
- **libs/process.py**: Core výpočetní engine pro optimalizaci (LinProg, APOPT)
- **libs/load.py**: Načítání CSV souborů (spotřeba, ceny, počasí)
- **libs/funsCost.py**: Kalkulace nákladů, bilance energie/financí
- **libs/funsChart.py**: Generování grafů (matplotlib)
- **libs/funsProcess.py**: Optimalizační algoritmy (baterie, FVE)

### Funkční požadavky aplikace
1. **Načítání dat**: CSV soubory odběrových diagramů (15min/1hod interval)
2. **Parametry optimalizace**:
   - Typ optimalizace (minimalizace nákladů/špičky)
   - Baterie: kapacita, účinnost nabíjení/vybíjení, rychlost, limity
   - FVE: nominální výkon, účinnost střídače, omezení výkonu
   - Pmax: maximální odběr/dodávka
   - Ceny: fixní/spotové, poplatky distributor/obchodník
3. **Výpočet**: Asynchronní optimalizace s progress barem
4. **Výsledky**: 
   - Tabulky nákladů (pouze spotřeba vs. FVE vs. baterie vs. vše)
   - Bilance energie/financí
   - Grafy časového průběhu
   - Export do Excel
5. **User settings**: Ukládání/načítání konfigurací (.ini)

### Klíčové poznatky
- **Python výpočetní jádro je samostatné** - lze snadno zabalit do API
- **Všechny výpočty jsou v libs/** - lze použít bez GUI
- **Konfigurace v INI formátu** - snadno převoditelné na JSON
- **CSV data standardizovaná** - validace na backendu
- **Výsledky ve formě pandas DataFrames** - snadno konvertovatelné na JSON

---

## 🏗️ Architektura webového řešení

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │Dashboard │  │ Kalkulace│  │ Historie │  │ Administrace │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API (JSON)
┌───────────────────────────┴─────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Auth Service │  │ File Service │  │ Calculation Service│   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │      Python Computation Engine (libs/*)                  │   │
│  │  • process.py  • funsCost.py  • funsProcess.py         │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────┬──────────────┬───────────────┘
                   │              │              │
         ┌─────────┴─────┐  ┌────┴────┐  ┌──────┴──────┐
         │  PostgreSQL   │  │  Redis  │  │File Storage │
         │   Database    │  │  Cache  │  │  (uploads)  │
         └───────────────┘  └─────────┘  └─────────────┘
                                │
                         ┌──────┴──────┐
                         │Celery Worker│
                         │(Async Jobs) │
                         └─────────────┘
```

### Vrstvová architektura

**1. Prezentační vrstva (Frontend)**
- React + TypeScript
- Tailwind CSS / Material-UI
- Axios pro HTTP
- React Query pro state management
- Chart.js / Recharts pro grafy

**2. API vrstva (Backend)**
- FastAPI (Python 3.11+)
- JWT autentizace
- OpenAPI/Swagger dokumentace
- CORS middleware
- Rate limiting

**3. Business logika**
- Service layer pro business operace
- Repository pattern pro DB přístup
- Existující Python výpočetní engine (libs/*)
- Validator layer

**4. Data vrstva**
- PostgreSQL 15+ (relační data)
- Redis (cache, session, queue)
- File system (CSV uploads)

**5. Worker vrstva**
- Celery pro asynchronní úlohy
- Redis jako message broker
- Dlouhé výpočty v pozadí

---

## 💻 Technologický Stack

### Backend
```python
# requirements.txt
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
```

### Frontend
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.8.0",
    "react-router-dom": "^6.20.0",
    "tailwindcss": "^3.3.0",
    "@headlessui/react": "^1.7.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "react-dropzone": "^14.2.0",
    "date-fns": "^2.30.0",
    "zustand": "^4.4.0"
  }
}
```

### Infrastructure
- **Docker & Docker Compose**
- **Nginx** (reverse proxy, static files)
- **PostgreSQL 15**
- **Redis 7**
- **Ubuntu 24.04 LTS**
- **ISPconfig** (domain management)
- **Let's Encrypt** (SSL)

---

## 🗄️ Databázový Model

### ERD Diagram (PostgreSQL)

```sql
-- Users & Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user', -- user, admin
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- API Keys for external access
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    permissions JSONB, -- ["read", "write", "execute"]
    rate_limit INTEGER DEFAULT 100, -- requests per hour
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);

-- Uploaded Files
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_type VARCHAR(50), -- consumption, weather, price
    original_filename VARCHAR(255),
    stored_filename VARCHAR(255) UNIQUE,
    file_path TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),
    date_from DATE,
    date_to DATE,
    rows_count INTEGER,
    metadata JSONB, -- parsed headers, intervals, etc.
    checksum VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Settings / Configurations
CREATE TABLE configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    config_data JSONB NOT NULL, -- all INI settings as JSON
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calculations
CREATE TABLE calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    config_id UUID REFERENCES configurations(id) ON DELETE SET NULL,
    name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
    progress INTEGER DEFAULT 0, -- 0-100
    
    -- Input parameters (from config + selected files)
    input_params JSONB NOT NULL,
    file_ids JSONB, -- array of file UUIDs
    
    -- Execution info
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    execution_time_seconds INTEGER,
    error_message TEXT,
    
    -- Results
    results JSONB, -- all calculation results
    cost_table JSONB,
    energy_balance JSONB,
    financial_balance JSONB,
    battery_cycles DECIMAL(10,2),
    charts_data JSONB, -- data for frontend charts
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calculation logs (console output)
CREATE TABLE calculation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_id UUID REFERENCES calculations(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    log_level VARCHAR(20), -- info, warning, error
    message TEXT
);

-- Audit log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100), -- login, create_calculation, delete_file, etc.
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_file_type ON files(file_type);
CREATE INDEX idx_calculations_user_id ON calculations(user_id);
CREATE INDEX idx_calculations_status ON calculations(status);
CREATE INDEX idx_calculations_created_at ON calculations(created_at DESC);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## 🔌 Backend API Specifikace

### 1. Authentication API

```python
# POST /api/v1/auth/register
{
    "email": "user@example.com",
    "username": "username",
    "password": "SecurePass123!",
    "full_name": "Jan Novák"
}
→ Response: 201 Created
{
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "message": "Verification email sent"
}

# POST /api/v1/auth/login
{
    "username": "username",
    "password": "SecurePass123!"
}
→ Response: 200 OK
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer",
    "expires_in": 3600
}

# POST /api/v1/auth/refresh
{
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
→ Response: 200 OK
{
    "access_token": "new_token",
    "expires_in": 3600
}

# GET /api/v1/auth/me
Authorization: Bearer {token}
→ Response: 200 OK
{
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "full_name": "Jan Novák",
    "role": "user"
}
```

### 2. Files API

```python
# POST /api/v1/files/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}
{
    "file": <file_binary>,
    "file_type": "consumption" | "weather" | "price"
}
→ Response: 201 Created
{
    "id": "uuid",
    "original_filename": "od_diagram_2021.xlsx",
    "file_type": "consumption",
    "file_size": 245678,
    "date_from": "2021-01-01",
    "date_to": "2021-12-31",
    "rows_count": 8760,
    "created_at": "2024-10-29T10:30:00Z"
}

# GET /api/v1/files
Authorization: Bearer {token}
Query params: ?file_type=consumption&page=1&limit=20
→ Response: 200 OK
{
    "items": [
        {
            "id": "uuid",
            "original_filename": "od_diagram_2021.xlsx",
            "file_type": "consumption",
            "date_from": "2021-01-01",
            "date_to": "2021-12-31",
            "rows_count": 8760,
            "created_at": "2024-10-29T10:30:00Z"
        }
    ],
    "total": 45,
    "page": 1,
    "pages": 3
}

# GET /api/v1/files/{file_id}
# GET /api/v1/files/{file_id}/download
# DELETE /api/v1/files/{file_id}
```

### 3. Configurations API

```python
# POST /api/v1/configurations
Authorization: Bearer {token}
{
    "name": "Konfigurace 1",
    "description": "Optimalizace pro zimní období",
    "config_data": {
        "Optimalizace": {
            "optimizationtype": 0,
            "povolitdodavkydositezbaterie": true,
            ...
        },
        "Baterie": {
            "b_cap": 3000.0,
            "b_effcharge": 0.98,
            ...
        },
        "FVE": {...},
        "Ceny": {...},
        "Pmax": {...}
    },
    "is_default": false
}
→ Response: 201 Created

# GET /api/v1/configurations
# GET /api/v1/configurations/{config_id}
# PUT /api/v1/configurations/{config_id}
# DELETE /api/v1/configurations/{config_id}
```

### 4. Calculations API

```python
# POST /api/v1/calculations
Authorization: Bearer {token}
{
    "name": "Kalkulace leden 2024",
    "config_id": "uuid", // or inline config_data
    "file_ids": ["uuid1", "uuid2", "uuid3"]
}
→ Response: 202 Accepted
{
    "id": "calc_uuid",
    "status": "pending",
    "message": "Calculation queued"
}

# GET /api/v1/calculations/{calc_id}
Authorization: Bearer {token}
→ Response: 200 OK
{
    "id": "calc_uuid",
    "name": "Kalkulace leden 2024",
    "status": "running", // pending, running, completed, failed
    "progress": 65,
    "started_at": "2024-10-29T10:30:00Z",
    "results": null // populated when completed
}

# GET /api/v1/calculations/{calc_id}/logs
→ Real-time logs via WebSocket or polling

# GET /api/v1/calculations/{calc_id}/results
→ Response: 200 OK (when status=completed)
{
    "cost_table": {
        "rows": [
            {"type": "Pouze spotřeba", "cost": 145.5, "diff": 0, "diff_pct": 0},
            {"type": "Spotřeba a FVE", "cost": 98.3, "diff": -47.2, "diff_pct": -32.5},
            ...
        ]
    },
    "energy_balance": {...},
    "financial_balance": {...},
    "battery_cycles": 245.67,
    "charts_data": {
        "time_series": [...],
        "daily_costs": [...]
    }
}

# GET /api/v1/calculations
Query: ?status=completed&page=1&limit=20&sort=-created_at
→ List of calculations with pagination

# DELETE /api/v1/calculations/{calc_id}
```

### 5. External API (pro automatizaci)

```python
# POST /api/v1/external/calculate
Authorization: X-API-Key: {api_key}
Content-Type: application/json
{
    "consumption_data": [
        {"datetime": "2024-01-01T00:00:00", "kwh": 2.5},
        {"datetime": "2024-01-01T01:00:00", "kwh": 2.1},
        ...
    ],
    "weather_data": [...],
    "price_data": [...],
    "parameters": {
        "battery_capacity": 3000,
        "pv_power": 700,
        ...
    },
    "webhook_url": "https://your-site.com/webhook" // optional
}
→ Response: 202 Accepted
{
    "calculation_id": "uuid",
    "status_url": "https://kalkulace.electree.cz/api/v1/external/status/uuid"
}

# GET /api/v1/external/status/{calc_id}
Authorization: X-API-Key: {api_key}
→ Response: 200 OK
{
    "status": "completed",
    "progress": 100,
    "results": {...}
}
```

### 6. Admin API

```python
# GET /api/v1/admin/users
# GET /api/v1/admin/calculations
# GET /api/v1/admin/statistics
# GET /api/v1/admin/audit-logs
# POST /api/v1/admin/users/{user_id}/toggle-active
# DELETE /api/v1/admin/users/{user_id}
```

---

## 🎨 Frontend Design

### Struktura komponent

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ResetPasswordForm.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── RecentCalculations.tsx
│   │   ├── files/
│   │   │   ├── FileUpload.tsx
│   │   │   ├── FileList.tsx
│   │   │   └── FilePreview.tsx
│   │   ├── calculations/
│   │   │   ├── CalculationForm.tsx
│   │   │   ├── ParametersPanel.tsx
│   │   │   ├── ProgressMonitor.tsx
│   │   │   ├── ResultsTables.tsx
│   │   │   ├── ResultsCharts.tsx
│   │   │   └── HistoryTable.tsx
│   │   ├── configurations/
│   │   │   ├── ConfigurationList.tsx
│   │   │   ├── ConfigurationEditor.tsx
│   │   │   └── ConfigurationImport.tsx
│   │   ├── admin/
│   │   │   ├── UserManagement.tsx
│   │   │   ├── SystemStats.tsx
│   │   │   └── AuditLogs.tsx
│   │   └── shared/
│   │       ├── Navbar.tsx
│   │       ├── Sidebar.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── FilesPage.tsx
│   │   ├── NewCalculationPage.tsx
│   │   ├── CalculationDetailPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── ConfigurationsPage.tsx
│   │   └── AdminPage.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── files.service.ts
│   │   ├── calculations.service.ts
│   │   └── configurations.service.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCalculations.ts
│   │   └── useWebSocket.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── formatters.ts
│       └── validators.ts
```

### Hlavní stránky

#### 1. Dashboard
- Přehled posledních 5 kalkulací
- Quick stats: Celkové kalkulace, Úspora celkem, Průměrné cykly baterie
- Grafy trendů
- Quick actions: Nová kalkulace, Nahrát soubory

#### 2. Nová kalkulace
- Wizard v 3 krocích:
  1. Výběr souborů (consumption, weather, price)
  2. Nastavení parametrů (formulář jako v desktop app)
  3. Spuštění a monitoring
- Real-time progress bar a konzole

#### 3. Výsledky kalkulace
- Tabulky nákladů (responsive design)
- Bilance energie/financí
- Interaktivní grafy (zoom, pan, export)
- Export do Excel
- Tlačítko "Uložit jako konfiguraci"

#### 4. Historie
- Filtrovatelná tabulka
- Sloupce: Název, Datum, Status, Úspora, Akce
- Detail kalkulace v modal/drawer
- Porovnání dvou kalkulací

#### 5. Správa souborů
- Drag & drop upload
- Tabulka nahraných souborů s preview
- Filtr podle typu a datumu

#### 6. Konfigurace
- Seznam uložených konfigurací
- Editor s formulářem
- Import/export .ini

---

## 🌉 Bridge Mechanismus

### Cíl
Umožnit změny v Python výpočetním enginu (libs/*) **bez** nutnosti manuálního zásahu do webové aplikace.

### Řešení: Hot-Reload Module System

```python
# backend/app/services/calculation_engine.py
import importlib
import sys
from pathlib import Path
from datetime import datetime

class CalculationEngine:
    def __init__(self, libs_path: str = "/var/www/kalkulace.electree.cz/libs"):
        self.libs_path = Path(libs_path)
        self.loaded_modules = {}
        self.last_modified = {}
        
    def _check_updates(self):
        """Kontrola změn v Python souborech"""
        for py_file in self.libs_path.glob("*.py"):
            mtime = py_file.stat().st_mtime
            module_name = py_file.stem
            
            if module_name not in self.last_modified or \
               self.last_modified[module_name] < mtime:
                # Reload module
                self._reload_module(module_name)
                self.last_modified[module_name] = mtime
                
    def _reload_module(self, module_name: str):
        """Hot reload Python modulu"""
        module_path = self.libs_path / f"{module_name}.py"
        spec = importlib.util.spec_from_file_location(
            f"libs.{module_name}", module_path
        )
        module = importlib.util.module_from_spec(spec)
        
        # Přidat do sys.modules pro importy uvnitř modulu
        sys.modules[f"libs.{module_name}"] = module
        spec.loader.exec_module(module)
        
        self.loaded_modules[module_name] = module
        
    def calculate(self, config: dict, data: dict):
        """Hlavní výpočetní funkce"""
        # Kontrola updates před každým výpočtem
        self._check_updates()
        
        # Import funkcí z reloaded modulů
        process = self.loaded_modules["process"]
        
        # Spustit výpočet
        result = process.calculate(config, ...)
        return result
```

### File Watcher Service

```python
# backend/app/services/file_watcher.py
import asyncio
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class LibsWatcher(FileSystemEventHandler):
    def __init__(self, engine: CalculationEngine):
        self.engine = engine
        
    def on_modified(self, event):
        if event.src_path.endswith(".py"):
            print(f"Detected change in {event.src_path}")
            # Trigger reload
            self.engine._check_updates()
            
    def on_created(self, event):
        if event.src_path.endswith(".py"):
            print(f"New file created: {event.src_path}")
```

### Deployment Strategy

```bash
# 1. Změna v desktop aplikaci (libs/process.py)
git commit -m "Updated optimization algorithm"

# 2. Webhook na serveru (GitHub/GitLab webhook)
POST https://kalkulace.electree.cz/api/v1/admin/sync-libs

# 3. Backend automaticky:
#    - Git pull změn
#    - Restart worker (Celery)
#    - Hot reload modulů
#    - Notifikace admin

# 4. Nulový downtime - výpočty probíhají dál
```

### Version Control

```sql
CREATE TABLE code_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_name VARCHAR(100),
    version VARCHAR(50),
    git_commit_hash VARCHAR(40),
    changes_description TEXT,
    deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deployed_by UUID REFERENCES users(id)
);
```

---

## 🚀 Deployment na Ubuntu 24.04 + ISPconfig

### 1. Server Setup

```bash
# Připravit server
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.11 python3-pip python3-venv
sudo apt install -y postgresql postgresql-contrib redis-server
sudo apt install -y nginx git

# ISPconfig již nainstalován, doména kalkulace.electree.cz připravena
```

### 2. Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: kalkulace_db
      POSTGRES_USER: kalkulace_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - backend

  redis:
    image: redis:7-alpine
    networks:
      - backend

  backend:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
    volumes:
      - ./backend:/app
      - ./libs:/app/libs:ro  # Python výpočetní engine (read-only)
      - upload_data:/app/uploads
    environment:
      DATABASE_URL: postgresql://kalkulace_user:${DB_PASSWORD}@postgres:5432/kalkulace_db
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: ${SECRET_KEY}
      ALGORITHM: HS256
      ACCESS_TOKEN_EXPIRE_MINUTES: 60
    depends_on:
      - postgres
      - redis
    networks:
      - backend
      - frontend

  celery_worker:
    build: ./backend
    command: celery -A app.celery_app worker --loglevel=info
    volumes:
      - ./backend:/app
      - ./libs:/app/libs:ro
      - upload_data:/app/uploads
    environment:
      DATABASE_URL: postgresql://kalkulace_user:${DB_PASSWORD}@postgres:5432/kalkulace_db
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - postgres
      - redis
    networks:
      - backend

  frontend:
    build: ./frontend
    volumes:
      - ./frontend/build:/usr/share/nginx/html:ro
    networks:
      - frontend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./frontend/build:/usr/share/nginx/html:ro
    depends_on:
      - backend
      - frontend
    networks:
      - frontend

volumes:
  postgres_data:
  upload_data:

networks:
  backend:
  frontend:
```

### 3. Nginx Configuration

```nginx
# /etc/nginx/sites-available/kalkulace.electree.cz
server {
    listen 80;
    server_name kalkulace.electree.cz;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name kalkulace.electree.cz;

    # SSL certifikáty (Let's Encrypt via ISPconfig)
    ssl_certificate /etc/letsencrypt/live/kalkulace.electree.cz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kalkulace.electree.cz/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend (React build)
    location / {
        root /var/www/kalkulace.electree.cz/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts pro dlouhé výpočty
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
    }

    # Swagger dokumentace
    location /docs {
        proxy_pass http://localhost:8000/docs;
    }

    # WebSocket pro real-time logy
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    location /api/ {
        limit_req zone=api burst=20 nodelay;
    }
}
```

### 4. Systemd Services

```ini
# /etc/systemd/system/kalkulace-backend.service
[Unit]
Description=Kalkulace FastAPI Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/kalkulace.electree.cz/backend
Environment="PATH=/var/www/kalkulace.electree.cz/venv/bin"
ExecStart=/var/www/kalkulace.electree.cz/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/kalkulace-celery.service
[Unit]
Description=Kalkulace Celery Worker
After=network.target redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/kalkulace.electree.cz/backend
Environment="PATH=/var/www/kalkulace.electree.cz/venv/bin"
ExecStart=/var/www/kalkulace.electree.cz/venv/bin/celery -A app.celery_app worker --loglevel=info
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 5. Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "=== Deployment started ==="

# Pull latest code
cd /var/www/kalkulace.electree.cz
git pull origin main

# Backend
echo "Building backend..."
cd backend
source ../venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

# Frontend
echo "Building frontend..."
cd ../frontend
npm install
npm run build

# Restart services
echo "Restarting services..."
sudo systemctl restart kalkulace-backend
sudo systemctl restart kalkulace-celery
sudo systemctl reload nginx

echo "=== Deployment completed ==="
```

---

## 🔐 Externí API pro automatizaci

### Generování API klíčů

```python
# Backend endpoint
@router.post("/api/v1/api-keys")
async def create_api_key(
    name: str,
    permissions: List[str],
    current_user: User = Depends(get_current_user)
):
    # Generate random key
    api_key = secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    # Save to DB
    db_key = APIKey(
        user_id=current_user.id,
        key_hash=key_hash,
        name=name,
        permissions=permissions
    )
    db.add(db_key)
    db.commit()
    
    # Return key ONLY ONCE
    return {
        "api_key": api_key,  # zobrazit uživateli
        "key_id": db_key.id,
        "warning": "Uložte si klíč, nebude zobrazen znovu!"
    }
```

### Použití v externím systému

```python
import requests

API_KEY = "your_api_key_here"
API_URL = "https://kalkulace.electree.cz/api/v1/external"

# Odeslat data ke kalkulaci
response = requests.post(
    f"{API_URL}/calculate",
    headers={"X-API-Key": API_KEY},
    json={
        "consumption_data": [...],
        "weather_data": [...],
        "price_data": [...],
        "parameters": {
            "battery_capacity": 3000,
            "pv_power": 700,
            "optimization_type": 0
        },
        "webhook_url": "https://your-site.com/webhook/kalkulace"
    }
)

calc_id = response.json()["calculation_id"]

# Polling výsledků (nebo čekat na webhook)
import time
while True:
    status_response = requests.get(
        f"{API_URL}/status/{calc_id}",
        headers={"X-API-Key": API_KEY}
    )
    
    data = status_response.json()
    if data["status"] == "completed":
        results = data["results"]
        print(f"Úspora: {results['savings']} Kč")
        break
    elif data["status"] == "failed":
        print(f"Chyba: {data['error']}")
        break
    
    time.sleep(5)
```

---

## 📅 Roadmap Implementace

### Fáze 1: Foundation (2-3 týdny)
1. ✅ Analýza existující aplikace
2. ⬜ Setup projektu (Git repo, Docker)
3. ⬜ Databázový model + migrations
4. ⬜ Backend scaffolding (FastAPI)
5. ⬜ Autentizace (JWT)
6. ⬜ Frontend scaffolding (React + Tailwind)

### Fáze 2: Core Features (3-4 týdny)
7. ⬜ API pro správu souborů
8. ⬜ Integrace Python výpočetního enginu
9. ⬜ Asynchronní výpočty (Celery)
10. ⬜ API pro kalkulace
11. ⬜ Frontend - formulář kalkulace
12. ⬜ Frontend - zobrazení výsledků

### Fáze 3: Advanced Features (2-3 týdny)
13. ⬜ Správa konfigurací
14. ⬜ Historie kalkulací
15. ⬜ Grafy (Chart.js)
16. ⬜ Export do Excel
17. ⬜ Bridge mechanismus (hot-reload)

### Fáze 4: Administration & API (2 týdny)
18. ⬜ Admin panel
19. ⬜ Externí API + API keys
20. ⬜ Rate limiting
21. ⬜ Audit logs

### Fáze 5: Deployment & Testing (1-2 týdny)
22. ⬜ Docker Compose final
23. ⬜ Nginx config
24. ⬜ SSL setup
25. ⬜ Deployment na Ubuntu 24.04
26. ⬜ Testing (unit, integration, E2E)
27. ⬜ Performance tuning

### Fáze 6: Documentation & Polish (1 týden)
28. ⬜ API dokumentace (Swagger)
29. ⬜ User manual
30. ⬜ Monitoring & alerts
31. ⬜ Backup strategy

**Celková odhadovaná doba: 10-14 týdnů**

---

## 🎯 Klíčové výhody řešení

### 1. **Zero-Migration Pro Existující Kód**
- Python výpočetní engine (libs/*) zůstává **beze změny**
- Pouze wrapper API vrstva
- Budoucí změny v desktop app se automaticky propagují

### 2. **Moderní & Škálovatelné**
- React + FastAPI = industry standard
- PostgreSQL pro robustní data
- Redis pro cache a queue
- Horizontal scaling možný

### 3. **Full-Featured Web App**
- Multi-user support
- Kompletní CRUD
- Role-based access
- API pro automatizaci
- Real-time monitoring

### 4. **DevOps Ready**
- Docker Compose pro development
- CI/CD pipeline možné (GitHub Actions)
- Monitoring (Prometheus + Grafana)
- Backup & restore strategie

### 5. **Bezpečnost**
- JWT autentizace
- HTTPS (Let's Encrypt)
- API rate limiting
- SQL injection protected (SQLAlchemy)
- XSS protected (React)

---

## 📞 Kontakt a Další Kroky

### Připraveno k implementaci
Tato dokumentace poskytuje **kompletní blueprint** pro transformaci desktop aplikace na plnohodnotnou webovou platformu.

### Co je potřeba:
1. **Rozhodnutí o prioritách** - které funkce implementovat první
2. **Development team** - backend (Python), frontend (React), DevOps
3. **Testovací server** - pro staging před produkcí
4. **Databáze credentials** - PostgreSQL na serveru

### Dokumenty k vytvoření:
- [ ] Detailní API specifikace (OpenAPI schema)
- [ ] Wireframes/mockupy frontend UI
- [ ] Databázové migrace (Alembic scripts)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring setup (Prometheus/Grafana)

---

**Dokument vytvořen:** 29. října 2025  
**Verze:** 1.0  
**Autor:** GitHub Copilot Analysis  
**Status:** ✅ Připraveno k implementaci
