"""Test run_calculation_task directly"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.calculation import Calculation, CalculationLog
from app.api.v1.calculations import run_calculation_task
import uuid

# Get existing calculation config
db = SessionLocal()
existing = db.query(Calculation).filter(
    Calculation.id == 'c9b1bf83-4301-4ca8-aa05-c36f97fd4cde'
).first()

if not existing:
    print("Source calculation not found!")
    db.close()
    exit(1)

config = existing.input_params
user_id = existing.user_id

# Create new test calculation
test_id = str(uuid.uuid4())
test_calc = Calculation(
    id=test_id,
    user_id=user_id,
    name="Direct Test with Logging",
    status="pending",
    input_params=config
)
db.add(test_calc)
db.commit()
print(f"Created test calculation: {test_id}")
db.close()

# Run task directly
print("\nRunning calculation task...")
try:
    run_calculation_task(test_id, config, user_id)
    print("\n=== Task completed successfully ===")
except Exception as e:
    print(f"\n=== Task failed with error ===")
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

# Check logs
db = SessionLocal()
logs = db.query(CalculationLog).filter(
    CalculationLog.calculation_id == test_id
).order_by(CalculationLog.timestamp).all()

print(f"\n=== LOGS ({len(logs)}) ===")
for log in logs:
    print(f"[{log.log_level}] {log.message}")

# Check result
result = db.query(Calculation).filter(Calculation.id == test_id).first()
print(f"\n=== RESULT ===")
print(f"Status: {result.status}")
print(f"Error: {result.error_message}")
print(f"Execution time: {result.execution_time_seconds}s")
print(f"Has results: {bool(result.results)}")

db.close()
print(f"\nView at: http://localhost:3000/calculations/{test_id}")
