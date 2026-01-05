import importlib
import importlib.util
import sys
from pathlib import Path
from typing import Dict, Any, Callable, Optional
from datetime import datetime
from app.core.config import settings

# Set matplotlib to use non-GUI backend before any imports
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend


class CalculationEngine:
    """
    Bridge k existujícímu Python výpočetnímu enginu.
    Umožňuje hot-reload změn v libs/ bez restartu aplikace.
    """
    
    def __init__(self, libs_path: Optional[str] = None):
        # Resolve to absolute path
        libs_path_str = libs_path or settings.LIBS_PATH
        self.libs_path = Path(libs_path_str).resolve()
        
        # If path doesn't exist, log error
        if not self.libs_path.exists():
            print(f"⚠️  WARNING: libs path does not exist: {self.libs_path}")
            print(f"   Current working directory: {Path.cwd()}")
        
        self.loaded_modules = {}
        self.last_modified = {}
        self.version = "1.0.0"
        
        # Přidat libs parent do sys.path
        libs_parent = str(self.libs_path.parent)
        if libs_parent not in sys.path:
            sys.path.insert(0, libs_parent)
        
        print(f"[CalculationEngine] Initialized")
        print(f"   Libs path: {self.libs_path}")
        print(f"   Path exists: {self.libs_path.exists()}")
        print(f"   CWD: {Path.cwd()}")
    
    def _check_updates(self):
        """Kontrola a reload změněných modulů"""
        for py_file in self.libs_path.glob("*.py"):
            if py_file.name == "__init__.py":
                continue
                
            mtime = py_file.stat().st_mtime
            module_name = py_file.stem
            
            if module_name not in self.last_modified or \
               self.last_modified[module_name] < mtime:
                self._reload_module(module_name)
                self.last_modified[module_name] = mtime
    
    def _reload_module(self, module_name: str):
        """Hot reload Python modulu"""
        module_path = self.libs_path / f"{module_name}.py"
        
        print(f"[Loading] Module: {module_name}")
        print(f"   Module path: {module_path}")
        print(f"   Path exists: {module_path.exists()}")
        print(f"   Libs path: {self.libs_path}")
        print(f"   Libs path exists: {self.libs_path.exists()}")
        
        if not module_path.exists():
            print(f"⚠️  Module not found: {module_path}")
            raise FileNotFoundError(f"Module file not found: {module_path}")
        
        # Odstranit starý modul ze sys.modules
        full_name = f"libs.{module_name}"
        if full_name in sys.modules:
            del sys.modules[full_name]
        
        try:
            # Import nového modulu
            spec = importlib.util.spec_from_file_location(full_name, module_path)
            if spec is None:
                raise ImportError(f"Could not create spec for {full_name} from {module_path}")
            
            module = importlib.util.module_from_spec(spec)
            if module is None:
                raise ImportError(f"Could not create module from spec for {full_name}")
            
            sys.modules[full_name] = module
            spec.loader.exec_module(module)
            
            self.loaded_modules[module_name] = module
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            print(f"[OK] [{timestamp}] Reloaded module: {module_name}")
            
        except Exception as e:
            import traceback
            print(f"❌ Failed to reload {module_name}: {e}")
            print(f"   Traceback:")
            traceback.print_exc()
            raise
    
    def get_module(self, module_name: str):
        """Získat načtený modul"""
        if module_name not in self.loaded_modules:
            self._reload_module(module_name)
        
        return self.loaded_modules.get(module_name)
    
    def _load_default_config(self) -> Dict[str, Any]:
        """Načte default konfiguraci ze souboru default.ini"""
        import configparser
        
        default_ini_path = self.libs_path.parent / "user_settings" / "default.ini"
        
        if not default_ini_path.exists():
            print(f"Warning: default.ini not found at {default_ini_path}")
            return {}
        
        parser = configparser.ConfigParser()
        parser.read(default_ini_path, encoding='utf-8')
        
        # Konvertovat ConfigParser na dict
        config_dict = {}
        for section in parser.sections():
            config_dict[section] = {}
            for key, value in parser.items(section):
                # Převést stringy na správné typy
                if value.lower() in ('true', 'false'):
                    config_dict[section][key] = value.lower() == 'true'
                elif value.lower() == 'none':
                    config_dict[section][key] = None
                else:
                    try:
                        # Zkusit jako float
                        config_dict[section][key] = float(value)
                    except ValueError:
                        # Nechat jako string
                        config_dict[section][key] = value
        
        return config_dict
    
    def _merge_configs(self, base: Dict[str, Any], overlay: Dict[str, Any]) -> Dict[str, Any]:
        """Mergne overlay config do base config"""
        import copy
        result = copy.deepcopy(base)
        
        for section, params in overlay.items():
            if section not in result:
                result[section] = {}
            if isinstance(params, dict):
                result[section].update(params)
            else:
                result[section] = params
        
        return result
    
    def calculate(
        self, 
        config: Dict[str, Any], 
        progress_callback: Optional[Callable[[int], None]] = None,
        log_callback: Optional[Callable[[str], None]] = None
    ) -> Dict[str, Any]:
        """
        Hlavní výpočetní funkce - bridge k libs/process.py
        
        Args:
            config: Dictionary s konfigurací (stejný formát jako INI)
            progress_callback: Funkce pro aktualizaci progressu (0-100)
            log_callback: Funkce pro logování zpráv
            
        Returns:
            Dictionary s výsledky kalkulace
        """
        # Kontrola updates před výpočtem
        self._check_updates()
        
        # Načíst default config jako základ
        default_config = self._load_default_config()
        
        # Mergovat user config do default
        if default_config:
            if log_callback:
                log_callback("Merging user config with default.ini template")
            config = self._merge_configs(default_config, config)
        else:
            if log_callback:
                log_callback("Warning: Could not load default.ini, using user config only")
        
        # Import process modulu
        process = self.get_module("process")
        if not process:
            raise ImportError("Failed to load process module from libs/")
        
        # Mock PySide6 widgety pro kompatibilitu s existujícím kódem
        class MockProgressBar:
            def __init__(self, callback=None):
                self.callback = callback
                self._value = 0
                
            def setValue(self, value):
                self._value = value
                if self.callback:
                    self.callback(int(value))
                    
            def value(self):
                return self._value
        
        class MockLabel:
            def __init__(self):
                self._text = ""
                self._style = ""
                
            def setText(self, text):
                self._text = text
                if log_callback:
                    log_callback(f"[LABEL] {text}")
                
            def setStyleSheet(self, style):
                self._style = style
        
        class MockConsole:
            def __init__(self, callback=None):
                self.logs = []
                self.callback = callback
                
            def insertPlainText(self, text):
                self.logs.append(text)
                if self.callback:
                    self.callback(text)
        
        # Vytvořit mock objekty
        progress_bar = MockProgressBar(progress_callback)
        label = MockLabel()
        console = MockConsole(log_callback)
        
        # Upravit cesty v konfiguraci na absolutní
        # Získat kořenový adresář projektu (parent libs/)
        root_dir = self.libs_path.parent
        
        # Zajistit existenci sekce Obecne s defaultními hodnotami
        if 'Obecne' not in config:
            config['Obecne'] = {
                'slozka_diagramy': 'data_input/',
                'slozka_zpracovane': 'data_ready/'
            }
            if log_callback:
                log_callback("Added missing 'Obecne' section with default values")
        
        # Doplnit chybějící parametry v Optimalizace s default hodnotami
        if 'Optimalizace' in config:
            optimalizace_defaults = {
                'vnutitrokspotreby': None,
                'optimizationtype': 0,
                'povolitdodavkydositezbaterie': True,
                'povolitodberzesitedobaterie': True,
                'povolitprekrocenipmax': True,
                'vynulovatspotrebnidiagram': False,
                'pouzitfixnicenu': False,
                'pouzitpredikcispotreby': False,
                'simulaceskutecnehoprovozu': False,
                'optimization_horizon': 24,
                'time_resolution': 1
            }
            for key, default_value in optimalizace_defaults.items():
                if key not in config['Optimalizace']:
                    config['Optimalizace'][key] = default_value
                    if log_callback:
                        log_callback(f"Added missing Optimalizace.{key} = {default_value}")
        
        # Doplnit chybějící parametry v FVE s default hodnotami
        if 'FVE' in config:
            fve_defaults = {
                'pv_powernom': 200.0,
                'pv_eff': 0.2128,
                'pmaxfve': 2000,
                'pv_power1': 0.55,
                'pv_area1': 2.5844,
                'pv_tempeffcoef': 0.0005,
                'pv_tempref': 22,
                'pv_effconverter': 0.95,
                'predrandcoef': 0
            }
            for key, default_value in fve_defaults.items():
                if key not in config['FVE']:
                    config['FVE'][key] = default_value
                    if log_callback:
                        log_callback(f"Added missing FVE.{key} = {default_value}")
        
        # Zajistit existenci sekce Export
        if 'Export' not in config:
            config['Export'] = {
                'export': False,
                'exportfile': 'export.xlsx'
            }
            if log_callback:
                log_callback("Added missing 'Export' section with default values")
        
        # Zajistit existenci sekce Graf
        if 'Graf' not in config:
            config['Graf'] = {
                'stylgrafu': 1,
                'automatickyzobrazitdennigraf': False,
                'automatickyzobrazitcelkovygraf': False
            }
            if log_callback:
                log_callback("Added missing 'Graf' section with default values")
        else:
            # Doplnit chybějící parametry v Graf
            if 'automatickyzobrazitdennigraf' not in config['Graf']:
                config['Graf']['automatickyzobrazitdennigraf'] = False
            if 'automatickyzobrazitcelkovygraf' not in config['Graf']:
                config['Graf']['automatickyzobrazitcelkovygraf'] = False
        
        # Převést relativní cesty na absolutní
        if 'slozka_zpracovane' in config['Obecne']:
            rel_path = config['Obecne']['slozka_zpracovane']
            abs_path = str(root_dir / rel_path)
            config['Obecne']['slozka_zpracovane'] = abs_path + ('/' if not abs_path.endswith('/') else '')
            if log_callback:
                log_callback(f"Set slozka_zpracovane to: {config['Obecne']['slozka_zpracovane']}")
        
        if 'slozka_diagramy' in config['Obecne']:
            rel_path = config['Obecne']['slozka_diagramy']
            abs_path = str(root_dir / rel_path)
            config['Obecne']['slozka_diagramy'] = abs_path + ('/' if not abs_path.endswith('/') else '')
            if log_callback:
                log_callback(f"Set slozka_diagramy to: {config['Obecne']['slozka_diagramy']}")
        
        # Spustit výpočet
        try:
            if log_callback:
                log_callback(f"Starting calculation with config: {list(config.keys())}")
            
            raw_results = process.calculate(config, progress_bar, label, console)
            
            # Save dataRed to pickle for date filtering
            ready_path = config['Obecne']['slozka_zpracovane']
            if raw_results.get('dataRed') is not None:
                import pandas as pd
                data_red_path = root_dir / ready_path / 'dataRed.pkl'
                raw_results['dataRed'].to_pickle(data_red_path)
                if log_callback:
                    log_callback(f"Saved dataRed to {data_red_path}")
            
            # Načíst metadata ze souborů
            input_metadata = {}
            
            # Načíst info o vstupních souborech
            info_files_path = root_dir / ready_path / 'info_files.txt'
            if info_files_path.exists():
                with open(info_files_path, 'r', encoding='utf8') as f:
                    lines = f.readlines()
                    if lines:
                        time_info = lines[0].strip().split(';')
                        if len(time_info) >= 3:
                            input_metadata['input_file_time_from'] = time_info[0]
                            input_metadata['input_file_time_to'] = time_info[1]
                            input_metadata['input_file_hours'] = int(time_info[2]) if time_info[2] else 0
                        if len(lines) > 1:
                            input_metadata['input_files'] = [line.strip() for line in lines[1:] if line.strip()]
            
            # Načíst info o průniku dat (skutečně zpracovaná data)
            info_intersection_path = root_dir / ready_path / 'info_intersection.txt'
            if info_intersection_path.exists():
                with open(info_intersection_path, 'r', encoding='utf8') as f:
                    time_info = f.readline().strip().split(';')
                    if len(time_info) >= 3:
                        input_metadata['processed_time_from'] = time_info[0]
                        input_metadata['processed_time_to'] = time_info[1]
                        input_metadata['processed_hours'] = int(time_info[2]) if time_info[2] else 0
                        input_metadata['processed_days'] = input_metadata['processed_hours'] // 24
            
            if log_callback and input_metadata:
                log_callback(f"Input metadata loaded: {input_metadata}")
            
            # Transform Python results to API format
            if raw_results:
                # Convert pandas DataFrames to JSON-serializable dicts
                import pandas as pd
                
                def df_to_dict(df):
                    """Convert DataFrame to JSON-serializable dict."""
                    if df is None:
                        return None
                    if isinstance(df, pd.DataFrame):
                        # Convert datetime/Timestamp columns to ISO format strings
                        df_copy = df.copy()
                        for col in df_copy.columns:
                            if pd.api.types.is_datetime64_any_dtype(df_copy[col]):
                                df_copy[col] = df_copy[col].dt.strftime('%Y-%m-%d %H:%M:%S')
                        # Convert to dict and ensure all numpy types are converted to Python types
                        records = df_copy.to_dict(orient='records')
                        # Convert numpy types to Python types
                        import numpy as np
                        def convert_numpy(obj):
                            if isinstance(obj, (np.integer, np.floating)):
                                return obj.item()
                            elif isinstance(obj, np.ndarray):
                                return obj.tolist()
                            elif isinstance(obj, dict):
                                return {k: convert_numpy(v) for k, v in obj.items()}
                            elif isinstance(obj, list):
                                return [convert_numpy(item) for item in obj]
                            return obj
                        return convert_numpy(records)
                    return df
                
                # Helper to convert numpy types
                import numpy as np
                def to_python_type(val):
                    if isinstance(val, (np.integer, np.floating)):
                        return val.item()
                    return val
                
                # Note: We only store metadata and reduced data in DB to avoid size limits
                # Full hourly data (data array) is too large for MySQL JSON column
                results = {
                    "results": {
                        "battCycles": to_python_type(raw_results.get('battCycles')),
                        "battCyclesYear": to_python_type(raw_results.get('battCyclesYear')),
                        "timeString": raw_results.get('timeString'),
                        "dataCount": len(raw_results.get('data', [])) if raw_results.get('data') is not None else 0,
                        "dataRedCount": len(raw_results.get('dataRed', [])) if raw_results.get('dataRed') is not None else 0,
                    },
                    "input_metadata": input_metadata,
                    "cost_table": df_to_dict(raw_results.get('dfCostForm')),
                    "cost_table_year": df_to_dict(raw_results.get('dfCostFormYear')),
                    "energy_balance": df_to_dict(raw_results.get('dfEnergyForm')),
                    "energy_balance_year": df_to_dict(raw_results.get('dfEnergyFormYear')),
                    "financial_balance": df_to_dict(raw_results.get('dfFinanceForm')),
                    "financial_balance_year": df_to_dict(raw_results.get('dfFinanceFormYear')),
                    "charts_data": {
                        # Only store reduced data for charts to avoid DB size limits
                        "dataRed": df_to_dict(raw_results.get('dataRed')),
                    },
                    "logs": console.logs,
                    "engine_version": self.version
                }
                
                # Apply DateRange filtering based on mode
                # Handle both old format (enabled: bool) and new format (mode: str)
                date_range_config = config.get('DateRange', {})
                
                # Check if old format (enabled field exists)
                if 'enabled' in date_range_config and 'mode' not in date_range_config:
                    # Convert old format to new format
                    if date_range_config.get('enabled', False):
                        date_range_mode = 'custom'
                    else:
                        date_range_mode = 'full'  # Old default behavior was to use all data
                else:
                    # New format with mode field
                    date_range_mode = date_range_config.get('mode', 'full')  # Default to 'full' not 'year'
                
                if date_range_mode == 'custom':
                    # Custom date range - filter by specific dates
                    date_from = config['DateRange'].get('start', '2020-01-01')
                    date_to = config['DateRange'].get('end', '2030-01-01')
                    
                    if log_callback:
                        log_callback(f"Applying custom date range filter: {date_from} to {date_to}")
                    
                    # Apply filtering using existing filter_by_date_range logic
                    try:
                        from datetime import datetime, timedelta
                        
                        # Import required modules
                        funsCost = self._get_module('funsCost')
                        dataRed = raw_results.get('dataRed')
                        
                        if dataRed is not None:
                            # Convert date strings to datetime objects
                            d0 = datetime.strptime(date_from, '%Y-%m-%d').date()
                            d1 = datetime.strptime(date_to, '%Y-%m-%d').date()
                            
                            # Get dates from dataRed
                            ddates = dataRed['Den'].values.astype('M8[D]').astype('O')
                            
                            # Validate and adjust dates
                            if d0 < ddates[0]:
                                d0 = ddates[0]
                            if d1 > ddates[-1] + timedelta(days=1):
                                d1 = ddates[-1] + timedelta(days=1)
                            elif d1 <= d0:
                                d1 = d0 + timedelta(days=1)
                            
                            # Create filter index
                            ind = (ddates >= d0) & (ddates < d1)
                            
                            # Get fees from config
                            fees = (
                                config['Ceny']['feedistribution'] + config['Ceny']['feetrader'],
                                -config['Ceny']['feetrader']
                            )
                            
                            # Recalculate cost for filtered period
                            dfCost, _, _ = funsCost.calculateCost(dataRed, fees, dt=1, ind=ind)
                            dfCostForm = funsCost.printCost(dfCost, False)
                            
                            # Recalculate energy balance for filtered period
                            dfEnergy = funsCost.energyBalance(dataRed, dt=1, ind=ind)
                            dfEnergyForm = funsCost.printCost(dfEnergy, False)
                            
                            # Recalculate financial balance for filtered period
                            dfFinance = funsCost.financialBalance(dataRed, fees, dt=1, ind=ind)
                            dfFinanceForm = funsCost.printCost(dfFinance, False)
                            
                            # Calculate battery cycles for filtered period
                            battCycles = funsCost.batteryCycles(dataRed, ind=ind)
                            
                            # Calculate filtered period info
                            hours_in_period = ind.sum()
                            days_in_period = hours_in_period / 24
                            
                            # Update results with filtered data
                            results["cost_table"] = df_to_dict(dfCostForm)
                            results["energy_balance"] = df_to_dict(dfEnergyForm)
                            results["financial_balance"] = df_to_dict(dfFinanceForm)
                            results["results"]["battCycles"] = to_python_type(battCycles)
                            results["results"]["filtered_hours"] = int(hours_in_period)
                            results["results"]["filtered_days"] = float(days_in_period)
                            results["results"]["date_from"] = date_from
                            results["results"]["date_to"] = date_to
                            
                            if log_callback:
                                log_callback(f"Custom date range filter applied: {days_in_period:.1f} days")
                    
                    except Exception as e:
                        error_msg = f"Warning: Failed to apply custom date range filter: {str(e)}"
                        if log_callback:
                            log_callback(error_msg)
                        print(f"⚠️ {error_msg}")
                        # Continue with unfiltered results
                
                elif date_range_mode == 'year':
                    # Year mode - use Year tables (already calculated by process.calculate)
                    if log_callback:
                        log_callback("Using year mode - results scaled to 365 days")
                    # Year tables are already in results as cost_table_year, energy_balance_year, etc.
                    # We keep them separate, frontend will choose which to display
                    
                elif date_range_mode == 'full':
                    # Full mode - use all available data (default behavior)
                    if log_callback:
                        log_callback("Using full mode - results from all available data")
                    # Results are already calculated for full data
                
                if log_callback:
                    log_callback("Calculation completed successfully")
                
                return results
            else:
                return {
                    "results": {},
                    "logs": console.logs,
                    "engine_version": self.version
                }
            
        except Exception as e:
            error_msg = f"Calculation error: {str(e)}"
            if log_callback:
                log_callback(error_msg)
            
            print(f"❌ {error_msg}")
            raise
    
    def validate_config(self, config: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """
        Validace konfigurace před výpočtem.
        
        Args:
            config: Configuration dictionary
            
        Returns:
            Tuple (is_valid, error_message)
        """
        required_sections = ["Optimalizace", "Baterie", "FVE", "Ceny", "Pmax"]
        
        for section in required_sections:
            if section not in config:
                return False, f"Missing required section: {section}"
        
        # Validace numerických hodnot
        try:
            if config["Baterie"]["b_cap"] <= 0:
                return False, "Battery capacity must be > 0"
            
            if config["FVE"]["pv_powernom"] <= 0:
                return False, "PV power must be > 0"
            
            # Další validace...
            
        except KeyError as e:
            return False, f"Missing required parameter: {e}"
        except (TypeError, ValueError) as e:
            return False, f"Invalid parameter value: {e}"
        
        return True, None
    
    def filter_by_date_range(
        self,
        calculation_id: str,
        input_params: Dict[str, Any],
        date_from: str,
        date_to: str
    ) -> Dict[str, Any]:
        """
        Filter calculation results by custom date range.
        Recomputes cost, energy and financial tables for the selected period.
        
        Args:
            calculation_id: ID of the calculation
            input_params: Original input parameters
            date_from: Start date (YYYY-MM-DD)
            date_to: End date (YYYY-MM-DD)
            
        Returns:
            Dictionary with filtered results
        """
        try:
            import pandas as pd
            import numpy as np
            from datetime import datetime, timedelta
            
            self._check_updates()
            
            # Import required modules
            funsCost = self._get_module('funsCost')
            
            # Load original dataRed from processed data
            root_dir = Path(input_params.get('_root_dir', Path.cwd()))
            ready_path = input_params['Obecne']['slozka_zpracovane']
            data_red_path = root_dir / ready_path / 'dataRed.pkl'
            
            if not data_red_path.exists():
                raise FileNotFoundError(f"dataRed.pkl not found at {data_red_path}")
            
            dataRed = pd.read_pickle(data_red_path)
            
            # Convert date strings to datetime objects
            d0 = datetime.strptime(date_from, '%Y-%m-%d').date()
            d1 = datetime.strptime(date_to, '%Y-%m-%d').date()
            
            # Get dates from dataRed
            ddates = dataRed['Den'].values.astype('M8[D]').astype('O')
            
            # Validate and adjust dates
            if d0 < ddates[0]:
                d0 = ddates[0]
            if d1 > ddates[-1] + timedelta(days=1):
                d1 = ddates[-1] + timedelta(days=1)
            elif d1 <= d0:
                d1 = d0 + timedelta(days=1)
            
            # Create filter index
            ind = (ddates >= d0) & (ddates < d1)
            
            # Get fees from config
            fees = (
                input_params['Ceny']['feedistribution'] + input_params['Ceny']['feetrader'],
                -input_params['Ceny']['feetrader']
            )
            
            # Recalculate cost for filtered period
            dfCost, _, _ = funsCost.calculateCost(dataRed, fees, dt=1, ind=ind)
            dfCostForm = funsCost.printCost(dfCost, False)
            
            # Recalculate energy balance for filtered period
            dfEnergy = funsCost.energyBalance(dataRed, dt=1, ind=ind)
            dfEnergyForm = funsCost.printCost(dfEnergy, False)
            
            # Recalculate financial balance for filtered period
            dfFinance = funsCost.financialBalance(dataRed, fees, dt=1, ind=ind)
            dfFinanceForm = funsCost.printCost(dfFinance, False)
            
            # Calculate battery cycles for filtered period
            battCycles = funsCost.batteryCycles(dataRed, ind=ind)
            
            # Helper function to convert DataFrame to dict
            def df_to_dict(df):
                if df is not None and not df.empty:
                    df_copy = df.copy()
                    for col in df_copy.columns:
                        if pd.api.types.is_datetime64_any_dtype(df_copy[col]):
                            df_copy[col] = df_copy[col].dt.strftime('%Y-%m-%d %H:%M:%S')
                    records = df_copy.to_dict(orient='records')
                    
                    # Convert numpy types to Python types
                    def convert_numpy(obj):
                        if isinstance(obj, (np.integer, np.floating)):
                            return obj.item()
                        elif isinstance(obj, np.ndarray):
                            return obj.tolist()
                        elif isinstance(obj, dict):
                            return {k: convert_numpy(v) for k, v in obj.items()}
                        elif isinstance(obj, list):
                            return [convert_numpy(item) for item in obj]
                        return obj
                    return convert_numpy(records)
                return df
            
            # Convert to Python types
            def to_python_type(val):
                if isinstance(val, (np.integer, np.floating)):
                    return val.item()
                return val
            
            # Calculate filtered period info
            hours_in_period = ind.sum()
            days_in_period = hours_in_period / 24
            
            return {
                "cost_table": df_to_dict(dfCostForm),
                "energy_balance": df_to_dict(dfEnergyForm),
                "financial_balance": df_to_dict(dfFinanceForm),
                "results": {
                    "battCycles": to_python_type(battCycles),
                    "hours": int(hours_in_period),
                    "days": float(days_in_period),
                    "date_from": date_from,
                    "date_to": date_to
                }
            }
            
        except Exception as e:
            print(f"❌ Error filtering by date range: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


# Singleton instance
calculation_engine = CalculationEngine()
