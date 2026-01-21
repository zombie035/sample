// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bus = require('../models/Bus');
const bcrypt = require('bcryptjs');

// Login - API endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt for:', email);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Set session
    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.name = user.name;
    req.session.email = user.email;
    req.session.busAssigned = user.busAssigned;
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        phone: user.phone,
        busAssigned: user.busAssigned
      }
    });
    
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred. Please try again.'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Check authentication status
router.get('/check', (req, res) => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        name: req.session.name,
        email: req.session.email,
        role: req.session.role
      }
    });
  } else {
    res.json({
      authenticated: false
    });
  }
});

// Create test accounts (for development only)
router.post('/create-test-accounts', async (req, res) => {
  try {
    console.log('Creating test accounts...');
    
    // 1. Create a driver
    const driver = await User.create({
      name: 'John Driver',
      email: 'driver@college.edu',
      password: await bcrypt.hash('driver123', 10),
      role: 'driver'
    });
    
    // 2. Create a bus and assign to driver
    const bus = await Bus.create({
      busId: 'BUS_01',
      busNumber: '01',
      routeName: 'Main Campus Route',
      driverName: driver.name,
      driverId: driver._id,
      latitude: 12.9716,
      longitude: 77.5946,
      status: 'moving',
      capacity: 40
    });
    
    // 3. Create a test student
    const student = await User.create({
      name: 'Test Student',
      email: 'student@college.edu',
      password: await bcrypt.hash('student123', 10),
      studentId: 'STU001',
      phone: '1234567890',
      role: 'student',
      busAssigned: bus._id
    });
    
    // Add student to bus
    bus.students.push(student._id);
    await bus.save();
    
    res.json({
      success: true,
      accounts: {
        driver: {
          email: 'driver@college.edu',
          password: 'driver123'
        },
        student: {
          email: 'student@college.edu',
          password: 'student123'
        }
      }
    });
    
  } catch (error) {
    console.error('Creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;