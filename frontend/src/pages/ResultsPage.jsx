/**
 * Results Page - Display comprehensive calculation results
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import calculationsService from '../services/calculationsService.js';
import { 
  ArrowLeft, Download, BarChart3, Calendar, FileText, TrendingUp, Zap, Battery
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import InteractiveLineChart from '../components/charts/InteractiveLineChart';
import InteractiveBarChart from '../components/charts/InteractiveBarChart';
import AdvancedLineChart from '../components/charts/AdvancedLineChart';
import ChartDisplayControls from '../components/charts/ChartDisplayControls';
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
  
  // Year mode toggle - podle Python GUI
  // Default to true (year mode) to match Python GUI default behavior
  const [showYearData, setShowYearData] = useState(true);
  
  // Date range filtering - podle Python GUI userDateRange()
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filteredResults, setFilteredResults] = useState(null);
  const [filterLoading, setFilterLoading] = useState(false);
  
  // Advanced chart controls - podle Python funsChart.py
  const [visibleLines, setVisibleLines] = useState({
    consumption: true,
    production: true,
    battery: true,
    sum: true,
    price: false,
  });
  const [invertProduction, setInvertProduction] = useState(false);
  const [sumMode, setSumMode] = useState('all'); // 'all', 'consAndProd', 'consAndBatt', 'prodAndBatt'
  const [batteryMode, setBatteryMode] = useState('flow'); // 'flow', 'energy'
  
  const handleToggleLine = (lineKey) => {
    setVisibleLines(prev => ({
      ...prev,
      [lineKey]: !prev[lineKey],
    }));
  };
  
  const handleToggleInvertProduction = () => {
    setInvertProduction(prev => !prev);
  };
  
  const handleChangeSumMode = (mode) => {
    setSumMode(mode);
  };
  
  const handleChangeBatteryMode = (mode) => {
    setBatteryMode(mode);
  };

  // Parse results data with memoization - MUST be before any conditions
  // Note: calculation contains the main data, results is nested inside it
  const costTable = useMemo(() => calculation?.cost_table || [], [calculation]);
  const costTableYear = useMemo(() => calculation?.cost_table_year || [], [calculation]);
  const energyBalance = useMemo(() => calculation?.energy_balance || [], [calculation]);
  const energyBalanceYear = useMemo(() => calculation?.energy_balance_year || [], [calculation]);
  const financialBalance = useMemo(() => calculation?.financial_balance || [], [calculation]);
  const financialBalanceYear = useMemo(() => calculation?.financial_balance_year || [], [calculation]);
  const resultsData = useMemo(() => results || {}, [results]);
  // Use dataRed for charts (full data is too large for DB, only reduced data stored)
  const chartsData = useMemo(() => calculation?.charts_data?.dataRed || [], [calculation]);

  useEffect(() => {
    loadResults();
  }, [id]);

  // Initialize date picker with processed data range
  useEffect(() => {
    if (calculation?.input_metadata) {
      const processedFrom = calculation.input_metadata.processed_time_from?.split(' ')[0];
      const processedTo = calculation.input_metadata.processed_time_to?.split(' ')[0];
      if (processedFrom && !dateFrom) {
        setDateFrom(processedFrom);
      }
      if (processedTo && !dateTo) {
        setDateTo(processedTo);
      }
    }
  }, [calculation]);

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

  const handleDateFilterApply = async () => {
    if (!dateFrom || !dateTo) {
      showErrorToast('Vyplňte obě data');
      return;
    }

    try {
      setFilterLoading(true);
      const response = await calculationsService.filterByDateRange(id, dateFrom, dateTo);
      setFilteredResults(response);
      showSuccess(`Výsledky přepočítány pro období ${dateFrom} - ${dateTo}`);
    } catch (err) {
      const errorMsg = parseErrorMessage(err);
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setFilterLoading(false);
    }
  };

  const handleDateFilterReset = () => {
    setDateFilterEnabled(false);
    setFilteredResults(null);
    setDateFrom('');
    setDateTo('');
  };

  const handleRecalculate = async () => {
    if (!window.confirm('Opravdu chcete přepočítat tuto kalkulaci? Stávající výsledky budou smazány a kalkulace se spustí znovu s aktuální logikou.')) {
      return;
    }

    try {
      setLoading(true);
      await calculationsService.recalculate(id);
      showSuccess('Kalkulace byla znovu spuštěna. Probíhá přepočítávání...');
      
      // Wait 2 seconds and redirect to calculation detail to see progress
      setTimeout(() => {
        navigate(`/calculations/${id}`);
      }, 2000);
    } catch (err) {
      const errorMsg = parseErrorMessage(err);
      setError(errorMsg);
      showErrorToast(errorMsg);
      setLoading(false);
    }
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
        <Alert type="error" message="Výsledky nenalezeny nebo kalkulace ještě neproběhla" />
        <button
          onClick={() => navigate(`/calculations/${id}`)}
          className="mt-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Zpět na detail</span>
        </button>
      </div>
    );
  }

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
            {resultsData.timeString && (
              <p className="text-sm text-gray-500 mt-1">Období: {resultsData.timeString}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleRecalculate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition"
              title="Přepočítat kalkulaci s aktuální logikou"
            >
              <TrendingUp className="w-5 h-5" />
              <span>Přepočítat</span>
            </button>
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

      {/* Input Data Metadata */}
      {calculation?.input_metadata && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Vstupní data</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {calculation.input_metadata.processed_time_from && calculation.input_metadata.processed_time_to && (
              <div>
                <span className="text-sm text-gray-600 block mb-1">Období:</span>
                <span className="text-base font-semibold text-gray-900">
                  {calculation.input_metadata.processed_time_from} - {calculation.input_metadata.processed_time_to}
                </span>
              </div>
            )}
            
            {calculation.input_metadata.processed_days && (
              <div>
                <span className="text-sm text-gray-600 block mb-1">Počet dní:</span>
                <span className="text-base font-semibold text-gray-900">
                  {calculation.input_metadata.processed_days} dní
                </span>
              </div>
            )}
            
            {calculation.input_metadata.processed_hours && (
              <div>
                <span className="text-sm text-gray-600 block mb-1">Počet hodin:</span>
                <span className="text-base font-semibold text-gray-900">
                  {calculation.input_metadata.processed_hours} hodin
                </span>
              </div>
            )}
            
            {calculation.input_metadata.input_files && calculation.input_metadata.input_files.length > 0 && (
              <div className="md:col-span-2 lg:col-span-4">
                <span className="text-sm text-gray-600 block mb-1">Zpracované soubory:</span>
                <div className="flex flex-wrap gap-2">
                  {calculation.input_metadata.input_files.map((file, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {file}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {resultsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Battery Cycles - switches based on year toggle */}
          {(() => {
            const cycles = showYearData ? resultsData.battCyclesYear : resultsData.battCycles;
            const label = showYearData ? 'Cykly baterie (statisticky za rok)' : 'Cykly baterie (období)';
            return cycles && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Battery className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(cycles, showYearData ? 2 : undefined)}
                </p>
              </div>
            );
          })()}

          {resultsData.dataCount && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-gray-600">Hodinových dat</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {resultsData.dataCount}
              </p>
            </div>
          )}
          
          {resultsData.dataRedCount && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Redukovaných dat</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {resultsData.dataRedCount}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Date Range Filter - podle Python GUI userDateRange() */}
      {calculation?.input_metadata && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filtr období:</span>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dateFilterEnabled"
                  checked={dateFilterEnabled}
                  onChange={(e) => {
                    setDateFilterEnabled(e.target.checked);
                    if (!e.target.checked) {
                      handleDateFilterReset();
                    }
                  }}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="dateFilterEnabled" className="text-sm text-gray-700">
                  Povolit filtr
                </label>
              </div>

              {dateFilterEnabled && (
                <>
                  <div className="flex items-center gap-2">
                    <label htmlFor="dateFrom" className="text-sm text-gray-600">Od:</label>
                    <input
                      type="date"
                      id="dateFrom"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      min={calculation.input_metadata.processed_time_from?.split(' ')[0]}
                      max={calculation.input_metadata.processed_time_to?.split(' ')[0]}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label htmlFor="dateTo" className="text-sm text-gray-600">Do:</label>
                    <input
                      type="date"
                      id="dateTo"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      min={dateFrom || calculation.input_metadata.processed_time_from?.split(' ')[0]}
                      max={calculation.input_metadata.processed_time_to?.split(' ')[0]}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <button
                    onClick={handleDateFilterApply}
                    disabled={filterLoading || !dateFrom || !dateTo}
                    className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {filterLoading ? 'Přepočítávám...' : 'Aplikovat'}
                  </button>
                  
                  {filteredResults && (
                    <button
                      onClick={handleDateFilterReset}
                      className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Zrušit filtr
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {filteredResults && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Filtrované období:</span>
                  <span className="font-medium text-gray-900">
                    {filteredResults.date_from} - {filteredResults.date_to}
                  </span>
                </div>
                {filteredResults.results?.days && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Dní:</span>
                    <span className="font-medium text-gray-900">
                      {filteredResults.results.days.toFixed(1)}
                    </span>
                  </div>
                )}
                {filteredResults.results?.battCycles && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Cykly baterie:</span>
                    <span className="font-medium text-gray-900">
                      {formatNumber(filteredResults.results.battCycles, 2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Year Mode Toggle - podle Python GUI */}
      {(costTableYear && costTableYear.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Zobrazení výsledků:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowYearData(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  !showYearData
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Skutečné období
              </button>
              <button
                onClick={() => setShowYearData(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  showYearData
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Statisticky za rok
              </button>
            </div>
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
              onClick={() => setActiveTab('tables')}
              className={`py-4 border-b-2 font-medium transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'tables'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Tabulky
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Cost Table */}
              {(() => {
                // Use filtered results if available, otherwise use year toggle
                const currentCostTable = filteredResults 
                  ? filteredResults.cost_table 
                  : (showYearData ? costTableYear : costTable);
                const titleSuffix = filteredResults 
                  ? '(filtrované období)' 
                  : (showYearData ? '(statisticky za rok)' : '');
                
                return currentCostTable && currentCostTable.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Nákladová tabulka {titleSuffix}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(currentCostTable[0] || {}).map((key) => (
                              <th
                                key={key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentCostTable.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {Object.values(row).map((val, vidx) => (
                                <td key={vidx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {typeof val === 'number' ? formatNumber(val, 3) : val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Energy Balance */}
              {(() => {
                // Use filtered results if available, otherwise use year toggle
                const currentEnergyBalance = filteredResults 
                  ? filteredResults.energy_balance 
                  : (showYearData ? energyBalanceYear : energyBalance);
                const titleSuffix = filteredResults 
                  ? '(filtrované období)' 
                  : (showYearData ? '(statisticky za rok)' : '');
                
                return currentEnergyBalance && currentEnergyBalance.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Bilance energie {titleSuffix}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(currentEnergyBalance[0] || {}).map((key) => (
                              <th
                                key={key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentEnergyBalance.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {Object.values(row).map((val, vidx) => (
                                <td key={vidx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {typeof val === 'number' ? formatNumber(val, 3) : val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Financial Balance */}
              {(() => {
                // Use filtered results if available, otherwise use year toggle
                const currentFinancialBalance = filteredResults 
                  ? filteredResults.financial_balance 
                  : (showYearData ? financialBalanceYear : financialBalance);
                const titleSuffix = filteredResults 
                  ? '(filtrované období)' 
                  : (showYearData ? '(statisticky za rok)' : '');
                
                return currentFinancialBalance && currentFinancialBalance.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Finanční bilance {titleSuffix}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(currentFinancialBalance[0] || {}).map((key) => (
                              <th
                                key={key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentFinancialBalance.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {Object.values(row).map((val, vidx) => (
                                <td key={vidx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {typeof val === 'number' ? formatNumber(val, 3) : val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Charts Tab with Advanced Python Features */}
          {activeTab === 'charts' && chartsData && chartsData.length > 0 && (
            <div className="space-y-8">
              {/* Chart Display Controls - podle Python CheckButtons/RadioButtons */}
              <ChartDisplayControls
                visibleLines={visibleLines}
                onToggleLine={handleToggleLine}
                invertProduction={invertProduction}
                onToggleInvertProduction={handleToggleInvertProduction}
                sumMode={sumMode}
                onChangeSumMode={handleChangeSumMode}
                batteryMode={batteryMode}
                onChangeBatteryMode={handleChangeBatteryMode}
                showInvertProduction={true}
                showSumModes={true}
                showBatteryModes={chartsData[0]?.BkWh_charge !== undefined}
              />
              
              {/* Main Energy Chart with Advanced Features - podle Python funsChart.py */}
              <AdvancedLineChart
                data={chartsData}
                title="Časový průběh energie"
                height={550}
                visibleLines={visibleLines}
                onToggleLine={handleToggleLine}
                invertProduction={invertProduction}
                sumMode={sumMode}
                batteryMode={batteryMode}
                fields={{
                  consumption: 'kWh',
                  production: 'PVkWh',
                  battery: 'BkWh',
                  batteryEnergy: 'BkWh_charge',
                  price: 'Kč/kWh',
                }}
                colors={{
                  consumption: '#9467bd',  // tab:purple
                  production: '#ff7f0e',   // tab:orange
                  battery: '#1f77b4',      // tab:blue
                  sum: '#2ca02c',          // tab:green
                  price: '#d62728',        // tab:red
                }}
                yAxisLabel="Energie - kWh"
                yAxisLabelRight="Cena - Kč/kWh"
              />

              {/* Power Flow Chart - remains as separate view */}
              {(chartsData[0]?.['P (kW)'] !== undefined || 
                chartsData[0]?.['PV (kW)'] !== undefined || 
                chartsData[0]?.['B (kW)'] !== undefined) && (
                <InteractiveLineChart
                  data={chartsData}
                  title="Časový průběh výkonu"
                  xAxisKey="Den"
                  yAxisLabel="Výkon (kW)"
                  height={450}
                  lines={[
                    chartsData[0]?.['P (kW)'] !== undefined && { 
                      dataKey: 'P (kW)', 
                      stroke: '#3b82f6', 
                      name: 'Spotřeba (kW)' 
                    },
                    chartsData[0]?.['PV (kW)'] !== undefined && { 
                      dataKey: 'PV (kW)', 
                      stroke: '#10b981', 
                      name: 'FVE výkon (kW)' 
                    },
                    chartsData[0]?.['B (kW)'] !== undefined && { 
                      dataKey: 'B (kW)', 
                      stroke: '#f59e0b', 
                      name: 'Baterie výkon (kW)' 
                    }
                  ].filter(Boolean)}
                />
              )}

              {/* Cost Chart - bar chart variant */}
              {chartsData[0]?.['Cost (Kč)'] !== undefined && (
                <InteractiveBarChart
                  data={chartsData}
                  title="Průběh nákladů"
                  xAxisKey="Den"
                  yAxisLabel="Náklady (Kč)"
                  height={400}
                  bars={[
                    { 
                      dataKey: 'Cost (Kč)', 
                      fill: '#3b82f6', 
                      name: 'Náklady (Kč)' 
                    }
                  ]}
                />
              )}

              {/* Battery State of Charge - separate view */}
              {chartsData[0]?.['SOC (%)'] !== undefined && (
                <InteractiveLineChart
                  data={chartsData}
                  title="Stav nabití baterie"
                  xAxisKey="Den"
                  yAxisLabel="Nabití (%)"
                  height={350}
                  lines={[
                    { 
                      dataKey: 'SOC (%)', 
                      stroke: '#f59e0b', 
                      name: 'Stav nabití (%)' 
                    }
                  ]}
                />
              )}
            </div>
          )}

          {/* Tables Tab */}
          {activeTab === 'tables' && (
            <div className="space-y-6">
              {/* Yearly Cost Table */}
              {costTableYear && costTableYear.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Roční nákladová tabulka</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(costTableYear[0] || {}).map((key) => (
                            <th
                              key={key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {costTableYear.map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {Object.values(row).map((val, vidx) => (
                              <td key={vidx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {typeof val === 'number' ? formatNumber(val, 3) : val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Yearly Energy Balance */}
              {energyBalanceYear && energyBalanceYear.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Roční bilance energie</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(energyBalanceYear[0] || {}).map((key) => (
                            <th
                              key={key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {energyBalanceYear.map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {Object.values(row).map((val, vidx) => (
                              <td key={vidx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {typeof val === 'number' ? formatNumber(val, 3) : val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Yearly Financial Balance */}
              {financialBalanceYear && financialBalanceYear.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Roční finanční bilance</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(financialBalanceYear[0] || {}).map((key) => (
                            <th
                              key={key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {financialBalanceYear.map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {Object.values(row).map((val, vidx) => (
                              <td key={vidx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {typeof val === 'number' ? formatNumber(val, 3) : val}
                              </td>
                            ))}
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
      </div>
    </div>
  );
};

export default ResultsPage;
