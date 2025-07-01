const db = require('../config/db');

exports.getAllItems = async (req, res) => {
    try {
        const { status, searchTerm, category } = req.query;

        let baseSql = `
            SELECT 
                b.barang_id, b.nama_barang, b.desk_barang, b.gambar, 
                b.status_barang, k.nama_kategori, l.nama_tempat, l.lantai,
                bh.waktu_hilang, bh.created_at
            FROM Barang b
            JOIN Kategori k ON b.kategori_id = k.kategori_id
            LEFT JOIN barang_hilang bh ON b.barang_id = bh.barang_id
            LEFT JOIN Lokasi l ON bh.lokasi_id = l.lokasi_id
        `;

        const whereClauses = [];
        const queryParams = [];

        // 1. Filter berdasarkan status (wajib ada)
        if (status) {
            whereClauses.push("b.status_barang = ?");
            queryParams.push(status);
        } else {
            // Jika tidak ada status, kirim array kosong untuk mencegah menampilkan semua barang
            return res.json([]);
        }

        // 2. Filter berdasarkan searchTerm
        if (searchTerm) {
            whereClauses.push("(b.nama_barang LIKE ? OR b.desk_barang LIKE ?)");
            queryParams.push(`%${searchTerm}%`);
            queryParams.push(`%${searchTerm}%`);
        }

        // 3. Filter berdasarkan kategori
        if (category) {
            whereClauses.push("k.nama_kategori = ?");
            queryParams.push(category);
        }

        // Gabungkan semua kondisi WHERE
        if (whereClauses.length > 0) {
            baseSql += " WHERE " + whereClauses.join(" AND ");
        }

        baseSql += " ORDER BY bh.created_at DESC";

        const [items] = await db.query(baseSql, queryParams);
        res.json(items);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

exports.reportLostItem = async (req, res) => {
    // Data diambil dari form dan dari middleware 'protect'
    const { nama_barang, desk_barang, kategori_id, lokasi_id, waktu_hilang, detail } = req.body;
    const user_id = req.user.id; // Diambil dari token
    const status_barang = 'Hilang';
    const status_laporan = 'Dilaporkan Hilang';
    const gambar = req.file ? req.file.path.replace(/\\/g, "/") : null; // Path gambar jika ada & normalisasi path

    // Validasi
    if (!nama_barang || !kategori_id || !lokasi_id) {
        return res.status(400).json({ message: 'Field wajib harus diisi' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Masukkan ke tabel `Barang`
        const barangSql = 'INSERT INTO Barang (nama_barang, desk_barang, gambar, status_barang, kategori_id) VALUES (?, ?, ?, ?, ?)';
        const [barangResult] = await connection.query(barangSql, [nama_barang, desk_barang, gambar, status_barang, kategori_id]);
        const newBarangId = barangResult.insertId;

        // 2. Masukkan ke tabel `barang_hilang`
        const laporanSql = 'INSERT INTO barang_hilang (status, lokasi_id, waktu_hilang, detail, barang_id, user_id) VALUES (?, ?, ?, ?, ?, ?)';
        await connection.query(laporanSql, [status_laporan, lokasi_id, waktu_hilang, detail, newBarangId, user_id]);

        await connection.commit();
        res.status(201).json({ message: 'Laporan berhasil dibuat' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        connection.release();
    }
};

exports.getSingleItem = async (req, res) => {
    try {
        const sql = `
            SELECT 
                b.barang_id, b.nama_barang, b.desk_barang, b.gambar, 
                b.status_barang, k.nama_kategori, l.nama_tempat, l.lantai,
                bh.waktu_hilang, bh.detail AS detail_laporan
            FROM Barang b
            JOIN Kategori k ON b.kategori_id = k.kategori_id
            LEFT JOIN barang_hilang bh ON b.barang_id = bh.barang_id
            LEFT JOIN Lokasi l ON bh.lokasi_id = l.lokasi_id
            WHERE b.barang_id = ?
        `;
        const [items] = await db.query(sql, [req.params.id]);

        if (items.length === 0) {
            return res.status(404).json({ message: 'Barang tidak ditemukan' });
        }

        res.json(items[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

exports.claimItem = async (req, res) => {
    const { detail_klaim } = req.body; // Bukti kepemilikan dari user
    const barang_id = req.params.id;
    const user_id = req.user.id; // Diambil dari token
    const status_klaim = 'Menunggu Verifikasi';

    if (!detail_klaim) {
        return res.status(400).json({ message: 'Detail klaim harus diisi sebagai bukti.' });
    }

    try {
        // Masukkan data klaim ke tabel barang_diklaim
        const sql = 'INSERT INTO barang_diklaim (detail, status, barang_id, user_id) VALUES (?, ?, ?, ?)';
        await db.query(sql, [detail_klaim, status_klaim, barang_id, user_id]);

        // Update status di tabel utama barang_hilang menjadi 'Proses Klaim'
        const updateSql = "UPDATE barang_hilang SET status = 'Proses Klaim' WHERE barang_id = ?";
        await db.query(updateSql, [barang_id]);

        res.status(200).json({ message: 'Klaim berhasil diajukan dan sedang menunggu verifikasi admin.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};
