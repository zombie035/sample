let lat = 9.918660;
let lng = 78.125192;

setInterval(async () => {
  lat += 0.0001;
  lng += 0.0001;

  await fetch('http://localhost:3000/driver/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng })
  });

  console.log("Fake GPS sent");
}, 3000);