/**
 * Files Page - List and manage uploaded files
 */

import React, { useState, useEffect } from 'react';
import filesService from '../services/filesService.js';
import { Upload, FileText, Trash2, Download, Search, Filter, Eye } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import Modal from '../components/common/Modal';
import DragDropUpload from '../components/files/DragDropUpload';
import CSVPreview from '../components/files/CSVPreview';
import { formatDate, formatFileSize, parseErrorMessage } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';

const FilesPage = () => {
  const { showSuccess, showError } = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await filesService.getFiles();
      setFiles(data.files || []);
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    try {
      await filesService.uploadFile(file, 'consumption');
      showSuccess(`Soubor ${file.name} byl úspěšně nahrán`);
      await loadFiles();
    } catch (err) {
      const errorMsg = parseErrorMessage(err);
      showError(errorMsg);
      throw err; // Let DragDropUpload handle the error display
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await filesService.deleteFile(fileId);
      setFiles(files.filter((f) => f.id !== fileId));
      setDeleteConfirm(null);
      showSuccess('Soubor byl úspěšně smazán');
    } catch (err) {
      const errorMsg = parseErrorMessage(err);
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  const handleDownload = async (file) => {
    try {
      const blob = await filesService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(parseErrorMessage(err));
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      (file.original_filename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.file_type || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || file.file_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <LoadingSpinner text="Načítání souborů..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Soubory</h1>
            <p className="text-gray-600 mt-1">Správa nahraných souborů pro kalkulace</p>
          </div>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
          >
            <Upload className="w-5 h-5" />
            <span>Nahrát soubor</span>
          </button>
        </div>
      </div>

      {/* Alert */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
          className="mb-6"
        />
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Hledat soubory..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none"
              >
                <option value="all">Všechny typy</option>
                <option value="csv">CSV</option>
                <option value="xls">XLS</option>
                <option value="xlsx">XLSX</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {files.length === 0 ? 'Zatím žádné soubory' : 'Žádné soubory neodpovídají filtru'}
          </h3>
          <p className="text-gray-600 mb-4">
            {files.length === 0
              ? 'Nahrajte svůj první soubor pro začátek kalkulací'
              : 'Zkuste změnit vyhledávací kritéria'}
          </p>
          {files.length === 0 && (
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
            >
              <Upload className="w-5 h-5" />
              <span>Nahrát soubor</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Název souboru
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Velikost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nahráno
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {file.original_filename}
                        </div>
                        {file.file_metadata?.columns && (
                          <div className="text-xs text-gray-500">
                            {file.file_metadata.columns.length} sloupců
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded uppercase">
                      {file.file_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {file.rows_count && (
                        <div>{file.rows_count.toLocaleString()} řádků</div>
                      )}
                      {file.date_from && file.date_to && (
                        <div className="text-xs text-gray-400">
                          {formatDate(file.date_from)} - {formatDate(file.date_to)}
                        </div>
                      )}
                      {!file.rows_count && !file.date_from && <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(file.file_size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(file.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {file.file_type === 'csv' && (
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Náhled"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(file)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Stáhnout"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(file)}
                        className="text-red-600 hover:text-red-900"
                        title="Smazat"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Nahrát nový soubor"
        size="lg"
      >
        <DragDropUpload 
          onUpload={handleUpload}
          accept=".csv,.xlsx,.xls"
          maxSize={100 * 1024 * 1024}
        />
      </Modal>

      {/* CSV Preview Modal */}
      {previewFile && (
        <CSVPreview 
          file={previewFile} 
          onClose={() => setPreviewFile(null)} 
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Potvrdit smazání"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Zrušit
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm.id)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Smazat
            </button>
          </>
        }
      >
        <p className="text-gray-700">
          Opravdu chcete smazat soubor <strong>{deleteConfirm?.original_filename}</strong>?
          Tato akce nelze vrátit zpět.
        </p>
      </Modal>
    </div>
  );
};

export default FilesPage;
