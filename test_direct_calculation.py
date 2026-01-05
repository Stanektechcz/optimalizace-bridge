"""Run calculation with exact same parameters as database to compare results"""
import sys
sys.path.insert(0, '.')

from libs.process import calculate

# Mock objekty pro GUI
class MockProgressBar:
    def setValue(self, val):
        pass
    def value(self):
        return 0

class MockLabel:
    def setText(self, text):
        pass
    def setStyleSheet(self, style):
        pass

class MockConsole:
    def insertPlainText(self, text):
        print(text, end='')

# Parametry přesně z databáze (cf6db97d-8e08-4ca2-a564-4f5128e0ca90)
config = {
    'Obecne': {
        'slozka_diagramy': 'data_input/',
        'slozka_zpracovane': 'data_ready/'
    },
    'Optimalizace': {
        'optimizationtype': 0,
        'vnutitrokspotreby': 2024,
        'povolitdodavkydositezbaterie': True,
        'povolitodberzesitedobaterie': True,
        'povolitprekrocenipmax': True,
        'vynulovatspotrebnidiagram': False,
        'pouzitpredikcispotreby': False,
        'pouzitfixnicenu': False,
        'simulaceskutecnehoprovozu': False,
        'optimization_horizon': 24,
        'time_resolution': 1
    },
    'Baterie': {
        'b_cap': 2000.0,
        'b_effcharge': 0.98,
        'b_effdischarge': 0.88,
        'b_max': 0.9,
        'b_min': 0.15,
        'b_speedcharge': 700.0,
        'b_speeddischarge': 700.0
    },
    'FVE': {
        'pv_powernom': 400.0,
        'pv_effconverter': 0.8,
        'pmaxfve': 100000.0,
        'pv_power1': 0.55,
        'pv_area1': 2.5844,
        'pv_eff': 0.2128,
        'pv_tempeffcoef': 0.0005,
        'pv_tempref': 22,
        'predrandcoef': 0
    },
    'Ceny': {
        'pricefix': 2.9,
        'feedistribution': 5.0,
        'feetrader': 5.0
    },
    'Pmax': {
        'pmaxodber': 3000.0,
        'pmaxdodavka': 3000.0
    },
    'Export': {
        'export': False,
        'exportfile': 'export.xlsx'
    },
    'Graf': {
        'stylgrafu': 1,
        'automatickyzobrazitdennigraf': False,
        'automatickyzobrazitcelkovygraf': False
    }
}

print("Running calculation with database parameters...")
print("="*60)

progress = MockProgressBar()
label = MockLabel()
console = MockConsole()

results = calculate(config, progress, label, console)

print("\n" + "="*60)
print("RESULTS:")
print("="*60)

if results:
    # Print energy balance summary
    import pandas as pd
    
    dfEnergyForm = results.get('dfEnergyForm')
    if dfEnergyForm is not None and not dfEnergyForm.empty:
        print("\n[Energie - Skutečné období]")
        print(dfEnergyForm.to_string())
        
        # Calculate "Pouze spotřeba"
        only_consumption = dfEnergyForm.loc['Pouze spotřeba', 'Energie [kWh]'] if 'Pouze spotřeba' in dfEnergyForm.index else None
        if only_consumption:
            print(f"\nPouze spotřeba: {only_consumption:.3f} kWh = {only_consumption/1000:.3f} MWh")
    
    dfEnergyFormYear = results.get('dfEnergyFormYear')
    if dfEnergyFormYear is not None and not dfEnergyFormYear.empty:
        print("\n[Energie - Statisticky za rok]")
        print(dfEnergyFormYear.to_string())
        
        # Calculate "Pouze spotřeba" for year
        only_consumption_year = dfEnergyFormYear.loc['Pouze spotřeba', 'Energie [kWh]'] if 'Pouze spotřeba' in dfEnergyFormYear.index else None
        if only_consumption_year:
            print(f"\nPouze spotřeba (year): {only_consumption_year:.3f} kWh = {only_consumption_year/1000:.3f} MWh")

else:
    print("No results returned!")
