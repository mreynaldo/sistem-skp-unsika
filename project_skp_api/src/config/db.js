const mysql = require('mysql2/promise'); // Menggunakan versi Promise
require('dotenv').config();

// Membuat connection pool
// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_DATABASE,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

const pool = mysql.createPool(process.env.DATABASE_URL);

// Test koneksi
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully using DATABASE_URL!');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
        if (err.message.includes('ssl')) {
            console.error('Pastikan koneksi SSL dikonfigurasi dengan benar.');
        }
    });

module.exports = pool;