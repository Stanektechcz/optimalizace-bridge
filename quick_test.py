"""
Jednoduchý test API - rychlé ověření funkčnosti
"""
import requests
import time
import json

BASE_URL = "http://localhost:8000/api/v1"

print("🔍 Testování API...")
print("=" * 60)

# Počkej na server
print("\n⏳ Čekám na server...")
for i in range(10):
    try:
        r = requests.get("http://localhost:8000/health", timeout=1)
        if r.status_code == 200:
            print("✅ Server běží!")
            break
    except:
        time.sleep(1)
        print(f"   Pokus {i+1}/10...")
else:
    print("❌ Server neběží! Spusťte: cd backend && uvicorn app.main:app --reload")
    exit(1)

# Test 1: Login admin
print("\n📍 Test 1: Login admin")
response = requests.post(
    f"{BASE_URL}/auth/login",
    data={"username": "admin", "password": "Admin123!"}
)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    token = response.json()["access_token"]
    print(f"✅ Token: {token[:50]}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 2: Get current user
    print("\n📍 Test 2: Get /auth/me")
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        user = response.json()
        print(f"✅ User: {user['username']} ({user['role']})")
    
    # Test 3: List configurations
    print("\n📍 Test 3: Get /configurations/")
    response = requests.get(f"{BASE_URL}/configurations/", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)[:200]}...")
    
    # Test 4: Create configuration
    print("\n📍 Test 4: POST /configurations/")
    config_data = {
        "name": "Quick Test Config",
        "description": "Auto-created test",
        "is_default": False,
        "config_data": {
            "Baterie": {"b_cap": 5000},
            "FVE": {"pv_powernom": 10000}
        }
    }
    response = requests.post(f"{BASE_URL}/configurations/", json=config_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        config_id = response.json()["id"]
        print(f"✅ Config ID: {config_id}")
    
    print("\n" + "=" * 60)
    print("✅ VŠECHNY TESTY PROŠLY!")
    print("📖 Swagger UI: http://localhost:8000/docs")
    print("=" * 60)
else:
    print(f"❌ Login selhal: {response.text}")
