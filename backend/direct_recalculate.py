"""Directly recalculate using database"""
import sys
sys.path.insert(0, 'backend')

from app.database import SessionLocal
from app.models.calculation import Calculation, CalculationLog
from app.services.calculation_engine import calculation_engine
from datetime import datetime

db = SessionLocal()

calc_id = "cf6db97d-8e08-4ca2-a564-4f5128e0ca90"
calc = db.query(Calculation).filter(Calculation.id == calc_id).first()

if calc:
    print(f"Found calculation: {calc.name}")
    print(f"Current status: {calc.status}")
    
    # Clear old results
    calc.results = None
    calc.cost_table = None
    calc.energy_balance = None
    calc.financial_balance = None
    calc.cost_table_year = None
    calc.energy_balance_year = None
    calc.financial_balance_year = None
    calc.battery_cycles_year = None
    calc.input_metadata = None
    calc.status = 'running'
    calc.started_at = datetime.utcnow()
    calc.completed_at = None
    calc.error_message = None
    
    # Clear old logs
    db.query(CalculationLog).filter(CalculationLog.calculation_id == calc_id).delete()
    
    db.commit()
    
    print("Running calculation...")
    
    try:
        results = calculation_engine.calculate(calc.input_params)
        
        # Update with results
        calc.status = 'completed'
        calc.completed_at = datetime.utcnow()
        
        # Store results
        calc.results = results.get("results")
        calc.cost_table = results.get("cost_table")
        calc.energy_balance = results.get("energy_balance")
        calc.financial_balance = results.get("financial_balance")
        calc.charts_data = results.get("charts_data")
        
        # Year tables
        calc.cost_table_year = results.get("cost_table_year")
        calc.energy_balance_year = results.get("energy_balance_year")
        calc.financial_balance_year = results.get("financial_balance_year")
        calc.battery_cycles_year = results.get("results", {}).get("battCyclesYear")
        
        # Metadata
        calc.input_metadata = results.get("input_metadata")
        
        db.commit()
        
        print(f"\n✅ Calculation completed successfully!")
        print(f"\nResults:")
        print(f"  results: {calc.results is not None}")
        if calc.results:
            print(f"  - battCycles: {calc.results.get('battCycles')}")
            print(f"  - battCyclesYear: {calc.results.get('battCyclesYear')}")
            print(f"  - timeString: {calc.results.get('timeString')}")
        
        print(f"\nTables:")
        print(f"  cost_table: {len(calc.cost_table) if calc.cost_table else 0} rows")
        print(f"  cost_table_year: {len(calc.cost_table_year) if calc.cost_table_year else 0} rows")
        print(f"  energy_balance: {len(calc.energy_balance) if calc.energy_balance else 0} rows")
        print(f"  energy_balance_year: {len(calc.energy_balance_year) if calc.energy_balance_year else 0} rows")
        print(f"  input_metadata: {calc.input_metadata is not None}")
        
        if calc.energy_balance and len(calc.energy_balance) > 0:
            print(f"\n✅ Energy balance (full): {calc.energy_balance[0]}")
        
        if calc.energy_balance_year and len(calc.energy_balance_year) > 0:
            print(f"✅ Energy balance (year): {calc.energy_balance_year[0]}")
        
    except Exception as e:
        calc.status = 'failed'
        calc.error_message = str(e)
        calc.completed_at = datetime.utcnow()
        db.commit()
        print(f"❌ Calculation failed: {e}")
        import traceback
        traceback.print_exc()

else:
    print("Calculation not found")

db.close()
