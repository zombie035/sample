const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'driver', 'admin'], 
    default: 'student' 
  },
  studentId: { 
    type: String, 
    unique: true, 
    sparse: true
  },
  phone: String,
  busAssigned: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Bus' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);