const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware'); // Impor middleware auth
const upload = require('../middleware/uploadMiddleware'); // Impor middleware upload

// GET /api/items
router.get('/', itemController.getAllItems);

// POST /api/items/report
// Ini adalah rute yang dilindungi, hanya user terautentikasi yang bisa akses
// 'gambar' adalah nama field di form untuk file
router.post('/report', protect, upload.single('gambar'), itemController.reportLostItem);

// URL: GET /api/items/:id  (contoh: /api/items/1)
router.get('/:id', itemController.getSingleItem);

// URL: POST /api/items/:id/claim
router.post('/:id/claim', protect, itemController.claimItem);

module.exports = router;