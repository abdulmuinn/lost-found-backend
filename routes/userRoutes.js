const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// URL: GET /api/users/my-activity
router.get('/my-activity', protect, userController.getMyActivity);

module.exports = router;