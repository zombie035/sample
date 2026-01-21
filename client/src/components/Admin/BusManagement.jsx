// client/src/components/Admin/BusManagement.jsx
import React, { useState, useEffect } from 'react';
import { busService } from '../../services/busService';
import { userService } from '../../services/userService';
import Modal from '../UI/Modal';
import BusForm from './BusForm';

const BusManagement = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [locationModal, setLocationModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [locationData, setLocationData] = useState({
    latitude: '',
    longitude: '',
    speed: 30,
    status: 'moving'
  });

  useEffect(() => {
    fetchBuses();
  }, [search, statusFilter]);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const busesData = await busService.getAllBuses();
      setBuses(busesData || []);
    } catch (error) {
      console.error('Error fetching buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBus = () => {
    setEditingBus(null);
    setShowModal(true);
  };

  const handleEditBus = (bus) => {
    setEditingBus(bus);
    setShowModal(true);
  };

  const handleDeleteBus = async (busId, busNumber) => {
    if (!window.confirm(`Are you sure you want to delete Bus ${busNumber}? All assigned students will be unassigned.`)) {
      return;
    }

    try {
      // In a real app, you would call busService.deleteBus(busId)
      // For now, we'll just remove from state
      setBuses(prev => prev.filter(b => b._id !== busId));
    } catch (error) {
      console.error('Error deleting bus:', error);
      alert('Failed to delete bus');
    }
  };

  const handleUpdateLocation = (bus) => {
    setSelectedBus(bus);
    setLocationData({
      latitude: bus.latitude || '',
      longitude: bus.longitude || '',
      speed: bus.speed || 30,
      status: bus.status || 'moving'
    });
    setLocationModal(true);
  };

  const handleSubmitLocation = async () => {
    if (!selectedBus) return;

    try {
      await busService.updateBusLocation(selectedBus._id, locationData);
      setLocationModal(false);
      fetchBuses(); // Refresh list
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Failed to update location');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'moving': return 'bg-green-100 text-green-800';
      case 'stopped': return 'bg-yellow-100 text-yellow-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = !search || 
      bus.busNumber?.toLowerCase().includes(search.toLowerCase()) ||
      bus.routeName?.toLowerCase().includes(search.toLowerCase()) ||
      bus.driverName?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bus Management</h1>
            <p className="text-gray-600 mt-2">
              Manage all buses in the tracking system
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleAddBus}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2"
            >
              <i className="fas fa-bus"></i>
              Add New Bus
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                placeholder="Search buses by number, route, or driver..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="moving">Moving</option>
              <option value="stopped">Stopped</option>
              <option value="delayed">Delayed</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Buses Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading buses...</p>
          </div>
        </div>
      ) : filteredBuses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 p-8">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <i className="fas fa-bus-slash text-3xl text-gray-400"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Buses Found</h3>
          <p className="text-gray-600 text-center">
            {search || statusFilter !== 'all' 
              ? 'No buses match your search criteria'
              : 'No buses in the system yet'}
          </p>
          {!search && statusFilter === 'all' && (
            <button
              onClick={handleAddBus}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              Add Your First Bus
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBuses.map((bus) => (
            <div key={bus._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
              {/* Bus Header */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Bus {bus.busNumber}</h3>
                    <p className="text-gray-600">{bus.routeName || 'No route specified'}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(bus.status)}`}>
                    {bus.status || 'Offline'}
                  </span>
                </div>
              </div>

              {/* Bus Details */}
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Vehicle ID</p>
                      <p className="font-semibold">{bus.busId || '---'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Capacity</p>
                      <p className="font-semibold">{bus.capacity || 40} seats</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Driver</p>
                    {bus.driverName ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <i className="fas fa-user"></i>
                        </div>
                        <div>
                          <p className="font-semibold">{bus.driverName}</p>
                          <p className="text-sm text-gray-500">{bus.driverId?.email || ''}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No driver assigned</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Assigned Students</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                          <i className="fas fa-user-graduate"></i>
                        </div>
                        <div>
                          <p className="font-semibold">{bus.students?.length || 0} students</p>
                        </div>
                      </div>
                      {bus.students?.length > 0 && (
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          View All
                        </button>
                      )}
                    </div>
                  </div>

                  {bus.latitude && bus.longitude && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Current Location</p>
                      <div className="flex items-center gap-2 text-gray-700">
                        <i className="fas fa-map-marker-alt text-red-500"></i>
                        <span>{bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Last Updated</p>
                    <p className="text-gray-700">
                      {bus.updatedAt ? new Date(bus.updatedAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleEditBus(bus)}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-edit"></i>
                    Edit
                  </button>
                  <button
                    onClick={() => handleUpdateLocation(bus)}
                    className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-map-marker-alt"></i>
                    Location
                  </button>
                  <button
                    onClick={() => window.open(`/admin/monitor?bus=${bus._id}`, '_blank')}
                    className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-map"></i>
                    Monitor
                  </button>
                  <button
                    onClick={() => handleDeleteBus(bus._id, bus.busNumber)}
                    className="px-4 py-2 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-trash"></i>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bus Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBus ? 'Edit Bus' : 'Add New Bus'}
      >
        <BusForm
          bus={editingBus}
          onSuccess={() => {
            setShowModal(false);
            fetchBuses();
          }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {/* Location Update Modal */}
      <Modal
        isOpen={locationModal}
        onClose={() => setLocationModal(false)}
        title="Update Bus Location"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude *
              </label>
              <input
                type="number"
                step="any"
                value={locationData.latitude}
                onChange={(e) => setLocationData(prev => ({ ...prev, latitude: e.target.value }))}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="12.9716"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude *
              </label>
              <input
                type="number"
                step="any"
                value={locationData.longitude}
                onChange={(e) => setLocationData(prev => ({ ...prev, longitude: e.target.value }))}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="77.5946"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speed (km/h)
              </label>
              <input
                type="number"
                value={locationData.speed}
                onChange={(e) => setLocationData(prev => ({ ...prev, speed: e.target.value }))}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={locationData.status}
                onChange={(e) => setLocationData(prev => ({ ...prev, status: e.target.value }))}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="moving">Moving</option>
                <option value="stopped">Stopped</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setLocationModal(false)}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitLocation}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
            >
              <i className="fas fa-save"></i>
              Update Location
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BusManagement;