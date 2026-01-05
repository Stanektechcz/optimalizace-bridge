# Pokročilé možnosti grafů - podle Python funsChart.py

Tato dokumentace popisuje pokročilé funkce pro zobrazení grafů, které přesně odpovídají Python implementaci v `libs/funsChart.py`.

## Přehled funkcí

### 1. Ovládací panel (ChartDisplayControls)

Ovládací panel poskytuje kompletní kontrolu nad zobrazením grafů, včetně:

#### Checkboxy pro zobrazení/skrytí čar:
- **Spotřeba** - zobrazí/skryje spotřebu energie (kWh)
- **Výroba** - zobrazí/skryje výrobu z FVE (PVkWh)
- **Baterie** - zobrazí/skryje baterii
- **Suma** - zobrazí/skryje sumarizační čáru
- **Cena** - zobrazí/skryje cenovou čáru na sekundární Y-ose
- **Náklady** - zobrazí/skryje celkové náklady (pokud dostupné)

#### Invertovat výrobu:
- **Účel**: Zobrazí výrobu jako záporné hodnoty (pod osou X)
- **Python**: `pvi = -dataRed['PVkWh']` vs `pvr = dataRed['PVkWh']`
- **Použití**: Pro lepší vizualizaci rozdílu mezi spotřebou a výrobou

### 2. Režimy sumy (Suma zahrnuje)

Suma může zahrnovat různé kombinace spotřeby, výroby a baterie:

#### Všechno (výchozí)
```python
# Python: s1 = dataRed['BkWh'] + dataRed['kWh'] + dataRed['PVkWh']
```
- Celková suma: Baterie + Spotřeba + Výroba
- **Účel**: Zobrazí celkový energetický tok v systému

#### Spotřeba a výroba
```python
# Python: s2 = dataRed['kWh'] + dataRed['PVkWh']
```
- Suma: Spotřeba + Výroba (bez baterie)
- **Účel**: Analýza vztahu mezi spotřebou a výrobou z FVE

#### Spotřeba a baterie
```python
# Python: s3 = dataRed['BkWh'] + dataRed['kWh']
```
- Suma: Baterie + Spotřeba (bez výroby)
- **Účel**: Analýza jak baterie podporuje spotřebu

#### Výroba a baterie
```python
# Python: s4 = dataRed['BkWh'] + dataRed['PVkWh']
```
- Suma: Baterie + Výroba (bez spotřeby)
- **Účel**: Analýza vztahu mezi výrobou a akumulací v baterii

### 3. Režimy baterie (Graf baterie)

Pro detailní analýzu baterie jsou k dispozici dva režimy:

#### Odběr / Dodávka (výchozí)
```python
# Python: b1 = dataRed['BkWh']
```
- Zobrazuje aktuální tok energie do/z baterie
- **Kladné hodnoty**: Nabíjení baterie (odběr z FVE/sítě)
- **Záporné hodnoty**: Vybíjení baterie (dodávka do spotřeby)

#### Energie v baterii
```python
# Python: b2 = dataRed['BkWh_charge']
```
- Zobrazuje kumulativní energii uloženou v baterii
- Alternativně: State of Charge (SOC) v procentech
- **Účel**: Sledování stavu nabití baterie v čase

### 4. Duální Y-osa

Graf automaticky podporuje dvě Y-osy:

- **Levá osa**: Energie (kWh) - spotřeba, výroba, baterie, suma
- **Pravá osa**: Cena (Kč/kWh) nebo Náklady (Kč)

```python
# Python implementace:
self.ax1 = self.fig.add_subplot()  # Levá osa
self.ax2 = self.ax1.twinx()        # Pravá osa (cena)
self.ax3 = self.ax1.twinx()        # Další osa (náklady)
```

### 5. Barevné schéma

Barvy odpovídají Python implementaci (`styleColors['default']`):

| Položka | Barva | Python | Účel |
|---------|-------|--------|------|
| Spotřeba | Fialová (`#9467bd`) | `tab:purple` | Spotřeba energie |
| Výroba | Oranžová (`#ff7f0e`) | `tab:orange` | Výroba z FVE |
| Baterie | Modrá (`#1f77b4`) | `tab:blue` | Tok baterie |
| Suma | Zelená (`#2ca02c`) | `tab:green` | Sumarizace |
| Cena | Červená (`#d62728`) | `tab:red` | Cena (Kč/kWh) |
| Náklady | Tyrkysová (`#17becf`) | `tab:cyan` | Náklady (Kč) |

