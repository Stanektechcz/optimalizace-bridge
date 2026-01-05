/**
 * EnergyDistributionChart - Pie chart for energy distribution
 */

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  'self_consumption': '#10b981',  // Green
  'grid_import': '#ef4444',        // Red
  'grid_export': '#3b82f6',        // Blue
  'battery_charge': '#f59e0b',     // Orange
  'battery_discharge': '#8b5cf6',  // Purple
};

const EnergyDistributionChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Nejsou k dispozici data pro rozdělení energie</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-1">{data.name}</p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{data.value.toFixed(2)} kWh</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.payload.percentage?.toFixed(1)}% celkové energie
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLabel = (entry) => {
    return `${entry.percentage?.toFixed(1)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={120}
          label={renderLabel}
          labelLine={true}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[entry.id] || `hsl(${index * 60}, 70%, 50%)`}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default EnergyDistributionChart;
