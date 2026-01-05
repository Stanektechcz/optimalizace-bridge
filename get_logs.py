import requests
import sys

calc_id = sys.argv[1] if len(sys.argv) > 1 else "4a188733-7976-4a6b-b738-dae9348e1b32"

r = requests.post('http://localhost:8000/api/v1/auth/login', data={'username': 'admin', 'password': 'Admin123'})
token = r.json()['access_token']

logs = requests.get(f'http://localhost:8000/api/v1/calculations/{calc_id}/logs', headers={'Authorization': f'Bearer {token}'})

for log in logs.json()['logs']:
    print(f"{log['timestamp']} [{log['level']}] {log['message']}")
