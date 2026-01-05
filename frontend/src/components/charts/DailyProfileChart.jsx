/**
 * DailyProfileChart - 24-hour daily energy profile
 */

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const DailyProfileChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Nejsou k dispozici data pro denní profil</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-2">{label}:00</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value.toFixed(2)} kW</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="hour" 
          tick={{ fill: '#6b7280', fontSize: 12 }}
          stroke="#9ca3af"
          label={{ value: 'Hodina', position: 'insideBottom', offset: -5, fill: '#6b7280' }}
        />
        <YAxis 
          tick={{ fill: '#6b7280', fontSize: 12 }}
          stroke="#9ca3af"
          label={{ value: 'kW', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
          iconType="circle"
        />
        <Area 
          type="monotone" 
          dataKey="production" 
          stroke="#10b981" 
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorProduction)"
          name="Výroba FVE"
        />
        <Area 
          type="monotone" 
          dataKey="consumption" 
          stroke="#3b82f6" 
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorConsumption)"
          name="Spotřeba"
        />
        {data[0]?.battery !== undefined && (
          <Area 
            type="monotone" 
            dataKey="battery" 
            stroke="#f59e0b" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorBattery)"
            name="Baterie"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default DailyProfileChart;
