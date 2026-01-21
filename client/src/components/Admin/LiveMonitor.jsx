// client/src/components/Admin/LiveMonitor.jsx
import React, { useState, useEffect, useCallback } from 'react';
import MapComponent from '../Common/MapComponent';
import { busService } from '../../services/busService';
import { useSocket } from '../../contexts/SocketContext';

const LiveMonitor = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showBusList, setShowBusList] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { socket } = useSocket();

  // Fetch initial bus data
  useEffect(() => {
    fetchBuses();
  }, []);

  // Setup socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleBusUpdate = (data) => {
      setBuses(prev => prev.map(bus => 
        bus._id === data.busId 
          ? { ...bus, ...data, updatedAt: new Date() }
          : bus
      ));
    };

    socket.on('bus-update', handleBusUpdate);
    socket.on('bus-live-update', handleBusUpdate);

    return () => {
      socket.off('bus-update', handleBusUpdate);
      socket.off('bus-live-update', handleBusUpdate);
    };
  }, [socket]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchBuses();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchBuses = async () => {
    try {
      const busesData = await busService.getLiveBuses();
      setBuses(busesData || []);
    } catch (error) {
      console.error('Error fetching buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchBuses();
  };

  const handleBusClick = (bus) => {
    setSelectedBus(bus);
  };

  const handleUpdateLocation = async (busId, locationData) => {
    try {
      await busService.updateBusLocation(busId, locationData);
      fetchBuses();
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'moving': return '#10b981';
      case 'stopped': return '#f59e0b';
      case 'delayed': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'moving': return 'fa-play';
      case 'stopped': return 'fa-pause';
      case 'delayed': return 'fa-exclamation-triangle';
      default: return 'fa-question-circle';
    }
  };

  const filteredBuses = buses.filter(bus => 
    statusFilter === 'all' || bus.status === statusFilter
  );

  // Prepare map markers
  const mapMarkers = filteredBuses
    .filter(bus => bus.latitude && bus.longitude)
    .map(bus => ({
      position: { lat: bus.latitude, lng: bus.longitude },
      iconHtml: `
        <div style="
          width: 50px;
          height: 50px;
          background: ${getStatusColor(bus.status)};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
        " onclick="event.stopPropagation();">
          <i class="fas fa-bus"></i>
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popup: `
        <div style="padding: 10px; min-width: 200px;">
          <strong>Bus ${bus.busNumber}</strong><br>
          Route: ${bus.routeName || 'N/A'}<br>
          Status: ${bus.status || 'Offline'}<br>
          Driver: ${bus.driverName || 'N/A'}<br>
          Students: ${bus.students?.length || 0}<br>
          <small>Updated: ${new Date(bus.updatedAt).toLocaleTimeString()}</small>
        </div>
      `,
      onClick: () => handleBusClick(bus)
    }));

  // Calculate center point for all buses
  const calculateMapCenter = () => {
    if (selectedBus?.latitude && selectedBus?.longitude) {
      return [selectedBus.latitude, selectedBus.longitude];
    }

    const validBuses = filteredBuses.filter(b => b.latitude && b.longitude);
    if (validBuses.length === 0) return [20.5937, 78.9629];

    const avgLat = validBuses.reduce((sum, bus) => sum + bus.latitude, 0) / validBuses.length;
    const avgLng = validBuses.reduce((sum, bus) => sum + bus.longitude, 0) / validBuses.length;
    
    return [avgLat, avgLng];
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Bus Monitor</h1>
            <p className="text-gray-600 mt-2">
              Real-time tracking of all active buses
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">
                {buses.filter(b => b.status === 'moving').length} Active
              </span>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
              Refresh
            </button>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Auto-refresh</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
        {/* Map Container */}
        <div className="flex-1 relative">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Live Tracking Map
                </h2>
                <div className="flex items-center gap-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Buses</option>
                    <option value="moving">Moving Only</option>
                    <option value="stopped">Stopped Only</option>
                    <option value="delayed">Delayed Only</option>
                  </select>
                  
                  <button
                    onClick={() => setShowBusList(!showBusList)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-list"></i>
                    {showBusList ? 'Hide List' : 'Show List'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="h-[calc(100%-80px)] relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading map data...</p>
                  </div>
                </div>
              ) : (
                <MapComponent
                  center={calculateMapCenter()}
                  zoom={selectedBus ? 15 : 13}
                  markers={mapMarkers}
                  interactive={true}
                  className="rounded-b-xl"
                />
              )}
              
              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-20 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Legend</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-700">Moving</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-sm text-gray-700">Stopped</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-700">Delayed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                    <span className="text-sm text-gray-700">Offline</span>
                  </div>
                </div>
              </div>
              
              {/* Refresh Timer */}
              {autoRefresh && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium z-20">
                  <i className="fas fa-clock mr-2"></i>
                  Auto-refresh: 10s
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bus List Sidebar */}
        {showBusList && (
          <div className="lg:w-96">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Bus List ({filteredBuses.length})
                </h2>
              </div>
              
              <div className="overflow-y-auto h-[calc(100%-80px)]">
                {filteredBuses.length === 0 ? (
                  <div className="p-8 text-center">
                    <i className="fas fa-bus-slash text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">No buses found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredBuses.map((bus) => (
                      <div
                        key={bus._id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedBus?._id === bus._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => handleBusClick(bus)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                style={{ background: getStatusColor(bus.status) }}
                              >
                                <i className={`fas ${getStatusIcon(bus.status)}`}></i>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  Bus {bus.busNumber}
                                </h3>
                                <p className="text-sm text-gray-600">{bus.routeName || 'No route'}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <i className="fas fa-user text-gray-400"></i>
                                <span>{bus.driverName || 'No driver'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <i className="fas fa-users text-gray-400"></i>
                                <span>{bus.students?.length || 0} students</span>
                              </div>
                            </div>
                            
                            {bus.latitude && bus.longitude && (
                              <div className="mt-2 text-xs text-gray-500">
                                <i className="fas fa-map-marker-alt mr-1"></i>
                                {bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <span
                              className="px-2 py-1 text-xs font-semibold rounded-full"
                              style={{
                                background: getStatusColor(bus.status) + '20',
                                color: getStatusColor(bus.status)
                              }}
                            >
                              {bus.status || 'Offline'}
                            </span>
                            <div className="mt-2 text-xs text-gray-500">
                              {bus.updatedAt ? new Date(bus.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Bus Details Panel */}
      {selectedBus && (
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Bus {selectedBus.busNumber} Details
                  </h2>
                  <p className="text-gray-600">Currently {selectedBus.status}</p>
                </div>
                <button
                  onClick={() => setSelectedBus(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                      Basic Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bus ID:</span>
                        <span className="font-medium">{selectedBus.busId || '---'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Route:</span>
                        <span className="font-medium">{selectedBus.routeName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capacity:</span>
                        <span className="font-medium">{selectedBus.capacity || 40} seats</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                      Driver Information
                    </h3>
                    {selectedBus.driverName ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <i className="fas fa-user"></i>
                          </div>
                          <div>
                            <p className="font-medium">{selectedBus.driverName}</p>
                            <p className="text-sm text-gray-500">{selectedBus.driverId?.email || ''}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No driver assigned</p>
                    )}
                  </div>
                </div>
                
                {/* Location Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                      Location & Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Status:</span>
                        <span className="font-medium capitalize">{selectedBus.status || 'offline'}</span>
                      </div>
                      {selectedBus.latitude && selectedBus.longitude ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Latitude:</span>
                            <span className="font-medium">{selectedBus.latitude.toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Longitude:</span>
                            <span className="font-medium">{selectedBus.longitude.toFixed(6)}</span>
                          </div>
                          {selectedBus.speed && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Speed:</span>
                              <span className="font-medium">{selectedBus.speed} km/h</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-500 italic">No location data</p>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">
                          {selectedBus.updatedAt ? new Date(selectedBus.updatedAt).toLocaleString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                      Quick Actions
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => window.open(`https://www.google.com/maps?q=${selectedBus.latitude},${selectedBus.longitude}`, '_blank')}
                        disabled={!selectedBus.latitude}
                        className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <i className="fas fa-external-link-alt"></i>
                        Open in Google Maps
                      </button>
                      
                      <button
                        onClick={() => window.open(`tel:${selectedBus.driverId?.phone}`)}
                        disabled={!selectedBus.driverId?.phone}
                        className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <i className="fas fa-phone"></i>
                        Call Driver
                      </button>
                      
                      <button
                        onClick={() => navigator.clipboard.writeText(`Bus ${selectedBus.busNumber} - ${selectedBus.routeName || ''}`)}
                        className="w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-copy"></i>
                        Copy Bus Info
                      </button>
                      
                      <button
                        onClick={() => window.open(`/admin/buses?edit=${selectedBus._id}`, '_blank')}
                        className="w-full px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-edit"></i>
                        Edit Bus Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMonitor;