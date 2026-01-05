/**
 * Configuration Form Page - Create/Edit configuration with dynamic sections
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import configurationsService from '../services/configurationsService.js';
import { 
  ArrowLeft, Save, ChevronDown, ChevronUp, 
  Zap, Battery, DollarSign, Settings as SettingsIcon, 
  Info, AlertCircle, Eye, TrendingUp
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import { parseErrorMessage, formatNumber, formatCurrency } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';

const ConfigurationFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Section collapse states
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    fve: true,
    battery: true,
    pricing: true,
    optimization: false,
  });
  
  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Show preview panel
  const [showPreview, setShowPreview] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false,
    parameters: {
      fve_power: 10,
      battery_capacity: 15,
      battery_power: 5,
      electricity_price: 4.5,
      feedin_tariff: 1.5,
      grid_connection_fee: 50,
      vat_rate: 21,
      pv_degradation: 0.5,
      battery_efficiency: 95,
      inverter_efficiency: 97,
      optimization_horizon: 24,
      time_resolution: 1,
    },
  });

  useEffect(() => {
    if (isEdit) {
      loadConfiguration();
    }
  }, [id]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const data = await configurationsService.getConfiguration(id);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        is_default: data.is_default || false,
        parameters: data.parameters || formData.parameters,
      });
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleParamChange = (param, value) => {
    const numValue = parseFloat(value) || 0;
    
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [param]: numValue,
      },
    }));
    
    // Validate field
    validateField(param, numValue);
  };
  
  const validateField = (param, value) => {
    const errors = { ...fieldErrors };
    
    // Validation rules
    const rules = {
      fve_power: { min: 0, max: 1000, message: 'Výkon FVE musí být 0-1000 kWp' },
      battery_capacity: { min: 0, max: 500, message: 'Kapacita baterie musí být 0-500 kWh' },
      battery_power: { min: 0, max: 100, message: 'Výkon baterie musí být 0-100 kW' },
      electricity_price: { min: 0, max: 50, message: 'Cena elektřiny musí být 0-50 Kč/kWh' },
      feedin_tariff: { min: 0, max: 20, message: 'Výkupní cena musí být 0-20 Kč/kWh' },
      pv_degradation: { min: 0, max: 5, message: 'Degradace musí být 0-5 %' },
      battery_efficiency: { min: 50, max: 100, message: 'Účinnost baterie musí být 50-100 %' },
      inverter_efficiency: { min: 50, max: 100, message: 'Účinnost střídače musí být 50-100 %' },
    };
    
    if (rules[param]) {
      const rule = rules[param];
      if (value < rule.min || value > rule.max) {
        errors[param] = rule.message;
      } else {
        delete errors[param];
      }
    }
    
    setFieldErrors(errors);
  };
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for validation errors
    if (Object.keys(fieldErrors).length > 0) {
      showError('Opravte prosím chyby ve formuláři');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Transform formData to backend format
      const payload = {
        name: formData.name,
        description: formData.description,
        is_default: formData.is_default,
        config_data: {
          Optimalizace: {
            optimizationtype: 0,
            optimization_horizon: formData.parameters.optimization_horizon,
            time_resolution: formData.parameters.time_resolution,
          },
          Baterie: {
            b_cap: formData.parameters.battery_capacity * 1000, // kWh to Wh
            b_power: formData.parameters.battery_power * 1000, // kW to W
            b_effcharge: formData.parameters.battery_efficiency / 100,
            b_effdischarge: formData.parameters.battery_efficiency / 100,
          },
          FVE: {
            pv_powernom: formData.parameters.fve_power * 1000, // kWp to W
            pv_eff: formData.parameters.inverter_efficiency / 100,
            pv_degradation: formData.parameters.pv_degradation / 100,
          },
          Ceny: {
            pricefix: formData.parameters.electricity_price,
            feedin_tariff: formData.parameters.feedin_tariff,
            grid_fee: formData.parameters.grid_connection_fee,
            vat_rate: formData.parameters.vat_rate / 100,
          },
          Pmax: {
            pmaxodber: 6000, // Default value
          }
        }
      };
      
      if (isEdit) {
        await configurationsService.updateConfiguration(id, payload);
        showSuccess('Konfigurace úspěšně aktualizována');
      } else {
        await configurationsService.createConfiguration(payload);
        showSuccess('Konfigurace úspěšně vytvořena');
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/configurations');
      }, 1500);
    } catch (err) {
      setError(parseErrorMessage(err));
      showError('Nepodařilo se uložit konfiguraci');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Calculate preview values
  const previewCalcs = {
    maxDailyProduction: (formData.parameters.fve_power * 5).toFixed(1), // avg 5h/day
    batteryEnergyValue: (formData.parameters.battery_capacity * formData.parameters.electricity_price).toFixed(0),
    dailySavingsPotential: (formData.parameters.fve_power * 5 * formData.parameters.electricity_price * 0.7).toFixed(0),
    paybackYears: (((formData.parameters.fve_power * 35000 + formData.parameters.battery_capacity * 15000) / 
                   (formData.parameters.fve_power * 5 * 365 * formData.parameters.electricity_price * 0.7)) || 0).toFixed(1),
  };

  // Tooltip component
  const Tooltip = ({ text }) => (
    <div className="group relative inline-block">
      <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
      <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-xs text-white bg-gray-900 rounded-lg shadow-lg -left-28">
        {text}
      </div>
    </div>
  );
  
  // Section header component
  const SectionHeader = ({ icon: Icon, title, section, badge }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg transition"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {badge && (
          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">
            {badge}
          </span>
        )}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-5 h-5 text-gray-500" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-500" />
      )}
    </button>
  );
  
  // Input field with validation
  const InputField = ({ label, param, value, step = "0.1", required = false, tooltip, unit }) => (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
        <span>{label} {required && <span className="text-red-500">*</span>}</span>
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => handleParamChange(param, e.target.value)}
          required={required}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${
            fieldErrors[param] 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-gray-300 focus:border-primary-500'
          } ${unit ? 'pr-16' : ''}`}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {unit}
          </span>
        )}
      </div>
      {fieldErrors[param] && (
        <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>{fieldErrors[param]}</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <LoadingSpinner text="Načítání konfigurace..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/configurations')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Zpět na konfigurace</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Upravit konfiguraci' : 'Nová konfigurace'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? 'Upravte parametry konfigurace' : 'Vytvořte novou konfiguraci pro opakované použití'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition"
          >
            <Eye className="w-5 h-5" />
            <span>{showPreview ? 'Skrýt náhled' : 'Zobrazit náhled'}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />}
      {success && <Alert type="success" message={isEdit ? 'Konfigurace aktualizována!' : 'Konfigurace vytvořena!'} className="mb-6" />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className={`${showPreview ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
          {/* Basic Info Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <SectionHeader icon={SettingsIcon} title="Základní informace" section="basic" badge="Povinné" />
            {expandedSections.basic && (
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <span>Název konfigurace <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="Např. Standardní nastavení FVE"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    Popis (nepovinné)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="Podrobný popis konfigurace..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_default" className="text-sm font-medium text-gray-700">
                    Nastavit jako výchozí konfiguraci
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* FVE Parameters Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <SectionHeader icon={Zap} title="Parametry FVE" section="fve" />
            {expandedSections.fve && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label="Instalovaný výkon"
                  param="fve_power"
                  value={formData.parameters.fve_power}
                  step="0.1"
                  required
                  unit="kWp"
                  tooltip="Celkový výkon fotovoltaické elektrárny v kilowatt-peaku (kWp)"
                />
                
                <InputField 
                  label="Degradace FVE"
                  param="pv_degradation"
                  value={formData.parameters.pv_degradation}
                  step="0.1"
                  unit="% / rok"
                  tooltip="Roční pokles výkonu FVE vlivem stárnutí (obvykle 0.5-1% ročně)"
                />
                
                <InputField 
                  label="Účinnost střídače"
                  param="inverter_efficiency"
                  value={formData.parameters.inverter_efficiency}
                  step="0.1"
                  unit="%"
                  tooltip="Účinnost přeměny DC energie na AC (obvykle 95-98%)"
                />
              </div>
            )}
          </div>

          {/* Battery Parameters Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <SectionHeader icon={Battery} title="Parametry baterie" section="battery" />
            {expandedSections.battery && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label="Kapacita baterie"
                  param="battery_capacity"
                  value={formData.parameters.battery_capacity}
                  step="0.1"
                  required
                  unit="kWh"
                  tooltip="Celková energetická kapacita bateriového úložiště"
                />
                
                <InputField 
                  label="Výkon baterie"
                  param="battery_power"
                  value={formData.parameters.battery_power}
                  step="0.1"
                  required
                  unit="kW"
                  tooltip="Maximální nabíjecí a vybíjecí výkon baterie"
                />
                
                <InputField 
                  label="Účinnost baterie"
                  param="battery_efficiency"
                  value={formData.parameters.battery_efficiency}
                  step="0.1"
                  unit="%"
                  tooltip="Účinnost nabíjení a vybíjení baterie (obvykle 90-96%)"
                />
              </div>
            )}
          </div>

          {/* Pricing Parameters Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <SectionHeader icon={DollarSign} title="Cenové parametry" section="pricing" />
            {expandedSections.pricing && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label="Cena elektřiny"
                  param="electricity_price"
                  value={formData.parameters.electricity_price}
                  step="0.1"
                  required
                  unit="Kč/kWh"
                  tooltip="Cena za odebranou elektřinu ze sítě včetně všech poplatků"
                />
                
                <InputField 
                  label="Výkupní cena"
                  param="feedin_tariff"
                  value={formData.parameters.feedin_tariff}
                  step="0.1"
                  required
                  unit="Kč/kWh"
                  tooltip="Cena za dodanou elektřinu do sítě"
                />
                
                <InputField 
                  label="Měsíční platba za distribuci"
                  param="grid_connection_fee"
                  value={formData.parameters.grid_connection_fee}
                  step="1"
                  unit="Kč"
                  tooltip="Stálý měsíční poplatek za připojení k distribuční síti"
                />
                
                <InputField 
                  label="Sazba DPH"
                  param="vat_rate"
                  value={formData.parameters.vat_rate}
                  step="1"
                  unit="%"
                  tooltip="Sazba daně z přidané hodnoty na elektřinu"
                />
              </div>
            )}
          </div>

          {/* Optimization Parameters Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <SectionHeader icon={TrendingUp} title="Parametry optimalizace" section="optimization" />
            {expandedSections.optimization && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label="Horizont optimalizace"
                  param="optimization_horizon"
                  value={formData.parameters.optimization_horizon}
                  step="1"
                  unit="hodiny"
                  tooltip="Časový horizont pro optimalizaci řízení baterie (obvykle 24-48 hodin)"
                />
                
                <InputField 
                  label="Časové rozlišení"
                  param="time_resolution"
                  value={formData.parameters.time_resolution}
                  step="0.1"
                  unit="hodiny"
                  tooltip="Časový krok pro výpočty (obvykle 0.5-1 hodina)"
                />
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/configurations')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Zrušit
              </button>
              <button
                type="submit"
                disabled={submitting || success || Object.keys(fieldErrors).length > 0}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isEdit ? 'Ukládám...' : 'Vytvářím...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{isEdit ? 'Uložit změny' : 'Vytvořit konfiguraci'}</span>
                  </>
                )}
              </button>
            </div>
            {Object.keys(fieldErrors).length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>Opravte prosím chyby ve formuláři před uložením</span>
              </div>
            )}
          </div>
        </form>

        {/* Preview Panel */}
        {showPreview && (
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg shadow-sm p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Náhled výpočtu</h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Max. denní výroba</div>
                  <div className="text-2xl font-bold text-primary-600">
                    {previewCalcs.maxDailyProduction} kWh
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Při průměru 5 slunečních hodin
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Hodnota baterie</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(previewCalcs.batteryEnergyValue)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Energie při plném nabití
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Potenciální úspora / den</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(previewCalcs.dailySavingsPotential)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Při 70% vlastní spotřebě
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Odhadovaná návratnost</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {previewCalcs.paybackYears} let
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Zjednodušený odhad bez dotací
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                  <div className="flex gap-2">
                    <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      Náhled je orientační a slouží pro rychlou kontrolu zadaných hodnot. 
                      Skutečné výsledky závisí na reálných datech spotřeby a výroby.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationFormPage;
