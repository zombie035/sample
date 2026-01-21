// Initialize map centered on India
const map = L.map('map').setView([20.5937, 78.9629], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markers = {};
let studentMarker = null;
let studentPosition = null;

// Get student's current location
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      studentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      // Add student marker
      studentMarker = L.marker([studentPosition.lat, studentPosition.lng])
        .addTo(map)
        .bindPopup("Your Location")
        .openPopup();
      
      // Center map on student
      map.setView([studentPosition.lat, studentPosition.lng], 13);
      
      // Fetch initial bus locations
      fetchBuses();
    },
    (error) => {
      console.error("Geolocation error:", error);
      alert("Unable to get your location. Please enable location services.");
      fetchBuses();
    }
  );
} else {
  alert("Geolocation is not supported by your browser");
  fetchBuses();
}

// Function to fetch bus locations
function fetchBuses() {
  fetch('/student/location')
    .then(res => res.json())
    .then(buses => {
      updateBusMarkers(buses);
    })
    .catch(err => console.error('Error fetching buses:', err));
}

// Function to update bus markers on map
function updateBusMarkers(buses) {
  buses.forEach(bus => {
    if (bus.lat && bus.lng) {
      if (!markers[bus.busNumber]) {
        // Create new marker
        markers[bus.busNumber] = L.marker([bus.lat, bus.lng])
          .addTo(map)
          .bindPopup(`
            <strong>Bus ${bus.busNumber}</strong><br>
            Route: ${bus.routeName || 'N/A'}<br>
            Last updated: ${new Date(bus.updatedAt).toLocaleTimeString()}
          `);
      } else {
        // Update existing marker position
        markers[bus.busNumber].setLatLng([bus.lat, bus.lng]);
      }
    }
  });
}

// Function to track a specific bus
window.trackBus = function(busNumber) {
  // Highlight the selected bus
  if (markers[busNumber]) {
    map.setView(markers[busNumber].getLatLng(), 15);
    markers[busNumber].openPopup();
    
    // If student location is available, show both
    if (studentPosition) {
      const bounds = L.latLngBounds([
        [studentPosition.lat, studentPosition.lng],
        markers[busNumber].getLatLng()
      ]);
      map.fitBounds(bounds);
    }
  }
  
  // Highlight in bus list
  document.querySelectorAll('.bus-card').forEach(card => {
    card.style.backgroundColor = '';
  });
  const selectedCard = document.querySelector(`.bus-card[data-bus-id="${busNumber}"]`);
  if (selectedCard) {
    selectedCard.style.backgroundColor = '#e6f7ff';
  }
};

// Set up WebSocket for real-time updates
const socket = io();

socket.on('busLocationUpdate', (bus) => {
  // Update the marker on map
  if (bus.lat && bus.lng) {
    if (!markers[bus.busNumber]) {
      markers[bus.busNumber] = L.marker([bus.lat, bus.lng])
        .addTo(map)
        .bindPopup(`
          <strong>Bus ${bus.busNumber}</strong><br>
          Route: ${bus.routeName || 'N/A'}
        `);
    } else {
      markers[bus.busNumber].setLatLng([bus.lat, bus.lng]);
    }
    
    // Update the bus list
    updateBusCard(bus);
  }
});

// Function to update bus card in the list
function updateBusCard(bus) {
  const card = document.querySelector(`.bus-card[data-bus-id="${bus.busNumber}"]`);
  if (card) {
    card.querySelector('.bus-info:nth-child(3)').textContent = 
      `Location: ${bus.lat.toFixed(4)}, ${bus.lng.toFixed(4)}`;
    card.querySelector('.last-update').textContent = 
      `Updated: ${new Date(bus.updatedAt).toLocaleTimeString()}`;
  }
}

// Refresh bus locations every 10 seconds
setInterval(fetchBuses, 10000);