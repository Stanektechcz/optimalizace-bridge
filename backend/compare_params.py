"""Compare parameters between database calculation and settings.ini"""
import sys
sys.path.insert(0, 'backend')

from app.database import SessionLocal
from app.models.calculation import Calculation
import json

# Load from database
db = SessionLocal()
calc_id = "cf6db97d-8e08-4ca2-a564-4f5128e0ca90"
calc = db.query(Calculation).filter(Calculation.id == calc_id).first()

if calc:
    input_params = calc.input_params
    
    print("=== DATABASE PARAMETERS ===")
    print("\n[Optimalizace]")
    for key, val in input_params.get('Optimalizace', {}).items():
        print(f"{key} = {val}")
    
    print("\n[Baterie]")
    for key, val in input_params.get('Baterie', {}).items():
        print(f"{key} = {val}")
    
    print("\n[FVE]")
    for key, val in input_params.get('FVE', {}).items():
        print(f"{key} = {val}")
    
    print("\n[Ceny]")
    for key, val in input_params.get('Ceny', {}).items():
        print(f"{key} = {val}")
    
    print("\n[Pmax]")
    for key, val in input_params.get('Pmax', {}).items():
        print(f"{key} = {val}")

db.close()

# Load from settings.ini
from configparser import ConfigParser
import os
config = ConfigParser()
settings_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'settings.ini')
config.read(settings_path)

print("\n\n=== SETTINGS.INI ===")
print("\n[Optimalizace]")
for key, val in config.items('Optimalizace'):
    print(f"{key} = {val}")

print("\n[Baterie]")
for key, val in config.items('Baterie'):
    print(f"{key} = {val}")

print("\n[FVE]")
for key, val in config.items('FVE'):
    print(f"{key} = {val}")

print("\n[Ceny]")
for key, val in config.items('Ceny'):
    print(f"{key} = {val}")

print("\n[Pmax]")
for key, val in config.items('Pmax'):
    print(f"{key} = {val}")
