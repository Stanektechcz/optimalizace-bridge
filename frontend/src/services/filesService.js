/**
 * Files API service
 */

import apiClient from './api';

export const filesService = {
  /**
   * Upload file
   */
  async uploadFile(file, fileType, onUploadProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/files/upload?file_type=${fileType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });

    return response.data;
  },

  /**
   * Get all files
   */
  async getFiles(params = {}) {
    const response = await apiClient.get('/files/', { params });
    return response.data;
  },

  /**
   * Get file by ID
   */
  async getFile(fileId) {
    const response = await apiClient.get(`/files/${fileId}`);
    return response.data;
  },

  /**
   * Delete file
   */
  async deleteFile(fileId) {
    const response = await apiClient.delete(`/files/${fileId}`);
    return response.data;
  },

  /**
   * Download file
   */
  async downloadFile(fileId) {
    const response = await apiClient.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default filesService;
