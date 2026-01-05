"""Add year tables and metadata columns to calculations table"""
import sys
sys.path.insert(0, 'backend')

from app.database import engine
from sqlalchemy import text

# Add new columns
with engine.connect() as conn:
    try:
        # Add year tables
        print("Adding cost_table_year column...")
        conn.execute(text("ALTER TABLE calculations ADD COLUMN cost_table_year JSON"))
        conn.commit()
    except Exception as e:
        print(f"cost_table_year: {e}")
    
    try:
        print("Adding energy_balance_year column...")
        conn.execute(text("ALTER TABLE calculations ADD COLUMN energy_balance_year JSON"))
        conn.commit()
    except Exception as e:
        print(f"energy_balance_year: {e}")
    
    try:
        print("Adding financial_balance_year column...")
        conn.execute(text("ALTER TABLE calculations ADD COLUMN financial_balance_year JSON"))
        conn.commit()
    except Exception as e:
        print(f"financial_balance_year: {e}")
    
    try:
        print("Adding battery_cycles_year column...")
        conn.execute(text("ALTER TABLE calculations ADD COLUMN battery_cycles_year DECIMAL(10, 2)"))
        conn.commit()
    except Exception as e:
        print(f"battery_cycles_year: {e}")
    
    try:
        print("Adding input_metadata column...")
        conn.execute(text("ALTER TABLE calculations ADD COLUMN input_metadata JSON"))
        conn.commit()
    except Exception as e:
        print(f"input_metadata: {e}")

print("\n✅ Migration completed!")
