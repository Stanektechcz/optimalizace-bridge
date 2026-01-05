/**
 * Step2ConfigSelection - Select or create configuration
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, CheckCircle, Plus, Star } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const Step2ConfigSelection = ({ configurations, selectedConfigId, onSelect }) => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Výběr konfigurace</h2>
        <p className="text-gray-600">Vyberte přednastavené parametry nebo vytvořte vlastní nastavení.</p>
      </div>

      <div className="space-y-3">
        {/* Custom Settings Option */}
        <button
          type="button"
          onClick={() => onSelect('')}
          className={`
            w-full text-left p-4 rounded-lg border-2 transition-all
            ${selectedConfigId === '' 
              ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex items-start gap-4">
            <div className={`
              p-3 rounded-lg
              ${selectedConfigId === '' ? 'bg-primary-100' : 'bg-gray-100'}
            `}>
              <Settings className={`w-6 h-6 ${selectedConfigId === '' ? 'text-primary-600' : 'text-gray-600'}`} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">Vlastní nastavení</h3>
                {selectedConfigId === '' && (
                  <CheckCircle className="w-5 h-5 text-primary-600" />
                )}
              </div>
              <p className="text-sm text-gray-600">
                Nastavte parametry manuálně v dalším kroku
              </p>
            </div>
          </div>
        </button>

        {/* Existing Configurations */}
        {configurations.map(config => {
          const isSelected = config.id === selectedConfigId;
          
          return (
            <button
              key={config.id}
              type="button"
              onClick={() => onSelect(config.id)}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  p-3 rounded-lg
                  ${isSelected ? 'bg-primary-100' : 'bg-gray-100'}
                `}>
                  <Settings className={`w-6 h-6 ${isSelected ? 'text-primary-600' : 'text-gray-600'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {config.name}
                    </h3>
                    {config.is_default && (
                      <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3" />
                        Výchozí
                      </span>
                    )}
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    )}
                  </div>
                  
                  {config.description && (
                    <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                  )}

                  {/* Key Parameters Preview */}
                  {config.parameters && (
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {config.parameters.fve_power && (
                        <span>FVE: {config.parameters.fve_power} kWp</span>
                      )}
                      {config.parameters.battery_capacity && (
                        <span>Baterie: {config.parameters.battery_capacity} kWh</span>
                      )}
                      {config.parameters.electricity_price && (
                        <span>Cena: {config.parameters.electricity_price} Kč/kWh</span>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-2">
                    Vytvořeno {formatDate(config.created_at)}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Create New Configuration Button */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => navigate('/configurations/new')}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition text-gray-600 hover:text-primary-600"
        >
          <div className="flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            <span className="font-medium">Vytvořit novou konfiguraci</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Step2ConfigSelection;
