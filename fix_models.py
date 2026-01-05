"""Fix models for MySQL compatibility - replace JSONB with JSON and UUID with String(36)."""

import os
import re

# Use absolute path
base_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(base_dir, "backend", "app", "models")

files_to_fix = [
    "user.py",
    "file.py",
    "calculation.py",
    "configuration.py",
    "api_key.py",
    "audit_log.py",
]

for filename in files_to_fix:
    filepath = os.path.join(models_dir, filename)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace PostgreSQL specific imports
    content = re.sub(
        r'from sqlalchemy\.dialects\.postgresql import.*',
        'from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, BigInteger, Date, JSON',
        content
    )
    
    # Replace JSONB with JSON
    content = content.replace('JSONB', 'JSON')
    
    # Replace UUID column types with String(36)
    content = re.sub(
        r'Column\(UUID\(as_uuid=True\)',
        'Column(String(36)',
        content
    )
    
    # Replace uuid.uuid4 default with str(uuid.uuid4())
    content = re.sub(
        r'default=uuid\.uuid4',
        'default=lambda: str(uuid.uuid4())',
        content
    )
    
    # Fix INET type (only in audit_log.py)
    if filename == 'audit_log.py':
        content = content.replace('Column(INET)', 'Column(String(45))')  # IPv6 max length
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Fixed {filename}")

print("\n✅ All models fixed for MySQL compatibility!")
