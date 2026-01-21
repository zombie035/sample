// client/src/components/UI/Toast.jsx
import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: 'fa-check-circle',
          iconColor: 'text-green-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'fa-exclamation-circle',
          iconColor: 'text-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'fa-exclamation-triangle',
          iconColor: 'text-yellow-500'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'fa-info-circle',
          iconColor: 'text-blue-500'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={`fixed top-4 right-4 z-50 ${styles.bg} border ${styles.border} rounded-lg shadow-lg max-w-md transform transition-all duration-300 animate-slide-in`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${styles.iconColor}`}>
            <i className={`fas ${styles.icon} text-lg`}></i>
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${styles.text}`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      {duration > 0 && (
        <div className="h-1 w-full bg-current bg-opacity-20">
          <div 
            className="h-full bg-current animate-progress"
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;