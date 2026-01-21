// client/src/components/UI/RecentActivity.jsx
import React from 'react';

const RecentActivity = ({ title, items, type, emptyMessage, onViewAll }) => {
  const getItemIcon = (item) => {
    switch (type) {
      case 'users':
        return (
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
            {item.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        );
      case 'buses':
        return (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white">
            <i className="fas fa-bus"></i>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <i className="fas fa-circle text-gray-400"></i>
          </div>
        );
    }
  };

  const getItemContent = (item) => {
    switch (type) {
      case 'users':
        return (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {item.email}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  item.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                  item.role === 'driver' ? 'bg-amber-100 text-amber-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {item.role}
                </span>
                {item.studentId && (
                  <span className="text-xs text-gray-500">
                    ID: {item.studentId}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{item.date}</p>
            </div>
          </>
        );
      case 'buses':
        return (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Bus {item.busNumber}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {item.routeName || 'No route specified'}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  item.status === 'moving' ? 'bg-green-100 text-green-800' :
                  item.status === 'stopped' ? 'bg-yellow-100 text-yellow-800' :
                  item.status === 'delayed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status || 'offline'}
                </span>
                <span className="text-xs text-gray-500">
                  {item.driverName || 'No driver'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{item.date}</p>
              {item.students?.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {item.students.length} students
                </p>
              )}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all →
            </button>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <i className="fas fa-inbox text-2xl text-gray-400"></i>
            </div>
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {getItemIcon(item)}
                {getItemContent(item)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;