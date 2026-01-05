/**
 * Enhanced Line Chart with Controls
 * Combines OptimizedLineChart with ChartControls for full functionality
 */

import React, { useState, useCallback } from 'react';
import OptimizedLineChart from './OptimizedLineChart';
import ChartControls from './ChartControls';

const EnhancedLineChart = ({ 
  data, 
  lines = [], 
  height = 400,
  xAxisKey = 'Den',
  showBrush = true,
  maxPoints = 500,
  title,
  onExport
}) => {
  const [isOptimized, setIsOptimized] = useState(true);
  const [dataInfo, setDataInfo] = useState({
    total: data.length,
    displayed: data.length,
    isOptimized: true
  });
  const [brushKey, setBrushKey] = useState(0); // Key to force brush reset

  const handleToggleOptimization = useCallback(() => {
    setIsOptimized(prev => !prev);
  }, []);

  const handleDataLengthChange = useCallback((info) => {
    setDataInfo(info);
  }, []);

  const handleResetZoom = useCallback(() => {
    // Force re-render of chart to reset brush
    setBrushKey(prev => prev + 1);
  }, []);

  const handleExportData = useCallback(() => {
    if (onExport) {
      onExport(data);
    } else {
      // Default export as CSV
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => row[h]).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `chart_data_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    }
  }, [data, onExport]);

  return (
    <div>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {title}
        </h3>
      )}
      
      <ChartControls
        isOptimized={dataInfo.isOptimized}
        onToggleOptimization={handleToggleOptimization}
        dataLength={dataInfo.total}
        displayedLength={dataInfo.displayed}
        onResetZoom={handleResetZoom}
        onExport={handleExportData}
      />

      <OptimizedLineChart
        key={brushKey}
        data={data}
        lines={lines}
        height={height}
        xAxisKey={xAxisKey}
        showBrush={showBrush}
        maxPoints={maxPoints}
        enableOptimization={isOptimized}
        onDataLengthChange={handleDataLengthChange}
      />
    </div>
  );
};

export default React.memo(EnhancedLineChart);
