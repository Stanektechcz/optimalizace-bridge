"""Check database query performance"""
import time
from app.database import SessionLocal
from app.models.calculation import Calculation
from app.models.user import User
from sqlalchemy.orm import load_only

db = SessionLocal()

# Find admin user
admin = db.query(User).filter(User.username == "admin").first()
if not admin:
    print("Admin not found")
    exit()

print(f"Testing query performance for user {admin.username}...")

# Test 1: Full query
print("\n1. Full query (all columns):")
start = time.time()
calcs = db.query(Calculation).filter(Calculation.user_id == admin.id).all()
full_time = time.time() - start
print(f"   Time: {full_time*1000:.0f}ms for {len(calcs)} calculations")

# Test 2: Load only specific columns
print("\n2. Load only (lightweight):")
start = time.time()
calcs = db.query(Calculation).options(
    load_only(
        Calculation.id,
        Calculation.user_id,
        Calculation.name,
        Calculation.description,
        Calculation.status,
        Calculation.created_at,
        Calculation.started_at,
        Calculation.completed_at,
        Calculation.error_message,
        Calculation.battery_cycles,
    )
).filter(Calculation.user_id == admin.id).all()
light_time = time.time() - start
print(f"   Time: {light_time*1000:.0f}ms for {len(calcs)} calculations")

print(f"\n3. Speedup: {full_time/light_time:.1f}x")

# Check sizes of JSON fields
print("\n4. Checking JSON field sizes:")
calc = db.query(Calculation).filter(
    Calculation.user_id == admin.id,
    Calculation.cost_table != None
).first()
if calc:
    import json
    print(f"   cost_table: {len(json.dumps(calc.cost_table)) if calc.cost_table else 0} bytes")
    print(f"   energy_balance: {len(json.dumps(calc.energy_balance)) if calc.energy_balance else 0} bytes")
    print(f"   financial_balance: {len(json.dumps(calc.financial_balance)) if calc.financial_balance else 0} bytes")
    print(f"   input_params: {len(json.dumps(calc.input_params)) if calc.input_params else 0} bytes")

db.close()
