/**
 * LogViewer - Display live logs stream with auto-scroll
 */

import React, { useEffect, useRef } from 'react';
import { Terminal, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

const LogViewer = ({ logs = [], isLive = false, maxHeight = '400px' }) => {
  const logsEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (isLive && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, isLive]);

  const getLogIcon = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />;
      case 'INFO':
        return <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />;
      default:
        return <Terminal className="w-4 h-4 text-gray-600 flex-shrink-0" />;
    }
  };

  const getLogColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'INFO':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'SUCCESS':
        return 'bg-green-50 border-green-200 text-green-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Terminal className="w-12 h-12 mb-3 text-gray-400" />
        <p className="text-sm">Zatím žádné logy</p>
        {isLive && (
          <p className="text-xs text-gray-400 mt-1">Čekám na výstup z výpočtu...</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Výpis logů ({logs.length})
          </h3>
        </div>
        {isLive && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-600 font-medium">LIVE</span>
          </div>
        )}
      </div>

      {/* Logs Container */}
      <div
        ref={containerRef}
        className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
        style={{ maxHeight }}
      >
        <div className="space-y-2">
          {logs.map((log, index) => (
            <div
              key={log.id || index}
              className={`flex items-start gap-3 p-2 rounded border ${getLogColor(log.level)}`}
            >
              {getLogIcon(log.level)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase ${
                    log.level === 'ERROR' ? 'text-red-700' :
                    log.level === 'WARNING' ? 'text-yellow-700' :
                    log.level === 'INFO' ? 'text-blue-700' :
                    log.level === 'SUCCESS' ? 'text-green-700' :
                    'text-gray-700'
                  }`}>
                    {log.level || 'LOG'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {log.timestamp ? formatDateTime(log.timestamp) : new Date().toLocaleTimeString('cs-CZ')}
                  </span>
                </div>
                <p className="text-sm break-words whitespace-pre-wrap">
                  {log.message}
                </p>
                {log.details && (
                  <pre className="mt-2 text-xs bg-black bg-opacity-10 p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Celkem: {logs.length}</span>
        <span>Chyby: {logs.filter(l => l.level === 'ERROR').length}</span>
        <span>Varování: {logs.filter(l => l.level === 'WARNING').length}</span>
      </div>
    </div>
  );
};

export default LogViewer;
