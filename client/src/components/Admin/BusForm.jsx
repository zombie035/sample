// client/src/components/Admin/BusForm.jsx
import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';

const BusForm = ({ bus, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [formData, setFormData] = useState({
    busId: '',
    busNumber: '',
    routeName: '',
    capacity: 40,
    status: 'stopped',
    driverId: '',
    latitude: '',
    longitude: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (bus) {
      setFormData({
        busId: bus.busId || '',
        busNumber: bus.busNumber || '',
        routeName: bus.routeName || '',
        capacity: bus.capacity || 40,
        status: bus.status || 'stopped',
        driverId: bus.driverId?._id || bus.driverId || '',
        latitude: bus.latitude?.toString() || '',
        longitude: bus.longitude?.toString() || ''
      });
    }
    fetchAvailableDrivers();
  }, [bus]);

  const fetchAvailableDrivers = async () => {
    try {
      const response = await userService.getAvailableDrivers();
      if (response.success) {
        setDrivers(response.drivers || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.busId.trim()) newErrors.busId = 'Bus ID is required';
    if (!formData.busNumber.trim()) newErrors.busNumber = 'Bus number is required';
    if (formData.capacity && (formData.capacity < 1 || formData.capacity > 100)) {
      newErrors.capacity = 'Capacity must be between 1 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const busData = {
        busId: formData.busId,
        busNumber: formData.busNumber,
        routeName: formData.routeName,
        capacity: parseInt(formData.capacity),
        status: formData.status,
        driverId: formData.driverId || undefined
      };

      // Only include location if provided
      if (formData.latitude && formData.longitude) {
        busData.latitude = parseFloat(formData.latitude);
        busData.longitude = parseFloat(formData.longitude);
      }

      // In a real app, you would call busService.createBus or busService.updateBus
      console.log('Bus data:', busData);
      
      // Simulate API call
      setTimeout(() => {
        onSuccess();
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error saving bus:', error);
      setErrors({ submit: error.message || 'Failed to save bus' });
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <i className="fas fa-exclamation-circle"></i>
            <span>{errors.submit}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bus ID *
          </label>
          <input
            type="text"
            name="busId"
            value={formData.busId}
            onChange={handleChange}
            className={`block w-full px-4 py-3 border ${
              errors.busId ? 'border-red-300' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            placeholder="BUS_01"
          />
          {errors.busId && (
            <p className="mt-1 text-sm text-red-600">{errors.busId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bus Number *
          </label>
          <input
            type="text"
            name="busNumber"
            value={formData.busNumber}
            onChange={handleChange}
            className={`block w-full px-4 py-3 border ${
              errors.busNumber ? 'border-red-300' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            placeholder="01"
          />
          {errors.busNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.busNumber}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Route Name
        </label>
        <input
          type="text"
          name="routeName"
          value={formData.routeName}
          onChange={handleChange}
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Main Campus Route"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capacity
          </label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            min="1"
            max="100"
            className={`block w-full px-4 py-3 border ${
              errors.capacity ? 'border-red-300' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.capacity && (
            <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="moving">Moving</option>
            <option value="stopped">Stopped</option>
            <option value="delayed">Delayed</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assign Driver (Optional)
        </label>
        <select
          name="driverId"
          value={formData.driverId}
          onChange={handleChange}
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a driver (optional)</option>
          {drivers.map(driver => (
            <option key={driver._id} value={driver._id}>
              {driver.name} ({driver.email})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Initial Latitude
          </label>
          <input
            type="number"
            step="any"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="12.9716"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Initial Longitude
          </label>
          <input
            type="number"
            step="any"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="77.5946"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i>
              {bus ? 'Update Bus' : 'Create Bus'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default BusForm;