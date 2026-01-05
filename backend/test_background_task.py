"""Test creating calculation via API and checking results"""
import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

# Login first
login_data = {
    "username": "admin",
    "password": "admin123"
}

print("Logging in...")
response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
if response.status_code != 200:
    print(f"Login failed: {response.text}")
    exit(1)

token_data = response.json()
token = token_data["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print(f"✓ Logged in successfully")

# Get existing successful calculation config
print("\nGetting config from previous calculation...")
calc_response = requests.get(
    f"{BASE_URL}/calculations/c9b1bf83-4301-4ca8-aa05-c36f97fd4cde",
    headers=headers
)
if calc_response.status_code != 200:
    print(f"Failed to get calculation: {calc_response.text}")
    exit(1)

existing_calc = calc_response.json()
input_params = existing_calc["input_params"]

# Create new calculation
print("\nCreating new calculation...")
calc_data = {
    "name": "Test Calculation - Background Task Fix",
    "description": "Testing fixed background task with separate DB session",
    "input_params": input_params
}

response = requests.post(
    f"{BASE_URL}/calculations/",
    json=calc_data,
    headers=headers
)

if response.status_code != 201:
    print(f"Failed to create calculation: {response.text}")
    exit(1)

new_calc = response.json()
calc_id = new_calc["id"]
print(f"✓ Calculation created: {calc_id}")
print(f"  Status: {new_calc['status']}")

# Poll for completion
print("\nWaiting for calculation to complete...")
max_wait = 120  # 2 minutes
start_time = time.time()

while time.time() - start_time < max_wait:
    time.sleep(2)
    
    response = requests.get(
        f"{BASE_URL}/calculations/{calc_id}",
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"Failed to get calculation status: {response.text}")
        break
    
    calc = response.json()
    status = calc["status"]
    progress = calc.get("progress", 0)
    
    elapsed = int(time.time() - start_time)
    print(f"  [{elapsed}s] Status: {status}, Progress: {progress}%")
    
    if status == "completed":
        print("\n✓ Calculation completed successfully!")
        print(f"  Execution time: {calc.get('execution_time_seconds', 0)}s")
        print(f"  Has results: {bool(calc.get('results'))}")
        print(f"  Has cost_table: {bool(calc.get('cost_table'))}")
        print(f"  Has energy_balance: {bool(calc.get('energy_balance'))}")
        print(f"  Has charts_data: {bool(calc.get('charts_data'))}")
        
        if calc.get('results'):
            results = calc['results']
            print(f"\n  Results keys: {list(results.keys())}")
            if 'battCycles' in results:
                print(f"  Battery cycles: {results['battCycles']}")
            if 'timeString' in results:
                print(f"  Time period: {results['timeString']}")
        
        if calc.get('cost_table'):
            print(f"\n  Cost table rows: {len(calc['cost_table'])}")
        
        break
    
    elif status == "failed":
        print(f"\n✗ Calculation failed!")
        print(f"  Error: {calc.get('error_message', 'Unknown error')}")
        break

else:
    print(f"\n✗ Calculation did not complete within {max_wait}s")
    print(f"  Last status: {calc.get('status')}")
    print(f"  Last progress: {calc.get('progress', 0)}%")
