"""Create admin user directly in database."""

import sys
import os
from dotenv import load_dotenv

# Load .env from backend folder BEFORE importing anything
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
env_path = os.path.join(backend_dir, '.env')
load_dotenv(dotenv_path=env_path)

# Add backend to path
sys.path.insert(0, backend_dir)

from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
import uuid

print("Creating admin user...")

db = SessionLocal()

try:
    # Check if admin exists
    admin = db.query(User).filter(User.username == "admin").first()
    
    if admin:
        print(f"✓ Admin user already exists: {admin.username}")
        print(f"  Email: {admin.email}")
        print(f"  ID: {admin.id}")
        
        # Update password to ensure it's correct
        print("  Updating password to 'Admin123'...")
        admin.password_hash = get_password_hash("Admin123")
        db.commit()
        print("  ✓ Password updated!")
    else:
        # Create admin
        print("Creating new admin user...")
        admin = User(
            id=str(uuid.uuid4()),
            email="admin@electree.cz",
            username="admin",
            password_hash=get_password_hash("Admin123"),
            full_name="Administrator",
            role="admin",
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print(f"✓ Admin user created successfully!")
        print(f"  Username: {admin.username}")
        print(f"  Email: {admin.email}")
        print(f"  Password: Admin123")
        print(f"  ID: {admin.id}")
        print(f"  Role: {admin.role}")

except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()

print("\n✓ Done!")
