"""Get user info for calculation"""
import sys
sys.path.insert(0, 'backend')

from app.database import SessionLocal
from app.models.calculation import Calculation
from app.models.user import User

db = SessionLocal()

calc_id = "cf6db97d-8e08-4ca2-a564-4f5128e0ca90"
calc = db.query(Calculation).filter(Calculation.id == calc_id).first()

if calc:
    user = db.query(User).filter(User.id == calc.user_id).first()
    if user:
        print(f"Calculation owner:")
        print(f"  Email: {user.email}")
        print(f"  Username: {user.username}")
        print(f"  Full name: {user.full_name}")
        print(f"  Is admin: {user.is_admin}")
    else:
        print(f"User not found: {calc.user_id}")
else:
    print("Calculation not found")

db.close()
