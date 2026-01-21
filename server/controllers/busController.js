const Bus = require('../models/Bus');

exports.dashboard = async (req, res) => {
  try {
    // Get all buses to show on initial load
    const buses = await Bus.find().sort({ updatedAt: -1 });
    
    // Pass buses to the template
    res.render('student/dashboard', { 
      buses: buses 
    });
    
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).send("Error loading student dashboard");
  }
};

exports.getLocation = async (req, res) => {
  try {
    const buses = await Bus.find();
    
    const data = buses.map(bus => ({
      busId: bus._id,
      busNumber: bus.busNumber,
      routeName: bus.routeName,
      lat: bus.latitude,
      lng: bus.longitude,
      updatedAt: bus.updatedAt
    }));
    
    res.json(data);
  } catch (error) {
    console.error("Get location error:", error);
    res.status(500).json({ error: error.message });
  }
};