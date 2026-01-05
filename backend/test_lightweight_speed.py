"""Test lightweight mode speed"""
import requests
import time

# Login
login_data = {"username": "admin", "password": "Admin123"}
response = requests.post("http://localhost:8000/api/v1/auth/login", data=login_data)

if response.status_code == 200:
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test WITHOUT lightweight (full data)
    print("Testing WITHOUT lightweight mode...")
    start = time.time()
    response = requests.get("http://localhost:8000/api/v1/calculations/", headers=headers)
    full_time = time.time() - start
    print(f"  Time: {full_time*1000:.0f}ms")
    if response.status_code == 200:
        data = response.json()
        print(f"  Response size: {len(response.content)} bytes")
        print(f"  Calculations: {data.get('total', 0)}")
    
    # Test WITH lightweight
    print("\nTesting WITH lightweight=true mode...")
    start = time.time()
    response = requests.get("http://localhost:8000/api/v1/calculations/?lightweight=true", headers=headers)
    light_time = time.time() - start
    print(f"  Time: {light_time*1000:.0f}ms")
    if response.status_code == 200:
        data = response.json()
        print(f"  Response size: {len(response.content)} bytes")
        print(f"  Calculations: {data.get('total', 0)}")
    
    print(f"\nSpeedup: {full_time/light_time:.1f}x faster with lightweight mode")
else:
    print(f"Login failed: {response.status_code}")
    print(response.text)
