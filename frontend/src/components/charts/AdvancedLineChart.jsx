import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { Download, RotateCcw, Eye, EyeOff } from 'lucide-react';

/**
 * AdvancedLineChart - pokročilá implementace podle Python funsChart.py
 * Podporuje:
 * - Suma režimy (všechno, spotřeba+výroba, spotřeba+baterie, výroba+baterie)
 * - Invertování výroby (negace PVkWh hodnot)
 * - Baterie režimy (odběr/dodávka vs energie v baterii)
 * - Dual Y-axis (energie vlevo, cena vpravo)
 * - Interaktivní funkce: zoom kolečkem, drag-to-zoom, toggle čar, export
 * - Decimace dat pro rychlost (LTTB algorithm)
 * - České formátování datumů (d.m.y H:i)
 */

// LTTB (Largest-Triangle-Three-Buckets) decimation algorithm
const decimateData = (data, threshold) => {
  if (data.length <= threshold || threshold <= 2) {
    return data;
  }

  const sampled = [];
  const bucketSize = (data.length - 2) / (threshold - 2);
  
  sampled.push(data[0]); // First point

  for (let i = 0; i < threshold - 2; i++) {
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    let avgX = 0;
    let avgY = 0;

    for (let j = avgRangeStart; j < avgRangeEnd && j < data.length; j++) {
      avgX += j;
      avgY += (data[j].kWh || 0);
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    const rangeStart = Math.floor(i * bucketSize) + 1;
    const rangeEnd = Math.floor((i + 1) * bucketSize) + 1;

    const pointAX = sampled[sampled.length - 1] ? sampled.length - 1 : 0;
    const pointAY = sampled[sampled.length - 1] ? (sampled[sampled.length - 1].kWh || 0) : 0;

    let maxArea = -1;
    let maxAreaPoint = null;

    for (let j = rangeStart; j < rangeEnd && j < data.length; j++) {
      const area = Math.abs(
        (pointAX - avgX) * ((data[j].kWh || 0) - pointAY) -
        (pointAX - j) * (avgY - pointAY)
      ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = data[j];
      }
    }

    if (maxAreaPoint) {
      sampled.push(maxAreaPoint);
    }
  }

  sampled.push(data[data.length - 1]); // Last point
  return sampled;
};

// Formátování českého datumu: 5.11.2025 14:30
const formatCzechDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch (e) {
    return dateString;
  }
};

