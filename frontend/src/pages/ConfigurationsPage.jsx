/**
 * Configurations Page - Manage calculation configurations
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import configurationsService from '../services/configurationsService.js';
import { Settings, Plus, Search, Edit2, Trash2, Star, Copy, Download, Upload, FileJson, Tag } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import Modal from '../components/common/Modal';
import { formatDateTime, parseErrorMessage } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';

const ConfigurationsPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showErrorToast } = useToast();
  const fileInputRef = useRef(null);
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'templates', 'custom'

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await configurationsService.getConfigurations();
      setConfigurations(data.configurations || []);
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (configId) => {
    try {
      await configurationsService.setAsDefault(configId);
      setSuccess('Výchozí konfigurace nastavena');
      showSuccess('Výchozí konfigurace úspěšně nastavena');
      loadConfigurations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(parseErrorMessage(err));
      showErrorToast('Nepodařilo se nastavit výchozí konfiguraci');
    }
  };

  const handleDelete = async () => {
    if (!configToDelete) return;
    try {
      await configurationsService.deleteConfiguration(configToDelete.id);
      setConfigurations(configurations.filter(c => c.id !== configToDelete.id));
      setSuccess('Konfigurace smazána');
      showSuccess('Konfigurace úspěšně smazána');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(parseErrorMessage(err));
      showErrorToast('Nepodařilo se smazat konfiguraci');
    } finally {
      setShowDeleteModal(false);
      setConfigToDelete(null);
    }
  };

  const handleClone = async (config) => {
    try {
      const clonedData = {
        name: `${config.name} (kopie)`,
        description: config.description,
        parameters: config.parameters
      };
      const result = await configurationsService.createConfiguration(clonedData);
      showSuccess('Konfigurace úspěšně naklonována');
      loadConfigurations();
    } catch (err) {
      showErrorToast('Nepodařilo se naklonovat konfiguraci');
      setError(parseErrorMessage(err));
    }
  };

  const handleExport = (config) => {
    try {
      const exportData = {
        name: config.name,
        description: config.description,
        parameters: config.parameters,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `config-${config.name.replace(/\s+/g, '-').toLowerCase()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess('Konfigurace exportována do JSON');
    } catch (err) {
      showErrorToast('Nepodařilo se exportovat konfiguraci');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showErrorToast('Prosím, nahrajte platný JSON soubor');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Validate structure
        if (!data.name || !data.parameters) {
          showErrorToast('Neplatná struktura JSON souboru');
          return;
        }

        setImportData(data);
        setShowImportModal(true);
      } catch (err) {
        showErrorToast('Nepodařilo se načíst JSON soubor');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = '';
  };

  const handleImportConfirm = async () => {
    if (!importData) return;

    try {
      const configData = {
        name: importData.name,
        description: importData.description || '',
        parameters: importData.parameters
      };
      await configurationsService.createConfiguration(configData);
      showSuccess('Konfigurace úspěšně importována');
      loadConfigurations();
      setShowImportModal(false);
      setImportData(null);
    } catch (err) {
      showErrorToast('Nepodařilo se importovat konfiguraci');
      setError(parseErrorMessage(err));
    }
  };

  const handleToggleTemplate = async (config) => {
    try {
      // Simulace - v produkčním prostředí by zde byl API call
      // await configurationsService.toggleTemplate(config.id);
      
      // Pro demonstraci aktualizujeme lokální stav
      setConfigurations(configurations.map(c => 
        c.id === config.id ? { ...c, is_template: !c.is_template } : c
      ));
      
      const message = config.is_template 
        ? 'Konfigurace odstraněna ze šablon'
        : 'Konfigurace nastavena jako šablona';
      showSuccess(message);
    } catch (err) {
      showErrorToast('Nepodařilo se změnit stav šablony');
    }
  };

  const filteredConfigurations = configurations
    .filter((config) => config.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((config) => {
      if (filterType === 'templates') return config.is_template;
      if (filterType === 'custom') return !config.is_template;
      return true;
    });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <LoadingSpinner text="Načítání konfigurací..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Konfigurace</h1>
            <p className="text-gray-600 mt-1">Správa přednastavených konfigurací pro výpočty</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleImportClick}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition"
            >
              <Upload className="w-5 h-5" />
              <span>Import JSON</span>
            </button>
            <button
              onClick={() => navigate('/configurations/new')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              <span>Nová konfigurace</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Settings className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Celkem konfigurací</p>
              <p className="text-2xl font-bold text-gray-900">{configurations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Šablony</p>
              <p className="text-2xl font-bold text-gray-900">
                {configurations.filter(c => c.is_template).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Copy className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Vlastní konfigurace</p>
              <p className="text-2xl font-bold text-gray-900">
                {configurations.filter(c => !c.is_template).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Výchozí</p>
              <p className="text-2xl font-bold text-gray-900">
                {configurations.filter(c => c.is_default).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} className="mb-6" />}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Hledat konfigurace..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                filterType === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vše ({configurations.length})
            </button>
            <button
              onClick={() => setFilterType('templates')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                filterType === 'templates'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Šablony ({configurations.filter(c => c.is_template).length})
            </button>
            <button
              onClick={() => setFilterType('custom')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                filterType === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vlastní ({configurations.filter(c => !c.is_template).length})
            </button>
          </div>
        </div>
      </div>

      {/* Configurations Grid */}
      {filteredConfigurations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {configurations.length === 0 ? 'Zatím žádné konfigurace' : 'Žádné konfigurace neodpovídají vyhledávání'}
          </h3>
          <p className="text-gray-600 mb-4">
            {configurations.length === 0
              ? 'Vytvořte svou první konfiguraci pro opakované použití v kalkulacích'
              : 'Zkuste změnit vyhledávací výraz'}
          </p>
          {configurations.length === 0 && (
            <button
              onClick={() => navigate('/configurations/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              <span>Nová konfigurace</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConfigurations.map((config) => (
            <div
              key={config.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-gray-900">{config.name || 'Bez názvu'}</h3>
                  </div>
                  <div className="flex flex-col gap-1">
                    {config.is_default && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Výchozí</span>
                      </span>
                    )}
                    {config.is_template && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                        <Tag className="w-3 h-3" />
                        <span>Šablona</span>
                      </span>
                    )}
                  </div>
                </div>

                {config.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{config.description}</p>
                )}

                <div className="space-y-2 text-sm text-gray-700 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Výkon FVE:</span>
                    <span className="font-medium">{config.parameters?.fve_power || 0} kWp</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kapacita baterie:</span>
                    <span className="font-medium">{config.parameters?.battery_capacity || 0} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cena elektřiny:</span>
                    <span className="font-medium">{config.parameters?.electricity_price || 0} Kč/kWh</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Vytvořeno: {formatDateTime(config.created_at)}
                </div>

                {/* Primary Actions */}
                <div className="flex gap-2 pt-4 border-t mb-2">
                  <button
                    onClick={() => navigate(`/configurations/${config.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Upravit</span>
                  </button>
                  <button
                    onClick={() => handleClone(config)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded transition"
                    title="Vytvořit kopii"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Klonovat</span>
                  </button>
                </div>
                
                {/* Secondary Actions */}
                <div className="flex flex-wrap gap-2">
                  {!config.is_default && (
                    <button
                      onClick={() => handleSetDefault(config.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs border border-yellow-300 text-yellow-700 hover:bg-yellow-50 rounded transition"
                      title="Nastavit jako výchozí"
                    >
                      <Star className="w-3 h-3" />
                      <span>Nastavit výchozí</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleTemplate(config)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs border rounded transition ${
                      config.is_template
                        ? 'border-purple-300 text-purple-700 hover:bg-purple-50'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    title={config.is_template ? 'Odstranit ze šablon' : 'Uložit jako šablonu'}
                  >
                    <Tag className="w-3 h-3" />
                    <span>{config.is_template ? 'Odebrat šablonu' : 'Jako šablonu'}</span>
                  </button>
                  <button
                    onClick={() => handleExport(config)}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-green-300 text-green-700 hover:bg-green-50 rounded transition"
                    title="Exportovat do JSON"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={() => {
                      setConfigToDelete(config);
                      setShowDeleteModal(true);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-red-300 text-red-700 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Smazat</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setConfigToDelete(null);
        }}
        title="Smazat konfiguraci"
      >
        <div className="mb-6">
          <p className="text-gray-700">
            Opravdu chcete smazat konfiguraci <strong>{configToDelete?.name}</strong>?
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Tato akce je nevratná.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setConfigToDelete(null);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Zrušit
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Smazat
          </button>
        </div>
      </Modal>

      {/* Import Confirmation Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportData(null);
        }}
        title="Importovat konfiguraci"
      >
        {importData && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <FileJson className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">Náhled konfigurace</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div><strong>Název:</strong> {importData.name}</div>
                    {importData.description && (
                      <div><strong>Popis:</strong> {importData.description}</div>
                    )}
                    {importData.exportDate && (
                      <div><strong>Export:</strong> {formatDateTime(importData.exportDate)}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Parametry:</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Výkon FVE:</span>
                  <div className="font-medium">{importData.parameters?.fve_power || 0} kWp</div>
                </div>
                <div>
                  <span className="text-gray-600">Kapacita baterie:</span>
                  <div className="font-medium">{importData.parameters?.battery_capacity || 0} kWh</div>
                </div>
                <div>
                  <span className="text-gray-600">Cena elektřiny:</span>
                  <div className="font-medium">{importData.parameters?.electricity_price || 0} Kč/kWh</div>
                </div>
                <div>
                  <span className="text-gray-600">Účinnost FVE:</span>
                  <div className="font-medium">{importData.parameters?.fve_efficiency || 0}%</div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Tato konfigurace bude vytvořena jako nová. Můžete ji následně upravit.
            </p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowImportModal(false);
              setImportData(null);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Zrušit
          </button>
          <button
            onClick={handleImportConfirm}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
          >
            Importovat
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ConfigurationsPage;
