"""Check _intersected.pkl structure"""
import pandas as pd
from pathlib import Path

intersected_path = Path("..") / "data_ready" / "_intersected.pkl"

if intersected_path.exists():
    df = pd.read_pickle(intersected_path)
    
    print("=== _INTERSECTED.PKL ===")
    print(f"Columns: {list(df.columns)}")
    print(f"Rows: {len(df)}")
    print(f"\nFirst 5 rows:")
    print(df.head())
else:
    print("❌ _intersected.pkl not found")
