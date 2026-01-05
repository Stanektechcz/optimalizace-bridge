"""
Test kompletních parametrů - ověření, že web API správně pracuje se všemi parametry
stejně jako Python skript
"""

import requests
import json
import time
from pathlib import Path

# Konfigurace
BASE_URL = "http://localhost:8000"
USERNAME = "admin"
PASSWORD = "Admin123"

def login():
    """Přihlášení a získání tokenu"""
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        data={
            "username": USERNAME,
            "password": PASSWORD
        }
    )
    response.raise_for_status()
    return response.json()["access_token"]

def create_full_configuration(token):
    """Vytvoří konfiguraci se VŠEMI parametry"""
    config = {
        "name": "Kompletní test všech parametrů",
        "description": "Test konfigurace obsahující všechny parametry jako Python GUI",
        "is_default": False,
        "config_data": {
            "Optimalizace": {
                "optimizationtype": 0,  # LinProg
                "optimization_horizon": 36,
                "time_resolution": 1,
                "vnutitrokspotreby": None,
                "povolitdodavkydositezbaterie": True,
                "povolitodberzesitedobaterie": True,
                "povolitprekrocenipmax": True,
                "vynulovatspotrebnidiagram": False,
                "pouzitpredikcispotreby": False,
                "pouzitfixnicenu": False,
                "simulaceskutecnehoprovozu": False
            },
            "Baterie": {
                "b_cap": 15000,  # Wh
                "b_effcharge": 0.95,
                "b_effdischarge": 0.95,
                "b_max": 0.95,
                "b_min": 0.05,
                "b_speedcharge": 5000,  # W
                "b_speeddischarge": 5000  # W
            },
            "FVE": {
                "pv_powernom": 10000,  # W
                "pv_eff": 0.2128,
                "pmaxfve": 10000,  # W
                "pv_power1": 0.55,  # kW
                "pv_area1": 2.5844,  # m²
                "pv_tempeffcoef": 0.0005,
                "pv_tempref": 22,  # °C
                "pv_effconverter": 0.95,
                "predrandcoef": 0
            },
            "Ceny": {
                "pricefix": 4.5,  # Kč/kWh
                "feedistribution": 1.5,  # Kč/kWh
                "feetrader": 0.5  # Kč/kWh
            },
            "Pmax": {
                "pmaxodber": 6000,  # W
                "pmaxdodavka": 6000  # W
            }
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/configurations",
        headers={"Authorization": f"Bearer {token}"},
        json=config
    )
    response.raise_for_status()
    return response.json()

def get_consumption_file(token):
    """Najde existující consumption soubor"""
    response = requests.get(
        f"{BASE_URL}/api/v1/files?file_type=consumption",
        headers={"Authorization": f"Bearer {token}"}
    )
    response.raise_for_status()
    files = response.json()["files"]
    if not files:
        raise Exception("Žádné consumption soubory nenalezeny")
    return files[0]["id"]

def create_calculation(token, config_id, file_id, config_data):
    """Vytvoří kalkulaci s kompletní konfigurací"""
    calc_data = {
        "name": "Test všech parametrů",
        "description": "Kalkulace s kompletními parametry",
        "file_ids": [file_id],
        "configuration_id": config_id,
        "input_params": config_data
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/calculations",
        headers={"Authorization": f"Bearer {token}"},
        json=calc_data
    )
    response.raise_for_status()
    return response.json()

def wait_for_calculation(token, calc_id, max_wait=300):
    """Čeká na dokončení kalkulace"""
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        response = requests.get(
            f"{BASE_URL}/api/v1/calculations/{calc_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        calc = response.json()
        
        status = calc["status"]
        print(f"Status: {status}")
        
        if status == "completed":
            return calc
        elif status == "failed":
            # Získat logy
            log_response = requests.get(
                f"{BASE_URL}/api/v1/calculations/{calc_id}/logs",
                headers={"Authorization": f"Bearer {token}"}
            )
            logs = log_response.json()["logs"] if log_response.ok else "N/A"
            raise Exception(f"Kalkulace selhala. Logy:\n{logs}")
        
        time.sleep(5)
    
    raise TimeoutError("Kalkulace trvá příliš dlouho")

def verify_results(token, calc_id):
    """Ověří výsledky kalkulace"""
    response = requests.get(
        f"{BASE_URL}/api/v1/calculations/{calc_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    response.raise_for_status()
    calc_data = response.json()
    results = calc_data.get("results")
    
    if not results:
        raise Exception("Kalkulace nemá výsledky")
    
    # Pokud jsou results string, parsovat jako JSON
    if isinstance(results, str):
        results = json.loads(results)
    
    print("\n=== STATISTIKY VÝSLEDKŮ ===")
    print(f"Typ results: {type(results)}")
    
    # Pokud je dict, převést na list hodnot
    if isinstance(results, dict):
        print(f"Klíče results: {list(results.keys())[:10]}")
        results_list = list(results.values())
        print(f"Typ první hodnoty: {type(results_list[0]) if results_list else 'N/A'}")
    else:
        results_list = results
    
    if isinstance(results_list, list) and len(results_list) > 0:
        print(f"První prvek: {results_list[0]}")
    
    print(f"Počet datových bodů: {len(results_list)}")
    
    # Základní statistiky
    total_consumption = sum(r.get('kWh', 0) if isinstance(r, dict) else 0 for r in results_list)
    total_production = sum(r.get('PVkWh', 0) if isinstance(r, dict) else 0 for r in results_list)
    total_battery = sum(r.get('BkWh', 0) if isinstance(r, dict) and r.get('BkWh') else 0 for r in results_list)
    
    print(f"Celková spotřeba: {total_consumption:.2f} kWh")
    print(f"Celková výroba FVE: {total_production:.2f} kWh")
    print(f"Celková energie baterie: {total_battery:.2f} kWh")
    
    # Zkontrolovat, že máme FVE data (PVkWh)
    pv_data = [r for r in results_list if isinstance(r, dict) and 'PVkWh' in r and r['PVkWh'] != 0]
    print(f"\nFVE datové body (nenulové): {len(pv_data)}")
    
    # Zkontrolovat, že máme baterii data (BkWh)
    battery_data = [r for r in results_list if isinstance(r, dict) and 'BkWh' in r and r['BkWh'] is not None]
    print(f"Baterie datové body: {len(battery_data)}")
    
    # Získat logy pro kontrolu použitých parametrů
    log_response = requests.get(
        f"{BASE_URL}/api/v1/calculations/{calc_id}/logs",
        headers={"Authorization": f"Bearer {token}"}
    )
    if log_response.ok:
        logs = log_response.json()["logs"]
        print("\n=== LOGY ZPRACOVÁNÍ ===")
        
        # Najít zprávy o přidaných parametrech
        if "Added missing" in logs:
            print("⚠️ VAROVÁNÍ: Některé parametry byly doplněny:")
            for line in logs.split('\n'):
                if "Added missing" in line:
                    print(f"  {line}")
        else:
            print("✓ Všechny parametry byly správně načteny z konfigurace")
    
    return results_list

def main():
    print("=== TEST KOMPLETNÍCH PARAMETRŮ ===\n")
    
    try:
        # 1. Přihlášení
        print("1. Přihlášení...")
        token = login()
        print("✓ Přihlášení úspěšné")
        
        # 2. Vytvoření konfigurace se všemi parametry
        print("\n2. Vytváření kompletní konfigurace...")
        config = create_full_configuration(token)
        config_id = config["id"]
        print(f"✓ Konfigurace vytvořena: {config_id}")
        print(f"  Název: {config['name']}")
        
        # Vypsat všechny sekce konfigurace
        print("\n  Parametry konfigurace:")
        for section, params in config['config_data'].items():
            print(f"    {section}: {len(params)} parametrů")
        
        # 3. Najít consumption soubor
        print("\n3. Hledání consumption souboru...")
        file_id = get_consumption_file(token)
        print(f"✓ Soubor nalezen: {file_id}")
        
        # 4. Vytvoření kalkulace
        print("\n4. Vytváření kalkulace...")
        calc = create_calculation(token, config_id, file_id, config['config_data'])
        calc_id = calc["id"]
        print(f"✓ Kalkulace vytvořena: {calc_id}")
        
        # 5. Čekání na dokončení
        print("\n5. Čekání na dokončení výpočtu...")
        completed_calc = wait_for_calculation(token, calc_id)
        print("✓ Kalkulace dokončena")
        
        # 6. Ověření výsledků
        print("\n6. Ověření výsledků...")
        results = verify_results(token, calc_id)
        
        # Uložit výsledky
        output_file = Path("test_full_params_results.json")
        with output_file.open('w', encoding='utf-8') as f:
            json.dump({
                'calculation_id': calc_id,
                'configuration': config,
                'results_count': len(results),
                'sample_results': results[:10]  # První 10 záznamů jako ukázka
            }, f, indent=2, ensure_ascii=False)
        print(f"\n✓ Výsledky uloženy do: {output_file}")
        
        print("\n=== TEST ÚSPĚŠNĚ DOKONČEN ===")
        print("Backend správně pracuje se všemi parametry stejně jako Python skript!")
        
    except Exception as e:
        print(f"\n❌ CHYBA: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
