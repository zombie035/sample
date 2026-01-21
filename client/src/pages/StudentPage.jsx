// client/src/pages/StudentPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import Navbar from '../components/Layout/Navbar';
import MapComponent from '../components/Common/MapComponent';
import BusMarker from '../components/Common/BusMarker';
import useGeolocation from '../hooks/useGeolocation';
import { busService } from '../services/busService';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { socket, joinBusRoom } = useSocket();
  const { location, error: locationError, getCurrentPosition } = useGeolocation();
  
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch student's bus
  useEffect(() => {
    const fetchBus = async () => {
      try {
        setLoading(true);
        const busData = await busService.getMyBus();
        
        if (busData) {
          setBus(busData);
          
          // Join bus room for real-time updates
          if (busData._id) {
            joinBusRoom(busData._id);
          }
        }
      } catch (error) {
        console.error('Error fetching bus data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBus();
  }, [joinBusRoom]);

  // Get student location on mount
  useEffect(() => {
    getCurrentPosition().catch(console.error);
  }, []);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !bus?._id) return;

    const handleBusUpdate = (data) => {
      setBus(prev => ({
        ...prev,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status,
        updatedAt: data.timestamp
      }));
      setLastUpdate(new Date());
      
      // Recalculate ETA if student location is available
      if (location && data.latitude && data.longitude) {
        calculateETA(data.latitude, data.longitude);
      }
    };

    socket.on('bus-location-update', handleBusUpdate);
    socket.on('bus-live-update', handleBusUpdate);

    return () => {
      socket.off('bus-location-update', handleBusUpdate);
      socket.off('bus-live-update', handleBusUpdate);
    };
  }, [socket, bus?._id, location]);

  // Calculate ETA when locations change
  useEffect(() => {
    if (bus?.latitude && bus?.longitude && location) {
      calculateETA(bus.latitude, bus.longitude);
    }
  }, [bus, location]);

  // Calculate ETA and distance
  const calculateETA = async (busLat, busLng) => {
    if (!location) return;

    try {
      const routeInfo = await busService.getRouteInfo(
        location.latitude,
        location.longitude,
        busLat,
        busLng
      );

      if (routeInfo) {
        if (routeInfo.coordinates) {
          setRouteCoordinates(routeInfo.coordinates);
        }
        
        if (routeInfo.duration) {
          const minutes = Math.round(routeInfo.duration);
          setEta(minutes > 0 ? `${minutes} mins` : 'Arriving now');
        }
        
        if (routeInfo.distance) {
          setDistance(`${routeInfo.distance.toFixed(1)} km`);
        }
      }
    } catch (error) {
      // Fallback calculation using straight-line distance
      const straightLineDistance = calculateStraightDistance(
        location.latitude,
        location.longitude,
        busLat,
        busLng
      );
      
      const estimatedTime = Math.round((straightLineDistance / 30) * 60); // 30 km/h average
      setEta(estimatedTime > 0 ? `${estimatedTime} mins` : 'Arriving now');
      setDistance(`${straightLineDistance.toFixed(1)} km`);
    }
  };

  // Calculate straight-line distance (Haversine formula)
  const calculateStraightDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Map markers
  const mapMarkers = [
    ...(bus?.latitude && bus?.longitude ? [{
      position: { lat: bus.latitude, lng: bus.longitude },
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
          <strong>Bus ${bus.busNumber}</strong><br>
          Route: ${bus.routeName || 'N/A'}<br>
          Status: ${bus.status || 'Active'}<br>
          Driver: ${bus.driverName || 'N/A'}
        </div>
      `
    }] : []),
    ...(location ? [{
      position: { lat: location.latitude, lng: location.longitude },
      color: '#10b981',
      size: 35,
      icon: '👨‍🎓',
      popup: `
        <div style="padding: 10px;">
          <strong>Your Location</strong><br>
          ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
        </div>
      `
    }] : [])
  ];

  // Route data for map
  const mapRoutes = showRoute && routeCoordinates.length > 0 ? [{
    coordinates: routeCoordinates,
    color: '#6366f1',
    weight: 4,
    opacity: 0.7
  }] : bus?.latitude && bus?.longitude && location ? [{
    coordinates: [
      { lat: location.latitude, lng: location.longitude },
      { lat: bus.latitude, lng: bus.longitude }
    ],
    color: '#94a3b8',
    weight: 3,
    opacity: 0.5,
    dashed: true
  }] : [];

  // Center map between bus and student
  const mapCenter = bus?.latitude && bus?.longitude && location 
    ? [
        (bus.latitude + location.latitude) / 2,
        (bus.longitude + location.longitude) / 2
      ]
    : bus?.latitude && bus?.longitude
    ? [bus.latitude, bus.longitude]
    : location
    ? [location.latitude, location.longitude]
    : [20.5937, 78.9629];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bus information...</p>
        </div>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <i className="fas fa-bus-slash text-3xl text-gray-400"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Bus Assigned</h2>
            <p className="text-gray-600 mb-6">
              You don't have a bus assigned to you yet. Please contact the AIDS Department for assistance.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Track your bus in real-time
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-sm font-medium text-blue-800">
                  {bus.status?.toUpperCase() || 'TRACKING'}
                </span>
              </div>
              
              {lastUpdate && (
                <div className="text-sm text-gray-500">
                  Updated: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
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
                    Live Bus Tracking
                  </h2>
                  <button
                    onClick={() => setShowRoute(!showRoute)}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                      showRoute 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <i className="fas fa-route"></i>
                    {showRoute ? 'Hide Route' : 'Show Route'}
                  </button>
                </div>
              </div>
              
              <div className="h-[500px] relative">
                <MapComponent
                  center={mapCenter}
                  zoom={13}
                  markers={mapMarkers}
                  routes={mapRoutes}
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

            {/* Action Buttons */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => getCurrentPosition()}
                className="px-6 py-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all flex items-center justify-center gap-3"
              >
                <i className="fas fa-location-crosshairs text-blue-600"></i>
                <span className="font-medium text-blue-700">Refresh Location</span>
              </button>
              
              <button
                onClick={() => window.open(`https://www.google.com/maps/dir/${location?.latitude},${location?.longitude}/${bus?.latitude},${bus?.longitude}`, '_blank')}
                disabled={!location || !bus?.latitude}
                className="px-6 py-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 border border-green-200 hover:from-green-100 hover:to-green-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <i className="fas fa-directions text-green-600"></i>
                <span className="font-medium text-green-700">Get Directions</span>
              </button>
              
              <button
                onClick={() => navigator.clipboard.writeText(`Bus ${bus.busNumber} - Driver: ${bus.driverName} - ${bus.routeName}`)}
                className="px-6 py-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 hover:from-purple-100 hover:to-purple-200 transition-all flex items-center justify-center gap-3"
              >
                <i className="fas fa-copy text-purple-600"></i>
                <span className="font-medium text-purple-700">Copy Bus Info</span>
              </button>
            </div>
          </div>

          {/* Right Column - Info & Details */}
          <div className="space-y-6">
            {/* ETA Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg text-white overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                    <i className="fas fa-clock text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Estimated Arrival</h3>
                    <p className="text-blue-100 text-sm">Based on current location</p>
                  </div>
                </div>
                
                <div className="text-center py-6">
                  <div className="text-5xl font-bold mb-2">{eta || '--:--'}</div>
                  <p className="text-blue-100">{distance || 'Calculating...'}</p>
                </div>
              </div>
            </div>

            {/* Bus Details */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bus Details</h3>
                
                <BusMarker bus={bus} isActive={true} />
                
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Bus Number</p>
                      <p className="font-bold text-lg">{bus.busNumber}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Vehicle ID</p>
                      <p className="font-bold text-lg">{bus.busId || '---'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Route Name</p>
                    <p className="font-bold text-lg">{bus.routeName || 'Not specified'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Driver</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-lg">{bus.driverName || 'Unassigned'}</p>
                      {bus.driverId?.phone && (
                        <button
                          onClick={() => window.open(`tel:${bus.driverId.phone}`)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                        >
                          <i className="fas fa-phone mr-1"></i>
                          Call
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {bus.driverId?.email && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Driver Email</p>
                      <a 
                        href={`mailto:${bus.driverId.email}`}
                        className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2"
                      >
                        <i className="fas fa-envelope"></i>
                        {bus.driverId.email}
                      </a>
                    </div>
                  )}
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
                    onClick={() => alert('Issue reported to AIDS Department. Thank you!')}
                    className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg text-left flex items-center gap-3 transition-colors"
                  >
                    <i className="fas fa-flag text-red-600"></i>
                    <span className="font-medium text-red-700">Report Issue</span>
                  </button>
                  
                  <button 
                    onClick={() => navigator.share?.({
                      title: `Bus ${bus.busNumber} Tracking`,
                      text: `Track Bus ${bus.busNumber} on ${bus.routeName}. Current ETA: ${eta}`,
                      url: window.location.href
                    }).catch(console.error)}
                    className="w-full px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg text-left flex items-center gap-3 transition-colors"
                  >
                    <i className="fas fa-share-alt text-green-600"></i>
                    <span className="font-medium text-green-700">Share Tracking</span>
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

export default StudentDashboard;