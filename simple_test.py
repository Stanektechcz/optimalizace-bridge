"""Jednoduchý Python test API bez importování backend modulů."""

import requests
import json

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("API TEST - Simple Version")
print("=" * 60)

# Test 1: Health
print("\n1. Health Check...")
try:
    r = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        print(f"   Response: {r.json()}")
except Exception as e:
    print(f"   Error: {e}")

# Test 2: Root
print("\n2. Root Endpoint...")
try:
    r = requests.get(f"{BASE_URL}/")
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        print(f"   Response: {r.json()}")
except Exception as e:
    print(f"   Error: {e}")

# Test 3: OpenAPI docs
print("\n3. OpenAPI Schema...")
try:
    r = requests.get(f"{BASE_URL}/api/v1/openapi.json")
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Title: {data.get('info', {}).get('title')}")
        print(f"   Version: {data.get('info', {}).get('version')}")
        print(f"   Endpoints: {len(data.get('paths', {}))}")
        print(f"   Tags: {[tag['name'] for tag in data.get('tags', [])]}")
except Exception as e:
    print(f"   Error: {e}")

# Test 4: Login admin
print("\n4. Login as Admin...")
try:
    r = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        data={
            "username": "admin",
            "password": "Admin123"
        }
    )
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        token_data = r.json()
        token = token_data['access_token']
        print(f"   ✓ Login successful!")
        print(f"   Token: {token[:50]}...")
        
        # Test 5: Get profile
        print("\n5. Get Admin Profile...")
        r2 = requests.get(
            f"{BASE_URL}/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"   Status: {r2.status_code}")
        if r2.status_code == 200:
            profile = r2.json()
            print(f"   Username: {profile['username']}")
            print(f"   Email: {profile['email']}")
            print(f"   Role: {profile['role']}")
            print(f"   ✓ Profile retrieved!")
        else:
            print(f"   Error: {r2.text}")
    else:
        print(f"   Error: {r.text}")
        print(f"   Note: Admin user might not exist. Create one first!")
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
print(f"\n📖 Full API docs: {BASE_URL}/docs")
