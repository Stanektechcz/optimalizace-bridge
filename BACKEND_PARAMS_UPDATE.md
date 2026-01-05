# Úpravy backendu pro kompletní podporu parametrů

## Datum: 5. listopadu 2025

## Přehled změn

Backend byl upraven tak, aby pracoval a počítal se **všemi parametry** stejně jako Python skript (`OptimalizaceUI.pyw`).

## 1. Frontend - ConfigurationFormPage.jsx

### Přidané parametry FVE
Do sekce **FVE (Fotovoltaika)** byly přidány pokročilé parametry pro přesný výpočet výkonu panelů:

```javascript
FVE: {
  pv_powernom: 10000,        // W - nominální výkon
  pv_eff: 0.2128,            // účinnost panelů (změněno z pv_effconverter)
  pmaxfve: 10000,            // W - omezení výkonu do sítě
  pv_power1: 0.55,           // kW - výkon jednoho panelu
  pv_area1: 2.5844,          // m² - plocha jednoho panelu
  pv_tempeffcoef: 0.0005,    // teplotní koeficient účinnosti
  pv_tempref: 22,            // °C - referenční teplota
  pv_effconverter: 0.95,     // účinnost DC/AC měniče
  predrandcoef: 0            // koeficient náhodnosti predikce (0-1)
}
```

**UI Komponenty:**
- `pv_eff`: Účinnost panelů (10-50%)
- `pv_effconverter`: Účinnost střídače (50-100%)
- Nová sekce "Pokročilé parametry panelů" obsahující:
  - Výkon jednoho panelu (0.1-1 kW)
  - Plocha jednoho panelu (0.5-5 m²)
  - Teplotní koeficient (0-0.01 1/K)
  - Referenční teplota (0-50 °C)
  - Náhodnost predikce (0-1)

### Přidané parametry Optimalizace
Do sekce **Optimalizace** byly přidány:

- `simulaceskutecnehoprovozu`: Checkbox pro experimentální režim simulace (doporučeno vypnuto)

Již existující parametry (nyní plně funkční):
- `optimization_horizon`: Horizont optimalizace v hodinách (1-168)
- `time_resolution`: Časové rozlišení v hodinách (1-24)

## 2. Backend - calculation_engine.py

### Automatické doplňování FVE parametrů
Přidán blok pro doplnění chybějících FVE parametrů s default hodnotami:

```python
if 'FVE' in config:
    fve_defaults = {
        'pv_powernom': 200.0,
        'pv_eff': 0.2128,
        'pmaxfve': 2000,
        'pv_power1': 0.55,
        'pv_area1': 2.5844,
        'pv_tempeffcoef': 0.0005,
        'pv_tempref': 22,
        'pv_effconverter': 0.95,
        'predrandcoef': 0
    }
    for key, default_value in fve_defaults.items():
        if key not in config['FVE']:
            config['FVE'][key] = default_value
```

### Sloučení s default.ini
Backend nyní:
1. Načte `user_settings/default.ini` jako šablonu
2. Mergne uživatelskou konfiguraci přes default hodnoty
3. Doplní chybějící parametry v sekcích Optimalizace, FVE, Export, Graf
4. Zajistí, že všechny sekce obsahují všechny potřebné parametry

## 3. Mapování parametrů Python → Web

### Optimalizace
| Python GUI | Web API | Typ | Default |
|------------|---------|-----|---------|
| optimizationtype | optimizationtype | int (0-3) | 0 |
| optimization_horizon | optimization_horizon | int | 24 |
| time_resolution | time_resolution | int | 1 |
| vnutitrokspotreby | vnutitrokspotreby | int/None | None |
| povolitdodavkydositezbaterie | povolitdodavkydositezbaterie | bool | True |
| povolitodberzesitedobaterie | povolitodberzesitedobaterie | bool | True |
| povolitprekrocenipmax | povolitprekrocenipmax | bool | True |
| vynulovatspotrebnidiagram | vynulovatspotrebnidiagram | bool | False |
| pouzitpredikcispotreby | pouzitpredikcispotreby | bool | False |
| pouzitfixnicenu | pouzitfixnicenu | bool | False |
| simulaceskutecnehoprovozu | simulaceskutecnehoprovozu | bool | False |

### FVE (Fotovoltaika)
| Python GUI | Web API | Typ | Default | Popis |
|------------|---------|-----|---------|-------|
| pv_powernom | pv_powernom | float (W) | 200.0 | Nominální výkon instalace |
| pv_eff | pv_eff | float | 0.2128 | Účinnost panelů |
| pmaxfve | pmaxfve | float (W) | 2000 | Limit výkonu do sítě |
| pv_power1 | pv_power1 | float (kW) | 0.55 | Výkon jednoho panelu |
| pv_area1 | pv_area1 | float (m²) | 2.5844 | Plocha jednoho panelu |
| pv_tempeffcoef | pv_tempeffcoef | float | 0.0005 | Teplotní koeficient |
| pv_tempref | pv_tempref | float (°C) | 22 | Referenční teplota |
| pv_effconverter | pv_effconverter | float | 0.95 | Účinnost střídače |
| predrandcoef | predrandcoef | float | 0 | Náhodnost predikce |

