/**
 * CostComparisonChart - Compare costs with and without PV system
 */

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const CostComparisonChart = ({ withoutPV, withPV, savings }) => {
  const data = [
    {
      name: 'Bez FVE',
      cost: withoutPV || 0,
      color: '#ef4444',
    },
    {
      name: 'S FVE',
      cost: withPV || 0,
      color: '#10b981',
    },
    {
      name: 'Úspora',
      cost: savings || 0,
      color: '#3b82f6',
    },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-1">{data.payload.name}</p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{data.value.toFixed(2)} Kč</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#6b7280', fontSize: 14 }}
          stroke="#9ca3af"
        />
        <YAxis 
          tick={{ fill: '#6b7280', fontSize: 12 }}
          stroke="#9ca3af"
          label={{ value: 'Kč', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="cost" 
          radius={[8, 8, 0, 0]}
          label={{ position: 'top', fill: '#374151', fontSize: 12 }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CostComparisonChart;
