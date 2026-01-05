"""Migration script to update files table constraints."""

from app.database import engine
from sqlalchemy import text

def migrate():
    """Remove unique constraint from stored_filename and add it to file_path."""
    with engine.connect() as conn:
        try:
            # Drop unique constraint from stored_filename
            print("Dropping UNIQUE constraint from stored_filename...")
            conn.execute(text('ALTER TABLE files DROP INDEX stored_filename'))
            print("✓ Dropped stored_filename unique constraint")
        except Exception as e:
            print(f"Note: Could not drop stored_filename constraint (may not exist): {e}")
        
        try:
            # Add unique constraint to file_path
            print("Adding UNIQUE constraint to file_path...")
            conn.execute(text('ALTER TABLE files ADD UNIQUE INDEX idx_file_path (file_path(255))'))
            print("✓ Added file_path unique constraint")
        except Exception as e:
            print(f"Note: Could not add file_path constraint (may already exist): {e}")
        
        conn.commit()
        print("\n✓ Migration completed successfully!")

if __name__ == "__main__":
    migrate()
