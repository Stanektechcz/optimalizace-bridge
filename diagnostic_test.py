"""Diagnostic test - zjistit co nefunguje."""

import sys
sys.path.insert(0, 'backend')

print("Testing imports...")
try:
    from app.database import engine, Base, get_db
    print("✓ Database imports OK")
except Exception as e:
    print(f"✗ Database import error: {e}")
    
try:
    from app.models.user import User
    print("✓ User model import OK")
except Exception as e:
    print(f"✗ User model import error: {e}")

try:
    from app.core.security import get_password_hash, verify_password
    print("✓ Security imports OK")
except Exception as e:
    print(f"✗ Security import error: {e}")

try:
    from app.services.auth_service import AuthService
    print("✓ AuthService import OK")
except Exception as e:
    print(f"✗ AuthService import error: {e}")

print("\nTesting database connection...")
try:
    conn = engine.connect()
    print("✓ Database connection OK")
    conn.close()
except Exception as e:
    print(f"✗ Database connection error: {e}")

print("\nTesting password hashing...")
try:
    hashed = get_password_hash("TestPass123!")
    print(f"✓ Password hash OK: {hashed[:50]}...")
    verified = verify_password("TestPass123!", hashed)
    print(f"✓ Password verify OK: {verified}")
except Exception as e:
    print(f"✗ Password hashing error: {e}")

print("\nTesting user creation...")
try:
    from sqlalchemy.orm import Session
    from app.schemas.user import UserCreate
    
    db = next(get_db())
    
    # Check if test user exists
    existing = db.query(User).filter(User.username == "diagtest").first()
    if existing:
        db.delete(existing)
        db.commit()
        print("✓ Deleted existing test user")
    
    user_data = UserCreate(
        email="diagtest@test.cz",
        username="diagtest",
        password="TestPass123!",
        full_name="Diag Test"
    )
    
    user = AuthService.create_user(db, user_data)
    print(f"✓ User created: {user.username} (ID: {user.id})")
    
    # Clean up
    db.delete(user)
    db.commit()
    print("✓ Test user deleted")
    
except Exception as e:
    print(f"✗ User creation error: {e}")
    import traceback
    traceback.print_exc()

print("\n✓ Diagnostics complete!")
