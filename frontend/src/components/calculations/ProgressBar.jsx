/**
 * ProgressBar - Display calculation progress with percentage
 */

import React from 'react';
import { Loader } from 'lucide-react';

const ProgressBar = ({ progress = 0, status = 'running', showLabel = true }) => {
  const getProgressColor = () => {
    if (status === 'completed') return 'bg-green-600';
    if (status === 'failed' || status === 'cancelled') return 'bg-red-600';
    return 'bg-blue-600';
  };

  const getProgressText = () => {
    if (status === 'completed') return 'Dokončeno';
    if (status === 'failed') return 'Selhalo';
    if (status === 'cancelled') return 'Zrušeno';
    if (status === 'pending') return 'Čeká na spuštění...';
    return 'Probíhá výpočet...';
  };

  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
            {status === 'running' && <Loader className="w-4 h-4 animate-spin" />}
            {getProgressText()}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {clampedProgress.toFixed(0)}%
          </span>
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-500 ease-out ${getProgressColor()} ${
            status === 'running' ? 'animate-pulse' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
        >
          {status === 'running' && (
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
          )}
        </div>
      </div>

      {status === 'running' && clampedProgress < 100 && (
        <p className="text-xs text-gray-500 mt-1">
          Odhadovaný čas: {Math.ceil((100 - clampedProgress) / 10)} minut
        </p>
      )}
    </div>
  );
};

export default ProgressBar;
