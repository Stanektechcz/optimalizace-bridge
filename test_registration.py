"""Test user registration with detailed error output."""

import requests
import json

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

print("=" * 60)
print("REGISTRATION TEST")
print("=" * 60)

# Test registration with unique username
import uuid
unique_id = str(uuid.uuid4())[:8]
user_data = {
    "email": f"testuser{unique_id}@example.com",
    "username": f"testuser{unique_id}",
    "password": "TestPass123!",
    "full_name": "Test User"
}

print("\nRegistering user with data:")
print(json.dumps(user_data, indent=2))

try:
    response = requests.post(
        f"{API_URL}/auth/register",
        json=user_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    
    try:
        print(f"Response JSON: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response Text: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 60)
