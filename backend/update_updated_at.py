"""Update all updated_at NULL values across tables."""

from app.database import engine
from sqlalchemy import text

def update_all_tables():
    """Update updated_at to created_at where NULL."""
    tables = ['users', 'calculations', 'configurations']
    
    with engine.connect() as conn:
        for table in tables:
            try:
                result = conn.execute(text(f'UPDATE {table} SET updated_at = created_at WHERE updated_at IS NULL'))
                count = result.rowcount
                print(f"✓ Updated {count} rows in {table}")
            except Exception as e:
                print(f"✗ Error updating {table}: {e}")
        
        conn.commit()
        print("\n✓ All tables updated successfully!")

if __name__ == "__main__":
    update_all_tables()
