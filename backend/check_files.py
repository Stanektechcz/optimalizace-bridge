"""Find Bomex file and check calculation files"""
from app.database import SessionLocal
from app.models.file import File
from app.models.calculation import Calculation

db = SessionLocal()

# Find Bomex file
print("=== SEARCHING FOR BOMEX FILE ===")
bomex_files = db.query(File).filter(File.original_filename.like('%Bomex%')).all()
for f in bomex_files:
    print(f"  ID: {f.id}")
    print(f"  Filename: {f.original_filename}")
    print(f"  Date range: {f.date_from} to {f.date_to}")
    print(f"  Rows: {f.rows_count}")
    print()

# Find Alfa estate file
print("=== SEARCHING FOR ALFA ESTATE FILE ===")
alfa_files = db.query(File).filter(File.original_filename.like('%Alfa%')).all()
for f in alfa_files:
    print(f"  ID: {f.id}")
    print(f"  Filename: {f.original_filename}")
    print(f"  Date range: {f.date_from} to {f.date_to}")
    print(f"  Rows: {f.rows_count}")
    print()

# Check calculation file_ids
calc_id = "202be788-fc95-45b7-b0ef-8810709a3abe"
calc = db.query(Calculation).filter(Calculation.id == calc_id).first()
if calc:
    print("=== CALCULATION FILE_IDS ===")
    print(f"  file_ids: {calc.file_ids}")
    if calc.file_ids:
        for file_id in calc.file_ids:
            file_obj = db.query(File).filter(File.id == file_id).first()
            if file_obj:
                print(f"    {file_id}: {file_obj.filename}")

db.close()
