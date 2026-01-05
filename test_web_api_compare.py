"""
Test pro porovnání výsledků Python výpočtu s webovou aplikací
Tento test volá backend API přímo, tak jak to dělá web
"""
import json
import requests
from pathlib import Path

def main():
    print("=" * 80)
    print("TEST POROVNÁNÍ: Python Backend API vs Webová aplikace")
    print("=" * 80)
    print()
    
    # API URL
    base_url = "http://localhost:8000"
    
    # Test připojení
    print("1. Test připojení k backendu...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print(f"   ✓ Backend běží na {base_url}")
        else:
            print(f"   ✗ Backend neodpovídá správně (status: {response.status_code})")
            return
    except Exception as e:
        print(f"   ✗ Nelze se připojit k backendu: {e}")
        print(f"   ℹ️  Ujistěte se, že backend běží: cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000")
        return
    
    # Přihlášení (potřebujeme token)
    print("2. Přihlášení do systému...")
    login_data = {
        "username": "admin",
        "password": "Admin123"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/v1/auth/login",
            data=login_data
        )
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            print(f"   ✓ Přihlášení úspěšné")
            headers = {"Authorization": f"Bearer {token}"}
        else:
            print(f"   ✗ Přihlášení selhalo: {response.json()}")
            print(f"   ℹ️  Ujistěte se, že máte vytvořeného admin uživatele")
            return
    except Exception as e:
        print(f"   ✗ Chyba při přihlášení: {e}")
        return
    
    # Načtení nebo nahrání souboru
    print("3. Načítání testovacího souboru...")
    file_path = Path("data_input/OD_2023_Alfa_estate.xlsx")
    file_id = None
    
    # Nejdříve zkusíme najít existující soubor
    try:
        response = requests.get(
            f"{base_url}/api/v1/files",
            headers=headers
        )
        
        if response.status_code == 200:
            files_data = response.json()
            files = files_data.get('files', [])
            existing_file = next((f for f in files if f['original_filename'] == 'OD_2023_Alfa_estate.xlsx'), None)
            
            if existing_file:
                file_id = existing_file['id']
                print(f"   ✓ Soubor nalezen v databázi (ID: {file_id})")
                print(f"      Řádků: {existing_file.get('rows_count', 'N/A')}, Období: {existing_file.get('date_from', 'N/A')} - {existing_file.get('date_to', 'N/A')}")
    except Exception as e:
        print(f"   ⚠️  Chyba při hledání souboru: {e}")
    
    # Pokud soubor není nalezen, nahrajeme ho
    if not file_id:
        if not file_path.exists():
            print(f"   ✗ Soubor nenalezen: {file_path}")
            return
        
        try:
            with open(file_path, 'rb') as f:
                files = {
                    'file': ('OD_2023_Alfa_estate.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                }
                response = requests.post(
                    f"{base_url}/api/v1/files/upload?file_type=consumption",
                    headers=headers,
                    files=files
                )
            
            if response.status_code in [200, 201]:
                file_data = response.json()
                file_id = file_data["id"]
                print(f"   ✓ Soubor nahrán (ID: {file_id})")
                print(f"      Řádků: {file_data.get('rows_count', 'N/A')}, Období: {file_data.get('date_from', 'N/A')} - {file_data.get('date_to', 'N/A')}")
            else:
                print(f"   ✗ Nahrání souboru selhalo: {response.json()}")
                return
        except Exception as e:
            print(f"   ✗ Chyba při nahrávání: {e}")
            return
    
    # Načtení konfigurace
    print("4. Načítání konfigurace default.ini...")
    try:
        response = requests.get(
            f"{base_url}/api/v1/configurations",
            headers=headers
        )
        
        if response.status_code == 200:
            configs_data = response.json()
            configs = configs_data.get('configurations', [])
            default_config = next((c for c in configs if 'default' in c['name'].lower()), None)
            
            if default_config:
                config_id = default_config['id']
                print(f"   ✓ Konfigurace nalezena (ID: {config_id})")
            else:
                # Použijeme první dostupnou konfiguraci
                if configs:
                    config_id = configs[0]['id']
                    print(f"   ✓ Použiji první dostupnou konfiguraci: {configs[0]['name']} (ID: {config_id})")
                else:
                    print(f"   ✗ Žádná konfigurace nenalezena")
                    return
        else:
            print(f"   ✗ Chyba při načítání konfigurací: {response.json()}")
            return
    except Exception as e:
        print(f"   ✗ Chyba: {e}")
        return
    
    # Spuštění výpočtu
    print("5. Spouštím výpočet...")
    calculation_data = {
        "name": "Test - OD_2023_Alfa_estate",
        "description": "Testovací výpočet pro porovnání s Python skriptem",
        "configuration_id": config_id,
        "input_params": default_config['config_data'] if default_config else configs[0]['config_data'],
        "file_ids": [file_id]
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/v1/calculations",
            headers=headers,
            json=calculation_data
        )
        
        if response.status_code in [200, 201]:
            calculation = response.json()
            calc_id = calculation["id"]
            print(f"   ✓ Výpočet vytvořen (ID: {calc_id})")
            print(f"   ⏳ Čekám na dokončení výpočtu...")
        else:
            print(f"   ✗ Vytvoření výpočtu selhalo (status {response.status_code}): {response.json()}")
            return
    except Exception as e:
        print(f"   ✗ Chyba: {e}")
        return
    
    # Čekání na dokončení a získání výsledků
    import time
    max_wait = 120  # 2 minuty
    wait_time = 0
    
    while wait_time < max_wait:
        try:
            response = requests.get(
                f"{base_url}/api/v1/calculations/{calc_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                calculation = response.json()
                status = calculation.get("status", "unknown")
                
                if status == "completed":
                    print(f"   ✓ Výpočet dokončen!")
                    break
                elif status == "failed":
                    error_msg = calculation.get("error_message", "Neznámá chyba")
                    print(f"   ✗ Výpočet selhal: {error_msg}")
                    print(f"   ℹ️  Zkontrolujte backend logy pro více detailů")
                    return
                else:
                    print(f"   ⏳ Status: {status} (čekám {wait_time}s)")
                    time.sleep(5)
                    wait_time += 5
            else:
                print(f"   ✗ Chyba při zjišťování statusu")
                return
        except Exception as e:
            print(f"   ✗ Chyba: {e}")
            return
    
    if wait_time >= max_wait:
        print(f"   ✗ Výpočet trval příliš dlouho (>{max_wait}s)")
        return
    
    # Výpis výsledků
    print()
    print("=" * 80)
    print("VÝSLEDKY Z WEB API:")
    print("=" * 80)
    
    charts_data = calculation.get("charts_data", {}).get("dataRed", [])
    
    if not charts_data:
        print("   ⚠️  Žádná data grafů")
    else:
        print(f"\n📊 GRAFOVÁ DATA:")
        print(f"   Počet datových bodů: {len(charts_data)}")
        
        # Agregované statistiky
        print(f"\n📈 AGREGOVANÉ STATISTIKY:")
        print("-" * 80)
        
        # Energie
        total_consumption = sum(row.get('kWh', 0) for row in charts_data)
        total_production = sum(row.get('PVkWh', 0) for row in charts_data)
        print(f"Celková spotřeba:        {total_consumption:>12.2f} kWh")
        print(f"Celková výroba (FVE):    {total_production:>12.2f} kWh")
        
        # Baterie
        battery_charge = sum(row.get('BkWh', 0) for row in charts_data if row.get('BkWh', 0) > 0)
        battery_discharge = sum(abs(row.get('BkWh', 0)) for row in charts_data if row.get('BkWh', 0) < 0)
        print(f"Nabíjení baterie:        {battery_charge:>12.2f} kWh")
        print(f"Vybíjení baterie:        {battery_discharge:>12.2f} kWh")
        
        # Síť
        grid_import = sum(row.get('Grid (kWh)', 0) for row in charts_data if row.get('Grid (kWh)', 0) > 0)
        grid_export = sum(abs(row.get('Grid (kWh)', 0)) for row in charts_data if row.get('Grid (kWh)', 0) < 0)
        print(f"Odběr ze sítě:           {grid_import:>12.2f} kWh")
        print(f"Dodávka do sítě:         {grid_export:>12.2f} kWh")
        
        # Náklady
        total_cost = sum(row.get('Cost (Kč)', 0) for row in charts_data)
        print(f"\n💰 CELKOVÉ NÁKLADY:      {total_cost:>12.2f} Kč")
        
        # Příklady prvních 10 řádků
        print(f"\n📝 PRVNÍ 10 ŘÁDKŮ DAT:")
        print("-" * 80)
        print(f"{'Den':<20} {'kWh':>8} {'PVkWh':>8} {'BkWh':>8} {'Grid':>8} {'Cost':>8}")
        print("-" * 80)
        for row in charts_data[:10]:
            den = row.get('Den', '')[:19]  # Zkrácení datumu
            kwh = row.get('kWh', 0)
            pvkwh = row.get('PVkWh', 0)
            bkwh = row.get('BkWh', 0)
            grid = row.get('Grid (kWh)', 0)
            cost = row.get('Cost (Kč)', 0)
            print(f"{den:<20} {kwh:>8.2f} {pvkwh:>8.2f} {bkwh:>8.2f} {grid:>8.2f} {cost:>8.2f}")
    
    # Tabulkové výsledky
    if calculation.get("cost_table"):
        print(f"\n💵 NÁKLADOVÁ TABULKA:")
        print("-" * 80)
        cost_table = calculation["cost_table"]
        if cost_table:
            print(f"   Řádků v tabulce: {len(cost_table)}")
    
    if calculation.get("energy_balance"):
        print(f"\n⚡ ENERGETICKÁ BILANCE:")
        print("-" * 80)
        energy_balance = calculation["energy_balance"]
        if energy_balance:
            print(f"   Řádků v bilanci: {len(energy_balance)}")
    
    # Export pro porovnání
    print(f"\n📁 EXPORT PRO POROVNÁNÍ:")
    print("-" * 80)
    
    comparison_data = {
        "source": "web_api",
        "calculation_id": calc_id,
        "file": "OD_2023_Alfa_estate.xlsx",
        "config": "default.ini",
        "data_points": len(charts_data),
        "energy_balance": {
            "total_consumption_kwh": total_consumption,
            "total_production_kwh": total_production,
            "battery_charge_kwh": battery_charge,
            "battery_discharge_kwh": battery_discharge,
            "grid_import_kwh": grid_import,
            "grid_export_kwh": grid_export,
        },
        "financial": {
            "total_cost_czk": total_cost
        },
        "first_10_rows": charts_data[:10] if charts_data else []
    }
    
    output_file = "test_web_results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(comparison_data, f, indent=2, ensure_ascii=False)
    
    print(f"   ✓ Výsledky exportovány do: {output_file}")
    
    print("\n" + "=" * 80)
    print("✓ Test dokončen!")
    print("=" * 80)
    print("""
DALŠÍ KROKY:
1. Otevřete prohlížeč: http://localhost:3000
2. Přihlaste se (admin/admin123)
3. Přejděte do 'Výsledky' a najděte výpočet: 'Test - OD_2023_Alfa_estate'
4. Porovnejte výsledky s údaji výše
5. Zkontrolujte grafy - měly by odpovídat datům
    """)

if __name__ == "__main__":
    main()
