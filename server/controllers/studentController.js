const Bus = require('../models/Bus');
const User = require('../models/User');
const routeCalculator = require('../utils/routeCalculator'); // Add this

exports.dashboard = async (req, res) => {
  try {
    // Populate the assigned bus and nested driver details
    const user = await User.findById(req.session.userId).populate({
      path: 'busAssigned',
      populate: { path: 'driverId', select: 'phone email name' } // Fetch driver phone
    });
    
    if (!user.busAssigned) {
      return res.render('student/dashboard', { 
        bus: null,
        student: user, // Pass student data for the sidebar
        message: 'No bus assigned to you yet. Please contact the AIDS department.'
      });
    }
    
    res.render('student/dashboard', { 
      bus: user.busAssigned,
      student: user // Ensure dynamic user info is passed
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading student dashboard");
  }
};



exports.getMyBusLocation = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate('busAssigned');
    
    if (!user.busAssigned) {
      return res.status(404).json({ 
        error: 'No bus assigned' 
      });
    }
    
    const bus = await Bus.findById(user.busAssigned._id);
    
    res.json({
      busId: bus.busId,
      busNumber: bus.busNumber,
      routeName: bus.routeName,
      driverName: bus.driverName,
      latitude: bus.latitude,
      longitude: bus.longitude,
      status: bus.status,
      updatedAt: bus.updatedAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// NEW: Get route information between student and bus
exports.getRouteInfo = async (req, res) => {
  try {
    const { studentLat, studentLng, busLat, busLng } = req.query;
    
    if (!studentLat || !studentLng || !busLat || !busLng) {
      return res.status(400).json({ error: 'Missing coordinates' });
    }
    
    const route = await routeCalculator.calculateRoute(
      { lat: parseFloat(studentLat), lng: parseFloat(studentLng) },
      { lat: parseFloat(busLat), lng: parseFloat(busLng) }
    );
    
    res.json(route);
    
  } catch (error) {
    console.error('Route info error:', error);
    res.status(500).json({ error: error.message });
  }
};