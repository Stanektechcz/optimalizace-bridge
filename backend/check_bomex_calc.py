"""Check calculation 202be788-fc95-45b7-b0ef-8810709a3abe"""
from app.database import SessionLocal
from app.models.calculation import Calculation
import json

db = SessionLocal()

calc_id = "202be788-fc95-45b7-b0ef-8810709a3abe"
calc = db.query(Calculation).filter(Calculation.id == calc_id).first()

if calc:
    print(f"Calculation: {calc.name}")
    print(f"Status: {calc.status}")
    print(f"Created: {calc.created_at}")
    print(f"Completed: {calc.completed_at}")
    
    print("\n=== INPUT PARAMS ===")
    print(json.dumps(calc.input_params, indent=2, ensure_ascii=False))
    
    print("\n=== INPUT METADATA ===")
    if calc.input_metadata:
        print(json.dumps(calc.input_metadata, indent=2, ensure_ascii=False))
    else:
        print("No metadata")
    
    print("\n=== RESULTS ===")
    if calc.results:
        print(json.dumps(calc.results, indent=2, ensure_ascii=False))
    else:
        print("No results")
    
    print("\n=== ENERGY BALANCE (full) ===")
    if calc.energy_balance:
        for row in calc.energy_balance:
            if 'label' in row and 'Pouze spotřeba' in row['label']:
                print(f"  {row['label']}: {row.get('value', 'N/A')} MWh")
    
    print("\n=== ENERGY BALANCE (year) ===")
    if calc.energy_balance_year:
        for row in calc.energy_balance_year:
            if 'label' in row and 'Pouze spotřeba' in row['label']:
                print(f"  {row['label']}: {row.get('value', 'N/A')} MWh")
    
    print(f"\n=== BATTERY CYCLES ===")
    print(f"  Full mode: {calc.battery_cycles}")
    print(f"  Year mode: {calc.battery_cycles_year}")
    
else:
    print(f"Calculation {calc_id} not found")

db.close()
