const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Fungsi Autentikasi ---

// 0. Middleware untuk memastikan JWT Secret ada
// if (!process.env.JWT_SECRET) {
//     throw new Error('JWT_SECRET must be defined in .env file');
// }

// REGISTER (Pendaftaran User Baru)
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, Email, and Password are required' });
        }

        // 1. Cek apakah user sudah ada
        const existingUser = await userModel.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        // 2. Hash Kata Sandi
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        const role = 'mahasiswa';

        // 3. Simpan user baru (dengan password ter-hash)
        const newUserId = await userModel.createUser({ name, email, password: hashedPassword, role });

        // 4. Buat JWT
        const token = jwt.sign({ id: newUserId, role: role }, process.env.JWT_SECRET, {
            expiresIn: '1d', // Ganti '1h' jika Anda menggunakan 1 hari
        });

        // 5. Kirim respon
        res.status(201).json({
            message: 'User registered and logged in successfully',
            token: token,
            user: {
                id: newUserId,
                name,
                email,
                role, // <-- BARU: Kirim role ke frontend
            }
        });

    } catch (error) {
        // Cek jika error karena duplikasi email (kode error MySQL 1062)
        if (error.errno === 1062) {
            return res.status(409).json({ message: 'Email already registered' });
        }
        res.status(500).json({ message: 'Error during registration', error: error.message });
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and Password are required' });
        }

        // 1. Cari user berdasarkan email
        const user = await userModel.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        // 2. Bandingkan kata sandi
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        // 3. Buat JWT (hanya menggunakan ID user, JANGAN masukkan password!)
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1d', // Ganti '1h' jika Anda menggunakan 1 hari
        });

        // 4. Kirim respon
        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                nim: user.nim,
                fakultas: user.fakultas,
                program_studi: user.program_studi,
                angkatan: user.angkatan,
                jenjang_pendidikan: user.jenjang_pendidikan, 
                auth_provider: user.auth_provider
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error during login', error: error.message });
    }
};

exports.googleLoginCallback = (req, res) => {
    // Jika Passport (dari passport-setup.js) berhasil, data user akan ada di `req.user`
    if (!req.user) {
        // Ini seharusnya tidak terjadi jika 'failureRedirect' diset, tapi sebagai pengaman
        return res.redirect('http://127.0.0.1:5500/login.html?error=authentication-failed');
    }

    const user = req.user;

    // Buat token JWT untuk user ini (sama seperti login manual)
   const userForFrontend = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        nim: user.nim,
        fakultas: user.fakultas,
        program_studi: user.program_studi,
        angkatan: user.angkatan,
        jenjang_pendidikan: user.jenjang_pendidikan,
        auth_provider: user.auth_provider // <-- Data penting ini sekarang disertakan
    };

    const token = jwt.sign(userForFrontend, process.env.JWT_SECRET, {
        expiresIn: '1d' // Token berlaku 1 hari
    });

    const userJson = encodeURIComponent(JSON.stringify(userForFrontend));;

    // Redirect kembali ke halaman login.html di frontend
    // Frontend akan mendeteksi parameter ini dan menyelesaikan login
    res.redirect(`http://127.0.0.1:5500/login.html?token=${token}&user=${userJson}`);
};

exports.logout = async (req, res) => { // HARUS ASYNC
    // 1. Ambil token dari header
    let token = null;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(400).json({ message: 'No token provided for logout.' });
    }

    try {
        // 2. Dekode token untuk mendapatkan waktu kedaluwarsa (exp)
        // Kita gunakan { ignoreExpiration: true } agar bisa mendecode token yang sudah expired
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });

        // 3. Simpan token utuh (atau JTI) ke dalam daftar hitam (blacklist)
        await userModel.saveRevokedToken(token, decoded.exp);

        // 4. Kirim respon
        res.status(200).json({ message: 'Logout successful, token revoked on server.' });
    } catch (error) {
        // Tangani kasus di mana token tidak valid (bukan sekadar expired)
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token during logout process.' });
        }
        res.status(500).json({ message: 'Error during token revocation.', error: error.message });
    }
};