"""Check original Bomex file content"""
from app.database import SessionLocal
from app.models.file import File
import pandas as pd
from pathlib import Path

db = SessionLocal()

file_id = "9fbeb292-2f6d-404c-b2ca-9bbd5988f940"
file_obj = db.query(File).filter(File.id == file_id).first()

if not file_obj:
    print(f"❌ File {file_id} not found")
    exit()

print(f"=== FILE INFO ===")
print(f"Original filename: {file_obj.original_filename}")
print(f"Stored filename: {file_obj.stored_filename}")
print(f"File path: {file_obj.file_path}")
print(f"Rows count: {file_obj.rows_count}")
print(f"File metadata: {file_obj.file_metadata}")

# Read the actual file
file_path = Path(file_obj.file_path)
if not file_path.exists():
    print(f"\n❌ File not found on disk: {file_path}")
    exit()

print(f"\n=== READING FILE ===")
if file_path.suffix == '.xlsx':
    df = pd.read_excel(file_path)
elif file_path.suffix == '.csv':
    df = pd.read_csv(file_path)
else:
    print(f"❌ Unsupported file format: {file_path.suffix}")
    exit()

print(f"Rows: {len(df)}")
print(f"Columns: {list(df.columns)}")

# Try to find time column
time_col = None
for col in df.columns:
    if 'time' in col.lower() or 'datum' in col.lower() or 'date' in col.lower():
        time_col = col
        break

if time_col:
    print(f"\nTime column: {time_col}")
    print(f"Date range: {df[time_col].min()} to {df[time_col].max()}")
    print(f"\nFirst 10 rows:")
    print(df[[time_col]].head(10))
    print(f"\nLast 10 rows:")
    print(df[[time_col]].tail(10))
else:
    print("\n❌ No time column found")
    print(f"\nFirst 5 rows:")
    print(df.head())

db.close()
