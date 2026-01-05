/**
 * Enhanced Configuration Form - Complete mapping from Python GUI
 * All settings from OptimalizaceUI.pyw
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import configurationsService from '../services/configurationsService.js';
import { 
  ArrowLeft, Save, ChevronDown, ChevronUp, 
  Zap, Battery, DollarSign, Settings as SettingsIcon, 
  Info, AlertCircle, Calendar, BarChart3
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { parseErrorMessage } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';

// Helper components defined OUTSIDE main component to prevent re-creation on re-render
const SectionHeader = ({ icon: Icon, title, section, badge, expandedSections, toggleSection }) => (
  <button
    type="button"
    onClick={() => toggleSection(section)}
    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-lg"
  >
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
      {badge && (
        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
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

const InputField = ({ label, value, onChange, unit, type = "number", min, max, step = "0.01", helpText }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="flex items-center gap-2">
      <input
        type={type}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
      />
      {unit && <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[60px]">{unit}</span>}
    </div>
    {helpText && <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>}
  </div>
);

const CheckboxField = ({ label, checked, onChange, helpText }) => {
  const checkboxId = `checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <div className="flex-1">
        <label htmlFor={checkboxId} className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
          {label}
        </label>
        {helpText && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helpText}</p>}
      </div>
    </div>
  );
};

const SelectField = ({ label, value, onChange, options, helpText }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {helpText && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helpText}</p>}
  </div>
);

const ConfigurationFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Section collapse states
  const [expandedSections, setExpandedSections] = useState({
    optimization: true,
    battery: true,
    fve: true,
    pricing: true,
    pmax: true,
    period: true,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false,
    config_data: {
      Optimalizace: {
        optimizationtype: 0, // 0=LinProg, 1=Peaks, 2=Peaks+Supply, 3=APOPT
        vnutitrokspotreby: null, // null or year: 2020, 2021, 2022, 2023, 2024, 2025
        povolitdodavkydositezbaterie: true,
        povolitodberzesitedobaterie: true,
        povolitprekrocenipmax: true,
        vynulovatspotrebnidiagram: false,
        pouzitpredikcispotreby: false,
        pouzitfixnicenu: false,
      },
      Baterie: {
        b_cap: 15, // kWh (stored in UI as kWh, converted to Wh on submit)
        b_effcharge: 95, // % (stored in UI as %, converted to decimal on submit)
        b_effdischarge: 95, // %
        b_max: 95, // %
        b_min: 5, // %
        b_speedcharge: 5, // kW (stored in UI as kW, converted to W on submit)
        b_speeddischarge: 5, // kW
      },
      FVE: {
        pv_powernom: 10, // kWp (stored in UI as kWp, converted to W on submit)
        pv_effconverter: 95, // % (stored in UI as %, converted to decimal on submit)
        pmaxfve: 10, // kW (stored in UI as kW, converted to W on submit)
      },
      Ceny: {
        pricefix: 4.5, // Kč/kWh
        feedistribution: 1.5, // Kč/kWh
        feetrader: 0.5, // Kč/kWh
      },
      Pmax: {
        pmaxodber: 6, // kW (stored in UI as kW, converted to W on submit)
        pmaxdodavka: 6, // kW
      },
      DateRange: {
        mode: 'full', // 'year' = přepočítané na rok, 'full' = z dostupných dat, 'custom' = vlastní rozsah
        start: '2020-01-01', // Start date for custom mode (YYYY-MM-DD)
        end: '2030-01-01', // End date for custom mode (YYYY-MM-DD)
      },
    },
  });

  useEffect(() => {
    if (isEdit && id) {
      loadConfiguration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const data = await configurationsService.getConfiguration(id);
      
      // Convert backend units to UI units
      const uiConfigData = data.config_data ? {
        ...data.config_data,
        Baterie: {
          ...data.config_data.Baterie,
          b_cap: data.config_data.Baterie.b_cap / 1000, // Wh -> kWh
          b_effcharge: data.config_data.Baterie.b_effcharge * 100, // decimal -> %
          b_effdischarge: data.config_data.Baterie.b_effdischarge * 100,
          b_max: data.config_data.Baterie.b_max * 100,
          b_min: data.config_data.Baterie.b_min * 100,
          b_speedcharge: data.config_data.Baterie.b_speedcharge / 1000, // W -> kW
          b_speeddischarge: data.config_data.Baterie.b_speeddischarge / 1000,
        },
        FVE: {
          ...data.config_data.FVE,
          pv_powernom: data.config_data.FVE.pv_powernom / 1000, // W -> kWp
          pv_effconverter: data.config_data.FVE.pv_effconverter * 100, // decimal -> %
          pmaxfve: data.config_data.FVE.pmaxfve / 1000, // W -> kW
        },
        Pmax: {
          ...data.config_data.Pmax,
          pmaxodber: data.config_data.Pmax.pmaxodber / 1000, // W -> kW
          pmaxdodavka: data.config_data.Pmax.pmaxdodavka / 1000,
        },
        DateRange: data.config_data.DateRange || {
          mode: 'full',
          start: '2020-01-01',
          end: '2030-01-01',
        },
      } : formData.config_data;
      
      setFormData({
        name: data.name || '',
        description: data.description || '',
        is_default: data.is_default || false,
        config_data: uiConfigData,
      });
    } catch (err) {
      setError(parseErrorMessage(err));
      showError('Chyba při načítání konfigurace');
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

  const handleConfigChange = (section, key, value, isNumeric = false, isBoolean = false) => {
    setFormData(prev => ({
      ...prev,
      config_data: {
        ...prev.config_data,
        [section]: {
          ...prev.config_data[section],
          [key]: isBoolean ? value : value,
        },
      },
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      
      // Normalize config_data - convert UI units to backend units
      const normalizedConfigData = {
        Optimalizace: {
          ...formData.config_data.Optimalizace,
          optimizationtype: parseInt(formData.config_data.Optimalizace.optimizationtype),
          vnutitrokspotreby: formData.config_data.Optimalizace.vnutitrokspotreby ? 
            parseInt(formData.config_data.Optimalizace.vnutitrokspotreby) : null,
        },
        Baterie: {
          b_cap: (parseFloat(formData.config_data.Baterie.b_cap) || 0) * 1000, // kWh -> Wh
          b_effcharge: (parseFloat(formData.config_data.Baterie.b_effcharge) || 0) / 100, // % -> decimal
          b_effdischarge: (parseFloat(formData.config_data.Baterie.b_effdischarge) || 0) / 100,
          b_max: (parseFloat(formData.config_data.Baterie.b_max) || 0) / 100,
          b_min: (parseFloat(formData.config_data.Baterie.b_min) || 0) / 100,
          b_speedcharge: (parseFloat(formData.config_data.Baterie.b_speedcharge) || 0) * 1000, // kW -> W
          b_speeddischarge: (parseFloat(formData.config_data.Baterie.b_speeddischarge) || 0) * 1000,
        },
        FVE: {
          pv_powernom: (parseFloat(formData.config_data.FVE.pv_powernom) || 0) * 1000, // kWp -> W
          pv_effconverter: (parseFloat(formData.config_data.FVE.pv_effconverter) || 0) / 100, // % -> decimal
          pmaxfve: (parseFloat(formData.config_data.FVE.pmaxfve) || 0) * 1000, // kW -> W
        },
        Ceny: {
          pricefix: parseFloat(formData.config_data.Ceny.pricefix) || 0,
          feedistribution: parseFloat(formData.config_data.Ceny.feedistribution) || 0,
          feetrader: parseFloat(formData.config_data.Ceny.feetrader) || 0,
        },
        Pmax: {
          pmaxodber: (parseFloat(formData.config_data.Pmax.pmaxodber) || 0) * 1000, // kW -> W
          pmaxdodavka: (parseFloat(formData.config_data.Pmax.pmaxdodavka) || 0) * 1000,
        },
        DateRange: {
          mode: formData.config_data.DateRange.mode || 'full',
          start: formData.config_data.DateRange.start,
          end: formData.config_data.DateRange.end,
        },
      };
      
      const payload = {
        name: formData.name,
        description: formData.description,
        is_default: formData.is_default,
        config_data: normalizedConfigData,
      };
      
      if (isEdit) {
        await configurationsService.updateConfiguration(id, payload);
        showSuccess('Konfigurace úspěšně aktualizována');
      } else {
        await configurationsService.createConfiguration(payload);
        showSuccess('Konfigurace úspěšně vytvořena');
      }
      
      navigate('/configurations');
    } catch (err) {
      const errorMsg = parseErrorMessage(err);
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/configurations')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na konfigurace</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Upravit konfiguraci' : 'Nová konfigurace'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Nastavte všechny parametry optimalizace podle vašich potřeb
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Základní informace
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Název konfigurace *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Např. Domácnost 10kWp + 15kWh"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Popis
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Volitelný popis konfigurace..."
            />
          </div>

          <CheckboxField
            label="Nastavit jako výchozí konfiguraci"
            checked={formData.is_default}
            onChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
            helpText="Výchozí konfigurace se automaticky načte při vytváření nového výpočtu"
          />
        </div>

        {/* Optimization Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <SectionHeader 
            icon={BarChart3} 
            title="Typ optimalizace" 
            section="optimization"
            badge="Povinné"
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          
          {expandedSections.optimization && (
            <div className="p-6 space-y-4 border-t border-gray-200 dark:border-gray-700">
              <SelectField
                label="Metoda optimalizace"
                value={formData.config_data.Optimalizace.optimizationtype}
                onChange={(e) => handleConfigChange('Optimalizace', 'optimizationtype', parseInt(e.target.value), true)}
                options={[
                  { value: 0, label: 'Minimalizovat náklady (LinProg)' },
                  { value: 1, label: 'Minimalizovat špičky spotřeby' },
                  { value: 2, label: 'Minimalizovat špičky spotřeby a dodávky' },
                  { value: 3, label: 'Minimalizovat náklady (APOPT)' },
                ]}
                helpText="Zvolte metodu optimalizace podle vašich priorit"
              />

              <SelectField
                label="Vnutit rok spotřeby"
                value={formData.config_data.Optimalizace.vnutitrokspotreby || ''}
                onChange={(e) => handleConfigChange('Optimalizace', 'vnutitrokspotreby', e.target.value === '' ? null : parseInt(e.target.value))}
                options={[
                  { value: '', label: 'Žádný' },
                  { value: 2020, label: '2020' },
                  { value: 2021, label: '2021' },
                  { value: 2022, label: '2022' },
                  { value: 2023, label: '2023' },
                  { value: 2024, label: '2024' },
                  { value: 2025, label: '2025' },
                ]}
                helpText="Volitelně vynuťte konkrétní rok spotřeby pro výpočet"
              />

              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white">Pokročilá nastavení</h4>
                
                <CheckboxField
                  label="Povolit dodávky do sítě z baterie"
                  checked={formData.config_data.Optimalizace.povolitdodavkydositezbaterie}
                  onChange={(checked) => handleConfigChange('Optimalizace', 'povolitdodavkydositezbaterie', checked, false, true)}
                  helpText="Umožní prodej elektřiny do sítě přímo z baterie"
                />

                <CheckboxField
                  label="Povolit odběr ze sítě do baterie"
                  checked={formData.config_data.Optimalizace.povolitodberzesitedobaterie}
                  onChange={(checked) => handleConfigChange('Optimalizace', 'povolitodberzesitedobaterie', checked, false, true)}
                  helpText="Umožní nabíjení baterie přímo ze sítě (např. v noci za levný proud)"
                />

                <CheckboxField
                  label="Povolit překročení Pmax"
                  checked={formData.config_data.Optimalizace.povolitprekrocenipmax}
                  onChange={(checked) => handleConfigChange('Optimalizace', 'povolitprekrocenipmax', checked, false, true)}
                  helpText="Umožní dočasně překročit maximální příkon"
                />

                <CheckboxField
                  label="Vynulovat spotřební diagram"
                  checked={formData.config_data.Optimalizace.vynulovatspotrebnidiagram}
                  onChange={(checked) => handleConfigChange('Optimalizace', 'vynulovatspotrebnidiagram', checked, false, true)}
                  helpText="Pro testovací účely - vynuluje vstupní spotřebu"
                />

                <CheckboxField
                  label="Použít predikci spotřeby"
                  checked={formData.config_data.Optimalizace.pouzitpredikcispotreby}
                  onChange={(checked) => handleConfigChange('Optimalizace', 'pouzitpredikcispotreby', checked, false, true)}
                  helpText="Zapne prediktivní model spotřeby (experimentální)"
                />

                <CheckboxField
                  label="Použít fixní cenu"
                  checked={formData.config_data.Optimalizace.pouzitfixnicenu}
                  onChange={(checked) => handleConfigChange('Optimalizace', 'pouzitfixnicenu', checked, false, true)}
                  helpText="Použije jedinou fixní cenu místo časově proměnných tarifů"
                />
              </div>
            </div>
          )}
        </div>

        {/* Battery Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <SectionHeader 
            icon={Battery} 
            title="Baterie" 
            section="battery"
            badge="Povinné"
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          
          {expandedSections.battery && (
            <div className="p-6 space-y-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Kapacita baterie"
                  value={formData.config_data.Baterie.b_cap}
                  onChange={(e) => handleConfigChange('Baterie', 'b_cap', e.target.value)}
                  unit="kWh"
                  min={0}
                  helpText="Celková kapacita bateriového úložiště"
                />

                <InputField
                  label="Rychlost nabíjení"
                  value={formData.config_data.Baterie.b_speedcharge}
                  onChange={(e) => handleConfigChange('Baterie', 'b_speedcharge', e.target.value)}
                  unit="kW"
                  min={0}
                  helpText="Maximální nabíjecí výkon"
                />

                <InputField
                  label="Rychlost vybíjení"
                  value={formData.config_data.Baterie.b_speeddischarge}
                  onChange={(e) => handleConfigChange('Baterie', 'b_speeddischarge', e.target.value)}
                  unit="kW"
                  min={0}
                  helpText="Maximální vybíjecí výkon"
                />

                <InputField
                  label="Účinnost nabíjení"
                  value={formData.config_data.Baterie.b_effcharge}
                  onChange={(e) => handleConfigChange('Baterie', 'b_effcharge', e.target.value)}
                  unit="%"
                  min={0}
                  step="0.1"
                  helpText="Účinnost při nabíjení baterie"
                />

                <InputField
                  label="Účinnost vybíjení"
                  value={formData.config_data.Baterie.b_effdischarge}
                  onChange={(e) => handleConfigChange('Baterie', 'b_effdischarge', e.target.value)}
                  unit="%"
                  min={0}
                  step="0.1"
                  helpText="Účinnost při vybíjení baterie"
                />

                <InputField
                  label="Maximální nabití"
                  value={formData.config_data.Baterie.b_max}
                  onChange={(e) => handleConfigChange('Baterie', 'b_max', e.target.value)}
                  unit="%"
                  min={0}
                  step="0.1"
                  helpText="Horní limit stavu nabití (SOC)"
                />

                <InputField
                  label="Minimální nabití"
                  value={formData.config_data.Baterie.b_min}
                  onChange={(e) => handleConfigChange('Baterie', 'b_min', e.target.value)}
                  unit="%"
                  min={0}
                  step="0.1"
                  helpText="Dolní limit stavu nabití (SOC)"
                />
              </div>
            </div>
          )}
        </div>

        {/* PV Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <SectionHeader 
            icon={Zap} 
            title="Fotovoltaika" 
            section="fve"
            badge="Povinné"
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          
          {expandedSections.fve && (
            <div className="p-6 space-y-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Nominální výkon"
                  value={formData.config_data.FVE.pv_powernom}
                  onChange={(e) => handleConfigChange('FVE', 'pv_powernom', e.target.value)}
                  unit="kWp"
                  min={0}
                  helpText="Instalovaný výkon FVE elektrárny"
                />

                <InputField
                  label="Účinnost střídače"
                  value={formData.config_data.FVE.pv_effconverter}
                  onChange={(e) => handleConfigChange('FVE', 'pv_effconverter', e.target.value)}
                  unit="%"
                  min={0}
                  step="0.1"
                  helpText="Účinnost DC/AC měniče"
                />

                <InputField
                  label="Omezení výkonu"
                  value={formData.config_data.FVE.pmaxfve}
                  onChange={(e) => handleConfigChange('FVE', 'pmaxfve', e.target.value)}
                  unit="kW"
                  min={0}
                  helpText="Maximální výkon do sítě (limit distribuční soustavy)"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <SectionHeader 
            icon={DollarSign} 
            title="Ceny elektřiny" 
            section="pricing"
            badge="Povinné"
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          
          {expandedSections.pricing && (
            <div className="p-6 space-y-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField
                  label="Fixní cena"
                  value={formData.config_data.Ceny.pricefix}
                  onChange={(e) => handleConfigChange('Ceny', 'pricefix', e.target.value, true)}
                  unit="Kč/kWh"
                  min={0}
                  helpText="Základní cena elektřiny"
                />

                <InputField
                  label="Poplatek distributor"
                  value={formData.config_data.Ceny.feedistribution}
                  onChange={(e) => handleConfigChange('Ceny', 'feedistribution', e.target.value, true)}
                  unit="Kč/kWh"
                  min={0}
                  helpText="Distribuční poplatek"
                />

                <InputField
                  label="Poplatek obchodník"
                  value={formData.config_data.Ceny.feetrader}
                  onChange={(e) => handleConfigChange('Ceny', 'feetrader', e.target.value, true)}
                  unit="Kč/kWh"
                  min={0}
                  helpText="Poplatek za obchod"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pmax Limits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <SectionHeader 
            icon={SettingsIcon} 
            title="Celkové omezení výkonu" 
            section="pmax"
            badge="Povinné"
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          
          {expandedSections.pmax && (
            <div className="p-6 space-y-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Maximální dodávka"
                  value={formData.config_data.Pmax.pmaxdodavka}
                  onChange={(e) => handleConfigChange('Pmax', 'pmaxdodavka', e.target.value)}
                  unit="kW"
                  min={0}
                  helpText="Maximální výkon dodávaný do sítě"
                />

                <InputField
                  label="Maximální odběr"
                  value={formData.config_data.Pmax.pmaxodber}
                  onChange={(e) => handleConfigChange('Pmax', 'pmaxodber', e.target.value)}
                  unit="kW"
                  min={0}
                  helpText="Maximální příkon z distribuční sítě"
                />
              </div>
            </div>
          )}
        </div>

        {/* Date Range Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <SectionHeader 
            icon={Calendar} 
            title="Rozmezí kalkulace" 
            section="period"
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
          
          {expandedSections.period && (
            <div className="p-6 space-y-4 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Způsob zobrazení výsledků</p>
                    <p>Zvolte, jak mají být prezentovány výsledky kalkulace - přepočítané na celý rok, pouze z dostupných dat, nebo pro vlastní časové rozmezí.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Režim zobrazení výsledků
                </label>
                
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="dateRangeMode"
                      value="year"
                      checked={formData.config_data.DateRange.mode === 'year'}
                      onChange={(e) => handleConfigChange('DateRange', 'mode', e.target.value)}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Výsledky přepočítané na jeden rok (365 dní)
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Statistické přepočtení na roční období
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="dateRangeMode"
                      value="full"
                      checked={formData.config_data.DateRange.mode === 'full'}
                      onChange={(e) => handleConfigChange('DateRange', 'mode', e.target.value)}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Výsledky pouze z dostupných dat
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Skutečné období ze vstupních souborů
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="dateRangeMode"
                      value="custom"
                      checked={formData.config_data.DateRange.mode === 'custom'}
                      onChange={(e) => handleConfigChange('DateRange', 'mode', e.target.value)}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Zvolit vlastní rozsah
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Definovat konkrétní časové období
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {formData.config_data.DateRange.mode === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Datum od
                    </label>
                    <input
                      type="date"
                      value={formData.config_data.DateRange.start}
                      onChange={(e) => handleConfigChange('DateRange', 'start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Začátek kalkulačního období (včetně)</p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Datum do
                    </label>
                    <input
                      type="date"
                      value={formData.config_data.DateRange.end}
                      onChange={(e) => handleConfigChange('DateRange', 'end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Konec kalkulačního období (nevčetně)</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate('/configurations')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Zrušit
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Ukládám...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'Uložit změny' : 'Vytvořit konfiguraci'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfigurationFormPage;
