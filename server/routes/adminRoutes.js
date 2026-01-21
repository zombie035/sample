// routes/adminRoutes.js - UPDATED VERSION
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Apply admin middleware to all routes
router.use(isAuthenticated);
router.use(isAdmin);

// Dashboard
router.get('/dashboard', adminController.dashboard);

// User Management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
// In routes/adminRoutes.js - Add this route
router.post('/users', async (req, res) => {
  try {
    const result = await adminController.createUser(req, res);
    
    // If success, redirect
    if (result.success) {
      return res.redirect('/admin/users?success=User+created+successfully');
    }
    
    // If error, render form with data
    const users = await User.find().select('-password');
    res.render('admin/users', {
      title: 'User Management',
      user: req.session,
      users,
      currentRole: 'all',
      search: '',
      userData: result.formData, // Pass form data back
      error: result.message
    });
    
  } catch (error) {
    console.error('Create user route error:', error);
    res.redirect('/admin/users?error=' + encodeURIComponent(error.message));
  }
});

// Bus Management
router.get('/buses', adminController.getBuses);
router.post('/buses', adminController.createBus);
router.put('/buses/:id', adminController.updateBus);
router.delete('/buses/:id', adminController.deleteBus);

// Real-time Monitoring
router.get('/monitor', adminController.monitor);

// API endpoints
router.get('/api/users/:id', adminController.getUser);
router.get('/api/buses/:id', adminController.getBus);
router.post('/api/buses/:id/location', adminController.updateBusLocation);
router.get('/api/buses/live', adminController.getLiveBuses);
router.get('/api/drivers', adminController.getAvailableDrivers);
router.get('/api/buses', adminController.getAvailableBuses);
router.get('/api/analytics/usage', adminController.getAnalytics);
router.get('/api/export/:type', adminController.exportData);

// Bulk operations
router.post('/users/bulk-import', adminController.bulkImport);

module.exports = router;