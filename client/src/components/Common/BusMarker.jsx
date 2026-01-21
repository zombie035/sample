// client/src/components/Common/BusMarker.jsx
import React from 'react';

const BusMarker = ({ bus, onClick, isActive = false }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'moving': return '#10b981';
      case 'stopped': return '#f59e0b';
      case 'delayed': return '#ef4444';
      case 'offline': return '#94a3b8';
      default: return '#94a3b8';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'moving': return 'Moving';
      case 'stopped': return 'Stopped';
      case 'delayed': return 'Delayed';
      default: return 'Offline';
    }
  };

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200'} cursor-pointer hover:shadow-md transition-all`}
      onClick={() => onClick && onClick(bus)}
    >
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
        style={{ background: getStatusColor(bus.status) }}
      >
        <i className="fas fa-bus"></i>
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-gray-900">Bus {bus.busNumber}</h3>
            <p className="text-sm text-gray-600">{bus.routeName || 'No route specified'}</p>
          </div>
          <span 
            className="px-2 py-1 text-xs font-medium rounded-full text-white"
            style={{ background: getStatusColor(bus.status) }}
          >
            {getStatusText(bus.status)}
          </span>
        </div>
        
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <i className="fas fa-user text-gray-400"></i>
            <span className="text-gray-600">Driver:</span>
            <span className="font-medium">{bus.driverName || 'Unassigned'}</span>
          </div>
          <div className="flex items-center gap-1">
            <i className="fas fa-users text-gray-400"></i>
            <span className="text-gray-600">Students:</span>
            <span className="font-medium">{bus.students?.length || 0}</span>
          </div>
        </div>
        
        {bus.latitude && bus.longitude && (
          <div className="mt-2 text-xs text-gray-500">
            <i className="fas fa-map-marker-alt mr-1"></i>
            {bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusMarker;