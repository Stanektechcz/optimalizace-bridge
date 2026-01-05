# Testování pokročilých funkcí grafů

Tento soubor dokumentuje testovací scénáře pro ověření správnosti implementace pokročilých funkcí grafů.

## Testovací checklist

### ✅ Základní funkčnost

- [ ] **ChartDisplayControls se zobrazuje**
  - Ovládací panel je viditelný nad hlavním grafem
  - Všechny checkboxy jsou zobrazeny
  - Radio buttons jsou viditelné

- [ ] **AdvancedLineChart se renderuje**
  - Graf se načte bez chyb
  - Data jsou správně zobrazena
  - Duální Y-osa funguje (pokud je aktivována Cena)

### ✅ Zobrazení/skrytí čar (Checkboxy)

- [ ] **Spotřeba checkbox**
  - Zaškrtnutí: Zobrazí fialovou čáru spotřeby
  - Odškrtnutí: Skryje čáru spotřeby

- [ ] **Výroba checkbox**
  - Zaškrtnutí: Zobrazí oranžovou čáru výroby
  - Odškrtnutí: Skryje čáru výroby

- [ ] **Baterie checkbox**
  - Zaškrtnutí: Zobrazí modrou čáru baterie
  - Odškrtnutí: Skryje čáru baterie

- [ ] **Suma checkbox**
  - Zaškrtnutí: Zobrazí zelenou sumarizační čáru
  - Odškrtnutí: Skryje sumarizační čáru

- [ ] **Cena checkbox** (pokud dostupné)
  - Zaškrtnutí: Zobrazí červenou čáru ceny na pravé Y-ose
  - Odškrtnutí: Skryje čáru ceny

### ✅ Invertovat výrobu

- [ ] **Výchozí stav (nezaškrtnuto)**
  - Výroba je zobrazena jako kladné hodnoty
  - Oranžová čára je nad osou X

- [ ] **Zaškrtnuto**
  - Výroba je zobrazena jako záporné hodnoty
  - Oranžová čára je pod osou X
  - Hodnoty jsou negované (např. 5 kWh → -5 kWh)

- [ ] **Přepínání**
  - Změna checkbox okamžitě aktualizuje graf
  - Žádné chyby v konzoli

### ✅ Suma režimy (RadioButtons)

- [ ] **Všechno** (výchozí)
  - Zelená čára suma = Baterie + Spotřeba + Výroba
  - Legenda: "Suma (Všechno)"

- [ ] **Spotřeba a výroba**
  - Zelená čára suma = Spotřeba + Výroba
  - Legenda: "Suma (Spotřeba a výroba)"
  - Baterie není zahrnuta

- [ ] **Spotřeba a baterie**
  - Zelená čára suma = Spotřeba + Baterie
  - Legenda: "Suma (Spotřeba a baterie)"
  - Výroba není zahrnuta

- [ ] **Výroba a baterie**
  - Zelená čára suma = Výroba + Baterie
  - Legenda: "Suma (Výroba a baterie)"
  - Spotřeba není zahrnuta

### ✅ Baterie režimy (RadioButtons)

**Pozn**: Tyto radio buttons se zobrazí pouze pokud existuje `BkWh_charge` v datech.

- [ ] **Odběr / Dodávka** (výchozí)
  - Modrá čára baterie zobrazuje BkWh
  - Legenda: "Baterie"
  - Kladné = nabíjení, záporné = vybíjení

- [ ] **Energie v baterii**
  - Modrá čára baterie zobrazuje BkWh_charge
  - Legenda: "Energie v baterii"
  - Kumulativní energie v baterii

### ✅ Interaktivní funkce (z InteractiveLineChart)

- [ ] **Mouse wheel zoom**
  - Kolečko myši nahoru = zoom in
  - Kolečko myši dolů = zoom out
  - Zoom funguje i s novými funkcemi aktivními

- [ ] **Drag-to-zoom**
  - Kliknutí a tažení vybere oblast
  - Modrá oblast je viditelná během výběru
  - Po uvolnění myši se přiblíží na vybranou oblast

