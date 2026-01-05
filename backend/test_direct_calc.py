"""Direct database test - create and run calculation"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.calculation import Calculation
from app.models.user import User
from app.api.v1.calculations import run_calculation_task
from datetime import datetime
import uuid

# Get config from successful calculation
db = SessionLocal()
existing_calc = db.query(Calculation).filter(
    Calculation.id == 'c9b1bf83-4301-4ca8-aa05-c36f97fd4cde'
).first()

if not existing_calc:
    print("Previous calculation not found!")
    db.close()
    exit(1)

input_params = existing_calc.input_params
user_id = existing_calc.user_id

# Create new calculation
new_calc_id = str(uuid.uuid4())
new_calc = Calculation(
    id=new_calc_id,
    user_id=user_id,
    name="Direct Test - Background Task Fix",
    description="Testing background task with new DB session",
    status="pending",
    input_params=input_params
)

db.add(new_calc)
db.commit()
print(f"✓ Created calculation: {new_calc_id}")
db.close()

# Run calculation task directly
print("\nRunning calculation task...")
try:
    run_calculation_task(new_calc_id, input_params, user_id)
    print("✓ Task completed without errors")
except Exception as e:
    print(f"✗ Task failed: {e}")
    import traceback
    traceback.print_exc()

# Check result
db = SessionLocal()
result_calc = db.query(Calculation).filter(Calculation.id == new_calc_id).first()

print(f"\n=== RESULT ===")
print(f"Status: {result_calc.status}")
print(f"Progress: {result_calc.progress}")
print(f"Error: {result_calc.error_message}")
print(f"Execution time: {result_calc.execution_time_seconds}s")
print(f"Has results: {bool(result_calc.results)}")
print(f"Has cost_table: {bool(result_calc.cost_table)}")
print(f"Has energy_balance: {bool(result_calc.energy_balance)}")
print(f"Has charts_data: {bool(result_calc.charts_data)}")

if result_calc.results:
    print(f"\nResults keys: {list(result_calc.results.keys())}")
    if 'battCycles' in result_calc.results:
        print(f"Battery cycles: {result_calc.results['battCycles']}")

if result_calc.cost_table:
    print(f"\nCost table rows: {len(result_calc.cost_table)}")
    print(f"First row: {result_calc.cost_table[0]}")

db.close()
print(f"\n✓ Test completed. Calculation ID: {new_calc_id}")
print(f"View at: http://localhost:3000/calculations/{new_calc_id}/results")
