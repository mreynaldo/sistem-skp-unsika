const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
    try {
        const users = await userModel.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving users', error: error.message });
    }
};

exports.getUser = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await userModel.getUserById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving user', error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const id = req.params.id;


        if (req.user.id !== parseInt(id)) {
            return res.status(403).json({ message: 'Forbidden: Anda hanya bisa memperbarui profil Anda sendiri' });
        }

        const { name, nim, fakultas, program_studi, angkatan, jenjang_pendidikan } = req.body;

        if (!name || !nim || !fakultas || !program_studi || !angkatan || !jenjang_pendidikan) {
            return res.status(400).json({ message: 'Semua field wajib diisi untuk pembaruan' });
        }

        const affectedRows = await userModel.updateUser(id, req.body);

        if (affectedRows === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan atau tidak ada perubahan dibuat' });
        }

        const updatedUser = await userModel.getUserById(id);

        res.status(200).json({
            message: 'Profil berhasil diperbarui',
            user: updatedUser
        });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const affectedRows = await userModel.deleteUser(id);

        if (affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        // 1. Ambil data user lengkap dari database, termasuk auth_provider
        // Pastikan Anda memiliki fungsi getFullUserById di userModel.js
        const user = await userModel.getFullUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        // 2. HANYA cek password lama jika user adalah 'local' (bukan dari Google)
        if (user.auth_provider === 'local') {
            if (!oldPassword) {
                return res.status(400).json({ message: 'Password lama diperlukan.' });
            }
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Password lama tidak sesuai.' });
            }
        }

        // 3. Validasi password baru
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password baru minimal 6 karakter.' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Password baru dan konfirmasi tidak cocok.' });
        }

        // 4. Hash dan update password baru
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        // Pastikan Anda memiliki fungsi updatePassword di userModel.js
        await userModel.updatePassword(user.id, hashedPassword);

        // 5. Setelah password di-update, tandai user ini sebagai 'local'
        // Ini memastikan lain kali dia HARUS memasukkan password lama
        if (user.auth_provider === 'google') {
            // Pastikan Anda memiliki fungsi updateAuthProvider di userModel.js
            await userModel.updateAuthProvider(user.id, 'local');
        }

        res.json({ message: 'Password berhasil diubah. Silakan login kembali.' });

    } catch (error) {
        console.error("Error di changePassword:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteMyAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password diperlukan untuk konfirmasi penghapusan akun' });
        }

        const user = await userModel.getFullUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password salah. Penghapusan akun dibatalkan.' });
        }

        await userModel.deleteUser(userId);

        res.status(200).json({ message: 'Akun Anda telah berhasil dihapus.' });

    } catch (error) {
        res.status(500).json({ message: 'Error saat menghapus akun', error: error.message });
    }
};