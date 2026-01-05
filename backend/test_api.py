"""Test API endpoints."""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_login():
    """Test login endpoint."""
    print("🔐 Testing login...")
    
    # Login with admin credentials
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={
            "username": "admin",
            "password": "Admin123!"
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Login successful!")
        print(f"   Access Token: {data['access_token'][:50]}...")
        print(f"   Expires in: {data['expires_in']} seconds")
        return data['access_token']
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.json())
        return None


def test_get_me(token):
    """Test get current user endpoint."""
    print("\n👤 Testing /auth/me...")
    
    response = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        user = response.json()
        print("✅ Got current user!")
        print(f"   ID: {user['id']}")
        print(f"   Username: {user['username']}")
        print(f"   Email: {user['email']}")
        print(f"   Role: {user['role']}")
        return user
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.json())
        return None


def test_create_configuration(token):
    """Test create configuration endpoint."""
    print("\n⚙️  Testing create configuration...")
    
    config_data = {
        "name": "Test konfigurace FVE 7kW",
        "description": "Testovací konfigurace pro API test",
        "is_default": True,
        "config_data": {
            "Optimalizace": {
                "optimizationtype": 0
            },
            "Baterie": {
                "b_cap": 3000,
                "b_effcharge": 0.98,
                "b_effdischarge": 0.98
            },
            "FVE": {
                "pv_powernom": 7000,
                "pv_eff": 0.95
            },
            "Ceny": {
                "pricefix": 2.9
            },
            "Pmax": {
                "pmaxodber": 6000
            }
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/configurations/",
        headers={"Authorization": f"Bearer {token}"},
        json=config_data
    )
    
    if response.status_code == 201:
        config = response.json()
        print("✅ Configuration created!")
        print(f"   ID: {config['id']}")
        print(f"   Name: {config['name']}")
        print(f"   Default: {config['is_default']}")
        return config
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.json())
        return None


def test_list_configurations(token):
    """Test list configurations endpoint."""
    print("\n📋 Testing list configurations...")
    
    response = requests.get(
        f"{BASE_URL}/configurations/",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Got {data['total']} configurations")
        for config in data['configurations']:
            print(f"   - {config['name']} (default: {config['is_default']})")
        return data
    else:
        print(f"❌ Failed: {response.status_code}")
        return None


def main():
    """Run all tests."""
    print("🧪 API Test Suite")
    print("=" * 50)
    print("")
    
    # Test login
    token = test_login()
    if not token:
        print("\n❌ Cannot continue without token")
        return
    
    # Test get me
    user = test_get_me(token)
    if not user:
        print("\n❌ Cannot get user info")
        return
    
    # Test create configuration
    config = test_create_configuration(token)
    
    # Test list configurations
    test_list_configurations(token)
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    print("")
    print("🌐 Try the Swagger UI at: http://localhost:8000/docs")


if __name__ == "__main__":
    main()