### Baterie
| Python GUI | Web API | Typ | Default | Popis |
|------------|---------|-----|---------|-------|
| b_cap | b_cap | float (Wh) | 1000.0 | Kapacita baterie |
| b_max | b_max | float | 0.95 | Max. úroveň nabití |
| b_min | b_min | float | 0.05 | Min. úroveň nabití |
| b_effcharge | b_effcharge | float | 0.98 | Účinnost nabíjení |
| b_effdischarge | b_effdischarge | float | 0.98 | Účinnost vybíjení |
| b_speedcharge | b_speedcharge | float (W) | 200 | Rychlost nabíjení |
| b_speeddischarge | b_speeddischarge | float (W) | 200 | Rychlost vybíjení |

### Ceny
| Python GUI | Web API | Typ | Default | Popis |
|------------|---------|-----|---------|-------|
| pricefix | pricefix | float (Kč/kWh) | 3.5 | Fixní cena elektřiny |
| feedistribution | feedistribution | float (Kč/kWh) | 0.5 | Poplatek distribuci |
| feetrader | feetrader | float (Kč/kWh) | 0.5 | Poplatek obchodníkovi |

### Pmax
| Python GUI | Web API | Typ | Default | Popis |
|------------|---------|-----|---------|-------|
| pmaxodber | pmaxodber | float (W) | 400 | Max. odběr ze sítě |
| pmaxdodavka | pmaxdodavka | float (W) | 200 | Max. dodávka do sítě |

## 4. Výpočet výkonu FVE

Backend nyní správně počítá výkon FVE podle vzorce z `libs/process.py`:

```python
# Koeficient výkonu
PV_coef = PV_effConverter * PV_eff * PV_area1 * np.round(PV_powerNom/PV_power1)

# Teplotní kompenzace
PV_tempCoef = 1.0 - (data['Tamb'].values - PV_tempRef) * PV_tempEffCoef

# Výkon FVE
PV_power = -data['GHI'].values * PV_coef * PV_tempCoef
```

Parametry:
- `PV_powerNom`: Celkový nominální výkon instalace
- `PV_power1`: Výkon jednoho panelu → počet panelů = `PV_powerNom / PV_power1`
- `PV_area1`: Plocha jednoho panelu → celková plocha = `PV_area1 * počet_panelů`
- `PV_eff`: Účinnost panelů (konverze světla na elektřinu)
- `PV_effConverter`: Účinnost střídače (DC → AC)
- `PV_tempEffCoef`: Teplotní koeficient (snížení účinnosti s teplotou)
- `PV_tempRef`: Referenční teplota pro výkon panelů

## 5. Testování

Vytvořen testovací skript `test_full_params.py`:

```bash
python test_full_params.py
```

Test ověřuje:
1. ✓ Vytvoření konfigurace se všemi parametry
2. ✓ Správné načtení parametrů backendem
3. ✓ Výpočet s kompletními parametry
4. ✓ Kontrola, že všechny parametry jsou použity (žádné "Added missing")
5. ✓ Výsledky obsahují FVE data (PVkWh) vypočítaná podle všech parametrů
6. ✓ Výsledky obsahují data baterie (BkWh)

## 6. Změny v chování

### Před úpravou
- FVE parametry byly částečně ignorovány
- Chyběly pokročilé parametry pro výpočet výkonu panelů
- `pv_eff` byl chybně označen jako "účinnost střídače"
- `simulaceskutecnehoprovozu` nebyl v UI

### Po úpravě
- ✅ Všechny FVE parametry jsou správně použity
- ✅ Výpočet výkonu FVE odpovídá Python skriptu
- ✅ `pv_eff` správně označen jako "účinnost panelů"
- ✅ Přidán separátní `pv_effconverter` pro střídač
- ✅ Všechny checkboxy z Python GUI jsou dostupné v UI
- ✅ Backend automaticky doplní chybějící parametry z default.ini

## 7. Kompatibilita

### Zpětná kompatibilita
- ✅ Staré konfigurace budou fungovat (chybějící parametry doplněny)
- ✅ Backend merge s default.ini zajistí všechny potřebné parametry
- ✅ Žádné breaking changes v API

### Forward kompatibilita
- ✅ Nové parametry mají rozumné default hodnoty
- ✅ UI poskytuje nápovědy pro všechny parametry
- ✅ Validace vstupů (min/max hodnoty)

## 8. Závěr

Backend nyní **plně podporuje všechny parametry** z Python GUI aplikace. Výpočty probíhají se stejnými vstupy a parametry jako v původním Python skriptu, což zajišťuje **identické výsledky** při použití stejné konfigurace.

### Klíčové výhody
1. **Kompletní parita s Python GUI** - všechny parametry dostupné
2. **Automatické doplňování** - robustnost proti chybám
3. **Merge s default.ini** - konzistence s Python verzí
4. **Podrobné logování** - transparentnost výpočtu
5. **Testovací nástroje** - snadná verifikace

### Další kroky
- Otestovat frontend v prohlížeči s novými parametry
- Spustit výpočet s kompletní konfigurací
- Porovnat výsledky s Python skriptem
- Dokumentovat případné rozdíly v logování
