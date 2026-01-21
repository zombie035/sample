// server/controllers/driverController.js
const Bus = require('../models/Bus');
const User = require('../models/User');

// Get driver dashboard data
exports.dashboard = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    const user = await User.findById(req.session.userId);
    if (!user || user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Driver privileges required'
      });
    }
    
    const bus = await Bus.findOne({ driverId: user._id })
      .populate('students', 'name email studentId')
      .lean();
    
    res.json({
      success: true,
      driver: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      bus: bus || null
    });
    
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: 'Error loading dashboard'
    });
  }
};

// Handle live location updates
exports.updateLiveLocation = async (req, res) => {
  try {
    const { latitude, longitude, speed, status, accuracy, updateStatusOnly } = req.body;
    
    // Validate session
    if (!req.session?.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }
    
    // Get driver
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Get driver's bus
    const bus = await Bus.findOne({ driverId: user._id });
    if (!bus) {
      return res.status(404).json({ 
        success: false, 
        message: 'No bus assigned' 
      });
    }
    
    // Prepare update
    const updateData = {
      updatedAt: new Date()
    };
    
    if (!updateStatusOnly) {
      if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
      if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
      if (speed !== undefined) updateData.speed = parseFloat(speed);
      if (accuracy !== undefined) updateData.accuracy = parseFloat(accuracy);
    }
    
    if (status) {
      updateData.status = status;
    }
    
    // Update bus
    const updatedBus = await Bus.findByIdAndUpdate(
      bus._id,
      updateData,
      { new: true }
    ).populate('students');
    
    // Broadcast via WebSocket
    const io = req.app.get('io');
    
    // Send to bus room
    io.to(`bus-${bus._id}`).emit('bus-live-update', {
      busId: bus._id,
      busNumber: bus.busNumber,
      latitude: updateData.latitude,
      longitude: updateData.longitude,
      speed: updateData.speed,
      status: updateData.status,
      timestamp: updateData.updatedAt
    });
    
    // Update tracking count
    const studentCount = updatedBus.students?.length || 0;
    io.to(`bus-${bus._id}`).emit('tracking-count', {
      busId: bus._id,
      count: studentCount
    });
    
    res.json({
      success: true,
      message: 'Location updated',
      trackingCount: studentCount,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};