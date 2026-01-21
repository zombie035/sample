// client/src/components/Common/MapProvider.jsx
import React, { createContext, useContext, useState } from 'react';

const MapContext = createContext({});

export const useMap = () => useContext(MapContext);

export const MapProvider = ({ children }) => {
  const [mapInstance, setMapInstance] = useState(null);

  const flyTo = (lat, lng, zoom = 15) => {
    if (mapInstance && mapInstance.flyTo) {
      mapInstance.flyTo([lat, lng], zoom);
    }
  };

  const fitBounds = (latLngs) => {
    if (mapInstance && latLngs.length > 0 && mapInstance.fitBounds) {
      const L = window.L; // Assuming Leaflet is available globally
      if (L) {
        const bounds = L.latLngBounds(latLngs);
        mapInstance.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };

  const addMarker = (markerData) => {
    if (!mapInstance || !window.L) return null;
    
    const L = window.L;
    const marker = L.marker([markerData.lat, markerData.lng]);
    if (markerData.popup) {
      marker.bindPopup(markerData.popup);
    }
    marker.addTo(mapInstance);
    return marker;
  };

  const value = {
    mapInstance,
    setMapInstance,
    flyTo,
    fitBounds,
    addMarker
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};
