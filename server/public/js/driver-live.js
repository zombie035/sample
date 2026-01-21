// public/js/driver-live.js
let map, marker, watchId;

function initDriverMap(lat, lng) {
    map = L.map('driver-map').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    marker = L.marker([lat, lng]).addTo(map).bindPopup("You are here").openPopup();
}

function startTracking() {
    if (!navigator.geolocation) return alert("Geolocation not supported");

    document.getElementById('start-tracking').disabled = true;
    document.getElementById('tracking-status').innerText = "📡 Tracking Active";
    document.getElementById('tracking-status').className = "tracking-active";

    // Watch position provides real-time updates whenever the driver moves
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, speed } = position.coords;
            
            // 1. Update Map
            if (!map) {
                initDriverMap(latitude, longitude);
            } else {
                const newPos = [latitude, longitude];
                marker.setLatLng(newPos);
                map.panTo(newPos);
            }

            // 2. Send to Server
            fetch('/driver/update-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude,
                    longitude,
                    speed: speed || 0,
                    status: 'moving'
                })
            })
            .then(res => res.json())
            .catch(err => console.error("Update failed:", err));
        },
        (error) => console.error("Error watching position:", error),
        { enableHighAccuracy: true }
    );
}

document.getElementById('start-tracking').addEventListener('click', startTracking);
