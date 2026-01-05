"""
Test kalkulace se souborem OD_2023_Alfa_estate.xlsx
Pro porovnání s Python GUI výsledky
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
from libs import load, process, config as cfg

print("=" * 80)
print("TEST KALKULACE - OD_2023_Alfa_estate.xlsx")
print("=" * 80)
print()

# 1. Načíst soubor
print("1. NAČÍTÁNÍ DAT")
print("-" * 80)

data_path = 'data_input/'
ready_path = 'data_ready/'

# Načíst OD_2023_Alfa_estate.xlsx
files = ['OD_2023_Alfa_estate.xlsx']
print(f"Načítám soubory: {files}")

load.loadData(files, data_path, ready_path)

# Zkontrolovat načtená data
df = pd.read_pickle(ready_path + '_intersected.pkl')
print(f"\nNačteno: {len(df)} řádků")

if 'Den' in df.columns:
    days = df['Den'].values
    t0 = days[0].astype('datetime64[s]').item().strftime('%d.%m.%Y')
    t1 = days[-1].astype('datetime64[s]').item().strftime('%d.%m.%Y')
    unique_days = len(pd.unique(days))
    print(f"Období: {t0} až {t1}")
    print(f"Počet dní: {unique_days}")

print()

# 2. Načíst konfiguraci
print("2. KONFIGURACE")
print("-" * 80)

# Načíst výchozí konfiguraci
settings_file = 'user_settings/default.ini'
config_dict = cfg.readConfig(settings_file)

# Výpis klíčových parametrů
print(f"Baterie kapacita: {config_dict['Baterie']['b_cap']} kWh")
print(f"FVE výkon: {config_dict['FVE']['pv_powernom']} kWp")
print(f"Cena elektřiny: {config_dict['Ceny']['pricefix']} Kč/kWh")
print(f"Typ optimalizace: {config_dict['Optimalizace']['optimizationtype']}")

print()

# 3. Spustit výpočet
print("3. SPUŠTĚNÍ VÝPOČTU")
print("-" * 80)

try:
    results = process.calculate(config_dict, None, None, None)
    
    if results:
        print("\n✅ Výpočet dokončen úspěšně!")
        print()
        
        # Zobrazit klíčové výsledky
        print("=" * 80)
        print("VÝSLEDKY")
        print("=" * 80)
        
        if 'dataCount' in results:
            print(f"\nPočet datových bodů: {results['dataCount']}")
        
        if 'battCycles' in results:
            print(f"Cykly baterie: {results['battCycles']:.2f}")
            print(f"Cykly baterie/rok: {results['battCyclesYear']:.2f}")
        
        # Nákladová tabulka
        if 'costsTable' in results:
            print("\n" + "-" * 80)
            print("NÁKLADOVÁ TABULKA:")
            print("-" * 80)
            costs_table = results['costsTable']
            print(f"{'Scénář':<30} {'Náklady (tis. Kč)':>18} {'Rozdíl (tis. Kč)':>18} {'Rozdíl (%)':>12}")
            print("-" * 80)
            for row in costs_table:
                print(f"{row['scenario']:<30} {row['cost']:>18.3f} {row['difference']:>18.3f} {row['differencePercent']:>11.2f}%")
        
        # Bilance energie
        if 'energyBalance' in results:
            print("\n" + "-" * 80)
            print("BILANCE ENERGIE:")
            print("-" * 80)
            energy_balance = results['energyBalance']
            print(f"{'Scénář':<30} {'Suma odběr (MWh)':>18} {'Suma dodávka (MWh)':>20} {'Suma celkem (MWh)':>18}")
            print("-" * 80)
            for row in energy_balance:
                print(f"{row['scenario']:<30} {row['sumOdber']:>18.3f} {row['sumDodavka']:>20.3f} {row['sumTotal']:>18.3f}")
        
        print()
        print("=" * 80)
        print("POROVNÁNÍ S PYTHON GUI (177 dní, 31-12-2023 až 25-06-2024):")
        print("=" * 80)
        print()
        print("Python GUI výsledky:")
        print("  Pouze spotřeba: 18816.614 tis. Kč")
        print("  Spotřeba a FVE: 16606.422 tis. Kč")
        print("  Spotřeba a baterie: 18686.341 tis. Kč")
        print("  Spotřeba, FVE, bat: 16471.247 tis. Kč")
        print("  Cykly baterie: 53.52")
        print()
        
        if 'costsTable' in results and len(results['costsTable']) >= 4:
            print("Tento výpočet (celý rok 2023):")
            for row in results['costsTable']:
                print(f"  {row['scenario']}: {row['cost']:.3f} tis. Kč")
            if 'battCycles' in results:
                print(f"  Cykly baterie: {results['battCycles']:.2f}")
            
            print()
            print("POZNÁMKA:")
            print("Python GUI používá pouze 177 dní (polovina roku), tento výpočet celý rok.")
            print("Pro porovnání je třeba přepočítat na stejné období nebo použít stejná data.")
        
    else:
        print("\n❌ Výpočet vrátil prázdné výsledky")
    
except Exception as e:
    print(f"\n❌ Chyba při výpočtu: {e}")
    import traceback
    traceback.print_exc()

print()
