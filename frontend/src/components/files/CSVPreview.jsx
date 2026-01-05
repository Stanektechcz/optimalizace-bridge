/**
 * CSV Preview Component
 */

import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, X } from 'lucide-react';
import Modal from '../common/Modal';

const CSVPreview = ({ file, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCSVPreview();
  }, [file]);

  const loadCSVPreview = async () => {
    try {
      setLoading(true);
      // In real implementation, fetch preview from API
      // For now, simulate data
      setData({
        headers: ['Datum', 'Spotřeba [kWh]', 'Teplota [°C]', 'Výroba FVE [kWh]'],
        rows: [
          ['2024-01-01 00:00', '2.5', '5.2', '0.0'],
          ['2024-01-01 01:00', '2.3', '5.0', '0.0'],
          ['2024-01-01 02:00', '2.1', '4.8', '0.0'],
          ['2024-01-01 08:00', '3.2', '6.5', '1.5'],
          ['2024-01-01 12:00', '4.5', '12.3', '4.8'],
        ],
        totalRows: 8760,
        fileSize: file.size,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Náhled CSV souboru" size="large">
      <div className="space-y-4">
        {/* File Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Název:</span>
              <p className="font-medium text-gray-900 mt-1">{file.filename}</p>
            </div>
            <div>
              <span className="text-gray-600">Velikost:</span>
              <p className="font-medium text-gray-900 mt-1">{formatFileSize(data?.fileSize || 0)}</p>
            </div>
            <div>
              <span className="text-gray-600">Počet řádků:</span>
              <p className="font-medium text-gray-900 mt-1">{data?.totalRows || 0}</p>
            </div>
            <div>
              <span className="text-gray-600">Počet sloupců:</span>
              <p className="font-medium text-gray-900 mt-1">{data?.headers?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Preview Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {data.headers.map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-gray-50">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-4 py-3 text-center text-sm text-gray-600 border-t">
              Zobrazeno {data.rows.length} z {data.totalRows} řádků
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Zavřít
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CSVPreview;
