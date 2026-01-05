/**
 * Configurations API service
 */

import apiClient from './api';

export const configurationsService = {
  /**
   * Create new configuration
   */
  async createConfiguration(data) {
    const response = await apiClient.post('/configurations/', data);
    return response.data;
  },

  /**
   * Get all configurations
   */
  async getConfigurations() {
    const response = await apiClient.get('/configurations/');
    return response.data;
  },

  /**
   * Get configuration by ID
   */
  async getConfiguration(configId) {
    const response = await apiClient.get(`/configurations/${configId}`);
    return response.data;
  },

  /**
   * Get default configuration
   */
  async getDefaultConfiguration() {
    const response = await apiClient.get('/configurations/default');
    return response.data;
  },

  /**
   * Update configuration
   */
  async updateConfiguration(configId, data) {
    const response = await apiClient.put(`/configurations/${configId}`, data);
    return response.data;
  },

  /**
   * Delete configuration
   */
  async deleteConfiguration(configId) {
    const response = await apiClient.delete(`/configurations/${configId}`);
    return response.data;
  },

  /**
   * Set as default
   */
  async setAsDefault(configId) {
    const response = await apiClient.post(`/configurations/${configId}/set-default`);
    return response.data;
  },
};

export default configurationsService;
