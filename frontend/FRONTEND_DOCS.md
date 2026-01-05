# Frontend - Kompletní Dokumentace

## 📁 Struktura Projektu

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Layout.jsx          ✅ Hlavní layout s navigací
│   │   │   ├── Modal.jsx           ✅ Univerzální modal
│   │   │   ├── Alert.jsx           ✅ Alert komponenta
│   │   │   ├── LoadingSpinner.jsx  ✅ Loading stav
│   │   │   └── Toast.jsx           ✅ Toast notifikace
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx       ✅ Přihlášení
│   │   │   ├── RegisterPage.jsx    ✅ Registrace
│   │   │   └── ProtectedRoute.jsx  ✅ Ochrana route
│   │   ├── files/
│   │   │   ├── FileUpload.jsx      ✅ Upload formulář
│   │   │   ├── DragDropUpload.jsx  ✅ Drag & drop
│   │   │   └── CSVPreview.jsx      ✅ CSV náhled
│   │   └── calculations/
│   │       └── (připraveno pro komponenty)
│   ├── contexts/
│   │   ├── AuthContext.jsx         ✅ Autentizace
│   │   └── ToastContext.jsx        ✅ Notifikace
│   ├── pages/
│   │   ├── DashboardPage.jsx       ✅ Dashboard s real-time stats
│   │   ├── FilesPage.jsx           ⚙️  Připraveno (potřebuje integraci)
│   │   ├── CalculationsPage.jsx    ✅ Seznam kalkulací
│   │   ├── NewCalculationPage.jsx  ⚙️  Formulář (potřebuje wizard)
│   │   ├── CalculationDetailPage.jsx ⚙️  Detail (potřebuje live tracking)
│   │   ├── ResultsPage.jsx         ⚙️  Výsledky (potřebuje grafy)
│   │   ├── ConfigurationsPage.jsx  ✅ Seznam konfigurací
│   │   ├── ConfigurationFormPage.jsx ⚙️  Formulář (potřebuje sections)
│   │   └── UsersManagementPage.jsx ✅ Admin panel
│   ├── services/
│   │   ├── api.js                  ✅ Axios client s interceptors
│   │   ├── authService.js          ✅ Auth API
│   │   ├── filesService.js         ✅ Files API
│   │   ├── calculationsService.js  ✅ Calculations API
│   │   ├── configurationsService.js ✅ Configurations API
│   │   └── usersService.js         ✅ Users API
│   ├── utils/
│   │   ├── helpers.js              ✅ Utility funkce
│   │   └── constants.js            ✅ Konstanty
│   ├── App.jsx                     ✅ Hlavní app s routing
│   └── main.jsx                    ✅ Entry point
├── public/
├── package.json                    ✅ Dependencies
├── tailwind.config.js              ✅ Tailwind konfigurace
└── vite.config.js                  ✅ Vite konfigurace
```

## 🎨 Design System

### Barvy (Tailwind)
- **Primary**: Blue (`#0ea5e9` - Sky blue)
- **Success**: Green (`#10b981`)
- **Error**: Red (`#ef4444`)
- **Warning**: Yellow (`#f59e0b`)
- **Info**: Blue (`#3b82f6`)

### Ikony
- **Lucide React**: Moderní SVG ikony

### Komponenty
- Buttons: Primary, Secondary, Danger
- Cards: Statistiky, seznamy
- Forms: Input, Select, Textarea
- Tables: Responzivní s sorting/filtering
- Modals: Různé velikosti
- Toasts: 4 typy s auto-dismiss

## 🔌 API Integrace

### Base URL
- Development: `http://localhost:8000/api/v1`
- Production: `/api/v1` (přes proxy)

### Autentizace
```javascript
const { login, logout } = useAuth();
await login(username, password);
```

### Notifikace
```javascript
const { showSuccess, showError, showWarning, showInfo } = useToast();
showSuccess('Operace proběhla úspěšně!');
```

### API Volání
```javascript
import calculationsService from '../services/calculationsService';

// Načtení dat
const data = await calculationsService.getCalculations({ limit: 10 });

// Vytvoření
const result = await calculationsService.createCalculation(formData);
```

## 📊 Klíčové Funkce

### 1. Dashboard
- ✅ Real-time statistiky (auto-refresh 30s)
- ✅ Počty kalkulací (celkem, běžící, dokončené, selhané)
- ✅ Poslední kalkulace
- ✅ Rychlé akce
- ✅ Animované karty

