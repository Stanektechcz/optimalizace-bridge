"""Check if calculation was actually recalculated (results should be None after recalculate)"""
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
    print(f"Started at: {calc.started_at}")
    print(f"Completed at: {calc.completed_at}")
    print(f"Results present: {calc.results is not None}")
    
    if calc.results:
        print(f"Results keys: {list(calc.results.keys())}")
        
        # Check summary values
        if 'summary' in calc.results:
            summary = calc.results['summary']
            print(f"\nSummary consumption_only: {summary.get('consumption_only_energy_wh')}")
else:
    print("Calculation not found")

db.close()
