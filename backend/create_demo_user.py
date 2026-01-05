"""Create demo user"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
db = SessionLocal()

existing = db.query(User).filter(User.username == 'demo').first()
if existing:
    print('User demo already exists')
    print('Username: demo')
    print('Password: demo123')
else:
    new_user = User(
        username='demo',
        email='demo@test.cz',
        full_name='Demo User',
        password_hash=pwd_context.hash('demo123'),
        is_active=True,
        role='user'
    )
    db.add(new_user)
    db.commit()
    print('Created demo user successfully!')
    print('Username: demo')
    print('Password: demo123')

db.close()