### 2. Správa Souborů
- ✅ Upload formulář
- ✅ Drag & drop upload
- ✅ CSV preview
- ⚙️ Filtry a vyhledávání
- ⚙️ Metadata zobrazení

### 3. Kalkulace
- ✅ Seznam s filtry (status)
- ✅ Auto-refresh běžících kalkulací
- ⚙️ Wizard pro vytvoření
- ⚙️ Live tracking (progress bar, logs)
- ⚙️ Možnost zrušit výpočet

### 4. Výsledky
- ✅ Základní zobrazení
- ⚙️ Pokročilé grafy (Recharts)
  - Měsíční spotřeba/výroba
  - Denní profily
  - Roční srovnání
- ⚙️ Export CSV/Excel/PDF
- ⚙️ Srovnání scénářů

### 5. Konfigurace
- ✅ Seznam s CRUD
- ✅ Nastavení výchozí
- ⚙️ Šablony
- ⚙️ Import/Export
- ⚙️ Klonování

### 6. Admin Panel
- ✅ Správa uživatelů
- ✅ Toggle active/inactive
- ⚙️ Audit log
- ⚙️ Statistiky aktivit

## 🚀 Další Vývoj

### Priorita 1 - Wizard pro kalkulace
```
NewCalculationPage:
1. Výběr souboru (s preview)
2. Výběr/vytvoření konfigurace
3. Nastavení parametrů
4. Kontrola a spuštění
```

### Priorita 2 - Live Tracking
```
CalculationDetailPage:
- Progress bar (0-100%)
- Live log stream (WebSocket nebo polling)
- Možnost zrušit
- Notifikace při dokončení
```

### Priorita 3 - Pokročilé Grafy
```
ResultsPage:
- Recharts komponenty
- Interaktivní grafy
- Zoom & pan
- Export grafů jako obrázky
```

### Priorita 4 - Template System
```
ConfigurationsPage:
- Šablony (Domácnost, Firma, atd.)
- Klonování konfigurací
- Import/Export JSON
```

## 📝 Konvence Kódu

### Struktura Komponenty
```javascript
/**
 * Component Name - Description
 */

import React, { useState, useEffect } from 'react';
// ... další importy

const ComponentName = ({ props }) => {
  // State
  const [state, setState] = useState(initialValue);

  // Effects
  useEffect(() => {
    // logic
  }, [dependencies]);

  // Handlers
  const handleAction = () => {
    // logic
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

### Naming
- **Komponenty**: PascalCase (e.g., `DashboardPage.jsx`)
- **Funkce**: camelCase (e.g., `handleSubmit`)
- **Konstanty**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **CSS Classes**: kebab-case nebo Tailwind utility

### Error Handling
```javascript
try {
  const data = await apiCall();
  showSuccess('Úspěch!');
} catch (error) {
  showError(error.response?.data?.detail || 'Došlo k chybě');
  console.error('Error:', error);
}
```

## 🧪 Testing (připraveno)

### Unit Tests
- Components: React Testing Library
- Utils: Jest
- Services: Mock API responses

### E2E Tests
- Cypress nebo Playwright
- Kritické workflows

## 🔧 Konfigurace

### Environment Variables
```
VITE_API_URL=http://localhost:8000
```

### Vite Proxy
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

## 📦 Dependencies

### Core
- React 18.2
- React Router DOM 6.20
- Vite 5.0

### UI
- Tailwind CSS 3.3
- Lucide React (icons)
- React Dropzone
- Recharts (graphs)

### Utils
- Axios (HTTP)
- Date-fns (dates)

## 🎯 Roadmap

### Fáze 1 ✅ (Dokončeno)
- [x] Základní struktura
- [x] Autentizace
- [x] Dashboard s statistikami
- [x] Toast notifikace
- [x] Drag & drop upload

### Fáze 2 ⚙️ (V průběhu)
- [ ] Wizard pro kalkulace
- [ ] Live tracking
- [ ] Pokročilé grafy
- [ ] Template system

### Fáze 3 📋 (Plánováno)
- [ ] Dark mode
- [ ] Export funkcionalita
- [ ] Reports & Analytics
- [ ] Mobile optimalizace

### Fáze 4 🔮 (Budoucnost)
- [ ] WebSocket real-time updates
- [ ] PWA podpora
- [ ] Multi-language (i18n)
- [ ] Advanced charts (D3.js)
