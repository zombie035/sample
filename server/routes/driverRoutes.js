// server/routes/driverRoutes.js
const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { isAuthenticated, isDriver } = require('../middleware/authMiddleware');

// Apply driver middleware to all routes
router.use(isAuthenticated);
router.use(isDriver);

// Routes
router.get('/dashboard', driverController.dashboard);
router.post('/update-live-location', driverController.updateLiveLocation);

module.exports = router;