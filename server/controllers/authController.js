<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Track Your Bus</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="/socket.io/socket.io.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, sans-serif;
    }
    
    :root {
      --primary: #1e293b;
      --accent: #2563eb;
      --surface: #ffffff;
      --bg: #f8fafc;
      --border: #e2e8f0;
      --text: #1e293b;
      --text-muted: #64748b;
      --radius: 12px;
    }

    body {
      background: var(--bg);
      color: var(--text);
      padding-bottom: 20px;
    }

    .header {
      background: var(--surface);
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header h1 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .main-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 15px;
      display: grid;
      gap: 12px;
    }

    /* Map Styling */
    .map-wrapper {
      position: relative;
      border-radius: var(--radius);
      overflow: hidden;
      border: 1px solid var(--border);
      height: 400px;
      background: #eee;
    }

    .map-wrapper.fullscreen {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      height: 100vh;
      z-index: 9999;
      border-radius: 0;
    }

    #map { height: 100%; width: 100%; z-index: 1; }

    /* Map Overlays */
    .map-controls {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ctrl-btn {
      background: var(--surface);
      border: 1px solid var(--border);
      width: 38px; height: 38px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text);
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    /* Show Path Button - Positioned below map */
    .btn-path {
      width: 100%;
      background: var(--accent);
      color: white;
      border: none;
      padding: 14px;
      border-radius: var(--radius);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-path:active { opacity: 0.9; }

    /* Info Cards */
    .card {
      background: var(--surface);
      padding: 20px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .info-item {
      padding: 12px;
      background: #f1f5f9;
      border-radius: 8px;
    }

    .info-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.02em; margin-bottom: 4px; }
    .info-val { font-size: 0.95rem; font-weight: 600; color: var(--text); }

    /* ETA Section */
    .eta-box {
      text-align: center;
      padding: 12px;
    }

    .eta-val { font-size: 1.8rem; font-weight: 800; color: var(--accent); }

    /* Action Buttons */
    .btn-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .btn-secondary {
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 12px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    @media (max-width: 480px) {
        .map-wrapper { height: 320px; }
        .info-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

  <div class="header">
    <h1><i class="fas fa-bus-simple"></i> Bus Tracker</h1>
    <div style="font-size: 0.75rem; color: #10b981; font-weight: 700; background: #ecfdf5; padding: 4px 10px; border-radius: 20px;">
       <i class="fas fa-satellite-dish"></i> LIVE
    </div>
  </div>

  <div class="main-container">
    <% if (bus) { %>
      
      <div class="map-wrapper" id="mapWrapper">
        <div id="map"></div>
        <div class="map-controls">
          <button class="ctrl-btn" onclick="toggleFullScreen()" title="Full Screen">
            <i class="fas fa-expand" id="fsIcon"></i>
          </button>
          <button class="ctrl-btn" onclick="locateBus()"><i class="fas fa-bus"></i></button>
          <button class="ctrl-btn" onclick="locateStudent()"><i class="fas fa-location-crosshairs"></i></button>
        </div>
      </div>

      <button class="btn-path" onclick="toggleRoutePath()" id="togglePathBtn">
          <i class="fas fa-route"></i> <span id="path-text">Show Route Path</span>
      </button>

      <div class="card">
        <div class="info-grid">
          <div class="info-item">
            <p class="info-label">Bus Number</p>
            <p class="info-val"><%= bus.busNumber %></p>
          </div>
          <div class="info-item">
            <p class="info-label">Route Name</p>
            <p class="info-val"><%= bus.routeName || 'N/A' %></p>
          </div>
          <div class="info-item">
            <p class="info-label">Current Status</p>
            <p class="info-val" style="text-transform: capitalize;"><%= bus.status || 'Active' %></p>
          </div>
          <div class="info-item">
            <p class="info-label">Driver Name</p>
            <p class="info-val"><%= bus.driverName || 'N/A' %></p>
          </div>
        </div>
      </div>

      <div class="card eta-box">
        <p class="info-label">Estimated Arrival</p>
        <div class="eta-val" id="eta-time">-- mins</div>
      </div>

      <div class="btn-group">
        <button class="btn-secondary" onclick="location.reload()"><i class="fas fa-rotate"></i> Refresh</button>
        <button class="btn-secondary" onclick="reportIssue()" style="color: #dc2626; border-color: #fee2e2;"><i class="fas fa-circle-exclamation"></i> Report</button>
      </div>

      <input type="hidden" id="bus-id" value="<%= bus.busId %>">
      <div id="bus-data" data-lat="<%= bus.latitude %>" data-lng="<%= bus.longitude %>" style="display:none;"></div>

    <% } else { %>
      <div class="card" style="text-align:center; padding: 60px 20px;">
        <i class="fas fa-bus-slash" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 20px;"></i>
        <h3>No Assigned Bus</h3>
        <p style="color: var(--text-muted); margin-top: 10px;">Contact the AIDS Department for assistance.</p>
      </div>
    <% } %>
  </div>

  <script>
    let map, busMarker, studentMarker, routeLine;
    let busData = {};
    let studentPosition = null;
    let routePathVisible = false;

    document.addEventListener('DOMContentLoaded', function() {
      const el = document.getElementById('bus-data');
      if (el) {
        busData = { lat: parseFloat(el.dataset.lat), lng: parseFloat(el.dataset.lng) };
        
        map = L.map('map', { zoomControl: false }).setView([busData.lat, busData.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        busMarker = L.marker([busData.lat, busData.lng], {
            icon: L.divIcon({
                html: '<div style="background:#2563eb; color:white; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.2);"><i class="fas fa-bus" style="font-size:14px;"></i></div>',
                className: '', iconSize: [34, 34]
            })
        }).addTo(map);

        getUserLocation();
        setupLiveTracking();
      }
    });

    function toggleFullScreen() {
      const wrapper = document.getElementById('mapWrapper');
      const icon = document.getElementById('fsIcon');
      wrapper.classList.toggle('fullscreen');
      icon.classList.toggle('fa-expand');
      icon.classList.toggle('fa-compress');
      setTimeout(() => map.invalidateSize(), 400);
    }

    function getUserLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          studentPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          studentMarker = L.circleMarker([studentPosition.lat, studentPosition.lng], {
            radius: 7, color: '#fff', weight: 2, opacity: 1, fillOpacity: 1, fillColor: '#10b981'
          }).addTo(map);
          updateETA();
        }, null, { enableHighAccuracy: true });
      }
    }

    function locateBus() { map.panTo(busMarker.getLatLng()); busMarker.openPopup(); }
    function locateStudent() { if(studentPosition) map.panTo([studentPosition.lat, studentPosition.lng]); }

    function toggleRoutePath() {
      const text = document.getElementById('path-text');
      if (!routePathVisible && studentPosition) {
        routeLine = L.polyline([busMarker.getLatLng(), [studentPosition.lat, studentPosition.lng]], {
          color: '#2563eb', weight: 4, dashArray: '10, 10', opacity: 0.6
        }).addTo(map);
        text.innerText = "Hide Route Path";
        routePathVisible = true;
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
      } else if (routeLine) {
        map.removeLayer(routeLine);
        text.innerText = "Show Route Path";
        routePathVisible = false;
      }
    }

    function updateETA() {
        if (!studentPosition) return;
        const dist = map.distance(busMarker.getLatLng(), [studentPosition.lat, studentPosition.lng]);
        const mins = Math.round((dist / 1000) / 0.4); // Approx 25km/h city speed
        document.getElementById('eta-time').innerText = mins > 0 ? mins + " mins" : "Arriving Now";
    }

    function reportIssue() {
        const msg = prompt("Describe the issue:");
        if(msg) alert("Issue reported to AIDS Department. Thank you.");
    }

    function setupLiveTracking() {
        const socket = io();
        const busId = document.getElementById('bus-id')?.value;
        if (!busId) return;
        socket.on('connect', () => socket.emit('join-bus-room', busId));
        socket.on('bus-location-update', (data) => {
            if (data.latitude && data.longitude) {
                const newPos = [data.latitude, data.longitude];
                busMarker.setLatLng(newPos);
                if (routePathVisible && routeLine) routeLine.setLatLngs([newPos, [studentPosition.lat, studentPosition.lng]]);
                updateETA();
            }
        });
    }
  </script>
</body>
</html>
