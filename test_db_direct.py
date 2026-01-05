"""Direct database test for user creation."""

import sys
import os
from dotenv import load_dotenv
import uuid

# Load .env from backend folder
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
env_path = os.path.join(backend_dir, '.env')
load_dotenv(dotenv_path=env_path)

# Add backend to path
sys.path.insert(0, backend_dir)

from app.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

print("Testing user creation directly in database...")

db = SessionLocal()

try:
    # Generate unique user
    unique_id = str(uuid.uuid4())[:8]
    
    test_user = User(
        id=str(uuid.uuid4()),
        email=f"dbtest{unique_id}@example.com",
        username=f"dbtest{unique_id}",
        password_hash=get_password_hash("TestPass123!"),
        full_name="DB Test User",
        role="user",
        is_active=True
    )
    
    print(f"Creating user: {test_user.username}")
    print(f"  Email: {test_user.email}")
    print(f"  ID: {test_user.id}")
    
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    print("\n✓ User created successfully in database!")
    print(f"  Created at: {test_user.created_at}")
    print(f"  Role: {test_user.role}")
    
    # Verify
    verify = db.query(User).filter(User.username == test_user.username).first()
    if verify:
        print(f"\n✓ Verification successful: User '{verify.username}' found in database")
    else:
        print("\n✗ Verification failed: User not found")
        
except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()

print("\nDone!")
