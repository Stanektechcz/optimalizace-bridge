"""Initialize database with first admin user."""

import sys
sys.path.insert(0, '.')

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.core.security import get_password_hash
from app.core.config import settings
import uuid


def init_db():
    """Initialize database with first admin user."""
    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created")
    
    # Create session
    db = SessionLocal()
    
    try:
        # Check if admin user exists
        admin = db.query(User).filter(User.email == settings.FIRST_ADMIN_EMAIL).first()
        
        if admin:
            print(f"✅ Admin user already exists: {admin.email}")
            return
        
        # Create admin user
        admin_user = User(
            email=settings.FIRST_ADMIN_EMAIL,
            username=settings.FIRST_ADMIN_USERNAME,
            password_hash=get_password_hash(settings.FIRST_ADMIN_PASSWORD),
            full_name="System Administrator",
            role="admin",
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Admin user created successfully!")
        print(f"   Email: {admin_user.email}")
        print(f"   Username: {admin_user.username}")
        print(f"   Password: {settings.FIRST_ADMIN_PASSWORD}")
        print(f"   Role: {admin_user.role}")
        print("")
        print("⚠️  IMPORTANT: Change the admin password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 Initializing database...")
    print("")
    init_db()
    print("")
    print("✅ Database initialization complete!")