## Použití

### Základní pracovní postup:

1. **Načtěte výsledky výpočtu**
   - Přejděte na stránku výsledků (`/results/:id`)
   - Klikněte na záložku "Grafy"

2. **Nastavte zobrazení**
   - Použijte checkboxy v ovládacím panelu pro skrytí/zobrazení čar
   - Vyberte režim sumy podle analýzy, kterou potřebujete
   - Zaškrtněte "Invertovat výrobu" pro lepší vizualizaci

3. **Interakce s grafem**
   - **Zoom kolečkem myši**: Přibližte/oddálte
   - **Drag-to-zoom**: Klikněte a táhněte pro výběr oblasti
   - **Klikněte na legendu**: Skrýt/zobrazit konkrétní čáru
   - **Reset Zoom**: Vrátí původní zobrazení
   - **Export CSV**: Exportuje viditelná data do CSV souboru

4. **Režimy baterie** (pokud je k dispozici `BkWh_charge`):
   - Přepněte mezi "Odběr / Dodávka" a "Energie v baterii"
   - Analyzujte jak se baterie nabíjí a vybíjí během dne

## Příklady použití

### Scénář 1: Analýza přebytků FVE
1. Zaškrtněte pouze "Výroba" a "Spotřeba"
2. Zaškrtněte "Invertovat výrobu"
3. Suma: "Spotřeba a výroba"
4. → Vidíte kdy je přebytek výroby (zelená suma je záporná)

### Scénář 2: Efektivita baterie
1. Zobrazte "Baterie" a "Suma"
2. Vyberte režim baterie: "Energie v baterii"
3. Suma: "Výroba a baterie"
4. → Vidíte jak efektivně baterie akumuluje výrobu

### Scénář 3: Vliv ceny na spotřebu
1. Zobrazte "Spotřeba" a "Cena"
2. Suma: vypněte
3. → Vidíte korelaci mezi cenou a spotřebou na duální ose

### Scénář 4: Celkový energetický tok
1. Všechny checkboxy zaškrtnuté
2. Suma: "Všechno"
3. → Kompletní přehled celého systému

## Technické poznámky

### Data struktura
Graf očekává data s následujícími poli:
```javascript
{
  Den: string,           // Časové razítko
  kWh: number,          // Spotřeba
  PVkWh: number,        // Výroba z FVE
  BkWh: number,         // Baterie (odběr/dodávka)
  BkWh_charge?: number, // Energie v baterii (volitelné)
  'Kč/kWh'?: number,    // Cena (volitelné)
  'Cost (Kč)'?: number, // Náklady (volitelné)
}
```

### Zpracování dat
Data jsou automaticky zpracována podle nastavení:
- **Invertování výroby**: `_processedProduction = invertProduction ? -PVkWh : PVkWh`
- **Suma výpočty**: Dynamicky podle `sumMode`
- **Baterie režim**: `_processedBattery = batteryMode === 'energy' ? BkWh_charge : BkWh`

### Performance
- Všechny výpočty probíhají přes `useMemo` pro optimální výkon
- Graf podporuje zoom bez ztráty výkonu (decimace není nutná díky React optimalizacím)
- Export CSV zahrnuje pouze viditelné čáry a zoomovanou oblast

## Srovnání s Python implementací

| Funkce | Python (funsChart.py) | React (AdvancedLineChart) |
|--------|----------------------|---------------------------|
| Zobrazení čar | CheckButtons | Checkboxy v panelu |
| Invertovat výrobu | CheckButton | Checkbox |
| Suma režimy | RadioButtons | Radio buttons |
| Baterie režimy | RadioButtons | Radio buttons |
| Duální Y-osa | `ax1.twinx()` | `<YAxis yAxisId="right">` |
| Barvy | `styleColors` dict | `colors` prop |
| Interaktivita | Matplotlib callbacks | React state + Recharts |

## Budoucí rozšíření

Potenciální rozšíření (zatím neimplementováno):
- Export do PNG/PDF grafu
- Výběr stylu grafu (cyberpunk theme)
- Zobrazení víkendů (šedé pozadí)
- Nákladová osa (třetí Y-osa)
- Filtrování podle data/rozsahu

---

**Poznámka**: Všechny funkce přesně odpovídají Python implementaci v `libs/funsChart.py` pro zajištění konzistence mezi Python výpočty a webovou vizualizací.
