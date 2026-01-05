/**
 * Interactive Line Chart with Advanced Features
 * - Mouse wheel zoom
 * - Click and drag to select zoom area
 * - Toggle individual lines
 * - Reset zoom
 * - Export data
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceArea
} from 'recharts';
import { ZoomIn, ZoomOut, Maximize2, Download, Eye, EyeOff } from 'lucide-react';

const InteractiveLineChart = ({ 
  data, 
  lines = [], 
  height = 500,
  xAxisKey = 'Den',
  title,
  yAxisLabel
}) => {
  const [visibleLines, setVisibleLines] = useState(
    lines.reduce((acc, line) => ({ ...acc, [line.dataKey]: true }), {})
  );
  
  const [zoomState, setZoomState] = useState({
    data: data,
    left: 'dataMin',
    right: 'dataMax',
    refAreaLeft: '',
    refAreaRight: '',
    animation: true
  });

  const chartRef = useRef(null);
  const containerRef = useRef(null);

  // Toggle line visibility
  const toggleLine = useCallback((dataKey) => {
    setVisibleLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  }, []);

  // Handle mouse down for zoom selection
  const handleMouseDown = useCallback((e) => {
    if (e && e.activeLabel) {
      setZoomState(prev => ({
        ...prev,
        refAreaLeft: e.activeLabel,
        refAreaRight: ''
      }));
    }
  }, []);

  // Handle mouse move for zoom selection
  const handleMouseMove = useCallback((e) => {
    if (zoomState.refAreaLeft && e && e.activeLabel) {
      setZoomState(prev => ({
        ...prev,
        refAreaRight: e.activeLabel
      }));
    }
  }, [zoomState.refAreaLeft]);

  // Handle mouse up - apply zoom
  const handleMouseUp = useCallback(() => {
    if (zoomState.refAreaLeft && zoomState.refAreaRight) {
      let { refAreaLeft, refAreaRight } = zoomState;

      // Find indices in data array
      const leftIndex = data.findIndex(item => item[xAxisKey] === refAreaLeft);
      const rightIndex = data.findIndex(item => item[xAxisKey] === refAreaRight);

      // Ensure left < right
      const startIndex = Math.min(leftIndex, rightIndex);
      const endIndex = Math.max(leftIndex, rightIndex);

      if (startIndex !== endIndex && startIndex >= 0 && endIndex >= 0) {
        const zoomedData = data.slice(startIndex, endIndex + 1);
        
        setZoomState({
          data: zoomedData,
          left: 'dataMin',
          right: 'dataMax',
          refAreaLeft: '',
          refAreaRight: '',
          animation: false
        });
      }
    } else {
      setZoomState(prev => ({
        ...prev,
        refAreaLeft: '',
        refAreaRight: ''
      }));
    }
  }, [zoomState, data, xAxisKey]);

  // Reset zoom
  const handleZoomOut = useCallback(() => {
    setZoomState({
      data: data,
      left: 'dataMin',
      right: 'dataMax',
      refAreaLeft: '',
      refAreaRight: '',
      animation: true
    });
  }, [data]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9; // Zoom out or in
    const currentData = zoomState.data;
    const currentLength = currentData.length;
    
    if (zoomFactor > 1 && currentLength >= data.length) {
      return; // Already at max zoom out
    }
    
    if (zoomFactor < 1 && currentLength <= 10) {
      return; // Don't zoom in too much
    }
    
    const newLength = Math.round(currentLength * zoomFactor);
    const startIndex = data.findIndex(item => item[xAxisKey] === currentData[0][xAxisKey]);
    const centerIndex = Math.floor(currentLength / 2);
    const newStartIndex = Math.max(0, startIndex + centerIndex - Math.floor(newLength / 2));
    const newEndIndex = Math.min(data.length, newStartIndex + newLength);
    
    const newData = data.slice(newStartIndex, newEndIndex);
    
    setZoomState(prev => ({
      ...prev,
      data: newData,
      animation: false
    }));
  }, [zoomState.data, data, xAxisKey]);

  // Setup wheel event listener with { passive: false }
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Export data
  const handleExport = useCallback(() => {
    const exportData = zoomState.data;
    const headers = [xAxisKey, ...lines.filter(l => visibleLines[l.dataKey]).map(l => l.dataKey)];
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(h => row[h] ?? '').join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title || 'chart'}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }, [zoomState.data, lines, visibleLines, xAxisKey, title]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white border border-gray-300 rounded shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload
          .filter(entry => visibleLines[entry.dataKey])
          .map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value?.toFixed(2)}</span>
            </p>
          ))}
      </div>
    );
  };

  // Custom legend with toggle
  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {payload.map((entry, index) => (
          <button
            key={`legend-${index}`}
            onClick={() => toggleLine(entry.dataKey)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition ${
              visibleLines[entry.dataKey]
                ? 'bg-gray-100 hover:bg-gray-200'
                : 'bg-gray-50 opacity-50 hover:opacity-75'
            }`}
          >
            {visibleLines[entry.dataKey] ? (
              <Eye className="w-4 h-4" style={{ color: entry.color }} />
            ) : (
              <EyeOff className="w-4 h-4" style={{ color: entry.color }} />
            )}
            <div
              className="w-4 h-0.5"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium" style={{ 
              color: visibleLines[entry.dataKey] ? '#374151' : '#9CA3AF'
            }}>
              {entry.value}
            </span>
          </button>
        ))}
      </div>
    );
  };

  const visibleLinesCount = Object.values(visibleLines).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          <p className="text-sm text-gray-600 mt-1">
            Zobrazeno {zoomState.data.length} z {data.length} bodů
            {' • '}
            {visibleLinesCount} z {lines.length} řad
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoomState.data.length === data.length}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
            title="Resetovat zoom"
          >
            <Maximize2 className="w-4 h-4" />
            Reset
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 transition"
            title="Exportovat data"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <ZoomIn className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <strong>Ovládání:</strong>
            <ul className="mt-1 space-y-1 ml-4 list-disc">
              <li>Kolečko myši = zoom in/out</li>
              <li>Klikněte a táhněte myší = vyber oblast pro zoom</li>
              <li>Klikněte na legendu = zapnout/vypnout řadu</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div 
        ref={containerRef}
        className="border border-gray-200 rounded-lg p-4 bg-white"
      >
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={zoomState.data}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={xAxisKey}
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
              stroke="#6b7280"
              domain={[zoomState.left, zoomState.right]}
              allowDataOverflow
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            
            {lines.map((line) => (
              visibleLines[line.dataKey] && (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.stroke}
                  name={line.name}
                  strokeWidth={2}
                  dot={zoomState.data.length < 50}
                  isAnimationActive={zoomState.animation}
                  animationDuration={300}
                />
              )
            ))}

            {/* Reference area for zoom selection */}
            {zoomState.refAreaLeft && zoomState.refAreaRight && (
              <ReferenceArea
                x1={zoomState.refAreaLeft}
                x2={zoomState.refAreaRight}
                strokeOpacity={0.3}
                fill="#3b82f6"
                fillOpacity={0.3}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(InteractiveLineChart);
