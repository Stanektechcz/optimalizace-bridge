"""Quick test - are there any calculations in database?"""
from app.database import SessionLocal
from app.models.calculation import Calculation
from app.models.user import User

db = SessionLocal()

# Find admin user
admin = db.query(User).filter(User.username == "admin").first()
if admin:
    print(f"Admin user found: {admin.id}, {admin.email}")
    
    # Get calculations
    calcs = db.query(Calculation).filter(Calculation.user_id == admin.id).all()
    print(f"\nCalculations for admin: {len(calcs)}")
    
    for calc in calcs[:3]:
        print(f"  - {calc.name}: status={calc.status}, created={calc.created_at}")
        print(f"    has results: {bool(calc.results)}")
        print(f"    has cost_table: {bool(calc.cost_table)}")
        print(f"    has energy_balance: {bool(calc.energy_balance)}")
else:
    print("Admin user not found")

db.close()
