"""Test lightweight endpoint"""
import requests

# Test basic health
response = requests.get("http://localhost:8000/health")
print(f"Health check: {response.status_code}")
print(f"Response: {response.json()}")

# Test login
login_data = {
    "username": "admin",
    "password": "admin123"
}
response = requests.post("http://localhost:8000/api/v1/auth/login", data=login_data)
print(f"\nLogin: {response.status_code}")
if response.status_code == 200:
    token = response.json()["access_token"]
    print(f"Token obtained: {token[:20]}...")
    
    # Test lightweight endpoint
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test without lightweight
    response = requests.get("http://localhost:8000/api/v1/calculations/", headers=headers)
    print(f"\nWithout lightweight: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Calculations: {data.get('total', 0)}")
        if data.get('calculations'):
            calc = data['calculations'][0]
            print(f"First calc has results: {bool(calc.get('results'))}")
            print(f"First calc has cost_table: {bool(calc.get('cost_table'))}")
    
    # Test with lightweight
    response = requests.get("http://localhost:8000/api/v1/calculations/?lightweight=true", headers=headers)
    print(f"\nWith lightweight=true: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Calculations: {data.get('total', 0)}")
        if data.get('calculations'):
            calc = data['calculations'][0]
            print(f"First calc has results: {bool(calc.get('results'))}")
            print(f"First calc has cost_table: {bool(calc.get('cost_table'))}")
else:
    print(f"Login failed: {response.text}")
