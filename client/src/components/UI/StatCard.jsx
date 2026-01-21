// client/src/components/UI/StatCard.jsx
import React from 'react';

const StatCard = ({ title, value, icon, color, trend, trendUp = true, loading = false }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'from-blue-500 to-blue-600';
      case 'green':
        return 'from-green-500 to-emerald-600';
      case 'orange':
        return 'from-amber-500 to-orange-600';
      case 'purple':
        return 'from-purple-500 to-indigo-600';
      case 'red':
        return 'from-red-500 to-pink-600';
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  const getIconColor = () => {
    switch (color) {
      case 'blue': return 'text-blue-600';
      case 'green': return 'text-green-600';
      case 'orange': return 'text-amber-600';
      case 'purple': return 'text-purple-600';
      case 'red': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    return trendUp ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              {title}
            </p>
            {loading ? (
              <div className="h-10 mt-2">
                <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
            )}
            
            {trend && (
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${getTrendColor()}`}>
                  {trend}
                </span>
                <span className="text-sm text-gray-500 ml-2">from last month</span>
              </div>
            )}
          </div>
          
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${getColorClasses()} flex items-center justify-center`}>
            <i className={`${icon} text-2xl text-white`}></i>
          </div>
        </div>
        
        {loading ? (
          <div className="mt-4 h-2 bg-gray-200 rounded-full animate-pulse"></div>
        ) : (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">View details</span>
              <i className={`fas fa-arrow-right ${getIconColor()}`}></i>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;