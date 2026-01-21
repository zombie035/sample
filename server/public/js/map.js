const map = L.map("map").setView([12.9716, 77.5946], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

// Fetch bus location
fetch("/bus/location/BUS_01")
  .then(res => res.json())
  .then(bus => {
    const busMarker = L.marker([bus.latitude, bus.longitude])
      .addTo(map)
      .bindPopup("Bus Location");

    navigator.geolocation.getCurrentPosition(pos => {
      const studentLat = pos.coords.latitude;
      const studentLng = pos.coords.longitude;

      const studentMarker = L.marker([studentLat, studentLng])
        .addTo(map)
        .bindPopup("You");

      map.fitBounds([
        [bus.latitude, bus.longitude],
        [studentLat, studentLng]
      ]);

      calculateDistance(studentLat, studentLng, bus.latitude, bus.longitude);
    });
  });

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  document.getElementById("distance").innerText =
    `Bus is ${distance.toFixed(2)} km away`;
}