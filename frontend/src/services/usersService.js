/**
 * Users API service (Admin only)
 */

import apiClient from './api';

export const usersService = {
  /**
   * Get all users (admin only)
   */
  async getUsers(params = {}) {
    const response = await apiClient.get('/users/', { params });
    return response.data;
  },

  /**
   * Get user by ID (admin only)
   */
  async getUser(userId) {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(data) {
    const response = await apiClient.put('/users/me', data);
    return response.data;
  },

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId) {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  /**
   * Toggle user active status (admin only)
   */
  async toggleUserActive(userId, isActive) {
    const response = await apiClient.patch(`/users/${userId}/toggle-active`);
    return response.data;
  },
};

export default usersService;
