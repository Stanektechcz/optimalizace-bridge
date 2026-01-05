"""Prepare prices.pkl and weather.pkl for year 2023"""
import pandas as pd
import numpy as np
from pathlib import Path

# Paths
root_dir = Path(__file__).parent.parent
data_ready_dir = root_dir / "data_ready"
data_ready_dir.mkdir(parents=True, exist_ok=True)

print("=== PREPARING PRICES.PKL ===")

# Load all price files
price_files = [
    data_ready_dir / "ceny_2023.xlsx"
]

# Read and merge price data
price_dfs = []
for pfile in price_files:
    if pfile.exists():
        print(f"Reading {pfile.name}...")
        df = pd.read_excel(pfile)
        price_dfs.append(df)
    else:
        print(f"⚠️ File not found: {pfile}")

if not price_dfs:
    print("❌ No price files found!")
    exit(1)

# Concatenate all price dataframes
prices_df = pd.concat(price_dfs, ignore_index=True)

# Ensure correct column names (similar to consumption.pkl structure)
# Expected columns: Den, Hodina, EUR/kWh, Kč/kWh
print(f"Price columns: {list(prices_df.columns)}")
print(f"Price rows: {len(prices_df)}")
print(f"Date range: {prices_df.iloc[0, 0]} to {prices_df.iloc[-1, 0]}")

# Rename columns to expected format (EUR/kWh and Kč/kWh)
if '(EUR/MWh)' in prices_df.columns:
    prices_df['EUR/kWh'] = prices_df['(EUR/MWh)'] / 1000
    prices_df['Kč/kWh'] = prices_df['(Kč/MWh)'] / 1000
    prices_df = prices_df[['Den', 'Hodina', 'EUR/kWh', 'Kč/kWh']]
    print(f"Converted from MWh to kWh")

# Save prices.pkl
prices_path = data_ready_dir / "prices.pkl"
prices_df.to_pickle(prices_path)
print(f"✅ Saved {prices_path}")

print("\n=== PREPARING WEATHER.PKL ===")

# Load weather file for 2023
weather_file = data_ready_dir / "pocasi_2023.xlsx"

if weather_file.exists():
    print(f"Reading {weather_file.name}...")
    weather_df = pd.read_excel(weather_file)
elif (root_dir / "data_ready" / "pocasi_2021.csv").exists():
    # Fallback to 2021 CSV and shift dates
    print(f"⚠️ 2023 weather not found, using 2021 and shifting dates...")
    weather_file = root_dir / "data_ready" / "pocasi_2021.csv"
    weather_df = pd.read_csv(weather_file, skiprows=9)  # Skip header rows
    
    # Shift years from 2020 to 2023 (3 years = ~1095 days)
    if 'Year' in weather_df.columns:
        weather_df['Year'] = weather_df['Year'] + 3
else:
    print("❌ No weather file found!")
    exit(1)

print(f"Weather columns: {list(weather_df.columns)}")
print(f"Weather rows: {len(weather_df)}")

# Convert to format expected by funsData.py
# Expected columns: Den, Hodina, Tamb, GHI, WindVel

# pocasi_2023.xlsx format: PeriodEnd, PeriodStart, Period, AirTemp, Ghi, WindSpeed10m
if 'PeriodEnd' in weather_df.columns:
    # Convert PeriodEnd to datetime
    weather_df['PeriodEnd'] = pd.to_datetime(weather_df['PeriodEnd'])
    weather_df['Den'] = weather_df['PeriodEnd'].dt.date
    weather_df['Den'] = pd.to_datetime(weather_df['Den'])
    weather_df['Hodina'] = weather_df['PeriodEnd'].dt.hour + 1  # 0-23 -> 1-24
    
    # Rename columns to expected names
    weather_df = weather_df.rename(columns={
        'AirTemp': 'Tamb',
        'Ghi': 'GHI', 
        'WindSpeed10m': 'WindVel'
    })
    
    # Select relevant columns
    weather_df = weather_df[['Den', 'Hodina', 'Tamb', 'GHI', 'WindVel']]
    
    # Some weather data has 30-minute intervals, aggregate to hourly
    weather_df = weather_df.groupby(['Den', 'Hodina'], as_index=False).mean()
    
    print(f"After conversion: {len(weather_df)} rows")

elif 'Year' in weather_df.columns and 'Month' in weather_df.columns and 'Day' in weather_df.columns:
    # CSV format - create Den column
    weather_df['Den'] = pd.to_datetime(weather_df[['Year', 'Month', 'Day']])
    weather_df['Hodina'] = weather_df['Hour'] + 1  # Hour is 0-23, need 1-24
    
    # Select relevant columns
    weather_df = weather_df[['Den', 'Hodina', 'Tamb', 'GHI', 'WindVel']]
else:
    # Excel format - assume it already has correct structure
    pass

# Filter to 2023 only
if 'Den' in weather_df.columns:
    weather_df['Den'] = pd.to_datetime(weather_df['Den'])
    weather_df = weather_df[weather_df['Den'].dt.year == 2023]
    print(f"Filtered to 2023: {len(weather_df)} rows")
    print(f"Date range: {weather_df['Den'].min()} to {weather_df['Den'].max()}")

# Save weather.pkl
weather_path = data_ready_dir / "weather.pkl"
weather_df.to_pickle(weather_path)
print(f"✅ Saved {weather_path}")

print("\n=== SUMMARY ===")
print(f"Prices: {len(prices_df)} rows")
print(f"Weather: {len(weather_df)} rows")
print(f"\n✅ Ready to run calculation!")
