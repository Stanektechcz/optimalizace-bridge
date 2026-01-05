/**
 * Calculation Detail Page - View calculation status and results with live tracking
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import calculationsService from '../services/calculationsService.js';
import { 
  ArrowLeft, Calculator, Clock, CheckCircle, XCircle, Loader, 
  FileText, Download, RefreshCw, StopCircle, BarChart3, AlertCircle 
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import Modal from '../components/common/Modal';
import ProgressBar from '../components/calculations/ProgressBar';
import LogViewer from '../components/calculations/LogViewer';
import { formatDateTime, getStatusColor, getStatusLabel, parseErrorMessage } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';

const CalculationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();
  
  const [calculation, setCalculation] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadCalculation();
    loadLogs();

    // Auto-refresh for running calculations (every 3 seconds)
    const interval = setInterval(() => {
      if (calculation?.status === 'running') {
        loadCalculation(true);
        loadLogs(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, calculation?.status]);

  // Calculate progress based on logs or time
  useEffect(() => {
    if (calculation?.status === 'running') {
      // Simple progress estimation based on time
      const startTime = calculation.started_at ? new Date(calculation.started_at).getTime() : Date.now();
      const elapsed = Date.now() - startTime;
      const estimatedTotal = 5 * 60 * 1000; // Estimate 5 minutes
      const calculatedProgress = Math.min((elapsed / estimatedTotal) * 100, 95);
      setProgress(calculatedProgress);
    } else if (calculation?.status === 'completed') {
      setProgress(100);
    } else if (calculation?.status === 'failed' || calculation?.status === 'cancelled') {
      // Keep current progress
    } else {
      setProgress(0);
    }
  }, [calculation]);

  const loadCalculation = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const data = await calculationsService.getCalculation(id);
      setCalculation(data);
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadLogs = async (silent = false) => {
    try {
      const data = await calculationsService.getCalculationLogs(id);
      setLogs(data.logs || []);
    } catch (err) {
      if (!silent) console.error('Failed to load logs:', err);
    }
  };

  const handleCancel = async () => {
    try {
      await calculationsService.cancelCalculation(id);
      showWarning('Kalkulace byla zrušena');
      setCancelModalOpen(false);
      await loadCalculation();
    } catch (err) {
      const errorMsg = parseErrorMessage(err);
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Opravdu chcete smazat tuto kalkulaci?')) return;
    try {
      await calculationsService.deleteCalculation(id);
      showSuccess('Kalkulace byla úspěšně smazána');
      setTimeout(() => navigate('/calculations'), 1000);
    } catch (err) {
      const errorMsg = parseErrorMessage(err);
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  const handleExport = async (format) => {
    try {
      await calculationsService.exportResults(id, format);
    } catch (err) {
      setError(parseErrorMessage(err));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'running':
        return <Loader className="w-6 h-6 text-blue-600 animate-spin" />;
      case 'cancelled':
        return <StopCircle className="w-6 h-6 text-gray-600" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <LoadingSpinner text="Načítání kalkulace..." />
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className="max-w-7xl mx-auto">
        <Alert type="error" message="Kalkulace nenalezena" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/calculations')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Zpět na kalkulace</span>
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(calculation.status)}
              <h1 className="text-3xl font-bold text-gray-900">{calculation.name || 'Bez názvu'}</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(calculation.status)}`}>
                {getStatusLabel(calculation.status)}
              </span>
            </div>
            {calculation.description && (
              <p className="text-gray-600">{calculation.description}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            {calculation.status === 'running' && (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg transition"
              >
                <StopCircle className="w-5 h-5" />
                <span>Zrušit výpočet</span>
              </button>
            )}
            {calculation.status === 'completed' && (
              <button
                onClick={() => navigate(`/calculations/${id}/results`)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Zobrazit výsledky</span>
              </button>
            )}
            <button
              onClick={() => loadCalculation()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              title="Obnovit data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-red-700 hover:bg-red-50 rounded-lg transition"
            >
              <span>Smazat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <div className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 border-b-2 font-medium transition ${
                activeTab === 'info'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Informace
            </button>
            <button
              onClick={() => setActiveTab('params')}
              className={`py-4 border-b-2 font-medium transition ${
                activeTab === 'params'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Parametry
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 border-b-2 font-medium transition ${
                activeTab === 'logs'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Logy ({logs.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Progress Bar for Running Calculations */}
              {(calculation.status === 'running' || calculation.status === 'pending') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <ProgressBar 
                    progress={progress} 
                    status={calculation.status} 
                    showLabel={true}
                  />
                </div>
              )}

              {/* Success Message */}
              {calculation.status === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-base font-semibold text-green-900 mb-1">
                        Výpočet byl úspěšně dokončen!
                      </h3>
                      <p className="text-sm text-green-800">
                        Kalkulace proběhla bez chyb. Nyní můžete zobrazit výsledky a grafy.
                      </p>
                      <button
                        onClick={() => navigate(`/calculations/${id}/results`)}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>Zobrazit výsledky</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {calculation.error_message && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800 mb-1">Chybová zpráva</h3>
                      <p className="text-sm text-red-700">{calculation.error_message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">ID Kalkulace</h3>
                  <p className="text-gray-900 font-mono text-sm">{calculation.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Stav</h3>
                  <p className="text-gray-900">{getStatusLabel(calculation.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Vytvořeno</h3>
                  <p className="text-gray-900">{formatDateTime(calculation.created_at)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Aktualizováno</h3>
                  <p className="text-gray-900">{formatDateTime(calculation.updated_at)}</p>
                </div>
                {calculation.started_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Spuštěno</h3>
                    <p className="text-gray-900">{formatDateTime(calculation.started_at)}</p>
                  </div>
                )}
                {calculation.completed_at && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Dokončeno</h3>
                    <p className="text-gray-900">{formatDateTime(calculation.completed_at)}</p>
                  </div>
                )}
              </div>

              {/* Duration */}
              {calculation.started_at && calculation.completed_at && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Doba trvání</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {Math.round((new Date(calculation.completed_at) - new Date(calculation.started_at)) / 1000 / 60)} minut
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Parameters Tab */}
          {activeTab === 'params' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Vstupní parametry</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 overflow-x-auto">
                    {JSON.stringify(calculation.input_params, null, 2)}
                  </pre>
                </div>
              </div>
              {calculation.configuration_id && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">ID Konfigurace</h3>
                  <p className="text-gray-700 font-mono text-sm">{calculation.configuration_id}</p>
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <LogViewer 
              logs={logs} 
              isLive={calculation.status === 'running'}
              maxHeight="500px"
            />
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Zrušit výpočet"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setCancelModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Pokračovat
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Ano, zrušit
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-700 mb-2">
              Opravdu chcete zrušit tento výpočet?
            </p>
            <p className="text-sm text-gray-600">
              Rozběhlá kalkulace bude ukončena a nebude možné ji obnovit. 
              Budete muset spustit nový výpočet.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CalculationDetailPage;
