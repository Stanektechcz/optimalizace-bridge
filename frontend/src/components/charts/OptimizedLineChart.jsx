/**
 * Optimized Line Chart Component
 * - Data decimation based on zoom level
 * - Memoization to prevent unnecessary re-renders
 * - Efficient data filtering
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Brush
} from 'recharts';

/**
 * Decimate data to reduce points while preserving shape
 * Uses Largest-Triangle-Three-Buckets algorithm simplified version
 */
const decimateData = (data, threshold) => {
  if (data.length <= threshold) return data;
  
  const bucketSize = Math.floor(data.length / threshold);
  const decimated = [];
  
  // Always keep first point
  decimated.push(data[0]);
  
  for (let i = 1; i < threshold - 1; i++) {
    const bucketStart = i * bucketSize;
    const bucketEnd = Math.min((i + 1) * bucketSize, data.length);
    
    // Find point with max deviation in bucket
    let maxIdx = bucketStart;
    let maxDiff = 0;
    
    for (let j = bucketStart; j < bucketEnd; j++) {
      const point = data[j];
      let diff = 0;
      
      // Calculate total deviation from average across all numeric fields
      Object.keys(point).forEach(key => {
        if (typeof point[key] === 'number') {
          diff += Math.abs(point[key]);
        }
      });
      
      if (diff > maxDiff) {
        maxDiff = diff;
        maxIdx = j;
      }
    }
    
    decimated.push(data[maxIdx]);
  }
  
  // Always keep last point
  decimated.push(data[data.length - 1]);
  
  return decimated;
};

/**
 * Get visible data based on brush selection
 */
const getVisibleData = (data, startIndex, endIndex) => {
  if (startIndex === undefined || endIndex === undefined) return data;
  return data.slice(startIndex, endIndex + 1);
};

const OptimizedLineChart = ({ 
  data, 
  lines = [], 
  height = 400,
  xAxisKey = 'Den',
  showBrush = true,
  maxPoints = 500, // Maximum points to render at once
  enableOptimization = true, // Allow toggling optimization
  onDataLengthChange // Callback to report data length
}) => {
  const [brushIndexes, setBrushIndexes] = useState({
    startIndex: undefined,
    endIndex: undefined
  });
  const [isOptimized, setIsOptimized] = useState(true);

  // Memoize decimated data - only recalculate if data changes
  const baseDecimatedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    // Initial decimation to reasonable size for overview
    return decimateData(data, Math.min(maxPoints * 2, data.length));
  }, [data, maxPoints]);

  // Get visible data with further decimation if needed
  const visibleData = useMemo(() => {
    const { startIndex, endIndex } = brushIndexes;
    
    // If optimization disabled, show all data (may be slow)
    if (!enableOptimization || !isOptimized) {
      if (startIndex === undefined || endIndex === undefined) {
        return data;
      }
      return getVisibleData(data, startIndex, endIndex);
    }
    
    // If no brush selection, use base decimated data
    if (startIndex === undefined || endIndex === undefined) {
      return baseDecimatedData;
    }
    
    // Get data in selected range
    const rangeData = getVisibleData(data, startIndex, endIndex);
    
    // Decimate if still too many points
    if (rangeData.length > maxPoints) {
      return decimateData(rangeData, maxPoints);
    }
    
    return rangeData;
  }, [data, baseDecimatedData, brushIndexes, maxPoints, enableOptimization, isOptimized]);
  
  // Report data length changes
  React.useEffect(() => {
    if (onDataLengthChange) {
      onDataLengthChange({
        total: data.length,
        displayed: visibleData.length,
        isOptimized: isOptimized && enableOptimization
      });
    }
  }, [data.length, visibleData.length, isOptimized, enableOptimization, onDataLengthChange]);

  // Handle brush change
  const handleBrushChange = useCallback((brushData) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      setBrushIndexes({
        startIndex: brushData.startIndex,
        endIndex: brushData.endIndex
      });
    }
  }, []);

  // Custom tooltip to show exact values
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white border border-gray-300 rounded shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value?.toFixed(2)}</span>
          </p>
        ))}
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Žádná data k zobrazení
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 text-sm text-gray-600">
        Zobrazeno {visibleData.length} z {data.length} datových bodů
        {visibleData.length < data.length && ' (data optimalizována pro rychlost)'}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart 
          data={visibleData}
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
          />
          <YAxis 
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              name={line.name}
              dot={visibleData.length < 100} // Only show dots if few points
              strokeWidth={2}
              isAnimationActive={false} // Disable animation for better performance
            />
          ))}
          {showBrush && (
            <Brush 
              dataKey={xAxisKey}
              height={30}
              stroke="#3b82f6"
              onChange={handleBrushChange}
              data={baseDecimatedData} // Use decimated data for brush
              fill="#eff6ff"
              travellerWidth={10}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(OptimizedLineChart);
