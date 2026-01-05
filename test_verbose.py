"""Test registration endpoint directly via API call with verbose mode."""

import sys
import os

# Use backend venv
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

# Import after path setup
import requests
import json
import uuid

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

print("=" * 60)
print("VERBOSE REGISTRATION TEST")
print("=" * 60)

# Create unique user
unique_id = str(uuid.uuid4())[:8]
user_data = {
    "email": f"verbosetest{unique_id}@example.com",
    "username": f"verbosetest{unique_id}",
    "password": "TestPass123!",
    "full_name": "Verbose Test User"
}

print("\n1. Testing API connectivity...")
try:
    health = requests.get(f"{BASE_URL}/health", timeout=5)
    print(f"   Health check: {health.status_code} - {health.json()}")
except Exception as e:
    print(f"   ERROR: Cannot connect to API - {e}")
    sys.exit(1)

print("\n2. Registering user...")
print(f"   Username: {user_data['username']}")
print(f"   Email: {user_data['email']}")

try:
    response = requests.post(
        f"{API_URL}/auth/register",
        json=user_data,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"\n3. Response received:")
    print(f"   Status Code: {response.status_code}")
    print(f"   Reason: {response.reason}")
    print(f"   Headers: {json.dumps(dict(response.headers), indent=4)}")
    
    if response.status_code == 201:
        print(f"\n✓ SUCCESS! User created:")
        user_response = response.json()
        print(json.dumps(user_response, indent=4))
    elif response.status_code == 400:
        print(f"\n✗ Bad Request:")
        print(f"   {response.json()}")
    elif response.status_code == 500:
        print(f"\n✗ Internal Server Error:")
        print(f"   Response Text: {response.text}")
        print(f"\n   This suggests a server-side issue.")
        print(f"   Check server logs for detailed error message.")
    else:
        print(f"\n✗ Unexpected status code: {response.status_code}")
        print(f"   Response: {response.text}")
        
except requests.exceptions.Timeout:
    print("\n✗ Request timed out")
except requests.exceptions.ConnectionError:
    print("\n✗ Cannot connect to server")
except Exception as e:
    print(f"\n✗ Unexpected error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
