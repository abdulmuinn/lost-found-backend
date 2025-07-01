const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// URL: GET /api/data/lokasi
router.get('/lokasi', dataController.getAllLokasi);

// URL: GET /api/data/kategori
router.get('/kategori', dataController.getAllKategori);

module.exports = router;
