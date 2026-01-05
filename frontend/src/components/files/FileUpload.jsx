/**
 * File Upload Component with Drag & Drop
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { filesService } from '../../services/filesService';
import { Upload, File, CheckCircle, XCircle } from 'lucide-react';
import { formatFileSize, parseErrorMessage } from '../../utils/helpers';

const FileUpload = ({ onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('csv');

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setError('');
      setSuccess(false);
      
      // Auto-detect file type
      const ext = file.name.split('.').pop().toLowerCase();
      if (['csv', 'xls', 'xlsx'].includes(ext)) {
        setFileType(ext);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError('');
      setProgress(0);

      await filesService.uploadFile(selectedFile, fileType, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setProgress(percentCompleted);
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}
          ${selectedFile ? 'bg-gray-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <File className="w-8 h-8 text-primary-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-1">
              {isDragActive ? 'Přetáhněte soubor sem' : 'Klikněte nebo přetáhněte soubor'}
            </p>
            <p className="text-sm text-gray-500">CSV, XLS nebo XLSX (max. 100MB)</p>
          </>
        )}
      </div>

      {/* File Type Selection */}
      {selectedFile && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Typ souboru
          </label>
          <div className="flex gap-3">
            {['csv', 'xls', 'xlsx'].map((type) => (
              <button
                key={type}
                onClick={() => setFileType(type)}
                className={`
                  px-4 py-2 rounded-lg border-2 font-medium uppercase text-sm transition
                  ${
                    fileType === type
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }
                `}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">Nahrávání...</span>
            <span className="text-gray-900 font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800">Soubor úspěšně nahrán!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !success && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Nahrávám...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>Nahrát soubor</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default FileUpload;
