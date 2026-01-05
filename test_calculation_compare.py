"""
Test pro porovnání výsledků Python výpočtu s webovou aplikací
"""
import sys
import json
import pandas as pd
from pathlib import Path

# Přidat libs do cesty
sys.path.insert(0, str(Path(__file__).parent))

from libs.config import readConfig
from libs.process import calculate

def main():
    print("=" * 80)
    print("TEST POROVNÁNÍ: Python skript vs Webová aplikace")
    print("=" * 80)
    print()
    
    # Načtení konfigurace
    print("1. Načítání konfigurace...")
    settings_file = "user_settings/default.ini"
    
    try:
        conf = readConfig(settings_file)
        print(f"   ✓ Konfigurace načtena: {settings_file}")
    except Exception as e:
        print(f"   ✗ Chyba při načítání konfigurace: {e}")
        return
    
    # Spuštění výpočtu (calculate načte data i provede výpočet)
    print("2. Spouštím výpočet (včetně načtení dat)...")
    try:
        results = calculate(conf, None, None, None)
        print(f"   ✓ Výpočet dokončen")
        
        if not results or not results[0]:
            print(f"   ✗ Výpočet nevrátil žádné výsledky")
            return
            
        dataRed = results[0]  # První prvek je dataRed
        print(f"   ✓ Výsledných řádků: {len(dataRed['t0']) if 't0' in dataRed else len(dataRed)}")
    except Exception as e:
        print(f"   ✗ Chyba při výpočtu: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Výpis klíčových výsledků
    print()
    print("=" * 80)
    print("VÝSLEDKY Z PYTHON SKRIPTU:")
    print("=" * 80)
    
    # Základní statistiky
    print("\n📊 ENERGETICKÁ BILANCE:")
    print("-" * 80)
    
    # Spotřeba
    total_consumption = dataRed['kWh'].sum()
    print(f"Celková spotřeba:        {total_consumption:>12.2f} kWh")
    
    # Výroba z FVE
    total_production = dataRed['PVkWh'].sum()
    print(f"Celková výroba (FVE):    {total_production:>12.2f} kWh")
    
    # Baterie
    if 'BkWh' in dataRed:
        battery_charge = dataRed['BkWh'][dataRed['BkWh'] > 0].sum()
        battery_discharge = abs(dataRed['BkWh'][dataRed['BkWh'] < 0].sum())
        print(f"Nabíjení baterie:        {battery_charge:>12.2f} kWh")
        print(f"Vybíjení baterie:        {battery_discharge:>12.2f} kWh")
    
    # Síť
    if 'Grid (kWh)' in dataRed:
        grid_import = dataRed['Grid (kWh)'][dataRed['Grid (kWh)'] > 0].sum()
        grid_export = abs(dataRed['Grid (kWh)'][dataRed['Grid (kWh)'] < 0].sum())
        print(f"Odběr ze sítě:           {grid_import:>12.2f} kWh")
        print(f"Dodávka do sítě:         {grid_export:>12.2f} kWh")
    
    # Finanční výsledky
    print("\n💰 FINANČNÍ BILANCE:")
    print("-" * 80)
    
    if 'Cost (Kč)' in dataRed:
        total_cost = dataRed['Cost (Kč)'].sum()
        print(f"Celkové náklady:         {total_cost:>12.2f} Kč")
    
    # Ceny
    if 'Kč/kWh' in dataRed:
        avg_price = dataRed['Kč/kWh'].mean()
        min_price = dataRed['Kč/kWh'].min()
        max_price = dataRed['Kč/kWh'].max()
        print(f"Průměrná cena:           {avg_price:>12.2f} Kč/kWh")
        print(f"Minimální cena:          {min_price:>12.2f} Kč/kWh")
        print(f"Maximální cena:          {max_price:>12.2f} Kč/kWh")
    
    # Výkon
    print("\n⚡ VÝKONOVÉ ÚDAJE:")
    print("-" * 80)
    
    if 'P (kW)' in dataRed:
        avg_power = dataRed['P (kW)'].mean()
        max_power = dataRed['P (kW)'].max()
        print(f"Průměrný příkon:         {avg_power:>12.2f} kW")
        print(f"Maximální příkon:        {max_power:>12.2f} kW")
    
    if 'PV (kW)' in dataRed:
        avg_pv_power = dataRed['PV (kW)'].mean()
        max_pv_power = dataRed['PV (kW)'].max()
        print(f"Průměrný výkon FVE:      {avg_pv_power:>12.2f} kW")
        print(f"Maximální výkon FVE:     {max_pv_power:>12.2f} kW")
    
    # Baterie SOC
    if 'SOC (%)' in dataRed:
        avg_soc = dataRed['SOC (%)'].mean()
        min_soc = dataRed['SOC (%)'].min()
        max_soc = dataRed['SOC (%)'].max()
        print(f"Průměrné SOC:            {avg_soc:>12.2f} %")
        print(f"Minimální SOC:           {min_soc:>12.2f} %")
        print(f"Maximální SOC:           {max_soc:>12.2f} %")
    
    # Export do JSON pro snadné porovnání
    print("\n📝 EXPORT PRO POROVNÁNÍ:")
    print("-" * 80)
    
    comparison_data = {
        "energy_balance": {
            "total_consumption_kwh": float(total_consumption),
            "total_production_kwh": float(total_production),
        },
        "sample_data_points": {
            "first_10_rows": {
                "Den": dataRed['Den'].head(10).tolist(),
                "kWh": dataRed['kWh'].head(10).tolist(),
                "PVkWh": dataRed['PVkWh'].head(10).tolist(),
            }
        }
    }
    
    if 'BkWh' in dataRed:
        comparison_data["energy_balance"]["battery_charge_kwh"] = float(battery_charge)
        comparison_data["energy_balance"]["battery_discharge_kwh"] = float(battery_discharge)
        comparison_data["sample_data_points"]["first_10_rows"]["BkWh"] = dataRed['BkWh'].head(10).tolist()
    
    if 'Grid (kWh)' in dataRed:
        comparison_data["energy_balance"]["grid_import_kwh"] = float(grid_import)
        comparison_data["energy_balance"]["grid_export_kwh"] = float(grid_export)
    
    if 'Cost (Kč)' in dataRed:
        comparison_data["financial"] = {
            "total_cost_czk": float(total_cost)
        }
    
    output_file = "test_python_results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(comparison_data, f, indent=2, ensure_ascii=False)
    
    print(f"   ✓ Výsledky exportovány do: {output_file}")
    
    print("\n" + "=" * 80)
    print("INSTRUKCE PRO POROVNÁNÍ S WEBEM:")
    print("=" * 80)
    print("""
1. Nahrajte soubor 'OD_2023_Alfa_estate.xlsx' přes webové rozhraní
2. Použijte konfiguraci 'default.ini'
3. Spusťte výpočet
4. Porovnejte následující hodnoty:

   a) Celková spotřeba (kWh)
   b) Celková výroba (kWh)
   c) Baterie - nabíjení/vybíjení
   d) Odběr ze sítě / dodávka do sítě
   e) Celkové náklady
   
5. Porovnejte první 10 řádků grafových dat:
   - Datum (Den)
   - Spotřeba (kWh)
   - Výroba (PVkWh)
   - Baterie (BkWh)
    """)
    
    print("\n✓ Test dokončen!")
    print("=" * 80)

if __name__ == "__main__":
    main()
