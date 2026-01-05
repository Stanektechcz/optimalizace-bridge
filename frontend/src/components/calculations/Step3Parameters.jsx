/**
 * Step3Parameters - Configure all calculation parameters with proper structure
 */

import React from 'react';
import { Settings, Battery, Sun, DollarSign, Zap, Info, Calendar } from 'lucide-react';

const Step3Parameters = ({ parameters, onChange }) => {
  if (!parameters) return null;

  const handleChange = (section, param, value, isBoolean = false, isPercentage = false) => {
    let processedValue = value;
    
    if (isBoolean) {
      processedValue = value === 'true' || value === true;
    } else if (isPercentage) {
      // Store as string during input, will be converted when submitted
      processedValue = value;
    } else {
      // Store as string during input
      processedValue = value;
    }
    
    onChange(section, param, processedValue);
  };

  // Helper to get value - values already come in UI units (%, kW, kWh) from parent
  const getVal = (section, param, defaultVal) => {
    return parameters[section]?.[param] ?? defaultVal;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Nastavení parametrů</h2>
        <p className="text-gray-600">Upravte všechny parametry kalkulace podle vašich potřeb.</p>
      </div>

      <div className="space-y-6">
        {/* Optimalizace Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Optimalizace</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Typ optimalizace
              </label>
              <select
                value={getVal('Optimalizace', 'optimizationtype', 0)}
                onChange={(e) => handleChange('Optimalizace', 'optimizationtype', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="0">Minimalizovat náklady (LinProg)</option>
                <option value="1">Minimalizovat špičky spotřeby</option>
                <option value="2">Minimalizovat špičky spotřeby i dodávky</option>
                <option value="3">Minimalizovat náklady (APOPT)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Vnutit rok spotřeby
              </label>
              <select
                value={getVal('Optimalizace', 'vnutitrokspotreby', null) || ''}
                onChange={(e) => handleChange('Optimalizace', 'vnutitrokspotreby', e.target.value === '' ? null : parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Žádný</option>
                <option value="2020">2020</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={getVal('Optimalizace', 'povolitdodavkydositezbaterie', true)}
                  onChange={(e) => handleChange('Optimalizace', 'povolitdodavkydositezbaterie', e.target.checked, true)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Povolit dodávky do sítě z baterie</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={getVal('Optimalizace', 'povolitodberzesitedobaterie', true)}
                  onChange={(e) => handleChange('Optimalizace', 'povolitodberzesitedobaterie', e.target.checked, true)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Povolit odběr ze sítě do baterie</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={getVal('Optimalizace', 'povolitprekrocenipmax', true)}
                  onChange={(e) => handleChange('Optimalizace', 'povolitprekrocenipmax', e.target.checked, true)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Povolit překročení Pmax</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={getVal('Optimalizace', 'vynulovatspotrebnidiagram', false)}
                  onChange={(e) => handleChange('Optimalizace', 'vynulovatspotrebnidiagram', e.target.checked, true)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Vynulovat spotřební diagram (testování)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={getVal('Optimalizace', 'pouzitpredikcispotreby', false)}
                  onChange={(e) => handleChange('Optimalizace', 'pouzitpredikcispotreby', e.target.checked, true)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Použít predikci spotřeby</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={getVal('Optimalizace', 'pouzitfixnicenu', false)}
                  onChange={(e) => handleChange('Optimalizace', 'pouzitfixnicenu', e.target.checked, true)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Použít fixní cenu</span>
              </label>
            </div>
          </div>
        </div>

        {/* Ceny Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Ceny</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fixní cena (Kč/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={getVal('Ceny', 'fixedprice', 3.5)}
                onChange={(e) => handleChange('Ceny', 'fixedprice', e.target.value)}
                disabled={!getVal('Optimalizace', 'pouzitfixnicenu', false)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Poplatek distributor (Kč/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={getVal('Ceny', 'feedistribution', 1.2)}
                onChange={(e) => handleChange('Ceny', 'feedistribution', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Poplatek obchodník (Kč/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={getVal('Ceny', 'feetrader', 0.3)}
                onChange={(e) => handleChange('Ceny', 'feetrader', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Pmax Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Zap className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Celkové omezení výkonu</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Maximální dodávka (kW)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={getVal('Pmax', 'pmaxdodavka', 200)}
                onChange={(e) => handleChange('Pmax', 'pmaxdodavka', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Maximální odběr (kW)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={getVal('Pmax', 'pmaxodber', 400)}
                onChange={(e) => handleChange('Pmax', 'pmaxodber', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Baterie Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Battery className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Bateriové úložiště</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kapacita (kWh) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={getVal('Baterie', 'b_cap', 1000)}
                onChange={(e) => handleChange('Baterie', 'b_cap', e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Rychlost nabíjení (kW)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={getVal('Baterie', 'b_speedcharge', 200)}
                onChange={(e) => handleChange('Baterie', 'b_speedcharge', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Rychlost vybíjení (kW)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={getVal('Baterie', 'b_speeddischarge', 200)}
                onChange={(e) => handleChange('Baterie', 'b_speeddischarge', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Účinnost nabíjení (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={getVal('Baterie', 'b_effcharge', 98)}
                onChange={(e) => handleChange('Baterie', 'b_effcharge', e.target.value, false, true)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Účinnost vybíjení (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={getVal('Baterie', 'b_effdischarge', 98)}
                onChange={(e) => handleChange('Baterie', 'b_effdischarge', e.target.value, false, true)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Maximální nabití (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={getVal('Baterie', 'b_max', 95)}
                onChange={(e) => handleChange('Baterie', 'b_max', e.target.value, false, true)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Minimální nabití (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={getVal('Baterie', 'b_min', 5)}
                onChange={(e) => handleChange('Baterie', 'b_min', e.target.value, false, true)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* FVE Section - přesně jako Python GUI (pouze 3 pole) */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Sun className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Fotovoltaika</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nominální výkon (kW)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={getVal('FVE', 'pv_powernom', 200)}
                onChange={(e) => handleChange('FVE', 'pv_powernom', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Účinnost střídače (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={getVal('FVE', 'pv_effconverter', 95)}
                onChange={(e) => handleChange('FVE', 'pv_effconverter', e.target.value, false, true)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Omezení výkonu (kW)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={getVal('FVE', 'pmaxfve', 2000)}
                onChange={(e) => handleChange('FVE', 'pmaxfve', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Date Range Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Rozmezí kalkulace</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                Zvolte způsob zobrazení výsledků - přepočítané na celý rok, pouze z dostupných dat, nebo pro vlastní časové rozmezí.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50 transition-colors" 
                     style={{borderColor: getVal('DateRange', 'mode', 'full') === 'year' ? '#4F46E5' : '#E5E7EB'}}>
                <input
                  type="radio"
                  name="dateRangeMode"
                  value="year"
                  checked={getVal('DateRange', 'mode', 'full') === 'year'}
                  onChange={(e) => handleChange('DateRange', 'mode', e.target.value)}
                  className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Výsledky přepočítané na jeden rok (365 dní)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Statistické přepočtení na roční období
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50 transition-colors"
                     style={{borderColor: getVal('DateRange', 'mode', 'full') === 'full' ? '#4F46E5' : '#E5E7EB'}}>
                <input
                  type="radio"
                  name="dateRangeMode"
                  value="full"
                  checked={getVal('DateRange', 'mode', 'full') === 'full'}
                  onChange={(e) => handleChange('DateRange', 'mode', e.target.value)}
                  className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Výsledky pouze z dostupných dat
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Skutečné období ze vstupních souborů
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50 transition-colors"
                     style={{borderColor: getVal('DateRange', 'mode', 'full') === 'custom' ? '#4F46E5' : '#E5E7EB'}}>
                <input
                  type="radio"
                  name="dateRangeMode"
                  value="custom"
                  checked={getVal('DateRange', 'mode', 'full') === 'custom'}
                  onChange={(e) => handleChange('DateRange', 'mode', e.target.value)}
                  className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Zvolit vlastní rozsah
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Definovat konkrétní časové období
                  </div>
                </div>
              </label>
            </div>

            {getVal('DateRange', 'mode', 'full') === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Od (včetně)
                  </label>
                  <input
                    type="date"
                    value={getVal('DateRange', 'start', '2020-01-01')}
                    onChange={(e) => handleChange('DateRange', 'start', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Do (nezapočítá se)
                  </label>
                  <input
                    type="date"
                    value={getVal('DateRange', 'end', '2030-01-01')}
                    onChange={(e) => handleChange('DateRange', 'end', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Step3Parameters;
