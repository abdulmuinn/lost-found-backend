const db = require('../config/db');

// Mengambil semua aktivitas milik user yang sedang login
exports.getMyActivity = async (req, res) => {
    try {
        const userId = req.user.id; // Diambil dari token

        // 1. Ambil semua barang yang dilaporkan oleh user ini
        const myReportsSql = `
            SELECT b.nama_barang, b.status_barang, bh.status AS status_laporan, bh.created_at 
            FROM barang_hilang bh
            JOIN Barang b ON bh.barang_id = b.barang_id
            WHERE bh.user_id = ?
            ORDER BY bh.created_at DESC
        `;
        const [myReports] = await db.query(myReportsSql, [userId]);

        // 2. Ambil semua klaim yang diajukan oleh user ini
        const myClaimsSql = `
            SELECT c.status AS status_klaim, c.created_at, b.nama_barang
            FROM barang_diklaim c
            JOIN Barang b ON c.barang_id = b.barang_id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
        `;
        const [myClaims] = await db.query(myClaimsSql, [userId]);

        // 3. Kirim kedua data tersebut sebagai satu objek
        res.json({
            reports: myReports,
            claims: myClaims,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};
