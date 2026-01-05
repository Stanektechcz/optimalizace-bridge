/**
 * Calculations Page - List and manage calculations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import calculationsService from '../services/calculationsService.js';
import { Calculator, Plus, Search, Clock, CheckCircle, XCircle, AlertCircle, Filter, Loader2 } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import { formatDateTime, getStatusColor, getStatusLabel, parseErrorMessage } from '../utils/helpers';

const CalculationsPage = () => {
  const navigate = useNavigate();
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadCalculations();
    
    // Auto-refresh only if there are running calculations
    // Reduced frequency: 15 seconds instead of 5
    const interval = setInterval(() => {
      loadCalculations(true);
    }, 15000);
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array - run only once on mount

  const loadCalculations = async (silent = false) => {
    try {
      if (!silent) {
        const startTime = performance.now();
        setLoading(true);
        setError('');
        // Use lightweight mode for faster loading (only metadata, no large JSON)
        const data = await calculationsService.getCalculations({ lightweight: true });
        setCalculations(data.calculations || []);
        const totalTime = performance.now() - startTime;
        console.log(`Calculations page load took ${totalTime.toFixed(0)}ms`);
      } else {
        setError('');
        const data = await calculationsService.getCalculations({ lightweight: true });
        setCalculations(data.calculations || []);
      }
    } catch (err) {
      if (!silent) setError(parseErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCancel = async (calcId) => {
    try {
      await calculationsService.cancelCalculation(calcId);
      loadCalculations();
    } catch (err) {
      setError(parseErrorMessage(err));
    }
  };

  const handleDelete = async (calcId) => {
    if (!window.confirm('Opravdu chcete smazat tuto kalkulaci?')) return;
    try {
      await calculationsService.deleteCalculation(calcId);
      setCalculations(calculations.filter(c => c.id !== calcId));
    } catch (err) {
      setError(parseErrorMessage(err));
    }
  };

  const filteredCalculations = calculations.filter((calc) => {
    const matchesSearch = calc.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || calc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <LoadingSpinner text="Načítání kalkulací..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kalkulace</h1>
            <p className="text-gray-600 mt-1">Správa a sledování výpočtů energetické bilance</p>
          </div>
          <button
            onClick={() => navigate('/calculations/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span>Nová kalkulace</span>
          </button>
        </div>
      </div>

      {/* Alert */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Hledat kalkulace..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none"
              >
                <option value="all">Všechny stavy</option>
                <option value="pending">Čekající</option>
                <option value="running">Probíhající</option>
                <option value="completed">Dokončené</option>
                <option value="failed">Chybné</option>
                <option value="cancelled">Zrušené</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Calculations Grid */}
      {filteredCalculations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {calculations.length === 0 ? 'Zatím žádné kalkulace' : 'Žádné kalkulace neodpovídají filtru'}
          </h3>
          <p className="text-gray-600 mb-4">
            {calculations.length === 0
              ? 'Vytvořte svou první kalkulaci pro optimalizaci energetické bilance'
              : 'Zkuste změnit vyhledávací kritéria'}
          </p>
          {calculations.length === 0 && (
            <button
              onClick={() => navigate('/calculations/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              <span>Nová kalkulace</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCalculations.map((calc) => (
            <div
              key={calc.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden cursor-pointer"
              onClick={() => navigate(`/calculations/${calc.id}`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(calc.status)}
                    <h3 className="font-semibold text-gray-900">{calc.name || 'Bez názvu'}</h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(calc.status)}`}>
                    {getStatusLabel(calc.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatDateTime(calc.created_at)}</span>
                  </div>
                  {calc.description && (
                    <p className="text-gray-700 line-clamp-2">{calc.description}</p>
                  )}
                </div>

                {calc.status === 'running' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Probíhá výpočet...</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  {calc.status === 'running' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(calc.id);
                      }}
                      className="flex-1 px-3 py-1.5 text-sm border border-red-300 text-red-700 hover:bg-red-50 rounded transition"
                    >
                      Zrušit
                    </button>
                  )}
                  {calc.status === 'completed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/calculations/${calc.id}/results`);
                      }}
                      className="flex-1 px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded transition"
                    >
                      Výsledky
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(calc.id);
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded transition"
                  >
                    Smazat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalculationsPage;
