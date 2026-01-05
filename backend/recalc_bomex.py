"""Recalculate Bomex calculation"""
from app.database import SessionLocal
from app.models.calculation import Calculation
from app.models.file import File
from app.services.calculation_engine import calculation_engine
from pathlib import Path
import shutil

db = SessionLocal()

calc_id = "202be788-fc95-45b7-b0ef-8810709a3abe"
calc = db.query(Calculation).filter(Calculation.id == calc_id).first()

if not calc:
    print(f"Calculation {calc_id} not found")
    exit()

print(f"Recalculating: {calc.name}")
print(f"File IDs: {calc.file_ids}")
print(f"Input params: {calc.input_params}")

# Fix vnutitrokspotreby - should match file year (2023), not 2024
if calc.input_params.get('Optimalizace', {}).get('vnutitrokspotreby') == 2024:
    print("\n⚠️  WARNING: vnutitrokspotreby=2024 but file is from 2023. Fixing...")
    calc.input_params['Optimalizace']['vnutitrokspotreby'] = 2023
    print(f"   Changed vnutitrokspotreby to 2023")

# Clear old results
print("\nClearing old results...")
calc.results = None
calc.cost_table = None
calc.cost_table_year = None
calc.energy_balance = None
calc.energy_balance_year = None
calc.financial_balance = None
calc.financial_balance_year = None
calc.charts_data = None
calc.battery_cycles = None
calc.battery_cycles_year = None
calc.input_metadata = None
db.commit()

# Prepare input files
print("\n=== PREPARING INPUT FILES ===")
root_dir = Path(__file__).parent.parent
data_input_dir = root_dir / "data_input"
data_ready_dir = root_dir / "data_ready"

# Clean data_input directory
if data_input_dir.exists():
    for file in data_input_dir.glob("*.xlsx"):
        file.unlink()
    for file in data_input_dir.glob("*.csv"):
        file.unlink()
else:
    data_input_dir.mkdir(parents=True, exist_ok=True)

# Ensure data_ready exists
data_ready_dir.mkdir(parents=True, exist_ok=True)

# Copy files from database to data_input
file_names = []
earliest_date = None
latest_date = None
total_hours = 0

for file_id in calc.file_ids:
    file_obj = db.query(File).filter(File.id == file_id).first()
    if not file_obj:
        print(f"❌ File {file_id} not found in database")
        exit()
    
    # Copy file to data_input
    source_path = Path(file_obj.file_path)
    if not source_path.exists():
        print(f"❌ File not found on disk: {source_path}")
        exit()
    
    dest_path = data_input_dir / file_obj.original_filename
    shutil.copy2(source_path, dest_path)
    print(f"✅ Copied {file_obj.original_filename} to data_input/")
    
    file_names.append(file_obj.original_filename)
    
    # Track date range
    if file_obj.file_metadata:
        file_date_from = file_obj.file_metadata.get('date_from')
        file_date_to = file_obj.file_metadata.get('date_to')
        file_hours = file_obj.file_metadata.get('total_hours', file_obj.rows_count)
        
        if file_date_from:
            if earliest_date is None or file_date_from < earliest_date:
                earliest_date = file_date_from
        if file_date_to:
            if latest_date is None or file_date_to > latest_date:
                latest_date = file_date_to
        if file_hours:
            total_hours += file_hours

# Create info_files.txt
info_files_path = data_ready_dir / "info_files.txt"
with open(info_files_path, 'w', encoding='utf8') as f:
    if earliest_date and latest_date:
        f.write(f"{earliest_date};{latest_date};{total_hours}\n")
    else:
        f.write(";;0\n")
    for fname in file_names:
        f.write(f"{fname}\n")

print(f"\n✅ Created info_files.txt with {len(file_names)} file(s)")
print(f"   Date range: {earliest_date} to {latest_date}")
print(f"   Total hours: {total_hours}")

# Process consumption files to create consumption.pkl
print("\n=== PROCESSING CONSUMPTION FILES ===")
import sys
sys.path.insert(0, str(root_dir / "libs"))
from libs.load import readExcel

# Read all consumption files and create consumption.pkl
consumption_frames = []
for fname in file_names:
    file_path = data_input_dir / fname
    print(f"Processing {fname}...")
    df = readExcel(str(file_path))
    consumption_frames.append(df)

# If multiple files, merge them
if len(consumption_frames) == 1:
    consumption_df = consumption_frames[0]
else:
    # Merge multiple files (intersection logic from loadData)
    import numpy as np
    ids = [None for i in range(len(consumption_frames))]
    for i in range(len(ids)):
        ids[i] = [(d + pd.Timedelta(h-1, 'h')).strftime('%Y%m%d%H') for d, h in zip(consumption_frames[i]['Den'], consumption_frames[i]['Hodina'])]
    
    monolith = np.concatenate(ids)
    unq, counts = np.unique(monolith, return_counts=True)
    subset = unq[counts == len(ids)]
    
    inds = [np.intersect1d(idi, subset, return_indices=True)[1] for idi in ids]
    
    for i, frame in enumerate(consumption_frames):
        consumption_frames[i] = frame.iloc[inds[i]].reset_index(drop=True)
    
    consumption_df = consumption_frames[0].copy()
    for i in range(1, len(consumption_frames)):
        consumption_df['kWh'] += consumption_frames[i]['kWh']

# Save consumption.pkl
consumption_df.to_pickle(data_ready_dir / 'consumption.pkl')
print(f"✅ Created consumption.pkl with {len(consumption_df)} rows")

# Run calculation
print("\nRunning calculation...")
try:
    results = calculation_engine.calculate(calc.input_params)
    
    print("\n=== NEW RESULTS ===")
    print(f"Results metadata: {results.get('results')}")
    print(f"Input metadata: {results.get('input_metadata')}")
    
    # Store results
    calc.results = results.get("results")
    calc.cost_table = results.get("cost_table")
    calc.cost_table_year = results.get("cost_table_year")
    calc.energy_balance = results.get("energy_balance")
    calc.energy_balance_year = results.get("energy_balance_year")
    calc.financial_balance = results.get("financial_balance")
    calc.financial_balance_year = results.get("financial_balance_year")
    calc.charts_data = results.get("charts_data")
    calc.battery_cycles = results.get("results", {}).get("battCycles")
    calc.battery_cycles_year = results.get("results", {}).get("battCyclesYear")
    calc.input_metadata = results.get("input_metadata")
    calc.status = "completed"
    
    db.commit()
    
    print("\n✅ Calculation recalculated successfully!")
    
    # Show energy balance
    print("\n=== ENERGY BALANCE (full) ===")
    if calc.energy_balance:
        for row in calc.energy_balance:
            if 'label' in row:
                print(f"  {row['label']}: {row.get('value', 'N/A')} MWh")
    
    print("\n=== ENERGY BALANCE (year) ===")
    if calc.energy_balance_year:
        for row in calc.energy_balance_year:
            if 'label' in row:
                print(f"  {row['label']}: {row.get('value', 'N/A')} MWh")
    
except Exception as e:
    print(f"\n❌ Calculation failed: {e}")
    import traceback
    traceback.print_exc()

db.close()
