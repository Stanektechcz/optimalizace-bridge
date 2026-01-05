"""Check old prices.pkl structure"""
import pandas as pd
from pathlib import Path

prices_path = Path("..") / "data_ready" / "prices.pkl"

# Backup current to .new
prices_new_path = Path("..") / "data_ready" / "prices.pkl.new"
import shutil
if prices_path.exists() and not prices_new_path.exists():
    shutil.copy2(prices_path, prices_new_path)

# Load old backup
prices_old_path = Path("..") / "data_ready" / "prices.pkl.old"
if not prices_old_path.exists():
    # Try reading from data_ready/ceny_2024.xlsx to see structure
    print("No old backup, checking ceny_2024.xlsx...")
    ceny_path = Path("..") / "data_ready" / "ceny_2024.xlsx"
    if ceny_path.exists():
        df = pd.read_excel(ceny_path, nrows=20)
        print(f"Columns in ceny_2024.xlsx: {list(df.columns)}")
        print(df.head())
else:
    df = pd.read_pickle(prices_old_path)
    print("=== OLD PRICES.PKL ===")
    print(f"Columns: {list(df.columns)}")
    print(f"Rows: {len(df)}")
    print(f"\nFirst 10 rows:")
    print(df.head(10))
