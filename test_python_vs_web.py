"""
Porovnání výsledků Python GUI vs Web API
Test s OD_2023_Alfa_estate.xlsx
"""

import sys
import json
import requests
import pandas as pd
from pathlib import Path
from datetime import datetime

# Přidat libs do cesty
sys.path.insert(0, str(Path(__file__).parent))

from libs.config import readConfig
from libs.process import calculate

# Mock objekty pro progress
class MockProgressBar:
    def __init__(self):
        self._value = 0
    
    def setValue(self, value):
        self._value = value
    
    def value(self):
        return self._value

class MockLabel:
    def __init__(self):
        self._text = ""
    
    def setText(self, text):
        self._text = text
    
    def setStyleSheet(self, style):
        pass

class MockConsole:
    def __init__(self):
        self.logs = []
    
    def insertPlainText(self, text):
        self.logs.append(text)
        print(text, end='')


def run_python_calculation():
    """Spustí výpočet v Python enginu (bez GUI)"""
    print("=" * 80)
    print("PYTHON VÝPOČET (backend engine)")
    print("=" * 80)
    print()
    
    # Načíst konfiguraci
    print("1. Načítání konfigurace...")
    settings_file = "user_settings/default.ini"
    
    try:
        conf = readConfig(settings_file)
        print(f"   ✓ Konfigurace načtena: {settings_file}")
    except Exception as e:
        print(f"   ✗ Chyba: {e}")
        return None
    
    # Mock objekty
    progress_bar = MockProgressBar()
    label = MockLabel()
    console = MockConsole()
    
    # Spustit výpočet
    print("\n2. Spouštím výpočet...")
    try:
        results = calculate(conf, progress_bar, label, console)
        print(f"   ✓ Výpočet dokončen")
        return results
    except Exception as e:
        print(f"   ✗ Chyba při výpočtu: {e}")
        import traceback
        traceback.print_exc()
        return None


