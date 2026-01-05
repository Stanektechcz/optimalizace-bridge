"""Check calculation input_params to see DateRange structure"""
import sys
sys.path.insert(0, 'backend')

from app.database import SessionLocal
from app.models.calculation import Calculation
import json

db = SessionLocal()

# Get the specific calculation (replace with actual ID if different)
calc_id = input("Enter calculation ID (or press Enter for latest): ").strip()

if calc_id:
    calc = db.query(Calculation).filter(Calculation.id == calc_id).first()
else:
    # Get latest calculation
    calc = db.query(Calculation).order_by(Calculation.created_at.desc()).first()

if calc:
    print(f"\nCalculation: {calc.name}")
    print(f"ID: {calc.id}")
    print(f"Created: {calc.created_at}")
    print(f"Status: {calc.status}")
    
    input_params = calc.input_params
    print(f"\nDateRange in input_params:")
    date_range = input_params.get('DateRange', {})
    print(json.dumps(date_range, indent=2))
    
    print(f"\nFull input_params structure:")
    print(json.dumps(input_params, indent=2))
else:
    print("No calculation found")

db.close()
