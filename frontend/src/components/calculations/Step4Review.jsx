/**
 * Step4Review - Review all settings before calculation
 */

import React from 'react';
import { FileText, Settings, Zap, Battery, DollarSign, CheckCircle, Sun, Activity, TrendingUp } from 'lucide-react';
import { formatFileSize } from '../../utils/helpers';

const Step4Review = ({ selectedFile, selectedConfig, parameters }) => {
  // Helper to get value from nested structure
  const getVal = (section, param, defaultVal = '') => {
    if (!parameters || !parameters[section]) return defaultVal;
    const val = parameters[section][param];
    return val !== undefined && val !== null ? val : defaultVal;
  };

  // Helper to format percentage (convert decimal to %)
  const formatPercent = (section, param, defaultVal = 0) => {
    const val = getVal(section, param, defaultVal);
    // If value is between 0 and 1, it's likely a decimal that needs to be converted
    if (val > 0 && val < 1) {
      return (val * 100).toFixed(1);
    }
    return val;
  };

  // Helper to format boolean
  const formatBool = (val) => val ? 'Ano' : 'Ne';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Kontrola a spuštění</h2>
        <p className="text-gray-600">Zkontrolujte všechna nastavení před spuštěním výpočtu.</p>
      </div>

      <div className="space-y-4">
        {/* File Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Vstupní soubor</h3>
          </div>

          {selectedFile ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Název souboru:</span>
                <span className="text-sm font-medium text-gray-900">{selectedFile.original_filename || selectedFile.original_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Typ:</span>
                <span className="text-sm font-medium text-gray-900 uppercase">{selectedFile.file_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Velikost:</span>
                <span className="text-sm font-medium text-gray-900">{formatFileSize(selectedFile.file_size)}</span>
              </div>
              {selectedFile.rows_count && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Počet řádků v souboru:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedFile.rows_count}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-red-600">⚠️ Není vybrán soubor</p>
          )}
        </div>
        
        {/* Data Processing Info - shown after calculation or from config */}
        {parameters && parameters._metadata && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Zpracovaná data</h3>
            </div>
            
            <div className="space-y-2">
              {parameters._metadata.processed_time_from && parameters._metadata.processed_time_to && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Období dat:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {parameters._metadata.processed_time_from} - {parameters._metadata.processed_time_to}
                  </span>
                </div>
              )}
              {parameters._metadata.processed_days && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Počet dní:</span>
                  <span className="text-sm font-medium text-gray-900">{parameters._metadata.processed_days} dní</span>
                </div>
              )}
              {parameters._metadata.processed_hours && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Počet hodin:</span>
                  <span className="text-sm font-medium text-gray-900">{parameters._metadata.processed_hours} hodin</span>
                </div>
              )}
              {parameters._metadata.input_files && parameters._metadata.input_files.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Zpracované soubory:</span>
                  <div className="pl-2">
                    {parameters._metadata.input_files.map((file, idx) => (
                      <div key={idx} className="text-sm font-medium text-gray-900">• {file}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Configuration Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Konfigurace</h3>
          </div>

          {selectedConfig ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Název:</span>
                <span className="text-sm font-medium text-gray-900">{selectedConfig.name}</span>
              </div>
              {selectedConfig.description && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Popis:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedConfig.description}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-700">Vlastní nastavení parametrů</p>
          )}
        </div>

        {/* Optimization Parameters */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Optimalizace</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-sm text-gray-600">Typ optimalizace:</span>
              <p className="text-base font-semibold text-gray-900">{getVal('Optimalizace', 'optimizationtype', 'minimize')}</p>
            </div>
            {getVal('Optimalizace', 'vnutitrokspotreby') && (
              <div>
                <span className="text-sm text-gray-600">Vnucený rok spotřeby:</span>
                <p className="text-base font-semibold text-gray-900">{getVal('Optimalizace', 'vnutitrokspotreby')}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-600">Optimalizační horizont (h):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('Optimalizace', 'optimization_horizon', 24)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Časové rozlišení (h):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('Optimalizace', 'time_resolution', 1)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Min. teplota (°C):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('Optimalizace', 'mintemp', -10)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Max. teplota (°C):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('Optimalizace', 'maxtemp', 40)}</p>
            </div>
            <div className="col-span-2">
              <span className="text-sm text-gray-600 block mb-2">Povolení:</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Dodávky do sítě z baterie:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatBool(getVal('Optimalizace', 'povolitdodavkydositezbaterie', false))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Odběr ze sítě do baterie:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatBool(getVal('Optimalizace', 'povolitodberzesitedobaterie', false))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Dodávky do sítě z FVE:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatBool(getVal('Optimalizace', 'povolitdodavkydositezfve', true))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Nabíjení baterie z FVE:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatBool(getVal('Optimalizace', 'povolitnabijenibateriezfve', true))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Nabíjení baterie ze sítě:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatBool(getVal('Optimalizace', 'povolitnabijenibateriezesit', false))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Překročení Pmax:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatBool(getVal('Optimalizace', 'povolitprekrocenipmax', false))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Vynulovat spotřební diagram:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatBool(getVal('Optimalizace', 'vynulovatspotrebnidiagram', false))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Použít predikci spotřeby:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatBool(getVal('Optimalizace', 'pouzitpredikcispotreby', false))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Použít fixní cenu:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatBool(getVal('Optimalizace', 'pouzitfixnicenu', false))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Simulace skutečného provozu:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatBool(getVal('Optimalizace', 'simulaceskutecnehoprovozu', false))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pmax Parameters */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Activity className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Limity výkonu (Pmax)</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-sm text-gray-600">Pmax odběr (kW):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('Pmax', 'pmaxodber', 0)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Pmax dodávka (kW):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('Pmax', 'pmaxdodavka', 0)}</p>
            </div>
          </div>
        </div>

        {/* Battery Parameters */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Battery className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Baterie</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-sm text-gray-600">Kapacita (kWh):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('Baterie', 'b_cap', 0)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Max. výkon (kW):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('Baterie', 'b_max', 0)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Min. výkon (kW):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('Baterie', 'b_min', 0)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Účinnost nabíjení (%):</span>
              <p className="text-base font-semibold text-gray-900">{formatPercent('Baterie', 'b_eff_charging', 0.95)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Účinnost vybíjení (%):</span>
              <p className="text-base font-semibold text-gray-900">{formatPercent('Baterie', 'b_eff_discharging', 0.95)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Min. SOC (%):</span>
              <p className="text-base font-semibold text-gray-900">{formatPercent('Baterie', 'b_soc_min', 0.1)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Max. SOC (%):</span>
              <p className="text-base font-semibold text-gray-900">{formatPercent('Baterie', 'b_soc_max', 0.9)}</p>
            </div>
          </div>
        </div>

        {/* FVE Parameters */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Sun className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Fotovoltaika</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-sm text-gray-600">Jmenovitý výkon (kWp):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('FVE', 'pv_powernom', 0)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Max. výkon FVE (kW):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('FVE', 'pmaxfve', 0)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Účinnost panelů (%):</span>
              <p className="text-base font-semibold text-gray-900">{formatPercent('FVE', 'pv_eff', 0.2)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Účinnost měniče (%):</span>
              <p className="text-base font-semibold text-gray-900">{formatPercent('FVE', 'pv_effconverter', 0.98)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Teplotní koeficient účinnosti (1/°C):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('FVE', 'pv_tempeffcoef', 0.0005)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Referenční teplota (°C):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('FVE', 'pv_tempref', 22)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Výkon 1 panelu (kW):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('FVE', 'pv_power1', 0.55)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Plocha 1 panelu (m²):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('FVE', 'pv_area1', 2.5844)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Náhodnost predikce:</span>
              <p className="text-base font-semibold text-gray-900">{getVal('FVE', 'predrandcoef', 0)}</p>
            </div>
          </div>
        </div>

        {/* Economic Parameters */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Ekonomika</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-sm text-gray-600">Cena elektřiny (Kč/kWh):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('Ceny', 'pricefix', 0)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Poplatek za distribuci (Kč/kWh):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('Ceny', 'feedistribution', 0)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Poplatek obchodníka (Kč/kWh):</span>
              <p className="text-base font-semibold text-gray-900">{getVal('Ceny', 'feetrader', 0)}</p>
            </div>
          </div>
        </div>

        {/* Ready Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-green-900 mb-1">Vše je připraveno</h3>
              <p className="text-sm text-green-800">
                Všechna nastavení jsou kompletní. Můžete spustit výpočet kalkulace.
                Výpočet může trvat několik minut v závislosti na velikosti dat.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4Review;
