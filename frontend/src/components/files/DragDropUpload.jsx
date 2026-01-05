/**
 * Drag & Drop File Upload Component
 */

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

const DragDropUpload = ({ onUpload, accept = '.csv,.xlsx,.xls', maxSize = 100 * 1024 * 1024 }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const onDrop = useCallback(
    async (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map((file) => 
          `${file.file.name}: ${file.errors.map(e => e.message).join(', ')}`
        );
        alert('Některé soubory byly odmítnuty:\n' + errors.join('\n'));
        return;
      }

      setUploading(true);
      const results = [];

      for (const file of acceptedFiles) {
        try {
          const result = await onUpload(file);
          results.push({ file, success: true, result });
        } catch (error) {
          results.push({ file, success: false, error: error.message });
        }
      }

      setUploadedFiles((prev) => [...prev, ...results]);
      setUploading(false);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize,
    multiple: true,
  });

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`} />
        
        {isDragActive ? (
          <p className="text-lg font-medium text-primary-700">Pusťte soubory zde...</p>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Přetáhněte soubory sem nebo klikněte pro výběr
            </p>
            <p className="text-sm text-gray-500">
              Podporované formáty: CSV, XLS, XLSX (max {Math.round(maxSize / 1024 / 1024)} MB)
            </p>
          </div>
        )}
      </div>

      {/* Uploading Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 font-medium">Nahrávám soubory...</span>
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Nahrané soubory:</h4>
          {uploadedFiles.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${
                item.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                {item.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${item.success ? 'text-green-800' : 'text-red-800'}`}>
                    {item.file.name}
                  </p>
                  {item.error && <p className="text-xs text-red-600 mt-1">{item.error}</p>}
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DragDropUpload;
