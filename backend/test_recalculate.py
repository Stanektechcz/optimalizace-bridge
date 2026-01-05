"""Test recalculate endpoint"""
import requests
import json

# Login first  
login_data = {
    "username": "test@example.com",
    "password": "testpass123"
}

response = requests.post("http://localhost:8000/api/v1/auth/login", data=login_data)
if response.status_code == 200:
    token = response.json()["access_token"]
    print(f"✅ Logged in successfully")
    
    # Recalculate
    calc_id = "cf6db97d-8e08-4ca2-a564-4f5128e0ca90"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.post(f"http://localhost:8000/api/v1/calculations/{calc_id}/recalculate", headers=headers)
    if response.status_code == 200:
        print(f"✅ Recalculation started: {response.json()}")
        
        # Wait a bit and check results
        import time
        print("Waiting 15 seconds for calculation to complete...")
        time.sleep(15)
        
        # Get calculation
        response = requests.get(f"http://localhost:8000/api/v1/calculations/{calc_id}", headers=headers)
        if response.status_code == 200:
            calc = response.json()
            print(f"\n✅ Calculation status: {calc['status']}")
            print(f"Results present: {calc.get('results') is not None}")
            if calc.get('results'):
                print(f"Results keys: {list(calc['results'].keys())}")
                print(f"\nBattCycles: {calc['results'].get('battCycles')}")
                print(f"BattCyclesYear: {calc['results'].get('battCyclesYear')}")
                print(f"TimeString: {calc['results'].get('timeString')}")
            
            print(f"\nTables present:")
            print(f"  cost_table: {calc.get('cost_table') is not None}")
            print(f"  cost_table_year: {calc.get('cost_table_year') is not None}")
            print(f"  energy_balance: {calc.get('energy_balance') is not None}")
            print(f"  energy_balance_year: {calc.get('energy_balance_year') is not None}")
            print(f"  input_metadata: {calc.get('input_metadata') is not None}")
            
            if calc.get('energy_balance') and len(calc['energy_balance']) > 0:
                print(f"\n✅ Energy balance first row: {calc['energy_balance'][0]}")
            
            if calc.get('energy_balance_year') and len(calc['energy_balance_year']) > 0:
                print(f"✅ Energy balance year first row: {calc['energy_balance_year'][0]}")
        else:
            print(f"❌ Failed to get calculation: {response.status_code}")
            print(response.text)
    else:
        print(f"❌ Failed to recalculate: {response.status_code}")
        print(response.text)
else:
    print(f"❌ Login failed: {response.status_code}")
    print(response.text)
