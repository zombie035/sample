console.log('🚌 student-map.js loaded');

// Global variables
let map = null;
let busMarker = null;
let studentMarker = null;
let routeLine = null;
let studentPosition = null;
let busPosition = null;
let isRouteVisible = true; // Track route visibility

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded, initializing...');
  
  // Initialize map first
  initializeMap();
  
  // Initialize tracking after a short delay
  setTimeout(() => {
    initTracking();
  }, 500);
});

// Initialize the map
function initializeMap() {
  console.log('Initializing map...');
  
  // Get bus data from hidden div
  const busDataElement = document.getElementById('bus-data');
  if (!busDataElement) {
    console.error('No bus-data element found!');
    return;
  }
  
  console.log('Bus data found:', {
    lat: busDataElement.dataset.lat,
    lng: busDataElement.dataset.lng,
    busNumber: busDataElement.dataset.busNumber
  });
  
  // Set initial center (default to India if no bus data)
  let centerLat = 20.5937;
  let centerLng = 78.9629;
  
  if (busDataElement.dataset.lat && busDataElement.dataset.lng) {
    centerLat = parseFloat(busDataElement.dataset.lat);
    centerLng = parseFloat(busDataElement.dataset.lng);
  }
  
  console.log('Creating map at:', centerLat, centerLng);
  
  // Create the map
  map = L.map('map').setView([centerLat, centerLng], 13);
  
  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  console.log('✅ Map initialized successfully');
}

// Initialize tracking
async function initTracking() {
  console.log('Starting tracking...');
  
  // Get initial bus data
  const busDataElement = document.getElementById('bus-data');
  if (!busDataElement) {
    console.error('Cannot start tracking: No bus data');
    return;
  }
  
  const busData = {
    latitude: parseFloat(busDataElement.dataset.lat) || 0,
    longitude: parseFloat(busDataElement.dataset.lng) || 0,
    busNumber: busDataElement.dataset.busNumber,
    routeName: busDataElement.dataset.routeName,
    driverName: busDataElement.dataset.driverName,
    status: busDataElement.dataset.status
  };
  
  // Add bus marker if coordinates exist
  if (busData.latitude && busData.longitude) {
    addBusMarker(busData);
  }
  
  // Get student location
  getStudentLocation();
  
  // Initialize button state
  updateRouteButtonState();
  
  // Start socket.io connection
  setupSocketIO();
}

