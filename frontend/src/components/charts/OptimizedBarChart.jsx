/**
 * Optimized Bar Chart Component
 * - Data decimation for performance
 * - Memoization to prevent unnecessary re-renders
 * - Efficient rendering
 */

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

/**
 * Simple data decimation - take every Nth point
 */
const decimateData = (data, maxPoints) => {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  const decimated = [];
  
  for (let i = 0; i < data.length; i += step) {
    decimated.push(data[i]);
  }
  
  // Always include last point
  if (decimated[decimated.length - 1] !== data[data.length - 1]) {
    decimated.push(data[data.length - 1]);
  }
  
  return decimated;
};

const OptimizedBarChart = ({ 
  data, 
  bars = [], 
  height = 400,
  xAxisKey = 'Den',
  maxPoints = 300 // Maximum bars to render
}) => {
  // Memoize decimated data
  const decimatedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return decimateData(data, maxPoints);
  }, [data, maxPoints]);

  // Custom tooltip
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
        Zobrazeno {decimatedData.length} z {data.length} datových bodů
        {decimatedData.length < data.length && ' (data agregována pro rychlost)'}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          data={decimatedData}
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
          />
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={bar.fill}
              name={bar.name}
              isAnimationActive={false} // Disable animation for better performance
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(OptimizedBarChart);
