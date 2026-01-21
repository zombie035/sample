// client/src/services/busService.js
import api from './api';

export const busService = {
  // Get all buses
  getAllBuses: async () => {
    const response = await api.get('/api/bus/location/all');
    return response.data;
  },

  // Get bus by ID
  getBus: async (busId) => {
    const response = await api.get(`/api/bus/location/${busId}`);
    return response.data;
  },

  // Get student's assigned bus
  getMyBus: async () => {
    const response = await api.get('/api/student/my-bus-location');
    return response.data;
  },

  // Get route info
  getRouteInfo: async (studentLat, studentLng, busLat, busLng) => {
    const response = await api.get('/api/student/route-info', {
      params: { studentLat, studentLng, busLat, busLng }
    });
    return response.data;
  },

  // Update bus location (driver)
  updateLocation: async (data) => {
    const response = await api.post('/api/driver/update-live-location', data);
    return response.data;
  },

  // Get live buses (admin)
  getLiveBuses: async () => {
    const response = await api.get('/api/admin/buses/live');
    return response.data;
  },

  // Update bus location (admin)
  updateBusLocation: async (busId, data) => {
    const response = await api.post(`/api/admin/buses/${busId}/location`, data);
    return response.data;
  }
};