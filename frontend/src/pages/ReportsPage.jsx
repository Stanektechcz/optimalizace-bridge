/**
 * Reports & Analytics Page - Advanced reporting and comparison
 */

import React, { useState, useEffect } from 'react';
import calculationsService from '../services/calculationsService.js';
import {
  BarChart3, TrendingUp, Calendar, Download, Filter,
  FileText, PieChart, ArrowUpDown, CheckCircle2
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import { formatDateTime, formatNumber, formatCurrency, parseErrorMessage } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const ReportsPage = () => {
  const { showSuccess, showErrorToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [calculations, setCalculations] = useState([]);
  const [error, setError] = useState('');
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'failed'
  
  // Comparison
  const [selectedCalcs, setSelectedCalcs] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'trends', 'comparison'

  useEffect(() => {
    loadCalculations();
  }, []);

  const loadCalculations = async () => {
    try {
      const startTime = performance.now();
      setLoading(true);
      setError('');
      // Use lightweight mode for faster loading
      const data = await calculationsService.getCalculations({ lightweight: true });
      setCalculations(data.calculations || []);
      const totalTime = performance.now() - startTime;
      console.log(`Reports page load took ${totalTime.toFixed(0)}ms`);
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Filter calculations
  const filteredCalculations = calculations.filter(calc => {
    // Date filter
    if (dateFrom && new Date(calc.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(calc.created_at) > new Date(dateTo)) return false;
    
    // Status filter
    if (statusFilter === 'completed' && calc.status !== 'completed') return false;
    if (statusFilter === 'failed' && calc.status !== 'failed') return false;
    
    return true;
  });

  // Statistics
  const stats = {
    total: filteredCalculations.length,
    completed: filteredCalculations.filter(c => c.status === 'completed').length,
    failed: filteredCalculations.filter(c => c.status === 'failed').length,
    running: filteredCalculations.filter(c => c.status === 'running').length,
    avgDuration: filteredCalculations
      .filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + (c.duration || 0), 0) / 
      (filteredCalculations.filter(c => c.status === 'completed').length || 1),
  };

  // Trend data - calculations per month
  const trendData = () => {
    const months = {};
    filteredCalculations.forEach(calc => {
      const month = new Date(calc.created_at).toLocaleDateString('cs-CZ', { year: 'numeric', month: 'short' });
      months[month] = (months[month] || 0) + 1;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count })).slice(-6);
  };

  // Status distribution
  const statusData = [
    { name: 'Dokončené', value: stats.completed, color: '#10b981' },
    { name: 'Selhané', value: stats.failed, color: '#ef4444' },
    { name: 'Běžící', value: stats.running, color: '#3b82f6' },
  ].filter(s => s.value > 0);

  // Handle calculation selection for comparison
  const handleSelectCalc = (calcId) => {
    setSelectedCalcs(prev => {
      if (prev.includes(calcId)) {
        return prev.filter(id => id !== calcId);
      } else if (prev.length < 3) {
        return [...prev, calcId];
      } else {
        showErrorToast('Lze porovnat maximálně 3 kalkulace');
        return prev;
      }
    });
  };

  // Export report
  const handleExport = (format) => {
    try {
      if (format === 'csv') {
        const csv = [
          ['ID', 'Název', 'Stav', 'Vytvořeno', 'Dokončeno', 'Trvání (s)'].join(','),
          ...filteredCalculations.map(c => [
            c.id,
            c.name || 'Bez názvu',
            c.status,
            formatDateTime(c.created_at),
            c.completed_at ? formatDateTime(c.completed_at) : 'N/A',
            c.duration || 0
          ].join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showSuccess('Report exportován do CSV');
      } else if (format === 'json') {
        const json = JSON.stringify(filteredCalculations, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showSuccess('Report exportován do JSON');
      }
    } catch (err) {
      showErrorToast('Nepodařilo se exportovat report');
    }
  };

  // Comparison data
  const getComparisonData = () => {
    return selectedCalcs.map(calcId => {
      const calc = calculations.find(c => c.id === calcId);
      return {
        id: calc?.id,
        name: calc?.name || `Kalkulace #${calc?.id}`,
        status: calc?.status,
        duration: calc?.duration || 0,
        created: calc?.created_at,
        // Mock result data
        savings: Math.random() * 50000 + 10000,
        production: Math.random() * 15000 + 5000,
        selfConsumption: Math.random() * 80 + 10,
      };
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <LoadingSpinner text="Načítání reportů..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">Reporty & Analytika</h1>
            </div>
            <p className="text-gray-600">Pokročilé reporty, statistiky a porovnání kalkulací</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition"
            >
              <Download className="w-5 h-5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition"
            >
              <Download className="w-5 h-5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Filtry</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum od</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum do</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stav</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="all">Všechny stavy</option>
              <option value="completed">Pouze dokončené</option>
              <option value="failed">Pouze selhané</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setStatusFilter('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition"
            >
              Zrušit filtry
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Celkem</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Dokončené</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✕</span>
            </div>
            <span className="text-sm text-gray-600">Selhané</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Běžící</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.running}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">Průměr (s)</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.avgDuration.toFixed(1)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                activeTab === 'overview'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                <span>Přehled</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                activeTab === 'trends'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span>Trendy</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                activeTab === 'comparison'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5" />
                <span>Porovnání ({selectedCalcs.length})</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rozdělení stavů</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Žádná data k zobrazení
              </div>
            )}
          </div>

          {/* Recent Calculations */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Poslední kalkulace</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {filteredCalculations.slice(0, 10).map(calc => (
                <div key={calc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{calc.name || `Kalkulace #${calc.id}`}</div>
                    <div className="text-sm text-gray-500">{formatDateTime(calc.created_at)}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    calc.status === 'completed' ? 'bg-green-100 text-green-800' :
                    calc.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {calc.status === 'completed' ? 'Dokončeno' :
                     calc.status === 'failed' ? 'Selhalo' : 'Běží'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend kalkulací (posledních 6 měsíců)</h3>
          {trendData().length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Počet kalkulací" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-500">
              Nedostatek dat pro zobrazení trendu
            </div>
          )}
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Selection Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Vyberte kalkulace k porovnání (max. 3)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCalculations.filter(c => c.status === 'completed').slice(0, 9).map(calc => (
                <button
                  key={calc.id}
                  onClick={() => handleSelectCalc(calc.id)}
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    selectedCalcs.includes(calc.id)
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{calc.name || `Kalkulace #${calc.id}`}</div>
                  <div className="text-sm text-gray-500 mt-1">{formatDateTime(calc.created_at)}</div>
                  {selectedCalcs.includes(calc.id) && (
                    <CheckCircle2 className="w-5 h-5 text-primary-600 mt-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Chart */}
          {selectedCalcs.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Porovnání vybraných kalkulací</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  <Bar dataKey="savings" fill="#10b981" name="Úspora (Kč)" />
                  <Bar dataKey="production" fill="#3b82f6" name="Výroba (kWh)" />
                  <Bar dataKey="selfConsumption" fill="#f59e0b" name="Vlastní spotřeba (%)" />
                </BarChart>
              </ResponsiveContainer>

              {/* Comparison Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kalkulace</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Úspora</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Výroba</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Vlastní spotřeba</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trvání</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getComparisonData().map(data => (
                      <tr key={data.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {data.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(data.savings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatNumber(data.production)} kWh
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {data.selfConsumption.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {data.duration.toFixed(1)}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
