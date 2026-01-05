/**
 * Step1FileSelection - Select input file for calculation
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { formatFileSize, formatDate } from '../../utils/helpers';

const Step1FileSelection = ({ files, selectedFileId, onSelect }) => {
  const navigate = useNavigate();

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nejsou k dispozici žádné soubory</h3>
        <p className="text-gray-600 mb-6">
          Nejdříve nahrajte soubor s daty spotřeby.
        </p>
        <button
          type="button"
          onClick={() => navigate('/files')}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition"
        >
          <Upload className="w-5 h-5" />
          <span>Nahrát soubor</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Výběr vstupního souboru</h2>
        <p className="text-gray-600">Vyberte soubor obsahující data spotřeby energie.</p>
      </div>

      <div className="space-y-3">
        {files.map(file => {
          const isSelected = file.id === selectedFileId;
          
          return (
            <button
              key={file.id}
              type="button"
              onClick={() => onSelect(file.id)}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`
                  p-3 rounded-lg
                  ${isSelected ? 'bg-primary-100' : 'bg-gray-100'}
                `}>
                  <FileText className={`w-6 h-6 ${isSelected ? 'text-primary-600' : 'text-gray-600'}`} />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {file.original_filename}
                    </h3>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                    <span className="uppercase font-medium">{file.file_type}</span>
                    <span>•</span>
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span>Nahráno {formatDate(file.created_at)}</span>
                    
                    {/* File metadata - row count, date range, columns */}
                    {file.rows_count && (
                      <>
                        <span>•</span>
                        <span>{file.rows_count.toLocaleString()} řádků</span>
                      </>
                    )}
                    {file.date_from && file.date_to && (
                      <>
                        <span>•</span>
                        <span>{formatDate(file.date_from)} - {formatDate(file.date_to)}</span>
                      </>
                    )}
                    {file.file_metadata?.columns && (
                      <>
                        <span>•</span>
                        <span>{file.file_metadata.columns.length} sloupců</span>
                      </>
                    )}
                  </div>

                  {file.description && (
                    <p className="text-sm text-gray-600 mt-2">{file.description}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Tip:</p>
            <p>Soubor by měl obsahovat hodinová nebo čtvrthodinová data spotřeby energie ve formátu CSV nebo Excel.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1FileSelection;
