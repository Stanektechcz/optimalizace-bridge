"""Check full results structure"""
import sys
sys.path.insert(0, 'backend')

from app.database import SessionLocal
from app.models.calculation import Calculation
import json

db = SessionLocal()

calc_id = "cf6db97d-8e08-4ca2-a564-4f5128e0ca90"
calc = db.query(Calculation).filter(Calculation.id == calc_id).first()

if calc and calc.results:
    print("Full results structure:")
    print(json.dumps(calc.results, indent=2, default=str))
else:
    print("No results found")

db.close()
