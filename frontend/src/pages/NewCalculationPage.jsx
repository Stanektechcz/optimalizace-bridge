/**
 * New Calculation Page - Create calculation with wizard
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import calculationsService from '../services/calculationsService.js';
import filesService from '../services/filesService.js';
import configurationsService from '../services/configurationsService.js';
import { ArrowLeft, ArrowRight, Play, ChevronLeft } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import { parseErrorMessage } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';
import WizardSteps from '../components/calculations/WizardSteps';
import Step1FileSelection from '../components/calculations/Step1FileSelection';
import Step2ConfigSelection from '../components/calculations/Step2ConfigSelection';
import Step3Parameters from '../components/calculations/Step3Parameters';
import Step4Review from '../components/calculations/Step4Review';

const WIZARD_STEPS = [
  { id: 'file', title: 'Vstupní soubor', description: 'Výběr dat' },
  { id: 'config', title: 'Konfigurace', description: 'Předvolby' },
  { id: 'params', title: 'Parametry', description: 'Nastavení' },
  { id: 'review', title: 'Kontrola', description: 'Spuštění' },
];

const NewCalculationPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [files, setFiles] = useState([]);
  const [configurations, setConfigurations] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    input_file_id: '',
    configuration_id: '',
    input_params: {
      Obecne: {
        slozka_diagramy: 'data_input/',
        slozka_zpracovane: 'data_ready/',
      },
      Optimalizace: {
        vnutitrokspotreby: null,
        optimizationtype: 0,
        optimization_horizon: 24,
        time_resolution: 1,
        povolitdodavkydositezbaterie: true,
        povolitodberzesitedobaterie: true,
        povolitprekrocenipmax: true,
        vynulovatspotrebnidiagram: false,
        pouzitfixnicenu: false,
        pouzitpredikcispotreby: false,
        simulaceskutecnehoprovozu: false,
      },
      Pmax: {
        pmaxodber: 0.4, // kW (stored in UI as kW, converted to W on submit)
        pmaxdodavka: 0.2,
      },
      Baterie: {
        b_cap: 1.0, // kWh (stored in UI as kWh, converted to Wh on submit)
        b_max: 95, // % (stored in UI as %, converted to decimal on submit)
        b_min: 5,
        b_effcharge: 98,
        b_effdischarge: 98,
        b_speedcharge: 0.2, // kW (stored in UI as kW, converted to W on submit)
        b_speeddischarge: 0.2,
      },
      FVE: {
        pv_powernom: 0.2, // kWp (stored in UI as kWp, converted to W on submit)
        pv_effconverter: 95, // % (stored in UI as %, converted to decimal on submit)
        pmaxfve: 2, // kW (stored in UI as kW, converted to W on submit)
      },
      Ceny: {
        pricefix: 3.5,
        feedistribution: 0.5,
        feetrader: 0.5,
      },
      Export: {
        export: false,
        exportfile: 'export.xlsx',
      },
      Graf: {
        stylgrafu: 1,
        automatickyzobrazitdennigraf: false,
      },
      DateRange: {
        mode: 'full', // 'year' = přepočítané na rok, 'full' = z dostupných dat, 'custom' = vlastní rozsah
        start: '2020-01-01',
        end: '2030-01-01',
      },
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [filesData, configsData] = await Promise.all([
        filesService.getFiles(),
        configurationsService.getConfigurations(),
      ]);
      setFiles(filesData.files || []);
      setConfigurations(configsData.configurations || []);

      // Set default configuration if available
      const defaultConfig = configsData.configurations?.find(c => c.is_default);
      if (defaultConfig && defaultConfig.config_data) {
        // Convert backend units to UI units
        const uiParams = {
          ...defaultConfig.config_data,
          Baterie: defaultConfig.config_data.Baterie ? {
            ...defaultConfig.config_data.Baterie,
            b_cap: defaultConfig.config_data.Baterie.b_cap / 1000,
            b_max: defaultConfig.config_data.Baterie.b_max * 100,
            b_min: defaultConfig.config_data.Baterie.b_min * 100,
            b_effcharge: defaultConfig.config_data.Baterie.b_effcharge * 100,
            b_effdischarge: defaultConfig.config_data.Baterie.b_effdischarge * 100,
            b_speedcharge: defaultConfig.config_data.Baterie.b_speedcharge / 1000,
            b_speeddischarge: defaultConfig.config_data.Baterie.b_speeddischarge / 1000,
          } : defaultConfig.config_data.Baterie,
          FVE: defaultConfig.config_data.FVE ? {
            ...defaultConfig.config_data.FVE,
            pv_powernom: defaultConfig.config_data.FVE.pv_powernom / 1000,
            pv_effconverter: defaultConfig.config_data.FVE.pv_effconverter * 100,
            pmaxfve: defaultConfig.config_data.FVE.pmaxfve / 1000,
          } : defaultConfig.config_data.FVE,
          Pmax: defaultConfig.config_data.Pmax ? {
            ...defaultConfig.config_data.Pmax,
            pmaxodber: defaultConfig.config_data.Pmax.pmaxodber / 1000,
            pmaxdodavka: defaultConfig.config_data.Pmax.pmaxdodavka / 1000,
          } : defaultConfig.config_data.Pmax,
        };
        
        setFormData(prev => ({
          ...prev,
          configuration_id: defaultConfig.id,
          input_params: uiParams,
        }));
      }
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (fileId) => {
    setFormData(prev => ({ ...prev, input_file_id: fileId }));
    setError('');
  };

  const handleConfigSelect = (configId) => {
    const config = configurations.find(c => c.id === configId);
    
    // Convert backend units to UI units if config has config_data structure
    let uiParams = config?.config_data || formData.input_params;
    if (config?.config_data) {
      uiParams = {
        ...config.config_data,
        Baterie: config.config_data.Baterie ? {
          ...config.config_data.Baterie,
          b_cap: config.config_data.Baterie.b_cap / 1000, // Wh -> kWh
          b_max: config.config_data.Baterie.b_max * 100, // decimal -> %
          b_min: config.config_data.Baterie.b_min * 100,
          b_effcharge: config.config_data.Baterie.b_effcharge * 100,
          b_effdischarge: config.config_data.Baterie.b_effdischarge * 100,
          b_speedcharge: config.config_data.Baterie.b_speedcharge / 1000, // W -> kW
          b_speeddischarge: config.config_data.Baterie.b_speeddischarge / 1000,
        } : config.config_data.Baterie,
        FVE: config.config_data.FVE ? {
          ...config.config_data.FVE,
          pv_powernom: config.config_data.FVE.pv_powernom / 1000, // W -> kWp
          pv_effconverter: config.config_data.FVE.pv_effconverter * 100, // decimal -> %
          pmaxfve: config.config_data.FVE.pmaxfve / 1000, // W -> kW
        } : config.config_data.FVE,
        Pmax: config.config_data.Pmax ? {
          ...config.config_data.Pmax,
          pmaxodber: config.config_data.Pmax.pmaxodber / 1000, // W -> kW
          pmaxdodavka: config.config_data.Pmax.pmaxdodavka / 1000,
        } : config.config_data.Pmax,
      };
    }
    
    setFormData(prev => ({
      ...prev,
      configuration_id: configId,
      input_params: uiParams,
    }));
    setError('');
  };

  // Map flat UI parameters to backend structure
  const mapParamsToBackend = (flatParams) => {
    // Helper to ensure numeric conversion
    const toNum = (val, fallback = 0) => {
      const num = parseFloat(val);
      return isNaN(num) ? fallback : num;
    };
    
    const toPercent = (val, fallback = 0) => {
      const num = parseFloat(val);
      return isNaN(num) ? fallback : num / 100;
    };
    
    // If already in correct format (has sections), normalize and return
    if (flatParams.Optimalizace && flatParams.Baterie && flatParams.FVE && flatParams.Ceny && flatParams.Pmax) {
      return {
        Optimalizace: {
          ...flatParams.Optimalizace,
          optimizationtype: parseInt(flatParams.Optimalizace.optimizationtype) || 0,
          vnutitrokspotreby: flatParams.Optimalizace.vnutitrokspotreby ? 
            parseInt(flatParams.Optimalizace.vnutitrokspotreby) : null,
        },
        Baterie: {
          b_cap: toNum(flatParams.Baterie.b_cap, 15000),
          b_effcharge: toPercent(flatParams.Baterie.b_effcharge, 95),
          b_effdischarge: toPercent(flatParams.Baterie.b_effdischarge, 95),
          b_max: toPercent(flatParams.Baterie.b_max, 95),
          b_min: toPercent(flatParams.Baterie.b_min, 5),
          b_speedcharge: toNum(flatParams.Baterie.b_speedcharge, 5000),
          b_speeddischarge: toNum(flatParams.Baterie.b_speeddischarge, 5000),
        },
        FVE: {
          pv_powernom: toNum(flatParams.FVE.pv_powernom, 10000),
          pv_effconverter: toPercent(flatParams.FVE.pv_effconverter, 95),
          pmaxfve: toNum(flatParams.FVE.pmaxfve, 10000),
        },
        Ceny: {
          pricefix: toNum(flatParams.Ceny.pricefix, 4.5),
          feedistribution: toNum(flatParams.Ceny.feedistribution, 1.5),
          feetrader: toNum(flatParams.Ceny.feetrader, 0.5),
        },
        Pmax: {
          pmaxodber: toNum(flatParams.Pmax.pmaxodber, 6000),
          pmaxdodavka: toNum(flatParams.Pmax.pmaxdodavka, 6000),
        },
        DateRange: flatParams.DateRange || {
          mode: 'full',
          start: '2020-01-01',
          end: '2030-01-01',
        },
      };
    }
    
    // Otherwise map flat structure to sections (convert UI units to backend)
    return {
      Optimalizace: {
        vnutitrokspotreby: flatParams.vnutitrokspotreby ?? null,
        optimizationtype: flatParams.optimizationtype ?? 0,
        povolitdodavkydositezbaterie: flatParams.povolitdodavkydositezbaterie ?? true,
        povolitodberzesitedobaterie: flatParams.povolitodberzesitedobaterie ?? true,
        povolitprekrocenipmax: flatParams.povolitprekrocenipmax ?? true,
        vynulovatspotrebnidiagram: flatParams.vynulovatspotrebnidiagram ?? false,
        pouzitfixnicenu: flatParams.pouzitfixnicenu ?? false,
        pouzitpredikcispotreby: flatParams.pouzitpredikcispotreby ?? false,
        simulaceskutecnehoprovozu: flatParams.simulaceskutecnehoprovozu ?? false,
      },
      Pmax: {
        pmaxodber: toNum(flatParams.pmaxodber ?? flatParams.battery_power ?? 0.4, 400) * 1000, // kW -> W
        pmaxdodavka: toNum(flatParams.pmaxdodavka ?? 0.2, 200) * 1000,
      },
      Baterie: {
        b_cap: toNum(flatParams.b_cap ?? flatParams.battery_capacity ?? 1, 1000) * 1000, // kWh -> Wh
        b_max: toPercent(flatParams.b_max ?? 95, 95),
        b_min: toPercent(flatParams.b_min ?? 5, 5),
        b_effcharge: toPercent(flatParams.b_effcharge ?? (flatParams.battery_efficiency ?? 98), 98),
        b_effdischarge: toPercent(flatParams.b_effdischarge ?? (flatParams.battery_efficiency ?? 98), 98),
        b_speedcharge: toNum(flatParams.b_speedcharge ?? flatParams.battery_power ?? 0.2, 200) * 1000, // kW -> W
        b_speeddischarge: toNum(flatParams.b_speeddischarge ?? flatParams.battery_power ?? 0.2, 200) * 1000,
      },
      FVE: {
        pv_powernom: toNum(flatParams.pv_powernom ?? flatParams.fve_power ?? 0.2, 200) * 1000, // kWp -> W
        pv_effconverter: toPercent(flatParams.pv_effconverter ?? 95, 95),
        pmaxfve: toNum(flatParams.pmaxfve ?? 2, 2000) * 1000, // kW -> W
      },
      Ceny: {
        pricefix: toNum(flatParams.pricefix ?? flatParams.electricity_price ?? 3.5, 3.5),
        feedistribution: toNum(flatParams.feedistribution ?? flatParams.feedin_tariff ?? 0.5, 0.5),
        feetrader: toNum(flatParams.feetrader ?? flatParams.fixed_fee ?? 0.5, 0.5),
      },
      DateRange: flatParams.DateRange || {
        mode: 'full',
        start: '2020-01-01',
        end: '2030-01-01',
      },
    };
  };

  const handleParamChange = (section, param, value) => {
    setFormData(prev => ({
      ...prev,
      input_params: {
        ...prev.input_params,
        [section]: {
          ...prev.input_params[section],
          [param]: value,
        },
      },
    }));
  };

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1 && !formData.input_file_id) {
      setError('Vyberte vstupní soubor');
      return;
    }

    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(prev => prev + 1);
      setError('');
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!formData.input_file_id) {
      setError('Vyberte vstupní soubor');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Generate name if not provided
      const selectedFile = files.find(f => f.id === formData.input_file_id);
      const calculationName = formData.name || 
        `Kalkulace ${selectedFile?.original_filename || 'FVE'} - ${new Date().toLocaleDateString('cs-CZ')}`;
      
      // Convert input_params to backend format with sections
      const backendParams = mapParamsToBackend(formData.input_params);
      
      const payload = {
        name: calculationName,
        description: formData.description,
        file_ids: formData.input_file_id ? [formData.input_file_id] : null,
        configuration_id: formData.configuration_id || null,
        input_params: backendParams,
      };

      const result = await calculationsService.createCalculation(payload);
      showSuccess('Kalkulace úspěšně vytvořena!');
      
      setTimeout(() => {
        navigate(`/calculations/${result.id}`);
      }, 1000);
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
      <div className="max-w-5xl mx-auto">
        <LoadingSpinner text="Načítání formuláře..." />
      </div>
    );
  }

  const selectedFile = files.find(f => f.id === formData.input_file_id);
  const selectedConfig = configurations.find(c => c.id === formData.configuration_id);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/calculations')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Zpět na kalkulace</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Nová kalkulace</h1>
        <p className="text-gray-600 mt-1">Průvodce vytvořením nového výpočtu energetické bilance</p>
      </div>

      {/* Wizard Steps */}
      <WizardSteps steps={WIZARD_STEPS} currentStep={currentStep} />

      {/* Error Alert */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />}

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        {currentStep === 1 && (
          <Step1FileSelection
            files={files}
            selectedFileId={formData.input_file_id}
            onSelect={handleFileSelect}
          />
        )}

        {currentStep === 2 && (
          <Step2ConfigSelection
            configurations={configurations}
            selectedConfigId={formData.configuration_id}
            onSelect={handleConfigSelect}
          />
        )}

        {currentStep === 3 && (
          <Step3Parameters
            parameters={formData.input_params}
            onChange={handleParamChange}
          />
        )}

        {currentStep === 4 && (
          <Step4Review
            selectedFile={selectedFile}
            selectedConfig={selectedConfig}
            parameters={formData.input_params}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Předchozí</span>
        </button>

        <div className="text-sm text-gray-500">
          Krok {currentStep} z {WIZARD_STEPS.length}
        </div>

        {currentStep < WIZARD_STEPS.length ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition"
          >
            <span>Další</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Spouštím...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Spustit kalkulaci</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default NewCalculationPage;
