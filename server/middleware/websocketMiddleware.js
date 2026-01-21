// middleware/websocketMiddleware.js

const rateLimit = require('express-rate-limit');

// Rate limiting for live updates (prevent abuse)
const liveUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many location updates, please try again later'
  }
});

// WebSocket connection manager
class WebSocketManager {
  constructor(io) {
    this.io = io;
    this.activeDrivers = new Map();
    this.activeStudents = new Map();
  }

  // Add driver to active list
  addDriver(driverId, socketId, busId) {
    this.activeDrivers.set(driverId, {
      socketId,
      busId,
      lastUpdate: new Date(),
      updateCount: 0
    });
    
    this.io.emit('driver-status', {
      driverId,
      status: 'online',
      timestamp: new Date()
    });
  }

  // Remove driver
  removeDriver(driverId) {
    this.activeDrivers.delete(driverId);
    
    this.io.emit('driver-status', {
      driverId,
      status: 'offline',
      timestamp: new Date()
    });
  }

  // Get active drivers
  getActiveDrivers() {
    return Array.from(this.activeDrivers.entries());
  }
}

module.exports = {
  liveUpdateLimiter,
  WebSocketManager
};