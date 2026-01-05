"""
Diagnostika počtu dat v kalkulaci
Kontrola, zda backend zpracovává všechna data nebo jen část
"""
import sys
import os

# Přidat libs do cesty
root_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.join(root_dir, '..'))

import pandas as pd
import numpy as np
from libs import funsData

# Kontrola vstupních dat
print("=" * 80)
print("DIAGNOSTIKA ZPRACOVÁNÍ DAT")
print("=" * 80)
print()

# 1. Zkontrolovat vstupní soubor
data_path = "data_input/"
ready_path = "data_ready/"

print("1. KONTROLA VSTUPNÍCH SOUBORŮ")
print("-" * 80)

try:
    files = [f for f in os.listdir(data_path) if f.endswith(('.xls', '.xlsx')) and f.lower().startswith('od_')]
    print(f"Nalezené soubory v {data_path}:")
    for f in files:
        file_path = os.path.join(data_path, f)
        # Načíst Excel a spočítat řádky
        df = pd.read_excel(file_path)
        print(f"  - {f}: {len(df)} řádků")
except Exception as e:
    print(f"Chyba při čtení souborů: {e}")

print()

# 2. Zkontrolovat zpracovaná data (pickle soubory)
print("2. KONTROLA ZPRACOVANÝCH DAT")
print("-" * 80)

pickle_files = ['consumption.pkl', 'prices.pkl', 'weather.pkl', '_intersected.pkl']
for pkl in pickle_files:
    pkl_path = os.path.join(ready_path, pkl)
    if os.path.exists(pkl_path):
        try:
            df = pd.read_pickle(pkl_path)
            print(f"{pkl}: {len(df)} řádků")
            if 'Den' in df.columns:
                days = df['Den'].values
                if len(days) > 0:
                    t0 = days[0].astype('datetime64[s]').item().strftime('%d.%m.%Y')
                    t1 = days[-1].astype('datetime64[s]').item().strftime('%d.%m.%Y')
                    print(f"  Období: {t0} až {t1}")
                    
                    # Počet unikátních dní
                    unique_days = np.unique(days)
                    print(f"  Počet unikátních dní: {len(unique_days)}")
                    print(f"  Průměrně hodin/den: {len(df) / len(unique_days):.1f}")
        except Exception as e:
            print(f"{pkl}: Chyba při čtení - {e}")
    else:
        print(f"{pkl}: NEEXISTUJE")

print()

# 3. Zkontrolovat info soubory
print("3. KONTROLA INFO SOUBORŮ")
print("-" * 80)

info_files = ['info_files.txt', 'info_intersection.txt']
for info in info_files:
    info_path = os.path.join(ready_path, info)
    if os.path.exists(info_path):
        with open(info_path, 'r', encoding='utf8') as f:
            content = f.read()
            print(f"{info}:")
            print(f"  {content}")
    else:
        print(f"{info}: NEEXISTUJE")

print()

# 4. Simulovat funkci intersect s různými parametry
print("4. SIMULACE FUNKCE INTERSECT")
print("-" * 80)

if os.path.exists(os.path.join(ready_path, 'consumption.pkl')):
    try:
        print("Test A: remove_incomplete_days=True (výchozí)")
        merged_a = funsData.intersect(ready_path, remove_incomplete_days=True, save=False)
        print(f"  Výsledek: {len(merged_a)} řádků")
        if 'Den' in merged_a.columns:
            unique_days_a = np.unique(merged_a['Den'].values)
            print(f"  Počet dní: {len(unique_days_a)}")
        
        print()
        print("Test B: remove_incomplete_days=False")
        merged_b = funsData.intersect(ready_path, remove_incomplete_days=False, save=False)
        print(f"  Výsledek: {len(merged_b)} řádků")
        if 'Den' in merged_b.columns:
            unique_days_b = np.unique(merged_b['Den'].values)
            print(f"  Počet dní: {len(unique_days_b)}")
        
        print()
        print(f"ROZDÍL: {len(merged_b) - len(merged_a)} řádků ({len(unique_days_b) - len(unique_days_a)} dní)")
        print()
        
        # Najít neúplné dny
        if len(merged_b) > len(merged_a):
            print("Neúplné dny (odstraněné při remove_incomplete_days=True):")
            all_days_b = merged_b['Den'].values
            day_counts_b = pd.Series(all_days_b).value_counts()
            incomplete = day_counts_b[day_counts_b != 24]
            print(f"  Celkem neúplných dní: {len(incomplete)}")
            if len(incomplete) > 0:
                print("  První neúplné dny:")
                for day, count in list(incomplete.items())[:10]:
                    print(f"    {day}: {count} hodin")
    
    except Exception as e:
        print(f"Chyba při simulaci: {e}")
        import traceback
        traceback.print_exc()

print()
print("=" * 80)
print("ZÁVĚRY:")
print("=" * 80)
print()
print("1. Zkontrolujte počet řádků ve vstupním Excel souboru")
print("2. Porovnejte s počtem řádků v _intersected.pkl")
print("3. Pokud je velký rozdíl, může být problém v:")
print("   - remove_incomplete_days (odstraňuje neúplné dny)")
print("   - průniku s cenami/počasím (může omezit období)")
print("   - filtrování podle roku (consumption_year parametr)")
print()
