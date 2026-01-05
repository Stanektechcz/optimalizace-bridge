# Kalkulace Web - Quick Start

Toto je kompletní webová aplikace pro optimalizaci energetické bilance (FVE, Baterie, Spotřeba).

## 🚀 Rychlý Start (Docker)

### 1. Prerekvizity
- Docker 20.10+
- Docker Compose 2.0+

### 2. Naklonovat repo
```bash
git clone https://github.com/your-org/kalkulace-web.git
cd kalkulace-web
```

### 3. Konfigurace
```bash
# Vytvořit .env soubor
cp .env.example .env

# Upravit .env - změnit hesla a secret keys!
nano .env
```

### 4. Spustit aplikaci
```bash
# Build a start všech služeb
docker-compose up -d

# Sledovat logy
docker-compose logs -f

# Aplikace běží na:
# - Frontend: http://localhost
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
# - Flower (Celery): http://localhost:5555
# - Adminer (DB): http://localhost:8080
```

### 5. Inicializace databáze
```bash
# Spustit migrace
docker-compose exec backend alembic upgrade head

# Vytvořit prvního admin uživatele
docker-compose exec backend python -m app.scripts.create_admin
```

### 6. Přihlášení
- Otevřít http://localhost
- Login: admin@electree.cz
- Heslo: (z .env FIRST_ADMIN_PASSWORD)

---

## 📁 Struktura projektu

```
kalkulace-web/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logika
│   │   └── core/        # Security, config
│   ├── libs/            # Python výpočetní engine (z desktop app)
│   ├── alembic/         # Database migrations
│   └── tests/
├── frontend/             # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── hooks/
│   └── public/
├── nginx/                # Nginx konfigurace
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🛠️ Development

### Backend lokálně (bez Dockeru)
```bash
cd backend

# Virtual environment
python3.11 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Instalace
pip install -r requirements.txt

# Spustit PostgreSQL a Redis (Docker)
docker-compose up -d postgres redis

# Migrace
alembic upgrade head

# Spustit server
uvicorn app.main:app --reload --port 8000

# Celery worker (nový terminál)
celery -A app.celery_app worker --loglevel=info
```

### Frontend lokálně
```bash
cd frontend

# Instalace
npm install

# Dev server
npm start  # běží na http://localhost:3000

# Build pro produkci
npm run build
```

---

## 📊 API Dokumentace

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

### Hlavní endpointy:

#### Autentizace
- `POST /api/v1/auth/register` - Registrace
- `POST /api/v1/auth/login` - Přihlášení
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Aktuální uživatel

#### Soubory
- `POST /api/v1/files/upload` - Nahrát CSV
- `GET /api/v1/files` - Seznam souborů
- `GET /api/v1/files/{id}` - Detail
- `DELETE /api/v1/files/{id}` - Smazat

#### Kalkulace
- `POST /api/v1/calculations` - Nová kalkulace
- `GET /api/v1/calculations` - Seznam kalkulací
- `GET /api/v1/calculations/{id}` - Detail + výsledky
- `GET /api/v1/calculations/{id}/logs` - Logy výpočtu

#### Konfigurace
- `POST /api/v1/configurations` - Uložit konfiguraci
- `GET /api/v1/configurations` - Seznam
- `PUT /api/v1/configurations/{id}` - Editovat

#### Externí API
- `POST /api/v1/external/calculate` - Automatická kalkulace
- `GET /api/v1/external/status/{id}` - Status výpočtu

---

## 🔧 Příkazy

### Docker příkazy
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart služby
docker-compose restart backend

# Logy
docker-compose logs -f backend

# Rebuild
docker-compose build --no-cache backend

# Vyčistit všechno
docker-compose down -v
```

### Database příkazy
```bash
# Migrace
docker-compose exec backend alembic upgrade head

# Rollback
docker-compose exec backend alembic downgrade -1

# Nová migrace
docker-compose exec backend alembic revision --autogenerate -m "Description"

# Backup
docker-compose exec postgres pg_dump -U kalkulace_user kalkulace_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U kalkulace_user kalkulace_db < backup.sql
```

### Testing
```bash
# Backend testy
docker-compose exec backend pytest

# Coverage
docker-compose exec backend pytest --cov=app tests/

# Frontend testy
cd frontend && npm test
```

---

## 🌐 Deployment na produkční server

### Ubuntu 24.04 + ISPconfig

```bash
# 1. Připravit server
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git

# 2. Clone repo
cd /var/www
git clone https://github.com/your-org/kalkulace-web.git kalkulace.electree.cz
cd kalkulace.electree.cz

# 3. Konfigurace
cp .env.example .env
nano .env  # Upravit pro produkci!

# 4. SSL certifikáty (Let's Encrypt)
sudo apt install certbot
sudo certbot certonly --standalone -d kalkulace.electree.cz

# 5. Nginx konfigurace
sudo cp nginx/nginx.conf /etc/nginx/sites-available/kalkulace.electree.cz
sudo ln -s /etc/nginx/sites-available/kalkulace.electree.cz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. Spustit aplikaci
docker-compose -f docker-compose.prod.yml up -d

# 7. Migrace
docker-compose exec backend alembic upgrade head

# 8. První admin
docker-compose exec backend python -m app.scripts.create_admin
```

---

## 📈 Monitoring

### Flower (Celery monitoring)
- URL: http://localhost:5555
- Monitoring fronty úloh, workerů, úspěšnosti výpočtů

### Adminer (Database)
- URL: http://localhost:8080
- Server: postgres
- Username: kalkulace_user
- Database: kalkulace_db

### Health checks
```bash
# Backend
curl http://localhost:8000/health

# Celery
docker-compose exec celery_worker celery -A app.celery_app inspect active
```

---

## 🐛 Troubleshooting

### Backend nespouští
```bash
# Zkontrolovat logy
docker-compose logs backend

# Zkontrolovat DB připojení
docker-compose exec backend python -c "from app.database import engine; print(engine.connect())"
```

### Celery worker nefunguje
```bash
# Zkontrolovat Redis
docker-compose exec redis redis-cli ping

# Zkontrolovat worker logy
docker-compose logs celery_worker

# Restartovat worker
docker-compose restart celery_worker
```

### Frontend se nenačítá
```bash
# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend

# Zkontrolovat Nginx logy
docker-compose logs nginx
```

---

## 🔐 Bezpečnost

### Důležité!
- ✅ Změnit všechna defaultní hesla v .env
- ✅ Používat silné SECRET_KEY (min 32 znaků)
- ✅ Nastavit HTTPS (Let's Encrypt)
- ✅ Pravidelně aktualizovat Docker images
- ✅ Záloha databáze (cron job)
- ✅ Rate limiting na API
- ✅ Firewall (ufw)

### Doporučené nastavení Ubuntu firewall
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 📝 Changelog

### v1.0.0 (2024-10-29)
- ✨ První release
- ✅ Kompletní backend API
- ✅ React frontend
- ✅ Docker setup
- ✅ Bridge mechanismus pro Python engine
- ✅ Externí API
- ✅ Admin panel

---

## 📞 Support

- **Email**: support@electree.cz
- **Documentation**: https://docs.kalkulace.electree.cz
- **Issues**: https://github.com/your-org/kalkulace-web/issues

---

## 📄 License

Copyright © 2024 Electree. All rights reserved.
#   o p t i m a l i z a c e - b r i d g e  
 #   o p t i m a l i z a c e - b r i d g e  
 