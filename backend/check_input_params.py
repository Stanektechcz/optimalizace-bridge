"""Check input_params structure"""
from app.database import SessionLocal
from app.models.calculation import Calculation
import json

db = SessionLocal()

calc_id = "202be788-fc95-45b7-b0ef-8810709a3abe"
calc = db.query(Calculation).filter(Calculation.id == calc_id).first()

print("=== INPUT PARAMS ===")
print(json.dumps(calc.input_params, indent=2))

print("\n=== FILE IDS ===")
print(f"file_ids: {calc.file_ids}")

print("\n=== LOOKING FOR FILE REFERENCE ===")
params_str = json.dumps(calc.input_params)
if "file" in params_str.lower():
    print("Found 'file' in params!")
if "alfa" in params_str.lower():
    print("Found 'alfa' in params!")
if "bomex" in params_str.lower():
    print("Found 'bomex' in params!")

db.close()
