const mysql = require('mysql2/promise'); // Menggunakan versi Promise
require('dotenv').config();

// Membuat connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test koneksi
pool.getConnection()
    .then(connection => {
        console.log('✅ Connected to MySQL database via Pool');
        connection.release(); // Lepaskan koneksi setelah berhasil
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

module.exports = pool;