- [ ] **Kliknutí na legendu**
  - Kliknutí na položku v legendě skryje/zobrazí čáru
  - Ikona Eye/EyeOff se mění
  - Opacity se mění (skryté = 0.5)

- [ ] **Reset Zoom button**
  - Vrátí graf na původní zobrazení
  - Všechny změny zoom jsou resetovány

- [ ] **Export CSV button**
  - Exportuje CSV soubor
  - CSV obsahuje pouze viditelné čáry
  - CSV obsahuje pouze zoomovanou oblast (pokud je aktivní)
  - Hlavičky v češtině

### ✅ Duální Y-osa

- [ ] **Levá Y-osa**
  - Label: "Energie - kWh"
  - Zobrazuje: Spotřeba, Výroba, Baterie, Suma

- [ ] **Pravá Y-osa**
  - Label: "Cena - Kč/kWh"
  - Zobrazuje se pouze když je zaškrtnuto "Cena"
  - Červená čára ceny má správnou škálu

### ✅ Barevné schéma

Zkontrolujte, že barvy odpovídají Python implementaci:

- [ ] Spotřeba: Fialová (#9467bd)
- [ ] Výroba: Oranžová (#ff7f0e)
- [ ] Baterie: Modrá (#1f77b4)
- [ ] Suma: Zelená (#2ca02c)
- [ ] Cena: Červená (#d62728)

### ✅ Kombinované testy

- [ ] **Invertovat výrobu + Suma režim**
  - Při změně režimu sumy je invertování respektováno
  - Suma správně počítá s invertovanými hodnotami

- [ ] **Všechny funkce najednou**
  - Aktivujte všechny checkboxy
  - Změňte suma režim
  - Aktivujte invertování
  - Změňte baterie režim
  - Graf funguje bez chyb

- [ ] **Zoom + změna režimu**
  - Přibližte graf
  - Změňte suma režim
  - Zoom zůstává aktivní
  - Data se správně přepočítají

- [ ] **Export po změně režimu**
  - Změňte suma režim
  - Aktivujte invertování
  - Exportujte CSV
  - CSV obsahuje správné přepočítané hodnoty

### ✅ Výkon a UX

- [ ] **Rychlost reakce**
  - Změna checkbox je okamžitá (< 100ms)
  - Změna radio button je okamžitá
  - Žádné zasekávání při změnách

- [ ] **Žádné chyby v konzoli**
  - Žádné React warnings
  - Žádné Recharts errors
  - Žádné undefined/null errors

- [ ] **Responsive design**
  - Graf se správně zobrazuje na menších obrazovkách
  - Ovládací panel se obalí (flex-wrap)
  - Tooltip je viditelný

## Bug tracking

Pokud najdete bug, dokumentujte zde:

### Bug template:
```
**Popis**: Co se stalo?
**Očekávané chování**: Co mělo být?
**Kroky k reprodukci**: 
1. 
2. 
3. 
**Environment**: Browser, OS
**Konzole chyby**: (pokud nějaké)
```

---

## Poznámky k implementaci

### Data requirements
Graf očekává následující pole v `chartsData`:
- `Den` (string) - časové razítko
- `kWh` (number) - spotřeba
- `PVkWh` (number) - výroba
- `BkWh` (number) - baterie (odběr/dodávka)
- `BkWh_charge` (number, volitelné) - energie v baterii
- `Kč/kWh` (number, volitelné) - cena
- `Cost (Kč)` (number, volitelné) - náklady

### Known limitations
- **BkWh_charge**: Pokud není v datech, baterie režimy radio buttons se nezobrazí
- **Cena checkbox**: Pokud není `Kč/kWh` v datech, pravá Y-osa nebude funkční
- **Export CSV**: Exportuje pouze aktuálně zobrazenou oblast (podle zoom state)

### Future enhancements
- [ ] Víkendy zvýrazněné šedým pozadím (jako v Python)
- [ ] Třetí Y-osa pro náklady (pokud je třeba)
- [ ] Cyberpunk theme style (mplcyberpunk ekvivalent)
- [ ] PDF export grafu
- [ ] Datum range selector
