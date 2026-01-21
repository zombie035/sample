const axios = require('axios');
require('dotenv').config();

class RouteCalculator {
  constructor() {
    this.apiKey = process.env.OPENROUTE_API_KEY;
    this.baseUrl = 'https://api.openrouteservice.org/v2';
    
    if (!this.apiKey) {
      console.warn('⚠️ OpenRouteService API key not found. Using straight-line distance.');
    }
  }

  // Calculate road distance and route between two points
  async calculateRoute(start, end, profile = 'driving-car') {
    try {
      // Check if API key exists
      if (!this.apiKey) {
        console.log('No API key, using straight-line distance');
        return this.calculateStraightLineDistance(start, end);
      }

      console.log('Calculating road route from:', start, 'to:', end);
      
      const response = await axios.post(
        `${this.baseUrl}/directions/${profile}/geojson`,
        {
          coordinates: [
            [start.lng, start.lat],  // OpenRouteService uses [lon, lat]
            [end.lng, end.lat]
          ]
        },
        {
          headers: {
            'Authorization': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.features && response.data.features[0]) {
        const route = response.data.features[0];
        
        return {
          success: true,
          distance: route.properties.summary.distance / 1000, // Convert meters to km
          duration: route.properties.summary.duration / 60,   // Convert seconds to minutes
          geometry: route.geometry,  // GeoJSON line string for map
          coordinates: this.decodePolyline(route.geometry.coordinates),
          bbox: route.bbox
        };
      }
      
      throw new Error('No route found');
      
    } catch (error) {
      console.error('Route calculation error:', error.message);
      
      // Fallback to straight-line distance
      return {
        ...this.calculateStraightLineDistance(start, end),
        success: false,
        error: error.message
      };
    }
  }

  // Fallback: Calculate straight-line distance (Haversine formula)
  calculateStraightLineDistance(start, end) {
    const R = 6371; // Earth's radius in km
    
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLon = (end.lng - start.lng) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Estimate duration (assuming 30 km/h average speed)
    const duration = (distance / 30) * 60;
    
    return {
      success: true,
      distance: distance,
      duration: duration,
      geometry: null,
      coordinates: null,
      isStraightLine: true
    };
  }

  // Decode polyline coordinates for Leaflet
  decodePolyline(coordinates) {
    return coordinates.map(coord => ({
      lat: coord[1],  // Latitude
      lng: coord[0]   // Longitude
    }));
  }

  // Calculate ETA based on distance and average speed
  calculateETA(distanceKm, speedKmh = 30) {
    const hours = distanceKm / speedKmh;
    const minutes = Math.round(hours * 60);
    
    return {
      minutes: minutes,
      hours: hours.toFixed(1),
      distance: distanceKm.toFixed(2)
    };
  }
}

module.exports = new RouteCalculator();