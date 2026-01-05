# Optimalizace grafů

## Přehled optimalizací

Grafy byly optimalizovány pro práci s velkými datovými sadami (8000+ datových bodů) s následujícími vylepšeními:

### 1. **Data Decimation (Redukce dat)**
- Používá zjednodušenou verzi Largest-Triangle-Three-Buckets algoritmu
- Redukuje počet bodů při zachování vizuální podobnosti
- Výchozí limit: 500 bodů pro line chart, 300 pro bar chart
- Uživatel může přepnout na zobrazení všech dat

### 2. **Memoizace**
- React.memo obaluje komponenty pro prevenci zbytečného překreslování
- useMemo cache výsledky decimace a výpočtů
- useCallback optimalizuje event handlery

### 3. **Interaktivní Zoom s Brush**
- Uživatel může zoomovat táhnutím myši
- Při zoomu se načítají jen viditelná data
- Decimace se přepočítá pro aktuální rozsah

### 4. **Vypnutí animací**
- `isAnimationActive={false}` pro okamžité vykreslení
- Výrazně zrychluje rendering grafů

### 5. **Inteligentní zobrazení bodů**
- Body (dots) se zobrazují jen při < 100 bodech
- Redukuje počet DOM elementů

### 6. **Chart Controls**
- Tlačítko pro přepnutí optimalizace/plná data
- Reset zoomu
- Export dat do CSV
- Zobrazení počtu bodů (zobrazeno/celkem)

## Použití

### EnhancedLineChart (doporučeno)
```jsx
<EnhancedLineChart
  data={chartsData}
  title="Časový průběh"
  xAxisKey="Den"
  height={450}
  maxPoints={500}
  lines={[
    { dataKey: 'kWh', stroke: '#3b82f6', name: 'Spotřeba' },
    { dataKey: 'PVkWh', stroke: '#10b981', name: 'FVE' }
  ]}
  showBrush={true}
/>
```

### OptimizedLineChart (bez controls)
```jsx
<OptimizedLineChart
  data={data}
  lines={lines}
  height={400}
  maxPoints={500}
  enableOptimization={true}
  onDataLengthChange={(info) => console.log(info)}
/>
```

### OptimizedBarChart
```jsx
<OptimizedBarChart
  data={data}
  bars={[
    { dataKey: 'cost', fill: '#3b82f6', name: 'Náklady' }
  ]}
  height={400}
  maxPoints={300}
/>
```

## Výkon

### Před optimalizací
- 8784 bodů = ~500ms render time
- Lagující zoom/pan
- Problémy s responsivitou

### Po optimalizaci
- 500 bodů (decimováno) = ~50ms render time
- Plynulý zoom/pan
- Rychlá reakce na interakce

## Poznámky

- **Decimace zachovává důležité body** (vrcholy, údolí)
- **Při zoomu se přepočítává decimace** pro maximální detail
- **Uživatel může zobrazit všechna data** tlačítkem "Zobrazit vše"
- **Export obsahuje vždy všechna data**, ne jen zobrazená
