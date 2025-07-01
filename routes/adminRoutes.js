const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// GET /api/admin/claims
router.get('/claims', protect, admin, adminController.getPendingClaims);

// PUT /api/admin/claims/:claim_id/verify
router.put('/claims/:claim_id/verify', protect, admin, adminController.verifyClaim);

// URL: POST /api/admin/items/add-found
router.post('/items/add-found', protect, admin, upload.single('gambar'), adminController.addFoundItem);

// URL: PUT /api/admin/items/:id/mark-found
router.put('/items/:id/mark-found', protect, admin, adminController.markItemAsFound);

module.exports = router;