const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel'); // <-- IMPORT userModel BARU

if (!process.env.JWT_SECRET) {
    // Ini adalah pengecekan yang baik untuk memastikan .env dimuat
    // dan variabel penting tersedia sebelum server berjalan.
    throw new Error('JWT_SECRET must be defined in .env file');
}

// Middleware untuk melindungi rute yang HANYA boleh diakses oleh pengguna yang sudah login
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
             // --- BARU: CEK DAFTAR HITAM (BLACKLIST) ---
            const isRevoked = await userModel.isTokenRevoked(token); 
            if (isRevoked) {
                 return res.status(401).json({ message: 'Not authorized, token has been revoked (logged out).' });
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // req.user akan tersedia di controller selanjutnya (misalnya untuk UPDATE user)
            req.user = decoded; 
            next();

        } catch (error) {
            // Token tidak valid atau kedaluwarsa
            console.error('Token verification error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
         // Tidak ada token
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware BARU: Memblokir rute yang HANYA boleh diakses oleh pengguna yang BELUM login
const isLoggedOut = (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Token terdeteksi di header
        token = req.headers.authorization.split(' ')[1];

        try {
            // Verifikasi token. Jika berhasil, berarti user sudah login.
            jwt.verify(token, process.env.JWT_SECRET);
            
            // Jika token valid, user sudah login, maka kita blokir akses ke rute ini.
            return res.status(403).json({ 
                message: 'You are already logged in. Please log out first to access this route.'
            });

        } catch (error) {
            // Token ada, tetapi tidak valid (misalnya kadaluarsa). 
            // Kita anggap ini sama dengan "belum login" dan membiarkan mereka lanjut (next())
            // untuk mencoba login/register kembali.
            console.log('Expired or invalid token detected for Auth route, proceeding.');
            next();
        }
    } else {
        // Tidak ada token di header, berarti user belum login. Lanjut.
        next();
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        // req.user harusnya sudah di-set oleh middleware 'protect'
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action' });
        }
        next();
    };
};

module.exports = { protect, isLoggedOut, authorize };