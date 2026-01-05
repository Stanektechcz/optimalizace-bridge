"""Drop all tables and recreate fresh database."""

import sys
sys.path.insert(0, '.')

from app.database import engine, Base
from app.models import user, file, calculation, configuration, api_key, audit_log


def reset_db():
    """Drop all tables and recreate them."""
    print("⚠️  WARNING: This will delete all data in the database!")
    print("")
    
    # Drop all tables
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("✅ All tables dropped")
    
    # Create all tables
    print("")
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created")
    print("")
    print("✅ Database reset complete!")
    print("")
    print("Run 'python init_db.py' to create admin user.")


if __name__ == "__main__":
    print("🔄 Resetting database...")
    print("")
    reset_db()
