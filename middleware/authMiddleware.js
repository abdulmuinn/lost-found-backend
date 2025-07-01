const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Ambil token dari header
            token = req.headers.authorization.split(' ')[1];
            // Verifikasi token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Simpan data user dari token ke request
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Tidak terautentikasi, token gagal' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Tidak terautentikasi, tidak ada token' });
    }
};

const admin = (req, res, next) => {
    // Middleware 'protect' harus dijalankan terlebih dahulu,
    // sehingga kita sudah punya req.user
    if (req.user && req.user.role === 1) {
        next(); // Lanjutkan jika user adalah admin
    } else {
        res.status(401).json({ message: 'Tidak diizinkan, hanya untuk admin' });
    }
};

module.exports = { protect, admin }; // <-- Jangan lupa ekspor fungsi admin
