const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busId: { 
    type: String, 
    unique: true, 
    required: true 
  },
  busNumber: { 
    type: String, 
    required: true 
  },
  routeName: String,
  driverName: String,
  driverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  capacity: Number,
  currentPassengers: { type: Number, default: 0 },
  latitude: Number,
  longitude: Number,
  speed: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['moving', 'stopped', 'delayed', 'offline'],
    default: 'moving' 
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bus', busSchema);