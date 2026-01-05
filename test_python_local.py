"""
Spustí Python výpočet lokálně pomocí libs/process.py a exportuje výsledky
"""
import sys
import json
from pathlib import Path

# Přidat projekt do path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Import libs modulů
from libs.config import readConfig
from libs.load import loadData
from libs.process import calculate

def main():
    print("=" * 80)
    print("PYTHON LOKÁLNÍ VÝPOČET")
    print("=" * 80)
    print()
    
    # Načíst konfiguraci
    print("1. Načítání konfigurace default.ini...")
    config_path = project_root / "user_settings" / "default.ini"
    conf = readConfig(str(config_path))
    print(f"   ✓ Konfigurace načtena")
    
    # Upravit konfiguraci pro stejné parametry jako v API testu
    print("2. Úprava konfigurace pro shodu s API testem...")
    conf['Baterie']['b_cap'] = 15000.0
    conf['Baterie']['b_speedcharge'] = 5000.0
    conf['Baterie']['b_speeddischarge'] = 5000.0
    conf['Baterie']['b_effcharge'] = 0.95
    conf['Baterie']['b_effdischarge'] = 0.95
    
    conf['FVE']['pv_powernom'] = 10000.0
    conf['FVE']['pv_eff'] = 0.97
    
    conf['Ceny']['pricefix'] = 4.5
    conf['Ceny']['feedistribution'] = 1.5
    
    conf['Pmax']['pmaxodber'] = 6000.0
    
    conf['Optimalizace']['optimizationtype'] = 0
    conf['Optimalizace']['optimization_horizon'] = 24
    conf['Optimalizace']['time_resolution'] = 1
    
    print(f"   ✓ Konfigurace upravena")
    print(f"      Baterie: {conf['Baterie']['b_cap']}Wh, {conf['Baterie']['b_speedcharge']}W")
    print(f"      FVE: {conf['FVE']['pv_powernom']}W")
    print(f"      Pmax odběr: {conf['Pmax']['pmaxodber']}W")
    
    # Načíst data
    print("3. Načítání souboru OD_2023_Alfa_estate.xlsx...")
    data_file = project_root / "data_input" / "OD_2023_Alfa_estate.xlsx"
    
    if not data_file.exists():
        print(f"   ✗ Soubor nenalezen: {data_file}")
        return
    
    # loadData načítá z konfigurace - používá Obecne sekci
    # Tam jsou cesty jako: slozka_zpracovane = data_ready/
    # a soubory definované jako [Obecne] s názvem souboru
    # Musíme vytvořit dočasnou konfiguraci s přímo načtenými daty
    
    from libs.funsData import readExcel
    print(f"   📂 Načítám: {data_file}")
    data = readExcel(str(data_file))
    
    if data is None or len(data) == 0:
        print(f"   ✗ Chyba při načítání dat")
        return
    
    print(f"   ✓ Data načtena: {len(data)} řádků")
    
    # Spustit výpočet
    print("4. Spouštím výpočet...")
    print("   (Toto může trvat několik minut...)")
    
    try:
        # Mock UI komponenty
        class MockProgressBar:
            def setValue(self, value):
                if value % 10 == 0:  # Print každých 10%
                    print(f"   ⏳ Progress: {value}%")
            def value(self):
                return 0
        
        class MockLabel:
            def setText(self, text):
                pass
            def setStyleSheet(self, style):
                pass
        
        class MockConsole:
            def insertPlainText(self, text):
                pass
        
        progress_bar = MockProgressBar()
        label = MockLabel()
        console = MockConsole()
        
        results = calculate(conf, progress_bar, label, console)
        
        if not results:
            print(f"   ✗ Výpočet vrátil prázdné výsledky")
            return
        
        print(f"   ✓ Výpočet dokončen!")
        
    except Exception as e:
        print(f"   ✗ Chyba při výpočtu: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Zpracovat výsledky
    print()
    print("=" * 80)
    print("VÝSLEDKY Z PYTHON SKRIPTU:")
    print("=" * 80)
    
    data_red = results.get('dataRed')
    if data_red is None or len(data_red) == 0:
        print("   ⚠️  Žádná dataRed")
    else:
        print(f"\n📊 GRAFOVÁ DATA:")
        print(f"   Počet datových bodů: {len(data_red)}")
        
        # Agregované statistiky
        print(f"\n📈 AGREGOVANÉ STATISTIKY:")
        print("-" * 80)
        
        import pandas as pd
        df = pd.DataFrame(data_red)
        
        # Energie
        total_consumption = df['kWh'].sum() if 'kWh' in df.columns else 0
        total_production = df['PVkWh'].sum() if 'PVkWh' in df.columns else 0
        print(f"Celková spotřeba:        {total_consumption:>12.2f} kWh")
        print(f"Celková výroba (FVE):    {total_production:>12.2f} kWh")
        
        # Baterie
        if 'BkWh' in df.columns:
            battery_charge = df[df['BkWh'] > 0]['BkWh'].sum()
            battery_discharge = df[df['BkWh'] < 0]['BkWh'].abs().sum()
            print(f"Nabíjení baterie:        {battery_charge:>12.2f} kWh")
            print(f"Vybíjení baterie:        {battery_discharge:>12.2f} kWh")
        
        # Síť
        if 'Grid (kWh)' in df.columns:
            grid_import = df[df['Grid (kWh)'] > 0]['Grid (kWh)'].sum()
            grid_export = df[df['Grid (kWh)'] < 0]['Grid (kWh)'].abs().sum()
            print(f"Odběr ze sítě:           {grid_import:>12.2f} kWh")
            print(f"Dodávka do sítě:         {grid_export:>12.2f} kWh")
        
        # Náklady
        if 'Cost (Kč)' in df.columns:
            total_cost = df['Cost (Kč)'].sum()
            print(f"\n💰 CELKOVÉ NÁKLADY:      {total_cost:>12.2f} Kč")
        
        # První řádky
        print(f"\n📝 PRVNÍ 10 ŘÁDKŮ DAT:")
        print("-" * 80)
        print(df.head(10).to_string())
    
    # Tabulkové výsledky
    if results.get('dfCostForm') is not None:
        print(f"\n💵 NÁKLADOVÁ TABULKA:")
        print("-" * 80)
        print(results['dfCostForm'].to_string())
    
    if results.get('dfEnergyForm') is not None:
        print(f"\n⚡ ENERGETICKÁ BILANCE:")
        print("-" * 80)
        print(results['dfEnergyForm'].to_string())
    
    # Export
    print(f"\n📁 EXPORT PRO POROVNÁNÍ:")
    print("-" * 80)
    
    comparison_data = {
        "source": "python_local",
        "file": "OD_2023_Alfa_estate.xlsx",
        "config": "default.ini (modified)",
        "data_points": len(data_red) if data_red else 0,
        "energy_balance": {
            "total_consumption_kwh": float(total_consumption),
            "total_production_kwh": float(total_production),
            "battery_charge_kwh": float(battery_charge) if 'BkWh' in df.columns else 0,
            "battery_discharge_kwh": float(battery_discharge) if 'BkWh' in df.columns else 0,
            "grid_import_kwh": float(grid_import) if 'Grid (kWh)' in df.columns else 0,
            "grid_export_kwh": float(grid_export) if 'Grid (kWh)' in df.columns else 0,
        },
        "financial": {
            "total_cost_czk": float(total_cost) if 'Cost (Kč)' in df.columns else 0
        },
        "first_10_rows": df.head(10).to_dict(orient='records') if data_red else []
    }
    
    output_file = "test_python_results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(comparison_data, f, indent=2, ensure_ascii=False)
    
    print(f"   ✓ Výsledky exportovány do: {output_file}")
    
    print("\n" + "=" * 80)
    print("✓ Test dokončen!")
    print("=" * 80)
    print("""
POROVNÁNÍ:
- test_python_results.json  - výsledky z Python skriptu
- test_web_results.json      - výsledky z Web API

Můžete porovnat oba soubory pro verifikaci konzistence výsledků.
    """)

if __name__ == "__main__":
    main()
