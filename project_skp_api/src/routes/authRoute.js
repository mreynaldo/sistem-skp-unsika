const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, isLoggedOut } = require('../middlewares/authMiddleware'); 
const passport = require('passport');


// --- Rute Autentikasi ---
// POST /auth/register (Membuat user baru dan mendapatkan token)
router.post('/register', isLoggedOut, authController.register);

// POST /auth/login (Login dan mendapatkan token)
router.post('/login', isLoggedOut, authController.login);

// --- Rute Logout yang Dilindungi ---
// Hanya bisa diakses oleh user yang sudah login dan memiliki token valid
router.post('/logout', protect, authController.logout);

// Rute 1: Memulai Proses Login Google
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })
);

// Rute 2: Callback
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: 'https://autoskp.netlify.app/login.html?error=google-auth-failed', // Jika user menolak/gagal
        session: false
    }),
    authController.googleLoginCallback
);

module.exports = router;