# Interaktivní grafy - Uživatelská příručka

## 🎯 Funkce

### 1. **Zoom kolečkem myši**
- Najeďte myší na graf
- Kolečko nahoru = přiblížit (zoom in)
- Kolečko dolů = oddálit (zoom out)
- Zoom se aplikuje kolem aktuální polohy myši

### 2. **Výběr oblasti pro zoom**
- Klikněte levým tlačítkem myši na graf
- Držte tlačítko stisknuté a táhněte myší
- Vybraná oblast se zvýrazní modře
- Pusťte tlačítko - graf se přiblíží na vybranou oblast

### 3. **Filtrování položek**
- Klikněte na položku v legendě (pod grafem)
- Položka se skryje/zobrazí
- Ikona oka ukazuje stav (otevřené oko = viditelné)
- Můžete zobrazit jen vybrané kombinace dat

### 4. **Reset zoom**
- Tlačítko "Reset" v pravém horním rohu
- Vrátí graf na původní zobrazení všech dat

### 5. **Export dat**
- Tlačítko "Export" v pravém horním rohu
- Exportuje aktuálně zobrazená data jako CSV
- Obsahuje pouze viditelné položky

## 📊 Dostupné grafy

### Časový průběh energie
- **Spotřeba (kWh)** - modrá - celková spotřeba
- **FVE výroba (kWh)** - zelená - výroba z fotovoltaiky
- **Baterie (kWh)** - oranžová - tok energie z/do baterie
- **Síť (kWh)** - fialová - tok energie ze/do sítě

### Časový průběh výkonu
- **Spotřeba (kW)** - modrá - okamžitý výkon spotřeby
- **FVE výkon (kW)** - zelená - okamžitý výkon FVE
- **Baterie výkon (kW)** - oranžová - okamžitý výkon baterie

### Průběh nákladů
- **Náklady (Kč)** - modrá - náklady v čase

### Stav nabití baterie
- **Nabití (%)** - oranžová - aktuální stav nabití baterie (0-100%)

## 🔧 Technické detaily

### Data z Python výpočtu
Všechny grafy zobrazují data přímo z Python calculation engine:
- `libs/process.py` - hlavní výpočetní modul
- `libs/funsProcess.py` - pomocné funkce
- Data jsou ve formátu pandas DataFrame
- Převedeno na JSON pro frontend

### Datové sloupce
Dostupné sloupce v `chartsData` (dataRed):
- `Den` - časové razítko (datum a čas)
- `kWh` - energie spotřeba
- `PVkWh` - energie z FVE
- `BkWh` - energie baterie
- `Grid (kWh)` - energie ze sítě
- `P (kW)` - výkon spotřeba
- `PV (kW)` - výkon FVE
- `B (kW)` - výkon baterie
- `Cost (Kč)` - náklady
- `SOC (%)` - stav nabití baterie

### Optimalizace
- Automatická decimace dat při velkém zoom out
- Renderování pouze viditelných dat
- React.memo pro prevenci zbytečných překreslení
- Vypnuté animace při zoomování pro rychlost

## 💡 Tipy

1. **Analýza detailů**: Použijte výběr oblasti (drag) pro přesný zoom na zajímavé úseky
2. **Porovnání dat**: Skryjte některé položky pro lepší čitelnost zbývajících
3. **Export analýzy**: Exportujte konkrétní zoom pro další zpracování v Excelu
4. **Kombinace zoom**: Použijte nejdříve drag pro hrubý zoom, pak kolečko pro jemné doladění
5. **Reset vždy pomůže**: Při ztrátě orientace použijte tlačítko Reset

## 🎨 Barvy grafů

Barvy jsou konzistentní napříč všemi grafy:
- 🔵 Modrá (#3b82f6) - Spotřeba
- 🟢 Zelená (#10b981) - FVE (fotovoltaika)
- 🟠 Oranžová (#f59e0b) - Baterie
- 🟣 Fialová (#8b5cf6) - Síť
