/**
 * Results Page - Display calculation results with advanced charts
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import calculationsService from '../services/calculationsService.js';
import { 
  ArrowLeft, Download, BarChart3, Calendar, Clock, Zap, FileText, Settings 
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import MonthlyChart from '../components/charts/MonthlyChart';
import DailyProfileChart from '../components/charts/DailyProfileChart';
import EnergyDistributionChart from '../components/charts/EnergyDistributionChart';
import CostComparisonChart from '../components/charts/CostComparisonChart';
import { formatNumber, formatCurrency, parseErrorMessage } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';

const ResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError: showErrorToast } = useToast();
  
  const [calculation, setCalculation] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [chartType, setChartType] = useState('bar'); // bar or line for monthly chart

  useEffect(() => {
    loadResults();
  }, [id]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError('');
      const calcData = await calculationsService.getCalculation(id);
      setCalculation(calcData);
      // Results are part of calculation object
      setResults(calcData.results || null);
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      await calculationsService.exportResults(id, format);
      showSuccess(`Výsledky byly exportovány ve formátu ${format.toUpperCase()}`);
    } catch (err) {
      const errorMsg = parseErrorMessage(err);
      setError(errorMsg);
      showErrorToast(errorMsg);
    }
  };

  // Generate mock data if not available (for demonstration)
  const generateMockMonthlyData = () => {
    const months = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'];
    return months.map((month, index) => ({
      month,
      production: Math.random() * 500 + 200 + (index >= 4 && index <= 8 ? 300 : 0),
      consumption: Math.random() * 400 + 300,
    }));
  };

  const generateMockDailyData = () => {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      production: hour >= 6 && hour <= 18 ? Math.random() * 5 + (hour >= 10 && hour <= 14 ? 8 : 2) : 0,
      consumption: Math.random() * 3 + 1 + (hour >= 7 && hour <= 22 ? 2 : 0),
      battery: Math.random() * 2,
    }));
  };

  const generateMockDistributionData = (energyBalance) => {
    const total = energyBalance?.total_consumption || 10000;
    return [
      { 
        id: 'self_consumption', 
        name: 'Vlastní spotřeba', 
        value: total * 0.6, 
        percentage: 60 
      },
      { 
        id: 'grid_import', 
        name: 'Nákup ze sítě', 
        value: total * 0.25, 
        percentage: 25 
      },
      { 
        id: 'grid_export', 
        name: 'Prodej do sítě', 
        value: total * 0.15, 
        percentage: 15 
      },
    ];
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <LoadingSpinner text="Načítání výsledků..." />
      </div>
    );
  }

  if (!calculation || !results) {
    return (
      <div className="max-w-7xl mx-auto">
        <Alert type="error" message="Výsledky nenalezeny" />
      </div>
    );
  }

  // Parse results data
  const costTable = results.cost_table ? JSON.parse(results.cost_table) : null;
  const energyBalance = results.energy_balance ? JSON.parse(results.energy_balance) : null;
  const chartsData = results.charts_data ? JSON.parse(results.charts_data) : null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/calculations/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Zpět na detail</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Výsledky kalkulace</h1>
            <p className="text-gray-600">{calculation.name}</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition"
            >
              <Download className="w-5 h-5" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition"
            >
              <Download className="w-5 h-5" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />}

      {/* Summary Cards */}
      {costTable && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Celkové úspory</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(costTable.total_savings || 0)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Sun className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Výroba FVE</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(costTable.pv_production || 0)} kWh
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Battery className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Využití baterie</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(costTable.battery_usage || 0)} kWh
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Soběstačnost</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(costTable.self_sufficiency || 0)}%
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <div className="flex gap-6 px-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 border-b-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Přehled
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`py-4 border-b-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'charts'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Grafy
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`py-4 border-b-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'daily'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              Denní profil
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`py-4 border-b-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'monthly'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Měsíční přehled
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`py-4 border-b-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'tables'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              Detaily
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && costTable && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Finanční přehled</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Náklady bez FVE</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(costTable.cost_without_pv || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Náklady s FVE</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(costTable.cost_with_pv || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg col-span-2">
                    <p className="text-sm text-green-700 mb-1">Roční úspora</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(costTable.annual_savings || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Energetický přehled</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Spotřeba</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatNumber(energyBalance?.total_consumption || 0)} kWh
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Výroba FVE</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatNumber(energyBalance?.pv_production || 0)} kWh
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Nákup ze sítě</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatNumber(energyBalance?.grid_import || 0)} kWh
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Prodej do sítě</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatNumber(energyBalance?.grid_export || 0)} kWh
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Costs Tab */}
          {activeTab === 'costs' && costTable && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tabulka nákladů</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Položka
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Hodnota
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(costTable).map(([key, value]) => (
                      <tr key={key}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                          {typeof value === 'number' 
                            ? key.includes('cost') || key.includes('saving')
                              ? formatCurrency(value)
                              : formatNumber(value)
                            : value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Energy Tab */}
          {activeTab === 'energy' && energyBalance && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Energetická bilance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Parametr
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Hodnota
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(energyBalance).map(([key, value]) => (
                      <tr key={key}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                          {typeof value === 'number' ? `${formatNumber(value)} kWh` : value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Charts Tab - Overview */}
          {activeTab === 'charts' && (
            <div className="space-y-8">
              {/* Cost Comparison */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Srovnání nákladů</h3>
                </div>
                <CostComparisonChart 
                  withoutPV={costTable?.cost_without_pv || 50000}
                  withPV={costTable?.cost_with_pv || 20000}
                  savings={costTable?.annual_savings || 30000}
                />
              </div>

              {/* Energy Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rozdělení energie</h3>
                <EnergyDistributionChart 
                  data={chartsData?.distribution || generateMockDistributionData(energyBalance)} 
                />
              </div>
            </div>
          )}

          {/* Daily Profile Tab */}
          {activeTab === 'daily' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">24hodinový denní profil</h3>
                <p className="text-sm text-gray-600">Průměrné hodnoty za den</p>
              </div>
              <DailyProfileChart 
                data={chartsData?.daily || generateMockDailyData()} 
              />
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">Špička výroby</p>
                  <p className="text-lg font-bold text-green-900">12:00 - 14:00</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">Špička spotřeby</p>
                  <p className="text-lg font-bold text-blue-900">18:00 - 20:00</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-700 mb-1">Noční spotřeba</p>
                  <p className="text-lg font-bold text-orange-900">22:00 - 06:00</p>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Tab */}
          {activeTab === 'monthly' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Měsíční přehled výroby a spotřeby</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 text-sm rounded transition ${
                      chartType === 'bar'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Sloupcový
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 text-sm rounded transition ${
                      chartType === 'line'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Čárový
                  </button>
                </div>
              </div>
              <MonthlyChart 
                data={chartsData?.monthly || generateMockMonthlyData()} 
                type={chartType}
              />
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">Nejproduktivnější měsíc</p>
                  <p className="text-lg font-bold text-green-900">Červenec</p>
                  <p className="text-sm text-green-600">~850 kWh</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">Nejvyšší spotřeba</p>
                  <p className="text-lg font-bold text-blue-900">Leden</p>
                  <p className="text-sm text-blue-600">~680 kWh</p>
                </div>
              </div>
            </div>
          )}

          {/* Tables Tab - Detailed Data */}
          {activeTab === 'tables' && costTable && energyBalance && (
            <div className="space-y-6">
              {/* Cost Table */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tabulka nákladů</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Položka
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Hodnota
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(costTable).map(([key, value]) => (
                        <tr key={key}>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                            {typeof value === 'number' 
                              ? key.includes('cost') || key.includes('saving')
                                ? formatCurrency(value)
                                : formatNumber(value)
                              : value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Energy Balance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Energetická bilance</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Parametr
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Hodnota
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(energyBalance).map(([key, value]) => (
                        <tr key={key}>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                            {typeof value === 'number' ? `${formatNumber(value)} kWh` : value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
