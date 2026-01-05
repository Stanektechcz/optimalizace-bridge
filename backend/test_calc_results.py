"""Test calculation results structure"""
import sys
sys.path.insert(0, '.')

from app.services.calculation_engine import calculation_engine
import json

# Test config - minimal valid configuration
test_config = {
    "Obecne": {
        "slozka_diagramy": "data_input/",
        "slozka_zpracovane": "data_ready/"
    },
    "Optimalizace": {
        "optimalizace": True,
        "typOptimalizace": 1,
        "slozitostOptimalizace": 1,
        "optimalizaceDodatek": True
    },
    "Pmax": {
        "maximalni_elektricka_spotreba_kW": 10.0
    },
    "Baterie": {
        "velikost_baterie_kWh": 10.0,
        "maximalni_nabijeci_vykon_baterie_kW": 5.0,
        "maximalni_vybijeci_vykon_baterie_kW": 5.0,
        "ucinnost_nabijeni": 0.95,
        "ucinnost_vybijeni": 0.95,
        "minimalni_stav_nabiti_SoC": 0.1,
        "maximalni_stav_nabiti_SoC": 0.9
    },
    "FVE": {
        "vykon_fve_kWp": 10.0
    },
    "Ceny": {
        "vyse_mesicni_platby_Kc": 500.0,
        "cena_silove_elektriny_Kc_kWh": 1.5,
        "cena_distribuce_Kc_kWh": 1.2,
        "cena_za_prekroceni_Pmax_kW_Kc": 100.0,
        "cena_vykupu_Kc_kWh": 0.5
    },
    "Export": {
        "export": False,
        "exportfile": "export.xlsx"
    },
    "Graf": {
        "stylgrafu": 1,
        "automatickyzobrazitdennigraf": False
    }
}

print("Testing calculation engine...")
print("=" * 60)

try:
    # Validate config first
    is_valid, error_msg = calculation_engine.validate_config(test_config)
    print(f"Config validation: {is_valid}")
    if not is_valid:
        print(f"Error: {error_msg}")
        sys.exit(1)
    
    # Run calculation
    print("\nRunning calculation...")
    results = calculation_engine.calculate(test_config)
    
    print("\n=== RESULTS STRUCTURE ===")
    print(f"Type: {type(results)}")
    print(f"Keys: {list(results.keys())}")
    
    for key, value in results.items():
        if key == "logs":
            print(f"\n{key}: {len(value)} log entries")
            continue
        if isinstance(value, dict):
            print(f"\n{key}:")
            if value:
                print(f"  Type: dict with {len(value)} keys")
                print(f"  Keys: {list(value.keys())}")
                # Show first item of each array
                for subkey, subval in value.items():
                    if isinstance(subval, list) and len(subval) > 0:
                        print(f"    {subkey}: list with {len(subval)} items")
                        print(f"      First item keys: {list(subval[0].keys()) if isinstance(subval[0], dict) else type(subval[0])}")
                    else:
                        print(f"    {subkey}: {type(subval).__name__} = {subval if not isinstance(subval, list) else f'list[{len(subval)}]'}")
            else:
                print(f"  Empty dict")
        elif isinstance(value, list):
            print(f"\n{key}: list with {len(value)} items")
            if len(value) > 0:
                print(f"  First item: {type(value[0]).__name__}")
                if isinstance(value[0], dict):
                    print(f"  Keys: {list(value[0].keys())}")
        else:
            print(f"\n{key}: {type(value).__name__} = {value}")
    
    # Check specific fields that should be saved
    print("\n=== CHECKING SAVE FIELDS ===")
    print(f"results: {type(results.get('results'))} with keys {list(results.get('results', {}).keys())}")
    print(f"cost_table: {type(results.get('cost_table'))} with {len(results.get('cost_table', [])) if isinstance(results.get('cost_table'), list) else 0} items")
    print(f"energy_balance: {type(results.get('energy_balance'))} with {len(results.get('energy_balance', [])) if isinstance(results.get('energy_balance'), list) else 0} items")
    print(f"financial_balance: {type(results.get('financial_balance'))} with {len(results.get('financial_balance', [])) if isinstance(results.get('financial_balance'), list) else 0} items")
    print(f"charts_data: {type(results.get('charts_data'))} with keys {list(results.get('charts_data', {}).keys())}")
    
    # Show sample data
    if results.get('cost_table') and len(results.get('cost_table', [])) > 0:
        print(f"\nSample cost_table[0]: {results['cost_table'][0]}")
    
    if results.get('energy_balance') and len(results.get('energy_balance', [])) > 0:
        print(f"\nSample energy_balance[0]: {results['energy_balance'][0]}")
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
