# Frontend - Kalkulace API

React frontend aplikace pro Kalkulace API - Optimalizace energetické bilance.

## Technologie

- **React 18** - UI knihovna
- **Vite** - Build tool a dev server
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP klient
- **Recharts** - Grafy a vizualizace
- **Lucide React** - Ikony
- **React Dropzone** - File upload
- **date-fns** - Datum utilities

## Instalace

```bash
cd frontend
npm install
```

## Spuštění vývojového serveru

```bash
npm run dev
```

Aplikace bude dostupná na `http://localhost:3000`

## Build pro produkci

```bash
npm run build
```

Build se vytvoří ve složce `dist/`

## Struktura projektu

```
frontend/
├── public/              # Statické soubory
├── src/
│   ├── components/      # React komponenty
│   │   ├── auth/       # Autentizace (Login, Register)
│   │   ├── common/     # Sdílené komponenty (Layout, Modal)
│   │   ├── files/      # Správa souborů
│   │   ├── calculations/ # Kalkulace
│   │   ├── configurations/ # Konfigurace
│   │   └── admin/      # Admin panel
│   ├── contexts/       # React contexts (Auth)
│   ├── pages/          # Stránky aplikace
│   ├── services/       # API služby
│   ├── utils/          # Utility funkce
│   ├── styles/         # CSS soubory
│   ├── App.jsx         # Hlavní komponenta
│   └── main.jsx        # Entry point
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Funkce

### Autentizace
- Přihlášení (username/email + heslo)
- Registrace nových uživatelů
- JWT token management
- Auto-refresh tokenů
- Protected routes

### Správa souborů
- Drag & drop upload
- Podporované formáty: CSV, XLS, XLSX
- Preview metadata (počet řádků, sloupců)
- Stahování souborů
- Mazání souborů
- Filtrování a vyhledávání

### Kalkulace
- Vytvoření nové kalkulace
- Výběr vstupních souborů
- Nastavení parametrů
- Sledování stavu výpočtu (pending, running, completed, failed)
- Zobrazení výsledků s grafy
- Export výsledků (CSV)

### Konfigurace
- CRUD operace s konfiguracemi
- Nastavení výchozí konfigurace
- Import/export konfigurací

### Admin panel
- Správa uživatelů
- Aktivace/deaktivace účtů
- Statistiky systému

## API Konfigurace

Backend API endpoint se nastavuje v `.env` souboru:

```env
VITE_API_URL=http://localhost:8000
```

Nebo použijte proxy v `vite.config.js` (výchozí nastavení).

## Demo přihlašovací údaje

**Admin účet:**
- Username: `admin`
- Password: `Admin123`

## Vývoj

### Struktura komponent

Každá složitější komponenta má svou vlastní složku:

```
components/
  ComponentName/
    index.jsx           # Export
    ComponentName.jsx   # Hlavní soubor
    ComponentName.test.jsx  # Testy (volitelné)
```

### Konvence pojmenování

- **Komponenty**: PascalCase (např. `DashboardPage.jsx`)
- **Utility funkce**: camelCase (např. `formatDate`)
- **Konstanty**: UPPER_SNAKE_CASE (např. `API_BASE_URL`)

### Styling

Používáme Tailwind CSS utility-first approach:

```jsx
<div className="flex items-center gap-4 px-6 py-4 bg-white rounded-lg shadow-sm">
  ...
</div>
```

Custom CSS pouze pro specifické případy v `styles/index.css`.

## Licence

Proprietary - Všechna práva vyhrazena
