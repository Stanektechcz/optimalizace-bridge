/**
 * Advanced Chart Controls
 * - Toggle between optimized and full data view
 * - Export chart data
 * - Chart type selector
 */

import React, { useState } from 'react';
import { Download, ZoomIn, ZoomOut, Maximize2, TrendingUp } from 'lucide-react';

const ChartControls = ({ 
  onToggleOptimization, 
  isOptimized = true,
  onExport,
  dataLength = 0,
  displayedLength = 0,
  onResetZoom
}) => {
  return (
    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <span className="text-gray-600">Data: </span>
          <span className="font-semibold text-gray-900">
            {displayedLength.toLocaleString('cs-CZ')} / {dataLength.toLocaleString('cs-CZ')} bodů
          </span>
        </div>
        
        {isOptimized && displayedLength < dataLength && (
          <div className="text-xs text-amber-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Optimalizováno pro rychlost
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onResetZoom}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1.5 transition"
          title="Resetovat zoom"
        >
          <Maximize2 className="w-4 h-4" />
          Reset
        </button>

        <button
          onClick={onToggleOptimization}
          className={`px-3 py-1.5 text-sm rounded flex items-center gap-1.5 transition ${
            isOptimized
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-white border border-gray-300 hover:bg-gray-50'
          }`}
          title={isOptimized ? 'Zobrazit všechna data (může být pomalé)' : 'Zapnout optimalizaci'}
        >
          {isOptimized ? <ZoomIn className="w-4 h-4" /> : <ZoomOut className="w-4 h-4" />}
          {isOptimized ? 'Zobrazit vše' : 'Optimalizovat'}
        </button>

        {onExport && (
          <button
            onClick={onExport}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1.5 transition"
            title="Exportovat data grafu"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
      </div>
    </div>
  );
};

export default ChartControls;
