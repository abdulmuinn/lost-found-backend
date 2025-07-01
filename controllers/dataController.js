const db = require('../config/db');

// Mengambil semua data dari tabel Lokasi
exports.getAllLokasi = async (req, res) => {
    try {
        const [lokasi] = await db.query('SELECT * FROM Lokasi ORDER BY nama_tempat');
        res.json(lokasi);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data lokasi' });
    }
};

// Mengambil semua data dari tabel Kategori
exports.getAllKategori = async (req, res) => {
    try {
        const [kategori] = await db.query('SELECT * FROM Kategori ORDER BY nama_kategori');
        res.json(kategori);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data kategori' });
    }
};
