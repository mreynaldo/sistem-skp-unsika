const express = require('express');
const authRoutes = require('./routes/authRoute');
const userRoutes = require('./routes/userRoute');
const skpRoutes = require('./routes/skpRoute');
const submissionRoutes = require('./routes/submissionRoute');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config(); // Muat variabel dari .env
require('./config/passport-setup');
// require('./config/db'); // Hanya untuk menjalankan tes koneksi saat server start

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware

// Middleware CORS
// Konfigurasi agar frontend bisa mengakses backend
const corsOptions = {
    // Izinkan semua sumber atau spesifikkan frontend Anda:
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // Sesuaikan dengan port Live Server Anda
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Izinkan cookie atau header otorisasi
};

app.use(cors(corsOptions)); // <-- BARU: Gunakan middleware CORS
app.use(express.json()); 

// Menggunakan express.json() sebagai pengganti body-parser
app.use(express.json()); 
// Untuk parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true })); 
app.use(passport.initialize());

// Route utama
app.get('/', (req, res) => {
    res.send('Welcome to the Express MySQL CRUD API!');
});

// mengakses file bukti dari browser
app.use('/uploads', express.static('uploads'));

// Gunakan routes user untuk endpoint /api/users
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skp', skpRoutes);
app.use('/api/submissions', submissionRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access API at http://localhost:${PORT}/api/users`);
});