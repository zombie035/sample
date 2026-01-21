const router = require('express').Router();
const studentController = require('../controllers/studentController');
const { isAuthenticated, isStudent, getStudentBus } = require('../middleware/authMiddleware');

// All student routes require authentication


router.get('/dashboard', studentController.dashboard);
router.get('/my-bus-location', studentController.getMyBusLocation);
router.get('/route-info', studentController.getRouteInfo); // Add this line

module.exports = router;