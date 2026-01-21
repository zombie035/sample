// controllers/adminController.js
const User = require('../models/User');
const Bus = require('../models/Bus');
const bcrypt = require('bcryptjs');

// Admin Dashboard
exports.dashboard = async (req, res) => {
  try {
    // Get counts for dashboard
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalBuses = await Bus.countDocuments();
    
    // Get active buses (updated in last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeBuses = await Bus.countDocuments({
      updatedAt: { $gte: tenMinutesAgo }
    });
    
    // Get recent buses
    const recentBuses = await Bus.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('driverId', 'name email')
      .populate('students', 'name email');
    
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');
    
    // Render with user from session (not driver)
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.session,  // This is what should be used in the template
      stats: {
        totalUsers,
        totalStudents,
        totalDrivers,
        totalAdmins,
        totalBuses,
        activeBuses,
        inactiveBuses: totalBuses - activeBuses
      },
      recentBuses,
      recentUsers
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).render('error', {
      message: 'Error loading dashboard',
      error: error.message
    });
  }
};

// User Management
exports.getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    
    let filter = {};
    
    // Filter by role if specified
    if (role && role !== 'all') {
      filter.role = role;
    }
    
    // Search by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .select('-password'); // Exclude password
    
    res.render('admin/users', {
      title: 'User Management',
      user: req.session,
      users,
      currentRole: role || 'all',
      search: search || ''
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).render('error', {
      message: 'Error loading users',
      error: error.message
    });
  }
};

// Create new user
// Create new user - FIXED VERSION
// In adminController.js - Update createUser function
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, studentId, phone, busNumber } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required',
        formData: { name, email, role, studentId, phone, busNumber } // Return form data
      });
    }
    
    // ... rest of your createUser function ...
    
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user: ' + error.message,
      formData: req.body // Return form data on error
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, studentId, role, busNumber } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.role = role || user.role;
    
    if (role === 'student') {
      user.studentId = studentId || user.studentId;
    }
    
    // Handle bus assignment changes
    if (busNumber && role === 'student') {
      const bus = await Bus.findOne({ busNumber });
      if (!bus) {
        return res.status(400).json({
          success: false,
          message: `Bus ${busNumber} not found`
        });
      }
      
      // Remove from old bus
      if (user.busAssigned) {
        await Bus.findByIdAndUpdate(user.busAssigned, {
          $pull: { students: user._id }
        });
      }
      
      // Add to new bus
      user.busAssigned = bus._id;
      await Bus.findByIdAndUpdate(bus._id, {
        $addToSet: { students: user._id }
      });
    }
    
    // Save user changes
    await user.save();
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user: ' + error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Remove user from bus assignments
    if (user.role === 'student' && user.busAssigned) {
      await Bus.findByIdAndUpdate(user.busAssigned, {
        $pull: { students: user._id }
      });
    }
    
    if (user.role === 'driver') {
      // Remove driver from bus
      await Bus.updateMany(
        { driverId: user._id },
        { $unset: { driverId: '', driverName: '' } }
      );
    }
    
    // Delete user
    await User.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user: ' + error.message
    });
  }
};

// Bus Management
exports.getBuses = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { busNumber: { $regex: search, $options: 'i' } },
        { routeName: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const buses = await Bus.find(filter)
      .sort({ updatedAt: -1 })
      .populate('driverId', 'name email')
      .populate('students', 'name email');
    
    res.render('admin/buses', {
      title: 'Bus Management',
      user: req.session,
      buses,
      currentStatus: status || 'all',
      search: search || ''
    });
  } catch (error) {
    console.error('Get buses error:', error);
    res.status(500).render('error', {
      message: 'Error loading buses',
      error: error.message
    });
  }
};

// Create new bus
exports.createBus = async (req, res) => {
  try {
    const { busId, busNumber, routeName, capacity } = req.body;
    
    if (!busId || !busNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bus ID and Bus Number are required'
      });
    }
    
    // Check if bus already exists
    const existingBus = await Bus.findOne({
      $or: [{ busId }, { busNumber }]
    });
    
    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: 'Bus with this ID or number already exists'
      });
    }
    
    const bus = new Bus({
      busId,
      busNumber,
      routeName,
      capacity: capacity || 40,
      status: 'stopped',
      latitude: 12.9716, // Default location
      longitude: 77.5946
    });
    
    await bus.save();
    
    res.json({
      success: true,
      message: 'Bus created successfully',
      bus: {
        id: bus._id,
        busId: bus.busId,
        busNumber: bus.busNumber,
        routeName: bus.routeName
      }
    });
    
  } catch (error) {
    console.error('Create bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating bus: ' + error.message
    });
  }
};

// Update bus
exports.updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const { busNumber, routeName, capacity, status, driverId } = req.body;
    
    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    bus.busNumber = busNumber || bus.busNumber;
    bus.routeName = routeName || bus.routeName;
    bus.capacity = capacity || bus.capacity;
    bus.status = status || bus.status;
    
    if (driverId) {
      const driver = await User.findById(driverId);
      if (driver && driver.role === 'driver') {
        bus.driverId = driver._id;
        bus.driverName = driver.name;
      }
    }
    
    await bus.save();
    
    res.json({
      success: true,
      message: 'Bus updated successfully',
      bus: {
        id: bus._id,
        busNumber: bus.busNumber,
        routeName: bus.routeName
      }
    });
    
  } catch (error) {
    console.error('Update bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bus: ' + error.message
    });
  }
};

