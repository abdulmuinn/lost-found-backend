require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Impor rute yang sudah kita buat
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const dataRoutes = require('./routes/dataRoutes'); // <-- Tambahkan

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (Plugin Wajib)
app.use(cors());
app.use(express.json());

// Jadikan folder 'uploads' bisa diakses secara publik dari browser
// Contoh: http://localhost:5000/uploads/namafilegambar.jpg
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Menggunakan Rute
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/data', dataRoutes); // <-- Tambahkan

// Rute sederhana untuk pengetesan
app.get('/', (req, res) => {
    res.send('Selamat datang di Lost & Found API!');
});

// Menyalakan server
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
