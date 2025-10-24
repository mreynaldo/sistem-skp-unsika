// src/config/passport-setup.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

// Cek apakah variabel .env sudah dimuat
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth Client ID / Secret belum diatur di .env');
}

passport.use(new GoogleStrategy({
    // 1. Ambil kredensial dari file .env
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // 2. Tentukan callback URL (harus SAMA PERSIS dengan yang di Google Console)
    callbackURL: '/api/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
    // 3. Fungsi ini berjalan setelah Google berhasil memverifikasi user
    try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        // 4. Validasi Email Unsika
        const studentEmailRegex = /^\d+@student\.unsika\.ac\.id$/;
        const adminEmail = 'reynaldoau12@gmail.com'; // Sesuaikan jika email admin berbeda

        if (!studentEmailRegex.test(email) && email !== adminEmail) {
            // Jika email tidak valid, gagalkan login.
            // 'done(null, false)' berarti "tidak ada error, tapi user tidak diizinkan"
            return done(null, false, { message: 'Hanya email @student.unsika.ac.id yang diizinkan.' });
        }

        // 5. Cek apakah user sudah ada di database kita
        let user = await userModel.findUserByEmail(email);

        if (!user) {
            // 6. Jika tidak ada, buat user baru (Registrasi via Google)
            console.log(`User baru terdeteksi via Google: ${email}. Membuat user...`);

            // Buat password placeholder acak yang tidak bisa ditebak
            const randomPassword = require('crypto').randomBytes(20).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);
            
            const userData = {
                name: profile.displayName,
                email: profile.emails[0].value,
                password: hashedPassword, // <-- Gunakan password yang sudah di-hash
                role: profile.emails[0].value === 'reynaldoau12@gmail.com' ? 'admin' : 'mahasiswa',
                auth_provider: 'google'
            };
            
            // Panggil fungsi createUser dari userModel.js
            const newUserId = await userModel.createUser(userData);
            user = await userModel.getUserById(newUserId);
        }

        // 7. Jika user ada (atau berhasil dibuat), kirim data user ke langkah selanjutnya
        // 'done(null, user)' berarti "tidak ada error, dan ini data user-nya"
        return done(null, user);

    } catch (error) {
        // 'done(error, null)' berarti "terjadi error, gagalkan proses"
        return done(error, null);
    }
}));