// Delete bus
exports.deleteBus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    // Unassign bus from all students
    await User.updateMany(
      { busAssigned: bus._id },
      { $unset: { busAssigned: '' } }
    );
    
    // Delete bus
    await Bus.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Bus deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting bus: ' + error.message
    });
  }
};

// Real-time Monitoring
exports.monitor = async (req, res) => {
  try {
    const buses = await Bus.find()
      .populate('driverId', 'name email')
      .populate('students', 'name');
    
    res.render('admin/monitor', {
      title: 'Real-time Monitoring',
      user: req.session,
      buses: JSON.stringify(buses)
    });
  } catch (error) {
    console.error('Monitor error:', error);
    res.status(500).render('error', {
      message: 'Error loading monitoring',
      error: error.message
    });
  }
};

// Get available drivers (for dropdown)
exports.getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' })
      .select('name email')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      drivers
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading drivers'
    });
  }
};

// Get available buses (for dropdown)
exports.getAvailableBuses = async (req, res) => {
  try {
    const buses = await Bus.find()
      .select('busNumber routeName')
      .sort({ busNumber: 1 });
    
    res.json({
      success: true,
      buses
    });
  } catch (error) {
    console.error('Get buses dropdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading buses'
    });
  }
};

// Bulk import users (simple version)
exports.bulkImport = async (req, res) => {
  try {
    const { users } = req.body; // Array of user objects
    
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users provided'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const userData of users) {
      try {
        // Create user
        const user = new User({
          ...userData,
          password: await bcrypt.hash(userData.password || 'password123', 10)
        });
        
        await user.save();
        results.push({
          email: user.email,
          name: user.name,
          role: user.role,
          status: 'success'
        });
      } catch (error) {
        errors.push({
          email: userData.email,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Imported ${results.length} users successfully`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during bulk import: ' + error.message
    });
  }
};

// API: Get single user
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
};

// API: Get single bus
exports.getBus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const bus = await Bus.findById(id)
      .populate('driverId', 'name email')
      .populate('students', 'name email');
    
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    res.json({
      success: true,
      bus
    });
  } catch (error) {
    console.error('Get bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bus'
    });
  }
};

// API: Update bus location
exports.updateBusLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, speed, status } = req.body;
    
    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    bus.latitude = parseFloat(latitude);
    bus.longitude = parseFloat(longitude);
    bus.speed = speed || 0;
    bus.status = status || 'moving';
    bus.updatedAt = new Date();
    
    await bus.save();
    
    // Broadcast to all connected clients
    const io = req.app.get('io');
    io.emit('bus-update', bus);
    
    res.json({
      success: true,
      message: 'Bus location updated',
      bus
    });
  } catch (error) {
    console.error('Update bus location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bus location'
    });
  }
};

// API: Get live bus data
exports.getLiveBuses = async (req, res) => {
  try {
    const buses = await Bus.find()
      .populate('driverId', 'name email')
      .populate('students', 'name email');
    
    res.json(buses);
  } catch (error) {
    console.error('Get live buses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live bus data'
    });
  }
};

// API: Get analytics data
exports.getAnalytics = async (req, res) => {
  try {
    // Last 7 days data
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // User registration stats
    const userStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Bus update stats
    const busStats = await Bus.aggregate([
      {
        $match: {
          updatedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      success: true,
      userStats,
      busStats,
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
};

// API: Export data
exports.exportData = async (req, res) => {
  try {
    const { type } = req.params;
    const { format } = req.query;
    
    if (type === 'users') {
      const users = await User.find().select('-password');
      
      if (format === 'csv') {
        // Convert to CSV
        const csv = users.map(user => 
          `${user.name},${user.email},${user.role},${user.studentId || ''},${user.phone || ''},${user.createdAt}`
        ).join('\n');
        
        res.header('Content-Type', 'text/csv');
        res.attachment('users.csv');
        return res.send('Name,Email,Role,Student ID,Phone,Created At\n' + csv);
      } else {
        res.json({
          success: true,
          users
        });
      }
    } else if (type === 'buses') {
      const buses = await Bus.find()
        .populate('driverId', 'name email')
        .populate('students', 'name email');
      
      if (format === 'csv') {
        // Convert to CSV
        const csv = buses.map(bus => 
          `${bus.busNumber},${bus.busId},${bus.routeName || ''},${bus.driverName || ''},${bus.status},${bus.latitude || ''},${bus.longitude || ''},${bus.updatedAt}`
        ).join('\n');
        
        res.header('Content-Type', 'text/csv');
        res.attachment('buses.csv');
        return res.send('Bus Number,Bus ID,Route,Driver,Status,Latitude,Longitude,Last Updated\n' + csv);
      } else {
        res.json({
          success: true,
          buses
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid export type'
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting data'
    });
  }
};