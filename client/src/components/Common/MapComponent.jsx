// client/src/components/Common/MapComponent.jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMap } from './MapProvider';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const MapComponent = ({ 
  center = [20.5937, 78.9629], 
  zoom = 13,
  markers = [],
  routes = [],
  onMapClick,
  interactive = true,
  className = ''
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routesRef = useRef([]);
  const { setMapInstance } = useMap();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Create new map
    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: false,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Add click handler
    if (onMapClick) {
      map.on('click', onMapClick);
    }

    mapInstanceRef.current = map;
    setMapInstance(map);

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, interactive]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      if (!markerData.position || !markerData.position.lat || !markerData.position.lng) {
        return;
      }

      let icon;
      if (markerData.iconHtml) {
        icon = L.divIcon({
          html: markerData.iconHtml,
          className: markerData.className || 'custom-marker',
          iconSize: markerData.iconSize || [40, 40],
          iconAnchor: markerData.iconAnchor || [20, 40]
        });
      } else {
        const color = markerData.color || '#3498db';
        const iconHtml = `
          <div style="
            width: ${markerData.size || 40}px;
            height: ${markerData.size || 40}px;
            background: ${color};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: ${markerData.iconSize || 16}px;
          ">
            ${markerData.icon || '📍'}
          </div>
        `;
        icon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [markerData.size || 40, markerData.size || 40],
          iconAnchor: [(markerData.size || 40) / 2, (markerData.size || 40)]
        });
      }

      const marker = L.marker([
        markerData.position.lat,
        markerData.position.lng
      ], { icon }).addTo(mapInstanceRef.current);

      if (markerData.popup) {
        marker.bindPopup(markerData.popup);
      }

      if (markerData.onClick) {
        marker.on('click', () => markerData.onClick(markerData));
      }

      markersRef.current.push(marker);
    });

    // Fit bounds if markers exist
    if (markers.length > 0 && mapInstanceRef.current) {
      const latLngs = markers
        .filter(m => m.position?.lat && m.position?.lng)
        .map(m => [m.position.lat, m.position.lng]);
      
      if (latLngs.length > 0) {
        const bounds = L.latLngBounds(latLngs);
        mapInstanceRef.current.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: 15
        });
      }
    }
  }, [markers]);

  // Update routes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing routes
    routesRef.current.forEach(route => route.remove());
    routesRef.current = [];

    // Add new routes
    routes.forEach(routeData => {
      if (!routeData.coordinates || routeData.coordinates.length < 2) {
        return;
      }

      const polyline = L.polyline(
        routeData.coordinates.map(coord => [coord.lat, coord.lng]),
        {
          color: routeData.color || '#3498db',
          weight: routeData.weight || 4,
          opacity: routeData.opacity || 0.7,
          dashArray: routeData.dashed ? '10, 10' : undefined
        }
      ).addTo(mapInstanceRef.current);

      routesRef.current.push(polyline);
    });
  }, [routes]);

  // Update map center when props change
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
};

export default MapComponent;