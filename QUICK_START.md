# 🚀 QUICK START - Okamžité spuštění

## ✅ Co bylo vytvořeno

### Backend struktura
```
backend/
├── app/
│   ├── main.py                    ✅ FastAPI aplikace
│   ├── database.py                ✅ SQLAlchemy setup
│   ├── core/
│   │   ├── config.py              ✅ Nastavení aplikace
│   │   └── security.py            ✅ JWT & password hashing
│   ├── models/
│   │   ├── user.py                ✅ User model
│   │   ├── file.py                ✅ File model
│   │   ├── calculation.py         ✅ Calculation & logs
│   │   ├── configuration.py       ✅ User configurations
│   │   ├── api_key.py             ✅ API keys
│   │   └── audit_log.py           ✅ Audit logs
│   └── services/
│       └── calculation_engine.py  ✅ BRIDGE k libs/ (hot-reload!)
├── requirements.txt               ✅ Python dependencies
└── uploads/                       ✅ Folder pro nahrané soubory
```

## 🏃 Okamžité spuštění (3 kroky)

### 1️⃣ Instalace Python balíčků

```powershell
# Přejít do backend složky
cd backend

# Vytvořit virtual environment
python -m venv venv

# Aktivovat venv
.\venv\Scripts\activate

# Instalovat dependencies
pip install -r requirements.txt
```

### 2️⃣ Nastavení prostředí

```powershell
# Vytvořit .env soubor (kopírovat z root .env.example)
copy ..\.env.example .env

# Upravit .env - nastavit DATABASE_URL, SECRET_KEY atd.
notepad .env
```

**Minimální .env pro testování:**
```ini
DATABASE_URL=postgresql://postgres:password@localhost:5432/kalkulace_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-min-32-characters-CHANGE-THIS
LIBS_PATH=../libs
```

### 3️⃣ Spustit PostgreSQL & Redis (Docker)

```powershell
# Přejít do root složky
cd ..

# Spustit pouze database služby
docker-compose up -d postgres redis

# Ověřit že běží
docker-compose ps
```

### 4️⃣ Spustit FastAPI backend

```powershell
# Z backend/ složky s aktivovaným venv
cd backend
uvicorn app.main:app --reload --port 8000
```

**Aplikace běží na:**
- 🌐 API: http://localhost:8000
- 📖 Swagger docs: http://localhost:8000/docs
- 📚 ReDoc: http://localhost:8000/redoc
- ✅ Health check: http://localhost:8000/health

---

## 🎯 Co funguje OKAMŽITĚ

### ✅ Dostupné endpointy (bez DB)
- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /docs` - Swagger UI

### 🔧 Co potřebuje DB migrace
- Auth endpoints (registrace, login)
- File upload/download
- Calculations
- User management

---

## 📦 Další kroky implementace

### 1. Database migrations (Alembic)
```powershell
# Inicializace Alembic
alembic init alembic

# Vytvořit první migraci
alembic revision --autogenerate -m "Initial schema"

# Spustit migrace
alembic upgrade head
```

### 2. Vytvořit API endpoints
Vytvořit soubory v `app/api/v1/`:
- `auth.py` - Registrace, login, refresh token
- `users.py` - User management
- `files.py` - File upload/download/list
- `calculations.py` - Kalkulace CRUD + spuštění
- `configurations.py` - User settings

### 3. Vytvořit Pydantic schemas
V `app/schemas/` vytvořit request/response models

### 4. Services layer
Business logika v `app/services/`

---

## 🧪 Test Bridge mechanismu

### Otestovat calculation engine:
```python
# V Python konzoli nebo test skriptu
from app.services.calculation_engine import calculation_engine

# Načíst modul
process = calculation_engine.get_module("process")
print(f"Module loaded: {process}")

# Testovací config (zkrácený)
test_config = {
    "Optimalizace": {"optimizationtype": 0},
    "Baterie": {"b_cap": 3000, "b_effcharge": 0.98},
    "FVE": {"pv_powernom": 700},
    "Ceny": {"pricefix": 2.9},
    "Pmax": {"pmaxodber": 6000}
}

# Validace
is_valid, error = calculation_engine.validate_config(test_config)
print(f"Config valid: {is_valid}, Error: {error}")
```

---

## 🐳 Plné Docker spuštění

```powershell
# Spustit všechny služby
docker-compose up -d

# Logy
docker-compose logs -f backend

# Restart backend po změnách
docker-compose restart backend
```

---

## 📊 Status implementace

### ✅ Hotovo
- [x] Backend struktura
- [x] Database models (SQLAlchemy)
- [x] Configuration management
- [x] Security (JWT, password hashing)
- [x] **Bridge mechanismus** (hot-reload libs/)
- [x] Docker Compose setup
- [x] Requirements.txt

### 🔄 Připraveno k dokončení
- [ ] API endpoints (šablony jsou v dokumentaci)
- [ ] Pydantic schemas
- [ ] Services layer
- [ ] Alembic migrations
- [ ] Celery tasks
- [ ] Frontend (React)

### ⏱️ Odhadovaný čas na dokončení
- API endpoints: 2-3 dny
- Schemas + Services: 1-2 dny  
- Alembic setup: 0.5 dne
- Testing: 1 den
- **Celkem: ~5-7 dní** pro kompletní funkční backend

---

## 🆘 Troubleshooting

### ImportError: No module named 'app'
```powershell
# Ujistit se že jste v backend/ složce a venv je aktivovaný
cd backend
.\venv\Scripts\activate
```

### PostgreSQL connection error
```powershell
# Zkontrolovat že PostgreSQL běží
docker-compose ps postgres

# Zkontrolovat DATABASE_URL v .env
```

### ModuleNotFoundError: No module named 'libs'
```powershell
# Zkontrolovat že libs/ složka existuje v root
# Zkontrolovat LIBS_PATH v .env
```

---

## 📞 Další informace

Veškerá dokumentace:
- **WEB_BRIDGE_SOLUTION.md** - Kompletní architektura
- **IMPLEMENTATION_GUIDE.md** - Detailní implementační příručka
- **EXECUTIVE_SUMMARY.md** - Přehled projektu

---

**Status:** ✅ Backend struktura PŘIPRAVENA k okamžitému použití!
**Funguje:** FastAPI server, Bridge mechanismus, Database models
**Zbývá:** API endpoints, Frontend, Deployment

---

*Vytvořeno: 29. října 2025*
