"""Check old weather.pkl structure"""
import pandas as pd
from pathlib import Path

# Backup old weather
old_weather_path = Path("..") / "data_ready" / "weather.pkl.old"
weather_path = Path("..") / "data_ready" / "weather.pkl"

# Rename current to backup
import shutil
if weather_path.exists() and not old_weather_path.exists():
    shutil.copy2(weather_path, old_weather_path)
    print(f"✅ Backed up weather.pkl to weather.pkl.old")

# Read old weather
df_old = pd.read_pickle(old_weather_path)

print("=== OLD WEATHER.PKL ===")
print(f"Columns: {list(df_old.columns)}")
print(f"Rows: {len(df_old)}")
print(f"\nFirst 10 rows:")
print(df_old.head(10))
print(f"\nData types:")
print(df_old.dtypes)
