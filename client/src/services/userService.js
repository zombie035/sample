// client/src/services/userService.js
import api from './api';

export const userService = {
  // Admin: Get all users
  getAllUsers: async (params = {}) => {
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  },

  // Admin: Get user by ID
  getUser: async (userId) => {
    const response = await api.get(`/api/admin/users/${userId}`);
    return response.data;
  },

  // Admin: Create user
  createUser: async (userData) => {
    const response = await api.post('/api/admin/users', userData);
    return response.data;
  },

  // Admin: Update user
  updateUser: async (userId, userData) => {
    const response = await api.put(`/api/admin/users/${userId}`, userData);
    return response.data;
  },

  // Admin: Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  // Admin: Get available drivers
  getAvailableDrivers: async () => {
    const response = await api.get('/api/admin/drivers');
    return response.data;
  },

  // Admin: Get available buses
  getAvailableBuses: async () => {
    const response = await api.get('/api/admin/buses');
    return response.data;
  },

  // Student: Get profile
  getStudentProfile: async () => {
    const response = await api.get('/api/student/profile');
    return response.data;
  }
};