// client/src/services/auth.js
import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  checkAuth: async () => {
    const response = await api.get('/api/auth/check');
    return response.data;
  },

  createTestAccounts: async () => {
    const response = await api.post('/api/auth/create-test-accounts');
    return response.data;
  }
};