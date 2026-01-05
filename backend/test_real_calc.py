"""Simple test to see what calculation_engine returns"""
import sys
sys.path.insert(0, '.')

from app.services.calculation_engine import calculation_engine
from app.database import SessionLocal
from app.models.calculation import Calculation
import json

# Get config from successful calculation
db = SessionLocal()
calc = db.query(Calculation).filter(Calculation.id == 'c9b1bf83-4301-4ca8-aa05-c36f97fd4cde').first()
config = calc.input_params
db.close()

print("Running calculation with real config...")
print("=" * 60)

try:
    results = calculation_engine.calculate(config)
    
    print("\n=== RESULTS KEYS ===")
    for key in results.keys():
        print(f"  - {key}")
    
    print("\n=== RESULTS CONTENT ===")
    print(f"results: {type(results.get('results'))} = {results.get('results') is not None}")
    if results.get('results'):
        print(f"  Keys: {list(results['results'].keys())}")
        for k, v in results['results'].items():
            if isinstance(v, list):
                print(f"    {k}: list[{len(v)}]")
            else:
                print(f"    {k}: {type(v).__name__} = {v}")
    
    print(f"\ncost_table: {type(results.get('cost_table'))} = {results.get('cost_table') is not None}")
    if results.get('cost_table'):
        print(f"  Length: {len(results['cost_table'])}")
        if len(results['cost_table']) > 0:
            print(f"  First item: {results['cost_table'][0]}")
    
    print(f"\nenergy_balance: {type(results.get('energy_balance'))} = {results.get('energy_balance') is not None}")
    if results.get('energy_balance'):
        print(f"  Length: {len(results['energy_balance'])}")
        if len(results['energy_balance']) > 0:
            print(f"  First item: {results['energy_balance'][0]}")
    
    print(f"\ncharts_data: {type(results.get('charts_data'))} = {results.get('charts_data') is not None}")
    if results.get('charts_data'):
        print(f"  Keys: {list(results['charts_data'].keys())}")
        if 'data' in results['charts_data'] and results['charts_data']['data']:
            print(f"  data length: {len(results['charts_data']['data'])}")
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
