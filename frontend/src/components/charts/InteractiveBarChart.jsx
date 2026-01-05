/**
 * Interactive Bar Chart with Advanced Features
 * - Mouse wheel zoom
 * - Click and drag to select zoom area
 * - Toggle individual bars
 * - Reset zoom
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceArea
} from 'recharts';
import { Maximize2, Download, Eye, EyeOff } from 'lucide-react';

const InteractiveBarChart = ({ 
  data, 
  bars = [], 
  height = 450,
  xAxisKey = 'Den',
  title,
  yAxisLabel
}) => {
  const [visibleBars, setVisibleBars] = useState(
    bars.reduce((acc, bar) => ({ ...acc, [bar.dataKey]: true }), {})
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

  const toggleBar = useCallback((dataKey) => {
    setVisibleBars(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e && e.activeLabel) {
      setZoomState(prev => ({
        ...prev,
        refAreaLeft: e.activeLabel,
        refAreaRight: ''
      }));
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (zoomState.refAreaLeft && e && e.activeLabel) {
      setZoomState(prev => ({
        ...prev,
        refAreaRight: e.activeLabel
      }));
    }
  }, [zoomState.refAreaLeft]);

  const handleMouseUp = useCallback(() => {
    if (zoomState.refAreaLeft && zoomState.refAreaRight) {
      let { refAreaLeft, refAreaRight } = zoomState;

      const leftIndex = data.findIndex(item => item[xAxisKey] === refAreaLeft);
      const rightIndex = data.findIndex(item => item[xAxisKey] === refAreaRight);

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

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const currentData = zoomState.data;
    const currentLength = currentData.length;
    
    if (zoomFactor > 1 && currentLength >= data.length) return;
    if (zoomFactor < 1 && currentLength <= 10) return;
    
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

  const handleExport = useCallback(() => {
    const exportData = zoomState.data;
    const headers = [xAxisKey, ...bars.filter(b => visibleBars[b.dataKey]).map(b => b.dataKey)];
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
  }, [zoomState.data, bars, visibleBars, xAxisKey, title]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white border border-gray-300 rounded shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload
          .filter(entry => visibleBars[entry.dataKey])
          .map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value?.toFixed(2)}</span>
            </p>
          ))}
      </div>
    );
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {payload.map((entry, index) => (
          <button
            key={`legend-${index}`}
            onClick={() => toggleBar(entry.dataKey)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition ${
              visibleBars[entry.dataKey]
                ? 'bg-gray-100 hover:bg-gray-200'
                : 'bg-gray-50 opacity-50 hover:opacity-75'
            }`}
          >
            {visibleBars[entry.dataKey] ? (
              <Eye className="w-4 h-4" style={{ color: entry.color }} />
            ) : (
              <EyeOff className="w-4 h-4" style={{ color: entry.color }} />
            )}
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium" style={{ 
              color: visibleBars[entry.dataKey] ? '#374151' : '#9CA3AF'
            }}>
              {entry.value}
            </span>
          </button>
        ))}
      </div>
    );
  };

  const visibleBarsCount = Object.values(visibleBars).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          <p className="text-sm text-gray-600 mt-1">
            Zobrazeno {zoomState.data.length} z {data.length} bodů
            {' • '}
            {visibleBarsCount} z {bars.length} sloupců
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoomState.data.length === data.length}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
          >
            <Maximize2 className="w-4 h-4" />
            Reset
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="border border-gray-200 rounded-lg p-4 bg-white"
      >
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
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
            
            {bars.map((bar) => (
              visibleBars[bar.dataKey] && (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  fill={bar.fill}
                  name={bar.name}
                  isAnimationActive={zoomState.animation}
                  animationDuration={300}
                />
              )
            ))}

            {zoomState.refAreaLeft && zoomState.refAreaRight && (
              <ReferenceArea
                x1={zoomState.refAreaLeft}
                x2={zoomState.refAreaRight}
                strokeOpacity={0.3}
                fill="#3b82f6"
                fillOpacity={0.3}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(InteractiveBarChart);