const AdvancedLineChart = ({
  data = [],
  title = '',
  height = 400,
  
  // Control states from ChartDisplayControls
  visibleLines = {},
  onToggleLine,
  invertProduction = false,
  sumMode = 'all', // 'all', 'consAndProd', 'consAndBatt', 'prodAndBatt'
  batteryMode = 'flow', // 'flow', 'energy'
  
  // Data field mappings
  fields = {
    consumption: 'kWh',
    production: 'PVkWh',
    battery: 'BkWh',
    batteryEnergy: 'BkWh_charge',
    price: 'Kč/kWh',
  },
  
  // Colors - podle Python styleColors
  colors = {
    consumption: '#9467bd',  // tab:purple
    production: '#ff7f0e',   // tab:orange
    battery: '#1f77b4',      // tab:blue
    sum: '#2ca02c',          // tab:green
    price: '#d62728',        // tab:red
  },
  
  // Y-axis labels
  yAxisLabel = 'Energie - kWh',
  yAxisLabelRight = 'Cena - Kč/kWh',
  
  // Decimation threshold
  maxDataPoints = 2000,
}) => {
  
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  
  // Zoom state
  const [zoomState, setZoomState] = useState({
    left: 0,
    right: data.length - 1,
    refAreaLeft: null,
    refAreaRight: null,
  });
  
  // Processed data with sum calculation, production inversion, and decimation
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // First, process all data
    const processed = data.map((item, index) => {
      const cons = item[fields.consumption] || 0;
      const prod = item[fields.production] || 0;
      const batt = item[fields.battery] || 0;
      
      // Invertovat výrobu
      const productionValue = invertProduction ? -prod : prod;
      
      // Suma režimy
      let sumValue;
      switch (sumMode) {
        case 'all':
          sumValue = batt + cons + prod;
          break;
        case 'consAndProd':
          sumValue = cons + prod;
          break;
        case 'consAndBatt':
          sumValue = batt + cons;
          break;
        case 'prodAndBatt':
          sumValue = batt + prod;
          break;
        default:
          sumValue = batt + cons + prod;
      }
      
      // Baterie režimy
      const batteryValue = batteryMode === 'energy' && fields.batteryEnergy
        ? item[fields.batteryEnergy] || batt
        : batt;
      
      return {
        ...item,
        _index: index,
        _processedProduction: productionValue,
        _processedSum: sumValue,
        _processedBattery: batteryValue,
        _formattedDate: formatCzechDate(item.Den),
      };
    });
    
    // Apply zoom filter
    const { left, right } = zoomState;
    const filtered = processed.slice(left, right + 1);
    
    // Apply decimation if needed
    if (filtered.length > maxDataPoints) {
      return decimateData(filtered, maxDataPoints);
    }
    
    return filtered;
  }, [data, fields, invertProduction, sumMode, batteryMode, zoomState, maxDataPoints]);
  
  // Mouse drag selection for zoom
  const [isDragging, setIsDragging] = useState(false);
  
  const handleMouseDown = useCallback((e) => {
    if (e && e.activeLabel !== undefined) {
      const index = processedData.findIndex(d => d.Den === e.activeLabel);
      if (index !== -1) {
        setZoomState(prev => ({
          ...prev,
          refAreaLeft: index,
          refAreaRight: null,
        }));
        setIsDragging(true);
      }
    }
  }, [processedData]);
  
  const handleMouseMove = useCallback((e) => {
    if (isDragging && e && e.activeLabel !== undefined) {
      const index = processedData.findIndex(d => d.Den === e.activeLabel);
      if (index !== -1) {
        setZoomState(prev => ({
          ...prev,
          refAreaRight: index,
        }));
      }
    }
  }, [isDragging, processedData]);
  
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const { refAreaLeft, refAreaRight } = zoomState;
    
    if (refAreaLeft === null || refAreaRight === null || refAreaLeft === refAreaRight) {
      setZoomState(prev => ({
        ...prev,
        refAreaLeft: null,
        refAreaRight: null,
      }));
      return;
    }
    
    // Get actual indices in original data
    const leftIdx = processedData[refAreaLeft]?._index;
    const rightIdx = processedData[refAreaRight]?._index;
    
    if (leftIdx !== undefined && rightIdx !== undefined) {
      const newLeft = Math.min(leftIdx, rightIdx);
      const newRight = Math.max(leftIdx, rightIdx);
      
      setZoomState({
        left: newLeft,
        right: newRight,
        refAreaLeft: null,
        refAreaRight: null,
      });
    } else {
      setZoomState(prev => ({
        ...prev,
        refAreaLeft: null,
        refAreaRight: null,
      }));
    }
  }, [isDragging, zoomState, processedData]);
  
  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const delta = e.deltaY;
    const zoomFactor = delta > 0 ? 1.1 : 0.9; // Zoom out / Zoom in
    
    const { left, right } = zoomState;
    const currentRange = right - left;
    const newRange = Math.max(10, Math.floor(currentRange * zoomFactor));
    const centerIndex = Math.floor((left + right) / 2);
    
    let newLeft = Math.max(0, centerIndex - Math.floor(newRange / 2));
    let newRight = Math.min(data.length - 1, centerIndex + Math.floor(newRange / 2));
    
    // Adjust if we hit boundaries
    if (newRight - newLeft < newRange) {
      if (newLeft === 0) {
        newRight = Math.min(data.length - 1, newLeft + newRange);
      } else if (newRight === data.length - 1) {
        newLeft = Math.max(0, newRight - newRange);
      }
    }
    
    setZoomState(prev => ({
      ...prev,
      left: newLeft,
      right: newRight,
    }));
  }, [zoomState, data.length]);
  
  // Register wheel event with passive: false
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);
  
  // Reset zoom
  const resetZoom = useCallback(() => {
    setZoomState({
      left: 0,
      right: data.length - 1,
      refAreaLeft: null,
      refAreaRight: null,
    });
  }, [data.length]);
  
  // Export to CSV
  const exportToCSV = useCallback(() => {
    // Build CSV with visible lines only
    const headers = ['Datum'];
    const dataKeys = [];
    
    if (visibleLines.consumption !== false) {
      headers.push('Spotřeba (kWh)');
      dataKeys.push(fields.consumption);
    }
    if (visibleLines.production !== false) {
      headers.push(invertProduction ? 'Výroba (kWh) [invertováno]' : 'Výroba (kWh)');
      dataKeys.push('_processedProduction');
    }
    if (visibleLines.battery !== false) {
      headers.push(batteryMode === 'energy' ? 'Energie v baterii (kWh)' : 'Baterie (kWh)');
      dataKeys.push('_processedBattery');
    }
    if (visibleLines.sum !== false) {
      headers.push(`Suma (${getSumModeLabel(sumMode)})`);
      dataKeys.push('_processedSum');
    }
    if (visibleLines.price !== false && fields.price) {
      headers.push('Cena (Kč/kWh)');
      dataKeys.push(fields.price);
    }
    
    const csvContent = [
      headers.join(','),
      ...processedData.map(row => {
        const values = [row._formattedDate || row.Den];
        dataKeys.forEach(key => {
          values.push(row[key] !== undefined ? row[key] : '');
        });
        return values.join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}_export.csv`;
    link.click();
  }, [processedData, visibleLines, fields, title, invertProduction, sumMode, batteryMode]);
  
  // Custom tooltip with Czech date format
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '10px',
        fontSize: '13px',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
          {data._formattedDate}
        </div>
        {payload.map((entry, index) => (
          <div key={index} style={{ color: entry.color, marginTop: '3px' }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </div>
        ))}
      </div>
    );
  }, []);
  
  // Custom legend with eye icons
  const CustomLegend = useCallback((props) => {
    const { payload } = props;
    
    return (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '16px',
        padding: '8px 0',
      }}>
        {payload.map((entry, index) => {
          const lineKey = getLineKeyFromDataKey(entry.dataKey);
          const isVisible = visibleLines[lineKey] !== false;
          const Icon = isVisible ? Eye : EyeOff;
          
          return (
            <div
              key={`legend-${index}`}
              onClick={() => onToggleLine && onToggleLine(lineKey)}
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                opacity: isVisible ? 1 : 0.5,
                transition: 'opacity 0.2s',
              }}
            >
              <Icon size={16} style={{ marginRight: '4px' }} />
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: entry.color,
                  marginRight: '8px',
                  borderRadius: '2px',
                }}
              />
              <span style={{ fontSize: '14px' }}>{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  }, [visibleLines, onToggleLine]);
  
  // Build lines configuration
  const linesConfig = useMemo(() => {
    const lines = [];
    
    // Left Y-axis (energy)
    if (visibleLines.consumption !== false) {
      lines.push({
        dataKey: fields.consumption,
        stroke: colors.consumption,
        name: 'Spotřeba',
        strokeWidth: 2,
        dot: false,
        yAxisId: 'left',
        isAnimationActive: false,
      });
    }
    
    if (visibleLines.production !== false) {
      lines.push({
        dataKey: '_processedProduction',
        stroke: colors.production,
        name: 'Výroba',
        strokeWidth: 1.5,
        dot: false,
        yAxisId: 'left',
        isAnimationActive: false,
      });
    }
    
    if (visibleLines.battery !== false) {
      lines.push({
        dataKey: '_processedBattery',
        stroke: colors.battery,
        name: batteryMode === 'energy' ? 'Energie v baterii' : 'Baterie',
        strokeWidth: 1.5,
        dot: false,
        yAxisId: 'left',
        isAnimationActive: false,
      });
    }
    
    if (visibleLines.sum !== false) {
      lines.push({
        dataKey: '_processedSum',
        stroke: colors.sum,
        name: `Suma (${getSumModeLabel(sumMode)})`,
        strokeWidth: 2,
        dot: false,
        yAxisId: 'left',
        isAnimationActive: false,
      });
    }
    
    // Right Y-axis (price)
    if (visibleLines.price !== false && fields.price) {
      lines.push({
        dataKey: fields.price,
        stroke: colors.price,
        name: 'Cena',
        strokeWidth: 1.5,
        strokeDasharray: '5 5',
        dot: false,
        yAxisId: 'right',
        isAnimationActive: false,
      });
    }
    
    return lines;
  }, [visibleLines, fields, colors, sumMode, batteryMode]);
  
  // Custom X-axis tick formatter
  const formatXAxis = useCallback((value) => {
    return formatCzechDate(value);
  }, []);
  
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{title}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={resetZoom}
            style={{
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
            }}
          >
            <RotateCcw size={16} />
            Reset Zoom
          </button>
          <button
            onClick={exportToCSV}
            style={{
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
            }}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        style={{ 
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            ref={chartRef}
            data={processedData}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDragging(false)}
            margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            
            <XAxis
              dataKey="Den"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            
            <YAxis
              yAxisId="left"
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
            />
            
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: yAxisLabelRight, angle: 90, position: 'insideRight' }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend content={<CustomLegend />} />
            
            {linesConfig.map((lineConfig, index) => (
              <Line
                key={`line-${index}`}
                {...lineConfig}
              />
            ))}
            
            {zoomState.refAreaLeft !== null && zoomState.refAreaRight !== null && (
              <ReferenceArea
                yAxisId="left"
                x1={processedData[zoomState.refAreaLeft]?.Den}
                x2={processedData[zoomState.refAreaRight]?.Den}
                strokeOpacity={0.3}
                fill="#8884d8"
                fillOpacity={0.3}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div style={{ 
        marginTop: '8px', 
        fontSize: '12px', 
        color: '#666',
        textAlign: 'center',
      }}>
        💡 Kolečkem myši zoomujte, tažením vyberte oblast pro zoom, klikněte na legendu pro skrytí/zobrazení čar
        {processedData.length < data.length && ` • Zobrazeno ${processedData.length} z ${data.length} bodů (optimalizováno)`}
      </div>
    </div>
  );
};

// Helper functions
const getSumModeLabel = (mode) => {
  const labels = {
    all: 'Všechno',
    consAndProd: 'Spotřeba a výroba',
    consAndBatt: 'Spotřeba a baterie',
    prodAndBatt: 'Výroba a baterie',
  };
  return labels[mode] || mode;
};

const getLineKeyFromDataKey = (dataKey) => {
  const mapping = {
    'kWh': 'consumption',
    '_processedProduction': 'production',
    '_processedBattery': 'battery',
    '_processedSum': 'sum',
    'Kč/kWh': 'price',
  };
  return mapping[dataKey] || dataKey;
};

export default AdvancedLineChart;
