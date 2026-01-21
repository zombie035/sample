// client/src/hooks/useGeolocation.js
import { useState, useEffect, useCallback } from 'react';

const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
    ...options
  };

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp
          };
          setLocation(locationData);
          resolve(locationData);
        },
        (error) => {
          const errorMsg = getErrorMessage(error);
          setError(errorMsg);
          reject(new Error(errorMsg));
        },
        defaultOptions
      );
    });
  }, []);

  const startTracking = useCallback((onLocationUpdate) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return null;
    }

    if (isTracking) {
      console.warn('Geolocation is already being tracked');
      return watchId;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp
        };
        setLocation(locationData);
        if (onLocationUpdate) {
          onLocationUpdate(locationData);
        }
      },
      (error) => {
        setError(getErrorMessage(error));
      },
      defaultOptions
    );

    setWatchId(id);
    setIsTracking(true);
    return id;
  }, [isTracking, watchId]);

  const stopTracking = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  }, [watchId]);

  const getErrorMessage = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access denied. Please enable location services.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information is unavailable.';
      case error.TIMEOUT:
        return 'Location request timed out.';
      default:
        return 'An unknown error occurred while getting location.';
    }
  };

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    location,
    error,
    isTracking,
    getCurrentPosition,
    startTracking,
    stopTracking,
    hasPermission: !!location || !error,
    isSupported: !!navigator.geolocation
  };
};

export default useGeolocation;