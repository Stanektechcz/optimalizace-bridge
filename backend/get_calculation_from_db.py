"""
Získání detailů kalkulace z databáze
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json

# Database connection
DATABASE_URL = "mysql+pymysql://root:root@localhost:3306/optimalizace_bridge"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def get_calculation_details(calculation_id):
    """Získat detaily kalkulace z databáze"""
    session = Session()
    try:
        # Získat základní info o kalkulaci
        query = text("""
            SELECT 
                c.id,
                c.user_id,
                c.name,
                c.status,
                c.created_at,
                c.completed_at,
                f.original_filename,
                f.rows_count,
                f.file_type,
                cfg.name as config_name
            FROM calculations c
            LEFT JOIN files f ON f.id = (
                SELECT cf.file_id 
                FROM calculation_files cf 
                WHERE cf.calculation_id = c.id 
                LIMIT 1
            )
            LEFT JOIN configurations cfg ON cfg.id = c.configuration_id
            WHERE c.id = :calc_id
        """)
        
        result = session.execute(query, {"calc_id": calculation_id}).fetchone()
        
        if not result:
            print(f"❌ Kalkulace {calculation_id} nebyla nalezena!")
            return None
        
        print("=" * 80)
        print("DETAILY KALKULACE")
        print("=" * 80)
        print(f"ID: {result[0]}")
        print(f"Název: {result[2]}")
        print(f"Status: {result[3]}")
        print(f"Vytvořeno: {result[4]}")
        print(f"Dokončeno: {result[5]}")
        print(f"Vstupní soubor: {result[6]}")
        print(f"Počet řádků: {result[7]}")
        print(f"Typ souboru: {result[8]}")
        print(f"Konfigurace: {result[9]}")
        print()
        
        # Získat parametry kalkulace
        query_params = text("""
            SELECT input_params, results
            FROM calculations
            WHERE id = :calc_id
        """)
        
        params_result = session.execute(query_params, {"calc_id": calculation_id}).fetchone()
        
        if params_result and params_result[0]:
            print("PARAMETRY KALKULACE:")
            print("-" * 80)
            params = json.loads(params_result[0])
            
            # Zobrazit hlavní sekce parametrů
            for section in ['Optimalizace', 'Baterie', 'FVE', 'Pmax', 'Ceny']:
                if section in params:
                    print(f"\n{section}:")
                    for key, value in params[section].items():
                        print(f"  {key}: {value}")
        
        if params_result and params_result[1]:
            print("\n" + "=" * 80)
            print("VÝSLEDKY KALKULACE:")
            print("-" * 80)
            results = json.loads(params_result[1])
            
            # Klíčové statistiky
            if 'dataCount' in results:
                print(f"\nPočet datových bodů: {results['dataCount']}")
            if 'dataRedCount' in results:
                print(f"Počet redukovaných bodů: {results['dataRedCount']}")
            if 'battCycles' in results:
                print(f"Cykly baterie: {results['battCycles']:.2f}")
            if 'battCyclesYear' in results:
                print(f"Cykly baterie/rok: {results['battCyclesYear']:.2f}")
            
            # Nákladová tabulka
            if 'costsTable' in results:
                print("\n" + "-" * 80)
                print("NÁKLADOVÁ TABULKA:")
                print("-" * 80)
                costs_table = results['costsTable']
                print(f"{'Scénář':<30} {'Náklady (tis. Kč)':>18} {'Rozdíl (tis. Kč)':>18} {'Rozdíl (%)':>12}")
                print("-" * 80)
                for row in costs_table:
                    print(f"{row['scenario']:<30} {row['cost']:>18.3f} {row['difference']:>18.3f} {row['differencePercent']:>11.2f}%")
            
            # Bilance energie
            if 'energyBalance' in results:
                print("\n" + "-" * 80)
                print("BILANCE ENERGIE:")
                print("-" * 80)
                energy_balance = results['energyBalance']
                print(f"{'Scénář':<30} {'Suma odběr (MWh)':>18} {'Suma dodávka (MWh)':>20} {'Suma celkem (MWh)':>18}")
                print("-" * 80)
                for row in energy_balance:
                    print(f"{row['scenario']:<30} {row['sumOdber']:>18.3f} {row['sumDodavka']:>20.3f} {row['sumTotal']:>18.3f}")
        
        print("\n" + "=" * 80)
        
        return result
        
    finally:
        session.close()

if __name__ == "__main__":
    calculation_id = "a639f6b9-ad51-4f1e-bea5-25b9056d811d"
    get_calculation_details(calculation_id)
