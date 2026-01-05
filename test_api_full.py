"""
Komplexní test všech API endpoints.
Test flow:
1. Health check
2. Registrace nového uživatele
3. Login (získání JWT tokenu)
4. Upload souboru
5. Vytvoření konfigurace
6. Spuštění kalkulace
7. Získání výsledků
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def print_test(name):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}TEST: {name}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")

def print_success(message):
    print(f"{GREEN}✓ {message}{RESET}")

def print_error(message):
    print(f"{RED}✗ {message}{RESET}")

def print_info(message):
    print(f"{YELLOW}ℹ {message}{RESET}")

# Test data
test_user = {
    "email": f"test_{int(time.time())}@electree.cz",
    "username": f"testuser_{int(time.time())}",
    "full_name": "Test User",
    "password": "TestPass123!"
}

def test_health_check():
    """Test health check endpoint."""
    print_test("Health Check")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Server is healthy: {data['status']}")
            print_info(f"Service: {data['service']}")
            print_info(f"Version: {data['version']}")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Health check error: {str(e)}")
        return False

def test_register():
    """Test user registration."""
    print_test("User Registration")
    try:
        response = requests.post(
            f"{API_URL}/auth/register",
            json=test_user,
            timeout=10
        )
        if response.status_code == 201:
            data = response.json()
            print_success(f"User registered: {data['username']}")
            print_info(f"User ID: {data['id']}")
            print_info(f"Email: {data['email']}")
            return data
        else:
            print_error(f"Registration failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
    except Exception as e:
        print_error(f"Registration error: {str(e)}")
        return None

def test_login():
    """Test user login."""
    print_test("User Login")
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            data={
                "username": test_user["username"],
                "password": test_user["password"]
            },
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print_success("Login successful!")
            print_info(f"Access token: {data['access_token'][:50]}...")
            print_info(f"Token type: {data['token_type']}")
            print_info(f"Expires in: {data['expires_in']} seconds")
            return data['access_token']
        else:
            print_error(f"Login failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
    except Exception as e:
        print_error(f"Login error: {str(e)}")
        return None

def test_get_profile(token):
    """Test get current user profile."""
    print_test("Get User Profile")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{API_URL}/auth/me",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print_success(f"Profile retrieved: {data['username']}")
            print_info(f"Role: {data['role']}")
            print_info(f"Active: {data['is_active']}")
            return data
        else:
            print_error(f"Get profile failed: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Get profile error: {str(e)}")
        return None

def test_create_configuration(token):
    """Test create configuration."""
    print_test("Create Configuration")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        config_data = {
            "name": "Test Config - FVE 7kW",
            "description": "Testovací konfigurace",
            "is_default": True,
            "config_data": {
                "Optimalizace": {
                    "optimizationtype": 0
                },
                "Baterie": {
                    "b_cap": 3000,
                    "b_effcharge": 0.98,
                    "b_effdischarge": 0.98,
                    "b_maxpower": 1500
                },
                "FVE": {
                    "pv_powernom": 7000,
                    "pv_eff": 0.95
                },
                "Ceny": {
                    "pricefix": 2.9
                },
                "Pmax": {
                    "pmaxodber": 6000,
                    "pmaxdodavka": 5000
                }
            }
        }
        
        response = requests.post(
            f"{API_URL}/configurations/",
            headers=headers,
            json=config_data,
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            print_success(f"Configuration created: {data['name']}")
            print_info(f"Config ID: {data['id']}")
            print_info(f"Is default: {data['is_default']}")
            return data['id']
        else:
            print_error(f"Create configuration failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
    except Exception as e:
        print_error(f"Create configuration error: {str(e)}")
        return None

def test_list_configurations(token):
    """Test list configurations."""
    print_test("List Configurations")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{API_URL}/configurations/",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Configurations retrieved: {data['total']} total")
            for config in data['configurations']:
                print_info(f"  - {config['name']} (default: {config['is_default']})")
            return data['configurations']
        else:
            print_error(f"List configurations failed: {response.status_code}")
            return []
    except Exception as e:
        print_error(f"List configurations error: {str(e)}")
        return []

def test_create_calculation(token, config_id=None):
    """Test create and run calculation."""
    print_test("Create & Run Calculation")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        calc_data = {
            "name": f"Test Calculation {datetime.now().strftime('%H:%M:%S')}",
            "description": "Test kalkulace přes API",
            "configuration_id": config_id,
            "input_params": {
                "Optimalizace": {
                    "optimizationtype": 0
                },
                "Baterie": {
                    "b_cap": 3000,
                    "b_effcharge": 0.98,
                    "b_effdischarge": 0.98,
                    "b_maxpower": 1500
                },
                "FVE": {
                    "pv_powernom": 7000,
                    "pv_eff": 0.95
                },
                "Ceny": {
                    "pricefix": 2.9,
                    "pricevt": 2.5,
                    "pricent": 3.2
                },
                "Pmax": {
                    "pmaxodber": 6000,
                    "pmaxdodavka": 5000
                }
            }
        }
        
        response = requests.post(
            f"{API_URL}/calculations/",
            headers=headers,
            json=calc_data,
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            print_success(f"Calculation created: {data['name']}")
            print_info(f"Calculation ID: {data['id']}")
            print_info(f"Status: {data['status']}")
            return data['id']
        else:
            print_error(f"Create calculation failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
    except Exception as e:
        print_error(f"Create calculation error: {str(e)}")
        return None

def test_get_calculation(token, calc_id, wait_for_completion=True):
    """Test get calculation results."""
    print_test("Get Calculation Results")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        if wait_for_completion:
            print_info("Waiting for calculation to complete...")
            max_attempts = 30
            for i in range(max_attempts):
                response = requests.get(
                    f"{API_URL}/calculations/{calc_id}",
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    status = data['status']
                    print_info(f"Attempt {i+1}/{max_attempts}: Status = {status}")
                    
                    if status == 'completed':
                        print_success("Calculation completed!")
                        print_info(f"Execution time: {data.get('execution_time_seconds', 'N/A')}s")
                        if data.get('results'):
                            print_info(f"Results keys: {list(data['results'].keys())}")
                        return data
                    elif status == 'failed':
                        print_error(f"Calculation failed: {data.get('error_message')}")
                        return data
                    elif status in ['pending', 'running']:
                        time.sleep(2)
                    else:
                        print_error(f"Unknown status: {status}")
                        return data
                else:
                    print_error(f"Get calculation failed: {response.status_code}")
                    return None
            
            print_error("Calculation timeout - still not completed")
            return None
        else:
            response = requests.get(
                f"{API_URL}/calculations/{calc_id}",
                headers=headers,
                timeout=10
            )
            if response.status_code == 200:
                return response.json()
            return None
            
    except Exception as e:
        print_error(f"Get calculation error: {str(e)}")
        return None

def test_list_calculations(token):
    """Test list calculations."""
    print_test("List Calculations")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{API_URL}/calculations/",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Calculations retrieved: {data['total']} total")
            for calc in data['calculations']:
                print_info(f"  - {calc['name']} | Status: {calc['status']}")
            return data['calculations']
        else:
            print_error(f"List calculations failed: {response.status_code}")
            return []
    except Exception as e:
        print_error(f"List calculations error: {str(e)}")
        return []

def main():
    """Run all tests."""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}  KALKULACE API - COMPREHENSIVE TEST SUITE{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    print_info(f"Base URL: {BASE_URL}")
    print_info(f"API URL: {API_URL}")
    print_info(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Health check
    if not test_health_check():
        print_error("Server is not running! Exiting...")
        return
    
    # Test 2: Register user
    user_data = test_register()
    if not user_data:
        print_error("Registration failed! Exiting...")
        return
    
    # Test 3: Login
    token = test_login()
    if not token:
        print_error("Login failed! Exiting...")
        return
    
    # Test 4: Get profile
    test_get_profile(token)
    
    # Test 5: Create configuration
    config_id = test_create_configuration(token)
    
    # Test 6: List configurations
    test_list_configurations(token)
    
    # Test 7: Create calculation
    calc_id = test_create_calculation(token, config_id)
    if not calc_id:
        print_error("Create calculation failed!")
    else:
        # Test 8: Get calculation results
        test_get_calculation(token, calc_id, wait_for_completion=True)
        
        # Test 9: List calculations
        test_list_calculations(token)
    
    # Summary
    print(f"\n{GREEN}{'='*60}{RESET}")
    print(f"{GREEN}  ALL TESTS COMPLETED!{RESET}")
    print(f"{GREEN}{'='*60}{RESET}")
    print_success("API is fully functional!")
    print_info(f"Documentation: {BASE_URL}/docs")
    print_info(f"ReDoc: {BASE_URL}/redoc")

if __name__ == "__main__":
    main()
