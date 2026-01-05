"""Check what's in data_ready"""
from pathlib import Path
import pickle

root_dir = Path(__file__).parent.parent
data_ready_dir = root_dir / "data_ready"

# Check info_intersection.txt
info_intersection_path = data_ready_dir / "info_intersection.txt"
if info_intersection_path.exists():
    with open(info_intersection_path, 'r', encoding='utf8') as f:
        content = f.read()
    print("=== info_intersection.txt ===")
    print(content)
else:
    print("❌ info_intersection.txt not found")

# Check info_files.txt
info_files_path = data_ready_dir / "info_files.txt"
if info_files_path.exists():
    with open(info_files_path, 'r', encoding='utf8') as f:
        content = f.read()
    print("\n=== info_files.txt ===")
    print(content)
else:
    print("❌ info_files.txt not found")

# Check dataRed.pkl
datared_path = data_ready_dir / "dataRed.pkl"
if datared_path.exists():
    import pandas as pd
    df = pd.read_pickle(datared_path)
    print("\n=== dataRed.pkl ===")
    print(f"Rows: {len(df)}")
    print(f"Columns: {list(df.columns)}")
    if 'Time' in df.columns:
        print(f"Date range: {df['Time'].min()} to {df['Time'].max()}")
    elif 'time' in df.columns:
        print(f"Date range: {df['time'].min()} to {df['time'].max()}")
    print(f"\nFirst 5 rows:")
    print(df.head())
else:
    print("❌ dataRed.pkl not found")
