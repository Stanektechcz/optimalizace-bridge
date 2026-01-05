"""Check if year tables are stored in separate columns"""
import sys
sys.path.insert(0, 'backend')

from app.database import SessionLocal
from app.models.calculation import Calculation

db = SessionLocal()
calc_id = "cf6db97d-8e08-4ca2-a564-4f5128e0ca90"
calc = db.query(Calculation).filter(Calculation.id == calc_id).first()

if calc:
    print(f"Calculation: {calc.name}")
    print(f"Status: {calc.status}")
    print(f"Started: {calc.started_at}")
    print(f"Completed: {calc.completed_at}")
    
    print(f"\nResults columns:")
    print(f"  cost_table: {calc.cost_table is not None} ({len(calc.cost_table) if calc.cost_table else 0} rows)")
    print(f"  cost_table_year: {calc.cost_table_year is not None} ({len(calc.cost_table_year) if calc.cost_table_year else 0} rows)")
    print(f"  energy_balance: {calc.energy_balance is not None} ({len(calc.energy_balance) if calc.energy_balance else 0} rows)")
    print(f"  energy_balance_year: {calc.energy_balance_year is not None} ({len(calc.energy_balance_year) if calc.energy_balance_year else 0} rows)")
    print(f"  financial_balance: {calc.financial_balance is not None} ({len(calc.financial_balance) if calc.financial_balance else 0} rows)")
    print(f"  financial_balance_year: {calc.financial_balance_year is not None} ({len(calc.financial_balance_year) if calc.financial_balance_year else 0} rows)")
    print(f"  input_metadata: {calc.input_metadata is not None}")
    
    # Print first row of energy_balance if present
    if calc.energy_balance and len(calc.energy_balance) > 0:
        print(f"\nenergy_balance first row:")
        print(calc.energy_balance[0])
    
    # Print first row of energy_balance_year if present
    if calc.energy_balance_year and len(calc.energy_balance_year) > 0:
        print(f"\nenergy_balance_year first row:")
        print(calc.energy_balance_year[0])
else:
    print("Calculation not found")

db.close()
