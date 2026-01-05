/**
 * Calculations API service
 */

import apiClient from './api';

export const calculationsService = {
  /**
   * Create new calculation
   */
  async createCalculation(data) {
    const response = await apiClient.post('/calculations/', data);
    return response.data;
  },

  /**
   * Get all calculations
   * @param {Object} params - Query parameters
   * @param {boolean} params.lightweight - If true, returns only basic info (faster)
   */
  async getCalculations(params = {}) {
    const response = await apiClient.get('/calculations/', { params });
    return response.data;
  },

  /**
   * Get calculation by ID
   */
  async getCalculation(calcId) {
    const response = await apiClient.get(`/calculations/${calcId}`);
    return response.data;
  },

  /**
   * Get calculation results
   */
  async getCalculationResults(calcId) {
    const response = await apiClient.get(`/calculations/${calcId}/results`);
    return response.data;
  },

  /**
   * Get calculation logs
   */
  async getCalculationLogs(calcId) {
    const response = await apiClient.get(`/calculations/${calcId}/logs`);
    return response.data;
  },

  /**
   * Cancel calculation
   */
  async cancelCalculation(calcId) {
    const response = await apiClient.post(`/calculations/${calcId}/cancel`);
    return response.data;
  },

  /**
   * Recalculate existing calculation with same parameters
   */
  async recalculate(calcId) {
    const response = await apiClient.post(`/calculations/${calcId}/recalculate`);
    return response.data;
  },

  /**
   * Delete calculation
   */
  async deleteCalculation(calcId) {
    const response = await apiClient.delete(`/calculations/${calcId}`);
    return response.data;
  },

  /**
   * Export results to CSV
   */
  async exportResults(calcId, format = 'csv') {
    const response = await apiClient.get(`/calculations/${calcId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Filter calculation results by date range
   */
  async filterByDateRange(calcId, dateFrom, dateTo) {
    const response = await apiClient.post(`/calculations/${calcId}/filter-by-date`, {
      date_from: dateFrom,
      date_to: dateTo,
    });
    return response.data;
  },
};

export default calculationsService;