def run_web_calculation():
    """Spustí výpočet přes Web API"""
    print("\n" + "=" * 80)
    print("WEB API VÝPOČET")
    print("=" * 80)
    print()
    
    base_url = "http://localhost:8000"
    
    # Test připojení
    print("1. Kontrola backendu...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code != 200:
            print(f"   ✗ Backend neodpovídá (status: {response.status_code})")
            return None
        print(f"   ✓ Backend běží")
    except Exception as e:
        print(f"   ✗ Nelze se připojit: {e}")
        return None
    
    # Přihlášení
    print("\n2. Přihlášení...")
    try:
        response = requests.post(
            f"{base_url}/api/v1/auth/login",
            data={"username": "admin", "password": "Admin123"}
        )
        response.raise_for_status()
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"   ✓ Přihlášení úspěšné")
    except Exception as e:
        print(f"   ✗ Chyba při přihlášení: {e}")
        return None
    
    # Najít consumption soubor
    print("\n3. Hledání souboru OD_2023_Alfa_estate.xlsx...")
    try:
        response = requests.get(
            f"{base_url}/api/v1/files?file_type=consumption",
            headers=headers
        )
        response.raise_for_status()
        files = response.json()["files"]
        
        # Najít správný soubor
        file_id = None
        for f in files:
            fname = f.get("original_filename", f.get("filename", ""))
            if "Alfa_estate" in fname or "OD_2023" in fname:
                file_id = f["id"]
                print(f"   ✓ Soubor nalezen: {fname}")
                break
        
        if not file_id:
            print(f"   ✗ Soubor nenalezen, použiji první dostupný")
            file_id = files[0]["id"]
            fname = files[0].get("original_filename", files[0].get("filename", "unknown"))
            print(f"   ℹ️  Použit: {fname}")
    except Exception as e:
        print(f"   ✗ Chyba: {e}")
        return None
    
    # Načíst konfiguraci
    print("\n4. Načítání konfigurace...")
    try:
        # Použít default konfiguraci nebo vytvořit novou
        settings_file = "user_settings/default.ini"
        conf = readConfig(settings_file)
        
        # Připravit config_data pro API
        config_data = {
            "Optimalizace": {
                "optimizationtype": int(conf['Optimalizace']['optimizationtype']),
                "optimization_horizon": int(conf['Optimalizace'].get('optimization_horizon', 24)),
                "time_resolution": int(conf['Optimalizace'].get('time_resolution', 1)),
                "vnutitrokspotreby": conf['Optimalizace'].get('vnutitrokspotreby'),
                "povolitdodavkydositezbaterie": conf['Optimalizace']['povolitdodavkydositezbaterie'],
                "povolitodberzesitedobaterie": conf['Optimalizace']['povolitodberzesitedobaterie'],
                "povolitprekrocenipmax": conf['Optimalizace']['povolitprekrocenipmax'],
                "vynulovatspotrebnidiagram": conf['Optimalizace']['vynulovatspotrebnidiagram'],
                "pouzitpredikcispotreby": conf['Optimalizace']['pouzitpredikcispotreby'],
                "pouzitfixnicenu": conf['Optimalizace']['pouzitfixnicenu'],
                "simulaceskutecnehoprovozu": conf['Optimalizace']['simulaceskutecnehoprovozu']
            },
            "Baterie": {
                "b_cap": float(conf['Baterie']['b_cap']),
                "b_effcharge": float(conf['Baterie']['b_effcharge']),
                "b_effdischarge": float(conf['Baterie']['b_effdischarge']),
                "b_max": float(conf['Baterie']['b_max']),
                "b_min": float(conf['Baterie']['b_min']),
                "b_speedcharge": float(conf['Baterie']['b_speedcharge']),
                "b_speeddischarge": float(conf['Baterie']['b_speeddischarge'])
            },
            "FVE": {
                "pv_powernom": float(conf['FVE']['pv_powernom']),
                "pv_eff": float(conf['FVE']['pv_eff']),
                "pmaxfve": float(conf['FVE']['pmaxfve']),
                "pv_power1": float(conf['FVE']['pv_power1']),
                "pv_area1": float(conf['FVE']['pv_area1']),
                "pv_tempeffcoef": float(conf['FVE']['pv_tempeffcoef']),
                "pv_tempref": float(conf['FVE']['pv_tempref']),
                "pv_effconverter": float(conf['FVE']['pv_effconverter']),
                "predrandcoef": float(conf['FVE']['predrandcoef'])
            },
            "Ceny": {
                "pricefix": float(conf['Ceny']['pricefix']),
                "feedistribution": float(conf['Ceny']['feedistribution']),
                "feetrader": float(conf['Ceny']['feetrader'])
            },
            "Pmax": {
                "pmaxodber": float(conf['Pmax']['pmaxodber']),
                "pmaxdodavka": float(conf['Pmax']['pmaxdodavka'])
            }
        }
        
        print(f"   ✓ Konfigurace načtena")
    except Exception as e:
        print(f"   ✗ Chyba: {e}")
        return None
    
    # Vytvořit kalkulaci
    print("\n5. Vytváření kalkulace...")
    try:
        calc_data = {
            "name": "Test Python vs Web - " + datetime.now().strftime("%H:%M:%S"),
            "description": "Porovnání výsledků Python GUI vs Web",
            "file_ids": [file_id],
            "input_params": config_data
        }
        
        response = requests.post(
            f"{base_url}/api/v1/calculations",
            headers=headers,
            json=calc_data
        )
        response.raise_for_status()
        calc_id = response.json()["id"]
        print(f"   ✓ Kalkulace vytvořena: {calc_id}")
    except Exception as e:
        print(f"   ✗ Chyba: {e}")
        return None
    
    # Čekat na dokončení
    print("\n6. Čekání na dokončení...")
    import time
    max_wait = 300
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        try:
            response = requests.get(
                f"{base_url}/api/v1/calculations/{calc_id}",
                headers=headers
            )
            response.raise_for_status()
            calc = response.json()
            status = calc["status"]
            
            if status == "completed":
                print(f"   ✓ Výpočet dokončen")
                return calc
            elif status == "failed":
                print(f"   ✗ Výpočet selhal")
                return None
            else:
                print(f"   ⏳ Status: {status}", end='\r')
                time.sleep(5)
        except Exception as e:
            print(f"   ✗ Chyba: {e}")
            return None
    
    print(f"   ✗ Timeout")
    return None


