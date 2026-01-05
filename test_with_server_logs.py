"""Start server with debug logging and test registration."""

import subprocess
import time
import requests
import json
import uuid
import sys

print("=" * 60)
print("SERVER DEBUG TEST")
print("=" * 60)

# Start server in subprocess with debug logging
print("\n1. Starting server with debug logging...")
server_process = subprocess.Popen(
    [
        r".\backend\venv\Scripts\python.exe",
        "-m", "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--log-level", "debug"
    ],
    cwd=r"C:\Users\lenka\OneDrive\Plocha\Optimalizace-Bridge\backend",
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1
)

# Wait for server to start
print("   Waiting for server startup...")
time.sleep(5)

try:
    # Check if server is running
    print("\n2. Checking server health...")
    health_response = requests.get("http://localhost:8000/health", timeout=5)
    if health_response.status_code == 200:
        print(f"   ✓ Server is healthy")
    else:
        print(f"   ✗ Unhealthy response: {health_response.status_code}")
        server_process.terminate()
        sys.exit(1)
    
    # Test registration
    print("\n3. Testing user registration...")
    unique_id = str(uuid.uuid4())[:8]
    user_data = {
        "email": f"debugtest{unique_id}@example.com",
        "username": f"debugtest{unique_id}",
        "password": "TestPass123!",
        "full_name": "Debug Test User"
    }
    
    print(f"   Registering: {user_data['username']}")
    
    response = requests.post(
        "http://localhost:8000/api/v1/auth/register",
        json=user_data,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"\n4. Registration response:")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 201:
        print(f"   ✓ SUCCESS!")
        print(json.dumps(response.json(), indent=4))
    else:
        print(f"   ✗ FAILED: {response.text}")
        
        # Read some server output
        print(f"\n5. Server output (last 50 lines):")
        try:
            # Try to read from stdout
            output_lines = []
            while True:
                line = server_process.stdout.readline()
                if not line:
                    break
                output_lines.append(line.strip())
                if len(output_lines) > 50:
                    output_lines.pop(0)
            
            for line in output_lines:
                print(f"   {line}")
        except:
            print("   (Could not read server output)")

finally:
    # Cleanup
    print("\n6. Stopping server...")
    server_process.terminate()
    server_process.wait(timeout=5)
    print("   ✓ Server stopped")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
