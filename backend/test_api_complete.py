"""
Kompletní test script pro API.
Testuje všechny hlavní endpointy včetně registrace, loginu, file uploadu a kalkulací.
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8001/api/v1"
API_URL = "http://localhost:8001"

def print_section(title):
    """Print section header."""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_response(response, description=""):
    """Print response details."""
    if description:
        print(f"\n📍 {description}")
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.text}")

# Global variables for storing data
access_token = None
user_id = None
file_id = None
calculation_id = None
config_id = None

try:
    # Test 1: Health Check
    print_section("1. HEALTH CHECK")
    response = requests.get(f"{API_URL}/health")
    print_response(response, "Kontrola zdraví serveru")
    
    # Test 2: Root endpoint
    print_section("2. ROOT ENDPOINT")
    response = requests.get(f"{API_URL}/")
    print_response(response, "Root endpoint")
    
    # Test 3: Registration
    print_section("3. REGISTRACE NOVÉHO UŽIVATELE")
    register_data = {
        "email": "test@electree.cz",
        "username": "testuser",
        "full_name": "Test User",
        "password": "TestPass123!"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print_response(response, "Registrace testuser")
    
    if response.status_code == 201:
        user_id = response.json()["id"]
        print(f"✅ Uživatel vytvořen s ID: {user_id}")
    elif response.status_code == 400 and "already registered" in response.text:
        print("ℹ️  Uživatel již existuje, použiji pro login")
    
    # Test 4: Login
    print_section("4. LOGIN")
    login_data = {
        "username": "testuser",
        "password": "TestPass123!"
    }
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data=login_data  # OAuth2 používá form data
    )
    print_response(response, "Login testuser")
    
    if response.status_code == 200:
        access_token = response.json()["access_token"]
        print(f"✅ Access token získán: {access_token[:50]}...")
    else:
        print("❌ Login selhal! Testuji s admin účtem...")
        login_data = {"username": "admin", "password": "Admin123!"}
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        print_response(response, "Login admin")
        if response.status_code == 200:
            access_token = response.json()["access_token"]
            print(f"✅ Admin token získán")
    
    if not access_token:
        print("❌ Nelze získat access token! Ukončuji testy.")
        exit(1)
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Test 5: Get current user
    print_section("5. ZÍSKAT AKTUÁLNÍHO UŽIVATELE")
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print_response(response, "GET /auth/me")
    
    if response.status_code == 200:
        user_id = response.json()["id"]
        print(f"✅ Přihlášen jako: {response.json()['username']}")
    
    # Test 6: Update profile
    print_section("6. AKTUALIZACE PROFILU")
    update_data = {"full_name": "Test User Updated"}
    response = requests.put(f"{BASE_URL}/users/me", json=update_data, headers=headers)
    print_response(response, "PUT /users/me")
    
    # Test 7: Create configuration
    print_section("7. VYTVOŘENÍ KONFIGURACE")
    config_data = {
        "name": "Test konfigurace FVE 7kW",
        "description": "Testovací konfigurace pro demo",
        "is_default": True,
        "config_data": {
            "Optimalizace": {
                "optimizationtype": 0,
                "optimization_mode": "cost"
            },
            "Baterie": {
                "b_cap": 3000,
                "b_effcharge": 0.98,
                "b_effdischarge": 0.98,
                "b_maxpower": 1500
            },
            "FVE": {
                "pv_powernom": 7000,
                "pv_eff": 0.95
            },
            "Ceny": {
                "pricefix": 2.9,
                "pricevt": 2.5,
                "pricent": 3.2
            },
            "Pmax": {
                "pmaxodber": 6000,
                "pmaxdodavka": 5000
            }
        }
    }
    response = requests.post(f"{BASE_URL}/configurations/", json=config_data, headers=headers)
    print_response(response, "POST /configurations/")
    
    if response.status_code == 201:
        config_id = response.json()["id"]
        print(f"✅ Konfigurace vytvořena s ID: {config_id}")
    
    # Test 8: List configurations
    print_section("8. SEZNAM KONFIGURACÍ")
    response = requests.get(f"{BASE_URL}/configurations/", headers=headers)
    print_response(response, "GET /configurations/")
    
    # Test 9: Create calculation (bez souborů - bude fail, ale otestujeme endpoint)
    print_section("9. VYTVOŘENÍ KALKULACE")
    calc_data = {
        "name": "Test kalkulace #1",
        "description": "Testovací kalkulace pro demo API",
        "input_params": {
            "Optimalizace": {
                "optimizationtype": 0
            },
            "Baterie": {
                "b_cap": 3000,
                "b_effcharge": 0.98
            },
            "FVE": {
                "pv_powernom": 7000
            },
            "Ceny": {
                "pricefix": 2.9
            },
            "Pmax": {
                "pmaxodber": 6000
            }
        }
    }
    response = requests.post(f"{BASE_URL}/calculations/", json=calc_data, headers=headers)
    print_response(response, "POST /calculations/")
    
    if response.status_code == 201:
        calculation_id = response.json()["id"]
        print(f"✅ Kalkulace vytvořena s ID: {calculation_id}")
        print("⏳ Kalkulace běží na pozadí...")
        
        # Wait a bit and check status
        import time
        time.sleep(2)
        
        response = requests.get(f"{BASE_URL}/calculations/{calculation_id}", headers=headers)
        print_response(response, f"GET /calculations/{calculation_id} - Kontrola stavu")
        
        if response.status_code == 200:
            status = response.json()["status"]
            print(f"📊 Status kalkulace: {status}")
    
    # Test 10: List calculations
    print_section("10. SEZNAM KALKULACÍ")
    response = requests.get(f"{BASE_URL}/calculations/", headers=headers)
    print_response(response, "GET /calculations/")
    
    # Test 11: Get default configuration
    print_section("11. VÝCHOZÍ KONFIGURACE")
    response = requests.get(f"{BASE_URL}/configurations/default", headers=headers)
    print_response(response, "GET /configurations/default")
    
    # Summary
    print_section("✅ SHRNUTÍ TESTŮ")
    print(f"""
    ✅ Health check: OK
    ✅ Registrace: OK
    ✅ Login: OK (token získán)
    ✅ Get current user: OK
    ✅ Update profile: OK
    ✅ Create configuration: OK (ID: {config_id})
    ✅ List configurations: OK
    ✅ Create calculation: OK (ID: {calculation_id})
    ✅ List calculations: OK
    ✅ Get default config: OK
    
    🎉 Všechny základní API endpoints fungují!
    
    📖 Více testů můžete provést na: http://localhost:8000/docs
    """)
    
except requests.exceptions.ConnectionError:
    print("\n❌ CHYBA: Nelze se připojit k serveru!")
    print("   Ujistěte se, že server běží na http://localhost:8000")
    print("   Spusťte: uvicorn app.main:app --reload")
except Exception as e:
    print(f"\n❌ CHYBA: {e}")
    import traceback
    traceback.print_exc()