// Add bus marker
function addBusMarker(busData) {
  const busIcon = L.icon({
    iconUrl: '/images/bus-marker.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
  
  busPosition = {
    lat: busData.latitude,
    lng: busData.longitude
  };
  
  busMarker = L.marker([busPosition.lat, busPosition.lng], { icon: busIcon })
    .addTo(map)
    .bindPopup(`
      <strong>Bus ${busData.busNumber}</strong><br>
      Route: ${busData.routeName || 'N/A'}<br>
      Status: ${busData.status}
    `);
  
  console.log('Bus marker added at:', busPosition);
}

// Get student location
function getStudentLocation() {
  if (!navigator.geolocation) {
    console.warn('Geolocation not supported');
    return;
  }
  
  console.log('Requesting student location...');
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log('Student location received:', position.coords);
      studentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      // Add student marker
      addStudentMarker();
      
      // Update route if bus exists
      if (busPosition) {
        updateRouteAndETA();
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
    }
  );
}

// Add student marker
function addStudentMarker() {
  if (!studentPosition || !map) return;
  
  studentMarker = L.marker([studentPosition.lat, studentPosition.lng], {
    icon: L.divIcon({
      className: 'student-marker',
      html: '👨‍🎓',
      iconSize: [30, 30]
    })
  }).addTo(map).bindPopup("Your Location");
  
  console.log('Student marker added at:', studentPosition);
}

// Update route and ETA
async function updateRouteAndETA() {
  if (!studentPosition || !busPosition) {
    console.log('Cannot update route: Missing positions');
    return;
  }
  
  console.log('Updating route...');
  
  try {
    const routeData = await getRouteInfo(
      studentPosition.lat, studentPosition.lng,
      busPosition.lat, busPosition.lng
    );
    
    if (routeData && routeData.coordinates) {
      drawRoute(routeData.coordinates);
    } else {
      // Fallback: straight line
      drawStraightLine();
    }
    
    updateETA(routeData);
    updateRouteButtonState();
    
    // Fit map to show both markers
    const bounds = L.latLngBounds([
      [studentPosition.lat, studentPosition.lng],
      [busPosition.lat, busPosition.lng]
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });
    
  } catch (error) {
    console.error('Route update error:', error);
  }
}

// Get route info from server
async function getRouteInfo(studentLat, studentLng, busLat, busLng) {
  try {
    const response = await fetch(
      `/student/route-info?studentLat=${studentLat}&studentLng=${studentLng}&busLat=${busLat}&busLng=${busLng}`
    );
    return await response.json();
  } catch (error) {
    console.error('Error getting route info:', error);
    return null;
  }
}

// Draw route line
function drawRoute(routeCoordinates) {
  // Remove existing route
  if (routeLine) {
    map.removeLayer(routeLine);
  }
  
  if (routeCoordinates && routeCoordinates.length > 0) {
    // Store coordinates for later re-drawing
    window.currentRouteCoordinates = routeCoordinates;
    
    // Create polyline
    routeLine = L.polyline(routeCoordinates, {
      color: '#007bff',
      weight: 5,
      opacity: 0.7,
      lineJoin: 'round'
    });
    
    // Only add to map if route should be visible
    if (isRouteVisible) {
      routeLine.addTo(map);
    }
    
    console.log('Route drawn with', routeCoordinates.length, 'points');
  }
}

// Draw straight line as fallback
function drawStraightLine() {
  if (routeLine) {
    map.removeLayer(routeLine);
  }
  
  routeLine = L.polyline([
    [studentPosition.lat, studentPosition.lng],
    [busPosition.lat, busPosition.lng]
  ], {
    color: '#ff6b6b',
    weight: 3,
    opacity: 0.7,
    dashArray: '10, 10'
  });
  
  // Only add to map if route should be visible
  if (isRouteVisible) {
    routeLine.addTo(map);
  }
}

// Update ETA display
function updateETA(routeData) {
  const etaElement = document.getElementById('eta');
  if (!etaElement) return;
  
  if (routeData && routeData.success) {
    const eta = routeData.duration;
    const distance = routeData.distance;
    
    etaElement.innerHTML = `
      <h3>📊 Route Information</h3>
      <p><strong>Road Distance:</strong> ${distance.toFixed(2)} km</p>
      <p><strong>Estimated Travel Time:</strong> ${Math.round(eta)} minutes</p>
      ${routeData.isStraightLine ? '<p><em>Using straight-line distance (fallback)</em></p>' : ''}
    `;
  } else {
    etaElement.innerHTML = `
      <div style="color: #dc3545;">
        <h3>⚠️ Route Calculation Failed</h3>
        <p>Using straight-line distance</p>
      </div>
    `;
  }
}

// === PATH TOGGLE FUNCTIONS ===

// Toggle route visibility
function toggleRoutePath() {
  const toggleBtn = document.getElementById('togglePathBtn');
  
  if (!toggleBtn) {
    console.error('Toggle button not found');
    return;
  }
  
  if (isRouteVisible) {
    hideRoute();
    toggleBtn.textContent = 'Show Path';
    toggleBtn.style.background = '#6c757d';
  } else {
    showRoute();
    toggleBtn.textContent = 'Remove Path';
    toggleBtn.style.background = '#28a745';
  }
}

// Hide route
function hideRoute() {
  if (routeLine && map.hasLayer(routeLine)) {
    map.removeLayer(routeLine);
    isRouteVisible = false;
    console.log('Route hidden');
  }
}

// Show route
function showRoute() {
  if (routeLine && !map.hasLayer(routeLine)) {
    routeLine.addTo(map);
    isRouteVisible = true;
    console.log('Route shown');
  }
}

// Update button state
function updateRouteButtonState() {
  const toggleBtn = document.getElementById('togglePathBtn');
  if (!toggleBtn) return;
  
  if (!studentPosition || !busPosition) {
    toggleBtn.disabled = true;
    toggleBtn.textContent = 'Path Unavailable';
    toggleBtn.style.background = '#6c757d';
  } else {
    toggleBtn.disabled = false;
    if (isRouteVisible) {
      toggleBtn.textContent = 'Remove Path';
      toggleBtn.style.background = '#28a745';
    } else {
      toggleBtn.textContent = 'Show Path';
      toggleBtn.style.background = '#6c757d';
    }
  }
}

// Setup socket.io for real-time updates
function setupSocketIO() {
  const socket = io();
  
  socket.on('bus-update', (bus) => {
    console.log('Real-time bus update:', bus);
    
    if (busMarker && bus.latitude && bus.longitude) {
      // Update bus marker position
      busMarker.setLatLng([bus.latitude, bus.longitude]);
      
      // Update bus position
      busPosition = {
        lat: bus.latitude,
        lng: bus.longitude
      };
      
      // Update route if student location exists
      if (studentPosition) {
        updateRouteAndETA();
      }
    }
  });
}

// Make functions available globally
window.toggleRoutePath = toggleRoutePath;