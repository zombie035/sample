// client/src/pages/DriverPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import Navbar from '../components/Layout/Navbar';
import MapComponent from '../components/Common/MapComponent';
import useGeolocation from '../hooks/useGeolocation';
import { busService } from '../services/busService';
import { userService } from '../services/userService';

const DriverDashboard = () => {
  const { user } = useAuth();
  const { socket, connected, sendLocationUpdate } = useSocket();
  const { location, error: locationError, startTracking, stopTracking, isTracking } = useGeolocation();
  
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [toast, setToast] = useState(null);

  // Fetch driver data and bus info
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [driverData, busData] = await Promise.all([
          userService.getStudentProfile(),
          busService.getMyBus()
        ]);
        
        if (driverData.success) {
          setBus(busData);
          setStudentCount(busData?.students?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
        showToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleTrackingCount = (data) => {
      if (data.busId === bus?._id) {
        setStudentCount(data.count);
      }
    };

    socket.on('tracking-count', handleTrackingCount);

    return () => {
      socket.off('tracking-count', handleTrackingCount);
    };
  }, [socket, bus]);

  // Handle location updates
  const handleLocationUpdate = useCallback(async (locationData) => {
    if (!bus?._id) return;

    const speedKmh = locationData.speed ? (locationData.speed * 3.6).toFixed(1) : 0;
    setSpeed(speedKmh);
    setAccuracy(Math.round(locationData.accuracy));

    // Send to server
    try {
      const result = await busService.updateLocation({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        speed: speedKmh,
        accuracy: locationData.accuracy,
        status: 'moving'
      });

      if (result.success) {
        // Also send via socket for real-time updates
        sendLocationUpdate({
          busId: bus._id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          speed: speedKmh,
          status: 'moving',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }, [bus, sendLocationUpdate]);

  // Start live tracking
  const startLiveTracking = async () => {
    if (!bus) {
      showToast('No bus assigned to you', 'error');
      return;
    }

    if (locationError) {
      showToast('Please enable location services', 'error');
      return;
    }

    try {
      const watchId = startTracking(handleLocationUpdate);
      if (watchId) {
        setIsLive(true);
        showToast('Live tracking started', 'success');
      }
    } catch (error) {
      showToast('Failed to start tracking', 'error');
    }
  };

  // Stop live tracking
  const stopLiveTracking = () => {
    stopTracking();
    setIsLive(false);
    
    // Update bus status to stopped
    if (bus?._id) {
      busService.updateLocation({
        updateStatusOnly: true,
        status: 'stopped'
      });
    }
    
    showToast('Live tracking stopped', 'info');
  };

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Map markers
  const mapMarkers = location ? [
    {
      position: { lat: location.latitude, lng: location.longitude },
      iconHtml: `
        <div style="
          width: 50px;
          height: 50px;
          background: #2563eb;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
        ">
          <i class="fas fa-bus"></i>
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popup: `
        <div style="padding: 10px; min-width: 200px;">
          <strong>Your Location</strong><br>
          Bus: ${bus?.busNumber || 'N/A'}<br>
          Speed: ${speed} km/h<br>
          Accuracy: ${accuracy}m
        </div>
      `
    }
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' :
          toast.type === 'error' ? 'bg-red-500' :
          'bg-blue-500'
        } text-white transform transition-transform duration-300`}>
          <div className="flex items-center gap-3">
            <i className={`fas ${
              toast.type === 'success' ? 'fa-check-circle' :
              toast.type === 'error' ? 'fa-exclamation-circle' :
              'fa-info-circle'
            }`}></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, <span className="font-semibold">{user?.name}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                isLive ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
              }`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${isLive ? 'bg-purple-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm font-medium">
                  {isLive ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Live Location Tracking
                  </h2>
                  <div className="flex items-center gap-2">
                    {location && (
                      <span className="text-sm text-gray-600">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="h-[500px] relative">
                <MapComponent
                  center={location ? [location.latitude, location.longitude] : [20.5937, 78.9629]}
                  zoom={location ? 15 : 13}
                  markers={mapMarkers}
                  interactive={true}
                />
                
                {locationError && (
                  <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 z-10">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-exclamation-triangle text-red-500"></i>
                      <div>
                        <p className="text-red-700 font-medium">Location Error</p>
                        <p className="text-red-600 text-sm">{locationError}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={isLive ? stopLiveTracking : startLiveTracking}
                disabled={!bus || locationError}
                className={`px-6 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                  isLive 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <i className={`fas ${isLive ? 'fa-stop-circle' : 'fa-play-circle'}`}></i>
                {isLive ? 'Stop Live Tracking' : 'Start Live Tracking'}
              </button>
              
              <button
                onClick={() => location && window.open(`https://www.google.com/maps?q=${location.latitude},${location.longitude}`, '_blank')}
                disabled={!location}
                className="px-6 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-external-link-alt"></i>
                Open in Google Maps
              </button>
            </div>
          </div>

          {/* Right Column - Info & Stats */}
          <div className="space-y-6">
            {/* Bus Info Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl">
                    <i className="fas fa-bus"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Bus {bus?.busNumber || 'N/A'}
                    </h3>
                    <p className="text-gray-600">{bus?.routeName || 'No route assigned'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Vehicle ID</p>
                      <p className="font-semibold">{bus?.busId || '---'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Capacity</p>
                      <p className="font-semibold">{bus?.capacity || 40} seats</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Driver</p>
                    <p className="font-semibold">{bus?.driverName || user?.name}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Current Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        isLive ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-semibold">{isLive ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry Cards */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Telemetry</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                        <i className="fas fa-tachometer-alt"></i>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold">Speed</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {speed}
                          <span className="text-sm text-gray-600 ml-1">km/h</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white">
                        <i className="fas fa-satellite"></i>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold">GPS Accuracy</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {accuracy}
                          <span className="text-sm text-gray-600 ml-1">m</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white">
                        <i className="fas fa-user-graduate"></i>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold">Active Trackers</p>
                        <p className="text-2xl font-bold text-gray-900">{studentCount}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                        <i className="fas fa-clock"></i>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold">Uptime</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {isLive ? 'Live' : '--:--'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left flex items-center gap-3 transition-colors"
                  >
                    <i className="fas fa-sync-alt text-gray-600"></i>
                    <span className="font-medium">Refresh Dashboard</span>
                  </button>
                  
                  <button 
                    onClick={() => showToast('Report feature coming soon!', 'info')}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left flex items-center gap-3 transition-colors"
                  >
                    <i className="fas fa-flag text-red-600"></i>
                    <span className="font-medium">Report Issue</span>
                  </button>
                  
                  <button 
                    onClick={() => navigator.clipboard.writeText(`Bus ${bus?.busNumber} - ${bus?.routeName}`)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left flex items-center gap-3 transition-colors"
                  >
                    <i className="fas fa-copy text-blue-600"></i>
                    <span className="font-medium">Copy Bus Info</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;