def compare_results(python_results, web_results):
    """Porovná výsledky z Python a Web"""
    print("\n" + "=" * 80)
    print("POROVNÁNÍ VÝSLEDKŮ")
    print("=" * 80)
    print()
    
    if not python_results or not web_results:
        print("❌ Nelze porovnat - chybí výsledky")
        return
    
    # Python výsledky
    python_data = python_results.get('data')
    if python_data is None:
        print("❌ Python výsledky neobsahují data")
        return
    
    # Web výsledky - parsovat pokud je string
    web_result_data = web_results.get('results')
    if isinstance(web_result_data, str):
        web_result_data = json.loads(web_result_data)
    
    print("📊 PYTHON VÝSLEDKY:")
    print(f"   Typ dat: {type(python_data)}")
    if hasattr(python_data, '__len__'):
        print(f"   Počet záznamů: {len(python_data)}")
    
    # Základní statistiky z Python
    if hasattr(python_data, 'to_dict'):
        # Je to DataFrame
        df = python_data
        print(f"   Sloupce: {list(df.columns)}")
        print(f"\n   Statistiky:")
        if 'kWh' in df.columns:
            total_cons = df['kWh'].sum()
            print(f"   - Celková spotřeba: {total_cons:.2f} kWh")
        if 'PVkWh' in df.columns:
            total_prod = df['PVkWh'].sum()
            print(f"   - Celková výroba FVE: {total_prod:.2f} kWh")
        if 'BkWh' in df.columns:
            battery_data = df['BkWh'].dropna()
            if len(battery_data) > 0:
                total_batt = battery_data.sum()
                print(f"   - Celková energie baterie: {total_batt:.2f} kWh")
                print(f"   - Baterie datové body: {len(battery_data)}")
    
    print(f"\n📊 WEB VÝSLEDKY:")
    print(f"   Typ dat: {type(web_result_data)}")
    if isinstance(web_result_data, dict):
        print(f"   Klíče: {list(web_result_data.keys())}")
        print(f"\n   Statistiky:")
        if 'battCycles' in web_result_data:
            print(f"   - Cykly baterie: {web_result_data['battCycles']:.2f}")
        if 'battCyclesYear' in web_result_data:
            print(f"   - Cykly baterie/rok: {web_result_data['battCyclesYear']:.2f}")
        if 'dataCount' in web_result_data:
            print(f"   - Počet datových bodů: {web_result_data['dataCount']}")
        if 'dataRedCount' in web_result_data:
            print(f"   - Redukovaných bodů: {web_result_data['dataRedCount']}")
    
    # Porovnat základní metriky
    print(f"\n{'='*80}")
    print("SROVNÁNÍ KLÍČOVÝCH METRIK:")
    print(f"{'='*80}")
    
    # Batterie cykly
    if hasattr(python_data, 'to_dict') and 'battCycles' in python_results:
        python_cycles = python_results['battCycles']
        web_cycles = web_result_data.get('battCycles', 0)
        diff = abs(python_cycles - web_cycles)
        match = "✓" if diff < 0.01 else "✗"
        print(f"\n{match} Cykly baterie:")
        print(f"   Python: {python_cycles:.4f}")
        print(f"   Web:    {web_cycles:.4f}")
        print(f"   Rozdíl: {diff:.4f}")
    
    # Batterie cykly za rok
    if 'battCyclesYear' in python_results and 'battCyclesYear' in web_result_data:
        python_cycles_year = python_results['battCyclesYear']
        web_cycles_year = web_result_data['battCyclesYear']
        diff = abs(python_cycles_year - web_cycles_year)
        match = "✓" if diff < 0.01 else "✗"
        print(f"\n{match} Cykly baterie/rok:")
        print(f"   Python: {python_cycles_year:.4f}")
        print(f"   Web:    {web_cycles_year:.4f}")
        print(f"   Rozdíl: {diff:.4f}")
    
    # Počet dat
    if hasattr(python_data, '__len__') and 'dataCount' in web_result_data:
        python_count = len(python_data)
        web_count = web_result_data['dataCount']
        match = "✓" if python_count == web_count else "✗"
        print(f"\n{match} Počet datových bodů:")
        print(f"   Python: {python_count}")
        print(f"   Web:    {web_count}")
    
    print(f"\n{'='*80}")
    
    # Závěr
    print("\n🎯 ZÁVĚR:")
    if 'battCycles' in python_results and 'battCycles' in web_result_data:
        diff = abs(python_results['battCycles'] - web_result_data['battCycles'])
        if diff < 0.01:
            print("✅ Výsledky jsou IDENTICKÉ - backend počítá správně!")
        else:
            print(f"⚠️  Výsledky se LIŠÍ o {diff:.4f} cyklů baterie")
    else:
        print("ℹ️  Nelze plně porovnat - některé metriky chybí")


def main():
    print("=" * 80)
    print("TEST: Python GUI vs Web API")
    print("Soubor: OD_2023_Alfa_estate.xlsx")
    print("=" * 80)
    print()
    
    # 1. Spustit Python výpočet
    python_results = run_python_calculation()
    
    # 2. Spustit Web výpočet
    web_results = run_web_calculation()
    
    # 3. Porovnat
    compare_results(python_results, web_results)
    
    # Uložit výsledky
    output = {
        "timestamp": datetime.now().isoformat(),
        "python_results_available": python_results is not None,
        "web_results_available": web_results is not None,
        "python_summary": {
            "battCycles": python_results.get('battCycles') if python_results else None,
            "battCyclesYear": python_results.get('battCyclesYear') if python_results else None,
            "dataCount": len(python_results.get('data', [])) if python_results and python_results.get('data') is not None else 0
        } if python_results else None,
        "web_summary": {
            "calculation_id": web_results.get('id') if web_results else None,
            "status": web_results.get('status') if web_results else None,
            "results": web_results.get('results') if web_results else None
        } if web_results else None
    }
    
    output_file = Path("comparison_python_vs_web.json")
    with output_file.open('w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Výsledky uloženy do: {output_file}")


if __name__ == "__main__":
    main()
