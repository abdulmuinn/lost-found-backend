const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');

exports.register = async (req, res) => {
    const { nama, email, no_telp, password, nik } = req.body;

    // Validasi input sederhana
    if (!nama || !email || !password) {
        return res.status(400).json({ message: 'Nama, email, dan password harus diisi' });
    }

    try {
        // 1. Cek dulu apakah email sudah ada di database
        const [userExists] = await db.query('SELECT email FROM User WHERE email = ?', [email]);
        if (userExists.length > 0) {
            return res.status(409).json({ message: 'Email sudah terdaftar' });
        }

        // 2. Enkripsi (acak) password sebelum disimpan
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Simpan data user baru ke database
        const sql = 'INSERT INTO User (nama, email, no_telp, password, nik, id_role) VALUES (?, ?, ?, ?, ?, ?)';
        const id_role = 2; // Default role adalah User
        await db.query(sql, [nama, email, no_telp, hashedPassword, nik, id_role]);

        res.status(201).json({ message: 'Registrasi berhasil. Silakan login.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email dan password harus diisi' });
    }

    try {
        // 1. Cari user berdasarkan email
        const [users] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email atau password salah' });
        }

        const user = users[0];
        // 2. Bandingkan password yang dikirim dengan yang ada di database (sudah di-acak)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email atau password salah' });
        }

        // 3. Jika cocok, buat "tiket masuk" (token) untuk user
        const payload = {
            id: user.user_id,
            nama: user.nama,
            role: user.id_role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        // 4. Kirim balasan berisi token dan data user
        res.json({
            message: 'Login berhasil',
            token: token,
            user: {
                user_id: user.user_id,
                nama: user.nama,
                email: user.email,
                role_id: user.id_role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};