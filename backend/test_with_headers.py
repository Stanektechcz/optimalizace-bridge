"""Test with timing headers"""
import requests
import time

login_data = {"username": "admin", "password": "Admin123"}
response = requests.post("http://localhost:8000/api/v1/auth/login", data=login_data)

if response.status_code == 200:
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Testing WITH lightweight=true mode...")
    start = time.time()
    response = requests.get("http://localhost:8000/api/v1/calculations/?lightweight=true", headers=headers)
    client_time = (time.time() - start) * 1000
    
    if response.status_code == 200:
        server_time = response.headers.get("X-Processing-Time-Ms", "N/A")
        print(f"  Client total time: {client_time:.0f}ms")
        print(f"  Server processing time: {server_time}ms")
        print(f"  Network + overhead: {client_time - int(server_time) if server_time != 'N/A' else 'N/A'}ms")
        print(f"  Response size: {len(response.content)} bytes")
    else:
        print(f"Error: {response.status_code}")
else:
    print(f"Login failed")
