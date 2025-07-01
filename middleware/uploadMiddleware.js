const multer = require('multer');
const path = require('path');

// Atur penyimpanan
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Buat nama file yang unik
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Cek tipe file
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Hanya gambar (jpeg, jpg, png) yang diizinkan!');
    }
}

// Inisialisasi upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 2000000 }, // Batas 2MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;
