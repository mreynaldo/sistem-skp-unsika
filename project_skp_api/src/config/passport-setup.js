// src/config/passport-setup.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

const ADMIN_EMAILS = ['reynaldoau12@gmail.com', 'noname3002910@gmail.com'];

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth Client ID / Secret belum diatur di .env');
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://sistem-skp-unsika-production.up.railway.app/api/auth/google/callback'
},


    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;
            const name = profile.displayName;

            const isAdmin = ADMIN_EMAILS.includes(email);


            const studentEmailRegex = /^\d+@student\.unsika\.ac\.id$/;
            if (!studentEmailRegex.test(email) && !isAdmin) {
                return done(null, false, { message: 'Hanya email @student.unsika.ac.id yang diizinkan.' });
            }

            let user = await userModel.findUserByEmail(email);

            if (!user) {
                console.log(`User baru terdeteksi via Google: ${email}. Membuat user...`);

                const randomPassword = require('crypto').randomBytes(20).toString('hex');
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(randomPassword, salt);

                const userData = {
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    password: hashedPassword, 
                    role: isAdmin ? 'admin' : 'mahasiswa',
                    auth_provider: 'google'
                };

                const newUserId = await userModel.createUser(userData);
                user = await userModel.getUserById(newUserId);
            }

            return done(null, user);

        } catch (error) {
            return done(error, null);
        }
    }));