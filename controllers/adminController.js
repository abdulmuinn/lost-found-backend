const db = require('../config/db');

// Mengambil semua klaim yang statusnya 'Menunggu Verifikasi'
exports.getPendingClaims = async (req, res) => {
    try {
        const sql = `
            SELECT 
                c.claim_id, c.detail AS detail_klaim, c.status AS status_klaim,
                u.nama AS nama_pengklaim, u.email AS email_pengklaim,
                b.nama_barang, b.desk_barang, b.gambar
            FROM barang_diklaim c
            JOIN User u ON c.user_id = u.user_id
            JOIN Barang b ON c.barang_id = b.barang_id
            WHERE c.status = 'Menunggu Verifikasi'
            ORDER BY c.created_at DESC
        `;
        const [claims] = await db.query(sql);
        res.json(claims);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

// Memverifikasi klaim (menyetujui atau menolak)
exports.verifyClaim = async (req, res) => {
    const { claim_id } = req.params;
    const { isApproved } = req.body; // Akan bernilai true atau false dari frontend

    const newClaimStatus = isApproved ? 'Disetujui' : 'Ditolak';
    const newItemStatus = isApproved ? 'Selesai' : 'Ditemukan'; // Jika ditolak, barang kembali berstatus 'Ditemukan'
    const newReportStatus = isApproved ? 'Telah Diambil' : 'Ditemukan';

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Dapatkan barang_id dari klaim
        const [claims] = await connection.query('SELECT barang_id FROM barang_diklaim WHERE claim_id = ?', [claim_id]);
        if (claims.length === 0) {
            throw new Error('Klaim tidak ditemukan');
        }
        const { barang_id } = claims[0];

        // 2. Update status di tabel barang_diklaim
        await connection.query('UPDATE barang_diklaim SET status = ? WHERE claim_id = ?', [newClaimStatus, claim_id]);

        // 3. Update status di tabel Barang
        await connection.query('UPDATE Barang SET status_barang = ? WHERE barang_id = ?', [newItemStatus, barang_id]);

        // 4. Update status di tabel barang_hilang
        await connection.query('UPDATE barang_hilang SET status = ? WHERE barang_id = ?', [newReportStatus, barang_id]);

        await connection.commit();
        res.json({ message: `Klaim berhasil ${newClaimStatus.toLowerCase()}` });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        connection.release();
    }
};

exports.addFoundItem = async (req, res) => {
    // Data diambil dari form admin
    const { nama_barang, desk_barang, kategori_id, lokasi_id, waktu_hilang, detail } = req.body;

    // Atur status secara eksplisit untuk barang temuan
    const status_barang = 'Ditemukan'; 
    const status_laporan = 'Ditemukan';
    const gambar = req.file ? req.file.path.replace(/\\/g, "/") : null;

    // Validasi
    if (!nama_barang || !kategori_id || !lokasi_id || !waktu_hilang) {
        return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Masukkan ke tabel `Barang` dengan status 'Ditemukan'
        const barangSql = 'INSERT INTO Barang (nama_barang, desk_barang, gambar, status_barang, kategori_id) VALUES (?, ?, ?, ?, ?)';
        const [barangResult] = await connection.query(barangSql, [nama_barang, desk_barang, gambar, status_barang, kategori_id]);
        const newBarangId = barangResult.insertId;

        // 2. Masukkan ke tabel `barang_hilang` dengan user_id NULL (karena admin yang input, bukan pemilik)
        const laporanSql = 'INSERT INTO barang_hilang (status, lokasi_id, waktu_hilang, detail, barang_id, user_id) VALUES (?, ?, ?, ?, ?, NULL)';
        await connection.query(laporanSql, [status_laporan, lokasi_id, waktu_hilang, detail, newBarangId]);

        await connection.commit();
        res.status(201).json({ message: 'Barang temuan berhasil ditambahkan' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat menambahkan barang' });
    } finally {
        connection.release();
    }
};

exports.markItemAsFound = async (req, res) => {
    const { id: barang_id } = req.params; // Ambil ID barang dari URL

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update status di tabel `Barang` menjadi 'Ditemukan'
        const barangSql = "UPDATE Barang SET status_barang = 'Ditemukan' WHERE barang_id = ?";
        const [barangResult] = await connection.query(barangSql, [barang_id]);

        if (barangResult.affectedRows === 0) {
            throw new Error('Barang tidak ditemukan untuk diupdate.');
        }

        // 2. Update status di tabel `barang_hilang` menjadi 'Ditemukan'
        const laporanSql = "UPDATE barang_hilang SET status = 'Ditemukan' WHERE barang_id = ?";
        await connection.query(laporanSql, [barang_id]);

        await connection.commit();
        res.json({ message: 'Barang berhasil ditandai sebagai ditemukan.' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    } finally {
        connection.release();
    }
};
