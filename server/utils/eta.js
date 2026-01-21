module.exports = function calculateETA(busLat, busLng, collegeLat, collegeLng) {
  const distance =
    Math.sqrt(
      Math.pow(busLat - collegeLat, 2) +
      Math.pow(busLng - collegeLng, 2)
    ) * 111;

  const speed = 30; // km/h
  return Math.round((distance / speed) * 60); // minutes
};