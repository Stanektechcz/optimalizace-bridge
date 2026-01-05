/**
 * Step3Parameters - Configure calculation parameters
 */

import React from 'react';
import { Zap, Battery, DollarSign, Info, Sun } from 'lucide-react';

const Step3Parameters = ({ parameters, onChange }) => {
  const handleChange = (param, value) => {
    onChange(param, parseFloat(value) || 0);
  };

  // Helper to safely get values from nested structure
  const getValue = (path, defaultValue = 0) => {
    if (!parameters) return defaultValue;
    
    // Check if we have new structure with sections
    if (parameters.FVE) {
      // Map flat param names to nested structure
      const mapping = {
        fve_power: parameters.FVE?.pv_powernom,
        fve_efficiency: (parameters.FVE?.pv_eff || 0.2128) * 100,
        battery_capacity: parameters.Baterie?.b_cap,
        battery_power: parameters.Baterie?.b_speedcharge,
        battery_efficiency: (parameters.Baterie?.b_effcharge || 0.98) * 100,
        electricity_price: parameters.Ceny?.pricefix,
        feedin_tariff: parameters.Ceny?.feedistribution,
        fixed_fee: parameters.Ceny?.feetrader,
      };
      return mapping[path] ?? defaultValue;
    }
    
    // Fallback to direct access for old flat structure
    return parameters[path] ?? defaultValue;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Nastavení parametrů</h2>
        <p className="text-gray-600">Upravte technické a ekonomické parametry kalkulace.</p>
      </div>

      <div className="space-y-6">
        {/* FVE Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Sun className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Fotovoltaická elektrárna</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Instalovaný výkon (kWp) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={getValue('fve_power', 200)}
                  onChange={(e) => handleChange('fve_power', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="10.0"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">kWp</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Celkový výkon fotovoltaických panelů
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Účinnost instalace (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={getValue('fve_efficiency', 21.28)}
                  onChange={(e) => handleChange('fve_efficiency', e.target.value)}
                  className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="85"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Battery Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Battery className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Bateriové úložiště</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kapacita baterie (kWh) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={getValue('battery_capacity', 1000)}
                  onChange={(e) => handleChange('battery_capacity', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="15.0"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">kWh</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Celková kapacita baterie pro ukládání energie
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nabíjecí/vybíjecí výkon (kW) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={getValue('battery_power', 200)}
                  onChange={(e) => handleChange('battery_power', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="5.0"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">kW</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximální rychlost nabíjení a vybíjení
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Účinnost baterie (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={getValue('battery_efficiency', 98)}
                  onChange={(e) => handleChange('battery_efficiency', e.target.value)}
                  className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="90"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Ekonomické parametry</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cena elektřiny ze sítě (Kč/kWh) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={getValue('electricity_price', 3.5)}
                  onChange={(e) => handleChange('electricity_price', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="4.5"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">Kč/kWh</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Cena za odebranou elektrickou energii ze sítě
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Výkupní cena elektřiny (Kč/kWh) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={getValue('feedin_tariff', 0.5)}
                  onChange={(e) => handleChange('feedin_tariff', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="1.5"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">Kč/kWh</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Cena za elektřinu dodanou do distribuční sítě
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fixní poplatek (Kč/měsíc)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={getValue('fixed_fee', 0.5)}
                  onChange={(e) => handleChange('fixed_fee', e.target.value)}
                  className="w-full px-4 py-2.5 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="0"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">Kč/měsíc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Poznámka k parametrům</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Výkon FVE určuje, kolik energie dokáže systém vyrobit</li>
                <li>Kapacita baterie ovlivňuje množství uložené energie</li>
                <li>Ekonomické parametry slouží k výpočtu úspor a návratnosti</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3Parameters;
