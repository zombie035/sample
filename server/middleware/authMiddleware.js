// middleware/authMiddleware.js

// Check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  
  if (req.session.role !== 'admin') {
    return res.status(403).render('error', {
      message: 'Access Denied',
      error: 'Admin privileges required'
    });
  }
  
  next();
};

// Check if user is driver
exports.isDriver = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  
  if (req.session.role !== 'driver') {
    return res.status(403).render('error', {
      message: 'Access Denied',
      error: 'Driver privileges required'
    });
  }
  
  next();
};

// Check if user is student
exports.isStudent = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  
  if (req.session.role !== 'student') {
    return res.status(403).render('error', {
      message: 'Access Denied',
      error: 'Student privileges required'
    });
  }
  
  next();
};

// Get current user's bus assignment
exports.getStudentBus = async (req, res, next) => {
  try {
    if (req.session.role === 'student') {
      const User = require('../models/User');
      const user = await User.findById(req.session.userId).populate('busAssigned');
      if (user) {
        req.busAssigned = user.busAssigned;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};