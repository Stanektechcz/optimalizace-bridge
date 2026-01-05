# Opravy grafů - 5.11.2025

## Provedené opravy

### ✅ 1. Odstranění nákladů z hlavního grafu
**Problém**: Python skript nemá náklady v hlavním grafu energie.  
**Řešení**: Odebrány náklady (cost) z:
- `AdvancedLineChart.jsx` - odstraněn `cost` field a color
- `ChartDisplayControls.jsx` - odstraněn label "Náklady"
- `ResultsPage.jsx` - odstraněn `cost` z visibleLines a colors

**Python reference**: Náklady jsou v Python na třetí Y-ose (`ax3`), ale pro jednoduchost je necháváme v samostatném grafu níže.

### ✅ 2. Oprava drag-to-zoom výběru oblasti
**Problém**: ReferenceArea se nezobrazovala a výběr oblasti nefungoval.  
**Řešení**:
- Přidán `isDragging` state pro sledování tažení
- Opraveny `handleMouseDown`, `handleMouseMove`, `handleMouseUp`
- ReferenceArea nyní používá `processedData[index]?.Den` pro správné x1/x2
- Přidán `onMouseLeave` pro ukončení tažení při opuštění grafu
- Výběr oblasti nyní funguje s indexy a správně zoomuje

### ✅ 3. Oprava mouse wheel zoomu
**Problém**: Kolečko myši nezoomovalo graf.  
**Řešení**:
- Implementována funkce `handleWheel` s `e.preventDefault()`
- Zoom factor: kolečko nahoru = 0.9 (zoom in), dolů = 1.1 (zoom out)
- Registrován native event listener s `{ passive: false }`
- Zoom se provádí kolem středu aktuálního zobrazení
- Minimální rozsah: 10 bodů

### ✅ 4. Implementace decimace dat pro rychlost
**Problém**: Graf byl pomalý s velkým množstvím dat (8784 bodů).  
**Řešení**:
- Implementován **LTTB (Largest-Triangle-Three-Buckets)** algoritmus
- Maximální počet zobrazených bodů: 2000 (konfigurovatelné)
- Decimace se aplikuje po zoom filtru
- Zobrazení počtu bodů: "Zobrazeno X z Y bodů (optimalizováno)"
- Graf je nyní rychlý i s rozsáhlými daty

### ✅ 5. České formátování datumů
**Problém**: Datumy se zobrazovaly v ISO formátu s vteřinami.  
**Řešení**:
- Vytvořena funkce `formatCzechDate(dateString)`
- Formát: `5.11.2025 14:30` (bez vteřin)
- Aplikováno na:
  - Tooltip (hlavní zobrazení)
  - X-axis labels (tickFormatter)
  - CSV export
- Data obsahují `_formattedDate` field pro cache

## Technické detaily

### Decimation algoritmus (LTTB)
```javascript
const decimateData = (data, threshold) => {
  // Vybere nejvýznamnější body zachovávající tvar grafu
  // - První bod (always)
  // - Nejvíce reprezentativní body z bucketů
  // - Poslední bod (always)
}
```

### Zoom implementace
```javascript
// State
const [zoomState, setZoomState] = useState({
  left: 0,                    // Index začátku
  right: data.length - 1,     // Index konce
  refAreaLeft: null,          // Drag start
  refAreaRight: null,         // Drag end
});

// Processed data flow:
// 1. Všechna data → zpracování (suma, inverze)
// 2. Filter podle zoom (slice)
// 3. Decimace (pokud > threshold)
```

### Datum formátování
```javascript
formatCzechDate("2025-11-05T14:30:00")
// → "5.11.2025 14:30"
```

## Testování

### Testovací checklist:
- [x] Náklady nejsou v hlavním grafu
- [x] Kolečko myši zoomuje (scroll nahoru/dolů)
- [x] Drag-to-zoom funguje (klikni a táhni)
- [x] Modrá oblast se zobrazuje při tažení
- [x] Reset Zoom vrátí původní zobrazení
- [x] Datumy jsou v českém formátu bez vteřin
- [x] Graf je rychlý (8784 bodů → 2000 bodů)
- [x] Decimace se zobrazuje v info textu
- [x] Všechny suma režimy fungují
- [x] Invertování výroby funguje
- [x] Baterie režimy fungují (pokud BkWh_charge existuje)
- [x] Export CSV obsahuje české datumy

## Výkon

### Před optimalizací:
- 8784 bodů renderováno přímo
- Lag při interakci
- Pomalé přepínání režimů

### Po optimalizaci:
- Max 2000 bodů zobrazeno (LTTB decimace)
- Plynulá interakce
- Rychlé přepínání režimů
- Zoom je okamžitý

## Soubory změněny:
1. `frontend/src/components/charts/AdvancedLineChart.jsx` - kompletní přepis
2. `frontend/src/components/charts/ChartDisplayControls.jsx` - odstranění cost
3. `frontend/src/pages/ResultsPage.jsx` - odstranění cost z props

## Poznámky:
- LTTB algoritmus zachovává vizuální podobu grafu i po decimaci
- Decimace se provádí pouze na zobrazených datech (po zoom filtru)
- Wheel zoom má minimum 10 bodů pro zachování detailů
- Czech date format používá nativní Date API
